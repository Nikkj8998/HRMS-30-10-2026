<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();
$shifts = $db->query("SELECT id FROM shifts")->fetchAll(PDO::FETCH_COLUMN);
$users = $db->query("SELECT id FROM users WHERE is_active=1 AND role!='developer'")->fetchAll(PDO::FETCH_COLUMN);

if (empty($shifts)) {
    echo "No shifts found\n";
    exit;
}

$stmt = $db->prepare("INSERT INTO shift_assignments (user_id, shift_id, start_date, end_date) VALUES (?, ?, ?, ?)");
foreach ($users as $uId) {
    // Check if already assigned
    $check = $db->prepare("SELECT id FROM shift_assignments WHERE user_id=? LIMIT 1");
    $check->execute([$uId]);
    if ($check->fetch()) continue;

    $shiftId = $shifts[array_rand($shifts)];
    $stmt->execute([$uId, $shiftId, '2026-05-01', '2026-12-31']);
    echo "Assigned shift $shiftId to user $uId\n";
}
