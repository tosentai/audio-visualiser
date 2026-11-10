# NEXUS-CORE // 3D Sci-Fi Audio Visualizer

An interactive 3D WebGL audio visualizer built with **Three.js** and the **Web Audio API**, architected according to modern software design patterns (Singleton Facade, Observer/EventEmitter, Component-Entity modularity).

![Visualizer Demo](https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80)

---

## 🚀 Key Features

- **Central Sci-Fi Kinetic Core (`AudioCore.js`)**:
  - High-poly icosahedron powered by custom GLSL vertex displacement shaders with 3D simplex noise reacting dynamically to sub-bass and mid frequencies.
  - Pulsing inner plasma core and rotating outer wireframe cage.
- **Spectrum Frequency Pylons (`SpectrumRings.js`)**:
  - Concentric dual rings of 192 audio-reactive towers utilizing `THREE.InstancedMesh` for 60+ FPS performance on mobile and desktop GPUs.
- **Particle Universe (`ParticleUniverse.js`)**:
  - 12,000 glowing stars with custom Point shaders that expand in a cosmic shockwave on detected beat kicks (`isBeat`).
- **Dynamic Energy Shockwaves (`Shockwave.js`)**:
  - Expanding glowing planar energy rings emitted synchronously on heavy bass drops.
- **Full Web Audio Engine (`AudioManager.js`)**:
  - **Procedural Cyber Synthwave Beat Generator**: Built-in 126 BPM algorithmic synthesizer (kick, bassline, snare, hi-hats, arpeggiator) running entirely in code without any audio files.
  - **Drag & Drop Custom Audio**: Drag any MP3, WAV, FLAC, or OGG file onto the window to visualize your favorite music instantly.
  - **Live Microphone Input**: Real-time visualization of ambient sound, voice, or room audio.
- **Cinematic Post-Processing (`Renderer.js`)**:
  - `EffectComposer` with `UnrealBloomPass` (neon bloom glow) and `OutputPass` (ACES Filmic tone mapping).
- **Interactive UI & Themes**:
  - OrbitControls (free rotation, pan, zoom, auto-rotate).
  - 4 Futuristic themes: *Cyberpunk Neon, Electric Abyss, Solar Supernova, Matrix Emerald*.
  - Fullscreen toggle, real-time frequency meter readout (Bass, Mid, Treble).
  - Collapsible `lil-gui` debug panel for tweaking displacement, bloom, and lighting.

---

## 🏛️ Architecture & Clean Code

The codebase follows the production-grade OOP architecture popularized by Three.js Journey:

```text
audio-visualizer/
├── index.html                  # Responsive HTML shell with Sci-Fi HUD
├── style.css                   # Cyberpunk glassmorphism styling
├── vite.config.js              # Vite configuration
├── vercel.json                 # Vercel deployment spec
├── package.json
└── src/
    ├── main.js                 # Entry point
    └── Experience/
        ├── Experience.js       # Master Singleton orchestrator
        ├── Camera.js           # Perspective camera + OrbitControls + screen shake
        ├── Renderer.js         # WebGLRenderer + Post-Processing pipeline
        ├── Utils/
        │   ├── EventEmitter.js # Type-safe observer pattern
        │   ├── Sizes.js        # Viewport resize & device pixel ratio handling
        │   ├── Time.js         # Tick loop with delta time & requestAnimationFrame
        │   ├── Debug.js        # lil-gui interface integration
        │   └── AudioManager.js # Web Audio API context, analyser & sound generator
        ├── World/
        │   ├── World.js        # World coordinator
        │   ├── Environment.js  # Atmosphere, fog & audio-reactive lights
        │   ├── AudioCore.js    # GLSL-displaced kinetic 3D core
        │   ├── SpectrumRings.js# InstancedMesh frequency equalizer pylons
        │   ├── ParticleUniverse.js # 12k particle galaxy
        │   └── Shockwave.js    # Dynamic beat-drop ring shockwaves
        └── UI/
            └── Interface.js    # HUD, Drag-and-drop & user interaction
```

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server with hot reload
npm run dev

# 3. Build optimized static production bundle
npm run build

# 4. Preview production build locally
npm run preview
```

---

## ⚡ Deployment to Vercel

This project is 100% static and zero-config ready for Vercel:

1. Push this repository to **GitHub / GitLab**.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your repository. Vercel automatically detects **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**. Your visualizer will be live in ~20 seconds with global CDN distribution!
