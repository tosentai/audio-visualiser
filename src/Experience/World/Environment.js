import * as THREE from 'three'
import Experience from '../Experience.js'

export const COLOR_THEMES = [
  {
    name: 'Cyberpunk Neon',
    primary: '#00f0ff',
    secondary: '#ff007f',
    accent: '#ffe600',
    ambient: '#090a18',
    fog: '#05060f'
  },
  {
    name: 'Electric Abyss',
    primary: '#0088ff',
    secondary: '#7b00ff',
    accent: '#00ffcc',
    ambient: '#05071a',
    fog: '#03040c'
  },
  {
    name: 'Solar Supernova',
    primary: '#ff5500',
    secondary: '#ff0044',
    accent: '#ffcc00',
    ambient: '#160805',
    fog: '#0a0303'
  },
  {
    name: 'Matrix Emerald',
    primary: '#00ff66',
    secondary: '#00aa44',
    accent: '#88ff00',
    ambient: '#021208',
    fog: '#010804'
  }
]

export default class Environment {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.audio = this.experience.audio
    this.debug = this.experience.debug

    this.currentThemeIndex = 0
    this.theme = COLOR_THEMES[this.currentThemeIndex]

    this.coreLightBase = 2.0
    this.orbitLightBase = 1.5
    this.lightPulseStrength = 4.0

    this.setFog()
    this.setLights()
    this.setDebug()
  }

  setFog() {
    this.scene.fog = new THREE.FogExp2(this.theme.fog, 0.022)
  }

  setLights() {
    // Ambient Light
    this.ambientLight = new THREE.AmbientLight(this.theme.ambient, 1.2)
    this.scene.add(this.ambientLight)

    // Dynamic Pulsing Point Lights
    this.pointLight1 = new THREE.PointLight(this.theme.primary, 3.0, 35)
    this.pointLight1.position.set(0, 0, 0)
    this.scene.add(this.pointLight1)

    this.pointLight2 = new THREE.PointLight(this.theme.secondary, 2.5, 30)
    this.pointLight2.position.set(8, 6, 8)
    this.scene.add(this.pointLight2)

    this.pointLight3 = new THREE.PointLight(this.theme.accent, 2.0, 30)
    this.pointLight3.position.set(-8, -6, -8)
    this.scene.add(this.pointLight3)
  }

  cycleTheme() {
    this.currentThemeIndex = (this.currentThemeIndex + 1) % COLOR_THEMES.length
    this.applyTheme(COLOR_THEMES[this.currentThemeIndex])
    return this.theme
  }

  applyTheme(theme) {
    this.theme = theme

    if (this.scene.fog) {
      this.scene.fog.color.set(theme.fog)
    }

    this.ambientLight.color.set(theme.ambient)
    this.pointLight1.color.set(theme.primary)
    this.pointLight2.color.set(theme.secondary)
    this.pointLight3.color.set(theme.accent)

    // Notify other world entities to update materials
    this.experience.world.onThemeChanged(this.theme)
  }

  setDebug() {
    if (this.debug.active) {
      const folder = this.debug.ui.addFolder('Environment & Lights')
      folder.add(this, 'coreLightBase', 0, 10, 0.2).name('Core Light Base')
      folder.add(this, 'orbitLightBase', 0, 8, 0.2).name('Orbital Light Base')
      folder.add(this, 'lightPulseStrength', 0, 10, 0.2).name('Audio Light Pulse')
      folder.add(this.ambientLight, 'intensity', 0, 4, 0.1).name('Ambient Light')
      if (this.scene.fog) {
        folder.add(this.scene.fog, 'density', 0.005, 0.08, 0.002).name('Fog Density')
      }
    }
  }

  update() {
    const bass = this.audio.bass
    const mid = this.audio.mid

    // React point light intensity with audio based on user base values
    this.pointLight1.intensity = this.coreLightBase + bass * this.lightPulseStrength
    this.pointLight2.intensity = this.orbitLightBase + mid * (this.lightPulseStrength * 0.75)

    // Orbit outer lights smoothly
    const elapsed = this.experience.time.elapsed
    this.pointLight2.position.x = Math.sin(elapsed * 0.7) * 9
    this.pointLight2.position.z = Math.cos(elapsed * 0.7) * 9

    this.pointLight3.position.x = Math.sin(-elapsed * 0.5) * 9
    this.pointLight3.position.z = Math.cos(-elapsed * 0.5) * 9
  }
}

