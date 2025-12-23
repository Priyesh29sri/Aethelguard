/**
 * AETHELGARD: EVENT HORIZON
 * Main Game Controller
 * 
 * The central hub that orchestrates all game systems.
 */

import * as THREE from 'three';
import { Renderer } from './engine/renderer.js';
import { Nebula } from './engine/nebula.js';
import { AsteroidField } from './engine/asteroids.js';
import { Aurelian } from './ship/aurelian.js';
import { Weapons } from './ship/weapons.js';
import { WaveManager } from './combat/waveManager.js';
import { HandTracker } from './handTracking.js';
import { HUD } from './ui/hud.js';
import { SoundManager } from './audio/soundManager.js';

class Game {
    constructor() {
        // Game state
        this.state = 'loading'; // loading, permission, menu, playing, paused, gameover
        this.isRunning = false;

        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;

        // Systems (initialized later)
        this.renderer = null;
        this.nebula = null;
        this.asteroids = null;
        this.ship = null;
        this.weapons = null;
        this.waveManager = null;
        this.handTracker = null;
        this.hud = null;
        this.sound = null;

        // Camera follow
        this.cameraOffset = new THREE.Vector3(0, 30, 80);
        this.cameraLookOffset = new THREE.Vector3(0, 0, -100);

        // Tutorial state
        this.tutorialStep = 0;
        this.tutorialComplete = false;

        this.init();
    }

    async init() {
        console.log('🎮 Initializing Aethelgard: Event Horizon...');

        // Initialize systems
        await this.initializeSystems();

        // Setup event listeners
        this.setupEventListeners();

        // Start loading
        await this.load();
    }

    async initializeSystems() {
        // Create renderer
        const canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(canvas);

        // Create environment
        this.nebula = new Nebula(this.renderer.scene);
        this.asteroids = new AsteroidField(this.renderer.scene);

        // Create player ship
        this.ship = new Aurelian(this.renderer.scene);

        // Create weapons
        this.weapons = new Weapons(this.renderer.scene, this.ship);

        // Create wave manager
        this.waveManager = new WaveManager(this.renderer.scene);
        this.waveManager.onWaveComplete = (wave) => this.onWaveComplete(wave);
        this.waveManager.onEnemyKilled = (enemy) => this.onEnemyKilled(enemy);

        // Create hand tracker
        this.handTracker = new HandTracker();

        // Create HUD
        this.hud = new HUD();

        // Create sound manager
        this.sound = new SoundManager();
    }

