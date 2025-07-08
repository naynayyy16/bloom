<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();
$user_id = $_SESSION['user_id'];

// Get subjects with task counts
$query = "SELECT s.*, 
          COUNT(t.id) as total_tasks,
          COUNT(CASE WHEN t.completed = 1 THEN 1 END) as completed_tasks
          FROM subjects s 
          LEFT JOIN tasks t ON s.id = t.subject_id 
          WHERE s.user_id = ? 
          GROUP BY s.id 
          ORDER BY s.created_at DESC";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="subjects-page-header left-align">
    <div class="subjects-title-section">
        <h1 class="subjects-title">Mata Pelajaran</h1>
        <p class="subjects-subtitle">Atur mata pelajaran akademik Anda dan pantau kemajuan</p>
        <div class="subjects-actions">
            <button class="btn btn-primary" id="addSubjectBtn" onclick="showSubjectModal()">
                <i class="fa-solid fa-plus"></i> Tambah Mata Pelajaran
            </button>
        </div>
    </div>
</div>

<div class="subjects-grid" id="subjectsGrid">
    <?php if (empty($subjects)): ?>
        <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-book-open"></i></div>
            <h3>Belum ada mata pelajaran</h3>
            <p>Buat mata pelajaran pertama Anda untuk mengatur tugas dan catatan</p>
            <button class="btn btn-primary" id="emptyStateAddBtn">Tambah Mata Pelajaran</button>
        </div>
    <?php else: ?>
        <?php foreach ($subjects as $subject): ?>
            <?php
            $progress = $subject['total_tasks'] > 0 ? round(($subject['completed_tasks'] / $subject['total_tasks']) * 100) : 0;
            $progressColor = $progress === 100 ? '#10b981' : ($progress >= 70 ? '#f59e0b' : '#ef4444');
            ?>
            <div class="subject-card" data-subject-id="<?php echo $subject['id']; ?>" onclick="showSubjectPreview(<?php echo $subject['id']; ?>)">
                <div class="subject-header">
                    <div class="subject-info">
                        <div class="subject-color-indicator" style="background-color: <?php echo $subject['color']; ?>; padding: 0 8px;">
                            <span class="subject-label-badge"><?php echo htmlspecialchars($subject['name']); ?></span>
                        </div>
                    </div>
                    <div class="subject-actions">
                        <button class="subject-action-btn edit-subject-btn" data-subject-id="<?php echo $subject['id']; ?>" title="Edit Mata Pelajaran" onclick="event.stopPropagation(); editSubject(<?php echo $subject['id']; ?>)">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                        <button class="subject-action-btn delete-subject-btn" data-subject-id="<?php echo $subject['id']; ?>" title="Hapus Mata Pelajaran" onclick="event.stopPropagation(); deleteSubject(<?php echo $subject['id']; ?>)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="subject-stats">
                    <div class="subject-stat-item">
                        <span class="subject-stat-number"><?php echo $subject['total_tasks']; ?></span>
                        <span class="subject-stat-label">Total Tugas</span>
                    </div>
                    <div class="subject-stat-item">
                        <span class="subject-stat-number"><?php echo $subject['completed_tasks']; ?></span>
                        <span class="subject-stat-label">Selesai</span>
                    </div>
                    <div class="subject-stat-item">
                        <span class="subject-stat-number"><?php echo $subject['total_tasks'] - $subject['completed_tasks']; ?></span>
                        <span class="subject-stat-label">Menunggu</span>
                    </div>
                </div>

                <div class="subject-progress">
                    <div class="progress-bar">
                        <div class="progress-fill <?php echo $progress === 100 ? 'completed' : ''; ?>" 
                            data-progress="<?php echo $progress; ?>" 
                            data-color="<?php echo $progressColor; ?>" 
                            style="width: 0%; background-color: <?php echo $progressColor; ?>;"></div>
                    </div>
                    <span class="progress-text <?php echo $progress === 100 ? 'completed' : ''; ?>"><?php echo $progress; ?>% Selesai</span>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</div>

