class CollaborationUI {
    constructor(collaborationManager, container) {
        this.manager = collaborationManager;
        this.container = container;
        this.chatMessages = [];
        this.isVersionPanelOpen = false;
        
        this.init();
    }
    
    init() {
        this.createCollaboratorPanel();
        this.createChatPanel();
        this.createVersionPanel();
        this.setupEventListeners();
    }
    
    createCollaboratorPanel() {
        const panel = document.createElement('div');
        panel.className = 'collaboration-panel glass rounded-lg p-4 mb-4';
        
        panel.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-primary">Collaborators</h3>
                <span class="online-count text-sm text-text-secondary">0 online</span>
            </div>
            <div class="collaborators-list space-y-2"></div>
            <button class="invite-btn btn btn-secondary w-full mt-4">
                <i class="fas fa-user-plus"></i>
                <span>Invite Collaborator</span>
            </button>
        `;
        
        this.collaboratorsList = panel.querySelector('.collaborators-list');
        this.onlineCount = panel.querySelector('.online-count');
        
        panel.querySelector('.invite-btn').onclick = () => this.showInviteModal();
        
        this.container.appendChild(panel);
    }
    
    createChatPanel() {
        const panel = document.createElement('div');
        panel.className = 'chat-panel glass rounded-lg p-4 mb-4';
        
        panel.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-primary">Chat</h3>
                <button class="minimize-btn">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="chat-messages space-y-2 max-h-60 overflow-y-auto mb-4"></div>
            <form class="chat-form flex gap-2">
                <input type="text" 
                       class="chat-input flex-1 bg-surface rounded px-3 py-2 text-text"
                       placeholder="Type a message...">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </form>
        `;
        
        this.chatMessages = panel.querySelector('.chat-messages');
        this.chatForm = panel.querySelector('.chat-form');
        this.chatInput = panel.querySelector('.chat-input');
        
        this.chatForm.onsubmit = (e) => {
            e.preventDefault();
            this.sendChatMessage();
        };
        
        panel.querySelector('.minimize-btn').onclick = () => {
            panel.classList.toggle('minimized');
        };
        
        this.container.appendChild(panel);
    }
    
    createVersionPanel() {
        const panel = document.createElement('div');
        panel.className = 'version-panel glass rounded-lg p-4';
        
        panel.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-primary">Version History</h3>
                <div class="flex gap-2">
                    <button class="save-version-btn btn btn-secondary">
                        <i class="fas fa-save"></i>
                        <span>Save Version</span>
                    </button>
                    <button class="minimize-btn">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            <div class="version-list space-y-2"></div>
        `;
        
        this.versionList = panel.querySelector('.version-list');
        
        panel.querySelector('.save-version-btn').onclick = () => this.showSaveVersionModal();
        panel.querySelector('.minimize-btn').onclick = () => {
            panel.classList.toggle('minimized');
            this.isVersionPanelOpen = !panel.classList.contains('minimized');
        };
        
        this.container.appendChild(panel);
    }
    
    setupEventListeners() {
        this.manager.on('collaboratorsUpdate', (collaborators) => {
            this.updateCollaboratorsList(collaborators);
        });
        
        this.manager.on('collaboratorJoin', (collaborators) => {
            this.updateCollaboratorsList(collaborators);
            this.addSystemMessage('joined the session');
        });
        
        this.manager.on('collaboratorLeave', (collaborators) => {
            this.updateCollaboratorsList(collaborators);
            this.addSystemMessage('left the session');
        });
        
        this.manager.on('chatMessage', (message) => {
            this.addChatMessage(message);
        });
        
        this.manager.on('versionCreated', (version) => {
            this.addVersionToList(version);
        });
    }
    
    updateCollaboratorsList(collaborators) {
        this.collaboratorsList.innerHTML = '';
        this.onlineCount.textContent = `${collaborators.length} online`;
        
        collaborators.forEach(collaborator => {
            const el = document.createElement('div');
            el.className = 'collaborator-item flex items-center gap-2 p-2 rounded hover:bg-surface-light transition-colors';
            
            el.innerHTML = `
                <div class="w-2 h-2 rounded-full bg-primary"></div>
                <span class="flex-1">${collaborator.username}</span>
                <span class="text-xs text-text-secondary">
                    ${this.getTimeAgo(collaborator.lastActive)}
                </span>
            `;
            
            this.collaboratorsList.appendChild(el);
        });
    }
    
    addChatMessage(message) {
        const el = document.createElement('div');
        el.className = `chat-message ${message.user_id === currentUser.id ? 'self' : 'other'}`;
        
        el.innerHTML = `
            <div class="flex items-start gap-2 ${message.user_id === currentUser.id ? 'justify-end' : ''}">
                <div class="message-content max-w-[80%] ${message.user_id === currentUser.id ? 'bg-primary' : 'bg-surface'} rounded-lg p-2">
                    ${message.user_id !== currentUser.id ? `
                        <div class="text-xs text-text-secondary mb-1">${message.username}</div>
                    ` : ''}
                    <div class="message-text">${this.escapeHtml(message.content)}</div>
                    <div class="text-xs text-text-secondary mt-1">
                        ${this.formatTime(message.timestamp)}
                    </div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(el);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    addSystemMessage(action) {
        const el = document.createElement('div');
        el.className = 'system-message text-center text-sm text-text-secondary my-2';
        el.textContent = `${action}`;
        this.chatMessages.appendChild(el);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    async sendChatMessage() {
        const content = this.chatInput.value.trim();
        if (!content) return;
        
        try {
            await this.manager.sendChatMessage(content);
            this.chatInput.value = '';
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }
    
    addVersionToList(version) {
        const el = document.createElement('div');
        el.className = 'version-item flex items-center justify-between p-2 rounded hover:bg-surface-light transition-colors';
        
        el.innerHTML = `
            <div class="flex-1">
                <div class="font-medium">${version.commit_message}</div>
                <div class="text-sm text-text-secondary">
                    by ${version.created_by} • ${this.formatTime(version.timestamp)}
                </div>
            </div>
            <button class="load-version-btn btn btn-secondary btn-sm" data-version-id="${version.id}">
                Load
            </button>
        `;
        
        el.querySelector('.load-version-btn').onclick = () => this.loadVersion(version.id);
        
        this.versionList.insertBefore(el, this.versionList.firstChild);
    }
    
    async loadVersion(versionId) {
        try {
            await this.manager.loadVersion(versionId);
            this.addSystemMessage('Loaded version');
        } catch (error) {
            console.error('Failed to load version:', error);
        }
    }
    
    showInviteModal() {
        // Implementation for invite modal
    }
    
    showSaveVersionModal() {
        // Implementation for save version modal
    }
    
    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }
    
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollaborationUI;
} else {
    window.CollaborationUI = CollaborationUI;
} 