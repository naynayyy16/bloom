// Enhanced Notes Manager - Rich Text, Search, and Animations
class NotesManager {
  constructor() {
    this.currentNotes = [];
    this.currentSubjects = [];
    this.activeEditor = null;
    this.searchTimeout = null;
    this.isInitialized = false;
    this.viewHistory = [];
    this.autoSaveTimeout = null;
    this.shortcuts = new Map();
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    document.addEventListener("DOMContentLoaded", () => {
      this.setupNotes();
      this.setupEditor();
      this.setupSearch();
      this.setupAnimations();
      this.setupKeyboardShortcuts();
      this.setupAutoSave();
      this.isInitialized = true;
    });
  }

  setupNotes() {
    this.loadNotes();
    this.loadSubjects();
    this.setupNoteEvents();
    this.setupFilters();
    this.setupDragAndDrop();
  }

  setupNoteEvents() {
    // Add note button
    const addNoteBtn = document.getElementById("addNoteBtn");
    if (addNoteBtn) {
      addNoteBtn.addEventListener("click", () => this.showNoteModal());
    }

    // Note form submission
    const noteForm = document.getElementById("noteForm");
    if (noteForm) {
      noteForm.addEventListener("submit", this.handleNoteSubmit.bind(this));
    }

    // Edit note from view modal
    const editNoteFromView = document.getElementById("editNoteFromView");
    if (editNoteFromView) {
      editNoteFromView.addEventListener("click", (e) => {
        const noteId = e.target.dataset.noteId;
        this.hideModal("noteViewModal");
        setTimeout(() => this.showNoteModal(noteId), 100);
      });
    }

    // Note card interactions
    this.setupNoteCardInteractions();
  }

  setupNoteCardInteractions() {
    document.addEventListener('click', (e) => {
      const noteCard = e.target.closest('.note-card');
      if (noteCard && !e.target.closest('.note-actions')) {
        const noteId = noteCard.dataset.noteId;
        this.viewNote(noteId);
        
        // Add to view history
        this.addToViewHistory(noteId);
        
        // Visual feedback
        noteCard.style.transform = 'scale(0.98)';
        setTimeout(() => {
          noteCard.style.transform = '';
        }, 150);
      }
      
      // Note action buttons
      if (e.target.matches('.note-action-btn[onclick*="editNote"]')) {
        e.preventDefault();
        e.stopPropagation();
        const noteId = this.extractNoteId(e.target.getAttribute('onclick'));
        this.editNote(noteId);
      }
      
      if (e.target.matches('.note-action-btn[onclick*="deleteNote"]')) {
        e.preventDefault();
        e.stopPropagation();
        const noteId = this.extractNoteId(e.target.getAttribute('onclick'));
        this.deleteNote(noteId);
      }
    });

    // Note card hover effects
    document.addEventListener('mouseenter', (e) => {
      const el = e.target;
      if (el && typeof el.closest === 'function') {
        const noteCard = el.closest('.note-card');
        if (noteCard) {
          this.animateNoteCardHover(noteCard, true);
        }
      }
    }, true);

    document.addEventListener('mouseleave', (e) => {
      const el = e.target;
      if (el && typeof el.closest === 'function') {
        const noteCard = el.closest('.note-card');
        if (noteCard) {
          this.animateNoteCardHover(noteCard, false);
        }
      }
    }, true);
  }

  animateNoteCardHover(noteCard, isHovering) {
    if (isHovering) {
      noteCard.style.transform = 'translateY(-6px) scale(1.02)';
      noteCard.style.boxShadow = 'var(--shadow-2xl)';
      
      // Animate note actions
      const actions = noteCard.querySelector('.note-actions');
      if (actions) {
        actions.style.opacity = '1';
        actions.style.transform = 'translateX(0)';
      }
      
      // Add subtle glow to title
      const title = noteCard.querySelector('.note-title');
      if (title) {
        title.style.color = 'var(--primary-color)';
      }
    } else {
      noteCard.style.transform = '';
      noteCard.style.boxShadow = '';
      
      const title = noteCard.querySelector('.note-title');
      if (title) {
        title.style.color = '';
      }
    }
  }

