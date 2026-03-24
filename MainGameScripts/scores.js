var score = 0; //pontuaçao do jogador

var BausAbertos = 0;    
var numBaus = 1;    

var MoedasApanhadas = 0; //moedas apanhadas pelo jogador
var numMoedas = 0;     

var AudioPath = "../src/music/";
var numMoedas = 0;
var MoedasApanhadas = 0;
var BausAbertos = 0;


var powerUpSpawnTimes = {}; //guarda os tempos de spawn dos power-ups por posiçao
const CooldownPoderes = 2000; //2 segundos antes de poder apanhar um poder

//contar moedas no mapa
for (let i = 0; i < mapa1_layer2.length; i++) {
    for (let j = 0; j < mapa1_layer2[i].length; j++) {
        if (mapa1_layer2[i][j] === "M") {
            numMoedas++;
        }
    }
}

const TiposDePontos = {
    MOEDA : 10,
    BAU : 100,
    LUCKY_BLOCK : 50
};

const vitoriaSound = new Audio(AudioPath + "vitoria.mp3");
const sigmaMusic = new Audio(AudioPath + "sigma.mp3");
const SomMoeda = new Audio(AudioPath + "moeda.mp3");
let GameNoticeTimeout = null;

function MostrarAvisoTemporario(texto, duracao = 1800) {
    let notice = document.getElementById("game_notice");

    if (!notice) {
        notice = document.createElement("div");
        notice.id = "game_notice";
        document.body.appendChild(notice);
    }

    notice.textContent = texto;
    notice.classList.add("show");

    if (GameNoticeTimeout) {
        clearTimeout(GameNoticeTimeout);
    }

    GameNoticeTimeout = setTimeout(function () {
        notice.classList.remove("show");
    }, duracao);
}

window.MostrarAvisoTemporario = MostrarAvisoTemporario;

function formatarTempo(segundos) {
    const m = String(Math.floor(segundos / 60)).padStart(2, "0");
    const s = String(segundos % 60).padStart(2, "0");
    return m + ":" + s;
}

function estaEmFileProtocol() {
    return window.location.protocol === "file:";
}

function obterMsgSemServidor() {
    return "Isto não funciona em file://. Abre o projeto num servidor local (ex: http://localhost).";
}

function obterStats() {
    const tempo = typeof window.gameElapsedSeconds === "number"
        ? window.gameElapsedSeconds
        : Math.floor((Date.now() - (window.gameStartTime || Date.now())) / 1000);
    const vidas = (typeof window.GetLivesLost === "function") ? window.GetLivesLost() : 0;
    return {
        score: typeof score === "number" ? score : 0,
        time: tempo,
        lives_lost: vidas
    };
}

function adicionarCampoHidden(form, nome, valor) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = nome;
    input.value = valor;
    form.appendChild(input);
}

function prepararCamposStats(form, stats) {
    adicionarCampoHidden(form, "score", stats.score);
    adicionarCampoHidden(form, "time", stats.time);
    adicionarCampoHidden(form, "lives_lost", stats.lives_lost);
}

