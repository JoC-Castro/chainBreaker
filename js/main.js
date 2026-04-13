import { AudioManager } from "./audio.js";
import { UI } from "./ui.js";
import { Player } from "./player.js";
//---------------------------------------------------

const audio = new AudioManager();
const ui = new UI();
const player = new Player(ui, audio);

window.addEventListener('load', async () => {
    await audio.preload();
    await ui.preloadImages();
    ui.loading.hidden = false;
    ui.loadingDOM.style.display = 'none';

    // Loading screen → click to start
    window.addEventListener('click', () => {
        inputUnlocked = true;
        ui.showMain();
        audio.resumeContext();
        audio.play('intro', { loop: true });
    }, { once: true });
});

// Game state 

const vencerMapa = {
    piedra: 'tijera',
    papel: 'piedra',
    tijera: 'papel',
};

let opcionJugador = null;
let opcionEnemigo = null;
let ultimaOpcionEnemigo = null;
let inputUnlocked = false;
let gameState = false;
let gameEnded = false;
let primeraOpcion = Math.floor(Math.random() * 3);
let segundaOpcion = (primeraOpcion + 1) % 3;
let terceraOpcion = (segundaOpcion + 1) % 3;


// Space bar → begin game 

window.addEventListener('keydown', async (e) => {
    if (!inputUnlocked) return;
    if (e.key === ' ' && !e.repeat && !gameState) {
        gameState = true;

        audio.finishLoop('intro', (endTime) => {
            if (!gameEnded) audio.play('main', { loop: true, when: endTime });
        });

        player.initLives();
        player.initEnemyBar();
        ui.setTexto(flavorText());
        await wait(2500);
        ui.setTexto('');
        ui.setButtonsDisabled(false);
        mainGameLoop();
    }
});

// Main game loop 

const mainGameLoop = async () => {
    const controlador = new AbortController();
    await player.handleDifficulty();

    ui.setEnemigoSrc('./imgs/idle.png');
    if (player.dificultad > 4) {
        await wait(Math.max(400 - (player.dificultad * 100 / 6), (Math.random() * 1000)));
    } else {
        await wait(Math.max(400, (Math.random() * 1000)));
    }

    aiSeleccion(opcionAleatoria(3));
    const tiempo = timeOut(1540);
    console.log(tiempo);

    const empezarTiempo = performance.now();

    const resultado = await Promise.race([
        resolverClick(controlador.signal).then(() => 'click'),
        resolverTiempo(tiempo, controlador.signal).then(() => 'timeout'),
    ]);

    const tiempoReaccion = performance.now() - empezarTiempo;
    if (resultado === 'click' && tiempoReaccion <= 450) {
        player.combo = true;
    }

    controlador.abort();
    await ronda();
    opcionJugador = null;
    opcionEnemigo = null;

    if (player.vidas === 0) {
        gameOver();
    } else if (player.puntaje >= player.ganador) {
        gameWin();
    } else {
        mainGameLoop();
    }
};

// Round resolution 

const ronda = async () => {
    if (opcionJugador === null) {
        await player.lose();                            // timed out

    } else if (vencerMapa[opcionJugador] === opcionEnemigo) {
        await player.win();                                   // correct choice

    } else {
        await player.lose();                            // wrong choice
    }
};

// Input handling 

const resolverClick = (signal) => {
    return new Promise((resolve) => {
        const handler = (e) => {
            if (signal?.aborted) return;
            if (e.repeat) return;
            switch (e.code) {
                case 'KeyA': opcionJugador = 'piedra'; ui.btnAnimacion(ui.b1); break;
                case 'KeyS': opcionJugador = 'papel'; ui.btnAnimacion(ui.b2); break;
                case 'KeyD': opcionJugador = 'tijera'; ui.btnAnimacion(ui.b3); break;
                default: return;
            }
            resolve();
        };

        window.addEventListener('keydown', handler);
        signal.addEventListener('abort', () => window.removeEventListener('keydown', handler), { once: true });
    });
};

const resolverTiempo = (ms, signal) => {
    return new Promise((resolve) => {
        const timer = setTimeout(resolve, ms);
        signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
    });
};

// Timing & difficulty 

