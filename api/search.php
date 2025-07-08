<?php
header('Content-Type: application/json');
require_once '../config/database.php';
require_once '../includes/auth.php';

checkAuth();

$database = new Database();
$db = $database->getConnection();
$user_id = $_SESSION['user_id'];

$query = $_GET['q'] ?? '';

if (empty($query)) {
    echo json_encode(['success' => true, 'results' => []]);
    exit;
}

try {
    $results = [];
    
    // Search tasks with subject info
    $sql = "SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, 
                   s.name as subject_name, s.color as subject_color, 'task' as type 
            FROM tasks t 
            LEFT JOIN subjects s ON t.subject_id = s.id 
            WHERE t.user_id = ? AND (t.title LIKE ? OR t.description LIKE ?) 
            ORDER BY t.created_at DESC 
            LIMIT 5";
    $stmt = $db->prepare($sql);
    $searchTerm = "%{$query}%";
    $stmt->execute([$user_id, $searchTerm, $searchTerm]);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format task results
    foreach ($tasks as $task) {
        $results[] = [
            'id' => $task['id'],
            'title' => $task['title'],
            'type' => 'task',
            'subject_name' => $task['subject_name'],
            'subject_color' => $task['subject_color'],
            'status' => $task['status'],
            'priority' => $task['priority'],
            'due_date' => $task['due_date']
        ];
    }
    
    // Search notes with subject info
    $sql = "SELECT n.id, n.title, n.content, n.created_at, n.updated_at,
                   s.name as subject_name, s.color as subject_color, 'note' as type 
            FROM notes n 
            LEFT JOIN subjects s ON n.subject_id = s.id 
            WHERE n.user_id = ? AND (n.title LIKE ? OR n.content LIKE ?) 
            ORDER BY n.updated_at DESC 
            LIMIT 5";
    $stmt = $db->prepare($sql);
    $stmt->execute([$user_id, $searchTerm, $searchTerm]);
    $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format note results
    foreach ($notes as $note) {
        $results[] = [
            'id' => $note['id'],
            'title' => $note['title'],
            'type' => 'note',
            'subject_name' => $note['subject_name'],
            'subject_color' => $note['subject_color'],
            'content_preview' => substr(strip_tags($note['content']), 0, 100) . '...',
            'updated_at' => $note['updated_at']
        ];
    }
    
    // Search subjects with task counts
    $sql = "SELECT s.id, s.name as title, s.color, s.description,
                   COUNT(t.id) as total_tasks,
                   COUNT(CASE WHEN t.completed = 1 THEN 1 END) as completed_tasks,
                   'subject' as type 
            FROM subjects s 
            LEFT JOIN tasks t ON s.id = t.subject_id 
            WHERE s.user_id = ? AND (s.name LIKE ? OR s.description LIKE ?) 
            GROUP BY s.id 
            ORDER BY s.created_at DESC 
            LIMIT 3";
    $stmt = $db->prepare($sql);
    $stmt->execute([$user_id, $searchTerm, $searchTerm]);
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format subject results
    foreach ($subjects as $subject) {
        $results[] = [
            'id' => $subject['id'],
            'title' => $subject['title'],
            'type' => 'subject',
            'color' => $subject['color'],
            'description' => $subject['description'],
            'total_tasks' => $subject['total_tasks'],
            'completed_tasks' => $subject['completed_tasks']
        ];
    }
    
    echo json_encode(['success' => true, 'results' => $results]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