function montarWinUI(overlay) {
    const stats = obterStats();
    let panel = overlay.querySelector(".win-panel");
    const existingModal = overlay.querySelector(".win-modal-backdrop");

    if (existingModal) {
        existingModal.remove();
    }

    if (!panel) {
        panel = document.createElement("div");
        panel.className = "win-panel";
        overlay.appendChild(panel);
    }
    panel.innerHTML = "";

    const actions = document.createElement("div");
    actions.className = "win-actions";

    const panelMsg = document.createElement("div");
    panelMsg.className = "win-panel-msg";

    const guestForm = document.createElement("form");
    guestForm.className = "win-action-form";
    guestForm.method = "post";
    guestForm.action = "../db/save_guest.php";
    prepararCamposStats(guestForm, stats);

    const btnGuest = document.createElement("button");
    btnGuest.type = "submit";
    btnGuest.className = "win-btn win-btn-panel";
    btnGuest.textContent = "Sair e guardar como Guest";

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.className = "win-btn win-btn-panel";
    btnSave.textContent = "Guardar estatísticas";

    guestForm.appendChild(btnGuest);
    actions.appendChild(guestForm);
    actions.appendChild(btnSave);
    panel.appendChild(actions);
    panel.appendChild(panelMsg);

    const modalBackdrop = document.createElement("div");
    modalBackdrop.className = "win-modal-backdrop";

    const form = document.createElement("form");
    form.className = "win-form";
    form.method = "post";
    prepararCamposStats(form, stats);

    const formTitle = document.createElement("div");
    formTitle.className = "win-form-title";
    formTitle.textContent = "Guardar estatísticas";

    const formSubtitle = document.createElement("div");
    formSubtitle.className = "win-form-subtitle";
    formSubtitle.textContent = "Podes criar conta ou fazer login para associar este resultado.";

    form.appendChild(formTitle);
    form.appendChild(formSubtitle);

    const preview = document.createElement("div");
    preview.className = "win-preview";
    preview.innerHTML = 
        "<div>Pontos: " + stats.score + "</div>" +
        "<div>Tempo: " + formatarTempo(stats.time) + "</div>" +
        "<div>Vidas perdidas: " + stats.lives_lost + "</div>";
    form.appendChild(preview);

    const inputNome = document.createElement("input");
    inputNome.type = "text";
    inputNome.name = "name";
    inputNome.placeholder = "Nome";
    inputNome.className = "win-input";

    const labelNome = document.createElement("label");
    labelNome.className = "win-field-label";
    labelNome.textContent = "Nome";
    labelNome.htmlFor = "win_save_name";
    inputNome.id = "win_save_name";
    inputNome.autocomplete = "username";

    const inputPass = document.createElement("input");
    inputPass.type = "password";
    inputPass.name = "password";
    inputPass.placeholder = "Password";
    inputPass.className = "win-input";

    const labelPass = document.createElement("label");
    labelPass.className = "win-field-label";
    labelPass.textContent = "Password";
    labelPass.htmlFor = "win_save_password";
    inputPass.id = "win_save_password";
    inputPass.autocomplete = "current-password";

    const btnRegister = document.createElement("button");
    btnRegister.type = "submit";
    btnRegister.formAction = "../db/register_save.php";
    btnRegister.className = "win-btn win-btn-form";
    btnRegister.textContent = "Guardar e criar conta";

    const btnLogin = document.createElement("button");
    btnLogin.type = "submit";
    btnLogin.formAction = "../db/login_save.php";
    btnLogin.className = "win-btn win-btn-form";
    btnLogin.textContent = "Login e guardar";

    const msg = document.createElement("div");
    msg.className = "win-msg";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "win-close-btn";
    closeBtn.textContent = "Fechar";

    const nomeGroup = document.createElement("div");
    nomeGroup.className = "win-field-group";
    nomeGroup.appendChild(labelNome);
    nomeGroup.appendChild(inputNome);

    const passGroup = document.createElement("div");
    passGroup.className = "win-field-group";
    passGroup.appendChild(labelPass);
    passGroup.appendChild(inputPass);

    form.appendChild(nomeGroup);
    form.appendChild(passGroup);
    form.appendChild(btnRegister);
    form.appendChild(btnLogin);
    form.appendChild(closeBtn);
    form.appendChild(msg);
    modalBackdrop.appendChild(form);
    overlay.appendChild(modalBackdrop);

    modalBackdrop.onclick = function(e) {
        if (e.target === modalBackdrop) {
            modalBackdrop.classList.remove("show");
        }
    };

    closeBtn.onclick = function() {
        modalBackdrop.classList.remove("show");
    };

    btnSave.onclick = function() {
        panelMsg.textContent = "";
        msg.textContent = "";
        inputNome.value = "";
        inputPass.value = "";
        modalBackdrop.classList.add("show");
        inputNome.focus();
    };

    guestForm.addEventListener("submit", function (e) {
        if (!estaEmFileProtocol()) return;
        e.preventDefault();
        panelMsg.textContent = obterMsgSemServidor();
    });

    function validarSubmissaoWin(e) {
        const nome = inputNome.value.trim();
        const pass = inputPass.value;
        if (nome === "" || pass === "") {
            e.preventDefault();
            msg.textContent = "Preenche nome e password";
            return false;
        }
        if (estaEmFileProtocol()) {
            e.preventDefault();
            msg.textContent = obterMsgSemServidor();
            return false;
        }
        return true;
    }

    form.addEventListener("submit", function (e) {
        msg.textContent = "";
        validarSubmissaoWin(e);
    });

    btnRegister.addEventListener("click", function (e) {
        msg.textContent = "";
        validarSubmissaoWin(e);
    });

    btnLogin.addEventListener("click", function (e) {
        msg.textContent = "";
        const nome = inputNome.value.trim();
        const pass = inputPass.value;
        if (nome === "" || pass === "") {
            e.preventDefault();
            msg.textContent = "Preenche nome e password";
            return false;
        }
        if (estaEmFileProtocol()) {
            e.preventDefault();
            msg.textContent = obterMsgSemServidor();
            return false;
        }
        return true;
    });
}

