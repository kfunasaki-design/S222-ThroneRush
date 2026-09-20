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


/* =========================================================
Constants
========================================================= */

/*
 * Generatorでは、ゲーム上の細かい攻撃時刻を
 * 30分単位で扱う。
 *
 * 目的は「分単位の完璧な数字」ではなく、
 * 実際に運用しやすい基準時間を作ること。
 */
const GENERATOR_TIME_STEP = 30;


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

/*
 * 時刻だけを分単位で取得。
 *
 * 日跨ぎ:
 *   21:00 - 02:00
 *
 * も許可。
 */

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

  /*
   * Allowed Lagを含めて判定。
   */
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


/*
 * 境界時刻を30分単位に丸める。
 */
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


/*
 * 指定された理想境界に最も近い
 * Attack Range内の時刻を探す。
 *
 * ただし、完全に範囲内へ入れるための
 * 調整が大きすぎる場合は、
 * Allowed Lagを含めた範囲内で最も近い
 * 時刻を採用する。
 */
function generatorSnapBoundary(
  ideal,
  rangeStart,
  rangeEnd,
  lag
) {
  const candidates = [];

  /*
   * ideal周辺の日付について
   * rangeStart / rangeEnd を候補にする。
   */
  const startMinutes =
    generatorParseTime(
      rangeStart
    );

  const endMinutes =
    generatorParseTime(
      rangeEnd
    );

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

  /*
   * ideal自身が範囲内なら、それを優先。
   */
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

/*
 * totalSlots個を fortressCount個の砦へ
 * 1個以上ずつ割り当てる全パターンを作る。
 *
 * 例:
 *   8枠 / 3砦
 *
 *   1,1,6
 *   1,2,5
 *   1,3,4
 *   ...
 *   3,3,2
 *   ...
 */

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


/*
 * 1本の砦を指定数のslotへ分割。
 */
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

  /*
   * まず等分。
   */
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

  /*
   * 境界の順序を確認。
   */
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

/*
 * slotをGuild A/B/C/Dへ割り当てる。
 *
 * 各GuildはAttack Count個。
 *
 * ギルド名そのものには意味がないので、
 * 同じ構成の重複パターンは除外する。
 */

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

  /*
   * 探索順を長いslotからにする。
   */
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
      /*
       * 全Guildの枠数確認。
       */
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

      /*
       * Guildごとの最大差を最優先。
       */
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

    /*
     * 同じ条件のGuildへの割当重複を避ける。
     */
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

      /*
       * 現在の状態が同じGuildは
       * 一度だけ試す。
       */
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

      /*
       * 明らかに現時点で
       * bestより悪い場合でも、
       * 後続slotで変化するため
       * 完全には切らない。
       */
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

/*
 * Guild AとGuild Bの累計差を利用して、
 * 境界を動かす。
 *
 * 境界の左側Guildに時間を与えるか、
 * 右側Guildから時間を奪うかを調整。
 *
 * これを何度か繰り返す。
 */

function generatorOptimizeBoundaries(
  slots,
  assignment,
  rangeStart,
  rangeEnd,
  lag,
  eventEnd
) {
  /*
   * 元slotを直接変更する。
   */
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

  /*
   * 砦ごとに処理。
   */
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

        /*
         * 同じGuildなら境界を動かしても
         * Guild合計差は変わらない。
         */
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

        /*
         * 左が短ければ境界を後ろへ。
         * 左が長ければ前へ。
         */
        let delta =
          (
            rightTotal -
            leftTotal
          ) / 2;

        /*
         * 30分単位。
         */
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

        /*
         * 最低30分のslotを確保。
         */
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

        /*
         * Event Endを越えない。
         */
        if (
          candidate >=
          eventEnd
        ) {
          continue;
        }

        /*
         * Attack Rangeを確認。
         */
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

        /*
         * 境界移動。
         */
        left.end =
          generatorCloneDate(
            candidate
          );

        right.start =
          generatorCloneDate(
            candidate
          );

        /*
         * assignmentの累計も更新。
         */
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
  /*
   * まず割当を探す。
   */
  const assignment =
    generatorFindBestAssignment(
      slots,
      guildCount,
      attackCount
    );

  if (!assignment) {
    return null;
  }

  /*
   * 境界を調整。
   */
  const optimizedSlots =
    generatorOptimizeBoundaries(
      slots,
      assignment.guilds,
      rangeStart,
      rangeEnd,
      lag,
      eventEnd
    );

  /*
   * 境界変更後、もう一度最適割当。
   */
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

    if (
      !bestCandidate ||
      evaluated.difference <
        bestCandidate.difference
    ) {
      bestCandidate =
        evaluated;
    }

    /*
     * 0分差なら完全均等。
     * これ以上探す必要なし。
     */
    if (
      evaluated.difference === 0
    ) {
      break;
    }
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

            /*
             * Generator内部だけで使用。
             * GO時にはcalendar側へ渡さない。
             */
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
   * generatorResultはtextareaなので
   * textContentではなくvalueを使用。
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

    /*
     * generatorResultはtextarea。
     */
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
