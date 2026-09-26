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


const guildLabel =
  document.createElement(
    "span"
  );

guildLabel.textContent =
  ` ${schedule._generatorGroup}`;

button.appendChild(
  guildLabel
);


  button.addEventListener(
    "click",
    () =>
      showDetails(
        schedule
      )
  );

  return button;

}
