// js/notifications.js
class NotificationManager {
    constructor() {
        this.permission = Notification.permission;
        this.apiUrl = '/api/notifications.php';
        this.init();
    }
    
    init() {
        // Check if browser supports notifications
        if (!('Notification' in window)) {
            console.warn('Browser does not support notifications');
            return;
        }
        
        // Update UI based on current permission
        this.updatePermissionUI();
    }
    
    async requestPermission() {
        if (!('Notification' in window)) {
            throw new Error('Browser does not support notifications');
        }
        
        if (this.permission === 'granted') {
            return 'granted';
        }
        
        if (this.permission === 'denied') {
            throw new Error('Notifications are blocked. Please enable them in browser settings.');
        }
        
        // Request permission
        const permission = await Notification.requestPermission();
        this.permission = permission;
        
        // Update server about permission status
        try {
            await fetch(this.apiUrl + '?action=request-permission', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    permission: permission
                })
            });
        } catch (error) {
            console.warn('Failed to update permission status:', error);
        }
        
        this.updatePermissionUI();
        return permission;
    }
    
    async sendNotification(title, options = {}) {
        if (this.permission !== 'granted') {
            console.warn('Notifications not permitted');
            return false;
        }
        
        const defaultOptions = {
            icon: '/assets/icons/bloom-icon-192.png',
            badge: '/assets/icons/bloom-badge-72.png',
            requireInteraction: false,
            silent: false
        };
        
        const notificationOptions = { ...defaultOptions, ...options };
        
        try {
            const notification = new Notification(title, notificationOptions);
            
            // Auto close after 5 seconds if not requiring interaction
            if (!notificationOptions.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, 5000);
            }
            
            // Handle click events
            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                notification.close();
                
                // Handle custom click actions
                if (options.onClick) {
                    options.onClick(event);
                }
            };
            
            return notification;
        } catch (error) {
            console.error('Failed to send notification:', error);
            return false;
        }
    }
    
    async sendTestNotification() {
        try {
            const response = await fetch(this.apiUrl + '?action=send-test', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                const notif = data.notification;
                return await this.sendNotification(notif.title, {
                    body: notif.body,
                    icon: notif.icon,
                    tag: notif.tag
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Failed to send test notification:', error);
            return false;
        }
    }
    
    // Task reminder notifications
    async sendTaskReminder(task) {
        const options = {
            body: `Task "${task.title}" is due ${task.due_date}`,
            icon: '/assets/icons/task-icon.png',
            tag: `task-${task.id}`,
            requireInteraction: true,
            actions: [
                {
                    action: 'complete',
                    title: 'Mark Complete'
                },
                {
                    action: 'snooze',
                    title: 'Snooze 1h'
                }
            ]
        };
        
        return await this.sendNotification('Task Reminder', options);
    }
    
    // Pomodoro notifications
    async sendPomodoroNotification(type, session) {
        let title, body, icon;
        
        switch (type) {
            case 'focus-complete':
                title = 'Focus Session Complete!';
                body = `Great job! You completed a ${session.duration} minute focus session.`;
                icon = '/assets/icons/pomodoro-complete.png';
                break;
            case 'break-start':
                title = 'Break Time!';
                body = `Time for a ${session.break_duration} minute break.`;
                icon = '/assets/icons/break-icon.png';
                break;
            case 'break-complete':
                title = 'Break Complete!';
                body = 'Ready to start your next focus session?';
                icon = '/assets/icons/focus-icon.png';
                break;
            default:
                title = 'Pomodoro Timer';
                body = 'Timer notification';
                icon = '/assets/icons/bloom-icon-192.png';
        }
        
        const options = {
            body: body,
            icon: icon,
            tag: `pomodoro-${type}`,
            requireInteraction: type === 'focus-complete'
        };
        
        return await this.sendNotification(title, options);
    }
    
    updatePermissionUI() {
        const browserNotificationsToggle = document.getElementById('browserNotifications');
        const testNotificationBtn = document.getElementById('testNotificationBtn');
        
        if (!browserNotificationsToggle) return;
        
        switch (this.permission) {
            case 'granted':
                browserNotificationsToggle.checked = true;
                browserNotificationsToggle.disabled = false;
                if (testNotificationBtn) {
                    testNotificationBtn.style.display = 'inline-flex';
                }
                break;
            case 'denied':
                browserNotificationsToggle.checked = false;
                browserNotificationsToggle.disabled = true;
                if (testNotificationBtn) {
                    testNotificationBtn.style.display = 'none';
                }
                break;
            case 'default':
                browserNotificationsToggle.checked = false;
                browserNotificationsToggle.disabled = false;
                if (testNotificationBtn) {
                    testNotificationBtn.style.display = 'none';
                }
                break;
        }
    }
    
    // Check if notifications are enabled in settings
    async isNotificationEnabled(type) {
        try {
            const response = await fetch('/api/settings.php');
            const data = await response.json();
            
            if (data.success) {
                switch (type) {
                    case 'task_reminders':
                        return data.settings.task_reminders === 'true';
                    case 'pomodoro':
                        return data.settings.pomodoro_notifications === 'true';
                    case 'browser':
                        return data.settings.browser_notifications === 'true' && this.permission === 'granted';
                    default:
                        return false;
                }
            }
            return false;
        } catch (error) {
            console.error('Failed to check notification settings:', error);
            return false;
        }
    }
}

// Global notification manager instance
window.notificationManager = new NotificationManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}