// =====================================
// S222 ThroneRush Manual
// Markdown Loader + Section Control
// =====================================

document.addEventListener("DOMContentLoaded", function () {

```
const markdownContainer =
    document.getElementById("markdown-content");

const searchInput =
    document.getElementById("manual-search");

const resultsBox =
    document.getElementById("manual-search-results");


// =====================================
// SECTION ID MAP
// =====================================

const sectionIdMap = {

    "Overview": "overview",
    "Rules": "rules",
    "Restriction": "restriction",
    "Faq": "faq",
    "FAQ": "faq",

    "Lv7 Fortress": "lv7",
    "Lv6 Fortress": "lv6",
    "Lv5 Fortress": "lv5",

    "Lv1–4 Fortresses": "lv1-4",
    "Lv1-4 Fortresses": "lv1-4",

    "Calendar": "calendar",
    "Image Editor": "image-editor",
    "Forum": "forum"

};


// =====================================
// OPEN SECTION
// Roadmap / Search
// =====================================

window.openSection = function (sectionId) {

    const target =
        document.getElementById(sectionId);

    if (!target) {

        console.warn(
            "Section not found:",
            sectionId
        );

        return;

    }


    document
        .querySelectorAll("#markdown-content section")
        .forEach(function (section) {

            section.classList.remove("open");

        });


    target.classList.add("open");


    setTimeout(function () {

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 50);

};


// =====================================
// BUILD SECTIONS FROM MARKDOWN
// =====================================

function buildSections() {

    const nodes =
        Array.from(
            markdownContainer.childNodes
        );


    markdownContainer.innerHTML = "";


    let currentSection = null;
    let currentContent = null;


    nodes.forEach(function (node) {

        if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.tagName === "H2"
        ) {

            currentSection =
                document.createElement("section");


            const title =
                node.textContent.trim();


            const sectionId =
                sectionIdMap[title] ||
                title
                    .toLowerCase()
                    .replace(/[–—]/g, "-")
                    .replace(/\s+/g, "-");


            currentSection.id = sectionId;


            currentSection.appendChild(node);


            currentContent =
                document.createElement("div");

            currentContent.className =
                "section-content";


            currentSection.appendChild(
                currentContent
            );


            markdownContainer.appendChild(
                currentSection
            );

        }

        else if (currentContent) {

            currentContent.appendChild(
                node
            );

        }

    });


    // =====================================
    // SECTION TITLE CLICK
    // DOM構築完了後に一括登録
    // =====================================

    const sectionHeadings =
        markdownContainer.querySelectorAll(
            "section > h2"
        );


    sectionHeadings.forEach(function (heading) {

        heading.style.cursor = "pointer";


        heading.addEventListener(
            "click",
            function () {

                const section =
                    heading.parentElement;


                const isOpen =
                    section.classList.contains("open");


                // 一旦すべて閉じる
                document
                    .querySelectorAll(
                        "#markdown-content section"
                    )
                    .forEach(function (item) {

                        item.classList.remove("open");

                    });


                // 閉じていた場合のみ開く
                if (!isOpen) {

                    section.classList.add("open");

                }

            }
        );

    });

}


// =====================================
// MARKDOWN LOAD
// =====================================

fetch("manual.md")

    .then(function (response) {

        if (!response.ok) {

            throw new Error(
                "Failed to load manual.md"
            );

        }


        return response.text();

    })


    .then(function (markdown) {

        markdownContainer.innerHTML =
            marked.parse(markdown);


        buildSections();


        const hash =
            window.location.hash.replace("#", "");


        if (hash) {

            openSection(hash);

        }

    })


    .catch(function (error) {

        console.error(
            "Markdown loading error:",
            error
        );


        markdownContainer.innerHTML =
            "<p>Failed to load manual content.</p>";

    });


// =====================================
// SEARCH
// =====================================

function normalize(text) {

    return text
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

}


function clearHighlights() {

    document
        .querySelectorAll("#markdown-content section")
        .forEach(function (section) {

            section.classList.remove(
                "manual-highlight"
            );

        });

}


function showResults(query) {

    resultsBox.innerHTML = "";


    if (!query) {

        resultsBox.style.display = "none";

        clearHighlights();

        return;

    }


    const normalizedQuery =
        normalize(query);


    const sections =
        Array.from(
            document.querySelectorAll(
                "#markdown-content section"
            )
        );


    const matches =
        sections.filter(function (section) {

            return normalize(
                section.innerText
            ).includes(
                normalizedQuery
            );

        });


    resultsBox.style.display = "block";


    if (matches.length === 0) {

        resultsBox.innerHTML =
            '<div class="manual-search-empty">No results found.</div>';

        return;

    }


    matches.forEach(function (section) {

        const heading =
            section.querySelector("h2");


        const title =
            heading
                ? heading.textContent.trim()
                : "Section";


        const result =
            document.createElement("a");


        result.href =
            "#" + section.id;


        result.className =
            "manual-search-result";


        result.innerHTML = `

            <span class="manual-search-result-title">
                ${title}
            </span>

            <span class="manual-search-result-text">
                ${normalize(section.innerText)
                    .substring(0, 120)}
            </span>

        `;


        result.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                openSection(section.id);


                clearHighlights();


                setTimeout(function () {

                    section.classList.add(
                        "manual-highlight"
                    );

                }, 300);


                setTimeout(function () {

                    section.classList.remove(
                        "manual-highlight"
                    );

                }, 2100);

            }
        );


        resultsBox.appendChild(result);

    });

}


// =====================================
// SEARCH EVENTS
// =====================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            showResults(this.value);

        }
    );


    searchInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                this.value = "";

                showResults("");

                this.blur();

            }

        }
    );

}
```

});
