const playerAssetsPath = '../src/sprites/main/personagem/';
const playerSprites = {
    FrontView: playerAssetsPath + 'front1.png',
    JumpNORMAL: playerAssetsPath + 'jumpNORMAL.png',
    walkLEFT: playerAssetsPath + 'left1.png',
    walkRIGHT: playerAssetsPath + 'right1.png',
    runLEFT1: playerAssetsPath + 'leftRUN1.png',
    runLEFT2: playerAssetsPath + 'leftRUN2.png',
    runRIGHT1: playerAssetsPath + 'rightRUN1.png',
    runRIGHT2: playerAssetsPath + 'rightRUN2.png',
};

const TILE_SIZE = 32;
const MAP_WIDTH_PX = LarguraMapa * TILE_SIZE;
const MAP_HEIGHT_PX = AlturaMapa * TILE_SIZE;

function GamepadBotaoPremido(gamepad, index) {
    if (!gamepad || !gamepad.buttons || !gamepad.buttons[index]) return false;
    const botao = gamepad.buttons[index];
    return !!(botao.pressed || botao.value > 0.5);
}

function BindingGamepadAtivo(gamepad, binding) {
    if (!gamepad || !binding) return false;

    if (binding.type === "button") {
        return GamepadBotaoPremido(gamepad, binding.index);
    }

    if (binding.type === "axis") {
        const axisValue = gamepad.axes && gamepad.axes.length > binding.index ? gamepad.axes[binding.index] : 0;
        if (binding.sign < 0) return axisValue <= -0.55;
        if (binding.sign > 0) return axisValue >= 0.55;
    }

    return false;
}

function LerInputGamepad() {
    const input = {
        left: false,
        right: false,
        jump: false,
        run: false
    };

    if (!navigator.getGamepads) return input;

    const gamepads = navigator.getGamepads();
    if (!gamepads) return input;

    const calibratedBindings = window.arcadeGamepadBindings || null;
    const deadzone = 0.25;

    for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (!gamepad) continue;

        if (calibratedBindings) {
            if (BindingGamepadAtivo(gamepad, calibratedBindings.left)) {
                input.left = true;
            }
            if (BindingGamepadAtivo(gamepad, calibratedBindings.right)) {
                input.right = true;
            }
            if (BindingGamepadAtivo(gamepad, calibratedBindings.up)) {
                input.jump = true;
            }
            if (BindingGamepadAtivo(gamepad, calibratedBindings.run)) {
                input.run = true;
            }
            continue;
        }

        const axisX = gamepad.axes && gamepad.axes.length > 0 ? gamepad.axes[0] : 0;

        if (axisX < -deadzone || GamepadBotaoPremido(gamepad, 14)) {
            input.left = true;
        }
        if (axisX > deadzone || GamepadBotaoPremido(gamepad, 15)) {
            input.right = true;
        }
        if (GamepadBotaoPremido(gamepad, 0)) {
            input.jump = true;
        }
        if (
            GamepadBotaoPremido(gamepad, 4) ||
            GamepadBotaoPremido(gamepad, 5) ||
            GamepadBotaoPremido(gamepad, 6) ||
            GamepadBotaoPremido(gamepad, 7)
        ) {
            input.run = true;
        }
    }

    if ((input.left || input.right || input.jump || input.run) && typeof StartAudioOnFirstInput === 'function') {
        StartAudioOnFirstInput();
    }

    return input;
}

class Player {
    constructor(tileX, tileY) {
        this.hitbox = {
            offsetX: 4,
            offsetY: 2,
            width: 52,
            height: 60
        };

        this.x = tileX * 32;
        this.y = tileY * 32 - 32;

        this.width = 64;
        this.height = 64;

        this.vx = 0;
        this.vy = 0;

        this.speed = 3.3;
        this.gravity = 0.5;

        this.tileSize = 32;
        this.jumpTilesWalk = 2.5;
        this.jumpTilesRun = 4.5;

        this.jumpForceWalk = Math.sqrt(2 * this.gravity * (this.jumpTilesWalk * this.tileSize));
        this.jumpForceRun = Math.sqrt(2 * this.gravity * (this.jumpTilesRun * this.tileSize));

        this.onGround = false;
        this.direction = "right";
        this.runSpeed = 6.4;

        this.animTimer = 0;
        this.animFrame = 0;

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
        const gamepadInput = LerInputGamepad();
        const left = !!keys["a"] || gamepadInput.left;
        const right = !!keys["d"] || gamepadInput.right;
        const jump = !!keys[" "] || gamepadInput.jump;
        const run = !!keys["shift"] || gamepadInput.run;

        let moving = false;
        if (left || right) moving = true;

        const running = run;
        let currentSpeed = running && moving ? this.runSpeed : this.speed;

        if (left && !right) {
            this.vx = -currentSpeed;
            this.direction = "left";
        }
        else if (right && !left) {
            this.vx = currentSpeed;
            this.direction = "right";
        }
        else {
            this.vx = 0;
        }

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

        if (jump && this.onGround) {
            this.vy = -(running ? this.jumpForceRun : this.jumpForceWalk);
            this.onGround = false;
        }

        this.vy += this.gravity;

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
                if (this.vy > 0) {
                    nextY = tile.y - (this.hitbox.height + this.hitbox.offsetY);
                    this.vy = 0;
                    groundedThisFrame = true;
                }
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

        this.element.style.left = this.x + "px";
        this.element.style.top = this.y + "px";

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > MAP_WIDTH_PX) {
            this.x = MAP_WIDTH_PX - this.width;
        }

        if (this.y < 0) this.y = 0;
        if (this.y + this.height > MAP_HEIGHT_PX) {
            this.y = MAP_HEIGHT_PX - this.height;
            this.vy = 0;
        }
    }
}

function IS_SOLID_TILE(letter){
    return letter === 'T' || letter === 'L';
}

function getSolidTilesAround(player) {
    const tiles = [];

    const startX = Math.floor(player.x / TILE_SIZE) - 1;
    const endX   = Math.floor((player.x + player.width) / TILE_SIZE) + 1;
    const startY = Math.floor(player.y / TILE_SIZE) - 1;
    const endY   = Math.floor((player.y + player.height) / TILE_SIZE) + 1;

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

function updatecamara(player) {
    const viewport = document.getElementById("viewport");
    const mapCamera = document.getElementById("map_camera");

    if (!viewport || !mapCamera) return;

    const viewportWidth = viewport.clientWidth;
    const scale = window.MAP_SCALE || 1;
    const visibleWorldWidth = viewportWidth / scale;

    let camaraX = player.x + player.width / 2 - visibleWorldWidth / 2;

    camaraX = Math.max(0, camaraX);
    camaraX = Math.min(camaraX, MAP_WIDTH_PX - visibleWorldWidth);

    mapCamera.style.transform = `translateX(${-camaraX * scale}px)`;
}
