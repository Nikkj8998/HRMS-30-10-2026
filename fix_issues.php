<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();

// 1. Fix photo_url column to LONGTEXT
try {
    $db->exec("ALTER TABLE users MODIFY COLUMN photo_url LONGTEXT NULL");
    echo "OK: photo_url -> LONGTEXT\n";
} catch (PDOException $e) {
    echo "ERR: " . $e->getMessage() . "\n";
}

// 2. Check distinct months
$r = $db->query("SELECT DISTINCT month FROM payment_records");
$months = $r->fetchAll(PDO::FETCH_COLUMN);
echo "Months: " . implode(', ', $months) . "\n";
echo "Count: " . count($months) . "\n";
