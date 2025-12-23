/**
 * AETHELGARD: EVENT HORIZON
 * The Aurelian - Player Ship Module
 * 
 * The sentient prototype ship from a vanished civilization.
 * Features physics-based movement and visual effects.
 */

import * as THREE from 'three';

export class Aurelian {
    constructor(scene) {
        this.scene = scene;

        // Ship state
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.quaternion = new THREE.Quaternion();

        // Ship stats
        this.maxSpeed = 500;
        this.acceleration = 150;
        this.deceleration = 80;
        this.boostMultiplier = 2.5;
        this.rotationSpeed = 2.0;

        // Ship status
        this.hull = 100;
        this.maxHull = 100;
        this.shield = 100;
        this.maxShield = 100;
        this.energy = 100;
        this.maxEnergy = 100;
        this.energyRegen = 10; // per second

        // Control state
        this.isThrusting = false;
        this.isBraking = false;
        this.isBoosting = false;
        this.isInvulnerable = false;
        this.shieldActive = false;

        // Target aim position (0-1 screen coords)
        this.aimPosition = { x: 0.5, y: 0.5 };

        // Mesh components
        this.mesh = null;
        this.thrusters = [];
        this.shieldMesh = null;

        // Trail effect
        this.trail = null;
        this.trailPositions = [];

        this.init();
    }

    init() {
        this.createShipMesh();
        this.createThrusters();
        this.createShieldEffect();
        this.createTrail();

        console.log('🚀 Aurelian ship initialized');
    }

