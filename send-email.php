<?php
/**
 * Chile Home - Sistema de envío de correos SMTP
 */

// Headers CORS
$allowed_origins = ['https://chilehome.cl', 'https://www.chilehome.cl', 'http://chilehome.cl', 'http://www.chilehome.cl'];
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

$formType = isset($input['form_type']) ? $input['form_type'] : 'contacto';

// Sanitize
function sanitize($value) { return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8'); }

// Validate
$nombre = isset($input['nombre']) ? sanitize($input['nombre']) : '';
$email = isset($input['email']) ? sanitize($input['email']) : '';
$telefono = isset($input['telefono']) ? sanitize($input['telefono']) : '';
$modelo = isset($input['modelo']) ? sanitize($input['modelo']) : '';
$mensaje = isset($input['mensaje']) ? sanitize($input['mensaje']) : '';

if (empty($nombre) || empty($email) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']); exit;
}

$fecha = date('d/m/Y H:i');
$subject = "Nueva consulta de {$nombre} - Chile Home";

// HTML simple sin espacios
$body = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f5f5f5;">';
$body .= '<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">';
$body .= '<div style="background:#c9a86c;color:#000;padding:20px;text-align:center;"><h2 style="margin:0;">Nueva Consulta - Chile Home</h2></div>';
$body .= '<div style="padding:20px;">';
$body .= '<p><strong>Fecha:</strong> '.$fecha.'</p>';
$body .= '<p><strong>Nombre:</strong> '.$nombre.'</p>';
$body .= '<p><strong>Email:</strong> '.$email.'</p>';
$body .= '<p><strong>Teléfono:</strong> '.$telefono.'</p>';
$body .= '<p><strong>Modelo:</strong> '.$modelo.'</p>';
$body .= '<p><strong>Mensaje:</strong><br>'.nl2br($mensaje).'</p>';
$body .= '</div>';
$body .= '<div style="background:#1a1a1a;color:#fff;padding:15px;text-align:center;font-size:12px;">Chile Home - www.chilehome.cl</div>';
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
