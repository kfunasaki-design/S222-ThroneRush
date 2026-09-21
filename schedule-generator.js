/* =========================================================
S222 Throne Rush
Schedule Generator
========================================================= */


/* =========================================================
Elements
========================================================= */

const generatorFortress =
  document.getElementById("generatorFortress");

const generatorGuildCount =
  document.getElementById("generatorGuildCount");

const generatorAttackCount =
  document.getElementById("generatorAttackCount");

const generatorFirstAttack =
  document.getElementById("generatorFirstAttack");

const generatorRangeStart =
  document.getElementById("generatorRangeStart");

const generatorRangeEnd =
  document.getElementById("generatorRangeEnd");

const generatorLag =
  document.getElementById("generatorLag");

const generatorGenerateBtn =
  document.getElementById("generatorGenerateBtn");

const generatorRestartBtn =
  document.getElementById("generatorRestartBtn");

const generatorResult =
  document.getElementById("generatorResult");

const generatorGoBtn =
  document.getElementById("generatorGoBtn");


/* =========================================================
Admin Panel View
========================================================= */

const adminSettingsTab =
  document.getElementById("adminSettingsTab");

const adminGeneratorTab =
  document.getElementById("adminGeneratorTab");

const adminSettingsView =
  document.getElementById("adminSettingsView");

const adminGeneratorView =
  document.getElementById("adminGeneratorView");


const ADMIN_PANEL_VIEW_KEY =
  "s222_admin_panel_view";


let generatedCandidate = null;

let lastGeneratedSignature = null;

const GENERATOR_TIME_STEP = 30;

const GENERATOR_CANDIDATE_POOL_SIZE = 20;
/* =========================================================
Generator Defaults
========================================================= */

const GENERATOR_DEFAULTS = {
  fortress: "Lv6",
  guildCount: "4",
  attackCount: "2",
  firstAttack: "12:00",
  rangeStart: "08:00",
  rangeEnd: "15:00",
  lag: "60"
};


/* =========================================================
Admin Panel View Switch
========================================================= */

function initAdminPanelViewSwitch() {

  if (
    !adminSettingsTab ||
    !adminGeneratorTab ||
    !adminSettingsView ||
    !adminGeneratorView
  ) {
    return;
  }


  function showAdminPanelView(
    view
  ) {

    const isGenerator =
      view === "generator";


    adminSettingsView.hidden =
      isGenerator;

    adminGeneratorView.hidden =
      !isGenerator;


    adminSettingsTab.classList.toggle(
      "active",
      !isGenerator
    );

    adminGeneratorTab.classList.toggle(
      "active",
      isGenerator
    );


    localStorage.setItem(
      ADMIN_PANEL_VIEW_KEY,
      isGenerator
        ? "generator"
        : "settings"
    );
  }


  adminSettingsTab.addEventListener(
    "click",
    () => {
      showAdminPanelView(
        "settings"
      );
    }
  );


  adminGeneratorTab.addEventListener(
    "click",
    () => {
      showAdminPanelView(
        "generator"
      );
    }
  );


  const savedView =
    localStorage.getItem(
      ADMIN_PANEL_VIEW_KEY
    );


  showAdminPanelView(
    savedView === "generator"
      ? "generator"
      : "settings"
  );
}


/*
 * calendar.htmlはscriptをbody末尾で読み込むため、
 * DOMは既に存在している。
 */
initAdminPanelViewSwitch();


/* =========================================================
Generator Reset
========================================================= */

