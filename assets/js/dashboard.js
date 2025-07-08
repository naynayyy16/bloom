// Enhanced Dashboard - Interactive Experience
class DashboardManager {
    constructor() {
      this.stats = {};
      this.activities = [];
      this.isInitialized = false;
      this.animationQueue = [];
      this.counters = new Map();
      this.currentXP = 0;
      this.currentLevel = 1;
      
      this.init();
    }
  
    init() {
      if (this.isInitialized) return;
      
      document.addEventListener("DOMContentLoaded", () => {
        this.setupDashboard();
        this.setupAnimations();
        this.setupInteractions();
        this.setupRealTimeUpdates();
        this.setupXPUpdates();
        this.isInitialized = true;
      });
    }
  
    setupDashboard() {
      this.loadDashboardData();
      this.setupQuickActions();
      this.setupGreeting();
    }
  
    setupGreeting() {
      const greetingElement = document.querySelector('.dashboard-greeting');
      const dateElement = document.querySelector('.dashboard-date');
      
      if (greetingElement) {
        const hour = new Date().getHours();
        let greeting;
        
        if (hour < 12) {
          greeting = 'Good morning';
        } else if (hour < 17) {
          greeting = 'Good afternoon';
        } else {
          greeting = 'Good evening';
        }
        
        // Get username from session or default
        const username = this.getUsername();
        greetingElement.textContent = `${greeting}, ${username}!`;
        
        // Add typing animation
        this.typeWriterEffect(greetingElement, `${greeting}, ${username}!`, 50);
      }
      
      if (dateElement) {
        const today = new Date();
        const options = { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        };
        dateElement.textContent = today.toLocaleDateString('en-US', options);
      }
    }
  
