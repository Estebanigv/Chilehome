<?php
/**
 * Chile Home - Sistema de envío de correos SMTP
 * Con integración al CRM y monitoreo de emails
 */

require_once 'phpmailer/PHPMailer.php';
require_once 'phpmailer/SMTP.php';
require_once 'phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Cargar Email Monitor si existe
$monitorLoaded = false;
$monitorFile = __DIR__ . '/admin/includes/email-monitor.php';
if (file_exists($monitorFile)) {
    require_once $monitorFile;
    $monitorLoaded = class_exists('EmailMonitor');
}

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// =============================================
// Guardar en CRM (con detección de duplicados)
// =============================================
function saveToCRM($data) {
    try {
        $envFile = __DIR__ . '/admin/config/.env.php';
        if (file_exists($envFile)) {
            $env = require $envFile;
            $host = $env['db_host'] ?? 'localhost';
            $dbname = $env['db_name'] ?? 'chilehome_crm';
            $username = $env['db_user'] ?? 'root';
            $password = $env['db_pass'] ?? '';
        } else {
            error_log("CRM Error: .env.php no encontrado en: " . $envFile);
            return ['id' => false, 'status' => 'error', 'detail' => 'Config no encontrada'];
        }

        $pdo = new PDO(
            "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4, time_zone = '-03:00'"
            ]
        );

        // Normalizar teléfono para comparación (quitar espacios, guiones, etc.)
        $telefonoNormalizado = preg_replace('/[^0-9+]/', '', $data['telefono'] ?? '');

        // Verificar si ya existe un lead con el mismo nombre Y teléfono
        $checkSql = "SELECT id, email, ubicacion, modelo FROM leads
                     WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(:nombre))
                     AND REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '.', '') = :telefono
                     ORDER BY created_at DESC LIMIT 1";

        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([
            ':nombre' => $data['nombre'],
            ':telefono' => $telefonoNormalizado
        ]);

        $existingLead = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existingLead) {
            // Lead ya existe - actualizar datos adicionales si están vacíos
            $updateFields = [];
            $updateParams = [':id' => $existingLead['id']];

            // Actualizar email si el existente está vacío y el nuevo tiene datos
            if (empty($existingLead['email']) && !empty($data['email'])) {
                $updateFields[] = "email = :email";
                $updateParams[':email'] = $data['email'];
            }

            // Actualizar ubicación si la existente está vacía y la nueva tiene datos
            if (empty($existingLead['ubicacion']) && !empty($data['ubicacion'])) {
                $updateFields[] = "ubicacion = :ubicacion";
                $updateParams[':ubicacion'] = $data['ubicacion'];
            }

            // Actualizar modelo si el existente está vacío y el nuevo tiene datos
            if (empty($existingLead['modelo']) && !empty($data['modelo'])) {
                $updateFields[] = "modelo = :modelo";
                $updateParams[':modelo'] = $data['modelo'];
            }

            // Siempre actualizar updated_at para saber que hubo contacto reciente
            $updateFields[] = "updated_at = NOW()";

            // Agregar nota del nuevo contacto
            if (!empty($data['mensaje'])) {
                $updateFields[] = "notas = CONCAT(IFNULL(notas, ''), '\n[', NOW(), '] Nuevo contacto: ', :mensaje)";
                $updateParams[':mensaje'] = $data['mensaje'];
            }

            if (!empty($updateFields)) {
                $updateSql = "UPDATE leads SET " . implode(', ', $updateFields) . " WHERE id = :id";
                $updateStmt = $pdo->prepare($updateSql);
                $updateStmt->execute($updateParams);
            }

            // Registrar en historial que hubo un intento de contacto duplicado
            try {
                $pdo->exec("CREATE TABLE IF NOT EXISTS lead_history (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    lead_id INT NOT NULL,
                    accion VARCHAR(100),
                    detalle TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_lead (lead_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

                $histSql = "INSERT INTO lead_history (lead_id, accion, detalle) VALUES (:lead_id, 'contacto_repetido', :detalle)";
                $histStmt = $pdo->prepare($histSql);
                $histStmt->execute([
                    ':lead_id' => $existingLead['id'],
                    ':detalle' => 'Nuevo contacto desde web. Modelo: ' . ($data['modelo'] ?? 'N/A') . '. Form: ' . ($data['form_type'] ?? 'contacto')
                ]);
            } catch (Exception $e) {
                error_log("lead_history error (non-critical): " . $e->getMessage());
            }

            return ['id' => $existingLead['id'], 'status' => 'duplicate', 'detail' => 'Lead existente actualizado']; // Retornar ID existente
        }

        // Lead nuevo - insertar
        $sql = "INSERT INTO leads (nombre, email, telefono, modelo, ubicacion, mensaje, form_type, origen, ip_address)
                VALUES (:nombre, :email, :telefono, :modelo, :ubicacion, :mensaje, :form_type, :origen, :ip)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nombre' => $data['nombre'],
            ':email' => $data['email'],
            ':telefono' => $data['telefono'] ?? '',
            ':modelo' => $data['modelo'] ?? '',
            ':ubicacion' => $data['ubicacion'] ?? '',
            ':mensaje' => $data['mensaje'] ?? '',
            ':form_type' => $data['form_type'] ?? 'contacto',
            ':origen' => $data['origen'] ?? 'web',
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? ''
        ]);

        return ['id' => $pdo->lastInsertId(), 'status' => 'new', 'detail' => 'Lead nuevo creado'];
    } catch (PDOException $e) {
        error_log("CRM Error: " . $e->getMessage());
        return ['id' => false, 'status' => 'error', 'detail' => $e->getMessage()];
    }
}