function generatorReset() {

  if (generatorFortress) {
    generatorFortress.value =
      GENERATOR_DEFAULTS.fortress;
  }

  if (generatorGuildCount) {
    generatorGuildCount.value =
      GENERATOR_DEFAULTS.guildCount;
  }

  if (generatorAttackCount) {
    generatorAttackCount.value =
      GENERATOR_DEFAULTS.attackCount;
  }

  if (generatorFirstAttack) {
    generatorFirstAttack.value =
      GENERATOR_DEFAULTS.firstAttack;
  }

  if (generatorRangeStart) {
    generatorRangeStart.value =
      GENERATOR_DEFAULTS.rangeStart;
  }

  if (generatorRangeEnd) {
    generatorRangeEnd.value =
      GENERATOR_DEFAULTS.rangeEnd;
  }

  if (generatorLag) {
    generatorLag.value =
      GENERATOR_DEFAULTS.lag;
  }

  if (generatorResult) {
    generatorResult.value = "";
  }

  generatedCandidate = null;

  if (generatorGoBtn) {
    generatorGoBtn.disabled = true;
  }
}


/* =========================================================
Basic Utilities
========================================================= */

function generatorParseTime(value) {
  const [hour, minute] =
    value.split(":").map(Number);

  return hour * 60 + minute;
}


function generatorFormatDateTime(date) {
  const y = date.getUTCFullYear();
  const m = String(
    date.getUTCMonth() + 1
  ).padStart(2, "0");
  const d = String(
    date.getUTCDate()
  ).padStart(2, "0");
  const h = String(
    date.getUTCHours()
  ).padStart(2, "0");
  const min = String(
    date.getUTCMinutes()
  ).padStart(2, "0");

  return `${y}-${m}-${d}T${h}:${min}:00+00:00`;
}


function generatorFormatDisplay(date) {
  const m = String(
    date.getUTCMonth() + 1
  ).padStart(2, "0");

  const d = String(
    date.getUTCDate()
  ).padStart(2, "0");

  const h = String(
    date.getUTCHours()
  ).padStart(2, "0");

  const min = String(
    date.getUTCMinutes()
  ).padStart(2, "0");

  return `${m}/${d} ${h}:${min}`;
}


function generatorMinutesBetween(
  start,
  end
) {
  return Math.round(
    (end.getTime() - start.getTime()) /
    60000
  );
}


function generatorCloneDate(date) {
  return new Date(date.getTime());
}


function generatorMinutesToText(minutes) {
  const days =
    Math.floor(minutes / 1440);

  const hours =
    Math.floor(
      (minutes % 1440) / 60
    );

  const mins =
    minutes % 60;

  const parts = [];

  if (days) {
    parts.push(`${days}d`);
  }

  if (hours) {
    parts.push(`${hours}h`);
  }

  if (mins) {
    parts.push(`${mins}m`);
  }

  return parts.length
    ? parts.join(" ")
    : "0m";
}


/* =========================================================
Event / Release
========================================================= */

function generatorGetEventPeriod() {
  if (
    typeof event !== "undefined" &&
    event &&
    event.start &&
    event.end
  ) {
    return {
      start: new Date(event.start),
      end: new Date(event.end)
    };
  }

  return null;
}


function generatorGetReleaseDate(level) {
  if (
    typeof window.s222ReleaseDates !==
    "undefined" &&
    window.s222ReleaseDates
  ) {
    const value =
      window.s222ReleaseDates[level];

    if (value) {
      return new Date(value);
    }
  }

  return null;
}


function generatorGetStartDate(
  level,
  eventStart
) {
  const release =
    generatorGetReleaseDate(level);

  if (
    release &&
    !Number.isNaN(
      release.getTime()
    ) &&
    release > eventStart
  ) {
    return release;
  }

  return generatorCloneDate(
    eventStart
  );
}


/* =========================================================
Fortress
========================================================= */

function generatorGetFortresses(level) {
  if (
    typeof FORTRESS_COORDINATES ===
      "undefined" ||
    !FORTRESS_COORDINATES[level]
  ) {
    return [];
  }

  return FORTRESS_COORDINATES[
    level
  ].map(fortress => ({
    level,
    label: fortress.label,
    x: fortress.x,
    y: fortress.y
  }));
}


/* =========================================================
Attack Range
========================================================= */

