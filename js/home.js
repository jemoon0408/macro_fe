(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
  }


  /* =========================================================
     B01 : 메인 비주얼 (hucord.com/kr 메인 상단과 같은 구성)
     - 라이브러리 : GSAP + ScrollTrigger (pin · scrub 타임라인), 글자 등장은 CSS keyframes (main.css)
     - 진입 : 제목 textClip(0.3s · 1.3s), 이미지 속 문구는 단어별 textBlur(0.15s 간격) → 설명 textClip
     - 스크롤(PC) : 영역 고정(pin, 추가 높이 화면 절반 · 최대 400px)
         · 이미지 : 양옆 19% 잘린 상태(clip) → 좌우 여백만 남기고 화면 높이까지 꽉 차게 펼쳐지며 제목 자리로 올라옴
         · 제목 : 윗줄은 오른쪽, 아랫줄은 왼쪽으로 밀려나며 사라짐
     - 스크롤(모바일) : 이미지는 시안 그대로, 제목만 밀려남 (고정 없음)
  ========================================================= */

  function initVisual() {
    const section = document.querySelector(".mv");

    if (!section) {
      return;
    }

    const visual = section.querySelector(".mv__visual");
    const title = section.querySelector(".mv__title");
    const top = section.querySelector(".mv__title-top");
    const bottom = section.querySelector(".mv__title-bottom");
    const heading = section.querySelector("[data-blur-words]");
    const desc = section.querySelector(".mv__desc");

    /* 문구 단어 나누기 → 단어마다 0.15s 씩 늦게 블러 등장 */
    if (heading && !reduceMotion) {
      let count = 0;

      Array.from(heading.children).forEach(function (line) {
        const words = line.textContent.trim().split(/\s+/);

        line.textContent = "";
        words.forEach(function (word, index) {
          const span = document.createElement("span");

          span.className = "mv__word";
          span.textContent = word;
          span.style.animationDelay = (.6 + count * .15) + "s";
          line.appendChild(span);

          if (index < words.length - 1) {
            line.appendChild(document.createTextNode(" "));
          }

          count += 1;
        });
      });

      desc.classList.add("is-clip");
      desc.style.animationDelay = (.6 + count * .15 + .2) + "s";
    }

    if (!hasGsap || reduceMotion) {
      return;
    }

    const mm = gsap.matchMedia();

    /* PC : 고정(pin) + 이미지가 화면 높이까지 꽉 차게 확장
       - 이미지 실제 높이는 처음부터 "화면 높이 - 위아래 여백" 으로 두고, 아래쪽을 잘라(clip) 시안 비율로 보이게 시작
       - 스크롤하면 양옆 · 아래 잘림이 풀리며 제목 자리까지 올라와 화면을 채움 → 고정 구간에 빈 여백 없음
       - 다음 섹션은 올라간 만큼 당겨 고정이 풀리는 순간 바로 이어짐 */
    /* PC : 고정(pin) + 이미지가 화면 높이까지 꽉 차게 확장
       - 이미지 실제 높이는 처음부터 "화면 높이 - 위아래 여백" 으로 두고, 아래쪽을 잘라(clip) 시작
       - 스크롤하면 양옆 · 아래 잘림이 풀리며 제목 자리까지 올라와 화면을 채움 → 고정 구간에 빈 여백 없음
       - 다음 섹션은 올라간 만큼 당겨 고정이 풀리는 순간 바로 이어짐
       - 매 프레임 레이아웃이 다시 계산되지 않도록 이미지는 clip-path, 문구 · 제목 · 이미지 위치는 transform 으로만 움직임 */
    mm.add("(min-width: 769px)", function () {
      const next = section.nextElementSibling;
      const media = visual.querySelector(".mv__media");
      const txt = visual.querySelector(".mv__txt");
      /* 고정되는 스크롤 길이(pin-spacer 추가 높이) : 화면 높이의 절반, 최대 400px */
      const PIN_MAX = 400;

      function radius() {
        return parseFloat(getComputedStyle(visual).getPropertyValue("--radius")) || 0;
      }

      function insetX() {
        return visual.offsetWidth * .19;
      }

      /* 처음 문구 위치 : 잘린 이미지 안쪽(잘린 폭 + 56px)에 오도록 오른쪽으로 */
      function txtShift() {
        return Math.max(0, insetX() + 56 - parseFloat(getComputedStyle(txt).paddingLeft));
      }

      function lift() {
        return visual.offsetTop - title.offsetTop;
      }

      /* 1200 이하는 헤더가 화면 위에 고정 → 그 아래부터 고정 · 채움 */
      function headerH() {
        const header = document.querySelector(".header");

        return header && getComputedStyle(header).position === "fixed" ? header.offsetHeight : 0;
      }

      /* 크기 계산
         - 펼친 높이(fullH) : 헤더 아래 화면을 위아래 여백만 남기고 꽉 채움
         - 처음 보이는 높이 : 시안 비율 높이, 단 세로로 긴 화면에서는 제목 아래 남은 화면 끝까지
           → 처음 · 고정 중 · 끝 어느 때도 이미지 아래에 빈 공간이 생기지 않음
         - 반환값 : 처음에 아래쪽을 잘라 두는 높이 */
      function size() {
        const pad = parseFloat(getComputedStyle(section.querySelector(".mv__pin")).paddingTop);
        /* 높이를 직접 주면 aspect-ratio 때문에 너비가 높이에 맞춰 늘어나므로 비율 고정 해제 후 너비 기준 계산 */
        visual.style.aspectRatio = "auto";

        const avail = window.innerHeight - headerH();
        const designH = visual.offsetWidth * 780 / 1808;
        const fullH = Math.max(designH, avail - pad * 2);
        const startH = Math.min(fullH, Math.max(designH, avail - visual.offsetTop - pad));

        visual.style.height = fullH + "px";
        next.style.marginTop = -lift() + "px";

        return fullH - startH;
      }

      size();
      ScrollTrigger.addEventListener("refreshInit", size);

      gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: function () {
            return "top " + headerH() + "px";
          },
          end: function () {
            return "+=" + Math.min(window.innerHeight * .5, PIN_MAX);
          },
          scrub: 1.5,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      })
        .fromTo(media,
          {
            clipPath: function () {
              return "inset(0px " + insetX() + "px " + size() + "px " + insetX() + "px round " + radius() + "px)";
            }
          },
          {
            clipPath: function () {
              return "inset(0px 0px 0px 0px round " + radius() + "px)";
            },
            ease: "none",
            duration: 1
          }, 0)
        .fromTo(txt,
          {
            x: txtShift,
            y: function () { return -size(); }
          },
          { x: 0, y: 0, ease: "none", duration: 1 }, 0)
        .to(visual, { y: function () { return -lift(); }, ease: "none", duration: 1 }, 0)
        .to(top, { xPercent: 100, opacity: 0, ease: "none", duration: 1 }, 0)
        .to(bottom, { xPercent: -100, opacity: 0, ease: "none", duration: 1 }, 0)
        /* 다 펼쳐진 상태로 잠깐 유지 */
        .to({}, { duration: .3 });

      return function () {
        ScrollTrigger.removeEventListener("refreshInit", size);
        next.style.marginTop = "";
        visual.style.height = "";
        visual.style.aspectRatio = "";
        gsap.set([media, txt], { clearProps: "all" });
      };
    });

    /* 모바일 : 이미지는 시안 그대로(양옆 잘림 없음 → 문구 여백 20px 유지),
       고정 없이(빈 여백 없음) 지나가는 동안 제목만 좌우로 밀려남 */
    mm.add("(max-width: 768px)", function () {
      gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          invalidateOnRefresh: true
        }
      })
        .to(top, { xPercent: 60, opacity: 0, ease: "none" }, 0)
        .to(bottom, { xPercent: -60, opacity: 0, ease: "none" }, 0);
    });

    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  }


  /* =========================================================
     B02 : 숫자 증가
     - 숫자 목록이 화면 안에 충분히 들어왔을 때(목록 상단이 화면 70% 지점) 한 번만 시작
       → 화면 아래 끝에 걸쳐 있을 때 미리 끝나 버리지 않도록
     - 0(연도는 1900)부터 목표값까지 증가
  ========================================================= */

  function initCount() {
    const section = document.querySelector(".m-facts");

    if (!section || reduceMotion) {
      return;
    }

    const list = section.querySelector(".m-facts__list");
    const nums = Array.from(list.querySelectorAll("[data-count]"));

    nums.forEach(function (num) {
      num.textContent = num.dataset.countFrom || "0";
    });

    function run() {
      nums.forEach(function (num, index) {
        const to = Number(num.dataset.count);
        const from = Number(num.dataset.countFrom || 0);
        const duration = 2000;
        const delay = index * 120;
        let begin = null;

        function step(time) {
          if (begin === null) {
            begin = time + delay;
          }

          const progress = Math.min(Math.max((time - begin) / duration, 0), 1);
          const eased = 1 - Math.pow(1 - progress, 3);

          num.textContent = Math.round(from + (to - from) * eased);

          if (progress < 1) {
            requestAnimationFrame(step);
          }
        }

        requestAnimationFrame(step);
      });
    }

    /* 메인 비주얼 고정(pin) 구간만큼 위치가 밀리므로 ScrollTrigger 로 실제 위치 기준 판단 */
    if (hasGsap) {
      ScrollTrigger.create({
        trigger: list,
        start: "top 70%",
        once: true,
        onEnter: run
      });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        run();
        observer.disconnect();
      }
    }, { rootMargin: "0px 0px -30% 0px" });

    observer.observe(list);
  }


  /* =========================================================
     B03 : 지속가능성 왼쪽 목차
     - 오른쪽 항목이 화면 가운데를 지나면 해당 목차 강조 (is-active)
     - 목차 클릭 시 해당 항목으로 부드럽게 이동
     - 모바일 : 섹션을 아래로 스크롤해 지나가는 동안 다음 문구 · 이미지로 전환
                (같은 자리에서 이전 내용은 사라지고 다음 내용이 나타남, 목차를 눌러도 해당 위치로 이동)
  ========================================================= */

  function initGreen() {
    const section = document.querySelector("[data-green]");

    if (!section) {
      return;
    }

    const links = Array.from(section.querySelectorAll(".m-green__nav-list a"));
    const items = links.map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    });
    const mobile = window.matchMedia("(max-width: 768px)");
    let current = null;

    function setActive(link) {
      if (link === current) {
        return;
      }

      current = link;
      links.forEach(function (item) {
        const active = item === link;

        item.classList.toggle("is-active", active);
        items[links.indexOf(item)].classList.toggle("is-active", active);

        if (active) {
          item.setAttribute("aria-current", "true");
        } else {
          item.removeAttribute("aria-current");
        }
      });
    }

    function update() {
      if (mobile.matches) {
        return;
      }

      const line = window.innerHeight * .5;
      let active = links[0];

      items.forEach(function (item, index) {
        if (item.getBoundingClientRect().top <= line) {
          active = links[index];
        }
      });

      setActive(active);
    }

    links.forEach(function (link, index) {
      link.addEventListener("click", function (event) {
        event.preventDefault();

        if (mobile.matches && pinTrigger) {
          /* 고정 구간 안에서 해당 항목이 보이는 지점으로 이동 */
          const step = (pinTrigger.end - pinTrigger.start) / links.length;

          window.scrollTo({
            top: pinTrigger.start + step * index + 2,
            behavior: reduceMotion ? "auto" : "smooth"
          });
          return;
        }

        if (mobile.matches) {
          setActive(link);
          return;
        }

        items[index].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
    });

    /* 모바일 : 고정(pin) 없이 섹션을 지나가는 동안 진행도에 따라 항목 전환
       (섹션 높이는 내용 1개 높이 그대로 → 빈 여백 없음) */
    let pinTrigger = null;

    if (hasGsap && !reduceMotion) {
      gsap.matchMedia().add("(max-width: 768px)", function () {
        pinTrigger = ScrollTrigger.create({
          trigger: section,
          start: "top 60%",
          end: "bottom 60%",
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            const index = Math.min(links.length - 1, Math.floor(self.progress * links.length));

            setActive(links[index]);
          }
        });

        return function () {
          pinTrigger = null;
        };
      });
    }

    setActive(links[0]);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }


  /* =========================================================
     B04 · B08 : 가로 스와이퍼
  ========================================================= */

  function initSwipers() {
    if (typeof Swiper === "undefined") {
      return;
    }

    const core = document.querySelector(".m-core__swiper");
    const youtube = document.querySelector(".m-youtube__swiper");
    const cred = document.querySelector(".m-cred__swiper");

    if (core) {
      new Swiper(core, {
        slidesPerView: "auto",
        spaceBetween: 24,
        speed: 600,
        grabCursor: true,
        breakpoints: {
          0: { spaceBetween: 16 },
          769: { spaceBetween: 24 }
        }
      });
    }

    /* 유튜브 : 드래그 · 트랙패드/휠 가로 스크롤로 좌우 이동 (세로 휠은 페이지 스크롤 그대로) */
    if (youtube) {
      new Swiper(youtube, {
        slidesPerView: "auto",
        spaceBetween: 20,
        speed: 600,
        grabCursor: true,
        freeMode: true,
        mousewheel: { forceToAxis: true },
        breakpoints: {
          0: { spaceBetween: 12 },
          769: { spaceBetween: 20 }
        }
      });
    }

    if (cred) {
      new Swiper(cred, {
        slidesPerView: "auto",
        speed: 600,
        watchOverflow: true
      });
    }
  }


  /* =========================================================
     B05 : 5대 기술
     - 탭 또는 카드에 마우스를 올리거나(hover) 클릭 · 포커스하면 해당 기술로 active 이동
     - 선택한 카드는 크게 펼쳐짐 (보이는 카드 3장 중 어디든 1장만 크게 → 너비 합은 항상 같음)
     - 보이는 범위 밖의 기술을 탭으로 고르면 그때만 가로로 이동 (hover 중 카드가 밀려 연달아 바뀌지 않도록)
     - 모바일 : 선택한 카드가 맨 앞, 다음 카드가 오른쪽에 살짝 보임
  ========================================================= */

  /* 공통 : 가로로 넘치는 영역을 마우스로 끌어서 스크롤
     - 끄는 동안 스냅(scroll-snap) 해제, 놓으면 다시 스냅
     - 끈 직후의 클릭(링크 이동 · 탭 선택)은 무시 */
  function dragScroll(el, enabled) {
    let drag = null;

    el.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse" || !enabled() || el.scrollWidth <= el.clientWidth) {
        return;
      }

      drag = { x: event.clientX, left: el.scrollLeft, moved: false };
      el.style.scrollSnapType = "none";
      el.style.scrollBehavior = "auto";
    });

    window.addEventListener("pointermove", function (event) {
      if (!drag) {
        return;
      }

      const dx = event.clientX - drag.x;

      if (Math.abs(dx) > 4) {
        drag.moved = true;
      }

      el.scrollLeft = drag.left - dx;
    });

    window.addEventListener("pointerup", function () {
      if (!drag) {
        return;
      }

      const moved = drag.moved;

      drag = null;
      el.style.scrollSnapType = "";
      el.style.scrollBehavior = "";

      if (moved) {
        const block = function (event) {
          event.preventDefault();
          event.stopPropagation();
        };

        el.addEventListener("click", block, { capture: true, once: true });
        setTimeout(function () {
          el.removeEventListener("click", block, { capture: true });
        }, 0);
      }
    });
  }


  function initTech() {
    const wrap = document.querySelector("[data-tech]");

    if (!wrap) {
      return;
    }

    const tabs = Array.from(wrap.querySelectorAll("[role='tab']"));
    const panel = wrap.querySelector(".m-tech__panel");
    const track = wrap.querySelector(".m-tech__track");
    const cards = Array.from(track.children);
    const mobile = window.matchMedia("(max-width: 768px)");
    const hoverable = window.matchMedia("(hover: hover)");
    let current = cards.findIndex(function (card) {
      return card.classList.contains("is-active");
    });
    let start = Math.max(current - 1, 0);

    /* 모바일 : 카드 목록을 손가락으로 좌우 스와이프(가로 스크롤 + 스냅)
       - 스크롤이 멈춘 위치의 카드가 선택 → 탭도 함께 바뀜
       - 탭을 누르면 해당 카드 위치로 스크롤 */
    let scrollTimer = null;
    let syncing = false;

    function scrollToCard(index, instant) {
      const style = getComputedStyle(panel);
      const step = parseFloat(style.getPropertyValue("--small")) + parseFloat(style.getPropertyValue("--gap"));
      const left = Math.min(index * step, panel.scrollWidth - panel.clientWidth);

      /* 실제로 움직일 때만 : 이 스크롤로 다시 선택이 바뀌지 않도록 표시 */
      if (Math.abs(left - panel.scrollLeft) < 1) {
        return;
      }

      syncing = true;
      panel.scrollTo({ left: left, behavior: instant || reduceMotion ? "auto" : "smooth" });
    }

    panel.addEventListener("scroll", function () {
      if (!mobile.matches) {
        return;
      }

      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        const style = getComputedStyle(panel);
        const step = parseFloat(style.getPropertyValue("--small")) + parseFloat(style.getPropertyValue("--gap"));
        const max = panel.scrollWidth - panel.clientWidth;
        /* 끝까지 밀면 마지막 카드 */
        const index = panel.scrollLeft >= max - 2 ? cards.length - 1 : Math.round(panel.scrollLeft / step);

        if (!syncing) {
          select(Math.min(index, cards.length - 1), false, true);
        }

        syncing = false;
      }, 120);
    }, { passive: true });

    /* 마우스로 끌어도 좌우 스크롤 (터치는 기본 스크롤)
       - 카드 목록 : 모바일 너비 / 탭 줄 : 넘칠 때(태블릿 · 모바일) */
    dragScroll(panel, function () { return mobile.matches; });
    dragScroll(tabs[0].closest("ul"), function () { return true; });

    /* 배치 : 보이는 범위(start)와 선택한 카드에 맞춰 각 카드 위치 계산 (PC · 태블릿) */
    function move() {
      const style = getComputedStyle(panel);
      const small = parseFloat(style.getPropertyValue("--small"));
      const gap = parseFloat(style.getPropertyValue("--gap"));

      /* 모바일은 가로 스크롤로 배치 (위치 계산 없음) */
      if (mobile.matches) {
        cards.forEach(function (card) {
          card.style.transform = "";
        });
        panel.style.setProperty("--big", small + "px");
        return;
      }

      if (current < start) {
        start = current;
      } else if (current > start + 2) {
        start = current - 2;
      }

      start = Math.min(start, cards.length - 3);

      /* 펼친 카드 너비 : 모든 카드의 실제 크기 (글자 영역도 이 너비 기준으로 고정) */
      const big = panel.clientWidth - small * 2 - gap * 2;
      let x = -start * (small + gap);

      panel.style.setProperty("--big", big + "px");

      /* 카드 위치 : 앞 카드들의 (보이는) 너비 + 간격만큼 오른쪽으로 */
      cards.forEach(function (card, index) {
        card.style.transform = "translate3d(" + x + "px, 0, 0)";
        x += (index === current ? big : small) + gap;
      });
    }

    function select(index, focus, fromScroll) {
      if (index === current) {
        return;
      }

      current = index;

      tabs.forEach(function (tab, i) {
        const active = i === index;

        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
      });

      cards.forEach(function (card, i) {
        const active = i === index;

        card.classList.toggle("is-active", active);
        card.querySelector(".m-tech__btn").tabIndex = active ? 0 : -1;
      });

      if (focus) {
        tabs[index].focus();
      }

      /* 가로 스크롤 탭 : 선택한 탭이 보이도록 */
      const list = tabs[index].closest("ul");

      if (list.scrollWidth > list.clientWidth) {
        list.scrollTo({
          left: tabs[index].parentElement.offsetLeft - list.offsetLeft - 20,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      }

      if (mobile.matches) {
        if (!fromScroll) {
          scrollToCard(index);
        }
        return;
      }

      move();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(index);
      });

      /* hover 전환은 PC · 태블릿만 (모바일은 탭 · 스와이프로만) */
      tab.addEventListener("mouseenter", function () {
        if (hoverable.matches && !mobile.matches) {
          hoverSelect(index);
        }
      });

      tab.addEventListener("mouseleave", function () {
        clearTimeout(hoverTimer);
      });

      tab.addEventListener("keydown", function (event) {
        const keys = { ArrowRight: 1, ArrowLeft: -1 };

        if (event.key in keys) {
          event.preventDefault();
          select((index + keys[event.key] + tabs.length) % tabs.length, true);
        } else if (event.key === "Home") {
          event.preventDefault();
          select(0, true);
        } else if (event.key === "End") {
          event.preventDefault();
          select(tabs.length - 1, true);
        }
      });
    });

    /* hover : 잠깐(120ms) 머물렀을 때만 전환 → 마우스가 스쳐 지나갈 때 연달아 바뀌며 버벅이지 않도록 */
    let hoverTimer = null;

    function hoverSelect(index) {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(function () {
        select(index);
      }, 120);
    }

    cards.forEach(function (card, index) {
      card.addEventListener("mouseenter", function () {
        if (hoverable.matches && !mobile.matches) {
          hoverSelect(index);
        }
      });

      card.addEventListener("mouseleave", function () {
        clearTimeout(hoverTimer);
      });

      /* 박스 전체 클릭 : 선택된 카드는 상세로 이동, 아직 선택 전이면 먼저 펼침 */
      card.addEventListener("click", function (event) {
        if (index !== current) {
          event.preventDefault();
          clearTimeout(hoverTimer);
          select(index);
        }
      });
    });

    if (reduceMotion) {
      cards.forEach(function (card) {
        card.style.transition = "none";
      });
    }

    /* 첫 배치 · 화면 크기 변경 시에는 애니메이션 없이 바로 자리 잡기 */
    function place() {
      panel.classList.add("is-static");
      move();

      if (mobile.matches) {
        scrollToCard(current, true);
      }

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          panel.classList.remove("is-static");
        });
      });
    }

    place();
    window.addEventListener("resize", place);
  }


  /* =========================================================
     B06 : 효능별 원료 탐색
     - 카드에 마우스를 올리거나 포커스하면 배경이 해당 효능 이미지로 전환
     - 영역을 벗어나면 기본(보습) 이미지로
  ========================================================= */

  function initEffect() {
    const section = document.querySelector(".m-effect");

    if (!section) {
      return;
    }

    const bg = section.querySelector(".m-effect__bg");
    const base = bg.querySelector("img");
    const cards = Array.from(section.querySelectorAll("[data-bg]"));
    const layers = [];
    /* 기본 선택 : 배경 기본 이미지와 같은 카드 (보습) */
    const defaultIndex = Math.max(0, cards.findIndex(function (card) {
      return card.dataset.bg === base.getAttribute("src");
    }));

    cards.forEach(function (card) {
      const src = card.dataset.bg;
      let img = layers.find(function (layer) {
        return layer.getAttribute("src") === src;
      });

      if (!img && src === base.getAttribute("src")) {
        img = base;
      }

      if (!img) {
        img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.decoding = "async";
        bg.appendChild(img);
      }

      layers.push(img);
    });

    function activate(index) {
      cards.forEach(function (card, i) {
        card.classList.toggle("is-active", i === index);
      });

      bg.querySelectorAll("img").forEach(function (img) {
        img.classList.toggle("is-on", img === layers[index]);
      });
    }

    cards.forEach(function (card, index) {
      card.addEventListener("mouseenter", function () {
        activate(index);
      });
      card.addEventListener("focus", function () {
        activate(index);
      });
    });

    section.querySelector(".m-effect__list").addEventListener("mouseleave", function () {
      activate(defaultIndex);
    });
    section.addEventListener("focusout", function (event) {
      if (!section.contains(event.relatedTarget)) {
        activate(defaultIndex);
      }
    });

    activate(defaultIndex);
  }



  /* =========================================================
     B07 : 파트너 로고 무한 흐름
     - 화면 너비보다 길어지도록 로고 묶음을 반복 → 전체를 한 번 더 복제해 -50% 이동 시 끊김 없음
  ========================================================= */

  function initMarquee() {
    const track = document.querySelector("[data-marquee]");

    if (!track || reduceMotion) {
      return;
    }

    const items = Array.from(track.children);
    const repeat = Math.max(1, Math.ceil(Math.max(window.innerWidth, window.screen.width) / track.scrollWidth));

    for (let i = 0; i < repeat * 2 - 1; i++) {
      items.forEach(function (item) {
        const clone = item.cloneNode(true);

        clone.setAttribute("aria-hidden", "true");
        clone.querySelector("img").alt = "";
        track.appendChild(clone);
      });
    }

    track.style.animationDuration = 40 * repeat + "s";
  }


  initVisual();
  initCount();
  initGreen();
  initSwipers();
  initTech();
  initEffect();
  initMarquee();
})();
