# NEXUS-CORE // 3D Sci-Fi Kinetic Audio Visualizer

An explosive, interactive 3D WebGL audio visualizer built with **Three.js** and the **Web Audio API**. Designed using modern software architecture standards (Singleton Facade, Observer/EventEmitter, Component-Entity modularity) and optimized for instant, zero-config deployment to **Vercel**.

---

## ⚡ Live Highlights & Features

- **Dynamic Subwoofer Spring Core (`AudioCore.js`)**:
  - Central icosahedron powered by custom GLSL vertex displacement with 3D Simplex noise.
  - **Subwoofer Spring Physics**: Dramatically contracts to `0.4x` when quiet and violently surges up to `3.2x` on beat kicks with elastic snap-back.
  - Pulsing inner plasma orb and rotating sci-fi cage that snaps and jitters with frequency drops.
- **Explosive Laser Spectrum Rings (`SpectrumRings.js`)**:
  - Dual rings with 192 frequency pylons rendered via `THREE.InstancedMesh` for locked 60+ FPS performance.
  - **Dynamic Ring Radius**: Expands and contracts from `0.7x` to `1.7x` in sync with the rhythm.
  - Pylons shoot up to 10+ units on drops with intense neon emission flashing.
- **Auto Beat-Reactive Color Engine (`Environment.js`)**:
  - Automatically transitions between 6 cyberpunk neon palettes (*Cyberpunk Neon, Acid Laser, Ultra Violet, Solar Inferno, Deep Abyss, Electric Gold*) upon detecting drops.
  - Lights and atmosphere flare with intense ambient glow on bass impacts.
- **Supersonic Shockwaves & Particle Cosmos (`Shockwave.js`, `ParticleUniverse.js`)**:
  - 12,000 starry particles that expand into a galaxy shockwave on bass kicks.
  - Up to 6 simultaneous planar energy rings traveling at supersonic speeds from the core.
  - Camera shake responding to beat intensity.
- **Full Web Audio Engine (`AudioManager.js`)**:
  - **Built-in 126 BPM Procedural Synth Beat**: Zero external audio downloads required.
  - **Drag & Drop Custom Audio**: Drop any MP3, WAV, FLAC, or OGG file onto the window.
  - **Live Microphone Input**: Real-time room or voice audio visualization.
- **Refined Cinematic Post-Processing (`Renderer.js`)**:
  - Crisp `UnrealBloomPass` tuned for sharp geometric glow without hazy blur + ACES Filmic tone mapping.
- **User Interface & Hotkeys**:
  - `Space` — Play / Pause
  - `F` — Fullscreen toggle
  - `H` — Hide / Show HUD for clean cinematic viewing
  - Fully reactive `lil-gui` panel for live tuning of pylons, core size, lighting, and particles.

---

## 🏛️ Code Architecture

Following production-grade patterns (Bruno Simon's Three.js Journey standard):

```text
audio-visualizer/
├── index.html                   # HTML shell with responsive HUD
├── style.css                    # Cyberpunk glassmorphism styling
├── vite.config.js               # Vite build configuration
├── vercel.json                  # Vercel deployment specification
├── package.json
└── src/
    ├── main.js                  # Entry point
    └── Experience/
        ├── Experience.js        # Master Singleton orchestrator
        ├── Camera.js            # Perspective camera + OrbitControls + screen shake
        ├── Renderer.js          # WebGLRenderer + UnrealBloomPass post-processing
        ├── Utils/
        │   ├── EventEmitter.js  # Loose coupling event emitter
        │   ├── Sizes.js         # Resize & device pixel ratio handling
        │   ├── Time.js          # Tick-loop with delta time & requestAnimationFrame
        │   ├── Debug.js         # lil-gui interface integration
        │   └── AudioManager.js  # Web Audio API engine & beat detection
        ├── World/
        │   ├── World.js         # 3D Scene orchestrator
        │   ├── Environment.js   # Dynamic lighting & auto beat color engine
        │   ├── AudioCore.js     # Spring-physics kinetic 3D core & GLSL shaders
        │   ├── SpectrumRings.js # InstancedMesh frequency pylons with expanding radius
        │   ├── ParticleUniverse.js # 12,000 particle galaxy
        │   └── Shockwave.js     # Supersonic energy rings
        └── UI/
            └── Interface.js     # HUD interaction & drag-and-drop
```

---

## 🛠️ Local Development

```bash
# Double-click start.bat (Windows) or run:
cd audio-visualizer
npm run dev

# Production build
npm run build
```

---

## 🚀 1-Click Deployment to Vercel

1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. In [vercel.com](https://vercel.com), click **"Add New Project"** and select your repo.
3. Vercel automatically detects **Vite** (`npm run build` -> `dist`).
4. Click **Deploy** — live in ~20 seconds!
