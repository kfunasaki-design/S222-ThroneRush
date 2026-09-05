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
   Schedule Colors
========================================================= */

const SCHEDULE_COLORS = [
  "#00FFFF",
  "#FF00FF",
  "#02FF00",
  "#0000FF",
  "#FE0000",
  "#FFFF00",
  "#000000",
  "#FFFFFF"
];


/* =========================================================
   Event Period
========================================================= */

const event = {
  start: "2026-08-01",
  end: "2026-09-25"
};


/* =========================================================
   Guild Summary Rules
========================================================= */

const SUMMARY_LEVELS = [
  "Lv4",
  "Lv5",
  "Lv6",
  "Lv7"
];


/*
  Alliance standard:
  Each level = 1 fortress

  2 = warning
  3+ = restriction
*/

const ALLIANCE_STANDARD = 1;

const WARNING_COUNT = 2;

const RESTRICTION_COUNT = 3;

const TOTAL_FORTRESS_LIMIT = 6;


/*
  Average occupation target.

  Event days are divided equally
  across all participating guilds.

  Currently the base calculation uses:

  1 fortress × event duration

  This will later become configurable
  in the management panel.
*/

const AVERAGE_TOLERANCE = 0.80;


/* =========================================================
   League Fortress Access
========================================================= */

/*
  Gold
  → Lv4 / Lv5 / Lv6 / Lv7

  Silver
  → Lv4 / Lv5 / Lv6

  Bronze
  → Lv4 / Lv5
*/

const LEAGUE_MAX_LEVEL = {
  Bronze: 5,
  Silver: 6,
  Gold: 7
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


/*
  Last guild used on this device.

  This is used for the collapsed summary.
*/

let currentGuild =
  localStorage.getItem(
    "s222_current_guild"
  ) || "";


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
   Device
========================================================= */

function isMobile() {

  return window.innerWidth <= 700;

}


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

    case "Lv4":
      return "🟢";

    default:
      return "⚪";

  }

}


/* =========================================================
   Default Schedule Color
========================================================= */

function defaultColor(level) {

  switch (level) {

    case "Lv7":
      return "#0000FF";

    case "Lv6":
      return "#FE0000";

    case "Lv5":
      return "#FFFF00";

    case "Lv4":
      return "#02FF00";

    default:
      return "#FFFFFF";

  }

}


/* =========================================================
   Color Palette
========================================================= */

function setupColorPalette() {

  const palette =
    document.getElementById(
      "scheduleColorPalette"
    );

  if (!palette)
    return;

  palette.innerHTML = "";

  SCHEDULE_COLORS.forEach(
    color => {

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "color-option";

      button.dataset.color =
        color;

      button.style.backgroundColor =
        color;

      button.style.color =
        getScheduleTextColor(
          color
        );

      button.setAttribute(
        "aria-label",
        `Schedule color ${color}`
      );

      button.addEventListener(
        "click",
        async () => {

          if (!selectedSchedule)
            return;

          selectedSchedule.color =
            color;

          updateSelectedColor(
            color
          );

          try {

            await updateSchedule(
              selectedSchedule
            );

            await loadSchedules();

          }

          catch (error) {

            console.error(
              "Color update error:",
              error
            );

          }

        }
      );

      palette.appendChild(
        button
      );

    }
  );

}


/* =========================================================
   Selected Color
========================================================= */

function updateSelectedColor(color) {

  document
    .querySelectorAll(
      ".color-option"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "selected",
          button.dataset.color
            .toUpperCase()
          ===
          color.toUpperCase()
        );

      }
    );

}


/* =========================================================
   Schedule Text Color
========================================================= */

function getScheduleTextColor(color) {

  if (!color)
    return "#FFFFFF";

  switch (
    color.toUpperCase()
  ) {

    case "#00FFFF":
    case "#FF00FF":
    case "#02FF00":
    case "#FFFF00":
    case "#FFFFFF":

      return "#111111";

    case "#0000FF":
    case "#FE0000":
    case "#000000":

      return "#FFFFFF";

    default:

      return "#FFFFFF";

  }

}


/* =========================================================
   GMT / JST Input Conversion
========================================================= */

