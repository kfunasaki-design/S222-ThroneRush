/* =====================================
   S222 THRONERUSH MANUAL
   MARKDOWN LOADER
   ===================================== */

document.addEventListener("DOMContentLoaded", async function () {

    const content =
        document.getElementById("markdown-content");


    /* =====================================
       LOAD MARKDOWN
       ===================================== */

    try {

        const response =
            await fetch("manual.md");

        if (!response.ok) {

            throw new Error(
                "Failed to load manual.md"
            );

        }

        const markdown =
            await response.text();


        content.innerHTML =
            marked.parse(markdown);


        /* =====================================
           PREPARE SECTIONS
           ===================================== */

        prepareSections();


        /* =====================================
           SEARCH
           ===================================== */

        setupSearch();


        /* =====================================
           OPEN INITIAL SECTION
           ===================================== */

        const hash =
            window.location.hash.substring(1);

        if (hash) {

            openSection(hash);

        } else {

            openSection("overview");

        }

    }

    catch (error) {

        console.error(error);

        content.innerHTML = `
            <section class="open">
                <h2>Manual</h2>

                <div class="section-content">

                    <p>
                        Failed to load manual content.
                    </p>

                </div>

            </section>
        `;

    }

});


/* =====================================
   PREPARE MARKDOWN SECTIONS
   ===================================== */

function prepareSections() {

    const content =
        document.getElementById(
            "markdown-content"
        );


    const headings =
        Array.from(
            content.querySelectorAll("h2")
        );


    headings.forEach(function (heading) {

        /* ---------------------------------
           CREATE SECTION
           --------------------------------- */

        const section =
            document.createElement("section");


        /* ---------------------------------
           ASSIGN ORIGINAL SECTION ID
           --------------------------------- */

        const title =
            heading.textContent
                .trim()
                .toLowerCase();


        const sectionIds = {

            "overview":
                "overview",

            "rules":
                "rules",

            "restriction":
                "restriction",

            "faq":
                "faq",

            "lv7 fortress":
                "lv7",

            "lv6 fortress":
                "lv6",

            "lv5 fortress":
                "lv5",

            "lv1–4 fortresses":
                "lv1-4",

            "lv1-4 fortresses":
                "lv1-4",

            "calendar":
                "calendar",

            "image editor":
                "image-editor",

            "forum":
                "forum"

        };


        const sectionId =
            sectionIds[title]
            || createSectionId(title);


        section.id =
            sectionId;


        /* ---------------------------------
           INSERT SECTION
           --------------------------------- */

        heading.parentNode.insertBefore(
            section,
            heading
        );


        /* ---------------------------------
           MOVE HEADING
           --------------------------------- */

        section.appendChild(
            heading
        );


        /* ---------------------------------
           CREATE CONTENT WRAPPER
           --------------------------------- */

        const wrapper =
            document.createElement("div");


        wrapper.className =
            "section-content";


        /* ---------------------------------
           MOVE CONTENT UNTIL NEXT H2
           --------------------------------- */

        let current =
            heading.nextSibling;


        while (current) {

            const next =
                current.nextSibling;


            if (
                current.nodeType === 1 &&
                current.tagName === "H2"
            ) {

                break;

            }


            wrapper.appendChild(
                current
            );


            current =
                next;

        }


        section.appendChild(
            wrapper
        );


        /* ---------------------------------
           HEADING CLICK
           --------------------------------- */

        heading.addEventListener(
            "click",
            function () {

                openSection(
                    sectionId
                );

            }
        );

    });

}


/* =====================================
   CREATE FALLBACK SECTION ID
   ===================================== */

function createSectionId(text) {

    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

}


/* =====================================
   OPEN SECTION
   ===================================== */

function openSection(sectionId) {

    const sections =
        document.querySelectorAll(
            "main section"
        );


    /* ---------------------------------
       CLOSE ALL SECTIONS
       --------------------------------- */

    sections.forEach(
        function (section) {

            section.classList.remove(
                "open"
            );

        }
    );


    /* ---------------------------------
       FIND TARGET
       --------------------------------- */

    const target =
        document.getElementById(
            sectionId
        );


    if (!target) {

        console.warn(
            "Section not found:",
            sectionId
        );

        return;

    }


    /* ---------------------------------
       OPEN TARGET
       --------------------------------- */

    target.classList.add(
        "open"
    );


    /* ---------------------------------
       UPDATE URL HASH
       --------------------------------- */

    if (
        window.location.hash !==
        "#" + sectionId
    ) {

        history.replaceState(
            null,
            "",
            "#" + sectionId
        );

    }


    /* ---------------------------------
       SCROLL
       --------------------------------- */

    setTimeout(
        function () {

            target.scrollIntoView({

                behavior: "smooth",

                block: "start"

            });

        },
        50
    );

}


