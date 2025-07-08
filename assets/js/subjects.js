// Global functions for onclick handlers
function showSubjectModal(subjectId = null) {
  if (window.subjectsManager) {
    window.subjectsManager.showSubjectModal(subjectId);
  } else {
    console.error('[GLOBAL] subjectsManager not found');
  }
}

function hideModal(modalId) {
  if (window.subjectsManager) {
    window.subjectsManager.hideModal(modalId);
  } else {
    console.error('[GLOBAL] subjectsManager not found');
  }
}

function editSubject(subjectId) {
  if (window.subjectsManager) {
    window.subjectsManager.editSubject(subjectId);
  } else {
    console.error('[GLOBAL] subjectsManager not found');
  }
}

function deleteSubject(subjectId) {
  if (window.subjectsManager) {
    window.subjectsManager.deleteSubject(subjectId);
  } else {
    console.error('[GLOBAL] subjectsManager not found');
  }
}

function showSubjectPreview(subjectId) {
  if (window.subjectsManager) {
    window.subjectsManager.showSubjectPreview(subjectId);
  } else {
    console.error('[GLOBAL] subjectsManager not found');
  }
}

// Enhanced Subjects Manager - Rich Interactions and Animations
class SubjectsManager {
  constructor() {
    this.currentSubjects = [];
    this.searchTimeout = null;
    this.isInitialized = false;
    this.selectedColor = '#667eea';
    this.colorPresets = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c',
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
      '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
      '#d299c2', '#fef9d7', '#ebc0fd', '#d9ded8'
    ];
    window.subjectsManager = this; // Set global instance
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    document.addEventListener("DOMContentLoaded", () => {
      this.setupSubjects();
      this.setupSearch();
      this.setupColorPicker();
      this.setupAnimations();
      this.setupKeyboardShortcuts();
      this.setupFilters();
      this.setupFormHandler();
      this.isInitialized = true;
    });
  }

  setupFormHandler() {
    const form = document.getElementById('subjectForm');
    if (form && !form._handlerAttached) {
      form.addEventListener('submit', (e) => {
        console.log('[SubjectsManager] subjectForm submit handler active');
        e.preventDefault();
        this.handleSubjectSubmit(e);
      });
      form._handlerAttached = true;
    }
  }

  setupSubjects() {
    this.loadSubjects();
    this.setupSubjectEvents();
    this.setupSubjectInteractions();
  }

  setupSubjectEvents() {
    // Add subject button
    const addSubjectBtn = document.getElementById("addSubjectBtn");
    if (addSubjectBtn) {
      addSubjectBtn.addEventListener("click", () => {
        console.log('Add subject button clicked');
        this.showSubjectModal();
      });
    }

    // Subject actions
    this.setupSubjectActionHandlers();
  }

  setupSubjectActionHandlers() {
    document.addEventListener('click', (e) => {
      if (!(e.target instanceof Element)) return;
      console.log('[SubjectsManager] Click event', e.target);

      // Add Subject
      if (e.target.id === 'addSubjectBtn' || (e.target.closest && e.target.closest('#addSubjectBtn'))) {
        e.preventDefault();
        this.showSubjectModal();
        return;
      }

      // Empty state add
      if (e.target.id === 'emptyStateAddBtn' || (e.target.closest && e.target.closest('#emptyStateAddBtn'))) {
        e.preventDefault();
        this.showSubjectModal();
        return;
      }

      // Edit - FIXED: Prevent event bubbling
      if (e.target.classList.contains('edit-subject-btn') || (e.target.closest && e.target.closest('.edit-subject-btn'))) {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to card click
        const btn = e.target.classList.contains('edit-subject-btn') ? e.target : e.target.closest('.edit-subject-btn');
        const subjectId = btn ? btn.dataset.subjectId : null;
        if (subjectId) this.editSubject(subjectId);
        return;
      }

      // Delete - FIXED: Prevent event bubbling
      if (e.target.classList.contains('delete-subject-btn') || (e.target.closest && e.target.closest('.delete-subject-btn'))) {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to card click
        const btn = e.target.classList.contains('delete-subject-btn') ? e.target : e.target.closest('.delete-subject-btn');
        const subjectId = btn ? btn.dataset.subjectId : null;
        if (subjectId) this.deleteSubject(subjectId);
        return;
      }

      // Card click (preview) - FIXED: Only trigger if not clicking action buttons
      const card = e.target.closest('.subject-card');
      if (card && 
          !(e.target.closest('.subject-actions')) && // Don't trigger if clicking in actions area
          !(e.target.classList.contains('edit-subject-btn') || (e.target.closest && e.target.closest('.edit-subject-btn'))) &&
          !(e.target.classList.contains('delete-subject-btn') || (e.target.closest && e.target.closest('.delete-subject-btn')))) {
        e.preventDefault();
        const subjectId = card.dataset.subjectId;
        if (subjectId) this.handleSubjectCardClick(card);
        return;
      }

      // Modal close
      if (e.target.hasAttribute('data-modal') || (e.target.closest && e.target.closest('[data-modal]'))) {
        e.preventDefault();
        const modalId = e.target.getAttribute('data-modal') || (e.target.closest && e.target.closest('[data-modal]') && e.target.closest('[data-modal]').getAttribute('data-modal'));
        this.hideModal(modalId);
        return;
      }
    });
  }

  setupSubjectInteractions() {
    // Subject card hover effects
    document.addEventListener('mouseenter', (e) => {
      const subjectCard = e.target.closest('.subject-card');
      if (subjectCard) {
        this.animateSubjectCardHover(subjectCard, true);
      }
    }, true);

    document.addEventListener('mouseleave', (e) => {
      const subjectCard = e.target.closest('.subject-card');
      if (subjectCard) {
        this.animateSubjectCardHover(subjectCard, false);
      }
    }, true);

    // Color indicator animations
    this.setupColorIndicatorAnimations();
  }

  animateSubjectCardHover(subjectCard, isHovering) {
    const colorIndicator = subjectCard.querySelector('.subject-color-indicator');
    const actions = subjectCard.querySelector('.subject-actions');
    const stats = subjectCard.querySelectorAll('.subject-stat-item');
    
    if (isHovering) {
      subjectCard.style.transform = 'translateY(-6px) scale(1.02)';
      subjectCard.style.boxShadow = 'var(--shadow-2xl)';
      
      if (colorIndicator) {
        colorIndicator.style.transform = 'scale(1.15) rotate(5deg)';
      }
      
      if (actions) {
        actions.style.opacity = '1';
      }
      
      // Animate stats with stagger
      stats.forEach((stat, index) => {
        setTimeout(() => {
          stat.style.transform = 'translateY(-2px)';
          stat.style.boxShadow = 'var(--shadow-sm)';
        }, index * 50);
      });
    } else {
      subjectCard.style.transform = '';
      subjectCard.style.boxShadow = '';
      
      if (colorIndicator) {
        colorIndicator.style.transform = '';
      }
      
      stats.forEach(stat => {
        stat.style.transform = '';
        stat.style.boxShadow = '';
      });
    }
  }

  setupColorIndicatorAnimations() {
    document.querySelectorAll('.subject-color-indicator').forEach(indicator => {
      indicator.addEventListener('mouseover', () => {
        indicator.style.transform = 'scale(1.2) rotate(10deg)';
      });
      
      indicator.addEventListener('mouseout', () => {
        indicator.style.transform = '';
      });
    });
  }

  handleSubjectCardClick(subjectCard) {
    const subjectId = subjectCard.dataset.subjectId;
    
    // Add click animation
    subjectCard.style.transform = 'scale(0.98)';
    setTimeout(() => {
      subjectCard.style.transform = '';
    }, 150);
    
    // Show subject preview modal
    this.showSubjectPreview(subjectId);
  }

  // EDIT SUBJECT METHOD - Opens modal with subject data for editing
  editSubject(subjectId) {
    console.log('[SubjectsManager] editSubject called with ID:', subjectId);
    
    if (!Array.isArray(this.currentSubjects)) {
      console.error('[SubjectsManager] currentSubjects is not an array');
              this.showNotification('Error: Data mata pelajaran tidak dimuat', 'error');
      return;
    }

    const subject = this.currentSubjects.find(s => s.id == subjectId);
    
    if (!subject) {
      console.error('[SubjectsManager] Subject not found with ID:', subjectId);
      this.showNotification('Subject not found', 'error');
      return;
    }

    console.log('[SubjectsManager] Found subject for editing:', subject);
    this.showSubjectModal(subjectId);
  }

  // DELETE SUBJECT METHOD - Shows confirmation and deletes subject
  deleteSubject(subjectId) {
    console.log('[SubjectsManager] deleteSubject called with ID:', subjectId);
    
    if (!subjectId) {
      console.error('[SubjectsManager] No subject ID provided for deletion');
      return;
    }

    const subject = this.currentSubjects.find(s => s.id == subjectId);
    
    if (!subject) {
      console.error('[SubjectsManager] Subject not found with ID:', subjectId);
      this.showNotification('Subject not found', 'error');
      return;
    }

    // Show confirmation dialog
    this.showDeleteConfirmation(subject);
  }

  // Show delete confirmation modal/dialog
  showDeleteConfirmation(subject) {
    const confirmMessage = `Are you sure you want to delete "${subject.name}"? This will also delete all associated tasks and notes. This action cannot be undone.`;
    
    // Using browser confirm for now - you can replace this with a custom modal
    if (confirm(confirmMessage)) {
      this.performDeleteSubject(subject.id);
    }
  }

  // Perform the actual deletion
  async performDeleteSubject(subjectId) {
    try {
      this.showLoading();
      
      const response = await fetch('api/subjects.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: subjectId })
      });

      const result = await response.json();
      
      if (result.success) {
        this.showNotification('Mata pelajaran berhasil dihapus', 'success');
        this.loadSubjects(); // Reload subjects
      } else {
        this.showNotification(result.message || 'Failed to delete subject', 'error');
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      this.showNotification('An error occurred while deleting the subject', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // SHOW SUBJECT PREVIEW METHOD - Enhanced version
  async showSubjectPreview(subjectId) {
    console.log('Showing subject preview for ID:', subjectId);
    
    if (!subjectId) {
      console.error('[SubjectsManager] No subject ID provided for preview');
      return;
    }

    // Show modal first, then load data
    this.showModal('subjectPreviewModal');
    
    try {
      this.showLoading();
      
      const response = await fetch(`api/subjects.php?action=preview&subject_id=${subjectId}`);
      console.log('API response:', response);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API result:', result);
      
      if (result.success && result.data) {
        this.populateSubjectPreview(result.data);
      } else {
        // Show error in modal instead of notification
        this.showPreviewError('Failed to load subject data');
        console.error('API returned error:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error loading subject preview:', error);
      this.showPreviewError('Error loading subject data');
    } finally {
      this.hideLoading();
    }
  }

  // Show error message in preview modal
  showPreviewError(message) {
    const tasksList = document.getElementById('previewTasksList');
    const notesList = document.getElementById('previewNotesList');
    const errorHtml = `<div class="preview-empty error">${message}</div>`;
    
    if (tasksList) tasksList.innerHTML = errorHtml;
    if (notesList) notesList.innerHTML = errorHtml;
  }

  populateSubjectPreview(data) {
    const { subject, taskStats, noteStats, recentTasks, recentNotes } = data;
    
    // Update subject info
    const previewSubjectName = document.getElementById('previewSubjectName');
    const previewSubjectDescription = document.getElementById('previewSubjectDescription');
    const previewColorIndicator = document.getElementById('previewColorIndicator');
    
    if (previewSubjectName) previewSubjectName.textContent = subject.name;
    if (previewSubjectDescription) previewSubjectDescription.textContent = subject.description || 'No description available';
    if (previewColorIndicator) previewColorIndicator.style.backgroundColor = subject.color;
    
    // Update stats
    const previewTotalTasks = document.getElementById('previewTotalTasks');
    const previewCompletedTasks = document.getElementById('previewCompletedTasks');
    const previewTotalNotes = document.getElementById('previewTotalNotes');
    
    if (previewTotalTasks) previewTotalTasks.textContent = taskStats.total_tasks;
    if (previewCompletedTasks) previewCompletedTasks.textContent = taskStats.completed_tasks;
    if (previewTotalNotes) previewTotalNotes.textContent = noteStats.total_notes;
    
    // Update progress - FIXED: Added completion animation
    const progress = taskStats.total_tasks > 0 ? 
      Math.round((taskStats.completed_tasks / taskStats.total_tasks) * 100) : 0;
    let progressColor = 'transparent';
    if (progress === 0) {
      progressColor = 'transparent';
    } else if (progress === 100) {
      progressColor = 'var(--success-color)';
    } else {
      progressColor = subject.color;
    }
    
    const progressFill = document.getElementById('previewProgressFill');
    const progressText = document.getElementById('previewProgressText');
    
    if (progressFill) {
      progressFill.setAttribute('data-progress', progress);
      progressFill.setAttribute('data-color', progressColor);
      progressFill.style.width = '0%';
      progressFill.style.backgroundColor = progressColor;
      
      // FIXED: Add completion animation for 100%
      if (progress === 100) {
        progressFill.classList.add('completed');
      }
    }
    
    if (progressText) {
      progressText.textContent = `${Math.round(progress)}% Complete`;
    }
    
    // Animate progress bar
    setTimeout(() => {
      this.animateProgressBar(progressFill, progress);
    }, 100);
    
    // Populate recent tasks and notes
    this.populateRecentTasks(recentTasks);
    this.populateRecentNotes(recentNotes);
    
    // Set up view buttons
    this.setupPreviewViewButtons(subject.id);
  }

  // FIXED: Enhanced progress bar animation with completion effect
  animateProgressBar(progressElement, targetProgress) {
    if (!progressElement) return;
    
    progressElement.style.width = '0%';
    progressElement.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      progressElement.style.width = `${targetProgress}%`;
      
      // FIXED: Add completion animation when 100%
      if (targetProgress === 100) {
        setTimeout(() => {
          // Add celebratory pulse animation
          progressElement.style.animation = 'completionPulse 0.8s ease-in-out';
          
          // Add sparkle effect
          this.createCompletionSparkles(progressElement);
          
          // Reset animation after completion
          setTimeout(() => {
            progressElement.style.animation = '';
          }, 800);
        }, 1500); // Wait for width animation to complete
      }
    }, 100);
  }

  // FIXED: Create sparkle effect for 100% completion
  createCompletionSparkles(element) {
    const sparkleCount = 6;
    const container = element.closest('.progress-bar') || element.parentElement;
    
    if (!container) return;
    
    for (let i = 0; i < sparkleCount; i++) {
      setTimeout(() => {
        const sparkle = document.createElement('div');
        sparkle.className = 'progress-sparkle';
        sparkle.style.cssText = `
          position: absolute;
          width: 4px;
          height: 4px;
          background: #ffd700;
          border-radius: 50%;
          pointer-events: none;
          left: ${Math.random() * 100}%;
          top: 50%;
          transform: translateY(-50%);
          animation: sparkleFloat 1s ease-out forwards;
          z-index: 10;
        `;
        
        container.appendChild(sparkle);
        
        setTimeout(() => {
          if (sparkle.parentNode) {
            sparkle.remove();
          }
        }, 1000);
      }, i * 100);
    }
  }

  populateRecentTasks(tasks) {
    const tasksList = document.getElementById('previewTasksList');
    
    if (!tasksList) return;
    
    if (!tasks || tasks.length === 0) {
      tasksList.innerHTML = '<div class="preview-empty">No tasks found</div>';
      return;
    }
    
    const tasksHtml = tasks.map(task => `
      <div class="preview-task-item ${task.completed ? 'completed' : ''}">
        <div class="preview-task-info">
          <div class="preview-task-title">${this.escapeHtml(task.title)}</div>
          ${task.description ? `<div class="preview-task-description">${this.escapeHtml(task.description)}</div>` : ''}
        </div>
        <div class="preview-task-meta">
          ${task.completed ? '<span class="preview-task-status completed"><i class="fa-solid fa-check"></i></span>' : ''}
          ${task.due_date ? `<span class="preview-task-due">${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
        </div>
      </div>
    `).join('');
    
    tasksList.innerHTML = tasksHtml;
  }

  populateRecentNotes(notes) {
    const notesList = document.getElementById('previewNotesList');
    
    if (!notesList) return;
    
    if (!notes || notes.length === 0) {
      notesList.innerHTML = '<div class="preview-empty">No notes found</div>';
      return;
    }
    
    const notesHtml = notes.map(note => `
      <div class="preview-note-item">
        <div class="preview-note-info">
          <div class="preview-note-title">${this.escapeHtml(note.title)}</div>
          <div class="preview-note-content">${this.truncateText(note.content.replace(/<[^>]*>/g, ''), 100)}</div>
        </div>
        <div class="preview-note-meta">
          <span class="preview-note-date">${new Date(note.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');
    
    notesList.innerHTML = notesHtml;
  }

  setupPreviewViewButtons(subjectId) {
    const viewAllTasksBtn = document.getElementById('viewAllTasksBtn');
    const viewAllNotesBtn = document.getElementById('viewAllNotesBtn');
    
    if (viewAllTasksBtn) {
      viewAllTasksBtn.onclick = () => {
        window.location.href = `?page=tasks&subject=${subjectId}`;
      };
    }
    
    if (viewAllNotesBtn) {
      viewAllNotesBtn.onclick = () => {
        window.location.href = `?page=notes&subject=${subjectId}`;
      };
    }
  }

  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  showSubjectDetails(subjectId) {
    // Redirect to showSubjectPreview for consistency
    this.showSubjectPreview(subjectId);
  }

  setupSearch() {
    const searchInput = document.querySelector('.subjects-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      clearTimeout(this.searchTimeout);
      const query = e.target.value.trim();
      
      this.searchTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 300);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        this.performSearch('');
        searchInput.blur();
      }
    });
  }

  performSearch(query) {
    if (!query) {
      this.renderSubjects(this.currentSubjects);
      return;
    }

    const filteredSubjects = this.currentSubjects.filter(subject => {
      const searchText = `${subject.name} ${subject.description || ''}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    this.renderSubjects(filteredSubjects, query);
  }

  setupColorPicker() {
    // Color preset functionality will be set up when modal opens
    document.addEventListener('modalOpened', (e) => {
      if (e.detail.modalId === 'subjectModal') {
        this.initializeColorPicker();
      }
    });
  }

  initializeColorPicker() {
    const colorPresetsContainer = document.querySelector('.color-presets');
    if (!colorPresetsContainer) return;

    // Create color presets
    colorPresetsContainer.innerHTML = this.colorPresets.map(color => `
      <div class="color-preset" data-color="${color}" style="background-color: ${color}"></div>
    `).join('');

    // Add event listeners
    document.querySelectorAll(".color-preset").forEach((preset) => {
      preset.addEventListener("click", (e) => {
        this.selectColor(e.target.dataset.color);
        
        // Visual feedback
        this.createColorPresetRipple(preset);
      });
    });

    // Custom color input
    const customColorInput = document.getElementById("subjectColor");
    if (customColorInput) {
      customColorInput.addEventListener("change", (e) => {
        this.selectColor(e.target.value);
      });
    }
  }

  selectColor(color) {
    this.selectedColor = color;
    
    // Update form input
    const colorInput = document.getElementById("subjectColor");
    if (colorInput) {
      colorInput.value = color;
    }

    // Update active state
    document.querySelectorAll(".color-preset").forEach((p) => {
      p.classList.remove("active");
      if (p.dataset.color === color) {
        p.classList.add("active");
      }
    });

    // Update preview if exists
    this.updateColorPreview(color);
  }

  updateColorPreview(color) {
    const preview = document.querySelector('.color-preview');
    if (preview) {
      preview.style.backgroundColor = color;
    }
  }

  createColorPresetRipple(element) {
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.5);
      border-radius: inherit;
      transform: scale(0);
      animation: color-ripple 0.4s ease-out;
      pointer-events: none;
    `;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.remove();
      }
    }, 400);
  }

  setupAnimations() {
    // Intersection Observer for scroll animations
    if ('IntersectionObserver' in window) {
      this.setupScrollAnimations();
    }
    
    // Stagger subject card animations
    this.setupStaggerAnimations();
    
    // Progress bar animations
    this.setupProgressAnimations();
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElementIn(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe subject cards and stats
    document.querySelectorAll('.subject-card, .subjects-stat-card').forEach(el => {
      observer.observe(el);
    });
  }

  animateElementIn(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px) scale(0.95)';
    
    setTimeout(() => {
      element.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0) scale(1)';
    }, 100);
  }

  setupStaggerAnimations() {
    const subjectCards = document.querySelectorAll('.subject-card');
    subjectCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.4s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  setupProgressAnimations() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    progressBars.forEach(bar => {
      const targetWidth = bar.dataset.width || '0%';
      bar.style.width = '0%';
      
      setTimeout(() => {
        bar.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
        bar.style.width = targetWidth;
      }, 500);
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            this.showSubjectModal();
            break;
          case 'f':
            e.preventDefault();
            const searchInput = document.querySelector('.subjects-search-input');
            if (searchInput) searchInput.focus();
            break;
        }
      }
    });
  }

  setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Apply filter
        const filter = btn.dataset.filter;
        this.applyFilter(filter);
        
        // Visual feedback
        this.createRippleEffect(btn, e);
      });
    });
  }

  applyFilter(filterType) {
    let filteredSubjects = this.currentSubjects;

    switch (filterType) {
      case 'all':
        filteredSubjects = this.currentSubjects;
        break;
      case 'active':
        filteredSubjects = this.currentSubjects.filter(subject => 
          subject.total_tasks > 0 && subject.completed_tasks < subject.total_tasks
        );
        break;
      case 'completed':
        filteredSubjects = this.currentSubjects.filter(subject => 
          subject.total_tasks > 0 && subject.completed_tasks === subject.total_tasks
        );
        break;
      case 'empty':
        filteredSubjects = this.currentSubjects.filter(subject => subject.total_tasks === 0);
        break;
    }

    this.renderSubjects(filteredSubjects);
  }

  async loadSubjects() {
    try {
      this.showLoading();
      const response = await fetch('api/subjects.php');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        this.currentSubjects = result.data;
        this.renderSubjects(this.currentSubjects);
        this.updateSubjectsStats();
      } else {
        this.currentSubjects = [];
        this.renderSubjects([]);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      this.currentSubjects = [];
      this.renderSubjects([]);
    } finally {
      this.hideLoading();
    }
  }

  renderSubjects(subjects = this.currentSubjects, searchQuery = '') {
    const container = document.getElementById("subjectsGrid");
    if (!container) return;

    // Ensure subjects is an array
    if (!Array.isArray(subjects)) {
      subjects = [];
    }

    if (subjects.length === 0) {
      container.innerHTML = this.getEmptyState(searchQuery);
      return;
    }

    container.innerHTML = subjects.map((subject, index) => {
      const progress = subject.total_tasks > 0 ? 
        Math.round((subject.completed_tasks / subject.total_tasks) * 100) : 0;
      let progressColor = 'transparent';
      if (progress === 0) {
        progressColor = 'transparent';
      } else if (progress === 100) {
        progressColor = 'var(--success-color)';
      } else {
        progressColor = subject.color;
      }
      
      return `
        <div class="subject-card" data-subject-id="${subject.id}">
          <div class="subject-header">
            <div class="subject-info">
              <div class="subject-color-indicator" style="background-color: ${subject.color}">
                <i class="fa-solid fa-book"></i>
              </div>
              <div class="subject-details">
                <h3 class="subject-name">${searchQuery ? 
                  this.highlightText(subject.name, searchQuery) : 
                  this.escapeHtml(subject.name)
                }</h3>
              </div>
            </div>
            <div class="subject-actions">
              <button class="subject-action-btn edit-subject-btn" data-subject-id="${subject.id}" title="Edit Subject">
                <i class="fa-solid fa-edit"></i>
              </button>
              <button class="subject-action-btn delete-subject-btn" data-subject-id="${subject.id}" title="Delete Subject">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="subject-stats">
            <div class="subject-stat-item">
              <span class="subject-stat-number">${subject.total_tasks}</span>
              <span class="subject-stat-label">Total Tasks</span>
            </div>
            <div class="subject-stat-item">
              <span class="subject-stat-number">${subject.completed_tasks}</span>
              <span class="subject-stat-label">Completed</span>
            </div>
            <div class="subject-stat-item">
              <span class="subject-stat-number">${subject.total_tasks - subject.completed_tasks}</span>
              <span class="subject-stat-label">Pending</span>
            </div>
          </div>
          
          <div class="subject-progress">
            <div class="progress-bar">
              <div class="progress-fill ${progress === 100 ? 'completed' : ''}" 
                   data-progress="${progress}" 
                   data-color="${progressColor}" 
                   style="width: 0%; background-color: ${progressColor};"></div>
            </div>
            <span class="progress-text">${progress}% Complete</span>
          </div>
        </div>
      `;
    }).join("");

    // Animate progress bars after render
    setTimeout(() => {
      this.animateAllProgressBars();
      this.setupStaggerAnimations();
    }, 100);
  }

  // FIXED: Enhanced progress bar animation for all bars
  animateAllProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    progressBars.forEach((bar, index) => {
      const targetProgress = parseInt(bar.dataset.progress) || 0;
      
      // Reset width
      bar.style.width = '0%';
      bar.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
      
      setTimeout(() => {
        bar.style.width = `${targetProgress}%`;
        
        // FIXED: Add completion animation for 100% progress
        if (targetProgress === 100) {
          setTimeout(() => {
            // Add completion pulse
            bar.style.animation = 'completionPulse 0.8s ease-in-out';
            
            // Add sparkle effect
            this.createCompletionSparkles(bar);
            
            // Reset animation
            setTimeout(() => {
              bar.style.animation = '';
            }, 800);
          }, 1500); // Wait for width animation
        }
      }, index * 100); // Stagger animations
    });
  }

  getEmptyState(searchQuery) {
    if (searchQuery) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No subjects found</h3>
          <p>No subjects match "${this.escapeHtml(searchQuery)}". Try a different search term.</p>
        </div>
      `;
    }
    
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h3>No subjects yet</h3>
        <p>Create your first subject to organize your tasks and notes</p>
        <a href="#" class="empty-state-action" onclick="subjectsManager.showSubjectModal()">
          <i class="fas fa-plus"></i>
          Add Subject
        </a>
      </div>
    `;
  }

  updateSubjectsStats() {
    const totalSubjects = this.currentSubjects.length;
    const activeSubjects = this.currentSubjects.filter(s => s.total_tasks > 0).length;
    const totalTasks = this.currentSubjects.reduce((sum, s) => sum + s.total_tasks, 0);
    const completedTasks = this.currentSubjects.reduce((sum, s) => sum + s.completed_tasks, 0);

    this.updateStatCard('total-subjects', totalSubjects);
    this.updateStatCard('active-subjects', activeSubjects);
    this.updateStatCard('total-tasks', totalTasks);
    this.updateStatCard('completion-rate', totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%');
  }

  updateStatCard(statId, value) {
    const element = document.querySelector(`[data-stat="${statId}"] .stat-number`);
    if (element) {
      // Animate counter
      this.animateCounter(element, value);
    }
  }

  animateCounter(element, targetValue) {
    const isPercentage = String(targetValue).includes('%');
    const numericTarget = isPercentage ? 
      parseInt(targetValue.replace('%', '')) : 
      parseInt(targetValue) || 0;
    
    const duration = 1000;
    const steps = 30;
    const increment = numericTarget / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    element.textContent = isPercentage ? '0%' : '0';
    
    const counter = setInterval(() => {
      current += increment;
      if (current >= numericTarget) {
        element.textContent = targetValue;
        clearInterval(counter);
        
        // Add completion effect
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, 200);
      } else {
        const displayValue = Math.floor(current);
        element.textContent = isPercentage ? `${displayValue}%` : displayValue;
      }
    }, stepDuration);
  }

  showSubjectModal(subjectId = null) {
    console.log('[SubjectsManager] showSubjectModal', subjectId);
    const modal = document.getElementById("subjectModal");
    const form = document.getElementById("subjectForm");
    const title = document.getElementById("subjectModalTitle");

    if (!modal || !form || !title) {
      console.error('[SubjectsManager] Required modal elements not found');
      return;
    }

    if (subjectId) {
      const subject = this.currentSubjects.find((s) => s.id == subjectId);
      if (subject) {
        title.textContent = "Edit Subject";
        this.populateSubjectForm(subject);
      } else {
        console.error('[SubjectsManager] Subject not found for editing:', subjectId);
        this.showNotification('Mata pelajaran tidak ditemukan', 'error');
        return;
      }
    } else {
      title.textContent = "Create New Subject";
      // Reset form properly
      form.reset();
      document.getElementById("subjectId").value = "";
      document.getElementById("subjectName").value = "";
      document.getElementById("subjectDescription").value = "";
      this.selectColor(this.colorPresets[0]);
    }

    this.showModal("subjectModal");
    
    // Dispatch custom event for color picker initialization
    document.dispatchEvent(new CustomEvent('modalOpened', {
      detail: { modalId: 'subjectModal' }
    }));

    // Focus on name input
    setTimeout(() => {
      const nameInput = document.getElementById("subjectName");
      if (nameInput) nameInput.focus();
    }, 100);
  }

  populateSubjectForm(subject) {
    const subjectIdInput = document.getElementById("subjectId");
    const subjectNameInput = document.getElementById("subjectName");
    const subjectDescriptionInput = document.getElementById("subjectDescription");

    if (subjectIdInput) subjectIdInput.value = subject.id;
    if (subjectNameInput) subjectNameInput.value = subject.name;
    if (subjectDescriptionInput) subjectDescriptionInput.value = subject.description || "";
    
    this.selectColor(subject.color);
  }

  handleSubjectSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const subjectData = {
      id: formData.get("subject_id"),
      name: formData.get("name"),
      description: formData.get("description"),
      color: document.getElementById("subjectColor").value || this.selectedColor,
    };

    // Validation
    if (!subjectData.name || !subjectData.name.trim()) {
              this.showNotification("Silakan masukkan nama mata pelajaran", "error");
      document.getElementById("subjectName").focus();
      return;
    }

    if (subjectData.name.trim().length < 2) {
              this.showNotification("Nama mata pelajaran minimal 2 karakter", "error");
      document.getElementById("subjectName").focus();
      return;
    }

    const action = subjectData.id ? "update" : "create";
    this.saveSubject(subjectData, action);
  }

  async saveSubject(subjectData, action) {
    try {
      this.showLoading();

      // Determine the correct method and data structure
      const method = action === "create" ? "POST" : "PUT";
      const requestData = action === "create" ? subjectData : subjectData;

      const response = await fetch("api/subjects.php", {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      
      if (data.success) {
        this.hideModal("subjectModal");
        this.loadSubjects();
        this.showNotification(
          action === "create" ? "Mata pelajaran berhasil dibuat" : "Mata pelajaran berhasil diperbarui"
        );
      } else {
        this.showNotification(data.error || data.message || "Error saving subject", "error");
      }
    } catch (error) {
      console.error("Error saving subject:", error);
      this.showNotification("Error saving subject", "error");
    } finally {
      this.hideLoading();
    }
  }

  highlightText(text, query) {
    if (!query) return this.escapeHtml(text);
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async loadSubjects() {
    try {
      this.showLoading();
      const response = await fetch('api/subjects.php');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        this.currentSubjects = result.data;
        this.renderSubjects(this.currentSubjects);
        this.updateSubjectsStats();
      } else {
        this.currentSubjects = [];
        this.renderSubjects([]);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      this.currentSubjects = [];
      this.renderSubjects([]);
    } finally {
      this.hideLoading();
    }
  }

  createRippleEffect(element, event) {
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
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showLoading() {
    if (window.bloomApp) {
      window.bloomApp.showLoadingState();
    } else {
      // Fallback loading indicator
      const loadingEl = document.querySelector('.loading-overlay');
      if (loadingEl) {
        loadingEl.style.display = 'flex';
      }
    }
  }

  hideLoading() {
    if (window.bloomApp) {
      window.bloomApp.hideLoadingState();
    } else {
      // Fallback loading indicator
      const loadingEl = document.querySelector('.loading-overlay');
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }
    }
  }

  showNotification(message, type = 'success') {
    if (window.bloomApp) {
      window.bloomApp.showNotification(message, type);
    } else {
      // Fallback notification
      console.log(`[${type.toUpperCase()}] ${message}`);
      alert(message);
    }
  }

  showModal(modalId) {
    console.log('Showing modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
      
      // Trigger custom event
      const event = new CustomEvent('modalOpened', { detail: { modalId } });
      document.dispatchEvent(event);
      console.log('Modal shown successfully');
    } else {
      console.error('Modal not found:', modalId);
    }
  }

  hideModal(modalId) {
    console.log('Hiding modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
      
      // Trigger custom event
      const event = new CustomEvent('modalClosed', { detail: { modalId } });
      document.dispatchEvent(event);
      console.log('Modal hidden successfully');
    } else {
      console.error('Modal not found:', modalId);
    }
  }
}

// Initialize when DOM is ready
window.subjectsManager = new SubjectsManager();