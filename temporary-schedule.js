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
