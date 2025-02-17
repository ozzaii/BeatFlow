class BeatMaker {
    constructor(config = {}) {
        this.config = {
            bpm: 128,
            bars: 4,
            beatsPerBar: 4,
            resolution: 16,
            enableCollaboration: true,
            ...config
        };
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        
        this.tracks = new Map();
        this.effects = new Map();
        this.isPlaying = false;
        this.currentStep = 0;
        this.scheduledNotes = [];
        this.events = {};
        
        // Collaboration
        this.collaboration = null;
        this.isSyncing = false;
        
        this.setupEffectChain();
        this.initializeScheduler();
        
        if (this.config.enableCollaboration) {
            this.initializeCollaboration();
        }
    }
    
    async initializeCollaboration() {
        if (!this.config.beatId || !this.config.currentUser) {
            console.warn('Collaboration requires beatId and currentUser');
            return;
        }
        
        try {
            this.collaboration = new BeatMakerCollaboration(this, this.container, {
                beatId: this.config.beatId,
                currentUser: this.config.currentUser
            });
            
            // Set up collaboration event listeners
            this.collaboration.on('stateUpdate', (state) => {
                this.handleCollaborationStateUpdate(state);
            });
            
            this.collaboration.on('versionCreated', (version) => {
                this.emit('versionCreated', version);
            });
            
            this.collaboration.on('error', (error) => {
                this.emit('error', error);
            });
            
            await this.collaboration.init();
            console.log('Collaboration initialized successfully 🎵');
        } catch (error) {
            console.error('Failed to initialize collaboration:', error);
            this.emit('error', 'Failed to initialize collaboration features');
        }
    }
    
    setupEffectChain() {
        // Create default effects
        const reverb = this.audioContext.createConvolver();
        const delay = this.audioContext.createDelay(5.0);
        const filter = this.audioContext.createBiquadFilter();
        
        // Configure effects
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        delay.delayTime.value = 0.5;
        
        // Store effects
        this.effects.set('reverb', reverb);
        this.effects.set('delay', delay);
        this.effects.set('filter', filter);
        
        // Connect effects chain
        this.masterGain
            .connect(filter)
            .connect(delay)
            .connect(reverb)
            .connect(this.audioContext.destination);
    }
    
    initializeScheduler() {
        const scheduleAheadTime = 0.1;
        const lookAhead = 25.0;
        
        setInterval(() => {
            if (this.isPlaying) {
                const currentTime = this.audioContext.currentTime;
                const nextNoteTime = currentTime + scheduleAheadTime;
                
                while (this.nextNoteTime < nextNoteTime) {
                    this.scheduleNote(this.currentStep, this.nextNoteTime);
                    this.nextStep();
                }
            }
        }, lookAhead);
    }
    
    addTrack(name, samples) {
        const track = {
            name,
            samples,
            pattern: new Array(this.config.resolution).fill(0),
            gain: this.audioContext.createGain(),
            muted: false
        };
        
        track.gain.connect(this.masterGain);
        this.tracks.set(name, track);
        
        // Emit event for collaboration
        if (!this.isSyncing) {
            this.emit('trackAdded', { name, pattern: track.pattern });
        }
        
        return track;
    }
    
    toggleStep(trackName, step, broadcast = true) {
        const track = this.tracks.get(trackName);
        if (track) {
            track.pattern[step] = track.pattern[step] ? 0 : 1;
            
            // Emit event for collaboration
            if (broadcast && !this.isSyncing) {
                this.emit('patternChange', {
                    track: trackName,
                    step,
                    value: track.pattern[step]
                });
            }
            
            return true;
        }
        return false;
    }
    
    async loadSample(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await this.audioContext.decodeAudioData(arrayBuffer);
    }
    
    scheduleNote(step, time) {
        this.tracks.forEach((track, name) => {
            if (track.pattern[step] && !track.muted) {
                const source = this.audioContext.createBufferSource();
                source.buffer = track.samples[0]; // Use first sample for now
                source.connect(track.gain);
                source.start(time);
                
                this.scheduledNotes.push({
                    source,
                    track: name,
                    step,
                    time
                });
            }
        });
        
        // Emit event for collaboration
        if (!this.isSyncing) {
            this.emit('stepPlayed', { step, time });
        }
    }
    
    nextStep() {
        const secondsPerBeat = 60.0 / this.config.bpm;
        this.nextNoteTime += 0.25 * secondsPerBeat;
        this.currentStep++;
        if (this.currentStep === this.config.resolution) {
            this.currentStep = 0;
        }
    }
    
    start() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduledNotes = [];
        
        // Emit event for collaboration
        if (!this.isSyncing) {
            this.emit('playbackStarted');
        }
    }
    
    stop() {
        this.isPlaying = false;
        this.scheduledNotes.forEach(note => {
            note.source.stop();
        });
        this.scheduledNotes = [];
        
        // Emit event for collaboration
        if (!this.isSyncing) {
            this.emit('playbackStopped');
        }
    }
    
    setTempo(bpm, broadcast = true) {
        this.config.bpm = Math.max(30, Math.min(300, bpm));
        
        // Emit event for collaboration
        if (broadcast && !this.isSyncing) {
            this.emit('tempoChange', this.config.bpm);
        }
    }
    
    setVolume(trackName, value, broadcast = true) {
        const track = this.tracks.get(trackName);
        if (track) {
            track.gain.gain.value = Math.max(0, Math.min(1, value));
            
            // Emit event for collaboration
            if (broadcast && !this.isSyncing) {
                this.emit('volumeChange', { track: trackName, value });
            }
        }
    }
    
    toggleMute(trackName, broadcast = true) {
        const track = this.tracks.get(trackName);
        if (track) {
            track.muted = !track.muted;
            
            // Emit event for collaboration
            if (broadcast && !this.isSyncing) {
                this.emit('muteChange', { track: trackName, muted: track.muted });
            }
            
            return track.muted;
        }
        return null;
    }
    
    setEffectParam(effectName, param, value, broadcast = true) {
        const effect = this.effects.get(effectName);
        if (effect && effect[param]) {
            if (effect[param] instanceof AudioParam) {
                effect[param].value = value;
            } else {
                effect[param] = value;
            }
            
            // Emit event for collaboration
            if (broadcast && !this.isSyncing) {
                this.emit('effectChange', { effect: effectName, param, value });
            }
            
            return true;
        }
        return false;
    }
    
    getPattern() {
        const pattern = {};
        this.tracks.forEach((track, name) => {
            pattern[name] = track.pattern.slice();
        });
        return pattern;
    }
    
    setPattern(pattern, broadcast = true) {
        Object.entries(pattern).forEach(([trackName, trackPattern]) => {
            const track = this.tracks.get(trackName);
            if (track) {
                track.pattern = trackPattern.slice();
            }
        });
        
        // Emit event for collaboration
        if (broadcast && !this.isSyncing) {
            this.emit('patternChange', { pattern });
        }
    }
    
    getState() {
        return {
            pattern: this.getPattern(),
            tempo: this.config.bpm,
            effects: Array.from(this.effects.entries()).reduce((acc, [name, effect]) => {
                acc[name] = {};
                for (const param in effect) {
                    if (effect[param] instanceof AudioParam) {
                        acc[name][param] = effect[param].value;
                    }
                }
                return acc;
            }, {})
        };
    }
    
    async handleCollaborationStateUpdate(state) {
        this.isSyncing = true;
        try {
            if (state.pattern) {
                this.setPattern(state.pattern, false);
            }
            
            if (state.tempo) {
                this.setTempo(state.tempo, false);
            }
            
            if (state.effects) {
                Object.entries(state.effects).forEach(([effect, params]) => {
                    Object.entries(params).forEach(([param, value]) => {
                        this.setEffectParam(effect, param, value, false);
                    });
                });
            }
        } finally {
            this.isSyncing = false;
        }
    }
    
    // Event emitter methods
    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
    
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
    
    // Cleanup
    destroy() {
        this.stop();
        this.audioContext.close();
        this.collaboration?.destroy();
        this.events = {};
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeatMaker;
} else {
    window.BeatMaker = BeatMaker;
} 