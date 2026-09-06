// ================================
// Guild Summary
// ================================

function getEventDays() {
  if (typeof EVENT_START_DATE === "undefined" || typeof EVENT_END_DATE === "undefined") {
    return 56;
  }

  const start = new Date(EVENT_START_DATE);
  const end = new Date(EVENT_END_DATE);

  const diff = end - start;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return Math.max(days, 1);
}


function getOccupationDays(schedule) {
  if (!schedule || !schedule.start || !schedule.end) {
    return 0;
  }

  const start = new Date(schedule.start);
  const end = new Date(schedule.end);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }

  const diff = end - start;
  const days = diff / (1000 * 60 * 60 * 24);

  return Math.max(days, 0);
}


function getSummaryLevel(fortress) {
  if (!fortress) {
    return null;
  }

  if (fortress === "Lv1-4") {
    return "Lv4";
  }

  if (
    fortress === "Lv4" ||
    fortress === "Lv5" ||
    fortress === "Lv6" ||
    fortress === "Lv7"
  ) {
    return fortress;
  }

  return null;
}


function formatDays(days) {
  if (days === null || days === undefined || isNaN(days)) {
    return "0";
  }

  const value = Number(days);

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1).replace(/\.0$/, "");
}


// ================================
// Build Guild Summary Data
// ================================

function buildGuildSummary() {
  const guilds = {};

  if (!Array.isArray(schedules)) {
    return [];
  }

  schedules.forEach(schedule => {
    const guildName = schedule.guild?.trim();

    if (!guildName) {
      return;
    }

    if (!guilds[guildName]) {
      guilds[guildName] = {
        guild: guildName,
        league: schedule.league || "—",
        levels: {
          Lv4: {
            count: 0,
            days: 0
          },
          Lv5: {
            count: 0,
            days: 0
          },
          Lv6: {
            count: 0,
            days: 0
          },
          Lv7: {
            count: 0,
            days: 0
          }
        }
      };
    }

    // Guild VS League
    if (schedule.league) {
      guilds[guildName].league = schedule.league;
    }

    const level = getSummaryLevel(schedule.fortress);

    if (!level || !guilds[guildName].levels[level]) {
      return;
    }

    guilds[guildName].levels[level].count += 1;
    guilds[guildName].levels[level].days += getOccupationDays(schedule);
  });

  return Object.values(guilds);
}


// ================================
// Sort
// ================================

function sortGuildSummary(guilds) {
  return guilds.sort((a, b) => {
    const aDays = a.levels?.Lv6?.days || 0;
    const bDays = b.levels?.Lv6?.days || 0;

    if (bDays !== aDays) {
      return bDays - aDays;
    }

    return a.guild.localeCompare(b.guild);
  });
}


// ================================
// Cell Status
// ================================

function getCellStatus(count, days) {
  const restrictionCount =
    typeof RESTRICTION_COUNT !== "undefined"
      ? RESTRICTION_COUNT
      : 3;

  const warningCount =
    typeof WARNING_COUNT !== "undefined"
      ? WARNING_COUNT
      : 2;

  const allianceStandard =
    typeof ALLIANCE_STANDARD !== "undefined"
      ? ALLIANCE_STANDARD
      : 1;

  const averageTolerance =
    typeof AVERAGE_TOLERANCE !== "undefined"
      ? AVERAGE_TOLERANCE
      : 0.5;

  if (count >= restrictionCount) {
    return "restricted";
  }

  if (count >= warningCount) {
    return "warning";
  }

  if (count === 0) {
    return "empty";
  }

  const eventDays = getEventDays();

  if (eventDays > 0) {
    const ratio = days / eventDays;

    if (ratio > allianceStandard) {
      return "warning";
    }

    if (ratio < averageTolerance) {
      return "low";
    }
  }

  return "normal";
}


// ================================
// Total Status
// ================================

function getTotalStatus(total) {
  const fortressLimit =
    typeof TOTAL_FORTRESS_LIMIT !== "undefined"
      ? TOTAL_FORTRESS_LIMIT
      : 6;

  if (total > fortressLimit) {
    return "restricted";
  }

  return "normal";
}


// ================================
// Fortress Capacity
// ================================

function getFortressCapacity(level) {
  const capacity = {
    Lv4: 8,
    Lv5: 4,
    Lv6: 3,
    Lv7: 1
  };

  return capacity[level] || 0;
}


