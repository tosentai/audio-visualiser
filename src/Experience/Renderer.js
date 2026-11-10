import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import Experience from './Experience.js'

export default class Renderer {
  constructor() {
    this.experience = new Experience()
    this.canvas = this.experience.canvas
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene
    this.camera = this.experience.camera
    this.debug = this.experience.debug

    this.usePostProcessing = true

    this.setInstance()
    this.setPostProcessing()
    this.setDebug()
  }

  setInstance() {
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      powerPreference: 'high-performance',
      antialias: true
    })
    this.instance.toneMapping = THREE.ACESFilmicToneMapping
    this.instance.toneMappingExposure = 1.2
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.sizes.pixelRatio)
    this.instance.setClearColor('#05060f', 1)
  }

  setPostProcessing() {
    const renderTarget = new THREE.WebGLRenderTarget(
      this.sizes.width,
      this.sizes.height,
      {
        samples: this.sizes.pixelRatio === 1 ? 2 : 0,
        type: THREE.HalfFloatType
      }
    )

    this.composer = new EffectComposer(this.instance, renderTarget)
    this.composer.setSize(this.sizes.width, this.sizes.height)
    this.composer.setPixelRatio(this.sizes.pixelRatio)

    // Render Pass
    const renderPass = new RenderPass(this.scene, this.camera.instance)
    this.composer.addPass(renderPass)

    // Unreal Bloom Pass
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.sizes.width, this.sizes.height),
      1.4,   // strength
      0.45,  // radius
      0.22   // threshold
    )
    this.composer.addPass(this.bloomPass)

    // Output Pass (Color space & tone mapping conversion)
    const outputPass = new OutputPass()
    this.composer.addPass(outputPass)
  }

  setDebug() {
    if (this.debug.active) {
      const folder = this.debug.ui.addFolder('Post-Processing (Bloom)')
      folder.add(this.bloomPass, 'strength', 0, 3, 0.05).name('Glow Strength')
      folder.add(this.bloomPass, 'radius', 0, 1.5, 0.05).name('Glow Radius')
      folder.add(this.bloomPass, 'threshold', 0, 1, 0.02).name('Glow Threshold')
      folder.add(this.instance, 'toneMappingExposure', 0.5, 2.5, 0.1).name('Exposure')
    }
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.sizes.pixelRatio)

    if (this.composer) {
      this.composer.setSize(this.sizes.width, this.sizes.height)
      this.composer.setPixelRatio(this.sizes.pixelRatio)
    }
  }

  update() {
    if (this.usePostProcessing && this.composer) {
      this.composer.render()
    } else {
      this.instance.render(this.scene, this.camera.instance)
    }
  }

  destroy() {
    this.instance.dispose()
    if (this.composer) {
      this.composer.renderTarget1.dispose()
      this.composer.renderTarget2.dispose()
    }
  }
}
