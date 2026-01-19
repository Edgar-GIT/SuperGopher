//Renderizar o jogador, criar movimento, camara, limites e defenir colisoes

const playerAssetsPath = '../src/sprites/main/personagem/';
const playerSprites = {
    FrontView: playerAssetsPath + 'front1.png', //quando tiver parado
    JumpNORMAL: playerAssetsPath + 'jumpNORMAL.png', //saltar
    walkLEFT: playerAssetsPath + 'left1.png', //caminhar para a esquerda
    walkRIGHT: playerAssetsPath + 'right1.png', //caminhar para a direita
    runLEFT1: playerAssetsPath + 'leftRUN1.png', //correr para a esquerda 1
    runLEFT2: playerAssetsPath + 'leftRUN2.png', //correr para a esquerda 2
    runRIGHT1: playerAssetsPath + 'rightRUN1.png', //correr para a direita 1
    runRIGHT2: playerAssetsPath + 'rightRUN2.png', //correr para a direita 2
};

const TILE_SIZE = 32; 
const MAP_WIDTH_PX = LarguraMapa * TILE_SIZE;
const MAP_HEIGHT_PX = AlturaMapa * TILE_SIZE;


//classe do jogador
class Player {
    constructor(tileX, tileY) {

        this.hitbox = {
            offsetX: 4, //ajuste da hitbox horizontal
            offsetY: 2, //ajuste da hitbox vertical
            width: 52, //largura da hitbox
            height: 60 //altura da hitbox
        };

        this.x = tileX * 32; //pos inicial x
        this.y = tileY * 32 - 32; //pos inicial y

        this.width = 64; //largura do jogador
        this.height = 64; //altura do jogador

        this.vx = 0; //velocidade horizontal
        this.vy = 0; //velocidade vertical

        this.speed = 3; //velocidade de movimento
        this.gravity = 0.6; //força da gravidade

        this.tileSize = 32; //tamanho dos blocos
        this.jumpTilesWalk = 2.5; //salta 2.5 blocos no estado de andar
        this.jumpTilesRun = 4.5; //salta 4.5 blocos no estado de correr

        //calcular a força do salto com base na altura defenida
        this.jumpForceWalk = Math.sqrt(2 * this.gravity * (this.jumpTilesWalk * this.tileSize));
        this.jumpForceRun = Math.sqrt(2 * this.gravity * (this.jumpTilesRun * this.tileSize));

        this.onGround = false; //verificar se esta no chao
        this.direction = "right"; //direçao inicial
        this.runSpeed = 6; //velocidade ao correr

        this.animTimer = 0; //temporizador de animaçao
        this.animFrame = 0; //frame da animaçao

        //criar o jogador
        this.element = document.createElement("img");
        this.element.src = playerSprites.FrontView;
        this.element.style.position = "absolute";
        this.element.style.width = "64px";
        this.element.style.height = "64px";
        this.element.style.imageRendering = "pixelated";
        this.element.style.pointerEvents = "none";

        document.getElementById("layer3").appendChild(this.element);
    }

