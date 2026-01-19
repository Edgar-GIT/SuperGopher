var score = 0; //pontuaçao do jogador

var BausAbertos = 0;    
var numBaus = 1;    

var MoedasApanhadas = 0;
var numMoedas = 0;     

var AudioPath = "../src/music/";
var numMoedas = 0;
var MoedasApanhadas = 0;
var BausAbertos = 0;


var powerUpSpawnTimes = {}; //guarda os tempos de spawn dos power-ups por posiçao
const POWERUP_PICKUP_COOLDOWN = 2000; //2 segundos antes de poder apanhar um poder

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

            // colisão bloco-bloco
            if (SeBlocosCoincidem(px, py, pw, ph, tileX, tileY, TILE_SIZE, TILE_SIZE)) {

                // remover moeda
                mapa1_layer2[y][x] = "";

                const coinSound = new Audio("../src/music/moeda.mp3");
                coinSound.currentTime = 0;
                coinSound.play();

                // score
                MoedasApanhadas++;
                atualizarScore("MOEDA");
                
                // Atualizar cor do texto de moedas
                UpdateCoinDisplayColor();
                
                UpdatePowerUpGuarantee();
                
                // Verificar se spawna um power-up
                const powerUpType = GambleCoinPickup();
                
                if (powerUpType) {
                    // Spawnar o poder-up na mesma posição da moeda 
                    const tileKey = `P-${powerUpType}`; 
                    mapa1_layer2[y][x] = tileKey;
                    // Registar o tempo de spawn do power-up
                    const posKey = `${x},${y}`;
                    powerUpSpawnTimes[posKey] = Date.now();
                }

                // redesenhar mapa
                DrawLayer(mapa1_layer2, document.getElementById("layer2"));

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
                // verificar cooldown de 2 segundos
                const posKey = `${x},${y}`;
                const spawnTime = powerUpSpawnTimes[posKey] || 0;
                if (Date.now() - spawnTime < POWERUP_PICKUP_COOLDOWN) {
                    continue; // Ainda em cooldown, ignorar colisão
                }
                
                // ver tipo do poder
                const powerUpType = tileType.substring(2); // Remove "P-"
                
                // remove power-up do mapa
                mapa1_layer2[y][x] = "";
                delete powerUpSpawnTimes[posKey]; // Limpar o tempo de spawn
                
                // Ativar o buff
                AtivarPoder(powerUpType, player);
                
                // Redesenhar mapa
                DrawLayer(mapa1_layer2, document.getElementById("layer2"));
                
                return; // evita apanhar varios no mesmo frame
            }
        }
    }
}


const LuckyBlockHits = {};
const LuckyBlockCooldowns = {};
const MAX_LUCKY_HITS = 3;
const LUCKY_BLOCK_COOLDOWN = 500; // milliseconds cooldown to prevent spamming
const LuckyBlockSound = new Audio(AudioPath + "luckyblock.wav");

function TriggerLuckyBlock(tileX, tileY){

    const key = `${tileX},${tileY}`;

    // ignore triggers that happen too quickly (cooldown)
    const now = Date.now();
    const last = LuckyBlockCooldowns[key] || 0;
    if (now - last < LUCKY_BLOCK_COOLDOWN) {
        return; // still cooling down
    }
    LuckyBlockCooldowns[key] = now;

    LuckyBlockHits[key] = (LuckyBlockHits[key] || 0) + 1;

    LuckyBlockSound.currentTime = 0;
    LuckyBlockSound.play();

    atualizarScore("LUCKY_BLOCK");

    if (LuckyBlockHits[key] >= MAX_LUCKY_HITS) {
        mapa1_layer2[tileY][tileX] = '';
        delete LuckyBlockHits[key];
        delete LuckyBlockCooldowns[key];
        DrawLayer(mapa1_layer2, document.getElementById("layer2"));
    }
}



// ========== COOLDOWN PARA ALERT DE MOEDAS ==========
let lastCoinAlertTime = 0;
const COIN_ALERT_COOLDOWN = 5000; // 5 segundos

