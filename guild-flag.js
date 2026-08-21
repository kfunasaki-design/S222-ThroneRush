function setFallbackEmoji() {
  document.querySelectorAll(".guild-flag").forEach(el => {
    const emoji = el.dataset.emoji;
    const fallback = el.dataset.fallback;

    const test = document.createElement("span");
    test.textContent = emoji;
    test.style.position = "absolute";
    test.style.visibility = "hidden";
    document.body.appendChild(test);

    const width = test.getBoundingClientRect().width;
    test.remove();

    if (width === 0) {
      el.textContent = fallback;
    }
  });
}
