/* 多樂桌遊產品頁共用功能 */
(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("currentYear");
    const topButton = document.getElementById("backToTop");

    if (year) {
      year.textContent = String(new Date().getFullYear());
    }

    if (!topButton) {
      return;
    }

    const toggleButton = () => {
      topButton.hidden = window.scrollY < 320;
    };

    window.addEventListener("scroll", toggleButton, { passive: true });

    topButton.addEventListener("click", () => {
      const reducedMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      window.scrollTo({
        top: 0,
        behavior: reducedMotion ? "auto" : "smooth"
      });
    });

    toggleButton();
  });
})();
