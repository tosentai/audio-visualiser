import Experience from '../Experience.js'

export default class Interface {
  constructor() {
    this.experience = new Experience()
    this.audio = this.experience.audio
    this.world = this.experience.world

    // DOM Elements
    this.modal = document.getElementById('intro-modal')
    this.hud = document.getElementById('hud')
    this.dropZone = document.getElementById('drop-zone')

    this.btnDemoStart = document.getElementById('btn-demo-start')
    this.btnMicStart = document.getElementById('btn-mic-start')
    this.modalFileInput = document.getElementById('modal-file-input')

    this.btnPlayPause = document.getElementById('btn-play-pause')
    this.playIcon = document.getElementById('play-icon')
    this.trackTitle = document.getElementById('track-title')
    this.trackStatus = document.getElementById('track-status')

    this.btnDockDemo = document.getElementById('btn-dock-demo')
    this.btnDockMic = document.getElementById('btn-dock-mic')
    this.dockFileInput = document.getElementById('dock-file-input')

    this.meterBass = document.getElementById('meter-bass')
    this.meterMid = document.getElementById('meter-mid')
    this.meterTreble = document.getElementById('meter-treble')

    this.volumeSlider = document.getElementById('volume-slider')
    this.btnThemeCycle = document.getElementById('btn-theme-cycle')
    this.btnFullscreen = document.getElementById('btn-fullscreen')

    this.setupModalEvents()
    this.setupPlaybackEvents()
    this.setupDragAndDrop()
    this.setupThemeAndFullscreen()
    this.setupAudioListeners()
  }

  setupModalEvents() {
    this.btnDemoStart.addEventListener('click', () => {
      this.dismissModal()
      this.audio.startSynthBeat()
    })

    this.btnMicStart.addEventListener('click', () => {
      this.dismissModal()
      this.audio.startMicrophone()
    })

    this.modalFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.dismissModal()
        this.audio.loadAudioFile(e.target.files[0])
      }
    })
  }

  dismissModal() {
    this.modal.classList.add('hidden')
    this.hud.classList.remove('hidden')
  }

  setupPlaybackEvents() {
    this.btnPlayPause.addEventListener('click', () => {
      this.audio.togglePlay()
    })

    this.btnDockDemo.addEventListener('click', () => {
      this.setActivePill(this.btnDockDemo)
      this.audio.startSynthBeat()
    })

    this.btnDockMic.addEventListener('click', () => {
      this.setActivePill(this.btnDockMic)
      this.audio.startMicrophone()
    })

    this.dockFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.setActivePill(null)
        this.audio.loadAudioFile(e.target.files[0])
      }
    })

    this.volumeSlider.addEventListener('input', (e) => {
      this.audio.setVolume(parseFloat(e.target.value))
    })
  }

  setActivePill(activeButton) {
    this.btnDockDemo.classList.remove('active')
    this.btnDockMic.classList.remove('active')
    if (activeButton) {
      activeButton.classList.add('active')
    }
  }

  setupDragAndDrop() {
    let dragCounter = 0

    window.addEventListener('dragenter', (e) => {
      e.preventDefault()
      dragCounter++
      this.dropZone.classList.add('active')
    })

    window.addEventListener('dragleave', (e) => {
      e.preventDefault()
      dragCounter--
      if (dragCounter <= 0) {
        dragCounter = 0
        this.dropZone.classList.remove('active')
      }
    })

    window.addEventListener('dragover', (e) => {
      e.preventDefault()
    })

    window.addEventListener('drop', (e) => {
      e.preventDefault()
      dragCounter = 0
      this.dropZone.classList.remove('active')

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i)) {
          this.dismissModal()
          this.setActivePill(null)
          this.audio.loadAudioFile(file)
        }
      }
    })
  }

  setupThemeAndFullscreen() {
    this.btnThemeCycle.addEventListener('click', () => {
      const newTheme = this.world.environment.cycleTheme()
      this.btnThemeCycle.textContent = `🎨 ${newTheme.name.toUpperCase().split(' ')[0]}`
    })

    this.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
        this.btnFullscreen.textContent = '✕'
      } else {
        document.exitFullscreen().catch(() => {})
        this.btnFullscreen.textContent = '⛶'
      }
    })
  }

  setupAudioListeners() {
    this.audio.on('stateChange', (data) => {
      this.trackTitle.textContent = data.title
      this.playIcon.textContent = data.isPlaying ? '❚❚' : '▶'
      this.trackStatus.textContent = data.isPlaying ? 'LIVE' : 'PAUSED'

      if (data.mode === 'synth') {
        this.setActivePill(this.btnDockDemo)
      } else if (data.mode === 'mic') {
        this.setActivePill(this.btnDockMic)
      }
    })
  }

  update() {
    // Smooth frequency meter animations
    if (this.meterBass && this.audio.isPlaying) {
      this.meterBass.style.width = `${Math.min(100, this.audio.bass * 100)}%`
      this.meterMid.style.width = `${Math.min(100, this.audio.mid * 100)}%`
      this.meterTreble.style.width = `${Math.min(100, this.audio.treble * 100)}%`
    } else {
      this.meterBass.style.width = '0%'
      this.meterMid.style.width = '0%'
      this.meterTreble.style.width = '0%'
    }
  }
}
