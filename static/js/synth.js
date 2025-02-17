// Initialize Tone.js
let isPlaying = false;
let currentStep = 0;
const steps = 32;
let bpm = 128;
let instruments = {};
let grid = {};
let effects = {};
let stepInterval;
let previewTimeouts = [];
let lastPreviewTime = 0;
let activePreviewNotes = new Set();

// Define dark techno presets globally
const presets = {
    darkTechno: {
        name: "Berlin Dungeon",
        bpm: 135,
        pattern: {
            kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
            snare: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
            hihat: [0,0,1,0, 1,0,1,0, 0,0,1,0, 1,0,1,0, 0,0,1,0, 1,0,1,0, 0,0,1,0, 1,0,1,0],
            clap: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
            bass: [1,0,0,1, 0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,1, 0,0,0,0],
            synth: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1, 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]
        }
    },
    acidTechno: {
        name: "303 Acid Trip",
        bpm: 138,
        pattern: {
            kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
            snare: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
            hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
            clap: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
            bass: [1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,1],
            synth: [1,1,0,1, 1,0,1,1, 0,1,1,0, 1,1,0,1, 1,1,0,1, 1,0,1,1, 0,1,1,0, 1,1,0,1]
        }
    },
    minimalTechno: {
        name: "Berghain Minimal",
        bpm: 132,
        pattern: {
            kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
            snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
            hihat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
            clap: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
            bass: [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,1, 1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,1],
            synth: [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0]
        }
    },
    industrialTechno: {
        name: "Factory Floor",
        bpm: 140,
        pattern: {
            kick: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
            snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
            hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
            clap: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
            bass: [1,0,0,1, 0,1,0,0, 1,0,0,1, 0,1,0,0, 1,0,0,1, 0,1,0,0, 1,0,0,1, 0,1,0,0],
            synth: [1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,1]
        }
    }
};

// Create audio context and instruments when the page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing beat maker... 🎵');
    
    // Check if Tone.js is loaded
    if (typeof Tone === 'undefined') {
        console.error('Tone.js not loaded! Please check your internet connection and try again.');
        showToast('Error: Audio engine not loaded. Please refresh the page. 😢', 'error');
        return;
    }
    
    // Set high priority for audio thread
    Tone.context.latencyHint = 'interactive';
    Tone.context.lookAhead = 0.01; // Reduce lookahead for tighter timing
    
    try {
        // Request audio context with user interaction
        const startAudioContext = async () => {
            try {
                await Tone.start();
                console.log('Audio context started successfully! 🎵');
                initializeAudio();
            } catch (error) {
                console.error('Failed to start audio context:', error);
                showToast('Click anywhere to enable audio! 🔊', 'info');
                document.body.addEventListener('click', startAudioContext, { once: true });
            }
        };
        
        // Start on first user interaction
        document.body.addEventListener('click', startAudioContext, { once: true });
        showToast('Click anywhere to start! 🎵', 'info');
        
    } catch (error) {
        console.error('Error initializing beat maker:', error);
        console.error('Stack trace:', error.stack);
        showToast('Failed to initialize beat maker! Check console for details. 😢', 'error');
    }
});

