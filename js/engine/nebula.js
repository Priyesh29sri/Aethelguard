/**
 * AETHELGARD: EVENT HORIZON
 * Nebula Environment Module
 * 
 * Creates the atmospheric "Luminous Expanse" nebula
 * with volumetric effects and dynamic lighting.
 */

import * as THREE from 'three';

export class Nebula {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.nebulaClouds = [];
        this.time = 0;

        this.init();
    }

    init() {
        this.createSkybox();
        this.createStarfield();
        this.createNebulaGas();
        this.createDistantStructures();
        this.createLighting();

        console.log('🌌 Nebula environment created');
    }

    /**
     * Create gradient skybox
     */
    createSkybox() {
        // Create a large sphere for the skybox
        const geometry = new THREE.SphereGeometry(40000, 64, 32);

        // Custom shader material for gradient nebula sky
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorA: { value: new THREE.Color(0x0a0a12) },  // Dark
                colorB: { value: new THREE.Color(0x1a3a4a) },  // Teal
                colorC: { value: new THREE.Color(0x3a1a2a) },  // Purple
                colorD: { value: new THREE.Color(0x2a1a0a) }   // Orange
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec2 vUv;
                
                void main() {
                    vPosition = position;
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 colorA;
                uniform vec3 colorB;
                uniform vec3 colorC;
                uniform vec3 colorD;
                varying vec3 vPosition;
                varying vec2 vUv;
                
                // Noise function
                float noise(vec3 p) {
                    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
                }
                
                void main() {
                    vec3 dir = normalize(vPosition);
                    
                    // Gradient based on direction
                    float tealInfluence = pow(max(0.0, dir.x * 0.5 + 0.5), 2.0);
                    float purpleInfluence = pow(max(0.0, -dir.x * 0.5 + 0.5), 2.0);
                    float orangeInfluence = pow(max(0.0, dir.y), 1.5);
                    
                    // Blend colors
                    vec3 color = colorA;
                    color = mix(color, colorB, tealInfluence * 0.6);
                    color = mix(color, colorC, purpleInfluence * 0.5);
                    color = mix(color, colorD, orangeInfluence * 0.3);
                    
                    // Add subtle noise
                    float n = noise(dir * 10.0 + time * 0.01) * 0.1;
                    color += n;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.BackSide,
            depthWrite: false
        });

        this.skybox = new THREE.Mesh(geometry, material);
        this.scene.add(this.skybox);
    }

    /**
     * Create parallax starfield
     */
    createStarfield() {
        const layers = [
            { count: 5000, size: 2, distance: 30000, speed: 0.1 },
            { count: 3000, size: 3, distance: 20000, speed: 0.2 },
            { count: 1000, size: 4, distance: 10000, speed: 0.3 }
        ];

        layers.forEach((layer, index) => {
            const geometry = new THREE.BufferGeometry();
            const positions = [];
            const colors = [];
            const sizes = [];

            for (let i = 0; i < layer.count; i++) {
                // Random position on sphere
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = layer.distance * (0.8 + Math.random() * 0.2);

                positions.push(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );

                // Star colors (white to cyan to blue)
                const colorChoice = Math.random();
                if (colorChoice < 0.7) {
                    colors.push(1, 1, 1); // White
                } else if (colorChoice < 0.85) {
                    colors.push(0.7, 0.9, 1); // Cyan
                } else {
                    colors.push(1, 0.8, 0.6); // Orange/yellow
                }

                sizes.push(layer.size * (0.5 + Math.random() * 0.5));
            }

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 }
                },
                vertexShader: `
                    attribute float size;
                    attribute vec3 color;
                    varying vec3 vColor;
                    uniform float time;
                    
                    void main() {
                        vColor = color;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        
                        // Twinkle effect
                        float twinkle = sin(time * 3.0 + position.x * 0.01) * 0.3 + 0.7;
                        
                        gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    
                    void main() {
                        float dist = length(gl_PointCoord - vec2(0.5));
                        if (dist > 0.5) discard;
                        
                        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                        gl_FragColor = vec4(vColor, alpha);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            const stars = new THREE.Points(geometry, material);
            stars.userData.speed = layer.speed;
            this.particles.push(stars);
            this.scene.add(stars);
        });
    }

    /**
     * Create volumetric nebula gas clouds
     */
    createNebulaGas() {
        const cloudCount = 50;
        const textureSize = 128;

        // Generate procedural cloud texture
        const canvas = document.createElement('canvas');
        canvas.width = textureSize;
        canvas.height = textureSize;
        const ctx = canvas.getContext('2d');

        // Create radial gradient
        const gradient = ctx.createRadialGradient(
            textureSize / 2, textureSize / 2, 0,
            textureSize / 2, textureSize / 2, textureSize / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, textureSize, textureSize);

        const cloudTexture = new THREE.CanvasTexture(canvas);

        // Cloud colors
        const cloudColors = [
            new THREE.Color(0x00f0ff).multiplyScalar(0.3), // Cyan
            new THREE.Color(0xff00aa).multiplyScalar(0.2), // Magenta
            new THREE.Color(0xffaa00).multiplyScalar(0.2), // Orange
            new THREE.Color(0x00ffaa).multiplyScalar(0.2), // Teal
            new THREE.Color(0xaa00ff).multiplyScalar(0.2)  // Purple
        ];

        for (let i = 0; i < cloudCount; i++) {
            const size = 500 + Math.random() * 2000;
            const geometry = new THREE.PlaneGeometry(size, size);

            const material = new THREE.MeshBasicMaterial({
                map: cloudTexture,
                color: cloudColors[Math.floor(Math.random() * cloudColors.length)],
                transparent: true,
                opacity: 0.3 + Math.random() * 0.3,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });

            const cloud = new THREE.Mesh(geometry, material);

            // Random position
            cloud.position.set(
                (Math.random() - 0.5) * 10000,
                (Math.random() - 0.5) * 5000,
                (Math.random() - 0.5) * 10000 - 3000
            );

            // Random rotation
            cloud.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            cloud.userData.rotationSpeed = (Math.random() - 0.5) * 0.0001;
            cloud.userData.driftSpeed = (Math.random() - 0.5) * 0.05;

            this.nebulaClouds.push(cloud);
            this.scene.add(cloud);
        }
    }

    /**
     * Create distant crystalline structures and asteroids
     */
    createDistantStructures() {
        const structureCount = 30;

        for (let i = 0; i < structureCount; i++) {
            // Create icosahedron for crystal look
            const size = 100 + Math.random() * 400;
            const geometry = new THREE.IcosahedronGeometry(size, 0);

            // Glowing material
            const hue = Math.random();
            const color = new THREE.Color().setHSL(hue, 0.8, 0.5);

            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.3,
                metalness: 0.9,
                roughness: 0.1,
                transparent: true,
                opacity: 0.8
            });

            const structure = new THREE.Mesh(geometry, material);

            // Position in distance
            const angle = Math.random() * Math.PI * 2;
            const distance = 3000 + Math.random() * 7000;
            structure.position.set(
                Math.cos(angle) * distance,
                (Math.random() - 0.5) * 3000,
                Math.sin(angle) * distance - 5000
            );

            structure.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            structure.userData.rotationSpeed = {
                x: (Math.random() - 0.5) * 0.001,
                y: (Math.random() - 0.5) * 0.001,
                z: (Math.random() - 0.5) * 0.001
            };

            this.scene.add(structure);
        }
    }

    /**
     * Create dynamic lighting
     */
    createLighting() {
        // Ambient light (dim)
        const ambient = new THREE.AmbientLight(0x0a1020, 0.5);
        this.scene.add(ambient);

        // Main sun/star light
        this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.0);
        this.sunLight.position.set(1000, 500, -500);
        this.scene.add(this.sunLight);

        // Secondary fill light (cyan)
        const fillLight = new THREE.DirectionalLight(0x00f0ff, 0.3);
        fillLight.position.set(-500, -200, 500);
        this.scene.add(fillLight);

        // Rim light (magenta)
        const rimLight = new THREE.DirectionalLight(0xff00aa, 0.2);
        rimLight.position.set(0, 200, -1000);
        this.scene.add(rimLight);

        // Point lights for nearby nebula glow
        const pointLights = [
            { color: 0x00f0ff, position: [500, 200, -1000], intensity: 0.5 },
            { color: 0xff00aa, position: [-500, -100, -500], intensity: 0.3 },
            { color: 0xffaa00, position: [0, 300, -2000], intensity: 0.4 }
        ];

        pointLights.forEach(config => {
            const light = new THREE.PointLight(config.color, config.intensity, 2000);
            light.position.set(...config.position);
            this.scene.add(light);
        });
    }

    /**
     * Update nebula animation
     */
    update(deltaTime) {
        this.time += deltaTime * 0.001;

        // Update skybox
        if (this.skybox) {
            this.skybox.material.uniforms.time.value = this.time;
        }

        // Update star layers
        this.particles.forEach(stars => {
            stars.material.uniforms.time.value = this.time;
            stars.rotation.y += stars.userData.speed * deltaTime * 0.00001;
        });

        // Update nebula clouds
        this.nebulaClouds.forEach(cloud => {
            cloud.rotation.z += cloud.userData.rotationSpeed * deltaTime;
            cloud.position.x += cloud.userData.driftSpeed * deltaTime;

            // Wrap around
            if (cloud.position.x > 10000) cloud.position.x = -10000;
            if (cloud.position.x < -10000) cloud.position.x = 10000;
        });
    }

    /**
     * Create ship wake effect in nebula gas
     */
    createWake(position, direction, intensity = 1) {
        // This creates a temporary disturbance in the nebula
        // In a full implementation, this would affect nearby particle systems
    }
}

export default Nebula;
