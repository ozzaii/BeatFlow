class BeatMaker {
    constructor(config = {}) {
        this.config = {
            bpm: 128,
            bars: 4,
            beatsPerBar: 4,
            resolution: 16,
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
        
        this.setupEffectChain();
        this.initializeScheduler();
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
        return track;
    }
    
    toggleStep(trackName, step) {
        const track = this.tracks.get(trackName);
        if (track) {
            track.pattern[step] = track.pattern[step] ? 0 : 1;
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
    }
    
    stop() {
        this.isPlaying = false;
        this.scheduledNotes.forEach(note => {
            note.source.stop();
        });
        this.scheduledNotes = [];
    }
    
    setTempo(bpm) {
        this.config.bpm = Math.max(30, Math.min(300, bpm));
    }
    
    setVolume(trackName, value) {
        const track = this.tracks.get(trackName);
        if (track) {
            track.gain.gain.value = Math.max(0, Math.min(1, value));
        }
    }
    
    toggleMute(trackName) {
        const track = this.tracks.get(trackName);
        if (track) {
            track.muted = !track.muted;
            return track.muted;
        }
        return null;
    }
    
    setEffectParam(effectName, param, value) {
        const effect = this.effects.get(effectName);
        if (effect && effect[param]) {
            if (effect[param] instanceof AudioParam) {
                effect[param].value = value;
            } else {
                effect[param] = value;
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
    
    setPattern(pattern) {
        Object.entries(pattern).forEach(([trackName, trackPattern]) => {
            const track = this.tracks.get(trackName);
            if (track) {
                track.pattern = trackPattern.slice();
            }
        });
    }
    
    exportToWAV() {
        // Implementation for exporting the beat to WAV format
        // This will be implemented in the next iteration
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeatMaker;
} else {
    window.BeatMaker = BeatMaker;
} 