function generatorIsTimeInRange(
  minutes,
  rangeStart,
  rangeEnd,
  lag
) {
  const start =
    generatorParseTime(rangeStart);

  const end =
    generatorParseTime(rangeEnd);

  const expandedStart =
    start - lag;

  const expandedEnd =
    end + lag;

  /*
   * 通常範囲
   */
  if (start < end) {
    return (
      minutes >= expandedStart &&
      minutes <= expandedEnd
    );
  }

  /*
   * 日跨ぎ
   */
  return (
    minutes >= expandedStart ||
    minutes <= expandedEnd
  );
}


function generatorIsAllowedStart(
  date,
  rangeStart,
  rangeEnd,
  lag
) {
  const minutes =
    date.getUTCHours() * 60 +
    date.getUTCMinutes();

  return generatorIsTimeInRange(
    minutes,
    rangeStart,
    rangeEnd,
    lag
  );
}


function generatorRoundToStep(
  date
) {
  const result =
    generatorCloneDate(date);

  const minutes =
    result.getUTCMinutes();

  const rounded =
    Math.round(
      minutes /
      GENERATOR_TIME_STEP
    ) * GENERATOR_TIME_STEP;

  result.setUTCMinutes(
    rounded,
    0,
    0
  );

  return result;
}


function generatorSnapBoundary(
  ideal,
  rangeStart,
  rangeEnd,
  lag
) {
  const candidates = [];

  const startMinutes =
    generatorParseTime(
      rangeStart
    );

  const endMinutes =
    generatorParseTime(rangeEnd);

  for (
    let dayOffset = -1;
    dayOffset <= 2;
    dayOffset++
  ) {
    for (
      const minutes of [
        startMinutes,
        endMinutes
      ]
    ) {
      const candidate =
        generatorCloneDate(
          ideal
        );

      candidate.setUTCDate(
        candidate.getUTCDate() +
        dayOffset
      );

      candidate.setUTCHours(
        Math.floor(
          minutes / 60
        ),
        minutes % 60,
        0,
        0
      );

      if (
        candidate > ideal &&
        generatorIsAllowedStart(
          candidate,
          rangeStart,
          rangeEnd,
          lag
        )
      ) {
        candidates.push(candidate);
      }
    }
  }

  if (
    generatorIsAllowedStart(
      ideal,
      rangeStart,
      rangeEnd,
      lag
    )
  ) {
    return generatorRoundToStep(
      ideal
    );
  }

  if (!candidates.length) {
    return null;
  }

  candidates.sort(
    (a, b) =>
      Math.abs(
        a.getTime() -
        ideal.getTime()
      ) -
      Math.abs(
        b.getTime() -
        ideal.getTime()
      )
  );

  return generatorRoundToStep(
    candidates[0]
  );
}


/* =========================================================
Fortress Slot Patterns
========================================================= */

function generatorBuildCompositions(
  total,
  count
) {
  const result = [];

  function build(
    remaining,
    depth,
    current
  ) {
    if (
      depth === count - 1
    ) {
      if (remaining >= 1) {
        result.push([
          ...current,
          remaining
        ]);
      }

      return;
    }

    for (
      let value = 1;
      value <=
      remaining -
        (count - depth - 1);
      value++
    ) {
      build(
        remaining - value,
        depth + 1,
        [
          ...current,
          value
        ]
      );
    }
  }

  build(
    total,
    0,
    []
  );

  return result;
}


