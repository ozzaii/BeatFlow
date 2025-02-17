class BeatMakerCollaboration {
    constructor(beatMaker, container, options = {}) {
        this.beatMaker = beatMaker;
        this.container = container;
        this.options = {
            enableChat: true,
            enablePresence: true,
            enableVersioning: true,
            ...options
        };
        
        this.beatId = options.beatId;
        this.currentUser = options.currentUser;
        
        // Component references
        this.collaborationManager = null;
        this.collaborationUI = null;
        this.presence = null;
        
        // State
        this.isInitialized = false;
        this.isSyncing = false;
        this.lastSyncTimestamp = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Create collaboration container
            this.createCollaborationContainer();
            
            // Initialize components in order
            await this.initializeCollaborationManager();
            await this.initializePresence();
            await this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Initial sync
            await this.syncState();
            
            console.log('BeatMaker collaboration initialized successfully 🎵');
        } catch (error) {
            console.error('Failed to initialize collaboration:', error);
            this.showError('Failed to initialize collaboration features');
        }
    }
    
    createCollaborationContainer() {
        const container = document.createElement('div');
        container.className = 'collaboration-container';
        
        // Create layout
        container.innerHTML = `
            <div class="collaboration-sidebar glass">
                <div class="collaboration-components"></div>
                <div class="collaboration-chat"></div>
            </div>
            <div class="collaboration-overlay"></div>
        `;
        
        this.container.appendChild(container);
        this.componentsContainer = container.querySelector('.collaboration-components');
        this.chatContainer = container.querySelector('.collaboration-chat');
        this.overlay = container.querySelector('.collaboration-overlay');
    }
    
    async initializeCollaborationManager() {
        this.collaborationManager = new CollaborationManager(this.beatMaker, this.beatId);
        await this.collaborationManager.init();
        
        // Handle real-time updates
        this.collaborationManager.on('stateUpdate', async (state) => {
            await this.handleStateUpdate(state);
        });
        
        this.collaborationManager.on('versionCreated', (version) => {
            this.collaborationUI?.addVersionToList(version);
        });
    }
    
    async initializePresence() {
        if (!this.options.enablePresence) return;
        
        this.presence = new Presence(this.collaborationManager);
        
        // Handle presence events
        this.presence.on('userJoined', (user) => {
            this.showNotification('info', `${user.username} joined the session`);
        });
        
        this.presence.on('userLeft', (user) => {
            this.showNotification('warning', `${user.username} left the session`);
        });
        
        this.presence.on('stateChanged', (user, state) => {
            this.handleUserStateChange(user, state);
        });
    }
    
    async initializeUI() {
        this.collaborationUI = new CollaborationUI(
            this.collaborationManager,
            this.componentsContainer
        );
        
        // Initialize modals
        this.inviteModal = new InviteModal(this.collaborationManager);
        this.saveVersionModal = new SaveVersionModal(this.collaborationManager);
        
        // Set up UI event handlers
        this.collaborationUI.on('inviteClick', () => {
            this.inviteModal.show();
        });
        
        this.collaborationUI.on('saveVersionClick', () => {
            this.saveVersionModal.updateChangesSummary(
                this.collaborationManager.getUncommittedChanges()
            );
            this.saveVersionModal.show();
        });
    }
    
    setupEventListeners() {
        // BeatMaker events
        this.beatMaker.on('patternChange', (change) => {
            if (!this.isSyncing) {
                this.collaborationManager.handleLocalChange({
                    type: 'pattern',
                    ...change
                });
            }
        });
        
        this.beatMaker.on('effectChange', (change) => {
            if (!this.isSyncing) {
                this.collaborationManager.handleLocalChange({
                    type: 'effect',
                    ...change
                });
            }
        });
        
        this.beatMaker.on('tempoChange', (tempo) => {
            if (!this.isSyncing) {
                this.collaborationManager.handleLocalChange({
                    type: 'tempo',
                    value: tempo
                });
            }
        });
        
        // Window events
        window.addEventListener('beforeunload', (e) => {
            this.cleanup();
        });
    }
    
    async handleStateUpdate(state) {
        this.isSyncing = true;
        try {
            // Update pattern
            if (state.pattern) {
                await this.beatMaker.setPattern(state.pattern, false);
            }
            
            // Update effects
            if (state.effects) {
                Object.entries(state.effects).forEach(([effect, params]) => {
                    Object.entries(params).forEach(([param, value]) => {
                        this.beatMaker.setEffectParam(effect, param, value, false);
                    });
                });
            }
            
            // Update tempo
            if (state.tempo) {
                this.beatMaker.setTempo(state.tempo, false);
            }
            
            this.lastSyncTimestamp = Date.now();
        } catch (error) {
            console.error('Failed to apply state update:', error);
            this.showError('Failed to sync changes');
        } finally {
            this.isSyncing = false;
        }
    }
    
    handleUserStateChange(user, state) {
        // Update UI to reflect user state
        if (state === 'editing_pattern') {
            this.showCollaboratorAction(user, 'is editing the pattern');
        } else if (state === 'adjusting_effects') {
            this.showCollaboratorAction(user, 'is adjusting effects');
        }
    }
    
    showCollaboratorAction(user, action) {
        const actionEl = document.createElement('div');
        actionEl.className = 'collaborator-action glass';
        actionEl.innerHTML = `
            <div class="flex items-center gap-2">
                <img src="${user.avatar_url || '/static/img/default-avatar.png'}" 
                     alt="${user.username}"
                     class="w-6 h-6 rounded-full">
                <span class="text-sm">
                    <strong>${user.username}</strong> ${action}
                </span>
            </div>
        `;
        
        this.overlay.appendChild(actionEl);
        
        // Remove after delay
        setTimeout(() => {
            actionEl.remove();
        }, 3000);
    }
    
    async syncState() {
        if (!this.isInitialized) return;
        
        try {
            const state = await this.collaborationManager.getState();
            await this.handleStateUpdate(state);
        } catch (error) {
            console.error('Failed to sync state:', error);
            this.showError('Failed to sync with collaborators');
        }
    }
    
    showNotification(type, message) {
        new Notification({
            type,
            message,
            duration: 3000
        }).show();
    }
    
    showError(message) {
        this.showNotification('error', message);
    }
    
    cleanup() {
        // Clean up components
        this.collaborationManager?.destroy();
        this.presence?.destroy();
        this.collaborationUI?.destroy();
        
        // Clean up modals
        this.inviteModal?.destroy();
        this.saveVersionModal?.destroy();
        
        // Remove container
        this.container.querySelector('.collaboration-container')?.remove();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeatMakerCollaboration;
} else {
    window.BeatMakerCollaboration = BeatMakerCollaboration;
} 