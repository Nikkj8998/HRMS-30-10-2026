<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();
$s = $db->query('SELECT COUNT(*) as cnt FROM holidays');
echo 'Holiday count: ' . $s->fetch()['cnt'] . "\n";
$s2 = $db->query('SELECT * FROM holidays ORDER BY date ASC LIMIT 10');
while ($r = $s2->fetch()) {
    echo $r['id'] . ' | ' . $r['name'] . ' | ' . $r['date'] . "\n";
}
