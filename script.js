// =====================================
// S222 ThroneRush Manual
// Markdown Loader
// =====================================

document.addEventListener("DOMContentLoaded", function () {

    const markdownContainer =
        document.getElementById("markdown-content");

    const searchInput =
        document.getElementById("manual-search");

    const resultsBox =
        document.getElementById("manual-search-results");


    // =====================================
    // SECTION ID MAP
    // ロードマップのリンク先と完全一致
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
    // グローバル化
    // ロードマップ onclick から呼び出す
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


        // 他を閉じる
        document
            .querySelectorAll(
                "#markdown-content section"
            )
            .forEach(function (section) {

                section.classList.remove("open");

            });


        // 対象を開く
        target.classList.add("open");


        // 少し待ってからスクロール
        setTimeout(function () {

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }, 50);

    };


    // =====================================
    // CREATE SECTIONS
    // h2単位で安全に構築
    // =====================================

    function buildSections() {

        // markedが生成したHTMLを一旦退避
        const nodes =
            Array.from(
                markdownContainer.childNodes
            );


        // コンテナを空にする
        markdownContainer.innerHTML = "";


        let currentSection = null;
        let currentContent = null;


        nodes.forEach(function (node) {

            // H2なら新しいsection開始
            if (
                node.nodeType === 1 &&
                node.tagName === "H2"
            ) {

                currentSection =
                    document.createElement("section");


                const title =
                    node.textContent.trim();


                // ID決定
                const sectionId =
                    sectionIdMap[title] ||
                    title
                        .toLowerCase()
                        .replace(/[–—]/g, "-")
                        .replace(/\s+/g, "-");


                currentSection.id =
                    sectionId;


                // h2をsectionに追加
                currentSection.appendChild(node);


                // section-content作成
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


                // 見出しクリックイベント
                node.style.cursor = "pointer";


                node.addEventListener(
                    "click",
                    function () {

                        currentSection.classList.toggle(
                            "open"
                        );

                    }
                );


                return;

            }


            // H2以降の要素を
            // 現在のsection-contentへ追加
            if (
                currentContent
            ) {

                currentContent.appendChild(
                    node
                );

            }

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

            // Markdown → HTML
            markdownContainer.innerHTML =
                marked.parse(markdown);


            // section構築
            buildSections();


            // URL Hash対応
            const hash =
                window.location.hash
                    .replace("#", "");


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
            .querySelectorAll(
                "#markdown-content section"
            )
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


        resultsBox.style.display =
            "block";


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


            resultsBox.appendChild(
                result
            );

        });

    }


    // =====================================
    // SEARCH EVENTS
    // =====================================

    if (searchInput) {

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

});
