import EventEmitter from './EventEmitter.js'

export default class AudioManager extends EventEmitter {
  constructor() {
    super()

    this.audioContext = null
    this.analyser = null
    this.gainNode = null
    this.source = null
    this.micStream = null

    // Analysis configuration
    this.fftSize = 512
    this.frequencyData = new Uint8Array(this.fftSize / 2)
    this.timeData = new Uint8Array(this.fftSize / 2)

    // Reactive values (0.0 to 1.0)
    this.bass = 0
    this.mid = 0
    this.treble = 0
    this.overall = 0
    this.smoothedBass = 0
    this.beatIntensity = 0
    this.isBeat = false

    // Beat detection history
    this.beatThreshold = 1.3
    this.beatDecayRate = 0.96
    this.beatCutoff = 0.35

    // State
    this.isPlaying = false
    this.currentMode = 'synth' // 'synth' | 'file' | 'mic'
    this.volume = 0.8
    this.trackTitle = 'Cyber Synthwave Beat'

    // File playback tracking
    this.audioBuffer = null
    this.audioBufferSource = null
    this.startedAt = 0
    this.pausedAt = 0

    // Synth generator state
    this.synthLoopInterval = null
    this.bpm = 126
    this.step = 0
  }

  initContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioCtx()

      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = this.fftSize
      this.analyser.smoothingTimeConstant = 0.82

      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime)

      this.gainNode.connect(this.analyser)
      this.analyser.connect(this.audioContext.destination)
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value))
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0.05)
    }
  }

  // ==========================================
  // PROCEDURAL CYBER SYNTH GENERATOR
  // ==========================================
  startSynthBeat() {
    this.initContext()
    this.stopCurrentSource()

    this.currentMode = 'synth'
    this.trackTitle = 'NEXUS Synth-Engine (126 BPM)'
    this.isPlaying = true
    this.step = 0

    const stepInterval = (60 / this.bpm / 4) * 1000 // 16th notes

    // Bassline notes in Hz (C minor arpeggio)
    const bassScale = [65.41, 65.41, 77.78, 87.31, 98.0, 77.78, 65.41, 58.27]
    // Lead notes (C minor pentatonic)
    const leadScale = [261.63, 311.13, 349.23, 392.0, 466.16, 523.25]

    this.synthLoopInterval = setInterval(() => {
      if (!this.isPlaying || !this.audioContext || this.audioContext.state !== 'running') return

      const time = this.audioContext.currentTime
      const currentStep = this.step % 16

      // 1. KICK DRUM (steps 0, 4, 8, 12 - Four on the floor)
      if (currentStep % 4 === 0) {
        this.triggerKick(time)
      }

      // 2. SNARE / CLAP (steps 4, 12)
      if (currentStep === 4 || currentStep === 12) {
        this.triggerSnare(time)
      }

      // 3. HI-HAT (every 2nd 16th note, accented on offbeats)
      if (currentStep % 2 === 1) {
        this.triggerHiHat(time, currentStep % 4 === 2 ? 0.25 : 0.12)
      }

      // 4. SYNTH BASSLINE (rolling 16th notes)
      const bassNote = bassScale[Math.floor(this.step / 2) % bassScale.length]
      this.triggerBassNote(time, bassNote, 0.15)

      // 5. CYBER ARPEGGIO / LEAD
      if (currentStep % 2 === 0 && Math.random() > 0.2) {
        const leadNote = leadScale[Math.floor(Math.random() * leadScale.length)]
        this.triggerLeadSynth(time, leadNote, 0.2)
      }

      this.step++
    }, stepInterval)

    this.trigger('stateChange', { isPlaying: true, mode: 'synth', title: this.trackTitle })
  }

  triggerKick(time) {
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.frequency.setValueAtTime(140, time)
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.14)

    gain.gain.setValueAtTime(1.0, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22)

    osc.connect(gain)
    gain.connect(this.gainNode)

    osc.start(time)
    osc.stop(time + 0.23)
  }

  triggerSnare(time) {
    // Noise buffer for snap
    const bufferSize = this.audioContext.sampleRate * 0.15
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(1000, time)

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.4, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.gainNode)

    noise.start(time)
    noise.stop(time + 0.16)
  }

  triggerHiHat(time, vol = 0.15) {
    const bufferSize = this.audioContext.sampleRate * 0.05
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(7000, time)

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.gainNode)

    noise.start(time)
    noise.stop(time + 0.06)
  }

  triggerBassNote(time, freq, duration) {
    const osc = this.audioContext.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, time)

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(450, time)
    filter.Q.setValueAtTime(4, time)

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.35, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.gainNode)

    osc.start(time)
    osc.stop(time + duration + 0.02)
  }

  triggerLeadSynth(time, freq, duration) {
    const osc = this.audioContext.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(freq, time)

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1800, time)

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.12, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.gainNode)

    osc.start(time)
    osc.stop(time + duration + 0.02)
  }

  // ==========================================
  // FILE LOADING (DRAG & DROP / INPUT)
  // ==========================================
  async loadAudioFile(file) {
    this.initContext()
    this.stopCurrentSource()

    this.currentMode = 'file'
    this.trackTitle = file.name.replace(/\.[^/.]+$/, '')
    this.trigger('stateChange', { isPlaying: false, mode: 'file', title: this.trackTitle, loading: true })

    try {
      const arrayBuffer = await file.arrayBuffer()
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      this.pausedAt = 0
      this.playAudioBuffer()
    } catch (err) {
      console.error('Failed to decode audio file:', err)
      this.trigger('error', 'Could not decode audio file.')
    }
  }

  playAudioBuffer() {
    if (!this.audioBuffer || !this.audioContext) return

    if (this.audioBufferSource) {
      try {
        this.audioBufferSource.stop()
        this.audioBufferSource.disconnect()
      } catch (e) {}
    }

    this.audioBufferSource = this.audioContext.createBufferSource()
    this.audioBufferSource.buffer = this.audioBuffer
    this.audioBufferSource.connect(this.gainNode)

    const offset = this.pausedAt % this.audioBuffer.duration
    this.startedAt = this.audioContext.currentTime - offset

    this.audioBufferSource.start(0, offset)
    this.isPlaying = true

    this.audioBufferSource.onended = () => {
      if (this.currentMode === 'file' && this.isPlaying) {
        // loop audio
        this.pausedAt = 0
        this.playAudioBuffer()
      }
    }

    this.trigger('stateChange', { isPlaying: true, mode: 'file', title: this.trackTitle })
  }

  pauseAudioBuffer() {
    if (this.audioBufferSource && this.isPlaying) {
      this.pausedAt = this.audioContext.currentTime - this.startedAt
      try {
        this.audioBufferSource.stop()
      } catch (e) {}
      this.isPlaying = false
      this.trigger('stateChange', { isPlaying: false, mode: 'file', title: this.trackTitle })
    }
  }

  // ==========================================
  // MICROPHONE INPUT
  // ==========================================
  async startMicrophone() {
    this.initContext()
    this.stopCurrentSource()

    this.currentMode = 'mic'
    this.trackTitle = 'Live Microphone Input'

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      const micSource = this.audioContext.createMediaStreamSource(this.micStream)

      // Connect mic to analyser ONLY (not to destination/speakers to prevent howling feedback loop!)
      micSource.connect(this.analyser)
      this.source = micSource

      this.isPlaying = true
      this.trigger('stateChange', { isPlaying: true, mode: 'mic', title: this.trackTitle })
    } catch (err) {
      console.error('Microphone access denied:', err)
      this.trigger('error', 'Microphone access denied or unavailable.')
      this.startSynthBeat() // fallback
    }
  }

  // ==========================================
  // PLAYBACK CONTROL
  // ==========================================
  togglePlay() {
    if (this.currentMode === 'synth') {
      if (this.isPlaying) {
        this.pauseSynth()
      } else {
        this.startSynthBeat()
      }
    } else if (this.currentMode === 'file') {
      if (this.isPlaying) {
        this.pauseAudioBuffer()
      } else {
        this.playAudioBuffer()
      }
    } else if (this.currentMode === 'mic') {
      if (this.isPlaying) {
        this.stopCurrentSource()
        this.isPlaying = false
        this.trigger('stateChange', { isPlaying: false, mode: 'mic', title: this.trackTitle })
      } else {
        this.startMicrophone()
      }
    }
  }

  pauseSynth() {
    if (this.synthLoopInterval) {
      clearInterval(this.synthLoopInterval)
      this.synthLoopInterval = null
    }
    this.isPlaying = false
    this.trigger('stateChange', { isPlaying: false, mode: 'synth', title: this.trackTitle })
  }

  stopCurrentSource() {
    if (this.synthLoopInterval) {
      clearInterval(this.synthLoopInterval)
      this.synthLoopInterval = null
    }

    if (this.audioBufferSource) {
      try {
        this.audioBufferSource.stop()
        this.audioBufferSource.disconnect()
      } catch (e) {}
      this.audioBufferSource = null
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop())
      this.micStream = null
    }

    if (this.source) {
      try {
        this.source.disconnect()
      } catch (e) {}
      this.source = null
    }

    this.isPlaying = false
  }

  // ==========================================
  // FRAME UPDATE & ANALYSIS
  // ==========================================
  update() {
    if (!this.analyser || !this.isPlaying) {
      // Smooth decay when paused
      this.bass *= 0.92
      this.mid *= 0.92
      this.treble *= 0.92
      this.overall *= 0.92
      this.smoothedBass *= 0.92
      this.isBeat = false
      return
    }

    this.analyser.getByteFrequencyData(this.frequencyData)
    this.analyser.getByteTimeDomainData(this.timeData)

    const binCount = this.frequencyData.length

    // Frequency ranges:
    // Bass: ~0 to 12% of bins
    // Mid: ~12% to 45% of bins
    // Treble: ~45% to 100% of bins
    const bassEnd = Math.floor(binCount * 0.12)
    const midEnd = Math.floor(binCount * 0.45)

    let bassSum = 0
    let midSum = 0
    let trebleSum = 0
    let totalSum = 0

    for (let i = 0; i < binCount; i++) {
      const val = this.frequencyData[i] / 255.0
      totalSum += val

      if (i < bassEnd) {
        bassSum += val
      } else if (i < midEnd) {
        midSum += val
      } else {
        trebleSum += val
      }
    }

    const rawBass = bassSum / (bassEnd || 1)
    const rawMid = midSum / ((midEnd - bassEnd) || 1)
    const rawTreble = trebleSum / ((binCount - midEnd) || 1)
    this.overall = totalSum / binCount

    // Non-linear boost for visual impact
    this.bass = Math.pow(rawBass, 1.3)
    this.mid = Math.pow(rawMid, 1.2)
    this.treble = Math.pow(rawTreble, 1.1)

    // Smooth bass for continuous fluid displacement
    this.smoothedBass += (this.bass - this.smoothedBass) * 0.2

    // Beat detection
    if (this.bass > this.beatCutoff && this.bass > this.smoothedBass * this.beatThreshold) {
      this.isBeat = true
      this.beatIntensity = Math.min(1.0, (this.bass - this.beatCutoff) * 2.0)
    } else {
      this.isBeat = false
      this.beatIntensity *= this.beatDecayRate
    }
  }
}
