class BeatMakerUI {
    constructor(beatMaker, container) {
        this.beatMaker = beatMaker;
        this.container = container;
        this.gridElements = new Map();
        this.currentBeat = -1;
        this.events = {};
        
        // Collaboration state
        this.collaborators = new Map();
        this.activeCollaborator = null;
        this.lastCollaboratorAction = null;
        
        this.init();
    }
    
    init() {
        this.createControls();
        this.createGrid();
        this.createEffectsPanel();
        this.setupEventListeners();
        this.startUILoop();
        
        // Initialize collaboration UI if enabled
        if (this.beatMaker.config.enableCollaboration) {
            this.initializeCollaborationUI();
        }
    }
    
    initializeCollaborationUI() {
        // Create collaboration status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'collaboration-status glass';
        statusIndicator.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="status-dot"></div>
                <span class="status-text">Connecting...</span>
            </div>
            <div class="collaborators-count">
                <i class="fas fa-users"></i>
                <span>0</span>
            </div>
        `;
        
        this.container.appendChild(statusIndicator);
        this.statusIndicator = statusIndicator;
        
        // Create collaborator cursors container
        const cursorsContainer = document.createElement('div');
        cursorsContainer.className = 'collaborator-cursors';
        this.container.appendChild(cursorsContainer);
        this.cursorsContainer = cursorsContainer;
        
        // Create collaboration actions overlay
        const actionsOverlay = document.createElement('div');
        actionsOverlay.className = 'collaboration-actions-overlay';
        this.container.appendChild(actionsOverlay);
        this.actionsOverlay = actionsOverlay;
        
        // Set up collaboration event listeners
        this.setupCollaborationEventListeners();
    }
    
    setupCollaborationEventListeners() {
        // Listen for collaboration status changes
        this.beatMaker.collaboration?.on('connected', () => {
            this.updateCollaborationStatus('connected');
        });
        
        this.beatMaker.collaboration?.on('disconnected', () => {
            this.updateCollaborationStatus('disconnected');
        });
        
        // Listen for collaborator updates
        this.beatMaker.collaboration?.on('collaboratorsUpdate', (collaborators) => {
            this.updateCollaborators(collaborators);
        });
        
        this.beatMaker.collaboration?.on('collaboratorJoin', (collaborator) => {
            this.showCollaboratorAction(collaborator, 'joined');
        });
        
        this.beatMaker.collaboration?.on('collaboratorLeave', (collaborator) => {
            this.showCollaboratorAction(collaborator, 'left');
        });
        
        // Listen for remote changes
        this.beatMaker.collaboration?.on('remoteChange', (change) => {
            this.handleRemoteChange(change);
        });
        
        // Track cursor movements
        this.container.addEventListener('mousemove', (e) => {
            if (this.beatMaker.collaboration) {
                const rect = this.container.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                
                this.beatMaker.collaboration.updateCursorPosition(x, y);
            }
        });
    }
    
    updateCollaborationStatus(status) {
        const dot = this.statusIndicator.querySelector('.status-dot');
        const text = this.statusIndicator.querySelector('.status-text');
        
        dot.className = `status-dot status-${status}`;
        
        switch (status) {
            case 'connected':
                text.textContent = 'Connected';
                break;
            case 'disconnected':
                text.textContent = 'Disconnected';
                break;
            case 'connecting':
                text.textContent = 'Connecting...';
                break;
        }
    }
    
    updateCollaborators(collaborators) {
        this.collaborators = new Map(collaborators);
        
        // Update count
        const count = this.statusIndicator.querySelector('.collaborators-count span');
        count.textContent = this.collaborators.size;
        
        // Update cursors
        this.updateCollaboratorCursors();
    }
    
    updateCollaboratorCursors() {
        this.cursorsContainer.innerHTML = '';
        
        this.collaborators.forEach((collaborator, id) => {
            if (id !== this.beatMaker.config.currentUser.id && collaborator.cursor) {
                const cursor = document.createElement('div');
                cursor.className = 'collaborator-cursor';
                cursor.style.left = `${collaborator.cursor.x * 100}%`;
                cursor.style.top = `${collaborator.cursor.y * 100}%`;
                
                cursor.innerHTML = `
                    <div class="cursor-pointer"></div>
                    <div class="cursor-label glass">
                        ${collaborator.username}
                    </div>
                `;
                
                this.cursorsContainer.appendChild(cursor);
            }
        });
    }
    
    showCollaboratorAction(collaborator, action) {
        const actionEl = document.createElement('div');
        actionEl.className = 'collaboration-action glass';
        
        actionEl.innerHTML = `
            <div class="flex items-center gap-2">
                <img src="${collaborator.avatar_url || '/static/img/default-avatar.png'}" 
                     alt="${collaborator.username}"
                     class="w-6 h-6 rounded-full">
                <span class="text-sm">
                    <strong>${collaborator.username}</strong> ${action}
                </span>
            </div>
        `;
        
        this.actionsOverlay.appendChild(actionEl);
        
        // Remove after delay
        setTimeout(() => {
            actionEl.remove();
        }, 3000);
    }
    
    handleRemoteChange(change) {
        switch (change.type) {
            case 'pattern':
                this.updatePattern(change.pattern, false);
                this.showCollaboratorAction(change.user, 'updated the pattern');
                break;
                
            case 'effect':
                this.updateEffectParam(change.effect, change.param, change.value, false);
                this.showCollaboratorAction(change.user, `adjusted ${change.effect}`);
                break;
                
            case 'tempo':
                this.updateTempo(change.value, false);
                this.showCollaboratorAction(change.user, 'changed the tempo');
                break;
        }
    }
    
    updatePattern(pattern, broadcast = true) {
        Object.entries(pattern).forEach(([trackName, trackPattern]) => {
            const elements = this.gridElements.get(trackName);
            if (elements) {
                trackPattern.forEach((value, step) => {
                    elements[step].classList.toggle('active', Boolean(value));
                });
            }
        });
        
        if (broadcast) {
            this.emit('patternChange', { pattern });
        }
    }
    
    updateEffectParam(effect, param, value, broadcast = true) {
        const input = this.container.querySelector(`input[data-effect="${effect}"][data-param="${param}"]`);
        if (input) {
            input.value = value * 100;
        }
        
        if (broadcast) {
            this.emit('effectChange', { effect, param, value });
        }
    }
    
    updateTempo(value, broadcast = true) {
        const input = this.container.querySelector('.bpm-control input');
        if (input) {
            input.value = value;
        }
        
        if (broadcast) {
            this.emit('tempoChange', value);
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
    
    destroy() {
        // Clean up event listeners
        this.events = {};
        
        // Remove collaboration UI elements
        this.statusIndicator?.remove();
        this.cursorsContainer?.remove();
        this.actionsOverlay?.remove();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeatMakerUI;
} else {
    window.BeatMakerUI = BeatMakerUI;
} 