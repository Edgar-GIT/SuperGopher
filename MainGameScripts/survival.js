//-------------------------sistema dos poderes-------------------------

const POWERUP_CHANCE = 10; //10% de chance de cair um poder ao apanhar uma moeda
const POWERUP_GUARANTEE_TIME = 45000; //se passarem 45 segundos a proxima moeda da um poder garantidamente

var lastCoinPickupTime = 0; //ultima vez que o jogador apanhou uma moeda
var nextPowerUpGuaranteed = false; //se a proxima moeda da poder ou nao
var boltActive = false; //controlar se o BOLT ja esta ativo

function UpdatePowerUpGuarantee() { //atualizar o estado do poder garantido
    const now = Date.now();
    if (!nextPowerUpGuaranteed && (now - lastCoinPickupTime) > POWERUP_GUARANTEE_TIME) {
        nextPowerUpGuaranteed = true;
    }
}

function GambleCoinPickup() { //decidir se a moeda da poder ou nao
    lastCoinPickupTime = Date.now();
    if (nextPowerUpGuaranteed) {
        nextPowerUpGuaranteed = false;
        const types = ['BOLT', 'SHIELD', 'HEART', 'SCORE'];
        return types[Math.floor(Math.random() * types.length)]; //escolher um poder random
    }
    if (Math.random() * 100 < POWERUP_CHANCE) { //chance normal de aparecer um poder
        const types = ['BOLT', 'SHIELD', 'HEART', 'SCORE'];
        return types[Math.floor(Math.random() * types.length)];
    }
    return null; //nao devolve um power-up
}

function AtivarPoder(type, player) {
    if (!player) return false; //verifica se o jogador existe
    
    const AudioPath = "../src/music/";

    //tipos de power-ups
    
    switch(type) { 
        case 'BOLT': //relampago aumenta velocidade e altura do salto
        
            // verificar se ja existe um BOLT ativo
            if (boltActive) {
                alert("BOLT power already active! Wait for it to end first.");
                return false; //poder nao foi ativado
            }
            
            boltActive = true;
            const originalSpeed = player.speed;
            const originalRunSpeed = player.runSpeed;
            const originalJumpForceWalk = player.jumpForceWalk;
            const originalJumpForceRun = player.jumpForceRun;
            
            player.speed = 6;
            player.runSpeed = 12;
            player.jumpForceWalk = originalJumpForceWalk * 1.5;
            player.jumpForceRun = originalJumpForceRun * 1.5;
            new Audio(AudioPath + "bolt.mp3").play();
            
            setTimeout(() => {
                player.speed = originalSpeed;
                player.runSpeed = originalRunSpeed;
                player.jumpForceWalk = originalJumpForceWalk;
                player.jumpForceRun = originalJumpForceRun;
                boltActive = false; //permite apanhar outro BOLT
            }, 7000);
            return true; //poder foi ativado com sucesso
            
        case 'SHIELD': //escudo faz o jogador invencivel
            player.isInvincible = true;
            new Audio(AudioPath + "shield.mp3").play();
            setTimeout(() => {
                player.isInvincible = false;
            }, 6000);
            return true;
            
        case 'HEART': //coraçao recupera uma vida
            if (VidaAtual < NumVidas){
                VidaAtual++;
                AtualizarVidas();
                new Audio(AudioPath + "hp.mp3").play();
                return true;
            }
            return false; //nao foi ativado porque ja tinha vida maxima

            
        case 'SCORE': //score x2 duplica a pontuaçao atual do jogador
            score *= 2;
            new Audio(AudioPath + "score.mp3").play();
            return true;
    }
    
    return false;
}

