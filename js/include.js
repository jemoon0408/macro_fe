(function () {
  "use strict";

  /* =========================================================
     PROJECT ROOT

     include.js 위치:
     /js/include.js

     따라서 ../ 를 기준으로 프로젝트 루트 계산

    메인 HTML
    /pages/main-ko.html

     하위 HTML
    /pages/info-disclosure/page.html

     어디에서 실행하든 동일하게 프로젝트 루트를 찾음
  ========================================================= */

  /* =========================================================
     키보드 포커스 모드 (전 페이지 공통)
     - Tab 으로 이동하면 html.kbd-nav → 포커스 테두리 표시
     - 마우스 · 터치로 누르면 해제 → 클릭한 입력창 · 버튼에는 테두리 없음
  ========================================================= */

  document.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
      document.documentElement.classList.add("kbd-nav");
    }
  });

  document.addEventListener("pointerdown", function () {
    document.documentElement.classList.remove("kbd-nav");
  });


  /* =========================================================
     WebP 미지원 브라우저 : 같은 이름의 PNG 로 대체
     - 이미지는 WebP 로 사용하고, 같은 폴더에 같은 이름의 PNG 원본을 함께 둠
     - 지원 여부를 1px WebP 로 확인 → 미지원이면 html.no-webp 추가 후
       img(src · srcset) · 인라인 style(--bg 등) · CSS 파일 안의 .webp 를 모두 .png 로 교체
     - 공통 영역(헤더 · 푸터 등)은 나중에 삽입되므로 includeHTML 후에도 다시 적용
  ========================================================= */

  const WEBP_RE = /\.webp(?=["')?\s,]|$)/g;
  let noWebp = false;

  function toPng(value) {
    return value.replace(WEBP_RE, ".png");
  }

  function swapImages(scope) {
    if (!noWebp) {
      return;
    }

    (scope || document).querySelectorAll("img, source").forEach(function (el) {
      ["src", "srcset"].forEach(function (attr) {
        const value = el.getAttribute(attr);

        if (value && value.indexOf(".webp") > -1) {
          el.setAttribute(attr, toPng(value));
        }
      });
    });

    (scope || document).querySelectorAll("[style*='.webp']").forEach(function (el) {
      el.setAttribute("style", toPng(el.getAttribute("style")));
    });

    /* 스크립트가 나중에 이미지로 쓰는 경로 (메인 효능 배경 등) */
    (scope || document).querySelectorAll("[data-bg*='.webp']").forEach(function (el) {
      el.setAttribute("data-bg", toPng(el.getAttribute("data-bg")));
    });
  }

  function swapStyleSheets(sheets) {
    Array.from(sheets).forEach(function (sheet) {
      let rules;

      try {
        rules = sheet.cssRules;
      } catch (error) {
        return; /* 다른 도메인 CSS 는 건너뜀 */
      }

      Array.from(rules || []).forEach(function (rule) {
        if (rule.styleSheet) {
          swapStyleSheets([rule.styleSheet]);
        } else if (rule.cssRules) {
          swapStyleSheets([rule]);
        }

        /* 규칙 전체 문자열로 교체 (var() 가 섞인 단축 속성은 개별 속성 값이 비어 있어서) */
        if (rule.style && rule.style.cssText.indexOf(".webp") > -1) {
          rule.style.cssText = toPng(rule.style.cssText);
        }
      });
    });
  }

  const webpTest = new Image();

  webpTest.onload = webpTest.onerror = function () {
    if (webpTest.width === 1) {
      return;
    }

    noWebp = true;
    document.documentElement.classList.add("no-webp");
    swapStyleSheets(document.styleSheets);
    swapImages();

    /* @import 로 불러오는 CSS 는 늦게 준비되므로 페이지 로드 후 한 번 더 */
    window.addEventListener("load", function () {
      swapStyleSheets(document.styleSheets);
      swapImages();
    });
  };
  webpTest.src = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";


  const includeScript = document.currentScript;

  const ROOT_URL = includeScript
    ? new URL("../", includeScript.src)
    : new URL("../", window.location.href);


  /* =========================================================
     ROOT URL 생성
  ========================================================= */

  /*
   * 현재 페이지에서 프로젝트 루트까지의 상대경로
   * pages/main-ko.html           → ../
   * pages/education/page.html    → ../../
   */
  function getRootPrefix() {
    const rootPath = ROOT_URL.pathname;
    const pageDir = window.location.pathname.replace(/[^/]*$/, "");

    if (!pageDir.startsWith(rootPath)) {
      return ROOT_URL.href;
    }

    const depth = pageDir
      .slice(rootPath.length)
      .split("/")
      .filter(Boolean).length;

    return "../".repeat(depth);
  }

  const ROOT_PREFIX = getRootPrefix();

  function getRootURL(path) {
    return ROOT_PREFIX + path;
  }


  /* =========================================================
     상대경로 여부 확인
  ========================================================= */

  function isRelativePath(path) {
    if (!path) {
      return false;
    }

    return !(
      path.startsWith("#") ||
      path.startsWith("/") ||
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("//") ||
      path.startsWith("mailto:") ||
      path.startsWith("tel:") ||
      path.startsWith("javascript:") ||
      path.startsWith("data:")
    );
  }


  /* =========================================================
     INCLUDE 된 HTML 내부 상대경로 보정

     예)
     img/icons/logo.webp

     ↓

     프로젝트루트/img/icons/logo.webp

     현재 페이지가 루트이든
     info-disclosure 폴더 안이든 동일하게 작동
  ========================================================= */

  function resolveIncludedPaths(target) {
    if (!target) {
      return;
    }


    /* ========================= src ========================= */

    target.querySelectorAll("[src]").forEach(function (element) {
      const src = element.getAttribute("src");

      if (!isRelativePath(src)) {
        return;
      }

      element.setAttribute(
        "src",
        getRootURL(src)
      );
    });


    /* ========================= href ========================= */

    target.querySelectorAll("[href]").forEach(function (element) {
      const href = element.getAttribute("href");

      if (!isRelativePath(href)) {
        return;
      }

      element.setAttribute(
        "href",
        getRootURL(href)
      );
    });


    /* ========================= action ========================= */

    target.querySelectorAll("[action]").forEach(function (element) {
      const action = element.getAttribute("action");

      if (!isRelativePath(action)) {
        return;
      }

      element.setAttribute(
        "action",
        getRootURL(action)
      );
    });


    /* ========================= srcset ========================= */

    target.querySelectorAll("[srcset]").forEach(function (element) {
      const srcset = element.getAttribute("srcset");

      if (!srcset) {
        return;
      }

      const convertedSrcset = srcset
        .split(",")
        .map(function (item) {
          const parts = item.trim().split(/\s+/);
          const path = parts[0];
          const descriptor = parts.slice(1).join(" ");

          if (!isRelativePath(path)) {
            return item.trim();
          }

          const absolutePath = getRootURL(path);

          return descriptor
            ? `${absolutePath} ${descriptor}`
            : absolutePath;
        })
        .join(", ");

      element.setAttribute(
        "srcset",
        convertedSrcset
      );
    });
  }


  /* =========================================================
     INCLUDE HTML
  ========================================================= */

  async function includeHTML(selector, path) {
    const target = document.querySelector(selector);

    if (!target) {
      return;
    }

    const url = getRootURL(path);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `${url} 파일을 불러오지 못했습니다. (${response.status})`
      );
    }

    target.innerHTML = await response.text();


    /*
      header / footer / quick-menu 내부의

      img/...
      js/...
      페이지링크...

      등의 상대경로를 프로젝트 루트 기준으로 변경
    */
    resolveIncludedPaths(target);

    /* WebP 미지원 : 새로 삽입된 공통 영역 이미지도 PNG 로 */
    swapImages(target);
  }


  /* =========================================================
     QUICK MENU
  ========================================================= */

  function initQuickMenu() {
    const quickMenu = document.querySelector(".quick-menu");

    if (!quickMenu) {
      return;
    }

    const toggleButton = quickMenu.querySelector(
      ".quick-menu-toggle"
    );

    const toggleText = quickMenu.querySelector(
      ".quick-menu-toggle-text"
    );

    if (!toggleButton) {
      return;
    }

    toggleButton.addEventListener(
      "click",
      function () {
        const isCollapsed = quickMenu.classList.toggle(
          "is-collapsed"
        );

        toggleButton.setAttribute(
          "aria-expanded",
          String(!isCollapsed)
        );

        if (toggleText) {
          toggleText.textContent = isCollapsed
            ? "펼치기"
            : "접기";
        }
      }
    );
  }


  /* =========================================================
     고정 헤더 높이 동기화
     화면 폭마다 헤더 높이가 달라 실제 높이를 --header-h 로 지정
  ========================================================= */

  function syncHeaderHeight() {
    const header = document.querySelector(".header");

    if (!header) {
      return;
    }

    const topBar = document.querySelector(".top-bar");

    function update() {
      document.documentElement.style.setProperty(
        "--header-h",
        (header.offsetHeight + (topBar ? topBar.offsetHeight : 0)) + "px"
      );
    }

    update();

    if (window.ResizeObserver) {
      new ResizeObserver(update).observe(header);
    } else {
      window.addEventListener("resize", update);
    }
  }


  /* =========================================================
     본문 바로가기 (서브 페이지)
     LNB·탭을 건너뛰고 본문 영역(.sub-content__main)으로 이동 + 포커스
  ========================================================= */

  function initSubSkipLink() {
    const skipLink = document.querySelector(".skip-link");
    const target = document.querySelector(".sub-content__main");

    if (!skipLink || !target) {
      return;
    }

    if (!target.id) {
      target.id = "sub-content-main";
    }

    target.setAttribute("tabindex", "-1");
    skipLink.setAttribute("href", "#" + target.id);

    skipLink.addEventListener("click", function (event) {
      event.preventDefault();
      target.focus({ preventScroll: true });
      target.scrollIntoView();
    });
  }


  /* =========================================================
     COMMON SCRIPT
  ========================================================= */

  function loadCommonScript() {
    const headerScript = document.createElement("script");

    headerScript.src = getRootURL(
      "js/header.js"
    );

    headerScript.onload = function () {
      const mainScript = document.createElement("script");

      mainScript.src = getRootURL(
        "js/main.js"
      );

      document.body.appendChild(
        mainScript
      );
    };

    document.body.appendChild(
      headerScript
    );
  }


  /* =========================================================
     COMMON INCLUDE
  ========================================================= */

  async function initCommon() {
    try {

      await includeHTML(
        "#include-header",
        "common/header.html"
      );

      /* 퀵메뉴는 선택 영역 : 파일이 없어도 나머지 공통 영역은 계속 불러옴 */
      try {
        await includeHTML(
          "#include-quick-menu",
          "common/quick-menu.html"
        );
      } catch (error) {
        console.warn(error.message);
      }

      await includeHTML(
        "#include-footer",
        "common/footer.html"
      );


      /* 샘플 요청 레이어 : 여는 버튼([data-sample-open]) 이 있는 페이지만 body 끝에 삽입 */
      if (document.querySelector("[data-sample-open]")) {
        const sampleHolder = document.createElement("div");

        sampleHolder.id = "include-sample-request";
        document.body.appendChild(sampleHolder);

        await includeHTML(
          "#include-sample-request",
          "common/sample-request.html"
        );
      }


      /* 퀵메뉴 HTML 생성 이후 실행 */
      initQuickMenu();


      /* 고정 헤더 실제 높이 → CSS 변수 --header-h (상단 고정 탭 위치 기준) */
      syncHeaderHeight();


      /* 서브 페이지 : 본문 바로가기 → .sub-content__main */
      initSubSkipLink();


      /* header.js / main.js 실행 */
      loadCommonScript();

    } catch (error) {

      console.error(
        "공통 영역을 불러오는 중 오류가 발생했습니다.",
        error
      );

    }
  }


  /* =========================================================
     맨 위로 이동 (.top-btn)

     서브 페이지는 main.js 가 DOMContentLoaded 이후에 로드되어
     main.js 의 클릭 이벤트가 연결되지 않으므로 여기서 처리
  ========================================================= */

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".top-btn")) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  });


  initCommon();

})();