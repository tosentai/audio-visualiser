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
    this.btnFullscreen = document.getElementById('btn-fullscreen')
    this.timeDisplay = document.getElementById('time-display')

    this.setupModalEvents()
    this.setupPlaybackEvents()
    this.setupDragAndDrop()
    this.setupFullscreen()
    this.setupAudioListeners()
    this.setupKeyboardShortcuts()
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

  setupFullscreen() {
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

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        if (this.modal && !this.modal.classList.contains('hidden')) {
          this.dismissModal()
          this.audio.startSynthBeat()
        } else {
          this.audio.togglePlay()
        }
      } else if (e.code === 'KeyF') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {})
          this.btnFullscreen.textContent = '✕'
        } else {
          document.exitFullscreen().catch(() => {})
          this.btnFullscreen.textContent = '⛶'
        }
      } else if (e.code === 'KeyH') {
        // Toggle HUD for cinematic viewing
        this.hud.classList.toggle('hidden')
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

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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

    // Update time display
    if (this.timeDisplay && this.audio.isPlaying) {
      if (this.audio.currentMode === 'synth') {
        const secs = Math.floor(this.experience.time.elapsed)
        this.timeDisplay.textContent = `LIVE // ${this.formatTime(secs)}`
      } else if (this.audio.currentMode === 'file' && this.audio.audioBuffer) {
        const current = (this.audio.audioContext.currentTime - this.audio.startedAt) % this.audio.audioBuffer.duration
        this.timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(this.audio.audioBuffer.duration)}`
      } else if (this.audio.currentMode === 'mic') {
        this.timeDisplay.textContent = 'MIC STREAM // LIVE'
      }
    }
  }
}

