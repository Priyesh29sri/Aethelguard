/**
 * AETHELGARD: EVENT HORIZON
 * HUD Module
 * 
 * Manages the heads-up display and UI elements.
 */

export class HUD {
    constructor() {
        // DOM Elements
        this.elements = {
            // Status bars
            hullBar: document.getElementById('hull-bar'),
            hullValue: document.getElementById('hull-value'),
            shieldBar: document.getElementById('shield-bar'),
            shieldValue: document.getElementById('shield-value'),
            energyBar: document.getElementById('energy-bar'),
            energyValue: document.getElementById('energy-value'),

            // Score
            scoreValue: document.getElementById('score-value'),
            comboValue: document.getElementById('combo-value'),
            waveValue: document.getElementById('wave-value'),

            // Speed
            speedValue: document.getElementById('speed-value'),

            // Gesture
            gestureIcon: document.getElementById('current-gesture'),
            gestureName: document.getElementById('gesture-name'),

            // Weapons
            weapons: [
                document.getElementById('weapon-1'),
                document.getElementById('weapon-2'),
                document.getElementById('weapon-3')
            ],

            // Gadgets
            gadgets: [
                document.getElementById('gadget-1'),
                document.getElementById('gadget-2'),
                document.getElementById('gadget-3')
            ],

            // Crosshair
            crosshair: document.getElementById('crosshair'),

            // Radar
            radar: document.getElementById('radar')
        };

        // State
        this.score = 0;
        this.combo = 1;
        this.comboTimer = 0;
        this.maxCombo = 1;

        // Radar blips
        this.radarBlips = [];

        // Animations queue
        this.animations = [];

        this.init();
    }

    init() {
        console.log('📊 HUD initialized');
    }

    /**
     * Update ship status bars
     */
    updateShipStatus(stats) {
        // Hull
        const hullPercent = (stats.hull / stats.maxHull) * 100;
        this.elements.hullBar.style.width = `${hullPercent}%`;
        this.elements.hullValue.textContent = `${Math.round(hullPercent)}%`;

        // Color based on health
        if (hullPercent < 25) {
            this.elements.hullBar.style.background = 'linear-gradient(90deg, #ff0000, #ff3333)';
            this.pulseElement(this.elements.hullBar.parentElement);
        } else if (hullPercent < 50) {
            this.elements.hullBar.style.background = 'linear-gradient(90deg, #ff6600, #ffaa00)';
        }

        // Shield
        const shieldPercent = (stats.shield / stats.maxShield) * 100;
        this.elements.shieldBar.style.width = `${shieldPercent}%`;
        this.elements.shieldValue.textContent = `${Math.round(shieldPercent)}%`;

        // Energy
        const energyPercent = (stats.energy / stats.maxEnergy) * 100;
        this.elements.energyBar.style.width = `${energyPercent}%`;
        this.elements.energyValue.textContent = `${Math.round(energyPercent)}%`;
    }

    /**
     * Update speed indicator
     */
    updateSpeed(speed) {
        this.elements.speedValue.textContent = speed;
    }

    /**
     * Update gesture display
     */
    updateGesture(icon, name) {
        this.elements.gestureIcon.textContent = icon;
        this.elements.gestureName.textContent = name;
    }

    /**
     * Update score
     */
    addScore(points) {
        const scoredPoints = points * this.combo;
        this.score += scoredPoints;
        this.elements.scoreValue.textContent = this.formatNumber(this.score);

        // Reset combo timer
        this.comboTimer = 3000;

        // Show score popup
        this.showScorePopup(scoredPoints);
    }

    /**
     * Increment combo
     */
    incrementCombo() {
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.elements.comboValue.textContent = `x${this.combo}`;

        // Animate combo change
        this.elements.comboValue.classList.add('flash');
        setTimeout(() => {
            this.elements.comboValue.classList.remove('flash');
        }, 300);
    }

