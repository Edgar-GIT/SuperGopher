window.onload = function () {
    const mainMenuMusic = document.getElementById("MainMenuMusic");
    if (mainMenuMusic) mainMenuMusic.play();

    const mainMenuElem = document.getElementById("mainMenuImage");
    if (mainMenuElem) mainMenuElem.style.display = "block";

    const adminBtn = document.getElementById("AdminButton");
    const adminOverlay = document.getElementById("admin_modal_overlay");
    const adminForm = document.getElementById("admin_login_form");
    const adminUser = document.getElementById("admin_user");
    const adminMsg = document.getElementById("admin_login_msg");

    if (adminBtn) adminBtn.addEventListener("click", AbrirAdminModal);

    if (adminOverlay) {
        adminOverlay.addEventListener("click", function (e) {
            if (e.target === adminOverlay) FecharAdminModal();
        });
    }

    if (adminForm) {
        adminForm.addEventListener("submit", function (e) {
            if (window.location.protocol !== "file:") return;
            e.preventDefault();
            if (adminMsg) {
                adminMsg.textContent = "Abre o projeto por http://localhost para o admin funcionar.";
            }
        });
    }

    if (adminOverlay && adminOverlay.classList.contains("show") && adminUser) {
        adminUser.focus();
    }

    if (window.ArcadeUI) {
        window.ArcadeUI.setupLinearNavigation({
            startIndex: 0,
            getItems: function () {
                const overlay = document.getElementById("admin_modal_overlay");
                const submitBtn = document.querySelector(".admin-submit-btn");

                if (overlay && overlay.classList.contains("show")) {
                    return submitBtn ? [submitBtn] : [];
                }

                return [
                    document.getElementById("Play"),
                    document.getElementById("Instructions"),
                    document.getElementById("Credits"),
                    document.getElementById("AdminButton")
                ].filter(Boolean);
            },
            onSelect: function (element) {
                if (!element) return;
                element.click();
            },
            onBack: function () {
                const overlay = document.getElementById("admin_modal_overlay");
                if (overlay && overlay.classList.contains("show")) {
                    FecharAdminModal();
                }
            }
        });
    }
};

function CleanStart() {
    const mainMenuMusic = document.getElementById("MainMenuMusic");
    const mainGameMusic = document.getElementById("MainGameMusic");

    if (mainMenuMusic) {
        mainMenuMusic.pause();
        mainMenuMusic.currentTime = 0;
    }
    if (mainGameMusic) {
        mainGameMusic.pause();
        mainGameMusic.currentTime = 0;
    }

    window.location.href = "./MainGameScripts/Game.html";
}

function AbrirAdminModal() {
    const overlay = document.getElementById("admin_modal_overlay");
    const user = document.getElementById("admin_user");
    const pass = document.getElementById("admin_password");
    const msg = document.getElementById("admin_login_msg");

    if (user) user.value = "";
    if (pass) pass.value = "";
    if (msg) msg.textContent = "";
    if (overlay) overlay.classList.add("show");
    if (user) user.focus();
}

function FecharAdminModal() {
    const overlay = document.getElementById("admin_modal_overlay");
    if (overlay) overlay.classList.remove("show");
}
