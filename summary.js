/* =========================================================
   Guild Summary
========================================================= */


/*
  Calculate total event duration in days.
*/

function getEventDays() {

  const start =
    new Date(
      `${event.start}T00:00:00Z`
    );

  const end =
    new Date(
      `${event.end}T23:59:59Z`
    );

  const milliseconds =
    end - start;

  return Math.ceil(
    milliseconds
    /
    (24 * 60 * 60 * 1000)
  );

}


/*
  Calculate occupation duration.

  Schedule time outside event range
  is clipped automatically.
*/

function getOccupationDays(schedule) {

  const eventStart =
    new Date(
      `${event.start}T00:00:00Z`
    );

  const eventEnd =
    new Date(
      `${event.end}T23:59:59Z`
    );

  let start =
    new Date(
      schedule.start
    );

  let end =
    new Date(
      schedule.end
    );

  if (start < eventStart) {

    start =
      eventStart;

  }

  if (end > eventEnd) {

    end =
      eventEnd;

  }

  if (end <= start)
    return 0;

  return (
    end - start
  )
  /
  (24 * 60 * 60 * 1000);

}


/*
  Convert current fortress value
  into summary level.

  "Lv1-4" is treated as Lv4.
*/

function getSummaryLevel(fortress) {

  if (
    fortress === "Lv1-4"
  ) {

    return "Lv4";

  }

  if (
    SUMMARY_LEVELS.includes(
      fortress
    )
  ) {

    return fortress;

  }

  return null;

}


/*
  Format decimal occupation days.

  Integer:
    13

  Decimal:
    13.5
*/

function formatDays(days) {

  const rounded =
    Math.round(
      days * 10
    ) / 10;

  if (
    Number.isInteger(
      rounded
    )
  ) {

    return String(
      rounded
    );

  }

  return rounded.toFixed(1);

}


/*
  Aggregate schedules by guild.
*/

