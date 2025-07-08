<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'preview' && isset($_GET['subject_id'])) {
            getSubjectPreview($db, $user_id, $_GET['subject_id']);
        } else {
            getSubjects($db, $user_id);
        }
        break;
    case 'POST':
        createSubject($db, $user_id);
        break;
    case 'PUT':
        updateSubject($db, $user_id);
        break;
    case 'DELETE':
        deleteSubject($db, $user_id);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getSubjects($db, $user_id) {
    try {
        $query = "SELECT s.*, 
                  COUNT(t.id) as total_tasks,
                  COUNT(CASE WHEN t.completed = 1 THEN 1 END) as completed_tasks
                  FROM subjects s 
                  LEFT JOIN tasks t ON s.id = t.subject_id 
                  WHERE s.user_id = ? 
                  GROUP BY s.id 
                  ORDER BY s.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute([$user_id]);
        $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $subjects]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getSubjectPreview($db, $user_id, $subject_id) {
    try {
        // Get subject details
        $query = "SELECT * FROM subjects WHERE id = ? AND user_id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$subject_id, $user_id]);
        $subject = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$subject) {
            http_response_code(404);
            echo json_encode(['error' => 'Subject not found']);
            return;
        }
        
        // Get task statistics
        $query = "SELECT 
                  COUNT(*) as total_tasks,
                  COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_tasks
                  FROM tasks 
                  WHERE subject_id = ? AND user_id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$subject_id, $user_id]);
        $taskStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get note count
        $query = "SELECT COUNT(*) as total_notes FROM notes WHERE subject_id = ? AND user_id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$subject_id, $user_id]);
        $noteStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get recent tasks (limit 5)
        $query = "SELECT id, title, description, completed, due_date, priority, created_at 
                  FROM tasks 
                  WHERE subject_id = ? AND user_id = ? 
                  ORDER BY created_at DESC 
                  LIMIT 5";
        $stmt = $db->prepare($query);
        $stmt->execute([$subject_id, $user_id]);
        $recentTasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get recent notes (limit 5)
        $query = "SELECT id, title, content, created_at, updated_at 
                  FROM notes 
                  WHERE subject_id = ? AND user_id = ? 
                  ORDER BY updated_at DESC 
                  LIMIT 5";
        $stmt = $db->prepare($query);
        $stmt->execute([$subject_id, $user_id]);
        $recentNotes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $previewData = [
            'subject' => $subject,
            'taskStats' => $taskStats,
            'noteStats' => $noteStats,
            'recentTasks' => $recentTasks,
            'recentNotes' => $recentNotes
        ];
        
        echo json_encode(['success' => true, 'data' => $previewData]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function createSubject($db, $user_id) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        

        
        if (!isset($data['name']) || empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Subject name is required']);
            return;
        }
        
        $name = trim($data['name']);
        $color = isset($data['color']) ? $data['color'] : '#333333';
        $description = isset($data['description']) ? trim($data['description']) : '';
        
        $query = "INSERT INTO subjects (name, color, description, user_id, created_at, updated_at) 
                  VALUES (?, ?, ?, ?, NOW(), NOW())";
        $stmt = $db->prepare($query);
        $stmt->execute([$name, $color, $description, $user_id]);
        
        $subject_id = $db->lastInsertId();
        
        // Get the created subject
        $query = "SELECT * FROM subjects WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$subject_id]);
        $subject = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $subject]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function updateSubject($db, $user_id) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        

        
        if (!isset($data['id']) || !isset($data['name']) || empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Subject ID and name are required']);
            return;
        }
        
        $subject_id = $data['id'];
        $name = trim($data['name']);
        $color = isset($data['color']) ? $data['color'] : '#333333';
        $description = isset($data['description']) ? trim($data['description']) : '';
        
        // Check if subject belongs to user
        $query = "SELECT id FROM subjects WHERE id = ? AND user_id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$subject_id, $user_id]);
        
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Subject not found']);
            return;
        }
        
        $query = "UPDATE subjects SET name = ?, color = ?, description = ?, updated_at = NOW() 
                  WHERE id = ? AND user_id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$name, $color, $description, $subject_id, $user_id]);
        
        // Get the updated subject
        $query = "SELECT * FROM subjects WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$subject_id]);
        $subject = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $subject]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function deleteSubject($db, $user_id) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Subject ID is required']);
            return;
        }
        
        $subject_id = $data['id'];
        
        // Check if subject belongs to user
        $query = "SELECT id FROM subjects WHERE id = ? AND user_id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$subject_id, $user_id]);
        
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Subject not found']);
            return;
        }
        
        // Start transaction
        $db->beginTransaction();
        
        try {
            // Update tasks to remove subject reference
            $query = "UPDATE tasks SET subject_id = NULL WHERE subject_id = ? AND user_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$subject_id, $user_id]);
            
            // Update notes to remove subject reference
            $query = "UPDATE notes SET subject_id = NULL WHERE subject_id = ? AND user_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$subject_id, $user_id]);
            
            // Delete the subject
            $query = "DELETE FROM subjects WHERE id = ? AND user_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$subject_id, $user_id]);
            
            $db->commit();
            
            echo json_encode(['success' => true, 'message' => 'Subject deleted successfully']);
        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
