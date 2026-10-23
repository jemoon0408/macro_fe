(function () {
  "use strict";

  /* =========================================================
     GNB 2depth

     - 1depth 메뉴 hover / focus → 해당 2depth 열기 + 본문 dim
     - 헤더 밖으로 마우스 이동, 포커스 이탈, ESC → 닫기
  ========================================================= */

  const header = document.querySelector(".header");
  const dim = document.querySelector(".header__dim");

  if (!header) {
    return;
  }

  const items = header.querySelectorAll(".gnb__item");

  function openMenu(item) {
    items.forEach(function (el) {
      el.classList.toggle("is-active", el === item);
    });

    header.classList.add("is-open");

    if (dim) {
      dim.classList.add("is-show");
    }
  }

  function closeMenu() {
    items.forEach(function (el) {
      el.classList.remove("is-active");
    });

    header.classList.remove("is-open");

    if (dim) {
      dim.classList.remove("is-show");
    }
  }

  items.forEach(function (item) {
    item.addEventListener("mouseenter", function () {
      openMenu(item);
    });

    item.addEventListener("focusin", function () {
      openMenu(item);
    });
  });

  /* 1depth 메뉴 밖(로고·유틸 영역) 으로 이동 시 닫기 */
  header.querySelector(".header__logo").addEventListener("mouseenter", closeMenu);
  header.querySelector(".header__util").addEventListener("mouseenter", closeMenu);

  header.addEventListener("mouseleave", closeMenu);

  header.addEventListener("focusout", function (event) {
    if (!header.querySelector(".gnb").contains(event.relatedTarget)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && header.classList.contains("is-open")) {
      const active = header.querySelector(".gnb__item.is-active .gnb__link");

      closeMenu();

      if (active) {
        active.focus();
      }
    }
  });
})();
