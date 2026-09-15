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
        "event_start, event_end"
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
          Update live event settings.
        */

        event.start =
          eventStart;

        event.end =
          eventEnd;


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



1
  const weekdayCells =
    document.querySelectorAll(
      ".weekday-cell"
    );


2
    const scheduleLayer =
      document.createElement(
        "div"
      );

    scheduleLayer.className =
      "schedule-layer";

    for (
      let i = 0;
      i < 7;
      i++
    ) {

      const date =
        new Date(weekStart);

      date.setDate(
        weekStart.getDate() + i
      );

      const day =
        createDay(date);

      dayGrid.appendChild(
        day
      );

    }

    week.appendChild(
      dayGrid
    );

    const lanes = [];

    const weekSchedules =
      schedules.filter(
        schedule =>
          scheduleOverlapsWeek(
            schedule,
            weekStart,
            weekEnd
          )
      );

    weekSchedules.forEach(
      schedule => {

        const segment =
          getWeekScheduleSegment(
            schedule,
            weekStart,
            weekEnd
          );

        if (!segment)
          return;

        let laneIndex = 0;

        while (true) {

          if (
            !lanes[laneIndex]
          ) {

            lanes[laneIndex] = [];

          }

          const overlaps =
            lanes[laneIndex].some(
              existingSegment =>
                existingSegment.startColumn
                <=
                segment.endColumn
                &&
                existingSegment.endColumn
                >=
                segment.startColumn
            );

          if (!overlaps)
            break;

          laneIndex++;

        }

        lanes[laneIndex].push(
          segment
        );

        const item =
          createSchedule(
            schedule,
            segment,
            laneIndex
          );

        scheduleLayer.appendChild(
          item
        );

      }
    );

    const scheduleHeight =
      Math.max(
        180,
        42
        +
        (
          lanes.length
          *
          22
        )
        +
        10
      );

    week.style.minHeight =
      `${scheduleHeight}px`;

    week.appendChild(
      scheduleLayer
    );

    calendar.appendChild(
      week
    );

    cursor.setDate(
      cursor.getDate() + 7
    );

  }

  updateLanguage();

}

/* =========================================================
S222 Throne Rush Calendar
========================================================= */


/* =========================================================
Supabase
========================================================= */

const SUPABASE_URL =
"https://pvppgvjhfslizkudjxru.supabase.co";

const SUPABASE_ANON_KEY =
"sb_publishable_R9RKZAlPhesQKiiwnEq84A_s88z57bk";

const supabaseClient =
window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);



/* =========================================================
State
========================================================= */

let schedules = [];

let currentMonth =
new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1
);

let selectedSchedule = null;



/* =========================================================
Guild Settings
========================================================= */

const GUILD_COLORS = {

  "Natureborne Echelon": "#00BCD4",

  "Garuda Muda": "#E91E63",

  "Berandals Galeatus": "#7C4DFF",

  "Apex predators": "#4CAF50",

  "SAMURAI": "#FF9800",

  "Gods of War": "#03A9F4",

  "Clover phoenix": "#9C27B0",

  "World Order Japan": "#8BC34A",

  "Kaukasians": "#795548",

  "Renegade": "#F44336",

  "Westwind": "#009688",

  "Active Misfits": "#607D8B"

};



const GUILD_LIST = [
  "Natureborne Echelon",
  "Garuda Muda",
  "Berandals Galeatus",
  "Apex predators",
  "SAMURAI",
  "Gods of War",
  "Clover phoenix",
  "World Order Japan",
  "Kaukasians",
  "Renegade",
  "Westwind",
  "Active Misfits"
];



/* =========================================================
Guild Color
========================================================= */

function guildColor(guild) {

  return (
    GUILD_COLORS[guild]
    ||
    "#888888"
  );

}



function setGuildColor(
  guild,
  color
) {

  if (
    !GUILD_COLORS[guild]
  ) {

    return false;

  }


  if (
    !/^#[0-9A-Fa-f]{6}$/.test(
      color
    )
  ) {

    return false;

  }


  GUILD_COLORS[guild] =
    color;

  return true;

}

/* =========================================================
Schedule Text Color
========================================================= */

function getScheduleTextColor(color) {

  if (!color)
    return "#FFFFFF";

  const hex =
    color
      .replace("#", "")
      .trim();

  if (hex.length !== 6)
    return "#FFFFFF";

  const r =
    parseInt(
      hex.substring(0, 2),
      16
    );

  const g =
    parseInt(
      hex.substring(2, 4),
      16
    );

  const b =
    parseInt(
      hex.substring(4, 6),
      16
    );

  const luminance =
    (
      0.299 * r
      +
      0.587 * g
      +
      0.114 * b
    );

  return luminance > 150
    ? "#111111"
    : "#FFFFFF";

}



/* =========================================================
Guild Select
========================================================= */

