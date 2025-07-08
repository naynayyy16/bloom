<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../includes/auth.php';

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
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function handleGetRequest($db, $user_id, $action) {
    switch ($action) {
        case 'list':
            $query = "SELECT n.*, s.name as subject_name, s.color as subject_color 
                      FROM notes n 
                      LEFT JOIN subjects s ON n.subject_id = s.id 
                      WHERE n.user_id = ? 
                      ORDER BY n.updated_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute([$user_id]);
            $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'notes' => $notes]);
            break;
            
        case 'get':
            $id = $_GET['id'] ?? '';
            if (!$id) {
                throw new Exception('Note ID required');
            }
            
            $query = "SELECT n.*, s.name as subject_name, s.color as subject_color 
                      FROM notes n 
                      LEFT JOIN subjects s ON n.subject_id = s.id 
                      WHERE n.id = ? AND n.user_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$id, $user_id]);
            $note = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$note) {
                throw new Exception('Note not found');
            }
            
            echo json_encode(['success' => true, 'note' => $note]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
}

function handlePostRequest($db, $user_id) {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'create':
            $note = $input['note'];
            $query = "INSERT INTO notes (user_id, subject_id, title, content) VALUES (?, ?, ?, ?)";
            $stmt = $db->prepare($query);
            $stmt->execute([
                $user_id,
                $note['subject_id'] ?: null,
                $note['title'],
                $note['content']
            ]);
            
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
            break;
            
        case 'update':
            $note = $input['note'];
            $query = "UPDATE notes SET subject_id = ?, title = ?, content = ?, updated_at = NOW() 
                      WHERE id = ? AND user_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([
                $note['subject_id'] ?: null,
                $note['title'],
                $note['content'],
                $note['id'],
                $user_id
            ]);
            
            echo json_encode(['success' => true]);
            break;
            
        case 'delete':
            $id = $input['id'];
            $query = "DELETE FROM notes WHERE id = ? AND user_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$id, $user_id]);
            
            echo json_encode(['success' => true]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
}

function handlePutRequest($db, $user_id) {
    handlePostRequest($db, $user_id);
}

function handleDeleteRequest($db, $user_id) {
    $id = $_GET['id'] ?? '';
    if (!$id) {
        throw new Exception('Note ID required');
    }
    
    $query = "DELETE FROM notes WHERE id = ? AND user_id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$id, $user_id]);
    
    echo json_encode(['success' => true]);
}
?>
