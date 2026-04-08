export class AudioManager {
    #audioCtx = new AudioContext();
    #buffers = {};
    #sources = {};

    async preload() {
        const files = {
            intro: './audio/introChain.wav',
            main: './audio/mainChain.wav',
            break: './audio/break.wav',
            ending: './audio/endingChain.wav',
            hurt1: './audio/hurt1.mp3',
            hurt2: './audio/hurt2.mp3',
            hit: './audio/hit.mp3',
            powerUp1: './audio/Creepy1.mp3',
            powerUp2: './audio/Creepy2.mp3',
            combo: './audio/comboHit.mp3',
            combo2: './audio/comboHit2.mp3',
            bonus: './audio/bonus.mp3',
        };

        for (const [name, path] of Object.entries(files)) {
            const res = await fetch(path);
            const arr = await res.arrayBuffer();
            this.#buffers[name] = await this.#audioCtx.decodeAudioData(arr);
        }

        console.log('Audio cargado');
    }

    resumeContext() {
        if (this.#audioCtx.state === 'suspended') this.#audioCtx.resume();
    }

    play(name, { loop = false, volume = 0.1, fadeIn = 0, when = null } = {}) {
        this.resumeContext();

        if (this.#sources[name]) {
            this.#sources[name].source.stop();
            delete this.#sources[name];
        }

        const buffer = this.#buffers[name];
        if (!buffer) return;

        const startAt = when ?? this.#audioCtx.currentTime;
        const source = this.#audioCtx.createBufferSource();
        const gain = this.#audioCtx.createGain();

        source.buffer = buffer;
        source.loop = loop;

        gain.gain.setValueAtTime(0, startAt);
        gain.gain.linearRampToValueAtTime(volume, startAt + fadeIn);

        source.connect(gain);
        gain.connect(this.#audioCtx.destination);
        source.start(startAt);

        this.#sources[name] = { source, gain, startTime: startAt, buffer };

        return source;
    }

    fadeOut(name, fadeTime = 1) {
        const audio = this.#sources[name];
        if (!audio) return Promise.resolve();

        const { source, gain } = audio;
        const now = this.#audioCtx.currentTime;

        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + fadeTime);

        return new Promise(resolve => {
            source.stop(now + fadeTime);
            source.onended = () => {
                delete this.#sources[name];
                resolve();
            };
        });
    }

    stop(name) {
        const audio = this.#sources[name];
        if (!audio) return;

        try { audio.source.stop(); } catch { }
        delete this.#sources[name];
    }

    finishLoop(name, callback) {
        const audio = this.#sources[name];
        if (!audio) return;

        const { source, buffer, startTime } = audio;
        source.loop = false;

        const now = this.#audioCtx.currentTime;
        const elapsed = now - startTime;
        const timeIntoLoop = elapsed % buffer.duration;
        const remaining = buffer.duration - timeIntoLoop;

        source.stop(now + remaining);
        source.onended = () => {
            delete this.#sources[name];
            callback?.();
        };
    }
}
