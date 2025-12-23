/**
 * AETHELGARD: EVENT HORIZON
 * Asteroid Field Module
 * 
 * Procedurally generates asteroid fields with
 * LOD and collision detection.
 */

import * as THREE from 'three';

export class AsteroidField {
    constructor(scene) {
        this.scene = scene;
        this.asteroids = [];
        this.debris = [];
        this.pool = [];

        this.bounds = {
            x: { min: -5000, max: 5000 },
            y: { min: -2000, max: 2000 },
            z: { min: -10000, max: 2000 }
        };

        this.init();
    }

    init() {
        // Create asteroid materials
        this.materials = this.createMaterials();

        // Create asteroid geometries (LOD)
        this.geometries = this.createGeometries();

        // Generate initial field
        this.generateField(100);

        console.log('☄️ Asteroid field generated');
    }

    /**
     * Create asteroid materials with variations
     */
    createMaterials() {
        const materials = [];

        // Dark rocky material
        materials.push(new THREE.MeshStandardMaterial({
            color: 0x2a2a30,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        }));

        // Iron-rich material
        materials.push(new THREE.MeshStandardMaterial({
            color: 0x3a2a2a,
            roughness: 0.7,
            metalness: 0.4,
            flatShading: true
        }));

        // Ice asteroid
        materials.push(new THREE.MeshStandardMaterial({
            color: 0x6080a0,
            roughness: 0.3,
            metalness: 0.2,
            transparent: true,
            opacity: 0.9,
            flatShading: true
        }));

        // Crystal asteroid (glowing)
        materials.push(new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00f0ff,
            emissiveIntensity: 0.3,
            roughness: 0.2,
            metalness: 0.8,
            flatShading: true
        }));

        // Magenta crystal
        materials.push(new THREE.MeshStandardMaterial({
            color: 0xff00aa,
            emissive: 0xff00aa,
            emissiveIntensity: 0.2,
            roughness: 0.2,
            metalness: 0.8,
            flatShading: true
        }));

        return materials;
    }

    /**
     * Create asteroid geometries of varying complexity
     */
    createGeometries() {
        const geometries = {
            small: [],
            medium: [],
            large: []
        };

        // Small asteroids (simpler geometry)
        for (let i = 0; i < 5; i++) {
            const geo = new THREE.IcosahedronGeometry(1, 0);
            this.deformGeometry(geo, 0.3);
            geometries.small.push(geo);
        }

        // Medium asteroids
        for (let i = 0; i < 5; i++) {
            const geo = new THREE.IcosahedronGeometry(1, 1);
            this.deformGeometry(geo, 0.4);
            geometries.medium.push(geo);
        }

        // Large asteroids (more detail)
        for (let i = 0; i < 3; i++) {
            const geo = new THREE.IcosahedronGeometry(1, 2);
            this.deformGeometry(geo, 0.5);
            geometries.large.push(geo);
        }

        return geometries;
    }

    /**
     * Deform geometry to look more natural
     */
    deformGeometry(geometry, intensity) {
        const positions = geometry.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);

            // Apply noise-based deformation
            const noise = (Math.random() - 0.5) * 2 * intensity;
            const length = Math.sqrt(x * x + y * y + z * z);
            const newLength = length * (1 + noise);

            positions.setXYZ(
                i,
                x / length * newLength,
                y / length * newLength,
                z / length * newLength
            );
        }

        geometry.computeVertexNormals();
    }

    /**
     * Generate asteroid field
     */
    generateField(count) {
        for (let i = 0; i < count; i++) {
            this.spawnAsteroid();
        }
    }

    /**
     * Spawn a single asteroid
     */
    spawnAsteroid(position = null) {
        // Determine size
        const sizeRoll = Math.random();
        let sizeCategory, scale, health;

        if (sizeRoll < 0.6) {
            sizeCategory = 'small';
            scale = 10 + Math.random() * 20;
            health = 1;
        } else if (sizeRoll < 0.9) {
            sizeCategory = 'medium';
            scale = 30 + Math.random() * 50;
            health = 3;
        } else {
            sizeCategory = 'large';
            scale = 80 + Math.random() * 150;
            health = 5;
        }

        // Select random geometry and material
        const geoList = this.geometries[sizeCategory];
        const geometry = geoList[Math.floor(Math.random() * geoList.length)];
        const material = this.materials[Math.floor(Math.random() * this.materials.length)].clone();

        const asteroid = new THREE.Mesh(geometry, material);
        asteroid.scale.setScalar(scale);

        // Position
        if (position) {
            asteroid.position.copy(position);
        } else {
            asteroid.position.set(
                THREE.MathUtils.randFloat(this.bounds.x.min, this.bounds.x.max),
                THREE.MathUtils.randFloat(this.bounds.y.min, this.bounds.y.max),
                THREE.MathUtils.randFloat(this.bounds.z.min, this.bounds.z.max)
            );
        }

        // Random rotation
        asteroid.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );

        // Store asteroid data
        asteroid.userData = {
            type: 'asteroid',
            sizeCategory,
            health,
            maxHealth: health,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            },
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 2
            ),
            boundingRadius: scale
        };

        this.asteroids.push(asteroid);
        this.scene.add(asteroid);

        return asteroid;
    }

    /**
     * Update asteroid field
     */
    update(deltaTime, playerPosition) {
        const dt = deltaTime * 0.001;

        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];

            // Rotate
            asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
            asteroid.rotation.y += asteroid.userData.rotationSpeed.y;
            asteroid.rotation.z += asteroid.userData.rotationSpeed.z;

            // Move slowly
            asteroid.position.add(
                asteroid.userData.velocity.clone().multiplyScalar(dt)
            );

            // Wrap around or respawn if too far
            const distanceFromPlayer = asteroid.position.distanceTo(playerPosition);

            if (distanceFromPlayer > 15000) {
                // Respawn asteroid in front of player
                const angle = Math.random() * Math.PI * 2;
                const distance = 8000 + Math.random() * 5000;

                asteroid.position.set(
                    playerPosition.x + Math.cos(angle) * distance,
                    playerPosition.y + (Math.random() - 0.5) * 2000,
                    playerPosition.z - distance
                );
            }
        }

        // Update debris
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const piece = this.debris[i];
            piece.userData.lifetime -= deltaTime;

            if (piece.userData.lifetime <= 0) {
                this.scene.remove(piece);
                this.debris.splice(i, 1);
            } else {
                // Move and fade
                piece.position.add(piece.userData.velocity.clone().multiplyScalar(dt));
                piece.rotation.x += piece.userData.rotationSpeed.x;
                piece.rotation.y += piece.userData.rotationSpeed.y;

                const alpha = piece.userData.lifetime / 3000;
                piece.material.opacity = alpha;
            }
        }
    }

    /**
     * Check collision with asteroid
     */
    checkCollision(position, radius) {
        for (const asteroid of this.asteroids) {
            const distance = position.distanceTo(asteroid.position);
            if (distance < radius + asteroid.userData.boundingRadius) {
                return asteroid;
            }
        }
        return null;
    }

    /**
     * Damage an asteroid
     */
    damageAsteroid(asteroid, damage) {
        asteroid.userData.health -= damage;

        // Flash effect
        const originalEmissive = asteroid.material.emissive.clone();
        asteroid.material.emissive.set(0xffffff);

        setTimeout(() => {
            if (asteroid.material) {
                asteroid.material.emissive.copy(originalEmissive);
            }
        }, 100);

        if (asteroid.userData.health <= 0) {
            this.destroyAsteroid(asteroid);
            return true;
        }
        return false;
    }

    /**
     * Destroy an asteroid and create debris
     */
    destroyAsteroid(asteroid) {
        const position = asteroid.position.clone();
        const scale = asteroid.scale.x;

        // Remove from arrays
        const index = this.asteroids.indexOf(asteroid);
        if (index > -1) {
            this.asteroids.splice(index, 1);
        }
        this.scene.remove(asteroid);

        // Spawn debris pieces
        const debrisCount = Math.floor(3 + Math.random() * 5);

        for (let i = 0; i < debrisCount; i++) {
            const debrisGeo = new THREE.TetrahedronGeometry(scale * 0.15);
            const debrisMat = asteroid.material.clone();
            debrisMat.transparent = true;

            const debris = new THREE.Mesh(debrisGeo, debrisMat);
            debris.position.copy(position);
            debris.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * scale * 0.5,
                (Math.random() - 0.5) * scale * 0.5,
                (Math.random() - 0.5) * scale * 0.5
            ));

            debris.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100
                ),
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.1,
                    y: (Math.random() - 0.5) * 0.1
                },
                lifetime: 3000
            };

            this.debris.push(debris);
            this.scene.add(debris);
        }

        // Spawn smaller asteroids if big enough
        if (asteroid.userData.sizeCategory === 'large') {
            for (let i = 0; i < 2; i++) {
                const newPos = position.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * scale,
                    (Math.random() - 0.5) * scale,
                    (Math.random() - 0.5) * scale
                ));
                this.spawnAsteroid(newPos);
            }
        }

        return position;
    }

    /**
     * Get nearby asteroids for radar
     */
    getNearbyAsteroids(position, radius) {
        return this.asteroids.filter(asteroid =>
            position.distanceTo(asteroid.position) < radius
        ).map(asteroid => ({
            position: asteroid.position.clone(),
            size: asteroid.userData.sizeCategory
        }));
    }
}

export default AsteroidField;
