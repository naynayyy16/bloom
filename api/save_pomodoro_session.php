<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

checkAuth();

$database = new Database();
$db = $database->getConnection();
$user_id = $_SESSION['user_id'];

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid input data');
    }
    
    // Validate required fields
    if (!isset($input['type']) || !isset($input['duration'])) {
        throw new Exception('Type and duration are required');
    }
    
    // Map session type to database enum
    $session_type = '';
    switch ($input['type']) {
        case 'work':
            $session_type = 'work';
            break;
        case 'shortBreak':
            $session_type = 'short_break';
            break;
        case 'longBreak':
            $session_type = 'long_break';
            break;
        default:
            throw new Exception('Invalid session type');
    }
    
    // Insert session into database
    $query = "INSERT INTO pomodoro_sessions (user_id, task_id, subject_id, type, duration, completed_at) 
              VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $db->prepare($query);
    
    $task_id = !empty($input['task_id']) ? (int)$input['task_id'] : null;
    $subject_id = !empty($input['subject_id']) ? (int)$input['subject_id'] : null;
    $duration = (int)$input['duration'];
    $completed_at = isset($input['completed_at']) ? $input['completed_at'] : date('Y-m-d H:i:s');
    
    $stmt->execute([
        $user_id,
        $task_id,
        $subject_id,
        $session_type,
        $duration,
        $completed_at
    ]);
    
    $session_id = $db->lastInsertId();
    
    // Add XP for completed work sessions
    $xp_result = null;
    if ($session_type === 'work') {
                        require_once __DIR__ . '/xp_system.php';
        $xp_result = completePomodoroAndAddXP($db, $user_id, $session_id);
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'Session saved successfully',
        'session_id' => $session_id,
        'xp_result' => $xp_result
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 