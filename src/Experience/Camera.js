import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Experience from './Experience.js'

export default class Camera {
  constructor() {
    this.experience = new Experience()
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene
    this.canvas = this.experience.canvas
    this.debug = this.experience.debug

    this.shakeIntensity = 0
    this.basePosition = new THREE.Vector3(0, 4, 14)

    this.setInstance()
    this.setControls()
  }

  setInstance() {
    this.instance = new THREE.PerspectiveCamera(
      50,
      this.sizes.width / this.sizes.height,
      0.1,
      500
    )
    this.instance.position.copy(this.basePosition)
    this.scene.add(this.instance)
  }

  setControls() {
    this.controls = new OrbitControls(this.instance, this.canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 5
    this.controls.maxDistance = 45
    this.controls.maxPolarAngle = Math.PI / 2 + 0.15 // don't go too far under ground
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 0.8
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height
    this.instance.updateProjectionMatrix()
  }

  shake(amount) {
    this.shakeIntensity = Math.min(this.shakeIntensity + amount, 0.65)
  }

  update() {
    this.controls.update()

    // Smooth camera shake decay
    if (this.shakeIntensity > 0.001) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity
      const offsetZ = (Math.random() - 0.5) * this.shakeIntensity

      this.instance.position.x += offsetX
      this.instance.position.y += offsetY
      this.instance.position.z += offsetZ

      this.shakeIntensity *= 0.88
    }
  }
}

