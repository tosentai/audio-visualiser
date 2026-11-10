import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Shockwave {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.audio = this.experience.audio

    this.waves = []
    this.maxWaves = 6

    this.geometry = new THREE.RingGeometry(1.0, 1.25, 64)
    this.geometry.rotateX(-Math.PI / 2) // lay flat on XZ plane

    this.primaryColor = new THREE.Color('#00f0ff')
  }

  triggerWave(intensity = 1.0) {
    if (this.waves.length >= this.maxWaves) {
      // reuse oldest wave
      const oldWave = this.waves.shift()
      this.scene.remove(oldWave.mesh)
      oldWave.material.dispose()
    }

    const material = new THREE.MeshBasicMaterial({
      color: this.primaryColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: Math.min(1.0, 0.95 * intensity),
      blending: THREE.AdditiveBlending
    })

    const mesh = new THREE.Mesh(this.geometry, material)
    mesh.position.y = 0
    this.scene.add(mesh)

    const core = this.experience.world && this.experience.world.audioCore
    const startScale = core ? Math.max(1.5, core.currentScale * 1.8) : 2.0

    this.waves.push({
      mesh,
      material,
      scale: startScale,
      maxScale: 28.0,
      opacity: Math.min(1.0, 0.95 * intensity),
      speed: 22.0 + intensity * 12.0
    })
  }

  updateTheme(theme) {
    this.primaryColor.set(theme.primary)
  }

  update() {
    // Check if new beat detected
    if (this.audio.isBeat && this.audio.beatIntensity > 0.35) {
      this.triggerWave(this.audio.beatIntensity)
    }

    const delta = this.experience.time.delta * 0.001

    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i]
      wave.scale += wave.speed * delta
      wave.opacity = Math.max(0, wave.opacity - delta * 1.8)

      wave.mesh.scale.set(wave.scale, wave.scale, wave.scale)
      wave.material.opacity = wave.opacity

      if (wave.opacity <= 0 || wave.scale >= wave.maxScale) {
        this.scene.remove(wave.mesh)
        wave.material.dispose()
        this.waves.splice(i, 1)
      }
    }
  }

  destroy() {
    this.waves.forEach((wave) => {
      this.scene.remove(wave.mesh)
      wave.material.dispose()
    })
    this.waves = []
    this.geometry.dispose()
  }
}

