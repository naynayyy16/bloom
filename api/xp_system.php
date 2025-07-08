<?php
// XP System Functions - No HTTP handling when included as library
// This file is designed to be included by other API files, not called directly

// Only handle HTTP requests if this file is called directly
if (basename($_SERVER['SCRIPT_NAME']) === basename(__FILE__)) {
    // Clear any output buffers
    while (ob_get_level()) {
        ob_end_clean();
    }

    // Start output buffering
    ob_start();

    header('Content-Type: application/json');
    require_once __DIR__ . '/../config/database.php';
    require_once __DIR__ . '/../includes/auth.php';

    checkAuth();

    $database = new Database();
    $db = $database->getConnection();
    $user_id = $_SESSION['user_id'];

    $method = $_SERVER['REQUEST_METHOD'];

    try {
        switch ($method) {
            case 'POST':
                handleXPPostRequest($db, $user_id);
                break;
            case 'GET':
                handleXPGetRequest($db, $user_id);
                break;
            default:
                throw new Exception('Method not allowed');
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function handleXPPostRequest($db, $user_id) {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'add_xp':
            $xp_amount = (int)($input['xp_amount'] ?? 0);
            $activity_type = $input['activity_type'] ?? '';
            $activity_id = $input['activity_id'] ?? null;
            
            if ($xp_amount <= 0) {
                throw new Exception('XP amount must be positive');
            }
            
            $result = addXP($db, $user_id, $xp_amount, $activity_type, $activity_id);
            echo json_encode($result);
            break;
            
        case 'complete_task':
            $task_id = (int)($input['task_id'] ?? 0);
            if (!$task_id) {
                throw new Exception('Task ID is required');
            }
            
            $result = completeTaskAndAddXP($db, $user_id, $task_id);
            echo json_encode($result);
            break;
            
        case 'complete_pomodoro':
            $session_id = (int)($input['session_id'] ?? 0);
            if (!$session_id) {
                throw new Exception('Session ID is required');
            }
            
            $result = completePomodoroAndAddXP($db, $user_id, $session_id);
            echo json_encode($result);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
}

function handleXPGetRequest($db, $user_id) {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'user_stats':
            $stats = getUserXPStats($db, $user_id);
            echo json_encode(['success' => true, 'stats' => $stats]);
            break;
            
        case 'xp_history':
            $history = getXPHistory($db, $user_id);
            echo json_encode(['success' => true, 'history' => $history]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
}

function addXP($db, $user_id, $xp_amount, $activity_type, $activity_id = null) {
    try {
        $db->beginTransaction();
        
        $result = addXPWithoutTransaction($db, $user_id, $xp_amount, $activity_type, $activity_id);
        
        $db->commit();
        
        return $result;
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

function addXPWithoutTransaction($db, $user_id, $xp_amount, $activity_type, $activity_id = null) {
        error_log("addXPWithoutTransaction called - User: $user_id, XP: $xp_amount, Type: $activity_type");
        
        try {
            // Update user's total XP and level
            $query = "UPDATE users SET total_xp = total_xp + ? WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$xp_amount, $user_id]);
            error_log("XP update query executed");
            
            // Get current total XP and calculate new level
            $query = "SELECT total_xp FROM users WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$user_id]);
            $user_data = $stmt->fetch(PDO::FETCH_ASSOC);
            $new_total_xp = $user_data['total_xp'];
            // Calculate new level - PERBAIKAN  
            $new_level = floor($new_total_xp / 100) + 1;
            // Add debug logging
            error_log("XP Update - User: $user_id, Total XP: $new_total_xp, New Level: $new_level");
            
            // Update level
            $query = "UPDATE users SET level = ? WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$new_level, $user_id]);
            error_log("Level update query executed");
            
            // Get updated user data
            $query = "SELECT total_xp, level FROM users WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("User data retrieved: " . json_encode($user));
            
            // Get old level for comparison (from database, not session)
            $query_old = "SELECT level FROM users WHERE id = ?";
            $stmt_old = $db->prepare($query_old);
            $stmt_old->execute([$user_id]);
            $old_user = $stmt_old->fetch(PDO::FETCH_ASSOC);
            $old_level = $old_user ? $old_user['level'] : 1;
            
            // Log XP activity
            $query = "INSERT INTO xp_activities (user_id, xp_amount, activity_type, activity_id, created_at) 
                      VALUES (?, ?, ?, ?, NOW())";
            $stmt = $db->prepare($query);
            $stmt->execute([$user_id, $xp_amount, $activity_type, $activity_id]);
            error_log("XP activity logged");
            
            // Update session only if session is active
            if (session_status() === PHP_SESSION_ACTIVE) {
                $_SESSION['total_xp'] = $user['total_xp'];
                $_SESSION['level'] = $user['level'];
                error_log("Session updated");
            } else {
                error_log("Session not active, skipping session update");
            }
            
            $result = [
                'success' => true,
                'xp_added' => $xp_amount,
                'new_total_xp' => $user['total_xp'],
                'new_level' => $user['level'],
                'leveled_up' => $user['level'] > $old_level
            ];
            
            error_log("addXPWithoutTransaction returning: " . json_encode($result));
            return $result;
            
        } catch (Exception $e) {
            error_log("Error in addXPWithoutTransaction: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
            error_log("Stack trace: " . $e->getTraceAsString());
            throw $e;
        }
}

function completeTaskAndAddXP($db, $user_id, $task_id) {
    // Prevent header issues
    if (headers_sent($file, $line)) {
        error_log("Headers already sent when calling completeTaskAndAddXP in $file:$line");
    }
    
    // DEBUG: Log function call
    error_log("completeTaskAndAddXP called - User: $user_id, Task: $task_id");
    
    try {
        // Check if task exists and belongs to user (but don't check completed status since it's already updated)
        $query = "SELECT * FROM tasks WHERE id = ? AND user_id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$task_id, $user_id]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$task) {
            error_log("Task not found: $task_id for user: $user_id");
            throw new Exception('Task not found');
        }
        
        error_log("Task found: " . json_encode($task));
        
        // Don't update task status here - it's already handled in the main tasks.php file
        // Just calculate and add XP
        
        // Calculate XP based on task priority
        $xp_amount = 0;
        switch ($task['priority']) {
            case 'high':
                $xp_amount = 25;
                break;
            case 'medium':
                $xp_amount = 15;
                break;
            case 'low':
                $xp_amount = 10;
                break;
            default:
                $xp_amount = 15;
        }
        
        error_log("Calculated XP amount: $xp_amount for priority: " . $task['priority']);
        
        // Add XP without transaction (since it's called from within another transaction)
        $xp_result = addXPWithoutTransaction($db, $user_id, $xp_amount, 'task_completion', $task_id);
        
        error_log("XP result: " . json_encode($xp_result));
        
        $result = [
            'success' => true,
            'task_completed' => true,
            'xp_result' => $xp_result
        ];
        
        error_log("completeTaskAndAddXP returning: " . json_encode($result));
        return $result;
        
    } catch (Exception $e) {
        error_log("Error in completeTaskAndAddXP: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
        error_log("Stack trace: " . $e->getTraceAsString());
        throw $e;
    }
}

function completePomodoroAndAddXP($db, $user_id, $session_id) {
    try {
        $db->beginTransaction();
        
        // Check if session exists and belongs to user
        $query = "SELECT * FROM pomodoro_sessions WHERE id = ? AND user_id = ? AND type = 'work'";
        $stmt = $db->prepare($query);
        $stmt->execute([$session_id, $user_id]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$session) {
            throw new Exception('Session not found');
        }
        
        // Calculate XP based on session duration (1 XP per 5 minutes)
        $xp_amount = max(1, floor($session['duration'] / 5));
        
        // Add XP
        $xp_result = addXP($db, $user_id, $xp_amount, 'pomodoro_completion', $session_id);
        
        $db->commit();
        
        return [
            'success' => true,
            'session_completed' => true,
            'xp_result' => $xp_result
        ];
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

function getUserXPStats($db, $user_id) {
    // Get user's current XP and level
    $query = "SELECT total_xp, level FROM users WHERE id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
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
    
    return [
        'total_xp' => $user['total_xp'],
        'level' => $user['level'],
        'xp_in_current_level' => $xp_in_current_level,
        'xp_needed_for_next_level' => $xp_needed_for_next_level,
        'progress_to_next_level' => $progress_to_next_level,
        'xp_today' => (int)$today_result['xp_today'],
        'xp_week' => (int)$week_result['xp_week']
    ];
}

function getXPHistory($db, $user_id) {
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
              LIMIT 50";
    $stmt = $db->prepare($query);
    $stmt->execute([$user_id]);
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?> 