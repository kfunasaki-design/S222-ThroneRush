/* =========================================================
S222 Throne Rush
Schedule Generator
========================================================= */


/* =========================================================
Elements
========================================================= */

const generatorGuildCount =
  document.getElementById(
    "generatorGuildCount"
  );

const generatorStart =
  document.getElementById(
    "generatorStart"
  );

const generatorEnd =
  document.getElementById(
    "generatorEnd"
  );

const generatorAttackCount =
  document.getElementById(
    "generatorAttackCount"
  );

const generatorLag =
  document.getElementById(
    "generatorLag"
  );

const generatorGenerateBtn =
  document.getElementById(
    "generatorGenerateBtn"
  );

const generatorResult =
  document.getElementById(
    "generatorResult"
  );

const generatorGoBtn =
  document.getElementById(
    "generatorGoBtn"
  );


/* =========================================================
State
========================================================= */

let generatedCandidates = [];

let selectedCandidate = null;


/* =========================================================
Generate
========================================================= */

generatorGenerateBtn.addEventListener(
  "click",
  () => {

    generatorResult.textContent =
      "";

    generatorGoBtn.disabled =
      true;

    generatedCandidates =
      [];

    selectedCandidate =
      null;


    const guildCount =
      Number(
        generatorGuildCount.value
      );

    const start =
      generatorStart.value;

    const end =
      generatorEnd.value;

    const attackCount =
      Number(
        generatorAttackCount.value
      );

    const lag =
      Number(
        generatorLag.value
      );


    if (
      !guildCount ||
      guildCount < 1
    ) {

      generatorResult.textContent =
        "Please enter a valid Guild Count.";

      return;

    }


    if (
      !start ||
      !end
    ) {

      generatorResult.textContent =
        "Please enter the available time.";

      return;

    }


    if (
      new Date(end)
      <=
      new Date(start)
    ) {

      generatorResult.textContent =
        "Available End must be after Available Start.";

      return;

    }


    if (
      !attackCount ||
      attackCount < 1
    ) {

      generatorResult.textContent =
        "Please enter a valid Attack Count.";

      return;

    }


    /*
      Temporary result.

      Actual schedule generation
      will be added later.
    */

    generatedCandidates = [

      {
        guildCount,
        start,
        end,
        attackCount,
        lag
      }

    ];


    selectedCandidate =
      generatedCandidates[0];


    generatorResult.textContent =
      [
        "Generator input received.",
        "",
        `Guild Count: ${guildCount}`,
        `Available Start: ${start}`,
        `Available End: ${end}`,
        `Attack Count: ${attackCount}`,
        `Allowed Lag: ±${lag} min`
      ].join("\n");


    generatorGoBtn.disabled =
      false;

  }
);


/* =========================================================
GO
========================================================= */

generatorGoBtn.addEventListener(
  "click",
  () => {

    if (
      !selectedCandidate
    ) {

      return;

    }


    /*
      Calendar transfer
      will be added later.
    */

    console.log(
      "Selected candidate:",
      selectedCandidate
    );

  }
);