function generatorSplitFortress(
  fortress,
  start,
  end,
  slotCount,
  rangeStart,
  rangeEnd,
  lag
) {
  const totalMinutes =
    generatorMinutesBetween(
      start,
      end
    );

  if (
    totalMinutes <=
    slotCount
  ) {
    return null;
  }

  const boundaries = [];

  for (
    let i = 1;
    i < slotCount;
    i++
  ) {
    const ideal =
      new Date(
        start.getTime() +
        (
          totalMinutes *
          i /
          slotCount
        ) *
          60000
      );

    const boundary =
      generatorSnapBoundary(
        ideal,
        rangeStart,
        rangeEnd,
        lag
      );

    if (!boundary) {
      return null;
    }

    boundaries.push(
      boundary
    );
  }

  for (
    let i = 0;
    i < boundaries.length;
    i++
  ) {
    const previous =
      i === 0
        ? start
        : boundaries[i - 1];

    if (
      boundaries[i] <=
      previous ||
      boundaries[i] >= end
    ) {
      return null;
    }
  }

  const slots = [];

  let cursor =
    generatorCloneDate(
      start
    );

  for (
    const boundary of boundaries
  ) {
    slots.push({
      fortress,
      start:
        generatorCloneDate(
          cursor
        ),
      end:
        generatorCloneDate(
          boundary
        )
    });

    cursor =
      generatorCloneDate(
        boundary
      );
  }

  slots.push({
    fortress,
    start:
      generatorCloneDate(
        cursor
      ),
    end:
      generatorCloneDate(
        end
      )
  });

  return slots;
}


/* =========================================================
Guild Assignment Search
========================================================= */

function generatorFindBestAssignment(
  slots,
  guildCount,
  attackCount
) {
  const guilds =
    Array.from(
      {
        length:
          guildCount
      },
      (_, index) => ({
        index,
        slots: [],
        totalMinutes: 0
      })
    );

  let best = null;

  const orderedSlots =
    [...slots].sort(
      (a, b) =>
        generatorMinutesBetween(
          b.start,
          b.end
        ) -
        generatorMinutesBetween(
          a.start,
          a.end
        )
    );

  function search(
    slotIndex
  ) {
    if (
      slotIndex >=
      orderedSlots.length
    ) {
      if (
        guilds.some(
          guild =>
            guild.slots.length !==
            attackCount
        )
      ) {
        return;
      }

      const totals =
        guilds.map(
          guild =>
            guild.totalMinutes
        );

      const max =
        Math.max(...totals);

      const min =
        Math.min(...totals);

      const difference =
        max - min;

      if (
        !best ||
        difference <
          best.difference
      ) {
        best = {
          difference,
          guilds:
            guilds.map(
              guild => ({
                index:
                  guild.index,
                slots:
                  [...guild.slots],
                totalMinutes:
                  guild.totalMinutes
              })
            )
        };
      }

      return;
    }

    const slot =
      orderedSlots[
        slotIndex
      ];

    const minutes =
      generatorMinutesBetween(
        slot.start,
        slot.end
      );

    const usedSignatures =
      new Set();

    for (
      const guild of guilds
    ) {
      if (
        guild.slots.length >=
        attackCount
      ) {
        continue;
      }

      const signature =
        `${guild.slots.length}:${
          guild.totalMinutes
        }`;

      if (
        usedSignatures.has(
          signature
        )
      ) {
        continue;
      }

      usedSignatures.add(
        signature
      );

      guild.slots.push(
        slot
      );

      guild.totalMinutes +=
        minutes;

      search(
        slotIndex + 1
      );

      guild.totalMinutes -=
        minutes;

      guild.slots.pop();
    }
  }

  search(0);

  return best;
}


/* =========================================================
Boundary Optimization
========================================================= */

