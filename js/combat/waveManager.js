/**
 * AETHELGARD: EVENT HORIZON
 * Wave Manager Module
 * 
 * Controls enemy spawning and wave progression.
 */

import * as THREE from 'three';
import { Enemy, EnemyTypes } from './enemyAI.js';

export class WaveManager {
    constructor(scene) {
        this.scene = scene;

        // Wave state
        this.currentWave = 0;
        this.enemiesRemaining = 0;
        this.activeEnemies = [];
        this.enemyProjectiles = [];

        // Timing
        this.waveStartTime = 0;
        this.timeSinceLastSpawn = 0;
        this.spawnDelay = 2000;

        // Wave configuration
        this.waveConfigs = this.generateWaveConfigs();

        // Callbacks
        this.onWaveComplete = null;
        this.onEnemyKilled = null;

        // Stats
        this.totalKills = 0;

        console.log('⚔️ Wave manager initialized');
    }

    /**
     * Generate wave configurations
     */
    generateWaveConfigs() {
        const configs = [];

        // Generate 20 waves with increasing difficulty
        for (let i = 1; i <= 20; i++) {
            const config = {
                wave: i,
                enemies: [],
                spawnDelay: Math.max(500, 2000 - i * 75),
                bossWave: i % 5 === 0
            };

            // Base enemy count increases with wave
            const baseCount = 3 + Math.floor(i * 0.8);

            if (config.bossWave) {
                // Boss wave: More enemies + tougher composition
                config.enemies = this.generateBossWaveEnemies(i, baseCount);
            } else {
                config.enemies = this.generateNormalWaveEnemies(i, baseCount);
            }

            configs.push(config);
        }

        return configs;
    }

    generateNormalWaveEnemies(wave, count) {
        const enemies = [];

        for (let i = 0; i < count; i++) {
            const roll = Math.random();
            let type;

            // Type distribution changes with wave
            if (wave < 3) {
                // Early waves: Mostly cowards
                type = roll < 0.7 ? EnemyTypes.COWARD : EnemyTypes.HUNTER;
            } else if (wave < 7) {
                // Mid waves: Mix
                if (roll < 0.3) type = EnemyTypes.COWARD;
                else if (roll < 0.7) type = EnemyTypes.HUNTER;
                else type = EnemyTypes.VANGUARD;
            } else {
                // Late waves: More aggressive
                if (roll < 0.2) type = EnemyTypes.COWARD;
                else if (roll < 0.5) type = EnemyTypes.HUNTER;
                else type = EnemyTypes.VANGUARD;
            }

            enemies.push(type);
        }

        return enemies;
    }

    generateBossWaveEnemies(wave, count) {
        const enemies = [];

        // Boss waves have extra Vanguards
        const vanguardCount = Math.floor(count * 0.5);
        const hunterCount = Math.floor(count * 0.3);
        const cowardCount = count - vanguardCount - hunterCount;

        for (let i = 0; i < vanguardCount; i++) enemies.push(EnemyTypes.VANGUARD);
        for (let i = 0; i < hunterCount; i++) enemies.push(EnemyTypes.HUNTER);
        for (let i = 0; i < cowardCount; i++) enemies.push(EnemyTypes.COWARD);

        // Shuffle
        for (let i = enemies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [enemies[i], enemies[j]] = [enemies[j], enemies[i]];
        }

        return enemies;
    }

    /**
     * Start a wave
     */
    startWave(waveNumber = null) {
        if (waveNumber !== null) {
            this.currentWave = waveNumber;
        } else {
            this.currentWave++;
        }

        // Get or generate wave config
        let config = this.waveConfigs[this.currentWave - 1];
        if (!config) {
            // Generate endless mode wave
            config = {
                wave: this.currentWave,
                enemies: this.generateNormalWaveEnemies(this.currentWave, 5 + this.currentWave),
                spawnDelay: 500,
                bossWave: this.currentWave % 5 === 0
            };
        }

        // Reset state
        this.enemiesRemaining = config.enemies.length;
        this.enemiesToSpawn = [...config.enemies];
        this.spawnDelay = config.spawnDelay;
        this.waveStartTime = performance.now();
        this.timeSinceLastSpawn = this.spawnDelay; // Spawn first enemy immediately

        console.log(`🌊 Wave ${this.currentWave} started: ${this.enemiesRemaining} enemies`);
    }

    /**
     * Spawn an enemy
     */
    spawnEnemy(type, playerPosition) {
        // Calculate spawn position (in front of player, off to sides)
        const angle = (Math.random() - 0.5) * Math.PI;
        const distance = 800 + Math.random() * 400;

        const position = new THREE.Vector3(
            playerPosition.x + Math.sin(angle) * distance,
            playerPosition.y + (Math.random() - 0.5) * 300,
            playerPosition.z - distance
        );

        const enemy = new Enemy(this.scene, type, position);
        this.activeEnemies.push(enemy);

        return enemy;
    }

