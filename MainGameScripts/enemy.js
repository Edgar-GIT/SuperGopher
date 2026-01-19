const PerderVidaSound = new Audio('../src/music/damage.mp3');
const PerderSound = new Audio('../src/music/lose.mp3');

const IconesVida = { //sprites barra de vida
    full: '../src/sprites/main/VIDA/FULL.png',
    vida2_1: '../src/sprites/main/VIDA/2_1.png',
    vida1_2: '../src/sprites/main/VIDA/1_2.png',
    vida0: '../src/sprites/main/VIDA/0.png'
}

const NumVidas = 3; //numero base de vidas
var VidaAtual = 3; //vidas atuais do jogador
let invulneravel = false; //invencivel
const INVULNERAVEL_TIME = 2000; // 2 segundos de invencibilidade apos levar dano


function AtualizarVidas(){
    const DivVidas = document.getElementById('vida_container');
    if (!DivVidas) return; //reset se nao houver barra de vidas

    let img = document.getElementById('barra_vida');
    if (!img) {
        img = document.createElement('img');
        img.id = 'barra_vida';
        DivVidas.appendChild(img);
    }

    switch (VidaAtual) { //estados de vida
        case 3:
            img.src = IconesVida.full;
            break;
        case 2:
            img.src = IconesVida.vida2_1;
            break;
        case 1:
            img.src = IconesVida.vida1_2;
            break;
        case 0:
            img.src = IconesVida.vida0;
            StartLoseAnimation();
            break;
    }
}


function TocarEmInimigo(){ //se tocar em inimigo

    if (invulneravel) return;

    VidaAtual--;
    if (VidaAtual < 0) VidaAtual = 0;

    PerderVidaSound.currentTime = 0;
    PerderVidaSound.play();

    AtualizarVidas();

    invulneravel = true;

    setTimeout(() => { //remover invencibilidade 
        invulneravel = false;
    }, INVULNERAVEL_TIME);
}

function CheckEnemyTouch(player) { //verificar colisao com inimigos

    // se o escudo estiver ativo o player nao sofre dano
    if (player && player.isInvincible) return;

    if (invulneravel) return;
    //tiles ao redor do jogador
    const Xinicial = Math.floor(player.x / TILE_SIZE) - 1;
    const Xfinal   = Math.floor((player.x + player.width) / TILE_SIZE) + 1;
    const Yinicial = Math.floor(player.y / TILE_SIZE) - 1;
    const Yfinal   = Math.floor((player.y + player.height) / TILE_SIZE) + 1;

    for (let y = Yinicial; y <= Yfinal; y++) {
        for (let x = Xinicial; x <= Xfinal; x++) {

            if (
                x < 0 || x >= LarguraMapa ||
                y < 0 || y >= AlturaMapa
            ) continue;

            if (mapa1_layer2[y][x] === 'A') {

                const enemyX = x * TILE_SIZE;
                const enemyY = y * TILE_SIZE;

                if (SeBlocosCoincidem(player.x, player.y, player.width, player.height, enemyX, enemyY, TILE_SIZE, TILE_SIZE)) {
                    TocarEmInimigo();
                    return; // evita multiplos hits por frame
                }
            }
        }
    }
}




function StartLoseAnimation(){

    const music = document.getElementById('MainGameMusic');
    if (music && !music.paused) {
        music.pause();
    }

    PerderSound.currentTime = 0;
    PerderSound.play();

    // prevenir varias chamadas
    if (window._loseAnimationStarted) return;
    window._loseAnimationStarted = true;

    // pausar jogo
    window.gamePaused = true;

    // ecra lose se nao existir
    let overlay = document.getElementById('lose_overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lose_overlay';
        const txt = document.createElement('div');
        txt.className = 'lose_text';
        txt.textContent = 'Returning to the menu...';
        overlay.appendChild(txt);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            setTimeout(() => overlay.classList.add('show'), 200);
        });

    } else {
        const txt = overlay.querySelector('.lose_text');
        if (txt) txt.textContent = 'Returning to the Menu...';
        overlay.classList.add('show');
    }
    setTimeout(VoltarAoMenu, 10000); //esperar 10 segundos antes de voltar ao menu
}

function VoltarAoMenu(){
    window.location.href = '../MainMenu.html';
}