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

    const material = new THREE.MeshStandardMaterial({
      roughness: 0.2,
      metalness: 0.8,
      emissive: '#002244',
      emissiveIntensity: 0.6
    })

    // Ring 1 (Inner)
    this.ring1 = new THREE.InstancedMesh(geometry, material, this.barCount)
    this.ring1.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

    // Ring 2 (Outer - Upper)
    this.ring2 = new THREE.InstancedMesh(geometry, material, this.barCount)
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
      folder.add(this.ring1.material, 'metalness', 0, 1, 0.05)
      folder.add(this.ring1.material, 'roughness', 0, 1, 0.05)
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

      // Dynamic height
      const height = 0.2 + Math.pow(rawValue, 1.4) * 4.2

      // Position along circumference
      const x1 = Math.cos(angle) * this.radius
      const z1 = Math.sin(angle) * this.radius

      this.dummy.position.set(x1, 0, z1)
      this.dummy.rotation.set(0, -angle + Math.PI / 2, 0)
      this.dummy.scale.set(1, height, 1)
      this.dummy.updateMatrix()

      this.ring1.setMatrixAt(i, this.dummy.matrix)

      // Ring 2 (outer)
      const x2 = Math.cos(angle) * this.secondaryRadius
      const z2 = Math.sin(angle) * this.secondaryRadius
      const height2 = 0.2 + Math.pow((freqData[dataLen - 1 - binIndex] || 0) / 255.0, 1.4) * 3.5

      this.dummy.position.set(x2, 0, z2)
      this.dummy.rotation.set(0, -angle + Math.PI / 2, Math.PI) // mirrored downwards
      this.dummy.scale.set(0.9, height2, 0.9)
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
