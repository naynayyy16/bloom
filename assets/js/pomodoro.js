// Enhanced Pomodoro Timer - Complete Integration dengan PHP & Database
class PomodoroTimer {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentSession = 'work';
    this.timeLeft = 25 * 60;
    this.totalTime = 25 * 60;
    this.sessionCount = 0;
    this.completedSessions = 0;
    this.timer = null;
    this.notificationSound = null;
    this.autoStartBreaks = false;
    this.autoStartPomodoros = false;
    
    // Tambahan untuk integrasi PHP
    this.currentTaskId = null;
    this.currentSubjectId = null;
    this.sessionStartTime = null;
    
    // Flag untuk notification permission
    this.notificationPermissionRequested = false;
    
    this.settings = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      soundEnabled: true,
      desktopNotifications: true
    };
    
    this.init();
  }

  init() {
    console.log('[Pomodoro] Initializing enhanced version...');
    this.loadSettings();
    this.setupEventListeners();
    this.setupTaskSubjectHandlers();
    this.setupEnhancedSettingsHandlers();
    this.updateDisplay();
    this.updateRingState();
    this.setupNotifications();
    this.setupSound();
    this.loadDatabaseStats();
  }

  // === HANDLER BARU UNTUK TASK & SUBJECT INTEGRATION ===
  setupTaskSubjectHandlers() {
    const taskSelect = document.getElementById('sessionTask');
    const subjectSelect = document.getElementById('sessionSubject');

    if (taskSelect) {
      taskSelect.addEventListener('change', (e) => {
        this.currentTaskId = e.target.value || null;
        console.log('[Pomodoro] Task selected:', this.currentTaskId);
        
        // Visual feedback
        if (this.currentTaskId && !this.isRunning) {
          this.showTaskFeedback(taskSelect);
        }
      });
    }

    if (subjectSelect) {
      subjectSelect.addEventListener('change', (e) => {
        this.currentSubjectId = e.target.value || null;
        console.log('[Pomodoro] Subject selected:', this.currentSubjectId);
        
        // Visual feedback
        if (this.currentSubjectId && !this.isRunning) {
          this.showSubjectFeedback(subjectSelect);
        }
      });
    }
  }

  showTaskFeedback(element) {
    element.style.borderColor = '#22c55e';
    element.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
    setTimeout(() => {
      element.style.borderColor = '#ddd';
      element.style.boxShadow = 'none';
    }, 1000);
  }

  showSubjectFeedback(element) {
    element.style.borderColor = '#3b82f6';
    element.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
    setTimeout(() => {
      element.style.borderColor = '#ddd';
      element.style.boxShadow = 'none';
    }, 1000);
  }

  // === DATABASE INTEGRATION ===
  async loadDatabaseStats() {
    try {
      const response = await fetch('api/pomodoro_stats.php');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          this.updateStatsDisplay(data.stats);
        }
      }
    } catch (error) {
      console.log('[Pomodoro] Database stats not available:', error);
    }
  }

  async saveSessionToDatabase() {
    if (this.currentSession !== 'work') return;

    const sessionData = {
      type: this.currentSession,
      duration: this.getSessionDuration(),
      task_id: this.currentTaskId,
      subject_id: this.currentSubjectId,
      completed_at: new Date().toISOString()
    };

    try {
      const response = await fetch('api/save_pomodoro_session.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Pomodoro] Session saved to database');
        
        // Handle XP reward if available
        if (data.xp_result && data.xp_result.success) {
          this.showXPReward(data.xp_result.xp_result);
        }
        
        this.loadDatabaseStats(); // Refresh stats
      }
    } catch (error) {
      console.log('[Pomodoro] Failed to save session:', error);
    }
  }

  updateStatsDisplay(stats) {
    const todayElement = document.querySelector('.stat-item:nth-child(1) .stat-number');
    const weekElement = document.querySelector('.stat-item:nth-child(2) .stat-number');
    const streakElement = document.querySelector('.stat-item:nth-child(3) .stat-number');
    
    if (todayElement && stats.sessions_today !== undefined) {
      todayElement.textContent = stats.sessions_today;
    }
    if (weekElement && stats.sessions_week !== undefined) {
      weekElement.textContent = stats.sessions_week;
    }
    if (streakElement && stats.streak !== undefined) {
      streakElement.textContent = stats.streak;
    }
  }

  // === ENHANCED SETTINGS HANDLERS ===
  setupEnhancedSettingsHandlers() {
    // Auto-start breaks toggle
    const autoStartBreaksToggle = document.getElementById('autoStartBreaks');
    if (autoStartBreaksToggle) {
      autoStartBreaksToggle.addEventListener('change', (e) => {
        this.settings.autoStartBreaks = e.target.checked;
        this.autoStartBreaks = e.target.checked;
        this.saveSettings();
        this.showSettingsSavedFeedback();
      });
    }

    // Auto-start pomodoros toggle
    const autoStartPomodorosToggle = document.getElementById('autoStartPomodoros');
    if (autoStartPomodorosToggle) {
      autoStartPomodorosToggle.addEventListener('change', (e) => {
        this.settings.autoStartPomodoros = e.target.checked;
        this.autoStartPomodoros = e.target.checked;
        this.saveSettings();
        this.showSettingsSavedFeedback();
      });
    }

    // Sound notifications toggle
    const soundToggle = document.getElementById('soundNotifications');
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        this.settings.soundEnabled = e.target.checked;
        this.saveSettings();
        this.showSettingsSavedFeedback();
        
        // Test sound when enabled
        if (e.target.checked && this.notificationSound) {
          this.playTestSound();
        }
      });
    }
  }

  showSettingsSavedFeedback() {
    // Visual feedback untuk settings saved
    const settingsCard = document.querySelector('.settings-card');
    if (settingsCard) {
      settingsCard.style.borderColor = '#22c55e';
      setTimeout(() => {
        settingsCard.style.borderColor = '#eeeeee';
      }, 1000);
    }

    // Show notification if available
    if (window.showNotification) {
              window.showNotification('Pengaturan disimpan!', 'success');
    }
  }

  playTestSound() {
    if (this.notificationSound) {
      this.notificationSound.play().catch(e => console.log('Test sound failed'));
    }
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
    
    // Apply settings to UI
    this.applySettingsToUI();
    
    // Apply settings to timer
    this.autoStartBreaks = this.settings.autoStartBreaks;
    this.autoStartPomodoros = this.settings.autoStartPomodoros;
  }

  applySettingsToUI() {
    // Update duration inputs
    const workDurationInput = document.getElementById('workDuration');
    const shortBreakInput = document.getElementById('shortBreakDuration');
    const longBreakInput = document.getElementById('longBreakDuration');
    const longBreakIntervalInput = document.getElementById('longBreakInterval');

    if (workDurationInput) workDurationInput.value = this.settings.workDuration;
    if (shortBreakInput) shortBreakInput.value = this.settings.shortBreakDuration;
    if (longBreakInput) longBreakInput.value = this.settings.longBreakDuration;
    if (longBreakIntervalInput) longBreakIntervalInput.value = this.settings.longBreakInterval;

    // Update toggles
    const autoStartBreaksToggle = document.getElementById('autoStartBreaks');
    const autoStartPomodorosToggle = document.getElementById('autoStartPomodoros');
    const soundToggle = document.getElementById('soundNotifications');

    if (autoStartBreaksToggle) autoStartBreaksToggle.checked = this.settings.autoStartBreaks;
    if (autoStartPomodorosToggle) autoStartPomodorosToggle.checked = this.settings.autoStartPomodoros;
    if (soundToggle) soundToggle.checked = this.settings.soundEnabled;
  }

  saveSettings() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
  }

  setupEventListeners() {
    // Timer controls
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const resetBtn = document.getElementById('resetTimer');
    const skipBtn = document.getElementById('skipTimer');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        // Request notification permission on first user interaction
        this.requestNotificationPermission();
        this.start();
      });
    }
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pause());
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skip());
    }

    // Session type buttons
    const workBtn = document.getElementById('workSession');
    const shortBreakBtn = document.getElementById('shortBreak');
    const longBreakBtn = document.getElementById('longBreak');

    if (workBtn) {
      workBtn.addEventListener('click', () => this.switchToSession('work'));
    }
    if (shortBreakBtn) {
      shortBreakBtn.addEventListener('click', () => this.switchToSession('shortBreak'));
    }
    if (longBreakBtn) {
      longBreakBtn.addEventListener('click', () => this.switchToSession('longBreak'));
    }

    // Settings
    this.setupSettingsListeners();
    
    // Keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  setupSettingsListeners() {
    const settingsForm = document.getElementById('pomodoroSettings');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSettingsFromForm();
      });
    }

    // Real-time settings updates
    const workDurationInput = document.getElementById('workDuration');
    const shortBreakInput = document.getElementById('shortBreakDuration');
    const longBreakInput = document.getElementById('longBreakDuration');
    const longBreakIntervalInput = document.getElementById('longBreakInterval');

    if (workDurationInput) {
      workDurationInput.addEventListener('change', () => {
        this.settings.workDuration = parseInt(workDurationInput.value);
        this.saveSettings();
        if (this.currentSession === 'work' && !this.isRunning) {
          this.timeLeft = this.settings.workDuration * 60;
          this.totalTime = this.timeLeft;
          this.updateDisplay();
          this.updateRingState();
        }
        this.showSettingsSavedFeedback();
      });
    }

    if (shortBreakInput) {
      shortBreakInput.addEventListener('change', () => {
        this.settings.shortBreakDuration = parseInt(shortBreakInput.value);
        this.saveSettings();
        if (this.currentSession === 'shortBreak' && !this.isRunning) {
          this.timeLeft = this.settings.shortBreakDuration * 60;
          this.totalTime = this.timeLeft;
          this.updateDisplay();
          this.updateRingState();
        }
        this.showSettingsSavedFeedback();
      });
    }

    if (longBreakInput) {
      longBreakInput.addEventListener('change', () => {
        this.settings.longBreakDuration = parseInt(longBreakInput.value);
        this.saveSettings();
        if (this.currentSession === 'longBreak' && !this.isRunning) {
          this.timeLeft = this.settings.longBreakDuration * 60;
          this.totalTime = this.timeLeft;
          this.updateDisplay();
          this.updateRingState();
        }
        this.showSettingsSavedFeedback();
      });
    }

    if (longBreakIntervalInput) {
      longBreakIntervalInput.addEventListener('change', () => {
        this.settings.longBreakInterval = parseInt(longBreakIntervalInput.value);
        this.saveSettings();
        this.showSettingsSavedFeedback();
      });
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when pomodoro page is active
      if (!document.querySelector('.pomodoro-container')) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (this.isRunning) {
            this.pause();
          } else {
            this.start();
          }
          break;
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.reset();
          }
          break;
        case 's':
        case 'S':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.skip();
          }
          break;
        case '1':
          this.switchToSession('work');
          break;
        case '2':
          this.switchToSession('shortBreak');
          break;
        case '3':
          this.switchToSession('longBreak');
          break;
      }
    });
  }

  setupNotifications() {
    // Don't request permission automatically - wait for user interaction
    console.log('[Pomodoro] Notifications available:', 'Notification' in window);
    if ('Notification' in window) {
      console.log('[Pomodoro] Current notification permission:', Notification.permission);
    }
  }

  requestNotificationPermission() {
    // Only request permission once and if not already granted and not denied
    if (!this.notificationPermissionRequested && 'Notification' in window && Notification.permission === 'default') {
      this.notificationPermissionRequested = true;
      Notification.requestPermission().then(permission => {
        console.log('[Pomodoro] Notification permission:', permission);
        if (permission === 'granted') {
          console.log('[Pomodoro] Notifications enabled!');
        }
      }).catch(error => {
        console.log('[Pomodoro] Notification permission request failed:', error);
      });
    }
  }

  setupSound() {
    // Create audio context for notification sound
    try {
      this.notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  // === ENHANCED START METHOD WITH VISUAL FEEDBACK ===
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.sessionStartTime = new Date();
    
    // Visual feedback
    this.addTimerCardClass('starting');
    
    this.updateDisplay();
    this.updateButtonStates();
    this.updateRingState();
    this.startTimer();
    
    // Update session count for work sessions
    if (this.currentSession === 'work') {
      this.sessionCount++;
    }
  }

  // === ENHANCED PAUSE METHOD WITH VISUAL FEEDBACK ===
  pause() {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.isPaused = true;
    
    // Visual feedback
    this.addTimerCardClass('pausing');
    
    this.updateButtonStates();
    this.updateRingState();
    this.stopTimer();
  }

  // === ENHANCED RESET METHOD WITH VISUAL FEEDBACK ===
  reset() {
    this.isRunning = false;
    this.isPaused = false;
    this.stopTimer();
    
    // Visual feedback
    this.addTimerCardClass('resetting');
    
    // Reset to current session's default time
    this.timeLeft = this.getSessionDuration() * 60;
    this.totalTime = this.timeLeft;
    
    this.updateDisplay();
    this.updateButtonStates();
    this.updateRingState();
    this.updateProgress();
  }

  skip() {
    this.stopTimer();
    this.completeSession();
  }

  // === VISUAL FEEDBACK HELPER ===
  addTimerCardClass(className) {
    const timerCard = document.querySelector('.timer-card');
    if (timerCard) {
      timerCard.classList.add(className);
      setTimeout(() => {
        timerCard.classList.remove(className);
      }, 500);
    }
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      
      // Pulse effect on last 5 seconds
      if (this.timeLeft <= 5 && this.timeLeft > 0) {
        const timeDisplay = document.getElementById('timeDisplay');
        if (timeDisplay) {
          timeDisplay.classList.add('pulse');
          setTimeout(() => timeDisplay.classList.remove('pulse'), 600);
        }
      }
      
      if (this.timeLeft <= 0) {
        this.completeSession();
      } else {
        this.updateDisplay();
        this.updateProgress();
        this.updateTitle();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async completeSession() {
    this.stopTimer();
    this.isRunning = false;
    this.isPaused = false;
    
    // Mark as completed for visual feedback
    const progressFrame = document.querySelector('.timer-progress-frame');
    if (progressFrame) {
      progressFrame.classList.add('completed');
      setTimeout(() => progressFrame.classList.remove('completed'), 1000);
    }
    
    // Play notification sound
    if (this.settings.soundEnabled && this.notificationSound) {
      this.notificationSound.play().catch(e => console.log('Audio play failed'));
    }
    
    // Show desktop notification
    if (this.settings.desktopNotifications && Notification.permission === 'granted') {
      this.showNotification();
    }
    
    // Update completed sessions count and save to database
    if (this.currentSession === 'work') {
      this.completedSessions++;
      this.updateStats();
      await this.saveSessionToDatabase();
    }
    
    // Confetti animation
    this.showConfetti();
    
    // Auto-start next session if enabled
    if (this.shouldAutoStartNext()) {
      this.autoStartNextSession();
    } else {
      this.showSessionCompleteModal();
    }
    
    this.updateRingState();
  }

  shouldAutoStartNext() {
    if (this.currentSession === 'work') {
      return this.autoStartBreaks;
    } else {
      return this.autoStartPomodoros;
    }
  }

  autoStartNextSession() {
    setTimeout(() => {
      this.switchToNextSession();
      this.start();
    }, 1000);
  }

  switchToNextSession() {
    if (this.currentSession === 'work') {
      // Check if it's time for a long break
      if (this.completedSessions % this.settings.longBreakInterval === 0) {
        this.switchToSession('longBreak');
      } else {
        this.switchToSession('shortBreak');
      }
    } else {
      this.switchToSession('work');
    }
  }

  switchToSession(sessionType) {
    if (this.isRunning) {
      this.stopTimer();
    }
    
    this.currentSession = sessionType;
    this.timeLeft = this.getSessionDuration() * 60;
    this.totalTime = this.timeLeft;
    this.isRunning = false;
    this.isPaused = false;
    
    this.updateDisplay();
    this.updateButtonStates();
    this.updateSessionButtons();
    this.updateRingState();
    this.updateProgress();
    this.updateTitle();
    
    // Fade-in animation
    const timerCard = document.querySelector('.timer-card');
    if (timerCard) {
      timerCard.classList.remove('fade-in');
      void timerCard.offsetWidth; // trigger reflow
      timerCard.classList.add('fade-in');
      setTimeout(() => timerCard.classList.remove('fade-in'), 700);
    }
  }

  getSessionDuration() {
    switch (this.currentSession) {
      case 'work':
        return this.settings.workDuration;
      case 'shortBreak':
        return this.settings.shortBreakDuration;
      case 'longBreak':
        return this.settings.longBreakDuration;
      default:
        return this.settings.workDuration;
    }
  }

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    
    const timeDisplay = document.getElementById('timeDisplay');
    if (timeDisplay) {
      timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Update timer time state classes
      timeDisplay.className = 'timer-time';
      if (this.isRunning) {
        timeDisplay.classList.add('running');
      } else if (this.isPaused) {
        timeDisplay.classList.add('paused');
      } else if (this.currentSession !== 'work') {
        timeDisplay.classList.add('break');
      }
    }
    
    // Update session info
    const sessionInfo = document.getElementById('sessionInfo');
    if (sessionInfo) {
      const sessionNames = {
        work: 'Sesi Kerja',
        shortBreak: 'Istirahat Pendek',
        longBreak: 'Istirahat Panjang'
      };
      sessionInfo.textContent = sessionNames[this.currentSession];
      
      // Update label state classes
      sessionInfo.className = 'timer-label';
      sessionInfo.classList.add(this.currentSession.replace('Break', '-break').toLowerCase());
    }
  }

  // === ENHANCED RING STATE MANAGEMENT ===
  updateRingState() {
    const ring = document.getElementById('timerProgressRing');
    const circle = document.getElementById('timerProgressCircle');
    
    if (!ring || !circle) return;
    
    // Update ring classes - use classList for SVG elements
    ring.classList.remove('running', 'paused');
    if (this.isRunning) {
      ring.classList.add('running');
    } else if (this.isPaused) {
      ring.classList.add('paused');
    }
    
    // Update circle classes - use classList for SVG elements
    circle.classList.remove('timer-progress', 'work', 'short-break', 'long-break', 'active');
    circle.classList.add('timer-progress');
    circle.classList.add(this.currentSession.replace('Break', '-break').toLowerCase());
    
    if (this.isRunning) {
      circle.classList.add('active');
    }
  }

  updateProgress() {
    // Progress bar (linear, legacy)
    const progress = document.getElementById('timerProgress');
    if (progress) {
      const percentage = ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
      progress.style.width = `${percentage}%`;
    }
    
    // SVG Circular Progress Ring - Enhanced
    const circle = document.getElementById('timerProgressCircle');
    if (circle) {
      const radius = 110; // Radius dari SVG circle
      const circumference = 2 * Math.PI * radius; // 691.15
      const percent = (this.totalTime - this.timeLeft) / this.totalTime;
      const offset = circumference * (1 - percent);
      
      // Set stroke-dasharray if not set
      if (!circle.style.strokeDasharray || circle.style.strokeDasharray === '') {
        circle.style.strokeDasharray = `${circumference}`;
      }
      
      // Animate the progress
      circle.style.strokeDashoffset = `${offset}`;
      
      // Add transition for smooth animation
      if (!circle.style.transition.includes('stroke-dashoffset')) {
        circle.style.transition = 'stroke-dashoffset 0.5s ease-in-out, stroke 0.3s ease, stroke-width 0.3s ease';
      }
    }
  }

  updateButtonStates() {
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const resetBtn = document.getElementById('resetTimer');

    if (startBtn) {
      startBtn.disabled = this.isRunning;
      if (this.isRunning) {
        startBtn.classList.add('disabled');
      } else {
        startBtn.classList.remove('disabled');
      }
    }
    
    if (pauseBtn) {
      pauseBtn.disabled = !this.isRunning;
      if (!this.isRunning) {
        pauseBtn.classList.add('disabled');
      } else {
        pauseBtn.classList.remove('disabled');
      }
    }
    
    if (resetBtn) {
      resetBtn.disabled = !(this.isRunning || this.isPaused);
      if (!(this.isRunning || this.isPaused)) {
        resetBtn.classList.add('disabled');
      } else {
        resetBtn.classList.remove('disabled');
      }
    }
  }

  updateSessionButtons() {
    const workBtn = document.getElementById('workSession');
    const shortBreakBtn = document.getElementById('shortBreak');
    const longBreakBtn = document.getElementById('longBreak');

    // Remove active class from all buttons
    [workBtn, shortBreakBtn, longBreakBtn].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    // Add active class to current session button
    switch (this.currentSession) {
      case 'work':
        if (workBtn) workBtn.classList.add('active');
        break;
      case 'shortBreak':
        if (shortBreakBtn) shortBreakBtn.classList.add('active');
        break;
      case 'longBreak':
        if (longBreakBtn) longBreakBtn.classList.add('active');
        break;
    }
  }

  updateTitle() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const sessionNames = {
      work: 'Kerja',
      shortBreak: 'Istirahat Pendek',
      longBreak: 'Istirahat Panjang'
    };
    
    document.title = `${timeString} - ${sessionNames[this.currentSession]} | Bloom Productivity`;
  }

  updateStats() {
    const statsElement = document.getElementById('completedSessions');
    if (statsElement) {
      statsElement.textContent = this.completedSessions;
    }
  }

  showXPReward(xpResult) {
    // Create XP reward notification
    const rewardDiv = document.createElement('div');
    rewardDiv.className = 'xp-reward-notification';
    rewardDiv.innerHTML = `
      <div class="xp-reward-content">
        <div class="xp-reward-icon">⏰</div>
        <div class="xp-reward-text">
          <div class="xp-reward-title">+${xpResult.xp_added} XP!</div>
          <div class="xp-reward-subtitle">Pomodoro Session Complete</div>
          <div class="xp-reward-subtitle">Total: ${xpResult.new_total_xp} XP</div>
          ${xpResult.leveled_up ? '<div class="xp-level-up">🎉 Level Up! Level ' + xpResult.new_level + '</div>' : ''}
        </div>
      </div>
    `;
    
    // Add styles
    rewardDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10000;
      transform: translateX(400px);
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    `;
    
    document.body.appendChild(rewardDiv);
    
    // Animate in
    setTimeout(() => {
      rewardDiv.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
      rewardDiv.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (rewardDiv.parentNode) {
          rewardDiv.remove();
        }
      }, 500);
    }, 4000);
    
    // Update XP display in sidebar if exists
    this.updateXPDisplay(xpResult.new_total_xp, xpResult.new_level);
    
    // Dispatch event to dashboard for real-time updates
    window.dispatchEvent(new CustomEvent('xp-earned', {
      detail: xpResult
    }));
  }

  updateXPDisplay(totalXP, level) {
    // Update sidebar XP display
    const xpText = document.querySelector('.xp-text');
    if (xpText) {
      xpText.textContent = `${totalXP} XP`;
    }
    
    const userLevel = document.querySelector('.user-level');
    if (userLevel) {
      userLevel.textContent = `Level ${level}`;
    }
    
    // Update XP progress bar
    const xpProgress = document.querySelector('.xp-progress');
    if (xpProgress) {
      const progressPercent = (totalXP % 100);
      xpProgress.style.width = `${progressPercent}%`;
    }
  }

  showNotification() {
    const sessionNames = {
      work: 'Sesi Kerja',
      shortBreak: 'Istirahat Pendek',
      longBreak: 'Istirahat Panjang'
    };
    
    const notification = new Notification('Timer Pomodoro', {
      body: `${sessionNames[this.currentSession]} selesai!`,
      icon: '/assets/images/logo.png',
      badge: '/assets/images/logo.png'
    });
    
    // Auto-close notification after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  showSessionCompleteModal() {
    const modal = document.getElementById('sessionCompleteModal');
    if (modal) {
      const sessionNames = {
        work: 'Sesi Kerja',
        shortBreak: 'Istirahat Pendek',
        longBreak: 'Istirahat Panjang'
      };
      
      const modalTitle = modal.querySelector('.modal-title');
      const modalBody = modal.querySelector('.modal-body');
      
      if (modalTitle) {
        modalTitle.textContent = `${sessionNames[this.currentSession]} Selesai!`;
      }
      
      if (modalBody) {
        if (this.currentSession === 'work') {
          modalBody.innerHTML = `
            <p>Kerja bagus! Anda telah menyelesaikan sesi kerja.</p>
            <p>Sesi yang selesai hari ini: <strong>${this.completedSessions}</strong></p>
            <p>Ambil istirahat dan kembali dengan segar!</p>
          `;
        } else {
          modalBody.innerHTML = `
            <p>Waktu istirahat selesai!</p>
            <p>Siap untuk kembali bekerja?</p>
          `;
        }
      }
      
      // Show modal
      modal.classList.add('show');
      modal.style.display = 'flex';
    }
  }

  showConfetti() {
    let confetti = document.getElementById('confetti-container');
    if (!confetti) {
      confetti = document.createElement('div');
      confetti.id = 'confetti-container';
      document.body.appendChild(confetti);
    }
    confetti.innerHTML = '';
    for (let i = 0; i < 80; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.background = `hsl(${Math.random()*360},80%,60%)`;
      el.style.animationDelay = (Math.random() * 0.5) + 's';
      el.style.width = (6 + Math.random()*6) + 'px';
      el.style.height = (12 + Math.random()*12) + 'px';
      confetti.appendChild(el);
    }
    confetti.style.display = 'block';
    setTimeout(() => { confetti.style.display = 'none'; confetti.innerHTML = ''; }, 2000);
  }

  saveSettingsFromForm() {
    const form = document.getElementById('pomodoroSettings');
    if (!form) return;

    const formData = new FormData(form);
    
    this.settings.workDuration = parseInt(formData.get('workDuration')) || 25;
    this.settings.shortBreakDuration = parseInt(formData.get('shortBreakDuration')) || 5;
    this.settings.longBreakDuration = parseInt(formData.get('longBreakDuration')) || 15;
    this.settings.longBreakInterval = parseInt(formData.get('longBreakInterval')) || 4;
    this.settings.autoStartBreaks = formData.get('autoStartBreaks') === 'on';
    this.settings.autoStartPomodoros = formData.get('autoStartPomodoros') === 'on';
    this.settings.soundEnabled = formData.get('soundEnabled') === 'on';
    this.settings.desktopNotifications = formData.get('desktopNotifications') === 'on';
    
    this.autoStartBreaks = this.settings.autoStartBreaks;
    this.autoStartPomodoros = this.settings.autoStartPomodoros;
    
    this.saveSettings();
    
    // Update current session if not running
    if (!this.isRunning) {
      this.timeLeft = this.getSessionDuration() * 60;
      this.totalTime = this.timeLeft;
      this.updateDisplay();
      this.updateRingState();
    }
    
    this.showSettingsSavedFeedback();
  }

  // === PUBLIC METHODS FOR EXTERNAL ACCESS ===
  getCurrentSession() {
    return this.currentSession;
  }

  getTimeLeft() {
    return this.timeLeft;
  }

  getCompletedSessions() {
    return this.completedSessions;
  }

  getSettings() {
    return { ...this.settings };
  }

  // === UTILITY METHODS ===
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getCurrentTask() {
    const taskSelect = document.getElementById('sessionTask');
    if (taskSelect && this.currentTaskId) {
      const option = taskSelect.querySelector(`option[value="${this.currentTaskId}"]`);
      return option ? option.textContent : null;
    }
    return null;
  }

  getCurrentSubject() {
    const subjectSelect = document.getElementById('sessionSubject');
    if (subjectSelect && this.currentSubjectId) {
      const option = subjectSelect.querySelector(`option[value="${this.currentSubjectId}"]`);
      return option ? option.textContent : null;
    }
    return null;
  }
}

// Initialize Pomodoro Timer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize on pomodoro page
  if (document.querySelector('.pomodoro-container')) {
    window.pomodoroTimer = new PomodoroTimer();
  }
});

// Export for global access
window.PomodoroTimer = PomodoroTimer;