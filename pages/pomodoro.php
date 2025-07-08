<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();
$user_id = $_SESSION['user_id'];

// Get today's pomodoro sessions
$query = "SELECT COUNT(*) as sessions_today FROM pomodoro_sessions 
          WHERE user_id = ? AND type = 'work' AND DATE(completed_at) = CURDATE()";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$sessions_today = $stmt->fetch(PDO::FETCH_ASSOC)['sessions_today'];

// Get this week's sessions
$query = "SELECT COUNT(*) as sessions_week FROM pomodoro_sessions 
          WHERE user_id = ? AND type = 'work' AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$sessions_week = $stmt->fetch(PDO::FETCH_ASSOC)['sessions_week'];

// Calculate streak - consecutive days with at least 1 completed work session
$query = "SELECT COALESCE(MAX(streak_count), 0) as streak FROM (
            SELECT 
              date,
              @streak := IF(session_date IS NOT NULL, @streak + 1, 0) as streak_count
            FROM (
              SELECT DATE_SUB(CURDATE(), INTERVAL n DAY) as date
              FROM (
                SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
                UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
                UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
                UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24
                UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29
              ) as numbers
            ) as dates
            LEFT JOIN (
              SELECT DISTINCT DATE(completed_at) as session_date
              FROM pomodoro_sessions 
              WHERE user_id = ? AND type = 'work'
            ) as sessions ON dates.date = sessions.session_date
            CROSS JOIN (SELECT @streak := 0) as vars
            ORDER BY date DESC
          ) as streak_calc";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$streak = $stmt->fetch(PDO::FETCH_ASSOC)['streak'];

// Get recent sessions
$query = "SELECT ps.*, t.title as task_title, s.name as subject_name 
          FROM pomodoro_sessions ps 
          LEFT JOIN tasks t ON ps.task_id = t.id 
          LEFT JOIN subjects s ON ps.subject_id = s.id 
          WHERE ps.user_id = ? 
          ORDER BY ps.completed_at DESC 
          LIMIT 10";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$recent_sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get subjects for dropdown
