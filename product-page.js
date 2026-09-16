/* 多樂桌遊 V3.2 產品頁修正版：規格與詳細介紹分離 */
(() => {
  "use strict";

  const IMAGE_WIDTHS = {"AS001.webp":[400,800,1200],"DK001.webp":[400,800,996],"ETN001-TCN.webp":[399,798,798],"FU001.webp":[400,800,900],"HU001.webp":[399,798,1197],"HU002.webp":[400,800,900],"HU003.webp":[399,798,1018],"HU004.webp":[400,800,1200],"HU005.webp":[400,800,1200],"HU006.webp":[281,562,843],"HU007.webp":[400,440,440],"HU008.webp":[400,440,440],"HU009.webp":[400,800,900],"HU010.webp":[399,440,440],"HU011.webp":[400,440,440],"HU012.webp":[400,440,440],"HU013.webp":[400,440,440],"HU014.webp":[400,520,520],"HU015.webp":[400,519,519],"HU016.webp":[400,440,440],"HU017.webp":[369,737,1106],"HU018.webp":[399,798,1197],"HU019.webp":[399,799,1198],"HU020.webp":[400,800,1024],"HU021.webp":[245,245,245],"HU022.webp":[247,247,247],"HU023.webp":[400,800,889],"HU024.webp":[247,247,247],"HU025.webp":[378,756,833],"HU026.webp":[247,247,247],"HU027.webp":[247,247,247],"HU028.webp":[399,799,1198],"HU029.webp":[400,800,1200],"HU030.webp":[310,621,931],"HU031.webp":[311,621,932],"HU032.webp":[321,643,643],"HU033.webp":[394,787,1181],"HU034.webp":[400,800,1200],"HU035.webp":[400,800,1200],"HU036.webp":[284,567,851],"HU037.webp":[398,797,1195],"PF001.webp":[400,800,822],"SWG01.webp":[305,610,824]};
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
    // V6：僅對本專案已有縮圖的 WebP 圖片提供響應式版本；其餘路徑保留原樣。
    const filename = image.split("/").pop();
    const responsive = /^images\/[^/]+\.webp$/i.test(image);
    el.productImage.alt = name;
    el.productImage.loading = "eager";
    el.productImage.fetchPriority = "high";
    el.productImage.decoding = "async";
    if (responsive) {
      const widths = IMAGE_WIDTHS[filename];
      el.productImage.sizes = "(max-width: 760px) calc(100vw - 44px), 388px";
      el.productImage.srcset = [
        `images/thumbs/${filename} ${widths[0]}w`,
        `images/medium/${filename} ${widths[1]}w`,
        `${image} ${widths[2]}w`
      ].join(", ");
    } else {
      el.productImage.removeAttribute("srcset");
      el.productImage.removeAttribute("sizes");
    }
    el.productImage.src = image;

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