    update(keys) {

        //movimento horizontal e detetar movimento
        let moving = false;
        if (keys["a"] || keys["d"]) moving = true;

        //correr enquanto Shift for pressionado
        const running = keys["shift"];
        let currentSpeed = running && moving ? this.runSpeed : this.speed;

        //defenir velocidade horizontal e direçoes
        if (keys["a"]) {
            this.vx = -currentSpeed;
            this.direction = "left";
        } 
        else if (keys["d"]) {
            this.vx = currentSpeed;
            this.direction = "right";
        } 
        else {
            this.vx = 0;
        }


        // COLISAO HORIZONTAL

        let nextX = this.x + this.vx;
        const tilesX = getSolidTilesAround(this);

        for (const tile of tilesX) {
            if (
                SeBlocosCoincidem(
                    nextX + this.hitbox.offsetX,
                    this.y + this.hitbox.offsetY,
                    this.hitbox.width,
                    this.hitbox.height,
                    tile.x,
                    tile.y,
                    tile.width,
                    tile.height
                )
            ) {
                if (this.vx > 0) {
                    nextX = tile.x - (this.hitbox.width + this.hitbox.offsetX);
                } else if (this.vx < 0) {
                    nextX = tile.x + tile.width - this.hitbox.offsetX;
                }
                this.vx = 0;
            }
        }

        this.x = nextX;

        // SALTO

        if (keys[" "] && this.onGround) {
            this.vy = -(running ? this.jumpForceRun : this.jumpForceWalk);
            this.onGround = false;
        }

        // aplicar gravidade
        this.vy += this.gravity;

        // COLISAO VERTICAL

        let nextY = this.y + this.vy;
        let groundedThisFrame = false;

        const tilesY = getSolidTilesAround(this);

        for (const tile of tilesY) {
            if (
                SeBlocosCoincidem(
                    this.x + this.hitbox.offsetX,
                    nextY + this.hitbox.offsetY,
                    this.hitbox.width,
                    this.hitbox.height,
                    tile.x,
                    tile.y,
                    tile.width,
                    tile.height
                )
            ) {
                // cair
                if (this.vy > 0) {
                    nextY = tile.y - (this.hitbox.height + this.hitbox.offsetY);
                    this.vy = 0;
                    groundedThisFrame = true;
                }
                // bater com a cabeça
                else if (this.vy < 0) {
                    nextY = tile.y + tile.height - this.hitbox.offsetY;
                    this.vy = 0;

                    if (tile.letter === 'L') {
                        TriggerLuckyBlock(tile.tileX, tile.tileY);
                    }
                }
            }
        }

        this.y = nextY;
        this.onGround = groundedThisFrame;

        //SPRITES E ANIMAÇOES

        if (!this.onGround) {
            this.element.src = playerSprites.JumpNORMAL;
        }

        else if (moving) {
            if (running) {
                this.animTimer++;
                if (this.animTimer > 10) {
                    this.animTimer = 0;
                    this.animFrame++;
                }

                if (this.direction === "left") {
                    this.element.src = this.animFrame % 2 === 0 ? playerSprites.runLEFT1 : playerSprites.runLEFT2;
                } else {
                    this.element.src = this.animFrame % 2 === 0 ? playerSprites.runRIGHT1 : playerSprites.runRIGHT2;
                }
            } else {
                this.element.src = this.direction === "left" ? playerSprites.walkLEFT : playerSprites.walkRIGHT;
                this.animTimer = 0;
                this.animFrame = 0;
            }
        }
        else {
            this.element.src = playerSprites.FrontView;
        }

        //atualizar a posiçao do jogador
        this.element.style.left = this.x + "px";
        this.element.style.top = this.y + "px";

        //limites horizontais
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > MAP_WIDTH_PX) {
            this.x = MAP_WIDTH_PX - this.width;
        }

        //limites verticais
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > MAP_HEIGHT_PX) {
            this.y = MAP_HEIGHT_PX - this.height;
            this.vy = 0;
        }

        checkCoinPickup(this); //se o jogador tocar numa moeda
        checkBauPickup(this); //se o jogador tocar no bau
        CheckEnemyTouch(this); //se o jogador tocar num inimigo
    }
}


//verificar colisoes com tiles "collidable"
function IS_SOLID_TILE(letter){
    return letter === 'T' || letter === 'L';
}

function getSolidTilesAround(player) {

    const tiles = []; //array de tiles collidable que ja foram encontrados

    //Calcular os tiles ao redor do jogador

    const startX = Math.floor(player.x / TILE_SIZE) - 1; //iniciar 1 tile antes do jogador
    const endX   = Math.floor((player.x + player.width) / TILE_SIZE) + 1; //terminar 1 tile depois do jogador
    const startY = Math.floor(player.y / TILE_SIZE) - 1; //iniciar 1 tile acima do jogador
    const endY   = Math.floor((player.y + player.height) / TILE_SIZE) + 1; //terminar 1 tile abaixo do jogador

    //Percorrer os tiles ao redor do jogador
    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {

            if (x < 0 || x >= LarguraMapa || y < 0 || y >= AlturaMapa) continue;

            const letter = mapa1_layer2[y][x];
            if (!IS_SOLID_TILE(letter)) continue;

            tiles.push({
                x: x * TILE_SIZE,
                y: y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                letter,
                tileX: x,
                tileY: y
            });
        }
    }
    return tiles;
}


//camara do jogador
function updateCamera(player) {

    const viewport = document.getElementById("viewport"); //elemento que mostra a camara
    const map = document.getElementById("map"); //elemento do mapa

    const viewportWidth = viewport.clientWidth; //largura da camara

    // centrar a camara no jogador
    let cameraX = player.x + player.width / 2 - viewportWidth / 2;

    //limites da câmara
    cameraX = Math.max(0, cameraX);
    cameraX = Math.min(cameraX, MAP_WIDTH_PX - viewportWidth);

    map.style.transform = `translateX(${-cameraX}px)`; //mover o mapa para criar o efeito de camara
}
