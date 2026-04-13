import { wait } from "./main.js";

export class Player {
    vidas = 3;
    puntaje = 0;
    ganador = 130;
    dificultad = 1;
    combo = false;
    comboCount = 0;

    constructor(ui, audio) {
        this.ui = ui;
        this.audio = audio;
    }

    // Difficulty scaling 

    async handleDifficulty() {
        // TUTORIAL
        // 1
        if (this.puntaje >= 10 && this.dificultad === 1) {
            await this.difficultyHandler(2, 'let\'s change things up', 1.01);
            return;
        }
        // 2
        if (this.puntaje >= 20 && this.dificultad === 2) {
            await this.difficultyHandler(3, 'new tricks?', 1.02);
            return;
        }
        // 3
        if (this.puntaje >= 30 && this.dificultad === 3) {
            await this.difficultyHandler(4, 'enough games', 1.05);
            return;
        }
        // stage 1
        if (this.puntaje >= 66 && this.dificultad === 4) {
            await this.difficultyHandler(5, '...a bit faster', 1.1);
            return;
        }
        // stage 2
        if (this.puntaje >= 99 && this.dificultad === 5) {
            await this.difficultyHandler(6, 'ENOUGH!', 1.15);
            return;
        }
    }

    // Initial render 

    reset() {
        this.vidas = 3;
        this.puntaje = 0;
        this.dificultad = 1;
        this.resetCombo();
    }

    initLives() {
        this.ui.renderPlayerLives(this.vidas);
    }

    initEnemyBar() {
        this.ui.renderEnemyHPBar(this.ganador, this.ganador);
    }

    // Round outcomes 

    async lose() {
        this.resetCombo();

        if (this.vidas <= 0) return;

        const wasLastLife = this.vidas === 1;
        this.vidas--;
        this.ui.removeLastLife();

        if (!wasLastLife) {
            const num = Math.floor(Math.random() * 2) + 1;
            this.audio.play(`hurt${num}`);
        }

        this.ui.setEnemigoSrc('./imgs/hit.png');
        if (wasLastLife) return;
        await wait(666);
    }

    async win() {
        if (this.combo) {
            this.comboCount++;
            const pitchShift = Math.min(this.comboCount * 60, 1200);

            if (this.comboCount % 5 === 0) {
                this.audio.play('combo2', { volume: 0.18, fadeIn: 0.05 });
                this.puntaje += Math.ceil(this.comboCount / 2);


                if (this.vidas < 5) {
                    this.vidas++;
                    this.ui.renderPlayerLives(this.vidas);
                }
            } else {
                this.audio.play('combo', { volume: 0.11, fadeIn: 0.05, detune: pitchShift });
                this.puntaje += 2;
            }

            this.combo = false;
            if (this.comboCount > 1) {
                this.ui.setTexto(`combo <b>&nbsp;x${this.comboCount}</b>!`);
            }
        } else {
            this.audio.play('hit', { volume: 0.08, fadeIn: 0.05 });
            this.puntaje++;
            this.resetCombo();
        }
        this.ui.renderEnemyHPBar(Math.max(0, this.ganador - this.puntaje), this.ganador);
        await wait(100);
    }

    resetCombo() {
        this.combo = false;
        this.comboCount = 0;
        this.ui.setTexto('');
    }

    comboHandler() {
        if (this.comboCount > 1) {
            this.ui.setTexto(`combo <b>&nbsp;x${this.comboCount}</b>!`);

        } else {
            this.ui.setTexto('');
        }
    }

    async difficultyHandler(dificultad, texto, rate) {
        this.dificultad = dificultad

        const pitchShift = Math.min(this.dificultad * 60, 1200);
        this.audio.play('powerUp1', { volume: 0.3, detune: pitchShift });
        this.ui.setTexto(texto);
        this.audio.setRateSmooth('main', rate, 2);

        await wait(2000);
        this.comboHandler();
    }
}
