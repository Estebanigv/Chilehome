<?php
/**
 * Chile Home - Sistema de envío de correos SMTP
 * Configurado para Hostinger SMTP
 */

// Headers CORS - Permitir desde el mismo dominio
$allowed_origins = [
    'https://chilehome.cl',
    'https://www.chilehome.cl',
    'http://chilehome.cl',
    'http://www.chilehome.cl'
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

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Prevenir acceso directo sin POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Incluir PHPMailer
require_once 'phpmailer/PHPMailer.php';
require_once 'phpmailer/SMTP.php';
require_once 'phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Configuración SMTP
$smtpConfig = [
    'host' => 'smtp.hostinger.com',
    'username' => 'contacto@chilehome.cl',
    'password' => 'ChileHome#2024$',
    'port' => 465,
    'encryption' => 'ssl'
];

// Correos destino
$destinatarios = [
    'contacto@chilehome.cl',
    'julieta@chilehome.cl',
    'luis@agenciados.cl',
    'esteban@agenciados.cl'
];

// Obtener datos del formulario
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    // Fallback para form-data tradicional
    $input = $_POST;
}

// Determinar tipo de formulario
$formType = isset($input['form_type']) ? $input['form_type'] : 'contacto';

// Validar campos requeridos según tipo
function validateInput($data, $type) {
    $errors = [];

    switch ($type) {
        case 'contacto':
            if (empty($data['nombre'])) $errors[] = 'El nombre es requerido';
            if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'El email es inválido';
            }
            if (empty($data['telefono'])) $errors[] = 'El teléfono es requerido';
            if (empty($data['modelo'])) $errors[] = 'Selecciona un modelo';
            if (empty($data['mensaje'])) $errors[] = 'El mensaje es requerido';
            break;

        case 'brochure':
            if (empty($data['nombre'])) $errors[] = 'El nombre es requerido';
            if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'El email es inválido';
            }
            if (empty($data['telefono'])) $errors[] = 'El teléfono es requerido';
            break;

        case 'newsletter':
            if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'El email es inválido';
            }
            break;
    }

    return $errors;
}

$validationErrors = validateInput($input, $formType);

if (!empty($validationErrors)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Errores de validación',
        'errors' => $validationErrors
    ]);
    exit;
}

