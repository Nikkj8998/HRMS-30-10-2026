<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class ShiftController {

    public function index(): void {
        $db = getDB();
        $stmt = $db->query('SELECT * FROM shifts ORDER BY name ASC');
        Response::json(Auth::camelize($stmt->fetchAll()));
    }

    public function create(array $body): void {
        $db = getDB();
        $stmt = $db->prepare('INSERT INTO shifts (name, start_time, end_time, description, color) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([
            $body['name'],
            $body['startTime'],
            $body['endTime'],
            $body['description'] ?? null,
            $body['color'] ?? 'amber'
        ]);
        $id = $db->lastInsertId();
        $res = $db->prepare('SELECT * FROM shifts WHERE id=?');
        $res->execute([$id]);
        Response::json(Auth::camelize($res->fetch()), 201);
    }

    public function update(int $id, array $body): void {
        $db = getDB();
        $stmt = $db->prepare('UPDATE shifts SET name=?, start_time=?, end_time=?, description=?, color=? WHERE id=?');
        $stmt->execute([
            $body['name'],
            $body['startTime'],
            $body['endTime'],
            $body['description'] ?? null,
            $body['color'] ?? 'amber',
            $id
        ]);
        $res = $db->prepare('SELECT * FROM shifts WHERE id=?');
        $res->execute([$id]);
        Response::json(Auth::camelize($res->fetch()));
    }

    public function delete(int $id): void {
        $db = getDB();
        $db->prepare('DELETE FROM shifts WHERE id=?')->execute([$id]);
        Response::noContent();
    }

    public function listAssignments(): void {
        $db = getDB();
        $stmt = $db->query('SELECT sa.*, s.name as shift_name, u.first_name, u.last_name 
                            FROM shift_assignments sa 
                            JOIN shifts s ON s.id = sa.shift_id 
                            JOIN users u ON u.id = sa.user_id');
        Response::json(Auth::camelize($stmt->fetchAll()));
    }

    public function assign(array $body): void {
        $db = getDB();
        // Clear existing assignment for this user (one shift at a time)
        $db->prepare('DELETE FROM shift_assignments WHERE user_id=?')->execute([$body['userId']]);
        
        $stmt = $db->prepare('INSERT INTO shift_assignments (user_id, shift_id, start_date, end_date) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $body['userId'],
            $body['shiftId'],
            $body['startDate'],
            $body['endDate']
        ]);
        Response::json(['message' => 'Shift assigned successfully']);
    }
}