    /**
     * Update combo timer
     */
    updateCombo(deltaTime) {
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;

            if (this.comboTimer <= 0) {
                // Reset combo
                this.combo = 1;
                this.elements.comboValue.textContent = 'x1';
            }
        }
    }

    /**
     * Update wave display
     */
    updateWave(wave) {
        this.elements.waveValue.textContent = wave;

        // Animate wave change
        this.showWaveAnnouncement(wave);
    }

    /**
     * Show wave announcement
     */
    showWaveAnnouncement(wave) {
        const announcement = document.createElement('div');
        announcement.className = 'wave-announcement';
        announcement.innerHTML = `
            <div class="wave-label">WAVE</div>
            <div class="wave-number">${wave}</div>
        `;

        announcement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 500;
            font-family: 'Orbitron', sans-serif;
            color: #00f0ff;
            text-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
            animation: waveIn 2s ease forwards;
            pointer-events: none;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes waveIn {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                40% { transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
            }
            .wave-label { font-size: 1.5rem; letter-spacing: 0.5em; }
            .wave-number { font-size: 6rem; font-weight: 900; }
        `;

        document.head.appendChild(style);
        document.body.appendChild(announcement);

        setTimeout(() => {
            announcement.remove();
            style.remove();
        }, 2000);
    }

    /**
     * Show score popup
     */
    showScorePopup(points) {
        const popup = document.createElement('div');
        popup.textContent = `+${this.formatNumber(points)}`;
        popup.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Orbitron', sans-serif;
            font-size: 2rem;
            font-weight: 700;
            color: #ffaa00;
            text-shadow: 0 0 20px rgba(255, 170, 0, 0.5);
            animation: scoreUp 1s ease forwards;
            pointer-events: none;
            z-index: 400;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes scoreUp {
                0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                30% { opacity: 1; }
                100% { opacity: 0; transform: translateX(-50%) translateY(-50px); }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.remove();
            style.remove();
        }, 1000);
    }

    /**
     * Update weapon display
     */
    updateWeapons(currentWeapon, cooldowns) {
        const weaponNames = ['railgun', 'laser', 'harpoon'];

        this.elements.weapons.forEach((el, i) => {
            const isActive = weaponNames[i] === currentWeapon;
            el.classList.toggle('active', isActive);

            // Update cooldown overlay
            const cooldown = cooldowns[weaponNames[i]] || 1;
            const cooldownEl = el.querySelector('.weapon-cooldown');
            if (cooldownEl) {
                cooldownEl.style.transform = `scaleX(${1 - cooldown})`;
            }
        });
    }

    /**
     * Update crosshair position
     */
    updateCrosshair(aimPosition) {
        // Crosshair follows aim but stays centered for now
        // Could be updated to move with aim for more dynamic feel
    }

    /**
     * Update radar with enemy positions
     */
    updateRadar(playerPosition, playerRotation, enemies, asteroids) {
        // Clear old blips
        this.radarBlips.forEach(blip => blip.remove());
        this.radarBlips = [];

        const radarRadius = 50; // Half of radar size
        const radarRange = 2000; // Detection range

        // Add enemy blips
        enemies.forEach(enemy => {
            const blip = this.createRadarBlip(
                playerPosition,
                playerRotation,
                enemy.position,
                radarRadius,
                radarRange,
                this.getEnemyColor(enemy.type)
            );

            if (blip) {
                this.elements.radar.appendChild(blip);
                this.radarBlips.push(blip);
            }
        });

        // Add asteroid blips (limited to closest)
        const sortedAsteroids = asteroids
            .map(a => ({ ...a, distance: playerPosition.distanceTo(a.position) }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10);

        sortedAsteroids.forEach(asteroid => {
            const blip = this.createRadarBlip(
                playerPosition,
                playerRotation,
                asteroid.position,
                radarRadius,
                radarRange,
                '#666666'
            );

            if (blip) {
                blip.style.opacity = '0.5';
                this.elements.radar.appendChild(blip);
                this.radarBlips.push(blip);
            }
        });
    }

    /**
     * Create a radar blip
     */
    createRadarBlip(playerPos, playerRot, targetPos, radarRadius, range, color) {
        const relative = targetPos.clone().sub(playerPos);
        const distance = relative.length();

        if (distance > range) return null;

        // Rotate relative position by player rotation (simplified 2D)
        const angle = Math.atan2(relative.x, -relative.z) - playerRot.y;
        const normalizedDist = Math.min(distance / range, 1);

        const x = Math.sin(angle) * normalizedDist * radarRadius;
        const y = -Math.cos(angle) * normalizedDist * radarRadius;

        const blip = document.createElement('div');
        blip.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            background: ${color};
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(${x}px, ${y}px);
            box-shadow: 0 0 5px ${color};
        `;

        return blip;
    }

    /**
     * Get color for enemy type
     */
    getEnemyColor(type) {
        const colors = {
            vanguard: '#ff3300',
            hunter: '#00ff88',
            coward: '#ffff00'
        };
        return colors[type] || '#ff0000';
    }

    /**
     * Show damage indicator
     */
    showDamageIndicator(direction = 'all') {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 300;
            animation: damageFlash 0.3s ease;
        `;

        if (direction === 'all') {
            overlay.style.boxShadow = 'inset 0 0 100px rgba(255, 0, 0, 0.5)';
        }

        const style = document.createElement('style');
        style.textContent = `
            @keyframes damageFlash {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.remove();
            style.remove();
        }, 300);
    }

    /**
     * Pulse element animation
     */
    pulseElement(element) {
        if (!element.classList.contains('pulsing')) {
            element.classList.add('pulsing');
            element.style.animation = 'hudPulse 0.5s ease infinite';

            if (!document.getElementById('hud-pulse-style')) {
                const style = document.createElement('style');
                style.id = 'hud-pulse-style';
                style.textContent = `
                    @keyframes hudPulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }

    /**
     * Format large numbers
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    /**
     * Update HUD (called each frame)
     */
    update(deltaTime) {
        this.updateCombo(deltaTime);
    }

    /**
     * Show game over stats
     */
    showGameOver(score, wave, kills) {
        document.getElementById('final-score').textContent = this.formatNumber(score);
        document.getElementById('final-waves').textContent = wave;
        document.getElementById('final-kills').textContent = kills;
        document.getElementById('game-over').classList.remove('hidden');
    }

    /**
     * Hide game over screen
     */
    hideGameOver() {
        document.getElementById('game-over').classList.add('hidden');
    }

    /**
     * Reset HUD state
     */
    reset() {
        this.score = 0;
        this.combo = 1;
        this.comboTimer = 0;

        this.elements.scoreValue.textContent = '0';
        this.elements.comboValue.textContent = 'x1';
        this.elements.waveValue.textContent = '1';
    }
}

export default HUD;
