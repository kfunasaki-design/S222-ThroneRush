function setLanguage(language) {

    const english = document.getElementById("english");
    const japanese = document.getElementById("japanese");

    if (language === "ja") {
        english.style.display = "none";
        japanese.style.display = "block";
        document.documentElement.lang = "ja";
    } else {
        english.style.display = "block";
        japanese.style.display = "none";
        document.documentElement.lang = "en";
    }

    // Scroll to the top after switching language
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
