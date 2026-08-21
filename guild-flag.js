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

document.addEventListener("DOMContentLoaded", () => {
  const flags = document.querySelectorAll(".guild-flag");

  flags.forEach(flag => {
    const emoji = flag.textContent.trim();

    // 🇯🇵を表示するためのテスト用要素
    const test = document.createElement("span");
    test.textContent = emoji;
    test.style.position = "absolute";
    test.style.visibility = "hidden";
    test.style.whiteSpace = "nowrap";

    document.body.appendChild(test);

    // 表示できない場合は代替記号へ
    if (test.offsetWidth === 0) {
      flag.textContent = "◆";
    }

    test.remove();
  });
});
  
}
