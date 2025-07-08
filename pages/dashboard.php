<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

$user_id = $_SESSION['user_id'];

// Statistik
$query = "SELECT COUNT(*) as total FROM tasks WHERE user_id = ?";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$total_tasks = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

$query = "SELECT COUNT(*) as total FROM tasks WHERE user_id = ? AND completed = 1";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$completed_tasks = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

$query = "SELECT COUNT(*) as total FROM subjects WHERE user_id = ?";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$total_subjects = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

$query = "SELECT COUNT(*) as total FROM pomodoro_sessions WHERE user_id = ? AND DATE(completed_at) = CURDATE()";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$pomodoro_today = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Tugas terbaru
$query = "SELECT t.*, s.name as subject_name, s.color as subject_color 
          FROM tasks t 
          LEFT JOIN subjects s ON t.subject_id = s.id 
          WHERE t.user_id = ? 
          ORDER BY t.created_at DESC 
          LIMIT 5";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$recent_tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get user XP and level from database
$query = "SELECT total_xp, level FROM users WHERE id = ?";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$user_data = $stmt->fetch(PDO::FETCH_ASSOC);

$user_xp = $user_data['total_xp'] ?? 0;
$user_level = $user_data['level'] ?? 1;

// Update session with current data
$_SESSION['total_xp'] = $user_xp;
$_SESSION['level'] = $user_level;

// Pet stage calculation
$pet_stage = 'seed';
$pet_svg = 'assets/images/sunflower_seed.svg';
if ($user_xp >= 500) {
    $pet_stage = 'bloom';
    $pet_svg = 'assets/images/sunflower_bloom.svg';
} elseif ($user_xp >= 100) {
    $pet_stage = 'sprout';
    $pet_svg = 'assets/images/sunflower_sprout.svg';
}

// Calculate progress to next stage based on current pet stage
$current_stage_xp = 0;
$next_stage_xp = 100;

if ($user_xp >= 500) {
    $current_stage_xp = 500;
    $next_stage_xp = 1000;
} elseif ($user_xp >= 100) {
    $current_stage_xp = 100;
    $next_stage_xp = 500;
} else {
    $current_stage_xp = 0;
    $next_stage_xp = 100;
}

$xp_in_current_stage = $user_xp - $current_stage_xp;
$xp_needed_for_next_stage = $next_stage_xp - $current_stage_xp;
$progress_percentage = min(100, ($xp_in_current_stage / $xp_needed_for_next_stage) * 100);
?>

