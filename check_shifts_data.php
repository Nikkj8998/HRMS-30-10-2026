<?php
require_once __DIR__ . '/php-backend/config/database.php';
try {
    $db = getDB();
    $stmt = $db->query("SELECT * FROM shift_assignments");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Assignments: " . count($data) . "\n";
    print_r($data);
    
    echo "\n---\n";
    $stmt = $db->query("SELECT * FROM shifts");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Shifts: " . count($data) . "\n";
    print_r($data);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
