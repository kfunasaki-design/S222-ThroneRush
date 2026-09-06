// ================================
// Guild Summary
// ================================


/* =========================================================
   Settings
========================================================= */

const SUMMARY_LEVELS = [
  "Lv4",
  "Lv5",
  "Lv6",
  "Lv7"
];

const SUMMARY_AVERAGE_TOLERANCE = 0.25;


/* =========================================================
   Event Days
========================================================= */

function getEventDays() {

  if (
    typeof event === "undefined"
    ||
    !event.start
    ||
    !event.end
  ) {

    return 56;

  }


  const start =
    new Date(
      `${event.start}T00:00:00Z`
    );

  const end =
    new Date(
      `${event.end}T00:00:00Z`
    );


  if (
    Number.isNaN(
      start.getTime()
    )
    ||
    Number.isNaN(
      end.getTime()
    )
  ) {

    return 56;

  }


  const diff =
    end - start;


  const days =
    diff /
    (
      1000
      *
      60
      *
      60
      *
      24
    );


  return Math.max(
    days,
    1
  );

}


/* =========================================================
   Occupation Days
========================================================= */

function getSummaryOccupationDays(
  schedule
) {

  if (
    !schedule
    ||
    !schedule.start
    ||
    !schedule.end
  ) {

    return 0;

  }


  const start =
    new Date(
      schedule.start
    );

  const end =
    new Date(
      schedule.end
    );


  if (
    Number.isNaN(
      start.getTime()
    )
    ||
    Number.isNaN(
      end.getTime()
    )
  ) {

    return 0;

  }


  const diff =
    end - start;


  return Math.max(
    diff /
    (
      1000
      *
      60
      *
      60
      *
      24
    ),
    0
  );

}


/* =========================================================
   Summary Level
========================================================= */

