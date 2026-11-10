import GUI from 'lil-gui'

export default class Debug {
  constructor() {
    this.active = true // default active, can toggle via UI or URL hash

    if (this.active) {
      this.ui = new GUI({ title: '⚡ NEXUS CONTROLS' })
      this.ui.close() // start collapsed for clean initial view
    }
  }

  destroy() {
    if (this.ui) {
      this.ui.destroy()
    }
  }
}