// Initialize audio components
async function initializeAudio() {
    try {
        console.log('Initializing dark techno audio engine... 🎵');
        
        // Stop any existing transport
        Tone.Transport.stop();
        Tone.Transport.cancel();
        
        // Master compressor for that techno punch
        const masterCompressor = new Tone.Compressor({
            threshold: -20,
            ratio: 12,
            attack: 0.003,
            release: 0.25
        }).toDestination();
        
        // Setup darker effects chain with shorter decay times
        effects = {
            reverb: new Tone.Reverb({
                decay: 1.0,  // Shorter decay
                wet: 0.15,   // Less wet signal
                preDelay: 0.01
            }).connect(masterCompressor),
            
            delay: new Tone.PingPongDelay({
                delayTime: '16n',  // Shorter delay time
                feedback: 0.2,     // Less feedback
                wet: 0.1          // Less wet signal
            }).connect(masterCompressor),
            
            distortion: new Tone.Distortion({
                distortion: 0.8,
                wet: 0.2,
                oversample: '4x'
            }).connect(masterCompressor)
        };
        
        await effects.reverb.generate();
        
        // Initialize instruments with tighter envelopes
        instruments = {
            kick: new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 8,
                oscillator: { type: 'sine4' },
                envelope: {
                    attack: 0.001,
                    decay: 0.2,
                    sustain: 0,
                    release: 0.4
                }
            }).chain(effects.distortion, masterCompressor),
            
            snare: new Tone.NoiseSynth({
                noise: { type: 'brown' },
                envelope: {
                    attack: 0.001,
                    decay: 0.15,
                    sustain: 0,
                    release: 0.15
                }
            }).chain(effects.reverb, masterCompressor),
            
            hihat: new Tone.MetalSynth({
                frequency: 2500,
                envelope: {
                    attack: 0.001,
                    decay: 0.05,
                    sustain: 0,
                    release: 0.05
                },
                harmonicity: 7.1,
                modulationIndex: 50,
                resonance: 7000,
                octaves: 1
            }).chain(
                new Tone.Filter({
                    frequency: 12000,
                    type: "highpass",
                    rolloff: -48
                }), 
                effects.reverb
            ),
            
            clap: new Tone.NoiseSynth({
                noise: { type: 'pink' },
                envelope: {
                    attack: 0.001,
                    decay: 0.3,
                    sustain: 0,
                    release: 0.3
                }
            }).chain(effects.reverb, masterCompressor),
            
            bass: new Tone.MonoSynth({
                oscillator: { type: 'sawtooth4' },
                envelope: {
                    attack: 0.001,
                    decay: 0.1,
                    sustain: 0.4,
                    release: 0.2
                },
                filterEnvelope: {
                    attack: 0.001,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 0.2,
                    baseFrequency: 150,
                    octaves: 3.5
                }
            }).chain(effects.distortion, masterCompressor),
            
            synth: new Tone.MonoSynth({
                oscillator: { type: 'square4' },
                envelope: {
                    attack: 0.001,
                    decay: 0.1,    // Shorter decay
                    sustain: 0.1,  // Lower sustain
                    release: 0.1   // Quicker release
                },
                filterEnvelope: {
                    attack: 0.001,
                    decay: 0.1,
                    sustain: 0.2,
                    release: 0.1,
                    baseFrequency: 500,
                    octaves: 2     // Less filter movement
                }
            }).chain(
                new Tone.Filter({
                    frequency: 2000,
                    type: "lowpass",
                    rolloff: -12
                }),
                effects.delay,
                effects.distortion,
                masterCompressor
            )
        };

        // Darker techno volume levels
        const volumes = {
            kick: -4,
            snare: -8,
            hihat: -12,
            clap: -10,
            bass: -6,
            synth: -8
        };
        
        Object.entries(volumes).forEach(([inst, vol]) => {
            if (instruments[inst]) {
                instruments[inst].volume.value = vol;
            }
        });
        
        // Initialize grid first
        console.log('Setting up beat grid...');
        await initializeGrid();
        
        // Then setup controls
        console.log('Setting up controls...');
        setupTransportControls();
        
        // Set up transport
        Tone.Transport.bpm.value = bpm;
        Tone.Transport.timeSignature = [4, 4];
        
        console.log('Dark techno engine loaded! Ready to destroy the warehouse! 🏭');
        showToast('Beat maker loaded! Click anywhere to start! 🎵', 'success');
        
    } catch (error) {
        console.error('Error in audio initialization:', error);
        console.error('Stack trace:', error.stack);
        showToast('Failed to initialize audio components! Try refreshing. 😢', 'error');
    }
}

