/* 多樂桌遊 V3.2 產品頁修正版：規格與詳細介紹分離 */
(() => {
  "use strict";

  const el = {};
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    [
      "productContent","errorState","errorMessage","productCode","productName",
      "productImage","productPlayers","productDuration","productAge",
      "productDescription","manualButton","youtubeButton","noResourceMessage",
      "currentYear","backToTop","metaDescription"
    ].forEach(id => el[id] = document.getElementById(id));

    if (el.currentYear) el.currentYear.textContent = String(new Date().getFullYear());
    setupBackToTop();

    const id = (new URLSearchParams(location.search).get("id") || "").trim();
    if (!id) return showError("網址中沒有產品代碼。");

    const products = Array.isArray(window.products) ? window.products : [];
    const product = products.find(p =>
      String(p.code || "").trim().toLowerCase() === id.toLowerCase()
    );

    if (!product) return showError(`找不到產品代碼「${id}」。`);
    render(product);
  }

  function render(product) {
    const name = String(product.name || product.code || "未命名產品");
    const code = String(product.code || "");

    document.title = `${name}｜多樂桌遊`;
    el.productCode.textContent = code;
    el.productName.textContent = name;

    // V3.2 修正重點：簡易資訊改讀獨立規格欄位
    el.productPlayers.textContent =
      clean(product.players || product.playerCount || product.player_count) || "—";

    el.productDuration.textContent =
      clean(product.duration || product.playTime || product.play_time) || "—";

    el.productAge.textContent =
      clean(product.age || product.recommendedAge || product.recommended_age) || "—";

    if (el.metaDescription) {
      const specs = [
        el.productPlayers.textContent !== "—" ? `遊戲人數 ${el.productPlayers.textContent}` : "",
        el.productDuration.textContent !== "—" ? `遊戲時長 ${el.productDuration.textContent}` : "",
        el.productAge.textContent !== "—" ? `建議年齡 ${el.productAge.textContent}` : ""
      ].filter(Boolean).join("、");
      el.metaDescription.content = specs || `${name}的產品介紹與相關資源。`;
    }

    const image = clean(product.image) || `images/${code}.jpg`;
    el.productImage.src = image;
    el.productImage.alt = name;

    renderDescription(product.description);
    renderResources(product);

    el.productContent.hidden = false;
    el.errorState.hidden = true;
  }

  function renderDescription(description) {
    el.productDescription.innerHTML = "";

    if (typeof description === "string") description = [description];
    if (!Array.isArray(description)) description = [];

    const items = description.map(clean).filter(Boolean);

    if (!items.length) {
      const p = document.createElement("p");
      p.textContent = "目前尚未提供完整產品介紹。";
      el.productDescription.appendChild(p);
      return;
    }

    const frag = document.createDocumentFragment();
    items.forEach(text => {
      const p = document.createElement("p");
      p.textContent = text;
      frag.appendChild(p);
    });
    el.productDescription.appendChild(frag);
  }

  function renderResources(product) {
    const manual = clean(product.manual);
    const youtube = clean(product.youtube);

    el.manualButton.hidden = !manual;
    el.youtubeButton.hidden = !youtube;
    el.noResourceMessage.hidden = Boolean(manual || youtube);

    if (manual) el.manualButton.href = manual;
    if (youtube) el.youtubeButton.href = youtube;
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function showError(message) {
    if (el.productContent) el.productContent.hidden = true;
    if (el.errorState) el.errorState.hidden = false;
    if (el.errorMessage) el.errorMessage.textContent = message;
    document.title = "找不到產品｜多樂桌遊";
  }

  function setupBackToTop() {
    if (!el.backToTop) return;
    const toggle = () => el.backToTop.hidden = window.scrollY < 320;
    addEventListener("scroll", toggle, { passive: true });
    el.backToTop.addEventListener("click", () =>
      scrollTo({ top: 0, behavior: "smooth" })
    );
    toggle();
  }
})();
