<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../includes/auth.php';

checkAuth();

$database = new Database();
$db = $database->getConnection();
$user_id = $_SESSION['user_id'];

try {
    // Get sessions completed today
    $query = "SELECT COUNT(*) as sessions_today 
              FROM pomodoro_sessions 
              WHERE user_id = ? AND type = 'work' AND DATE(completed_at) = CURDATE()";
    $stmt = $db->prepare($query);
    $stmt->execute([$user_id]);
    $today_result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get sessions completed this week (last 7 days)
    $query = "SELECT COUNT(*) as sessions_week 
              FROM pomodoro_sessions 
              WHERE user_id = ? AND type = 'work' AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    $stmt = $db->prepare($query);
    $stmt->execute([$user_id]);
    $week_result = $stmt->fetch(PDO::FETCH_ASSOC);
    
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
    $streak_result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get total sessions
    $query = "SELECT COUNT(*) as total_sessions 
              FROM pomodoro_sessions 
              WHERE user_id = ? AND type = 'work'";
    $stmt = $db->prepare($query);
    $stmt->execute([$user_id]);
    $total_result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get total time spent in work sessions (in minutes)
    $query = "SELECT SUM(duration) as total_minutes 
              FROM pomodoro_sessions 
              WHERE user_id = ? AND type = 'work'";
    $stmt = $db->prepare($query);
    $stmt->execute([$user_id]);
    $time_result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stats = [
        'sessions_today' => (int)$today_result['sessions_today'],
        'sessions_week' => (int)$week_result['sessions_week'],
        'streak' => (int)$streak_result['streak'],
        'total_sessions' => (int)$total_result['total_sessions'],
        'total_minutes' => (int)$time_result['total_minutes'],
        'total_hours' => round((int)$time_result['total_minutes'] / 60, 1)
    ];
    
    echo json_encode(['success' => true, 'stats' => $stats]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 