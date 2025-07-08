<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

// Check if user is authenticated
checkAuth();

$database = new Database();
$db = $database->getConnection();
$user_id = $_SESSION['user_id'];

// Get user data
$query = "SELECT * FROM users WHERE id = ?";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Get XP statistics
$xp_stats = [];
if ($user) {
    // Calculate XP progress to next level
    $current_level_xp = ($user['level'] - 1) * 100;
    $xp_in_current_level = $user['total_xp'] - $current_level_xp;
    $xp_needed_for_next_level = max(0, 100 - $xp_in_current_level);
    $progress_to_next_level = min(100, ($xp_in_current_level / 100) * 100);
    
    // Get XP earned today
    $query = "SELECT SUM(xp_amount) as xp_today FROM xp_activities 
              WHERE user_id = ? AND DATE(created_at) = CURDATE()";
    $stmt = $db->prepare($query);
    $stmt->execute([$user_id]);
    $today_result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get XP earned this week
    $query = "SELECT SUM(xp_amount) as xp_week FROM xp_activities 
              WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    $stmt = $db->prepare($query);
    $stmt->execute([$user_id]);
    $week_result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get recent XP activities
    $query = "SELECT xa.*, 
              CASE 
                WHEN xa.activity_type = 'task_completion' THEN t.title
                WHEN xa.activity_type = 'pomodoro_completion' THEN CONCAT('Pomodoro Session (', ps.duration, ' min)')
                ELSE xa.activity_type
              END as activity_name
              FROM xp_activities xa
              LEFT JOIN tasks t ON xa.activity_id = t.id AND xa.activity_type = 'task_completion'
              LEFT JOIN pomodoro_sessions ps ON xa.activity_id = ps.id AND xa.activity_type = 'pomodoro_completion'
              WHERE xa.user_id = ?
              ORDER BY xa.created_at DESC
              LIMIT 10";
    $stmt = $db->prepare($query);
    $stmt->execute([$user_id]);
    $recent_activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $xp_stats = [
        'xp_in_current_level' => $xp_in_current_level,
        'xp_needed_for_next_level' => $xp_needed_for_next_level,
        'progress_to_next_level' => $progress_to_next_level,
        'xp_today' => (int)$today_result['xp_today'],
        'xp_week' => (int)$week_result['xp_week'],
        'recent_activities' => $recent_activities
    ];
}

$success = '';
$error = '';

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['update_profile'])) {
        $username = trim($_POST['username']);
        $email = trim($_POST['email']);
        
        if (empty($username) || empty($email)) {
            $error = 'Nama pengguna dan email wajib diisi';
        } else {
            // Check if email is already taken by another user
            $query = "SELECT id FROM users WHERE email = ? AND id != ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$email, $user_id]);
            
            if ($stmt->fetch()) {
                $error = 'Email sudah digunakan oleh pengguna lain';
            } else {
                $query = "UPDATE users SET username = ?, email = ? WHERE id = ?";
                $stmt = $db->prepare($query);
                if ($stmt->execute([$username, $email, $user_id])) {
                    $_SESSION['username'] = $username;
                    $_SESSION['email'] = $email;
                    $success = 'Profil berhasil diperbarui';
                    $user['username'] = $username;
                    $user['email'] = $email;
                } else {
                    $error = 'Gagal memperbarui profil';
                }
            }
        }
    }
    
    if (isset($_POST['change_password'])) {
        $current_password = $_POST['current_password'];
        $new_password = $_POST['new_password'];
        $confirm_password = $_POST['confirm_password'];
        
        if (empty($current_password) || empty($new_password) || empty($confirm_password)) {
            $error = 'Semua field password wajib diisi';
        } elseif ($new_password !== $confirm_password) {
            $error = 'Password baru tidak cocok';
        } elseif (strlen($new_password) < 6) {
            $error = 'Password baru minimal 6 karakter';
        } elseif (!password_verify($current_password, $user['password'])) {
            $error = 'Password saat ini salah';
        } else {
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
            $query = "UPDATE users SET password = ? WHERE id = ?";
            $stmt = $db->prepare($query);
            if ($stmt->execute([$hashed_password, $user_id])) {
                $success = 'Password berhasil diubah';
            } else {
                $error = 'Gagal mengubah password';
            }
        }
    }
}
?>

<div class="page-header">
    <div class="page-title-section">
        <h1 class="page-title">Profil</h1>
        <p class="page-subtitle">Kelola pengaturan akun dan preferensi Anda</p>
    </div>
</div>

<?php if ($success): ?>
    <div class="alert alert-success">
        <?php echo htmlspecialchars($success); ?>
    </div>
<?php endif; ?>