// Sanitizar datos
function sanitize($value) {
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

// Preparar contenido del correo según tipo
function prepareEmailContent($data, $type) {
    $fecha = date('d/m/Y H:i');

    switch ($type) {
        case 'contacto':
            $subject = 'Nueva consulta de ' . sanitize($data['nombre']) . ' - Chile Home';
            $body = "
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #c9a86c; color: #0a0a0a; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 20px; }
                    .field { margin-bottom: 15px; }
                    .label { font-weight: bold; color: #555; }
                    .value { color: #333; }
                    .footer { background: #0a0a0a; color: #fff; padding: 15px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h2>Nueva Consulta - Chile Home</h2>
                    </div>
                    <div class='content'>
                        <div class='field'>
                            <span class='label'>Fecha:</span>
                            <span class='value'>{$fecha}</span>
                        </div>
                        <div class='field'>
                            <span class='label'>Nombre:</span>
                            <span class='value'>" . sanitize($data['nombre']) . "</span>
                        </div>
                        <div class='field'>
                            <span class='label'>Email:</span>
                            <span class='value'>" . sanitize($data['email']) . "</span>
                        </div>
                        <div class='field'>
                            <span class='label'>Teléfono:</span>
                            <span class='value'>" . sanitize($data['telefono']) . "</span>
                        </div>
                        <div class='field'>
                            <span class='label'>Modelo de interés:</span>
                            <span class='value'>" . sanitize($data['modelo']) . "</span>
                        </div>
                        <div class='field'>
                            <span class='label'>Mensaje:</span>
                            <p class='value'>" . nl2br(sanitize($data['mensaje'])) . "</p>
                        </div>
                    </div>
                    <div class='footer'>
                        Chile Home - Casas Prefabricadas Premium<br>
                        www.chilehome.cl
                    </div>
                </div>
            </body>
            </html>";
            break;

        case 'brochure':
            $modelo = !empty($data['modelo']) ? sanitize($data['modelo']) : 'No especificado';
            $subject = 'Solicitud de Cotizacion - ' . sanitize($data['nombre']) . ' - ' . $modelo;
            $body = "
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #c9a86c; color: #0a0a0a; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 20px; }
                    .field { margin-bottom: 15px; }
                    .label { font-weight: bold; color: #555; }
                    .value { color: #333; }
                    .footer { background: #0a0a0a; color: #fff; padding: 15px; text-align: center; font-size: 12px; }
                    .highlight { background: #fff3cd; padding: 10px; border-left: 4px solid #c9a86c; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h2>Nueva Solicitud de Cotizacion</h2>
                    </div>
                    <div class='content'>
                        <div class='field'>
                            <span class='label'>Fecha:</span>
                            <span class='value'>{$fecha}</span>
                        </div>
                        <div class='field'>
                            <span class='label'>Nombre:</span>
                            <span class='value'>" . sanitize($data['nombre']) . "</span>
                        </div>
                        <div class='field'>
                            <span class='label'>Email:</span>
                            <span class='value'>" . sanitize($data['email']) . "</span>
                        </div>
                        <div class='field'>
                            <span class='label'>Telefono/WhatsApp:</span>
                            <span class='value'>" . sanitize($data['telefono']) . "</span>
                        </div>
                        <div class='highlight'>
                            <span class='label'>Modelo de interes:</span>
                            <span class='value'><strong>{$modelo}</strong></span>
                        </div>
                    </div>
                    <div class='footer'>
                        Chile Home - Casas Prefabricadas Premium<br>
                        www.chilehome.cl
                    </div>
                </div>
            </body>
            </html>";
            break;

        case 'newsletter':
            $subject = 'Nueva suscripción al Newsletter - Chile Home';
            $body = "
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #c9a86c; color: #0a0a0a; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 20px; }
                    .footer { background: #0a0a0a; color: #fff; padding: 15px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h2>Nueva Suscripción al Newsletter</h2>
                    </div>
                    <div class='content'>
                        <p><strong>Fecha:</strong> {$fecha}</p>
                        <p><strong>Email suscrito:</strong> " . sanitize($data['email']) . "</p>
                    </div>
                    <div class='footer'>
                        Chile Home - Casas Prefabricadas Premium<br>
                        www.chilehome.cl
                    </div>
                </div>
            </body>
            </html>";
            break;

        default:
            $subject = 'Mensaje desde Chile Home';
            $body = '<p>Mensaje recibido</p>';
    }

    return ['subject' => $subject, 'body' => $body];
}

$emailContent = prepareEmailContent($input, $formType);

// Enviar correo con PHPMailer
try {
    $mail = new PHPMailer(true);

    // Configuración del servidor SMTP
    $mail->isSMTP();
    $mail->Host = $smtpConfig['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $smtpConfig['username'];
    $mail->Password = $smtpConfig['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = $smtpConfig['port'];
    $mail->CharSet = 'UTF-8';

    // Remitente y destinatarios
    $mail->setFrom($smtpConfig['username'], 'Chile Home Web');
    foreach ($destinatarios as $email) {
        $mail->addAddress($email);
    }

    // Agregar Reply-To con el email del cliente (si existe)
    if (!empty($input['email'])) {
        $mail->addReplyTo(sanitize($input['email']), sanitize($input['nombre'] ?? 'Cliente'));
    }

    // Contenido del correo
    $mail->isHTML(true);
    $mail->Encoding = 'base64';
    $mail->Subject = $emailContent['subject'];
    $mail->Body = $emailContent['body'];
    $mail->AltBody = strip_tags(str_replace(['<br>', '</p>'], "\n", $emailContent['body']));

    $mail->send();

    echo json_encode([
        'success' => true,
        'message' => 'Mensaje enviado correctamente'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al enviar el mensaje',
        'error' => $mail->ErrorInfo
    ]);
}
?>
