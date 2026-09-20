/* =========================================================
S222 Throne Rush
Schedule Generator
========================================================= */


/* =========================================================
DOM
========================================================= */

const generatorFortress =
  document.getElementById(
    "generatorFortress"
  );

const generatorGuildCount =
  document.getElementById(
    "generatorGuildCount"
  );

const generatorAttackCount =
  document.getElementById(
    "generatorAttackCount"
  );

const generatorFirstAttack =
  document.getElementById(
    "generatorFirstAttack"
  );

const generatorRangeStart =
  document.getElementById(
    "generatorRangeStart"
  );

const generatorRangeEnd =
  document.getElementById(
    "generatorRangeEnd"
  );

const generatorLag =
  document.getElementById(
    "generatorLag"
  );

const generatorGenerateBtn =
  document.getElementById(
    "generatorGenerateBtn"
  );

const generatorResult =
  document.getElementById(
    "generatorResult"
  );

const generatorGoBtn =
  document.getElementById(
    "generatorGoBtn"
  );


/* =========================================================
State
========================================================= */

let generatedCandidate = null;


/* =========================================================
Constants
========================================================= */

const GENERATOR_LEVELS = [
  "Lv5",
  "Lv6",
  "Lv7"
];

const PLACEHOLDER_GUILD =
  "仮ギルド";


/* =========================================================
Time Helpers
========================================================= */

/*
  Convert HH:MM into minutes.
*/

function generatorTimeToMinutes(
  value
) {

  const [
    hour,
    minute
  ] =
    value
      .split(":")
      .map(Number);

  return (
    hour * 60
    +
    minute
  );

}


/*
  Convert minutes into HH:MM.
*/

function generatorMinutesToTime(
  minutes
) {

  minutes =
    (
      minutes
      %
      1440
      +
      1440
    )
    %
    1440;

  const hour =
    Math.floor(
      minutes / 60
    );

  const minute =
    minutes % 60;

  return (
    String(hour)
      .padStart(2, "0")
    +
    ":"
    +
    String(minute)
      .padStart(2, "0")
  );

}


/*
  Create a UTC Date from
  YYYY-MM-DD + GMT time.
*/

function generatorMakeGMTDate(
  dateString,
  timeString
) {

  return new Date(
    `${dateString}T${timeString}:00Z`
  );

}


/*
  Format Date as YYYY-MM-DD.
*/

function generatorFormatDate(
  date
) {

  return (
    date
      .toISOString()
      .slice(0, 10)
  );

}


/*
  Shuffle array.
*/

function generatorShuffle(
  array
) {

  const result =
    [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random()
        * (i + 1)
      );

    [
      result[i],
      result[j]
    ] =
    [
      result[j],
      result[i]
    ];

  }

  return result;

}


/* =========================================================
Event / Release
========================================================= */

/*
  Event end is treated exactly the same
  way as the existing calendar:
  event.end = UTC boundary.
*/

function generatorGetPeriod(
  fortress
) {

  if (
    !event?.start
    ||
    !event?.end
  ) {

    throw new Error(
      "Event Period is not set."
    );

  }

  const eventStart =
    new Date(
      event.start
    );

  const eventEnd =
    new Date(
      event.end
    );

  if (
    Number.isNaN(
      eventStart.getTime()
    )
    ||
    Number.isNaN(
      eventEnd.getTime()
    )
  ) {

    throw new Error(
      "Event Period is invalid."
    );

  }


  /*
    Use the selected level's
    release time when available.

    Otherwise use Event Start.
  */

  const releaseDates =
    window.s222ReleaseDates
    || {};

  const release =
    releaseDates[
      fortress
    ];

  let start =
    eventStart;

  if (release) {

    const releaseDate =
      new Date(
        release
      );

    if (
      !Number.isNaN(
        releaseDate.getTime()
      )
      &&
      releaseDate > start
    ) {

      start =
        releaseDate;

    }

  }

  if (
    start >= eventEnd
  ) {

    throw new Error(
      `${fortress} release is outside the Event Period.`
    );

  }

  return {
    start,
    end:
      eventEnd
  };

}


/* =========================================================
Attack Start
========================================================= */

/*
  First attack:
  fixed GMT time on the first available day.
*/

