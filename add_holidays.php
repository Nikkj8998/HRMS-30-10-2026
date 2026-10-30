<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();

$holidays = [
    ['Independence Day', '2026-08-15', 'National Holiday'],
    ['Republic Day', '2026-01-26', 'National Holiday'],
    ['Diwali', '2026-11-08', 'Festival of Lights'],
    ['Christmas', '2026-12-25', 'Festive Holiday'],
    ['New Year', '2027-01-01', 'Bank Holiday']
];

foreach ($holidays as $h) {
    try {
        $stmt = $db->prepare('INSERT INTO holidays (name, date, description) VALUES (?, ?, ?)');
        $stmt->execute($h);
        echo "Added holiday: {$h[0]}\n";
    } catch (Exception $e) {
        echo "Error for {$h[0]}: " . $e->getMessage() . "\n";
    }
}