    typeWriterEffect(element, text, speed) {
      element.textContent = '';
      let i = 0;
      
      const typeWriter = () => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(typeWriter, speed);
        }
      };
      
      typeWriter();
    }
  
    getUsername() {
      // Try to get from various sources
      const userElement = document.querySelector('.username');
      if (userElement) {
        return userElement.textContent.trim();
      }
      
      // Fallback
      return 'User';
    }
  
    setupQuickActions() {
      const quickActions = document.querySelectorAll('.quick-action-card');
      
      quickActions.forEach((action, index) => {
        // Add stagger animation
        action.style.opacity = '0';
        action.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          action.style.transition = 'all 0.4s ease-out';
          action.style.opacity = '1';
          action.style.transform = 'translateY(0)';
        }, index * 100);
        
        // Add hover sound effect (optional)
        action.addEventListener('mouseenter', () => {
          this.playHoverSound();
        });
        
        // Add click analytics
        action.addEventListener('click', (e) => {
          const actionType = action.dataset.action || 'unknown';
          this.trackQuickAction(actionType);
          
          // Visual feedback
          action.style.transform = 'scale(0.95)';
          setTimeout(() => {
            action.style.transform = '';
          }, 150);
        });
      });
    }
  
    setupAnimations() {
      // Intersection Observer for scroll animations
      if ('IntersectionObserver' in window) {
        this.setupScrollAnimations();
      }
      
      // Counter animations
      this.setupCounterAnimations();
      
      // Progress bar animations
      this.setupProgressAnimations();
      
      // Particle effects
      this.setupParticleEffects();
    }
  
    setupScrollAnimations() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateElement(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
  
      // Observe dashboard elements
      document.querySelectorAll('.stat-card, .activity-item, .chart-card').forEach(el => {
        observer.observe(el);
      });
    }
  
    animateElement(element) {
      if (element.classList.contains('stat-card')) {
        this.animateStatCard(element);
      } else if (element.classList.contains('activity-item')) {
        this.animateActivityItem(element);
      } else if (element.classList.contains('chart-card')) {
        this.animateChartCard(element);
      }
    }
  
    animateStatCard(card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px) scale(0.9)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
        
        // Animate the counter
        const counter = card.querySelector('.stat-number');
        if (counter) {
          this.animateCounter(counter);
        }
      }, 100);
    }
  
    animateActivityItem(item) {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-20px)';
      
      setTimeout(() => {
        item.style.transition = 'all 0.4s ease-out';
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      }, 50);
    }
  
    animateChartCard(card) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.5s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
      }, 200);
    }
  
    setupCounterAnimations() {
      const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
      };
  
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const counter = entry.target.querySelector('.stat-number');
            if (counter && !counter.dataset.animated) {
              this.animateCounter(counter);
              counter.dataset.animated = 'true';
            }
          }
        });
      }, observerOptions);
  
      document.querySelectorAll('.stat-card').forEach(card => {
        counterObserver.observe(card);
      });
    }
  
    animateCounter(element) {
      const target = parseInt(element.textContent) || 0;
      const duration = 1500;
      const steps = 60;
      const increment = target / steps;
      const stepDuration = duration / steps;
      
      let current = 0;
      element.textContent = '0';
      
      const counter = setInterval(() => {
        current += increment;
        if (current >= target) {
          element.textContent = target;
          clearInterval(counter);
          
          // Add completion effect
          element.style.transform = 'scale(1.1)';
          setTimeout(() => {
            element.style.transform = 'scale(1)';
          }, 200);
        } else {
          element.textContent = Math.floor(current);
        }
      }, stepDuration);
    }
  
    setupProgressAnimations() {
      const progressBars = document.querySelectorAll('.progress-fill');
      
      progressBars.forEach(bar => {
        const targetWidth = bar.style.width || bar.dataset.width || '0%';
        bar.style.width = '0%';
        
        setTimeout(() => {
          bar.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
          bar.style.width = targetWidth;
        }, 500);
      });
    }
  
    setupParticleEffects() {
      // Subtle particle effect for special occasions
      if (this.isSpecialDay()) {
        this.createParticleEffect();
      }
    }
  
    isSpecialDay() {
      const today = new Date();
      const month = today.getMonth();
      const date = today.getDate();
      
      // Add your special days here (birthdays, holidays, etc.)
      const specialDays = [
        { month: 0, date: 1 },   // New Year
        { month: 11, date: 25 }, // Christmas
      ];
      
      return specialDays.some(day => day.month === month && day.date === date);
    }
  
    createParticleEffect() {
      const container = document.querySelector('.dashboard-header');
      if (!container) return;
      
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          this.createParticle(container);
        }, i * 200);
      }
    }
  
    createParticle(container) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: var(--primary-color);
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.7;
        animation: particle-float 3s ease-out forwards;
      `;
      
      particle.style.left = Math.random() * container.offsetWidth + 'px';
      particle.style.top = container.offsetHeight + 'px';
      
      container.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentNode) {
          particle.remove();
        }
      }, 3000);
    }
  
    setupInteractions() {
      // Quick action interactions
      this.setupQuickActionInteractions();
      
      // Activity item interactions
      this.setupActivityInteractions();
      
      // Stat card interactions
      this.setupStatCardInteractions();
      
      // Keyboard shortcuts
      this.setupKeyboardShortcuts();
    }
  
    setupQuickActionInteractions() {
      document.addEventListener('click', (e) => {
        const quickAction = e.target.closest('.quick-action-card');
        if (quickAction) {
          const actionType = quickAction.dataset.action;
          this.handleQuickAction(actionType, quickAction);
        }
      });
    }
  
    handleQuickAction(actionType, element) {
      // Add visual feedback
      this.addRippleEffect(element, event);
      
      switch (actionType) {
        case 'add-task':
          this.navigateToTasks();
          break;
        case 'add-note':
          this.navigateToNotes();
          break;
        case 'start-pomodoro':
          this.navigateToPomodoro();
          break;
        case 'view-subjects':
          this.navigateToSubjects();
          break;
        default:
          console.log('Unknown action:', actionType);
      }
    }
  
    navigateToTasks() {
      this.smoothPageTransition('?page=tasks');
    }
  
    navigateToNotes() {
      this.smoothPageTransition('?page=notes');
    }
  
    navigateToPomodoro() {
      this.smoothPageTransition('?page=pomodoro');
    }
  
    navigateToSubjects() {
      this.smoothPageTransition('?page=subjects');
    }
  
    smoothPageTransition(url) {
      const dashboard = document.querySelector('.dashboard-container');
      if (dashboard) {
        dashboard.style.opacity = '0';
        dashboard.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
          window.location.href = url;
        }, 300);
      } else {
        window.location.href = url;
      }
    }
  
    setupActivityInteractions() {
      document.addEventListener('click', (e) => {
        const activityItem = e.target.closest('.activity-item');
        if (activityItem) {
          this.handleActivityClick(activityItem);
        }
      });
    }
  
    handleActivityClick(activityItem) {
      const activityType = activityItem.dataset.type;
      const activityId = activityItem.dataset.id;
      
      // Add click animation
      activityItem.style.transform = 'scale(0.98)';
      setTimeout(() => {
        activityItem.style.transform = '';
      }, 150);
      
      // Navigate based on activity type
      switch (activityType) {
        case 'task':
          this.smoothPageTransition(`?page=tasks&highlight=${activityId}`);
          break;
        case 'note':
          this.smoothPageTransition(`?page=notes&highlight=${activityId}`);
          break;
        case 'subject':
          this.smoothPageTransition(`?page=subjects&highlight=${activityId}`);
          break;
      }
    }
  
    setupStatCardInteractions() {
      document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', () => {
          const statType = card.dataset.stat;
          this.handleStatCardClick(statType);
        });
        
        // Add magnetic effect
        card.addEventListener('mousemove', (e) => {
          this.addMagneticEffect(card, e);
        });
        
        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      });
    }
  
    addMagneticEffect(element, event) {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (event.clientX - centerX) * 0.05;
      const deltaY = (event.clientY - centerY) * 0.05;
      
      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
  
    handleStatCardClick(statType) {
      switch (statType) {
        case 'tasks':
          this.smoothPageTransition('?page=tasks');
          break;
        case 'completed':
          this.smoothPageTransition('?page=tasks&filter=completed');
          break;
        case 'subjects':
          this.smoothPageTransition('?page=subjects');
          break;
        case 'pomodoro':
          this.smoothPageTransition('?page=pomodoro');
          break;
      }
    }
  
    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case '1':
              e.preventDefault();
              this.navigateToTasks();
              break;
            case '2':
              e.preventDefault();
              this.navigateToNotes();
              break;
            case '3':
              e.preventDefault();
              this.navigateToSubjects();
              break;
            case '4':
              e.preventDefault();
              this.navigateToPomodoro();
              break;
          }
        }
      });
    }
  
    setupRealTimeUpdates() {
      // Poll for updates every 30 seconds
      setInterval(() => {
        this.updateDashboardData();
      }, 30000);
      
      // Listen for page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.updateDashboardData();
        }
      });
    }
  
    loadDashboardData() {
      this.showLoading();
      
      Promise.all([
        this.loadRecentTasks(),
        this.loadStatistics(),
        this.loadRecentActivity(),
        this.loadProgressData()
      ]).then(() => {
        this.hideLoading();
        this.renderDashboard();
      }).catch(error => {
        this.hideLoading();
        console.error('Error loading dashboard data:', error);
        this.showNotification('Error loading dashboard data', 'error');
      });
    }
  
    async loadRecentTasks() {
      try {
        const response = await fetch('api/tasks.php?action=recent&limit=5');
        const data = await response.json();
        
        if (data.success) {
          this.recentTasks = data.tasks;
        }
      } catch (error) {
        console.error('Error loading recent tasks:', error);
      }
    }
  
    async loadStatistics() {
      try {
        // Use the stats endpoint from tasks API which provides all needed statistics
        const response = await fetch('api/tasks.php?action=stats');
        const data = await response.json();
        
        if (data.success) {
          this.stats = data.stats;
        } else {
          throw new Error('Failed to load statistics');
        }
      } catch (error) {
        console.error('Error loading statistics:', error);
        // Fallback data
        this.stats = {
          total_tasks: 0,
          completed_tasks: 0,
          total_subjects: 0,
          pomodoro_sessions: 0
        };
      }
    }
  
    async loadRecentActivity() {
      try {
        // Get recent tasks
        const tasksResponse = await fetch('api/tasks.php?action=list&limit=5');
        const tasksData = await tasksResponse.json();
        
        // Get recent notes
        const notesResponse = await fetch('api/notes.php?action=list&limit=5');
        const notesData = await notesResponse.json();
        
        // Combine and format activities
        const activities = [];
        
        if (tasksData.success && tasksData.tasks) {
          tasksData.tasks.forEach(task => {
            activities.push({
              id: task.id,
              type: 'task',
              title: task.title,
              description: `Task ${task.completed == 1 ? 'completed' : 'created'}`,
              created_at: task.created_at || task.updated_at
            });
          });
        }
        
        if (notesData.success && notesData.notes) {
          notesData.notes.forEach(note => {
            activities.push({
              id: note.id,
              type: 'note',
              title: note.title,
              description: 'Note created',
              created_at: note.created_at
            });
          });
        }
        
        // Sort by creation date and take the most recent 10
        this.activities = activities
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10);
          
      } catch (error) {
        console.error('Error loading activities:', error);
        this.activities = [];
      }
    }
  
    async loadProgressData() {
      try {
        // Get tasks for progress calculation
        const tasksResponse = await fetch('api/tasks.php?action=list');
        const tasksData = await tasksResponse.json();
        
        // Get pomodoro stats for focus time
        const pomodoroResponse = await fetch('api/pomodoro_stats.php');
        const pomodoroData = await pomodoroResponse.json();
        
        // Calculate progress data
        let weeklyCompletion = 0;
        let dailyProgress = 0;
        let focusTime = 0;
        
        if (tasksData.success && tasksData.tasks) {
          const totalTasks = tasksData.tasks.length;
          const completedTasks = tasksData.tasks.filter(task => task.completed == 1).length;
          
          if (totalTasks > 0) {
            weeklyCompletion = Math.round((completedTasks / totalTasks) * 100);
          }
          
          // Calculate daily progress (tasks completed today)
          const today = new Date().toISOString().split('T')[0];
          const todayTasks = tasksData.tasks.filter(task => 
            task.completed == 1 && 
            task.updated_at && 
            task.updated_at.startsWith(today)
          ).length;
          
          dailyProgress = Math.min(todayTasks * 20, 100); // 20% per task, max 100%
        }
        
        if (pomodoroData.success) {
          focusTime = pomodoroData.stats.total_minutes || 0; // in minutes
        }
        
        this.progressData = {
          weekly_completion: weeklyCompletion,
          daily_progress: dailyProgress,
          focus_time: focusTime
        };
        
      } catch (error) {
        console.error('Error loading progress data:', error);
        this.progressData = {
          weekly_completion: 0,
          daily_progress: 0,
          focus_time: 0
        };
      }
    }
  
    renderDashboard() {
      this.renderStatistics();
      this.renderRecentActivity();
      this.renderProgress();
      this.startAnimations();
    }
  
    renderStatistics() {
      // Update stat cards
      this.updateStatCard('total-tasks', this.stats.total_tasks || 0);
      this.updateStatCard('completed-tasks', this.stats.completed_tasks || 0);
      this.updateStatCard('total-subjects', this.stats.total_subjects || 0);
      this.updateStatCard('pomodoro-sessions', this.stats.pomodoro_sessions || 0);
      
      // Calculate and update completion rate
      if (this.stats.total_tasks > 0) {
        const completionRate = Math.round((this.stats.completed_tasks / this.stats.total_tasks) * 100);
        this.updateStatCard('completion-rate', `${completionRate}%`);
      }
    }
  
    updateStatCard(statId, value) {
      const element = document.querySelector(`[data-stat="${statId}"] .stat-number`);
      if (element) {
        element.textContent = value;
        element.dataset.target = value;
      }
    }
  
    renderRecentActivity() {
      const container = document.getElementById('recentActivityList');
      if (!container) return;
      
      if (this.activities.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <h3>No recent activity</h3>
            <p>Start creating tasks and notes to see your activity here</p>
            <a href="?page=tasks" class="empty-state-action">
              <i class="fas fa-plus"></i>
              Create Task
            </a>
          </div>
        `;
        return;
      }
      
      container.innerHTML = this.activities.map((activity, index) => `
        <div class="activity-item" data-type="${activity.type}" data-id="${activity.id}" 
             style="animation-delay: ${index * 0.1}s">
          <div class="activity-icon">
            <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">${this.escapeHtml(activity.title)}</div>
            <div class="activity-description">${this.escapeHtml(activity.description)}</div>
          </div>
          <div class="activity-time">${this.formatRelativeTime(activity.created_at)}</div>
        </div>
      `).join('');
    }
  
    renderProgress() {
      // Render weekly goals, completion rates, etc.
      const progressContainer = document.querySelector('.progress-overview');
      if (!progressContainer || !this.progressData) return;
      
      const progressItems = [
        {
          label: 'Weekly Tasks',
          value: this.progressData.weekly_completion || 0,
          max: 100
        },
        {
          label: 'Daily Goal',
          value: this.progressData.daily_progress || 0,
          max: 100
        },
        {
          label: 'Focus Time',
          value: this.progressData.focus_time || 0,
          max: 480 // 8 hours in minutes
        }
      ];
      
      progressContainer.innerHTML = progressItems.map(item => {
        const percentage = Math.min((item.value / item.max) * 100, 100);
        return `
          <div class="progress-item">
            <div class="progress-header">
              <span class="progress-label">${item.label}</span>
              <span class="progress-value">${Math.round(percentage)}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percentage}%" data-width="${percentage}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  
    getActivityIcon(type) {
      const icons = {
        task: 'check-circle',
        note: 'sticky-note',
        subject: 'book',
        pomodoro: 'clock'
      };
      return icons[type] || 'circle';
    }
  
    formatRelativeTime(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString();
    }
  
    startAnimations() {
      // Trigger all animations
      document.querySelector('.dashboard-container')?.classList.add('dashboard-fade-in');
      
      // Stagger stat card animations
      document.querySelectorAll('.stat-card').forEach((card, index) => {
        setTimeout(() => {
          this.animateStatCard(card);
        }, index * 200);
      });
    }
  
    updateDashboardData() {
      // Silently update data without full reload
      this.loadStatistics().then(() => {
        this.renderStatistics();
      });
      
      this.loadRecentActivity().then(() => {
        this.renderRecentActivity();
      });
    }
  
    trackQuickAction(actionType) {
      // Analytics tracking
      if (typeof gtag !== 'undefined') {
        gtag('event', 'quick_action', {
          'action_type': actionType,
          'page': 'dashboard'
        });
      }
    }
  
    playHoverSound() {
      // Optional: Play subtle hover sound
      // Only if user has enabled sounds in settings
      if (this.soundEnabled) {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBSuBzvLZiTYIG2m98OScTgwNUarm7LZiHAU5kdXxy3ouBSp+yvDUejEIHG++8+OWT+9E3+DytmIbBiuG0PLbiTcIG2m88OOdTgxOo+DytmIbBSyAy/LZiTcIF2q99+SeTwxPperp7LZiHAY6kdPzy3kvBSp+yvDUeDAIHG++8+OWT+9E3+DytmIbBSyAy/LZiTcIF2q99+SeTwxPperp7LZiGwU6kdPzy3kvBSp+yvDUejEIHWu88+OWT+9E3+DytmIbBSyAy/LZiTcIG2q99+SeTwxPperp7LZiGwU6kdPzy3kvBSp+yvDUejEIHWu88+OWT+9E3+DytmIbBSyAy/LZiTcIG2q99+SeTwxPperp7LZiGwU6kdPzy3kvBSp+yvDUejEIHWu88+OWT+9E3+DytmIbBSyAy/LZiTcIG2q99+SeTwxPperp7LZiGwU6kdPzy3kvBSp+yvDUejEIHWu88+OWQA==');
        audio.volume = 0.1;
        audio.play().catch(() => {
          // Ignore audio play errors
        });
      }
    }
  
    addRippleEffect(element, event) {
      const ripple = document.createElement('span');
      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-effect 0.6s linear;
        pointer-events: none;
      `;
      
      element.appendChild(ripple);
      
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.remove();
        }
      }, 600);
    }
  
    // Utility methods
    escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  
    showLoading() {
      if (window.bloomApp) {
        window.bloomApp.showLoadingState();
      }
    }
  
    hideLoading() {
      if (window.bloomApp) {
        window.bloomApp.hideLoadingState();
      }
    }
  
    showNotification(message, type = 'success') {
      if (window.bloomApp) {
        window.bloomApp.showNotification(message, type);
      }
    }
  
    setupXPUpdates() {
      // Listen for XP updates from other components
      window.addEventListener('xp-earned', (event) => {
        this.updateXPDisplay(event.detail);
      });
      
      // Update XP display on page load
      this.updateXPDisplay({
        new_total_xp: parseInt(document.querySelector('.pet-xp-text')?.textContent.match(/\d+/)?.[0] || 0),
        new_level: parseInt(document.querySelector('.user-level')?.textContent.match(/\d+/)?.[0] || 1)
      });
    }
  
    updateXPDisplay(xpResult) {
      if (!xpResult) return;
      
      this.currentXP = xpResult.new_total_xp || this.currentXP;
      this.currentLevel = xpResult.new_level || this.currentLevel;
      
      // Update pet stage based on XP
      this.updatePetStage();
      
      // Update progress bar
      this.updateProgressBar();
      
      // Update XP text
      this.updateXPText();
      
      // Update sidebar XP display
      this.updateSidebarXP();
      
      // Show level up animation if applicable
      if (xpResult.leveled_up) {
        this.showLevelUpAnimation();
      }
    }
  
    updatePetStage() {
      const petAvatar = document.querySelector('.pet-avatar object');
      if (!petAvatar) return;
      
      let newPetSvg = 'assets/images/sunflower_seed.svg';
      let petStage = 'seed';
      
      if (this.currentXP >= 500) {
        petStage = 'bloom';
        newPetSvg = 'assets/images/sunflower_bloom.svg';
      } else if (this.currentXP >= 100) {
        petStage = 'sprout';
        newPetSvg = 'assets/images/sunflower_sprout.svg';
      }
      
      // Only update if stage changed
      if (petAvatar.getAttribute('data') !== newPetSvg) {
        petAvatar.setAttribute('data', newPetSvg);
        petAvatar.setAttribute('data-stage', petStage);
        
        // Add transition animation
        petAvatar.style.transition = 'transform 0.5s ease-in-out';
        petAvatar.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
          petAvatar.style.transform = 'scale(1)';
        }, 500);
      }
    }
  
    updateProgressBar() {
      const progressFill = document.querySelector('.progress-fill');
      if (!progressFill) return;
      
      // Calculate progress to next stage based on current pet stage
      let currentStageXP = 0;
      let nextStageXP = 100;
      
      if (this.currentXP >= 500) {
        currentStageXP = 500;
        nextStageXP = 1000;
      } else if (this.currentXP >= 100) {
        currentStageXP = 100;
        nextStageXP = 500;
      } else {
        currentStageXP = 0;
        nextStageXP = 100;
      }
      
      const xpInCurrentStage = this.currentXP - currentStageXP;
      const xpNeededForNextStage = nextStageXP - currentStageXP;
      const progressPercentage = Math.min(100, (xpInCurrentStage / xpNeededForNextStage) * 100);
      
      // Animate progress bar
      progressFill.style.transition = 'width 1s ease-in-out';
      progressFill.style.width = `${Math.max(2.5, progressPercentage)}%`;
      
      // Add completion effect if 100%
      if (progressPercentage >= 100) {
        progressFill.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
        progressFill.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.5)';
        
        setTimeout(() => {
          progressFill.style.background = 'linear-gradient(90deg, var(--primary-color) 60%, var(--accent-color) 100%)';
          progressFill.style.boxShadow = 'none';
        }, 2000);
      }
    }
  
    updateXPText() {
      const xpText = document.querySelector('.pet-xp-text');
      if (!xpText) return;
      
      // Calculate progress to next stage based on current pet stage
      let currentStageXP = 0;
      let nextStageXP = 100;
      
      if (this.currentXP >= 500) {
        currentStageXP = 500;
        nextStageXP = 1000;
      } else if (this.currentXP >= 100) {
        currentStageXP = 100;
        nextStageXP = 500;
      } else {
        currentStageXP = 0;
        nextStageXP = 100;
      }
      
      const xpInCurrentStage = this.currentXP - currentStageXP;
      
      // Animate number change
      const currentText = xpText.textContent;
      const newText = `${xpInCurrentStage} / ${nextStageXP - currentStageXP} XP ke tahap berikutnya`;
      
      if (currentText !== newText) {
        xpText.style.transition = 'opacity 0.3s ease-in-out';
        xpText.style.opacity = '0.5';
        
        setTimeout(() => {
          xpText.textContent = newText;
          xpText.style.opacity = '1';
        }, 300);
      }
    }
  
    updateSidebarXP() {
      // Update sidebar XP display
      const sidebarXPText = document.querySelector('.xp-text');
      if (sidebarXPText) {
        sidebarXPText.textContent = `${this.currentXP} XP`;
      }
      
      const sidebarLevel = document.querySelector('.user-level');
      if (sidebarLevel) {
        sidebarLevel.textContent = `Level ${this.currentLevel}`;
      }
      
      // Update XP progress bar in sidebar
      const sidebarProgress = document.querySelector('.xp-progress');
      if (sidebarProgress) {
        const progressPercent = (this.currentXP % 100);
        sidebarProgress.style.transition = 'width 0.5s ease-in-out';
        sidebarProgress.style.width = `${progressPercent}%`;
      }
    }
  
    showLevelUpAnimation() {
      // Create level up notification
      const levelUpDiv = document.createElement('div');
      levelUpDiv.className = 'level-up-notification';
      levelUpDiv.innerHTML = `
        <div class="level-up-content">
          <div class="level-up-icon">🎉</div>
          <div class="level-up-text">
            <div class="level-up-title">Level Up!</div>
            <div class="level-up-subtitle">Sekarang Level ${this.currentLevel}</div>
          </div>
        </div>
      `;
      
      // Add styles
      levelUpDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.8);
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        color: #1f2937;
        padding: 24px 32px;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 10001;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255,255,255,0.3);
        font-weight: bold;
      `;
      
      document.body.appendChild(levelUpDiv);
      
      // Animate in
      setTimeout(() => {
        levelUpDiv.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 100);
      
      // Animate out and remove
      setTimeout(() => {
        levelUpDiv.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => {
          if (levelUpDiv.parentNode) {
            levelUpDiv.remove();
          }
        }, 500);
      }, 3000);
      
      // Add confetti effect
      this.createConfetti();
    }
  
    createConfetti() {
      const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
      const confettiCount = 50;
      
      for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
          const confetti = document.createElement('div');
          confetti.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: -10px;
            left: ${Math.random() * 100}%;
            z-index: 10000;
            pointer-events: none;
            animation: confettiFall 3s linear forwards;
          `;
          
          document.body.appendChild(confetti);
          
          setTimeout(() => {
            if (confetti.parentNode) {
              confetti.remove();
            }
          }, 3000);
        }, i * 50);
      }
    }
  
  }
  
  // Add particle animation CSS
  const particleStyles = `
  <style>
  @keyframes particle-float {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 0.7;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: translateY(-200px) rotate(360deg);
      opacity: 0;
    }
  }
  
  /* Counter animation */
  .stat-number {
    transition: transform 0.2s ease-out;
  }
  
  /* Magnetic effect enhancement */
  .stat-card {
    transition: transform 0.1s ease-out;
  }
  
  /* Activity item hover enhancement */
  .activity-item:hover .activity-icon {
    transform: scale(1.1);
    background: var(--primary-color);
    color: var(--text-inverse);
  }
  
  /* Progress bar shine effect */
  .progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transform: translateX(-100%);
    animation: progress-shine 2s ease-in-out infinite;
  }
  
  @keyframes progress-shine {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  </style>
  `;
  
  // Inject styles
  document.head.insertAdjacentHTML('beforeend', particleStyles);
  
  // Initialize Dashboard Manager
  const dashboardManager = new DashboardManager();
  
  // Export for global access
  window.dashboardManager = dashboardManager;