    /**
     * Create the ship mesh - HIGHLY DETAILED DESIGN
     */
    createShipMesh() {
        const shipGroup = new THREE.Group();

        // ========== MAIN FUSELAGE ==========
        // Sharp, angular main body with beveled edges
        const fuselageShape = new THREE.Shape();
        fuselageShape.moveTo(0, 0);
        fuselageShape.lineTo(2, 0.5);
        fuselageShape.lineTo(2, 1.5);
        fuselageShape.lineTo(1.5, 2);
        fuselageShape.lineTo(-1.5, 2);
        fuselageShape.lineTo(-2, 1.5);
        fuselageShape.lineTo(-2, 0.5);
        fuselageShape.closePath();

        const fuselageSettings = {
            steps: 1,
            depth: 12,
            bevelEnabled: true,
            bevelThickness: 0.3,
            bevelSize: 0.2,
            bevelSegments: 2
        };

        const fuselageGeo = new THREE.ExtrudeGeometry(fuselageShape, fuselageSettings);
        fuselageGeo.rotateX(-Math.PI / 2);
        fuselageGeo.translate(0, 0, -6);

        // Premium metallic material
        const hullMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a3a4a,
            metalness: 0.95,
            roughness: 0.15,
            envMapIntensity: 2.0
        });

        const fuselage = new THREE.Mesh(fuselageGeo, hullMaterial);
        fuselage.scale.set(3, 3, 3);
        shipGroup.add(fuselage);

        // ========== NOSE CONE ==========
        const noseGeo = new THREE.ConeGeometry(5, 25, 6);
        noseGeo.rotateX(Math.PI / 2);
        noseGeo.translate(0, 3, -42);

        const noseMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a2a3a,
            metalness: 0.98,
            roughness: 0.08
        });

        const nose = new THREE.Mesh(noseGeo, noseMaterial);
        shipGroup.add(nose);

        // ========== COCKPIT CANOPY ==========
        // Sleek bubble canopy with reflective glass
        const cockpitGeo = new THREE.SphereGeometry(4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x00ddff,
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.6,
            thickness: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            emissive: 0x003344,
            emissiveIntensity: 0.4
        });

        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMaterial);
        cockpit.position.set(0, 6, -25);
        cockpit.scale.set(1.2, 0.6, 2);
        cockpit.rotation.x = -0.1;
        shipGroup.add(cockpit);

        // Cockpit frame
        const frameGeo = new THREE.TorusGeometry(4, 0.3, 8, 12, Math.PI);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.3
        });
        const cockpitFrame = new THREE.Mesh(frameGeo, frameMaterial);
        cockpitFrame.position.set(0, 5, -25);
        cockpitFrame.scale.set(1.3, 0.8, 2);
        cockpitFrame.rotation.x = -Math.PI / 2;
        shipGroup.add(cockpitFrame);

        // ========== MAIN WINGS ==========
        // Sharp, swept-back wings with detail panels
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(18, -3);
        wingShape.lineTo(20, -2);
        wingShape.lineTo(20, 0);
        wingShape.lineTo(18, 1);
        wingShape.lineTo(5, 2);
        wingShape.lineTo(0, 1);
        wingShape.closePath();

        const wingSettings = {
            steps: 1,
            depth: 1.5,
            bevelEnabled: true,
            bevelThickness: 0.2,
            bevelSize: 0.1,
            bevelSegments: 1
        };

        // Right wing
        const rightWingGeo = new THREE.ExtrudeGeometry(wingShape, wingSettings);
        rightWingGeo.rotateX(-Math.PI / 2);
        rightWingGeo.translate(3, 0, 5);

        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e2e3e,
            metalness: 0.9,
            roughness: 0.2
        });

        const rightWing = new THREE.Mesh(rightWingGeo, wingMaterial);
        shipGroup.add(rightWing);

        // Left wing (mirrored)
        const leftWingGeo = rightWingGeo.clone();
        leftWingGeo.scale(-1, 1, 1);
        const leftWing = new THREE.Mesh(leftWingGeo, wingMaterial);
        shipGroup.add(leftWing);

        // ========== WING DETAIL PANELS ==========
        const panelGeo = new THREE.BoxGeometry(8, 0.3, 3);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a1a2a,
            metalness: 0.95,
            roughness: 0.1
        });

        // Right wing panels
        for (let i = 0; i < 3; i++) {
            const panel = new THREE.Mesh(panelGeo, panelMaterial);
            panel.position.set(8 + i * 4, 0.8, 3 - i * 2);
            panel.rotation.z = -0.05;
            shipGroup.add(panel);

            // Left wing panels
            const leftPanel = panel.clone();
            leftPanel.position.x *= -1;
            leftPanel.rotation.z *= -1;
            shipGroup.add(leftPanel);
        }

        // ========== ENGINE NACELLES ==========
        const nacelleGeo = new THREE.CylinderGeometry(2.5, 3, 15, 12);
        nacelleGeo.rotateX(Math.PI / 2);

        const nacelleMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a3a4a,
            metalness: 0.9,
            roughness: 0.15
        });

        // Right nacelle
        const rightNacelle = new THREE.Mesh(nacelleGeo, nacelleMaterial);
        rightNacelle.position.set(8, 0, 15);
        shipGroup.add(rightNacelle);

        // Left nacelle
        const leftNacelle = rightNacelle.clone();
        leftNacelle.position.x = -8;
        shipGroup.add(leftNacelle);

        // ========== ENGINE EXHAUSTS (Glowing) ==========
        const exhaustGeo = new THREE.CylinderGeometry(2, 2.5, 3, 16);
        exhaustGeo.rotateX(Math.PI / 2);

        const exhaustMaterial = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.9
        });

        const rightExhaust = new THREE.Mesh(exhaustGeo, exhaustMaterial);
        rightExhaust.position.set(8, 0, 23);
        shipGroup.add(rightExhaust);

        const leftExhaust = rightExhaust.clone();
        leftExhaust.position.x = -8;
        shipGroup.add(leftExhaust);

        // Inner exhaust glow
        const innerExhaustGeo = new THREE.CylinderGeometry(1.2, 1.8, 4, 16);
        innerExhaustGeo.rotateX(Math.PI / 2);

        const innerExhaustMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.95
        });

        const rightInnerExhaust = new THREE.Mesh(innerExhaustGeo, innerExhaustMat);
        rightInnerExhaust.position.set(8, 0, 24);
        shipGroup.add(rightInnerExhaust);

        const leftInnerExhaust = rightInnerExhaust.clone();
        leftInnerExhaust.position.x = -8;
        shipGroup.add(leftInnerExhaust);

        // ========== DORSAL FIN ==========
        const finShape = new THREE.Shape();
        finShape.moveTo(0, 0);
        finShape.lineTo(-5, 8);
        finShape.lineTo(-3, 8);
        finShape.lineTo(4, 0);
        finShape.closePath();

        const finSettings = { steps: 1, depth: 0.8, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 1 };
        const finGeo = new THREE.ExtrudeGeometry(finShape, finSettings);
        finGeo.rotateY(-Math.PI / 2);
        finGeo.translate(0, 3, 5);

        const fin = new THREE.Mesh(finGeo, hullMaterial);
        shipGroup.add(fin);

        // ========== DETAIL LINES (Accent strips) ==========
        const accentGeo = new THREE.BoxGeometry(0.3, 0.2, 20);
        const accentMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00aa,
            transparent: true,
            opacity: 0.9
        });

        // Top accent lines
        const topAccent = new THREE.Mesh(accentGeo, accentMaterial);
        topAccent.position.set(0, 7, -5);
        shipGroup.add(topAccent);

        // Wing edge lights
        const wingLightGeo = new THREE.BoxGeometry(12, 0.15, 0.4);
        const wingLightMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.8
        });

        const rightWingLight = new THREE.Mesh(wingLightGeo, wingLightMat);
        rightWingLight.position.set(12, 0.5, 0);
        rightWingLight.rotation.z = -0.1;
        shipGroup.add(rightWingLight);

        const leftWingLight = rightWingLight.clone();
        leftWingLight.position.x = -12;
        leftWingLight.rotation.z = 0.1;
        shipGroup.add(leftWingLight);

        // ========== WEAPON HARDPOINTS ==========
        const weaponGeo = new THREE.CylinderGeometry(0.4, 0.6, 8, 8);
        weaponGeo.rotateX(Math.PI / 2);

        const weaponMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.95,
            roughness: 0.2
        });

        // Under-wing weapons
        const rightWeapon = new THREE.Mesh(weaponGeo, weaponMaterial);
        rightWeapon.position.set(10, -1, -5);
        shipGroup.add(rightWeapon);

        const leftWeapon = rightWeapon.clone();
        leftWeapon.position.x = -10;
        shipGroup.add(leftWeapon);

        // ========== SENSOR ARRAY ==========
        const sensorGeo = new THREE.BoxGeometry(3, 0.5, 1);
        const sensorMat = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });

        const sensor = new THREE.Mesh(sensorGeo, sensorMat);
        sensor.position.set(0, 4, -35);
        shipGroup.add(sensor);

        // ========== POSITION LIGHTS ==========
        const posLightGeo = new THREE.SphereGeometry(0.5, 8, 8);

        // Red port light
        const portLight = new THREE.Mesh(posLightGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        portLight.position.set(-20, 0, 0);
        shipGroup.add(portLight);

        // Green starboard light
        const starboardLight = new THREE.Mesh(posLightGeo, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        starboardLight.position.set(20, 0, 0);
        shipGroup.add(starboardLight);

        // White tail light
        const tailLight = new THREE.Mesh(posLightGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
        tailLight.position.set(0, 5, 20);
        shipGroup.add(tailLight);

        this.mesh = shipGroup;
        this.scene.add(this.mesh);

        // Store references for animation
        this.engines = [rightExhaust, leftExhaust, rightInnerExhaust, leftInnerExhaust];
        this.accents = [topAccent, rightWingLight, leftWingLight];
        this.positionLights = [portLight, starboardLight, tailLight];
    }

    /**
     * Create thruster particle effects
     */
    createThrusters() {
        const thrusterPositions = [
            new THREE.Vector3(-7.5, 0, 22),
            new THREE.Vector3(7.5, 0, 22)
        ];

        thrusterPositions.forEach(pos => {
            const thrusterGroup = new THREE.Group();

            // Core glow
            const coreGeo = new THREE.ConeGeometry(3, 15, 8);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.8
            });

            const core = new THREE.Mesh(coreGeo, coreMat);
            core.rotation.x = Math.PI / 2;
            core.position.z = 7;
            thrusterGroup.add(core);

            // Outer glow
            const outerGeo = new THREE.ConeGeometry(5, 20, 8);
            const outerMat = new THREE.MeshBasicMaterial({
                color: 0x00a0ff,
                transparent: true,
                opacity: 0.3
            });

            const outer = new THREE.Mesh(outerGeo, outerMat);
            outer.rotation.x = Math.PI / 2;
            outer.position.z = 10;
            thrusterGroup.add(outer);

            thrusterGroup.position.copy(pos);
            thrusterGroup.visible = false;

            this.mesh.add(thrusterGroup);
            this.thrusters.push({
                group: thrusterGroup,
                core,
                outer
            });
        });
    }

    /**
     * Create shield visual effect
     */
    createShieldEffect() {
        const geometry = new THREE.IcosahedronGeometry(50, 2);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x00f0ff) },
                hitPoint: { value: new THREE.Vector3(0, 0, 0) },
                hitTime: { value: -10 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform vec3 hitPoint;
                uniform float hitTime;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    // Fresnel effect
                    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
                    
                    // Hex pattern
                    float pattern = sin(vPosition.x * 0.5 + time) * sin(vPosition.y * 0.5 + time * 0.7);
                    pattern = smoothstep(0.3, 0.7, pattern);
                    
                    // Hit ripple
                    float hitDist = distance(vPosition, hitPoint);
                    float hitTimeDiff = time - hitTime;
                    float ripple = sin(hitDist * 2.0 - hitTimeDiff * 10.0) * exp(-hitTimeDiff * 2.0);
                    ripple = max(0.0, ripple) * step(0.0, hitTimeDiff) * step(hitTimeDiff, 2.0);
                    
                    float alpha = fresnel * 0.5 + pattern * 0.2 + ripple * 0.5;
                    gl_FragColor = vec4(color, alpha * 0.7);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.shieldMesh = new THREE.Mesh(geometry, material);
        this.shieldMesh.visible = false;
        this.mesh.add(this.shieldMesh);
    }

    /**
     * Create engine trail effect
     */
    createTrail() {
        const maxPoints = 50;
        const geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(maxPoints * 3);
        const colors = new Float32Array(maxPoints * 3);

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.trail = new THREE.Line(geometry, material);
        this.scene.add(this.trail);

        // Initialize trail positions
        for (let i = 0; i < maxPoints; i++) {
            this.trailPositions.push(this.position.clone());
        }
    }

    /**
     * Update ship state
     */
    update(deltaTime, gesture, aimPosition) {
        const dt = deltaTime * 0.001;

        // Update aim position
        this.aimPosition = aimPosition;

        // Process gesture controls
        this.processGesture(gesture, dt);

        // Update rotation based on aim
        this.updateRotation(dt);

        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        // Apply velocity dampening when not thrusting
        if (!this.isThrusting && !this.isBoosting) {
            this.velocity.multiplyScalar(0.99);
        }

        // Regenerate energy
        this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegen * dt);

        // Regenerate shields if not recently hit
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + 5 * dt);
        }

        // Update mesh
        this.updateMesh(deltaTime);

        // Update trail
        this.updateTrail();
    }

    /**
     * Process gesture input
     */
    processGesture(gesture, dt) {
        this.isThrusting = false;
        this.isBraking = false;
        this.isBoosting = false;

        switch (gesture) {
            case 'THRUST':
                this.isThrusting = true;
                this.thrust(dt);
                break;

            case 'BRAKE':
                this.isBraking = true;
                this.brake(dt);
                break;

            case 'BOOST':
                if (this.energy > 20) {
                    this.isBoosting = true;
                    this.boost(dt);
                }
                break;

            case 'BARREL_ROLL':
                this.barrelRoll();
                break;

            case 'SHIELD':
                this.activateShield();
                break;
        }
    }

    /**
     * Apply thrust
     */
    thrust(dt) {
        // Get forward direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.quaternion);

        // Apply acceleration
        this.velocity.add(forward.multiplyScalar(this.acceleration * dt));

        // Clamp to max speed
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
    }

    /**
     * Apply braking
     */
    brake(dt) {
        this.velocity.multiplyScalar(1 - this.deceleration * dt * 0.01);
    }

    /**
     * Apply boost
     */
    boost(dt) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.quaternion);

        this.velocity.add(forward.multiplyScalar(this.acceleration * this.boostMultiplier * dt));

        // Clamp to boosted max speed
        const boostedMax = this.maxSpeed * this.boostMultiplier;
        if (this.velocity.length() > boostedMax) {
            this.velocity.normalize().multiplyScalar(boostedMax);
        }

        // Consume energy
        this.energy -= 30 * dt;
    }

    /**
     * Perform barrel roll (invincibility frames)
     */
    barrelRoll() {
        if (this.isInvulnerable) return;
        if (this.energy < 20) return;

        this.isInvulnerable = true;
        this.energy -= 20;

        // Animate roll
        const startRotation = this.mesh.rotation.z;
        const duration = 500;
        const startTime = performance.now();

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out
            const eased = 1 - Math.pow(1 - progress, 3);
            this.mesh.rotation.z = startRotation + Math.PI * 2 * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isInvulnerable = false;
                this.mesh.rotation.z = startRotation;
            }
        };

        animate();
    }

    /**
     * Activate shield
     */
    activateShield() {
        if (this.shieldActive) return;
        if (this.energy < 10) return;

        this.shieldActive = true;
        this.shieldMesh.visible = true;

        // Consume energy while active
        const drainInterval = setInterval(() => {
            this.energy -= 5;
            if (this.energy <= 0) {
                this.deactivateShield();
                clearInterval(drainInterval);
            }
        }, 100);

        // Auto-deactivate after 3 seconds
        setTimeout(() => {
            this.deactivateShield();
            clearInterval(drainInterval);
        }, 3000);
    }

    /**
     * Deactivate shield
     */
    deactivateShield() {
        this.shieldActive = false;
        this.shieldMesh.visible = false;
    }

    /**
     * Update rotation based on aim position
     */
    updateRotation(dt) {
        // Convert aim position (0-1) to rotation angles
        const targetPitch = (this.aimPosition.y - 0.5) * Math.PI * 0.5;
        const targetYaw = (this.aimPosition.x - 0.5) * Math.PI * 0.5;

        // Smoothly interpolate rotation
        this.rotation.x += (targetPitch - this.rotation.x) * this.rotationSpeed * dt;
        this.rotation.y += (-targetYaw - this.rotation.y) * this.rotationSpeed * dt;

        // Update quaternion
        this.quaternion.setFromEuler(this.rotation);
    }

    /**
     * Update mesh visuals
     */
    updateMesh(deltaTime) {
        // Update position
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.quaternion);

        // Update thrusters
        const thrusterIntensity = this.isThrusting ? 1 : (this.isBoosting ? 2 : 0);

        this.thrusters.forEach(thruster => {
            thruster.group.visible = thrusterIntensity > 0;

            if (thruster.group.visible) {
                const scale = thrusterIntensity * (0.8 + Math.random() * 0.4);
                thruster.core.scale.z = scale;
                thruster.outer.scale.z = scale * 1.2;

                // Color intensity
                thruster.core.material.opacity = 0.6 + Math.random() * 0.4;
            }
        });

        // Update engines
        this.engines.forEach(engine => {
            const intensity = this.isThrusting ? 0.8 : (this.isBoosting ? 1 : 0.3);
            engine.material.opacity = intensity;

            if (this.isBoosting) {
                engine.material.color.setHex(0xff00aa);
            } else {
                engine.material.color.setHex(0x00f0ff);
            }
        });

        // Update shield
        if (this.shieldMesh.visible) {
            this.shieldMesh.material.uniforms.time.value += deltaTime * 0.001;

            // Pulse effect
            const pulse = 1 + Math.sin(performance.now() * 0.005) * 0.05;
            this.shieldMesh.scale.setScalar(pulse);
        }

        // Wing accent pulse
        this.accents.forEach(accent => {
            const pulse = 0.7 + Math.sin(performance.now() * 0.003) * 0.3;
            accent.material.opacity = pulse;
        });
    }

    /**
     * Update trail effect
     */
    updateTrail() {
        // Shift trail positions
        for (let i = this.trailPositions.length - 1; i > 0; i--) {
            this.trailPositions[i].copy(this.trailPositions[i - 1]);
        }
        this.trailPositions[0].copy(this.position);

        // Update geometry
        const positions = this.trail.geometry.attributes.position.array;
        const colors = this.trail.geometry.attributes.color.array;

        for (let i = 0; i < this.trailPositions.length; i++) {
            const pos = this.trailPositions[i];
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;

            // Fade color along trail
            const alpha = 1 - i / this.trailPositions.length;
            colors[i * 3] = 0;
            colors[i * 3 + 1] = alpha * 0.9;
            colors[i * 3 + 2] = alpha;
        }

        this.trail.geometry.attributes.position.needsUpdate = true;
        this.trail.geometry.attributes.color.needsUpdate = true;

        // Only show trail when moving fast
        this.trail.visible = this.velocity.length() > 50;
    }

    /**
     * Take damage
     */
    takeDamage(amount, hitPoint = null) {
        if (this.isInvulnerable) return;

        // Shield absorbs damage first
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, amount);
            this.shield -= shieldDamage;
            amount -= shieldDamage;

            // Shield hit effect
            if (hitPoint && this.shieldMesh.material.uniforms) {
                this.shieldMesh.material.uniforms.hitPoint.value.copy(hitPoint);
                this.shieldMesh.material.uniforms.hitTime.value =
                    this.shieldMesh.material.uniforms.time.value;

                // Flash shield visible
                this.shieldMesh.visible = true;
                setTimeout(() => {
                    if (!this.shieldActive) {
                        this.shieldMesh.visible = false;
                    }
                }, 300);
            }
        }

        // Remaining damage hits hull
        if (amount > 0) {
            this.hull -= amount;

            // Flash effect
            this.mesh.traverse(child => {
                if (child.material && child.material.emissive) {
                    const original = child.material.emissive.clone();
                    child.material.emissive.set(0xff0000);
                    setTimeout(() => {
                        child.material.emissive.copy(original);
                    }, 100);
                }
            });
        }

        return this.hull <= 0;
    }

    /**
     * Get current speed
     */
    getSpeed() {
        return Math.round(this.velocity.length());
    }

    /**
     * Get forward direction
     */
    getForward() {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.quaternion);
        return forward;
    }

    /**
     * Get ship stats for HUD
     */
    getStats() {
        return {
            hull: this.hull,
            maxHull: this.maxHull,
            shield: this.shield,
            maxShield: this.maxShield,
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            speed: this.getSpeed()
        };
    }
}

export default Aurelian;