function checkCoinPickup(player) { //verifica se o jogador esta em cima de um tile moeda

    //hitbox real do jogador
    const px = player.x + player.hitbox.offsetX;
    const py = player.y + player.hitbox.offsetY;
    const pw = player.hitbox.width;
    const ph = player.hitbox.height;

    // tiles a volta do jogador
    const startX = Math.floor(px / TILE_SIZE) - 1;
    const endX   = Math.floor((px + pw) / TILE_SIZE) + 1;
    const startY = Math.floor(py / TILE_SIZE) - 1;
    const endY   = Math.floor((py + ph) / TILE_SIZE) + 1;

    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {

            if (x < 0 || x >= LarguraMapa || y < 0 || y >= AlturaMapa) continue; //fora dos limites do mapa

            if (mapa1_layer2[y][x] !== "M") continue;

            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;

            // colisao bloco-bloco
            if (SeBlocosCoincidem(px, py, pw, ph, tileX, tileY, TILE_SIZE, TILE_SIZE)) {

                // remover moeda
                mapa1_layer2[y][x] = "";
                UpdateTile(x, y, "layer2", mapa1_layer2);

                const coinSound = new Audio("../src/music/moeda.mp3");
                coinSound.currentTime = 0;
                coinSound.play();

                // score
                MoedasApanhadas++;
                atualizarScore("MOEDA");
                
                // cor do texto da checkbox das moedas
                AtualizarCorCheckMoedas();
                
                UpdatePowerUpGuarantee();
                
                // ver se spawna um power-up
                const powerUpType = GambleCoinPickup();
                
                if (powerUpType) {
                    // spawna o poder na mesma posiçao da moeda 
                    const tileKey = `P-${powerUpType}`; 
                    mapa1_layer2[y][x] = tileKey;
                    // registar o tempo de spawn do power-up
                    const posKey = `${x},${y}`;
                    powerUpSpawnTimes[posKey] = Date.now();
                    UpdateTile(x, y, "layer2", mapa1_layer2);
                }

                return; // evita apanhar varias moedas no mesmo frame
            }
        }
    }
}