function generatorOptimizeBoundaries(
  slots,
  assignment,
  rangeStart,
  rangeEnd,
  lag,
  eventEnd
) {
  const result =
    slots.map(slot => ({
      fortress:
        slot.fortress,

      start:
        generatorCloneDate(
          slot.start
        ),

      end:
        generatorCloneDate(
          slot.end
        ),

      guildIndex:
        slot.guildIndex
    }));

  const fortressLabels =
    [
      ...new Set(
        result.map(
          slot =>
            slot.fortress.label
        )
      )
    ];

  for (
    let pass = 0;
    pass < 20;
    pass++
  ) {
    let changed = false;

    for (
      const label of fortressLabels
    ) {
      const fortressSlots =
        result
          .filter(
            slot =>
              slot.fortress.label ===
              label
          )
          .sort(
            (a, b) =>
              a.start - b.start
          );

      for (
        let i = 0;
        i <
        fortressSlots.length - 1;
        i++
      ) {
        const left =
          fortressSlots[i];

        const right =
          fortressSlots[i + 1];

        if (
          left.guildIndex ===
          right.guildIndex
        ) {
          continue;
        }

        const totals =
          assignment.map(
            guild =>
              guild.totalMinutes
          );

        const leftTotal =
          totals[
            left.guildIndex
          ];

        const rightTotal =
          totals[
            right.guildIndex
          ];

        let delta =
          (
            rightTotal -
            leftTotal
          ) / 2;

        delta =
          Math.round(
            delta /
            GENERATOR_TIME_STEP
          ) *
          GENERATOR_TIME_STEP;

        if (delta === 0) {
          continue;
        }

        const current =
          left.end.getTime();

        const previousBoundary =
          left.start.getTime();

        const nextBoundary =
          right.end.getTime();

        let target =
          current +
          delta * 60000;

        const minTime =
          previousBoundary +
          GENERATOR_TIME_STEP *
            60000;

        const maxTime =
          nextBoundary -
          GENERATOR_TIME_STEP *
            60000;

        target =
          Math.max(
            minTime,
            Math.min(
              maxTime,
              target
            )
          );

        const candidate =
          new Date(target);

        if (
          candidate >=
          eventEnd
        ) {
          continue;
        }

        if (
          !generatorIsAllowedStart(
            candidate,
            rangeStart,
            rangeEnd,
            lag
          )
        ) {
          continue;
        }

        if (
          candidate <=
          left.start ||
          candidate >=
          right.end
        ) {
          continue;
        }

        const actualDelta =
          generatorMinutesBetween(
            left.end,
            candidate
          );

        if (
          actualDelta === 0
        ) {
          continue;
        }

        left.end =
          generatorCloneDate(
            candidate
          );

        right.start =
          generatorCloneDate(
            candidate
          );

        assignment[
          left.guildIndex
        ].totalMinutes +=
          actualDelta;

        assignment[
          right.guildIndex
        ].totalMinutes -=
          actualDelta;

        changed = true;
      }
    }

    if (!changed) {
      break;
    }
  }

  return result;
}


/* =========================================================
Evaluate Candidate
========================================================= */

function generatorEvaluate(
  slots,
  guildCount,
  attackCount,
  rangeStart,
  rangeEnd,
  lag,
  eventEnd
) {
  const assignment =
    generatorFindBestAssignment(
      slots,
      guildCount,
      attackCount
    );

  if (!assignment) {
    return null;
  }

  const optimizedSlots =
    generatorOptimizeBoundaries(
      slots,
      assignment.guilds,
      rangeStart,
      rangeEnd,
      lag,
      eventEnd
    );

  const finalAssignment =
    generatorFindBestAssignment(
      optimizedSlots,
      guildCount,
      attackCount
    );

  if (!finalAssignment) {
    return null;
  }

  const totals =
    finalAssignment.guilds.map(
      guild =>
        guild.totalMinutes
    );

  const max =
    Math.max(...totals);

  const min =
    Math.min(...totals);

  return {
    slots: optimizedSlots,
    guilds:
      finalAssignment.guilds,
    difference:
      max - min
  };
}


/* =========================================================
Generate Candidate
========================================================= */