function getSummaryLevel(
  fortress
) {

  if (
    !fortress
  ) {

    return null;

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


/* =========================================================
   Format Days
========================================================= */

function formatSummaryDays(
  days
) {

  if (
    days === null
    ||
    days === undefined
    ||
    Number.isNaN(
      Number(days)
    )
  ) {

    return "0";

  }


  const value =
    Number(days);


  if (
    Number.isInteger(
      value
    )
  ) {

    return String(value);

  }


  return value
    .toFixed(1)
    .replace(
      /\.0$/,
      ""
    );

}


/* =========================================================
   Build Guild Summary
========================================================= */

function buildGuildSummary() {

  const guilds = {};


  if (
    !Array.isArray(
      schedules
    )
  ) {

    return [];

  }


  schedules.forEach(
    schedule => {

      const guildName =
        schedule.guild
          ?.trim();


      if (
        !guildName
      ) {

        return;

      }


      if (
        !guilds[guildName]
      ) {

        guilds[guildName] = {

          guild:
            guildName,

          league:
            schedule.league
            ||
            "—",

          levels: {

            Lv4: {
              days: 0
            },

            Lv5: {
              days: 0
            },

            Lv6: {
              days: 0
            },

            Lv7: {
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


      const level =
        getSummaryLevel(
          schedule.fortress
        );


      if (
        !level
      ) {

        return;

      }


      guilds[guildName]
        .levels[level]
        .days +=
          getSummaryOccupationDays(
            schedule
          );

    }
  );


  return Object.values(
    guilds
  );

}


/* =========================================================
   Sort
========================================================= */

function sortGuildSummary(
  guilds
) {

  return guilds.sort(
    (
      a,
      b
    ) => {

      const aDays =
        a.levels?.Lv6?.days
        ||
        0;

      const bDays =
        b.levels?.Lv6?.days
        ||
        0;


      if (
        bDays !== aDays
      ) {

        return (
          bDays - aDays
        );

      }


      return a.guild.localeCompare(
        b.guild
      );

    }
  );

}


/* =========================================================
   Level Status
========================================================= */

function getSummaryCellStatus(
  days,
  averageDays
) {

  if (
    days === 0
  ) {

    return "empty";

  }


  if (
    averageDays > 0
    &&
    days > 0
  ) {

    const difference =
      Math.abs(
        days
        -
        averageDays
      );


    const allowedDifference =
      averageDays
      *
      SUMMARY_AVERAGE_TOLERANCE;


    if (
      difference
      >
      allowedDifference
    ) {

      return "warning";

    }

  }


  return "normal";

}


/* =========================================================
   Level Cell
========================================================= */

function createSummaryLevelCell(
  levelData,
  averageDays
) {

  const cell =
    document.createElement(
      "td"
    );


  const status =
    getSummaryCellStatus(
      levelData.days,
      averageDays
    );


cell.classList.add(
  `summary-status-${status}`
);

cell.classList.add(
  "summary-level-cell"
);


  cell.textContent =
    formatSummaryDays(
      levelData.days
    );


  return cell;

}


/* =========================================================
   Total Cell
========================================================= */

function createSummaryTotalCell(
  totalDays
) {

  const cell =
    document.createElement(
      "td"
    );


  cell.className =
    "summary-total-level";


  cell.textContent =
    formatSummaryDays(
      totalDays
    );


  return cell;

}


/* =========================================================
   Render Guild Summary
========================================================= */

function renderGuildSummary() {

  const table =
    document.getElementById(
      "summaryTable"
    );


  if (
    !table
  ) {

    return;

  }


  const tbody =
    table.querySelector(
      "tbody"
    );


  if (
    !tbody
  ) {

    return;

  }


  const guilds =
    sortGuildSummary(
      buildGuildSummary()
    );


  tbody.innerHTML =
    "";


  /*
    Calculate averages
  */

  const averages = {};


  SUMMARY_LEVELS.forEach(
    level => {

      const values =
        guilds
          .map(
            guild =>
              guild.levels[level].days
          )
          .filter(
            days =>
              days > 0
          );


      if (
        values.length === 0
      ) {

        averages[level] =
          0;

        return;

      }


      const total =
        values.reduce(
          (
            sum,
            days
          ) =>
            sum + days,
          0
        );


      averages[level] =
        total /
        values.length;

    }
  );


  let allianceDays = 0;


  /* =======================================================
     Guild Rows
  ======================================================= */

  guilds.forEach(
    guildData => {

      const row =
        document.createElement(
          "tr"
        );


      /* Guild */

      const guildCell =
        document.createElement(
          "td"
        );


      guildCell.className =
        "summary-guild";


      guildCell.textContent =
        guildData.guild;


      row.appendChild(
        guildCell
      );


      /* League */

      const leagueCell =
        document.createElement(
          "td"
        );


      leagueCell.className =
        "summary-league";


      leagueCell.textContent =
        guildData.league
        ||
        "—";


      row.appendChild(
        leagueCell
      );


      /* Lv4 - Lv7 */

      SUMMARY_LEVELS.forEach(
        level => {

          const levelData =
            guildData.levels[level];


          row.appendChild(
            createSummaryLevelCell(
              levelData,
              averages[level]
            )
          );


          allianceDays +=
            levelData.days;

        }
      );


      /* Total */

      let totalDays =
        0;


      SUMMARY_LEVELS.forEach(
        level => {

          totalDays +=
            guildData
              .levels[level]
              .days;

        }
      );


      row.appendChild(
        createSummaryTotalCell(
          totalDays
        )
      );


      tbody.appendChild(
        row
      );

    }
  );


  /* =======================================================
     Alliance Total
  ======================================================= */

  const totalRow =
    document.createElement(
      "tr"
    );


  totalRow.className =
    "summary-total-row";


  /* Guild */

  const totalGuildCell =
    document.createElement(
      "td"
    );


  totalGuildCell.className =
    "summary-guild";


  totalGuildCell.textContent =
    "Alliance Total :";

  totalGuildCell.colSpan = 2;


  totalRow.appendChild(
    totalGuildCell
  );


  /* Lv4 - Lv7 */

  SUMMARY_LEVELS.forEach(
    level => {

      let levelDays =
        0;


      guilds.forEach(
        guildData => {

          levelDays +=
            guildData
              .levels[level]
              .days;

        }
      );


      const cell =
        document.createElement(
          "td"
        );


      cell.className =
        "summary-total-level";


      cell.textContent =
        formatSummaryDays(
          levelDays
        );


      totalRow.appendChild(
        cell
      );

    }
  );


  /* Total */

  const allianceTotalCell =
    document.createElement(
      "td"
    );


  allianceTotalCell.className =
    "summary-total-level";


  allianceTotalCell.textContent =
    formatSummaryDays(
      allianceDays
    );


  totalRow.appendChild(
    allianceTotalCell
  );


  tbody.appendChild(
    totalRow
  );

  /* =======================================================
     Preview
  ======================================================= */

  updateSummaryPreview(
    guilds
  );

}


/* =========================================================
   Summary Preview
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


  if (
    !guildElement
    ||
    !leagueElement
    ||
    !daysElement
  ) {

    return;

  }


  if (
    !guilds
    ||
    guilds.length === 0
  ) {

    guildElement.textContent =
      "—";

    leagueElement.textContent =
      "—";

    daysElement.textContent =
      "0";

    return;

  }


  /*
    Use the latest schedule created
    by this browser as the preview guild.
  */

  let previewGuild = null;


  if (
    Array.isArray(
      schedules
    )
  ) {

    const mySchedules =
      schedules.filter(
        schedule =>
          schedule.creatorId
          ===
          creatorId
          &&
          schedule.guild?.trim()
      );


    if (
      mySchedules.length > 0
    ) {

      const latestSchedule =
        mySchedules[
          mySchedules.length - 1
        ];


      previewGuild =
        guilds.find(
          guildData =>
            guildData.guild
            ===
            latestSchedule.guild.trim()
        );

    }

  }


  if (
    !previewGuild
  ) {

    previewGuild =
      guilds[0];

  }


  const lv6 =
    previewGuild.levels.Lv6
    ||
    {
      days: 0
    };


  guildElement.textContent =
    previewGuild.guild
    ||
    "—";


  leagueElement.textContent =
    previewGuild.league
    ||
    "—";


  daysElement.textContent =
    formatSummaryDays(
      lv6.days
    );

}


/* =========================================================
   Summary Toggle
========================================================= */

function toggleSummaryTable() {

  const wrapper =
    document.getElementById(
      "summaryTableWrapper"
    );

  const toggle =
    document.getElementById(
      "summaryToggle"
    );


  if (
    !wrapper
    ||
    !toggle
  ) {

    return;

  }


  const expanded =
    wrapper.classList.toggle(
      "expanded"
    );


  toggle.classList.toggle(
    "expanded",
    expanded
  );


  toggle.setAttribute(
    "aria-expanded",
    expanded
      ? "true"
      : "false"
  );

}


/* =========================================================
   Summary Toggle Event
========================================================= */

const summaryToggle =
  document.getElementById(
    "summaryToggle"
  );


if (
  summaryToggle
) {

  summaryToggle.addEventListener(
    "click",
    toggleSummaryTable
  );

}
