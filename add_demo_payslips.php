<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();

$emp_id = 1564;
$months = ['October 2025', 'November 2025', 'December 2025'];

foreach ($months as $month) {
    try {
        $stmt = $db->prepare('INSERT INTO payment_records (employee_id, month, payment_status, amount, payment_mode, reference_no) 
                             VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$emp_id, $month, 'paid', 45000, 'bank_transfer', 'REF-' . rand(1000, 9999)]);
        echo "Added payslip for $month\n";
    } catch (Exception $e) {
        echo "Error for $month: " . $e->getMessage() . "\n";
    }
}