function generatorGenerateCandidate() {
  const fortressLevel =
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

  /*
   * Basic validation
   */
  if (!fortressLevel) {
    throw new Error(
      "Please select a Fortress Level."
    );
  }

  if (
    !Number.isInteger(
      guildCount
    ) ||
    guildCount < 1
  ) {
    throw new Error(
      "Please enter a valid Guild Count."
    );
  }

  if (
    !Number.isInteger(
      attackCount
    ) ||
    attackCount < 1
  ) {
    throw new Error(
      "Please enter a valid Attack Count."
    );
  }

  if (!firstAttack) {
    throw new Error(
      "Please enter the First Attack time."
    );
  }

  if (
    !rangeStart ||
    !rangeEnd
  ) {
    throw new Error(
      "Please enter the Attack Time Range."
    );
  }

  if (
    !Number.isInteger(lag) ||
    lag < 0
  ) {
    throw new Error(
      "Allowed Lag cannot be negative."
    );
  }

  /*
   * Event Period
   */
  const period =
    generatorGetEventPeriod();

  if (!period) {
    throw new Error(
      "Event Period is not available."
    );
  }

  if (
    Number.isNaN(
      period.start.getTime()
    ) ||
    Number.isNaN(
      period.end.getTime()
    ) ||
    period.start >= period.end
  ) {
    throw new Error(
      "Event Period is invalid."
    );
  }

  /*
   * Fortress release
   */
  const releaseStart =
    generatorGetStartDate(
      fortressLevel,
      period.start
    );

  if (
    releaseStart >=
    period.end
  ) {
    throw new Error(
      "Fortress Release is after the Event Period."
    );
  }

  /*
   * First Attack
   */
  const firstMinutes =
    generatorParseTime(
      firstAttack
    );

  const actualStart =
    generatorCloneDate(
      releaseStart
    );

  actualStart.setUTCHours(
    Math.floor(
      firstMinutes / 60
    ),
    firstMinutes % 60,
    0,
    0
  );

  /*
   * Release時刻より前なら翌日。
   */
  if (
    actualStart <
    releaseStart
  ) {
    actualStart.setUTCDate(
      actualStart.getUTCDate() + 1
    );
  }

  if (
    actualStart <
    period.start
  ) {
    actualStart.setTime(
      period.start.getTime()
    );
  }

  if (
    actualStart >=
    period.end
  ) {
    throw new Error(
      "First Attack is outside the Event Period."
    );
  }

  /*
   * Fortress
   */
  const fortresses =
    generatorGetFortresses(
      fortressLevel
    );

  if (!fortresses.length) {
    throw new Error(
      `No fortress data found for ${fortressLevel}.`
    );
  }

  /*
   * 必要slot数
   */
  const totalSlots =
    guildCount *
    attackCount;

  /*
   * 砦へのslot配分パターンを全部試す。
   */
  const compositions =
    generatorBuildCompositions(
      totalSlots,
      fortresses.length
    );

let bestCandidate = null;
const candidatePool = [];

  /*
   * 各分割パターンを探索。
   */
  for (
    const composition of
      compositions
  ) {
    const slots = [];

    let valid = true;

    for (
      let i = 0;
      i < fortresses.length;
      i++
    ) {
      const fortressSlots =
        generatorSplitFortress(
          fortresses[i],
          actualStart,
          period.end,
          composition[i],
          rangeStart,
          rangeEnd,
          lag
        );

      if (!fortressSlots) {
        valid = false;
        break;
      }

      slots.push(
        ...fortressSlots
      );
    }

    if (!valid) {
      continue;
    }

    if (
      slots.length !==
      totalSlots
    ) {
      continue;
    }

    const evaluated =
      generatorEvaluate(
        slots,
        guildCount,
        attackCount,
        rangeStart,
        rangeEnd,
        lag,
        period.end
      );

    if (!evaluated) {
      continue;
    }

/*
 * 候補プールへ追加。
 *
 * 完全な最適解だけでなく、
 * 実用上十分に良い候補を複数保持する。
 */
candidatePool.push(
  evaluated
);

/*
 * 差の小さい順に並べる。
 */
candidatePool.sort(
  (a, b) =>
    a.difference -
    b.difference
);

/*
 * 上位候補だけ保持。
 */
if (
  candidatePool.length >
  GENERATOR_CANDIDATE_POOL_SIZE
) {
  candidatePool.length =
    GENERATOR_CANDIDATE_POOL_SIZE;
}
  }
/*
 * 候補プールからランダムに選ぶ。
 *
 * 最良候補だけではなく、
 * 上位候補の中から選ぶことで
 * 同じ条件でも結果に変化を持たせる。
 */
if (candidatePool.length) {

  /*
   * 最良候補を基準に、
   * 上位候補から選択。
   */
  const selectableCandidates =
    candidatePool.filter(
      candidate =>
        candidate.difference <=
        candidatePool[0].difference +
        Math.max(
          GENERATOR_TIME_STEP * 2,
          60
        )
    );

  /*
   * 直前と同じ候補を避ける。
   */
  const differentCandidates =
    selectableCandidates.filter(
      candidate =>
        generatorCreateCandidateSignature(
          candidate
        ) !==
        lastGeneratedSignature
    );

  const pool =
    differentCandidates.length
      ? differentCandidates
      : selectableCandidates;

  bestCandidate =
    pool[
      Math.floor(
        Math.random() *
        pool.length
      )
    ];

  lastGeneratedSignature =
    generatorCreateCandidateSignature(
      bestCandidate
    );
}
  if (!bestCandidate) {
    throw new Error(
      "No valid schedule could be generated with the current conditions."
    );
  }

  /*
   * 最終安全チェック
   */
  for (
    const slot of
      bestCandidate.slots
  ) {
    if (
      slot.start <
        actualStart ||
      slot.end >
        period.end ||
      slot.start >=
        slot.end
    ) {
      throw new Error(
        "Generated schedule exceeds the Event Period."
      );
    }
  }

  /*
   * 同一砦の重複チェック
   */
  for (
    const fortress of fortresses
  ) {
    const fortressSlots =
      bestCandidate.slots
        .filter(
          slot =>
            slot.fortress.label ===
            fortress.label
        )
        .sort(
          (a, b) =>
            a.start - b.start
        );

    for (
      let i = 1;
      i <
      fortressSlots.length;
      i++
    ) {
      if (
        fortressSlots[i].start <
        fortressSlots[i - 1].end
      ) {
        throw new Error(
          `Fortress ${fortress.label} has overlapping schedules.`
        );
      }
    }
  }

  /*
   * Guildごとのslotを作る。
   */
  const guildGroups =
    bestCandidate.guilds.map(
      (guild, index) => ({
        name:
          `Guild ${String.fromCharCode(
            65 + index
          )}`,

        index,

        slots:
          guild.slots
            .map(slot => ({
              fortress:
                slot.fortress,

              start:
                generatorCloneDate(
                  slot.start
                ),

              end:
                generatorCloneDate(
                  slot.end
                )
            }))
            .sort(
              (a, b) =>
                a.start - b.start
            ),

        totalMinutes:
          guild.totalMinutes
      })
    );

  /*
   * Calendar用schedule。
   */
  const schedules = [];

  guildGroups.forEach(
    group => {
      group.slots.forEach(
        slot => {
          schedules.push({
            league:
              fortressLevel === "Lv7"
                ? "Gold"
                : fortressLevel === "Lv6"
                  ? "Silver"
                  : "Bronze",

            fortress:
              fortressLevel,

            x:
              slot.fortress.x,

            y:
              slot.fortress.y,

            guild:
              "仮ギルド",

            start:
              generatorFormatDateTime(
                slot.start
              ),

            end:
              generatorFormatDateTime(
                slot.end
              ),

            description:
              "Generated Schedule",

            color:
              "#888888",

            creatorId:
              localStorage.getItem(
                "s222_creator_id"
              ),

            _generatorGroup:
              group.name
          });
        }
      );
    }
  );

  schedules.sort(
    (a, b) =>
      new Date(a.start) -
      new Date(b.start)
  );

  return {
    fortressLevel,
    guildCount,
    attackCount,
    firstAttack,
    rangeStart,
    rangeEnd,
    lag,

    guildGroups,

    schedules,

    difference:
      bestCandidate.difference
  };
}


