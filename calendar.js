/* =========================================================
   S222 Throne Rush Calendar
========================================================= */


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


/*
  Prototype event period.

  後で管理者設定に変更。
*/

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
  document.getElementById("calendar");

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
   Local Storage
========================================================= */

function saveLocal() {

  localStorage.setItem(

    "s222_schedules",

    JSON.stringify(schedules)

  );
}


function loadLocal() {

  const data =
    localStorage.getItem(
      "s222_schedules"
    );

  if (!data) return;

  try {

    schedules =
      JSON.parse(data);

  } catch {

    schedules = [];

  }

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
   GMT / JST conversion
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


  /*
    Start from Sunday.
  */

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

      week.appendChild(day);

    }


    calendar.appendChild(
      week
    );


    cursor.setDate(
      cursor.getDate() + 7
    );

  }

}


function createDay(date) {

  const day =
    document.createElement(
      "div"
    );

  day.className =
    "day";


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
    date.toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        month: "numeric",
        day: "numeric"
      }
    );


  const list =
    document.createElement(
      "div"
    );

  list.className =
    "schedule-list";


  /*
    All schedules which overlap
    this day are displayed.
  */

  schedules
    .filter(
      schedule =>
        scheduleOverlapsDay(
          schedule,
          date
        )
    )
    .sort(
      (a,b) =>
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
    new Date(
      date
    );

  start.setHours(
    0,0,0,0
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
  eventSubmit => {

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


    /*
      Store GMT as UTC.
    */

    const start =
      new Date(
        `${startDate}T${startGMT}:00Z`
      );


    const end =
      new Date(
        `${endDate}T${endGMT}:00Z`
      );


    const error =
      document.getElementById(
        "formError"
      );


    error.textContent = "";


    /*
      Minimum 72 hours.
    */

    if (
      end - start
      <
      72 * 60 * 60 * 1000
    ) {

      error.textContent =
        "End must be at least 3 days after Start.";

      return;

    }


    /*
      Event boundary.
    */

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
          : defaultColor(fortress),

      creatorId

    };


    /*
      New schedule
    */

    if (
      !selectedSchedule
    ) {

      schedules.push(
        schedule
      );

    }


    /*
      Edit schedule
    */

    else {

      const index =
        schedules.findIndex(
          item =>
            item.id
            ===
            selectedSchedule.id
        );


      /*
        Only creator can edit
        in this prototype.
      */

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


      schedules[index] =
        schedule;

    }


    saveLocal();

    dialog.close();

    renderCalendar();

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
        ${schedule.fortress}
      </div>

    </div>


    <div class="detail-item">

      <div class="detail-label">
        Coordinate
      </div>

      <div class="detail-value">
        ${schedule.x}:${schedule.y}
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


  /*
    Color can be changed
    by anyone.
  */

  document.getElementById(
    "scheduleColor"
  ).oninput =
    event => {

      schedule.color =
        event.target.value;

      saveLocal();

      renderCalendar();

    };


  /*
    Edit button only for creator.
  */

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
      .slice(0,10);


  document.getElementById(
    "startGMT"
  ).value =
    start.toISOString()
      .slice(11,16);


  document.getElementById(
    "startJST"
  ).value =
    formatTimeJST(start);


  document.getElementById(
    "endDate"
  ).value =
    end.toISOString()
      .slice(0,10);


  document.getElementById(
    "endGMT"
  ).value =
    end.toISOString()
      .slice(11,16);


  document.getElementById(
    "endJST"
  ).value =
    formatTimeJST(end);


  document.getElementById(
    "description"
  ).value =
    schedule.description;


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
    () => {

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


      schedules =
        schedules.filter(
          schedule =>
            schedule.id
            !==
            selectedSchedule.id
        );


      saveLocal();

      dialog.close();

      renderCalendar();

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
   Pinch Zoom
========================================================= */

let pinchStart = null;


calendarWrapper
  .addEventListener(
    "touchstart",
    event => {

      if (
        event.touches.length
        ===
        2
      ) {

        pinchStart =
          distance(
            event.touches[0],
            event.touches[1]
          );

      }

    },
    {
      passive: true
    }
  );


calendarWrapper
  .addEventListener(
    "touchmove",
    event => {

      if (
        event.touches.length
        !==
        2
        ||
        pinchStart === null
      )
        return;


      const current =
        distance(
          event.touches[0],
          event.touches[1]
        );


      const ratio =
