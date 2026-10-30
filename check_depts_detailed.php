<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();

$units = $db->query("SELECT id, name FROM units")->fetchAll();
foreach ($units as $unit) {
    echo "Unit: {$unit['name']} (ID: {$unit['id']})\n";
    $depts = $db->prepare("SELECT id, name FROM departments WHERE unit_id = ?");
    $depts->execute([$unit['id']]);
    $rows = $depts->fetchAll();
    foreach ($rows as $row) {
        $count = $db->prepare("SELECT COUNT(*) FROM users WHERE department_id = ?");
        $count->execute([$row['id']]);
        echo "  - Dept: {$row['name']} (ID: {$row['id']}) | Count: " . $count->fetchColumn() . "\n";
    }
}
