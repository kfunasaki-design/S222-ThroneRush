// =========================================================
// S222 Throne Rush
// Schedule Generator
// =========================================================


// =========================================================
// Elements
// =========================================================

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

const generatorResult =
  document.getElementById("generatorResult");

const generatorGoBtn =
  document.getElementById("generatorGoBtn");


// =========================================================
// Admin panel view
// =========================================================

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


// =========================================================
// State
// =========================================================

let generatedCandidate = null;
let lastGeneratedSignature = null;

const GENERATOR_TIME_STEP = 30;
const GENERATOR_CANDIDATE_POOL_SIZE = 20;


// =========================================================
// Defaults
// =========================================================

const GENERATOR_DEFAULTS = {
  fortress: "Lv6",
  guildCount: "4",
  attackCount: "2",
  firstAttack: "12:00",
  rangeStart: "08:00",
  rangeEnd: "15:00",
  lag: "60"
};


// =========================================================
// Admin panel view
// =========================================================

function initAdminPanelViewSwitch() {

  if (
    !adminSettingsTab ||
    !adminGeneratorTab ||
    !adminSettingsView ||
    !adminGeneratorView
  ) {
    return;
  }

  function showView(view) {

    const generator =
      view === "generator";

    adminSettingsView.style.display =
      generator ? "none" : "";

    adminGeneratorView.style.display =
      generator ? "" : "none";

    adminSettingsTab.classList.toggle(
      "active",
      !generator
    );

    adminGeneratorTab.classList.toggle(
      "active",
      generator
    );

    try {
      localStorage.setItem(
        ADMIN_PANEL_VIEW_KEY,
        view
      );
    } catch (error) {
      // Ignore storage errors.
    }
  }

  adminSettingsTab.addEventListener(
    "click",
    () => {
      showView("settings");
    }
  );

  adminGeneratorTab.addEventListener(
    "click",
    () => {
      showView("generator");
    }
  );

  let initialView = "settings";

  try {
    initialView =
      localStorage.getItem(
        ADMIN_PANEL_VIEW_KEY
      ) || "settings";
  } catch (error) {
    // Ignore storage errors.
  }

  showView(initialView);
}

initAdminPanelViewSwitch();


// =========================================================
// Reset
// =========================================================

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
    generatorResult.innerHTML = "";
  }

  generatedCandidate = null;

  if (generatorGoBtn) {
    generatorGoBtn.disabled = true;
  }
}


// =========================================================
// Basic utilities
// =========================================================

function generatorParseTime(value) {

  if (
    typeof value !== "string" ||
    !value.includes(":")
  ) {
    return null;
  }

  const parts =
    value.split(":").map(Number);

  if (parts.length < 2) {
    return null;
  }

  const hours = parts[0];
  const minutes = parts[1];

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}


function generatorFormatDateTime(date) {

  const year =
    date.getUTCFullYear();

  const month =
    String(
      date.getUTCMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getUTCDate()
    ).padStart(2, "0");

  const hours =
    String(
      date.getUTCHours()
    ).padStart(2, "0");

  const minutes =
    String(
      date.getUTCMinutes()
    ).padStart(2, "0");

  return (
    `${year}-${month}-${day}` +
    `T${hours}:${minutes}:00+00:00`
  );
}


function generatorFormatDisplay(date) {

  const month =
    String(
      date.getUTCMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getUTCDate()
    ).padStart(2, "0");

  const hours =
    String(
      date.getUTCHours()
    ).padStart(2, "0");

  const minutes =
    String(
      date.getUTCMinutes()
    ).padStart(2, "0");

  return (
    `${month}/${day} ` +
    `${hours}:${minutes}`
  );
}


function generatorMinutesBetween(
  start,
  end
) {
  return (
    (end.getTime() - start.getTime()) /
    60000
  );
}


function generatorCloneDate(date) {
  return new Date(date.getTime());
}