function updateJST(
  gmtInput,
  jstInput
) {

  if (!gmtInput.value)
    return;

  const [
    hour,
    minute
  ] =
    gmtInput.value
      .split(":")
      .map(Number);

  const totalMinutes =
    (hour * 60 + minute + 540)
    %
    1440;

  const jstHour =
    Math.floor(
      totalMinutes / 60
    );

  const jstMinute =
    totalMinutes % 60;

  jstInput.value =
    String(
      jstHour
    ).padStart(2, "0")
    +
    ":"
    +
    String(
      jstMinute
    ).padStart(2, "0");

}


function updateGMT(
  jstInput,
  gmtInput
) {

  if (!jstInput.value)
    return;

  const [
    hour,
    minute
  ] =
    jstInput.value
      .split(":")
      .map(Number);

  const totalMinutes =
    (hour * 60 + minute - 540 + 1440)
    %
    1440;

  const gmtHour =
    Math.floor(
      totalMinutes / 60
    );

  const gmtMinute =
    totalMinutes % 60;

  gmtInput.value =
    String(
      gmtHour
    ).padStart(2, "0")
    +
    ":"
    +
    String(
      gmtMinute
    ).padStart(2, "0");

}


/* =========================================================
   Current Time / Event Period
========================================================= */

function updateCurrentTime() {

  if (!eventPeriod)
    return;

  eventPeriod.textContent =
    `Event: ${event.start} → ${event.end}`;

}


/* =========================================================
   Responsive Translation
========================================================= */

function updateLanguage() {

  const mobile =
    isMobile();


  const title =
    document.querySelector(
      ".header h1"
    );

  if (title) {

    title.textContent =
      mobile
        ? "S222 スローンラッシュ カレンダー"
        : "S222 Throne Rush Calendar";

  }


  const addButton =
    document.getElementById(
      "addScheduleBtn"
    );

  if (addButton) {

    addButton.textContent =
      mobile
        ? "予定を追加"
        : "Add Schedule";

  }


  const refreshButton =
    document.getElementById(
      "refreshBtn"
    );

  if (refreshButton) {

    refreshButton.textContent =
      "R";

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

  const weekdaysJP = [
    "日",
    "月",
    "火",
    "水",
    "木",
    "金",
    "土"
  ];

  weekdayCells.forEach(
    (cell, index) => {

      cell.textContent =
        mobile
          ? weekdaysJP[index]
          : weekdaysEN[index];

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
        mobile
          ? "予定を編集"
          : "Edit Schedule";

    }

    else {

      dialogTitle.textContent =
        mobile
          ? "予定を追加"
          : "Add Schedule";

    }

  }


  const detailClose =
    document.getElementById(
      "detailClose"
    );

  if (detailClose) {

    detailClose.textContent =
      mobile
        ? "閉じる"
        : "Close";

  }


  const editButton =
    document.getElementById(
      "editSchedule"
    );

  if (editButton) {

    editButton.textContent =
      mobile
        ? "編集"
        : "Edit";

  }


  const cancelButton =
    document.getElementById(
      "cancelBtn"
    );

  if (cancelButton) {

    cancelButton.textContent =
      mobile
        ? "キャンセル"
        : "Cancel";

  }


  const saveButton =
    form?.querySelector(
      'button[type="submit"]'
    );

  if (saveButton) {

    saveButton.textContent =
      mobile
        ? "保存"
        : "Save";

  }


  const deleteButton =
    document.getElementById(
      "deleteBtn"
    );

  if (deleteButton) {

    deleteButton.textContent =
      mobile
        ? "削除"
        : "Delete";

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

        color:
          schedule.color,

        creatorId:
          schedule.creator_id

      })
    );

  renderCalendar();

  renderGuildSummary();

}


/* =========================================================
   Supabase Insert
========================================================= */