const timeOut = (base) => {
    // BACKUP: const result = base - player.puntaje * 15;
    if (player.puntaje < 30) return base;
    const result = base - (player.puntaje - 30) * 10;
    return Math.max(0, result);
};

export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// AI move selection 

const AI_IMAGES = {
    piedra: ['./imgs/aiP.png', './imgs/aiP2.png', './imgs/aiP3.png'],
    papel: ['./imgs/aiPa.png', './imgs/aiPa2.png', './imgs/aiPa3.png'],
    tijera: ['./imgs/aiT.png', './imgs/aiT2.png', './imgs/aiT3.png'],
};

const MOVES = ['piedra', 'papel', 'tijera'];

const getVariantePool = (dificultad) => {

    // Tutorial phase
    if (dificultad === 1) return [0];
    if (dificultad === 2) return [1];
    if (dificultad === 3) return [2];
    // Main game
    if (dificultad === 4) return [primeraOpcion, segundaOpcion];
    if (dificultad === 5) return [segundaOpcion, terceraOpcion];
    return [0, 1, 2];
};

const aiSeleccion = (num) => {
    // Avoid repeating the same move twice in a row
    if (num === ultimaOpcionEnemigo && ultimaOpcionEnemigo !== null) {
        return aiSeleccion(opcionAleatoria(3));
    }

    const move = MOVES[num - 1];
    const pool = getVariantePool(player.dificultad);
    const variante = pool[Math.floor(Math.random() * pool.length)];

    ui.setEnemigoSrc(AI_IMAGES[move][variante]);
    opcionEnemigo = move;
    ultimaOpcionEnemigo = num;
};

const opcionAleatoria = (max) => Math.floor(Math.random() * max) + 1;

// End states 

const gameOver = () => {
    gameEnded = true;
    ui.setTexto('you lose, the game will restart in 5 seconds');
    ui.setEnemigoSrc('./imgs/lose.png');
    ui.setButtonsDisabled(true);

    audio.fadeOut('main', 0.5);
    audio.play('break');
    audio.play('ending', { fadeIn: 1 });

    setTimeout(() => restartGame(), 5000);
};

const gameWin = async () => {
    gameEnded = true;
    ui.setTexto('you win, the game will restart in 5 seconds');
    ui.setEnemigoSrc('./imgs/win.png');
    ui.setButtonsDisabled(true);

    audio.fadeOut('main', 1);
    audio.play('break');
    audio.play('ending', { fadeIn: 1 });

    await wait(5000);
    ui.setTexto('wait...');
    ui.setEnemigoSrc('');
    audio.play('bonus', { fadeIn: 1 });
    await wait(6500);
    ui.setTexto('OH SHIT! A RAT!');
    ui.setEnemigoSrc('./imgs/rat-dance.gif');

    setTimeout(() => restartGame(), 15000);
};

const restartGame = () => {
    opcionJugador = null;
    opcionEnemigo = null;
    ultimaOpcionEnemigo = null;
    inputUnlocked = false;
    gameState = false;
    gameEnded = false;
    primeraOpcion = Math.floor(Math.random() * 3);
    segundaOpcion = (primeraOpcion + 1) % 3;
    terceraOpcion = (segundaOpcion + 1) % 3;

    player.reset();
    ui.reset();

    audio.fadeOut('ending', 1.5);
    audio.fadeOut('bonus', 1.5);

    // Loading screen → click to start
    window.addEventListener('click', () => {
        inputUnlocked = true;
        ui.showMain();
        audio.resumeContext();
        audio.play('intro', { loop: true });
    }, { once: true });
};
const flavorText = () => {
    const texts = [
        `i am the breaker of chains`,
        `at least you chose how you fall`,
        `your fate is but a laugh`,
        `whisper your prayers`,
        `entertain me`,
    ];
    return texts[Math.floor(Math.random() * texts.length)];
}




// To do
// teach the player the moves before it actually gets hard
// explore extra mechanics:
// -show biggest combo
// -clutch mechanic (1 hp left)
// -replayability???
// improve win/loss screen
// animation or image: lose and idle/neutral
// testing and balancing
// finalize art, backgrounds, borders, styles

// v0.2.6
// retail.development.hotfix