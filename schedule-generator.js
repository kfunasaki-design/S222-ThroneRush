/* =========================================================
S222 Throne Rush
Schedule Generator
========================================================= */

const generatorFortress = document.getElementById("generatorFortress");
const generatorGuildCount = document.getElementById("generatorGuildCount");
const generatorAttackCount = document.getElementById("generatorAttackCount");
const generatorFirstAttack = document.getElementById("generatorFirstAttack");
const generatorRangeStart = document.getElementById("generatorRangeStart");
const generatorRangeEnd = document.getElementById("generatorRangeEnd");
const generatorLag = document.getElementById("generatorLag");
const generatorGenerateBtn = document.getElementById("generatorGenerateBtn");
const generatorResult = document.getElementById("generatorResult");
const generatorGoBtn = document.getElementById("generatorGoBtn");

let generatedCandidate = null;


/* =========================================================
Utilities
========================================================= */

function generatorParseTime(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}


function generatorFormatDateTime(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");

  return `${y}-${m}-${d}T${h}:${min}:00+00:00`;
}


function generatorFormatDisplay(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");

  return `${m}/${d} ${h}:${min}`;
}


function generatorMinutesBetween(start, end) {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}


function generatorCloneDate(date) {
  return new Date(date.getTime());
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
    typeof window.s222ReleaseDates !== "undefined" &&
    window.s222ReleaseDates
  ) {
    const value = window.s222ReleaseDates[level];

    if (value) {
      return new Date(value);
    }
  }

  return null;
}


/*
 * Generator start:
 *   Event Start
 *   ↓
 *   Level Release
 *
 * Lv5/Lv6/Lv7 のReleaseが設定されている場合は、
 * そのRelease以降から生成する。
 */
function generatorGetStartDate(level, eventStart) {
  const release = generatorGetReleaseDate(level);

  if (
    release &&
    !Number.isNaN(release.getTime()) &&
    release > eventStart
  ) {
    return release;
  }

  return generatorCloneDate(eventStart);
}


/* =========================================================
Fortress
========================================================= */

function generatorGetFortresses(level) {
  if (
    typeof FORTRESS_COORDINATES === "undefined" ||
    !FORTRESS_COORDINATES[level]
  ) {
    return [];
  }

  return FORTRESS_COORDINATES[level].map((fortress) => ({
    level,
    label: fortress.label,
    x: fortress.x,
    y: fortress.y
  }));
}


/* =========================================================
Allowed start time
========================================================= */

/*
 * Attack Time Range は GMT の時刻範囲。
 *
 * 例:
 *   02:00 - 00:00
 *
 * のような日跨ぎも許可する。
 */
function generatorIsAllowedStart(date, rangeStart, rangeEnd) {
  const current =
    date.getUTCHours() * 60 +
    date.getUTCMinutes();

  const start = generatorParseTime(rangeStart);
  const end = generatorParseTime(rangeEnd);

  if (start === end) {
    return true;
  }

  if (start < end) {
    return current >= start && current <= end;
  }

  // 日跨ぎ
  return current >= start || current <= end;
}


/*
 * 直前の時刻を Attack Time Range に合わせる。
 *
 * 基本は「そのまま」。
 * 範囲外の場合だけ近い境界へ寄せる。
 */
