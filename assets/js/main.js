// Enhanced Interactive Experience - Notion-Inspired
class BloomApp {
  constructor() {
    this.isInitialized = false;
    this.currentPage = "dashboard";
    this.animations = new Map();
    this.observers = new Map();
    this.touchStartX = 0;
    this.touchStartY = 0;
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    document.addEventListener("DOMContentLoaded", () => {
      this.setupCore();
      this.setupAnimations();
      this.setupInteractions();
      this.setupGestures();
      this.setupObservers();
      this.isInitialized = true;
    });
  }

  setupCore() {
    // Initialize page
    const urlParams = new URLSearchParams(window.location.search);
    this.currentPage = urlParams.get("page") || "dashboard";
    
    // Add page transition class
    const pageContent = document.querySelector(".page-content");
    if (pageContent) {
      pageContent.classList.add("animate-fade-in");
    }

    // Setup user menu
    this.setupUserMenu();
    
    // Setup search
    this.setupSearch();
    
    // Setup modals
    this.setupModals();
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Setup outside click handling
    document.addEventListener("click", this.handleOutsideClick.bind(this));
  }

  setupAnimations() {
    // Enhanced ripple effect
    this.setupRippleEffect();
    
    // Smooth scroll to top
    this.setupSmoothScroll();
    
    // Page transition animations
    this.setupPageTransitions();
    
    // Loading animations
    this.setupLoadingAnimations();
    
    // Parallax effects (subtle)
    this.setupParallax();
    
    // Hover animations
    this.setupHoverAnimations();
  }

  setupRippleEffect() {
    document.addEventListener('click', (e) => {
      const element = e.target.closest('.btn, .card, .user-trigger, .interactive');
      
      if (element && !element.classList.contains('no-ripple')) {
        this.createRipple(element, e);
      }
    });
  }