/* =========================================================
Display
========================================================= */

function generatorDisplayCandidate(
  candidate
) {
  const lines = [];

  lines.push(
    `Fortress: ${candidate.fortressLevel}`
  );

  lines.push(
    `Guild Count: ${candidate.guildCount}`
  );

  lines.push(
    `Attack Count: ${candidate.attackCount}`
  );

  lines.push("");

  lines.push(
    `First Attack: GMT ${candidate.firstAttack}`
  );

  lines.push(
    `Attack Range: GMT ${candidate.rangeStart} - ${candidate.rangeEnd}`
  );

  lines.push(
    `Allowed Lag: ±${candidate.lag} min`
  );

  lines.push("");

  lines.push(
    `Total Balance Difference: ${generatorMinutesToText(
      candidate.difference
    )}`
  );

  lines.push("");

  lines.push(
    "Generated Schedule"
  );

  lines.push(
    "------------------"
  );

  /*
   * Guild A / B / C / D ごとに表示。
   */
  candidate.guildGroups.forEach(
    group => {
      lines.push("");

      lines.push(
        `${group.name}`
      );

      group.slots.forEach(
        (slot, index) => {
          const label =
            getCoordinateLabel(
              candidate.fortressLevel,
              slot.fortress.x,
              slot.fortress.y
            );

          const duration =
            generatorMinutesBetween(
              slot.start,
              slot.end
            );

          lines.push(
            `  ${index + 1}. ${candidate.fortressLevel} ${label}  ` +
            `${generatorFormatDisplay(
              slot.start
            )} - ` +
            `${generatorFormatDisplay(
              slot.end
            )}  ` +
            `(${generatorMinutesToText(
              duration
            )})`
          );
        }
      );

      lines.push(
        `  Total: ${generatorMinutesToText(
          group.totalMinutes
        )}`
      );
    }
  );

  lines.push("");

  lines.push(
    "------------------"
  );

  lines.push(
    `Balance Difference: ${generatorMinutesToText(
      candidate.difference
    )}`
  );

  /*
   * textareaなのでvalueを使用。
   */
  generatorResult.value =
    lines.join("\n");
}


