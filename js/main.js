(function () {
  "use strict";

  /* =========================================================
     공통 : 커스텀 셀렉트 (.c-select[data-select])
     - 원본 select 는 숨겨 두고 버튼 + listbox 로 대체
     - 선택 시 원본 select 값 변경 + change 이벤트 발생 (form 전송 그대로)
     - 키보드 : ↑↓ 이동 / Enter·Space 선택 / Home·End / Esc·Tab 닫기
  ========================================================= */

  let selectId = 0;

  function initCustomSelect(wrap) {
    const select = wrap.querySelector("select");

    if (!select || wrap.classList.contains("is-ready")) {
      return;
    }

    const id = "c-select-" + (++selectId);
    const label = select.getAttribute("aria-label") || "";
    const button = document.createElement("button");
    const value = document.createElement("span");
    const list = document.createElement("ul");
    let focusIndex = -1;

    button.type = "button";
    button.className = "c-select__btn";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", id);
    value.className = "c-select__value";
    button.appendChild(value);

    list.className = "c-select__list";
    list.id = id;
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", label);
    list.tabIndex = -1;

    const options = Array.from(select.options).map(function (option, index) {
      const item = document.createElement("li");

      item.className = "c-select__option";
      item.id = id + "-" + index;
      item.setAttribute("role", "option");
      item.textContent = option.textContent;

      item.addEventListener("click", function () {
        choose(index);
        close(true);
      });

      item.addEventListener("mousemove", function () {
        setFocus(index);
      });

      list.appendChild(item);
      return item;
    });

    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    wrap.appendChild(button);
    wrap.appendChild(list);
    wrap.classList.add("is-ready");

    function render() {
      const current = select.selectedIndex;

      value.textContent = select.options[current] ? select.options[current].textContent : "";
      button.setAttribute("aria-label", label ? label + " : " + value.textContent : value.textContent);

      options.forEach(function (item, index) {
        item.setAttribute("aria-selected", String(index === current));
      });
    }

    function setFocus(index) {
      focusIndex = Math.min(Math.max(index, 0), options.length - 1);

      options.forEach(function (item, i) {
        item.classList.toggle("is-focus", i === focusIndex);
      });

      list.setAttribute("aria-activedescendant", options[focusIndex].id);
      options[focusIndex].scrollIntoView({ block: "nearest" });
    }

    function choose(index) {
      if (select.selectedIndex !== index) {
        select.selectedIndex = index;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }

      render();
    }

    function open() {
      document.querySelectorAll(".c-select.is-open").forEach(function (other) {
        if (other !== wrap) {
          other.dispatchEvent(new CustomEvent("c-select:close"));
        }
      });

      wrap.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      setFocus(select.selectedIndex);
      list.focus({ preventScroll: true });
    }

    function close(returnFocus) {
      if (!wrap.classList.contains("is-open")) {
        return;
      }

      wrap.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");

      if (returnFocus) {
        button.focus();
      }
    }

    button.addEventListener("click", function () {
      if (wrap.classList.contains("is-open")) {
        close(true);
      } else {
        open();
      }
    });

    button.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        open();
      }
    });

    list.addEventListener("keydown", function (event) {
      switch (event.key) {
        case "ArrowDown":
          setFocus(focusIndex + 1);
          break;
        case "ArrowUp":
          setFocus(focusIndex - 1);
          break;
        case "Home":
          setFocus(0);
          break;
        case "End":
          setFocus(options.length - 1);
          break;
        case "Enter":
        case " ":
          choose(focusIndex);
          close(true);
          break;
        case "Escape":
          close(true);
          break;
        case "Tab":
          close(false);
          return;
        default:
          return;
      }

      event.preventDefault();
    });

    wrap.addEventListener("c-select:close", function () {
      close(false);
    });

    document.addEventListener("click", function (event) {
      if (!wrap.contains(event.target)) {
        close(false);
      }
    });

    /* form reset · 스크립트로 값 변경 시에도 표시 갱신 */
    select.addEventListener("change", render);
    if (select.form) {
      select.form.addEventListener("reset", function () {
        setTimeout(render);
      });
    }

    render();
  }

  document.querySelectorAll("[data-select]").forEach(initCustomSelect);


  /* =========================================================
     공통 : 샘플 요청 레이어 (common/sample-request.html)
     - [data-sample-open] 클릭 → 열기 / 닫기 버튼 · 배경 · ESC → 닫기
     - 열려 있는 동안 본문 스크롤 잠금 + Tab 포커스 레이어 안에서 순환
     - 제출 시 필수 항목 · 이메일 형식 · 개인정보 동의 확인
  ========================================================= */

  function initSampleModal() {
    const modal = document.querySelector(".sample-modal");

    if (!modal) {
      return;
    }

    const layer = modal.querySelector(".sample-modal__layer");
    const body = modal.querySelector(".sample-modal__body");
    const form = modal.querySelector(".sample-form");
    const msg = form.querySelector(".sample-form__msg");
    const fileInput = form.querySelector(".sample-form__file-input");
    const fileName = form.querySelector(".sample-form__file-name");
    let opener = null;

    function getFocusable() {
      return Array.prototype.filter.call(
        layer.querySelectorAll("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])"),
        function (el) {
          return !el.disabled && el.getAttribute("aria-hidden") !== "true" && el.tabIndex !== -1 && el.offsetParent !== null;
        }
      );
    }

    function open(trigger) {
      opener = trigger;

      /* 헤더 메뉴(Sample Request)에서 연 경우 : 메뉴를 닫고, 닫힐 때 포커스는 메뉴 버튼(모바일) · 로고(PC) 로 */
      const header = trigger.closest(".header");

      if (header) {
        const menuBtn = header.querySelector(".header__menu-btn");

        if (header.classList.contains("is-menu-open")) {
          menuBtn.click();
          opener = menuBtn;
        } else {
          header.dispatchEvent(new MouseEvent("mouseleave"));
          opener = header.querySelector(".header__logo a");
        }
      }

      modal.hidden = false;
      body.scrollTop = 0;
      document.documentElement.classList.add("is-modal-lock");
      layer.focus();
    }

    function close() {
      modal.hidden = true;
      document.documentElement.classList.remove("is-modal-lock");

      if (opener) {
        opener.focus();
      }
    }

    document.querySelectorAll("[data-sample-open]").forEach(function (trigger) {
      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        open(trigger);
      });
    });

    modal.querySelectorAll("[data-sample-close]").forEach(function (el) {
      el.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (event) {
      if (modal.hidden || event.defaultPrevented) {
        return;
      }

      if (event.key === "Escape") {
        close();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && (document.activeElement === first || document.activeElement === layer)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    /* 파일첨부 : 선택한 파일명 표시 */
    fileInput.addEventListener("change", function () {
      fileName.textContent = fileInput.files.length ? fileInput.files[0].name : "";
    });

    /* 입력하면 오류 표시 해제 */
    form.addEventListener("input", function (event) {
      event.target.classList.remove("is-error");
    });

    form.addEventListener("change", function (event) {
      event.target.classList.remove("is-error");
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const invalid = Array.prototype.filter.call(form.querySelectorAll("[required]"), function (el) {
        const bad = !el.checkValidity();

        el.classList.toggle("is-error", bad);
        return bad;
      });

      if (invalid.length) {
        const target = invalid[0];

        if (target.type === "checkbox") {
          msg.textContent = "개인정보 수집 및 이용에 동의해 주세요.";
        } else if (target.type === "email" && target.value) {
          msg.textContent = "이메일 형식을 확인해 주세요.";
        } else {
          msg.textContent = "필수 항목(*)을 모두 입력해 주세요.";
        }

        target.focus();
        return;
      }

      msg.textContent = "";
      alert("샘플 요청이 접수되었습니다. 확인 후 담당자가 연락드리겠습니다.");
      form.reset();
      fileName.textContent = "";
      close();
    });
  }

  initSampleModal();

})();
