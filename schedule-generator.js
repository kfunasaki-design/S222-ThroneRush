/* =========================================================
S222 Throne Rush
Schedule Generator
========================================================= */


/* =========================================================
Elements
========================================================= */

const generatorFortress =
  document.getElementById(
    "generatorFortress"
  );

const generatorGuildCount =
  document.getElementById(
    "generatorGuildCount"
  );

const generatorAttackCount =
  document.getElementById(
    "generatorAttackCount"
  );

const generatorFirstAttack =
  document.getElementById(
    "generatorFirstAttack"
  );

const generatorRangeStart =
  document.getElementById(
    "generatorRangeStart"
  );

const generatorRangeEnd =
  document.getElementById(
    "generatorRangeEnd"
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

let generatedCandidate =
  null;


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

    generatedCandidate =
      null;


    const fortress =
      generatorFortress.value;

    const guildCount =
      Number(
        generatorGuildCount.value
      );

    const attackCount =
      Number(
        generatorAttackCount.value
      );

    const firstAttack =
      generatorFirstAttack.value;

    const rangeStart =
      generatorRangeStart.value;

    const rangeEnd =
      generatorRangeEnd.value;

    const lag =
      Number(
        generatorLag.value
      );


    /* -----------------------------------------------------
    Validation
    ----------------------------------------------------- */

    if (
      !fortress
    ) {

      generatorResult.textContent =
        "Please select a Fortress Level.";

      return;

    }


    if (
      !guildCount ||
      guildCount < 1
    ) {

      generatorResult.textContent =
        "Please enter a valid Guild Count.";

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


    if (
      !firstAttack
    ) {

      generatorResult.textContent =
        "Please enter the First Attack time.";

      return;

    }


    if (
      !rangeStart ||
      !rangeEnd
    ) {

      generatorResult.textContent =
        "Please enter the Attack Time Range.";

      return;

    }


    if (
      rangeStart >= rangeEnd
    ) {

      generatorResult.textContent =
        "Attack Time Range End must be after Start.";

      return;

    }


    if (
      lag < 0
    ) {

      generatorResult.textContent =
        "Allowed Lag cannot be negative.";

      return;

    }


    /* -----------------------------------------------------
    Candidate

    Actual calculation will be added later.
    ----------------------------------------------------- */

    generatedCandidate = {

      fortress,

      guildCount,

      attackCount,

      firstAttack,

      rangeStart,

      rangeEnd,

      lag

    };


    /* -----------------------------------------------------
    Temporary display
    ----------------------------------------------------- */

    generatorResult.textContent =
      [
        "Generator Input",
        "",
        `Fortress: ${fortress}`,
        `Guild Count: ${guildCount}`,
        `Attack Count: ${attackCount}`,
        `First Attack: GMT ${firstAttack}`,
        `Attack Range: GMT ${rangeStart} - ${rangeEnd}`,
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
      !generatedCandidate
    ) {

      return;

    }


    /*
      Calendar transfer will be added
      after the schedule calculation
      is completed.
    */

    console.log(
      "Generated candidate:",
      generatedCandidate
    );

  }
);