function generatorSnapToAllowedStart(
  date,
  rangeStart,
  rangeEnd,
  lag
) {
  if (generatorIsAllowedStart(date, rangeStart, rangeEnd)) {
    return generatorCloneDate(date);
  }

  const result = generatorCloneDate(date);

  const startMinutes = generatorParseTime(rangeStart);
  const endMinutes = generatorParseTime(rangeEnd);
  const currentMinutes =
    result.getUTCHours() * 60 +
    result.getUTCMinutes();

  const candidates = [];

  function addCandidate(dayOffset, minutes) {
    const candidate = generatorCloneDate(result);

    candidate.setUTCDate(
      candidate.getUTCDate() + dayOffset
    );

    candidate.setUTCHours(
      Math.floor(minutes / 60),
      minutes % 60,
      0,
      0
    );

    if (candidate >= result) {
      candidates.push(candidate);
    }
  }

  /*
   * 範囲開始・終了を候補にする。
   * Allowed Lag の範囲内なら優先的に使用。
   */

  for (const dayOffset of [0, 1]) {
    addCandidate(dayOffset, startMinutes);
    addCandidate(dayOffset, endMinutes);
  }

  if (!candidates.length) {
    return result;
  }

  candidates.sort(
    (a, b) =>
      Math.abs(a.getTime() - result.getTime()) -
      Math.abs(b.getTime() - result.getTime())
  );

  const nearest = candidates[0];

  if (
    Math.abs(nearest.getTime() - result.getTime()) <=
    lag * 60000
  ) {
    return nearest;
  }

  /*
   * Allowed Lag を超える場合は、
   * 次に到達できる範囲開始時刻へ送る。
   */
  return nearest;
}


/* =========================================================
Candidate construction
========================================================= */

/*
 * 重要:
 *
 * 「1回ごとの時間を均等化」しない。
 *
 * 全砦の時間を一本の占領枠として扱い、
 * 必要なスロット数へ分割。
 *
 * その後、各スロットをギルドへ割り当て、
 * ギルド累計時間だけを均等化する。
 */


/*
 * 各砦に必要な分割数を決める。
 *
 * できるだけ均等に分散する。
 */
function generatorBuildFortressSlotCounts(
  fortressCount,
  totalSlots
) {
  const counts = Array(fortressCount).fill(
    Math.floor(totalSlots / fortressCount)
  );

  let remainder =
    totalSlots % fortressCount;

  let index = 0;

  while (remainder > 0) {
    counts[index]++;
    index++;
    remainder--;

    if (index >= fortressCount) {
      index = 0;
    }
  }

  return counts;
}


/*
 * 砦1本を slotCount 個に分割する。
 *
 * 境界はまず理想値で作り、
 * その後 Attack Time Range に合わせる。
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
    generatorMinutesBetween(start, end);

  if (totalMinutes <= slotCount) {
    return null;
  }

  const rawBoundaries = [];

  for (let i = 1; i < slotCount; i++) {
    const ratio = i / slotCount;

    const boundary =
      start.getTime() +
      totalMinutes * ratio * 60000;

    rawBoundaries.push(
      new Date(boundary)
    );
  }

  const boundaries = [];

  for (const raw of rawBoundaries) {
    const snapped = generatorSnapToAllowedStart(
      raw,
      rangeStart,
      rangeEnd,
      lag
    );

    boundaries.push(snapped);
  }

  /*
   * 境界が逆転・同一化した場合は、
   * まず理想境界へ戻す。
   *
   * 「最終境界だけで無理矢理帳尻合わせ」
   * は避ける。
   */
  for (let i = 0; i < boundaries.length; i++) {
    const previous =
      i === 0
        ? start
        : boundaries[i - 1];

    if (boundaries[i] <= previous) {
      boundaries[i] =
        rawBoundaries[i];
    }
  }

  /*
   * 最終チェック
   */
  for (let i = 0; i < boundaries.length; i++) {
    const previous =
      i === 0
        ? start
        : boundaries[i - 1];

    if (boundaries[i] <= previous) {
      return null;
    }
  }

  const finalEnd = generatorCloneDate(end);

  const result = [];

  let cursor = generatorCloneDate(start);

  for (const boundary of boundaries) {
    if (boundary <= cursor || boundary >= finalEnd) {
      return null;
    }

    result.push({
      fortress,
      start: generatorCloneDate(cursor),
      end: generatorCloneDate(boundary)
    });

    cursor = generatorCloneDate(boundary);
  }

  if (finalEnd <= cursor) {
    return null;
  }

  result.push({
    fortress,
    start: generatorCloneDate(cursor),
    end: finalEnd
  });

  return result;
}


/* =========================================================
Guild balancing
========================================================= */

/*
 * 各 slot を「現在の累計が少ないギルド」へ入れる。
 *
 * ただし各ギルドの Attack Count を厳守する。
 */
