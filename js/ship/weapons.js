/**
 * AETHELGARD: EVENT HORIZON
 * Weapons Module
 * 
 * Implements the Aurelian's weapon systems:
 * - Shatter-Railgun: High-velocity kinetic slugs
 * - Solar Flare Beam: Sustained thermal laser
 * - Singularity Harpoon: Gravity tether
 */

import * as THREE from 'three';

export class Weapons {
    constructor(scene, ship) {
        this.scene = scene;
        this.ship = ship;

        // Active projectiles
        this.projectiles = [];
        this.beams = [];
        this.harpoons = [];

        // Weapon stats
        this.weapons = {
            railgun: {
                name: 'SHATTER-RAILGUN',
                damage: 25,
                cooldown: 200,
                energyCost: 5,
                lastFired: 0,
                projectileSpeed: 2000,
                color: 0x00f0ff
            },
            laser: {
                name: 'SOLAR FLARE BEAM',
                damage: 5, // per tick
                cooldown: 0, // continuous
                energyCost: 15, // per second
                active: false,
                color: 0xffaa00,
                maxRange: 500
            },
            harpoon: {
                name: 'SINGULARITY HARPOON',
                damage: 10,
                cooldown: 3000,
                energyCost: 30,
                lastFired: 0,
                projectileSpeed: 800,
                color: 0xff00ff,
                tetherDuration: 5000
            }
        };

        // Currently selected weapon
        this.currentWeapon = 'railgun';

        // Beam reference
        this.activeBeam = null;

        this.init();
    }

    init() {
        this.createBeamGeometry();
        console.log('🔫 Weapons systems online');
    }

    /**
     * Create reusable beam geometry
     */
    createBeamGeometry() {
        // Beam core
        this.beamGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        this.beamGeometry.rotateX(Math.PI / 2);

        // Beam glow
        this.beamGlowGeometry = new THREE.CylinderGeometry(2, 2, 1, 8);
        this.beamGlowGeometry.rotateX(Math.PI / 2);
    }

    /**
     * Fire primary weapon
     */
    firePrimary() {
        const weapon = this.weapons[this.currentWeapon];
        const now = performance.now();

        // Check cooldown
        if (now - weapon.lastFired < weapon.cooldown) return false;

        // Check energy
        if (this.ship.energy < weapon.energyCost) return false;

        // Fire based on weapon type
        switch (this.currentWeapon) {
            case 'railgun':
                this.fireRailgun();
                break;
            case 'harpoon':
                this.fireHarpoon();
                break;
        }

        // Consume energy and set cooldown
        this.ship.energy -= weapon.energyCost;
        weapon.lastFired = now;

        return true;
    }

    /**
     * Start/stop laser beam
     */
    toggleLaser(active) {
        const weapon = this.weapons.laser;

        if (active && !weapon.active) {
            // Start beam
            if (this.ship.energy < 5) return;
            weapon.active = true;
            this.createBeam();
        } else if (!active && weapon.active) {
            // Stop beam
            weapon.active = false;
            this.destroyBeam();
        }
    }