// ================================
// Level Cell
// ================================

function createSummaryLevelCell(levelData) {
  const cell = document.createElement("td");

  const status = getCellStatus(
    levelData.count,
    levelData.days
  );

  cell.classList.add(`summary-status-${status}`);

  const daysWrapper = document.createElement("div");
  daysWrapper.className = "summary-days";

  const daysLabel = document.createElement("span");
  daysLabel.textContent = formatDays(levelData.days);

  const daysUnit = document.createElement("small");
  daysUnit.className = "summary-unit";
  daysUnit.textContent = "d";

  daysWrapper.appendChild(daysLabel);
  daysWrapper.appendChild(daysUnit);

  const basesWrapper = document.createElement("div");
  basesWrapper.className = "summary-bases";

  const basesLabel = document.createElement("span");
  basesLabel.textContent = levelData.count;

  const basesUnit = document.createElement("small");
  basesUnit.className = "summary-unit";
  basesUnit.textContent = "bases";

  basesWrapper.appendChild(basesLabel);
  basesWrapper.appendChild(basesUnit);

  cell.appendChild(daysWrapper);
  cell.appendChild(basesWrapper);

  return cell;
}


// ================================
// Total Cell
// ================================

function createSummaryTotalCell(totalDays, totalBases) {
  const cell = document.createElement("td");

  const status = getTotalStatus(totalBases);

  cell.classList.add("summary-total");

  if (status === "restricted") {
    cell.classList.add("restriction");
  }

  const daysWrapper = document.createElement("div");
  daysWrapper.className = "summary-days";

  const daysLabel = document.createElement("span");
  daysLabel.textContent = formatDays(totalDays);

  const daysUnit = document.createElement("small");
  daysUnit.className = "summary-unit";
  daysUnit.textContent = "d";

  daysWrapper.appendChild(daysLabel);
  daysWrapper.appendChild(daysUnit);

  const basesWrapper = document.createElement("div");
  basesWrapper.className = "summary-bases";

  const basesLabel = document.createElement("span");
  basesLabel.textContent = totalBases;

  const basesUnit = document.createElement("small");
  basesUnit.className = "summary-unit";
  basesUnit.textContent = "bases";

  basesWrapper.appendChild(basesLabel);
  basesWrapper.appendChild(basesUnit);

  cell.appendChild(daysWrapper);
  cell.appendChild(basesWrapper);

  return cell;
}


// ================================
// Render Guild Summary
// ================================