  setupEditor() {
    // Initialize Quill editor when modal opens
    document.addEventListener('modalOpened', (e) => {
      if (e.detail.modalId === 'noteModal' && !this.activeEditor) {
        this.initializeEditor();
      }
    });
  }

  initializeEditor() {
    if (typeof Quill === 'undefined') {
      console.warn('Quill editor not loaded');
      return;
    }

    // Clean up previous Quill instance and toolbar
    const editorContainer = document.getElementById('noteEditor');
    if (editorContainer) {
      editorContainer.innerHTML = '';
    }
    this.activeEditor = null;

    const toolbarOptions = [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      [{ 'align': [] }],
      ['clean']
    ];

    this.activeEditor = new Quill('#noteEditor', {
      theme: 'snow',
      placeholder: 'Start writing your note...',
      modules: {
        toolbar: toolbarOptions,
        history: {
          delay: 1000,
          maxStack: 50,
          userOnly: true
        }
      }
    });

    // Setup editor events
    this.setupEditorEvents();
  }

  setupEditorEvents() {
    if (!this.activeEditor) return;

    // Auto-save on content change
    this.activeEditor.on('text-change', () => {
      this.scheduleAutoSave();
    });

    // Word count and stats
    this.activeEditor.on('text-change', () => {
      this.updateEditorStats();
    });

    // Custom keyboard shortcuts
    this.activeEditor.keyboard.addBinding({
      key: 's',
      ctrlKey: true
    }, () => {
      this.saveCurrentNote();
      return false;
    });

    this.activeEditor.keyboard.addBinding({
      key: 'b',
      ctrlKey: true
    }, () => {
      const range = this.activeEditor.getSelection();
      if (range) {
        this.activeEditor.format('bold', !this.activeEditor.getFormat(range).bold);
      }
      return false;
    });
  }

  setupSearch() {
    const searchInput = document.querySelector('.notes-search-input');
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

    // Search suggestions
    this.setupSearchSuggestions(searchInput);
  }