function buildGuildSummary() {

  const guilds = {};


  schedules.forEach(
    schedule => {

      const guildName =
        schedule.guild?.trim();

      if (!guildName)
        return;


      const level =
        getSummaryLevel(
          schedule.fortress
        );

      if (!level)
        return;


      if (!guilds[guildName]) {

        guilds[guildName] = {

          guild:
            guildName,

          league:
            schedule.league || "—",

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


      if (
        schedule.league
      ) {

        guilds[guildName].league =
          schedule.league;

      }


      guilds[guildName]
        .levels[level]
        .count += 1;


      guilds[guildName]
        .levels[level]
        .days +=
          getOccupationDays(
            schedule
          );

    }
  );


  return Object.values(
    guilds
  );

}


/* =========================================================
   Summary Sorting
========================================================= */

function sortGuildSummary(guilds) {

  return guilds.sort(
    (a, b) => {

      const daysA =
        a.levels.Lv6.days;

      const daysB =
        b.levels.Lv6.days;


      /*
        Lv6 occupation days descending.
      */

      if (
        daysB !== daysA
      ) {

        return daysB - daysA;

      }


      /*
        If Lv6 is equal,
        sort by guild name.
      */

      return a.guild.localeCompare(
        b.guild,
        undefined,
        {
          sensitivity: "base"
        }
      );

    }
  );

}


/* =========================================================
   Summary Cell Status
========================================================= */

function getCellStatus(
  count,
  days
) {

  const eventDays =
    getEventDays();


  /*
    3+ bases:
    restriction
  */

  if (
    count >=
    RESTRICTION_COUNT
  ) {

    return "restriction";

  }


  /*
    2 bases:
    warning
  */

  if (
    count >=
    WARNING_COUNT
  ) {

    return "warning";

  }


  /*
    No occupation.
  */

  if (
    count === 0
  ) {

    return "empty";

  }


  /*
    Occupation days are judged
    against the event duration.

    1 base:
      > 100% = warning
      < 80% = low
      otherwise normal
  */

  const ratio =
    days / eventDays;


  if (
    ratio >
    ALLIANCE_STANDARD
  ) {

    return "warning";

  }


  if (
    ratio <
    AVERAGE_TOLERANCE
  ) {

    return "low";

  }


  return "normal";

}


/* =========================================================
   Total Status
========================================================= */

function getTotalStatus(total) {

  /*
    6 is allowed.
    Only over 6 is restricted.
  */

  if (
    total >
    TOTAL_FORTRESS_LIMIT
  ) {

    return "restriction";

  }

  return "normal";

}


/* =========================================================
   Fortress Capacity
========================================================= */

function getFortressCapacity(level) {

  return (
    FORTRESS_CAPACITY[level]
    ??
    0
  );

}


/* =========================================================
   Create Summary Level Cell
========================================================= */

function createSummaryLevelCell(
  levelData
) {

  const td =
    document.createElement(
      "td"
    );


  const status =
    getCellStatus(
      levelData.count,
      levelData.days
    );


  td.className =
    `summary-status-${status}`;


  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "summary-level";


  /*
    Primary:
    occupation days
  */

  const days =
    document.createElement(
      "strong"
    );

  days.className =
    "summary-days";

  days.textContent =
    formatDays(
      levelData.days
    );


  /*
    Tiny unit
  */

  const daysLabel =
    document.createElement(
      "small"
    );

  daysLabel.className =
    "summary-unit";

  daysLabel.textContent =
    "days";


  /*
    Secondary:
    occupied bases
  */

  const bases =
    document.createElement(
      "span"
    );

  bases.className =
    "summary-bases";

  bases.textContent =
    levelData.count;


  /*
    Tiny unit
  */

  const basesLabel =
    document.createElement(
      "small"
    );

  basesLabel.className =
    "summary-unit";

  basesLabel.textContent =
    "bases";


  wrapper.appendChild(
    days
  );

  wrapper.appendChild(
    daysLabel
  );

  wrapper.appendChild(
    bases
  );

  wrapper.appendChild(
    basesLabel
  );


  td.appendChild(
    wrapper
  );


  return td;

}


/* =========================================================
   Create Summary Total Cell
========================================================= */

function createSummaryTotalCell(
  totalDays,
  totalBases
) {

  const td =
    document.createElement(
      "td"
    );


  const status =
    getTotalStatus(
      totalBases
    );


  td.className =
    `summary-status-${status} summary-total`;


  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "summary-level";


  const days =
    document.createElement(
      "strong"
    );

  days.className =
    "summary-days";

  days.textContent =
    formatDays(
      totalDays
    );


  const daysLabel =
    document.createElement(
      "small"
    );

  daysLabel.className =
    "summary-unit";

  daysLabel.textContent =
    "days";


  const bases =
    document.createElement(
      "span"
    );

  bases.className =
    "summary-bases";

  bases.textContent =
    totalBases;


  const basesLabel =
    document.createElement(
      "small"
    );

  basesLabel.className =
    "summary-unit";

  basesLabel.textContent =
    "bases";


  wrapper.appendChild(
    days
  );

  wrapper.appendChild(
    daysLabel
  );

  wrapper.appendChild(
    bases
  );

  wrapper.appendChild(
    basesLabel
  );


  td.appendChild(
    wrapper
  );


  return td;

}


/* =========================================================
   Render Guild Summary
========================================================= */

function renderGuildSummary() {

  const tbody =
    document.getElementById(
      "summaryTableBody"
    );

  const tfoot =
    document.getElementById(
      "summaryTableFoot"
    );


  if (
    !tbody ||
    !tfoot
  ) {

    return;

  }


  tbody.innerHTML =
    "";

  tfoot.innerHTML =
    "";


  let guilds =
    buildGuildSummary();


  guilds =
    sortGuildSummary(
      guilds
    );


  /* -------------------------------------------------------
     Guild rows
  ------------------------------------------------------- */

  guilds.forEach(
    guild => {

      const row =
        document.createElement(
          "tr"
        );


      /*
        Guild
      */

      const guildCell =
        document.createElement(
          "td"
        );

      guildCell.className =
        "summary-guild";

      guildCell.textContent =
        guild.guild;

      row.appendChild(
        guildCell
      );


      /*
        League
      */

      const leagueCell =
        document.createElement(
          "td"
        );

      leagueCell.className =
        "summary-league";

      leagueCell.textContent =
        guild.league;

      row.appendChild(
        leagueCell
      );


      /*
        Lv4 - Lv7
      */

      SUMMARY_LEVELS.forEach(
        level => {

          const data =
            guild.levels[
              level
            ];

          row.appendChild(
            createSummaryLevelCell(
              data
            )
          );

        }
      );


      /*
        Total
      */

      let totalDays = 0;

      let totalBases = 0;


      SUMMARY_LEVELS.forEach(
        level => {

          totalDays +=
            guild.levels[
              level
            ].days;

          totalBases +=
            guild.levels[
              level
            ].count;

        }
      );


      row.appendChild(
        createSummaryTotalCell(
          totalDays,
          totalBases
        )
      );


      tbody.appendChild(
        row
      );

    }
  );


  /* -------------------------------------------------------
     Alliance Total Row
  ------------------------------------------------------- */

  const totalRow =
    document.createElement(
      "tr"
    );

  totalRow.className =
    "summary-total-row";


  const label =
    document.createElement(
      "td"
    );

  label.colSpan =
    2;

  label.textContent =
    "Alliance Total";

  totalRow.appendChild(
    label
  );


  SUMMARY_LEVELS.forEach(
    level => {

      let totalDays = 0;

      let totalBases = 0;


      guilds.forEach(
        guild => {

          totalDays +=
            guild.levels[
              level
            ].days;

          totalBases +=
            guild.levels[
              level
            ].count;

        }
      );


      const maxBases =
        getFortressCapacity(
          level
        );


      const td =
        document.createElement(
          "td"
        );


      const status =
        totalBases >
        maxBases
          ? "restriction"
          : "";


      if (status) {

        td.classList.add(
          status
        );

      }


      td.innerHTML = `

        <div class="summary-total-level">

          <strong class="summary-days">
            ${formatDays(totalDays)}
          </strong>

          <small class="summary-unit">
            days
          </small>

          <span class="summary-ratio">
            ${totalBases}/${maxBases}
          </span>

        </div>

      `;


      totalRow.appendChild(
        td
      );

    }
  );


  /*
    Alliance grand total
  */

  let allianceDays = 0;

  let allianceBases = 0;


  guilds.forEach(
    guild => {

      SUMMARY_LEVELS.forEach(
        level => {

          allianceDays +=
            guild.levels[
              level
            ].days;

          allianceBases +=
            guild.levels[
              level
            ].count;

        }
      );

    }
  );


  const allianceTotalCell =
    createSummaryTotalCell(
      allianceDays,
      allianceBases
    );


  totalRow.appendChild(
    allianceTotalCell
  );


  tfoot.appendChild(
    totalRow
  );


  updateSummaryPreview(
    guilds
  );

}


/* =========================================================
   Compact Summary Preview
========================================================= */

function updateSummaryPreview(
  guilds
) {

  const guildElement =
    document.getElementById(
      "summaryPreviewGuild"
    );

  const leagueElement =
    document.getElementById(
      "summaryPreviewLeague"
    );

  const daysElement =
    document.getElementById(
      "summaryPreviewDays"
    );

  const basesElement =
    document.getElementById(
      "summaryPreviewBases"
    );


  if (
    !guildElement
  ) {

    return;

  }


  /*
    Primary selection:
    current guild saved on this device.
  */

  let targetGuild =
    guilds.find(
      guild =>
        guild.guild
        ===
        currentGuild
    );


  /*
    If currentGuild is not available,
    find the guild of a schedule
    created by this user.
  */

  if (!targetGuild) {

    const ownSchedules =
      schedules
        .filter(
          schedule =>
            schedule.creatorId
            ===
            creatorId
        )
        .sort(
          (a, b) =>
            new Date(b.start)
            -
            new Date(a.start)
        );


    if (
      ownSchedules.length > 0
    ) {

      targetGuild =
        guilds.find(
          guild =>
            guild.guild
            ===
            ownSchedules[0].guild
        );

    }

  }


  /*
    Final fallback:
    first available guild.
  */

  if (
    !targetGuild
    &&
    guilds.length > 0
  ) {

    targetGuild =
      guilds[0];

  }


  if (!targetGuild) {

    guildElement.textContent =
      "Guild";

    if (leagueElement) {

      leagueElement.textContent =
        "—";

    }

    if (daysElement) {

      daysElement.textContent =
        "0";

    }

    if (basesElement) {

      basesElement.textContent =
        "0";

    }

    return;

  }


  guildElement.textContent =
    targetGuild.guild;


  if (leagueElement) {

    leagueElement.textContent =
      targetGuild.league;

  }


  /*
    Collapsed preview focuses on Lv6,
    because Lv6 is the negotiation objective.
  */

  const lv6 =
    targetGuild.levels.Lv6;


  if (daysElement) {

    daysElement.textContent =
      formatDays(
        lv6.days
      );

  }


  if (basesElement) {

    basesElement.textContent =
      lv6.count;

  }

}


/* =========================================================
   Summary Toggle
========================================================= */

let summaryExpanded =
  false;


function toggleSummaryTable() {

  summaryExpanded =
    !summaryExpanded;


  const wrapper =
    document.getElementById(
      "summaryTableWrapper"
    );

  const button =
    document.getElementById(
      "summaryToggle"
    );


  if (
    !wrapper ||
    !button
  ) {

    return;

  }


  wrapper.classList.toggle(
    "expanded",
    summaryExpanded
  );


  button.classList.toggle(
    "expanded",
    summaryExpanded
  );


  button.setAttribute(
    "aria-expanded",
    String(
      summaryExpanded
    )
  );

}


document
  .getElementById(
    "summaryToggle"
  )
  ?.addEventListener(
    "click",
    toggleSummaryTable
  );



/* =========================================================
   Initial
========================================================= */

setupColorPalette();

updateLanguage();

updateCurrentTime();

loadSchedules();
