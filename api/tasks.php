<?php
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
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            handleGetRequest($db, $user_id, $action);
            break;
        case 'POST':
            handlePostRequest($db, $user_id);
            break;
        case 'PUT':
            handlePutRequest($db, $user_id);
            break;
        case 'DELETE':
            handleDeleteRequest($db, $user_id);
            break;
        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    error_log("Tasks API Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (Error $e) {
    error_log("Tasks API Fatal Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error']);
}

function handleGetRequest($db, $user_id, $action) {
    switch ($action) {
        case 'list':
            $query = "SELECT t.*, s.name as subject_name, s.color as subject_color 
                      FROM tasks t 
                      LEFT JOIN subjects s ON t.subject_id = s.id 
                      WHERE t.user_id = ? 
                      ORDER BY t.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute([$user_id]);
            $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'tasks' => $tasks]);
            break;
            
        case 'recent':
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 5;
            $query = "SELECT t.*, s.name as subject_name, s.color as subject_color 
                      FROM tasks t 
                      LEFT JOIN subjects s ON t.subject_id = s.id 
                      WHERE t.user_id = ? 
                      ORDER BY t.created_at DESC 
                      LIMIT $limit";
            $stmt = $db->prepare($query);
            $stmt->execute([$user_id]);
            $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'tasks' => $tasks]);
            break;
            
        case 'stats':
            $stats = [];
            
            // Total tasks
            $query = "SELECT COUNT(*) as total FROM tasks WHERE user_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$user_id]);
            $stats['total_tasks'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Completed tasks
            $query = "SELECT COUNT(*) as total FROM tasks WHERE user_id = ? AND completed = 1";
            $stmt = $db->prepare($query);
            $stmt->execute([$user_id]);
            $stats['completed_tasks'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Total subjects
            $query = "SELECT COUNT(*) as total FROM subjects WHERE user_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$user_id]);
            $stats['total_subjects'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Pomodoro sessions today
            $query = "SELECT COUNT(*) as total FROM pomodoro_sessions WHERE user_id = ? AND DATE(completed_at) = CURDATE()";
            $stmt = $db->prepare($query);
            $stmt->execute([$user_id]);
            $stats['pomodoro_sessions'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            echo json_encode(['success' => true, 'stats' => $stats]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
}

function handlePostRequest($db, $user_id) {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    // Debug logging
    error_log("Tasks POST Request - Action: " . $action . ", User: " . $user_id);
    error_log("Input data: " . json_encode($input));
    
    // Validate input
    if (!$input) {
        error_log("Error: Invalid JSON input");
        throw new Exception('Invalid input data');
    }
    
    if (!$action) {
        error_log("Error: No action specified");
        throw new Exception('Action is required');
    }
    
    switch ($action) {
        case 'create':
            error_log("Processing CREATE action");
            $task = $input['task'];
            error_log("Task data: " . json_encode($task));
            
            // Validate required fields
            if (!isset($task['title']) || empty($task['title'])) {
                error_log("Error: Task title is required");
                throw new Exception('Task title is required');
            }
            
            if (!isset($task['priority'])) {
                error_log("Error: Task priority is required");
                throw new Exception('Task priority is required');
            }
            
            if (!isset($task['status'])) {
                error_log("Error: Task status is required");
                throw new Exception('Task status is required');
            }
            
            $query = "INSERT INTO tasks (user_id, subject_id, title, description, priority, status, due_date, completed) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $db->prepare($query);
            $completed = $task['status'] === 'completed' ? 1 : 0;
            
            try {
                $stmt->execute([
                    $user_id,
                    $task['subject_id'] ?: null,
                    $task['title'],
                    $task['description'] ?: null,
                    $task['priority'],
                    $task['status'],
                    $task['due_date'] ?: null,
                    $completed
                ]);
                
                $new_id = $db->lastInsertId();
                error_log("Task created successfully with ID: " . $new_id);
                
                // TAMBAHKAN DEBUG SEBELUM RESPONSE:
                error_log("About to send response (create) with ID: " . $new_id);
                
                $response = json_encode(['success' => true, 'id' => $new_id]);
                error_log("About to send response (create): " . $response);
                
                // Clear any output before sending response
                ob_clean();
                echo $response;
                
                // TAMBAHKAN DEBUG SETELAH RESPONSE:
                error_log("Response sent successfully (create)");
            } catch (Exception $e) {
                error_log("Error creating task: " . $e->getMessage());
                throw $e;
            }
            break;
            
        case 'update':
            error_log("Processing UPDATE action");
            $task = $input['task'];
            error_log("Task data: " . json_encode($task));
            
            // Validate required fields
            if (!isset($task['id']) || empty($task['id'])) {
                error_log("Error: Task ID is required for update");
                throw new Exception('Task ID is required for update');
            }
            
            if (!isset($task['title']) || empty($task['title'])) {
                error_log("Error: Task title is required");
                throw new Exception('Task title is required');
            }
            
            if (!isset($task['priority'])) {
                error_log("Error: Task priority is required");
                throw new Exception('Task priority is required');
            }
            
            if (!isset($task['status'])) {
                error_log("Error: Task status is required");
                throw new Exception('Task status is required');
            }
            
            // Check if task is being marked as completed
            $was_completed = false;
            $is_being_completed = false;
            
            if (isset($task['id'])) {
                // Get current task status
                $query = "SELECT completed, status FROM tasks WHERE id = ? AND user_id = ?";
                $stmt = $db->prepare($query);
                $stmt->execute([$task['id'], $user_id]);
                $current_task = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($current_task) {
                    $was_completed = $current_task['completed'] == 1;
                    $is_being_completed = ($task['status'] === 'completed' && !$was_completed);
                    error_log("Task completion check - was_completed: " . ($was_completed ? 'true' : 'false') . ", is_being_completed: " . ($is_being_completed ? 'true' : 'false'));
                }
            }
            
            try {
                $query = "UPDATE tasks SET subject_id = ?, title = ?, description = ?, priority = ?, 
                          status = ?, due_date = ?, completed = ? 
                          WHERE id = ? AND user_id = ?";
                $stmt = $db->prepare($query);
                $completed = $task['status'] === 'completed' ? 1 : 0;
                $stmt->execute([
                    $task['subject_id'] ?: null,
                    $task['title'],
                    $task['description'] ?: null,
                    $task['priority'],
                    $task['status'],
                    $task['due_date'] ?: null,
                    $completed,
                    $task['id'],
                    $user_id
                ]);
                
                                error_log("Task updated successfully");

                // TAMBAHKAN DEBUG INI:
                error_log("About to check XP - is_being_completed: " . ($is_being_completed ? 'true' : 'false'));

                // If task was just completed, add XP
                $xp_result = null;
                if ($is_being_completed) {
                    error_log("Task is being completed, adding XP...");
                    error_log("Session data before XP: " . json_encode($_SESSION));
                    error_log("Database connection status: " . ($db ? 'Connected' : 'Not connected'));
                    
                    // Try XP addition with timeout
                    $xp_success = false;
                    $start_time = microtime(true);
                    
                    try {
                        error_log("Adding XP for completed task - Task ID: " . $task['id']);
                        
                        // Check if XP system file exists
                        $xp_file = __DIR__ . '/xp_system.php';
                        if (!file_exists($xp_file)) {
                            throw new Exception('XP system file not found: ' . $xp_file);
                        }
                        
                        require_once $xp_file;
                        
                        // Check if function exists
                        if (!function_exists('completeTaskAndAddXP')) {
                            throw new Exception('completeTaskAndAddXP function not found');
                        }
                        
                        $xp_result = completeTaskAndAddXP($db, $user_id, $task['id']);
                        error_log("XP added successfully: " . json_encode($xp_result));
                        error_log("Session data after XP: " . json_encode($_SESSION));
                        $xp_success = true;
                    } catch (Exception $xp_error) {
                        // Log XP error but don't fail the task update
                        error_log("XP Error in update: " . $xp_error->getMessage() . " in " . $xp_error->getFile() . " on line " . $xp_error->getLine());
                        error_log("XP Error stack trace: " . $xp_error->getTraceAsString());
                        $xp_result = ['success' => false, 'message' => $xp_error->getMessage()];
                    } catch (Error $xp_error) {
                        // Log fatal errors too
                        error_log("XP Fatal Error in update: " . $xp_error->getMessage() . " in " . $xp_error->getFile() . " on line " . $xp_error->getLine());
                        error_log("XP Fatal Error stack trace: " . $xp_error->getTraceAsString());
                        $xp_result = ['success' => false, 'message' => 'Fatal error: ' . $xp_error->getMessage()];
                    }
                    
                    $end_time = microtime(true);
                    $duration = ($end_time - $start_time) * 1000; // Convert to milliseconds
                    error_log("XP operation took: " . $duration . "ms, Success: " . ($xp_success ? 'true' : 'false'));
                    
                    // If XP failed, we still want to complete the task
                    if (!$xp_success) {
                        error_log("XP addition failed, but task update will continue");
                    }
                } else {
                    error_log("Task not being completed, skipping XP");
                }

                // TAMBAHKAN DEBUG SEBELUM RESPONSE:
                error_log("About to send response with XP result: " . json_encode($xp_result));

                $response = json_encode([
                    'success' => true,
                    'xp_result' => $xp_result
                ]);
                error_log("About to send response (update): " . $response);
                
                // Clear any output before sending response
                ob_clean();
                echo $response;

                // TAMBAHKAN DEBUG SETELAH RESPONSE:
                error_log("Response sent successfully");
            } catch (Exception $e) {
                error_log("Error updating task: " . $e->getMessage());
                throw $e;
            }
            break;
            
        case 'delete':
            $id = $input['id'];
            $query = "DELETE FROM tasks WHERE id = ? AND user_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$id, $user_id]);
            
            echo json_encode(['success' => true]);
            break;
            
        case 'update_status':
            $task = $input['task'];
            if (!isset($task['id']) || !isset($task['status'])) {
                throw new Exception('Task ID and status are required');
            }

            // Get current task status
            $query = "SELECT completed, status FROM tasks WHERE id = ? AND user_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$task['id'], $user_id]);
            $current_task = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$current_task) {
                throw new Exception('Task not found');
            }

            $was_completed = $current_task['completed'] == 1;
            $is_being_completed = ($task['status'] === 'completed' && !$was_completed);

            $completed = $task['status'] === 'completed' ? 1 : 0;
            $query = "UPDATE tasks SET status = ?, completed = ? WHERE id = ? AND user_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([
                $task['status'],
                $completed,
                $task['id'],
                $user_id
            ]);

            error_log("Task status updated successfully (update_status)");

            // TAMBAHKAN DEBUG INI:
            error_log("About to check XP (update_status) - is_being_completed: " . ($is_being_completed ? 'true' : 'false'));

            // If task was just completed, add XP
            $xp_result = null;
            if ($is_being_completed) {
                error_log("Task is being completed (update_status), adding XP...");
                try {
                    error_log("Adding XP for completed task (update_status) - Task ID: " . $task['id']);
                    
                    // Check if XP system file exists
                    $xp_file = __DIR__ . '/xp_system.php';
                    if (!file_exists($xp_file)) {
                        throw new Exception('XP system file not found: ' . $xp_file);
                    }
                    
                    require_once $xp_file;
                    
                    // Check if function exists
                    if (!function_exists('completeTaskAndAddXP')) {
                        throw new Exception('completeTaskAndAddXP function not found');
                    }
                    
                    $xp_result = completeTaskAndAddXP($db, $user_id, $task['id']);
                    error_log("XP added successfully (update_status): " . json_encode($xp_result));
                } catch (Exception $xp_error) {
                    // Log XP error but don't fail the task update
                    error_log("XP Error in update_status: " . $xp_error->getMessage() . " in " . $xp_error->getFile() . " on line " . $xp_error->getLine());
                    $xp_result = ['success' => false, 'message' => $xp_error->getMessage()];
                } catch (Error $xp_error) {
                    // Log fatal errors too
                    error_log("XP Fatal Error in update_status: " . $xp_error->getMessage() . " in " . $xp_error->getFile() . " on line " . $xp_error->getLine());
                    $xp_result = ['success' => false, 'message' => 'Fatal error: ' . $xp_error->getMessage()];
                }
            } else {
                error_log("Task not being completed (update_status), skipping XP");
            }

            // TAMBAHKAN DEBUG SEBELUM RESPONSE:
            error_log("About to send response (update_status) with XP result: " . json_encode($xp_result));

            $response = json_encode([
                'success' => true,
                'xp_result' => $xp_result
            ]);
            error_log("About to send response (update_status): " . $response);
            
            // Clear any output before sending response
            ob_clean();
            echo $response;

            // TAMBAHKAN DEBUG SETELAH RESPONSE:
            error_log("Response sent successfully (update_status)");
            break;
            
        default:
            throw new Exception('Invalid action');
    }
}

function handlePutRequest($db, $user_id) {
    // Handle PUT requests if needed
    handlePostRequest($db, $user_id);
}

function handleDeleteRequest($db, $user_id) {
    $id = $_GET['id'] ?? '';
    if (!$id) {
        throw new Exception('Task ID required');
    }
    
    $query = "DELETE FROM tasks WHERE id = ? AND user_id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$id, $user_id]);
    
    echo json_encode(['success' => true]);
}
?>
