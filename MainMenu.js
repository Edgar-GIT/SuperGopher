window.onload = function () { //carrega a musica do menu e mostra o menu

    const mainMenuMusic = document.getElementById("MainMenuMusic");
    if(mainMenuMusic) mainMenuMusic.play();

    const mainMenuElem = document.getElementById('mainMenuImage');
    if(mainMenuElem) mainMenuElem.style.display = 'block';

    const playBtn = document.getElementById('Play');
    if (playBtn) playBtn.addEventListener('click', CleanStart);

}

function CleanStart(){ //limpa as musicas e inicia o jogo

    const mainMenuMusic = document.getElementById("MainMenuMusic");
    const mainGameMusic = document.getElementById("MainGameMusic");

    if (mainMenuMusic) { mainMenuMusic.pause(); mainMenuMusic.currentTime = 0; }
    if (mainGameMusic) { mainGameMusic.pause(); mainGameMusic.currentTime = 0; }

    window.location.href = './MainGameScripts/Game.html';
}

