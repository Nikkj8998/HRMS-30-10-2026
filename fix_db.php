<?php
require_once __DIR__ . '/php-backend/config/database.php';

try {
    $db = getDB();
    // Check if column exists first
    $stmt = $db->query("SHOW COLUMNS FROM users LIKE 'bank_account_holder_name'");
    if (!$stmt->fetch()) {
        $db->exec("ALTER TABLE users ADD COLUMN bank_account_holder_name VARCHAR(255) DEFAULT NULL AFTER bank_account_number");
        echo "Column 'bank_account_holder_name' added successfully.\n";
    } else {
        echo "Column 'bank_account_holder_name' already exists.\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