    /**
     * Update wave manager
     */
    update(deltaTime, player, weapons) {
        // Spawn enemies
        if (this.enemiesToSpawn && this.enemiesToSpawn.length > 0) {
            this.timeSinceLastSpawn += deltaTime;

            if (this.timeSinceLastSpawn >= this.spawnDelay) {
                const type = this.enemiesToSpawn.shift();
                this.spawnEnemy(type, player.position);
                this.timeSinceLastSpawn = 0;
            }
        }

        // Update enemies
        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
            const enemy = this.activeEnemies[i];

            enemy.update(deltaTime, player);

            // Check if enemy can attack
            if (enemy.canAttack()) {
                const attack = enemy.attack();
                if (attack) {
                    this.createEnemyProjectile(attack);
                }
            }

            // Check if enemy is dead
            if (enemy.health <= 0) {
                enemy.die();
                this.activeEnemies.splice(i, 1);
                this.enemiesRemaining--;
                this.totalKills++;

                if (this.onEnemyKilled) {
                    this.onEnemyKilled(enemy);
                }
            }
        }

        // Update enemy projectiles
        this.updateProjectiles(deltaTime, player);

        // Check wave completion
        if (this.enemiesRemaining <= 0 && (!this.enemiesToSpawn || this.enemiesToSpawn.length === 0)) {
            if (this.onWaveComplete) {
                this.onWaveComplete(this.currentWave);
            }
        }
    }

    /**
     * Create enemy projectile
     */
    createEnemyProjectile(attack) {
        const direction = attack.target.clone().sub(attack.origin).normalize();

        // Create projectile mesh
        const geometry = new THREE.SphereGeometry(3, 8, 8);
        let color;

        switch (attack.type) {
            case EnemyTypes.VANGUARD:
                color = 0xff3300;
                break;
            case EnemyTypes.HUNTER:
                color = 0x00ff88;
                break;
            default:
                color = 0xffff00;
        }

        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.9
        });

        const projectile = new THREE.Mesh(geometry, material);
        projectile.position.copy(attack.origin);

        // Trail
        const trailGeo = new THREE.ConeGeometry(2, 10, 6);
        const trailMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.5
        });

        const trail = new THREE.Mesh(trailGeo, trailMat);
        trail.rotation.x = Math.PI / 2;
        trail.position.z = 5;
        projectile.add(trail);

        projectile.userData = {
            velocity: direction.multiplyScalar(600),
            damage: attack.damage,
            created: performance.now(),
            lifetime: 5000
        };

        // Orient towards target
        projectile.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, -1),
            direction
        );

        this.scene.add(projectile);
        this.enemyProjectiles.push(projectile);
    }

    /**
     * Update enemy projectiles
     */
    updateProjectiles(deltaTime, player) {
        const dt = deltaTime * 0.001;
        const now = performance.now();

        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.enemyProjectiles[i];
            const data = projectile.userData;

            // Move
            projectile.position.add(data.velocity.clone().multiplyScalar(dt));

            // Check lifetime
            if (now - data.created > data.lifetime) {
                this.scene.remove(projectile);
                this.enemyProjectiles.splice(i, 1);
                continue;
            }

            // Check player collision
            const distToPlayer = projectile.position.distanceTo(player.position);
            if (distToPlayer < 40) {
                // Hit player
                player.takeDamage(data.damage, projectile.position.clone());

                // Impact effect
                this.createImpact(projectile.position.clone());

                this.scene.remove(projectile);
                this.enemyProjectiles.splice(i, 1);
            }
        }
    }

    /**
     * Create impact effect
     */
    createImpact(position) {
        const geo = new THREE.SphereGeometry(5, 8, 8);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xff5500,
            transparent: true,
            opacity: 1
        });

        const impact = new THREE.Mesh(geo, mat);
        impact.position.copy(position);
        this.scene.add(impact);

        const startTime = performance.now();
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / 200;

            if (progress < 1) {
                impact.scale.setScalar(1 + progress * 3);
                impact.material.opacity = 1 - progress;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(impact);
            }
        };
        animate();
    }

    /**
     * Get enemies for weapon system
     */
    getEnemies() {
        return this.activeEnemies.map(e => ({
            mesh: e.mesh,
            hitRadius: e.hitRadius,
            takeDamage: (amount) => e.takeDamage(amount)
        }));
    }

    /**
     * Get enemies for radar
     */
    getRadarData() {
        return this.activeEnemies.map(e => e.getRadarData());
    }

    /**
     * Check if wave is complete
     */
    isWaveComplete() {
        return this.enemiesRemaining <= 0 &&
            (!this.enemiesToSpawn || this.enemiesToSpawn.length === 0);
    }

    /**
     * Get current wave info
     */
    getWaveInfo() {
        return {
            wave: this.currentWave,
            enemiesRemaining: this.enemiesRemaining,
            totalKills: this.totalKills
        };
    }

    /**
     * Clean up all enemies
     */
    cleanup() {
        this.activeEnemies.forEach(enemy => {
            this.scene.remove(enemy.mesh);
        });
        this.activeEnemies = [];

        this.enemyProjectiles.forEach(p => {
            this.scene.remove(p);
        });
        this.enemyProjectiles = [];
    }
}

export default WaveManager;
