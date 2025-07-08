<aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <div class="logo">
            <img src="assets/images/logo.png" alt="Bloom Logo" style="height: 48px;">
        </div>
    </div>
    
    <nav class="sidebar-nav">
        <ul>
            <li>
                <a href="?page=dashboard" class="nav-link <?php echo $current_page === 'dashboard' ? 'active' : ''; ?>">
                    <span class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                    </span>
                    <span class="sidebar-text">Dashboard</span>
                </a>
            </li>
            <li>
                <a href="?page=tasks" class="nav-link <?php echo $current_page === 'tasks' ? 'active' : ''; ?>">
                    <span class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 11l3 3 8-8"/>
                            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.51 0 2.93.37 4.18 1.03"/>
                        </svg>
                    </span>
                    <span class="sidebar-text">Tugas</span>
                </a>
            </li>
            <li>
                <a href="?page=notes" class="nav-link <?php echo $current_page === 'notes' ? 'active' : ''; ?>">
                    <span class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                        </svg>
                    </span>
                    <span class="sidebar-text">Catatan</span>
                </a>
            </li>
            <li>
                <a href="?page=pomodoro" class="nav-link <?php echo $current_page === 'pomodoro' ? 'active' : ''; ?>">
                    <span class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                        </svg>
                    </span>
                    <span class="sidebar-text">Pomodoro</span>
                </a>
            </li>
            <li>
                <a href="?page=subjects" class="nav-link <?php echo $current_page === 'subjects' ? 'active' : ''; ?>">
                    <span class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                    </span>
                    <span class="sidebar-text">Mata Pelajaran</span>
                </a>
            </li>
        </ul>
    </nav>
    
    <div class="sidebar-footer">
        <div class="user-menu-sidebar">
            <div class="user-info" id="userInfo">
                <div class="user-avatar">
                    <div class="avatar-circle"><?php echo strtoupper(substr($_SESSION['username'], 0, 1)); ?></div>
                </div>
                <div class="user-details">
                    <span class="username"><?php echo $_SESSION['username']; ?></span>
                    <?php
                    // Get current user XP and level from database
                    $database = new Database();
                    $db = $database->getConnection();
                    $user_id = $_SESSION['user_id'];
                    
                    $query = "SELECT total_xp, level FROM users WHERE id = ?";
                    $stmt = $db->prepare($query);
                    $stmt->execute([$user_id]);
                    $user_data = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    $current_xp = $user_data['total_xp'] ?? 0;
                    $current_level = $user_data['level'] ?? 1;
                    $xp_in_current_level = $current_xp % 100;
                    
                    // Update session
                    $_SESSION['total_xp'] = $current_xp;
                    $_SESSION['level'] = $current_level;
                    ?>
                    <span class="user-level">Level <?php echo $current_level; ?></span>
                    <div class="xp-bar">
                        <div class="xp-progress" style="width: <?php echo $xp_in_current_level; ?>%"></div>
                    </div>
                    <span class="xp-text"><?php echo $current_xp; ?> XP</span>
                    <span class="xp-progress-text"><?php echo $xp_in_current_level; ?>/100 ke Level <?php echo $current_level + 1; ?></span>
                </div>
                <span class="user-menu-chevron">▼</span>
            </div>
            
            <div class="user-menu-dropdown-sidebar" id="userMenuDropdownSidebar">
                <a href="?page=profile" class="user-menu-item-sidebar">
                    <span class="user-menu-icon-sidebar">👤</span>
                    Profil
                </a>
                <a href="?page=settings" class="user-menu-item-sidebar">
                    <span class="user-menu-icon-sidebar">⚙️</span>
                    Pengaturan
                </a>
                <a href="#" class="user-menu-item-sidebar">
                    <span class="user-menu-icon-sidebar">❓</span>
                    Bantuan
                </a>
                <a href="auth/logout.php" class="user-menu-item-sidebar">
                    <span class="user-menu-icon-sidebar">🚪</span>
                    Keluar
                </a>
            </div>
        </div>
    </div>
</aside>