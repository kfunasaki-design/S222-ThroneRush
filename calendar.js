/* =========================================================
   S222 Throne Rush Calendar
========================================================= */


/* =========================================================
   Supabase
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

let zoom = 1;


/* =========================================================
   Event Period
========================================================= */

const event = {

  start: "2026-08-01",

  end: "2026-09-25"

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


/* =========================================================
   Helpers
========================================================= */

function formatDate(date) {

  const y =
    date.getFullYear();

  const m =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const d =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${y}-${m}-${d}`;

}


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


function defaultColor(level) {

  switch (level) {

    case "Lv7":
      return "#3b78d8";

    case "Lv6":
      return "#d64545";

    case "Lv5":
      return "#d09a20";

    default:
      return "#3c9b62";

  }

}


/* =========================================================
   GMT / JST
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


  const date =
    new Date();


  date.setUTCHours(
    hour,
    minute,
    0,
    0
  );


  date.setHours(
    date.getHours() + 9
  );


  jstInput.value =
    String(
      date.getHours()
    ).padStart(2, "0")
    + ":" +
    String(
      date.getMinutes()
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


  const date =
    new Date();


  date.setUTCHours(
    hour - 9,
    minute,
    0,
    0
  );


  gmtInput.value =
    String(
      date.getUTCHours()
    ).padStart(2, "0")
    + ":" +
    String(
      date.getUTCMinutes()
    ).padStart(2, "0");

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
        "start",
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

    return;

  }


  schedules =
    (data || []).map(
      schedule => ({

        id:
          schedule.id,

        fortress:
          schedule.fortress,

        x:
          schedule.x,

        y:
          schedule.y,

        guild:
          schedule.guild,

        start:
          schedule.start,

        end:
          schedule.end,

        description:
          schedule.description || "",

        color:
          schedule.color,

        creatorId:
          schedule.creator_id

      })
    );


  renderCalendar();

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

        fortress:
          schedule.fortress,

        x:
          schedule.x,

        y:
          schedule.y,

        guild:
          schedule.guild,

        start:
          schedule.start,

        end:
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

        fortress:
          schedule.fortress,

        x:
          schedule.x,

        y:
          schedule.y,

        guild:
          schedule.guild,

        start:
          schedule.start,

        end:
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

  calendar.innerHTML = "";


  monthTitle.textContent =
    currentMonth.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric"
      }
    );


  eventPeriod.textContent =
    `Event: ${event.start} → ${event.end}`;

  /* =========================
     Weekday Header
  ========================= */

  const weekdayRow =
    document.createElement("div");

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
        document.createElement("div");

      cell.className =
        "weekday-cell";

      cell.textContent =
        weekday;

      weekdayRow.appendChild(
        cell
      );

    }
  );

  calendar.appendChild(
    weekdayRow
  );


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
    new Date(
      calendarStart
    );


  while (
    cursor <= calendarEnd
  ) {

    const week =
      document.createElement(
        "div"
      );


    week.className =
      "week";


    for (
      let i = 0;
      i < 7;
      i++
    ) {

      const date =
        new Date(cursor);


      date.setDate(
        cursor.getDate() + i
      );


      const day =
        createDay(date);


      week.appendChild(
        day
      );

    }


    calendar.appendChild(
      week
    );


    cursor.setDate(
      cursor.getDate() + 7
    );

  }

}


/* =========================================================
   Day
========================================================= */

function createDay(
  date
) {

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

  const list =
    document.createElement(
      "div"
    );


  list.className =
    "schedule-list";


  schedules
    .filter(
      schedule =>
        scheduleOverlapsDay(
          schedule,
          date
        )
    )
    .sort(
      (a, b) =>
        new Date(a.start)
        -
        new Date(b.start)
    )
    .forEach(
      schedule => {

        const item =
          createSchedule(
            schedule
          );


        list.appendChild(
          item
        );

      }
    );


  day.appendChild(
    header
  );


  day.appendChild(
    list
  );


  return day;

}


/* =========================================================
   Schedule
========================================================= */

function scheduleOverlapsDay(
  schedule,
  date
) {

  const start =
    new Date(date);


  start.setHours(
    0,
    0,
    0,
    0
  );


  const end =
    new Date(start);


  end.setDate(
    end.getDate() + 1
  );


  const scheduleStart =
    new Date(
      schedule.start
    );


  const scheduleEnd =
    new Date(
      schedule.end
    );


  return (
    scheduleStart < end
    &&
    scheduleEnd > start
  );

}


/* =========================================================
   Schedule Button
========================================================= */

function createSchedule(
  schedule
) {

  const button =
    document.createElement(
      "button"
    );


  button.className =
    "schedule";


  button.style.background =
    schedule.color;


  button.textContent =
    `${fortressIcon(
      schedule.fortress
    )} ${schedule.x}:${schedule.y} ${schedule.guild}`;


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

const dialog =
  document.getElementById(
    "scheduleDialog"
  );


const form =
  document.getElementById(
    "scheduleForm"
  );


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


  document.getElementById(
    "dialogTitle"
  ).textContent =
    "Add Schedule";


  selectedSchedule =
    null;

}


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


    const start =
      new Date(
        `${startDate}T${startGMT}:00Z`
      );


    const end =
      new Date(
        `${endDate}T${endGMT}:00Z`
      );


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
        "The schedule must be inside the event period.";

      return;

    }


    const schedule = {

      id:
        selectedSchedule
          ? selectedSchedule.id
          : crypto.randomUUID(),

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

      }

      else {

        if (
          selectedSchedule
            .creatorId
          !==
          creatorId
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

const detailDialog =
  document.getElementById(
    "detailDialog"
  );


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

        ${formatGMT(
          start
        )}

        GMT

        <br>

        ${formatJST(
          start
        )}

        JST

      </div>

    </div>


    <div class="detail-item">

      <div class="detail-label">
        End / Planned Handover
      </div>

      <div class="detail-value">

        ${formatGMT(
          end
        )}

        GMT

        <br>

        ${formatJST(
          end
        )}

        JST

      </div>

    </div>


    <div class="detail-item">

      <div class="detail-label">
        Description
      </div>

      <div class="detail-value">

        ${escapeHTML(
          schedule.description
          ||
          "—"
        )}

      </div>

    </div>

  `;


  document.getElementById(
    "scheduleColor"
  ).value =
    schedule.color;


  document.getElementById(
    "scheduleColor"
  ).oninput =
    async colorEvent => {

      schedule.color =
        colorEvent.target.value;


      try {

        await updateSchedule(
          schedule
        );

        await loadSchedules();

      }

      catch (
        error
      ) {

        console.error(
          error
        );

      }

    };


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

function formatGMT(
  date
) {

  return date
    .toLocaleString(
      "en-GB",
      {

        timeZone:
          "UTC",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false

      }
    );

}


function formatJST(
  date
) {

  return date
    .toLocaleString(
      "en-GB",
      {

        timeZone:
          "Asia/Tokyo",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false

      }
    );

}


function escapeHTML(
  text
) {

  return String(text)
    .replace(
      /[&<>"']/g,
      character => {

        const map = {

          "&":
            "&amp;",

          "<":
            "&lt;",

          ">":
            "&gt;",

          '"':
            "&quot;",

          "'":
            "&#039;"

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

      if (
        !selectedSchedule
      )
        return;


      detailDialog.close();


      openEditForm(
        selectedSchedule
      );

    }
  );


function openEditForm(
  schedule
) {

  selectedSchedule =
    schedule;


  document.getElementById(
    "dialogTitle"
  ).textContent =
    "Edit Schedule";


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
    formatTimeJST(
      start
    );


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
    formatTimeJST(
      end
    );


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

  return date
    .toLocaleTimeString(
      "en-GB",
      {

        timeZone:
          "Asia/Tokyo",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false

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

      if (
        !selectedSchedule
      )
        return;


      if (
        selectedSchedule
          .creatorId
        !==
        creatorId
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

      catch (
        error
      ) {

        console.error(
          error
        );

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
   Pinch Zoom / Touch Scroll
========================================================= */

let pinchStart = null;


/* =========================================================
   Distance
========================================================= */

function distance(
  touch1,
  touch2
) {

  const dx =
    touch1.clientX -
    touch2.clientX;

  const dy =
    touch1.clientY -
    touch2.clientY;

  return Math.sqrt(
    dx * dx +
    dy * dy
  );

}


/* =========================================================
   Minimum Zoom
========================================================= */

function getMinimumZoom() {

  const calendarWidth =
    calendar.scrollWidth;

  const wrapperWidth =
    calendarWrapper.clientWidth;


  if (
    calendarWidth <= 0 ||
    wrapperWidth <= 0
  ) {

    return 0.4;

  }


  return Math.min(
    1,
    wrapperWidth / calendarWidth
  );

}


/* =========================================================
   Apply Zoom
========================================================= */

function applyZoom() {

  const minZoom =
    getMinimumZoom();


  zoom =
    Math.min(
      Math.max(
        zoom,
        minZoom
      ),
      2
    );


  calendar.style.transform =
    `scale(${zoom})`;


  /*
    transform does not change
    the actual scrollable width.

    Add the extra visual width
    so the right side remains
    scrollable when zoomed in.
  */

  if (
    zoom > 1
  ) {

    calendar.style.marginRight =
      `${calendar.scrollWidth * (zoom - 1)}px`;

  }

  else {

    calendar.style.marginRight =
      "0px";

  }

}


/* =========================================================
   Touch Start
========================================================= */

calendarWrapper
  .addEventListener(
    "touchstart",
    touchEvent => {

      if (
        touchEvent.touches.length === 2
      ) {

        pinchStart =
          distance(
            touchEvent.touches[0],
            touchEvent.touches[1]
          );

      }

    },
    {
      passive: true
    }
  );


/* =========================================================
   Touch Move
========================================================= */

calendarWrapper
  .addEventListener(
    "touchmove",
    touchEvent => {

      /*
        Two fingers =
        custom pinch zoom
      */

      if (
        touchEvent.touches.length !== 2 ||
        pinchStart === null
      ) {

        return;

      }


      /*
        Prevent normal browser
        scrolling while pinching.
      */

      touchEvent.preventDefault();


      const current =
        distance(
          touchEvent.touches[0],
          touchEvent.touches[1]
        );


      const ratio =
        current /
        pinchStart;


      zoom *= ratio;


      applyZoom();


      pinchStart =
        current;

    },
    {
      passive: false
    }
  );


/* =========================================================
   Touch End
========================================================= */

calendarWrapper
  .addEventListener(
    "touchend",
    touchEvent => {

      if (
        touchEvent.touches.length < 2
      ) {

        pinchStart =
          null;

      }

    }
  );


/* =========================================================
   Resize
========================================================= */

window.addEventListener(
  "resize",
  () => {

    applyZoom();

  }
);


/* =========================================================
   Initial Zoom
========================================================= */

applyZoom();
/* =========================================================
   Initialize
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


/* =========================================================
   Load
========================================================= */

loadSchedules();
