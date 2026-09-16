/* =========================================================
   多樂桌遊產品資訊連結系統
   V3.2 搜尋體驗升級

   script.js V3－搜尋體驗升級版

   ---------------------------------------------------------
   首頁產品卡片結構：

   .product-card
       .product-image-wrap
           img
       .product-card-body
           .product-card-title
               產品名稱
               .product-card-code
                   產品編號

   ---------------------------------------------------------
   V3 功能：

   1. 顯示全部產品
   2. 產品名稱搜尋
   3. 產品編號搜尋
   4. keywords 搜尋
   5. 多搜尋詞
   6. 搜尋相關度排序
   7. 搜尋文字醒目標示
   8. 下拉選單同步搜尋結果
   9. 清除搜尋
   10. 找不到產品提示
   11. Enter 單一結果快速進入
   12. Escape 清除搜尋
   13. Lazy Loading
   14. 回到頂端
   15. Footer 年份
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       全域資料
       ===================================================== */

    let products = [];

    let currentResults = [];

    let currentQuery = "";



    /* =====================================================
       啟動
       ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    function init() {

        /* ---------------------------------------------
           從 products.js 取得產品資料
           --------------------------------------------- */

        if (Array.isArray(window.products)) {

            products =
                window.products;

        } else {

            products = [];

        }


        currentResults =
            [...products];


        /* ---------------------------------------------
           建立功能
           --------------------------------------------- */

        setupCurrentYear();

        renderProductCards(
            products,
            ""
        );

        renderDropdown(
            products
        );

        setupDropdownEvents();

        setupSearch();

        setupBackToTop();

        updateSearchStatus("");

    }



    /* =====================================================
       建立首頁產品卡片
       ===================================================== */

    function renderProductCards(
        productList,
        query = ""
    ) {

        const grid =
            document.getElementById(
                "productGrid"
            );


        if (!grid) {
            return;
        }


        /* ---------------------------------------------
           清除舊內容
           --------------------------------------------- */

        grid.innerHTML = "";


        grid.setAttribute(
            "aria-busy",
            "true"
        );


        /* ---------------------------------------------
           沒有產品
           --------------------------------------------- */

        if (!productList.length) {

            grid.setAttribute(
                "aria-busy",
                "false"
            );


            updateProductCount(0);

            return;

        }


        const fragment =
            document.createDocumentFragment();


        /* ---------------------------------------------
           建立每張產品卡片
           --------------------------------------------- */

        productList.forEach(product => {


            /* =========================================
               整張卡片
               ========================================= */

            const card =
                document.createElement("a");


            card.className =
                "product-card";


            card.href =
                getProductUrl(product);



            /* =========================================
               圖片區
               ========================================= */

            const imageWrap =
                document.createElement("div");


            imageWrap.className =
                "product-image-wrap";


            const image =
                document.createElement("img");


            image.src =
                product.image || "";


            image.alt =
                product.name
                    ? `${product.name} 產品圖片`
                    : "產品圖片";


            image.loading =
                "lazy";


            image.decoding =
                "async";


            image.addEventListener(
                "error",
                () => {

                    image.alt =
                        product.name
                            ? `${product.name} 圖片載入失敗`
                            : "產品圖片載入失敗";

                }
            );


            imageWrap.appendChild(
                image
            );



            /* =========================================
               文字區
               ========================================= */

            const body =
                document.createElement("div");


            body.className =
                "product-card-body";



            /* =========================================
               產品名稱
               ========================================= */

            const title =
                document.createElement("p");


            title.className =
                "product-card-title";


            appendHighlightedText(
                title,
                product.name ||
                    "未命名產品",
                query
            );



            /* =========================================
               產品編號
               ========================================= */

            if (product.code) {

                const code =
                    document.createElement(
                        "span"
                    );


                code.className =
                    "product-card-code";


                /*
                   只顯示：

                   AS001

                   不顯示：
                   產品編號：AS001
                */

                appendHighlightedText(
                    code,
                    product.code,
                    query
                );


                title.appendChild(
                    code
                );

            }



            /* =========================================
               組合卡片
               ========================================= */

            body.appendChild(
                title
            );


            card.appendChild(
                imageWrap
            );


            card.appendChild(
                body
            );


            fragment.appendChild(
                card
            );

        });



        /* ---------------------------------------------
           一次加入畫面
           --------------------------------------------- */

        grid.appendChild(
            fragment
        );


        /* ---------------------------------------------
           關閉 Loading
           --------------------------------------------- */

        grid.setAttribute(
            "aria-busy",
            "false"
        );


        /* ---------------------------------------------
           更新數量
           --------------------------------------------- */

        updateProductCount(
            productList.length
        );

    }



    /* =====================================================
       搜尋文字醒目標示
       ===================================================== */

    function appendHighlightedText(
        container,
        text,
        query
    ) {

        const originalText =
            String(text ?? "");


        /*
           沒有搜尋文字時，
           直接顯示原文字
        */

        if (!query) {

            container.textContent =
                originalText;

            return;

        }


        /*
           將搜尋詞拆開
        */

        const terms =
            normalize(query)
                .split(/\s+/)
                .filter(Boolean);


        if (!terms.length) {

            container.textContent =
                originalText;

            return;

        }


        /*
           建立用來尋找位置的
           標準化文字
        */

        const normalizedText =
            normalize(originalText);


        /*
           搜集所有需要標記的位置
        */

        const ranges = [];


        terms.forEach(term => {

            let startIndex = 0;


            while (startIndex < normalizedText.length) {

                const foundIndex =
                    normalizedText.indexOf(
                        term,
                        startIndex
                    );


                if (foundIndex === -1) {
                    break;
                }


                ranges.push({

                    start:
                        foundIndex,

                    end:
                        foundIndex +
                        term.length

                });


                startIndex =
                    foundIndex +
                    term.length;

            }

        });


        /*
           沒有直接出現在名稱或編號中。

           例如是透過 keywords 搜尋到的產品，
           就不需要標記名稱。
        */

        if (!ranges.length) {

            container.textContent =
                originalText;

            return;

        }


        /*
           排序
        */

        ranges.sort(
            (a, b) =>
                a.start - b.start
        );


        /*
           合併重疊範圍
        */

        const mergedRanges = [];


        ranges.forEach(range => {

            const previous =
                mergedRanges[
                    mergedRanges.length - 1
                ];


            if (
                previous &&
                range.start <= previous.end
            ) {

                previous.end =
                    Math.max(
                        previous.end,
                        range.end
                    );

            } else {

                mergedRanges.push({
                    start: range.start,
                    end: range.end
                });

            }

        });


        /*
           建立文字 + mark
        */

        let lastIndex = 0;


        mergedRanges.forEach(range => {

            /*
               標記前的普通文字
            */

            if (range.start > lastIndex) {

                container.appendChild(

                    document.createTextNode(

                        originalText.slice(
                            lastIndex,
                            range.start
                        )

                    )

                );

            }


            /*
               醒目文字
            */

            const mark =
                document.createElement(
                    "mark"
                );


            mark.className =
                "search-highlight";


            mark.textContent =
                originalText.slice(
                    range.start,
                    range.end
                );


            container.appendChild(
                mark
            );


            lastIndex =
                range.end;

        });


        /*
           最後剩下的普通文字
        */

        if (
            lastIndex <
            originalText.length
        ) {

            container.appendChild(

                document.createTextNode(

                    originalText.slice(
                        lastIndex
                    )

                )

            );

        }

    }



    /* =====================================================
       更新產品數量
       ===================================================== */

    function updateProductCount(count) {

        const element =
            document.getElementById(
                "productCount"
            );


        if (!element) {
            return;
        }


        /*
           沒有搜尋時：
           共 43 項產品

           搜尋時：
           共 3 項產品
        */

        element.textContent =
            `共 ${count} 項產品`;

    }



    /* =====================================================
       搜尋設定
       ===================================================== */

    function setupSearch() {

        const input =
            document.getElementById(
                "searchInput"
            );


        if (!input) {
            return;
        }


        const clearButton =
            document.getElementById(
                "clearSearchBtn"
            );


        const resetButton =
            document.getElementById(
                "resetSearchBtn"
            );



        /* ---------------------------------------------
           即時搜尋
           --------------------------------------------- */

        input.addEventListener(
            "input",
            () => {

                performSearch(
                    input.value
                );


                updateClearButton();

            }
        );



        /* ---------------------------------------------
           × 清除搜尋
           --------------------------------------------- */

        if (clearButton) {

            clearButton.addEventListener(
                "click",
                () => {

                    clearSearch();

                    input.focus();

                }
            );

        }



        /* ---------------------------------------------
           查無資料：
           顯示全部產品
           --------------------------------------------- */

        if (resetButton) {

            resetButton.addEventListener(
                "click",
                () => {

                    clearSearch();

                    input.focus();

                }
            );

        }



        /* ---------------------------------------------
           鍵盤功能
           --------------------------------------------- */

        input.addEventListener(
            "keydown",
            event => {


                /* =====================================
                   Escape
                   清除搜尋
                   ===================================== */

                if (event.key === "Escape") {

                    clearSearch();

                    input.blur();

                    return;

                }


                /* =====================================
                   Enter

                   只有一個結果時
                   直接進入產品頁
                   ===================================== */

                if (
                    event.key === "Enter" &&
                    currentQuery &&
                    currentResults.length === 1
                ) {

                    event.preventDefault();


                    goToProduct(
                        currentResults[0]
                    );

                }

            }
        );



        /* ---------------------------------------------
           清除按鈕顯示狀態
           --------------------------------------------- */

        function updateClearButton() {

            if (!clearButton) {
                return;
            }


            clearButton.hidden =
                !input.value.trim();

        }



        /* ---------------------------------------------
           清除搜尋
           --------------------------------------------- */

        function clearSearch() {

            input.value = "";


            currentQuery = "";


            currentResults =
                [...products];


            /*
               恢復全部卡片
            */

            renderProductCards(
                products,
                ""
            );


            /*
               恢復完整下拉選單
            */

            renderDropdown(
                products
            );


            /*
               清除搜尋狀態
            */

            updateSearchStatus(
                ""
            );


            updateClearButton();

        }


        updateClearButton();

    }



    /* =====================================================
       執行搜尋
       ===================================================== */

    function performSearch(value) {

        const originalQuery =
            String(value ?? "")
                .trim();


        const query =
            normalize(
                originalQuery
            );


        currentQuery =
            query;



        /* ---------------------------------------------
           沒有搜尋文字
           --------------------------------------------- */

        if (!query) {

            currentResults =
                [...products];


            renderProductCards(
                products,
                ""
            );


            renderDropdown(
                products
            );


            updateSearchStatus(
                ""
            );


            return;

        }



        /* ---------------------------------------------
           執行搜尋
           --------------------------------------------- */

        currentResults =
            searchProducts(
                query
            );



        /* ---------------------------------------------
           更新產品卡片
           --------------------------------------------- */

        renderProductCards(
            currentResults,
            originalQuery
        );



        /* ---------------------------------------------
           V3：
           同步更新下拉選單
           --------------------------------------------- */

        renderDropdown(
            currentResults
        );



        /* ---------------------------------------------
           更新搜尋狀態
           --------------------------------------------- */

        updateSearchStatus(
            originalQuery
        );

    }



    /* =====================================================
       搜尋核心
       ===================================================== */

    function searchProducts(query) {

        const terms =
            normalize(query)
                .split(/\s+/)
                .filter(Boolean);


        return products

            .map((product, index) => {


                /* -----------------------------------------
                   產品名稱
                   ----------------------------------------- */

                const name =
                    normalize(
                        product.name
                    );


                /* -----------------------------------------
                   產品編號
                   ----------------------------------------- */

                const code =
                    normalize(
                        product.code
                    );


                /* -----------------------------------------
                   Keywords
                   ----------------------------------------- */

                const keywords =
                    Array.isArray(
                        product.keywords
                    )

                        ? product.keywords
                            .map(normalize)
                            .filter(Boolean)

                        : [];



                /* -----------------------------------------
                   可以搜尋的全部文字
                   ----------------------------------------- */

                const searchableValues = [

                    name,

                    code,

                    ...keywords

                ];



                /* -----------------------------------------
                   多個搜尋詞：

                   每一個詞都必須至少符合
                   一個欄位
                   ----------------------------------------- */

                const matched =
                    terms.every(term =>

                        searchableValues.some(
                            value =>
                                value.includes(term)
                        )

                    );


                if (!matched) {
                    return null;
                }



                /* -----------------------------------------
                   計算相關度
                   ----------------------------------------- */

                const score =
                    calculateScore(

                        name,

                        code,

                        keywords,

                        terms

                    );


                return {

                    product,

                    score,

                    originalIndex:
                        index

                };

            })


            /* -----------------------------------------
               移除不符合產品
               ----------------------------------------- */

            .filter(Boolean)


            /* -----------------------------------------
               相關度排序
               ----------------------------------------- */

            .sort((a, b) => {

                /*
                   分數高的優先
                */

                if (
                    b.score !==
                    a.score
                ) {

                    return (
                        b.score -
                        a.score
                    );

                }


                /*
                   分數相同時，
                   維持 products.js 原順序
                */

                return (
                    a.originalIndex -
                    b.originalIndex
                );

            })


            /* -----------------------------------------
               只取產品
               ----------------------------------------- */

            .map(
                item =>
                    item.product
            );

    }



    /* =====================================================
       搜尋相關度
       ===================================================== */

    function calculateScore(
        name,
        code,
        keywords,
        terms
    ) {

        let score = 0;


        terms.forEach(term => {


            /* =========================================
               產品名稱
               ========================================= */

            if (name === term) {

                score += 1000;

            }

            else if (
                name.startsWith(term)
            ) {

                score += 700;

            }

            else if (
                name.includes(term)
            ) {

                score += 500;

            }



            /* =========================================
               產品編號
               ========================================= */

            if (code === term) {

                score += 900;

            }

            else if (
                code.startsWith(term)
            ) {

                score += 600;

            }

            else if (
                code.includes(term)
            ) {

                score += 400;

            }



            /* =========================================
               Keywords
               ========================================= */

            if (
                keywords.some(
                    keyword =>
                        keyword === term
                )
            ) {

                score += 350;

            }

            else if (
                keywords.some(
                    keyword =>
                        keyword.startsWith(term)
                )
            ) {

                score += 250;

            }

            else if (
                keywords.some(
                    keyword =>
                        keyword.includes(term)
                )
            ) {

                score += 150;

            }

        });


        return score;

    }



    /* =====================================================
       搜尋文字標準化
       ===================================================== */

    function normalize(value) {

        return String(
            value ?? ""
        )

            /*
               全形 / 半形統一

               ＡＳ００１
               AS001

               可以視為相同
            */

            .normalize("NFKC")


            /*
               英文大小寫統一
            */

            .toLowerCase()


            /*
               去除前後空白
            */

            .trim()


            /*
               多個空格變成一個
            */

            .replace(
                /\s+/g,
                " "
            );

    }



    /* =====================================================
       搜尋狀態
       ===================================================== */

    function updateSearchStatus(query) {

        const status =
            document.getElementById(
                "searchStatus"
            );


        const empty =
            document.getElementById(
                "emptyState"
            );



        /* ---------------------------------------------
           沒有搜尋
           --------------------------------------------- */

        if (!query) {

            if (status) {

                status.textContent =
                    "";

            }


            if (empty) {

                empty.hidden =
                    true;

            }


            return;

        }



        /* ---------------------------------------------
           找到產品
           --------------------------------------------- */

        if (
            currentResults.length > 0
        ) {

            if (status) {

                status.textContent =
                    `找到 ${currentResults.length} 項產品`;

            }


            if (empty) {

                empty.hidden =
                    true;

            }


            return;

        }



        /* ---------------------------------------------
           找不到產品
           --------------------------------------------- */

        if (status) {

            status.textContent =
                `找不到「${query}」相關產品`;

        }


        if (empty) {

            empty.hidden =
                false;

        }

    }



    /* =====================================================
       建立 / 更新下拉選單
       ===================================================== */

    function renderDropdown(
        productList
    ) {

        const select =
            document.getElementById(
                "productSelect"
            );


        if (!select) {
            return;
        }


        /*
           記住目前選擇
        */

        const previousValue =
            select.value;


        /*
           清除全部 option
        */

        select.innerHTML = "";



        /* ---------------------------------------------
           第一個選項
           --------------------------------------------- */

        const placeholder =
            document.createElement(
                "option"
            );


        placeholder.value = "";


        /*
           搜尋後沒有產品
        */

        if (
            currentQuery &&
            productList.length === 0
        ) {

            placeholder.textContent =
                "沒有符合的產品";

        }

        /*
           搜尋中
        */

        else if (currentQuery) {

            placeholder.textContent =
                `搜尋結果（${productList.length}）`;

        }

        /*
           一般狀態
        */

        else {

            placeholder.textContent =
                "請選擇產品";

        }


        select.appendChild(
            placeholder
        );



        /* ---------------------------------------------
           建立產品選項
           --------------------------------------------- */

        const fragment =
            document.createDocumentFragment();


        productList.forEach(product => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                product.code || "";


            /*
               下拉選單顯示：

               幻界之爭 (AS001)
            */

            if (
                product.name &&
                product.code
            ) {

                option.textContent =
                    `${product.name} (${product.code})`;

            }

            else {

                option.textContent =
                    product.name ||
                    product.code ||
                    "未命名產品";

            }


            /*
               如果原本選擇的產品
               仍存在於目前結果，
               保留選擇
            */

            if (
                product.code ===
                previousValue
            ) {

                option.selected =
                    true;

            }


            fragment.appendChild(
                option
            );

        });


        select.appendChild(
            fragment
        );

    }



    /* =====================================================
       下拉選單事件
       ===================================================== */

    function setupDropdownEvents() {

        const select =
            document.getElementById(
                "productSelect"
            );


        const button =
            document.getElementById(
                "goProductBtn"
            );


        if (!select) {
            return;
        }



        /* ---------------------------------------------
           選擇產品後直接進入
           --------------------------------------------- */

        select.addEventListener(
            "change",
            () => {

                if (!select.value) {
                    return;
                }


                goToProductByCode(
                    select.value
                );

            }
        );



        /* ---------------------------------------------
           「前往產品頁」按鈕
           --------------------------------------------- */

        if (button) {

            button.addEventListener(
                "click",
                () => {

                    if (!select.value) {
                        return;
                    }


                    goToProductByCode(
                        select.value
                    );

                }
            );

        }

    }



    /* =====================================================
       建立產品網址
       ===================================================== */

    function getProductUrl(product) {

        const code =
            String(
                product.code || ""
            ).trim();


        if (!code) {

            return "#";

        }


        return (
            "product.html?id=" +
            encodeURIComponent(
                code
            )
        );

    }



    /* =====================================================
       前往產品頁
       ===================================================== */

    function goToProduct(product) {

        const url =
            getProductUrl(product);


        if (
            url === "#"
        ) {

            return;

        }


        window.location.href =
            url;

    }



    /* =====================================================
       使用產品編號前往產品頁
       ===================================================== */

    function goToProductByCode(code) {

        const cleanCode =
            String(
                code || ""
            ).trim();


        if (!cleanCode) {
            return;
        }


        window.location.href =
            "product.html?id=" +
            encodeURIComponent(
                cleanCode
            );

    }



    /* =====================================================
       Footer 年份
       ===================================================== */

    function setupCurrentYear() {

        const year =
            document.getElementById(
                "currentYear"
            );


        if (!year) {
            return;
        }


        year.textContent =
            new Date()
                .getFullYear();

    }



    /* =====================================================
       回到頂端
       ===================================================== */

    function setupBackToTop() {

        const button =
            document.getElementById(
                "backToTopBtn"
            );


        if (!button) {
            return;
        }



        /* ---------------------------------------------
           控制顯示 / 隱藏
           --------------------------------------------- */

        function updateButton() {

            button.hidden =
                window.scrollY <= 300;

        }



        /* ---------------------------------------------
           捲動偵測
           --------------------------------------------- */

        window.addEventListener(
            "scroll",
            updateButton,
            {
                passive: true
            }
        );



        /* ---------------------------------------------
           點擊回頂端
           --------------------------------------------- */

        button.addEventListener(
            "click",
            () => {

                window.scrollTo({

                    top: 0,

                    behavior:
                        "smooth"

                });

            }
        );


        updateButton();

    }

})();