async function insertSchedule(schedule) {

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

async function updateSchedule(schedule) {

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

async function deleteSchedule(scheduleId) {

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
    ).padStart(2, "0")}`;


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
    (6 - lastDay.getDay())
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

          if (!lanes[laneIndex]) {

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
        (lanes.length * 34)
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
   Day
========================================================= */

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
          timeZone: "Asia/Tokyo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }
      ).formatToParts(date);

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
      (24 * 60 * 60 * 1000)
    );

  let endColumn =
    Math.round(
      (
        endDate
        -
        weekStartDate
      )
      /
      (24 * 60 * 60 * 1000)
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

  const scheduleColor =
    schedule.color
    ||
    defaultColor(
      schedule.fortress
    );

  button.style.background =
    scheduleColor;

  button.style.color =
    getScheduleTextColor(
      scheduleColor
    );

  button.style.pointerEvents =
    "auto";

  button.textContent =
    `${fortressIcon(
      schedule.fortress
    )} ${schedule.x}:${schedule.y} ${schedule.guild}`;

  button.style.left =
    `calc(${segment.startColumn} * (100% / 7) + 4px)`;

  button.style.width =
    `calc(${segment.endColumn - segment.startColumn + 1} * (100% / 7) - 8px)`;

  button.style.top =
    `${38 + laneIndex * 34}px`;

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
   League Validation
========================================================= */

function validateLeagueFortress(
  league,
  fortress
) {

  /*
    Lv1-3 is not restricted here.
  */

  if (
    fortress === "Lv1-3"
  ) {

    return true;

  }

  const level =
    Number(
      fortress.replace(
        "Lv",
        ""
      )
    );

  const maxLevel =
    LEAGUE_MAX_LEVEL[
      league
    ];

  if (!maxLevel)
    return false;

  return level <= maxLevel;

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

      dialog.showModal();

    }
  );


function resetForm() {

  form.reset();

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
    isMobile()
      ? "予定を追加"
      : "Add Schedule";

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

    const x =
      document.getElementById(
        "coordinateX"
      ).value;

    const y =
      document.getElementById(
        "coordinateY"
      ).value;

    const guild =
      document.getElementById(
        "guild"
      ).value.trim();

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


    /*
      League validation
    */

    if (
      !validateLeagueFortress(
        league,
        fortress
      )
    ) {

      error.textContent =
        isMobile()
          ? `${league}リーグでは${fortress}に挑戦できません。`
          : `${league} League cannot challenge ${fortress}.`;

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
        isMobile()
          ? "日時を正しく入力してください。"
          : "Please enter valid dates and times.";

      return;

    }


    if (
      end - start
      <
      72 * 60 * 60 * 1000
    ) {

      error.textContent =
        isMobile()
          ? "終了日時は開始日時から3日以上後にしてください。"
          : "End must be at least 3 days after Start.";

      return;

    }


    const eventStart =
      new Date(
        `${event.start}T00:00:00Z`
      );

    const eventEnd =
      new Date(
        `${event.end}T23:59:59Z`
      );

    if (
      start < eventStart
      ||
      end > eventEnd
    ) {

      error.textContent =
        isMobile()
          ? "予定はイベント期間内に設定してください。"
          : "The schedule must be inside the event period.";

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

      color:
        selectedSchedule
          ? selectedSchedule.color
          : defaultColor(
              fortress
            ),

      creatorId

    };


    try {

      if (
        !selectedSchedule
      ) {

        await insertSchedule(
          schedule
        );

        /*
          Save current guild locally.

          This guild is displayed
          in the collapsed summary.
        */

        currentGuild =
          guild;

        localStorage.setItem(
          "s222_current_guild",
          guild
        );

      }

      else {

        if (
          selectedSchedule.creatorId
          !==
          creatorId
        ) {

          error.textContent =
            isMobile()
              ? "この予定を編集できるのは作成者だけです。"
              : "Only the creator can edit this schedule.";

          return;

        }

        await updateSchedule(
          schedule
        );

        currentGuild =
          guild;

        localStorage.setItem(
          "s222_current_guild",
          guild
        );

      }


      await loadSchedules();

      dialog.close();

    }

    catch (saveError) {

      console.error(
        saveError
      );

      error.textContent =
        isMobile()
          ? "予定の保存に失敗しました。"
          : "Failed to save schedule.";

    }

  }
);


/* =========================================================
   Details
========================================================= */

function showDetails(schedule) {

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

  const mobile =
    isMobile();

  content.innerHTML = `

    <div class="detail-item">

      <div class="detail-label">
        ${mobile ? "リーグ" : "Guild VS League"}
      </div>

      <div class="detail-value">
        ${escapeHTML(
          schedule.league || "—"
        )}
      </div>

    </div>


    <div class="detail-item">

      <div class="detail-label">
        ${mobile ? "要塞" : "Fortress"}
      </div>

      <div class="detail-value">
        ${escapeHTML(
          schedule.fortress
        )}
      </div>

    </div>


    <div class="detail-item">

      <div class="detail-label">
        ${mobile ? "座標" : "Coordinate"}
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
        ${mobile ? "ギルド" : "Guild"}
      </div>

      <div class="detail-value">
        ${escapeHTML(
          schedule.guild
        )}
      </div>

    </div>


    <div class="detail-item">

      <div class="detail-label">
        ${mobile ? "開始" : "Start"}
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
        ${mobile ? "終了 / 引き渡し予定" : "End / Planned Handover"}
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
        ${mobile ? "説明" : "Description"}
      </div>

      <div class="detail-value">

        ${escapeHTML(
          schedule.description || "—"
        )}

      </div>

    </div>

  `;


  setupColorPalette();

  updateSelectedColor(
    schedule.color
    ||
    defaultColor(
      schedule.fortress
    )
  );

  document.getElementById(
    "editSchedule"
  ).style.display =
    schedule.creatorId
    ===
    creatorId
      ? "inline-block"
      : "none";

  detailDialog.showModal();

}


/* =========================================================
   Date Formatting
========================================================= */

function formatGMT(date) {

  return date
    .toLocaleString(
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

  return date
    .toLocaleString(
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

function openEditForm(schedule) {

  selectedSchedule =
    schedule;

  const title =
    document.getElementById(
      "dialogTitle"
    );

  title.dataset.mode =
    "edit";

  title.textContent =
    isMobile()
      ? "予定を編集"
      : "Edit Schedule";


  document.getElementById(
    "league"
  ).value =
    schedule.league || "";

  document.getElementById(
    "fortress"
  ).value =
    schedule.fortress;

  document.getElementById(
    "coordinateX"
  ).value =
    schedule.x;

  document.getElementById(
    "coordinateY"
  ).value =
    schedule.y;

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


function formatTimeJST(date) {

  return date
    .toLocaleTimeString(
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
        selectedSchedule.creatorId
        !==
        creatorId
      )
        return;

      if (
        !confirm(
          isMobile()
            ? "この予定を削除しますか？"
            : "Delete this schedule?"
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

        console.error(
          error
        );

        alert(
          isMobile()
            ? "予定の削除に失敗しました。"
            : "Failed to delete schedule."
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
  .getElementById(
    "refreshBtn"
  )
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


if (startGMT && startJST) {

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


if (endGMT && endJST) {

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
   Guild Summary
========================================================= */


/*
  Calculate total event duration in days
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
  Aggregate schedules by guild.
*/

function buildGuildSummary() {

  const guilds = {};


  schedules.forEach(
    schedule => {

      /*
        Lv1-3 are intentionally excluded
        from the occupation summary.
      */

      if (
        !SUMMARY_LEVELS.includes(
          schedule.fortress
        )
      ) {
        return;
      }


      const guildName =
        schedule.guild
        ||
        "Unknown";

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


      /*
        Update league if available.
      */

      if (
        schedule.league
      ) {

        guilds[guildName].league =
          schedule.league;

      }


      guilds[guildName]
        .levels[
          schedule.fortress
        ]
        .count += 1;


      guilds[guildName]
        .levels[
          schedule.fortress
        ]
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
   Summary Cell Status
========================================================= */

function getCellStatus(
  count,
  days
) {

  const eventDays =
    getEventDays();


  /*
    Restriction:
    3 or more fortresses
  */

  if (
    count >= RESTRICTION_COUNT
  ) {

    return "restricted";

  }


  /*
    Warning:
    2 fortresses
  */

  if (
    count >= WARNING_COUNT
  ) {

    return "warning";

  }


  /*
    No schedule
  */

  if (
    count === 0
  ) {

    return "empty";

  }


  /*
    Average occupation target

    Current base:
    1 fortress × event days

    If occupation is significantly above
    the standard average, warning.
  */

  const ratio =
    days / eventDays;

  if (
    ratio
    >
    ALLIANCE_STANDARD
  ) {

    return "warning";

  }


  if (
    ratio
    <
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

  if (
    total
    >
    TOTAL_FORTRESS_LIMIT
  ) {

    return "restricted";

  }

  return "normal";

}


/* =========================================================
   Format Summary Value
========================================================= */

function formatSummaryValue(data) {

  const days =
    Math.round(
      data.days
    );

  return `${data.count} [${days} days]`;

}


/* =========================================================
   Render Guild Summary
========================================================= */

function renderGuildSummary() {

  const tbody =
    document.querySelector(
      "#guildSummaryTable tbody"
    );

  const currentContainer =
    document.getElementById(
      "currentGuildSummary"
    );

  if (!tbody || !currentContainer)
    return;


  tbody.innerHTML = "";

  const guildData =
    buildGuildSummary();


  /*
    Full table
  */

  guildData
    .sort(
      (a, b) =>
        a.guild.localeCompare(
          b.guild
        )
    )
    .forEach(
      guild => {

        const row =
          document.createElement(
            "tr"
          );


        const guildCell =
          document.createElement(
            "td"
          );

        guildCell.textContent =
          guild.guild;

        row.appendChild(
          guildCell
        );


        const leagueCell =
          document.createElement(
            "td"
          );

        leagueCell.textContent =
          guild.league;

        row.appendChild(
          leagueCell
        );


        let totalCount = 0;

        let totalDays = 0;


        SUMMARY_LEVELS.forEach(
          level => {

            const data =
              guild.levels[level];

            totalCount +=
              data.count;

            totalDays +=
              data.days;


            const cell =
              document.createElement(
                "td"
              );

            const status =
              getCellStatus(
                data.count,
                data.days
              );

            cell.className =
              `summary-status-${status}`;

            cell.textContent =
              formatSummaryValue(
                data
              );

            row.appendChild(
              cell
            );

          }
        );


        const totalCell =
          document.createElement(
            "td"
          );

        const totalStatus =
          getTotalStatus(
            totalCount
          );

        totalCell.className =
          `summary-status-${totalStatus}`;

        totalCell.textContent =
          `${totalCount} [${Math.round(
            totalDays
          )} days]`;

        row.appendChild(
          totalCell
        );


        tbody.appendChild(
          row
        );

      }
    );


  /*
    Collapsed current guild
  */

  currentContainer.innerHTML =
    "";


  let selectedGuildData =
    guildData.find(
      guild =>
        guild.guild
        ===
        currentGuild
    );


  /*
    If this device has no current guild yet,
    show first available guild.
  */

  if (
    !selectedGuildData
    &&
    guildData.length > 0
  ) {

    selectedGuildData =
      guildData[0];

  }


  if (!selectedGuildData) {

    currentContainer.innerHTML =
      `
        <div class="summary-empty">
          No occupation data
        </div>
      `;

    return;

  }


  const card =
    document.createElement(
      "div"
    );

  card.className =
    "current-guild-card";


  const title =
    document.createElement(
      "div"
    );

  title.className =
    "current-guild-name";

  title.textContent =
    `${selectedGuildData.guild} / ${selectedGuildData.league}`;

  card.appendChild(
    title
  );


  const stats =
    document.createElement(
      "div"
    );

  stats.className =
    "current-guild-stats";


  let totalCount = 0;

  let totalDays = 0;


  SUMMARY_LEVELS.forEach(
    level => {

      const data =
        selectedGuildData.levels[
          level
        ];

      totalCount +=
        data.count;

      totalDays +=
        data.days;


      const item =
        document.createElement(
          "div"
        );

      item.className =
        "current-guild-stat";

      const status =
        getCellStatus(
          data.count,
          data.days
        );

      item.classList.add(
        `summary-status-${status}`
      );

      item.innerHTML =
        `
          <span class="stat-level">
            ${level}
          </span>

          <span class="stat-value">
            ${formatSummaryValue(data)}
          </span>
        `;

      stats.appendChild(
        item
      );

    }
  );


  const totalItem =
    document.createElement(
      "div"
    );

  totalItem.className =
    "current-guild-stat total-stat";

  totalItem.classList.add(
    `summary-status-${getTotalStatus(
      totalCount
    )}`
  );

  totalItem.innerHTML =
    `
      <span class="stat-level">
        Total
      </span>

      <span class="stat-value">
        ${totalCount} [${Math.round(
          totalDays
        )} days]
      </span>
    `;

  stats.appendChild(
    totalItem
  );


  card.appendChild(
    stats
  );

  currentContainer.appendChild(
    card
  );

}


/* =========================================================
   Summary Toggle
========================================================= */

const guildSummaryToggle =
  document.getElementById(
    "guildSummaryToggle"
  );

const guildSummaryPanel =
  document.getElementById(
    "guildSummaryPanel"
  );


if (
  guildSummaryToggle
  &&
  guildSummaryPanel
) {

  guildSummaryToggle.addEventListener(
    "click",
    () => {

      guildSummaryPanel.classList.toggle(
        "expanded"
      );

    }
  );

}


/* =========================================================
   Current Time Timer
========================================================= */

setInterval(
  updateCurrentTime,
  1000
);


/* =========================================================
   Initial
========================================================= */

setupColorPalette();

updateLanguage();

updateCurrentTime();

loadSchedules();
