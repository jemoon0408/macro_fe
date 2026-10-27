(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* sub.js 위치(js/) 기준 프로젝트 루트 → 페이지 깊이와 상관없이 이미지 경로 계산 */
  const ROOT_URL = document.currentScript
    ? new URL("../", document.currentScript.src)
    : new URL("../../", window.location.href);


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
     - 스테이지를 스크롤하는 동안 화면(sticky)이 고정된 채
       1. 사진 4장이 아래에서 순서대로 제자리로 모임
       2. 슬로건이 왼쪽부터 채워짐
     - 소개 문구(체크 목록)는 애니메이션 없이 스테이지 아래에 고정
     - 시작 : 섹션 상단이 화면 85% 지점에 닿을 때부터 → 페이지 진입 시 첫 사진만 살짝 올라온 상태
  ========================================================= */

  function initIdentity() {
    const section = document.querySelector(".ov-identity");

    if (!section) {
      return;
    }

    if (reduceMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      section.classList.add("is-static");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const q = gsap.utils.selector(section);
    const stage = q(".ov-identity__stage")[0];
    const wrap = q(".ov-identity__wrap")[0];
    /* invalidateOnRefresh 사용 시 from() 은 도착값이 숨김 상태로 다시 잡히므로 fromTo 로 도착값 고정 */
    const from = { y: "80vh", opacity: 0 };
    const to = { y: 0, opacity: 1, duration: 1.2 };

    /* 종료 : 고정이 풀리는 지점 (스테이지 하단 = 고정 화면 하단) */
    function endScroll() {
      const stageTop = stage.getBoundingClientRect().top + window.scrollY;
      const stickyTop = parseFloat(getComputedStyle(wrap).top) || 0;

      return stageTop + stage.offsetHeight - stickyTop - wrap.offsetHeight;
    }

    gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: "top 85%",
        end: endScroll,
        scrub: .5,
        invalidateOnRefresh: true
      }
    })
      .fromTo(q(".ov-identity__photo--01"), from, to)
      .fromTo(q(".ov-identity__photo--03"), from, to, ">-0.6")
      .fromTo(q(".ov-identity__photo--02"), from, to, ">-0.8")
      .fromTo(q(".ov-identity__photo--04"), from, to, ">-1")
      .fromTo(q(".ov-identity__en"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .6 }, .6)
      .fromTo(q(".ov-identity__fill"), { backgroundPositionX: "100%" }, { backgroundPositionX: "0%", duration: 2 }, .6)
      .to({}, { duration: .4 });

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
     비전 : 미션 카드 (GSAP ScrollTrigger scrub)
     - 스크롤하는 만큼 카드가 아래에서 하나씩 스르륵 떠오름 (위로 스크롤 시 되감김)
  ========================================================= */

  function initMission() {
    const items = document.querySelectorAll(".mission__item");

    if (!items.length || reduceMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    /* PC·태블릿 : 가로 3열 → 미션 영역 전체 스크롤 구간에서 차례로 */
    mm.add("(min-width: 769px)", function () {
      gsap.fromTo(items, { y: 100, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "sine.out",
        stagger: .6,
        scrollTrigger: {
          trigger: ".mission",
          start: "top 100%",
          end: "bottom 45%",
          scrub: 2
        }
      });
    });

    /* 모바일 : 세로로 쌓이므로 카드마다 자기 위치에서 떠오름 */
    mm.add("(max-width: 768px)", function () {
      items.forEach(function (item) {
        gsap.fromTo(item, { y: 60, opacity: 0 }, {
          y: 0,
          opacity: 1,
          ease: "sine.out",
          scrollTrigger: {
            trigger: item,
            start: "top 100%",
            end: "top 55%",
            scrub: 2
          }
        });
      });
    });
  }


  /* =========================================================
     FAQ : 아코디언 (하나만 펼침)
  ========================================================= */

  function initAccordion() {
    document.querySelectorAll("[data-accordion]").forEach(function (list) {
      const items = list.querySelectorAll(".faq__item");

      function setOpen(item, open) {
        const button = item.querySelector(".faq__q");
        const panel = document.getElementById(button.getAttribute("aria-controls"));

        item.classList.toggle("is-open", open);
        button.setAttribute("aria-expanded", String(open));
        panel.hidden = !open;
      }

      items.forEach(function (item) {
        item.querySelector(".faq__q").addEventListener("click", function () {
          const willOpen = !item.classList.contains("is-open");

          items.forEach(function (other) {
            setOpen(other, other === item && willOpen);
          });
        });
      });
    });
  }


  /* =========================================================
     프로모션 : 썸네일을 불러오지 못하면 대체 이미지
     - 썸네일 없는 게시물과 같은 모양 (.promo-card__img--empty + 로고)
  ========================================================= */

  function initPromoFallback() {
    const logo = new URL("img/common/logo.png", ROOT_URL).href;

    function toEmpty(img) {
      const box = img.parentElement;

      box.classList.add("promo-card__img--empty");
      img.classList.add("promo-card__logo");
      img.src = logo;
    }

    document.querySelectorAll(".promo-card__img:not(.promo-card__img--empty) img").forEach(function (img) {
      if (!img.getAttribute("src")) {
        toEmpty(img);
        return;
      }

      /* defer 실행 전에 이미 실패한 경우 (complete + 크기 0) 도 처리 */
      if (img.complete && !img.naturalWidth) {
        toEmpty(img);
        return;
      }

      img.addEventListener("error", function () {
        toEmpty(img);
      }, { once: true });
    });
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


  initMission();
  initAccordion();
  initPromoFallback();
  initIdentity();
  initCertMarquee();
  initFillText();
  initTabs();
  initFilter();
  initFeatureSwiper();
})();
