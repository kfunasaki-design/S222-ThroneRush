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

  const title =
    document.querySelector(
      ".header h1"
    );

  if (title) {

    title.textContent =
      "S222TR Calendar";

    title.setAttribute(
      "translate",
      "no"
    );

  }

  const addButton =
    document.getElementById(
      "addScheduleBtn"
    );

  if (addButton) {

    addButton.textContent =
      "Add Schedule";

    addButton.setAttribute(
      "translate",
      "no"
    );

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

button.style.textShadow =
  textColor === "#111111"
    ? "none"
    : `
      0 0 3px rgba(0,0,0,1),
      0 0 7px rgba(0,0,0,.8),
      0 0 11px rgba(0,0,0,.5)
    `;

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

      creatorId

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
