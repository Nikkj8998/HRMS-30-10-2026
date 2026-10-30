<?php
$_SERVER['REQUEST_URI'] = '/api/employees';
$_SERVER['REQUEST_METHOD'] = 'GET';
session_name('hrconnect_session');
session_start();
$_SESSION['user_id'] = 2; // nikita2

require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/config/database.php';
require 'c:/inetpub/wwwroot/HRMS26Mar-09-20/php-backend/helpers/Auth.php';

$user = Auth::requireAuth();
$db = getDB();
$sql  = 'SELECT u.*, d.name AS department_name FROM users u LEFT JOIN departments d ON d.id=u.department_id';
$params = [];
$where = [];

if ($user['role'] !== 'developer') {
    $where[] = "u.role != ?";
    $params[] = 'developer';
}

$authorizedUnit = Auth::getAuthorizedUnitId($user);
if ($authorizedUnit !== null) {
    if ($authorizedUnit === false) {
        $where[] = "u.id = ?";
        $params[] = $user['id'];
    } else {
        $where[] = "d.unit_id = ?";
        $params[] = $authorizedUnit;
    }
}

if (!empty($where)) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY u.id';

echo "ROLE: " . $user['role'] . "\n";
echo "AUTHORIZED UNIT: " . var_export($authorizedUnit, true) . "\n";
echo "SQL: $sql\n";
echo "PARAMS: "; print_r($params);