function generatorGetFirstStart(
  periodStart,
  firstAttack
) {

  const date =
    generatorFormatDate(
      periodStart
    );

  const result =
    generatorMakeGMTDate(
      date,
      firstAttack
    );

  /*
    If the fixed time is earlier than
    the actual release time, move it
    forward to the release time.

    This avoids creating a schedule
    before the level is available.
  */

  if (
    result < periodStart
  ) {

    return new Date(
      periodStart
    );

  }

  return result;

}


/* =========================================================
Range Check
========================================================= */

/*
  Check whether a time is inside
  the configured later-attack range.

  Normal range:
    02:00 - 12:00

  Crossing midnight:
    22:00 - 02:00
*/

function generatorTimeInRange(
  date,
  rangeStart,
  rangeEnd
) {

  const minute =
    date.getUTCHours() * 60
    +
    date.getUTCMinutes();

  const start =
    generatorTimeToMinutes(
      rangeStart
    );

  const end =
    generatorTimeToMinutes(
      rangeEnd
    );


  if (
    start === end
  ) {

    return true;

  }


  if (
    start < end
  ) {

    return (
      minute >= start
      &&
      minute <= end
    );

  }


  /*
    Range crosses midnight.
  */

  return (
    minute >= start
    ||
    minute <= end
  );

}


/*
  Move a boundary to the nearest
  valid later-attack time.

  Allowed Lag is used here first.
*/

function generatorAdjustBoundary(
  ideal,
  rangeStart,
  rangeEnd,
  lag
) {

  if (
    generatorTimeInRange(
      ideal,
      rangeStart,
      rangeEnd
    )
  ) {

    return new Date(
      ideal
    );

  }


  const candidates = [];

  for (
    let offset = -lag;
    offset <= lag;
    offset++
  ) {

    const candidate =
      new Date(
        ideal.getTime()
        +
        offset
        * 60
        * 1000
      );

    if (
      generatorTimeInRange(
        candidate,
        rangeStart,
        rangeEnd
      )
    ) {

      candidates.push(
        candidate
      );

    }

  }


  if (
    candidates.length === 0
  ) {

    return null;

  }


  candidates.sort(
    (
      a,
      b
    ) =>
      Math.abs(
        a - ideal
      )
      -
      Math.abs(
        b - ideal
      )
  );

  return candidates[0];

}


/* =========================================================
Fortress Safety
========================================================= */

/*
  Same fortress must never overlap.

  Existing schedules are included.
*/

function generatorHasOverlap(
  fortress,
  x,
  y,
  start,
  end,
  generatedSchedules
) {

  const existing =
    Array.isArray(
      schedules
    )
      ? schedules
      : [];


  const all =
    [
      ...existing,
      ...generatedSchedules
    ];


  return all.some(
    schedule => {

      if (
        schedule.fortress
        !==
        fortress
      ) {

        return false;

      }

      if (
        String(
          schedule.x
        )
        !==
        String(x)
        ||
        String(
          schedule.y
        )
        !==
        String(y)
      ) {

        return false;

      }

      const existingStart =
        new Date(
          schedule.start
        );

      const existingEnd =
        new Date(
          schedule.end
        );

      return (
        start < existingEnd
        &&
        end > existingStart
      );

    }
  );

}


/* =========================================================
Candidate Construction
========================================================= */

/*
  The generator treats the available
  fortress time as shared capacity.

  Important:
    - individual occupation lengths
      are NOT optimized
    - only total occupation time
      per virtual guild is evaluated
    - the final boundary is adjusted
      only when necessary
*/

