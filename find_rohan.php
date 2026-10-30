<?php
require_once __DIR__ . '/php-backend/config/database.php';

try {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE first_name LIKE 'Rohan%' OR last_name LIKE 'Rohan%' LIMIT 1");
    $stmt->execute();
    $user = $stmt->fetch();
    if ($user) {
        echo "USER FOUND:\n";
        echo "Name: " . $user['first_name'] . " " . $user['last_name'] . "\n";
        echo "Username: " . $user['username'] . "\n";
        echo "Email: " . $user['email'] . "\n";
        echo "Hash: " . $user['password'] . "\n";
    } else {
        echo "USER NOT FOUND.\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
