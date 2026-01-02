<?php
/**
 * Chile Home - Sistema de envío de correos SMTP
 */

// Headers CORS
$allowed_origins = [
    'https://chilehome.cl',
    'https://www.chilehome.cl',
    'http://chilehome.cl',
    'http://www.chilehome.cl',
    'http://localhost:5000',
    'http://localhost:8080',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:8080'
];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: https://chilehome.cl');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['success' => false, 'message' => 'Método no permitido']); exit; }

require_once 'phpmailer/PHPMailer.php';
require_once 'phpmailer/SMTP.php';
require_once 'phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Config
$smtpConfig = ['host' => 'smtp.hostinger.com', 'username' => 'contacto@chilehome.cl', 'password' => 'ChileHome#2024$', 'port' => 465];
$destinatarios = ['contacto@chilehome.cl', 'julieta@chilehome.cl', 'luis@agenciados.cl', 'esteban@agenciados.cl'];

// Input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) { $input = $_POST; }

// Sanitize
function sanitize($value) { return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8'); }

// Validate
$nombre = isset($input['nombre']) ? sanitize($input['nombre']) : '';
$email = isset($input['email']) ? sanitize($input['email']) : '';
$telefono = isset($input['telefono']) ? sanitize($input['telefono']) : '';
$modelo = isset($input['modelo']) ? sanitize($input['modelo']) : '';
$ubicacion = isset($input['ubicacion']) ? sanitize($input['ubicacion']) : '';
$coordenadas = isset($input['coordenadas']) ? sanitize($input['coordenadas']) : '';
$mensaje = isset($input['mensaje']) ? sanitize($input['mensaje']) : 'Sin mensaje';

if (empty($nombre) || empty($email) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']); exit;
}

// Fecha y hora separados
$fecha = date('d/m/Y');
$hora = date('H:i') . ' hrs';

// Link a Google Maps (con coordenadas exactas si están disponibles)
if (!empty($coordenadas)) {
    $mapsUrl = 'https://www.google.com/maps?q=' . $coordenadas;
} else {
    $mapsUrl = 'https://www.google.com/maps/search/' . urlencode($ubicacion);
}

$subject = "Nueva consulta de {$nombre} - Chile Home";

// HTML con mejor diseño
$body = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>';
$body .= '<body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f0f0f0;">';
$body .= '<div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">';

// Header
$body .= '<div style="background:linear-gradient(135deg,#c9a86c 0%,#b8956a 100%);padding:30px;text-align:center;">';
$body .= '<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">Nueva Consulta</h1>';
$body .= '<p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Chile Home - Casas Prefabricadas</p>';
$body .= '</div>';

// Fecha y Hora
$body .= '<div style="background:#f8f8f8;padding:15px 25px;border-bottom:1px solid #eee;display:flex;">';
$body .= '<table width="100%" cellpadding="0" cellspacing="0"><tr>';
$body .= '<td style="text-align:left;"><span style="color:#888;font-size:12px;">FECHA</span><br><strong style="color:#333;font-size:14px;">'.$fecha.'</strong></td>';
$body .= '<td style="text-align:right;"><span style="color:#888;font-size:12px;">HORA</span><br><strong style="color:#333;font-size:14px;">'.$hora.'</strong></td>';
$body .= '</tr></table></div>';

// Contenido
$body .= '<div style="padding:25px;">';

// Info del cliente
$body .= '<div style="margin-bottom:20px;">';
$body .= '<p style="margin:0 0 5px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Datos del Cliente</p>';
$body .= '<div style="background:#f9f9f9;border-radius:8px;padding:15px;border-left:4px solid #c9a86c;">';
$body .= '<p style="margin:0 0 10px;"><strong style="color:#333;">Nombre:</strong> <span style="color:#555;">'.$nombre.'</span></p>';
$body .= '<p style="margin:0 0 10px;"><strong style="color:#333;">Email:</strong> <a href="mailto:'.$email.'" style="color:#c9a86c;">'.$email.'</a></p>';
$body .= '<p style="margin:0;"><strong style="color:#333;">Teléfono:</strong> <a href="tel:'.$telefono.'" style="color:#c9a86c;">'.$telefono.'</a></p>';
$body .= '</div></div>';

// Modelo
$body .= '<div style="margin-bottom:20px;">';
$body .= '<p style="margin:0 0 5px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Modelo de Interés</p>';
$body .= '<div style="background:#fff3e0;border-radius:8px;padding:15px;border-left:4px solid #ff9800;">';
$body .= '<p style="margin:0;font-size:16px;font-weight:600;color:#333;">'.$modelo.'</p>';
$body .= '</div></div>';

// Ubicación con mapa
$body .= '<div style="margin-bottom:20px;">';
$body .= '<p style="margin:0 0 5px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Ubicación del Terreno</p>';
$body .= '<div style="background:#e3f2fd;border-radius:8px;padding:15px;border-left:4px solid #2196f3;">';
$body .= '<p style="margin:0 0 10px;font-size:14px;color:#333;">'.$ubicacion.'</p>';
$body .= '<a href="'.$mapsUrl.'" target="_blank" style="display:inline-block;background:#2196f3;color:#fff;padding:8px 16px;border-radius:5px;text-decoration:none;font-size:13px;font-weight:500;">📍 Ver en Google Maps</a>';
$body .= '</div></div>';

// Mensaje
$body .= '<div style="margin-bottom:10px;">';
$body .= '<p style="margin:0 0 5px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Mensaje</p>';
$body .= '<div style="background:#f5f5f5;border-radius:8px;padding:15px;">';
$body .= '<p style="margin:0;color:#555;line-height:1.6;">'.nl2br($mensaje).'</p>';
$body .= '</div></div>';

$body .= '</div>';

// Footer
$body .= '<div style="background:#1a1a1a;padding:20px;text-align:center;">';
$body .= '<p style="margin:0;color:#888;font-size:12px;">Chile Home - Casas Prefabricadas Premium</p>';
$body .= '<p style="margin:5px 0 0;"><a href="https://www.chilehome.cl" style="color:#c9a86c;text-decoration:none;font-size:12px;">www.chilehome.cl</a></p>';
$body .= '</div>';

$body .= '</div></body></html>';

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
    foreach ($destinatarios as $dest) { $mail->addAddress($dest); }
    if (!empty($email)) { $mail->addReplyTo($email, $nombre); }

    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $body;

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Mensaje enviado correctamente']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al enviar', 'error' => $mail->ErrorInfo]);
}
?>