function setupGuildSelect() {

  const guildSelect =
    document.getElementById(
      "guild"
    );

  if (!guildSelect)
    return;

  guildSelect.innerHTML = "";

  const placeholder =
    document.createElement(
      "option"
    );

  placeholder.value = "";

  placeholder.textContent =
    "Select Guild";

  placeholder.selected = true;

  placeholder.disabled = true;

  guildSelect.appendChild(
    placeholder
  );

  GUILD_LIST.forEach(
    guild => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        guild;

      option.textContent =
        guild;

      guildSelect.appendChild(
        option
      );

    }
  );

}



/* =========================================================
Event Period
========================================================= */

const event = {
  start: "",
  end: ""
};



/* =========================================================
League Restrictions

Higher leagues can challenge
all lower league fortress levels.
========================================================= */

const LEAGUE_LIMITS = {

  Bronze: [
    "Lv4",
    "Lv5"
  ],

  Silver: [
    "Lv4",
    "Lv5",
    "Lv6"
  ],

  Gold: [
    "Lv4",
    "Lv5",
    "Lv6",
    "Lv7"
  ]

};



/* =========================================================
Fortress Settings
========================================================= */

const FORTRESS_SETTINGS = {

  Lv5: {
    total: 7,
    recommended: 1
  },

  Lv6: {
    total: 4,
    recommended: 1
  },

  Lv7: {
    total: 1,
    recommended: 1
  }

};



/* =========================================================
Fortress Coordinates
========================================================= */

const FORTRESS_COORDINATES = {

  Lv4: [
    { x: 620, y: 475, label: "10" },
    { x: 625, y: 380, label: "15" },
    { x: 570, y: 370, label: "20" },
    { x: 465, y: 360, label: "25" },
    { x: 380, y: 375, label: "30" },
    { x: 385, y: 570, label: "45" },
    { x: 565, y: 645, label: "55" }
  ],

  Lv5: [
    { x: 480, y: 615, label: "5W" },
    { x: 365, y: 455, label: "5N" },
    { x: 545, y: 455, label: "5E" },
    { x: 635, y: 565, label: "5S" }
  ],

  Lv6: [
    { x: 460, y: 545, label: "6W" },
    { x: 460, y: 460, label: "6N" },
    { x: 545, y: 545, label: "6S" }
  ],

  Lv7: [
    { x: 500, y: 500, label: "Central" }
  ]

};



/* =========================================================
Balance Settings
========================================================= */

const BALANCE_SETTINGS = {

  maxTotalHoldings: 6,

  warningHoldings: 2,

  restrictionHoldings: 3,

  dayAverageTolerance: 0.25

};



/* =========================================================
User Identity
========================================================= */

let creatorId =
  localStorage.getItem(
    "s222_creator_id"
  );

if (!creatorId) {

  creatorId =
    crypto.randomUUID();

  localStorage.setItem(
    "s222_creator_id",
    creatorId
  );

}



/* =========================================================
DOM
========================================================= */

const calendar =
  document.getElementById(
    "calendar"
  );

const calendarWrapper =
  document.getElementById(
    "calendarWrapper"
  );

const monthTitle =
  document.getElementById(
    "monthTitle"
  );

const eventPeriod =
  document.getElementById(
    "event-period"
  );

const weekdayHeader =
  document.getElementById(
    "weekdayHeader"
  );

const dialog =
  document.getElementById(
    "scheduleDialog"
  );

const form =
  document.getElementById(
    "scheduleForm"
  );

const detailDialog =
  document.getElementById(
    "detailDialog"
  );



/* =========================================================
Helpers
========================================================= */

