/* =====================================
   S222 THRONERUSH MANUAL
   MARKDOWN LOADER
   ===================================== */

document.addEventListener("DOMContentLoaded", async function () {

    const content =
        document.getElementById("markdown-content");

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

        prepareSections();

        setupSearch();

        openSection("overview");

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
   MARKDOWN SECTIONS
   ===================================== */

function prepareSections() {

    const content =
        document.getElementById("markdown-content");

    const headings =
        Array.from(
            content.querySelectorAll("h2")
        );

    headings.forEach(function (heading) {

        const section =
            document.createElement("section");

        const sectionId =
            createSectionId(
                heading.textContent
            );

        section.id =
            sectionId;

        heading.parentNode.insertBefore(
            section,
            heading
        );

        section.appendChild(
            heading
        );

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "section-content";

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

            wrapper.appendChild(current);

            current = next;

        }

        section.appendChild(wrapper);

        heading.addEventListener(
            "click",
            function () {

                openSection(sectionId);

            }
        );

    });

}


/* =====================================
   SECTION ID
   ===================================== */

function createSectionId(text) {

    const id =
        text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");

    return id;

}


/* =====================================
   OPEN SECTION
   ===================================== */

function openSection(sectionId) {

    const sections =
        document.querySelectorAll(
            "main section"
        );

    sections.forEach(function (section) {

        section.classList.remove("open");

    });

    const target =
        document.getElementById(sectionId);

    if (target) {

        target.classList.add("open");

        setTimeout(function () {

            target.scrollIntoView({

                behavior: "smooth",

                block: "start"

            });

        }, 50);

    }

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
                    section.querySelector("h2");

                const title =
                    heading
                        ? heading.innerText.trim()
                        : "Section";


                const text =
                    normalize(
                        section.innerText
                    )
                    .replace(
                        normalizedQuery,
                        " "
                    )
                    .trim();


                const result =
                    document.createElement("a");


                result.href =
                    "#" + section.id;

                result.className =
                    "manual-search-result";


                const titleElement =
                    document.createElement("span");

                titleElement.className =
                    "manual-search-result-title";

                titleElement.textContent =
                    title;


                const textElement =
                    document.createElement("span");

                textElement.className =
                    "manual-search-result-text";

                textElement.textContent =
                    text.substring(0, 120);


                result.appendChild(
                    titleElement
                );

                result.appendChild(
                    textElement
                );


                result.addEventListener(
                    "click",
                    function () {

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


    searchInput.addEventListener(
        "input",
        function () {

            showResults(
                this.value
            );

        }
    );


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


/* =====================================
   HASH NAVIGATION
   ===================================== */

window.addEventListener(
    "hashchange",
    function () {

        const sectionId =
            window.location.hash.substring(1);

        if (sectionId) {

            openSection(sectionId);

        }

    }
);
