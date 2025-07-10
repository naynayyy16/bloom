<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();
$user_id = $_SESSION['user_id'];

// Get tasks with subject information
$query = "SELECT t.*, s.name as subject_name, s.color as subject_color 
          FROM tasks t 
          LEFT JOIN subjects s ON t.subject_id = s.id 
          WHERE t.user_id = ? 
          ORDER BY t.created_at DESC";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get subjects for dropdown
$query = "SELECT * FROM subjects WHERE user_id = ? ORDER BY name";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Separate tasks by status
$todo_tasks = array_filter($tasks, function($task) { return $task['status'] === 'todo'; });
$progress_tasks = array_filter($tasks, function($task) { return $task['status'] === 'progress'; });
$completed_tasks = array_filter($tasks, function($task) { return $task['status'] === 'completed'; });
?>

<div class="page-header tasks-page-header left-align">
    <div class="page-title-section">
        <h1 class="page-title tasks-title">Tugas</h1>
        <p class="page-subtitle tasks-subtitle">Kelola tugas Anda dan tetap produktif</p>
    </div>
    <div class="page-actions tasks-actions">
        <select id="taskFilter" class="filter-select" title="Filter berdasarkan prioritas">
            <option value="all" selected>Semua</option>
            <option value="high">Tinggi</option>
            <option value="medium">Sedang</option>
            <option value="low">Rendah</option>
        </select>
        <button class="btn btn-secondary" onclick="clearFilter()" title="Hapus Filter (Alt + Esc)">
            <i class="fa-solid fa-times"></i> Hapus
        </button>
        <button class="btn btn-primary" id="addTaskBtn" title="Tambah Tugas Baru (Ctrl + N)">+ Tambah Tugas</button>
    </div>
</div>

