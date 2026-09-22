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


/* =========================================================
Generator Settings
========================================================= */

const GENERATOR_TIME_STEP = 30;

const GENERATOR_CANDIDATE_POOL_SIZE = 30;


/*
 * 同じ結果を連続して返さないため、
 * Generateごとに候補を少しずつ切り替える。
 */
let generatorSelectionOffset = 0;


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


  function showAdminPanelView(view) {

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

  lastGeneratedSignature = null;

  generatorSelectionOffset = 0;

  if (generatorGoBtn) {
    generatorGoBtn.disabled = true;
  }
}


/* =========================================================
Basic Utilities
========================================================= */

function generatorParseTime(value) {

  const parts =
    value.split(":").map(Number);

  return (
    parts[0] * 60 +
    parts[1]
  );
}


function generatorFormatDateTime(date) {

  const y =
    date.getUTCFullYear();

  const m =
    String(
      date.getUTCMonth() + 1
    ).padStart(2, "0");

  const d =
    String(
      date.getUTCDate()
    ).padStart(2, "0");

  const h =
    String(
      date.getUTCHours()
    ).padStart(2, "0");

  const min =
    String(
      date.getUTCMinutes()
    ).padStart(2, "0");

  return (
    `${y}-${m}-${d}T` +
    `${h}:${min}:00+00:00`
  );
}


function generatorFormatDisplay(date) {

  const m =
    String(
      date.getUTCMonth() + 1
    ).padStart(2, "0");

  const d =
    String(
      date.getUTCDate()
    ).padStart(2, "0");

  const h =
    String(
      date.getUTCHours()
    ).padStart(2, "0");

  const min =
    String(
      date.getUTCMinutes()
    ).padStart(2, "0");

  return (
    `${m}/${d} ${h}:${min}`
  );
}


function generatorMinutesBetween(
  start,
  end
) {

  return Math.round(
    (
      end.getTime() -
      start.getTime()
    ) / 60000
  );
}


function generatorCloneDate(date) {

  return new Date(
    date.getTime()
  );
}


function generatorMinutesToText(
  minutes
) {

  const days =
    Math.floor(
      minutes / 1440
    );

  const hours =
    Math.floor(
      (minutes % 1440) / 60
    );

  const mins =
    minutes % 60;

  const parts = [];

  if (days) {
    parts.push(
      `${days}d`
    );
  }

  if (hours) {
    parts.push(
      `${hours}h`
    );
  }

  if (mins) {
    parts.push(
      `${mins}m`
    );
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
      start:
        new Date(event.start),

      end:
        new Date(event.end)
    };
  }

  return null;
}


