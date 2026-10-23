/* =========================================================
   Radio 공통 키보드 제어

   - 모든 radio를 Tab으로 순차 접근 가능
   - 같은 name 그룹 안에서는
     Tab → 다음 radio
     Shift + Tab → 이전 radio
   - 그룹의 마지막 radio에서 Tab
     → 브라우저 기본 동작으로 다음 input/button 이동
   - 그룹의 첫 radio에서 Shift + Tab
     → 브라우저 기본 동작으로 이전 요소 이동
   - Enter / Space → 현재 radio 선택
   - 방향키 이동 및 선택 유지
   - 키보드 포커스 상태 유지
   - Y 선택 후 연결 input 이동 기능 유지
========================================================= */
(function () {
    "use strict";

    function setKeyboardMode() {
        document.documentElement.classList.add("kbd-nav");
    }

    function initRadioKeyboard() {
        var radioInputs = document.querySelectorAll(
            '.radio__input[type="radio"]:not(:disabled)'
        );

        radioInputs.forEach(function (radio) {
            radio.setAttribute("tabindex", "0");
        });
    }

    function getEnabledRadios() {
        return Array.from(
            document.querySelectorAll(
                '.radio__input[type="radio"]:not(:disabled)'
            )
        );
    }

    function getSameGroup(currentRadio) {
        if (!currentRadio || !currentRadio.name) {
            return [];
        }

        return getEnabledRadios().filter(function (radio) {
            return radio.name === currentRadio.name;
        });
    }

    function getCheckedRadio(currentRadio) {
        if (!currentRadio || !currentRadio.name) {
            return null;
        }

        var sameGroup = getSameGroup(currentRadio);

        return sameGroup.find(function (radio) {
            return radio.checked;
        }) || null;
    }

    function selectRadio(radio) {
        if (!radio) {
            return;
        }

        /*
         * click() 사용하지 않음
         * → 키보드 포커스 모드가 마우스 모드로 바뀌는 것 방지
         */
        radio.checked = true;

        radio.dispatchEvent(
            new Event("input", {
                bubbles: true
            })
        );

        radio.dispatchEvent(
            new Event("change", {
                bubbles: true
            })
        );
    }

    function getLinkedInputField(currentRadio) {
        var checkedRadio = getCheckedRadio(currentRadio);

        if (!checkedRadio) {
            return null;
        }

        if (checkedRadio.value !== "Y") {
            return null;
        }

        if (!checkedRadio.id) {
            return null;
        }

        var match = checkedRadio.id.match(
            /^qstnAnsYn(\d+)_Y$/
        );

        if (!match) {
            return null;
        }

        var questionNo = match[1];

        var contentArea = document.getElementById(
            "ctntDiv" + questionNo
        );

        if (!contentArea) {
            return null;
        }

        var contentStyle = window.getComputedStyle(
            contentArea
        );

        if (
            contentStyle.display === "none" ||
            contentStyle.visibility === "hidden"
        ) {
            return null;
        }

        if (contentArea.getClientRects().length === 0) {
            return null;
        }

        var inputField = contentArea.querySelector(
            'textarea:not(:disabled):not([tabindex="-1"]), ' +
            'input:not([type="hidden"]):not(:disabled):not([tabindex="-1"]), ' +
            'select:not(:disabled):not([tabindex="-1"]), ' +
            'button:not(:disabled):not([tabindex="-1"]), ' +
            'a[href]:not([tabindex="-1"])'
        );

        if (!inputField) {
            return null;
        }

        var inputStyle = window.getComputedStyle(
            inputField
        );

        if (
            inputStyle.display === "none" ||
            inputStyle.visibility === "hidden"
        ) {
            return null;
        }

        if (inputField.getClientRects().length === 0) {
            return null;
        }

        return inputField;
    }

    document.addEventListener("keydown", function (e) {
        /*
         * 키보드 입력이 발생하면
         * 전역 키보드 포커스 모드 유지
         */
        if (
            e.key === "Tab" ||
            e.key === "Enter" ||
            e.key === " " ||
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight" ||
            e.key === "ArrowUp" ||
            e.key === "ArrowDown"
        ) {
            setKeyboardMode();
        }

        var currentRadio = e.target;

        if (
            !currentRadio.matches ||
            !currentRadio.matches(
                '.radio__input[type="radio"]:not(:disabled)'
            )
        ) {
            return;
        }

        var sameGroup = getSameGroup(
            currentRadio
        );

        var currentIndex = sameGroup.indexOf(
            currentRadio
        );

        /* ========================================
           Enter / Space
        ======================================== */

        if (
            e.key === "Enter" ||
            e.key === " "
        ) {
            e.preventDefault();

            selectRadio(
                currentRadio
            );

            currentRadio.focus();

            return;
        }

        /* ========================================
           Tab
        ======================================== */

        if (
            e.key === "Tab" &&
            !e.shiftKey
        ) {
            if (
                currentIndex !== -1 &&
                currentIndex < sameGroup.length - 1
            ) {
                e.preventDefault();

                sameGroup[
                    currentIndex + 1
                ].focus();

                return;
            }

            var linkedInput = getLinkedInputField(
                currentRadio
            );

            if (linkedInput) {
                e.preventDefault();

                linkedInput.focus();

                return;
            }

            return;
        }

        /* ========================================
           Shift + Tab
        ======================================== */

        if (
            e.key === "Tab" &&
            e.shiftKey
        ) {
            if (currentIndex > 0) {
                e.preventDefault();

                sameGroup[
                    currentIndex - 1
                ].focus();

                return;
            }

            return;
        }

        /* ========================================
           방향키
        ======================================== */

        if (
            e.key !== "ArrowLeft" &&
            e.key !== "ArrowRight" &&
            e.key !== "ArrowUp" &&
            e.key !== "ArrowDown"
        ) {
            return;
        }

        if (
            currentIndex === -1 ||
            sameGroup.length <= 1
        ) {
            return;
        }

        e.preventDefault();

        var nextIndex;

        if (
            e.key === "ArrowLeft" ||
            e.key === "ArrowUp"
        ) {
            nextIndex =
                currentIndex - 1;

            if (nextIndex < 0) {
                nextIndex =
                    sameGroup.length - 1;
            }
        }

        if (
            e.key === "ArrowRight" ||
            e.key === "ArrowDown"
        ) {
            nextIndex =
                currentIndex + 1;

            if (
                nextIndex >=
                sameGroup.length
            ) {
                nextIndex = 0;
            }
        }

        var nextRadio =
            sameGroup[nextIndex];

        if (!nextRadio) {
            return;
        }

        selectRadio(
            nextRadio
        );

        nextRadio.focus();
    });

    function initializeRadioKeyboard() {
        initRadioKeyboard();
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeRadioKeyboard
        );
    } else {
        initializeRadioKeyboard();
    }

    window.refreshRadioKeyboard =
        function () {
            initRadioKeyboard();
        };

})();