function generatorAssignGuilds(
  slots,
  guildCount,
  attackCount
) {
  const guilds = [];

  for (let i = 0; i < guildCount; i++) {
    guilds.push({
      index: i,
      count: 0,
      totalMinutes: 0
    });
  }

  /*
   * 長いslotから割り当てる。
   *
   * これで長時間枠が一部のギルドに偏りにくい。
   */
  const sortedSlots = [...slots].sort(
    (a, b) => {
      const aMinutes =
        generatorMinutesBetween(
          a.start,
          a.end
        );

      const bMinutes =
        generatorMinutesBetween(
          b.start,
          b.end
        );

      return bMinutes - aMinutes;
    }
  );

  for (const slot of sortedSlots) {
    const candidates = guilds
      .filter(
        guild =>
          guild.count < attackCount
      )
      .sort(
        (a, b) =>
          a.totalMinutes -
          b.totalMinutes
      );

    if (!candidates.length) {
      return null;
    }

    const guild = candidates[0];

    const minutes =
      generatorMinutesBetween(
        slot.start,
        slot.end
      );

    guild.count++;
    guild.totalMinutes += minutes;

    slot.guildIndex = guild.index;
  }

  /*
   * Attack Count を満たしているか確認
   */
  if (
    guilds.some(
      guild =>
        guild.count !== attackCount
    )
  ) {
    return null;
  }

  return {
    slots: sortedSlots,
    guilds
  };
}


/* =========================================================
Candidate scoring
========================================================= */

function generatorGetBalance(assignments) {
  const totals =
    assignments.guilds.map(
      guild => guild.totalMinutes
    );

  const max = Math.max(...totals);
  const min = Math.min(...totals);

  return {
    max,
    min,
    difference: max - min
  };
}


/* =========================================================
Generate
========================================================= */

