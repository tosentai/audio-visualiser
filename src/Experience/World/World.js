import Experience from '../Experience.js'
import Environment from './Environment.js'
import AudioCore from './AudioCore.js'
import ParticleUniverse from './ParticleUniverse.js'
import Shockwave from './Shockwave.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    // Setup core visualizer entities (clean focus on the pulsating ray core)
    this.environment = new Environment()
    this.audioCore = new AudioCore()
    this.particleUniverse = new ParticleUniverse()
    this.shockwave = new Shockwave()
  }

  onThemeChanged(theme) {
    if (this.audioCore) this.audioCore.updateTheme(theme)
    if (this.particleUniverse) this.particleUniverse.updateTheme(theme)
    if (this.shockwave) this.shockwave.updateTheme(theme)
  }

  update() {
    if (this.environment) this.environment.update()
    if (this.audioCore) this.audioCore.update()
    if (this.particleUniverse) this.particleUniverse.update()
    if (this.shockwave) this.shockwave.update()
  }

  destroy() {
    if (this.audioCore) this.audioCore.destroy()
    if (this.particleUniverse) this.particleUniverse.destroy()
    if (this.shockwave) this.shockwave.destroy()
  }
}