<div class="kanban-container">
    <div class="kanban-board">
        <div class="kanban-column todo-column" data-status="todo">
            <div class="column-header">
                <div class="column-title">
                    <span class="column-dot todo"></span>
                    <h3>Belum Dikerjakan</h3>
                </div>
                <span class="task-count"><?php echo count($todo_tasks); ?></span>
            </div>
            <div class="task-list" id="todoTasks">
                <?php foreach ($todo_tasks as $task): ?>
                    <div class="task-card" data-task-id="<?php echo $task['id']; ?>" data-status="todo">
                        <div class="task-header">
                            <h4 class="task-title"><?php echo htmlspecialchars($task['title']); ?></h4>
                            <div class="task-actions">
                                <button class="task-action-btn" onclick="editTask(<?php echo $task['id']; ?>)" title="Edit"><i class="fa-solid fa-pen"></i></button>
                                <button class="task-action-btn" onclick="deleteTask(<?php echo $task['id']; ?>)" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                        <?php if ($task['description']): ?>
                            <p class="task-description"><?php echo htmlspecialchars($task['description']); ?></p>
                        <?php endif; ?>
                        <div class="task-meta">
                            <span class="task-priority priority-<?php echo $task['priority']; ?>">
                                <?php 
                                $priority_labels = [
                                    'high' => 'Tinggi',
                                    'medium' => 'Sedang', 
                                    'low' => 'Rendah'
                                ];
                                echo $priority_labels[$task['priority']] ?? ucfirst($task['priority']); 
                                ?>
                            </span>
                            <?php if ($task['due_date']): ?>
                                <span class="task-due-date">
                                    📅 <?php echo date('j M', strtotime($task['due_date'])); ?>
                                </span>
                            <?php endif; ?>
                        </div>
                        <?php if ($task['subject_name']): ?>
                            <div class="task-subject" style="border-left-color: <?php echo $task['subject_color']; ?>">
                                <?php echo htmlspecialchars($task['subject_name']); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
                <div class="add-task-placeholder" onclick="showAddTaskModal('todo')">
                    <span>Tambah Tugas</span>
                </div>
            </div>
        </div>
        
        <div class="kanban-column progress-column" data-status="progress">
            <div class="column-header">
                <div class="column-title">
                    <span class="column-dot progress"></span>
                    <h3>Sedang Dikerjakan</h3>
                </div>
                <span class="task-count"><?php echo count($progress_tasks); ?></span>
            </div>
            <div class="task-list" id="progressTasks">
                <?php foreach ($progress_tasks as $task): ?>
                    <div class="task-card" data-task-id="<?php echo $task['id']; ?>" data-status="progress">
                        <div class="task-header">
                            <h4 class="task-title"><?php echo htmlspecialchars($task['title']); ?></h4>
                            <div class="task-actions">
                                <button class="task-action-btn" onclick="editTask(<?php echo $task['id']; ?>)" title="Edit"><i class="fa-solid fa-pen"></i></button>
                                <button class="task-action-btn" onclick="deleteTask(<?php echo $task['id']; ?>)" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                        <?php if ($task['description']): ?>
                            <p class="task-description"><?php echo htmlspecialchars($task['description']); ?></p>
                        <?php endif; ?>
                        <div class="task-meta">
                            <span class="task-priority priority-<?php echo $task['priority']; ?>">
                                <?php 
                                $priority_labels = [
                                    'high' => 'Tinggi',
                                    'medium' => 'Sedang', 
                                    'low' => 'Rendah'
                                ];
                                echo $priority_labels[$task['priority']] ?? ucfirst($task['priority']); 
                                ?>
                            </span>
                            <?php if ($task['due_date']): ?>
                                <span class="task-due-date">
                                    📅 <?php echo date('j M', strtotime($task['due_date'])); ?>
                                </span>
                            <?php endif; ?>
                        </div>
                        <?php if ($task['subject_name']): ?>
                            <div class="task-subject" style="border-left-color: <?php echo $task['subject_color']; ?>">
                                <?php echo htmlspecialchars($task['subject_name']); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
                <div class="add-task-placeholder" onclick="showAddTaskModal('progress')">
                    <span>Tambah Tugas</span>
                </div>
            </div>
        </div>
        
        <div class="kanban-column completed-column" data-status="completed">
            <div class="column-header">
                <div class="column-title">
                    <span class="column-dot completed"></span>
                    <h3>Selesai</h3>
                </div>
                <span class="task-count"><?php echo count($completed_tasks); ?></span>
            </div>
            <div class="task-list" id="completedTasks">
                <?php foreach ($completed_tasks as $task): ?>
                    <div class="task-card completed" data-task-id="<?php echo $task['id']; ?>" data-status="completed">
                        <div class="task-header">
                            <h4 class="task-title"><?php echo htmlspecialchars($task['title']); ?></h4>
                            <div class="task-actions">
                                <button class="task-action-btn" onclick="editTask(<?php echo $task['id']; ?>)" title="Edit"><i class="fa-solid fa-pen"></i></button>
                                <button class="task-action-btn" onclick="deleteTask(<?php echo $task['id']; ?>)" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                        <?php if ($task['description']): ?>
                            <p class="task-description"><?php echo htmlspecialchars($task['description']); ?></p>
                        <?php endif; ?>
                        <div class="task-meta">
                            <span class="task-priority priority-<?php echo $task['priority']; ?>">
                                <?php 
                                $priority_labels = [
                                    'high' => 'Tinggi',
                                    'medium' => 'Sedang', 
                                    'low' => 'Rendah'
                                ];
                                echo $priority_labels[$task['priority']] ?? ucfirst($task['priority']); 
                                ?>
                            </span>
                            <?php if ($task['due_date']): ?>
                                <span class="task-due-date">
                                    📅 <?php echo date('j M', strtotime($task['due_date'])); ?>
                                </span>
                            <?php endif; ?>
                        </div>
                        <?php if ($task['subject_name']): ?>
                            <div class="task-subject" style="border-left-color: <?php echo $task['subject_color']; ?>">
                                <?php echo htmlspecialchars($task['subject_name']); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
                <div class="add-task-placeholder" onclick="showAddTaskModal('completed')">
                    <span>Tambah Tugas</span>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Task Modal -->
<div id="taskModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title" id="taskModalTitle">Tambah Tugas Baru</h3>
            <button class="modal-close" onclick="hideModal('taskModal')">&times;</button>
        </div>
        <div class="modal-body">
            <form id="taskForm">
                <input type="hidden" id="taskId" name="task_id">
                
                <div class="form-group">
                    <label class="form-label" for="taskTitle">Judul *</label>
                    <input type="text" id="taskTitle" name="title" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="taskDescription">Deskripsi</label>
                    <textarea id="taskDescription" name="description" class="form-textarea" rows="3"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="taskSubject">Mata Pelajaran</label>
                        <select id="taskSubject" name="subject_id" class="form-select">
                            <option value="">Pilih Mata Pelajaran</option>
                            <?php foreach ($subjects as $subject): ?>
                                <option value="<?php echo $subject['id']; ?>">
                                    <?php echo htmlspecialchars($subject['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="taskPriority">Prioritas</label>
                        <select id="taskPriority" name="priority" class="form-select">
                            <option value="low">Rendah</option>
                            <option value="medium" selected>Sedang</option>
                            <option value="high">Tinggi</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="taskStatus">Status</label>
                        <select id="taskStatus" name="status" class="form-select">
                            <option value="todo">Belum Dikerjakan</option>
                            <option value="progress">Sedang Dikerjakan</option>
                            <option value="completed">Selesai</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="taskDueDate">Tanggal Jatuh Tempo</label>
                        <input type="date" id="taskDueDate" name="due_date" class="form-input">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="hideModal('taskModal')">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan Tugas</button>
                </div>
            </form>
        </div>
    </div>
</div>
