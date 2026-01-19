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
                UpdateCoinDisplayColor();
                
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
                
                // remove o poder do mapa
                mapa1_layer2[y][x] = "";
                UpdateTile(x, y, "layer2", mapa1_layer2);
                delete powerUpSpawnTimes[posKey]; // Limpar o tempo de spawn
                
                // ativa o bonus do poder
                AtivarPoder(powerUpType, player);
                
                return; // evita apanhar varios poderes no mesmo frame
            }
        }
    }
}


const LuckyBlockHits = {};
const LuckyBlockCooldowns = {};
const MAX_LUCKY_HITS = 3;
const LUCKY_BLOCK_COOLDOWN = 500; // prevenir spam
const LuckyBlockSound = new Audio(AudioPath + "luckyblock.wav");

function TriggerLuckyBlock(tileX, tileY){

    const key = `${tileX},${tileY}`;

    const now = Date.now(); // verificar cooldown
    const last = LuckyBlockCooldowns[key] || 0;
    if (now - last < LUCKY_BLOCK_COOLDOWN) {
        return; //ainda ta em espera
    }
    LuckyBlockCooldowns[key] = now;

    LuckyBlockHits[key] = (LuckyBlockHits[key] || 0) + 1;

    LuckyBlockSound.currentTime = 0;
    LuckyBlockSound.play();

    atualizarScore("LUCKY_BLOCK");

    if (LuckyBlockHits[key] >= MAX_LUCKY_HITS) { //remove o lucky block depois dos 3 hits
        mapa1_layer2[tileY][tileX] = '';
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
                alert("Not enough Coins Collected");
                lastCoinAlertTime = now;

                if (window.ResetGameKeys) { //da reset as teclas para o jogador nao andar sozinho
                    window.ResetGameKeys();
                }
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

    // para musica do jogo
    const music = document.getElementById('MainGameMusic');
    if (music && !music.paused) {
        music.pause();
    }

    // cria win screen se ja nao existir
    let overlay = document.getElementById('win_overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'win_overlay';
        
        // botao return
        const returnLink = document.createElement('a');
        returnLink.className = 'btn btn-primary';
        if (isRealWin) {
            returnLink.classList.add('realwin-return-btn');
        } else {
            returnLink.classList.add('win-return-btn');
        }
        returnLink.href = '#';
        returnLink.textContent = '← Return';
        returnLink.onclick = function(e) {
            e.preventDefault();
            ReturnToMainMenuWin();
        };
        overlay.appendChild(returnLink);
        
        document.body.appendChild(overlay);

        requestAnimationFrame(() => { //delay da animaçao
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
}

function ReturnToMainMenuWin(){
    if (window._winAnimationStarted === false) return;
    window._winAnimationStarted = false;
    window.location.href = '../MainMenu.html';
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

function UpdateCoinDisplayColor() { //muda a cor das moedas na checkbox
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