//colisao com power-ups
function checkPowerUpPickup(player) {
    
    // hitbox real do jogador
    const px = player.x + player.hitbox.offsetX;
    const py = player.y + player.hitbox.offsetY;
    const pw = player.hitbox.width;
    const ph = player.hitbox.height;

    // tiles a volta do jogador
    const startX = Math.floor(px / TILE_SIZE) - 1;
    const endX   = Math.floor((px + pw) / TILE_SIZE) + 1;
    const startY = Math.floor(py / TILE_SIZE) - 1;
    const endY   = Math.floor((py + ph) / TILE_SIZE) + 1;

    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {

            if (x < 0 || x >= LarguraMapa || y < 0 || y >= AlturaMapa) continue;

            const tileType = mapa1_layer2[y][x];
            
            // verificar se e um power-up
            if (!tileType || !tileType.startsWith("P-")) continue;

            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;

            // colisao bloco-bloco
            if (
                SeBlocosCoincidem(
                    px, py, pw, ph,
                    tileX, tileY, TILE_SIZE, TILE_SIZE
                )
            ) {
                // verificar o cooldown de 2 segundos
                const posKey = `${x},${y}`;
                const spawnTime = powerUpSpawnTimes[posKey] || 0;
                if (Date.now() - spawnTime < CooldownPoderes) {
                    continue; // Ainda em cooldown, ignorar colisão
                }
                
                // ver tipo do poder
                const powerUpType = tileType.substring(2); // Remove "P-"
                
                // ativa o bonus do poder
                const powerUpActivated = AtivarPoder(powerUpType, player);
                
                // so remove o poder se foi ativado com sucesso
                if (powerUpActivated) {
                    mapa1_layer2[y][x] = "";
                    UpdateTile(x, y, "layer2", mapa1_layer2);
                    delete powerUpSpawnTimes[posKey]; // Limpar o tempo de spawn
                }
                
                return; // evita apanhar varios poderes no mesmo frame
            }
        }
    }
}


const LuckyBlockHits = {};
const LuckyBlockCooldowns = {};
const MAX_LUCKY_HITS = 3;
const LUCKY_BLOCK_COOLDOWN = 500; // prevenir spam
const LUCKY_BLOCK_POWERUP_CHANCE = 1 / 3;
const LuckyBlockSound = new Audio(AudioPath + "luckyblock.wav");

function TriggerLuckyBlock(tileX, tileY){ //quando o jogador toca num lucky block

    const key = `${tileX},${tileY}`; //identificador unico do lucky block

    const now = Date.now(); // verificar cooldown
    const last = LuckyBlockCooldowns[key] || 0; //ultimo trigger
    if (now - last < LUCKY_BLOCK_COOLDOWN) {
        return; //ainda ta em espera
    }
    LuckyBlockCooldowns[key] = now;

    LuckyBlockHits[key] = (LuckyBlockHits[key] || 0) + 1;

    LuckyBlockSound.currentTime = 0;
    LuckyBlockSound.play();

    atualizarScore("LUCKY_BLOCK");

    if (LuckyBlockHits[key] >= MAX_LUCKY_HITS) { //remove o lucky block depois dos 3 hits
        if (Math.random() < LUCKY_BLOCK_POWERUP_CHANCE) {
            const tipos = ['BOLT', 'SHIELD', 'HEART', 'SCORE'];
            const tipoPoder = tipos[Math.floor(Math.random() * tipos.length)];
            mapa1_layer2[tileY][tileX] = `P-${tipoPoder}`;
            powerUpSpawnTimes[key] = Date.now();
        } else {
            mapa1_layer2[tileY][tileX] = '';
            delete powerUpSpawnTimes[key];
        }
        UpdateTile(tileX, tileY, "layer2", mapa1_layer2);
        delete LuckyBlockHits[key];
        delete LuckyBlockCooldowns[key];
    }
}

let lastCoinAlertTime = 0;
const CooldownAlertaBau = 5000; // 5 segundos ate voltar a alertar sobre moedas insuficientes

function checkBauPickup(player) { //verifica se o jogador esta em cima de um tile bau

    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    const tileX = Math.floor(centerX / TILE_SIZE);
    const tileY = Math.floor(centerY / TILE_SIZE);

    if (tileX < 0 || tileX >= LarguraMapa || tileY < 0 || tileY >= AlturaMapa) return;

    if (mapa1_layer2[tileY][tileX] === "C") {

        const requiredCoins = Math.ceil(numMoedas / 2); //metade total moedas
        
        if (MoedasApanhadas < requiredCoins) { //so pode apanhar bau se tiver +metade das moedas

            const now = Date.now();
            if (now - lastCoinAlertTime > CooldownAlertaBau) {
                const moedasEmFalta = requiredCoins - MoedasApanhadas;
                const sufixo = moedasEmFalta === 1 ? "moeda" : "moedas";
                MostrarAvisoTemporario("Faltam " + moedasEmFalta + " " + sufixo + " para abrir o baú.");
                lastCoinAlertTime = now;
            }
            return;
        }
        
        TocarEmBau(tileX, tileY);
    }
}


