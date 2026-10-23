(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


  /* =========================================================
     회사개요 : 인증 로고 무한 흐름
     - 트랙을 한 번 복제해 -50% 이동 시 끊김 없이 반복
  ========================================================= */

  function initCertMarquee() {
    const track = document.querySelector(".ov-cert__track");

    if (!track || reduceMotion) {
      return;
    }

    Array.from(track.children).forEach(function (item) {
      const clone = item.cloneNode(true);

      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("img").forEach(function (img) {
        img.alt = "";
      });
      track.appendChild(clone);
    });
  }


  /* =========================================================
     회사개요 : 기업 정체성 (GSAP ScrollTrigger scrub)
     - 레이아웃은 시안 그대로 두고, 페이지 진입 시 절반쯤 진행된 상태에서 스크롤에 따라
       1. 사진 4장이 아래에서 순서대로 제자리로 모임
       2. 슬로건이 왼쪽부터 채워짐
  ========================================================= */

  function initIdentity() {
    const section = document.querySelector(".ov-identity");

    if (!section || reduceMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const q = gsap.utils.selector(section);
    const visual = q(".ov-identity__visual")[0];
    /* invalidateOnRefresh 사용 시 from() 은 도착값이 숨김 상태로 다시 잡히므로 fromTo 로 도착값 고정 */
    const from = { y: "50vh", opacity: 0 };
    const to = { y: 0, opacity: 1, duration: 1.2 };

    /*
      종료 : 사진 영역 중앙이 화면 40% 지점에 왔을 때 (= 다 모인 상태)
      시작 : 종료 지점의 1.2배만큼 음수로 당겨서, 페이지 맨 위(스크롤 0)에서 약 55% 진행된 상태로 시작
            (사진 1~2장 도착 + 슬로건 절반 채움)
    */
    function endScroll() {
      const rect = visual.getBoundingClientRect();
      const center = rect.top + window.scrollY + rect.height / 2;

      return Math.max(center - window.innerHeight * .4, 200);
    }

    gsap.timeline({
      scrollTrigger: {
        trigger: visual,
        start: function () {
          return -endScroll() * 1.2;
        },
        end: endScroll,
        scrub: .5,
        invalidateOnRefresh: true
      }
    })
      .fromTo(q(".ov-identity__photo--01"), from, to)
      .fromTo(q(".ov-identity__photo--03"), from, to, ">-0.6")
      .fromTo(q(".ov-identity__photo--02"), from, to, ">-0.8")
      .fromTo(q(".ov-identity__photo--04"), from, to, ">-1")
      .fromTo(q(".ov-identity__en"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .6 }, .3)
      .fromTo(q(".ov-identity__fill"), { backgroundPositionX: "100%" }, { backgroundPositionX: "0%", duration: 2.1 }, .3);

    /* 헤더·푸터 include 로 문서 높이가 바뀌면 트리거 위치 재계산 */
    if (window.ResizeObserver) {
      let timer;

      new ResizeObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          ScrollTrigger.refresh();
        }, 100);
      }).observe(document.body);
    }
  }


  /* =========================================================
     연혁 : 스크롤에 따라 제목 글자 채우기
     - 줄 단위로 순서대로 채워짐 (--fill : 0% ~ 100%)
  ========================================================= */

  function initFillText() {
    const title = document.querySelector("[data-fill-text]");

    if (!title) {
      return;
    }

    const lines = Array.from(title.children);

    if (reduceMotion) {
      return;
    }

    function update() {
      const rect = title.getBoundingClientRect();
      const vh = window.innerHeight;

      /* 제목이 화면 하단 90% 지점 → 40% 지점까지 이동하는 동안 0 → 1 */
      const start = vh * .9;
      const end = vh * .4;
      const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);
      const total = progress * lines.length;

      lines.forEach(function (line, index) {
        const fill = Math.min(Math.max(total - index, 0), 1) * 100;

        line.style.setProperty("--fill", fill.toFixed(1) + "%");
      });
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }


  /* =========================================================
     오시는 길 : 공장 탭 (role="tab")
     - 클릭 / 좌우 방향키 / Home·End
  ========================================================= */

  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach(function (wrap) {
      const tabs = Array.from(wrap.querySelectorAll('[role="tab"]'));

      function select(tab, focus) {
        tabs.forEach(function (item) {
          const selected = item === tab;
          const panel = document.getElementById(item.getAttribute("aria-controls"));

          item.classList.toggle("is-active", selected);
          item.setAttribute("aria-selected", String(selected));
          item.tabIndex = selected ? 0 : -1;

          if (panel) {
            panel.hidden = !selected;
          }
        });

        if (focus) {
          tab.focus();
        }
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener("click", function () {
          select(tab, false);
        });

        tab.addEventListener("keydown", function (event) {
          let next = null;

          if (event.key === "ArrowRight") {
            next = tabs[(index + 1) % tabs.length];
          } else if (event.key === "ArrowLeft") {
            next = tabs[(index - 1 + tabs.length) % tabs.length];
          } else if (event.key === "Home") {
            next = tabs[0];
          } else if (event.key === "End") {
            next = tabs[tabs.length - 1];
          }

          if (next) {
            event.preventDefault();
            select(next, true);
          }
        });
      });
    });
  }


  /* =========================================================
     원료소개 : 효능별 필터
  ========================================================= */

  function initFilter() {
    const wrap = document.querySelector("[data-filter]");

    if (!wrap) {
      return;
    }

    const buttons = wrap.querySelectorAll("[data-filter-btn]");
    const cards = wrap.querySelectorAll("[data-cat]");
    const empty = wrap.querySelector(".ingredient-empty");

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        const value = button.dataset.filterBtn;
        let count = 0;

        buttons.forEach(function (item) {
          const active = item === button;

          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });

        cards.forEach(function (card) {
          const show = value === "all" || card.dataset.cat === value;

          card.hidden = !show;
          count += show ? 1 : 0;
        });

        if (empty) {
          empty.hidden = count > 0;
        }
      });
    });
  }


  /* =========================================================
     원료소개 : 주요제품 가로 스와이퍼
  ========================================================= */

  function initFeatureSwiper() {
    const section = document.querySelector(".pd-feature");

    if (!section || typeof Swiper === "undefined") {
      return;
    }

    const current = section.querySelector("[data-current]");
    const total = section.querySelector("[data-total]");
    const slides = section.querySelectorAll(".swiper-slide");

    function pad(number) {
      return String(number).padStart(2, "0");
    }

    if (total) {
      total.textContent = pad(slides.length);
    }

    new Swiper(section.querySelector(".swiper"), {
      slidesPerView: "auto",
      spaceBetween: 24,
      speed: 500,
      watchOverflow: true,
      navigation: {
        prevEl: section.querySelector("[data-prev]"),
        nextEl: section.querySelector("[data-next]")
      },
      breakpoints: {
        0: { spaceBetween: 12 },
        769: { spaceBetween: 24 }
      },
      on: {
        slideChange: function (swiper) {
          if (current) {
            current.textContent = pad(swiper.activeIndex + 1);
          }
        }
      }
    });
  }


  initIdentity();
  initCertMarquee();
  initFillText();
  initTabs();
  initFilter();
  initFeatureSwiper();
})();