    /**
     * Fire railgun projectile
     */
    fireRailgun() {
        const weapon = this.weapons.railgun;

        // Create projectile
        const projectileGroup = new THREE.Group();

        // Core
        const coreGeo = new THREE.CapsuleGeometry(1, 8, 4, 8);
        const coreMat = new THREE.MeshBasicMaterial({
            color: weapon.color,
            transparent: true,
            opacity: 1
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.rotation.x = Math.PI / 2;
        projectileGroup.add(core);

        // Glow trail
        const trailGeo = new THREE.ConeGeometry(2, 15, 8);
        const trailMat = new THREE.MeshBasicMaterial({
            color: weapon.color,
            transparent: true,
            opacity: 0.5
        });
        const trail = new THREE.Mesh(trailGeo, trailMat);
        trail.rotation.x = -Math.PI / 2;
        trail.position.z = 10;
        projectileGroup.add(trail);

        // Set position and direction
        projectileGroup.position.copy(this.ship.position);
        projectileGroup.quaternion.copy(this.ship.quaternion);

        // Offset forward
        const forward = this.ship.getForward();
        projectileGroup.position.add(forward.clone().multiplyScalar(50));

        // Store velocity
        projectileGroup.userData = {
            type: 'railgun',
            velocity: forward.multiplyScalar(weapon.projectileSpeed),
            damage: weapon.damage,
            lifetime: 3000,
            created: performance.now()
        };

        this.projectiles.push(projectileGroup);
        this.scene.add(projectileGroup);

        // Muzzle flash
        this.createMuzzleFlash(this.ship.position.clone().add(forward.clone().multiplyScalar(40)));
    }

    /**
     * Fire harpoon
     */
    fireHarpoon() {
        const weapon = this.weapons.harpoon;

        // Create harpoon projectile
        const harpoonGroup = new THREE.Group();

        // Harpoon head
        const headGeo = new THREE.ConeGeometry(3, 10, 6);
        const headMat = new THREE.MeshStandardMaterial({
            color: weapon.color,
            emissive: weapon.color,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.rotation.x = Math.PI / 2;
        harpoonGroup.add(head);

        // Energy core
        const coreGeo = new THREE.SphereGeometry(4, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({
            color: weapon.color,
            transparent: true,
            opacity: 0.6
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.z = 8;
        harpoonGroup.add(core);

        // Set position and direction
        harpoonGroup.position.copy(this.ship.position);
        harpoonGroup.quaternion.copy(this.ship.quaternion);

        const forward = this.ship.getForward();
        harpoonGroup.position.add(forward.clone().multiplyScalar(50));

        // Create tether line
        const tetherGeo = new THREE.BufferGeometry();
        const tetherMat = new THREE.LineBasicMaterial({
            color: weapon.color,
            transparent: true,
            opacity: 0.8
        });
        const tether = new THREE.Line(tetherGeo, tetherMat);
        this.scene.add(tether);

        harpoonGroup.userData = {
            type: 'harpoon',
            velocity: forward.multiplyScalar(weapon.projectileSpeed),
            damage: weapon.damage,
            lifetime: 5000,
            created: performance.now(),
            tether,
            attached: false,
            attachedTo: null,
            originPosition: this.ship.position.clone()
        };

        this.harpoons.push(harpoonGroup);
        this.scene.add(harpoonGroup);
    }

    /**
     * Create continuous beam weapon
     */
    createBeam() {
        if (this.activeBeam) return;

        const weapon = this.weapons.laser;

        // Beam group
        this.activeBeam = new THREE.Group();

        // Core beam
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(this.beamGeometry, coreMat);
        this.activeBeam.add(core);

        // Middle glow
        const midMat = new THREE.MeshBasicMaterial({
            color: weapon.color,
            transparent: true,
            opacity: 0.6
        });
        const mid = new THREE.Mesh(this.beamGlowGeometry.clone(), midMat);
        mid.scale.set(2, 2, 1);
        this.activeBeam.add(mid);

        // Outer glow
        const outerMat = new THREE.MeshBasicMaterial({
            color: weapon.color,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const outer = new THREE.Mesh(this.beamGlowGeometry.clone(), outerMat);
        outer.scale.set(4, 4, 1);
        this.activeBeam.add(outer);

        // Impact point effect
        const impactGeo = new THREE.SphereGeometry(5, 16, 16);
        const impactMat = new THREE.MeshBasicMaterial({
            color: weapon.color,
            transparent: true,
            opacity: 0.8
        });
        const impact = new THREE.Mesh(impactGeo, impactMat);
        impact.visible = false;
        this.activeBeam.userData.impact = impact;
        this.scene.add(impact);

        this.activeBeam.userData = {
            core,
            mid,
            outer,
            damage: weapon.damage,
            maxRange: weapon.maxRange,
            energyCost: weapon.energyCost
        };

        this.scene.add(this.activeBeam);
    }

    /**
     * Destroy beam weapon
     */
    destroyBeam() {
        if (!this.activeBeam) return;

        if (this.activeBeam.userData.impact) {
            this.scene.remove(this.activeBeam.userData.impact);
        }

        this.scene.remove(this.activeBeam);
        this.activeBeam = null;
    }

    /**
     * Create muzzle flash effect
     */
    createMuzzleFlash(position) {
        const flashGeo = new THREE.SphereGeometry(5, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 1
        });

        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(position);
        this.scene.add(flash);

        // Animate and remove
        const startTime = performance.now();
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / 150;

            if (progress < 1) {
                flash.scale.setScalar(1 + progress * 2);
                flash.material.opacity = 1 - progress;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(flash);
            }
        };
        animate();
    }

    /**
     * Update all weapons
     */
    update(deltaTime, enemies = []) {
        const dt = deltaTime * 0.001;
        const now = performance.now();

        // Update projectiles
        this.updateProjectiles(dt, now, enemies);

        // Update beam
        this.updateBeam(dt, enemies);

        // Update harpoons
        this.updateHarpoons(dt, now, enemies);
    }

    /**
     * Update railgun projectiles
     */
    updateProjectiles(dt, now, enemies) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const data = projectile.userData;

            // Move projectile
            projectile.position.add(data.velocity.clone().multiplyScalar(dt));

            // Check lifetime
            if (now - data.created > data.lifetime) {
                this.scene.remove(projectile);
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check enemy collisions
            let hit = false;
            for (const enemy of enemies) {
                if (enemy.mesh && projectile.position.distanceTo(enemy.mesh.position) < enemy.hitRadius) {
                    // Hit enemy
                    enemy.takeDamage(data.damage);
                    this.createImpactEffect(projectile.position.clone(), data.type);
                    hit = true;
                    break;
                }
            }

            if (hit) {
                this.scene.remove(projectile);
                this.projectiles.splice(i, 1);
            }
        }
    }

    /**
     * Update laser beam
     */
    updateBeam(dt, enemies) {
        if (!this.activeBeam || !this.weapons.laser.active) return;

        const weapon = this.weapons.laser;

        // Consume energy
        this.ship.energy -= weapon.energyCost * dt;
        if (this.ship.energy <= 0) {
            this.toggleLaser(false);
            return;
        }

        // Position beam at ship
        const forward = this.ship.getForward();
        const origin = this.ship.position.clone().add(forward.clone().multiplyScalar(50));

        this.activeBeam.position.copy(origin);
        this.activeBeam.quaternion.copy(this.ship.quaternion);

        // Raycast to find hit point
        let hitDistance = weapon.maxRange;
        let hitEnemy = null;

        for (const enemy of enemies) {
            if (!enemy.mesh) continue;

            const toEnemy = enemy.mesh.position.clone().sub(origin);
            const dot = toEnemy.dot(forward);

            if (dot > 0 && dot < weapon.maxRange) {
                const perpDist = toEnemy.clone().sub(forward.clone().multiplyScalar(dot)).length();

                if (perpDist < enemy.hitRadius && dot < hitDistance) {
                    hitDistance = dot;
                    hitEnemy = enemy;
                }
            }
        }

        // Scale beam to hit distance
        this.activeBeam.children.forEach(child => {
            child.scale.z = hitDistance;
            child.position.z = -hitDistance / 2;
        });

        // Update impact point
        const impact = this.activeBeam.userData.impact;
        if (hitEnemy) {
            impact.visible = true;
            impact.position.copy(origin.add(forward.multiplyScalar(hitDistance)));

            // Damage enemy
            hitEnemy.takeDamage(weapon.damage * dt);

            // Pulse effect
            const pulse = 1 + Math.sin(performance.now() * 0.02) * 0.3;
            impact.scale.setScalar(pulse);
        } else {
            impact.visible = false;
        }

        // Beam flicker effect
        const flicker = 0.7 + Math.random() * 0.3;
        this.activeBeam.userData.core.material.opacity = flicker;
    }

    /**
     * Update harpoons
     */
    updateHarpoons(dt, now, enemies) {
        for (let i = this.harpoons.length - 1; i >= 0; i--) {
            const harpoon = this.harpoons[i];
            const data = harpoon.userData;

            // Check lifetime
            if (now - data.created > data.lifetime) {
                this.scene.remove(harpoon);
                this.scene.remove(data.tether);
                this.harpoons.splice(i, 1);
                continue;
            }

            if (!data.attached) {
                // Move harpoon
                harpoon.position.add(data.velocity.clone().multiplyScalar(dt));

                // Check enemy collisions
                for (const enemy of enemies) {
                    if (enemy.mesh && harpoon.position.distanceTo(enemy.mesh.position) < enemy.hitRadius) {
                        data.attached = true;
                        data.attachedTo = enemy;
                        enemy.takeDamage(data.damage);
                        break;
                    }
                }
            } else if (data.attachedTo && data.attachedTo.mesh) {
                // Follow attached enemy
                harpoon.position.copy(data.attachedTo.mesh.position);

                // Pull enemy towards ship
                const pullDirection = this.ship.position.clone().sub(data.attachedTo.mesh.position).normalize();
                data.attachedTo.mesh.position.add(pullDirection.multiplyScalar(100 * dt));
            }

            // Update tether line
            const positions = [
                this.ship.position.x, this.ship.position.y, this.ship.position.z,
                harpoon.position.x, harpoon.position.y, harpoon.position.z
            ];

            data.tether.geometry.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(positions, 3)
            );
        }
    }

    /**
     * Create impact effect
     */
    createImpactEffect(position, type) {
        const color = type === 'railgun' ? 0x00f0ff : 0xff00ff;

        // Explosion sphere
        const explosionGeo = new THREE.IcosahedronGeometry(10, 1);
        const explosionMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 1,
            wireframe: true
        });

        const explosion = new THREE.Mesh(explosionGeo, explosionMat);
        explosion.position.copy(position);
        this.scene.add(explosion);

        // Animate
        const startTime = performance.now();
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / 300;

            if (progress < 1) {
                explosion.scale.setScalar(1 + progress * 3);
                explosion.material.opacity = 1 - progress;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosion);
            }
        };
        animate();
    }

    /**
     * Switch weapon
     */
    selectWeapon(weaponName) {
        if (this.weapons[weaponName]) {
            // Stop laser if switching away
            if (this.currentWeapon === 'laser') {
                this.toggleLaser(false);
            }
            this.currentWeapon = weaponName;
        }
    }

    /**
     * Get weapon cooldown progress (0-1)
     */
    getCooldownProgress(weaponName) {
        const weapon = this.weapons[weaponName];
        if (!weapon || weapon.cooldown === 0) return 1;

        const elapsed = performance.now() - weapon.lastFired;
        return Math.min(1, elapsed / weapon.cooldown);
    }

    /**
     * Clean up all projectiles
     */
    cleanup() {
        this.projectiles.forEach(p => this.scene.remove(p));
        this.projectiles = [];

        this.destroyBeam();

        this.harpoons.forEach(h => {
            this.scene.remove(h);
            this.scene.remove(h.userData.tether);
        });
        this.harpoons = [];
    }
}

export default Weapons;
