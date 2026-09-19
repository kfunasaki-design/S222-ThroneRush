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
   Admin Settings
========================================================= */

/*
  Replace this value with your Supabase Auth User UID.
*/

const ADMIN_USER_ID =
  "80ed6c1c-316e-44d9-aee9-2c035262c968";


const ADMIN_SETTINGS_ID = 1;


/*
  Admin state is exposed globally so calendar.js
  can later use the same state for admin editing.
*/

window.s222AdminState = {

  isAdmin: false,

  user: null

};


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
      event.start
    );

  const end =
    new Date(
      event.end
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


      const league =
        guildData.league === "Gold"
          ? "GL"
          : guildData.league === "Silver"
            ? "SL"
            : guildData.league === "Bronze"
              ? "BL"
              : guildData.league || "—";


      leagueCell.textContent =
        league;


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
    "Alliance Total　";

  totalGuildCell.colSpan =
    2;

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
    guilds,
    averages
  );

}


/* =========================================================
   Summary Preview
========================================================= */

function updateSummaryPreview(
  guilds,
  averages
) {

  const guildElement =
    document.getElementById(
      "summaryPreviewGuild"
    );

  const leagueElement =
    document.getElementById(
      "summaryPreviewLeague"
    );

  const levelElement =
    document.getElementById(
      "summaryPreviewLevel"
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
    !levelElement
    ||
    !daysElement
  ) {

    return;

  }


  /*
    Show selected level average
  */

  const savedLevel =
    localStorage.getItem(
      "s222_summary_preview_level"
    );


  if (
    savedLevel
    &&
    SUMMARY_LEVELS.includes(
      savedLevel
    )
  ) {

    levelElement.value =
      savedLevel;

  }


  function updateAverage() {

    const selectedLevel =
      levelElement.value;


    daysElement.textContent =
      formatSummaryDays(
        averages[selectedLevel] || 0
      );

  }


  /*
    Level selection
  */

  levelElement.onchange = () => {

    updateAverage();

    localStorage.setItem(
      "s222_summary_preview_level",
      levelElement.value
    );

  };


  /*
    Use the latest schedule created
    by this browser as the preview guild.
  */

  if (
    !guilds
    ||
    guilds.length === 0
  ) {

    guildElement.textContent =
      "—";

    leagueElement.textContent =
      "—";

    updateAverage();

    return;

  }


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


  guildElement.textContent =
    previewGuild.guild
    ||
    "—";


  leagueElement.textContent =
    previewGuild.league
    ||
    "—";


  /*
    Display the average for the
    currently selected level.
  */

  updateAverage();

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


const summaryPreviewLevel =
  document.getElementById(
    "summaryPreviewLevel"
  );


if (
  summaryPreviewLevel
) {

  summaryPreviewLevel.addEventListener(
    "click",
    event => {

      event.stopPropagation();

    }
  );

}


/* =========================================================
   Event Position HUD
========================================================= */

const eventPositionTrigger =
  document.getElementById(
    "eventPositionTrigger"
  );


const eventPositionHUD =
  document.getElementById(
    "eventPositionHUD"
  );


/* =========================================================
   Timeline Release Position
========================================================= */

function updateTimelinePositions() {
  const eventInfo = window.s222EventInfo;
  if (!eventInfo || !eventPositionHUD) return;

  const timeline = eventPositionHUD.querySelector(".timeline");
  const graphics = eventPositionHUD.querySelector(".timeline-graphics");
  if (!timeline || !graphics) return;

  const eventStart = eventInfo.start ? new Date(eventInfo.start) : null;
  const eventEnd = eventInfo.end ? new Date(eventInfo.end) : null;

  if (
    !eventStart ||
    !eventEnd ||
    Number.isNaN(eventStart.getTime()) ||
    Number.isNaN(eventEnd.getTime())
  ) {
    return;
  }

  const totalTime = eventEnd.getTime() - eventStart.getTime();
  if (totalTime <= 0) return;
   

  /* ========================================
     Today's position
  ======================================== */

  const now = new Date();

  const todayPosition =
    (
      (now.getTime() - eventStart.getTime())
      /
      totalTime
    ) * 100;

  const clampedTodayPosition =
    Math.max(
      0,
      Math.min(
        100,
        todayPosition
      )
    );
   const pointer = eventPositionHUD.querySelector(".timeline-pointer");

if (pointer) {
  pointer.style.left = `${clampedTodayPosition}%`;
}
  /* ========================================
     一時処理
  ======================================== */
   console.log(
  "TODAY:",
  now,
  "START:",
  eventStart,
  "END:",
  eventEnd,
  "POSITION:",
  clampedTodayPosition
);
  /* ========================================
     Today's date
  ======================================== */

const todayDate = String(now.getDate()).padStart(2, "0");

const eventPositionDay =
  document.getElementById("eventPositionDay");

if (eventPositionDay) {
  eventPositionDay.textContent = todayDate;
}

const todayElement =
  document.getElementById("timeline-today");

if (todayElement) {
  todayElement.textContent = todayDate;

    /*
      Event startから50%日経過したら
      日付を▼の左側へ移動
    */
    const elapsedDays =
      (now.getTime() - eventStart.getTime()) /
      (1000 * 60 * 60 * 24);

todayElement.classList.toggle(
  "left",
  clampedTodayPosition > 50
);
  }

  /* ========================================
     Timeline title
  ======================================== */

  const timelineCurrent =
    eventPositionHUD.querySelector(".timeline-current");

  if (timelineCurrent) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    timelineCurrent.textContent =
      `TH Timeline［${year}/${month}/${day}］`;
  }
  /* ========================================
     Timeline dates
  ======================================== */

  function formatTimelineDate(value) {
    if (!value) return "--/--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "--/--";
    }

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${month}/${day}`;
  }

  const timelineDates = {
    "timeline-start-date": eventInfo.start,
    "timeline-lv4-date": eventInfo.Lv4,
    "timeline-lv5-date": eventInfo.Lv5,
    "timeline-lv6-date": eventInfo.Lv6,
    "timeline-lv7-date": eventInfo.Lv7,
    "timeline-end-date": eventInfo.end
  };

  Object.entries(timelineDates).forEach(
    ([id, value]) => {
      const element = document.getElementById(id);

      if (element) {
        element.textContent =
          formatTimelineDate(value);
      }
    }
  );
  /* ========================================
     Level markers
  ======================================== */

  const levels = ["Lv4", "Lv5", "Lv6", "Lv7"];

  let nearestLevel = null;
  let nearestDistance = Infinity;

  levels.forEach(level => {
    const marker = graphics.querySelector(
      `.timeline-marker.${level.toLowerCase()}`
    );

    if (!marker) return;

    const release = eventInfo[level]
      ? new Date(eventInfo[level])
      : null;

    if (
      !release ||
      Number.isNaN(release.getTime())
    ) {
      marker.style.display = "none";
      marker.classList.remove("nearest");
      return;
    }

    const elapsed =
      release.getTime() - eventStart.getTime();

    const position = Math.max(
      0,
      Math.min(100, (elapsed / totalTime) * 100)
    );

    marker.style.display = "flex";
    marker.style.left = `${position}%`;

    /* 今日からの距離 */
    const distance =
      Math.abs(
        release.getTime() - now.getTime()
      );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestLevel = level;
    }

    marker.classList.remove("nearest");
  });

  /* 最も近いLvを強調 */
  if (nearestLevel) {
    const nearestMarker =
      graphics.querySelector(
        `.timeline-marker.${nearestLevel.toLowerCase()}`
      );

    if (nearestMarker) {
      nearestMarker.classList.add("nearest");
    }
  }

/* =========================================================
   Event Position Drag
========================================================= */

if (
  eventPositionTrigger
  &&
  eventPositionHUD
) {

  let isDragging = false;
  let startY = 0;
  let startTop = 0;


  let eventPositionTop =
    eventPositionTrigger.offsetTop;


  /* =========================================================
     Apply Position
  ========================================================= */

  function applyEventPosition() {

    eventPositionTrigger.style.top =
      `${eventPositionTop}px`;

    eventPositionHUD.style.top =
      `${eventPositionTop}px`;

  }


  applyEventPosition();


  /* =========================================================
     Start Drag
  ========================================================= */

  function startEventPositionDrag(
    target,
    event
  ) {

    isDragging = false;


    startY =
      event.clientY;


    startTop =
      eventPositionTop;


    target.setPointerCapture(
      event.pointerId
    );

  }


  /* =========================================================
     Move
  ========================================================= */

  function moveEventPositionDrag(
    target,
    event
  ) {

    if (
      !target.hasPointerCapture(
        event.pointerId
      )
    ) {

      return;

    }


    const deltaY =
      event.clientY -
      startY;


    if (
      Math.abs(deltaY) > 4
    ) {

      isDragging = true;

    }


    if (
      !isDragging
    ) {

      return;

    }


    const wrapper =
      document.getElementById(
        "calendarWrapper"
      );


    if (
      !wrapper
    ) {

      return;

    }


    const height =
      target.offsetHeight;


    const maxTop =
      wrapper.clientHeight -
      height -
      10;


    eventPositionTop =
      Math.max(
        10,
        Math.min(
          maxTop,
          startTop + deltaY
        )
      );


    applyEventPosition();

  }


  /* =========================================================
     Finish Drag
  ========================================================= */

  function finishEventPositionDrag(
    target,
    event
  ) {

    if (
      target.hasPointerCapture(
        event.pointerId
      )
    ) {

      target.releasePointerCapture(
        event.pointerId
      );

    }

  }


  /* =========================================================
     Trigger
  ========================================================= */

  eventPositionTrigger.addEventListener(
    "pointerdown",
    event => {

      startEventPositionDrag(
        eventPositionTrigger,
        event
      );

    }
  );


  eventPositionTrigger.addEventListener(
    "pointermove",
    event => {

      moveEventPositionDrag(
        eventPositionTrigger,
        event
      );

    }
  );


  eventPositionTrigger.addEventListener(
    "pointerup",
    event => {

      if (
        isDragging
      ) {

        isDragging = false;


        finishEventPositionDrag(
          eventPositionTrigger,
          event
        );


        return;

      }


      eventPositionHUD.classList.add(
        "open"
      );


      eventPositionTrigger.classList.add(
        "open"
      );


      eventPositionTrigger.setAttribute(
        "aria-expanded",
        "true"
      );


      applyEventPosition();

      updateTimelinePositions();


      finishEventPositionDrag(
        eventPositionTrigger,
        event
      );

    }
  );


  /* =========================================================
     HUD
  ========================================================= */

  eventPositionHUD.addEventListener(
    "pointerdown",
    event => {

      startEventPositionDrag(
        eventPositionHUD,
        event
      );

    }
  );


  eventPositionHUD.addEventListener(
    "pointermove",
    event => {

      moveEventPositionDrag(
        eventPositionHUD,
        event
      );

    }
  );


  eventPositionHUD.addEventListener(
    "pointerup",
    event => {

      if (
        isDragging
      ) {

        isDragging = false;


        finishEventPositionDrag(
          eventPositionHUD,
          event
        );


        return;

      }


      eventPositionHUD.classList.remove(
        "open"
      );


      eventPositionTrigger.classList.remove(
        "open"
      );


      eventPositionTrigger.setAttribute(
        "aria-expanded",
        "false"
      );


      finishEventPositionDrag(
        eventPositionHUD,
        event
      );

    }
  );


  const calendarWrapper =
    document.getElementById(
      "calendarWrapper"
    );


  if (
    calendarWrapper
  ) {

    calendarWrapper.addEventListener(
      "scroll",
      () => {

        const scrollY =
          calendarWrapper.scrollTop;


        eventPositionTrigger.style.transform =
          `translateY(${scrollY}px)`;


        eventPositionHUD.style.transform =
          `translateY(${scrollY}px)`;

      }
    );

  }

}


/* =========================================================
   Admin DOM
========================================================= */

const adminStatus =
  document.getElementById(
    "adminStatus"
  );


const adminMenuBtn =
  document.getElementById(
    "adminMenuBtn"
  );


const adminLoginDialog =
  document.getElementById(
    "adminLoginDialog"
  );


const adminLoginForm =
  document.getElementById(
    "adminLoginForm"
  );


const adminEmail =
  document.getElementById(
    "adminEmail"
  );


const adminPassword =
  document.getElementById(
    "adminPassword"
  );


const adminLoginError =
  document.getElementById(
    "adminLoginError"
  );


const closeAdminLogin =
  document.getElementById(
    "closeAdminLogin"
  );


const adminPanelDialog =
  document.getElementById(
    "adminPanelDialog"
  );


const adminPanelForm =
  document.getElementById(
    "adminPanelForm"
  );


const adminEventStart =
  document.getElementById(
    "adminEventStart"
  );


const adminEventEnd =
  document.getElementById(
    "adminEventEnd"
  );


const adminLv4Release =
  document.getElementById(
    "adminLv4Release"
  );


const adminLv5Release =
  document.getElementById(
    "adminLv5Release"
  );


const adminLv6Release =
  document.getElementById(
    "adminLv6Release"
  );


const adminLv7Release =
  document.getElementById(
    "adminLv7Release"
  );


const adminPanelError =
  document.getElementById(
    "adminPanelError"
  );


const adminGuildColors =
  document.getElementById(
    "adminGuildColors"
  );


const closeAdminPanel =
  document.getElementById(
    "closeAdminPanel"
  );


const adminLogoutBtn =
  document.getElementById(
    "adminLogoutBtn"
  );


/* =========================================================
   Admin Status
========================================================= */

function updateAdminStatus(
  isAdmin
) {

  window.s222AdminState.isAdmin =
    isAdmin;


  if (
    adminStatus
  ) {

    adminStatus.textContent =
      isAdmin
        ? "IN"
        : "OUT";


    adminStatus.classList.toggle(
      "in",
      isAdmin
    );

  }

}


/* =========================================================
   Admin Guild Colors
========================================================= */

function renderAdminGuildColors() {

  if (
    !adminGuildColors
    ||
    !Array.isArray(
      GUILD_LIST
    )
  ) {

    return;

  }


  adminGuildColors.innerHTML =
    "";


  GUILD_LIST.forEach(
    guild => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "guild-color-row";


      const label =
        document.createElement(
          "span"
        );


      label.textContent =
        guild;


      label.className =
        "guild-color-name";


      const input =
        document.createElement(
          "input"
        );


      input.type =
        "color";


      input.className =
        "guild-color-input";


      input.dataset.guild =
        guild;


      input.value =
        guildColor(
          guild
        );


      row.appendChild(
        label
      );


      row.appendChild(
        input
      );


      adminGuildColors.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   Admin Settings Load
========================================================= */

async function loadAdminSettings() {

  if (
    typeof supabaseClient ===
    "undefined"
  ) {

    console.error(
      "Supabase client is not available."
    );

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "admin_settings"
      )
      .select(
        "*"
      )
      .eq(
        "id",
        ADMIN_SETTINGS_ID
      )
      .maybeSingle();


  if (
    error
  ) {

    console.error(
      "Admin settings load error:",
      error
    );

    return;

  }


  if (
    !data
  ) {

    return;

  }


  /*
    Guild Colors
  */

  if (
    data.guild_colors
    &&
    typeof data.guild_colors === "object"
  ) {

    GUILD_LIST.forEach(
      guild => {

        const color =
          data.guild_colors[guild];


        if (
          /^#[0-9A-Fa-f]{6}$/.test(
            color || ""
          )
        ) {

          setGuildColor(
            guild,
            color
          );

        }

      }
    );

  }


  renderAdminGuildColors();


  /*
    Event period
  */

  if (
    data.event_start
  ) {

    event.start =
      data.event_start;

  }


  if (
    data.event_end
  ) {

    event.end =
      data.event_end;

  }


  /*
    Update visible event period
  */

  if (
    typeof updateCurrentTime ===
    "function"
  ) {

    updateCurrentTime();

  }


  /*
    Update calendar after loading
    the event period.
  */

  if (
    typeof renderCalendar ===
    "function"
  ) {

    renderCalendar();

  }


  /*
    Fill Admin Panel
  */

  if (
    adminEventStart
  ) {

    setAdminReleaseInput(
      adminEventStart,
      data.event_start
    );

  }


  if (
    adminEventEnd
  ) {

    setAdminReleaseInput(
      adminEventEnd,
      data.event_end
    );

  }


  setAdminReleaseInput(
    adminLv4Release,
    data.lv4_release
  );


  setAdminReleaseInput(
    adminLv5Release,
    data.lv5_release
  );


  setAdminReleaseInput(
    adminLv6Release,
    data.lv6_release
  );


  setAdminReleaseInput(
    adminLv7Release,
    data.lv7_release
  );

}


/* =========================================================
   Admin Date Helpers
========================================================= */

function setAdminReleaseInput(
  input,
  value
) {

  if (
    !input
  ) {

    return;

  }


  if (
    !value
  ) {

    input.value =
      "";

    return;

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    input.value =
      "";

    return;

  }


  const local =
    new Date(
      date.getTime()
      -
      date.getTimezoneOffset()
      *
      60000
    );


  input.value =
    local
      .toISOString()
      .slice(
        0,
        16
      );

}


function getAdminReleaseValue(
  input
) {

  if (
    !input
    ||
    !input.value
  ) {

    return null;

  }


  const date =
    new Date(
      input.value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date.toISOString();

}


/* =========================================================
   Admin Panel Open
========================================================= */

async function openAdminPanel() {

  if (
    !window.s222AdminState.isAdmin
  ) {

    return;

  }


  if (
    adminPanelError
  ) {

    adminPanelError.textContent =
      "";

  }


  await loadAdminSettings();


  if (
    adminPanelDialog
  ) {

    adminPanelDialog.showModal();

  }

}


/* =========================================================
   Admin Menu
========================================================= */

if (
  adminMenuBtn
) {

  adminMenuBtn.addEventListener(
    "click",
    async () => {

      if (
        window.s222AdminState.isAdmin
      ) {

        await openAdminPanel();

        return;

      }


      if (
        adminLoginError
      ) {

        adminLoginError.textContent =
          "";

      }


      if (
        adminLoginDialog
      ) {

        adminLoginDialog.showModal();

      }

    }
  );

}


/* =========================================================
   Admin Login
========================================================= */

if (
  adminLoginForm
) {

  adminLoginForm.addEventListener(
    "submit",
    async submitEvent => {

      submitEvent.preventDefault();


      if (
        adminLoginError
      ) {

        adminLoginError.textContent =
          "";

      }


      const email =
        adminEmail?.value.trim();


      const password =
        adminPassword?.value;


      if (
        !email
        ||
        !password
      ) {

        if (
          adminLoginError
        ) {

          adminLoginError.textContent =
            "Please enter your email and password.";

        }

        return;

      }


      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth
            .signInWithPassword({
              email,
              password
            });


        if (
          error
        ) {

          throw error;

        }


        const user =
          data?.user;


        if (
          !user
        ) {

          throw new Error(
            "Authentication failed."
          );

        }


        if (
          user.id
          !==
          ADMIN_USER_ID
        ) {

          await supabaseClient.auth.signOut();

          throw new Error(
            "This account is not authorized as an administrator."
          );

        }


        window.s222AdminState.user =
          user;


        updateAdminStatus(
          true
        );


        adminLoginForm.reset();


        if (
          adminLoginDialog
        ) {

          adminLoginDialog.close();

        }


        await loadAdminSettings();


        await openAdminPanel();

      }

      catch (
        error
      ) {

        console.error(
          "Admin login error:",
          error
        );


        if (
          adminLoginError
        ) {

          adminLoginError.textContent =
            error.message
            ||
            "Login failed.";

        }

      }

    }
  );

}


/* =========================================================
   Admin Auth State
========================================================= */

async function initializeAdminAuth() {

  if (
    typeof supabaseClient ===
    "undefined"
  ) {

    return;

  }


  const {
    data
  } =
    await supabaseClient.auth
      .getSession();


  const user =
    data?.session?.user
    ||
    null;


  if (
    user
    &&
    user.id
    ===
    ADMIN_USER_ID
  ) {

    window.s222AdminState.user =
      user;


    updateAdminStatus(
      true
    );


    await loadAdminSettings();

    return;

  }


  /*
    Any non-admin authenticated session
    is signed out.
  */

  if (
    user
  ) {

    await supabaseClient.auth.signOut();

  }


  window.s222AdminState.user =
    null;


  updateAdminStatus(
    false
  );

}


/* =========================================================
   Public Event Period Load
========================================================= */

async function loadEventPeriod() {

  if (
    typeof supabaseClient ===
    "undefined"
  ) {

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "admin_settings"
      )
      .select(
        "event_start, event_end, lv4_release, lv5_release, lv6_release, lv7_release, guild_colors"
      )
      .eq(
        "id",
        ADMIN_SETTINGS_ID
      )
      .maybeSingle();


  if (
    error
  ) {

    console.error(
      "Event period load error:",
      error
    );

    return;

  }


  if (
    !data
  ) {

    return;

  }


  event.start =
    data.event_start
    ||
    "";


  event.end =
    data.event_end
    ||
    "";


  window.s222EventInfo = {

    start:
      data.event_start
      ||
      "",

    end:
      data.event_end
      ||
      "",

    Lv4:
      data.lv4_release
      ||
      null,

    Lv5:
      data.lv5_release
      ||
      null,

    Lv6:
      data.lv6_release
      ||
      null,

    Lv7:
      data.lv7_release
      ||
      null

  };


  /*
    Update timeline positions after
    event information has been loaded.
  */

  updateTimelinePositions();


  window.s222ReleaseDates = {

    Lv4:
      data.lv4_release
      ||
      null,

    Lv5:
      data.lv5_release
      ||
      null,

    Lv6:
      data.lv6_release
      ||
      null,

    Lv7:
      data.lv7_release
      ||
      null

  };


  /*
    Guild Colors
  */

  if (
    data.guild_colors
    &&
    typeof data.guild_colors === "object"
  ) {

    GUILD_LIST.forEach(
      guild => {

        const color =
          data.guild_colors[guild];


        if (
          /^#[0-9A-Fa-f]{6}$/.test(
            color || ""
          )
        ) {

          setGuildColor(
            guild,
            color
          );

        }

      }
    );

  }


  if (
    typeof updateCurrentTime ===
    "function"
  ) {

    updateCurrentTime();

  }


  if (
    typeof renderCalendar ===
    "function"
  ) {

    renderCalendar();

  }

}


/* =========================================================
   Auth State Change
========================================================= */

if (
  typeof supabaseClient !==
  "undefined"
) {

  supabaseClient.auth.onAuthStateChange(
    async (
      _event,
      session
    ) => {

      const user =
        session?.user
        ||
        null;


      if (
        user
        &&
        user.id
        ===
        ADMIN_USER_ID
      ) {

        window.s222AdminState.user =
          user;


        updateAdminStatus(
          true
        );


        return;

      }


      window.s222AdminState.user =
        null;


      updateAdminStatus(
        false
      );

    }
  );

}


/* =========================================================
   Close Admin Login
========================================================= */

if (
  closeAdminLogin
) {

  closeAdminLogin.addEventListener(
    "click",
    () => {

      adminLoginDialog?.close();

    }
  );

}


/* =========================================================
   Close Admin Panel
========================================================= */

if (
  closeAdminPanel
) {

  closeAdminPanel.addEventListener(
    "click",
    () => {

      adminPanelDialog?.close();

    }
  );

}


/* =========================================================
   Admin Save
========================================================= */

if (
  adminPanelForm
) {

  adminPanelForm.addEventListener(
    "submit",
    async submitEvent => {

      submitEvent.preventDefault();


      if (
        !window.s222AdminState.isAdmin
      ) {

        return;

      }


      if (
        adminPanelError
      ) {

        adminPanelError.textContent =
          "";

      }


      const eventStart =
        adminEventStart?.value;


      const eventEnd =
        adminEventEnd?.value;


      if (
        !eventStart
        ||
        !eventEnd
      ) {

        if (
          adminPanelError
        ) {

          adminPanelError.textContent =
            "Please enter the Event Period.";

        }

        return;

      }


      if (
        eventStart
        >
        eventEnd
      ) {

        if (
          adminPanelError
        ) {

          adminPanelError.textContent =
            "Event End must be after Event Start.";

        }

        return;

      }


      const releaseInputs = [

        adminLv4Release,

        adminLv5Release,

        adminLv6Release,

        adminLv7Release

      ];


      const releaseValues =
        releaseInputs.map(
          input =>
            getAdminReleaseValue(
              input
            )
        );


      /*
        Guild Colors
      */

      const guildColors = {};


      if (
        adminGuildColors
      ) {

        const colorInputs =
          adminGuildColors.querySelectorAll(
            ".guild-color-input"
          );


        colorInputs.forEach(
          input => {

            const guild =
              input.dataset.guild;


            const color =
              input.value;


            if (
              guild
              &&
              /^#[0-9A-Fa-f]{6}$/.test(
                color
              )
            ) {

              guildColors[guild] =
                color;

            }

          }
        );

      }


      /*
        Release dates must be inside
        the Event Period when entered.
      */

      const eventStartDate =
        new Date(
          eventStart
        );


      const eventEndDate =
        new Date(
          eventEnd
        );


      for (
        let i = 0;
        i < releaseValues.length;
        i++
      ) {

        if (
          !releaseValues[i]
        ) {

          continue;

        }


        const releaseDate =
          new Date(
            releaseValues[i]
          );


        if (
          releaseDate
          <
          eventStartDate
          ||
          releaseDate
          >
          eventEndDate
        ) {

          if (
            adminPanelError
          ) {

            adminPanelError.textContent =
              `${SUMMARY_LEVELS[i]} release must be inside the Event Period.`;

          }


          return;

        }

      }


      try {

        const {
          error
        } =
          await supabaseClient
            .from(
              "admin_settings"
            )
            .update({

              event_start:
                getAdminReleaseValue(
                  adminEventStart
                ),

              event_end:
                getAdminReleaseValue(
                  adminEventEnd
                ),

              lv4_release:
                releaseValues[0],

              lv5_release:
                releaseValues[1],

              lv6_release:
                releaseValues[2],

              lv7_release:
                releaseValues[3],

              guild_colors:
                guildColors,

              updated_at:
                new Date().toISOString()

            })
            .eq(
              "id",
              ADMIN_SETTINGS_ID
            );


        if (
          error
        ) {

          throw error;

        }


        /*
          Update guild colors.
        */

        GUILD_LIST.forEach(
          guild => {

            const color =
              guildColors[guild];


            if (
              color
            ) {

              setGuildColor(
                guild,
                color
              );

            }

          }
        );


        /*
          Update live event settings.
        */

        event.start =
          eventStart;


        event.end =
          eventEnd;


        window.s222EventInfo = {

          start:
            eventStart,

          end:
            eventEnd,

          Lv4:
            releaseValues[0],

          Lv5:
            releaseValues[1],

          Lv6:
            releaseValues[2],

          Lv7:
            releaseValues[3]

        };


        /*
          Update timeline positions immediately
          after saving the event settings.
        */

        updateTimelinePositions();


        if (
          typeof updateCurrentTime ===
          "function"
        ) {

          updateCurrentTime();

        }


        if (
          typeof renderCalendar ===
          "function"
        ) {

          renderCalendar();

        }


        adminPanelDialog?.close();

      }

      catch (
        error
      ) {

        console.error(
          "Admin settings save error:",
          error
        );


        if (
          adminPanelError
        ) {

          adminPanelError.textContent =
            "Failed to save admin settings.";

        }

      }

    }
  );

}


/* =========================================================
   Admin Logout
========================================================= */

if (
  adminLogoutBtn
) {

  adminLogoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await supabaseClient.auth.signOut();

      }

      catch (
        error
      ) {

        console.error(
          "Admin logout error:",
          error
        );

      }


      window.s222AdminState.user =
        null;


      updateAdminStatus(
        false
      );


      adminPanelDialog?.close();

    }
  );

}


/* =========================================================
   Admin Initialization
========================================================= */

/*
  Event Period is public information,
  so load it independently from admin authentication.
*/

loadEventPeriod();

initializeAdminAuth();

loadEventPeriod()
  .then(() => {

    loadSchedules();

  });

initializeAdminAuth();
