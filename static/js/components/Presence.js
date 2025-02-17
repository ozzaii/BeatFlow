class Presence {
    constructor(collaborationManager) {
        this.collaborationManager = collaborationManager;
        this.container = null;
        this.presenceChannel = null;
        this.onlineUsers = new Map();
        this.userStates = new Map();
        this.lastCursorPositions = new Map();
        
        this.init();
    }
    
    init() {
        this.createPresenceUI();
        this.setupPresenceChannel();
        this.setupEventListeners();
    }
    
    createPresenceUI() {
        // Create presence container
        const container = document.createElement('div');
        container.className = 'presence-container glass';
        container.innerHTML = `
            <div class="presence-header">
                <h3 class="text-sm font-medium text-text-secondary">
                    <i class="fas fa-users text-primary"></i>
                    <span>Online Now</span>
                </h3>
                <span class="online-count text-xs text-text-secondary">0</span>
            </div>
            <div class="presence-list"></div>
            <div class="cursor-indicators"></div>
        `;
        
        document.body.appendChild(container);
        this.container = container;
    }
    
    setupPresenceChannel() {
        this.presenceChannel = this.collaborationManager.supabase
            .channel(`beat_presence:${this.collaborationManager.beatId}`)
            .on('presence', { event: 'sync' }, () => {
                const presenceState = this.presenceChannel.presenceState();
                this.updatePresence(presenceState);
            })
            .on('presence', { event: 'join' }, ({ key, newPresence }) => {
                this.handleUserJoin(key, newPresence);
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                this.handleUserLeave(key);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await this.presenceChannel.track({
                        user_id: this.collaborationManager.currentUser.id,
                        username: this.collaborationManager.currentUser.username,
                        avatar_url: this.collaborationManager.currentUser.avatar_url,
                        state: 'active',
                        cursor: null,
                        last_active: new Date().toISOString()
                    });
                }
            });
    }
    
    setupEventListeners() {
        // Track user activity
        let activityTimeout;
        document.addEventListener('mousemove', (e) => {
            clearTimeout(activityTimeout);
            
            const cursor = {
                x: e.clientX / window.innerWidth,
                y: e.clientY / window.innerHeight
            };
            
            this.updateUserState('active', cursor);
            
            activityTimeout = setTimeout(() => {
                this.updateUserState('idle', cursor);
            }, 60000); // Set to idle after 1 minute of inactivity
        });
        
        // Track user focus
        window.addEventListener('focus', () => this.updateUserState('active'));
        window.addEventListener('blur', () => this.updateUserState('away'));
        
        // Track pattern changes
        this.collaborationManager.beatMaker.on('patternChange', () => {
            this.broadcastActivity('editing_pattern');
        });
        
        // Track effect changes
        this.collaborationManager.beatMaker.on('effectChange', () => {
            this.broadcastActivity('adjusting_effects');
        });
    }
    
    updatePresence(presenceState) {
        this.onlineUsers.clear();
        this.userStates.clear();
        
        Object.entries(presenceState).forEach(([key, presence]) => {
            const userData = presence[0]; // Get first presence instance for user
            this.onlineUsers.set(key, userData);
            this.userStates.set(key, userData.state);
            
            if (userData.cursor) {
                this.lastCursorPositions.set(key, userData.cursor);
            }
        });
        
        this.updateUI();
    }
    
    handleUserJoin(key, newPresence) {
        const userData = newPresence[0];
        this.onlineUsers.set(key, userData);
        this.userStates.set(key, userData.state);
        
        this.showNotification('join', userData);
        this.updateUI();
    }
    
    handleUserLeave(key) {
        const userData = this.onlineUsers.get(key);
        if (userData) {
            this.showNotification('leave', userData);
            this.onlineUsers.delete(key);
            this.userStates.delete(key);
            this.lastCursorPositions.delete(key);
        }
        
        this.updateUI();
    }
    
    updateUserState(state, cursor = null) {
        this.presenceChannel.track({
            user_id: this.collaborationManager.currentUser.id,
            username: this.collaborationManager.currentUser.username,
            avatar_url: this.collaborationManager.currentUser.avatar_url,
            state,
            cursor,
            last_active: new Date().toISOString()
        });
    }
    
    broadcastActivity(activity) {
        this.updateUserState(activity);
        
        // Reset to active state after a short delay
        setTimeout(() => {
            this.updateUserState('active');
        }, 3000);
    }
    
    updateUI() {
        // Update online count
        const onlineCount = this.container.querySelector('.online-count');
        onlineCount.textContent = `${this.onlineUsers.size} online`;
        
        // Update presence list
        const presenceList = this.container.querySelector('.presence-list');
        presenceList.innerHTML = '';
        
        this.onlineUsers.forEach((userData, key) => {
            const userElement = document.createElement('div');
            userElement.className = 'presence-item';
            
            const stateClass = this.getStateClass(userData.state);
            const stateIcon = this.getStateIcon(userData.state);
            
            userElement.innerHTML = `
                <div class="user-avatar">
                    <img src="${userData.avatar_url || '/static/images/default-avatar.png'}" 
                         alt="${userData.username}">
                    <span class="status-indicator ${stateClass}"></span>
                </div>
                <div class="user-info">
                    <span class="username">${userData.username}</span>
                    <span class="user-state">
                        <i class="fas ${stateIcon}"></i>
                        ${this.formatState(userData.state)}
                    </span>
                </div>
            `;
            
            presenceList.appendChild(userElement);
        });
        
        // Update cursor indicators
        this.updateCursorIndicators();
    }
    
    updateCursorIndicators() {
        const cursorContainer = this.container.querySelector('.cursor-indicators');
        cursorContainer.innerHTML = '';
        
        this.lastCursorPositions.forEach((cursor, key) => {
            const userData = this.onlineUsers.get(key);
            if (userData && key !== this.collaborationManager.currentUser.id) {
                const cursorElement = document.createElement('div');
                cursorElement.className = 'cursor-indicator';
                cursorElement.style.left = `${cursor.x * 100}%`;
                cursorElement.style.top = `${cursor.y * 100}%`;
                
                cursorElement.innerHTML = `
                    <div class="cursor-pointer"></div>
                    <span class="cursor-label">${userData.username}</span>
                `;
                
                cursorContainer.appendChild(cursorElement);
            }
        });
    }
    
    getStateClass(state) {
        switch (state) {
            case 'active': return 'status-active';
            case 'idle': return 'status-idle';
            case 'away': return 'status-away';
            case 'editing_pattern': return 'status-editing';
            case 'adjusting_effects': return 'status-editing';
            default: return 'status-offline';
        }
    }
    
    getStateIcon(state) {
        switch (state) {
            case 'active': return 'fa-circle';
            case 'idle': return 'fa-moon';
            case 'away': return 'fa-clock';
            case 'editing_pattern': return 'fa-music';
            case 'adjusting_effects': return 'fa-sliders-h';
            default: return 'fa-minus-circle';
        }
    }
    
    formatState(state) {
        switch (state) {
            case 'active': return 'Active';
            case 'idle': return 'Idle';
            case 'away': return 'Away';
            case 'editing_pattern': return 'Editing Pattern';
            case 'adjusting_effects': return 'Adjusting Effects';
            default: return 'Offline';
        }
    }
    
    showNotification(type, userData) {
        const message = type === 'join'
            ? `${userData.username} joined the session`
            : `${userData.username} left the session`;
            
        new Notification({
            type: type === 'join' ? 'info' : 'warning',
            message,
            duration: 3000
        }).show();
    }
    
    destroy() {
        if (this.presenceChannel) {
            this.presenceChannel.unsubscribe();
        }
        
        if (this.container) {
            this.container.remove();
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Presence };
} else {
    window.Presence = Presence;
} 