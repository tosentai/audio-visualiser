import * as THREE from 'three'
import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import Debug from './Utils/Debug.js'
import AudioManager from './Utils/AudioManager.js'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import World from './World/World.js'
import Interface from './UI/Interface.js'

let instance = null

export default class Experience {
  constructor(canvas) {
    // Singleton pattern
    if (instance) {
      return instance
    }
    instance = this

    // Global access for debugging (optional in window)
    window.experience = this

    // Options
    this.canvas = canvas

    // Setup utility systems
    this.debug = new Debug()
    this.sizes = new Sizes()
    this.time = new Time()
    this.scene = new THREE.Scene()
    this.audio = new AudioManager()

    // Setup core components
    this.camera = new Camera()
    this.renderer = new Renderer()
    this.world = new World()
    this.ui = new Interface()

    // Event listeners
    this.sizes.on('resize', () => {
      this.resize()
    })

    this.time.on('tick', () => {
      this.update()
    })
  }

  resize() {
    this.camera.resize()
    this.renderer.resize()
  }

  update() {
    // 1. Update audio analysis
    this.audio.update()

    // 2. Update camera controls & shake
    this.camera.update()

    // 3. Update world entities (shaders, instanced meshes, particles)
    this.world.update()

    // 4. Update HUD meters
    this.ui.update()

    // 5. Render frame via postprocessing composer
    this.renderer.update()
  }

  destroy() {
    this.sizes.off('resize')
    this.time.off('tick')

    // Traverse and dispose all scene objects
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
        child.geometry.dispose()

        for (const key in child.material) {
          const value = child.material[key]
          if (value && typeof value.dispose === 'function') {
            value.dispose()
          }
        }
      }
    })

    this.camera.controls.dispose()
    this.renderer.destroy()
    this.world.destroy()
    this.audio.stopCurrentSource()

    if (this.debug.active) {
      this.debug.destroy()
    }
  }
}

