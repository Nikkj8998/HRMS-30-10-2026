<?php
require_once __DIR__ . '/php-backend/config/database.php';
$db = getDB();

// Check if holidays already exist
$count = $db->query('SELECT COUNT(*) FROM holidays')->fetchColumn();
if ($count > 0) {
    echo "Already have $count holidays. Skipping seed.\n";
    exit;
}

// Indian Public Holidays 2026
$holidays = [
    ['Republic Day', '2026-01-26', 'National holiday celebrating the adoption of the Constitution of India'],
    ['Maha Shivaratri', '2026-02-15', 'Hindu festival dedicated to Lord Shiva'],
    ['Holi', '2026-03-10', 'Festival of colours celebrating the arrival of spring'],
    ['Good Friday', '2026-04-03', 'Christian observance of the crucifixion of Jesus Christ'],
    ['Ram Navami', '2026-04-09', 'Hindu festival celebrating the birth of Lord Rama'],
    ['Eid ul-Fitr', '2026-03-31', 'Islamic festival marking the end of Ramadan'],
    ['Dr. B.R. Ambedkar Jayanti', '2026-04-14', 'Birth anniversary of Dr. B.R. Ambedkar'],
    ['May Day / Labour Day', '2026-05-01', 'International Workers Day'],
    ['Buddha Purnima', '2026-05-12', 'Birth anniversary of Gautama Buddha'],
    ['Eid ul-Adha', '2026-06-07', 'Islamic festival of sacrifice'],
    ['Muharram', '2026-07-07', 'Islamic New Year observance'],
    ['Independence Day', '2026-08-15', 'National holiday celebrating independence from British rule'],
    ['Janmashtami', '2026-08-25', 'Hindu festival celebrating the birth of Lord Krishna'],
    ['Milad-un-Nabi', '2026-09-05', 'Birth anniversary of Prophet Muhammad'],
    ['Mahatma Gandhi Jayanti', '2026-10-02', 'Birth anniversary of Mahatma Gandhi'],
    ['Dussehra / Vijayadashami', '2026-10-20', 'Hindu festival celebrating the victory of good over evil'],
    ['Diwali', '2026-11-08', 'Festival of lights, one of the most popular Hindu festivals'],
    ['Guru Nanak Jayanti', '2026-11-28', 'Birth anniversary of Guru Nanak Dev, founder of Sikhism'],
    ['Christmas Day', '2026-12-25', 'Christian festival celebrating the birth of Jesus Christ'],
];

$stmt = $db->prepare('INSERT INTO holidays (name, date, description) VALUES (?, ?, ?)');
foreach ($holidays as $h) {
    $stmt->execute([$h[0], $h[1] . ' 00:00:00', $h[2]]);
    echo "Added: {$h[0]} ({$h[1]})\n";
}
echo "\nDone! Seeded " . count($holidays) . " Indian holidays for 2026.\n";