<!-- Subject Modal -->
<div id="subjectModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title" id="subjectModalTitle">Tambah Mata Pelajaran Baru</h3>
            <button class="modal-close" data-modal="subjectModal">&times;</button>
        </div>
        <div class="modal-body">
            <form id="subjectForm">
                <input type="hidden" id="subjectId" name="subject_id">
                
                <div class="form-group">
                    <label class="form-label" for="subjectName">Nama Mata Pelajaran *</label>
                    <input type="text" id="subjectName" name="name" class="form-input" required 
                           placeholder="contoh: Pemrograman Berbasis Objek">
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="subjectColor">Warna</label>
                    <div class="color-picker">
                        <input type="color" id="subjectColor" name="color" class="form-input color-input" value="#333333">
                        <div class="color-presets">
                            <button type="button" class="color-preset" data-color="#000000" style="background-color: #000000;"></button>
                            <button type="button" class="color-preset" data-color="#333333" style="background-color: #333333;"></button>
                            <button type="button" class="color-preset" data-color="#666666" style="background-color: #666666;"></button>
                            <button type="button" class="color-preset" data-color="#999999" style="background-color: #999999;"></button>
                            <button type="button" class="color-preset" data-color="#cccccc" style="background-color: #cccccc;"></button>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="subjectDescription">Deskripsi</label>
                    <textarea id="subjectDescription" name="description" class="form-textarea" rows="2" placeholder="Deskripsi (opsional)"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" data-modal="subjectModal">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan Mata Pelajaran</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Subject Preview Modal -->
<div id="subjectPreviewModal" class="modal">
    <div class="modal-content subject-preview-modal">
        <div class="modal-header">
            <h3 class="modal-title" id="subjectPreviewTitle">Pratinjau Mata Pelajaran</h3>
            <button class="modal-close" data-modal="subjectPreviewModal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="subject-preview-content">
                <div class="subject-preview-header">
                    <div class="subject-preview-info">
                        <div class="subject-preview-color-indicator" id="previewColorIndicator">
                            <i class="fa-solid fa-book"></i>
                        </div>
                        <div class="subject-preview-details">
                            <h3 class="subject-preview-name" id="previewSubjectName">Nama Mata Pelajaran</h3>
                            <p class="subject-preview-description" id="previewSubjectDescription">Deskripsi mata pelajaran</p>
                        </div>
                    </div>
                </div>
                
                <div class="subject-preview-stats">
                    <div class="preview-stat-item">
                        <span class="preview-stat-number" id="previewTotalTasks">0</span>
                        <span class="preview-stat-label">Total Tugas</span>
                    </div>
                    <div class="preview-stat-item">
                        <span class="preview-stat-number" id="previewCompletedTasks">0</span>
                        <span class="preview-stat-label">Selesai</span>
                    </div>
                    <div class="preview-stat-item">
                        <span class="preview-stat-number" id="previewTotalNotes">0</span>
                        <span class="preview-stat-label">Catatan</span>
                    </div>
                </div>
                
                <div class="subject-preview-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="previewProgressFill"></div>
                    </div>
                    <span class="progress-text" id="previewProgressText">0% Selesai</span>
                </div>
                
                <div class="subject-preview-sections">
                    <div class="preview-section">
                        <h4 class="preview-section-title">
                            <i class="fa-solid fa-tasks"></i>
                            Tugas Terbaru
                        </h4>
                        <div class="preview-tasks-list" id="previewTasksList">
                            <div class="preview-loading">Memuat tugas...</div>
                        </div>
                    </div>
                    
                    <div class="preview-section">
                        <h4 class="preview-section-title">
                            <i class="fa-solid fa-sticky-note"></i>
                            Catatan Terbaru
                        </h4>
                        <div class="preview-notes-list" id="previewNotesList">
                            <div class="preview-loading">Memuat catatan...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>


