<?php
require_once 'config/database.php';
require_once __DIR__ . '/includes/auth.php';

// Check authentication
checkAuth();

$current_page = isset($_GET['page']) ? $_GET['page'] : 'dashboard';
$allowed_pages = ['dashboard', 'tasks', 'subjects', 'notes', 'pomodoro', 'profile'];

if (!in_array($current_page, $allowed_pages)) {
    $current_page = 'dashboard';
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bloom - Aplikasi Produktivitas</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/<?php echo $current_page; ?>.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <meta name="description" content="Bloom - Aplikasi produktivitas modern untuk siswa dan profesional">
    
    <!-- Icons -->
    <link rel="icon" href="assets/images/logo.png" type="image/png">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#000000">
</head>
<body data-theme="light">
    <div class="app-container">
        <!-- Header -->
        <header class="main-header">
          <div class="header-inner">
            <!-- Logo -->
            <a href="?page=dashboard" class="logo">
                <img src="assets/images/logo.png" alt="Bloom Logo" style="height: 48px;">
            </a>
            
            <!-- Search Container -->
            <div class="search-container">
                <span class="search-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
                <input type="text" id="searchInput" placeholder="Cari tugas, catatan, mata pelajaran..." class="search-input">
                <div class="search-suggestions" id="searchSuggestions"></div>
            </div>
            
            <!-- User Menu -->
            <div class="user-menu">
                <button class="user-trigger" id="userTrigger">
                    <div class="user-avatar">
                        <?php echo isset($_SESSION['username']) ? strtoupper(substr($_SESSION['username'], 0, 1)) : '?'; ?>
                    </div>
                    <div class="user-info">
                        <span class="username"><?php echo isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : 'User'; ?></span>
                        <span class="user-level">Level <?php echo isset($_SESSION['level']) ? $_SESSION['level'] : 1; ?></span>
                    </div>
                    <i class="fa-solid fa-chevron-down user-chevron"></i>
                </button>
                <div class="user-dropdown-menu" id="userDropdownMenu">
                    <a href="?page=dashboard" class="user-dropdown-item <?php echo $current_page === 'dashboard' ? 'active' : ''; ?>">
                        <i class="fa-solid fa-table-cells-large nav-icon"></i>
                        Dashboard
                    </a>
                    <a href="?page=tasks" class="user-dropdown-item <?php echo $current_page === 'tasks' ? 'active' : ''; ?>">
                        <i class="fa-solid fa-list-check nav-icon"></i>
                        Tugas
                    </a>
                    <a href="?page=subjects" class="user-dropdown-item <?php echo $current_page === 'subjects' ? 'active' : ''; ?>">
                        <i class="fa-solid fa-book nav-icon"></i>
                        Mata Pelajaran
                    </a>
                    <a href="?page=notes" class="user-dropdown-item <?php echo $current_page === 'notes' ? 'active' : ''; ?>">
                        <i class="fa-solid fa-note-sticky nav-icon"></i>
                        Catatan
                    </a>
                    <a href="?page=pomodoro" class="user-dropdown-item <?php echo $current_page === 'pomodoro' ? 'active' : ''; ?>">
                        <i class="fa-solid fa-clock nav-icon"></i>
                        Pomodoro
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="?page=profile" class="user-dropdown-item">
                        <i class="fa-solid fa-user nav-icon"></i>
                        Profil
                    </a>
                    <a href="auth/logout.php" class="user-dropdown-item" style="color: #ef4444;">
                        <i class="fa-solid fa-arrow-right-from-bracket nav-icon"></i>
                        Keluar
                    </a>
                </div>
            </div>
          </div>
        </header>
        
        <!-- Main Content -->
        <main class="main-content">
            <div class="page-content">
                <?php include "pages/{$current_page}.php"; ?>
            </div>
        </main>
    </div>
    
    <?php include 'components/modals.php'; ?>
    
    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="loading-overlay hidden">
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Memuat...</p>
        </div>
    </div>
    
    <script src="assets/js/main.js"></script>
    <script src="assets/js/<?php echo $current_page; ?>.js"></script>

    <!-- Bloom Footer -->
    <footer id="bloom-footer" class="bloom-footer">
        <div class="footer-content">
            <div class="footer-brand-social">
                <a href="?page=dashboard" class="footer-logo">
                    <img src="assets/images/logo.png" alt="Bloom Logo" style="height: 40px;">
                </a>
            </div>
            <nav class="footer-menu-nav">
                <ul class="footer-menu-list">
                    <li><a href="?page=dashboard"><i class="fa-solid fa-table-cells-large"></i> Dashboard</a></li>
                    <li><a href="?page=tasks"><i class="fa-solid fa-list-check"></i> Tugas</a></li>
                    <li><a href="?page=subjects"><i class="fa-solid fa-book"></i> Mata Pelajaran</a></li>
                    <li><a href="?page=notes"><i class="fa-solid fa-note-sticky"></i> Catatan</a></li>
                    <li><a href="?page=pomodoro"><i class="fa-solid fa-clock"></i> Pomodoro</a></li>
                    <li><a href="?page=profile"><i class="fa-solid fa-user"></i> Profil</a></li>
                </ul>
            </nav>
        </div>
        <div class="footer-bottom">
            <div class="footer-copyright">
                &copy; <?php echo date('Y'); ?> Bloom Productivity. Crafted with passion by Safira Inayah.
            </div>
        </div>
    </footer>
    
    <!-- End Bloom Footer -->
</body>
</html>