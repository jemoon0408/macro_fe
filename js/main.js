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

})();
