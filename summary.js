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

    adminEventStart.value =
      data.event_start
      ||
      "";

  }


  if (
    adminEventEnd
  ) {

    adminEventEnd.value =
      data.event_end
      ||
      "";

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
          `${eventStart}T00:00:00`
        );

      const eventEndDate =
        new Date(
          `${eventEnd}T23:59:59`
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
                eventStart,

              event_end:
                eventEnd,

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

initializeAdminAuth();