// Initialize the beat grid with proper synth handling
function initializeGrid() {
    console.log('Initializing beat grid... 🎵');
    const beatGrid = document.querySelector('.beat-grid');
    if (!beatGrid) {
        console.error('Beat grid container not found! 😢');
        throw new Error('Beat grid container not found!');
    }
    
    beatGrid.innerHTML = ''; // Clear existing grid
    
    // Add column headers for beat numbers
    const headerRow = document.createElement('div');
    headerRow.className = 'grid-row header-row';
    headerRow.innerHTML = '<div class="instrument-label"></div>'; // Empty label for alignment
    
    // Create beat number headers (1-32)
    for (let step = 0; step < steps; step++) {
        const header = document.createElement('div');
        header.className = 'beat-header';
        header.textContent = (step + 1).toString().padStart(2, '0');
        // Add markers every 8 beats for better visual grouping
        if (step % 8 === 0) header.classList.add('beat-marker');
        headerRow.appendChild(header);
    }
    beatGrid.appendChild(headerRow);
    
    // Initialize empty grid patterns
    Object.keys(instruments).forEach(instrument => {
        grid[instrument] = new Array(steps).fill(false);
    });
    
    // Create instrument rows with enhanced styling
    Object.keys(instruments).forEach(instrument => {
        const row = document.createElement('div');
        row.className = 'grid-row';
        
        // Enhanced instrument label with icon and tooltip
        const label = document.createElement('div');
        label.className = 'instrument-label';
        const icon = getInstrumentIcon(instrument);
        label.innerHTML = `${icon} <span>${instrument}</span>`;
        label.title = `Click cells to toggle ${instrument} beats`;
        row.appendChild(label);
        
        // Create beat cells with improved visual feedback
        for (let step = 0; step < steps; step++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.instrument = instrument;
            cell.dataset.step = step;
            
            // Add visual markers every 8 beats
            if (step % 8 === 0) cell.classList.add('beat-marker');
            
            // Add hover effect class
            cell.classList.add('interactive');
            
            // Enhanced click handler with visual and audio feedback
            cell.addEventListener('click', () => {
                const wasActive = cell.classList.contains('active');
                grid[instrument][step] = !wasActive;
                
                // Smooth toggle animation
                cell.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
                cell.classList.toggle('active');
                
                // Add ripple effect
                const ripple = document.createElement('div');
                ripple.className = 'ripple';
                cell.appendChild(ripple);
                setTimeout(() => ripple.remove(), 500);
                
                // Play sound with random velocity for more natural feel
                if (!wasActive) {
                    const velocity = 0.7 + Math.random() * 0.3;
                    playSound(instrument, velocity, true);
                }
                
                // Add temporary highlight effect
                cell.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    cell.style.transform = '';
                }, 200);
            });
            
            row.appendChild(cell);
        }
        
        beatGrid.appendChild(row);
    });
    
    console.log('Beat grid initialized with 32 steps! 🎉');
}

// Helper function to get instrument icons
function getInstrumentIcon(instrument) {
    const icons = {
        'kick': '<i class="fas fa-drum"></i>',
        'snare': '<i class="fas fa-drum-steelpan"></i>',
        'hihat': '<i class="fas fa-hat-cowboy"></i>',
        'clap': '<i class="fas fa-hands"></i>',
        'tom': '<i class="fas fa-drum"></i>',
        'crash': '<i class="fas fa-star"></i>',
        'synth': '<i class="fas fa-wave-square"></i>',
        'bass': '<i class="fas fa-music"></i>'
    };
    return icons[instrument.toLowerCase()] || '<i class="fas fa-music"></i>';
}

// Setup transport controls
function setupTransportControls() {
    const playBtn = document.querySelector('.play-btn');
    const stopBtn = document.querySelector('.stop-btn');
    const bpmSlider = document.querySelector('.bpm-slider');
    const bpmValue = document.querySelector('.bpm-value');
    
    if (!playBtn || !stopBtn || !bpmSlider || !bpmValue) {
        throw new Error('Transport control elements not found!');
    }
    
    // Add visual feedback for play button
    playBtn.addEventListener('click', () => {
        playBtn.classList.add('clicked');
        setTimeout(() => playBtn.classList.remove('clicked'), 200);
        togglePlay();
    });
    
    // Add visual feedback for stop button
    stopBtn.addEventListener('click', () => {
        stopBtn.classList.add('clicked');
        setTimeout(() => stopBtn.classList.remove('clicked'), 200);
        stopSequencer();
    });
    
    // Improved BPM slider with visual feedback
    bpmSlider.addEventListener('input', (e) => {
        bpm = parseInt(e.target.value);
        bpmValue.textContent = bpm;
        bpmValue.classList.add('updating');
        Tone.Transport.bpm.rampTo(bpm, 0.1);
        setTimeout(() => bpmValue.classList.remove('updating'), 200);
    });
    
    // Setup preset selector
    setupPresetSelector();
    
    console.log('Transport controls and presets ready! 🎛️');
}