function checkBauPickup(player) { //verifica se o jogador esta em cima de um tile bau

    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    const tileX = Math.floor(centerX / TILE_SIZE);
    const tileY = Math.floor(centerY / TILE_SIZE);

    if (
        tileX < 0 || tileX >= LarguraMapa ||
        tileY < 0 || tileY >= AlturaMapa
    ) return;

    if (mapa1_layer2[tileY][tileX] === "C") {
        // ========== VERIFICAR SE TEM PELO MENOS 50% DE MOEDAS ==========
        const requiredCoins = Math.ceil(numMoedas / 2);
        
        if (MoedasApanhadas < requiredCoins) {
            // Não tem moedas suficientes - com cooldown
            const now = Date.now();
            if (now - lastCoinAlertTime > COIN_ALERT_COOLDOWN) {
                alert("Not enough Coins Collected");
                lastCoinAlertTime = now;
                // Resetar as keys para evitar que o jogador ande sozinho
                if (window.ResetGameKeys) {
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

    const mainGameMusic = document.getElementById('MainGameMusic');
    if (mainGameMusic) {
        mainGameMusic.pause();
    }
    
    BausAbertos++;
    atualizarScore("BAU");
    
    // ========== VERIFICAR SE TEM TODAS AS MOEDAS ==========
    const hasAllCoins = (MoedasApanhadas >= numMoedas);
    
    // Iniciar animação de vitória (música é tocada lá)
    StartWinAnimation(hasAllCoins);

    //redesenhar layer 2 do mapa
    DrawLayer(mapa1_layer2, document.getElementById("layer2"));

}

function StartWinAnimation(isRealWin = false){

    // Tocar música correspondente ANTES das outras verificações
    if (isRealWin) {
        // REAL WIN - sigma.mp3
        sigmaMusic.currentTime = 0;
        sigmaMusic.play();
        console.log('🏆 REAL WIN! Todas as moedas apanhadas!');
    } else {
        // REGULAR WIN - vitoria.mp3
        vitoriaSound.currentTime = 0;
        vitoriaSound.play();
        console.log('✅ Regular win - nem todas as moedas apanhadas');
    }

    // prevent multiple invocations
    if (window._winAnimationStarted) return;
    window._winAnimationStarted = true;

    // pause game updates
    window.gamePaused = true;

    // pause music if playing
    const music = document.getElementById('MainGameMusic');
    if (music && !music.paused) {
        try { music.pause(); } catch (e) {}
    }

    // create overlay if not present
    let overlay = document.getElementById('win_overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'win_overlay';
        
        // Criar botão exatamente igual ao botão normal do jogo
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

        requestAnimationFrame(() => {
            setTimeout(() => overlay.classList.add('show'), 200);
        });

    } else {
        overlay.classList.add('show');
    }
    
    // Definir a imagem de fundo correta (CSS com classe)
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
    console.log('Returning to MainMenu.html');
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

// ============================================================================
// ATUALIZAR COR DO TEXTO DE MOEDAS
// ============================================================================
function UpdateCoinDisplayColor() {
    const requiredCoins = Math.ceil(numMoedas / 2);
    const moedasValueEl = document.getElementById('coins_value');
    const moedasRow = document.getElementById('coins_row');
    
    if (MoedasApanhadas >= requiredCoins) {
        // Metade ou mais das moedas - texto vermelho
        if (moedasValueEl) moedasValueEl.style.color = "red";
        if (moedasRow) moedasRow.style.color = "red";
    } else {
        // Menos de metade - texto normal
        if (moedasValueEl) moedasValueEl.style.color = "";
        if (moedasRow) moedasRow.style.color = "";
    }
}

// ============================================================================
// CHEAT CODE - object "win" para aceder ao cheat code
// ============================================================================

window.win = {
    realwin: function() {
        console.log('🎮 CHEAT CODE ATIVADO! REAL WIN!');
        
        // Pausar música principal
        const mainGameMusic = document.getElementById('MainGameMusic');
        if (mainGameMusic) {
            mainGameMusic.pause();
        }
        
        // Tocar apenas sigma.mp3
        sigmaMusic.currentTime = 0;
        sigmaMusic.play();
        
        // Reset e mostrar win screen
        window._winAnimationStarted = false;
        StartWinAnimation(true);
    }
};
