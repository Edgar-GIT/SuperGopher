// Gerar flocos de neve caindo
function createSnowflakes() {
    const snowflakesContainer = document.querySelector('.snowflakes');
    
    for (let i = 0; i < 50; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        snowflake.textContent = '❄';
        
        // Posição aleatória no eixo X
        const randomX = Math.random() * window.innerWidth;
        const randomDuration = Math.random() * 10 + 15; // 15-25 segundos
        const randomDelay = Math.random() * 5; // 0-5 segundos de delay
        const randomShift = (Math.random() - 0.5) * 200; // -100px a 100px de movimento lateral
        
        snowflake.style.left = randomX + 'px';
        snowflake.style.--shift = randomShift + 'px';
        snowflake.style.animationDuration = randomDuration + 's';
        snowflake.style.animationDelay = randomDelay + 's';
        
        snowflakesContainer.appendChild(snowflake);
    }
}

// Inicializar quando a página carregar
window.addEventListener('load', createSnowflakes);

// Regenerar flocos quando um acabar de descer
document.addEventListener('animationend', (event) => {
    if (event.target.classList.contains('snowflake')) {
        event.target.remove();
        
        // Criar um novo floco para manter o efeito contínuo
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        snowflake.textContent = '❄';
        
        const randomX = Math.random() * window.innerWidth;
        const randomDuration = Math.random() * 10 + 15;
        const randomShift = (Math.random() - 0.5) * 200;
        
        snowflake.style.left = randomX + 'px';
        snowflake.style.--shift = randomShift + 'px';
        snowflake.style.animationDuration = randomDuration + 's';
        
        document.querySelector('.snowflakes').appendChild(snowflake);
    }
});