function generatorBuildCandidate(
  settings
) {

  const {
    fortress,
    guildCount,
    attackCount,
    firstAttack,
    rangeStart,
    rangeEnd,
    lag
  } =
    settings;


  const coordinates =
    (
      FORTRESS_COORDINATES[
        fortress
      ]
      || []
    );


  if (
    coordinates.length === 0
  ) {

    throw new Error(
      `No fortress coordinates found for ${fortress}.`
    );

  }


  const period =
    generatorGetPeriod(
      fortress
    );


  const firstStart =
    generatorGetFirstStart(
      period.start,
      firstAttack
    );


  if (
    firstStart >= period.end
  ) {

    throw new Error(
      "First Attack is outside the available period."
    );

  }


  /*
    Total available occupation capacity.

    Example:
      3 fortresses × 30 days
      = 90 fortress-days
  */

  const totalCapacity =
    coordinates.length
    *
    (
      period.end
      -
      firstStart
    );


  const targetPerGuild =
    totalCapacity
    /
    guildCount;


  /*
    Number of generated slots.
  */

  const totalSlots =
    guildCount
    *
    attackCount;


  /*
    Create virtual guild packages.

    These are NOT actual guild names.
    They are only used internally
    to balance total occupation time.
  */

  const packages =
    Array.from(
      {
        length:
          guildCount
      },
      (
        _,
        index
      ) => ({

        index:
          index + 1,

        total:
          0,

        schedules: []

      })
    );


  /*
    Each package gets attackCount
    occupation slots.

    We deliberately do NOT try to
    make every slot equal.

    The last slot absorbs the
    remaining time.
  */

  const baseSlot =
    Math.floor(
      targetPerGuild
      /
      attackCount
    );


  const slotRemainder =
    targetPerGuild
    -
    (
      baseSlot
      *
      attackCount
    );


  packages.forEach(
    pack => {

      for (
        let i = 0;
        i < attackCount;
        i++
      ) {

        let desired =
          baseSlot;

        if (
          i === attackCount - 1
        ) {

          desired +=
            slotRemainder;

        }

        pack.schedules.push({

          duration:
            desired,

          start:
            null,

          end:
            null,

          fortress:
            null

        });

      }

    }
  );


  /*
    Fortress timelines.
  */

  const timelines =
    generatorShuffle(
      coordinates
    ).map(
      coordinate => ({

        coordinate,

        available:
          new Date(
            firstStart
          ),

        schedules: []

      })
    );


  /*
    Build one global list of slots.

    Larger desired slots are placed first.
    This helps reduce fragmentation.
  */

  const jobs = [];

  packages.forEach(
    pack => {

      pack.schedules.forEach(
        (
          slot,
          slotIndex
        ) => {

          jobs.push({

            packageIndex:
              pack.index,

            slotIndex,

            duration:
              slot.duration

          });

        }
      );

    }
  );


  jobs.sort(
    (
      a,
      b
    ) =>
      b.duration
      -
      a.duration
  );


  /*
    Place jobs on the earliest available
    fortress.

    This is a simple capacity scheduler.
    It deliberately avoids trying to
    predict the exact real-world delay.
  */

  jobs.forEach(
    job => {

      let selected =
        null;


      timelines.forEach(
        timeline => {

          if (
            !selected
            ||
            timeline.available
            <
            selected.available
          ) {

            selected =
              timeline;

          }

        }
      );


      const start =
        new Date(
          selected.available
        );

      let end =
        new Date(
          start.getTime()
          +
          job.duration
        );


      /*
        Keep inside event period.
      */

      if (
        end > period.end
      ) {

        end =
          new Date(
            period.end
          );

      }


      /*
        Later attacks must use the
        configured attack-time range.

        The first attack is exempt because
        it has its own fixed input.
      */

      if (
        job.slotIndex > 0
      ) {

        const adjusted =
          generatorAdjustBoundary(
            start,
            rangeStart,
            rangeEnd,
            lag
          );

        if (
          adjusted
        ) {

          /*
            Only move forward if possible.
          */

          if (
            adjusted >= start
          ) {

            const delta =
              adjusted - start;

            end =
              new Date(
                end.getTime()
                +
                delta
              );

            if (
              end <= period.end
            ) {

              selected.available =
                adjusted;

            }

          }

        }

      }


      /*
        If the resulting slot has no time,
        leave it unassigned.
      */

      if (
        end <= start
      ) {

        return;

      }


      /*
        Hard safety check.
      */

      if (
        generatorHasOverlap(
          fortress,
          selected.coordinate.x,
          selected.coordinate.y,
          start,
          end,
          []
        )
      ) {

        return;

      }


      const packageData =
        packages[
          job.packageIndex - 1
        ];

      const slotData =
        packageData.schedules[
          job.slotIndex
        ];


      slotData.start =
        start;

      slotData.end =
        end;

      slotData.fortress =
        fortress;

      slotData.x =
        selected.coordinate.x;

      slotData.y =
        selected.coordinate.y;


      packageData.total +=
        (
          end - start
        );


      selected.schedules.push({
        start,
        end
      });


      selected.available =
        new Date(
          end
        );

    }
  );


  /*
    Validate every package.
  */

  const validPackages =
    packages.filter(
      pack =>
        pack.schedules.every(
          slot =>
            slot.start
            &&
            slot.end
        )
    );


  if (
    validPackages.length
    !==
    guildCount
  ) {

    throw new Error(
      "No valid schedule could be generated with the current conditions."
    );

  }


  /*
    Evaluate total occupation imbalance.

    THIS is the important part.

    We do not evaluate the individual
    slot durations.
  */

  const totals =
    packages.map(
      pack =>
        pack.total
    );


  const maxTotal =
    Math.max(
      ...totals
    );

  const minTotal =
    Math.min(
      ...totals
    );

  const imbalance =
    maxTotal
    -
    minTotal;


  /*
    Flatten schedules.
  */

  const generatedSchedules =
    [];


  packages.forEach(
    pack => {

      pack.schedules.forEach(
        (
          slot,
          slotIndex
        ) => {

          generatedSchedules.push({

            package:
              pack.index,

            attack:
              slotIndex + 1,

            fortress,

            x:
              slot.x,

            y:
              slot.y,

            start:
              slot.start,

            end:
              slot.end

          });

        }
      );

    }
  );


  return {

    fortress,

    guildCount,

    attackCount,

    firstAttack,

    rangeStart,

    rangeEnd,

    lag,

    periodStart:
      firstStart,

    periodEnd:
      period.end,

    targetPerGuild,

    totals,

    imbalance,

    packages,

    schedules:
      generatedSchedules

  };

}


