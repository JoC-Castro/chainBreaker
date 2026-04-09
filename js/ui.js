export class UI {
    constructor() {
        this.b1 = document.getElementById('b1');
        this.b2 = document.getElementById('b2');
        this.b3 = document.getElementById('b3');
        this.texto = document.getElementById('texto');
        this.enemigo = document.getElementById('enemigo');
        this.loading = document.getElementById('loading');
        this.loadingDOM = document.getElementById('loadingDOM');
        this.main = document.getElementById('main');
        this.vidasUI = document.getElementById('vidas');
        this.vidasEnemigo = document.getElementById('vidasEnemigo');

        this.#hpCtx = this.vidasEnemigo.getContext('2d');
    }

    #hpCtx;

    // Screen transitions

    showMain() {
        this.main.hidden = false;
        this.loading.hidden = true;
    }

    reset() {
        this.main.hidden = true;
        this.loading.hidden = false;
        this.loadingDOM.style.display = 'none';
        this.setTexto('Press&nbsp;<span style="font-weight: bold;">SPACE</span>&nbsp;to start');
        this.setEnemigoSrc('./imgs/Pantalla-chainbreaker.gif');
        this.vidasUI.innerHTML = '';
        this.#hpCtx.clearRect(0, 0, this.vidasEnemigo.width, this.vidasEnemigo.height);
    }

    // Text & images

    setTexto(str) {
        this.texto.innerHTML = str;
    }

    setEnemigoSrc(src) {
        this.enemigo.src = src;
    }

    // Buttons

    setButtonsDisabled(bool) {
        this.b1.disabled = bool;
        this.b2.disabled = bool;
        this.b3.disabled = bool;
    }

    btnAnimacion(btn) {
        btn.style.transform = 'scale(1.1)';
        setTimeout(() => { btn.style.transform = 'scale(1)'; }, 120);
    }

    // Player lives

    renderPlayerLives(count) {
        this.vidasUI.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const img = document.createElement('img');
            img.src = './imgs/vidas.gif';
            this.vidasUI.appendChild(img);
        }
    }

    removeLastLife() {
        this.vidasUI.removeChild(this.vidasUI.lastChild);
    }

    // Enemy HP bar (canvas)

    renderEnemyHPBar(remaining, total) {
        const canvas = this.vidasEnemigo;
        const ctx = this.#hpCtx;
        const segW = canvas.width / total;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < total; i++) {
            ctx.fillStyle = i < remaining ? '#222222' : '#cccccc';
            ctx.fillRect(i * segW + 1, 1, segW - 2, canvas.height - 2);
        }
    }

    async preloadImages() {
        const images = [
            './imgs/aiP.png',
            './imgs/aiP2.png',
            './imgs/aiP3.png',
            './imgs/aiPa.png',
            './imgs/aiPa2.png',
            './imgs/aiPa3.png',
            './imgs/aiT.png',
            './imgs/aiT2.png',
            './imgs/aiT3.png',
            './imgs/hit.png',
            './imgs/win.png',
            './imgs/rat-dance.gif',
            './imgs/vidas.gif',
            './imgs/Pantalla-chainbreaker.gif',
        ];

        await Promise.all(images.map(src => {
            const img = new Image();
            img.src = src;
            return img.decode();
        }));
        console.log('Images loaded');
    }
}
