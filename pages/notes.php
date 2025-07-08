<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();
$user_id = $_SESSION['user_id'];

// Get notes with subject information
$query = "SELECT n.*, s.name as subject_name, s.color as subject_color 
          FROM notes n 
          LEFT JOIN subjects s ON n.subject_id = s.id 
          WHERE n.user_id = ? 
          ORDER BY n.updated_at DESC";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get subjects for dropdown
$query = "SELECT * FROM subjects WHERE user_id = ? ORDER BY name";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!-- Include Quill CSS -->
<link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">

<div class="page-header notes-page-header left-align">
    <div class="page-title-section">
        <h1 class="page-title notes-title">Catatan</h1>
        <p class="page-subtitle notes-subtitle">Catat pikiran dan ide Anda dengan format yang kaya</p>
        <div class="notes-actions">
            <button class="btn btn-primary" id="addNoteBtn">
                <i class="fa-solid fa-note-sticky"></i>
                Tambah Catatan
            </button>
        </div>
    </div>
</div>

<div class="notes-container">
    <div class="notes-grid" id="notesGrid">
        <?php foreach ($notes as $note): ?>
            <div class="note-card" data-note-id="<?php echo $note['id']; ?>">
                <div class="note-header">
                    <div class="note-info">
                        <div class="note-color-indicator" style="background-color: <?php echo htmlspecialchars($note['subject_color'] ?: '#222'); ?>;">
                            <i class="fa-solid fa-book"></i>
                        </div>
                        <div class="note-details">
                            <h3 class="note-title"><?php echo htmlspecialchars($note['title']); ?></h3>
                        </div>
                    </div>
                    <div class="note-actions">
                        <button class="note-action-btn" onclick="editNote(<?php echo $note['id']; ?>)" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="note-action-btn" onclick="deleteNote(<?php echo $note['id']; ?>)" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="note-content">
                    <?php echo $note['content']; ?>
                </div>
                <div class="note-footer">
                    <div class="note-meta">
                        <span class="note-date"><i class="fa-regular fa-calendar"></i> <?php echo date('j M, Y', strtotime($note['updated_at'])); ?></span>
                        <?php if (!empty($note['subject_name'])): ?>
                            <span class="note-subject-label" style="background: <?php echo htmlspecialchars($note['subject_color'] ?: '#222'); ?>;">
                                <?php echo htmlspecialchars($note['subject_name']); ?>
                            </span>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<!-- Note Modal -->
<div id="noteModal" class="modal">
    <div class="modal-content note-modal">
        <div class="modal-header">
            <h3 class="modal-title" id="noteModalTitle">Tambah Catatan Baru</h3>
            <button class="modal-close" onclick="hideModal('noteModal')">&times;</button>
        </div>
        <div class="modal-body">
            <form id="noteForm">
                <input type="hidden" id="noteId" name="note_id">
                
                <div class="form-group">
                    <label class="form-label" for="noteTitle">Judul *</label>
                    <input type="text" id="noteTitle" name="title" class="form-input" required 
                           placeholder="Masukkan judul catatan">
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="noteSubject">Mata Pelajaran</label>
                    <select id="noteSubject" name="subject_id" class="form-select">
                        <option value="">Pilih Mata Pelajaran (Opsional)</option>
                        <?php foreach ($subjects as $subject): ?>
                            <option value="<?php echo $subject['id']; ?>">
                                <?php echo htmlspecialchars($subject['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="noteEditor">Konten *</label>
                    <div id="noteEditor"></div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="hideModal('noteModal')">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan Catatan</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Note View Modal -->
<div id="noteViewModal" class="modal">
    <div class="modal-content note-view-modal">
        <div class="modal-header">
            <h3 class="modal-title" id="noteViewTitle">Judul Catatan</h3>
            <button class="modal-close" onclick="hideModal('noteViewModal')">&times;</button>
        </div>
        <div class="modal-body">
            <div id="noteViewContent" class="note-view-content"></div>
            <div id="noteViewMeta" class="note-view-meta"></div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="hideModal('noteViewModal')">Tutup</button>
            <button class="btn btn-primary" id="editNoteFromView">
                <i class="fa-solid fa-file-lines"></i>
                Edit Catatan
            </button>
        </div>
    </div>
</div>

<!-- Include Quill JS -->
<script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>

<script>
// Initialize notes when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof initNotes === 'function') {
        initNotes()
    }
})
</script>
