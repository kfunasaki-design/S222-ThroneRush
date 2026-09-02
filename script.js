// =====================================
// S222 ThroneRush Manual
// Markdown Loader + Section Control
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
    // Markdown見出し → 固定ID
    // =====================================

    const sectionIdMap = {

        // Basic
        "overview": "overview",
        "rules": "rules",
        "restriction": "restriction",
        "faq": "faq",

        // Fortress
        "lv1-4 fortresses": "lv1-4",
        "lv1–4 fortresses": "lv1-4",
        "lv1 — 4 fortresses": "lv1-4",
        "lv1 to 4 fortresses": "lv1-4",
        "lv1-4 fortress": "lv1-4",
        "lv1–4 fortress": "lv1-4",

        "lv4 fortress": "lv1-4",
        "lv4": "lv1-4",

        "lv5 fortress": "lv5",
        "lv5": "lv5",

        "lv6 fortress": "lv6",
        "lv6": "lv6",

        "lv7 fortress": "lv7",
        "lv7": "lv7",

        // Tools
        "calendar": "calendar",
        "image editor": "image-editor",
        "forum": "forum"

    };


    // =====================================
    // NORMALIZE TITLE
    // =====================================

    function normalizeTitle(text) {

        return text
            .toLowerCase()
            .trim()
            .replace(/[–—]/g, "-")
            .replace(/\s+/g, " ");

    }


    // =====================================
    // GET SECTION ID
    // =====================================

    function getSectionId(title) {

        const normalized =
            normalizeTitle(title);


        if (sectionIdMap[normalized]) {

            return sectionIdMap[normalized];

        }


        // Mapにない場合は自動生成
        return normalized
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");

    }


    // =====================================
    // CLOSE ALL SECTIONS
    // =====================================

    function closeAllSections() {

        document
            .querySelectorAll("#markdown-content section")
            .forEach(function (section) {

                section.classList.remove("open");

            });

    }


    // =====================================
    // OPEN SECTION
    // Roadmap / Search / Hash
    // =====================================

    window.openSection = function (sectionId) {

        if (!sectionId) return;


        const target =
            document.getElementById(sectionId);


        if (!target) {

            console.warn(
                "Section not found:",
                sectionId
            );

            return;

        }


        closeAllSections();


        target.classList.add("open");


        // hashも更新
        if (
            window.history &&
            window.history.replaceState
        ) {

            window.history.replaceState(
                null,
                "",
                "#" + sectionId
            );

        }


        setTimeout(function () {

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }, 50);

    };


    // =====================================
    // BUILD SECTIONS FROM MARKDOWN
    // H2を親セクションとして構築
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

    // -----------------------------
    // CATEGORY TITLE
    // 独立したカテゴリーとして扱う
    // -----------------------------

    if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.classList.contains("category-title")
    ) {

        currentSection = null;
        currentContent = null;

        markdownContainer.appendChild(node);

        return;

    }


    // -----------------------------
    // H2 = Main Section
    // -----------------------------

    if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.tagName === "H2"
    ) {

                const title =
                    node.textContent.trim();


                const sectionId =
                    getSectionId(title);


                currentSection =
                    document.createElement("section");


                currentSection.id =
                    sectionId;


                // 見出し
                currentSection.appendChild(node);


                // 開閉コンテンツ
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


                return;

            }


            // -----------------------------
            // H2以外
            // 現在のセクションに追加
            // -----------------------------

            if (currentContent) {

                currentContent.appendChild(node);

            }

            // H2以前の要素がある場合
            else {

                markdownContainer.appendChild(node);

            }

        });


        // =====================================
        // SECTION TITLE CLICK
        // =====================================

        const sectionHeadings =
            markdownContainer.querySelectorAll(
                "section > h2"
            );


        sectionHeadings.forEach(function (heading) {

            heading.style.cursor = "pointer";


            heading.setAttribute(
                "role",
                "button"
            );


            heading.addEventListener(
                "click",
                function () {

                    const section =
                        heading.closest("section");


                    if (!section) return;


                    const isOpen =
                        section.classList.contains(
                            "open"
                        );


                    // 他を閉じる
                    closeAllSections();


                    // 閉じていた場合だけ開く
                    if (!isOpen) {

                        section.classList.add(
                            "open"
                        );

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

            // Markdown → HTML
            markdownContainer.innerHTML =
                marked.parse(markdown);


            // HTML → Collapsible Sections
            buildSections();


            // URL Hash
            const hash =
                window.location.hash.replace(
                    "#",
                    ""
                );


            if (hash) {

                setTimeout(function () {

                    openSection(hash);

                }, 100);

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
    // HASH CHANGE
    // Browser Back / Direct Links
    // =====================================

    window.addEventListener(
        "hashchange",
        function () {

            const hash =
                window.location.hash.replace(
                    "#",
                    ""
                );


            if (hash) {

                openSection(hash);

            }

        }
    );


    // =====================================
    // SEARCH
    // =====================================

    function normalize(text) {

        return text
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

    }


    // =====================================
    // CLEAR HIGHLIGHTS
    // =====================================

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


    // =====================================
    // SHOW SEARCH RESULTS
    // =====================================

    function showResults(query) {

        if (!resultsBox) return;


        resultsBox.innerHTML = "";


        if (!query) {

            resultsBox.style.display =
                "none";


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
