/* =========================================================
   多樂桌遊產品資訊連結系統

   script.js V4－首頁載入效能優化版

   ---------------------------------------------------------
   V4 重點：

   1. 完整保留 V3 搜尋功能
   2. 完整保留搜尋高光
   3. 完整保留下拉選單同步搜尋
   4. 首屏圖片優先載入
   5. 其餘圖片 Lazy Loading
   6. 圖片 decoding="async"
   7. 首屏圖片 fetchPriority="high"
   8. 圖片錯誤時避免顯示破圖圖示
   9. 使用 DocumentFragment 降低 DOM 更新次數
   10. 保留目前產品卡片 CSS 結構
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
           建立各項功能
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
       V4：
       判斷首屏優先載入圖片數量
       ===================================================== */

    function getPriorityImageCount() {

        const width =
            window.innerWidth;


        /*
           手機
           2 欄 × 約 2 排
        */

        if (width < 600) {

            return 4;

        }


        /*
           平板
           3 欄 × 約 2 排
        */

        if (width < 900) {

            return 6;

        }


        /*
           一般桌機
           4 欄 × 約 2 排
        */

        if (width < 1180) {

            return 8;

        }


        /*
           寬桌機
           5 欄 × 約 2 排
        */

        return 10;

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


        /* ---------------------------------------------
           V4：
           取得目前螢幕應優先載入幾張圖片
           --------------------------------------------- */

        const priorityImageCount =
            getPriorityImageCount();


        const fragment =
            document.createDocumentFragment();



        /* ---------------------------------------------
           建立每張產品卡片
           --------------------------------------------- */

        productList.forEach(
            (product, index) => {


                /* =====================================
                   整張產品卡片
                   ===================================== */

                const card =
                    document.createElement(
                        "a"
                    );


                card.className =
                    "product-card";


                card.href =
                    getProductUrl(
                        product
                    );



                /* =====================================
                   圖片外框
                   ===================================== */

                const imageWrap =
                    document.createElement(
                        "div"
                    );


                imageWrap.className =
                    "product-image-wrap";



                /* =====================================
                   產品圖片
                   ===================================== */

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    product.image || "";


                image.alt =
                    product.name
                        ? `${product.name} 產品圖片`
                        : "產品圖片";


                /*
                   所有圖片皆採非同步解碼
                */

                image.decoding =
                    "async";



                /* =====================================
                   V4：
                   首屏圖片載入策略
                   ===================================== */

                if (
                    index <
                    priorityImageCount
                ) {

                    /*
                       首頁最前面的圖片：

                       不等待 Lazy Loading
                    */

                    image.loading =
                        "eager";


                    /*
                       告訴瀏覽器：
                       這些圖片較重要
                    */

                    image.fetchPriority =
                        "high";

                } else {

                    /*
                       後面的產品圖片：

                       捲動接近時才載入
                    */

                    image.loading =
                        "lazy";


                    image.fetchPriority =
                        "auto";

                }



                /* =====================================
                   V4：
                   圖片載入失敗處理
                   ===================================== */

                image.addEventListener(
                    "error",
                    () => {

                        /*
                           避免瀏覽器顯示
                           難看的破圖圖示
                        */

                        image.style.display =
                            "none";


                        /*
                           保留圖片容器，
                           所以產品卡片不會塌掉
                        */

                        imageWrap.setAttribute(
                            "data-image-error",
                            "true"
                        );

                    },
                    {
                        once: true
                    }
                );


                imageWrap.appendChild(
                    image
                );



                /* =====================================
                   產品文字區
                   ===================================== */

                const body =
                    document.createElement(
                        "div"
                    );


                body.className =
                    "product-card-body";



                /* =====================================
                   產品名稱
                   ===================================== */

                const title =
                    document.createElement(
                        "p"
                    );


                title.className =
                    "product-card-title";


                appendHighlightedText(

                    title,

                    product.name ||
                        "未命名產品",

                    query

                );



                /* =====================================
                   產品編號
                   ===================================== */

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



                /* =====================================
                   組合產品卡片
                   ===================================== */

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

            }
        );



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
           更新產品數量
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


        /* ---------------------------------------------
           沒有搜尋文字
           --------------------------------------------- */

        if (!query) {

            container.textContent =
                originalText;

            return;

        }


        const terms =
            normalize(query)
                .split(/\s+/)
                .filter(Boolean);


        if (!terms.length) {

            container.textContent =
                originalText;

            return;

        }


        const normalizedText =
            normalize(
                originalText
            );


        const ranges = [];


        /* ---------------------------------------------
           找出所有需要高光的位置
           --------------------------------------------- */

        terms.forEach(term => {

            let startIndex = 0;


            while (
                startIndex <
                normalizedText.length
            ) {

                const foundIndex =
                    normalizedText.indexOf(
                        term,
                        startIndex
                    );


                if (
                    foundIndex === -1
                ) {

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



        /* ---------------------------------------------
           例如透過 keywords 找到產品，
           但名稱本身沒有搜尋文字
           --------------------------------------------- */

        if (!ranges.length) {

            container.textContent =
                originalText;

            return;

        }



        /* ---------------------------------------------
           排序
           --------------------------------------------- */

        ranges.sort(
            (a, b) =>
                a.start -
                b.start
        );



        /* ---------------------------------------------
           合併重疊範圍
           --------------------------------------------- */

        const mergedRanges = [];


        ranges.forEach(range => {

            const previous =
                mergedRanges[
                    mergedRanges.length - 1
                ];


            if (
                previous &&
                range.start <=
                previous.end
            ) {

                previous.end =
                    Math.max(
                        previous.end,
                        range.end
                    );

            } else {

                mergedRanges.push({

                    start:
                        range.start,

                    end:
                        range.end

                });

            }

        });



        /* ---------------------------------------------
           建立文字與 mark
           --------------------------------------------- */

        let lastIndex = 0;


        mergedRanges.forEach(range => {


            /* =========================================
               高光前面的普通文字
               ========================================= */

            if (
                range.start >
                lastIndex
            ) {

                container.appendChild(

                    document.createTextNode(

                        originalText.slice(
                            lastIndex,
                            range.start
                        )

                    )

                );

            }



            /* =========================================
               高光文字
               ========================================= */

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



        /* ---------------------------------------------
           最後剩下的普通文字
           --------------------------------------------- */

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


        element.textContent =
            `共 ${count} 項產品`;

    }



    /* =====================================================
       搜尋功能
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
           找不到產品：
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
           鍵盤操作
           --------------------------------------------- */

        input.addEventListener(
            "keydown",
            event => {


                /* =====================================
                   Escape 清除搜尋
                   ===================================== */

                if (
                    event.key ===
                    "Escape"
                ) {

                    clearSearch();

                    input.blur();

                    return;

                }



                /* =====================================
                   Enter：
                   只有一個結果時
                   直接進產品頁
                   ===================================== */

                if (
                    event.key ===
                        "Enter" &&
                    currentQuery &&
                    currentResults.length ===
                        1
                ) {

                    event.preventDefault();


                    goToProduct(
                        currentResults[0]
                    );

                }

            }
        );



        /* ---------------------------------------------
           更新 × 按鈕
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

            input.value =
                "";


            currentQuery =
                "";


            currentResults =
                [...products];


            /*
               恢復全部產品
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
           空白搜尋
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
           搜尋產品
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
           同步更新下拉選單
           --------------------------------------------- */

        renderDropdown(
            currentResults
        );



        /* ---------------------------------------------
           更新搜尋結果文字
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

            .map(
                (product, index) => {


                    const name =
                        normalize(
                            product.name
                        );


                    const code =
                        normalize(
                            product.code
                        );


                    const keywords =
                        Array.isArray(
                            product.keywords
                        )

                            ? product.keywords
                                .map(
                                    normalize
                                )
                                .filter(
                                    Boolean
                                )

                            : [];


                    const searchableValues = [

                        name,

                        code,

                        ...keywords

                    ];



                    /* ---------------------------------
                       每一個搜尋詞都必須符合
                       --------------------------------- */

                    const matched =
                        terms.every(
                            term =>

                                searchableValues.some(
                                    value =>
                                        value.includes(
                                            term
                                        )
                                )

                        );


                    if (!matched) {

                        return null;

                    }



                    return {

                        product,

                        originalIndex:
                            index,

                        score:
                            calculateScore(

                                name,

                                code,

                                keywords,

                                terms

                            )

                    };

                }
            )


            .filter(
                Boolean
            )


            /* -----------------------------------------
               相關度排序
               ----------------------------------------- */

            .sort(
                (a, b) => {

                    if (
                        b.score !==
                        a.score
                    ) {

                        return (
                            b.score -
                            a.score
                        );

                    }


                    return (
                        a.originalIndex -
                        b.originalIndex
                    );

                }
            )


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


            /* -----------------------------------------
               產品名稱
               ----------------------------------------- */

            if (
                name === term
            ) {

                score +=
                    1000;

            }

            else if (
                name.startsWith(
                    term
                )
            ) {

                score +=
                    700;

            }

            else if (
                name.includes(
                    term
                )
            ) {

                score +=
                    500;

            }



            /* -----------------------------------------
               產品編號
               ----------------------------------------- */

            if (
                code === term
            ) {

                score +=
                    900;

            }

            else if (
                code.startsWith(
                    term
                )
            ) {

                score +=
                    600;

            }

            else if (
                code.includes(
                    term
                )
            ) {

                score +=
                    400;

            }



            /* -----------------------------------------
               Keywords
               ----------------------------------------- */

            if (
                keywords.some(
                    keyword =>
                        keyword ===
                        term
                )
            ) {

                score +=
                    350;

            }

            else if (
                keywords.some(
                    keyword =>
                        keyword.startsWith(
                            term
                        )
                )
            ) {

                score +=
                    250;

            }

            else if (
                keywords.some(
                    keyword =>
                        keyword.includes(
                            term
                        )
                )
            ) {

                score +=
                    150;

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
            */

            .normalize(
                "NFKC"
            )


            /*
               英文大小寫統一
            */

            .toLowerCase()


            /*
               去除前後空格
            */

            .trim()


            /*
               多個空格變一個
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
            currentResults.length >
            0
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


        const previousValue =
            select.value;


        select.innerHTML =
            "";



        /* ---------------------------------------------
           第一個選項
           --------------------------------------------- */

        const placeholder =
            document.createElement(
                "option"
            );


        placeholder.value =
            "";


        if (
            currentQuery &&
            productList.length ===
                0
        ) {

            placeholder.textContent =
                "沒有符合的產品";

        }

        else if (
            currentQuery
        ) {

            placeholder.textContent =
                `搜尋結果（${productList.length}）`;

        }

        else {

            placeholder.textContent =
                "請選擇產品";

        }


        select.appendChild(
            placeholder
        );



        /* ---------------------------------------------
           建立選項
           --------------------------------------------- */

        const fragment =
            document.createDocumentFragment();


        productList.forEach(
            product => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    product.code || "";


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



                /* -------------------------------------
                   保留目前選擇
                   ------------------------------------- */

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

            }
        );


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
           選擇產品
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
           前往產品頁按鈕
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
            getProductUrl(
                product
            );


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
           顯示 / 隱藏
           --------------------------------------------- */

        function updateButton() {

            button.hidden =
                window.scrollY <=
                300;

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