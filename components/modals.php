<!-- Task Modal -->
<div id="taskModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title" id="taskModalTitle">Add New Task</h3>
            <button class="modal-close" type="button">&times;</button>
        </div>
        <div class="modal-body">
            <form id="taskForm">
                <input type="hidden" id="taskId" name="task_id">
                
                <div class="form-group">
                    <label class="form-label" for="taskTitle">Title</label>
                    <input type="text" id="taskTitle" name="title" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="taskDescription">Description</label>
                    <textarea id="taskDescription" name="description" class="form-textarea" rows="3"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="taskSubject">Subject</label>
                        <select id="taskSubject" name="subject_id" class="form-select">
                            <option value="">Select Subject</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="taskPriority">Priority</label>
                        <select id="taskPriority" name="priority" class="form-select">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="taskDueDate">Due Date</label>
                    <input type="date" id="taskDueDate" name="due_date" class="form-input">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="hideModal('taskModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Task</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Subject Modal -->
<div id="subjectModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title" id="subjectModalTitle">Add New Subject</h3>
            <button class="modal-close" type="button">&times;</button>
        </div>
        <div class="modal-body">
            <form id="subjectForm">
                <input type="hidden" id="subjectId" name="subject_id">
                
                <div class="form-group">
                    <label class="form-label" for="subjectName">Subject Name</label>
                    <input type="text" id="subjectName" name="name" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="subjectColor">Color</label>
                    <div class="color-picker">
                        <input type="color" id="subjectColor" name="color" class="form-input" value="#333333">
                        <div class="color-presets">
                            <button type="button" class="color-preset" data-color="#000000" style="background-color: #000000;"></button>
                            <button type="button" class="color-preset" data-color="#333333" style="background-color: #333333;"></button>
                            <button type="button" class="color-preset" data-color="#666666" style="background-color: #666666;"></button>
                            <button type="button" class="color-preset" data-color="#999999" style="background-color: #999999;"></button>
                            <button type="button" class="color-preset" data-color="#cccccc" style="background-color: #cccccc;"></button>
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="hideModal('subjectModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Subject</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Note Modal -->
<div id="noteModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title" id="noteModalTitle">Add New Note</h3>
            <button class="modal-close" type="button">&times;</button>
        </div>
        <div class="modal-body">
            <form id="noteForm">
                <input type="hidden" id="noteId" name="note_id">
                
                <div class="form-group">
                    <label class="form-label" for="noteTitle">Title</label>
                    <input type="text" id="noteTitle" name="title" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="noteSubject">Subject</label>
                    <select id="noteSubject" name="subject_id" class="form-select">
                        <option value="">Select Subject</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="noteContent">Content</label>
                    <textarea id="noteContent" name="content" class="form-textarea" rows="8" required></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="hideModal('noteModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Note</button>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
.color-picker {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.color-presets {
    display: flex;
    gap: 8px;
}

.color-preset {
    width: 32px;
    height: 32px;
    border: 2px solid #dddddd;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.color-preset:hover {
    border-color: #000000;
    transform: scale(1.1);
}

.color-preset.active {
    border-color: #000000;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.2);
}
</style>

<script>
// Color preset functionality
document.querySelectorAll('.color-preset').forEach(preset => {
    preset.addEventListener('click', function() {
        const color = this.dataset.color;
        document.getElementById('subjectColor').value = color;
        
        // Update active state
        document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
    });
});
</script>