/* =========================================================
Generate Button
========================================================= */

generatorGenerateBtn.addEventListener(
  "click",
  () => {

    generatorResult.value = "";

    generatorGoBtn.disabled = true;

    generatedCandidate = null;

    try {

      generatedCandidate =
        generatorGenerateCandidate();

      generatorDisplayCandidate(
        generatedCandidate
      );

      generatorGoBtn.disabled = false;

    } catch (error) {

      console.error(
        "Schedule Generator:",
        error
      );

      generatorResult.value =
        error.message ||
        "Could not generate schedule.";
    }
  }
);


/* =========================================================
Restart Button
========================================================= */

generatorRestartBtn.addEventListener(
  "click",
  () => {
    generatorReset();
  }
);


/* =========================================================
GO
========================================================= */

generatorGoBtn.addEventListener(
  "click",
  async () => {

    if (!generatedCandidate) {
      return;
    }

    try {

      generatorGoBtn.disabled =
        true;

      for (
        const originalSchedule of
          generatedCandidate.schedules
      ) {

        /*
         * Generator内部用の
         * _generatorGroup は除外。
         */
        const schedule = {

          league:
            originalSchedule.league,

          fortress:
            originalSchedule.fortress,

          x:
            originalSchedule.x,

          y:
            originalSchedule.y,

          guild:
            "仮ギルド",

          start:
            originalSchedule.start,

          end:
            originalSchedule.end,

          description:
            originalSchedule.description,

          color:
            originalSchedule.color,

          creatorId:
            originalSchedule.creatorId
        };

        await insertSchedule(
          schedule
        );
      }

      generatorResult.value +=
        "\n\n✓ Schedule imported.";

      generatedCandidate =
        null;

    } catch (error) {

      console.error(
        "Schedule Generator GO:",
        error
      );

      generatorResult.value +=
        `\n\nImport failed: ${
          error.message ||
          "Unknown error."
        }`;

    } finally {

      generatorGoBtn.disabled =
        true;
    }
  }
);


/* =========================================================
Initial Generator State
========================================================= */

generatorReset();
