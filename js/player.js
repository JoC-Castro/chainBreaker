import { wait } from "./main.js";

export class Player {
    vidas = 3;
    puntaje = 0;
    ganador = 100;
    dificultad = 1;
    combo = false;
    comboCount = 0;

    constructor(ui, audio) {
        this.ui = ui;
        this.audio = audio;
    }

    // Difficulty scaling 

    async handleDifficulty() {
        if (this.puntaje >= 20 && this.dificultad === 1) {
            this.dificultad = 2;
            this.audio.play('powerUp1', { volume: 0.3 });
            this.ui.setTexto('...a bit faster');
            this.audio.setRateSmooth('main', 1.1, 2);
            await wait(2000);

            if (this.comboCount > 1) {
                this.ui.setTexto(`combo <b>&nbsp;x${this.comboCount}</b>!`);

            } else {
                this.ui.setTexto('');
            }

        } else if (this.puntaje >= 50 && this.dificultad === 2) {
            this.dificultad = 3;
            this.audio.play('powerUp2', { volume: 0.3 });
            this.ui.setTexto('ENOUGH!');
            this.audio.setRateSmooth('main', 1.2, 2);
            await wait(2000);

            if (this.comboCount > 1) {
                this.ui.setTexto(`combo <b>&nbsp;x${this.comboCount}</b>!`);

            } else {
                this.ui.setTexto('');
            }
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
}
