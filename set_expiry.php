<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();

try {
    // Check if expires_at column exists, if not add it (though it seems to exist)
    $usernames = ['admin_demo', 'hr_demo', 'user_demo', 'emp_demo'];
    $placeholders = implode(',', array_fill(0, count($usernames), '?'));
    
    $stmt = $db->prepare("UPDATE users SET expires_at = DATE_ADD(NOW(), INTERVAL 48 HOUR) WHERE username IN ($placeholders)");
    $stmt->execute($usernames);
    
    echo "Updated expiration for demo accounts.\n";
    
    // Verify
    $stmt = $db->prepare("SELECT username, expires_at FROM users WHERE username IN ($placeholders)");
    $stmt->execute($usernames);
    print_r($stmt->fetchAll());

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