function renderGuildSummary() {
  const table = document.getElementById("summaryTable");

  if (!table) {
    return;
  }

  const guilds = sortGuildSummary(buildGuildSummary());

  const tbody = table.querySelector("tbody");

  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";

  let allianceDays = 0;
  let allianceBases = 0;

  guilds.forEach(guildData => {
    const row = document.createElement("tr");

    // Guild
    const guildCell = document.createElement("td");
    guildCell.className = "summary-guild";
    guildCell.textContent = guildData.guild;

    row.appendChild(guildCell);

    // League
    const leagueCell = document.createElement("td");
    leagueCell.className = "summary-league";
    leagueCell.textContent = guildData.league || "—";

    row.appendChild(leagueCell);

    // Lv4 - Lv7
    if (typeof SUMMARY_LEVELS !== "undefined") {
      SUMMARY_LEVELS.forEach(level => {
        const levelData =
          guildData.levels[level] || {
            count: 0,
            days: 0
          };

        row.appendChild(
          createSummaryLevelCell(levelData)
        );

        allianceDays += levelData.days;
        allianceBases += levelData.count;
      });
    } else {
      ["Lv4", "Lv5", "Lv6", "Lv7"].forEach(level => {
        const levelData =
          guildData.levels[level] || {
            count: 0,
            days: 0
          };

        row.appendChild(
          createSummaryLevelCell(levelData)
        );

        allianceDays += levelData.days;
        allianceBases += levelData.count;
      });
    }

    // Total
    let totalDays = 0;
    let totalBases = 0;

    Object.values(guildData.levels).forEach(levelData => {
      totalDays += levelData.days;
      totalBases += levelData.count;
    });

    row.appendChild(
      createSummaryTotalCell(
        totalDays,
        totalBases
      )
    );

    tbody.appendChild(row);
  });


  // ================================
  // Alliance Total
  // ================================

  const totalRow = document.createElement("tr");
  totalRow.className = "summary-total-row";

  const totalTitleCell = document.createElement("td");
  totalTitleCell.colSpan = 2;
  totalTitleCell.textContent = "Alliance Total";

  totalRow.appendChild(totalTitleCell);

  if (typeof SUMMARY_LEVELS !== "undefined") {
    SUMMARY_LEVELS.forEach(level => {
      let levelDays = 0;
      let levelBases = 0;

      guilds.forEach(guildData => {
        const levelData =
          guildData.levels[level] || {
            count: 0,
            days: 0
          };

        levelDays += levelData.days;
        levelBases += levelData.count;
      });

      const cell = document.createElement("td");

      cell.className = "summary-total-level";

      cell.innerHTML = `
        <div class="summary-days">
          ${formatDays(levelDays)}
          <small class="summary-unit">d</small>
        </div>
        <div class="summary-bases">
          ${levelBases}
          <small class="summary-unit">bases</small>
        </div>
      `;

      totalRow.appendChild(cell);
    });
  } else {
    ["Lv4", "Lv5", "Lv6", "Lv7"].forEach(level => {
      let levelDays = 0;
      let levelBases = 0;

      guilds.forEach(guildData => {
        const levelData =
          guildData.levels[level] || {
            count: 0,
            days: 0
          };

        levelDays += levelData.days;
        levelBases += levelData.count;
      });

      const cell = document.createElement("td");

      cell.className = "summary-total-level";

      cell.innerHTML = `
        <div class="summary-days">
          ${formatDays(levelDays)}
          <small class="summary-unit">d</small>
        </div>
        <div class="summary-bases">
          ${levelBases}
          <small class="summary-unit">bases</small>
        </div>
      `;

      totalRow.appendChild(cell);
    });
  }


  // Alliance Total
  const allianceTotalCell = document.createElement("td");

  allianceTotalCell.className = "summary-total-level";

  allianceTotalCell.innerHTML = `
    <div class="summary-days">
      ${formatDays(allianceDays)}
      <small class="summary-unit">d</small>
    </div>
    <div class="summary-bases">
      ${allianceBases}
      <small class="summary-unit">bases</small>
    </div>
  `;

  totalRow.appendChild(allianceTotalCell);

  tbody.appendChild(totalRow);
}


// ================================
// Summary Preview
// ================================

function updateSummaryPreview(guilds) {
  const guildElement =
    document.getElementById("summaryPreviewGuild");

  const leagueElement =
    document.getElementById("summaryPreviewLeague");

  const daysElement =
    document.getElementById("summaryPreviewDays");

  const basesElement =
    document.getElementById("summaryPreviewBases");

  if (
    !guildElement ||
    !leagueElement ||
    !daysElement ||
    !basesElement
  ) {
    return;
  }

  if (!guilds || guilds.length === 0) {
    guildElement.textContent = "—";
    leagueElement.textContent = "—";
    daysElement.textContent = "0";
    basesElement.textContent = "0";
    return;
  }

  let currentGuild = null;

  if (
    typeof currentGuild !== "undefined" &&
    currentGuild
  ) {
    currentGuild = guilds.find(
      guildData =>
        guildData.guild === currentGuild
    );
  }

  if (!currentGuild && typeof schedules !== "undefined") {
    const latestSchedule =
      schedules
        .filter(schedule => schedule.guild?.trim())
        .slice(-1)[0];

    if (latestSchedule) {
      currentGuild = guilds.find(
        guildData =>
          guildData.guild === latestSchedule.guild.trim()
      );
    }
  }

  if (!currentGuild) {
    currentGuild = guilds[0];
  }

  const lv6 = currentGuild.levels.Lv6 || {
    days: 0,
    count: 0
  };

  guildElement.textContent =
    currentGuild.guild || "—";

  leagueElement.textContent =
    currentGuild.league || "—";

  daysElement.textContent =
    formatDays(lv6.days);

  basesElement.textContent =
    lv6.count;
}


// ================================
// Toggle Summary Table
// ================================

function toggleSummaryTable() {
  const wrapper =
    document.querySelector(".summary-table-wrapper");

  const toggle =
    document.querySelector(".summary-toggle");

  if (!wrapper || !toggle) {
    return;
  }

  const expanded =
    wrapper.classList.toggle("expanded");

  toggle.classList.toggle(
    "expanded",
    expanded
  );
}


