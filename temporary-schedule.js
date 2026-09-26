/* =========================================================
S222 Throne Rush
Temporary Schedule
========================================================= */


/* =========================================================
State
========================================================= */

let temporarySchedules = [];


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

        league:
          schedule.league,

        fortress:
          schedule.fortress,

        x:
          schedule.x,

        y:
          schedule.y,

        guild:
          "仮ギルド",

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

  let renderedCount = 0;

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

      const item =
        createTemporarySchedule(
          schedule,
          segment
        );

      scheduleLayer.appendChild(
        item
      );

      renderedCount++;

    }
  );

  return renderedCount;

}


/* =========================================================
Create Temporary Schedule
========================================================= */

function createTemporarySchedule(
  schedule,
  segment
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
    "38px";

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
    ` ${schedule.guild}`;

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
