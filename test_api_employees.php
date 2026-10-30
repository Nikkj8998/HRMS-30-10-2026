<?php
$_SERVER['REQUEST_URI'] = '/api/employees';
$_SERVER['REQUEST_METHOD'] = 'GET';
session_name('hrconnect_session');
session_start();
$_SESSION['user_id'] = 2; // nikita2

ob_start();
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/index.php';
$output = ob_get_clean();
$data = json_decode($output, true);
if ($data === null) {
    echo "ERROR PARSING: " . json_last_error_msg() . "\n";
    echo substr($output, 0, 500);
} else {
    echo "COUNT: " . count($data) . "\n";
}
