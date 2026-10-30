<?php
require_once __DIR__ . '/php-backend/config/database.php';

function seedDocuments() {
    $db = getDB();
    // Correct column names for this DB: first_name, last_name
    $users = $db->query("SELECT id, first_name, last_name FROM users")->fetchAll();
    
    $docTypes = ['id_proof', 'certificate', 'offer_letter', 'photo', 'bank_document', 'educational', 'experience_letter'];
    $docNames = [
        'id_proof' => 'Government ID',
        'certificate' => 'Training Certificate',
        'offer_letter' => 'Employment Offer',
        'photo' => 'Profile Picture',
        'bank_document' => 'Passbook Copy',
        'educational' => 'Degree Certificate',
        'experience_letter' => 'Previous Experience Letter'
    ];

    echo "Seeding documents for " . count($users) . " users...\n";

    foreach ($users as $user) {
        $userDocs = [];
        // Add 2-3 random documents for each user
        $numDocs = rand(2, 3);
        $selectedTypes = (array)array_rand(array_flip($docTypes), $numDocs);
        
        foreach ($selectedTypes as $type) {
            $userDocs[] = json_encode([
                'id' => 'seed-' . uniqid(),
                'name' => $docNames[$type] ?? 'Document',
                'type' => $type,
                'description' => 'Automatically generated sample document for demonstration purposes.',
                'fileName' => strtolower(str_replace(' ', '_', $docNames[$type] ?? 'doc')) . '.pdf',
                'fileSize' => rand(50000, 500000),
                'mimeType' => 'application/pdf',
                'data' => 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nGNgYGBkAAAABAAB/WVuZHN0cmVhbQplbmRvYmoKMyAwIG9iagoxNgplbmRvYmoKMSAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbNCAwIFJdL0NvdW50IDE+PgplbmRvYmoKNCAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDEgMCBSL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSA1IDAgUj4+Pj4vTWVkaWFCb3hbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDIgMCBSPj4KZW5kb2JqCjUgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjYgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDEgMCBSPj4KZW5kb2JqCnRyYWlsZXIKPDwvUm9vdCA2IDAgUi9TaXplIDc+PgpzdGFydHhyZWYKMjg1CiUlRU9G',
                'uploadedAt' => date('Y-m-d\TH:i:s.v\Z', strtotime('-' . rand(1, 30) . ' days'))
            ]);
        }
        
        // Update user record
        $stmt = $db->prepare("UPDATE users SET documents = ? WHERE id = ?");
        $docsJson = json_encode($userDocs);
        $stmt->execute([$docsJson, $user['id']]);
        echo "Updated documents for: {$user['first_name']} {$user['last_name']} (ID: {$user['id']})\n";
    }

    echo "Seeding complete!\n";
}

seedDocuments();
?>
