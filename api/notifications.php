<?php
// api/notifications.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'POST':
            $action = $_GET['action'] ?? '';
            
            switch ($action) {
                case 'request-permission':
                    // This endpoint is called after user grants permission in browser
                    // We just acknowledge the permission status
                    $permission = $input['permission'] ?? 'default';
                    
                    echo json_encode([
                        'success' => true,
                        'permission' => $permission,
                        'message' => 'Permission status updated'
                    ]);
                    break;
                    
                case 'send-test':
                    // Send test notification data (client-side will actually display it)
                    echo json_encode([
                        'success' => true,
                        'notification' => [
                            'title' => 'Bloom Test Notification',
                            'body' => 'Browser notifications are working correctly!',
                            'icon' => '/assets/icons/bloom-icon-192.png',
                            'tag' => 'test-notification'
                        ]
                    ]);
                    break;
                    
                default:
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid action']);
                    break;
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>