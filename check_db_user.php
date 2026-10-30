<?php
require_once __DIR__ . '/php-backend/config/database.php';

try {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE username = 'nk@asn.com' LIMIT 1");
    $stmt->execute();
    $user = $stmt->fetch();
    if ($user) {
        echo "USER FOUND:\n";
        print_r($user);
    } else {
        echo "USER NOT FOUND.\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
