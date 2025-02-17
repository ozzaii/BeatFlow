class Modal {
    constructor(options = {}) {
        this.id = options.id || `modal-${Date.now()}`;
        this.title = options.title || '';
        this.content = options.content || '';
        this.onConfirm = options.onConfirm || (() => {});
        this.onCancel = options.onCancel || (() => {});
        this.confirmText = options.confirmText || 'Confirm';
        this.cancelText = options.cancelText || 'Cancel';
        this.showCancel = options.showCancel !== false;
        
        this.element = null;
        this.isOpen = false;
        
        this.create();
    }
    
    create() {
        const modal = document.createElement('div');
        modal.id = this.id;
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content glass">
                <div class="modal-header">
                    <h3 class="text-xl font-bold text-primary">${this.title}</h3>
                    <button class="close-btn text-text-secondary hover:text-primary transition-colors">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${this.content}
                </div>
                <div class="modal-footer flex justify-end gap-4 mt-6">
                    ${this.showCancel ? `
                        <button class="cancel-btn btn btn-secondary">
                            <i class="fas fa-times"></i>
                            <span>${this.cancelText}</span>
                        </button>
                    ` : ''}
                    <button class="confirm-btn btn btn-primary">
                        <i class="fas fa-check"></i>
                        <span>${this.confirmText}</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.element = modal;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const closeBtn = this.element.querySelector('.close-btn');
        const cancelBtn = this.element.querySelector('.cancel-btn');
        const confirmBtn = this.element.querySelector('.confirm-btn');
        
        closeBtn.onclick = () => this.close();
        if (cancelBtn) cancelBtn.onclick = () => this.cancel();
        confirmBtn.onclick = () => this.confirm();
        
        this.element.onclick = (e) => {
            if (e.target === this.element) this.close();
        };
    }
    
    show() {
        this.isOpen = true;
        this.element.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        this.isOpen = false;
        this.element.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    confirm() {
        this.onConfirm();
        this.close();
    }
    
    cancel() {
        this.onCancel();
        this.close();
    }
    
    destroy() {
        if (this.element) {
            this.element.remove();
        }
    }
}

class InviteModal extends Modal {
    constructor(collaborationManager) {
        super({
            id: 'invite-modal',
            title: 'Invite Collaborator',
            confirmText: 'Send Invite',
            content: `
                <div class="space-y-4">
                    <div class="form-group">
                        <label class="block text-sm font-medium text-text-secondary mb-2">
                            Username or Email
                        </label>
                        <input type="text" 
                               class="invite-input w-full bg-surface border border-surface-light rounded-lg px-4 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                               placeholder="Enter username or email">
                    </div>
                    <div class="form-group">
                        <label class="block text-sm font-medium text-text-secondary mb-2">
                            Role
                        </label>
                        <select class="role-select w-full bg-surface border border-surface-light rounded-lg px-4 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="block text-sm font-medium text-text-secondary mb-2">
                            Message (optional)
                        </label>
                        <textarea class="invite-message w-full bg-surface border border-surface-light rounded-lg px-4 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                  placeholder="Add a personal message..."
                                  rows="3"></textarea>
                    </div>
                </div>
            `
        });
        
        this.collaborationManager = collaborationManager;
        this.setupInviteHandler();
    }
    
    setupInviteHandler() {
        this.onConfirm = async () => {
            const input = this.element.querySelector('.invite-input');
            const select = this.element.querySelector('.role-select');
            const message = this.element.querySelector('.invite-message');
            
            try {
                await this.collaborationManager.inviteCollaborator({
                    identifier: input.value,
                    role: select.value,
                    message: message.value
                });
                
                // Show success notification
                new Notification({
                    type: 'success',
                    message: 'Invitation sent successfully!'
                }).show();
                
            } catch (error) {
                // Show error notification
                new Notification({
                    type: 'error',
                    message: 'Failed to send invitation. Please try again.'
                }).show();
            }
        };
    }
}

class SaveVersionModal extends Modal {
    constructor(collaborationManager) {
        super({
            id: 'save-version-modal',
            title: 'Save Version',
            confirmText: 'Save',
            content: `
                <div class="space-y-4">
                    <div class="form-group">
                        <label class="block text-sm font-medium text-text-secondary mb-2">
                            Version Name
                        </label>
                        <input type="text" 
                               class="version-name w-full bg-surface border border-surface-light rounded-lg px-4 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                               placeholder="Enter version name">
                    </div>
                    <div class="form-group">
                        <label class="block text-sm font-medium text-text-secondary mb-2">
                            Description
                        </label>
                        <textarea class="version-description w-full bg-surface border border-surface-light rounded-lg px-4 py-2 text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                  placeholder="Describe your changes..."
                                  rows="3"></textarea>
                    </div>
                    <div class="changes-summary bg-surface-light rounded-lg p-4 text-sm">
                        <h4 class="font-medium mb-2">Changes Summary</h4>
                        <ul class="space-y-1 text-text-secondary">
                            <!-- Dynamically populated -->
                        </ul>
                    </div>
                </div>
            `
        });
        
        this.collaborationManager = collaborationManager;
        this.setupSaveHandler();
    }
    
    updateChangesSummary(changes) {
        const list = this.element.querySelector('.changes-summary ul');
        list.innerHTML = changes.map(change => `
            <li class="flex items-center gap-2">
                <i class="fas fa-circle text-xs text-primary"></i>
                <span>${this.formatChange(change)}</span>
            </li>
        `).join('');
    }
    
    formatChange(change) {
        switch (change.type) {
            case 'pattern':
                return 'Updated beat pattern';
            case 'effect':
                return `Modified ${change.effect} effect`;
            case 'tempo':
                return `Changed tempo to ${change.value} BPM`;
            default:
                return 'Unknown change';
        }
    }
    
    setupSaveHandler() {
        this.onConfirm = async () => {
            const nameInput = this.element.querySelector('.version-name');
            const descInput = this.element.querySelector('.version-description');
            
            try {
                await this.collaborationManager.saveVersion({
                    name: nameInput.value,
                    description: descInput.value
                });
                
                // Show success notification
                new Notification({
                    type: 'success',
                    message: 'Version saved successfully!'
                }).show();
                
            } catch (error) {
                // Show error notification
                new Notification({
                    type: 'error',
                    message: 'Failed to save version. Please try again.'
                }).show();
            }
        };
    }
}

class Notification {
    constructor(options = {}) {
        this.type = options.type || 'info';
        this.message = options.message || '';
        this.duration = options.duration || 3000;
        
        this.element = null;
        this.timeout = null;
        
        this.create();
    }
    
    create() {
        const notification = document.createElement('div');
        notification.className = `notification notification-${this.type} glass`;
        
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fas fa-${this.getIcon()} text-lg"></i>
                <span>${this.message}</span>
            </div>
            <button class="close-btn ml-4">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        this.element = notification;
        
        this.element.querySelector('.close-btn').onclick = () => this.hide();
    }
    
    getIcon() {
        switch (this.type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }
    
    show() {
        this.element.classList.add('show');
        
        this.timeout = setTimeout(() => {
            this.hide();
        }, this.duration);
    }
    
    hide() {
        this.element.classList.remove('show');
        clearTimeout(this.timeout);
        
        setTimeout(() => {
            this.destroy();
        }, 300);
    }
    
    destroy() {
        if (this.element) {
            this.element.remove();
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Modal,
        InviteModal,
        SaveVersionModal,
        Notification
    };
} else {
    window.Modal = Modal;
    window.InviteModal = InviteModal;
    window.SaveVersionModal = SaveVersionModal;
    window.Notification = Notification;
} 