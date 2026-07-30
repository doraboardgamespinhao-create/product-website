/* =========================================================
   多樂桌遊產品資訊連結系統 V3
   script.js
   依賴：products.js 必須先載入並提供 window.products
   ========================================================= */

(() => {
  "use strict";

  const state = {
    products: [],
    filteredProducts: [],
    searchTerm: ""
  };

  const elements = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    setCurrentYear();

    const productData = readProductData();

    if (!productData.length) {
      showDataError();
      setupBackToTop();
      return;
    }

    state.products = productData;
    state.filteredProducts = [...productData];

    populateProductSelect();
    renderProducts(state.products);
    updateProductCount(state.products.length);
    updateSearchStatus("");
    bindEvents();
    setupBackToTop();
  }

  function cacheElements() {
    elements.searchInput = document.getElementById("searchInput");
    elements.clearSearchBtn = document.getElementById("clearSearchBtn");
    elements.productSelect = document.getElementById("productSelect");
    elements.goProductBtn = document.getElementById("goProductBtn");
    elements.productGrid = document.getElementById("productGrid");
    elements.productCount = document.getElementById("productCount");
    elements.searchStatus = document.getElementById("searchStatus");
    elements.emptyState = document.getElementById("emptyState");
    elements.resetSearchBtn = document.getElementById("resetSearchBtn");
    elements.backToTopBtn = document.getElementById("backToTopBtn");
    elements.currentYear = document.getElementById("currentYear");
  }

  function readProductData() {
    if (!Array.isArray(window.products)) {
      return [];
    }

    return window.products
      .filter(isValidProduct)
      .map(normalizeProduct);
  }

  function isValidProduct(product) {
    return (
      product &&
      typeof product.name === "string" &&
      product.name.trim() &&
      typeof product.page === "string" &&
      product.page.trim()
    );
  }

  function normalizeProduct(product) {
    return {
      code: typeof product.code === "string" ? product.code.trim() : "",
      name: product.name.trim(),
      image:
        typeof product.image === "string" && product.image.trim()
          ? product.image.trim()
          : "",
      page: product.page.trim(),
      keywords: Array.isArray(product.keywords)
        ? product.keywords
            .filter(keyword => typeof keyword === "string")
            .map(keyword => keyword.trim())
            .filter(Boolean)
        : []
    };
  }

  function bindEvents() {
    elements.searchInput?.addEventListener("input", handleSearchInput);
    elements.searchInput?.addEventListener("keydown", handleSearchKeydown);
    elements.clearSearchBtn?.addEventListener("click", resetSearch);
    elements.resetSearchBtn?.addEventListener("click", resetSearch);
    elements.goProductBtn?.addEventListener("click", goToSelectedProduct);
    elements.productSelect?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        goToSelectedProduct();
      }
    });
    elements.productSelect?.addEventListener("change", () => {
      elements.goProductBtn?.removeAttribute("disabled");
    });
  }

  function populateProductSelect() {
    if (!elements.productSelect) {
      return;
    }

    elements.productSelect.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- 請選擇產品 --";
    elements.productSelect.appendChild(placeholder);

    state.products.forEach(product => {
      const option = document.createElement("option");
      option.value = product.page;
      option.textContent = product.name;
      elements.productSelect.appendChild(option);
    });
  }

  function handleSearchInput(event) {
    const value = event.target.value ?? "";
    applySearch(value);
  }

  function handleSearchKeydown(event) {
    if (event.key !== "Enter") {
      return;
    }

    const firstProduct = state.filteredProducts[0];

    if (firstProduct) {
      window.location.href = firstProduct.page;
    }
  }

  function applySearch(value) {
    const term = normalizeSearchText(value);
    state.searchTerm = term;

    toggleClearButton(term.length > 0);

    if (!term) {
      state.filteredProducts = [...state.products];
      renderProducts(state.filteredProducts);
      updateProductCount(state.filteredProducts.length);
      updateSearchStatus("");
      return;
    }

    state.filteredProducts = state.products.filter(product =>
      productMatchesSearch(product, term)
    );

    renderProducts(state.filteredProducts);
    updateProductCount(state.filteredProducts.length);
    updateSearchStatus(value.trim());
  }

  function productMatchesSearch(product, term) {
    const searchableValues = [
      product.name,
      product.code,
      ...product.keywords
    ];

    return searchableValues.some(value =>
      normalizeSearchText(value).includes(term)
    );
  }

  function normalizeSearchText(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .trim()
      .toLocaleLowerCase("zh-TW");
  }

  function renderProducts(productsToRender) {
    if (!elements.productGrid || !elements.emptyState) {
      return;
    }

    elements.productGrid.setAttribute("aria-busy", "true");
    elements.productGrid.innerHTML = "";

    if (!productsToRender.length) {
      elements.productGrid.hidden = true;
      elements.emptyState.hidden = false;
      elements.productGrid.setAttribute("aria-busy", "false");
      return;
    }

    const fragment = document.createDocumentFragment();

    productsToRender.forEach(product => {
      fragment.appendChild(createProductCard(product));
    });

    elements.productGrid.appendChild(fragment);
    elements.productGrid.hidden = false;
    elements.emptyState.hidden = true;
    elements.productGrid.setAttribute("aria-busy", "false");
  }

  function createProductCard(product) {
    const link = document.createElement("a");
    link.className = "product-card";
    link.href = product.page;
    link.setAttribute("aria-label", `查看${product.name}產品資訊`);

    const imageWrap = document.createElement("div");
    imageWrap.className = "product-image-wrap";

    const image = document.createElement("img");
    image.src = product.image || createFallbackImageDataUri(product.name);
    image.alt = product.name;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener(
      "error",
      () => {
        image.src = createFallbackImageDataUri(product.name);
      },
      { once: true }
    );

    const body = document.createElement("div");
    body.className = "product-card-body";

    const title = document.createElement("p");
    title.className = "product-card-title";
    title.textContent = product.name;

    if (product.code) {
      const code = document.createElement("span");
      code.className = "product-card-code";
      code.textContent = product.code;
      title.appendChild(code);
    }

    imageWrap.appendChild(image);
    body.appendChild(title);
    link.append(imageWrap, body);

    return link;
  }

  function createFallbackImageDataUri(productName) {
    const safeName = escapeSvgText(productName || "產品圖片");
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#edf4ff"/>
            <stop offset="100%" stop-color="#dfe9f7"/>
          </linearGradient>
        </defs>
        <rect width="600" height="600" fill="url(#bg)"/>
        <text x="300" y="250" text-anchor="middle" font-size="88">🎲</text>
        <text
          x="300"
          y="350"
          text-anchor="middle"
          font-size="30"
          font-family="Arial, sans-serif"
          fill="#334155"
        >${safeName}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function escapeSvgText(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }

  function updateProductCount(count) {
    if (!elements.productCount) {
      return;
    }

    elements.productCount.textContent = `共 ${count} 項`;
  }

  function updateSearchStatus(originalTerm) {
    if (!elements.searchStatus) {
      return;
    }

    if (!originalTerm) {
      elements.searchStatus.textContent = "";
      return;
    }

    const count = state.filteredProducts.length;
    elements.searchStatus.textContent =
      count > 0
        ? `「${originalTerm}」找到 ${count} 項產品`
        : `「${originalTerm}」沒有符合的產品`;
  }

  function toggleClearButton(show) {
    if (!elements.clearSearchBtn) {
      return;
    }

    elements.clearSearchBtn.hidden = !show;
  }

  function resetSearch() {
    if (elements.searchInput) {
      elements.searchInput.value = "";
      elements.searchInput.focus();
    }

    applySearch("");
  }

  function goToSelectedProduct() {
    const selectedPage = elements.productSelect?.value;

    if (!selectedPage) {
      window.alert("請先選擇產品。");
      elements.productSelect?.focus();
      return;
    }

    window.location.href = selectedPage;
  }

  function setupBackToTop() {
    if (!elements.backToTopBtn) {
      return;
    }

    const toggleButton = () => {
      elements.backToTopBtn.hidden = window.scrollY < 360;
    };

    window.addEventListener("scroll", toggleButton, { passive: true });

    elements.backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? "auto" : "smooth"
      });
    });

    toggleButton();
  }

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }

  function setCurrentYear() {
    if (elements.currentYear) {
      elements.currentYear.textContent = String(new Date().getFullYear());
    }
  }

  function showDataError() {
    if (elements.productGrid) {
      elements.productGrid.hidden = true;
      elements.productGrid.setAttribute("aria-busy", "false");
    }

    if (elements.emptyState) {
      elements.emptyState.hidden = false;

      const heading = elements.emptyState.querySelector("h3");
      const paragraph = elements.emptyState.querySelector("p");
      const button = elements.emptyState.querySelector("button");

      if (heading) {
        heading.textContent = "產品資料尚未載入";
      }

      if (paragraph) {
        paragraph.textContent =
          "請確認 products.js 已放在與 index.html 相同的資料夾，且檔案內容格式正確。";
      }

      if (button) {
        button.hidden = true;
      }
    }

    if (elements.productSelect) {
      elements.productSelect.innerHTML =
        '<option value="">產品資料載入失敗</option>';
      elements.productSelect.disabled = true;
    }

    if (elements.goProductBtn) {
      elements.goProductBtn.disabled = true;
    }

    if (elements.searchInput) {
      elements.searchInput.disabled = true;
      elements.searchInput.placeholder = "產品資料尚未載入";
    }

    if (elements.productCount) {
      elements.productCount.textContent = "共 0 項";
    }

    if (elements.searchStatus) {
      elements.searchStatus.textContent =
        "找不到 products.js 提供的產品資料。";
    }
  }
})();
