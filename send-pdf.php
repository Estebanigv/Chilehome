<?php
/**
 * Chile Home - Envío de Fichas Técnicas por Email
 * Adjunta el PDF del modelo solicitado al correo del usuario
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

// Headers
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

$nombre = isset($input['nombre']) ? sanitize($input['nombre']) : '';
$email = isset($input['email']) ? sanitize($input['email']) : '';
$telefono = isset($input['telefono']) ? sanitize($input['telefono']) : '';
$modelo = isset($input['model_name']) ? sanitize($input['model_name']) : (isset($input['modelo']) ? sanitize($input['modelo']) : '');
$pdfPath = isset($input['pdf_path']) ? $input['pdf_path'] : '';

if (empty($nombre) || empty($telefono)) {
    echo json_encode(['success' => false, 'message' => 'Nombre y teléfono son obligatorios']);
    exit;
}

// Validar y resolver ruta del PDF usando glob para evitar problemas de encoding
$pdfGlobPatterns = [
    '36' => 'Imagenes/Fichas Tecnicas/36 2a-*/36 2a/*.pdf',
    '54' => 'Imagenes/Fichas Tecnicas/54 2a-*/54 2a/*.pdf',
    '72' => 'Imagenes/Fichas Tecnicas/72 2a-*/72 2a/*.pdf',
];

$pdfFullPath = '';
$pdfAttachName = '';

// Detectar qué modelo se solicita buscando "36", "54" o "72" en la ruta o nombre del modelo
$detectKey = '';
$searchIn = $pdfPath . ' ' . $modelo;
if (preg_match('/72/', $searchIn)) $detectKey = '72';
elseif (preg_match('/54/', $searchIn)) $detectKey = '54';
elseif (preg_match('/36/', $searchIn)) $detectKey = '36';

if ($detectKey && isset($pdfGlobPatterns[$detectKey])) {
    $matches = glob(__DIR__ . '/' . $pdfGlobPatterns[$detectKey]);
    if (!empty($matches)) {
        $pdfFullPath = $matches[0];
        $pdfAttachName = 'Ficha Tecnica - Chile Home ' . $detectKey . 'm2 2 Aguas.pdf';
    }
}

// Verificar que el PDF existe
$pdfExists = !empty($pdfFullPath) && file_exists($pdfFullPath);

// Guardar en CRM
function saveToCRM($data) {
    try {
        $envFile = __DIR__ . '/admin/config/.env.php';
        if (!file_exists($envFile)) return false;

        $env = require $envFile;
        $pdo = new PDO(
            "mysql:host={$env['db_host']};dbname={$env['db_name']};charset=utf8mb4",
            $env['db_user'],
            $env['db_pass'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4, time_zone = '-03:00'"]
        );

        $telefonoNorm = preg_replace('/[^0-9+]/', '', $data['telefono'] ?? '');

        $checkStmt = $pdo->prepare("SELECT id FROM leads WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(:nombre)) AND REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '.', '') = :telefono ORDER BY created_at DESC LIMIT 1");
        $checkStmt->execute([':nombre' => $data['nombre'], ':telefono' => $telefonoNorm]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $pdo->prepare("UPDATE leads SET updated_at = NOW(), notas = CONCAT(IFNULL(notas, ''), '\n[', NOW(), '] Solicitud ficha técnica: ', :modelo) WHERE id = :id")
                ->execute([':modelo' => $data['modelo'] ?? 'N/A', ':id' => $existing['id']]);
            return $existing['id'];
        }

        $stmt = $pdo->prepare("INSERT INTO leads (nombre, email, telefono, modelo, mensaje, form_type, origen, ip_address) VALUES (:nombre, :email, :telefono, :modelo, :mensaje, 'ficha_tecnica', 'web', :ip)");
        $stmt->execute([
            ':nombre' => $data['nombre'],
            ':email' => $data['email'] ?? '',
            ':telefono' => $data['telefono'] ?? '',
            ':modelo' => $data['modelo'] ?? '',
            ':mensaje' => 'Solicitud de ficha técnica: ' . ($data['modelo'] ?? ''),
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? ''
        ]);
        return $pdo->lastInsertId();
    } catch (Exception $e) {
        error_log("CRM Error (send-pdf): " . $e->getMessage());
        return false;
    }
}

$leadId = saveToCRM([
    'nombre' => $nombre,
    'email' => $email,
    'telefono' => $telefono,
    'modelo' => $modelo,
]);

$fecha = date('d/m/Y');
$hora = date('H:i') . ' hrs';

// Increase time limit for sending email with attachment
set_time_limit(120);

$clientEmailSent = false;
$teamEmailSent = false;
$errors = [];

// 1. Email al EQUIPO (notificación de solicitud)
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
    $mail->Timeout = 30;

    $mail->setFrom($smtpConfig['username'], 'Chile Home Web');
    foreach ($destinatarios as $dest) {
        $mail->addAddress($dest);
    }
    if (!empty($email)) {
        $mail->addReplyTo($email, $nombre);
    }

    $mail->isHTML(true);
    $mail->Subject = "Solicitud Ficha Técnica - {$nombre} ({$modelo})";

    $bodyTeam = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>';
    $bodyTeam .= '<body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f0f0f0;">';
    $bodyTeam .= '<div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">';
    $bodyTeam .= '<div style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);padding:30px;text-align:center;">';
    $bodyTeam .= '<h1 style="margin:0;color:#ffffff;font-size:24px;">Solicitud de Ficha Técnica</h1>';
    $bodyTeam .= '<p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Chile Home - Casas Prefabricadas</p>';
    $bodyTeam .= '</div>';
    $bodyTeam .= '<div style="padding:25px;">';
    $bodyTeam .= '<p><strong>Fecha:</strong> ' . $fecha . ' - ' . $hora . '</p>';
    $bodyTeam .= '<p><strong>Nombre:</strong> ' . $nombre . '</p>';
    $bodyTeam .= '<p><strong>Email:</strong> ' . ($email ?: 'No proporcionado') . '</p>';
    $bodyTeam .= '<p><strong>Teléfono:</strong> ' . $telefono . '</p>';
    $bodyTeam .= '<p><strong>Modelo solicitado:</strong> ' . $modelo . '</p>';
    $bodyTeam .= '<p><strong>PDF encontrado:</strong> ' . ($pdfExists ? 'Sí' : 'No') . '</p>';
    $bodyTeam .= '</div></div></body></html>';

    $mail->Body = $bodyTeam;
    $mail->send();
    $teamEmailSent = true;
} catch (Exception $e) {
    $errors[] = 'team: ' . $e->getMessage();
    error_log("send-pdf team email error: " . $e->getMessage());
}

// 2. Email al CLIENTE con link de descarga (solo si proporcionó email y PDF existe)
if (!empty($email) && $pdfExists) {
    try {
        // URL de descarga via script PHP (evita problemas con caracteres especiales en filename)
        $pdfUrl = 'https://chilehome.cl/download-pdf.php?m=' . $detectKey;

        $mailClient = new PHPMailer(true);
        $mailClient->isSMTP();
        $mailClient->Host = $smtpConfig['host'];
        $mailClient->SMTPAuth = true;
        $mailClient->Username = $smtpConfig['username'];
        $mailClient->Password = $smtpConfig['password'];
        $mailClient->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mailClient->Port = $smtpConfig['port'];
        $mailClient->CharSet = 'UTF-8';
        $mailClient->Timeout = 30;

        $mailClient->setFrom($smtpConfig['username'], 'Chile Home');
        $mailClient->addAddress($email, $nombre);
        $mailClient->addReplyTo($smtpConfig['username'], 'Chile Home');

        $mailClient->isHTML(true);
        $mailClient->Subject = "Tu Ficha Técnica - {$modelo} | Chile Home";

        $bodyClient = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>';
        $bodyClient .= '<body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f5f5f5;">';
        $bodyClient .= '<div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">';
        $bodyClient .= '<div style="background:linear-gradient(135deg,#c9a86c 0%,#b8956a 100%);padding:40px 30px;text-align:center;">';
        $bodyClient .= '<h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Chile Home</h1>';
        $bodyClient .= '<p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Casas Prefabricadas de Calidad</p>';
        $bodyClient .= '</div>';
        $bodyClient .= '<div style="padding:30px;">';
        $bodyClient .= '<h2 style="color:#333;font-size:20px;margin:0 0 15px;">Hola ' . $nombre . '!</h2>';
        $bodyClient .= '<p style="color:#555;line-height:1.7;font-size:15px;">Gracias por tu interés en nuestras casas prefabricadas. Aquí tienes la <strong>Ficha Técnica</strong> del modelo <strong>' . $modelo . '</strong> que solicitaste.</p>';
        // Download CTA
        $bodyClient .= '<div style="text-align:center;margin:30px 0;">';
        $bodyClient .= '<a href="' . $pdfUrl . '" style="display:inline-block;background:linear-gradient(135deg,#c9a86c 0%,#b8956a 100%);color:#fff;text-decoration:none;padding:16px 36px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 15px rgba(201,168,108,0.3);">Descargar Ficha Técnica (PDF)</a>';
        $bodyClient .= '</div>';
        $bodyClient .= '<p style="color:#555;line-height:1.7;font-size:15px;">En la ficha encontrarás toda la información sobre medidas, materiales, distribución y especificaciones del modelo.</p>';
        $bodyClient .= '<p style="color:#555;line-height:1.7;font-size:15px;">Si tienes alguna consulta o deseas cotizar, no dudes en contactarnos:</p>';
        // WhatsApp CTA
        $bodyClient .= '<div style="text-align:center;margin:25px 0;">';
        $bodyClient .= '<a href="https://wa.me/56998654665?text=Hola%2C%20acabo%20de%20recibir%20la%20ficha%20del%20modelo%20' . urlencode($modelo) . '%20y%20me%20gustaria%20cotizar" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:14px 30px;border-radius:8px;font-size:15px;font-weight:600;">Cotizar por WhatsApp</a>';
        $bodyClient .= '</div>';
        $bodyClient .= '<p style="color:#555;line-height:1.7;font-size:15px;">También puedes llamarnos al <a href="tel:+56998654665" style="color:#c9a86c;text-decoration:none;font-weight:600;">+56 9 9865 4665</a> o escribirnos a <a href="mailto:contacto@chilehome.cl" style="color:#c9a86c;text-decoration:none;font-weight:600;">contacto@chilehome.cl</a></p>';
        $bodyClient .= '</div>';
        $bodyClient .= '<div style="background:#1a1a1a;padding:25px 30px;text-align:center;">';
        $bodyClient .= '<p style="color:#999;font-size:12px;margin:0;">Chile Home SPA | Casas Prefabricadas de Madera</p>';
        $bodyClient .= '<p style="color:#666;font-size:11px;margin:8px 0 0;">Copiapo - Santiago (Paine) - Puerto Varas - Paillaco</p>';
        $bodyClient .= '<p style="margin:12px 0 0;"><a href="https://chilehome.cl" style="color:#c9a86c;text-decoration:none;font-size:12px;">chilehome.cl</a></p>';
        $bodyClient .= '</div>';
        $bodyClient .= '</div></body></html>';

        $mailClient->Body = $bodyClient;
        $mailClient->send();
        $clientEmailSent = true;
    } catch (Exception $e) {
        $errors[] = 'client: ' . $e->getMessage();
        error_log("send-pdf client email error: " . $e->getMessage());
    }
}

// Log
if ($monitorLoaded) {
    EmailMonitor::logSuccess(
        !empty($email) ? $email : implode(', ', $destinatarios),
        "Ficha Técnica - {$modelo}",
        $leadId,
        ['nombre' => $nombre, 'telefono' => $telefono, 'pdf_sent' => $clientEmailSent]
    );
}

// Respuesta - siempre responder al frontend aunque alguno falle
$message = $clientEmailSent
    ? 'Ficha técnica enviada a tu correo'
    : (!empty($email) && $pdfExists ? 'Te enviaremos la ficha a la brevedad' : 'Solicitud recibida. Te contactaremos pronto');

echo json_encode([
    'success' => $teamEmailSent || $clientEmailSent,
    'message' => $message,
    'email_sent' => $clientEmailSent,
    'lead_id' => $leadId,
    'debug_errors' => !empty($errors) ? $errors : null
]);
