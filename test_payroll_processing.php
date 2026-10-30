<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/controllers/PayrollController.php';

$controller = new PayrollController();
try {
    $controller->createPaymentRecord(
        ['id' => 1, 'role' => 'admin'],
        [
            'employeeId' => 2,
            'month' => 'Mar 2026',
            'paymentStatus' => 'paid',
            'paymentDate' => date('Y-m-d H:i:s'),
            'paymentMode' => 'bank_transfer',
            'amount' => 50000
        ]
    );
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
