/**
 * AETHELGARD: EVENT HORIZON
 * Enemy AI Module
 * 
 * Implements enemy ship behaviors:
 * - Vanguard: Aggressive ramming attacks
 * - Hunter: Tactical flanking
 * - Coward: Retreats and calls reinforcements
 */

import * as THREE from 'three';

// AI Behavior Types
export const EnemyTypes = {
    VANGUARD: 'vanguard',
    HUNTER: 'hunter',
    COWARD: 'coward'
};

export class Enemy {
    constructor(scene, type, position) {
        this.scene = scene;
        this.type = type;

        // Stats based on type
        this.initStats(type);

        // State
        this.position = position.clone();
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.quaternion = new THREE.Quaternion();

        // AI state
        this.state = 'idle';
        this.target = null;
        this.stateTimer = 0;
        this.lastAttack = 0;

        // Visual
        this.mesh = null;
        this.hitRadius = 30;

        // Particle effects
        this.thrusterParticles = null;

        this.createMesh();
    }

    initStats(type) {
        const stats = {
            vanguard: {
                health: 80,
                maxHealth: 80,
                speed: 300,
                turnSpeed: 1.5,
                damage: 20,
                attackRange: 100,
                attackCooldown: 2000,
                color: 0xff3300,
                aggressiveness: 0.9,
                retreatThreshold: 0.1
            },
            hunter: {
                health: 60,
                maxHealth: 60,
                speed: 400,
                turnSpeed: 2.5,
                damage: 15,
                attackRange: 300,
                attackCooldown: 1000,
                color: 0x00ff88,
                aggressiveness: 0.6,
                retreatThreshold: 0.3
            },
            coward: {
                health: 40,
                maxHealth: 40,
                speed: 350,
                turnSpeed: 3.0,
                damage: 10,
                attackRange: 400,
                attackCooldown: 800,
                color: 0xffff00,
                aggressiveness: 0.3,
                retreatThreshold: 0.5
            }
        };

        Object.assign(this, stats[type] || stats.hunter);
    }