<?php if ($error): ?>
    <div class="alert alert-error">
        <?php echo htmlspecialchars($error); ?>
    </div>
<?php endif; ?>

<div class="profile-container">
    <div class="profile-grid">
        <!-- Profile Information Card -->
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-avatar-section">
                    <div class="profile-avatar">
                        <div class="avatar-circle large">
                            <?php echo strtoupper(substr($user['username'], 0, 1)); ?>
                        </div>
                    </div>
                    <div class="profile-info">
                        <h2 class="profile-name"><?php echo htmlspecialchars($user['username']); ?></h2>
                        <p class="profile-email"><?php echo htmlspecialchars($user['email']); ?></p>
                        <div class="profile-level">
                            <i class="fa-solid fa-star"></i>
                            Level <?php echo $user['level']; ?> • <?php echo number_format($user['total_xp']); ?> XP
                        </div>
                    </div>
                </div>
                <div class="profile-meta">
                    <div class="meta-item">
                        <i class="fa-solid fa-calendar"></i>
                        <span>Anggota sejak <?php echo date('M Y', strtotime($user['created_at'])); ?></span>
                    </div>
                    <div class="meta-item">
                        <i class="fa-solid fa-clock"></i>
                        <span>Terakhir diperbarui <?php echo date('j M, Y', strtotime($user['updated_at'])); ?></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- XP Statistics Card -->
        <div class="settings-card">
            <div class="card-header">
                <h3 class="section-title">
                    <i class="fa-solid fa-trophy"></i>
                    Statistik XP
                </h3>
                <p class="section-description">Pantau kemajuan dan pencapaian XP Anda</p>
            </div>
            
            <div class="xp-stats-section">
                <!-- XP Progress to Next Level -->
                <div class="xp-progress-section">
                    <div class="xp-progress-header">
                        <span class="xp-progress-label">Progress ke Level <?php echo $user['level'] + 1; ?></span>
                        <span class="xp-progress-text"><?php echo $xp_stats['xp_in_current_level']; ?> / 100 XP</span>
                    </div>
                    <div class="xp-progress-bar">
                        <div class="xp-progress-fill" style="width: <?php echo $xp_stats['progress_to_next_level']; ?>%"></div>
                    </div>
                    <div class="xp-progress-info">
                        <span>Butuh <?php echo $xp_stats['xp_needed_for_next_level']; ?> XP lagi untuk naik level</span>
                    </div>
                </div>

                <!-- XP Stats Grid -->
                <div class="xp-stats-grid">
                    <div class="xp-stat-item">
                        <div class="xp-stat-icon">📅</div>
                        <div class="xp-stat-content">
                            <div class="xp-stat-value"><?php echo $xp_stats['xp_today']; ?></div>
                            <div class="xp-stat-label">XP Hari Ini</div>
                        </div>
                    </div>
                    <div class="xp-stat-item">
                        <div class="xp-stat-icon">📊</div>
                        <div class="xp-stat-content">
                            <div class="xp-stat-value"><?php echo $xp_stats['xp_week']; ?></div>
                            <div class="xp-stat-label">XP Minggu Ini</div>
                        </div>
                    </div>
                    <div class="xp-stat-item">
                        <div class="xp-stat-icon">🎯</div>
                        <div class="xp-stat-content">
                            <div class="xp-stat-value"><?php echo $user['total_xp']; ?></div>
                            <div class="xp-stat-label">Total XP</div>
                        </div>
                    </div>
                    <div class="xp-stat-item">
                        <div class="xp-stat-icon">⭐</div>
                        <div class="xp-stat-content">
                            <div class="xp-stat-value"><?php echo $user['level']; ?></div>
                            <div class="xp-stat-label">Level Saat Ini</div>
                        </div>
                    </div>
                </div>

                <!-- Recent XP Activities -->
                <div class="xp-activities-section">
                    <h4 class="xp-activities-title">Aktivitas XP Terbaru</h4>
                    <div class="xp-activities-list">
                        <?php if (empty($xp_stats['recent_activities'])): ?>
                            <div class="xp-no-activities">
                                <p>Belum ada aktivitas XP. Mulai selesaikan tugas atau sesi pomodoro untuk mendapatkan XP!</p>
                            </div>
                        <?php else: ?>
                            <?php foreach ($xp_stats['recent_activities'] as $activity): ?>
                                <div class="xp-activity-item">
                                    <div class="xp-activity-icon">
                                        <?php echo $activity['activity_type'] === 'task_completion' ? '✅' : '⏰'; ?>
                                    </div>
                                    <div class="xp-activity-content">
                                        <div class="xp-activity-title">
                                            <?php echo htmlspecialchars($activity['activity_name'] ?: ucfirst(str_replace('_', ' ', $activity['activity_type']))); ?>
                                        </div>
                                        <div class="xp-activity-meta">
                                            <span class="xp-activity-xp">+<?php echo $activity['xp_amount']; ?> XP</span>
                                            <span class="xp-activity-time"><?php echo date('j M, H:i', strtotime($activity['created_at'])); ?></span>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Update Profile Form -->
        <div class="settings-card">
            <div class="card-header">
                <h3 class="section-title">
                    <i class="fa-solid fa-user"></i>
                    Informasi Profil
                </h3>
                <p class="section-description">Perbarui informasi pribadi dan detail akun Anda</p>
            </div>
            
            <div class="form-section">
                <div class="form-group">
                    <label class="form-label" for="username">Nama Pengguna</label>
                    <input type="text" class="form-input" id="username" value="<?php echo htmlspecialchars($user['username']); ?>" placeholder="Masukkan nama pengguna Anda">
                    <p class="form-help">Ini adalah nama tampilan yang akan dilihat orang lain</p>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="email">Alamat Email</label>
                    <input type="email" class="form-input" id="email" value="<?php echo htmlspecialchars($user['email']); ?>" placeholder="Masukkan email Anda">
                    <p class="form-help">Kami akan menggunakan ini untuk notifikasi penting</p>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="updateProfile()">
                        <i class="fa-solid fa-save"></i>
                        Perbarui Profil
                    </button>
                </div>
            </div>
        </div>

        <!-- Change Password Form -->
        <div class="settings-card">
            <div class="card-header">
                <h3 class="section-title">
                    <i class="fa-solid fa-lock"></i>
                    Ubah Password
                </h3>
                <p class="section-description">Perbarui password Anda untuk menjaga keamanan akun</p>
            </div>
            
            <div class="form-section">
                <div class="form-group">
                    <label class="form-label" for="currentPassword">Password Saat Ini</label>
                    <div class="password-input-group">
                        <input type="password" class="form-input" id="currentPassword" placeholder="Masukkan password saat ini">
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('currentPassword')" title="Toggle password visibility">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="newPassword">Password Baru</label>
                    <div class="password-input-group">
                        <input type="password" class="form-input" id="newPassword" placeholder="Masukkan password baru" oninput="updatePasswordStrength()">
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('newPassword')" title="Toggle password visibility">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <div class="password-strength" id="passwordStrengthContainer">
                        <div class="strength-bar">
                            <div class="strength-fill" id="passwordStrengthBar"></div>
                        </div>
                        <span class="strength-text" id="passwordStrength">Masukkan password untuk memeriksa kekuatan</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="confirmPassword">Konfirmasi Password Baru</label>
                    <div class="password-input-group">
                        <input type="password" class="form-input" id="confirmPassword" placeholder="Konfirmasi password baru">
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility('confirmPassword')" title="Toggle password visibility">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="changePassword()">
                        <i class="fa-solid fa-key"></i>
                        Ubah Password
                    </button>
                </div>
            </div>
        </div>

        <!-- Danger Zone -->
        <div class="settings-card danger-zone">
            <div class="card-header">
                <h3 class="section-title">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    Zona Berbahaya
                </h3>
                <p class="section-description">Tindakan yang tidak dapat dibatalkan</p>
            </div>
            
            <div class="form-section">
                <div class="danger-item">
                    <div class="danger-info">
                        <h4>Hapus Akun</h4>
                        <p>Menghapus akun Anda akan menghapus semua data secara permanen. Tindakan ini tidak dapat dibatalkan.</p>
                    </div>
                    <button class="btn btn-danger" onclick="showDeleteAccountModal()">
                        <i class="fa-solid fa-trash"></i>
                        Hapus Akun
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Delete Account Modal -->
<div id="deleteAccountModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">Hapus Akun</h3>
            <button class="modal-close" onclick="hideModal('deleteAccountModal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="warning-message">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <h4>Tindakan ini tidak dapat dibatalkan</h4>
                <p>Ini akan menghapus akun Anda secara permanen dan menghapus semua data dari server kami.</p>
            </div>
            
            <form id="deleteAccountForm">
                <div class="form-group">
                    <label class="form-label">Ketik "HAPUS" untuk mengkonfirmasi</label>
                    <input type="text" class="form-input" id="deleteConfirmation" placeholder="HAPUS">
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="hideModal('deleteAccountModal')">Batal</button>
            <button class="btn btn-danger" onclick="confirmDeleteAccount()" disabled id="confirmDeleteBtn">
                <span class="btn-text">Hapus Akun</span>
                <span class="btn-loading" style="display: none;">
                    <span class="spinner-sm"></span> Menghapus...
                </span>
            </button>
        </div>
    </div>
</div>