<div class="dashboard-container">
    <!-- 1. Judul halaman rata kiri -->
    <div class="dashboard-header" style="text-align: left; margin-bottom: 32px;">
        <div class="dashboard-greeting">Selamat datang kembali, <?php echo $_SESSION['username']; ?>! 👋</div>
        <div class="dashboard-title">Dashboard</div>
        <div class="dashboard-subtitle">Ringkasan produktivitas harian kamu.</div>
    </div>

    <!-- 2. Pet dan Info -->
    <div class="pet-info-row" style="display: flex; justify-content: center; gap: 32px; align-items: stretch; margin-bottom: 36px; width: 100%;">
        <div class="pet-section card" style="flex: 1 1 0; min-width: 320px; max-width: 480px; min-height: 240px; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px;">
            <div class="pet-avatar" style="display: flex; align-items: center; justify-content: center; width: 150px; height: 150px;">
                <object type="image/svg+xml" data="<?php echo $pet_svg; ?>" width="140" height="140" style="display:block;" data-stage="<?php echo $pet_stage; ?>"></object>
            </div>
            <div class="pet-content" style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                <div class="pet-progress" style="width: 90%; max-width: 260px; margin: 0 auto;">
                    <div class="progress-bar" style="background: #e5e7eb; border-radius: 8px; width: 100%; height: 10px; margin: 8px 0 4px 0; overflow: hidden; position: relative;">
                        <div class="progress-fill" style="background: linear-gradient(90deg, var(--primary-color) 60%, var(--accent-color) 100%); border-radius: 8px; width: <?php echo max(2.5, $progress_percentage); ?>%; height: 100%; transition: width 0.4s;"></div>
                    </div>
                    <div class="pet-xp-text" style="font-size: 13px; color: #6b7280; margin-top: 2px; text-align: center;">
                        <?php echo $xp_in_current_stage; ?> / <?php echo $xp_needed_for_next_stage; ?> XP ke tahap berikutnya
                    </div>
                </div>
            </div>
        </div>
        <div class="card" style="flex: 1 1 0; min-width: 320px; max-width: 480px; min-height: 240px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Jangan Lupa!</div>
            <div style="font-size: 15px; color: #6b7280; margin-bottom: 16px; text-align: center;">Atur jadwalmu agar lebih produktif.</div>
            <a href="?page=subjects" class="btn btn-primary">Ke Pengaturan Jadwal</a>
        </div>
    </div>

    <!-- 3. Statistik grid satu baris 4 -->
    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 40px;">
        <div class="stat-card card">
            <div class="stat-icon"><i class="fa-solid fa-list-check"></i></div>
            <div class="stat-info">
                <div class="stat-number"><?php echo $total_tasks; ?></div>
                <div class="stat-label">Total Tugas</div>
            </div>
        </div>
        <div class="stat-card card">
            <div class="stat-icon"><i class="fa-solid fa-circle-check"></i></div>
            <div class="stat-info">
                <div class="stat-number"><?php echo $completed_tasks; ?></div>
                <div class="stat-label">Selesai</div>
            </div>
        </div>
        <div class="stat-card card">
            <div class="stat-icon"><i class="fa-solid fa-book"></i></div>
            <div class="stat-info">
                <div class="stat-number"><?php echo $total_subjects; ?></div>
                <div class="stat-label">Mata Pelajaran</div>
            </div>
        </div>
        <div class="stat-card card">
            <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
            <div class="stat-info">
                <div class="stat-number"><?php echo $pomodoro_today; ?></div>
                <div class="stat-label">Sesi Fokus Hari Ini</div>
            </div>
        </div>
    </div>

    <!-- 4. Tugas Terbaru dengan card menarik -->
    <div class="recent-section">
        <div class="section-header">
            <div class="section-title">Tugas Terbaru</div>
            <a href="?page=tasks" class="btn btn-ghost">Lihat Semua</a>
        </div>
        <div class="recent-tasks-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
            <?php if (empty($recent_tasks)): ?>
                <div class="empty-state card" style="padding: 32px 0;">
                    <p>Belum ada tugas. <a href="?page=tasks">Buat tugas pertama kamu</a></p>
                </div>
            <?php else: ?>
                <?php foreach ($recent_tasks as $task): ?>
                    <div class="recent-task-card card" style="display: flex; flex-direction: column; gap: 8px; min-height: 120px; justify-content: space-between; border-left: 4px solid <?php echo $task['subject_color'] ?: '#111'; ?>;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <div>
                                <div class="task-title" style="font-size: 1.1rem; font-weight: 600; color: #111; margin-bottom: 2px;">
                                    <?php echo htmlspecialchars($task['title']); ?>
                                </div>
                                <div class="task-description" style="font-size: 13px; color: #6b7280; margin-bottom: 2px;">
                                    <?php echo htmlspecialchars($task['description']); ?>
                                </div>
                            </div>
                            <div class="task-status" style="font-size: 1.3rem;">
                                <?php if ($task['completed']): ?>
                                    <span class="status-badge completed">✓</span>
                                <?php else: ?>
                                    <span class="status-badge <?php echo $task['status']; ?>">
                                        <?php echo $task['status'] === 'progress' ? '◐' : '○'; ?>
                                    </span>
                                <?php endif; ?>
                            </div>
                        </div>
                        <div class="task-meta" style="font-size: 12px; color: #9ca3af; display: flex; gap: 10px; align-items: center;">
                            <span class="task-priority priority-<?php echo $task['priority']; ?>">
                                <?php echo ucfirst($task['priority']); ?>
                            </span>
                            <?php if ($task['due_date']): ?>
                                <span class="task-due-date">Jatuh tempo: <?php echo date('j M', strtotime($task['due_date'])); ?></span>
                            <?php endif; ?>
                            <?php if ($task['subject_name']): ?>
                                <span class="task-subject" style="color: <?php echo $task['subject_color']; ?>; font-weight: 500;">
                                    <?php echo htmlspecialchars($task['subject_name']); ?>
                                </span>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</div>