/* =========================================================
Display
========================================================= */

function generatorFormatDateTime(
  date
) {

  const dateText =
    generatorFormatDate(
      date
    );

  const timeText =
    generatorMinutesToTime(
      date.getUTCHours() * 60
      +
      date.getUTCMinutes()
    );

  return (
    `${dateText} ${timeText} GMT`
  );

}


function generatorFormatDays(
  milliseconds
) {

  return (
    Math.round(
      (
        milliseconds
        /
        86400000
      )
      * 10
    )
    /
    10
  );

}


function generatorBuildResultText(
  candidate
) {

  const lines = [];


  lines.push(
    "Generated Candidate"
  );

  lines.push(
    ""
  );

  lines.push(
    `Fortress: ${candidate.fortress}`
  );

  lines.push(
    `Guild Count: ${candidate.guildCount}`
  );

  lines.push(
    `Attack Count: ${candidate.attackCount}`
  );

  lines.push(
    `First Attack: GMT ${candidate.firstAttack}`
  );

  lines.push(
    `Attack Range: GMT ${candidate.rangeStart} - ${candidate.rangeEnd}`
  );

  lines.push(
    `Allowed Lag: ±${candidate.lag} min`
  );

  lines.push(
    ""
  );

  lines.push(
    "Target Total Occupation"
  );

  lines.push(
    `${generatorFormatDays(candidate.targetPerGuild)} days / guild`
  );

  lines.push(
    `Difference: ${generatorFormatDays(candidate.imbalance)} days`
  );

  lines.push(
    ""
  );

  candidate.packages.forEach(
    pack => {

      lines.push(
        `Slot Group ${pack.index}`
      );

      pack.schedules.forEach(
        (
          slot,
          index
        ) => {

          lines.push(
            `  ${index + 1}. ${slot.fortress} `
            +
            `${slot.start ? generatorFormatDateTime(slot.start) : "—"}`
            +
            ` → `
            +
            `${slot.end ? generatorFormatDateTime(slot.end) : "—"}`
          );

        }
      );

      lines.push(
        `  Total: ${generatorFormatDays(pack.total)} days`
      );

      lines.push(
        ""
      );

    }
  );


  lines.push(
    "All imported schedules use: 仮ギルド"
  );


  return lines.join(
    "\n"
  );

}


/* =========================================================
Generate
========================================================= */