  createRipple(element, event) {
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
    `;
    ripple.classList.add('ripple');
    
    element.appendChild(ripple);
    
    // Enhanced ripple with multiple waves
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.remove();
      }
    }, 600);
    
    // Create secondary wave
    setTimeout(() => {
      if (element.contains(ripple)) {
        const secondWave = ripple.cloneNode();
        secondWave.style.animationDelay = '0.1s';
        secondWave.style.opacity = '0.5';
        element.appendChild(secondWave);
        
        setTimeout(() => {
          if (secondWave.parentNode) {
            secondWave.remove();
          }
        }, 700);
      }
    }, 100);
  }

  setupUserMenu() {
    const userTrigger = document.getElementById("userTrigger");
    const userDropdownMenu = document.getElementById("userDropdownMenu");

    if (userTrigger && userDropdownMenu) {
      userTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleUserMenu();
      });

      // Enhanced dropdown animation
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const isShowing = userDropdownMenu.classList.contains('show');
            if (isShowing) {
              this.animateDropdownItems(userDropdownMenu);
            }
          }
        });
      });
      
      observer.observe(userDropdownMenu, { attributes: true });
    }
  }

  toggleUserMenu() {
    const userTrigger = document.getElementById("userTrigger");
    const userDropdownMenu = document.getElementById("userDropdownMenu");
    
    if (!userTrigger || !userDropdownMenu) return;
    
    const isOpen = userDropdownMenu.classList.contains('show');
    
    // Close all dropdowns first
    this.closeAllDropdowns();
    
    // Toggle user dropdown with enhanced animation
    if (!isOpen) {
      userTrigger.classList.add('active');
      userDropdownMenu.classList.add('show');
      
      // Add stagger animation to dropdown items
      this.animateDropdownItems(userDropdownMenu);
    }
  }

  animateDropdownItems(dropdown) {
    const items = dropdown.querySelectorAll('.user-dropdown-item');
    items.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-10px)';
      
      setTimeout(() => {
        item.style.transition = 'all 0.2s ease-out';
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      }, index * 50);
    });
  }

  closeAllDropdowns() {
    const userTrigger = document.getElementById("userTrigger");
    const userDropdownMenu = document.getElementById("userDropdownMenu");
    
    if (userDropdownMenu) {
      userDropdownMenu.classList.remove('show');
    }
    if (userTrigger) {
      userTrigger.classList.remove('active');
    }
  }

  setupSearch() {
    const searchInput = document.getElementById("searchInput");
    
    if (searchInput) {
      let searchTimeout;
      
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length > 0) {
          searchTimeout = setTimeout(() => {
            this.performSearch(query);
          }, 300);
        } else {
          this.hideSearchSuggestions();
        }
      });
      
      searchInput.addEventListener("focus", () => {
        searchInput.parentElement.classList.add('search-focused');
      });
      
      searchInput.addEventListener("blur", () => {
        searchInput.parentElement.classList.remove('search-focused');
        setTimeout(() => {
          this.hideSearchSuggestions();
        }, 200);
      });
      
      // Search shortcut (Ctrl/Cmd + K)
      document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          searchInput.focus();
        }
      });
      
      // Keyboard navigation for search suggestions
      searchInput.addEventListener("keydown", (e) => {
        const suggestions = document.getElementById("searchSuggestions");
        if (!suggestions || !suggestions.classList.contains("show")) return;
        
        const items = suggestions.querySelectorAll('.search-suggestion-item');
        const currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
        
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            this.navigateSearchSuggestions(items, currentIndex, 1);
            break;
          case 'ArrowUp':
            e.preventDefault();
            this.navigateSearchSuggestions(items, currentIndex, -1);
            break;
          case 'Enter':
            e.preventDefault();
            if (currentIndex >= 0 && items[currentIndex]) {
              items[currentIndex].click();
            }
            break;
          case 'Escape':
            this.hideSearchSuggestions();
            searchInput.blur();
            break;
        }
      });
      
      // Clear keyboard selection on mouse hover
      document.addEventListener("mouseover", (e) => {
        const item = e.target.closest('.search-suggestion-item');
        if (item) {
          const suggestions = document.getElementById("searchSuggestions");
          if (suggestions) {
            suggestions.querySelectorAll('.search-suggestion-item').forEach(i => i.classList.remove('selected'));
          }
        }
      });
    }
  }

  performSearch(query) {
    // Show loading state
    this.showSearchLoading();
    
    // Enhanced search with real API
    fetch(`api/search.php?q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.showSearchSuggestions(data.results, query);
        } else {
          this.showSearchSuggestions([], query);
        }
      })
      .catch(error => {
        console.error('Search error:', error);
        this.showSearchSuggestions([], query);
      });
  }

  showSearchLoading() {
    let searchSuggestions = document.getElementById("searchSuggestions");
    
    if (!searchSuggestions) {
      searchSuggestions = this.createSearchSuggestions();
    }
    
    searchSuggestions.innerHTML = `
      <div class="search-loading">
        <div class="search-loading-spinner"></div>
                        <span class="search-loading-text">Mencari...</span>
      </div>
    `;
    searchSuggestions.classList.add("show");
  }

  getSearchSuggestions(query) {
    // This method is now deprecated - using performSearch instead
    return [];
  }

  showSearchSuggestions(results, query = '') {
    let searchSuggestions = document.getElementById("searchSuggestions");
    
    if (!searchSuggestions) {
      searchSuggestions = this.createSearchSuggestions();
    }
    
    if (results.length > 0) {
      // Group results by type
      const groupedResults = this.groupSearchResults(results);
      
      searchSuggestions.innerHTML = this.renderGroupedSearchResults(groupedResults, query);
      searchSuggestions.classList.add("show");
      
      // Animate suggestions in
      setTimeout(() => {
        const items = searchSuggestions.querySelectorAll('.search-suggestion-item');
        items.forEach((item, index) => {
          setTimeout(() => {
            item.style.transition = 'all 0.2s ease-out';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          }, index * 30);
        });
      }, 10);
    } else if (query.trim().length > 0) {
      // Show no results state
      searchSuggestions.innerHTML = `
        <div class="search-no-results">
          <div class="no-results-icon">
            <i class="fa-solid fa-search"></i>
          </div>
          <div class="no-results-content">
            <span class="no-results-title">No results found</span>
            <span class="no-results-subtitle">Try different keywords or check your spelling</span>
          </div>
        </div>
      `;
      searchSuggestions.classList.add("show");
    } else {
      this.hideSearchSuggestions();
    }
  }

  groupSearchResults(results) {
    const grouped = {
      tasks: [],
      notes: [],
      subjects: []
    };
    
    results.forEach(item => {
      if (grouped[item.type + 's']) {
        grouped[item.type + 's'].push(item);
      }
    });
    
    return grouped;
  }

  renderGroupedSearchResults(groupedResults, query) {
    let html = '';
    
    // Render subjects first (most important)
    if (groupedResults.subjects.length > 0) {
      html += this.renderSearchSection('Subjects', groupedResults.subjects, query, 'book', 'subject');
    }
    
    // Render tasks
    if (groupedResults.tasks.length > 0) {
      html += this.renderSearchSection('Tasks', groupedResults.tasks, query, 'list-check', 'task');
    }
    
    // Render notes
    if (groupedResults.notes.length > 0) {
      html += this.renderSearchSection('Notes', groupedResults.notes, query, 'note-sticky', 'note');
    }
    
    return html;
  }

  renderSearchSection(title, items, query, icon, type) {
    return `
      <div class="search-section">
        <div class="search-section-header">
          <i class="fa-solid fa-${icon}"></i>
          <span class="search-section-title">${title}</span>
          <span class="search-section-count">${items.length}</span>
        </div>
        <div class="search-section-items">
          ${items.map((item, index) => `
            <div class="search-suggestion-item" style="opacity: 0; transform: translateY(10px);" 
                 onclick="selectSuggestion('${type}', ${item.id})" data-index="${index}">
              <div class="suggestion-icon" style="${item.color || item.subject_color ? `background: ${item.color || item.subject_color}; color: white;` : ''}">
                <i class="fa-solid fa-${icon}"></i>
              </div>
              <div class="suggestion-content">
                <span class="suggestion-title">${this.highlightSearchText(item.title, query)}</span>
                <div class="suggestion-details">
                  ${this.renderSuggestionDetails(item, type)}
                </div>
              </div>
              <div class="suggestion-action">
                <i class="fa-solid fa-arrow-right"></i>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderSuggestionDetails(item, type) {
    switch(type) {
      case 'task':
        const statusBadge = this.getStatusBadge(item.status);
        const priorityBadge = this.getPriorityBadge(item.priority);
        const dueDate = item.due_date ? this.formatDate(item.due_date) : null;
        
        return `
          <div class="suggestion-meta">
            ${item.subject_name ? `<span class="suggestion-subject">${item.subject_name}</span>` : ''}
            ${statusBadge}
            ${priorityBadge}
            ${dueDate ? `<span class="suggestion-date">Due: ${dueDate}</span>` : ''}
          </div>
        `;
        
      case 'note':
        const updatedDate = item.updated_at ? this.formatDate(item.updated_at) : null;
        return `
          <div class="suggestion-meta">
            ${item.subject_name ? `<span class="suggestion-subject">${item.subject_name}</span>` : ''}
            ${item.content_preview ? `<span class="suggestion-preview">${item.content_preview}</span>` : ''}
            ${updatedDate ? `<span class="suggestion-date">Updated: ${updatedDate}</span>` : ''}
          </div>
        `;
        
      case 'subject':
        const progress = item.total_tasks > 0 ? Math.round((item.completed_tasks / item.total_tasks) * 100) : 0;
        return `
          <div class="suggestion-meta">
            ${item.description ? `<span class="suggestion-description">${item.description}</span>` : ''}
            <span class="suggestion-stats">${item.completed_tasks}/${item.total_tasks} tasks (${progress}%)</span>
          </div>
        `;
        
      default:
        return '';
    }
  }

  getStatusBadge(status) {
    const statusMap = {
      'todo': { text: 'To Do', class: 'status-todo' },
      'progress': { text: 'In Progress', class: 'status-progress' },
      'completed': { text: 'Completed', class: 'status-completed' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-default' };
    return `<span class="suggestion-badge ${statusInfo.class}">${statusInfo.text}</span>`;
  }

  getPriorityBadge(priority) {
    const priorityMap = {
      'high': { text: 'High', class: 'priority-high' },
      'medium': { text: 'Medium', class: 'priority-medium' },
      'low': { text: 'Low', class: 'priority-low' }
    };
    
    const priorityInfo = priorityMap[priority] || { text: priority, class: 'priority-default' };
    return `<span class="suggestion-badge ${priorityInfo.class}">${priorityInfo.text}</span>`;
  }

  highlightSearchText(text, query) {
    if (!query) return this.escapeHtml(text);
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return this.escapeHtml(text).replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  navigateSearchSuggestions(items, currentIndex, direction) {
    // Remove current selection
    items.forEach(item => item.classList.remove('selected'));
    
    // Calculate new index
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;
    
    // Add selection to new item
    if (items[newIndex]) {
      items[newIndex].classList.add('selected');
      items[newIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  createSearchSuggestions() {
    const searchContainer = document.querySelector('.search-container');
    const suggestions = document.createElement('div');
    suggestions.id = 'searchSuggestions';
    suggestions.className = 'search-suggestions glass-strong';
    searchContainer.appendChild(suggestions);
    return suggestions;
  }

  hideSearchSuggestions() {
    const searchSuggestions = document.getElementById("searchSuggestions");
    if (searchSuggestions) {
      searchSuggestions.classList.remove("show");
    }
  }

  setupModals() {
    // Modal triggers
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-modal]');
      if (trigger) {
        e.preventDefault();
        const modalId = trigger.getAttribute('data-modal');
        this.openModal(modalId);
      }
      
      const closeBtn = e.target.closest('.modal-close, .modal-overlay');
      if (closeBtn) {
        e.preventDefault();
        const modal = closeBtn.closest('.modal');
        if (modal) {
          this.closeModal(modal);
        }
      }
    });
    
    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
          this.closeModal(openModal);
        }
      }
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Enhanced modal animation
    const content = modal.querySelector('.modal-content');
    if (content) {
      content.style.transform = 'translateY(40px) scale(0.95)';
      content.style.opacity = '0';
      
      setTimeout(() => {
        content.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        content.style.transform = 'translateY(0) scale(1)';
        content.style.opacity = '1';
      }, 10);
    }
    
    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('input, textarea, select');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  closeModal(modal) {
    const content = modal.querySelector('.modal-content');
    if (content) {
      content.style.transform = 'translateY(20px) scale(0.95)';
      content.style.opacity = '0';
    }
    
    setTimeout(() => {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }, 200);
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.focus();
            break;
          case 'n':
            e.preventDefault();
            // New task/note shortcut
            const addBtn = document.querySelector('[data-modal]:not([style*="display: none"])');
            if (addBtn) addBtn.click();
            break;
        }
      }
      
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
      }
    });
  }

  setupInteractions() {
    // Enhanced hover effects for cards
    document.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.card');
      if (card) {
        this.enhanceCardHover(card, true);
      }
    });
    
    document.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.card');
      if (card) {
        this.enhanceCardHover(card, false);
      }
    });
    
    // Button interactions
    this.setupButtonInteractions();
    
    // Form interactions
    this.setupFormInteractions();
  }

  enhanceCardHover(card, isHovering) {
    if (isHovering) {
      card.style.transform = 'translateY(-4px) scale(1.02)';
      card.style.boxShadow = 'var(--shadow-xl)';
      
      // Add subtle glow effect
      card.style.background = 'var(--bg-glass-strong)';
    } else {
      card.style.transform = '';
      card.style.boxShadow = '';
      card.style.background = '';
    }
  }

  setupButtonInteractions() {
    document.addEventListener('mousedown', (e) => {
      const btn = e.target.closest('.btn');
      if (btn) {
        btn.style.transform = 'scale(0.95)';
      }
    });
    
    document.addEventListener('mouseup', (e) => {
      const btn = e.target.closest('.btn');
      if (btn) {
        setTimeout(() => {
          btn.style.transform = '';
        }, 100);
      }
    });
  }

  setupFormInteractions() {
    // Enhanced focus effects for form inputs
    document.addEventListener('focusin', (e) => {
      const input = e.target.closest('.form-input, .form-select, .form-textarea');
      if (input) {
        const group = input.closest('.form-group');
        if (group) {
          group.classList.add('focused');
        }
      }
    });
    
    document.addEventListener('focusout', (e) => {
      const input = e.target.closest('.form-input, .form-select, .form-textarea');
      if (input) {
        const group = input.closest('.form-group');
        if (group) {
          group.classList.remove('focused');
        }
      }
    });
    
    // Auto-resize textareas
    document.addEventListener('input', (e) => {
      if (e.target.matches('.form-textarea')) {
        this.autoResizeTextarea(e.target);
      }
    });
  }

  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
  }

  setupGestures() {
    // Touch gestures for mobile
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      if (!this.touchStartX || !this.touchStartY) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = this.touchStartX - touchEndX;
      const deltaY = this.touchStartY - touchEndY;
      
      // Horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // Swipe left
          this.handleSwipeLeft();
        } else {
          // Swipe right
          this.handleSwipeRight();
        }
      }
      
      this.touchStartX = 0;
      this.touchStartY = 0;
    }, { passive: true });
  }

  handleSwipeLeft() {
    // Close dropdowns/modals on swipe left
    this.closeAllDropdowns();
  }

  handleSwipeRight() {
    // Could implement navigation or other features
  }

  setupObservers() {
    // Intersection Observer for animations
    if ('IntersectionObserver' in window) {
      this.setupScrollAnimations();
    }
    
    // Performance observer for monitoring
    if ('PerformanceObserver' in window) {
      this.setupPerformanceMonitoring();
    }
  }

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, observerOptions);
    
    // Observe elements that should animate on scroll
    document.querySelectorAll('.card, .btn, .stat-item').forEach(el => {
      observer.observe(el);
    });
  }

  setupPerformanceMonitoring() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          console.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
      }
    });
    
    observer.observe({ entryTypes: ['measure'] });
  }

  setupParallax() {
    let ticking = false;
    
    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.parallax');
      
      parallaxElements.forEach(element => {
        const speed = element.dataset.speed || 0.5;
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
      
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    });
  }

  setupHoverAnimations() {
    // Magnetic effect for buttons
    document.addEventListener('mousemove', (e) => {
      const magnetic = e.target.closest('.btn-primary, .logo');
      if (magnetic) {
        const rect = magnetic.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.1;
        const deltaY = (e.clientY - centerY) * 0.1;
        
        magnetic.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      }
    });
    
    document.addEventListener('mouseleave', (e) => {
      const magnetic = (e.target instanceof Element) ? e.target.closest('.btn-primary, .logo') : null;
      if (magnetic) {
        magnetic.style.transform = '';
      }
    });
  }

  setupSmoothScroll() {
    // Smooth scroll to top functionality
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    if (scrollToTopBtn) {
      scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }

    // Smooth scroll for anchor links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  }

  setupPageTransitions() {
    // Smooth page transitions
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href*="?page="]');
      if (link && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.transitionToPage(link.href);
      }
    });
  }

  transitionToPage(url) {
    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
      pageContent.style.opacity = '0';
      pageContent.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        window.location.href = url;
      }, 200);
    } else {
      window.location.href = url;
    }
  }

  setupLoadingAnimations() {
    // Enhanced loading states
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      this.showLoadingState();
      return originalFetch(...args)
        .finally(() => {
          setTimeout(() => this.hideLoadingState(), 300);
        });
    };
  }

  showLoadingState() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
      loader.classList.add('show');
    }
  }

  hideLoadingState() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
      loader.classList.remove('show');
    }
  }

  handleOutsideClick(e) {
    // Close dropdowns when clicking outside
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && !userMenu.contains(e.target)) {
      this.closeAllDropdowns();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility methods for other modules
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Initialize the app
const bloomApp = new BloomApp();

// Export for global access
window.bloomApp = bloomApp;
window.showNotification = bloomApp.showNotification.bind(bloomApp);
window.formatDate = bloomApp.formatDate.bind(bloomApp);
window.formatDateTime = bloomApp.formatDateTime.bind(bloomApp);

// Additional CSS for enhanced effects
const enhancedStyles = `
<style>
/* Enhanced Search Suggestions */
.search-suggestions.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* Search Sections */
.search-section {
  margin-bottom: var(--space-4);
}

.search-section:last-child {
  margin-bottom: 0;
}

.search-section-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-2);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-section-header i {
  font-size: 11px;
  color: var(--text-tertiary);
}

.search-section-title {
  flex: 1;
}

.search-section-count {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
}

.search-section-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.search-suggestion-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
}

.search-suggestion-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-secondary);
  opacity: 0;
  transition: opacity var(--transition-fast);
  z-index: 0;
}

.search-suggestion-item:hover::before,
.search-suggestion-item.selected::before {
  opacity: 1;
}

.search-suggestion-item:hover,
.search-suggestion-item.selected {
  transform: translateX(4px);
}

.search-suggestion-item.selected {
  background: var(--primary-light);
  border: 1px solid var(--primary-color);
}

.search-suggestion-item > * {
  position: relative;
  z-index: 1;
}

.suggestion-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  font-size: 14px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.search-suggestion-item:hover .suggestion-icon {
  background: var(--primary-color);
  color: var(--text-inverse);
  transform: scale(1.1);
}

.suggestion-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 2px;
}

.suggestion-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.suggestion-subject {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.suggestion-preview {
  font-size: 11px;
  color: var(--text-tertiary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.suggestion-description {
  font-size: 11px;
  color: var(--text-tertiary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.suggestion-stats {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.suggestion-date {
  font-size: 10px;
  color: var(--text-tertiary);
  font-weight: 400;
}

.suggestion-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-todo {
  background: var(--warning-light);
  color: var(--warning-color);
}

.status-progress {
  background: var(--info-light);
  color: var(--info-color);
}

.status-completed {
  background: var(--success-light);
  color: var(--success-color);
}

.status-default {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.priority-high {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
}

.priority-medium {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
}

.priority-low {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.priority-default {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.suggestion-action {
  opacity: 0;
  transition: all var(--transition-fast);
  color: var(--text-tertiary);
  font-size: 12px;
}

.search-suggestion-item:hover .suggestion-action {
  opacity: 1;
  color: var(--text-secondary);
  transform: translateX(2px);
}

/* Search Highlight */
.search-highlight {
  background: var(--primary-light);
  color: var(--primary-color);
  padding: 1px 2px;
  border-radius: var(--radius-xs);
  font-weight: 600;
}

/* No Results State */
.search-no-results {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6) var(--space-4);
  text-align: center;
}

.no-results-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-xl);
  font-size: 20px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.no-results-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  text-align: left;
}

.no-results-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.no-results-subtitle {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.4;
}

/* Search Loading State */
.search-loading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-4);
  justify-content: center;
}

.search-loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-primary);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.search-loading-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Search focused state */
.search-container.search-focused .search-input {
  transform: translateY(-1px) scale(1.02);
  box-shadow: var(--shadow-focus), var(--shadow-md);
}

/* Form group focused state */
.form-group.focused .form-label {
  color: var(--border-focus);
  transform: translateY(-2px);
}

/* Enhanced animations */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.pulse {
  animation: pulse 2s infinite;
}

/* Magnetic effect */
.btn-primary {
  transition: transform 0.3s ease-out;
}

/* Parallax elements */
.parallax {
  will-change: transform;
}

/* Performance optimizations */
.card, .btn, .modal-content {
  will-change: transform;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .search-suggestions {
    left: -var(--space-4);
    right: -var(--space-4);
  }
  
  .search-section-header {
    font-size: 11px;
    padding: var(--space-1) var(--space-2);
  }
  
  .suggestion-icon {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .suggestion-title {
    font-size: 13px;
  }
  
  .suggestion-meta {
    gap: var(--space-1);
  }
  
  .suggestion-preview,
  .suggestion-description {
    max-width: 150px;
  }
  
  .suggestion-badge {
    font-size: 9px;
    padding: 1px 4px;
  }
  
  .search-no-results {
    flex-direction: column;
    text-align: center;
    gap: var(--space-3);
  }
  
  .no-results-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
}
</style>
`;

// Inject enhanced styles
document.head.insertAdjacentHTML('beforeend', enhancedStyles);

// Global utility functions
window.selectSuggestion = function(type, id) {
  // Hide search suggestions
  const searchSuggestions = document.getElementById("searchSuggestions");
  if (searchSuggestions) {
    searchSuggestions.classList.remove("show");
  }
  
  // Clear search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.value = '';
  }
  
  // Navigate to appropriate page
  switch(type) {
    case 'task':
      window.location.href = `?page=tasks&highlight=${id}`;
      break;
    case 'note':
      window.location.href = `?page=notes&highlight=${id}`;
      break;
    case 'subject':
      window.location.href = `?page=subjects&highlight=${id}`;
      break;
  }
};

window.showModal = function(modalId) {
  bloomApp.openModal(modalId);
};

window.hideModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    bloomApp.closeModal(modal);
  }
};

window.showLoading = function() {
  bloomApp.showLoadingState();
};

window.hideLoading = function() {
  bloomApp.hideLoadingState();
};

// Performance monitoring
if (typeof performance !== 'undefined' && performance.mark) {
  performance.mark('bloom-app-start');
  
  window.addEventListener('load', () => {
    performance.mark('bloom-app-end');
    performance.measure('bloom-app-load', 'bloom-app-start', 'bloom-app-end');
  });
}