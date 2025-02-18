class BeatMaker {
  constructor(config = {}) {
    this.config = {
      bpm: 128,
      bars: 4,
      beatsPerBar: 4,
      resolution: 16,
      enableCollaboration: false,
      ...config,
    }

    this.audioContext = config.audioContext || new (window.AudioContext || window.webkitAudioContext)()
    this.masterGain = this.audioContext.createGain()
    this.masterGain.connect(this.audioContext.destination)

    this.tracks = new Map()
    this.effects = new Map()
    this.isPlaying = false
    this.currentStep = 0
    this.scheduledNotes = []
    this.events = {}
    this.nextStepTime = 0
    this.timerID = null

    this.setupEffectChain()
  }

  setupEffectChain() {
    // Create default effects
    const reverb = this.audioContext.createConvolver()
    const delay = this.audioContext.createDelay(5.0)
    const filter = this.audioContext.createBiquadFilter()

    // Configure effects
    filter.type = 'lowpass'
    filter.frequency.value = 1000
    delay.delayTime.value = 0.5

    // Create wet/dry controls
    this.effects.set('reverb', {
      node: reverb,
      wet: this.audioContext.createGain(),
      dry: this.audioContext.createGain(),
    })

    this.effects.set('delay', {
      node: delay,
      wet: this.audioContext.createGain(),
      dry: this.audioContext.createGain(),
    })

    this.effects.set('filter', {
      node: filter,
    })

    // Set initial values
    this.setEffectParam('reverb', 'wet', 0.3)
    this.setEffectParam('delay', 'delayTime', 0.5)
    this.setEffectParam('filter', 'frequency', 1)

    // Connect effects chain
    this.masterGain
      .connect(this.effects.get('filter').node)
      .connect(this.effects.get('delay').node)
      .connect(this.effects.get('reverb').node)
      .connect(this.audioContext.destination)
  }

  addTrack(name, samples) {
    const track = {
      name,
      samples,
      pattern: new Array(this.config.resolution).fill(false),
      gain: this.audioContext.createGain(),
      muted: false,
    }

    track.gain.connect(this.masterGain)
    this.tracks.set(name, track)
    this.emit('trackAdded', { name, pattern: track.pattern })

    return track
  }

  start() {
    if (this.isPlaying) return

    this.isPlaying = true
    this.currentStep = 0
    this.nextStepTime = this.audioContext.currentTime

    this.schedule()
  }

  stop() {
    this.isPlaying = false
    this.currentStep = 0
    if (this.timerID) {
      clearTimeout(this.timerID)
      this.timerID = null
    }
    this.stopAllSounds()
  }

  schedule() {
    const stepTime = 60.0 / this.config.bpm / 4 // time for one sixteenth note

    while (this.nextStepTime < this.audioContext.currentTime + 0.1) {
      this.scheduleNote(this.currentStep, this.nextStepTime)
      this.nextStepTime += stepTime
      this.currentStep = (this.currentStep + 1) % this.config.resolution
    }

    this.timerID = setTimeout(() => {
      if (this.isPlaying) {
        this.schedule()
      }
    }, 25)
  }

  scheduleNote(step, time) {
    this.tracks.forEach((track) => {
      if (track.pattern[step] && !track.muted && track.samples.length > 0) {
        const source = this.audioContext.createBufferSource()
        source.buffer = track.samples[0]
        source.connect(track.gain)
        source.start(time)
      }
    })

    this.emit('stepPlayed', { step, time })
  }

  stopAllSounds() {
    this.tracks.forEach((track) => {
      const newGain = this.audioContext.createGain()
      newGain.connect(this.masterGain)
      track.gain = newGain
    })
  }

  setVolume(trackName, value) {
    const track = this.tracks.get(trackName)
    if (track) {
      track.gain.gain.value = Math.max(0, Math.min(1, value))
      this.emit('volumeChange', { track: trackName, value })
    }
  }

  toggleMute(trackName) {
    const track = this.tracks.get(trackName)
    if (track) {
      track.muted = !track.muted
      this.emit('muteChange', { track: trackName, muted: track.muted })
      return track.muted
    }
    return null
  }

  setEffectParam(effectName, param, value) {
    const effect = this.effects.get(effectName)
    if (!effect) return false

    switch (effectName) {
      case 'reverb':
      case 'delay':
        if (param === 'wet') {
          effect.wet.gain.value = value
          effect.dry.gain.value = 1 - value
        } else if (param === 'delayTime' && effectName === 'delay') {
          effect.node.delayTime.value = value * 2
        }
        break
      case 'filter':
        if (param === 'frequency') {
          effect.node.frequency.value = value * 20000
        }
        break
    }

    this.emit('effectChange', { effect: effectName, param, value })
    return true
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => callback(data))
    }
  }
}

export default BeatMaker 