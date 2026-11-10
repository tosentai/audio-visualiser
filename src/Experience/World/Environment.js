import * as THREE from 'three'
import Experience from '../Experience.js'

export const COLOR_PALETTES = [
  {
    name: 'Cyberpunk Neon',
    primary: new THREE.Color('#00f0ff'),
    secondary: new THREE.Color('#ff007f'),
    accent: new THREE.Color('#ffe600'),
    ambient: new THREE.Color('#090a18'),
    fog: new THREE.Color('#05060f')
  },
  {
    name: 'Acid Laser',
    primary: new THREE.Color('#00ff66'),
    secondary: new THREE.Color('#ff0055'),
    accent: new THREE.Color('#00ffff'),
    ambient: new THREE.Color('#031206'),
    fog: new THREE.Color('#020904')
  },
  {
    name: 'Ultra Violet',
    primary: new THREE.Color('#9d00ff'),
    secondary: new THREE.Color('#00f0ff'),
    accent: new THREE.Color('#ff00aa'),
    ambient: new THREE.Color('#0d051a'),
    fog: new THREE.Color('#06020c')
  },
  {
    name: 'Solar Inferno',
    primary: new THREE.Color('#ff3300'),
    secondary: new THREE.Color('#ffaa00'),
    accent: new THREE.Color('#ff0055'),
    ambient: new THREE.Color('#160604'),
    fog: new THREE.Color('#0c0201')
  },
  {
    name: 'Deep Abyss',
    primary: new THREE.Color('#0066ff'),
    secondary: new THREE.Color('#00ffcc'),
    accent: new THREE.Color('#7700ff'),
    ambient: new THREE.Color('#04091a'),
    fog: new THREE.Color('#02050e')
  },
  {
    name: 'Electric Gold',
    primary: new THREE.Color('#ffcc00'),
    secondary: new THREE.Color('#ff0033'),
    accent: new THREE.Color('#00ffff'),
    ambient: new THREE.Color('#181204'),
    fog: new THREE.Color('#0a0701')
  }
]

export default class Environment {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.audio = this.experience.audio
    this.debug = this.experience.debug

    this.paletteIndex = 0
    this.targetPalette = COLOR_PALETTES[this.paletteIndex]

    // Active smoothly interpolated colors
    this.currentColors = {
      primary: this.targetPalette.primary.clone(),
      secondary: this.targetPalette.secondary.clone(),
      accent: this.targetPalette.accent.clone(),
      ambient: this.targetPalette.ambient.clone(),
      fog: this.targetPalette.fog.clone()
    }

    // Beat switching state
    this.beatsCounted = 0
    this.lastSwitchTime = 0
    this.minSwitchInterval = 2.0 // seconds between major palette shifts

    this.coreLightBase = 1.0
    this.orbitLightBase = 1.2
    this.lightPulseStrength = 2.5

    this.setFog()
    this.setLights()
  }

  setFog() {
    this.scene.fog = new THREE.FogExp2(this.currentColors.fog, 0.02)
  }

  setLights() {
    // Ambient Light
    this.ambientLight = new THREE.AmbientLight(this.currentColors.ambient, 1.0)
    this.scene.add(this.ambientLight)

    // Dynamic Pulsing Point Lights
    this.pointLight1 = new THREE.PointLight(this.currentColors.primary, 1.5, 30)
    this.pointLight1.position.set(0, 0, 0)
    this.scene.add(this.pointLight1)

    this.pointLight2 = new THREE.PointLight(this.currentColors.secondary, 1.8, 30)
    this.pointLight2.position.set(8, 6, 8)
    this.scene.add(this.pointLight2)

    this.pointLight3 = new THREE.PointLight(this.currentColors.accent, 1.5, 30)
    this.pointLight3.position.set(-8, -6, -8)
    this.scene.add(this.pointLight3)
  }

  triggerNextPalette() {
    this.paletteIndex = (this.paletteIndex + 1) % COLOR_PALETTES.length
    this.targetPalette = COLOR_PALETTES[this.paletteIndex]
  }

  update() {
    const elapsed = this.experience.time.elapsed
    const bass = this.audio.bass
    const mid = this.audio.mid

    // 1. AUTO BEAT COLOR SWITCHING
    if (this.audio.isBeat) {
      this.beatsCounted++
      const canSwitch = (elapsed - this.lastSwitchTime) > this.minSwitchInterval

      if (canSwitch && (this.beatsCounted % 4 === 0 || this.audio.beatIntensity > 0.6)) {
        this.triggerNextPalette()
        this.lastSwitchTime = elapsed
      }
    }

    // 2. Smoothly LERP active colors toward target palette
    const lerpSpeed = 0.06
    this.currentColors.primary.lerp(this.targetPalette.primary, lerpSpeed)
    this.currentColors.secondary.lerp(this.targetPalette.secondary, lerpSpeed)
    this.currentColors.accent.lerp(this.targetPalette.accent, lerpSpeed)
    this.currentColors.ambient.lerp(this.targetPalette.ambient, lerpSpeed)
    this.currentColors.fog.lerp(this.targetPalette.fog, lerpSpeed)

    // Apply colors to scene & fog
    if (this.scene.fog) {
      this.scene.fog.color.copy(this.currentColors.fog)
    }
    this.ambientLight.color.copy(this.currentColors.ambient)
    this.pointLight1.color.copy(this.currentColors.primary)
    this.pointLight2.color.copy(this.currentColors.secondary)
    this.pointLight3.color.copy(this.currentColors.accent)

    // Notify world components with current dynamic colors
    this.experience.world.onThemeChanged({
      primary: '#' + this.currentColors.primary.getHexString(),
      secondary: '#' + this.currentColors.secondary.getHexString(),
      accent: '#' + this.currentColors.accent.getHexString()
    })

    // 3. Balanced light pulse on bass kicks (rich color, no blinding glare)
    const kickBoost = Math.pow(bass, 1.3) * this.lightPulseStrength
    this.pointLight1.intensity = this.coreLightBase + kickBoost * 1.5
    this.pointLight2.intensity = this.orbitLightBase + mid * 1.5

    // Orbit outer lights
    this.pointLight2.position.x = Math.sin(elapsed * 0.9) * 10
    this.pointLight2.position.z = Math.cos(elapsed * 0.9) * 10

    this.pointLight3.position.x = Math.sin(-elapsed * 0.7) * 10
    this.pointLight3.position.z = Math.cos(-elapsed * 0.7) * 10
  }
}
