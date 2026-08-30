document.addEventListener("DOMContentLoaded", async function () {

    const markdownContainer =
        document.getElementById("markdown-content");

    const searchInput =
        document.getElementById("manual-search");

    const resultsBox =
        document.getElementById("manual-search-results");


    /* =====================================
       MARKDOWN FILE
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


        const html =
            marked.parse(markdown);


        /* =====================================
           TEMPORARY PARSE
           ===================================== */

        const temp =
            document.createElement("div");

        temp.innerHTML = html;


        /* =====================================
           BUILD SECTIONS
           ===================================== */

        const fragment =
            document.createDocumentFragment();


        let currentSection = null;
        let currentContent = null;


        Array.from(temp.children).forEach(function (element) {


            /* =============================
               H2 = NEW SECTION
               ============================= */

            if (element.tagName === "H2") {


                currentSection =
                    document.createElement("section");


                const sectionId =
                    element.textContent
                        .toLowerCase()
                        .trim()
                        .replace(/[–—]/g, "-")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "");


                currentSection.id =
                    sectionId;


                const heading =
                    document.createElement("h2");

                heading.textContent =
                    element.textContent;


                currentContent =
                    document.createElement("div");

                currentContent.className =
                    "section-content";


                currentSection.appendChild(
                    heading
                );

                currentSection.appendChild(
                    currentContent
                );


                fragment.appendChild(
                    currentSection
                );


                /* =============================
                   H2 CLICK
                   ============================= */

                heading.addEventListener(
                    "click",
                    function () {

                        toggleSection(
                            currentSection
                        );

                    }
                );


            }


            /* =============================
               CONTENT
               ============================= */

            else if (currentContent) {

                currentContent.appendChild(
                    element.cloneNode(true)
                );

            }

        });


        /* =====================================
           INSERT SECTIONS
           ===================================== */

        markdownContainer.innerHTML = "";

        markdownContainer.appendChild(
            fragment
        );


        /* =====================================
           READY
           ===================================== */

        initializeSearch();


    } catch (error) {

        console.error(error);

        markdownContainer.innerHTML = `

            <p style="color:#ff5555;">
                Failed to load manual.md
            </p>

        `;

    }



    /* =====================================
       SECTION TOGGLE
       ===================================== */

    function toggleSection(section) {

        section.classList.toggle("open");

    }



    /* =====================================
       OPEN SECTION
       GLOBAL FUNCTION
       ===================================== */

    window.openSection =
        function (sectionId) {

            const sections =
                document.querySelectorAll(
                    "#markdown-content section"
                );


            sections.forEach(
                function (section) {

                    section.classList.remove(
                        "open"
                    );

                }
            );


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


            target.classList.add(
                "open"
            );


            setTimeout(
                function () {

                    target.scrollIntoView({

                        behavior: "smooth",

                        block: "start"

                    });

                },

                50

            );

        };



    /* =====================================
       SEARCH
       ===================================== */

    function initializeSearch() {

        if (
            !searchInput ||
            !resultsBox
        ) {

            return;

        }


        const sections =
            Array.from(
                document.querySelectorAll(
                    "#markdown-content section"
                )
            );


        function normalize(text) {

            return text
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

        }


        function clearHighlights() {

            sections.forEach(
                function (section) {

                    section.classList.remove(
                        "manual-highlight"
                    );

                }
            );

        }


        function showResults(query) {

            resultsBox.innerHTML = "";


            if (!query) {

                resultsBox.style.display =
                    "none";

                clearHighlights();

                return;

            }


            const normalizedQuery =
                normalize(query);


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


            if (matches.length === 0) {

                resultsBox.innerHTML =
                    '<div class="manual-search-empty">No results found.</div>';


                clearHighlights();

                return;

            }


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


                    result.innerHTML = `

                        <span class="manual-search-result-title">
                            ${title}
                        </span>

                        <span class="manual-search-result-text">
                            ${text.substring(0, 120)}
                        </span>

                    `;


                    result.addEventListener(
                        "click",
                        function (event) {

                            event.preventDefault();


                            window.openSection(
                                section.id
                            );


                            clearHighlights();


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
           ESC KEY
           ===================================== */

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    this.value = "";


                    showResults("");


                    this.blur();

                }

            }
        );

    }

});
