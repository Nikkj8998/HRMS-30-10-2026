<?php
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/helpers/Auth.php';
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/controllers/PayrollController.php';

// Stub the user (Navnath)
$db = getDB();
$stmt = $db->query("SELECT * FROM users WHERE id = 999");
$user = $stmt->fetch(PDO::FETCH_ASSOC);

$ctrl = new PayrollController();
try {
    // Capture the JSON response
    ob_start();
    $ctrl->getPaymentRecords($user, []);
    $output = ob_get_clean();
    echo "Length of output: " . strlen($output) . "\n";
    // echo substr($output, 0, 500);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