function formatDate(date) {

  const y =
    date.getFullYear();

  const m =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const d =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${y}-${m}-${d}`;

}



/* =========================================================
Fortress Icon
========================================================= */

function fortressIcon(level) {

  switch (level) {

    case "Lv7":
      return "🔵";

    case "Lv6":
      return "🔴";

    case "Lv5":
      return "🟡";

    default:
      return "🟢";

  }

}



/* =========================================================
GMT / JST Input Conversion
========================================================= */

function updateGMT(jstInput, gmtInput) {

  if (!jstInput.value)
    return;

  const [hour, minute] =
    jstInput.value
      .split(":")
      .map(Number);

  const totalMinutes =
    hour * 60 +
    minute -
    9 * 60;

  const gmtHour =
    Math.floor(
      ((totalMinutes + 1440) % 1440) / 60
    );

  const gmtMinute =
    (totalMinutes + 1440) % 60;

  gmtInput.value =
    String(gmtHour).padStart(2, "0") +
    ":" +
    String(gmtMinute).padStart(2, "0");

}



function updateJST(gmtInput, jstInput) {

  if (!gmtInput.value)
    return;

  const [hour, minute] =
    gmtInput.value
      .split(":")
      .map(Number);

  const totalMinutes =
    hour * 60 +
    minute +
    9 * 60;

  const jstHour =
    Math.floor(
      ((totalMinutes + 1440) % 1440) / 60
    );

  const jstMinute =
    (totalMinutes + 1440) % 60;

  jstInput.value =
    String(jstHour).padStart(2, "0") +
    ":" +
    String(jstMinute).padStart(2, "0");

}



/* =========================================================
Current Time
========================================================= */

function formatEventDate(value) {

  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString(
    "en-US",
    {
      timeZone: "Asia/Tokyo",
      month: "2-digit",
      day: "2-digit"
    }
  );

}



function updateCurrentTime() {

  if (!eventPeriod)
    return;

  eventPeriod.textContent =
    `Event: ${formatEventDate(event.start)} → ${formatEventDate(event.end)}`;

}



/* =========================================================
Language
========================================================= */

function updateLanguage() {



  const addButton =
    document.getElementById(
      "addScheduleBtn"
    );
  
  const refreshButton =
    document.getElementById("refreshBtn");

  if (refreshButton) {
    refreshButton.textContent = "R";
  }
  
  if (addButton) {

    addButton.textContent =
      "Add Schedule";

    addButton.setAttribute(
      "translate",
      "no"
    );

  }


  const weekdayCells =
    document.querySelectorAll(
      ".weekday-cell"
    );

  const weekdaysEN = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
  ];

  weekdayCells.forEach(
    (
      cell,
      index
    ) => {

      cell.textContent =
        weekdaysEN[index];

    }
  );

  const dialogTitle =
    document.getElementById(
      "dialogTitle"
    );

  if (dialogTitle) {

    if (
      dialogTitle.dataset.mode === "edit"
    ) {

      dialogTitle.textContent =
        "Edit Schedule";

    }

    else {

      dialogTitle.textContent =
        "Add Schedule";

    }

  }

  const detailClose =
    document.getElementById(
      "detailClose"
    );

  if (detailClose) {

    detailClose.textContent =
      "Close";

  }

  const editButton =
    document.getElementById(
      "editSchedule"
    );

  if (editButton) {

    editButton.textContent =
      "Edit";

  }

  const cancelButton =
    document.getElementById(
      "cancelBtn"
    );

  if (cancelButton) {

    cancelButton.textContent =
      "Cancel";

  }

  const saveButton =
    form?.querySelector(
      'button[type="submit"]'
    );

  if (saveButton) {

    saveButton.textContent =
      "Save";

  }

  const deleteButton =
    document.getElementById(
      "deleteBtn"
    );

  if (deleteButton) {

    deleteButton.textContent =
      "Delete";

  }

  updateCurrentTime();

}



/* =========================================================
Supabase Load
========================================================= */

async function loadSchedules() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("schedules")
      .select("*")
      .order(
        "start_at",
        {
          ascending: true
        }
      );

  if (error) {

    console.error(
      "Supabase load error:",
      error
    );

    alert(
      "Failed to load schedules."
    );

    schedules = [];

    renderCalendar();

    renderGuildSummary();

    return;

  }

  schedules =
    (data || []).map(
      schedule => ({

        id:
          schedule.id,

        league:
          schedule.league,

        fortress:
          schedule.fortress,

        x:
          schedule.coordinate_x,

        y:
          schedule.coordinate_y,

        guild:
          schedule.guild,

        start:
          schedule.start_at,

        end:
          schedule.end_at,

        description:
          schedule.description || "",

        /*
          Always use the current Guild color.
          This also updates old schedules that
          were saved with the previous color system.
        */

        color:
          guildColor(
            schedule.guild
          ),

        creatorId:
          schedule.creator_id

      })
    );
schedules.sort(
  (a, b) => {

    const guildA =
      GUILD_LIST.indexOf(a.guild);

    const guildB =
      GUILD_LIST.indexOf(b.guild);

    if (guildA !== guildB) {

      return guildA - guildB;

    }

    return (
      new Date(a.start)
      -
      new Date(b.start)
    );

  }
);
  renderCalendar();

  renderGuildSummary();

}



/* =========================================================
Supabase Insert
========================================================= */

async function insertSchedule(
  schedule
) {

  const {
    error
  } =
    await supabaseClient
      .from("schedules")
      .insert({

        id:
          schedule.id,

        league:
          schedule.league,

        fortress:
          schedule.fortress,

        coordinate_x:
          schedule.x,

        coordinate_y:
          schedule.y,

        guild:
          schedule.guild,

        start_at:
          schedule.start,

        end_at:
          schedule.end,

        description:
          schedule.description,

        color:
          schedule.color,

        creator_id:
          schedule.creatorId

      });

  if (error) {

    console.error(
      "Supabase insert error:",
      error
    );

    throw error;

  }

}



/* =========================================================
Supabase Update
========================================================= */

async function updateSchedule(
  schedule
) {

  const {
    error
  } =
    await supabaseClient
      .from("schedules")
      .update({

        league:
          schedule.league,

        fortress:
          schedule.fortress,

        coordinate_x:
          schedule.x,

        coordinate_y:
          schedule.y,

        guild:
          schedule.guild,

        start_at:
          schedule.start,

        end_at:
          schedule.end,

        description:
          schedule.description,

        color:
          schedule.color,

        creator_id:
          schedule.creatorId

      })
      .eq(
        "id",
        schedule.id
      );

  if (error) {

    console.error(
      "Supabase update error:",
      error
    );

    throw error;

  }

}



/* =========================================================
Supabase Delete
========================================================= */

async function deleteSchedule(
  scheduleId
) {

  const {
    error
  } =
    await supabaseClient
      .from("schedules")
      .delete()
      .eq(
        "id",
        scheduleId
      );

  if (error) {

    console.error(
      "Supabase delete error:",
      error
    );

    throw error;

  }

}



/* =========================================================
Calendar
========================================================= */

function renderCalendar() {

  if (!calendar)
    return;

  calendar.innerHTML = "";

  monthTitle.textContent =
    `${currentMonth.getFullYear()}/${String(
      currentMonth.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}`;

  if (weekdayHeader) {

    weekdayHeader.innerHTML = "";

    const weekdayRow =
      document.createElement(
        "div"
      );

    weekdayRow.className =
      "weekday-row";

    const weekdays = [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat"
    ];

    weekdays.forEach(
      weekday => {

        const cell =
          document.createElement(
            "div"
          );

        cell.className =
          "weekday-cell";

        cell.textContent =
          weekday;

        weekdayRow.appendChild(
          cell
        );

      }
    );

    weekdayHeader.appendChild(
      weekdayRow
    );

  }

  const firstDay =
    new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );

  const lastDay =
    new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

  const calendarStart =
    new Date(firstDay);

  calendarStart.setDate(
    firstDay.getDate()
    -
    firstDay.getDay()
  );

  const calendarEnd =
    new Date(lastDay);

  calendarEnd.setDate(
    lastDay.getDate()
    +
    (
      6 -
      lastDay.getDay()
    )
  );

  let cursor =
    new Date(calendarStart);

  while (
    cursor <= calendarEnd
  ) {

    const weekStart =
      new Date(cursor);

    const weekEnd =
      new Date(cursor);

    weekEnd.setDate(
      weekEnd.getDate() + 6
    );

    const week =
      document.createElement(
        "div"
      );

    week.className =
      "week";

    week.style.position =
      "relative";

    const dayGrid =
      document.createElement(
        "div"
      );

    dayGrid.className =
      "day-grid";

    const scheduleLayer =
      document.createElement(
        "div"
      );

    scheduleLayer.className =
      "schedule-layer";

    for (
      let i = 0;
      i < 7;
      i++
    ) {

      const date =
        new Date(weekStart);

      date.setDate(
        weekStart.getDate() + i
      );

      const day =
        createDay(date);

      dayGrid.appendChild(
        day
      );

    }

    week.appendChild(
      dayGrid
    );

    const lanes = [];

    const weekSchedules =
      schedules.filter(
        schedule =>
          scheduleOverlapsWeek(
            schedule,
            weekStart,
            weekEnd
          )
      );

    weekSchedules.forEach(
      schedule => {

        const segment =
          getWeekScheduleSegment(
            schedule,
            weekStart,
            weekEnd
          );

        if (!segment)
          return;

        let laneIndex = 0;

        while (true) {

          if (
            !lanes[laneIndex]
          ) {

            lanes[laneIndex] = [];

          }

          const overlaps =
            lanes[laneIndex].some(
              existingSegment =>
                existingSegment.startColumn
                <=
                segment.endColumn
                &&
                existingSegment.endColumn
                >=
                segment.startColumn
            );

          if (!overlaps)
            break;

          laneIndex++;

        }

        lanes[laneIndex].push(
          segment
        );

        const item =
          createSchedule(
            schedule,
            segment,
            laneIndex
          );

        scheduleLayer.appendChild(
          item
        );

      }
    );

const scheduleHeight =
  Math.max(
    180,
    42
    +
    (
      lanes.length
      *
      22
    )
    +
    10
  );

week.style.minHeight =
  `${scheduleHeight}px`;

dayGrid.style.minHeight =
  `${scheduleHeight}px`;

week.appendChild(
  scheduleLayer
);

    calendar.appendChild(
      week
    );

    cursor.setDate(
      cursor.getDate() + 7
    );

  }

  updateLanguage();

}



/* =========================================================
Day
========================================================= */

function hexToRgba(hex, alpha) {

  const r =
    parseInt(
      hex.slice(1, 3),
      16
    );

  const g =
    parseInt(
      hex.slice(3, 5),
      16
    );

  const b =
    parseInt(
      hex.slice(5, 7),
      16
    );

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;

}

function createDay(date) {

  const day =
    document.createElement(
      "div"
    );

  day.className =
    "day";

  if (
    date.getMonth()
    !==
    currentMonth.getMonth()
  ) {

    day.classList.add(
      "other-month"
    );

  }

  const today =
    new Date();

  if (
    formatDate(date)
    ===
    formatDate(today)
  ) {

    day.classList.add(
      "today"
    );

  }

  const header =
    document.createElement(
      "div"
    );

  header.className =
    "day-header";

  header.textContent =
    date.getDate();

  day.appendChild(
    header
  );

  return day;

}


/* =========================================================
Schedule / Week
========================================================= */

function scheduleOverlapsWeek(
  schedule,
  weekStart,
  weekEnd
) {

  const scheduleStart =
    new Date(
      schedule.start
    );

  const scheduleEnd =
    new Date(
      schedule.end
    );

  if (
    Number.isNaN(
      scheduleStart.getTime()
    )
    ||
    Number.isNaN(
      scheduleEnd.getTime()
    )
  ) {

    return false;

  }

  const rangeStart =
    new Date(weekStart);

  rangeStart.setHours(
    0,
    0,
    0,
    0
  );

  const rangeEnd =
    new Date(weekEnd);

  rangeEnd.setDate(
    rangeEnd.getDate() + 1
  );

  rangeEnd.setHours(
    0,
    0,
    0,
    0
  );

  return (
    scheduleStart < rangeEnd
    &&
    scheduleEnd > rangeStart
  );

}



/* =========================================================
Week Schedule Segment
========================================================= */

function getWeekScheduleSegment(
  schedule,
  weekStart,
  weekEnd
) {

  const scheduleStart =
    new Date(
      schedule.start
    );

  const scheduleEnd =
    new Date(
      schedule.end
    );

  if (
    Number.isNaN(
      scheduleStart.getTime()
    )
    ||
    Number.isNaN(
      scheduleEnd.getTime()
    )
  ) {

    return null;

  }

  function getJSTDate(date) {

    const parts =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "Asia/Tokyo",

          year:
            "numeric",

          month:
            "2-digit",

          day:
            "2-digit"
        }
      )
        .formatToParts(
          date
        );

    const year =
      parts.find(
        part =>
          part.type === "year"
      ).value;

    const month =
      parts.find(
        part =>
          part.type === "month"
      ).value;

    const day =
      parts.find(
        part =>
          part.type === "day"
      ).value;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

  }

  const startDate =
    getJSTDate(
      scheduleStart
    );

  const endDate =
    getJSTDate(
      scheduleEnd
    );

  const weekStartDate =
    new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate()
    );

  let startColumn =
    Math.round(
      (
        startDate
        -
        weekStartDate
      )
      /
      (
        24
        *
        60
        *
        60
        *
        1000
      )
    );

  let endColumn =
    Math.round(
      (
        endDate
        -
        weekStartDate
      )
      /
      (
        24
        *
        60
        *
        60
        *
        1000
      )
    );

  startColumn =
    Math.max(
      0,
      Math.min(
        6,
        startColumn
      )
    );

  endColumn =
    Math.max(
      startColumn,
      Math.min(
        6,
        endColumn
      )
    );

  return {
    startColumn,
    endColumn
  };

}



/* =========================================================
Schedule
========================================================= */




function getCoordinateLabel(
  level,
  x,
  y
) {

  const coordinates =
    FORTRESS_COORDINATES[level] || [];

  const match =
    coordinates.find(
      coordinate =>
        String(coordinate.x) === String(x) &&
        String(coordinate.y) === String(y)
    );

  return match?.label || `${x}:${y}`;

}


function createSchedule(
  schedule,
  segment,
  laneIndex
) {

  const button =
    document.createElement(
      "button"
    );

  button.className =
    "schedule";

  button.setAttribute(
    "translate",
    "no"
  );

  button.style.position =
    "absolute";

  /*
  Guild determines the schedule color.
  The stored database color is intentionally
  ignored here so old schedules are also
  automatically converted.
  */

  const scheduleColor =
    guildColor(
      schedule.guild
    );

  button.style.background =
    scheduleColor;

const textColor =
  getScheduleTextColor(
    scheduleColor
  );

button.style.color =
  textColor;


  button.style.pointerEvents =
    "auto";


const coordinateLabel =
  getCoordinateLabel(
    schedule.fortress,
    schedule.x,
    schedule.y
  );

const coordinateBadge =
  document.createElement("span");

coordinateBadge.className =
  `coordinate-badge ${schedule.fortress.toLowerCase()}`;

coordinateBadge.textContent =
  coordinateLabel;

button.appendChild(coordinateBadge);

const guildLabel =
  document.createElement("span");

guildLabel.textContent =
  ` ${schedule.guild}`;

button.appendChild(guildLabel);

  

  button.style.left =
    `calc(${segment.startColumn} * (100% / 7) + 4px)`;

  button.style.width =
    `calc(${segment.endColumn - segment.startColumn + 1} * (100% / 7) - 8px)`;

  button.style.top =
    `${38 + laneIndex * 22}px`;

  button.addEventListener(
    "click",
    () =>
      showDetails(
        schedule
      )
  );

  return button;

}



/* =========================================================
Add Schedule
========================================================= */

document
  .getElementById(
    "addScheduleBtn"
  )
  .addEventListener(
    "click",
    () => {

      resetForm();
      
      const startDate =
        new Date();

      const endDate =
        new Date();

      endDate.setDate(
        endDate.getDate() + 3
      );

      const formatInputDate =
        date =>
          date.getFullYear() +
          "-" +
          String(
            date.getMonth() + 1
          ).padStart(2, "0") +
          "-" +
          String(
            date.getDate()
          ).padStart(2, "0");

      document.getElementById(
        "startDate"
      ).value =
        formatInputDate(startDate);

      document.getElementById(
        "endDate"
      ).value =
        formatInputDate(endDate);


      
      dialog.showModal();

    }
  );



function resetForm() {

  form.reset();

  updateFortressOptions();

  document.getElementById(
    "deleteBtn"
  ).style.display =
    "none";

  const title =
    document.getElementById(
      "dialogTitle"
    );

  title.dataset.mode =
    "add";

  title.textContent =
    "Add Schedule";

  selectedSchedule =
    null;

}



/* =========================================================
Dialog Close
========================================================= */

document
  .getElementById(
    "closeDialog"
  )
  .addEventListener(
    "click",
    () =>
      dialog.close()
  );



document
  .getElementById(
    "cancelBtn"
  )
  .addEventListener(
    "click",
    () =>
      dialog.close()
  );



/* =========================================================
Fortress Options by League
========================================================= */

function updateFortressOptions() {

  const league =
    document.getElementById(
      "league"
    ).value;

  const fortressSelect =
    document.getElementById(
      "fortress"
    );

  if (!fortressSelect)
    return;

  const maxLevel = {

    Bronze: 5,

    Silver: 6,

    Gold: 7

  }[league] || 4;

  Array.from(
    fortressSelect.options
  ).forEach(
    option => {

      const level =
        parseInt(
          option.value.replace(
            "Lv",
            ""
          ),
          10
        );

      option.hidden =
        maxLevel
          ? level > maxLevel
          : false;

    }
  );

  updateCoordinateOptions();

}



/* =========================================================
Coordinate Options by Fortress
========================================================= */

function updateCoordinateOptions() {

  const fortress =
    document.getElementById(
      "fortress"
    ).value;

  const coordinateSelect =
    document.getElementById(
      "coordinate"
    );

  if (!coordinateSelect)
    return;

  coordinateSelect.innerHTML = "";

  const placeholder =
    document.createElement(
      "option"
    );

  placeholder.value = "";

  placeholder.textContent =
    "Select Coordinate";

  placeholder.selected = true;

  placeholder.disabled = true;

  coordinateSelect.appendChild(
    placeholder
  );

  const coordinates =
    FORTRESS_COORDINATES[
      fortress
    ] || [];

  coordinates.forEach(
    coordinate => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        `${coordinate.x}:${coordinate.y}`;

      option.textContent =
        coordinate.label
          ? `${coordinate.x}:${coordinate.y} (${coordinate.label})`
          : `${coordinate.x}:${coordinate.y}`;

      coordinateSelect.appendChild(
        option
      );

    }
  );

}



/* =========================================================
League Validation
========================================================= */

function validateLeagueFortress(
  league,
  fortress
) {

  /*
  Lv4 has no league restriction.
  */

  if (
    fortress === "Lv4"
  ) {

    return true;

  }

  const allowed =
    LEAGUE_LIMITS[
      league
    ];

  if (!allowed)
    return false;

  return allowed.includes(
    fortress
  );

}



/* =========================================================
Save
========================================================= */

form.addEventListener(
  "submit",
  async eventSubmit => {

    eventSubmit.preventDefault();

    const league =
      document.getElementById(
        "league"
      ).value;

    const fortress =
      document.getElementById(
        "fortress"
      ).value;

    const coordinate =
      document.getElementById(
        "coordinate"
      ).value;

    const [x, y] =
      coordinate.split(":");

    const guild =
      document.getElementById(
        "guild"
      ).value;

    const startDate =
      document.getElementById(
        "startDate"
      ).value;

    const startGMT =
      document.getElementById(
        "startGMT"
      ).value;

    const endDate =
      document.getElementById(
        "endDate"
      ).value;

    const endGMT =
      document.getElementById(
        "endGMT"
      ).value;

    const description =
      document.getElementById(
        "description"
      ).value.trim();

    const error =
      document.getElementById(
        "formError"
      );

    error.textContent =
      "";

    if (
      !validateLeagueFortress(
        league,
        fortress
      )
    ) {

      error.textContent =
        "This league cannot challenge the selected fortress.";

      return;

    }

    if (
      !coordinate
    ) {

      error.textContent =
        "Please select a coordinate.";

      return;

    }

    const start =
      new Date(
        `${startDate}T${startGMT}:00Z`
      );

    const end =
      new Date(
        `${endDate}T${endGMT}:00Z`
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

      error.textContent =
        "Please enter valid dates and times.";

      return;

    }

    if (
      end - start
      <
      72 * 60 * 60 * 1000
    ) {

      error.textContent =
        "End must be at least 3 days after Start.";

      return;

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
      start < eventStart
      ||
      end > eventEnd
    ) {

      error.textContent =
        "The schedule must be inside the event period.";

      return;

    }

    const schedule = {

      id:
        selectedSchedule
          ? selectedSchedule.id
          : crypto.randomUUID(),

      league,

      fortress,

      x,

      y,

      guild,

      start:
        start.toISOString(),

      end:
        end.toISOString(),

      description,

      /*
      Guild color is always determined
      automatically.
      */

      color:
        guildColor(
          guild
        ),

  creatorId:
    selectedSchedule
      ? selectedSchedule.creatorId
      : creatorId

    };

    try {

      if (
        !selectedSchedule
      ) {

        await insertSchedule(
          schedule
        );

      }

      else {

        if (
          selectedSchedule.creatorId !== creatorId
          &&
          !window.s222AdminState?.isAdmin
        ) {

          error.textContent =
            "Only the creator can edit this schedule.";

          return;

        }

        await updateSchedule(
          schedule
        );

      }

      await loadSchedules();

      dialog.close();

    }

    catch (
      saveError
    ) {

      console.error(
        saveError
      );

      error.textContent =
        "Failed to save schedule.";

    }

  }
);



/* =========================================================
Details
========================================================= */

function showDetails(
  schedule
) {

  selectedSchedule =
    schedule;

  document.getElementById(
    "detailTitle"
  ).textContent =
    `${fortressIcon(
      schedule.fortress
    )} ${schedule.x}:${schedule.y} ${schedule.guild}`;

  const start =
    new Date(
      schedule.start
    );

  const end =
    new Date(
      schedule.end
    );

  const content =
    document.getElementById(
      "detailContent"
    );

  content.innerHTML = `

<div class="detail-item">

  <div class="detail-label">
    Guild VS League
  </div>

  <div class="detail-value">
    ${escapeHTML(
      schedule.league || "—"
    )}
  </div>

</div>



<div class="detail-item">

  <div class="detail-label">
    Fortress
  </div>

  <div class="detail-value">
    ${escapeHTML(
      schedule.fortress
    )}
  </div>

</div>



<div class="detail-item">

  <div class="detail-label">
    Coordinate
  </div>

  <div class="detail-value">
    ${escapeHTML(
      schedule.x
    )}:${escapeHTML(
      schedule.y
    )}
  </div>

</div>



<div class="detail-item">

  <div class="detail-label">
    Guild
  </div>

  <div class="detail-value">
    ${escapeHTML(
      schedule.guild
    )}
  </div>

</div>



<div class="detail-item">

  <div class="detail-label">
    Start
  </div>

  <div class="detail-value">

    ${formatGMT(start)}
    GMT

    <br>

    ${formatJST(start)}
    JST

  </div>

</div>



<div class="detail-item">

  <div class="detail-label">
    End / Planned Handover
  </div>

  <div class="detail-value">

    ${formatGMT(end)}
    GMT

    <br>

    ${formatJST(end)}
    JST

  </div>

</div>



<div class="detail-item">

  <div class="detail-label">
    Description
  </div>

  <div class="detail-value">

    ${escapeHTML(
      schedule.description || "—"
    )}

  </div>

</div>

`;

  document.getElementById(
    "editSchedule"
  ).style.display =
    schedule.creatorId === creatorId
    ||
    window.s222AdminState?.isAdmin
      ? "inline-block"
      : "none";

  detailDialog.showModal();

}



/* =========================================================
Date Formatting
========================================================= */

function formatGMT(date) {

  return date.toLocaleString(
    "en-GB",
    {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }
  );

}



function formatJST(date) {

  return date.toLocaleString(
    "en-GB",
    {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }
  );

}



function escapeHTML(text) {

  return String(text)
    .replace(
      /[&<>"']/g,
      character => {

        const map = {

          "&": "&amp;",

          "<": "&lt;",

          ">": "&gt;",

          '"': "&quot;",

          "'": "&#039;"

        };

        return map[
          character
        ];

      }
    );

}



/* =========================================================
Detail Buttons
========================================================= */

document
  .getElementById(
    "closeDetail"
  )
  .addEventListener(
    "click",
    () =>
      detailDialog.close()
  );



document
  .getElementById(
    "detailClose"
  )
  .addEventListener(
    "click",
    () =>
      detailDialog.close()
  );



document
  .getElementById(
    "editSchedule"
  )
  .addEventListener(
    "click",
    () => {

      if (!selectedSchedule)
        return;

      detailDialog.close();

      openEditForm(
        selectedSchedule
      );

    }
  );



/* =========================================================
Edit Form
========================================================= */

function openEditForm(
  schedule
) {

  selectedSchedule =
    schedule;

  const title =
    document.getElementById(
      "dialogTitle"
    );

  title.dataset.mode =
    "edit";

  title.textContent =
    "Edit Schedule";

  document.getElementById(
    "league"
  ).value =
    schedule.league || "";

  document.getElementById(
    "fortress"
  ).value =
    schedule.fortress;

  updateFortressOptions();

  document.getElementById(
    "coordinate"
  ).value =
    `${schedule.x}:${schedule.y}`;

  document.getElementById(
    "guild"
  ).value =
    schedule.guild;

  const start =
    new Date(
      schedule.start
    );

  const end =
    new Date(
      schedule.end
    );

  document.getElementById(
    "startDate"
  ).value =
    start.toISOString()
      .slice(0, 10);

  document.getElementById(
    "startGMT"
  ).value =
    start.toISOString()
      .slice(11, 16);

  document.getElementById(
    "startJST"
  ).value =
    formatTimeJST(start);

  document.getElementById(
    "endDate"
  ).value =
    end.toISOString()
      .slice(0, 10);

  document.getElementById(
    "endGMT"
  ).value =
    end.toISOString()
      .slice(11, 16);

  document.getElementById(
    "endJST"
  ).value =
    formatTimeJST(end);

  document.getElementById(
    "description"
  ).value =
    schedule.description || "";

  document.getElementById(
    "deleteBtn"
  ).style.display =
    "block";

  document.getElementById(
    "formError"
  ).textContent =
    "";

  dialog.showModal();

}



function formatTimeJST(
  date
) {

  return date.toLocaleTimeString(
    "en-GB",
    {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }
  );

}



/* =========================================================
Delete
========================================================= */

document
  .getElementById(
    "deleteBtn"
  )
  .addEventListener(
    "click",
    async () => {

      if (!selectedSchedule)
        return;

      if (
        selectedSchedule.creatorId !== creatorId
        &&
        !window.s222AdminState?.isAdmin
      )
        return;

      if (
        !confirm(
          "Delete this schedule?"
        )
      )
        return;

      try {

        await deleteSchedule(
          selectedSchedule.id
        );

        await loadSchedules();

        dialog.close();

      }

      catch (error) {

        console.error(error);

        alert(
          "Failed to delete schedule."
        );

      }

    }
  );



/* =========================================================
Month Navigation
========================================================= */

document
  .getElementById(
    "prevMonth"
  )
  .addEventListener(
    "click",
    () => {

      currentMonth =
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() - 1,
          1
        );

      renderCalendar();

    }
  );



document
  .getElementById(
    "nextMonth"
  )
  .addEventListener(
    "click",
    () => {

      currentMonth =
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          1
        );

      renderCalendar();

    }
  );



/* =========================================================
Refresh
========================================================= */

document
  .getElementById("refreshBtn")
  .addEventListener(
    "click",
    () =>
      loadSchedules()
  );


/* =========================================================
Resize
========================================================= */

window.addEventListener(
  "resize",
  () => {

    updateLanguage();

  }
);



/* =========================================================
GMT / JST Inputs
========================================================= */

const startGMT =
  document.getElementById(
    "startGMT"
  );

const startJST =
  document.getElementById(
    "startJST"
  );

const endGMT =
  document.getElementById(
    "endGMT"
  );

const endJST =
  document.getElementById(
    "endJST"
  );



if (
  startGMT
  &&
  startJST
) {

  startGMT.addEventListener(
    "input",
    () =>
      updateJST(
        startGMT,
        startJST
      )
  );

  startJST.addEventListener(
    "input",
    () =>
      updateGMT(
        startJST,
        startGMT
      )
  );

}



if (
  endGMT
  &&
  endJST
) {

  endGMT.addEventListener(
    "input",
    () =>
      updateJST(
        endGMT,
        endJST
      )
  );

  endJST.addEventListener(
    "input",
    () =>
      updateGMT(
        endJST,
        endGMT
      )
  );

}



/* =========================================================
League Change
========================================================= */

document
  .getElementById(
    "league"
  )
  .addEventListener(
    "change",
    updateFortressOptions
  );



/* =========================================================
Fortress Change
========================================================= */

document
  .getElementById(
    "fortress"
  )
  .addEventListener(
    "change",
    updateCoordinateOptions
  );



/* =========================================================
Initial
========================================================= */

setupGuildSelect();

updateFortressOptions();

updateLanguage();

updateCurrentTime();


/* =========================================================
Supabase Realtime
========================================================= */

supabaseClient
  .channel("s222-calendar")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "schedules"
    },
    () => {
      loadSchedules();
    }
  )
  .subscribe();
