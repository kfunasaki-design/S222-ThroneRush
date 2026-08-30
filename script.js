// =====================================
// S222 ThroneRush Manual
// Markdown Loader + Section Control
// =====================================

document.addEventListener("DOMContentLoaded", function () {

    const markdownContainer =
        document.getElementById("markdown-content");


    // =====================================
    // OPEN SECTION
    // =====================================

    window.openSection = function (sectionId) {

        const sections =
            document.querySelectorAll(
                "#markdown-content section"
            );


        sections.forEach(function (section) {

            section.classList.remove("open");

        });


        const target =
            document.getElementById(sectionId);


        if (!target) return;


        target.classList.add("open");


        setTimeout(function () {

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }, 50);

    };


    // =====================================
    // CREATE SECTIONS FROM MARKDOWN
    // =====================================

    function buildSections() {

        const headings =
            markdownContainer.querySelectorAll("h2");


        headings.forEach(function (heading) {

            const section =
                document.createElement("section");


            // IDを取得
            const sectionId =
                heading.id ||
                heading.textContent
                    .toLowerCase()
                    .trim()
                    .replace(/[–—]/g, "-")
                    .replace(/\s+/g, "-");


            section.id = sectionId;


            // h2をsectionへ移動
            section.appendChild(heading);


            // コンテンツ領域
            const content =
                document.createElement("div");

            content.className =
                "section-content";


            // 次のh2までの要素を移動
            let next =
                section.nextSibling;


            while (
                next &&
                !(
                    next.nodeType === 1 &&
                    next.tagName === "H2"
                )
            ) {

                const current = next;

                next = next.nextSibling;

                content.appendChild(current);

            }


            section.appendChild(content);


            // Markdownコンテナへ追加
            markdownContainer.appendChild(section);


            // 見出しクリック
            heading.style.cursor = "pointer";


            heading.addEventListener(
                "click",
                function () {

                    const isOpen =
                        section.classList.contains("open");


                    document
                        .querySelectorAll(
                            "#markdown-content section"
                        )
                        .forEach(function (item) {

                            item.classList.remove("open");

                        });


                    // 閉じる → 何もしない
                    if (isOpen) {

                        return;

                    }


                    section.classList.add("open");

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


            // Markdownからsection構築
            buildSections();


            // URLハッシュがあれば開く
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


            markdownContainer.innerHTML = `

                <p>
                    Failed to load manual content.
                </p>

            `;

        });


    // =====================================
    // MANUAL SEARCH
    // =====================================

    const searchInput =
        document.getElementById("manual-search");

    const resultsBox =
        document.getElementById(
            "manual-search-results"
        );


    function normalize(text) {

        return text
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

    }


    function clearHighlights() {

        const sections =
            document.querySelectorAll(
                "#markdown-content section"
            );


        sections.forEach(function (section) {

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


            clearHighlights();

            return;

        }


        matches.forEach(function (section) {

            const heading =
                section.querySelector("h2");


            const title =
                heading
                    ? heading.innerText.trim()
                    : "Section";


            const text =
                normalize(section.innerText);


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
                    ${text.substring(0, 120)}
                </span>

            `;


            result.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    openSection(
                        section.id
                    );


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
    // SEARCH INPUT
    // =====================================

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

            if (event.key === "Escape") {

                this.value = "";

                showResults("");

                this.blur();

            }

        }
    );

});
