// ========================================
// Translation Prototype
// ========================================

const sourceText = document.getElementById("sourceText");
const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");
const translateButton = document.getElementById("translateButton");

const translationResult = document.getElementById("translationResult");
const overlayText = document.getElementById("overlayText");
const statusMessage = document.getElementById("statusMessage");

const charCount = document.getElementById("charCount");
const overlayPreview = document.getElementById("overlayPreview");

// ========================================
// Text input
// ========================================

sourceText.addEventListener("input", () => {
  charCount.textContent = `${sourceText.value.length} / 5000`;
});

// ========================================
// Clear input
// ========================================

document.getElementById("clearText").addEventListener("click", () => {
  sourceText.value = "";
  charCount.textContent = "0 / 5000";

  translationResult.innerHTML =
    '<span class="result-placeholder">翻訳結果がここに表示されます。</span>';

  overlayText.textContent = "翻訳結果がここに表示されます。";
  statusMessage.textContent = "入力をクリアしました。";
});

// ========================================
// Translate
// ========================================

translateButton.addEventListener("click", () => {
  const text = sourceText.value.trim();

  if (!text) {
    statusMessage.textContent = "翻訳する文章を入力してください。";
    sourceText.focus();
    return;
  }

  // Google翻訳との接続は今後実装
  translationResult.textContent =
    "翻訳エンジン未接続です。\n\n" +
    "入力された文章:\n" + text;

  overlayText.textContent =
    "翻訳エンジン未接続です。\n\n" + text;

  statusMessage.textContent =
    "UI確認用の仮表示です。Google翻訳との接続は未実装。";

  overlayPreview.classList.remove("hidden");
});

// ========================================
// Copy translated text
// ========================================

async function copyText(text) {
  if (!text || text.includes("翻訳結果がここに表示されます。")) {
    statusMessage.textContent = "コピーする文章がありません。";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    statusMessage.textContent = "コピーしました。";
  } catch (error) {
    statusMessage.textContent =
      "コピーできませんでした。ブラウザの権限を確認してください。";
  }
}

document.getElementById("copyResult").addEventListener("click", () => {
  copyText(translationResult.textContent);
});

document.getElementById("overlayCopy").addEventListener("click", () => {
  copyText(overlayText.textContent);
});

// ========================================
// Overlay show / hide
// ========================================

document.getElementById("toggleOverlay").addEventListener("click", () => {
  overlayPreview.classList.toggle("hidden");
});

document.getElementById("closeOverlay").addEventListener("click", () => {
  overlayPreview.classList.add("hidden");
});

// ========================================
// Swap languages
// ========================================

document.getElementById("swapLanguages").addEventListener("click", () => {
  if (sourceLanguage.value === "auto") {
    statusMessage.textContent =
      "翻訳元を指定してから入れ替えてください。";
    return;
  }

  const currentSource = sourceLanguage.value;
  sourceLanguage.value = targetLanguage.value;
  targetLanguage.value = currentSource;

  statusMessage.textContent = "翻訳言語を入れ替えました。";
});

// ========================================
// Initial state
// ========================================

overlayPreview.classList.remove("hidden");