// Config SMTP
$smtpConfig = [
    'host' => 'smtp.hostinger.com',
    'username' => 'contacto@chilehome.cl',
    'password' => 'Chilehome2026$',
    'port' => 465
];
$destinatarios = ['contacto@chilehome.cl', 'esteban@agenciados.cl'];

// Input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

// Sanitize
function sanitize($value) {
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

// Datos del formulario
$nombre = isset($input['nombre']) ? sanitize($input['nombre']) : '';
$email = isset($input['email']) ? sanitize($input['email']) : '';
$telefono = isset($input['telefono']) ? sanitize($input['telefono']) : '';
$modelo = isset($input['modelo']) ? sanitize($input['modelo']) : '';
$ubicacion = isset($input['ubicacion']) ? sanitize($input['ubicacion']) : '';
$mensaje = isset($input['mensaje']) ? sanitize($input['mensaje']) : 'Sin mensaje';
$form_type = isset($input['form_type']) ? sanitize($input['form_type']) : 'contacto';

if (empty($nombre) || empty($telefono)) {
    echo json_encode(['success' => false, 'message' => 'Nombre y teléfono son obligatorios']);
    exit;
}

// Guardar en CRM
$crmResult = saveToCRM([
    'nombre' => $nombre,
    'email' => $email,
    'telefono' => $telefono,
    'modelo' => $modelo,
    'ubicacion' => $ubicacion,
    'mensaje' => $mensaje,
    'form_type' => $form_type,
    'origen' => 'web'
]);
$leadId = is_array($crmResult) ? $crmResult['id'] : $crmResult;
$leadStatus = is_array($crmResult) ? $crmResult['status'] : ($crmResult ? 'new' : 'error');
$leadDetail = is_array($crmResult) ? $crmResult['detail'] : '';

// Log para diagnóstico
error_log("CRM Save: nombre={$nombre}, tel={$telefono}, status={$leadStatus}, id={$leadId}, detail={$leadDetail}");

// Fecha y hora
$fecha = date('d/m/Y');
$hora = date('H:i') . ' hrs';

$subject = "Nueva consulta de {$nombre} - Chile Home";

// HTML del email
$body = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>';
$body .= '<body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f0f0f0;">';
$body .= '<div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">';
$body .= '<div style="background:linear-gradient(135deg,#c9a86c 0%,#b8956a 100%);padding:30px;text-align:center;">';
$body .= '<h1 style="margin:0;color:#ffffff;font-size:24px;">Nueva Consulta</h1>';
$body .= '<p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Chile Home - Casas Prefabricadas</p>';
$body .= '</div>';
$body .= '<div style="padding:25px;">';
$body .= '<p><strong>Fecha:</strong> '.$fecha.' - '.$hora.'</p>';
$body .= '<p><strong>Nombre:</strong> '.$nombre.'</p>';
$body .= '<p><strong>Email:</strong> '.$email.'</p>';
$body .= '<p><strong>Teléfono:</strong> '.$telefono.'</p>';
$body .= '<p><strong>Modelo:</strong> '.$modelo.'</p>';
$body .= '<p><strong>Ubicación:</strong> '.$ubicacion.'</p>';
$body .= '<p><strong>Mensaje:</strong> '.$mensaje.'</p>';
$body .= '</div></div></body></html>';

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $smtpConfig['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $smtpConfig['username'];
    $mail->Password = $smtpConfig['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = $smtpConfig['port'];
    $mail->CharSet = 'UTF-8';

    $mail->setFrom($smtpConfig['username'], 'Chile Home Web');
    foreach ($destinatarios as $dest) {
        $mail->addAddress($dest);
    }
    if (!empty($email)) {
        $mail->addReplyTo($email, $nombre);
    }

    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $body;

    $mail->send();

    // Registrar éxito en el monitor
    if ($monitorLoaded) {
        EmailMonitor::logSuccess(
            implode(', ', $destinatarios),
            $subject,
            $leadId,
            ['nombre' => $nombre, 'telefono' => $telefono]
        );
    }

    echo json_encode([
        'success' => true,
        'message' => 'Mensaje enviado correctamente',
        'lead_id' => $leadId,
        'lead_status' => $leadStatus,
        'lead_detail' => $leadDetail
    ]);

} catch (Exception $e) {
    // Registrar error en el monitor
    if ($monitorLoaded) {
        EmailMonitor::logError(
            implode(', ', $destinatarios),
            $subject,
            $mail->ErrorInfo ?? $e->getMessage(),
            $leadId,
            ['nombre' => $nombre, 'telefono' => $telefono]
        );
    }

    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al enviar', 'error' => $mail->ErrorInfo ?? $e->getMessage()]);
}
