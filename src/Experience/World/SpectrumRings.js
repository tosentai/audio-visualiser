import * as THREE from 'three'
import Experience from '../Experience.js'

export default class SpectrumRings {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.audio = this.experience.audio
    this.time = this.experience.time
    this.debug = this.experience.debug

    // Configuration
    this.barCount = 96
    this.radius = 5.2
    this.secondaryRadius = 7.0
    this.heightScale = 1.0
    this.barThickness = 1.0

    this.dummy = new THREE.Object3D()
    this.colorA = new THREE.Color('#00f0ff')
    this.colorB = new THREE.Color('#ff007f')

    this.setMesh()
    this.setDebug()
  }

  setMesh() {
    // Slender futuristic cuboid pylon
    const geometry = new THREE.BoxGeometry(0.12, 1.0, 0.22)
    geometry.translate(0, 0.5, 0) // anchor at base

    this.material = new THREE.MeshStandardMaterial({
      roughness: 0.15,
      metalness: 0.85,
      emissive: '#002244',
      emissiveIntensity: 0.8,
      wireframe: false
    })

    // Ring 1 (Inner)
    this.ring1 = new THREE.InstancedMesh(geometry, this.material, this.barCount)
    this.ring1.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

    // Ring 2 (Outer - Upper)
    this.ring2 = new THREE.InstancedMesh(geometry, this.material, this.barCount)
    this.ring2.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

    // Initialize initial matrices and colors
    for (let i = 0; i < this.barCount; i++) {
      const angle = (i / this.barCount) * Math.PI * 2
      const t = i / this.barCount
      const col = new THREE.Color().lerpColors(this.colorA, this.colorB, t)

      this.ring1.setColorAt(i, col)
      this.ring2.setColorAt(i, col)
    }

    if (this.ring1.instanceColor) this.ring1.instanceColor.needsUpdate = true
    if (this.ring2.instanceColor) this.ring2.instanceColor.needsUpdate = true

    this.scene.add(this.ring1)
    this.scene.add(this.ring2)
  }

  updateTheme(theme) {
    this.colorA.set(theme.primary)
    this.colorB.set(theme.secondary)

    for (let i = 0; i < this.barCount; i++) {
      const t = i / this.barCount
      const col = new THREE.Color().lerpColors(this.colorA, this.colorB, t)
      this.ring1.setColorAt(i, col)
      this.ring2.setColorAt(i, col)
    }

    if (this.ring1.instanceColor) this.ring1.instanceColor.needsUpdate = true
    if (this.ring2.instanceColor) this.ring2.instanceColor.needsUpdate = true
  }

  setDebug() {
    if (this.debug.active) {
      const folder = this.debug.ui.addFolder('Spectrum Pylons (InstancedMesh)')
      folder.add(this, 'heightScale', 0.2, 3.5, 0.1).name('Pylon Height')
      folder.add(this, 'barThickness', 0.4, 2.5, 0.1).name('Pylon Width')
      folder.add(this, 'radius', 3.0, 9.0, 0.1).name('Inner Ring Radius')
      folder.add(this, 'secondaryRadius', 5.0, 12.0, 0.1).name('Outer Ring Radius')
      folder.add(this.material, 'emissiveIntensity', 0.1, 3.0, 0.1).name('Neon Brightness')
      folder.add(this.material, 'wireframe').name('Wireframe Pylons')
    }
  }

  update() {
    const elapsed = this.time.elapsed
    const freqData = this.audio.frequencyData
    const dataLen = freqData.length

    // Ring 1 rotation and scale update
    this.ring1.rotation.y = elapsed * 0.1
    this.ring2.rotation.y = -elapsed * 0.12

    for (let i = 0; i < this.barCount; i++) {
      const angle = (i / this.barCount) * Math.PI * 2

      // Map bar index to frequency bins
      const binIndex = Math.floor((i / this.barCount) * (dataLen * 0.65))
      const rawValue = (freqData[binIndex] || 0) / 255.0

      // Dynamic height multiplied by heightScale
      const height = (0.2 + Math.pow(rawValue, 1.4) * 4.2) * this.heightScale

      // Position along circumference
      const x1 = Math.cos(angle) * this.radius
      const z1 = Math.sin(angle) * this.radius

      this.dummy.position.set(x1, 0, z1)
      this.dummy.rotation.set(0, -angle + Math.PI / 2, 0)
      this.dummy.scale.set(this.barThickness, height, this.barThickness)
      this.dummy.updateMatrix()

      this.ring1.setMatrixAt(i, this.dummy.matrix)

      // Ring 2 (outer)
      const x2 = Math.cos(angle) * this.secondaryRadius
      const z2 = Math.sin(angle) * this.secondaryRadius
      const height2 = (0.2 + Math.pow((freqData[dataLen - 1 - binIndex] || 0) / 255.0, 1.4) * 3.5) * this.heightScale

      this.dummy.position.set(x2, 0, z2)
      this.dummy.rotation.set(0, -angle + Math.PI / 2, Math.PI) // mirrored downwards
      this.dummy.scale.set(this.barThickness * 0.9, height2, this.barThickness * 0.9)
      this.dummy.updateMatrix()

      this.ring2.setMatrixAt(i, this.dummy.matrix)
    }

    this.ring1.instanceMatrix.needsUpdate = true
    this.ring2.instanceMatrix.needsUpdate = true
  }

  destroy() {
    this.ring1.geometry.dispose()
    this.ring1.material.dispose()
    this.ring2.geometry.dispose()
    this.ring2.material.dispose()
  }
}

