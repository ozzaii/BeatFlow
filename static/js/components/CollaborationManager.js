class CollaborationManager {
    constructor(beatMaker, beatId) {
        this.beatMaker = beatMaker;
        this.beatId = beatId;
        this.collaborators = new Map();
        this.versionHistory = [];
        this.currentVersion = 0;
        this.isRecordingChanges = false;
        this.changeBuffer = [];
        this.lastSyncTimestamp = Date.now();
        
        this.setupWebSocket();
        this.setupEventListeners();
    }
    
    setupWebSocket() {
        // Connect to Supabase real-time channel
        this.channel = supabase
            .channel(`beat:${this.beatId}`)
            .on('presence', { event: 'sync' }, () => {
                const state = this.channel.presenceState();
                this.updateCollaborators(state);
            })
            .on('presence', { event: 'join' }, ({ key, newPresence }) => {
                this.addCollaborator(newPresence);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresence }) => {
                this.removeCollaborator(leftPresence);
            })
            .on('broadcast', { event: 'beat_update' }, ({ payload }) => {
                this.handleRemoteUpdate(payload);
            })
            .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
                this.handleChatMessage(payload);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await this.channel.track({
                        user_id: currentUser.id,
                        username: currentUser.username,
                        timestamp: Date.now()
                    });
                }
            });
    }
    
    setupEventListeners() {
        // Listen for local beat changes
        this.beatMaker.on('patternChange', (change) => {
            this.handleLocalChange(change);
        });
        
        this.beatMaker.on('effectChange', (change) => {
            this.handleLocalChange(change);
        });
        
        this.beatMaker.on('tempoChange', (change) => {
            this.handleLocalChange(change);
        });
    }
    
    handleLocalChange(change) {
        // Buffer changes for efficient broadcasting
        this.changeBuffer.push({
            ...change,
            timestamp: Date.now(),
            user_id: currentUser.id
        });
        
        // Debounce changes to avoid flooding
        clearTimeout(this.broadcastTimeout);
        this.broadcastTimeout = setTimeout(() => {
            this.broadcastChanges();
        }, 100);
        
        // Record change for version control if recording
        if (this.isRecordingChanges) {
            this.recordChange(change);
        }
    }
    
    async broadcastChanges() {
        if (this.changeBuffer.length === 0) return;
        
        const changes = [...this.changeBuffer];
        this.changeBuffer = [];
        
        try {
            await this.channel.send({
                type: 'broadcast',
                event: 'beat_update',
                payload: {
                    changes,
                    version: this.currentVersion
                }
            });
        } catch (error) {
            console.error('Failed to broadcast changes:', error);
            // Requeue failed changes
            this.changeBuffer.unshift(...changes);
        }
    }
    
    handleRemoteUpdate({ changes, version }) {
        // Ignore our own changes
        changes = changes.filter(change => change.user_id !== currentUser.id);
        if (changes.length === 0) return;
        
        // Apply remote changes
        changes.forEach(change => {
            switch (change.type) {
                case 'pattern':
                    this.beatMaker.setPattern(change.pattern, false);
                    break;
                case 'effect':
                    this.beatMaker.setEffectParam(change.effect, change.param, change.value, false);
                    break;
                case 'tempo':
                    this.beatMaker.setTempo(change.value, false);
                    break;
            }
        });
        
        // Update version
        this.currentVersion = version;
        
        // Trigger UI update
        this.beatMaker.emit('remoteUpdate', changes);
    }
    
    startRecordingChanges() {
        this.isRecordingChanges = true;
        this.changeBuffer = [];
    }
    
    stopRecordingChanges() {
        this.isRecordingChanges = false;
        return this.changeBuffer;
    }
    
    async saveVersion(commitMessage) {
        const changes = this.stopRecordingChanges();
        if (changes.length === 0) return;
        
        try {
            const version = {
                beat_id: this.beatId,
                changes,
                commit_message: commitMessage,
                version_number: this.currentVersion + 1,
                created_by: currentUser.id,
                timestamp: Date.now()
            };
            
            const response = await supabase.from('beats_versions').insert(version);
            
            if (response.data) {
                this.versionHistory.push(response.data);
                this.currentVersion++;
                return response.data;
            }
        } catch (error) {
            console.error('Failed to save version:', error);
            throw error;
        }
    }
    
    async loadVersion(versionId) {
        try {
            const response = await supabase
                .from('beats_versions')
                .select('*')
                .eq('id', versionId)
                .single();
                
            if (response.data) {
                const version = response.data;
                this.beatMaker.setPattern(version.pattern, false);
                this.currentVersion = version.version_number;
                return version;
            }
        } catch (error) {
            console.error('Failed to load version:', error);
            throw error;
        }
    }
    
    updateCollaborators(state) {
        this.collaborators.clear();
        Object.values(state).forEach(presence => {
            presence.forEach(session => {
                this.collaborators.set(session.user_id, {
                    username: session.username,
                    lastActive: session.timestamp
                });
            });
        });
        
        this.emit('collaboratorsUpdate', Array.from(this.collaborators.values()));
    }
    
    addCollaborator(presence) {
        presence.forEach(session => {
            this.collaborators.set(session.user_id, {
                username: session.username,
                lastActive: session.timestamp
            });
        });
        
        this.emit('collaboratorJoin', Array.from(this.collaborators.values()));
    }
    
    removeCollaborator(presence) {
        presence.forEach(session => {
            this.collaborators.delete(session.user_id);
        });
        
        this.emit('collaboratorLeave', Array.from(this.collaborators.values()));
    }
    
    async sendChatMessage(content) {
        try {
            await this.channel.send({
                type: 'broadcast',
                event: 'chat_message',
                payload: {
                    content,
                    user_id: currentUser.id,
                    username: currentUser.username,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            console.error('Failed to send chat message:', error);
            throw error;
        }
    }
    
    handleChatMessage(message) {
        this.emit('chatMessage', message);
    }
    
    // Event emitter methods
    on(event, callback) {
        if (!this.events) this.events = {};
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.events || !this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
    
    emit(event, data) {
        if (!this.events || !this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
    
    // Cleanup
    destroy() {
        if (this.channel) {
            this.channel.unsubscribe();
        }
        clearTimeout(this.broadcastTimeout);
        this.events = {};
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollaborationManager;
} else {
    window.CollaborationManager = CollaborationManager;
} 