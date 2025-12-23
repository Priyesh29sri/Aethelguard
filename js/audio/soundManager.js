/**
 * AETHELGARD: EVENT HORIZON
 * Sound Manager Module
 * 
 * Handles all audio including music and sound effects.
 * Uses procedurally generated sounds for instant availability.
 */

export class SoundManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.5;
        this.muted = false;

        // Audio context for procedural sounds
        this.audioContext = null;

        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Sound manager initialized');
        } catch (e) {
            console.warn('Audio context not available');
        }
    }

    /**
     * Resume audio context (needed for user interaction)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Play a procedural sound effect
     */
    play(soundName, options = {}) {
        if (this.muted || !this.audioContext) return;

        const volume = (options.volume || 1) * this.sfxVolume * this.masterVolume;

        switch (soundName) {
            case 'railgun':
                this.playRailgunSound(volume);
                break;
            case 'laser':
                this.playLaserSound(volume);
                break;
            case 'explosion':
                this.playExplosionSound(volume, options.size || 1);
                break;
            case 'hit':
                this.playHitSound(volume);
                break;
            case 'shield':
                this.playShieldSound(volume);
                break;
            case 'thrust':
                this.playThrustSound(volume);
                break;
            case 'boost':
                this.playBoostSound(volume);
                break;
            case 'powerup':
                this.playPowerupSound(volume);
                break;
            case 'warning':
                this.playWarningSound(volume);
                break;
            case 'waveStart':
                this.playWaveStartSound(volume);
                break;
        }
    }

    /**
     * Railgun firing sound
     */
    playRailgunSound(volume) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // High-frequency burst
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

        gain.gain.setValueAtTime(volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);

        // Click/impact layer
        this.playNoise(0.05, volume * 0.5, 2000, 8000);
    }

    /**
     * Laser beam sound
     */
    playLaserSound(volume) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Continuous hum
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(460, now + 0.1);
        osc.frequency.setValueAtTime(440, now + 0.2);

        gain.gain.setValueAtTime(volume * 0.2, now);
        gain.gain.setValueAtTime(volume * 0.2, now + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    /**
     * Explosion sound
     */
    playExplosionSound(volume, size = 1) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const duration = 0.3 + size * 0.2;

        // Deep boom
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(80 / size, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + duration);

        gain.gain.setValueAtTime(volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);

        // Noise layer
        this.playNoise(duration, volume * 0.3, 100, 4000);
    }

    /**
     * Hit/damage sound
     */
    playHitSound(volume) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Sharp impact
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

        gain.gain.setValueAtTime(volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    /**
     * Shield activation sound
     */
    playShieldSound(volume) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Rising chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(400, now);
        osc1.frequency.linearRampToValueAtTime(800, now + 0.3);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, now);
        osc2.frequency.linearRampToValueAtTime(1200, now + 0.3);

        gain.gain.setValueAtTime(volume * 0.2, now);
        gain.gain.setValueAtTime(volume * 0.2, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
    }

    /**
     * Engine thrust sound
     */
    playThrustSound(volume) {
        // This would be looped in a real implementation
        this.playNoise(0.1, volume * 0.1, 50, 500);
    }

    /**
     * Boost sound
     */
    playBoostSound(volume) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Whoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);

        this.playNoise(0.5, volume * 0.2, 200, 2000);
    }

    /**
     * Powerup collected sound
     */
    playPowerupSound(volume) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Ascending arpegio
        const notes = [400, 500, 600, 800];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            const startTime = now + i * 0.08;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume * 0.2, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.2);
        });
    }

    /**
     * Warning/alert sound
     */
    playWarningSound(volume) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Pulsing alarm
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.value = 600;

            const startTime = now + i * 0.2;
            gain.gain.setValueAtTime(volume * 0.2, startTime);
            gain.gain.setValueAtTime(volume * 0.2, startTime + 0.1);
            gain.gain.setValueAtTime(0, startTime + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.1);
        }
    }

    /**
     * Wave start sound
     */
    playWaveStartSound(volume) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Dramatic horn
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.setValueAtTime(150, now + 0.3);
        osc1.frequency.linearRampToValueAtTime(200, now + 0.5);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(300, now);
        osc2.frequency.setValueAtTime(300, now + 0.3);
        osc2.frequency.linearRampToValueAtTime(400, now + 0.5);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.1);
        gain.gain.setValueAtTime(volume * 0.3, now + 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1);
        osc2.stop(now + 1);
    }

    /**
     * Play filtered noise
     */
    playNoise(duration, volume, lowFreq, highFreq) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Create noise buffer
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = (lowFreq + highFreq) / 2;
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + duration);
    }

    /**
     * Start ambient music loop (procedural)
     */
    startMusic() {
        if (!this.audioContext) return;

        // Ambient drone
        this.musicOscillators = [];
        const ctx = this.audioContext;

        const createDrone = (freq, volume) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.value = freq;

            filter.type = 'lowpass';
            filter.frequency.value = 500;

            gain.gain.value = volume * this.musicVolume * this.masterVolume;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start();

            this.musicOscillators.push({ osc, gain });
        };

        // Deep drones
        createDrone(55, 0.1);   // A1
        createDrone(82.5, 0.08); // E2
        createDrone(110, 0.06); // A2
    }

    /**
     * Stop music
     */
    stopMusic() {
        if (this.musicOscillators) {
            this.musicOscillators.forEach(({ osc }) => {
                try {
                    osc.stop();
                } catch (e) { }
            });
            this.musicOscillators = [];
        }
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        this.muted = !this.muted;

        if (this.muted) {
            this.stopMusic();
        } else {
            this.startMusic();
        }

        return this.muted;
    }
}

export default SoundManager;