function generatorGenerateCandidate() {
  const fortressLevel =
    generatorFortress.value;

  const guildCount =
    Number(generatorGuildCount.value);

  const attackCount =
    Number(generatorAttackCount.value);

  const firstAttack =
    generatorFirstAttack.value;

  const rangeStart =
    generatorRangeStart.value;

  const rangeEnd =
    generatorRangeEnd.value;

  const lag =
    Number(generatorLag.value);

  if (!fortressLevel) {
    throw new Error(
      "Please select a Fortress Level."
    );
  }

  if (
    !Number.isInteger(guildCount) ||
    guildCount < 1
  ) {
    throw new Error(
      "Please enter a valid Guild Count."
    );
  }

  if (
    !Number.isInteger(attackCount) ||
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

  if (!rangeStart || !rangeEnd) {
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

  const period =
    generatorGetEventPeriod();

  if (!period) {
    throw new Error(
      "Event Period is not available."
    );
  }

  if (
    Number.isNaN(period.start.getTime()) ||
    Number.isNaN(period.end.getTime()) ||
    period.start >= period.end
  ) {
    throw new Error(
      "Event Period is invalid."
    );
  }

  const releaseStart =
    generatorGetStartDate(
      fortressLevel,
      period.start
    );

  if (releaseStart >= period.end) {
    throw new Error(
      "Fortress Release is after the Event Period."
    );
  }

  /*
   * First Attack の時刻を Release 日へ設定。
   */
  const firstMinutes =
    generatorParseTime(firstAttack);

  const firstStart =
    generatorCloneDate(releaseStart);

  firstStart.setUTCHours(
    Math.floor(firstMinutes / 60),
    firstMinutes % 60,
    0,
    0
  );

  /*
   * Release時刻より前に戻ってしまった場合は翌日。
   */
  if (firstStart < releaseStart) {
    firstStart.setUTCDate(
      firstStart.getUTCDate() + 1
    );
  }

  const actualStart =
    firstStart > period.start
      ? firstStart
      : period.start;

  if (actualStart >= period.end) {
    throw new Error(
      "First Attack is outside the Event Period."
    );
  }

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
   * 必要な占領枠数
   */
  const totalSlots =
    guildCount * attackCount;

  /*
   * 砦ごとの分割数
   */
  const slotCounts =
    generatorBuildFortressSlotCounts(
      fortresses.length,
      totalSlots
    );

  /*
   * 全砦を分割
   */
  const allSlots = [];

  for (
    let i = 0;
    i < fortresses.length;
    i++
  ) {
    const slots =
      generatorSplitFortress(
        fortresses[i],
        actualStart,
        period.end,
        slotCounts[i],
        rangeStart,
        rangeEnd,
        lag
      );

    if (!slots) {
      throw new Error(
        `Could not create valid occupation slots for ${fortresses[i].label}.`
      );
    }

    allSlots.push(...slots);
  }

  if (
    allSlots.length !== totalSlots
  ) {
    throw new Error(
      `Generated ${allSlots.length} slots, but ${totalSlots} are required.`
    );
  }

  /*
   * Guild Count × Attack Count に割り当て
   */
  const assignments =
    generatorAssignGuilds(
      allSlots,
      guildCount,
      attackCount
    );

  if (!assignments) {
    throw new Error(
      "Could not balance the generated slots."
    );
  }

  /*
   * 最終安全チェック
   */
  for (const slot of assignments.slots) {
    if (
      slot.start < actualStart ||
      slot.end > period.end ||
      slot.start >= slot.end
    ) {
      throw new Error(
        "Generated schedule exceeds the Event Period."
      );
    }
  }

  /*
   * 同じ砦の重複チェック
   */
  for (const fortress of fortresses) {
    const fortressSlots =
      assignments.slots
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
      i < fortressSlots.length;
      i++
    ) {
      const previous =
        fortressSlots[i - 1];

      const current =
        fortressSlots[i];

      if (
        current.start <
        previous.end
      ) {
        throw new Error(
          `Fortress ${fortress.label} has overlapping schedules.`
        );
      }
    }
  }

  const balance =
    generatorGetBalance(
      assignments
    );

  /*
   * Calendar用データ
   */
  const schedules =
    assignments.slots
      .map(slot => ({
        league:
          fortressLevel === "Lv7"
            ? "Gold"
            : fortressLevel === "Lv6"
              ? "Silver"
              : "Bronze",

        fortress:
          fortressLevel,

        x: slot.fortress.x,
        y: slot.fortress.y,

        guild: "仮ギルド",

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

        guildIndex:
          slot.guildIndex
      }))
      .sort(
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
    schedules,
    balance
  };
}


/* =========================================================
Result Display
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
    `Total Balance Difference: ${candidate.balance.difference} min`
  );

  lines.push("");

  lines.push("Generated Schedule");
  lines.push("------------------");

  candidate.schedules.forEach(
    (schedule, index) => {
      const label =
        getCoordinateLabel(
          candidate.fortressLevel,
          schedule.x,
          schedule.y
        );

      lines.push(
        `${index + 1}. ${candidate.fortressLevel} ${label}  ` +
        `${generatorFormatDisplay(
          new Date(schedule.start)
        )} - ` +
        `${generatorFormatDisplay(
          new Date(schedule.end)
        )}`
      );
    }
  );

  generatorResult.textContent =
    lines.join("\n");
}


/* =========================================================
Generate Button
========================================================= */

generatorGenerateBtn.addEventListener(
  "click",
  () => {
    generatorResult.textContent = "";
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

      generatorResult.textContent =
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
      generatorGoBtn.disabled = true;

      /*
       * 生成結果をそのままカレンダーへ登録。
       *
       * insertSchedule() の既存チェックを通す。
       */
      for (
        const schedule
        of generatedCandidate.schedules
      ) {
        await insertSchedule(schedule);
      }

      generatorResult.textContent +=
        "\n\n✓ Schedule imported.";

      generatedCandidate = null;

    } catch (error) {
      console.error(
        "Schedule Generator GO:",
        error
      );

      generatorResult.textContent +=
        `\n\nImport failed: ${
          error.message ||
          "Unknown error."
        }`;

    } finally {
      generatorGoBtn.disabled = true;
    }
  }
);
