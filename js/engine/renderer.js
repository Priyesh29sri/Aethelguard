/**
 * AETHELGARD: EVENT HORIZON
 * 3D Renderer Module
 * 
 * Configures Three.js with post-processing effects
 * for a stunning visual experience.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Custom chromatic aberration shader
const ChromaticAberrationShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'amount': { value: 0.005 },
        'angle': { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float amount;
        uniform float angle;
        varying vec2 vUv;
        
        void main() {
            vec2 offset = amount * vec2(cos(angle), sin(angle));
            vec4 cr = texture2D(tDiffuse, vUv + offset);
            vec4 cg = texture2D(tDiffuse, vUv);
            vec4 cb = texture2D(tDiffuse, vUv - offset);
            gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a);
        }
    `
};

// Vignette shader
const VignetteShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'darkness': { value: 0.5 },
        'offset': { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float darkness;
        uniform float offset;
        varying vec2 vUv;
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
            float vignette = 1.0 - dot(uv, uv);
            color.rgb *= mix(1.0 - darkness, 1.0, vignette);
            gl_FragColor = color;
        }
    `
};

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Performance tracking
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;

        // Screen shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffset = new THREE.Vector2();

        this.init();
    }

    init() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });

        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a0a12, 0.00015);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.width / this.height,
            0.1,
            50000
        );
        this.camera.position.set(0, 0, 0);

        // Setup post-processing
        this.setupPostProcessing();

        // Handle resize
        window.addEventListener('resize', () => this.handleResize());

        console.log('🎨 Renderer initialized');
    }

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);

        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Bloom pass
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height),
            0.8,    // strength
            0.4,    // radius
            0.85    // threshold
        );
        this.composer.addPass(this.bloomPass);

        // Chromatic aberration
        this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
        this.chromaticPass.uniforms['amount'].value = 0.003;
        this.composer.addPass(this.chromaticPass);

        // Vignette
        this.vignettePass = new ShaderPass(VignetteShader);
        this.vignettePass.uniforms['darkness'].value = 0.4;
        this.vignettePass.uniforms['offset'].value = 1.0;
        this.composer.addPass(this.vignettePass);
    }

    handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
        this.composer.setSize(this.width, this.height);
    }

    /**
     * Trigger screen shake effect
     */
    shake(intensity = 1, duration = 500) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    /**
     * Update shake effect
     */
    updateShake(deltaTime) {
        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaTime;

            // Calculate shake offset
            const intensity = this.shakeIntensity * (this.shakeDuration / 500);
            this.shakeOffset.x = (Math.random() - 0.5) * intensity * 0.02;
            this.shakeOffset.y = (Math.random() - 0.5) * intensity * 0.02;

            // Apply to camera
            this.camera.position.x += this.shakeOffset.x;
            this.camera.position.y += this.shakeOffset.y;
        } else {
            this.shakeOffset.set(0, 0);
        }
    }

    /**
     * Set chromatic aberration intensity
     */
    setChromaticAberration(amount) {
        this.chromaticPass.uniforms['amount'].value = amount;
    }

    /**
     * Set bloom intensity
     */
    setBloom(strength, radius = 0.4) {
        this.bloomPass.strength = strength;
        this.bloomPass.radius = radius;
    }

    /**
     * Flash effect (damage, boost, etc.)
     */
    flash(color = 0xffffff, duration = 200) {
        const originalExposure = this.renderer.toneMappingExposure;
        this.renderer.toneMappingExposure = 2.0;

        setTimeout(() => {
            this.renderer.toneMappingExposure = originalExposure;
        }, duration);
    }

    /**
     * Render the scene
     */
    render(deltaTime) {
        // Update shake
        this.updateShake(deltaTime);

        // Render with post-processing
        this.composer.render();

        // Track FPS
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    /**
     * Add object to scene
     */
    add(object) {
        this.scene.add(object);
    }

    /**
     * Remove object from scene
     */
    remove(object) {
        this.scene.remove(object);
    }

    /**
     * Get current FPS
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Dispose resources
     */
    dispose() {
        this.renderer.dispose();
        this.composer.dispose();
    }
}

export default Renderer;
