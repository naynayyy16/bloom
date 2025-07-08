<?php
// api/settings.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$database = new Database();
$db = $database->getConnection();
$user_id = $_SESSION['user_id'];

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            // Get all settings untuk user
            $stmt = $db->prepare("SELECT setting_key, setting_value FROM user_settings WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            // Set default values jika setting belum ada
            $defaultSettings = [
                'theme' => 'light',
                'sidebar_default' => 'collapsed',
                'task_reminders' => 'true',
                'pomodoro_notifications' => 'true',
                'browser_notifications' => 'false',
                'default_pomodoro_duration' => '25',
                'auto_start_breaks' => 'true',
                'task_auto_complete' => 'true'
            ];
            
            $settings = array_merge($defaultSettings, $settings);
            
            echo json_encode([
                'success' => true,
                'settings' => $settings
            ]);
            break;
            
        case 'POST':
            // Update single setting
            if (!isset($input['setting_key']) || !isset($input['setting_value'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Setting key and value are required']);
                exit;
            }
            
            $setting_key = $input['setting_key'];
            $setting_value = $input['setting_value'];
            
            // Validate setting key
            $validSettings = [
                'theme', 'sidebar_default', 'task_reminders', 'pomodoro_notifications',
                'browser_notifications', 'default_pomodoro_duration', 'auto_start_breaks',
                'task_auto_complete'
            ];
            
            if (!in_array($setting_key, $validSettings)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid setting key']);
                exit;
            }
            
            // Insert atau update setting
            $stmt = $db->prepare("
                INSERT INTO user_settings (user_id, setting_key, setting_value) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            ");
            
            $stmt->execute([$user_id, $setting_key, $setting_value]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Setting updated successfully'
            ]);
            break;
            
        case 'PUT':
            // Update multiple settings sekaligus
            if (!isset($input['settings']) || !is_array($input['settings'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Settings array is required']);
                exit;
            }
            
            $validSettings = [
                'theme', 'sidebar_default', 'task_reminders', 'pomodoro_notifications',
                'browser_notifications', 'default_pomodoro_duration', 'auto_start_breaks',
                'task_auto_complete'
            ];
            
            $db->beginTransaction();
            
            try {
                $stmt = $db->prepare("
                    INSERT INTO user_settings (user_id, setting_key, setting_value) 
                    VALUES (?, ?, ?) 
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
                ");
                
                foreach ($input['settings'] as $key => $value) {
                    if (in_array($key, $validSettings)) {
                        $stmt->execute([$user_id, $key, $value]);
                    }
                }
                
                $db->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Settings updated successfully'
                ]);
                
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
            break;
            
        case 'DELETE':
            // Reset settings ke default
            $stmt = $db->prepare("DELETE FROM user_settings WHERE user_id = ?");
            $stmt->execute([$user_id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Settings reset to default'
            ]);
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