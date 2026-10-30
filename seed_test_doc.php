<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();
$docs = [
    [
        'id' => 'test-doc-1',
        'name' => 'Profile Picture',
        'type' => 'other',
        'fileName' => 'profile.jpg',
        'fileSize' => 50000,
        'mimeType' => 'image/jpeg',
        'data' => 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'uploadedAt' => date('c')
    ]
];
$s = $db->prepare('UPDATE users SET documents=? WHERE id=1561');
$res = $s->execute([json_encode($docs)]);
echo $res ? "Updated successfully" : "Update failed";