function TocarEmBau(tileX, tileY) { //quando o jogador toca num bau

    //remover bau do mapa
    mapa1_layer2[tileY][tileX] = "";
    UpdateTile(tileX, tileY, "layer2", mapa1_layer2);

    const mainGameMusic = document.getElementById('MainGameMusic');
    if (mainGameMusic) {
        mainGameMusic.pause();
    }
    
    BausAbertos++;
    atualizarScore("BAU");

    const hasAllCoins = (MoedasApanhadas >= numMoedas);
    
    StartWinAnimation(hasAllCoins); //animaçao vitoria

    //redesenhar layer 2 do mapa
    DrawLayer(mapa1_layer2, document.getElementById("layer2"));

}

function StartWinAnimation(isRealWin = false){

    // parar musica do jogo antes de tocar a vitoria
    const music = document.getElementById('MainGameMusic');
    if (music && !music.paused) {
        music.pause();
    }

    //musicas
    if (isRealWin) {
        // vitoria especial
        sigmaMusic.currentTime = 0;
        sigmaMusic.play();
    } else {
        // vitoria normal
        vitoriaSound.currentTime = 0;
        vitoriaSound.play();
    }

    // prevenir varios win screen
    if (window._winAnimationStarted) return;
    window._winAnimationStarted = true;

    // pausa o jogo
    window.gamePaused = true;

    if (window._winReturnTimeout) {
        clearTimeout(window._winReturnTimeout);
    }

    let overlay = document.getElementById('win_overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'win_overlay';
        document.body.appendChild(overlay);
        requestAnimationFrame(() => {
            setTimeout(() => overlay.classList.add('show'), 200);
        });
    } else {
        overlay.classList.add('show');
    }
    
    // imagem de fundo (2 tipos)
    if (isRealWin) {
        overlay.classList.add('real-win');
        overlay.classList.remove('regular-win');
    } else {
        overlay.classList.add('regular-win');
        overlay.classList.remove('real-win');
    }

    montarWinUI(overlay);

}

function ReturnToMainMenuWin(){
    if (window._winAnimationStarted === false) return;
    if (window._winReturnTimeout) {
        clearTimeout(window._winReturnTimeout);
        window._winReturnTimeout = null;
    }
    window._winAnimationStarted = false;
    window.location.href = '../index.php';
}

function atualizarScore(tipo){ //atualiza o score

    switch(tipo){
        case "MOEDA":
            score += TiposDePontos.MOEDA;
            break;
        case "BAU":
            score += TiposDePontos.BAU;
            break;
        case "LUCKY_BLOCK":
            score += TiposDePontos.LUCKY_BLOCK;
            break;
    }
}

function AtualizarCorCheckMoedas() { //muda a cor das moedas na checkbox
    const requiredCoins = Math.ceil(numMoedas / 2);
    const moedasValueEl = document.getElementById('coins_value');
    const moedasRow = document.getElementById('coins_row');
    
    if (MoedasApanhadas >= requiredCoins) {
        // Metade ou mais das moedas = texto vermelho
        if (moedasValueEl) moedasValueEl.style.color = "red";
        if (moedasRow) moedasRow.style.color = "red";
    } else {
        // Menos de metade = texto normal
        if (moedasValueEl) moedasValueEl.style.color = "";
        if (moedasRow) moedasRow.style.color = "";
    }
}

//--------------------------------------Cheat----------------------

window.win = {
    realwin: function() {

        const mainGameMusic = document.getElementById('MainGameMusic');
        if (mainGameMusic) {
            mainGameMusic.pause();
        }

        sigmaMusic.currentTime = 0;
        sigmaMusic.play();

        // Reset e mostra real win screen
        window._winAnimationStarted = false;
        StartWinAnimation(true);
    }
};