function generatorMinutesToText(minutes) {

  minutes =
    Math.max(
      0,
      Math.round(minutes)
    );

  const days =
    Math.floor(
      minutes / 1440
    );

  minutes %= 1440;

  const hours =
    Math.floor(
      minutes / 60
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


// =========================================================
// Event / release
// =========================================================

function generatorGetEventPeriod() {

  if (
    typeof event !== "undefined" &&
    event &&
    event.start &&
    event.end
  ) {

    const start =
      new Date(event.start);

    const end =
      new Date(event.end);

    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end > start
    ) {
      return {
        start,
        end
      };
    }
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

      const date =
        new Date(value);

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {
        return date;
      }
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


// =========================================================
// Fortress
// =========================================================

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


// =========================================================
// Attack range
// =========================================================

function generatorIsTimeInRange(
  minutes,
  rangeStart,
  rangeEnd,
  lag
) {

  if (
    !Number.isFinite(minutes) ||
    !Number.isFinite(rangeStart) ||
    !Number.isFinite(rangeEnd) ||
    !Number.isFinite(lag)
  ) {
    return false;
  }

  let start =
    rangeStart - lag;

  let end =
    rangeEnd + lag;

  start =
    ((start % 1440) + 1440) %
    1440;

  end =
    ((end % 1440) + 1440) %
    1440;

  minutes =
    ((minutes % 1440) + 1440) %
    1440;

  if (start <= end) {
    return (
      minutes >= start &&
      minutes <= end
    );
  }

  return (
    minutes >= start ||
    minutes <= end
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


function generatorRoundToStep(date) {

  const result =
    generatorCloneDate(date);

  const minutes =
    result.getUTCMinutes();

  const rounded =
    Math.round(
      minutes /
      GENERATOR_TIME_STEP
    ) *
    GENERATOR_TIME_STEP;

  result.setUTCMinutes(
    rounded,
    0,
    0
  );

  return result;
}


// =========================================================
// Time boundary candidates
// =========================================================
//
// Allowed Lag is deliberately used here as
// the actual movable boundary range.
//
// A boundary may move around the normal attack
// window by ±lag.
// =========================================================

function generatorGetAllowedMinuteWindows(
  rangeStart,
  rangeEnd,
  lag
) {

  let start =
    rangeStart - lag;

  let end =
    rangeEnd + lag;

  start =
    ((start % 1440) + 1440) %
    1440;

  end =
    ((end % 1440) + 1440) %
    1440;

  return {
    start,
    end
  };
}


function generatorIsBoundaryAllowed(
  date,
  rangeStart,
  rangeEnd,
  lag
) {

  return generatorIsAllowedStart(
    date,
    rangeStart,
    rangeEnd,
    lag
  );
}


function generatorBuildBoundaryCandidates(
  fortressStart,
  fortressEnd,
  rangeStart,
  rangeEnd,
  lag
) {

  const result = [];

  if (
    fortressEnd <= fortressStart
  ) {
    return result;
  }

  const first =
    generatorRoundToStep(
      fortressStart
    );

  const last =
    generatorRoundToStep(
      fortressEnd
    );

  let cursor =
    generatorCloneDate(first);

  while (cursor <= last) {

    if (
      cursor > fortressStart &&
      cursor < fortressEnd &&
      generatorIsBoundaryAllowed(
        cursor,
        rangeStart,
        rangeEnd,
        lag
      )
    ) {

      result.push(
        generatorCloneDate(cursor)
      );
    }

    cursor.setUTCMinutes(
      cursor.getUTCMinutes() +
      GENERATOR_TIME_STEP
    );
  }

  return result;
}


// =========================================================
// Assignment patterns
// =========================================================
//
// Each fortress receives `attackCount` slots.
//
// Example:
// 3 fortresses × 2 attacks = 6 slots
//
// 4 guilds => valid distribution is 2/2/1/1.
//
// A guild may never occupy two consecutive slots
// of the same fortress.
// =========================================================

function generatorBuildAssignmentPatterns(
  fortresses,
  guildCount,
  attackCount
) {

  const slotCount =
    fortresses.length *
    attackCount;

  const patterns = [];

  if (
    guildCount < 1 ||
    attackCount < 1 ||
    slotCount < guildCount ||
    slotCount > guildCount * attackCount
  ) {
    return patterns;
  }

  const assignment =
    new Array(slotCount).fill(-1);

  const usage =
    new Array(guildCount).fill(0);

  function recurse(index) {

    if (
      patterns.length >= 5000
    ) {
      return;
    }

    if (index >= slotCount) {

      for (let g = 0; g < guildCount; g++) {
        if (usage[g] < 1) {
          return;
        }
      }

      patterns.push(
        assignment.slice()
      );

      return;
    }

    const fortressIndex =
      Math.floor(
        index / attackCount
      );

    const slotInFortress =
      index % attackCount;

    const previousGuild =
      slotInFortress > 0
        ? assignment[index - 1]
        : -1;

    for (
      let guild = 0;
      guild < guildCount;
      guild++
    ) {

      if (
        usage[guild] >= attackCount
      ) {
        continue;
      }

      // Never use the same guild twice
      // inside the same fortress.
      if (
        guild === previousGuild
      ) {
        continue;
      }

      assignment[index] =
        guild;

      usage[guild]++;

      recurse(index + 1);

      usage[guild]--;

      assignment[index] = -1;
    }
  }

  recurse(0);

  return patterns;
}


// =========================================================
// Assignment helpers
// =========================================================

function generatorGetGuildTotals(
  slots,
  guildCount
) {

  const totals =
    new Array(guildCount).fill(0);

  const attacks =
    new Array(guildCount).fill(0);

  slots.forEach(slot => {

    const guild =
      slot.guildIndex;

    if (
      guild < 0 ||
      guild >= guildCount
    ) {
      return;
    }

    const minutes =
      generatorMinutesBetween(
        slot.start,
        slot.end
      );

    totals[guild] += minutes;
    attacks[guild]++;
  });

  return {
    totals,
    attacks
  };
}


// =========================================================
// Fairness evaluation
// =========================================================

function generatorEvaluateFairness(
  slots,
  guildCount
) {

  const {
    totals,
    attacks
  } =
    generatorGetGuildTotals(
      slots,
      guildCount
    );

  const maxTotal =
    Math.max(...totals);

  const minTotal =
    Math.min(...totals);

  const difference =
    maxTotal - minTotal;

  const singleTotals = [];
  const multiTotals = [];

  for (
    let guild = 0;
    guild < guildCount;
    guild++
  ) {

    if (attacks[guild] === 1) {
      singleTotals.push(
        totals[guild]
      );
    } else {
      multiTotals.push(
        totals[guild]
      );
    }
  }

  let singleAttackExcess = 0;

  if (multiTotals.length) {

    const multiAverage =
      multiTotals.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      multiTotals.length;

    singleTotals.forEach(total => {

      singleAttackExcess +=
        Math.max(
          0,
          total - multiAverage
        );
    });
  }

  /*
   * Primary:
   *   prevent one-attack guilds from becoming
   *   longer than the two-attack group.
   *
   * Secondary:
   *   minimize total occupation difference.
   *
   * Tertiary:
   *   minimize squared deviation.
   */

  const average =
    totals.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    totals.length;

  const squaredDeviation =
    totals.reduce(
      (sum, value) =>
        sum +
        Math.pow(
          value - average,
          2
        ),
      0
    );

  /*
   * This is deliberately strong.
   *
   * 1 minute of single-attack excess
   * should be considerably more expensive
   * than 1 minute of ordinary imbalance.
   */
  const SINGLE_ATTACK_WEIGHT = 8;

  const RANGE_WEIGHT = 1;

  const DEVIATION_WEIGHT =
    0.000001;

  const score =
    singleAttackExcess *
      SINGLE_ATTACK_WEIGHT +
    difference *
      RANGE_WEIGHT +
    squaredDeviation *
      DEVIATION_WEIGHT;

  return {
    totals,
    attacks,
    maxTotal,
    minTotal,
    difference,
    singleAttackExcess,
    average,
    squaredDeviation,
    score
  };
}


// =========================================================
// Boundary optimization
// =========================================================
//
// This is the main time optimizer.
//
// Each fortress has:
//
//   fixed start
//       ↓
//   movable boundary
//       ↓
//   fixed end
//
// Only the boundaries are optimized.
// First Attack is never moved.
// =========================================================

function generatorBuildSlotsFromBoundaries(
  fortresses,
  assignment,
  boundaries,
  actualStart,
  eventEnd,
  attackCount
) {

  const slots = [];

  for (
    let fortressIndex = 0;
    fortressIndex < fortresses.length;
    fortressIndex++
  ) {

    const fortress =
      fortresses[fortressIndex];

    const start =
      generatorCloneDate(
        actualStart
      );

    const end =
      generatorCloneDate(
        eventEnd
      );

    const fortressBoundaries =
      boundaries[fortressIndex] || [];

    const times = [
      start,
      ...fortressBoundaries,
      end
    ];

    for (
      let slotIndex = 0;
      slotIndex < attackCount;
      slotIndex++
    ) {

      const slotStart =
        generatorCloneDate(
          times[slotIndex]
        );

      const slotEnd =
        generatorCloneDate(
          times[slotIndex + 1]
        );

      if (
        slotEnd <= slotStart
      ) {
        return null;
      }

      const assignmentIndex =
        fortressIndex *
          attackCount +
        slotIndex;

      slots.push({
        fortress,
        fortressIndex,
        slotIndex,
        guildIndex:
          assignment[assignmentIndex],
        start: slotStart,
        end: slotEnd
      });
    }
  }

  return slots;
}


function generatorGetInitialBoundary(
  start,
  end
) {

  const duration =
    generatorMinutesBetween(
      start,
      end
    );

  return generatorRoundToStep(
    new Date(
      start.getTime() +
      duration * 0.5 * 60000
    )
  );
}


function generatorBuildInitialBoundaries(
  fortresses,
  attackCount,
  actualStart,
  eventEnd,
  rangeStart,
  rangeEnd,
  lag
) {

  const result = [];

  for (
    let fortressIndex = 0;
    fortressIndex < fortresses.length;
    fortressIndex++
  ) {

    const boundaries = [];

    for (
      let i = 1;
      i < attackCount;
      i++
    ) {

      const duration =
        generatorMinutesBetween(
          actualStart,
          eventEnd
        );

      let boundary =
        new Date(
          actualStart.getTime() +
          duration *
            (i / attackCount) *
            60000
        );

      boundary =
        generatorRoundToStep(
          boundary
        );

      /*
       * If the mathematically balanced point
       * is not inside the allowed attack range,
       * move it to the nearest allowed candidate.
       */

      const candidates =
        generatorBuildBoundaryCandidates(
          actualStart,
          eventEnd,
          rangeStart,
          rangeEnd,
          lag
        );

      if (candidates.length) {

        candidates.sort(
          (a, b) =>
            Math.abs(
              a.getTime() -
              boundary.getTime()
            ) -
            Math.abs(
              b.getTime() -
              boundary.getTime()
            )
        );

        boundary =
          generatorCloneDate(
            candidates[0]
          );
      }

      boundaries.push(
        boundary
      );
    }

    result.push(boundaries);
  }

  return result;
}


function generatorBoundaryKey(
  boundaries
) {

  return boundaries
    .map(group =>
      group
        .map(date =>
          date.getTime()
        )
        .join(",")
    )
    .join("|");
}


function generatorOptimizeAssignmentTimes(
  fortresses,
  assignment,
  attackCount,
  actualStart,
  eventEnd,
  rangeStart,
  rangeEnd,
  lag
) {

  let boundaries =
    generatorBuildInitialBoundaries(
      fortresses,
      attackCount,
      actualStart,
      eventEnd,
      rangeStart,
      rangeEnd,
      lag
    );

  let slots =
    generatorBuildSlotsFromBoundaries(
      fortresses,
      assignment,
      boundaries,
      actualStart,
      eventEnd,
      attackCount
    );

  if (!slots) {
    return null;
  }

  let best =
    generatorEvaluateFairness(
      slots,
      Math.max(
        ...assignment
      ) + 1
    );

  /*
   * Allowed Lag determines how far each boundary
   * may be moved from its natural attack-window
   * position.
   *
   * We search every 30-minute candidate.
   */

  const candidateLists = [];

  for (
    let fortressIndex = 0;
    fortressIndex < fortresses.length;
    fortressIndex++
  ) {

    const list = [];

    for (
      let boundaryIndex = 0;
      boundaryIndex < attackCount - 1;
      boundaryIndex++
    ) {

      const candidates =
        generatorBuildBoundaryCandidates(
          actualStart,
          eventEnd,
          rangeStart,
          rangeEnd,
          lag
        );

      list.push(candidates);
    }

    candidateLists.push(list);
  }

  /*
   * Coordinate descent.
   *
   * We do not brute-force every possible combination.
   * Instead, each boundary is moved independently,
   * repeatedly, until no improvement remains.
   */

  const MAX_PASSES = 12;

  for (
    let pass = 0;
    pass < MAX_PASSES;
    pass++
  ) {

    let changed = false;

    for (
      let fortressIndex = 0;
      fortressIndex < fortresses.length;
      fortressIndex++
    ) {

      for (
        let boundaryIndex = 0;
        boundaryIndex < attackCount - 1;
        boundaryIndex++
      ) {

        const candidates =
          candidateLists[
            fortressIndex
          ][
            boundaryIndex
          ];

        if (!candidates.length) {
          continue;
        }

        let localBestDate =
          boundaries[
            fortressIndex
          ][
            boundaryIndex
          ];

        let localBestScore =
          best;

        for (
          const candidateDate
          of candidates
        ) {

          /*
           * Preserve chronological order.
           */

          const previous =
            boundaryIndex === 0
              ? actualStart
              : boundaries[
                  fortressIndex
                ][
                  boundaryIndex - 1
                ];

          const next =
            boundaryIndex ===
              attackCount - 2
              ? eventEnd
              : boundaries[
                  fortressIndex
                ][
                  boundaryIndex + 1
                ];

          if (
            candidateDate <= previous ||
            candidateDate >= next
          ) {
            continue;
          }

          const testBoundaries =
            boundaries.map(
              group =>
                group.map(
                  date =>
                    generatorCloneDate(
                      date
                    )
                )
            );

          testBoundaries[
            fortressIndex
          ][
            boundaryIndex
          ] =
            generatorCloneDate(
              candidateDate
            );

          const testSlots =
            generatorBuildSlotsFromBoundaries(
              fortresses,
              assignment,
              testBoundaries,
              actualStart,
              eventEnd,
              attackCount
            );

          if (!testSlots) {
            continue;
          }

          const evaluation =
            generatorEvaluateFairness(
              testSlots,
              Math.max(
                ...assignment
              ) + 1
            );

          if (
            evaluation.score <
            localBestScore.score
          ) {

            localBestDate =
              generatorCloneDate(
                candidateDate
              );

            localBestScore =
              evaluation;
          }
        }

        if (
          localBestScore.score <
          best.score
        ) {

          boundaries[
            fortressIndex
          ][
            boundaryIndex
          ] =
            localBestDate;

          best =
            localBestScore;

          changed = true;
        }
      }
    }

    if (!changed) {
      break;
    }
  }

  slots =
    generatorBuildSlotsFromBoundaries(
      fortresses,
      assignment,
      boundaries,
      actualStart,
      eventEnd,
      attackCount
    );

  if (!slots) {
    return null;
  }

  const guildCount =
    Math.max(
      ...assignment
    ) + 1;

  const fairness =
    generatorEvaluateFairness(
      slots,
      guildCount
    );

  return {
    slots,
    boundaries,
    fairness,
    boundaryKey:
      generatorBoundaryKey(
        boundaries
      )
  };
}


// =========================================================
// Candidate comparison
// =========================================================

function generatorCompareCandidates(
  a,
  b
) {

  if (
    a.fairness.score !==
    b.fairness.score
  ) {

    return (
      a.fairness.score -
      b.fairness.score
    );
  }

  if (
    a.fairness.singleAttackExcess !==
    b.fairness.singleAttackExcess
  ) {

    return (
      a.fairness.singleAttackExcess -
      b.fairness.singleAttackExcess
    );
  }

  return (
    a.fairness.difference -
    b.fairness.difference
  );
}


// =========================================================
// Candidate signature
// =========================================================

function generatorCreateCandidateSignature(
  candidate
) {

  return candidate.slots
    .map(slot =>
      [
        slot.fortress.label,
        slot.guildIndex,
        slot.start.getTime(),
        slot.end.getTime()
      ].join(":")
    )
    .sort()
    .join("|");
}


// =========================================================
// Assignment evaluation
// =========================================================

function generatorEvaluate(
  fortresses,
  assignment,
  guildCount,
  attackCount,
  actualStart,
  eventEnd,
  rangeStart,
  rangeEnd,
  lag
) {

  const optimized =
    generatorOptimizeAssignmentTimes(
      fortresses,
      assignment,
      attackCount,
      actualStart,
      eventEnd,
      rangeStart,
      rangeEnd,
      lag
    );

  if (!optimized) {
    return null;
  }

  /*
   * Confirm every guild is represented.
   */

  const guilds =
    new Set(
      assignment
    );

  if (
    guilds.size !== guildCount
  ) {
    return null;
  }

  return {
    ...optimized,
    guildCount,
    attackCount
  };
}


// =========================================================
// Convert slots to guild groups
// =========================================================

function generatorGroupSlotsByGuild(
  slots,
  guildCount
) {

  const groups =
    Array.from(
      {
        length: guildCount
      },
      (_, index) => ({
        guildIndex: index,
        slots: [],
        totalMinutes: 0
      })
    );

  slots.forEach(slot => {

    const group =
      groups[
        slot.guildIndex
      ];

    if (!group) {
      return;
    }

    const minutes =
      generatorMinutesBetween(
        slot.start,
        slot.end
      );

    group.slots.push(
      slot
    );

    group.totalMinutes +=
      minutes;
  });

  return groups;
}


// =========================================================
// Generate schedules
// =========================================================

function generatorGenerate() {

  if (!generatorResult) {
    return null;
  }

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
    generatorParseTime(
      generatorFirstAttack.value
    );

  const rangeStart =
    generatorParseTime(
      generatorRangeStart.value
    );

  const rangeEnd =
    generatorParseTime(
      generatorRangeEnd.value
    );

  const lag =
    Number(
      generatorLag.value
    );

  if (
    !fortressLevel ||
    !Number.isInteger(guildCount) ||
    guildCount < 1 ||
    !Number.isInteger(attackCount) ||
    attackCount < 1 ||
    firstAttack === null ||
    rangeStart === null ||
    rangeEnd === null ||
    !Number.isFinite(lag) ||
    lag < 0
  ) {

    throw new Error(
      "Invalid generator settings."
    );
  }

  const eventPeriod =
    generatorGetEventPeriod();

  if (!eventPeriod) {

    throw new Error(
      "Event period is not available."
    );
  }

  const eventStart =
    eventPeriod.start;

  const eventEnd =
    eventPeriod.end;

  const releaseStart =
    generatorGetStartDate(
      fortressLevel,
      eventStart
    );

  /*
   * First Attack is fixed.
   *
   * If the release occurs after today's
   * first-attack time, move to the next day.
   */

  let actualStart =
    generatorCloneDate(
      releaseStart
    );

  actualStart.setUTCHours(
    Math.floor(firstAttack / 60),
    firstAttack % 60,
    0,
    0
  );

  if (
    actualStart < releaseStart
  ) {

    actualStart =
      generatorCloneDate(
        releaseStart
      );

    actualStart.setUTCDate(
      actualStart.getUTCDate() + 1
    );

    actualStart.setUTCHours(
      Math.floor(firstAttack / 60),
      firstAttack % 60,
      0,
      0
    );
  }

  /*
   * Event cannot be generated if the fixed
   * first attack is already outside the period.
   */

  if (
    actualStart >= eventEnd
  ) {

    throw new Error(
      "First Attack is outside the available event period."
    );
  }

  const fortresses =
    generatorGetFortresses(
      fortressLevel
    );

  if (!fortresses.length) {

    throw new Error(
      "No fortresses found for this level."
    );
  }

  /*
   * Every fortress receives up to the maximum
   * attack count as occupation slots.
   *
   * Example:
   *
   *   Lv6 × 3 fortresses
   *   Maximum Attack Count = 2
   *
   *   3 × 2 = 6 slots
   */

  const totalSlots =
    fortresses.length *
    attackCount;

  /*
   * Every guild needs at least one slot.
   *
   * The total number of slots must also be
   * possible with the maximum attack count.
   */

  if (
    guildCount > totalSlots
  ) {

    throw new Error(
      "Guild Count is larger than the available occupation slots."
    );
  }

  if (
    guildCount * attackCount <
    totalSlots
  ) {

    throw new Error(
      "Maximum Attack Count is too small for the available occupation slots."
    );
  }

  /*
   * Build actual assignment patterns.
   *
   * These are the meaningful patterns now.
   */

  const assignments =
    generatorBuildAssignmentPatterns(
      fortresses,
      guildCount,
      attackCount
    );

  if (!assignments.length) {

    throw new Error(
      "No valid guild assignment pattern was found."
    );
  }

  const candidates = [];

  /*
   * Evaluate every assignment.
   *
   * The target problem is small:
   * 3 fortresses × 2 slots = 6 positions.
   *
   * This makes direct pattern evaluation practical.
   */

  for (
    const assignment
    of assignments
  ) {

    const candidate =
      generatorEvaluate(
        fortresses,
        assignment,
        guildCount,
        attackCount,
        actualStart,
        eventEnd,
        rangeStart,
        rangeEnd,
        lag
      );

    if (!candidate) {
      continue;
    }

    candidate.signature =
      generatorCreateCandidateSignature(
        candidate
      );

    candidates.push(
      candidate
    );
  }

  if (!candidates.length) {

    throw new Error(
      "No valid schedule candidate was generated."
    );
  }

  /*
   * Remove exact duplicate schedules.
   */

  const unique =
    new Map();

  candidates.forEach(candidate => {

    if (
      !unique.has(
        candidate.signature
      )
    ) {

      unique.set(
        candidate.signature,
        candidate
      );
    }
  });

  const uniqueCandidates =
    Array.from(
      unique.values()
    );

  /*
   * Sort by actual fairness.
   */

  uniqueCandidates.sort(
    generatorCompareCandidates
  );

  /*
   * Keep only the strongest candidates.
   *
   * Generate click still displays ONE result.
   */

  const pool =
    uniqueCandidates.slice(
      0,
      Math.min(
        GENERATOR_CANDIDATE_POOL_SIZE,
        uniqueCandidates.length
      )
    );

  /*
   * Prefer a different result from the previous
   * Generate click.
   */

  let selectable =
    pool.filter(
      candidate =>
        candidate.signature !==
        lastGeneratedSignature
    );

  if (!selectable.length) {
    selectable = pool;
  }

  /*
   * Select randomly from the strong candidates.
   * This preserves the existing "Generate again"
   * behavior while keeping all results near-optimal.
   */

  const selected =
    selectable[
      Math.floor(
        Math.random() *
        selectable.length
      )
    ];

  lastGeneratedSignature =
    selected.signature;

  const groups =
    generatorGroupSlotsByGuild(
      selected.slots,
      guildCount
    );

  selected.guilds =
    groups;

  selected.settings = {
    fortressLevel,
    guildCount,
    attackCount,
    firstAttack,
    rangeStart,
    rangeEnd,
    lag,
    actualStart,
    eventEnd
  };

  return selected;
}


// =========================================================
// Render result
// =========================================================

function generatorRenderCandidate(
  candidate
) {

  if (!generatorResult) {
    return;
  }

  const settings =
    candidate.settings;

  const fairness =
    candidate.fairness;

  let html = "";

  html +=
    `<div class="generator-summary">`;

  html +=
    `<div>Fortress: ${settings.fortressLevel}</div>`;

  html +=
    `<div>Guild Count: ${settings.guildCount}</div>`;

  html +=
    `<div>Maximum Attack Count: ${settings.attackCount}</div>`;

  html +=
    `<div>First Attack: GMT ${generatorFormatClock(settings.firstAttack)}</div>`;

  html +=
    `<div>Attack Range: GMT ${generatorFormatClock(settings.rangeStart)} - ${generatorFormatClock(settings.rangeEnd)}</div>`;

  html +=
    `<div>Allowed Lag: ±${settings.lag} min</div>`;

  html +=
    `<div>Total Balance Difference: ${generatorMinutesToText(fairness.difference)}</div>`;

  html +=
    `<div>Single-Attack Penalty: ${generatorMinutesToText(fairness.singleAttackExcess)}</div>`;

  html +=
    `</div>`;

  html +=
    `<hr>`;

  html +=
    `<div class="generator-schedule-title">Generated Schedule</div>`;

  html +=
    `<div>------------------</div>`;

  candidate.guilds.forEach(
    (guild, guildIndex) => {

      const attackLabel =
        guild.slots.length === 1
          ? "1 attack"
          : `${guild.slots.length} attacks`;

      html +=
        `<div class="generator-guild">`;

      html +=
        `<div><strong>Guild ${generatorGuildLabel(guildIndex)}</strong> (${attackLabel})</div>`;

      guild.slots.forEach(
        (slot, slotIndex) => {

          const duration =
            generatorMinutesBetween(
              slot.start,
              slot.end
            );

          html +=
            `<div class="generator-slot">`;

          html +=
            `&nbsp;&nbsp;${slotIndex + 1}. `;

          html +=
            `${slot.fortress.level} ${slot.fortress.label} `;

          html +=
            `${generatorFormatDisplay(slot.start)} - `;

          html +=
            `${generatorFormatDisplay(slot.end)} `;

          html +=
            `(${generatorMinutesToText(duration)})`;

          html +=
            `</div>`;
        }
      );

      html +=
        `<div>&nbsp;&nbsp;Total: ${generatorMinutesToText(guild.totalMinutes)}</div>`;

      html +=
        `</div>`;
    }
  );

  html +=
    `<div>------------------</div>`;

  html +=
    `<div><strong>Balance Difference: ${generatorMinutesToText(fairness.difference)}</strong></div>`;

  generatorResult.innerHTML =
    html;

  if (generatorGoBtn) {
    generatorGoBtn.disabled = false;
  }
}


// =========================================================
// Display helpers
// =========================================================

function generatorFormatClock(
  minutes
) {

  const hours =
    Math.floor(
      minutes / 60
    );

  const mins =
    minutes % 60;

  return (
    `${String(hours).padStart(2, "0")}:` +
    `${String(mins).padStart(2, "0")}`
  );
}


function generatorGuildLabel(
  index
) {

  return String.fromCharCode(
    65 + index
  );
}


// =========================================================
// Generate button
// =========================================================

if (generatorGenerateBtn) {

  generatorGenerateBtn.addEventListener(
    "click",
    () => {

      try {

        generatorResult.innerHTML =
          "Generating...";

        if (generatorGoBtn) {
          generatorGoBtn.disabled = true;
        }

        const candidate =
          generatorGenerate();

        generatedCandidate =
          candidate;

        generatorRenderCandidate(
          candidate
        );

      } catch (error) {

        generatedCandidate =
          null;

        if (generatorGoBtn) {
          generatorGoBtn.disabled = true;
        }

        generatorResult.innerHTML =
          `<div class="generator-error">` +
          `${error.message}` +
          `</div>`;
      }
    }
  );
}


// =========================================================
// Restart
// =========================================================

if (
  typeof generatorRestartBtn !==
  "undefined" &&
  generatorRestartBtn
) {

  generatorRestartBtn.addEventListener(
    "click",
    () => {

      if (
        typeof generatorRestart ===
        "function"
      ) {
        generatorRestart();
      }
    }
  );
}


// =========================================================
// GO
// =========================================================

if (generatorGoBtn) {

  generatorGoBtn.addEventListener(
    "click",
    async () => {

      if (!generatedCandidate) {
        return;
      }

      generatorGoBtn.disabled = true;

      let success = 0;
      let failure = 0;

      for (
        const slot
        of generatedCandidate.slots
      ) {

        const schedule = {

          league:
            generatedCandidate.settings
              .fortressLevel === "Lv7"
              ? "Gold"
              : generatedCandidate.settings
                  .fortressLevel === "Lv6"
                  ? "Silver"
                  : "Bronze",

          fortress:
            slot.fortress.level,

          coordinate_x:
            slot.fortress.x,

          coordinate_y:
            slot.fortress.y,

          guild:
            "仮ギルド",

          start_at:
            generatorFormatDateTime(
              slot.start
            ),

          end_at:
            generatorFormatDateTime(
              slot.end
            ),

          description:
            "",

          _generatorGroup:
            generatorGuildLabel(
              slot.guildIndex
            )
        };

        try {

          await insertSchedule(
            schedule
          );

          success++;

        } catch (error) {

          failure++;
        }
      }

      let resultText =
        `<div>Imported: ${success}</div>`;

      if (failure) {

        resultText +=
          `<div>Failed: ${failure}</div>`;
      }

      generatorResult.insertAdjacentHTML(
        "beforeend",
        resultText
      );

      generatorGoBtn.disabled = false;
    }
  );
}


// =========================================================
// Initial
// =========================================================

generatorReset();
