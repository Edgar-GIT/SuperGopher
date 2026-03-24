(function () {
    const GAMEPAD_COOKIE_NAME = "a17132_arcade_p1";
    const GAMEPAD_SKIP_SESSION_KEY = "a17132_skip_arcade_overlay";
    const GAMEPAD_INPUT_DEADZONE = 0.55;
    const ARCADE_EXIT_HREF = "https://www1.cic.pt/~usr21/25-26/expocic26";
    const REQUIRED_ACTIONS = ["up", "left", "right", "run", "select", "click", "back", "menu"];
    const GAMEPAD_CALIBRATION_STEPS = [
        { action: "up", prompt: "P1: press up" },
        { action: "left", prompt: "P1: press left" },
        { action: "right", prompt: "P1: press right" },
        { action: "run", prompt: "P1: press run" },
        { action: "select", prompt: "P1: press select" },
        { action: "click", prompt: "P1: press click" },
        { action: "back", prompt: "P1: press return" },
        { action: "menu", prompt: "P1: press menu" }
    ];

    let calibrationState = null;

    function InjectArcadeStyles() {
        if (document.getElementById("arcade_ui_styles")) return;

        const style = document.createElement("style");
        style.id = "arcade_ui_styles";
        style.textContent = `
            @keyframes arcadeSelectedFloat {
                from {
                    transform: translateY(0) scale(1);
                }
                to {
                    transform: translateY(-6px) scale(1.03);
                }
            }
            .arcade-ui-selected,
            .arcade-ui-selected:focus,
            .arcade-ui-selected:focus-visible,
            .arcade-ui-selected:hover,
            .arcade-ui-selected:active {
                position: relative !important;
                z-index: 6 !important;
                outline: none !important;
                border: 2px solid #d8a531 !important;
                box-shadow: 0 0 0 4px rgba(255, 216, 77, 0.98), 0 0 0 7px rgba(92, 58, 33, 0.26), 0 12px 26px rgba(0, 0, 0, 0.22) !important;
                text-decoration: none !important;
                animation: arcadeSelectedFloat 0.72s ease-in-out infinite alternate !important;
                transform: translateY(-6px) scale(1.03) !important;
                filter: brightness(1.06) saturate(1.08) !important;
            }
            .arcade-control-overlay {
                position: fixed;
                inset: 0;
                z-index: 100500;
                display: none;
                align-items: center;
                justify-content: center;
                background: rgba(10, 16, 24, 0.48);
                backdrop-filter: blur(5px);
            }
            .arcade-control-overlay.show {
                display: flex;
            }
            .arcade-control-box {
                width: min(92vw, 540px);
                background: linear-gradient(180deg, rgba(255, 250, 221, 0.99), rgba(247, 233, 154, 0.97));
                border: 3px solid #d8a531;
                border-radius: 18px;
                padding: 24px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
                text-align: center;
            }
            .arcade-control-title {
                color: #214d47;
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            .arcade-control-subtitle {
                color: #55736d;
                font-size: 15px;
                line-height: 1.4;
                margin-bottom: 18px;
            }
            .arcade-control-prompt {
                color: #5c3a21;
                background: linear-gradient(180deg, #fff1a8, #f3d64f);
                border: 3px solid #d8a531;
                border-radius: 14px;
                padding: 18px 20px;
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 12px;
            }
            .arcade-control-hint {
                min-height: 24px;
                color: #214d47;
                font-size: 14px;
                font-weight: 700;
            }
        `;

        document.head.appendChild(style);
    }

    function EnsureCalibrationOverlay() {
        InjectArcadeStyles();

        let overlay = document.getElementById("arcade_control_overlay");
        if (overlay) return overlay;

        overlay = document.createElement("div");
        overlay.id = "arcade_control_overlay";
        overlay.className = "arcade-control-overlay";
        overlay.innerHTML = `
            <div class="arcade-control-box">
                <div class="arcade-control-title">Calibração do P1</div>
                <div class="arcade-control-subtitle">Sem cookies encontrados. Mexe no joystick da arcade e carrega no botão pedido para configurar este browser. Se quiseres usar rato/teclado, clica fora desta caixa.</div>
                <div id="arcade_control_prompt" class="arcade-control-prompt">P1: press up</div>
                <div id="arcade_control_hint" class="arcade-control-hint"></div>
            </div>
        `;

        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) {
                SkipCalibrationForSession();
                FinishCalibration();
            }
        });

        document.body.appendChild(overlay);
        return overlay;
    }

    function ShouldSkipCalibration() {
        try {
            return sessionStorage.getItem(GAMEPAD_SKIP_SESSION_KEY) === "1";
        } catch {
            return false;
        }
    }

    function SkipCalibrationForSession() {
        try {
            sessionStorage.setItem(GAMEPAD_SKIP_SESSION_KEY, "1");
        } catch {
        }
    }

    function ClearCalibrationSkip() {
        try {
            sessionStorage.removeItem(GAMEPAD_SKIP_SESSION_KEY);
        } catch {
        }
    }

    function ReadCookie(name) {
        const cookie = document.cookie
            .split("; ")
            .find(row => row.startsWith(name + "="));
        return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
    }

    function SaveCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }

    function IsValidBindings(bindings) {
        if (!bindings || typeof bindings !== "object") return false;
        return REQUIRED_ACTIONS.every(function (action) {
            return !!bindings[action];
        });
    }

    function LoadBindings() {
        const raw = ReadCookie(GAMEPAD_COOKIE_NAME);
        if (!raw) return null;

        try {
            const parsed = JSON.parse(raw);
            if (!IsValidBindings(parsed)) return null;
            window.arcadeGamepadBindings = parsed;
            return parsed;
        } catch {
            return null;
        }
    }

    function SaveBindings(bindings) {
        if (!IsValidBindings(bindings)) return;
        window.arcadeGamepadBindings = bindings;
        ClearCalibrationSkip();
        SaveCookie(GAMEPAD_COOKIE_NAME, JSON.stringify(bindings), 365);
    }

    function BindingKey(binding) {
        return binding.type + ":" + binding.index + ":" + (binding.sign || 0);
    }

    function FormatBinding(binding) {
        if (!binding) return "";
        if (binding.type === "axis") {
            if (binding.index === 0 && binding.sign < 0) return "Left";
            if (binding.index === 0 && binding.sign > 0) return "Right";
            if (binding.index === 1 && binding.sign < 0) return "Up";
            if (binding.index === 1 && binding.sign > 0) return "Down";
            return "Axis " + binding.index;
        }
        return "Button " + binding.index;
    }

    function UpdateCalibrationPrompt(message) {
        const prompt = document.getElementById("arcade_control_prompt");
        const hint = document.getElementById("arcade_control_hint");
        const step = GAMEPAD_CALIBRATION_STEPS[calibrationState ? calibrationState.stepIndex : 0];

        if (prompt && step) {
            prompt.textContent = step.prompt;
        }
        if (hint) {
            hint.textContent = message || "";
        }
    }

    function ReadCalibrationInput(action) {
        if (!navigator.getGamepads) return null;

        const gamepads = navigator.getGamepads();
        if (!gamepads) return null;

        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad) continue;

            if (action !== "run" && action !== "select" && action !== "click" && action !== "back" && action !== "menu" && gamepad.axes) {
                for (let axisIndex = 0; axisIndex < gamepad.axes.length; axisIndex++) {
                    const value = gamepad.axes[axisIndex];
                    if (value <= -GAMEPAD_INPUT_DEADZONE) {
                        return { type: "axis", index: axisIndex, sign: -1 };
                    }
                    if (value >= GAMEPAD_INPUT_DEADZONE) {
                        return { type: "axis", index: axisIndex, sign: 1 };
                    }
                }
            }

            if (gamepad.buttons) {
                for (let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++) {
                    const button = gamepad.buttons[buttonIndex];
                    if (button && (button.pressed || button.value > 0.5)) {
                        return { type: "button", index: buttonIndex };
                    }
                }
            }
        }

        return null;
    }

    function StartCalibration() {
        if (calibrationState) return;
        if (LoadBindings()) return;
        if (ShouldSkipCalibration()) return;

        const overlay = EnsureCalibrationOverlay();
        calibrationState = {
            bindings: {},
            stepIndex: 0,
            waitingNeutral: false
        };
        overlay.classList.add("show");
        UpdateCalibrationPrompt("Liga o joystick da arcade e faz o movimento pedido.");
    }

    function FinishCalibration() {
        const overlay = document.getElementById("arcade_control_overlay");
        if (overlay) {
            overlay.classList.remove("show");
        }
        calibrationState = null;
    }

    function UpdateCalibration() {
        if (!calibrationState) return;

        const step = GAMEPAD_CALIBRATION_STEPS[calibrationState.stepIndex];
        if (!step) return;

        const input = ReadCalibrationInput(step.action);

        if (!input) {
            if (calibrationState.waitingNeutral) {
                calibrationState.waitingNeutral = false;
                UpdateCalibrationPrompt("");
            }
            return;
        }

        if (calibrationState.waitingNeutral) {
            return;
        }

        const inputKey = BindingKey(input);
        const existingKeys = Object.values(calibrationState.bindings).map(BindingKey);

        if (existingKeys.includes(inputKey)) {
            calibrationState.waitingNeutral = true;
            UpdateCalibrationPrompt("Esse movimento já foi usado. Larga o joystick e escolhe outro.");
            return;
        }

        calibrationState.bindings[step.action] = input;
        calibrationState.stepIndex++;
        calibrationState.waitingNeutral = true;

        if (calibrationState.stepIndex >= GAMEPAD_CALIBRATION_STEPS.length) {
            SaveBindings(calibrationState.bindings);
            UpdateCalibrationPrompt("Controlos guardados.");
            setTimeout(FinishCalibration, 220);
            return;
        }

        UpdateCalibrationPrompt("Guardado: " + FormatBinding(input));
    }

    function ButtonPressed(gamepad, index) {
        if (!gamepad || !gamepad.buttons || !gamepad.buttons[index]) return false;
        const button = gamepad.buttons[index];
        return !!(button.pressed || button.value > 0.5);
    }

    function BindingActive(gamepad, binding) {
        if (!gamepad || !binding) return false;

        if (binding.type === "button") {
            return ButtonPressed(gamepad, binding.index);
        }

        if (binding.type === "axis") {
            const axisValue = gamepad.axes && gamepad.axes.length > binding.index ? gamepad.axes[binding.index] : 0;
            if (binding.sign < 0) return axisValue <= -GAMEPAD_INPUT_DEADZONE;
            if (binding.sign > 0) return axisValue >= GAMEPAD_INPUT_DEADZONE;
        }

        return false;
    }

    function ReadActions() {
        const actions = {
            up: false,
            left: false,
            right: false,
            run: false,
            select: false,
            click: false,
            back: false,
            menu: false
        };

        const bindings = window.arcadeGamepadBindings || LoadBindings();
        if (!bindings || !navigator.getGamepads) return actions;

        const gamepads = navigator.getGamepads();
        if (!gamepads) return actions;

        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad) continue;

            REQUIRED_ACTIONS.forEach(function (action) {
                if (BindingActive(gamepad, bindings[action])) {
                    actions[action] = true;
                }
            });
        }

        return actions;
    }

    function SetSelectedElement(element, active) {
        if (!element) return;
        element.classList.toggle("arcade-ui-selected", active);
        if (active && typeof element.focus === "function") {
            element.focus({ preventScroll: true });
        } else if (!active && document.activeElement === element && typeof element.blur === "function") {
            element.blur();
        }
    }

    function GetMainMenuHref() {
        const path = (window.location.pathname || "").toLowerCase();
        if (path.includes("/db/") || path.includes("/maingamescripts/")) {
            return "../index.php";
        }
        return "index.php";
    }

    function GoToMainMenu() {
        window.location.href = GetMainMenuHref();
    }

    function GoToArcadeExit() {
        window.location.href = ARCADE_EXIT_HREF;
    }

    function IsTypingElement(element) {
        if (!element) return false;
        const tag = (element.tagName || "").toLowerCase();
        if (tag === "textarea" || tag === "select") return true;
        if (tag === "input") {
            const type = (element.type || "text").toLowerCase();
            return type !== "hidden" && type !== "button" && type !== "submit" && type !== "reset" && type !== "checkbox" && type !== "radio";
        }
        return !!element.isContentEditable;
    }

    function SetupLinearNavigation(config) {
        InjectArcadeStyles();
        let currentIndex = typeof config.startIndex === "number" ? config.startIndex : 0;
        let lastItems = [];
        let previousActions = {
            left: false,
            right: false,
            select: false,
            click: false,
            back: false,
            menu: false
        };

        function GetItems() {
            const items = typeof config.getItems === "function" ? config.getItems() : config.items;
            return (items || []).filter(Boolean);
        }

        function ApplySelection(items) {
            lastItems.forEach(function (item) {
                if (item && !items.includes(item)) {
                    item.classList.remove("arcade-ui-selected");
                    if (document.activeElement === item && typeof item.blur === "function") {
                        item.blur();
                    }
                }
            });
            lastItems = items.slice();

            if (!items.length) return;
            if (currentIndex >= items.length) currentIndex = 0;
            const typing = IsTypingElement(document.activeElement);
            items.forEach(function (item, index) {
                const active = index === currentIndex;
                item.classList.toggle("arcade-ui-selected", active);
                if (!typing && document.activeElement === item && typeof item.blur === "function") {
                    item.blur();
                }
            });
        }

        function Loop() {
            if (!window.arcadeGamepadBindings) {
                LoadBindings();
            }

            if (!window.arcadeGamepadBindings && !ShouldSkipCalibration()) {
                StartCalibration();
            }

            if (calibrationState) {
                UpdateCalibration();
                requestAnimationFrame(Loop);
                return;
            }

            const items = GetItems();
            ApplySelection(items);

            const actions = ReadActions();

            if (actions.left && !previousActions.left && items.length > 1) {
                currentIndex = (currentIndex - 1 + items.length) % items.length;
                ApplySelection(items);
            }

            if (actions.right && !previousActions.right && items.length > 1) {
                currentIndex = (currentIndex + 1) % items.length;
                ApplySelection(items);
            }

            const activatePressed = (actions.select && !previousActions.select) || (actions.click && !previousActions.click);
            if (activatePressed) {
                const current = items[currentIndex];
                if (current) {
                    if (typeof config.onSelect === "function") {
                        config.onSelect(current, currentIndex);
                    } else {
                        current.click();
                    }
                }
            }

            if (actions.back && !previousActions.back && typeof config.onBack === "function") {
                config.onBack();
            }

            if (actions.menu && !previousActions.menu) {
                if (typeof config.onMenu === "function") {
                    config.onMenu();
                } else {
                    GoToArcadeExit();
                }
            }

            previousActions = actions;
            requestAnimationFrame(Loop);
        }

        requestAnimationFrame(Loop);
    }

    window.ArcadeUI = {
        cookieName: GAMEPAD_COOKIE_NAME,
        ensureBindings: StartCalibration,
        loadBindings: LoadBindings,
        readActions: ReadActions,
        setupLinearNavigation: SetupLinearNavigation,
        bindingActive: BindingActive,
        skipCalibrationForSession: SkipCalibrationForSession
    };
})();
