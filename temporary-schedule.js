/* =========================================================
S222 Throne Rush
Temporary Schedule
========================================================= */


/* =========================================================
State
========================================================= */

let temporarySchedules = [];

const savedTemporarySchedules =
  localStorage.getItem(
    "s222_temporary_schedules"
  );

if (
  savedTemporarySchedules
) {

  temporarySchedules =
    JSON.parse(
      savedTemporarySchedules
    );

}


/* =========================================================
Import Generated Schedules
========================================================= */

function setTemporarySchedules(
  generatedSchedules
) {

  if (
    !Array.isArray(
      generatedSchedules
    )
  ) {

    temporarySchedules = [];

    return;

  }

  temporarySchedules =
    generatedSchedules.map(
      schedule => ({

        isTemporary:
          true,

        league:
          schedule.league,

        fortress:
          schedule.fortress,

        x:
          schedule.x,

        y:
          schedule.y,

        guild:
          "",

        start:
          schedule.start,

        end:
          schedule.end,

        description:
          schedule.description,

        color:
          schedule.color,

        creatorId:
          schedule.creatorId,

        _generatorGroup:
          schedule._generatorGroup

      })
    );

  console.log(
    "Temporary schedules:",
    temporarySchedules
  );

  localStorage.setItem(
    "s222_temporary_schedules",
    JSON.stringify(
      temporarySchedules
    )
  );

}


/* =========================================================
Temporary Schedule Connection
========================================================= */

function getTemporaryScheduleConnection(
  schedule
) {

  const sameGroupSchedules =
    temporarySchedules
      .filter(
        other =>
          other !== schedule
          &&
          other._generatorGroup ===
            schedule._generatorGroup
          &&
          other.fortress ===
            schedule.fortress
      )
      .sort(
        (a, b) =>
          new Date(a.start)
          -
          new Date(b.start)
      );

  const currentStart =
    new Date(
      schedule.start
    );

  const previous =
    sameGroupSchedules
      .filter(
        other =>
          new Date(other.start)
          <
          currentStart
      )
      .pop();

  const next =
    sameGroupSchedules.find(
      other =>
        new Date(other.start)
        >
        currentStart
    );

  return {

    hasPrevious:
      !!previous,

    hasNext:
      !!next

  };

}


/* =========================================================
Render Temporary Schedules
========================================================= */

function renderTemporarySchedules(
  scheduleLayer,
  weekStart,
  weekEnd
) {

  if (
    !Array.isArray(
      temporarySchedules
    )
    ||
    temporarySchedules.length === 0
  ) {

    return 0;

  }

  const lanes = [];

  temporarySchedules.forEach(
    schedule => {

      if (
        !scheduleOverlapsWeek(
          schedule,
          weekStart,
          weekEnd
        )
      ) {

        return;

      }

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
        createTemporarySchedule(
          schedule,
          segment,
          laneIndex
        );

      scheduleLayer.appendChild(
        item
      );

    }
  );

  return lanes.length;

}


/* =========================================================
Create Temporary Schedule
========================================================= */

function createTemporarySchedule(
  schedule,
  segment,
  laneIndex
) {

  const button =
    document.createElement(
      "button"
    );

  button.className =
    "temporary-schedule";

  button.setAttribute(
    "translate",
    "no"
  );

  button.style.position =
    "absolute";

  button.style.left =
    `calc(${segment.startColumn} * (100% / 7) + 4px)`;

  button.style.width =
    `calc(${segment.endColumn - segment.startColumn + 1} * (100% / 7) - 8px)`;

  button.style.top =
    `${38 + laneIndex * 20}px`;

  button.dataset.temporary =
    "true";


  /* =====================================================
  Connection
  ===================================================== */

  const connection =
    getTemporaryScheduleConnection(
      schedule
    );


  /* =====================================================
  Week Boundary
  ===================================================== */

  button.classList.toggle(
    "schedule-first",
    segment.isFirst
  );

  button.classList.toggle(
    "schedule-last",
    segment.isLast
  );


  /* =====================================================
  Previous Indicator
  ===================================================== */

  if (
    connection.hasPrevious
  ) {

    const indicator =
      document.createElement(
        "span"
      );

    indicator.textContent =
      "◀";

    indicator.className =
      "schedule-indicator prev";

    button.appendChild(
      indicator
    );

  }


  /* =====================================================
  Coordinate
  ===================================================== */

  const coordinateLabel =
    getCoordinateLabel(
      schedule.fortress,
      schedule.x,
      schedule.y
    );

  const coordinateBadge =
    document.createElement(
      "span"
    );

  coordinateBadge.className =
    `coordinate-badge ${schedule.fortress.toLowerCase()}`;

  coordinateBadge.textContent =
    coordinateLabel;

  button.appendChild(
    coordinateBadge
  );


  /* =====================================================
  Generator Group
  ===================================================== */

  const groupLabel =
    document.createElement(
      "span"
    );

groupLabel.className =
  "temporary-group";

  button.appendChild(
    groupLabel
  );


  /* =====================================================
  Next Indicator
  ===================================================== */

  if (
    connection.hasNext
  ) {

    const indicator =
      document.createElement(
        "span"
      );

    indicator.textContent =
      "▶";

    indicator.className =
      "schedule-indicator next";

    button.appendChild(
      indicator
    );

  }


  /* =====================================================
  Click
  ===================================================== */

  button.addEventListener(
    "click",
    () =>
      showDetails(
        schedule
      )
  );

  return button;

}
