/**
 * AETHELGARD: EVENT HORIZON
 * Hand Tracking Module
 * 
 * Uses MediaPipe Hands for real-time gesture recognition
 * to control the spaceship.
 */

export class HandTracker {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;

        // Hand data
        this.leftHand = null;
        this.rightHand = null;

        // Gesture states
        this.currentGesture = 'IDLE';
        this.previousGesture = 'IDLE';
        this.gestureConfidence = 0;

        // Smoothing - INCREASED for smoother but responsive controls
        this.smoothingFactor = 0.5; // Higher = more responsive
        this.aimPosition = { x: 0.5, y: 0.5 };
        this.smoothAimPosition = { x: 0.5, y: 0.5 };

        // Gesture thresholds - RELAXED for easier control
        this.pinchThreshold = 0.12;  // Easier to trigger pinch
        this.fistThreshold = 0.18;   // Easier to detect fist
        this.openPalmThreshold = 0.15; // Easier to detect open palm

        // Gesture stability (prevents flickering)
        this.gestureHoldTime = 0;
        this.gestureHoldThreshold = 50; // ms to hold gesture before changing

        // Callbacks
        this.onGestureChange = null;
        this.onHandUpdate = null;

        // State
        this.isInitialized = false;
        this.isRunning = false;
    }

    /**
     * Initialize MediaPipe Hands
     */
    async initialize(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');

        // Set canvas size to match video
        this.canvas.width = 200;
        this.canvas.height = 150;

        // Initialize MediaPipe Hands
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults((results) => this.processResults(results));

        this.isInitialized = true;
        console.log('🖐️ Hand tracking initialized');
    }

    /**
     * Start camera and hand tracking
     */
    async start() {
        if (!this.isInitialized) {
            console.error('Hand tracking not initialized');
            return false;
        }

        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                }
            });

            this.video.srcObject = stream;
            await this.video.play();

            // Initialize MediaPipe camera
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    if (this.isRunning) {
                        await this.hands.send({ image: this.video });
                    }
                },
                width: 640,
                height: 480
            });

            await this.camera.start();
            this.isRunning = true;

            console.log('📷 Camera started');
            return true;

        } catch (error) {
            console.error('Failed to start camera:', error);
            return false;
        }
    }

    /**
     * Stop hand tracking
     */
    stop() {
        this.isRunning = false;
        if (this.camera) {
            this.camera.stop();
        }
        if (this.video && this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
        }
        console.log('🛑 Hand tracking stopped');
    }

    /**
     * Process MediaPipe results
     */
    processResults(results) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw video frame (mirrored)
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(
            results.image,
            -this.canvas.width, 0,
            this.canvas.width, this.canvas.height
        );
        this.ctx.restore();

        // Reset hand data
        this.leftHand = null;
        this.rightHand = null;

        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];

                // Draw landmarks
                this.drawHandLandmarks(landmarks);

                // Classify hand (MediaPipe returns opposite handedness for mirrored view)
                const isRightHand = handedness.label === 'Left';

                const handData = this.analyzeHand(landmarks);

                if (isRightHand) {
                    this.rightHand = handData;
                } else {
                    this.leftHand = handData;
                }
            }
        }

        // Detect gesture
        this.detectGesture();

        // Update aim position based on right hand
        this.updateAimPosition();

        // Notify callback
        if (this.onHandUpdate) {
            this.onHandUpdate({
                leftHand: this.leftHand,
                rightHand: this.rightHand,
                gesture: this.currentGesture,
                aimPosition: this.smoothAimPosition
            });
        }
    }

    /**
     * Draw hand landmarks on debug canvas
     */
    drawHandLandmarks(landmarks) {
        // Draw connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],     // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],     // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17]            // Palm
        ];

        this.ctx.strokeStyle = '#00f0ff';
        this.ctx.lineWidth = 1;

        for (const [start, end] of connections) {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];

            this.ctx.beginPath();
            this.ctx.moveTo(
                (1 - startPoint.x) * this.canvas.width,
                startPoint.y * this.canvas.height
            );
            this.ctx.lineTo(
                (1 - endPoint.x) * this.canvas.width,
                endPoint.y * this.canvas.height
            );
            this.ctx.stroke();
        }

        // Draw landmarks
        for (const landmark of landmarks) {
            this.ctx.beginPath();
            this.ctx.arc(
                (1 - landmark.x) * this.canvas.width,
                landmark.y * this.canvas.height,
                3,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = '#ff00aa';
            this.ctx.fill();
        }
    }

    /**
     * Analyze hand landmarks to extract features
     */
    analyzeHand(landmarks) {
        // Key landmarks
        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        const thumbMcp = landmarks[2];
        const indexMcp = landmarks[5];
        const middleMcp = landmarks[9];
        const ringMcp = landmarks[13];
        const pinkyMcp = landmarks[17];

        const indexPip = landmarks[6];
        const middlePip = landmarks[10];
        const ringPip = landmarks[14];
        const pinkyPip = landmarks[18];

        // Calculate distances
        const palmSize = this.distance3D(wrist, middleMcp);

        // Pinch detection (thumb to index)
        const pinchDistance = this.distance3D(thumbTip, indexTip) / palmSize;
        const isPinching = pinchDistance < this.pinchThreshold;

        // Finger extension detection
        const indexExtended = this.isFingerExtended(indexMcp, indexPip, indexTip);
        const middleExtended = this.isFingerExtended(middleMcp, middlePip, middleTip);
        const ringExtended = this.isFingerExtended(ringMcp, ringPip, ringTip);
        const pinkyExtended = this.isFingerExtended(pinkyMcp, pinkyPip, pinkyTip);
        const thumbExtended = thumbTip.x < thumbMcp.x; // Simplified thumb detection

        // Count extended fingers
        const extendedFingers = [indexExtended, middleExtended, ringExtended, pinkyExtended]
            .filter(Boolean).length;

        // Fist detection (all fingers curled)
        const isFist = extendedFingers === 0 && !thumbExtended;

        // Open palm detection (all fingers extended)
        const isOpenPalm = extendedFingers >= 3 && thumbExtended;

        // Pointing detection (only index extended)
        const isPointing = indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

        // Calculate palm center
        const palmCenter = {
            x: (wrist.x + indexMcp.x + pinkyMcp.x) / 3,
            y: (wrist.y + indexMcp.y + pinkyMcp.y) / 3,
            z: (wrist.z + indexMcp.z + pinkyMcp.z) / 3
        };

        // Calculate pointing direction
        const pointDirection = {
            x: indexTip.x - indexMcp.x,
            y: indexTip.y - indexMcp.y
        };

        return {
            landmarks,
            palmCenter,
            palmSize,
            pinchDistance,
            isPinching,
            isFist,
            isOpenPalm,
            isPointing,
            indexExtended,
            middleExtended,
            ringExtended,
            pinkyExtended,
            thumbExtended,
            extendedFingers,
            pointDirection,
            indexTip: { x: indexTip.x, y: indexTip.y }
        };
    }

    /**
     * Check if a finger is extended
     */
    isFingerExtended(mcp, pip, tip) {
        // Finger is extended if tip is further from palm than pip
        const mcpToTip = this.distance2D(mcp, tip);
        const mcpToPip = this.distance2D(mcp, pip);
        return mcpToTip > mcpToPip * 1.2;
    }

    /**
     * Calculate 2D distance
     */
    distance2D(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    /**
     * Calculate 3D distance
     */
    distance3D(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
    }

    /**
     * Detect current gesture from hand data
     */
    detectGesture() {
        this.previousGesture = this.currentGesture;

        // Priority-based gesture detection

        // 1. Two-hand gestures (highest priority)
        if (this.leftHand && this.rightHand) {
            // Barrel Roll: Both hands spread apart
            const handDistance = Math.abs(this.leftHand.palmCenter.x - this.rightHand.palmCenter.x);
            if (handDistance > 0.4 && this.leftHand.isOpenPalm && this.rightHand.isOpenPalm) {
                this.currentGesture = 'BARREL_ROLL';
                return;
            }

            // Boost: Both hands pushing forward (palms facing camera, close together)
            if (handDistance < 0.3 && this.leftHand.isOpenPalm && this.rightHand.isOpenPalm) {
                this.currentGesture = 'BOOST';
                return;
            }

            // Shield: Cupped hands (both fists close together)
            if (handDistance < 0.2 && this.leftHand.isFist && this.rightHand.isFist) {
                this.currentGesture = 'SHIELD';
                return;
            }
        }

        // 2. Right hand gestures (primary control)
        if (this.rightHand) {
            // Fire: Pinch gesture
            if (this.rightHand.isPinching) {
                this.currentGesture = 'FIRE_PRIMARY';
                return;
            }

            // Brake: Fist
            if (this.rightHand.isFist) {
                this.currentGesture = 'BRAKE';
                return;
            }

            // Thrust: Open palm
            if (this.rightHand.isOpenPalm) {
                this.currentGesture = 'THRUST';
                return;
            }

            // Aim: Pointing
            if (this.rightHand.isPointing) {
                this.currentGesture = 'AIM';
                return;
            }
        }

        // 3. Left hand gestures (secondary control)
        if (this.leftHand) {
            // Fire secondary weapon
            if (this.leftHand.isPinching) {
                this.currentGesture = 'FIRE_SECONDARY';
                return;
            }
        }

        // Default: IDLE
        this.currentGesture = 'IDLE';

        // Notify on gesture change
        if (this.currentGesture !== this.previousGesture && this.onGestureChange) {
            this.onGestureChange(this.currentGesture, this.previousGesture);
        }
    }

    /**
     * Update aim position based on hand position
     */
    updateAimPosition() {
        if (this.rightHand) {
            // Use palm center for aiming
            const targetX = 1 - this.rightHand.palmCenter.x; // Mirror
            const targetY = this.rightHand.palmCenter.y;

            // If pointing, use index finger tip instead
            if (this.rightHand.isPointing) {
                this.aimPosition.x = 1 - this.rightHand.indexTip.x;
                this.aimPosition.y = this.rightHand.indexTip.y;
            } else {
                this.aimPosition.x = targetX;
                this.aimPosition.y = targetY;
            }
        }

        // Smooth the aim position
        this.smoothAimPosition.x += (this.aimPosition.x - this.smoothAimPosition.x) * this.smoothingFactor;
        this.smoothAimPosition.y += (this.aimPosition.y - this.smoothAimPosition.y) * this.smoothingFactor;

        // Clamp values
        this.smoothAimPosition.x = Math.max(0, Math.min(1, this.smoothAimPosition.x));
        this.smoothAimPosition.y = Math.max(0, Math.min(1, this.smoothAimPosition.y));
    }

    /**
     * Get gesture icon for display
     */
    getGestureIcon(gesture = this.currentGesture) {
        const icons = {
            'IDLE': '✋',
            'THRUST': '🖐️',
            'BRAKE': '✊',
            'AIM': '👆',
            'FIRE_PRIMARY': '🤏',
            'FIRE_SECONDARY': '🤏',
            'BARREL_ROLL': '🙌',
            'BOOST': '👐',
            'SHIELD': '🛡️'
        };
        return icons[gesture] || '❓';
    }

    /**
     * Get gesture display name
     */
    getGestureName(gesture = this.currentGesture) {
        const names = {
            'IDLE': 'STANDBY',
            'THRUST': 'THRUSTING',
            'BRAKE': 'BRAKING',
            'AIM': 'AIMING',
            'FIRE_PRIMARY': 'FIRING',
            'FIRE_SECONDARY': 'SECONDARY',
            'BARREL_ROLL': 'BARREL ROLL',
            'BOOST': 'BOOSTING',
            'SHIELD': 'SHIELD UP'
        };
        return names[gesture] || 'UNKNOWN';
    }

    /**
     * Check if hands are detected
     */
    hasHands() {
        return this.leftHand !== null || this.rightHand !== null;
    }

    /**
     * Get hand detection status for UI
     */
    getHandStatus() {
        return {
            left: this.leftHand !== null,
            right: this.rightHand !== null
        };
    }
}

export default HandTracker;