function generatorGetReleaseDate(
  level
) {

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
    generatorGetReleaseDate(
      level
    );

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

function generatorGetFortresses(
  level
) {

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
    label:
      fortress.label,
    x:
      fortress.x,
    y:
      fortress.y
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
    generatorParseTime(
      rangeStart
    );

  const end =
    generatorParseTime(
      rangeEnd
    );

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
    generatorCloneDate(
      date
    );

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


/* =========================================================
Boundary Candidates
========================================================= */

function generatorBuildBoundaryCandidates(
  start,
  end,
  rangeStart,
  rangeEnd,
  lag
) {

  const candidates = [];

  const step =
    GENERATOR_TIME_STEP *
    60000;


  /*
   * First Attack以降、Event End直前まで
   * 30分刻みで候補を作る。
   */
  let cursor =
    generatorRoundToStep(
      start
    );


  /*
   * startと同時刻なら
   * 次の30分へ。
   */
  if (
    cursor <= start
  ) {
    cursor =
      new Date(
        cursor.getTime() +
        step
      );
  }


  while (
    cursor < end
  ) {

    if (
      generatorIsAllowedStart(
        cursor,
        rangeStart,
        rangeEnd,
        lag
      )
    ) {

      candidates.push(
        generatorCloneDate(
          cursor
        )
      );
    }


    cursor =
      new Date(
        cursor.getTime() +
        step
      );
  }


  return candidates;
}


/* =========================================================
Fortress Slot Construction
========================================================= */

function generatorBuildFortressSlots(
  fortress,
  start,
  end,
  boundaries
) {

  const slots = [];

  let cursor =
    generatorCloneDate(
      start
    );


  for (
    const boundary of boundaries
  ) {

    if (
      boundary <= cursor ||
      boundary >= end
    ) {
      return null;
    }


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


  if (
    cursor >= end
  ) {
    return null;
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
Assignment Pattern Generation
========================================================= */

/*
 * 各拠点にAttack Count個の枠を作り、
 * その枠へGuildを割り当てる。
 *
 * Attack Count = 2 の場合、
 *
 * 3拠点 × 2枠 = 6枠
 *
 * 4 Guildなら、
 *
 * 1回 / 2回 / 2回 / 1回
 *
 * のような割り振りも可能。
 *
 * 同じ拠点を同じGuildが連続して
 * 取ることは避ける。
 */

function generatorBuildAssignmentPatterns(
  fortressCount,
  guildCount,
  attackCount
) {

  const totalSlots =
    fortressCount *
    attackCount;

  const patterns = [];


  /*
   * 各Guildは最低1回必要。
   *
   * 最大回数はattackCount。
   */
  if (
    guildCount >
    totalSlots
  ) {
    return [];
  }


  if (
    totalSlots <
    guildCount
  ) {
    return [];
  }


  const assignment =
    Array.from(
      {
        length:
          totalSlots
      },
      () => -1
    );


  const guildUseCount =
    Array.from(
      {
        length:
          guildCount
      },
      () => 0
    );


  function search(
    index
  ) {

    if (
      index >=
      totalSlots
    ) {

      /*
       * 全Guildが最低1回。
       */
      if (
        guildUseCount.some(
          count =>
            count < 1
        )
      ) {
        return;
      }


      patterns.push(
        [...assignment]
      );

      return;
    }


    const fortressIndex =
      Math.floor(
        index /
        attackCount
      );

    const usedInFortress =
      new Set();


    for (
      let previous =
        fortressIndex *
        attackCount;

      previous < index;

      previous++
    ) {

      const value =
        assignment[
          previous
        ];

      if (value >= 0) {
        usedInFortress.add(
          value
        );
      }
    }


    for (
      let guild = 0;
      guild < guildCount;
      guild++
    ) {

      /*
       * 同じ拠点を同じGuildが
       * 2回担当しない。
       */
      if (
        usedInFortress.has(
          guild
        )
      ) {
        continue;
      }


      /*
       * 最大攻撃回数。
       */
      if (
        guildUseCount[
          guild
        ] >= attackCount
      ) {
        continue;
      }


      assignment[index] =
        guild;

      guildUseCount[guild]++;


      search(
        index + 1
      );


      guildUseCount[guild]--;

      assignment[index] =
        -1;
    }
  }


  search(0);


  /*
   * 同型パターンを整理。
   *
   * Guild番号の絶対値ではなく、
   * 構造が同じものをまとめる。
   */
  const unique =
    new Map();


  for (
    const pattern of patterns
  ) {

    const normalized =
      generatorNormalizeAssignmentPattern(
        pattern,
        fortressCount,
        attackCount
      );

    const key =
      normalized.join(",");


    if (
      !unique.has(key)
    ) {

      unique.set(
        key,
        pattern
      );
    }
  }


  return [
    ...unique.values()
  ];
}


/* =========================================================
Assignment Normalization
========================================================= */

function generatorNormalizeAssignmentPattern(
  pattern,
  fortressCount,
  attackCount
) {

  const map =
    new Map();

  let next =
    0;

  return pattern.map(
    value => {

      if (
        !map.has(value)
      ) {

        map.set(
          value,
          next++
        );
      }

      return map.get(value);
    }
  );
}


/* =========================================================
Initial Boundary Patterns
========================================================= */

function generatorBuildInitialBoundaries(
  start,
  end,
  fortressCount,
  attackCount,
  timePattern
) {

  const boundaries =
    Array.from(
      {
        length:
          fortressCount
      },
      () => []
    );


  /*
   * Attack Count = 1なら
   * 境界なし。
   */
  if (
    attackCount <= 1
  ) {
    return boundaries;
  }


  /*
   * まず全体時間。
   */
  const totalMinutes =
    generatorMinutesBetween(
      start,
      end
    );


  /*
   * 基本境界位置。
   *
   * balanced:
   *   均等
   *
   * front:
   *   前半を長め
   *
   * back:
   *   後半を長め
   */
  for (
    let fortressIndex = 0;
    fortressIndex < fortressCount;
    fortressIndex++
  ) {

    for (
      let boundaryIndex = 1;
      boundaryIndex < attackCount;
      boundaryIndex++
    ) {

      const baseRatio =
        boundaryIndex /
        attackCount;

      let ratio =
        baseRatio;


      if (
        timePattern ===
        "front"
      ) {

        ratio =
          Math.sqrt(
            baseRatio
          );
      }


      if (
        timePattern ===
        "back"
      ) {

        ratio =
          1 -
          Math.sqrt(
            1 -
            baseRatio
          );
      }


      /*
       * Fortressごとに少しずつ
       * 初期位置をずらす。
       *
       * 最終調整前の候補生成用。
       */
      const spread =
        fortressCount > 1
          ? (
              fortressIndex -
              (
                fortressCount - 1
              ) / 2
            ) *
            0.015
          : 0;


      ratio =
        Math.max(
          0.05,
          Math.min(
            0.95,
            ratio + spread
          )
        );


      const boundary =
        new Date(
          start.getTime() +
          totalMinutes *
          ratio *
          60000
        );


      boundaries[
        fortressIndex
      ].push(
        generatorRoundToStep(
          boundary
        )
      );
    }
  }


  return boundaries;
}


/* =========================================================
Boundary Repair
========================================================= */

function generatorRepairBoundary(
  ideal,
  previous,
  next,
  rangeStart,
  rangeEnd,
  lag
) {

  const candidates = [];

  const step =
    GENERATOR_TIME_STEP *
    60000;


  /*
   * idealの周辺を探索。
   *
   * Lagを利用して動かすため、
   * 最初から範囲全体を総当たりしない。
   */
  for (
    let offset = 0;
    offset <= 24 * 60;
    offset +=
      GENERATOR_TIME_STEP
  ) {

    const offsets =
      offset === 0
        ? [0]
        : [
            -offset,
            offset
          ];


    for (
      const minuteOffset of
        offsets
    ) {

      const candidate =
        new Date(
          ideal.getTime() +
          minuteOffset *
          60000
        );


      if (
        candidate <= previous ||
        candidate >= next
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


      candidates.push(
        candidate
      );
    }


    if (
      candidates.length
    ) {
      break;
    }
  }


  if (
    !candidates.length
  ) {
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


  return candidates[0];
}


/* =========================================================
Assignment / Slot Mapping
========================================================= */

function generatorApplyAssignment(
  slots,
  assignmentPattern
) {

  return slots.map(
    (slot, index) => ({
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
        assignmentPattern[index]
    })
  );
}


/* =========================================================
Guild Totals
========================================================= */

function generatorCalculateGuilds(
  slots,
  guildCount
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


  for (
    const slot of slots
  ) {

    const guild =
      guilds[
        slot.guildIndex
      ];


    if (!guild) {
      continue;
    }


    const minutes =
      generatorMinutesBetween(
        slot.start,
        slot.end
      );


    guild.slots.push(
      slot
    );

    guild.totalMinutes +=
      minutes;
  }


  return guilds;
}


/* =========================================================
Balance Score
========================================================= */

/*
 * ここが今回のGeneratorの中心。
 *
 * 単純な
 *
 *   max - min
 *
 * だけではなく、
 *
 * 「1回しか攻撃していないGuildが
 *  2回攻撃Guildより長く持っている」
 *
 * 場合を強く減点する。
 */

function generatorEvaluateBalance(
  guilds,
  attackCount
) {

  const totals =
    guilds.map(
      guild =>
        guild.totalMinutes
    );


  const max =
    Math.max(...totals);

  const min =
    Math.min(...totals);


  const rangeDifference =
    max - min;


  const singleAttackGuilds =
    guilds.filter(
      guild =>
        guild.slots.length === 1
    );


  const multiAttackGuilds =
    guilds.filter(
      guild =>
        guild.slots.length >= 2
    );


  let singleAttackPenalty = 0;


  /*
   * 2回攻撃Guildが存在する場合、
   * 1回攻撃Guildはそれより長くしない。
   *
   * 平均値を基準にする。
   */
  if (
    singleAttackGuilds.length &&
    multiAttackGuilds.length
  ) {

    const multiAverage =
      multiAttackGuilds.reduce(
        (sum, guild) =>
          sum +
          guild.totalMinutes,
        0
      ) /
      multiAttackGuilds.length;


    for (
      const guild of
        singleAttackGuilds
    ) {

      if (
        guild.totalMinutes >
        multiAverage
      ) {

        singleAttackPenalty +=
          guild.totalMinutes -
          multiAverage;
      }
    }
  }


  /*
   * 1回攻撃Guildが長い状態を
   * かなり強く避ける。
   */
  const score =
    rangeDifference +
    singleAttackPenalty *
    4;


  return {
    score,

    difference:
      rangeDifference,

    singleAttackPenalty,

    max,

    min
  };
}


/* =========================================================
Boundary Optimization
========================================================= */

function generatorOptimizeBoundaries(
  fortressData,
  guildCount,
  attackCount,
  rangeStart,
  rangeEnd,
  lag,
  eventEnd
) {

  let bestSlots =
    fortressData.map(
      item => ({
        fortress:
          item.fortress,

        start:
          generatorCloneDate(
            item.start
          ),

        end:
          generatorCloneDate(
            item.end
          ),

        guildIndex:
          item.guildIndex
      })
    );


  let bestGuilds =
    generatorCalculateGuilds(
      bestSlots,
      guildCount
    );


  let bestBalance =
    generatorEvaluateBalance(
      bestGuilds,
      attackCount
    );


  /*
   * 最大40パス。
   *
   * 各境界を動かし、
   * ギルド総時間が改善する方向を探す。
   */
  for (
    let pass = 0;
    pass < 40;
    pass++
  ) {

    let changed =
      false;


    for (
      let i = 0;
      i < bestSlots.length;
      i++
    ) {

      const left =
        bestSlots[i];


      /*
       * 同じFortress内で
       * 次のslotを探す。
       */
      const right =
        bestSlots.find(
          slot =>
            slot.fortress.label ===
              left.fortress.label &&
            slot.start.getTime() ===
              left.end.getTime()
        );


      if (!right) {
        continue;
      }


      if (
        left.guildIndex ===
        right.guildIndex
      ) {
        continue;
      }


      const current =
        left.end;


      const leftGuild =
        left.guildIndex;

      const rightGuild =
        right.guildIndex;


      const currentBalance =
        bestBalance;


      /*
       * まず、
       * 左→右へ30分動かす。
       */
      const directions =
        [
          -GENERATOR_TIME_STEP,
          GENERATOR_TIME_STEP
        ];


      let localBest =
        null;


      for (
        const delta of
          directions
      ) {

        const candidate =
          new Date(
            current.getTime() +
            delta *
            60000
          );


        if (
          candidate <=
            left.start ||
          candidate >=
            right.end
        ) {
          continue;
        }


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


        const testSlots =
          bestSlots.map(
            slot => ({
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
            })
          );


        const testLeft =
          testSlots[i];


        const testRight =
          testSlots.find(
            slot =>
              slot.fortress.label ===
                testLeft.fortress.label &&
              slot.start.getTime() ===
                testLeft.end.getTime()
          );


        if (!testRight) {
          continue;
        }


        testLeft.end =
          generatorCloneDate(
            candidate
          );

        testRight.start =
          generatorCloneDate(
            candidate
          );


        const testGuilds =
          generatorCalculateGuilds(
            testSlots,
            guildCount
          );


        const testBalance =
          generatorEvaluateBalance(
            testGuilds,
            attackCount
          );


        /*
         * 改善した場合のみ採用。
         */
        if (
          testBalance.score <
          currentBalance.score
        ) {

          if (
            !localBest ||
            testBalance.score <
              localBest.balance.score
          ) {

            localBest = {
              slots:
                testSlots,

              balance:
                testBalance
            };
          }
        }
      }


      if (localBest) {

        bestSlots =
          localBest.slots;

        bestBalance =
          localBest.balance;

        bestGuilds =
          generatorCalculateGuilds(
            bestSlots,
            guildCount
          );

        changed = true;
      }
    }


    if (!changed) {
      break;
    }
  }


  return {
    slots:
      bestSlots,

    guilds:
      bestGuilds,

    balance:
      bestBalance
  };
}


/* =========================================================
Candidate Signature
========================================================= */

function generatorCreateCandidateSignature(
  candidate
) {

  return candidate.slots
    .map(
      slot =>
        [
          slot.fortress.label,
          slot.start.getTime(),
          slot.end.getTime(),
          slot.guildIndex
        ].join(":")
    )
    .sort()
    .join("|");
}


/* =========================================================
Candidate Pattern Name
========================================================= */

function generatorGetPatternName(
  assignment,
  fortressCount,
  attackCount
) {

  const guildFirst =
    assignment
      .filter(
        (_, index) =>
          index %
          attackCount ===
          0
      );


  const guildSecond =
    attackCount >= 2
      ? assignment
          .filter(
            (_, index) =>
              index %
              attackCount ===
              1
          )
      : [];


  const first =
    guildFirst
      .map(
        guild =>
          String.fromCharCode(
            65 + guild
          )
      )
      .join("→");


  const second =
    guildSecond
      .map(
        guild =>
          String.fromCharCode(
            65 + guild
          )
      )
      .join("→");


  if (
    second
  ) {

    return (
      `${first} / ${second}`
    );
  }


  return first;
}


/* =========================================================
Candidate Evaluation
========================================================= */

function generatorEvaluateCandidate(
  start,
  end,
  fortresses,
  assignmentPattern,
  guildCount,
  attackCount,
  rangeStart,
  rangeEnd,
  lag,
  timePattern
) {

  const initialBoundaries =
    generatorBuildInitialBoundaries(
      start,
      end,
      fortresses.length,
      attackCount,
      timePattern
    );


  const baseSlots = [];


  /*
   * 各Fortressの初期slot。
   */
  for (
    let fortressIndex = 0;
    fortressIndex <
      fortresses.length;
    fortressIndex++
  ) {

    const boundaries =
      initialBoundaries[
        fortressIndex
      ];


    const repaired =
      [];


    let previous =
      generatorCloneDate(
        start
      );


    for (
      let boundaryIndex = 0;
      boundaryIndex <
        boundaries.length;
      boundaryIndex++
    ) {

      const ideal =
        boundaries[
          boundaryIndex
        ];


      const next =
        boundaryIndex <
          boundaries.length - 1

          ? boundaries[
              boundaryIndex + 1
            ]

          : end;


      const boundary =
        generatorRepairBoundary(
          ideal,
          previous,
          next,
          rangeStart,
          rangeEnd,
          lag
        );


      if (!boundary) {
        return null;
      }


      repaired.push(
        boundary
      );


      previous =
        boundary;
    }


    const fortressSlots =
      generatorBuildFortressSlots(
        fortresses[
          fortressIndex
        ],
        start,
        end,
        repaired
      );


    if (!fortressSlots) {
      return null;
    }


    baseSlots.push(
      ...fortressSlots
    );
  }


  if (
    baseSlots.length !==
    assignmentPattern.length
  ) {
    return null;
  }


  /*
   * Guildを割り当てる。
   */
  const assignedSlots =
    generatorApplyAssignment(
      baseSlots,
      assignmentPattern
    );


  /*
   * 境界を最適化。
   */
  const optimized =
    generatorOptimizeBoundaries(
      assignedSlots,
      guildCount,
      attackCount,
      rangeStart,
      rangeEnd,
      lag,
      end
    );


  if (!optimized) {
    return null;
  }


  return {

    slots:
      optimized.slots,

    guilds:
      optimized.guilds,

    difference:
      optimized.balance.difference,

    score:
      optimized.balance.score,

    singleAttackPenalty:
      optimized.balance
        .singleAttackPenalty,

    timePattern,

    assignmentPattern:
      [...assignmentPattern],

    patternName:
      generatorGetPatternName(
        assignmentPattern,
        fortresses.length,
        attackCount
      )
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


  /* =======================================================
  Validation
  ======================================================= */

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


  /* =======================================================
  Event
  ======================================================= */

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
    period.start >=
      period.end
  ) {

    throw new Error(
      "Event Period is invalid."
    );
  }


  /* =======================================================
  Fortress Release
  ======================================================= */

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


  /* =======================================================
  First Attack
  ======================================================= */

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


  /* =======================================================
  Fortress
  ======================================================= */

  const fortresses =
    generatorGetFortresses(
      fortressLevel
    );


  if (!fortresses.length) {

    throw new Error(
      `No fortress data found for ${fortressLevel}.`
    );
  }


  /* =======================================================
  Slot Structure
  ======================================================= */

  /*
   * ここが以前と大きく違う。
   *
   * Attack Count = 最大攻撃回数。
   *
   * 3拠点 × 最大2回なら、
   * 最大6slot。
   *
   * 4Guildなら、
   * 6slotを
   *
   * 1 / 2 / 2 / 1
   *
   * のように割り振れる。
   */

  const totalSlots =
    fortresses.length *
    attackCount;


  if (
    totalSlots <
    guildCount
  ) {

    throw new Error(
      "The number of fortresses is not enough to give every guild at least one attack."
    );
  }


  /*
   * 各Guildが最大attackCount回なので、
   * slot総数が多すぎるケースを防ぐ。
   */
  if (
    totalSlots >
    guildCount *
    attackCount
  ) {

    throw new Error(
      "The current Guild Count cannot cover all fortress attacks within the selected maximum Attack Count."
    );
  }


  /* =======================================================
  Assignment Patterns
  ======================================================= */

  const assignmentPatterns =
    generatorBuildAssignmentPatterns(
      fortresses.length,
      guildCount,
      attackCount
    );


  if (
    !assignmentPatterns.length
  ) {

    throw new Error(
      "No valid guild assignment pattern exists with the current Guild Count and maximum Attack Count."
    );
  }


  /* =======================================================
  Boundary Candidate Check
  ======================================================= */

  const boundaryCandidates =
    generatorBuildBoundaryCandidates(
      actualStart,
      period.end,
      rangeStart,
      rangeEnd,
      lag
    );


  /*
   * Attack Count = 1なら境界不要。
   */
  if (
    attackCount > 1 &&
    !boundaryCandidates.length
  ) {

    throw new Error(
      "No valid attack-time boundaries are available within the current Attack Time Range and Allowed Lag."
    );
  }


  /* =======================================================
  Candidate Pool
  ======================================================= */

  const candidatePool = [];


  const timePatterns = [
    "balanced",
    "front",
    "back"
  ];


  /*
   * すべての
   *
   * 時間パターン
   * ×
   * Guild割り当てパターン
   *
   * を候補にする。
   */
  for (
    const timePattern of
      timePatterns
  ) {

    for (
      const assignmentPattern of
        assignmentPatterns
    ) {

      const candidate =
        generatorEvaluateCandidate(
          actualStart,
          period.end,
          fortresses,
          assignmentPattern,
          guildCount,
          attackCount,
          rangeStart,
          rangeEnd,
          lag,
          timePattern
        );


      if (!candidate) {
        continue;
      }


      candidatePool.push(
        candidate
      );
    }
  }


  if (
    !candidatePool.length
  ) {

    throw new Error(
      "No valid schedule could be generated with the current conditions."
    );
  }


  /* =======================================================
  Candidate Sorting
  ======================================================= */

  candidatePool.sort(
    (a, b) => {

      /*
       * まずScore。
       */
      if (
        a.score !==
        b.score
      ) {

        return (
          a.score -
          b.score
        );
      }


      /*
       * 次に総時間差。
       */
      if (
        a.difference !==
        b.difference
      ) {

        return (
          a.difference -
          b.difference
        );
      }


      /*
       * 最後にパターン名。
       */
      return (
        a.patternName <
        b.patternName
      )
        ? -1
        : 1;
    }
  );


  /*
   * 上位候補だけ残す。
   */
  const limitedCandidates =
    candidatePool.slice(
      0,
      GENERATOR_CANDIDATE_POOL_SIZE
    );


  /* =======================================================
  Candidate Selection
  ======================================================= */

  let selectable =
    limitedCandidates;


  /*
   * 直前と同じ候補を避ける。
   */
  const different =
    limitedCandidates.filter(
      candidate =>
        generatorCreateCandidateSignature(
          candidate
        ) !==
        lastGeneratedSignature
    );


  if (
    different.length
  ) {

    selectable =
      different;
  }


  /*
   * Generateを押すたびに、
   * 上位候補を順番に切り替える。
   *
   * 完全ランダムではなく、
   * 「良い候補群の中を巡回」
   * する。
   */
  const index =
    generatorSelectionOffset %
    selectable.length;


  const bestCandidate =
    selectable[index];


  generatorSelectionOffset++;


  lastGeneratedSignature =
    generatorCreateCandidateSignature(
      bestCandidate
    );


  /* =======================================================
  Final Safety Check
  ======================================================= */

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
   * 同一Fortressの重複確認。
   */
  for (
    const fortress of
      fortresses
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


  /* =======================================================
  Guild Groups
  ======================================================= */

  const guildGroups =
    bestCandidate.guilds.map(
      (guild, index) => ({

        name:
          `Guild ${String.fromCharCode(
            65 + index
          )}`,

        index,

        attackCount:
          guild.slots.length,

        slots:
          guild.slots
            .map(
              slot => ({

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
              })
            )
            .sort(
              (a, b) =>
                a.start - b.start
            ),

        totalMinutes:
          guild.totalMinutes
      })
    );


  /* =======================================================
  Calendar Schedules
  ======================================================= */

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

    timePattern:
      bestCandidate.timePattern,

    patternName:
      bestCandidate.patternName,

    guildGroups,

    schedules,

    difference:
      bestCandidate.difference,

    score:
      bestCandidate.score,

    singleAttackPenalty:
      bestCandidate.singleAttackPenalty
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
    `Maximum Attack Count: ${candidate.attackCount}`
  );


  lines.push("");


  lines.push(
    `Pattern: ${candidate.patternName}`
  );


  lines.push(
    `Time Pattern: ${candidate.timePattern}`
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
    `Total Balance Difference: ${
      generatorMinutesToText(
        candidate.difference
      )
    }`
  );


  /*
   * 1回攻撃Guildが
   * 2回攻撃Guild平均を超えた場合の
   * ペナルティ。
   */
  if (
    candidate.singleAttackPenalty >
    0
  ) {

    lines.push(
      `Single-Attack Penalty: ${
        generatorMinutesToText(
          candidate.singleAttackPenalty
        )
      }`
    );
  } else {

    lines.push(
      "Single-Attack Penalty: 0m"
    );
  }


  lines.push("");


  lines.push(
    "Generated Schedule"
  );


  lines.push(
    "------------------"
  );


  candidate.guildGroups.forEach(
    group => {

      lines.push("");


      lines.push(
        `${group.name}  ` +
        `(${group.attackCount} attack${
          group.attackCount === 1
            ? ""
            : "s"
        })`
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
            `  ${index + 1}. ` +
            `${candidate.fortressLevel} ` +
            `${label}  ` +
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
        `  Total: ${
          generatorMinutesToText(
            group.totalMinutes
          )
        }`
      );
    }
  );


  lines.push("");


  lines.push(
    "------------------"
  );


  lines.push(
    `Balance Difference: ${
      generatorMinutesToText(
        candidate.difference
      )
    }`
  );


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

    generatorGoBtn.disabled =
      true;

    generatedCandidate =
      null;


    try {

      generatedCandidate =
        generatorGenerateCandidate();


      generatorDisplayCandidate(
        generatedCandidate
      );


      generatorGoBtn.disabled =
        false;

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
    generatorRestart();
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
         * _generatorGroupは除外。
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