  setupSearchSuggestions(searchInput) {
    const suggestionsContainer = this.createSearchSuggestions(searchInput);
    
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim()) {
        this.showSearchSuggestions(searchInput.value.trim());
      }
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        this.hideSearchSuggestions();
      }, 200);
    });
  }

  createSearchSuggestions(searchInput) {
    const container = searchInput.parentElement;
    const suggestions = document.createElement('div');
    suggestions.className = 'search-suggestions glass';
    suggestions.id = 'noteSearchSuggestions';
    
    suggestions.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--bg-glass-strong);
      backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      margin-top: var(--space-2);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.3s ease-out;
      z-index: var(--z-dropdown);
      max-height: 300px;
      overflow-y: auto;
    `;
    
    container.appendChild(suggestions);
    return suggestions;
  }

  performSearch(query) {
    if (!query) {
      this.renderNotes(this.currentNotes);
      this.hideSearchSuggestions();
      return;
    }

    const filteredNotes = this.currentNotes.filter(note => {
      const searchText = `${note.title} ${note.content}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    this.renderNotes(filteredNotes, query);
    this.showSearchSuggestions(query);
  }

  showSearchSuggestions(query) {
    const suggestions = document.getElementById('noteSearchSuggestions');
    if (!suggestions) return;

    const matches = this.getSearchSuggestions(query);
    
    if (matches.length > 0) {
      suggestions.innerHTML = matches.map((match, index) => `
        <div class="search-suggestion-item" onclick="notesManager.selectSearchSuggestion('${match.id}')" 
             style="opacity: 0; transform: translateY(10px);" data-index="${index}">
          <div class="suggestion-icon">
            <i class="fas fa-sticky-note"></i>
          </div>
          <div class="suggestion-content">
            <div class="suggestion-title">${this.highlightText(match.title, query)}</div>
            <div class="suggestion-preview">${this.highlightText(this.stripHtml(match.content).substring(0, 60), query)}...</div>
          </div>
        </div>
      `).join('');
      
      suggestions.style.opacity = '1';
      suggestions.style.visibility = 'visible';
      suggestions.style.transform = 'translateY(0)';
      
      // Animate suggestions in
      setTimeout(() => {
        const items = suggestions.querySelectorAll('.search-suggestion-item');
        items.forEach((item, index) => {
          setTimeout(() => {
            item.style.transition = 'all 0.2s ease-out';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          }, index * 50);
        });
      }, 10);
    } else {
      this.hideSearchSuggestions();
    }
  }

  getSearchSuggestions(query) {
    return this.currentNotes
      .filter(note => {
        const searchText = `${note.title} ${note.content}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      })
      .slice(0, 5);
  }

  highlightText(text, query) {
    if (!query) return this.escapeHtml(text);
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  hideSearchSuggestions() {
    const suggestions = document.getElementById('noteSearchSuggestions');
    if (suggestions) {
      suggestions.style.opacity = '0';
      suggestions.style.visibility = 'hidden';
      suggestions.style.transform = 'translateY(-10px)';
    }
  }

  selectSearchSuggestion(noteId) {
    this.viewNote(noteId);
    this.hideSearchSuggestions();
    
    // Clear search
    const searchInput = document.querySelector('.notes-search-input');
    if (searchInput) {
      searchInput.value = '';
    }
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
    let filteredNotes = this.currentNotes;

    switch (filterType) {
      case 'all':
        filteredNotes = this.currentNotes;
        break;
      case 'recent':
        filteredNotes = this.currentNotes
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 10);
        break;
      case 'favorites':
        filteredNotes = this.currentNotes.filter(note => note.is_favorite);
        break;
      case 'archived':
        filteredNotes = this.currentNotes.filter(note => note.is_archived);
        break;
    }

    this.renderNotes(filteredNotes);
  }

  setupAnimations() {
    // Intersection Observer for scroll animations
    if ('IntersectionObserver' in window) {
      this.setupScrollAnimations();
    }
    
    // Stagger note card animations
    this.setupStaggerAnimations();
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(30px)';
          
          setTimeout(() => {
            entry.target.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe note cards
    document.querySelectorAll('.note-card').forEach(card => {
      observer.observe(card);
    });
  }

  setupStaggerAnimations() {
    const noteCards = document.querySelectorAll('.note-card');
    noteCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.4s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            this.showNoteModal();
            break;
          case 'f':
            e.preventDefault();
            const searchInput = document.querySelector('.notes-search-input');
            if (searchInput) searchInput.focus();
            break;
          case 's':
            if (this.activeEditor) {
              e.preventDefault();
              this.saveCurrentNote();
            }
            break;
        }
      }
      
      if (e.key === 'Escape') {
        this.hideSearchSuggestions();
        
        // Close modals
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
          this.hideModal(openModal.id);
        }
      }
    });
  }

  setupAutoSave() {
    // Auto-save draft every 30 seconds
    setInterval(() => {
      if (this.activeEditor && this.hasUnsavedChanges()) {
        this.saveDraft();
      }
    }, 30000);
    
    // Save on page unload
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges()) {
        this.saveDraft();
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  setupDragAndDrop() {
    // Enable drag and drop for file uploads in editor
    document.addEventListener('dragover', (e) => {
      if (e.target.closest('.ql-editor')) {
        e.preventDefault();
        e.target.closest('.ql-editor').classList.add('drag-over');
      }
    });

    document.addEventListener('dragleave', (e) => {
      if (e.target.closest('.ql-editor')) {
        e.target.closest('.ql-editor').classList.remove('drag-over');
      }
    });

    document.addEventListener('drop', (e) => {
      const editor = e.target.closest('.ql-editor');
      if (editor) {
        e.preventDefault();
        editor.classList.remove('drag-over');
        this.handleFileDrop(e);
      }
    });
  }

  handleFileDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        this.insertImage(file);
      }
    });
  }

  insertImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const range = this.activeEditor.getSelection(true);
      this.activeEditor.insertEmbed(range.index, 'image', e.target.result);
    };
    reader.readAsDataURL(file);
  }

  loadNotes() {
    this.showLoading();

    fetch("api/notes.php?action=list")
      .then((response) => response.json())
      .then((data) => {
        this.hideLoading();
        if (data.success) {
          this.currentNotes = data.notes;
          this.renderNotes(this.currentNotes);
        } else {
          this.showNotification("Error loading notes", "error");
        }
      })
      .catch((error) => {
        this.hideLoading();
        console.error("Error loading notes:", error);
        this.showNotification("Error loading notes", "error");
      });
  }

  loadSubjects() {
    fetch("api/subjects.php")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          this.currentSubjects = data.data;
        } else {
          this.currentSubjects = [];
        }
        this.populateSubjectDropdown();
        console.log('Notes: Loaded', this.currentSubjects.length, 'subjects');
      })
      .catch((error) => {
        this.currentSubjects = [];
        this.populateSubjectDropdown();
        console.error("Error loading subjects:", error);
      });
  }

  renderNotes(notes = this.currentNotes, searchQuery = '') {
    const container = document.getElementById("notesGrid");
    if (!container) return;

    if (notes.length === 0) {
      container.innerHTML = this.getEmptyState(searchQuery);
      return;
    }

    container.innerHTML = notes.map((note, index) => `
      <div class="note-card" data-note-id="${note.id}" 
           style="animation-delay: ${index * 0.1}s"
           onclick="notesManager.viewNote(${note.id})">
        <div class="note-header">
          <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
          <div class="note-actions" onclick="event.stopPropagation()">
            <button class="note-action-btn" onclick="notesManager.editNote(${note.id})" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="note-action-btn" onclick="notesManager.deleteNote(${note.id})" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="note-content">
          ${searchQuery ? this.highlightText(this.stripHtml(note.content).substring(0, 200), searchQuery) : this.stripHtml(note.content).substring(0, 200)}
          ${note.content.length > 200 ? '<span class="read-more">... Read more</span>' : ""}
        </div>
        
        <div class="note-footer">
          <div class="note-meta">
            ${note.subject_name ? `
              <span class="note-subject-label" style="background: ${note.subject_color}">
                ${this.escapeHtml(note.subject_name)}
              </span>
            ` : ""}
            <span class="note-date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              ${this.formatDate(note.updated_at)}
            </span>
          </div>
        </div>
      </div>
    `).join("");

    // Re-setup animations for new cards
    setTimeout(() => {
      this.setupStaggerAnimations();
    }, 100);
  }

  getEmptyState(searchQuery) {
    if (searchQuery) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No notes found</h3>
          <p>No notes match "${this.escapeHtml(searchQuery)}". Try a different search term.</p>
        </div>
      `;
    }
    
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No notes yet</h3>
        <p>Start capturing your thoughts and ideas</p>
        <a href="#" class="empty-state-action" onclick="notesManager.showNoteModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create First Note
        </a>
      </div>
    `;
  }

  showNoteModal(noteId = null) {
    const modal = document.getElementById("noteModal");
    const form = document.getElementById("noteForm");
    const title = document.getElementById("noteModalTitle");

    // Ensure subjects are loaded
    if (this.currentSubjects.length === 0) {
      this.loadSubjects();
    }

    if (noteId) {
      const note = this.currentNotes.find((n) => n.id == noteId);
      if (note) {
        title.textContent = "Edit Note";
        this.populateNoteForm(note);
      }
    } else {
      title.textContent = "Create New Note";
      form.reset();
      document.getElementById("noteId").value = "";
      if (this.activeEditor) {
        this.activeEditor.root.innerHTML = "";
      }
    }

    this.showModal("noteModal");
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('modalOpened', {
      detail: { modalId: 'noteModal' }
    }));
  }

  populateNoteForm(note) {
    document.getElementById("noteId").value = note.id;
    document.getElementById("noteTitle").value = note.title;
    document.getElementById("noteSubject").value = note.subject_id || "";
    
    if (this.activeEditor) {
      this.activeEditor.root.innerHTML = note.content;
    }
  }

  handleNoteSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const noteData = {
      id: formData.get("note_id"),
      title: formData.get("title"),
      subject_id: formData.get("subject_id") || null,
      content: this.activeEditor ? this.activeEditor.root.innerHTML : '',
    };

    if (!noteData.title.trim()) {
      this.showNotification("Please enter a note title", "error");
      return;
    }

    if (!noteData.content.trim() || noteData.content === "<p><br></p>") {
      this.showNotification("Please enter note content", "error");
      return;
    }

    const action = noteData.id ? "update" : "create";
    this.saveNote(noteData, action);
  }

  saveNote(noteData, action) {
    this.showLoading();

    fetch("api/notes.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: action,
        note: noteData,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        this.hideLoading();
        if (data.success) {
          this.hideModal("noteModal");
          this.loadNotes();
          this.showNotification(
            action === "create" ? "Note created successfully" : "Note updated successfully"
          );
          
          // Clear auto-save
          this.clearAutoSave();
        } else {
          this.showNotification(data.message || "Error saving note", "error");
        }
      })
      .catch((error) => {
        this.hideLoading();
        console.error("Error saving note:", error);
        this.showNotification("Error saving note", "error");
      });
  }

  viewNote(noteId) {
    const note = this.currentNotes.find((n) => n.id == noteId);
    if (!note) return;

    document.getElementById("noteViewTitle").textContent = note.title;
    document.getElementById("noteViewContent").innerHTML = note.content;

    const metaHtml = `
      <div class="note-view-meta-item">
        <strong>Created:</strong> ${this.formatDateTime(note.created_at)}
      </div>
      <div class="note-view-meta-item">
        <strong>Updated:</strong> ${this.formatDateTime(note.updated_at)}
      </div>
      ${note.subject_name ? `
        <div class="note-view-meta-item">
          <strong>Subject:</strong> 
          <span style="color: ${note.subject_color}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            ${this.escapeHtml(note.subject_name)}
          </span>
        </div>
      ` : ""}
    `;
    document.getElementById("noteViewMeta").innerHTML = metaHtml;

    // Set note ID for edit button
    document.getElementById("editNoteFromView").dataset.noteId = noteId;

    this.showModal("noteViewModal");
  }

  editNote(noteId) {
    this.showNoteModal(noteId);
  }

  deleteNote(noteId) {
    const note = this.currentNotes.find((n) => n.id == noteId);
    if (!note) return;

    if (!confirm(`Are you sure you want to delete "${note.title}"?`)) {
      return;
    }

    this.showLoading();

    fetch("api/notes.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "delete",
        id: noteId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        this.hideLoading();
        if (data.success) {
          // Animate note removal
          const noteCard = document.querySelector(`[data-note-id="${noteId}"]`);
          if (noteCard) {
            noteCard.style.transition = 'all 0.3s ease-out';
            noteCard.style.opacity = '0';
            noteCard.style.transform = 'scale(0.8) translateY(-20px)';
            
            setTimeout(() => {
              this.loadNotes();
            }, 300);
          } else {
            this.loadNotes();
          }
          
          this.showNotification("Note deleted successfully");
        } else {
          this.showNotification(data.message || "Error deleting note", "error");
        }
      })
      .catch((error) => {
        this.hideLoading();
        console.error("Error deleting note:", error);
        this.showNotification("Error deleting note", "error");
      });
  }

  populateSubjectDropdown() {
    const select = document.getElementById("noteSubject");
    if (!select) return;

    const subjects = Array.isArray(this.currentSubjects) ? this.currentSubjects : [];
    select.innerHTML =
      '<option value="">Pilih Mata Pelajaran (Opsional)</option>' +
      subjects
        .map((subject) => `<option value="${subject.id}">${this.escapeHtml(subject.name)}</option>`)
        .join("");
    
    console.log('Subject dropdown populated with', subjects.length, 'subjects');
  }

  // Auto-save functionality
  scheduleAutoSave() {
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(() => {
      this.saveDraft();
    }, 5000); // Save draft after 5 seconds of inactivity
  }

  saveDraft() {
    if (!this.activeEditor) return;
    
    const noteData = {
      title: document.getElementById("noteTitle")?.value || 'Untitled',
      content: this.activeEditor.root.innerHTML,
      is_draft: true
    };
    
    localStorage.setItem('note_draft', JSON.stringify(noteData));
  }

  loadDraft() {
    const draft = localStorage.getItem('note_draft');
    if (draft) {
      try {
        const noteData = JSON.parse(draft);
        if (confirm('You have an unsaved draft. Would you like to restore it?')) {
          document.getElementById("noteTitle").value = noteData.title;
          if (this.activeEditor) {
            this.activeEditor.root.innerHTML = noteData.content;
          }
        }
        localStorage.removeItem('note_draft');
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }

  clearAutoSave() {
    clearTimeout(this.autoSaveTimeout);
    localStorage.removeItem('note_draft');
  }

  hasUnsavedChanges() {
    return this.activeEditor && this.activeEditor.getLength() > 1;
  }

  saveCurrentNote() {
    const form = document.getElementById("noteForm");
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }

  updateEditorStats() {
    if (!this.activeEditor) return;
    
    const text = this.activeEditor.getText();
    const wordCount = text.trim().split(/\s+/).length;
    const charCount = text.length;
    
    // Update stats display if exists
    const statsElement = document.getElementById('editorStats');
    if (statsElement) {
      statsElement.textContent = `${wordCount} words, ${charCount} characters`;
    }
  }

  addToViewHistory(noteId) {
    this.viewHistory = this.viewHistory.filter(id => id !== noteId);
    this.viewHistory.unshift(noteId);
    this.viewHistory = this.viewHistory.slice(0, 10); // Keep only last 10
  }

  extractNoteId(onclickAttr) {
    const match = onclickAttr.match(/\d+/);
    return match ? parseInt(match[0]) : null;
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
  stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

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

  formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  showModal(modalId) {
    if (window.bloomApp) {
      window.bloomApp.openModal(modalId);
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal && window.bloomApp) {
      window.bloomApp.closeModal(modal);
    }
  }
}

// Add search suggestions CSS
const searchStyles = `
<style>
.search-suggestion-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-radius: var(--radius-lg);
  margin: var(--space-1);
}

.search-suggestion-item:hover {
  background: var(--bg-secondary);
  transform: translateX(4px);
}

.suggestion-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--text-secondary);
}

.suggestion-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.suggestion-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.suggestion-preview {
  font-size: 11px;
  color: var(--text-tertiary);
  line-height: 1.3;
}

.suggestion-title mark,
.suggestion-preview mark {
  background: rgba(255, 235, 59, 0.3);
  color: var(--text-primary);
  font-weight: 600;
  padding: 0 2px;
  border-radius: 2px;
}

.ql-editor.drag-over {
  border: 2px dashed var(--primary-color);
  background: rgba(47, 52, 55, 0.05);
}

#editorStats {
  position: absolute;
  bottom: var(--space-2);
  right: var(--space-3);
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--bg-glass);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  backdrop-filter: blur(10px);
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', searchStyles);

// Initialize Notes Manager
const notesManager = new NotesManager();

// Export for global access
window.notesManager = notesManager;