$query = "SELECT * FROM subjects WHERE user_id = ? ORDER BY name";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get active tasks for dropdown
$query = "SELECT * FROM tasks WHERE user_id = ? AND completed = 0 ORDER BY title";
$stmt = $db->prepare($query);
$stmt->execute([$user_id]);
$tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="pomodoro-container">
  <div class="page-header pomodoro-page-header left-align">
    <div class="page-title-section pomodoro-title-section">
      <h1 class="page-title pomodoro-title">Timer Pomodoro</h1>
      <p class="page-subtitle pomodoro-subtitle">Fokus dengan Teknik Pomodoro</p>
    </div>
  </div>
  <div class="pomodoro-layout">
    <div class="pomodoro-main">
      <div class="pomodoro-card timer-card">
        <div class="timer-display">
          <div class="timer-progress-frame">
            <svg id="timerProgressRing" width="240" height="240">
              <circle cx="120" cy="120" r="110" stroke="#e5e7eb" stroke-width="10" fill="none"/>
              <circle id="timerProgressCircle" cx="120" cy="120" r="110" stroke="#4caf50" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="690" stroke-dashoffset="0"/>
            </svg>
            <div class="timer-content">
              <span class="timer-time" id="timeDisplay">25:00</span>
            </div>
          </div>
          <span class="timer-label" id="sessionInfo">Sesi Kerja</span>
        </div>
        <div class="timer-controls">
          <button class="btn btn-primary btn-large" id="startTimer">
            <i class="fa-solid fa-play"></i> Mulai
          </button>
          <button class="btn btn-secondary" id="pauseTimer" disabled>
            <i class="fa-solid fa-pause"></i> Jeda
          </button>
          <button class="btn btn-secondary" id="resetTimer" disabled>
            <i class="fa-solid fa-rotate-left"></i> Reset
          </button>
        </div>
        <div class="timer-session-info">
          <div class="session-selector">
            <label for="sessionTask">Sedang mengerjakan:</label>
            <select id="sessionTask" class="form-select">
              <option value="">Fokus Umum</option>
              <?php foreach ($tasks as $task): ?>
                <option value="<?php echo $task['id']; ?>">
                  <?php echo htmlspecialchars($task['title']); ?>
                </option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="session-selector">
            <label for="sessionSubject">Mata Pelajaran:</label>
            <select id="sessionSubject" class="form-select">
              <option value="">Tidak Ada Mata Pelajaran</option>
              <?php foreach ($subjects as $subject): ?>
                <option value="<?php echo $subject['id']; ?>">
                  <?php echo htmlspecialchars($subject['name']); ?>
                </option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>
      </div>
      <div class="pomodoro-card stats-card">
        <div class="timer-stats">
          <div class="stat-item">
            <span class="stat-number"><?php echo $sessions_today; ?></span>
            <span class="stat-label">Hari Ini</span>
          </div>
          <div class="stat-item">
            <span class="stat-number"><?php echo $sessions_week; ?></span>
            <span class="stat-label">Minggu Ini</span>
          </div>
          <div class="stat-item">
            <span class="stat-number" id="completedSessions"><?php echo $streak; ?></span>
            <span class="stat-label">Streak</span>
          </div>
        </div>
      </div>
    </div>
    <div class="pomodoro-sidebar">
      <div class="pomodoro-card settings-card">
        <h3>Pengaturan Timer</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label for="workDuration">Durasi Fokus</label>
            <div class="input-with-unit">
              <input type="number" id="workDuration" value="25" min="1" max="60" class="form-input">
              <span class="input-unit">menit</span>
            </div>
          </div>
          <div class="setting-item">
            <label for="shortBreakDuration">Istirahat Pendek</label>
            <div class="input-with-unit">
              <input type="number" id="shortBreakDuration" value="5" min="1" max="30" class="form-input">
              <span class="input-unit">menit</span>
            </div>
          </div>
          <div class="setting-item">
            <label for="longBreakDuration">Istirahat Panjang</label>
            <div class="input-with-unit">
              <input type="number" id="longBreakDuration" value="15" min="1" max="60" class="form-input">
              <span class="input-unit">menit</span>
            </div>
          </div>
          <div class="setting-item">
            <label for="longBreakInterval">Ulangi Setelah</label>
            <div class="input-with-unit">
              <input type="number" id="longBreakInterval" value="4" min="2" max="10" class="form-input">
              <span class="input-unit">sesi</span>
            </div>
          </div>
        </div>
        <div class="setting-toggles">
          <label class="toggle-label">
            <input type="checkbox" id="autoStartBreaks" checked>
            <span class="toggle-slider"></span>
            Mulai istirahat otomatis
          </label>
          <label class="toggle-label">
            <input type="checkbox" id="autoStartPomodoros">
            <span class="toggle-slider"></span>
            Mulai pomodoro otomatis
          </label>
          <label class="toggle-label">
            <input type="checkbox" id="soundNotifications" checked>
            <span class="toggle-slider"></span>
            Notifikasi suara
          </label>
        </div>
      </div>
      <div class="pomodoro-card history-card">
        <h3>Sesi Terbaru</h3>
        <div class="session-history">
          <?php if (empty($recent_sessions)): ?>
            <p class="empty-text">Belum ada sesi. Mulai pomodoro pertama Anda!</p>
          <?php else: ?>
            <?php foreach ($recent_sessions as $session): ?>
              <div class="session-item">
                <div class="session-type">
                  <?php 
                  $icon = $session['type'] === 'work' ? '<i class="fa-solid fa-apple-whole"></i>' : '<i class="fa-solid fa-mug-saucer"></i>';
                  echo $icon;
                  ?>
                </div>
                <div class="session-details">
                  <div class="session-title">
                    <?php if ($session['task_title']): ?>
                      <?php echo htmlspecialchars($session['task_title']); ?>
                    <?php elseif ($session['subject_name']): ?>
                      <?php echo htmlspecialchars($session['subject_name']); ?>
                    <?php else: ?>
                      <?php 
                      $session_labels = [
                        'work' => 'Sesi Kerja',
                        'shortBreak' => 'Istirahat Pendek',
                        'longBreak' => 'Istirahat Panjang'
                      ];
                      echo $session_labels[$session['type']] ?? ucfirst($session['type']) . ' Session'; 
                      ?>
                    <?php endif; ?>
                  </div>
                  <div class="session-meta">
                    <?php echo $session['duration']; ?> menit • 
                    <?php echo date('j M, H:i', strtotime($session['completed_at'])); ?>
                  </div>
                </div>
              </div>
            <?php endforeach; ?>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Session Complete Modal -->
<div id="sessionCompleteModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title" id="sessionCompleteTitle">Sesi Selesai!</h3>
      <button class="modal-close" onclick="hideModal('sessionCompleteModal')">&times;</button>
    </div>
    <div class="modal-body" id="sessionCompleteBody">
      <!-- Content will be populated by JavaScript -->
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="hideModal('sessionCompleteModal')">Lanjutkan</button>
    </div>
  </div>
</div>