    setupEventListeners() {
        // Camera permission button
        document.getElementById('enable-camera-btn').addEventListener('click', async () => {
            await this.startHandTracking();
        });

        // Menu buttons
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('tutorial-btn').addEventListener('click', () => {
            this.startTutorial();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            // Settings panel (could be expanded)
            this.sound.toggleMute();
        });

        // Tutorial navigation
        document.getElementById('tutorial-next').addEventListener('click', () => {
            this.nextTutorialStep();
        });

        document.getElementById('tutorial-prev').addEventListener('click', () => {
            this.prevTutorialStep();
        });

        document.getElementById('tutorial-close').addEventListener('click', () => {
            this.closeTutorial();
            this.startGame();
        });

        // Pause menu
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resume();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.returnToMenu();
        });

        // Game over buttons
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.returnToMenu();
        });

        // Keyboard controls (fallback)
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Visibility change (pause when tab hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state === 'playing') {
                this.pause();
            }
        });
    }

    async load() {
        // Simulate loading (in real app, would load assets)
        const loadingBar = document.querySelector('.loading-bar');
        const loadingText = document.querySelector('.loading-text');

        const loadingSteps = [
            { progress: 20, text: 'INITIALIZING NEURAL LINK...' },
            { progress: 40, text: 'CALIBRATING HAND SENSORS...' },
            { progress: 60, text: 'GENERATING NEBULA...' },
            { progress: 80, text: 'LOADING THE AURELIAN...' },
            { progress: 100, text: 'SYSTEMS ONLINE' }
        ];

        for (const step of loadingSteps) {
            loadingBar.style.width = `${step.progress}%`;
            loadingText.textContent = step.text;
            await this.delay(600);
        }

        await this.delay(500);

        // Show permission screen
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('permission-screen').classList.remove('hidden');
        this.state = 'permission';
    }

    async startHandTracking() {
        const video = document.getElementById('hand-video');
        const canvas = document.getElementById('hand-overlay');

        await this.handTracker.initialize(video, canvas);
        const success = await this.handTracker.start();

        if (success) {
            // Setup hand tracking callback
            this.handTracker.onHandUpdate = (data) => this.onHandUpdate(data);
            this.handTracker.onGestureChange = (gesture, prev) => this.onGestureChange(gesture, prev);

            // Resume audio context
            await this.sound.resume();

            // Show main menu
            document.getElementById('permission-screen').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
            this.state = 'menu';

            // Start menu background animation
            this.startMenuBackground();
        } else {
            alert('Camera access is required to play. Please refresh and allow camera access.');
        }
    }

    startMenuBackground() {
        // Create animated nebula for menu
        const menuCanvas = document.getElementById('menu-bg-canvas');
        const ctx = menuCanvas.getContext('2d');

        menuCanvas.width = window.innerWidth;
        menuCanvas.height = window.innerHeight;

        const stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * menuCanvas.width,
                y: Math.random() * menuCanvas.height,
                size: Math.random() * 2,
                speed: 0.1 + Math.random() * 0.3
            });
        }

        const animateMenu = () => {
            if (this.state !== 'menu') return;

            ctx.fillStyle = 'rgba(10, 10, 18, 0.1)';
            ctx.fillRect(0, 0, menuCanvas.width, menuCanvas.height);

            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.random() * 0.5})`;
                ctx.fill();

                star.y += star.speed;
                if (star.y > menuCanvas.height) {
                    star.y = 0;
                    star.x = Math.random() * menuCanvas.width;
                }
            });

            requestAnimationFrame(animateMenu);
        };

        animateMenu();
    }

    startGame() {
        console.log('🚀 Starting game...');

        // Hide menu, show game
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');

        // Reset game state
        this.ship.hull = this.ship.maxHull;
        this.ship.shield = this.ship.maxShield;
        this.ship.energy = this.ship.maxEnergy;
        this.ship.position.set(0, 0, 0);
        this.ship.velocity.set(0, 0, 0);

        this.hud.reset();
        this.waveManager.cleanup();
        this.weapons.cleanup();

        // Start first wave
        this.waveManager.startWave(1);
        this.hud.updateWave(1);

        // Start music
        this.sound.startMusic();
        this.sound.play('waveStart');

        // Start game loop
        this.state = 'playing';
        this.isRunning = true;
        this.lastTime = performance.now();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    startTutorial() {
        document.getElementById('tutorial-overlay').classList.remove('hidden');
        this.tutorialStep = 0;
        this.updateTutorialStep();
    }

    nextTutorialStep() {
        const totalSteps = 5;
        if (this.tutorialStep < totalSteps - 1) {
            this.tutorialStep++;
            this.updateTutorialStep();
        }
    }

    prevTutorialStep() {
        if (this.tutorialStep > 0) {
            this.tutorialStep--;
            this.updateTutorialStep();
        }
    }

    updateTutorialStep() {
        const steps = document.querySelectorAll('.tutorial-step');
        steps.forEach((step, i) => {
            step.classList.toggle('active', i === this.tutorialStep);
        });
    }

    closeTutorial() {
        document.getElementById('tutorial-overlay').classList.add('hidden');
        this.tutorialComplete = true;
    }

    gameLoop(time) {
        if (!this.isRunning) return;

        // Calculate delta time
        this.deltaTime = Math.min(time - this.lastTime, 100); // Cap at 100ms
        this.lastTime = time;

        if (this.state === 'playing') {
            this.update(this.deltaTime);
        }

        // Render
        this.renderer.render(this.deltaTime);

        // Continue loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        // Get current gesture and aim from hand tracker
        const gesture = this.handTracker.currentGesture;
        const aimPosition = this.handTracker.smoothAimPosition;

        // Update ship
        this.ship.update(deltaTime, gesture, aimPosition);

        // Handle weapon firing
        if (gesture === 'FIRE_PRIMARY') {
            if (this.weapons.firePrimary()) {
                this.sound.play('railgun');
            }
        } else if (gesture === 'FIRE_SECONDARY') {
            if (this.weapons.currentWeapon !== 'harpoon') {
                this.weapons.selectWeapon('harpoon');
            }
            if (this.weapons.firePrimary()) {
                this.sound.play('explosion', { size: 0.5 });
            }
        }

        // Update weapons
        const enemies = this.waveManager.getEnemies();
        this.weapons.update(deltaTime, enemies);

        // Update wave manager
        this.waveManager.update(deltaTime, this.ship, this.weapons);

        // Update environment
        this.nebula.update(deltaTime);
        this.asteroids.update(deltaTime, this.ship.position);

        // Check asteroid collisions
        const asteroidHit = this.asteroids.checkCollision(this.ship.position, 30);
        if (asteroidHit) {
            if (this.ship.takeDamage(10)) {
                this.gameOver();
            }
            this.sound.play('hit');
            this.hud.showDamageIndicator();
        }

        // Update camera
        this.updateCamera();

        // Update HUD
        this.hud.update(deltaTime);
        this.hud.updateShipStatus(this.ship.getStats());
        this.hud.updateSpeed(this.ship.getSpeed());
        this.hud.updateGesture(
            this.handTracker.getGestureIcon(),
            this.handTracker.getGestureName()
        );

        // Update radar
        this.hud.updateRadar(
            this.ship.position,
            this.ship.rotation,
            this.waveManager.getRadarData(),
            this.asteroids.getNearbyAsteroids(this.ship.position, 2000)
        );

        // Update weapon cooldowns
        this.hud.updateWeapons(
            this.weapons.currentWeapon,
            {
                railgun: this.weapons.getCooldownProgress('railgun'),
                laser: this.weapons.getCooldownProgress('laser'),
                harpoon: this.weapons.getCooldownProgress('harpoon')
            }
        );

        // Check game over
        if (this.ship.hull <= 0) {
            this.gameOver();
        }

        // Check wave complete
        if (this.waveManager.isWaveComplete()) {
            // Brief delay then start next wave
            if (!this.waveTransitioning) {
                this.waveTransitioning = true;
                setTimeout(() => {
                    this.waveManager.startWave();
                    this.hud.updateWave(this.waveManager.currentWave);
                    this.sound.play('waveStart');
                    this.waveTransitioning = false;
                }, 3000);
            }
        }
    }

    updateCamera() {
        // Third-person follow camera
        const shipPos = this.ship.position;
        const shipQuat = this.ship.quaternion;

        // Calculate desired camera position
        const offset = this.cameraOffset.clone().applyQuaternion(shipQuat);
        const targetCamPos = shipPos.clone().add(offset);

        // Smooth camera movement
        this.renderer.camera.position.lerp(targetCamPos, 0.05);

        // Camera look at point ahead of ship
        const lookOffset = this.cameraLookOffset.clone().applyQuaternion(shipQuat);
        const lookTarget = shipPos.clone().add(lookOffset);
        this.renderer.camera.lookAt(lookTarget);
    }

    onHandUpdate(data) {
        // Update hand status indicators
        const leftIndicator = document.querySelector('.hand-indicator.left-hand');
        const rightIndicator = document.querySelector('.hand-indicator.right-hand');

        if (leftIndicator) {
            leftIndicator.classList.toggle('detected', data.leftHand !== null);
            leftIndicator.querySelector('.hand-state').textContent =
                data.leftHand ? 'LINKED' : 'SEARCHING...';
        }

        if (rightIndicator) {
            rightIndicator.classList.toggle('detected', data.rightHand !== null);
            rightIndicator.querySelector('.hand-state').textContent =
                data.rightHand ? 'LINKED' : 'SEARCHING...';
        }
    }

    onGestureChange(gesture, previousGesture) {
        // Play feedback sounds
        switch (gesture) {
            case 'THRUST':
                this.sound.play('thrust');
                break;
            case 'BOOST':
                this.sound.play('boost');
                break;
            case 'SHIELD':
                this.sound.play('shield');
                break;
            case 'BARREL_ROLL':
                this.sound.play('boost');
                this.renderer.shake(0.5, 300);
                break;
        }
    }

    onWaveComplete(wave) {
        console.log(`✅ Wave ${wave} complete!`);
        this.hud.addScore(1000 * wave);
        this.sound.play('powerup');
    }

    onEnemyKilled(enemy) {
        // Calculate score based on enemy type
        const scores = {
            vanguard: 300,
            hunter: 200,
            coward: 100
        };

        this.hud.addScore(scores[enemy.type] || 100);
        this.hud.incrementCombo();
        this.sound.play('explosion', { size: 1 });
        this.renderer.shake(0.3, 200);
    }

    pause() {
        if (this.state !== 'playing') return;

        this.state = 'paused';
        document.getElementById('pause-menu').classList.remove('hidden');
    }

    resume() {
        if (this.state !== 'paused') return;

        this.state = 'playing';
        document.getElementById('pause-menu').classList.add('hidden');
    }

    gameOver() {
        console.log('💀 Game Over');

        this.state = 'gameover';
        this.sound.stopMusic();
        this.sound.play('explosion', { size: 2 });

        // Show game over screen with stats
        this.hud.showGameOver(
            this.hud.score,
            this.waveManager.currentWave,
            this.waveManager.totalKills
        );

        // Screen shake
        this.renderer.shake(2, 1000);
    }

    restart() {
        this.hud.hideGameOver();
        this.startGame();
    }

    returnToMenu() {
        this.state = 'menu';
        this.isRunning = false;

        // Clean up game state
        this.waveManager.cleanup();
        this.weapons.cleanup();
        this.sound.stopMusic();

        // Hide game screens
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');

        // Show menu
        document.getElementById('main-menu').classList.remove('hidden');
        this.startMenuBackground();
    }

    onKeyDown(e) {
        // Keyboard fallback controls
        switch (e.key.toLowerCase()) {
            case 'escape':
                if (this.state === 'playing') {
                    this.pause();
                } else if (this.state === 'paused') {
                    this.resume();
                }
                break;
            case 'm':
                this.sound.toggleMute();
                break;
            case '1':
                this.weapons.selectWeapon('railgun');
                break;
            case '2':
                this.weapons.selectWeapon('laser');
                break;
            case '3':
                this.weapons.selectWeapon('harpoon');
                break;
        }
    }

    onKeyUp(e) {
        // Handle key releases if needed
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

export default Game;