/* =====================================
   MANUAL SEARCH
   ===================================== */

function setupSearch() {

    const searchInput =
        document.getElementById(
            "manual-search"
        );


    const resultsBox =
        document.getElementById(
            "manual-search-results"
        );


    const sections =
        Array.from(
            document.querySelectorAll(
                "main > section"
            )
        );


    /* =====================================
       NORMALIZE TEXT
       ===================================== */

    function normalize(text) {

        return text
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

    }


    /* =====================================
       CLEAR HIGHLIGHTS
       ===================================== */

    function clearHighlights() {

        sections.forEach(
            function (section) {

                section.classList.remove(
                    "manual-highlight"
                );

            }
        );

    }


    /* =====================================
       SHOW SEARCH RESULTS
       ===================================== */

    function showResults(query) {

        resultsBox.innerHTML = "";


        /* ---------------------------------
           EMPTY SEARCH
           --------------------------------- */

        if (!query) {

            resultsBox.style.display =
                "none";

            clearHighlights();

            return;

        }


        const normalizedQuery =
            normalize(query);


        /* ---------------------------------
           FIND MATCHES
           --------------------------------- */

        const matches =
            sections.filter(
                function (section) {

                    return normalize(
                        section.innerText
                    ).includes(
                        normalizedQuery
                    );

                }
            );


        resultsBox.style.display =
            "block";


        /* ---------------------------------
           NO RESULTS
           --------------------------------- */

        if (
            matches.length === 0
        ) {

            resultsBox.innerHTML =
                '<div class="manual-search-empty">No results found.</div>';

            clearHighlights();

            return;

        }


        /* ---------------------------------
           CREATE RESULTS
           --------------------------------- */

        matches.forEach(
            function (section) {

                const heading =
                    section.querySelector(
                        "h2"
                    );


                const title =
                    heading
                        ? heading.innerText.trim()
                        : "Section";


                const text =
                    normalize(
                        section.innerText
                    );


                const result =
                    document.createElement(
                        "a"
                    );


                result.href =
                    "#" + section.id;


                result.className =
                    "manual-search-result";


                /* ---------------------------------
                   TITLE
                   --------------------------------- */

                const titleElement =
                    document.createElement(
                        "span"
                    );


                titleElement.className =
                    "manual-search-result-title";


                titleElement.textContent =
                    title;


                /* ---------------------------------
                   PREVIEW
                   --------------------------------- */

                const textElement =
                    document.createElement(
                        "span"
                    );


                textElement.className =
                    "manual-search-result-text";


                textElement.textContent =
                    text.substring(
                        0,
                        120
                    );


                result.appendChild(
                    titleElement
                );


                result.appendChild(
                    textElement
                );


                /* ---------------------------------
                   RESULT CLICK
                   --------------------------------- */

                result.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        clearHighlights();


                        openSection(
                            section.id
                        );


                        section.classList.add(
                            "manual-highlight"
                        );


                        setTimeout(
                            function () {

                                section.classList.remove(
                                    "manual-highlight"
                                );

                            },
                            1800
                        );

                    }
                );


                resultsBox.appendChild(
                    result
                );

            }
        );

    }


    /* =====================================
       SEARCH INPUT
       ===================================== */

    searchInput.addEventListener(
        "input",
        function () {

            showResults(
                this.value
            );

        }
    );


    /* =====================================
       ESCAPE
       ===================================== */

    searchInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                this.value =
                    "";

                showResults(
                    ""
                );

                this.blur();

            }

        }
    );

}


/* =====================================
   HASH NAVIGATION
   ===================================== */

window.addEventListener(
    "hashchange",
    function () {

        const sectionId =
            window.location.hash.substring(
                1
            );


        if (sectionId) {

            openSection(
                sectionId
            );

        }

    }
);
