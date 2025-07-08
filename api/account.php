<?php
// api/account.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
error_log('SESSION: ' . print_r($_SESSION, true));

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized - No user_id in session']);
    exit;
}

$database = new Database();
$db = $database->getConnection();
$user_id = $_SESSION['user_id'];

$method = $_SERVER['REQUEST_METHOD'];
error_log('RAW INPUT: ' . file_get_contents('php://input'));
$input = json_decode(file_get_contents('php://input'), true);

try {
    if ($method === 'POST') {
        $action = $input['action'] ?? '';
        error_log('Action received: ' . $action);
        
        switch ($action) {
            case 'update_profile':
                // Update username and email
                $username = trim($input['username'] ?? '');
                $email = trim($input['email'] ?? '');
                
                if (empty($username) || empty($email)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Username and email are required']);
                    exit;
                }
                
                // Validate email format
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
                    exit;
                }
                
                // Check if email already exists (excluding current user)
                $stmt = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                $stmt->execute([$email, $user_id]);
                if ($stmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Email already exists']);
                    exit;
                }
                
                // Update user profile
                $stmt = $db->prepare("UPDATE users SET username = ?, email = ? WHERE id = ?");
                $stmt->execute([$username, $email, $user_id]);
                
                // Update session
                $_SESSION['username'] = $username;
                $_SESSION['email'] = $email;
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Profile updated successfully'
                ]);
                break;
                
            case 'change_password':
                // Change password
                $current_password = $input['current_password'] ?? '';
                $new_password = $input['new_password'] ?? '';
                
                if (empty($current_password) || empty($new_password)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Current and new password are required']);
                    exit;
                }
                
                if (strlen($new_password) < 6) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
                    exit;
                }
                
                // Verify current password
                $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
                $stmt->execute([$user_id]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!password_verify($current_password, $user['password'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
                    exit;
                }
                
                // Hash new password and update
                $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
                $stmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
                $stmt->execute([$hashed_password, $user_id]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Password changed successfully'
                ]);
                break;
                
            case 'delete_account':
                error_log('=== DELETE ACCOUNT STARTED ===');
                error_log('User ID to delete: ' . $user_id);
                
                // Delete account and all associated data
                $db->beginTransaction();
                
                try {
                    // First, check if user exists
                    $stmt = $db->prepare("SELECT id FROM users WHERE id = ?");
                    $stmt->execute([$user_id]);
                    if (!$stmt->fetch()) {
                        error_log('ERROR: User not found in database');
                        throw new Exception('User not found');
                    }
                    
                    error_log('User found in database, proceeding with deletion...');
                    
                    // Delete user's data (cascade will handle related records)
                    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
                    $result = $stmt->execute([$user_id]);
                    
                    if (!$result) {
                        error_log('ERROR: DELETE query failed');
                        throw new Exception('Failed to delete user account');
                    }
                    
                    error_log('User deleted successfully from database');
                    $db->commit();
                    
                    // Destroy session
                    session_destroy();
                    error_log('Session destroyed');
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Account deleted successfully'
                    ]);
                    
                } catch (Exception $e) {
                    $db->rollback();
                    error_log("Delete account error: " . $e->getMessage());
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to delete account: ' . $e->getMessage()
                    ]);
                    exit;
                }
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
                break;
        }
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    error_log("Account API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>