generatorGenerateBtn.addEventListener(
  "click",
  () => {

    generatorResult.textContent =
      "";

    generatorGoBtn.disabled =
      true;

    generatedCandidate =
      null;


    const fortress =
      generatorFortress.value;

    const guildCount =
      Number(
        generatorGuildCount.value
      );

    const attackCount =
      Number(
        generatorAttackCount.value
      );

    const firstAttack =
      generatorFirstAttack.value;

    const rangeStart =
      generatorRangeStart.value;

    const rangeEnd =
      generatorRangeEnd.value;

    const lag =
      Number(
        generatorLag.value
      );


    if (
      !GENERATOR_LEVELS.includes(
        fortress
      )
    ) {

      generatorResult.textContent =
        "Please select Lv5, Lv6 or Lv7.";

      return;

    }


    if (
      !Number.isInteger(
        guildCount
      )
      ||
      guildCount < 1
    ) {

      generatorResult.textContent =
        "Please enter a valid Guild Count.";

      return;

    }


    if (
      !Number.isInteger(
        attackCount
      )
      ||
      attackCount < 1
    ) {

      generatorResult.textContent =
        "Please enter a valid Attack Count.";

      return;

    }


    if (
      !firstAttack
    ) {

      generatorResult.textContent =
        "Please enter the First Attack time.";

      return;

    }


    if (
      !rangeStart
      ||
      !rangeEnd
    ) {

      generatorResult.textContent =
        "Please enter the Attack Time Range.";

      return;

    }


    if (
      lag < 0
      ||
      !Number.isInteger(
        lag
      )
    ) {

      generatorResult.textContent =
        "Allowed Lag must be a whole number of minutes.";

      return;

    }


    try {

      generatedCandidate =
        generatorBuildCandidate({

          fortress,

          guildCount,

          attackCount,

          firstAttack,

          rangeStart,

          rangeEnd,

          lag

        });


      generatorResult.textContent =
        generatorBuildResultText(
          generatedCandidate
        );


      generatorGoBtn.disabled =
        false;

    }

    catch (
      error
    ) {

      console.error(
        "Generator error:",
        error
      );

      generatorResult.textContent =
        error.message
        ||
        "No valid schedule could be generated.";

    }

  }
);


/* =========================================================
GO
========================================================= */

generatorGoBtn.addEventListener(
  "click",
  async () => {

    if (
      !generatedCandidate
    ) {

      return;

    }


    generatorGoBtn.disabled =
      true;


    try {

      /*
        Final hard safety check.

        Check the complete candidate against
        current calendar schedules.
      */

      const conflict =
        generatedCandidate.schedules.some(
          generated => {

            return generatorHasOverlap(
              generatedCandidate.fortress,
              generated.x,
              generated.y,
              generated.start,
              generated.end,
              generatedCandidate.schedules.filter(
                other =>
                  other !== generated
                  &&
                  other.x === generated.x
                  &&
                  other.y === generated.y
              )
            );

          }
        );


      if (
        conflict
      ) {

        throw new Error(
          "The generated candidate contains an overlapping fortress schedule."
        );

      }


      /*
        Import all schedules as 仮ギルド.
      */

      for (
        const generated
        of
        generatedCandidate.schedules
      ) {

        const schedule = {

          id:
            crypto.randomUUID(),

          league:
            "",

          fortress:
            generated.fortress,

          x:
            generated.x,

          y:
            generated.y,

          guild:
            PLACEHOLDER_GUILD,

          start:
            generated.start.toISOString(),

          end:
            generated.end.toISOString(),

          description:
            "Generated schedule",

          color:
            "#888888",

          creatorId

        };


        await insertSchedule(
          schedule
        );

      }


      await loadSchedules();


      generatorResult.textContent =
        generatorBuildResultText(
          generatedCandidate
        )
        +
        "\n\n"
        +
        "Imported to Calendar as 仮ギルド.";


      generatorGoBtn.disabled =
        true;


    }

    catch (
      error
    ) {

      console.error(
        "Generator import error:",
        error
      );

      generatorResult.textContent +=
        "\n\n"
        +
        (
          error.message
          ||
          "Failed to import candidate."
        );

      generatorGoBtn.disabled =
        false;

    }

  }
);
