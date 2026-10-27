(function () {
  "use strict";

  const header = document.querySelector(".header");
  const dim = document.querySelector(".header__dim");

  if (!header) {
    return;
  }

  const items = header.querySelectorAll(".gnb__item");
  const menuBtn = header.querySelector(".header__menu-btn");

  /* layout.css 의 모바일 메뉴 구간과 동일 */
  const mobile = window.matchMedia("(max-width: 1200px)");


  /* =========================================================
     GNB 2depth (PC)

     - 1depth 메뉴 hover / focus → 해당 2depth 열기 + 본문 dim
     - 헤더 밖으로 마우스 이동, 포커스 이탈, ESC → 닫기
  ========================================================= */

  function openMenu(item) {
    if (mobile.matches) {
      return;
    }

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


  /* =========================================================
     모바일 메뉴 (1200px 이하)

     - 메뉴 버튼 → 헤더 전체 화면 패널 열기/닫기 + 본문 스크롤 잠금
     - 1depth 클릭 → 해당 2depth 펼침 (하나만 펼침)
     - 열 때 현재 페이지가 속한 메뉴를 펼친 상태로 시작
  ========================================================= */

  function setItemOpen(item, open) {
    item.classList.toggle("is-open", open);
    item.querySelector(".gnb__link").setAttribute("aria-expanded", String(open));
  }

  function findCurrentItem() {
    const here = window.location.pathname;

    return Array.prototype.find.call(items, function (item) {
      return Array.prototype.some.call(item.querySelectorAll(".gnb__sub a"), function (link) {
        return link.getAttribute("href") !== "#" && link.host === window.location.host && link.pathname === here;
      });
    });
  }

  function setMobileMenu(open) {
    header.classList.toggle("is-menu-open", open);
    document.documentElement.classList.toggle("is-menu-lock", open);

    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "전체 메뉴 닫기" : "전체 메뉴 열기");
    }

    if (open) {
      const current = findCurrentItem();

      items.forEach(function (item) {
        setItemOpen(item, item === current);
      });
    }
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      setMobileMenu(!header.classList.contains("is-menu-open"));
    });
  }

  items.forEach(function (item) {
    item.querySelector(".gnb__link").addEventListener("click", function (event) {
      if (!mobile.matches) {
        return;
      }

      event.preventDefault();

      const willOpen = !item.classList.contains("is-open");

      items.forEach(function (other) {
        setItemOpen(other, other === item && willOpen);
      });
    });
  });

  /* PC 폭으로 바뀌면 모바일 메뉴 상태 초기화 */
  mobile.addEventListener("change", function (event) {
    if (!event.matches) {
      setMobileMenu(false);
      items.forEach(function (item) {
        item.classList.remove("is-open");
        item.querySelector(".gnb__link").removeAttribute("aria-expanded");
      });
    } else {
      closeMenu();
    }
  });


  /* ESC : PC 2depth / 모바일 메뉴 닫기 */
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
      return;
    }

    if (header.classList.contains("is-menu-open")) {
      setMobileMenu(false);
      menuBtn.focus();
      return;
    }

    if (header.classList.contains("is-open")) {
      const active = header.querySelector(".gnb__item.is-active .gnb__link");

      closeMenu();

      if (active) {
        active.focus();
      }
    }
  });
})();
