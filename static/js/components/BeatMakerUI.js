class BeatMakerUI {
    constructor(beatMaker, container) {
        this.beatMaker = beatMaker;
        this.container = container;
        this.gridElements = new Map();
        this.currentBeat = -1;
        
        this.init();
    }
    
    init() {
        this.createControls();
        this.createGrid();
        this.createEffectsPanel();
        this.setupEventListeners();
        this.startUILoop();
    }
    
    createControls() {
        const controls = document.createElement('div');
        controls.className = 'beat-maker-controls';
        
        // Transport controls
        const transport = document.createElement('div');
        transport.className = 'transport-controls';
        
        const playButton = document.createElement('button');
        playButton.innerHTML = '<i class="fas fa-play"></i>';
        playButton.onclick = () => this.togglePlay();
        
        const stopButton = document.createElement('button');
        stopButton.innerHTML = '<i class="fas fa-stop"></i>';
        stopButton.onclick = () => this.beatMaker.stop();
        
        const bpmControl = document.createElement('div');
        bpmControl.className = 'bpm-control';
        bpmControl.innerHTML = `
            <span>BPM</span>
            <input type="number" value="${this.beatMaker.config.bpm}" min="30" max="300">
        `;
        
        transport.appendChild(playButton);
        transport.appendChild(stopButton);
        transport.appendChild(bpmControl);
        
        // Track controls
        const trackControls = document.createElement('div');
        trackControls.className = 'track-controls';
        
        this.beatMaker.tracks.forEach((track, name) => {
            const trackControl = document.createElement('div');
            trackControl.className = 'track-control';
            trackControl.innerHTML = `
                <span>${name}</span>
                <input type="range" value="100" min="0" max="100">
                <button class="mute"><i class="fas fa-volume-up"></i></button>
            `;
            
            trackControls.appendChild(trackControl);
        });
        
        controls.appendChild(transport);
        controls.appendChild(trackControls);
        
        this.container.appendChild(controls);
    }
    
    createGrid() {
        const grid = document.createElement('div');
        grid.className = 'beat-grid';
        
        this.beatMaker.tracks.forEach((track, name) => {
            const row = document.createElement('div');
            row.className = 'beat-row';
            
            const trackElements = [];
            for (let i = 0; i < this.beatMaker.config.resolution; i++) {
                const cell = document.createElement('div');
                cell.className = 'beat-cell';
                cell.dataset.track = name;
                cell.dataset.step = i;
                
                if (i % 4 === 0) cell.classList.add('beat-start');
                
                cell.onclick = () => this.toggleStep(name, i);
                
                row.appendChild(cell);
                trackElements.push(cell);
            }
            
            this.gridElements.set(name, trackElements);
            grid.appendChild(row);
        });
        
        this.container.appendChild(grid);
    }
    
    createEffectsPanel() {
        const effects = document.createElement('div');
        effects.className = 'effects-panel';
        
        // Reverb
        const reverb = document.createElement('div');
        reverb.className = 'effect-control';
        reverb.innerHTML = `
            <span>Reverb</span>
            <input type="range" data-effect="reverb" data-param="wet" value="50" min="0" max="100">
        `;
        
        // Delay
        const delay = document.createElement('div');
        delay.className = 'effect-control';
        delay.innerHTML = `
            <span>Delay</span>
            <input type="range" data-effect="delay" data-param="delayTime" value="50" min="0" max="100">
        `;
        
        // Filter
        const filter = document.createElement('div');
        filter.className = 'effect-control';
        filter.innerHTML = `
            <span>Filter</span>
            <input type="range" data-effect="filter" data-param="frequency" value="100" min="0" max="100">
        `;
        
        effects.appendChild(reverb);
        effects.appendChild(delay);
        effects.appendChild(filter);
        
        this.container.appendChild(effects);
    }
    
    setupEventListeners() {
        // BPM control
        const bpmInput = this.container.querySelector('.bpm-control input');
        bpmInput.onchange = (e) => this.beatMaker.setTempo(parseInt(e.target.value));
        
        // Volume controls
        const volumeInputs = this.container.querySelectorAll('.track-control input[type="range"]');
        volumeInputs.forEach(input => {
            input.onchange = (e) => {
                const trackName = e.target.closest('.track-control').querySelector('span').textContent;
                this.beatMaker.setVolume(trackName, parseInt(e.target.value) / 100);
            };
        });
        
        // Mute buttons
        const muteButtons = this.container.querySelectorAll('.track-control .mute');
        muteButtons.forEach(button => {
            button.onclick = (e) => {
                const trackName = e.target.closest('.track-control').querySelector('span').textContent;
                const isMuted = this.beatMaker.toggleMute(trackName);
                e.target.innerHTML = `<i class="fas fa-volume-${isMuted ? 'mute' : 'up'}"></i>`;
            };
        });
        
        // Effect controls
        const effectInputs = this.container.querySelectorAll('.effect-control input');
        effectInputs.forEach(input => {
            input.onchange = (e) => {
                const effect = e.target.dataset.effect;
                const param = e.target.dataset.param;
                this.beatMaker.setEffectParam(effect, param, parseInt(e.target.value) / 100);
            };
        });
    }
    
    togglePlay() {
        if (this.beatMaker.isPlaying) {
            this.beatMaker.stop();
            this.container.querySelector('.transport-controls button').innerHTML = '<i class="fas fa-play"></i>';
        } else {
            this.beatMaker.start();
            this.container.querySelector('.transport-controls button').innerHTML = '<i class="fas fa-pause"></i>';
        }
    }
    
    toggleStep(trackName, step) {
        if (this.beatMaker.toggleStep(trackName, step)) {
            const cell = this.gridElements.get(trackName)[step];
            cell.classList.toggle('active');
        }
    }
    
    startUILoop() {
        const updateUI = () => {
            if (this.beatMaker.isPlaying) {
                const currentBeat = this.beatMaker.currentStep;
                
                if (currentBeat !== this.currentBeat) {
                    // Remove highlight from previous beat
                    if (this.currentBeat !== -1) {
                        this.gridElements.forEach(elements => {
                            elements[this.currentBeat].classList.remove('current');
                        });
                    }
                    
                    // Add highlight to current beat
                    this.gridElements.forEach(elements => {
                        elements[currentBeat].classList.add('current');
                    });
                    
                    this.currentBeat = currentBeat;
                }
            }
            
            requestAnimationFrame(updateUI);
        };
        
        requestAnimationFrame(updateUI);
    }
    
    updatePattern() {
        const pattern = this.beatMaker.getPattern();
        Object.entries(pattern).forEach(([trackName, trackPattern]) => {
            const elements = this.gridElements.get(trackName);
            trackPattern.forEach((value, step) => {
                elements[step].classList.toggle('active', Boolean(value));
            });
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeatMakerUI;
} else {
    window.BeatMakerUI = BeatMakerUI;
} 