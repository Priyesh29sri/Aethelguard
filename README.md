# 🚀 AETHELGARD: Event Horizon

> **A futuristic hand-controlled space combat game**

![Hand Tracking Space Game](https://img.shields.io/badge/Control-Hand%20Gestures-00f0ff?style=for-the-badge)
![Three.js](https://img.shields.io/badge/3D-Three.js-ff00aa?style=for-the-badge)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-brightgreen?style=for-the-badge)

**Control your spaceship with just your hands** — no keyboard, no controller needed. Wave your hand to steer, pinch to fire, and spread both hands to barrel roll!

## 🎮 Play Now

**[▶️ Play Aethelgard](https://yourusername.github.io/aethelgard/)**  
*(Replace "yourusername" with your GitHub username after deployment)*

---

## 📖 The Story

In the bioluminescent depths of the **Aethelgard Nebula**, you pilot the **Aurelian** — a sentient prototype ship from a vanished civilization. The Vanguard Hegemony is tearing holes in spacetime, and only you can stop them.

---

## ✋ Hand Gesture Controls

| Gesture | Action | Description |
|:---:|:---|:---|
| 🖐️ **Open Palm** | **Thrust** | Accelerate forward |
| ✊ **Closed Fist** | **Brake** | Slow down and stop |
| 👆 **Point Finger** | **Aim** | Steer your ship direction |
| 🤏 **Pinch (Right)** | **Fire Primary** | Railgun / current weapon |
| 🤏 **Pinch (Left)** | **Fire Secondary** | Singularity Harpoon |
| 🙌 **Spread Hands** | **Barrel Roll** | Evasive dodge (invincibility) |
| 👐 **Push Forward** | **Boost** | Afterburner (uses energy) |
| 🤲 **Cup Hands** | **Shield** | Energy dome protection |

---

## ⚔️ Weapons Arsenal

### Shatter-Railgun ⚡
High-velocity kinetic slugs that pierce through enemy hulls.

### Solar Flare Beam ☀️
Sustained thermal laser that melts armor plating.

### Singularity Harpoon 🔮
Gravity tether that pulls enemies together into collisions.

---

## 👾 Enemy Types

| Type | Behavior | Threat Level |
|:---|:---|:---:|
| **Vanguard** | Aggressive ramming attacks | 🔴🔴🔴 |
| **Hunter** | Tactical flanking maneuvers | 🟡🟡 |
| **Coward** | Hit-and-run, calls reinforcements | 🟢 |

---

## 🛠️ Technical Stack

- **Three.js** - 3D WebGL rendering
- **MediaPipe Hands** - Real-time hand tracking AI
- **Web Audio API** - Procedural sound effects
- **Pure JavaScript** - No build step required

---

## 🚀 Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/aethelgard.git
cd aethelgard

# Serve with any local server (required for ES modules)
npx live-server --port=8080

# Or use Python
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

---

## 📤 Deploy to GitHub Pages

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Aethelgard Event Horizon"
   git remote add origin https://github.com/yourusername/aethelgard.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository Settings
   - Navigate to Pages section
   - Select "Deploy from branch"
   - Choose `main` branch and `/ (root)` folder
   - Save

3. **Access your game:**
   ```
   https://yourusername.github.io/aethelgard/
   ```

---

## 📋 Requirements

- Modern browser (Chrome, Edge, Firefox)
- WebGL 2.0 support
- Webcam for hand tracking
- Recommended: Desktop/laptop with decent GPU

---

## 🎨 Features

- ✅ Real-time hand gesture control
- ✅ Stunning volumetric nebula environment
- ✅ Procedural asteroid fields with destruction
- ✅ Three unique weapon systems
- ✅ AI enemies with distinct personalities
- ✅ Wave-based combat progression
- ✅ Cyberpunk HUD with radar
- ✅ Procedural sound effects
- ✅ No external dependencies required
- ✅ Instant GitHub Pages deployment

---

## 📁 Project Structure

```
aethelgard/
├── index.html              # Main entry point
├── styles/
│   └── main.css            # Cyberpunk UI styling
├── js/
│   ├── game.js             # Main game controller
│   ├── handTracking.js     # MediaPipe hand tracking
│   ├── engine/
│   │   ├── renderer.js     # Three.js + post-processing
│   │   ├── nebula.js       # Volumetric environment
│   │   └── asteroids.js    # Procedural asteroids
│   ├── ship/
│   │   ├── aurelian.js     # Player ship
│   │   └── weapons.js      # Weapon systems
│   ├── combat/
│   │   ├── enemyAI.js      # Enemy behaviors
│   │   └── waveManager.js  # Wave spawning
│   ├── ui/
│   │   └── hud.js          # HUD management
│   └── audio/
│       └── soundManager.js # Procedural audio
└── assets/                 # (Optional) Models, textures
```

---

## 🎯 Tips for Best Experience

1. **Good Lighting** - Hand tracking works best in well-lit environments
2. **Clear Background** - Solid colors behind your hands help accuracy
3. **Start Slow** - Get comfortable with gestures before intense combat
4. **Use Both Hands** - Special moves require two-hand gestures

---

## 📜 License

MIT License - Feel free to modify and share!

---

## 🌟 Credits

Created with ❤️ using:
- [Three.js](https://threejs.org/)
- [MediaPipe](https://google.github.io/mediapipe/)
- [GSAP](https://greensock.com/gsap/)
- [Howler.js](https://howlerjs.com/)

---

**May your ship navigate true through the Luminous Expanse!** ✨🚀
