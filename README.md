# Aethelgard: Event Horizon

**A browser-based space combat game controlled entirely by hand gestures**

Play Now: [https://priyesh29sri.github.io/Aethelguard/](https://priyesh29sri.github.io/Aethelguard/)

---

## Overview

Aethelgard: Event Horizon is an immersive space combat experience where you pilot the Aurelian, a prototype spacecraft, using only your hands. The game uses your webcam to track hand gestures in real-time, translating your movements into ship controls.

Set in the bioluminescent Aethelgard Nebula, you must survive waves of enemy ships while navigating through asteroid fields and nebula gas clouds.

---

## Hand Gesture Controls

| Gesture | Action | Description |
|:---|:---|:---|
| Open Palm | Thrust | Accelerate forward |
| Closed Fist | Brake | Decelerate and stop |
| Point Finger | Aim | Steer ship direction |
| Pinch (Right Hand) | Fire Primary | Railgun or current weapon |
| Pinch (Left Hand) | Fire Secondary | Singularity Harpoon |
| Spread Both Hands | Barrel Roll | Evasive maneuver with invincibility |
| Push Forward (Both) | Boost | Afterburner acceleration |
| Cupped Hands | Shield | Activate energy shield |

---

## Weapons

| Weapon | Type | Description |
|:---|:---|:---|
| Shatter-Railgun | Kinetic | High-velocity projectiles |
| Solar Flare Beam | Thermal | Continuous laser beam |
| Singularity Harpoon | Gravity | Tethers and pulls enemies |

---

## Enemy Types

| Type | Behavior | Threat Level |
|:---|:---|:---|
| Vanguard | Aggressive ramming attacks | High |
| Hunter | Tactical flanking maneuvers | Medium |
| Coward | Hit-and-run, calls reinforcements | Low |

---

## Technical Stack

- Three.js for 3D WebGL rendering
- MediaPipe Hands for real-time hand tracking
- Web Audio API for procedural sound effects
- Pure JavaScript with no build step required

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/Priyesh29sri/Aethelguard.git
cd Aethelguard

# Serve with any local server
npx live-server --port=8080

# Or use Python
python3 -m http.server 8080

# Open browser
open http://localhost:8080
```

---

## System Requirements

- Modern web browser with WebGL 2.0 support (Chrome, Edge, or Firefox recommended)
- Webcam for hand tracking
- Desktop or laptop computer

---

## Project Structure

```
Aethelguard/
├── index.html              # Entry point
├── styles/
│   └── main.css            # UI styling
└── js/
    ├── game.js             # Main controller
    ├── handTracking.js     # Gesture recognition
    ├── engine/
    │   ├── renderer.js     # Three.js setup
    │   ├── nebula.js       # Space environment
    │   └── asteroids.js    # Asteroid field
    ├── ship/
    │   ├── aurelian.js     # Player ship
    │   └── weapons.js      # Weapon systems
    ├── combat/
    │   ├── enemyAI.js      # Enemy behaviors
    │   └── waveManager.js  # Wave spawning
    ├── ui/
    │   └── hud.js          # HUD elements
    └── audio/
        └── soundManager.js # Sound effects
```

---

## License

MIT License

---

## Author

Priyesh Srivastava
