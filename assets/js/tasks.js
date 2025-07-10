// Enhanced Tasks Page - Drag & Drop, Animations, and Interactivity
class TaskManager {
  constructor() {
    this.currentTasks = [];
    this.currentSubjects = [];
    this.draggedTask = null;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isInitialized = false;
    this.isInitializing = false;
    this.lastStatusUpdate = {}; // Track last status update time per task
    
    this.init();
  }

  init() {
    if (this.isInitialized || this.isInitializing) return;
    
    this.isInitializing = true;
    
    // Check if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener("DOMContentLoaded", () => {
        this.setupTasks();
        this.setupDragAndDrop();
        this.setupAnimations();
        this.setupKeyboardShortcuts();
        this.setupTouchGestures();
        this.setupAddTaskPlaceholders();
        this.isInitialized = true;
        this.isInitializing = false;
      });
    } else {
      // DOM is already ready
      this.setupTasks();
      this.setupDragAndDrop();
      this.setupAnimations();
      this.setupKeyboardShortcuts();
      this.setupTouchGestures();
      this.setupAddTaskPlaceholders();
      this.isInitialized = true;
      this.isInitializing = false;
    }
  }

  setupTasks() {
    this.loadSubjects(() => {
      this.loadTasks();
      this.setupTaskEvents();
      this.setupFilters();
      this.setupQuickActions();
    });
  }

  setupAddTaskPlaceholders() {
    // Add event listeners for add task placeholders
    document.querySelectorAll('.add-task-placeholder').forEach((placeholder) => {
      placeholder.addEventListener('click', (e) => {
        e.preventDefault();
        const status = placeholder.closest('.kanban-column').classList.contains('todo-column') ? 'todo' :
                      placeholder.closest('.kanban-column').classList.contains('progress-column') ? 'progress' : 'completed';
        this.showAddTaskModal(status);
        
        // Add visual feedback
        placeholder.style.transform = 'scale(0.95)';
        setTimeout(() => {
          placeholder.style.transform = '';
        }, 150);
      });
    });
  }

  setupTaskEvents() {
    // Add task button
    const addTaskBtn = document.getElementById("addTaskBtn");
    if (addTaskBtn) {
      addTaskBtn.addEventListener("click", () => this.showTaskModal());
    }

    // Task form submission
    const taskForm = document.getElementById("taskForm");
    if (taskForm) {
      taskForm.addEventListener("submit", this.handleTaskSubmit.bind(this));
    }

    // Task actions with enhanced animations
    document.addEventListener('click', (e) => {
      if (!(e.target instanceof Element)) return;
      if (e.target.matches('.task-action-btn[onclick*="editTask"]')) {
        e.preventDefault();
        const taskId = this.extractTaskId(e.target.getAttribute('onclick'));
        this.editTask(taskId);
      }
      if (e.target.matches('.task-action-btn[onclick*="deleteTask"]')) {
        e.preventDefault();
        const taskId = this.extractTaskId(e.target.getAttribute('onclick'));
        this.deleteTask(taskId);
      }
    });
  }

  setupFilters() {
    // Setup filter buttons if they exist
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
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btn.style.transform = '';
        }, 150);
      });
    });

    // Setup filter dropdown
    const filterSelect = document.getElementById('taskFilter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        const filter = e.target.value;
        this.applyFilter(filter);
        
        // Clear search input when filter changes
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.value = '';
        }
        
        // Visual feedback
        filterSelect.style.transform = 'scale(0.95)';
        setTimeout(() => {
          filterSelect.style.transform = '';
        }, 150);
      });
    }

    // Setup search functionality if search input exists
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        this.searchTasks(searchTerm);
      });
    }
  }

  searchTasks(searchTerm) {
    if (!searchTerm.trim()) {
      // Check if there's an active filter
      const filterSelect = document.getElementById('taskFilter');
      if (filterSelect && filterSelect.value !== 'all') {
        this.applyFilter(filterSelect.value);
      } else {
        this.renderTasks();
      }
      return;
    }

    const filteredTasks = this.currentTasks.filter(task => {
      return task.title.toLowerCase().includes(searchTerm) ||
             (task.description && task.description.toLowerCase().includes(searchTerm)) ||
             task.priority.toLowerCase().includes(searchTerm) ||
             task.status.toLowerCase().includes(searchTerm);
    });

    this.renderFilteredTasks(filteredTasks);
    
    if (filteredTasks.length === 0) {
              window.bloomApp.showNotification(`Tidak ada tugas yang cocok dengan "${searchTerm}"`, 'error');
    } else {
              window.bloomApp.showNotification(`Ditemukan ${filteredTasks.length} tugas yang cocok dengan "${searchTerm}"`);
    }
  }

  setupQuickActions() {
    const quickActions = document.querySelectorAll('.quick-action-btn');
    quickActions.forEach(action => {
      action.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Add ripple effect
        this.createQuickActionRipple(action, e);
        
        // Handle action
        const actionType = action.dataset.action;
        switch (actionType) {
          case 'add-task':
            this.showTaskModal();
            break;
          case 'bulk-update':
            this.showBulkUpdateModal();
            break;
          case 'export':
            this.exportTasks();
            break;
          case 'clear-filter':
            this.clearFilter();
            break;
        }
      });
    });
  }

  setupDragAndDrop() {
    this.setupTaskDragging();
    this.setupColumnDropping();
  }

  setupTaskDragging() {
    document.addEventListener('mousedown', (e) => {
      if (!(e.target instanceof Element)) return;
      const taskCard = e.target.closest('.task-card');
      if (taskCard && !e.target.closest('.task-actions')) {
        this.initiateDrag(taskCard, e);
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (this.draggedTask) {
        this.handleDragMove(e);
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (this.draggedTask) {
        this.handleDragEnd(e);
      }
    });
  }

  setupColumnDropping() {
    document.querySelectorAll('.kanban-column').forEach(column => {
      column.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.classList.add('drag-over');
      });

      column.addEventListener('dragleave', (e) => {
        if (!column.contains(e.relatedTarget)) {
          column.classList.remove('drag-over');
        }
      });

      column.addEventListener('drop', (e) => {
        e.preventDefault();
        column.classList.remove('drag-over');
        
        if (this.draggedTask) {
          const newStatus = column.dataset.status;
          this.moveTaskToColumn(this.draggedTask, newStatus);
        }
      });
    });
  }

  initiateDrag(taskCard, e) {
    e.preventDefault();
    
    this.draggedTask = taskCard;
    taskCard.classList.add('dragging');
    
    // Create drag preview
    const dragPreview = taskCard.cloneNode(true);
    dragPreview.classList.add('drag-preview');
    dragPreview.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: var(--z-modal);
      opacity: 0.8;
      transform: rotate(2deg) scale(1.05);
      box-shadow: var(--shadow-2xl);
      transition: none;
    `;
    
    document.body.appendChild(dragPreview);
    this.dragPreview = dragPreview;
    
    this.updateDragPreviewPosition(e);
  }

  handleDragMove(e) {
    this.updateDragPreviewPosition(e);
    
    // Check for column hover
    const columnUnder = document.elementFromPoint(e.clientX, e.clientY)?.closest('.kanban-column');
    
    document.querySelectorAll('.kanban-column').forEach(col => {
      col.classList.remove('drag-over');
    });
    
    if (columnUnder) {
      columnUnder.classList.add('drag-over');
    }
  }

  handleDragEnd(e) {
    if (!this.draggedTask) return;
    
    console.log("Drag ended");
    
    // Use elementFromPoint to find the element under the cursor
    const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
    const columnUnder = elementUnder && elementUnder.closest ? elementUnder.closest('.kanban-column') : null;
    
    if (columnUnder) {
      const newStatus = columnUnder.dataset.status;
      const taskId = this.draggedTask.dataset.taskId;
      console.log(`Drag drop: Task ${taskId} -> ${newStatus}`);
      this.updateTaskStatus(taskId, newStatus);
    }
    
    // Cleanup
    this.draggedTask.classList.remove('dragging');
    document.querySelectorAll('.kanban-column').forEach(col => {
      col.classList.remove('drag-over');
    });
    
    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }
    
    this.draggedTask = null;
  }

  updateDragPreviewPosition(e) {
    if (this.dragPreview) {
      this.dragPreview.style.left = (e.clientX - 160) + 'px';
      this.dragPreview.style.top = (e.clientY - 50) + 'px';
    }
  }

  moveTaskToColumn(taskCard, newStatus) {
    const taskId = taskCard.dataset.taskId;
    if (taskId) {
      this.updateTaskStatus(taskId, newStatus);
    }
  }

  setupAnimations() {
    // Intersection Observer for scroll animations
    if ('IntersectionObserver' in window) {
      this.setupScrollAnimations();
    }
    
    // Task card hover effects
    this.setupTaskCardAnimations();
    
    // Column animations
    this.setupColumnAnimations();
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(20px)';
          
          setTimeout(() => {
            entry.target.style.transition = 'all 0.4s ease-out';
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe task cards
    document.querySelectorAll('.task-card, .task-column').forEach(el => {
      observer.observe(el);
    });
  }

  setupTaskCardAnimations() {
    document.addEventListener('mouseenter', (e) => {
      if (!(e.target instanceof Element)) return;
      const taskCard = e.target.closest('.task-card');
      if (taskCard) {
        this.animateTaskCardHover(taskCard, true);
      }
    }, true);

    document.addEventListener('mouseleave', (e) => {
      if (!(e.target instanceof Element)) return;
      const taskCard = e.target.closest('.task-card');
      if (taskCard) {
        this.animateTaskCardHover(taskCard, false);
      }
    }, true);
  }

  animateTaskCardHover(taskCard, isHovering) {
    if (isHovering) {
      taskCard.style.transform = 'translateY(-4px) scale(1.02)';
      taskCard.style.boxShadow = 'var(--shadow-xl)';
      
      // Animate task actions
      const actions = taskCard.querySelector('.task-actions');
      if (actions) {
        actions.style.opacity = '1';
        actions.style.transform = 'translateX(0)';
      }
    } else {
      taskCard.style.transform = '';
      taskCard.style.boxShadow = '';
    }
  }

  setupColumnAnimations() {
    document.querySelectorAll('.task-column').forEach(column => {
      column.addEventListener('mouseenter', () => {
        column.style.transform = 'translateY(-2px)';
        column.style.boxShadow = 'var(--shadow-lg)';
      });

      column.addEventListener('mouseleave', () => {
        column.style.transform = '';
        column.style.boxShadow = '';
      });
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            this.showTaskModal();
            break;
          case 'f':
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) searchInput.focus();
            break;
        }
      }
      
      // Quick filter shortcuts
      if (e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            this.filterByStatus('todo');
            break;
          case '2':
            e.preventDefault();
            this.filterByStatus('progress');
            break;
          case '3':
            e.preventDefault();
            this.filterByStatus('completed');
            break;
          case 'a':
            e.preventDefault();
            this.applyFilter('all');
            break;
          case 'p':
            e.preventDefault();
            this.applyFilter('pending');
            break;
          case 'c':
            e.preventDefault();
            this.applyFilter('completed');
            break;
          case 'h':
            e.preventDefault();
            this.applyFilter('high');
            break;
          case 'm':
            e.preventDefault();
            this.applyFilter('medium');
            break;
          case 'l':
            e.preventDefault();
            this.applyFilter('low');
            break;
          case 'Escape':
            e.preventDefault();
            this.clearFilter();
            break;
        }
      }
    });
  }

  setupTouchGestures() {
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!(e.target instanceof Element)) return;
      const taskCard = e.target.closest('.task-card');
      if (taskCard) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = this.touchStartX - touchEndX;
        const deltaY = this.touchStartY - touchEndY;

        // Horizontal swipe on task cards
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            // Swipe left - move to next status
            this.swipeTaskLeft(taskCard);
          } else {
            // Swipe right - move to previous status
            this.swipeTaskRight(taskCard);
          }
        }
      }

      this.touchStartX = 0;
      this.touchStartY = 0;
    }, { passive: true });
  }

  swipeTaskLeft(taskCard) {
    const taskId = taskCard.dataset.taskId;
    const task = this.currentTasks.find(t => t.id == taskId);
    
    if (task) {
      let newStatus;
      switch (task.status) {
        case 'todo':
          newStatus = 'progress';
          break;
        case 'progress':
          newStatus = 'completed';
          break;
        default:
          return;
      }
      
      this.updateTaskStatus(taskId, newStatus);
      this.showSwipeAnimation(taskCard, 'left');
    }
  }

  swipeTaskRight(taskCard) {
    const taskId = taskCard.dataset.taskId;
    const task = this.currentTasks.find(t => t.id == taskId);
    
    if (task) {
      let newStatus;
      switch (task.status) {
        case 'completed':
          newStatus = 'progress';
          break;
        case 'progress':
          newStatus = 'todo';
          break;
        default:
          return;
      }
      
      this.updateTaskStatus(taskId, newStatus);
      this.showSwipeAnimation(taskCard, 'right');
    }
  }

  showSwipeAnimation(taskCard, direction) {
    const translateX = direction === 'left' ? '-100px' : '100px';
    
    taskCard.style.transform = `translateX(${translateX})`;
    taskCard.style.opacity = '0.5';
    
    setTimeout(() => {
      taskCard.style.transition = 'all 0.3s ease-out';
      taskCard.style.transform = '';
      taskCard.style.opacity = '';
    }, 200);
  }

  loadTasks() {
    this.showLoading();

    fetch("api/tasks.php?action=list")
      .then((response) => response.json())
      .then((data) => {
        this.hideLoading();
        if (data.success) {
          this.currentTasks = data.tasks;
          this.renderTasks();
          this.updateTaskStats();
        } else {
          window.bloomApp.showNotification("Error loading tasks", "error");
        }
      })
      .catch((error) => {
        this.hideLoading();
        console.error("Error loading tasks:", error);
        window.bloomApp.showNotification("Error loading tasks", "error");
      });
  }

  loadSubjects(callback) {
    fetch("api/subjects.php")
      .then((response) => response.json())
      .then((data) => {
        this.currentSubjects = Array.isArray(data.data) ? data.data : [];
        this.populateSubjectDropdown();
        console.log('Tasks: Loaded', this.currentSubjects.length, 'subjects');
        if (typeof callback === 'function') callback();
      })
      .catch((error) => {
        this.currentSubjects = [];
        this.populateSubjectDropdown();
        console.error("Error loading subjects:", error);
        if (typeof callback === 'function') callback();
      });
  }

  renderTasks() {
    const todoTasks = this.currentTasks.filter((t) => t.status === "todo");
    const progressTasks = this.currentTasks.filter((t) => t.status === "progress");
    const completedTasks = this.currentTasks.filter((t) => t.status === "completed");

    // Update counts with animation
    this.updateCount('#todoColumn .task-count', todoTasks.length);
    this.updateCount('#progressColumn .task-count', progressTasks.length);
    this.updateCount('#completedColumn .task-count', completedTasks.length);

    // Render task cards with stagger animation
    this.renderTaskColumn("todoTasks", todoTasks);
    this.renderTaskColumn("progressTasks", progressTasks);
    this.renderTaskColumn("completedTasks", completedTasks);

    // Show message if no tasks at all
    if (this.currentTasks.length === 0) {
              window.bloomApp.showNotification('Tidak ada tugas ditemukan. Buat tugas pertama Anda untuk memulai!', 'error');
    }
  }

  updateCount(selector, count) {
    const element = document.querySelector(selector);
    if (element) {
      const oldCount = parseInt(element.textContent) || 0;
      if (oldCount !== count) {
        element.style.transform = 'scale(1.2)';
        element.style.transition = 'transform 0.2s ease-out';
        
        setTimeout(() => {
          element.textContent = count;
          element.style.transform = '';
        }, 100);
      }
    }
  }

  renderTaskColumn(containerId, tasks) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '';
    if (!Array.isArray(tasks) || tasks.length === 0) {
      html += `<div class="empty-column">
        <i class="fas fa-inbox"></i>
        <p>No tasks yet</p>
        <small>Click "Add Task" to get started</small>
      </div>`;
    } else {
      html += tasks.map((task, index) => {
        const subject = Array.isArray(this.currentSubjects) ? this.currentSubjects.find((s) => s.id == task.subject_id) : null;
        const isOverdue = task.due_date && new Date(task.due_date) < new Date();
        const isDueSoon = task.due_date && new Date(task.due_date) <= new Date(Date.now() + 24 * 60 * 60 * 1000);
        return `
          <div class="task-card ${task.completed ? "completed" : ""} priority-${task.priority}" 
               data-task-id="${task.id}" 
               data-status="${task.status}"
               style="animation-delay: ${index * 0.1}s">
            <div class="task-header">
              <h4 class="task-title">${this.escapeHtml(task.title)}</h4>
              <div class="task-actions">
                <button class="task-action-btn" onclick="taskManager.editTask(${task.id})" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="task-action-btn" onclick="taskManager.deleteTask(${task.id})" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ""}
            <div class="task-meta">
              <span class="task-priority priority-${task.priority}">${task.priority}</span>
              ${task.due_date ? `<span class="task-due-date ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}"><i class="fas fa-calendar"></i> ${this.formatDate(task.due_date)}</span>` : ""}
            </div>
            ${subject ? `<div class="task-subject" style="border-left-color: ${subject.color}"><i class="fas fa-book"></i>${this.escapeHtml(subject.name)}</div>` : ""}
            <div class="task-footer"><span class="task-status ${task.status}">${task.status}</span></div>
          </div>
        `;
      }).join("");
    }
    // PATCH: Tambahkan tombol add-task di setiap kolom
    let status = 'todo';
    if (containerId === 'progressTasks') status = 'progress';
    if (containerId === 'completedTasks') status = 'completed';
    html += `<div class="add-task-placeholder" onclick="showAddTaskModal('${status}')"><span>Add Task</span></div>`;
    container.innerHTML = html;
    setTimeout(() => {
      container.querySelectorAll('.task-card').forEach((card, index) => {
        card.classList.add('animate-fade-in');
      });
    }, 50);
  }

  updateTaskStats() {
    const totalTasks = this.currentTasks.length;
    const completedTasks = this.currentTasks.filter(t => t.completed || t.status === 'completed').length;
    const overdueTasks = this.currentTasks.filter(t => {
      return t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed';
    }).length;

    this.updateStatCard('total-tasks', totalTasks);
    this.updateStatCard('completed-tasks', completedTasks);
    this.updateStatCard('overdue-tasks', overdueTasks);
    
    if (totalTasks > 0) {
      const completionRate = Math.round((completedTasks / totalTasks) * 100);
      this.updateStatCard('completion-rate', `${completionRate}%`);
    }
  }

  updateStatCard(statId, value) {
    const element = document.querySelector(`[data-stat="${statId}"] .stat-number`);
    if (element) {
      element.style.transform = 'scale(1.1)';
      setTimeout(() => {
        element.textContent = value;
        element.style.transform = '';
      }, 150);
    }
  }

  showTaskModal(taskId = null, defaultStatus = "todo") {
    const modal = document.getElementById("taskModal");
    const modalTitle = document.getElementById("taskModalTitle");
    const taskForm = document.getElementById("taskForm");
    const statusSelect = document.getElementById("taskStatus");
    
    // Ensure subjects are loaded
    if (this.currentSubjects.length === 0) {
      this.loadSubjects();
    }
    
    if (modal && modalTitle && taskForm) {
      if (taskId) {
        // Edit mode
        modalTitle.textContent = "Edit Task";
        this.populateTaskForm(this.currentTasks.find(t => t.id == taskId));
      } else {
        // Add mode
        modalTitle.textContent = "Add New Task";
        taskForm.reset();
        
        // Set default status
        if (statusSelect) {
          statusSelect.value = defaultStatus;
        }
      }
      
      this.showModal("taskModal");
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
    }
  }

  showAddTaskModal(status = 'todo') {
    this.showTaskModal(null, status);
  }

  populateTaskForm(task) {
    document.getElementById("taskId").value = task.id;
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskDescription").value = task.description || "";
    document.getElementById("taskSubject").value = task.subject_id || "";
    document.getElementById("taskPriority").value = task.priority;
    document.getElementById("taskStatus").value = task.status;
    document.getElementById("taskDueDate").value = task.due_date || "";
  }

  handleTaskSubmit(e) {
    e.preventDefault();

    // Check if TaskManager is ready
    if (!this.isInitialized) {
      console.warn("TaskManager not yet initialized, retrying...");
      setTimeout(() => {
        if (this.isInitialized) {
          this.handleTaskSubmit(e);
        } else {
          window.bloomApp.showNotification("Sistem sedang memuat, silakan coba lagi", "error");
        }
      }, 100);
      return;
    }

    const formData = new FormData(e.target);
    const taskData = {
      id: formData.get("task_id"),
      title: formData.get("title"),
      description: formData.get("description"),
      subject_id: formData.get("subject_id") || null,
      priority: formData.get("priority"),
      status: formData.get("status"),
      due_date: formData.get("due_date") || null,
    };

    const action = taskData.id ? "update" : "create";

    console.log("Submitting task:", { action, taskData });

    this.showLoading();

    const requestBody = JSON.stringify({
      action: action,
      task: taskData,
    });
    
    console.log("Request body:", requestBody);

    fetch("api/tasks.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody,
    })
      .then((response) => {
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get response text first for debugging
        return response.text().then(text => {
          console.log("Raw response:", text);
          
          if (!text) {
            throw new Error('Empty response from server');
          }
          
          try {
            return JSON.parse(text);
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            console.error("Response text:", text);
            throw new Error('Invalid JSON response from server');
          }
        });
      })
      .then((data) => {
        this.hideLoading();
        if (data.success) {
          this.hideModal("taskModal");
          if (action === "create") {
            // Ambil id dari API (bisa data.task_id atau data.id)
            const newId = data.task_id || data.id || Date.now();
            const newTask = {
              ...taskData,
              id: newId,
              created_at: new Date().toISOString(),
              subject_name: this.getSubjectName(taskData.subject_id),
              subject_color: this.getSubjectColor(taskData.subject_id)
            };
            this.currentTasks.push(newTask);
            
            // Check if there's an active filter
            const filterSelect = document.getElementById('taskFilter');
            if (filterSelect && filterSelect.value !== 'all') {
              this.applyFilter(filterSelect.value);
            } else {
              this.renderTasks();
            }
            
            setTimeout(() => {
              const card = document.querySelector(`.task-card[data-task-id='${newTask.id}']`);
              if (card) card.classList.add('new');
            }, 100);
          } else {
            // Update existing task in array
            const taskIndex = this.currentTasks.findIndex(t => t.id == taskData.id);
            if (taskIndex !== -1) {
              this.currentTasks[taskIndex] = {
                ...this.currentTasks[taskIndex],
                ...taskData,
                subject_name: this.getSubjectName(taskData.subject_id),
                subject_color: this.getSubjectColor(taskData.subject_id)
              };
              
              // Check if there's an active filter
              const filterSelect = document.getElementById('taskFilter');
              if (filterSelect && filterSelect.value !== 'all') {
                this.applyFilter(filterSelect.value);
              } else {
                this.renderTasks();
              }
              
              setTimeout(() => {
                const card = document.querySelector(`.task-card[data-task-id='${taskData.id}']`);
                if (card) card.classList.add('updated');
              }, 100);
            }
          }
          // Handle XP reward if task was completed
          if (data.xp_result && data.xp_result.success) {
            this.showXPReward(data.xp_result.xp_result);
          }
          
          window.bloomApp.showNotification(
            action === "create" ? "Tugas berhasil dibuat" : "Tugas berhasil diperbarui"
          );
        } else {
          window.bloomApp.showNotification(data.message || "Gagal menyimpan tugas", "error");
        }
      })
      .catch((error) => {
        this.hideLoading();
        console.error("Error saving task:", error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        let errorMessage = "Error saving task";
        if (error.message.includes('JSON')) {
          errorMessage = "Server response error - please try again";
        } else if (error.message.includes('HTTP')) {
          errorMessage = `Server error (${error.message})`;
        }
        
        window.bloomApp.showNotification(errorMessage, "error");
      });
  }

  getSubjectName(subjectId) {
    if (!subjectId) return null;
    const subject = this.currentSubjects.find(s => s.id == subjectId);
    return subject ? subject.name : null;
  }

  getSubjectColor(subjectId) {
    if (!subjectId) return null;
    const subject = this.currentSubjects.find(s => s.id == subjectId);
    return subject ? subject.color : null;
  }

  editTask(taskId) {
    this.showTaskModal(taskId);
  }

  deleteTask(taskId) {
    const task = this.currentTasks.find(t => t.id == taskId);
    if (!task) return;

    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    this.showLoading();

    fetch("api/tasks.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "delete",
        id: taskId,
      }),
    })
      .then((response) => {
        console.log("Delete response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.text().then(text => {
          console.log("Delete raw response:", text);
          
          if (!text) {
            throw new Error('Empty response from server');
          }
          
          try {
            return JSON.parse(text);
          } catch (parseError) {
            console.error("Delete JSON parse error:", parseError);
            console.error("Delete response text:", text);
            throw new Error('Invalid JSON response from server');
          }
        });
      })
      .then((data) => {
        this.hideLoading();
        if (data.success) {
          // Remove task from current array
          this.currentTasks = this.currentTasks.filter(t => t.id != taskId);
          
          // Animate task removal
          const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
          if (taskCard) {
            taskCard.style.transition = 'all 0.3s ease-out';
            taskCard.style.opacity = '0';
            taskCard.style.transform = 'scale(0.8) translateY(-20px)';
            
            setTimeout(() => {
              // Check if there's an active filter
              const filterSelect = document.getElementById('taskFilter');
              if (filterSelect && filterSelect.value !== 'all') {
                this.applyFilter(filterSelect.value);
              } else {
                this.renderTasks();
              }
            }, 300);
          } else {
            // Check if there's an active filter
            const filterSelect = document.getElementById('taskFilter');
            if (filterSelect && filterSelect.value !== 'all') {
              this.applyFilter(filterSelect.value);
            } else {
              this.renderTasks();
            }
          }
          
          window.bloomApp.showNotification("Tugas berhasil dihapus");
        } else {
          window.bloomApp.showNotification(data.message || "Gagal menghapus tugas", "error");
        }
      })
      .catch((error) => {
        this.hideLoading();
        console.error("Error deleting task:", error);
        window.bloomApp.showNotification("Error deleting task", "error");
      });
  }

  updateTaskStatus(taskId, newStatus) {
    // Prevent multiple simultaneous requests for the same task
    const requestKey = `task_${taskId}_status`;
    if (this[requestKey]) {
      console.log(`Request already in progress for task ${taskId}`);
      return;
    }
    
    // Prevent rapid successive updates (debounce)
    const now = Date.now();
    const lastUpdate = this.lastStatusUpdate[taskId] || 0;
    if (now - lastUpdate < 1000) { // 1 second debounce
      console.log(`Status update too soon for task ${taskId}, ignoring`);
      return;
    }
    
    this.lastStatusUpdate[taskId] = now;
    this[requestKey] = true;
    
    const taskData = {
      id: taskId,
      status: newStatus
    };

    console.log(`Updating task status: ${taskId} -> ${newStatus}`);

    // Add visual feedback
    const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskCard) {
      taskCard.style.opacity = '0.7';
      taskCard.style.pointerEvents = 'none';
    }

    fetch("api/tasks.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "update_status",
        task: taskData,
      }),
    })
      .then((response) => {
        console.log("Status update response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.text().then(text => {
          console.log("Status update raw response:", text);
          
          if (!text) {
            throw new Error('Empty response from server');
          }
          
          try {
            return JSON.parse(text);
          } catch (parseError) {
            console.error("Status update JSON parse error:", parseError);
            console.error("Status update response text:", text);
            throw new Error('Invalid JSON response from server');
          }
        });
      })
      .then((data) => {
        if (data.success) {
          console.log(`Task status updated successfully: ${taskId} -> ${newStatus}`);
          
          // Update task in current array
          const taskIndex = this.currentTasks.findIndex(t => t.id == taskId);
          if (taskIndex !== -1) {
            this.currentTasks[taskIndex].status = newStatus;
          }
          
          // Check if there's an active filter
          const filterSelect = document.getElementById('taskFilter');
          if (filterSelect && filterSelect.value !== 'all') {
            this.applyFilter(filterSelect.value);
          } else {
            this.renderTasks();
          }
          
          // Handle XP reward if task was completed
          if (data.xp_result && data.xp_result.success) {
            this.showXPReward(data.xp_result.xp_result);
          }
          
          window.bloomApp.showNotification("Status tugas diperbarui");
        } else {
          window.bloomApp.showNotification(data.message || "Gagal memperbarui tugas", "error");
        }
      })
      .catch((error) => {
        console.error("Error updating task:", error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        let errorMessage = "Error updating task";
        if (error.message.includes('JSON')) {
          errorMessage = "Server response error - please try again";
        } else if (error.message.includes('HTTP')) {
          errorMessage = `Server error (${error.message})`;
        }
        
        window.bloomApp.showNotification(errorMessage, "error");
      })
      .finally(() => {
        // Clear the request flag
        this[requestKey] = false;
        
        // Restore visual feedback
        const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskCard) {
          taskCard.style.opacity = '';
          taskCard.style.pointerEvents = '';
        }
      });
  }

  applyFilter(filterType) {
    let filteredTasks = this.currentTasks;

    switch (filterType) {
      case 'all':
        filteredTasks = this.currentTasks;
        break;
      case 'high':
        filteredTasks = this.currentTasks.filter(t => t.priority === 'high');
        break;
      case 'medium':
        filteredTasks = this.currentTasks.filter(t => t.priority === 'medium');
        break;
      case 'low':
        filteredTasks = this.currentTasks.filter(t => t.priority === 'low');
        break;
      default:
        filteredTasks = this.currentTasks;
        break;
    }

    // Update filter display
    this.updateFilterDisplay(filterType);

    // Show notification about filter
    if (filterType !== 'all') {
      if (filteredTasks.length === 0) {
        window.bloomApp.showNotification(`Tidak ada tugas dengan prioritas ${filterType}`, 'error');
      } else {
                  window.bloomApp.showNotification(`Menampilkan ${filteredTasks.length} tugas dengan prioritas ${filterType}`);
      }
    }

    // Render filtered tasks with animation
    this.renderFilteredTasks(filteredTasks);
  }

  updateFilterDisplay(filterType) {
    // Update filter dropdown
    const filterSelect = document.getElementById('taskFilter');
    if (filterSelect) {
      filterSelect.value = filterType;
    }

    // Add visual indicator to show active filter
    const filterIndicator = document.querySelector('.filter-indicator');
    if (filterType !== 'all') {
      if (!filterIndicator) {
        const indicator = document.createElement('div');
        indicator.className = 'filter-indicator';
        indicator.innerHTML = `
          <span class="filter-label">Filter: ${filterType}</span>
          <button class="filter-close" onclick="clearFilter()" title="Clear filter">
            <i class="fa-solid fa-times"></i>
          </button>
        `;
        const actionsContainer = document.querySelector('.tasks-actions');
        if (actionsContainer) {
          actionsContainer.appendChild(indicator);
        }
      } else {
        const label = filterIndicator.querySelector('.filter-label');
        if (label) {
          label.textContent = `Filter: ${filterType}`;
        }
        filterIndicator.style.display = 'flex';
      }
    } else {
      if (filterIndicator) {
        filterIndicator.style.display = 'none';
      }
    }
  }

  renderFilteredTasks(filteredTasks) {
    // Jika filter priority, filteredTasks sudah hanya berisi task dengan priority tsb
    // Bagi ke kolom status
    const todoTasks = filteredTasks.filter(t => t.status === 'todo');
    const progressTasks = filteredTasks.filter(t => t.status === 'progress');
    const completedTasks = filteredTasks.filter(t => t.status === 'completed');

    // Fade out current tasks
    document.querySelectorAll('.task-card').forEach(card => {
      card.style.transition = 'all 0.3s ease-out';
      card.style.opacity = '0';
      card.style.transform = 'translateY(-10px)';
    });

    // Render new tasks after fade out
    setTimeout(() => {
      this.renderTaskColumn("todoTasks", todoTasks);
      this.renderTaskColumn("progressTasks", progressTasks);
      this.renderTaskColumn("completedTasks", completedTasks);
      
      this.updateCount('#todoColumn .task-count', todoTasks.length);
      this.updateCount('#progressColumn .task-count', progressTasks.length);
      this.updateCount('#completedColumn .task-count', completedTasks.length);

      // Add fade in animation for new tasks
      setTimeout(() => {
        document.querySelectorAll('.task-card').forEach((card, index) => {
          card.style.transition = 'all 0.4s ease-out';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        });
      }, 50);
    }, 300);
  }

  populateSubjectDropdown() {
    const select = document.getElementById("taskSubject");
    if (!select) return;
    const subjects = Array.isArray(this.currentSubjects) ? this.currentSubjects : [];
    select.innerHTML =
      '<option value="">Pilih Mata Pelajaran</option>' +
      subjects.map((subject) => `<option value="${subject.id}">${this.escapeHtml(subject.name)}</option>`).join("");
    
    console.log('Task subject dropdown populated with', subjects.length, 'subjects');
  }

  createQuickActionRipple(element, event) {
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

  extractTaskId(onclickAttr) {
    const match = onclickAttr.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  clearFilter() {
    // Reset filter dropdown
    const filterSelect = document.getElementById('taskFilter');
    if (filterSelect) {
      filterSelect.value = 'all';
    }

    // Remove active class from filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Hide filter indicator
    const filterIndicator = document.querySelector('.filter-indicator');
    if (filterIndicator) {
      filterIndicator.style.display = 'none';
    }

    // Clear search input
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = '';
    }

    // Kembalikan ke default: tampilkan semua task
    this.applyFilter('all');
    window.bloomApp.showNotification('Filter cleared');
  }

  // Helper function to check if filter is active
  isFilterActive() {
    const filterSelect = document.getElementById('taskFilter');
    return filterSelect && filterSelect.value !== 'all';
  }

  // Helper function to get current filter
  getCurrentFilter() {
    const filterSelect = document.getElementById('taskFilter');
    return filterSelect ? filterSelect.value : 'all';
  }

  filterByStatus(status) {
    // Update filter dropdown
    const filterSelect = document.getElementById('taskFilter');
    if (filterSelect) {
      filterSelect.value = status;
    }

    // Apply filter
    this.applyFilter(status);
  }

  // Helper function to refresh current view
  refreshCurrentView() {
    if (this.isFilterActive()) {
      this.applyFilter(this.getCurrentFilter());
    } else {
      this.renderTasks();
    }
  }

  // Utility methods
  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  showLoading() {
    // Create loading overlay if it doesn't exist
    let loadingOverlay = document.querySelector('.loading-overlay');
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
                      <span>Memuat...</span>
        </div>
      `;
      document.body.appendChild(loadingOverlay);
    }
    
    loadingOverlay.classList.add('show');
  }

  hideLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('show');
    }
  }

  showXPReward(xpResult) {
    // Create XP reward notification
    const rewardDiv = document.createElement('div');
    rewardDiv.className = 'xp-reward-notification';
    rewardDiv.innerHTML = `
      <div class="xp-reward-content">
        <div class="xp-reward-icon">⭐</div>
        <div class="xp-reward-text">
          <div class="xp-reward-title">+${xpResult.xp_added} XP!</div>
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
}

// Initialize Task Manager (single instance)
let taskManager = null;

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
    window.taskManager = taskManager;
    setupGlobalFunctions();
  });
} else {
  // DOM is already ready
  taskManager = new TaskManager();
  window.taskManager = taskManager;
  setupGlobalFunctions();
}

function setupGlobalFunctions() {
  // Global functions for onclick handlers
  window.showAddTaskModal = (status = 'todo') => {
    if (window.taskManager) {
      window.taskManager.showAddTaskModal(status);
    }
  };

  window.hideModal = (modalId) => {
    if (window.taskManager) {
      window.taskManager.hideModal(modalId);
    }
  };

  window.showModal = (modalId) => {
    if (window.taskManager) {
      window.taskManager.showModal(modalId);
    }
  };

  window.editTask = (taskId) => {
    if (window.taskManager) {
      window.taskManager.editTask(taskId);
    }
  };

  window.deleteTask = (taskId) => {
    if (window.taskManager) {
      window.taskManager.deleteTask(taskId);
    }
  };

  // Additional global functions
  window.applyFilter = (filter) => window.taskManager.applyFilter(filter);
  window.clearFilter = () => window.taskManager.clearFilter();
  window.refreshTasks = () => window.taskManager.refreshCurrentView();
}