    createMesh() {
        const group = new THREE.Group();

        // Enemy ship body
        let geometry;

        switch (this.type) {
            case EnemyTypes.VANGUARD:
                // Heavy, angular design
                geometry = this.createVanguardGeometry();
                break;
            case EnemyTypes.HUNTER:
                // Sleek, fast design
                geometry = this.createHunterGeometry();
                break;
            case EnemyTypes.COWARD:
                // Small, nimble design
                geometry = this.createCowardGeometry();
                break;
            default:
                geometry = new THREE.ConeGeometry(20, 40, 6);
        }

        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.3,
            metalness: 0.7,
            roughness: 0.3,
            flatShading: true
        });

        const body = new THREE.Mesh(geometry, material);
        group.add(body);

        // Engine glow
        const engineGeo = new THREE.SphereGeometry(5, 8, 8);
        const engineMat = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.8
        });

        const engine = new THREE.Mesh(engineGeo, engineMat);
        engine.position.z = 20;
        group.add(engine);

        // Weak point indicator
        const weakPointGeo = new THREE.RingGeometry(8, 10, 16);
        const weakPointMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        const weakPoint = new THREE.Mesh(weakPointGeo, weakPointMat);
        weakPoint.position.z = -5;
        group.add(weakPoint);

        group.position.copy(this.position);

        this.mesh = group;
        this.bodyMesh = body;
        this.engine = engine;
        this.weakPoint = weakPoint;

        this.scene.add(group);
    }

    createVanguardGeometry() {
        // Heavy, wedge-shaped design
        const shape = new THREE.Shape();
        shape.moveTo(0, -25);
        shape.lineTo(20, 15);
        shape.lineTo(15, 20);
        shape.lineTo(-15, 20);
        shape.lineTo(-20, 15);
        shape.closePath();

        const extrudeSettings = {
            steps: 1,
            depth: 15,
            bevelEnabled: true,
            bevelThickness: 3,
            bevelSize: 2,
            bevelSegments: 1
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(Math.PI / 2);
        geometry.translate(0, 0, -7);

        return geometry;
    }

    createHunterGeometry() {
        // Sleek, arrow-like design
        const vertices = new Float32Array([
            0, 0, -30,      // nose
            -12, 3, 15,     // left wing
            12, 3, 15,      // right wing
            -8, -3, 15,     // left bottom
            8, -3, 15,      // right bottom
            0, 0, 20        // tail
        ]);

        const indices = new Uint16Array([
            0, 1, 2,    // top
            0, 3, 1,    // left
            0, 2, 4,    // right
            0, 4, 3,    // bottom
            1, 3, 5,    // left rear
            2, 5, 4,    // right rear
            1, 5, 2,    // top rear
            3, 4, 5     // bottom rear
        ]);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();

        return geometry;
    }

    createCowardGeometry() {
        // Small, spherical design
        const geometry = new THREE.DodecahedronGeometry(15, 0);
        geometry.scale(1, 0.6, 1.5);
        return geometry;
    }

    /**
     * Update enemy AI and movement
     */
    update(deltaTime, player) {
        const dt = deltaTime * 0.001;
        this.target = player;

        // Update AI state
        this.updateAI(dt);

        // Update movement
        this.updateMovement(dt);

        // Update visuals
        this.updateVisuals(deltaTime);
    }

    /**
     * AI State Machine
     */
    updateAI(dt) {
        if (!this.target) return;

        const distanceToTarget = this.position.distanceTo(this.target.position);
        const healthPercent = this.health / this.maxHealth;

        // State transitions based on type personality
        switch (this.type) {
            case EnemyTypes.VANGUARD:
                this.updateVanguardAI(distanceToTarget, healthPercent);
                break;
            case EnemyTypes.HUNTER:
                this.updateHunterAI(distanceToTarget, healthPercent);
                break;
            case EnemyTypes.COWARD:
                this.updateCowardAI(distanceToTarget, healthPercent);
                break;
        }

        this.stateTimer += dt;
    }

    updateVanguardAI(distance, healthPercent) {
        // Vanguard: Always aggressive, will ram player
        if (healthPercent < this.retreatThreshold) {
            // Even when retreating, Vanguard does a ramming attack
            this.state = 'kamikaze';
        } else if (distance < this.attackRange) {
            this.state = 'ram';
        } else if (distance < 800) {
            this.state = 'charge';
        } else {
            this.state = 'pursue';
        }
    }

    updateHunterAI(distance, healthPercent) {
        // Hunter: Tactical, prefers flanking and strafing
        if (healthPercent < this.retreatThreshold) {
            this.state = 'retreat';
        } else if (distance < 150) {
            this.state = 'evade';
        } else if (distance < this.attackRange) {
            this.state = 'strafe';
        } else if (distance < 600) {
            this.state = 'flank';
        } else {
            this.state = 'pursue';
        }
    }

    updateCowardAI(distance, healthPercent) {
        // Coward: Hit and run, calls for help when hurt
        if (healthPercent < this.retreatThreshold) {
            this.state = 'flee';
            // Would trigger reinforcement spawning in wave manager
        } else if (distance < 200) {
            this.state = 'flee';
        } else if (distance < this.attackRange) {
            this.state = 'snipe';
        } else if (distance < 800) {
            this.state = 'approach';
        } else {
            this.state = 'idle';
        }
    }

    /**
     * Update movement based on AI state
     */
    updateMovement(dt) {
        if (!this.target) return;

        const toTarget = this.target.position.clone().sub(this.position);
        const distance = toTarget.length();
        const direction = toTarget.normalize();

        let desiredVelocity = new THREE.Vector3();
        let shouldFaceTarget = true;

        switch (this.state) {
            case 'pursue':
            case 'charge':
                desiredVelocity = direction.multiplyScalar(this.speed);
                break;

            case 'ram':
            case 'kamikaze':
                desiredVelocity = direction.multiplyScalar(this.speed * 1.5);
                break;

            case 'strafe':
                // Circle around target
                const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
                const circleDir = perpendicular.multiplyScalar(Math.sin(this.stateTimer * 2));
                desiredVelocity = circleDir.add(direction.multiplyScalar(0.3)).normalize().multiplyScalar(this.speed * 0.8);
                break;

            case 'flank':
                // Approach from the side
                const flankAngle = Math.PI / 3;
                const flankDir = new THREE.Vector3(
                    direction.x * Math.cos(flankAngle) - direction.z * Math.sin(flankAngle),
                    direction.y,
                    direction.x * Math.sin(flankAngle) + direction.z * Math.cos(flankAngle)
                );
                desiredVelocity = flankDir.multiplyScalar(this.speed);
                break;

            case 'evade':
            case 'flee':
            case 'retreat':
                // Run away
                desiredVelocity = direction.multiplyScalar(-this.speed);
                shouldFaceTarget = false;
                break;

            case 'snipe':
                // Maintain distance, slight movement
                if (distance < this.attackRange * 0.8) {
                    desiredVelocity = direction.multiplyScalar(-this.speed * 0.5);
                } else if (distance > this.attackRange * 1.2) {
                    desiredVelocity = direction.multiplyScalar(this.speed * 0.5);
                }
                break;

            case 'approach':
                desiredVelocity = direction.multiplyScalar(this.speed * 0.6);
                break;

            default:
                // Idle - slow drift
                desiredVelocity = new THREE.Vector3(
                    Math.sin(this.stateTimer) * 30,
                    Math.cos(this.stateTimer * 0.7) * 20,
                    0
                );
        }

        // Smooth velocity transition
        this.velocity.lerp(desiredVelocity, 0.05);

        // Apply velocity
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        // Rotate to face target or movement direction
        if (shouldFaceTarget && distance > 10) {
            const lookTarget = this.target.position.clone();
            const lookMatrix = new THREE.Matrix4().lookAt(this.position, lookTarget, new THREE.Vector3(0, 1, 0));
            const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
            this.quaternion.slerp(targetQuaternion, this.turnSpeed * dt);
        } else if (this.velocity.length() > 10) {
            const lookTarget = this.position.clone().add(this.velocity);
            const lookMatrix = new THREE.Matrix4().lookAt(this.position, lookTarget, new THREE.Vector3(0, 1, 0));
            const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
            this.quaternion.slerp(targetQuaternion, this.turnSpeed * dt);
        }

        // Update mesh
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.quaternion);
    }

    /**
     * Update visual effects
     */
    updateVisuals(deltaTime) {
        // Engine intensity based on speed
        const speedRatio = this.velocity.length() / this.speed;
        this.engine.material.opacity = 0.3 + speedRatio * 0.7;
        this.engine.scale.setScalar(0.5 + speedRatio * 0.5);

        // Weak point pulse
        const pulse = 0.3 + Math.sin(performance.now() * 0.005) * 0.2;
        this.weakPoint.material.opacity = pulse;
        this.weakPoint.rotation.z += deltaTime * 0.001;

        // Damage flash
        if (this.damageFlash) {
            this.damageFlash -= deltaTime;
            if (this.damageFlash <= 0) {
                this.bodyMesh.material.emissiveIntensity = 0.3;
            }
        }
    }

    /**
     * Check if enemy can attack
     */
    canAttack() {
        if (!this.target) return false;

        const now = performance.now();
        if (now - this.lastAttack < this.attackCooldown) return false;

        const distance = this.position.distanceTo(this.target.position);
        if (distance > this.attackRange) return false;

        // Check if in attack state
        const attackStates = ['strafe', 'snipe', 'ram', 'kamikaze'];
        return attackStates.includes(this.state);
    }

    /**
     * Perform attack
     */
    attack() {
        if (!this.canAttack()) return null;

        this.lastAttack = performance.now();

        // Return attack data
        return {
            origin: this.position.clone(),
            target: this.target.position.clone(),
            damage: this.damage,
            type: this.type
        };
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        this.health -= amount;

        // Flash effect
        this.bodyMesh.material.emissiveIntensity = 1;
        this.damageFlash = 100;

        // Check death
        if (this.health <= 0) {
            return true; // Signal death
        }

        return false;
    }

    /**
     * Create death explosion
     */
    die() {
        const position = this.position.clone();

        // Create explosion particles
        const particleCount = 30;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const geo = new THREE.TetrahedronGeometry(3 + Math.random() * 5);
            const mat = new THREE.MeshBasicMaterial({
                color: this.color,
                transparent: true,
                opacity: 1
            });

            const particle = new THREE.Mesh(geo, mat);
            particle.position.copy(position);
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200
                ),
                rotationSpeed: new THREE.Vector3(
                    Math.random() * 0.1,
                    Math.random() * 0.1,
                    Math.random() * 0.1
                ),
                lifetime: 1000 + Math.random() * 1000
            };

            this.scene.add(particle);
            particles.push(particle);
        }

        // Animate particles
        const startTime = performance.now();
        const animate = () => {
            const elapsed = performance.now() - startTime;

            let allDead = true;
            particles.forEach(p => {
                if (elapsed < p.userData.lifetime) {
                    allDead = false;
                    const dt = 0.016;

                    p.position.add(p.userData.velocity.clone().multiplyScalar(dt));
                    p.rotation.x += p.userData.rotationSpeed.x;
                    p.rotation.y += p.userData.rotationSpeed.y;

                    p.userData.velocity.multiplyScalar(0.98);
                    p.material.opacity = 1 - (elapsed / p.userData.lifetime);
                } else {
                    this.scene.remove(p);
                }
            });

            if (!allDead) {
                requestAnimationFrame(animate);
            }
        };
        animate();

        // Shockwave
        const ringGeo = new THREE.RingGeometry(1, 5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(position);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        this.scene.add(ring);

        const ringStart = performance.now();
        const animateRing = () => {
            const elapsed = performance.now() - ringStart;
            const progress = elapsed / 500;

            if (progress < 1) {
                ring.scale.setScalar(1 + progress * 50);
                ring.material.opacity = 0.8 * (1 - progress);
                requestAnimationFrame(animateRing);
            } else {
                this.scene.remove(ring);
            }
        };
        animateRing();

        // Remove mesh
        this.scene.remove(this.mesh);

        return position;
    }

    /**
     * Get position for radar
     */
    getRadarData() {
        return {
            position: this.position.clone(),
            type: this.type,
            health: this.health / this.maxHealth
        };
    }
}

export default Enemy;
