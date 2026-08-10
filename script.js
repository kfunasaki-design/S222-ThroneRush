function openSection(sectionId) {

    const sections = document.querySelectorAll("main section");

    sections.forEach(function(section) {
        section.classList.remove("open");
    });

    const target = document.getElementById(sectionId);

    if (target) {
        target.classList.add("open");

        setTimeout(function() {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 50);
    }
}