// Setup preset selector
function setupPresetSelector() {
    const presetContainer = document.querySelector('.preset-container');
    if (!presetContainer) {
        console.error('Preset container not found!');
        return;
    }
    
    // Clear existing presets
    presetContainer.innerHTML = '';
    
    // Create preset buttons with visual feedback
    Object.entries(presets).forEach(([key, preset]) => {
        const presetBtn = document.createElement('button');
        presetBtn.className = 'preset-btn';
        presetBtn.innerHTML = `
            <div class="preset-name">${preset.name}</div>
            <div class="preset-bpm">${preset.bpm} BPM</div>
            <div class="preset-icon">
                ${key.includes('acid') ? '🌀' : 
                  key.includes('minimal') ? '⚡' : 
                  key.includes('industrial') ? '🏭' : '🎚️'}
            </div>
        `;
        
        // Add hover effect
        presetBtn.addEventListener('mouseenter', () => {
            presetBtn.style.transform = 'scale(1.05)';
        });
        
        presetBtn.addEventListener('mouseleave', () => {
            presetBtn.style.transform = 'scale(1)';
        });
        
        // Add click handler with visual and audio feedback
        presetBtn.addEventListener('click', () => {
            // Visual feedback
            presetBtn.classList.add('clicked');
            setTimeout(() => presetBtn.classList.remove('clicked'), 200);
            
            // Remove active class from other preset buttons
            document.querySelectorAll('.preset-btn.active').forEach(btn => {
                btn.classList.remove('active');
            });
            presetBtn.classList.add('active');
            
            // Load the preset with animation
            loadPreset(preset);
            
            // Show toast with preset info
            showToast(`Loaded ${preset.name} - ${preset.bpm} BPM 🎵`, 'success');
        });
        
        presetContainer.appendChild(presetBtn);
    });
    
    // Add custom CSS for preset buttons
    const style = document.createElement('style');
    style.textContent = `
        .preset-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            margin: 1rem 0;
        }
        
        .preset-btn {
            background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
            border: none;
            border-radius: 8px;
            padding: 1rem;
            color: #fff;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
            position: relative;
            overflow: hidden;
        }
        
        .preset-btn:hover {
            background: linear-gradient(145deg, #3a3a3a, #2a2a2a);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .preset-btn.active {
            background: linear-gradient(145deg, #4a4a4a, #3a3a3a);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .preset-btn.clicked {
            transform: scale(0.95);
        }
        
        .preset-name {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .preset-bpm {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .preset-icon {
            position: absolute;
            top: 1rem;
            right: 1rem;
            font-size: 1.5rem;
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);
}

// Setup save controls
function setupSaveControls() {
    const saveBtn = document.querySelector('.save-btn');
    const confirmSaveBtn = document.getElementById('confirmSave');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const saveModal = new bootstrap.Modal(document.getElementById('saveModal'));
            saveModal.show();
        });
    }
    
    if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', saveBeat);
    }
}

// Load preset beat with proper synth handling
function loadPreset(preset) {
    if (!preset || !preset.pattern) {
        console.error('Invalid preset data! ��');
        return;
    }
    
    console.log('Loading preset:', preset.name);
    
    // Stop if playing and release all notes
    if (isPlaying) {
        stopSequencer();
    }
    
    // Stop all preview sounds
    stopAllSounds();
    
    // Update BPM
    const bpmSlider = document.querySelector('.bpm-slider');
    const bpmValue = document.querySelector('.bpm-value');
    if (bpmSlider && bpmValue) {
        bpm = preset.bpm;
        bpmSlider.value = bpm;
        bpmValue.textContent = bpm;
        Tone.Transport.bpm.value = bpm;
    }
    
    // Clear current pattern
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('active');
    });
    
    // Reset grid
    Object.keys(grid).forEach(instrument => {
        grid[instrument] = new Array(steps).fill(false);
    });
    
    // Load new pattern with animation
    Object.entries(preset.pattern).forEach(([instrument, pattern], instrumentIndex) => {
        if (!instruments[instrument]) {
            console.warn(`Instrument ${instrument} not found, skipping...`);
            return;
        }
        
        setTimeout(() => {
            pattern.forEach((value, step) => {
                if (value) {
                    const cell = document.querySelector(
                        `[data-instrument="${instrument}"][data-step="${step}"]`
                    );
                    if (cell) {
                        cell.classList.add('active');
                        grid[instrument][step] = true;
                        
                        // Add ripple effect
                        const ripple = document.createElement('div');
                        ripple.className = 'ripple';
                        cell.appendChild(ripple);
                        setTimeout(() => ripple.remove(), 500);
                        
                        // Preview only the first beat of each instrument with very short duration
                        if (step === pattern.indexOf(1)) {
                            playSound(instrument, 0.3, true, '32n');
                        }
                    }
                }
            });
        }, instrumentIndex * 100); // Stagger the loading of each instrument
    });
    
    showToast(`Loaded ${preset.name} 🎵`, 'success');
}

// Stop all sounds immediately
function stopAllSounds() {
    // Clear any existing preview timeouts
    previewTimeouts.forEach(timeout => clearTimeout(timeout));
    previewTimeouts = [];
    
    // Immediately stop all transport events
    Tone.Transport.cancel();
    
    // Stop and release all instruments with immediate release
    Object.values(instruments).forEach(instrument => {
        if (instrument.triggerRelease) {
            instrument.triggerRelease('+0.01');
        }
        if (instrument.releaseAll) {
            instrument.releaseAll(true);  // Force immediate release
        }
    });
    
    // Clear active preview notes
    activePreviewNotes.clear();
    
    // Reset all effects
    Object.values(effects).forEach(effect => {
        if (effect.dispose) {
            effect.dispose();
        }
    });
}

// Play a single sound with improved timing
function playSound(instrument, velocity = 1, isPreview = false, forceDuration = null) {
    if (!instruments[instrument]) {
        console.error(`Instrument ${instrument} not found!`);
        return;
    }
    
    try {
        // Handle preview cleanup
        if (isPreview) {
            // Stop previous preview of this instrument
            if (activePreviewNotes.has(instrument)) {
                if (instruments[instrument].triggerRelease) {
                    instruments[instrument].triggerRelease('+0.01');
                }
                activePreviewNotes.delete(instrument);
            }
            
            // Prevent rapid-fire previews
            const now = Date.now();
            if (now - lastPreviewTime < 100) return;
            lastPreviewTime = now;
        }
        
        const time = Tone.now();
        const duration = forceDuration || (isPreview ? '32n' : '16n');
        
        switch(instrument.toLowerCase()) {
            case 'kick':
                instruments.kick.triggerAttackRelease('C1', duration, time, velocity * 0.9);
                break;
            case 'snare':
                instruments.snare.triggerAttackRelease(duration, time, velocity * 0.8);
                break;
            case 'hihat':
                const hihatFreq = 2500 + Math.random() * 500;
                instruments.hihat.frequency.setValueAtTime(hihatFreq, time);
                instruments.hihat.triggerAttackRelease('32n', time, velocity * 0.5);
                break;
            case 'clap':
                instruments.clap.triggerAttackRelease('32n', time, velocity * 0.7);
                if (!isPreview) {
                    previewTimeouts.push(setTimeout(() => {
                        instruments.clap.triggerAttackRelease('64n', time + 0.02, velocity * 0.4);
                    }, 20));
                }
                break;
            case 'bass':
                const bassNotes = ['C2', 'G1', 'A1', 'F1'];
                const bassNote = bassNotes[Math.floor(currentStep / 8) % bassNotes.length];
                instruments.bass.triggerAttackRelease(bassNote, duration, time, velocity * 0.8);
                break;
            case 'synth':
                const chords = [
                    ['C4', 'E4', 'G4'],
                    ['F4', 'A4', 'C5'],
                    ['G4', 'B4', 'D5'],
                    ['A4', 'C5', 'E5']
                ];
                const chord = chords[Math.floor(currentStep / 8) % chords.length];
                
                // Ensure previous notes are released
                instruments.synth.triggerRelease(time);
                
                // Play new notes with very short duration
                instruments.synth.triggerAttackRelease(chord, '32n', time, velocity * 0.6);
                
                // Force release after playback
                const releaseTime = time + Tone.Time('32n').toSeconds();
                instruments.synth.triggerRelease(releaseTime);
                break;
        }
        
        // Track preview notes with automatic cleanup
        if (isPreview) {
            activePreviewNotes.add(instrument);
            const cleanupTime = Tone.Time(duration).toMilliseconds() + 50;
            setTimeout(() => {
                if (instruments[instrument].triggerRelease) {
                    instruments[instrument].triggerRelease('+0.01');
                }
                activePreviewNotes.delete(instrument);
            }, cleanupTime);
        }
        
    } catch (error) {
        console.error(`Error playing ${instrument}:`, error);
    }
}

// Start the sequencer with improved timing
function startSequencer() {
    if (isPlaying) return;
    
    try {
        isPlaying = true;
        currentStep = 0;
        
        // Clear any existing interval and transport events
        if (stepInterval) clearInterval(stepInterval);
        Tone.Transport.cancel();
        
        // Calculate interval based on BPM
        const stepTime = (60 / bpm) * 1000 / 4; // Convert BPM to milliseconds per 16th note
        
        // Start precise interval for UI updates
        stepInterval = setInterval(() => {
            requestAnimationFrame(() => {
                updateSequencer();
            });
        }, stepTime);
        
        // Schedule audio events with precise timing
        const repeat = (time) => {
            // Play all active instruments at current step
            Object.entries(grid).forEach(([instrument, pattern]) => {
                if (pattern[currentStep]) {
                    // Add slight random velocity variation for more natural feel
                    const velocity = 0.7 + (Math.random() * 0.2);
                    playSound(instrument, velocity);
                }
            });
            
            // Update step counter
            currentStep = (currentStep + 1) % steps;
            
            // Update UI on next animation frame
            requestAnimationFrame(() => {
                updateSequencerUI();
            });
        };
        
        // Start transport with proper timing
        Tone.Transport.bpm.value = bpm;
        Tone.Transport.scheduleRepeat(repeat, "16n");
        Tone.Transport.start();
        
        console.log('Sequencer started with precise timing! 🎵');
        
    } catch (error) {
        console.error('Error starting sequencer:', error);
        isPlaying = false;
        showToast('Failed to start sequencer! Try again. 😢', 'error');
    }
}

// Update sequencer UI separately from audio
function updateSequencerUI() {
    try {
        // Remove previous current step highlights
        document.querySelectorAll('.grid-cell.current').forEach(cell => {
            cell.classList.remove('current');
        });
        
        // Update playhead position with smooth animation
        const playhead = document.querySelector('.playhead');
        if (playhead) {
            const stepWidth = document.querySelector('.grid-cell').offsetWidth;
            const stepGap = 8; // matches CSS gap
            const offset = 150; // matches instrument label width
            const position = offset + (currentStep * (stepWidth + stepGap));
            
            playhead.style.transition = 'transform 0.1s linear';
            playhead.style.transform = `translateX(${position}px)`;
        }
        
        // Highlight current step cells with glow effect
        document.querySelectorAll(`[data-step="${currentStep}"]`).forEach(cell => {
            if (cell.classList.contains('active')) {
                cell.classList.add('current');
                // Add extra glow effect on beat
                cell.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
                setTimeout(() => {
                    cell.style.boxShadow = '';
                }, 100);
            }
        });
        
    } catch (error) {
        console.error('Error updating sequencer UI:', error);
    }
}

// Stop the sequencer cleanly
function stopSequencer() {
    if (!isPlaying) return;
    
    try {
        isPlaying = false;
        
        // Clear all intervals
        if (stepInterval) {
            clearInterval(stepInterval);
            stepInterval = null;
        }
        
        // Stop all audio immediately
        Tone.Transport.stop();
        Tone.Transport.cancel();
        
        // Stop any ongoing sounds
        Object.values(instruments).forEach(instrument => {
            if (instrument.triggerRelease) {
                instrument.triggerRelease();
            }
        });
        
        // Reset UI
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('current');
            cell.style.boxShadow = '';
        });
        
        // Reset playhead
        const playhead = document.querySelector('.playhead');
        if (playhead) {
            playhead.style.transition = 'transform 0.3s ease-out';
            playhead.style.transform = 'translateX(150px)';
        }
        
        currentStep = 0;
        console.log('Sequencer stopped cleanly! ⏹️');
        
    } catch (error) {
        console.error('Error stopping sequencer:', error);
        showToast('Failed to stop sequencer! 😢', 'error');
    }
}

// Toggle play/pause
function togglePlay() {
    if (isPlaying) {
        stopSequencer();
        document.querySelector('.play-btn i').className = 'fas fa-play';
    } else {
        startSequencer();
        document.querySelector('.play-btn i').className = 'fas fa-pause';
    }
}

// Save the current beat
async function saveBeat() {
    try {
        const form = document.getElementById('saveBeatForm');
        if (!form) throw new Error('Save form not found!');
        
        const formData = new FormData(form);
        
        const beatData = {
            name: formData.get('name'),
            description: formData.get('description'),
            pattern: {
                bpm: bpm,
                grid: grid,
                style: 'custom'
            }
        };
        
        formData.append('beat_data', JSON.stringify(beatData));
        
        const response = await fetch('/upload_beat', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Beat saved successfully! 🎵', 'success');
            window.location.href = result.redirect_url;
        } else {
            throw new Error(result.error || 'Failed to save beat');
        }
        
    } catch (error) {
        console.error('Error saving beat:', error);
        showToast('Failed to save beat! Try again. 😢', 'error');
    }
}

// Handle keyboard shortcuts
function handleKeyPress(e) {
    // Ignore if typing in input/textarea
    if (e.target.matches('input, textarea')) return;
    
    try {
        // Space to play/pause
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlay();
        }
        
        // Numbers 1-8 to toggle beats
        if (e.key >= '1' && e.key <= '8') {
            const instrumentIndex = parseInt(e.key) - 1;
            const instrument = Object.keys(instruments)[instrumentIndex];
            if (instrument) {
                grid[instrument][currentStep] = !grid[instrument][currentStep];
                const cell = document.querySelector(
                    `[data-instrument="${instrument}"][data-step="${currentStep}"]`
                );
                if (cell) {
                    cell.classList.toggle('active');
                    if (grid[instrument][currentStep]) {
                        playSound(instrument);
                    }
                }
            }
        }
        
        // Left/Right arrows to adjust BPM
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            const slider = document.querySelector('.bpm-slider');
            if (slider) {
                const newValue = parseInt(slider.value) + (e.code === 'ArrowRight' ? 1 : -1);
                slider.value = Math.max(Math.min(newValue, slider.max), slider.min);
                slider.dispatchEvent(new Event('input'));
            }
        }
        
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
            e.preventDefault();
            const saveBtn = document.querySelector('.save-btn');
            if (saveBtn) saveBtn.click();
        }
        
    } catch (error) {
        console.error('Error handling keyboard shortcut:', error);
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast show ${type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info'}`;
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">🎵 Beat Lab</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body text-white">${message}</div>
    `;
    
    toast.style.position = 'fixed';
    toast.style.top = '1rem';
    toast.style.right = '1rem';
    toast.style.zIndex = '1050';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
} 