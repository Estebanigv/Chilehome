<?php
/**
 * API de Citas - ChileHome
 * Sistema de agendamiento de visitas a sucursal
 */

// Iniciar sesión antes de cualquier output para que los checks de auth funcionen
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
// CORS: restringir a orígenes propios (público para agendamiento, privado para admin)
$allowedOrigins = ['https://chilehome.cl', 'https://www.chilehome.cl', 'http://localhost', 'http://127.0.0.1'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
    header('Access-Control-Allow-Headers: Content-Type');
}
// Solicitudes sin origin (server-side / mismo dominio): no enviar CORS header

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuracion de base de datos
$isLocal = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1'])
    || strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;

if ($isLocal) {
    $dbHost = 'localhost';
    $dbName = 'chilehome_crm';
    $dbUser = 'root';
    $dbPass = '';
} else {
    $envFile = __DIR__ . '/../config/.env.php';
    if (file_exists($envFile)) {
        $env = require $envFile;
        $dbHost = $env['db_host'] ?? 'localhost';
        $dbName = $env['db_name'] ?? 'chilehome_crm';
        $dbUser = $env['db_user'] ?? 'root';
        $dbPass = $env['db_pass'] ?? '';
    } else {
        $dbHost = 'localhost';
        $dbName = 'chilehome_crm';
        $dbUser = 'root';
        $dbPass = '';
    }
}

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4, time_zone = '-03:00'"
        ]
    );
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB connection failed']);
    exit;
}

// Crear tabla si no existe
$pdo->exec("CREATE TABLE IF NOT EXISTS citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    telefono VARCHAR(50) NOT NULL,
    sucursal VARCHAR(50) DEFAULT 'santiago',
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    modelo_interes VARCHAR(255),
    mensaje TEXT,
    estado ENUM('pendiente', 'confirmada', 'cancelada', 'completada') DEFAULT 'pendiente',
    notas_admin TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fecha (fecha),
    INDEX idx_estado (estado),
    INDEX idx_sucursal (sucursal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Agregar columna sucursal si no existe (para tablas existentes)
try {
    $pdo->exec("ALTER TABLE citas ADD COLUMN sucursal VARCHAR(50) DEFAULT 'santiago' AFTER telefono");
    $pdo->exec("ALTER TABLE citas ADD INDEX idx_sucursal (sucursal)");
} catch (PDOException $e) {
    // Columna ya existe
}

// Hacer email nullable si existe la restriccion
try {
    $pdo->exec("ALTER TABLE citas MODIFY email VARCHAR(255) NULL");
} catch (PDOException $e) {
    // Ya es nullable
}

$action = $_GET['action'] ?? $_POST['action'] ?? 'list';

// ================================================
// Configuracion de turnos por sucursal y ejecutivo
// ================================================
$turnosSucursales = [
    'santiago' => [
        'lunes_viernes' => [
            ['inicio' => '10:00', 'fin' => '17:00', 'ejecutivo' => 'Arturo Zúñiga', 'whatsapp' => '56985132210']
        ],
        'sabado' => [
            ['inicio' => '10:00', 'fin' => '14:00', 'ejecutivo' => 'Arturo Zúñiga', 'whatsapp' => '56985132210']
        ],
        'domingo' => null
    ],
    // Puerto Montt (Sector La Vara) — reemplaza a la antigua sucursal Puerto Varas
    // Johana: L-J 10:00-14:30, Vie 09:30-12:00, Sab 14:30-18:00
    // Claudia: L-V 14:30-18:00, Sab 10:00-14:30
    // Domingo y feriados: solo con cita previa coordinada por WhatsApp (no se agenda por web)
    'puerto_montt' => [
        'lunes_viernes' => [
            ['inicio' => '10:00', 'fin' => '14:30', 'ejecutivo' => 'Johana', 'whatsapp' => '56957002147'],
            ['inicio' => '14:30', 'fin' => '18:00', 'ejecutivo' => 'Claudia', 'whatsapp' => '56957002339']
        ],
        'viernes' => [
            ['inicio' => '09:30', 'fin' => '12:00', 'ejecutivo' => 'Johana', 'whatsapp' => '56957002147'],
            ['inicio' => '14:30', 'fin' => '18:00', 'ejecutivo' => 'Claudia', 'whatsapp' => '56957002339']
        ],
        'sabado' => [
            ['inicio' => '10:00', 'fin' => '14:30', 'ejecutivo' => 'Claudia', 'whatsapp' => '56957002339'],
            ['inicio' => '14:30', 'fin' => '18:00', 'ejecutivo' => 'Johana', 'whatsapp' => '56957002147']
        ],
        'domingo' => null
    ],
    'paillaco' => [
        'lunes_viernes' => [
            ['inicio' => '09:00', 'fin' => '16:00', 'ejecutivo' => 'Camila Perez', 'whatsapp' => '56981472140']
        ],
        'sabado' => [
            ['inicio' => '10:00', 'fin' => '14:00', 'ejecutivo' => 'Camila Perez', 'whatsapp' => '56981472140']
        ],
        'domingo' => null
    ],
    // 'curico' eliminada: sucursal cerrada en agosto 2026. Sin turnos = no se puede agendar.
];

// Obtener turnos del dia segun sucursal y dia de semana
function getTurnosDia($sucursal, $diaSemana, $turnosSucursales) {
    // Sucursal no configurada (cerrada o valor invalido) => sin atencion.
    // Antes caia a los turnos de Santiago, lo que permitia agendar en una sucursal inexistente.
    if (!isset($turnosSucursales[$sucursal])) return null;
    $config = $turnosSucursales[$sucursal];
    if ($diaSemana == 7) return $config['domingo'] ?? null; // null = domingo cerrado
    if ($diaSemana == 6) return $config['sabado'];
    // 'viernes' es opcional: solo las sucursales con horario distinto el viernes lo definen
    if ($diaSemana == 5 && isset($config['viernes'])) return $config['viernes'];
    return $config['lunes_viernes'];
}

// Generar slots horarios desde los turnos (1 hora por slot)
function generarSlots($turnos) {
    $slots = [];
    if ($turnos === null) return $slots;
    foreach ($turnos as $turno) {
        $inicio = strtotime('2000-01-01 ' . $turno['inicio']);
        $fin = strtotime('2000-01-01 ' . $turno['fin']);
        $intervalo = 3600; // 1 hora
        for ($t = $inicio; ($t + $intervalo) <= $fin; $t += $intervalo) {
            $slots[] = [
                'hora' => date('H:i', $t),
                'ejecutivo' => $turno['ejecutivo'],
                'whatsapp' => $turno['whatsapp']
            ];
        }
    }
    return $slots;
}

// Obtener ejecutivo asignado para una hora especifica
function getEjecutivoParaHora($sucursal, $diaSemana, $hora, $turnosSucursales) {
    $turnos = getTurnosDia($sucursal, $diaSemana, $turnosSucursales);
    if (!$turnos) return null;
    $slots = generarSlots($turnos);
    foreach ($slots as $slot) {
        if ($slot['hora'] === $hora) {
            return $slot;
        }
    }
    return null;
}

// ================================================
// GET: Obtener horarios disponibles para una fecha
// ================================================
if ($action === 'horarios' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $fecha = $_GET['fecha'] ?? date('Y-m-d');
    $sucursal = $_GET['sucursal'] ?? 'santiago';

    // Validar fecha
    $timestamp = strtotime($fecha);
    if (!$timestamp) {
        echo json_encode(['success' => false, 'error' => 'Fecha invalida']);
        exit;
    }

    $diaSemana = date('N', $timestamp); // 1=Lunes, 7=Domingo

    // Obtener turnos para esta sucursal y dia
    $turnos = getTurnosDia($sucursal, $diaSemana, $turnosSucursales);

    // Sin turnos: o la sucursal no existe/esta cerrada, o ese dia no hay atencion
    if ($turnos === null) {
        echo json_encode([
            'success' => true,
            'fecha' => $fecha,
            'disponible' => false,
            'mensaje' => isset($turnosSucursales[$sucursal])
                ? 'Sin atencion este dia'
                : 'Sucursal no disponible',
            'horarios' => []
        ]);
        exit;
    }

    // Generar slots desde los turnos
    $allSlots = generarSlots($turnos);

    // Obtener citas ya agendadas para esa fecha y sucursal
    $stmt = $pdo->prepare("
        SELECT TIME_FORMAT(hora, '%H:%i') as hora
        FROM citas
        WHERE fecha = ? AND sucursal = ? AND estado IN ('pendiente', 'confirmada')
    ");
    $stmt->execute([$fecha, $sucursal]);
    $citasOcupadas = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Filtrar horarios disponibles con ejecutivo asignado
    $horariosDisponibles = [];
    foreach ($allSlots as $slot) {
        $horariosDisponibles[] = [
            'hora' => $slot['hora'],
            'ejecutivo' => $slot['ejecutivo'],
            'disponible' => !in_array($slot['hora'], $citasOcupadas)
        ];
    }

    echo json_encode([
        'success' => true,
        'fecha' => $fecha,
        'dia_semana' => $diaSemana,
        'disponible' => true,
        'horarios' => $horariosDisponibles
    ]);
    exit;
}

// ================================================
// GET: Obtener fechas del mes con disponibilidad
// ================================================
if ($action === 'calendario' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $mes = str_pad($_GET['mes'] ?? date('m'), 2, '0', STR_PAD_LEFT);
    $anio = $_GET['anio'] ?? date('Y');
    $sucursal = $_GET['sucursal'] ?? 'santiago';

    $primerDia = "$anio-$mes-01";
    $ultimoDia = date('Y-m-t', strtotime($primerDia));

    // Obtener conteo de citas por dia para esta sucursal
    $stmt = $pdo->prepare("
        SELECT fecha, COUNT(*) as total_citas
        FROM citas
        WHERE fecha BETWEEN ? AND ? AND sucursal = ? AND estado IN ('pendiente', 'confirmada')
        GROUP BY fecha
    ");
    $stmt->execute([$primerDia, $ultimoDia, $sucursal]);
    $citasPorDia = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // Generar array de dias del mes
    $dias = [];
    $fechaActual = $primerDia;
    while ($fechaActual <= $ultimoDia) {
        $diaSemana = date('N', strtotime($fechaActual));

        // Obtener turnos para esta sucursal y dia
        $turnos = getTurnosDia($sucursal, $diaSemana, $turnosSucursales);

        // Calcular slots maximos desde los turnos
        $slotsMaximos = count(generarSlots($turnos));

        $citasDelDia = $citasPorDia[$fechaActual] ?? 0;

        $dias[] = [
            'fecha' => $fechaActual,
            'dia' => date('d', strtotime($fechaActual)),
            'dia_semana' => $diaSemana,
            'disponible' => ($turnos !== null) && ($citasDelDia < $slotsMaximos),
            'slots_disponibles' => max(0, $slotsMaximos - $citasDelDia),
            'slots_totales' => $slotsMaximos
        ];

        $fechaActual = date('Y-m-d', strtotime($fechaActual . ' +1 day'));
    }

    echo json_encode([
        'success' => true,
        'mes' => $mes,
        'anio' => $anio,
        'dias' => $dias
    ]);
    exit;
}

// ================================================
// POST: Crear nueva cita
// ================================================
if ($action === 'crear' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;

    // Validar campos requeridos (solo nombre y telefono)
    $required = ['nombre', 'telefono', 'fecha', 'hora'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            echo json_encode(['success' => false, 'error' => "Campo $field es requerido"]);
            exit;
        }
    }

    $fecha = $data['fecha'];
    $hora = $data['hora'];
    $sucursal = $data['sucursal'] ?? 'santiago';

    // Validar que la fecha no sea domingo
    $diaSemana = date('N', strtotime($fecha));

    // Obtener turnos para esta sucursal y dia
    $turnos = getTurnosDia($sucursal, $diaSemana, $turnosSucursales);

    if ($turnos === null) {
        echo json_encode(['success' => false, 'error' => isset($turnosSucursales[$sucursal])
            ? 'No hay atencion en esa fecha'
            : 'Sucursal no disponible']);
        exit;
    }

    // Validar horario y obtener ejecutivo asignado
    $ejecutivoTurno = getEjecutivoParaHora($sucursal, $diaSemana, $hora, $turnosSucursales);
    if (!$ejecutivoTurno) {
        echo json_encode(['success' => false, 'error' => 'Horario no disponible para esta sucursal']);
        exit;
    }

    // Verificar disponibilidad para esta sucursal
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM citas
        WHERE fecha = ? AND hora = ? AND sucursal = ? AND estado IN ('pendiente', 'confirmada')
    ");
    $stmt->execute([$fecha, $hora, $sucursal]);
    if ($stmt->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'error' => 'Este horario ya no esta disponible']);
        exit;
    }

    // Insertar cita
    $stmt = $pdo->prepare("
        INSERT INTO citas (nombre, email, telefono, sucursal, fecha, hora, modelo_interes, mensaje, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    // strip_tags elimina HTML malicioso; htmlspecialchars NO debe usarse aquí
    // (corrompería apostrofes y símbolos al mostrarlos fuera de HTML)
    $stmt->execute([
        strip_tags(trim($data['nombre'])),
        strip_tags(trim($data['email'] ?? '')),
        preg_replace('/[^0-9+\-\s()]/', '', $data['telefono']),  // solo caracteres válidos de teléfono
        $sucursal,
        $fecha,
        $hora,
        strip_tags(trim($data['modelo_interes'] ?? '')),
        strip_tags(trim($data['mensaje'] ?? '')),
        $_SERVER['REMOTE_ADDR'] ?? null
    ]);

    $citaId = $pdo->lastInsertId();

    // ================================================
    // Notificar al ejecutivo asignado por WhatsApp
    // ================================================
    // MODO PRUEBA: Cambiar a false para producción
    $modoPrueba = false;
    $telefonoPrueba = '56963348909'; // Esteban González - Pruebas

    // Ejecutivo asignado segun turno (ya calculado arriba)
    $ejecutivoNotificar = [
        'nombre' => $ejecutivoTurno['ejecutivo'],
        'whatsapp' => $ejecutivoTurno['whatsapp']
    ];

    // Si está en modo prueba, redirigir al teléfono de prueba
    if ($modoPrueba) {
        $ejecutivoNotificar = [
            'nombre' => $ejecutivoTurno['ejecutivo'] . ' (PRUEBA → Esteban)',
            'whatsapp' => $telefonoPrueba
        ];
    }

    // Formatear fecha en español
    $meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    $diasSemana = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    $fechaObj = new DateTime($fecha);
    $nombreDia = $diasSemana[(int)$diaSemana];
    $fechaFormateada = ucfirst($nombreDia) . ' ' . $fechaObj->format('d') . ' de ' . $meses[(int)$fechaObj->format('m')-1];

    $nombresSucursales = [
        'santiago' => 'Santiago (Buin-Linderos)',
        'puerto_montt' => 'Puerto Montt (Sector La Vara)',
        'puerto_varas' => 'Puerto Varas',  // sucursal cerrada — se mantiene para citas historicas
        'curico' => 'Curicó',              // sucursal cerrada — se mantiene para citas historicas
        'paillaco' => 'Paillaco'
    ];
    $nombreSucursal = $nombresSucursales[$sucursal] ?? ucfirst($sucursal);

    // Mensaje para el ejecutivo — enfatiza confirmación
    $mensajeEjecutivo = "🏠 *NUEVA VISITA A SUCURSAL - CONFIRMAR*\n\n";
    $mensajeEjecutivo .= "📍 Sucursal: {$nombreSucursal}\n";
    $mensajeEjecutivo .= "📅 Fecha: {$fechaFormateada}\n";
    $mensajeEjecutivo .= "🕐 Hora: {$hora} hrs\n";
    $mensajeEjecutivo .= "👔 Ejecutivo asignado: {$ejecutivoTurno['ejecutivo']}\n\n";
    $mensajeEjecutivo .= "👤 Cliente: {$data['nombre']}\n";
    $mensajeEjecutivo .= "📞 Teléfono: {$data['telefono']}\n";
    if (!empty($data['email'])) {
        $mensajeEjecutivo .= "✉️ Email: {$data['email']}\n";
    }
    $mensajeEjecutivo .= "\n⚠️ *Esta visita requiere confirmación.*\n";
    $mensajeEjecutivo .= "_Por favor contactar al cliente para confirmar día y hora de la visita._";

    // Enlace WhatsApp directo al cliente (para que el ejecutivo lo contacte)
    $urlWhatsAppCliente = 'https://wa.me/' . preg_replace('/[^0-9]/', '', $data['telefono']);

    // ================================================
    // Enviar WhatsApp automático al ejecutivo via Meta Cloud API
    // ================================================
    $whatsappEnviado = false;
    $whatsappError = '';
    $metaPhoneId = '686129144587443';
    $metaToken = 'EAAIVdDWumoEBRBOCuF44Kjh4U7wdzmF4AXkbu7djtFwrz9udwQ5ILbWEVNfGiELZCpPf6xbgq1PawPTv3SU3CC3mnSxIjNhOJbbnYIKC413sYrp0GYhrzqiYQGFA1LtX0W1sC3ZAsqMVESmcfEHHfbqViIVPZAG4TMJYOfJnglQyhmJtNvDl0KCCCzNmAZDZD';

    try {
        $waPayload = json_encode([
            'messaging_product' => 'whatsapp',
            'to' => $ejecutivoNotificar['whatsapp'],
            'type' => 'template',
            'template' => [
                'name' => 'visitas_sucursal',
                'language' => ['code' => 'es_CL'],
                'components' => [
                    [
                        'type' => 'header',
                        'parameters' => [
                            ['type' => 'text', 'text' => 'Nueva visita agendada']
                        ]
                    ],
                    [
                        'type' => 'body',
                        'parameters' => [
                            ['type' => 'text', 'text' => $nombreSucursal],
                            ['type' => 'text', 'text' => $fechaFormateada],
                            ['type' => 'text', 'text' => $hora . ' hrs'],
                            ['type' => 'text', 'text' => $data['nombre']],
                            ['type' => 'text', 'text' => $data['telefono']]
                        ]
                    ]
                ]
            ]
        ]);

        $ch = curl_init("https://graph.facebook.com/v22.0/{$metaPhoneId}/messages");
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $waPayload,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $metaToken,
                'Content-Type: application/json'
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15
        ]);
        $waResponse = curl_exec($ch);
        $waHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            $whatsappError = "cURL: $curlError";
        } elseif ($waHttpCode >= 200 && $waHttpCode < 300) {
            $whatsappEnviado = true;
        } else {
            $waResult = json_decode($waResponse, true);
            $whatsappError = $waResult['error']['message'] ?? "HTTP $waHttpCode";
        }
        error_log("WhatsApp API citas: HTTP=$waHttpCode | To={$ejecutivoNotificar['whatsapp']} | OK=$whatsappEnviado | Error=$whatsappError");

        // ================================================
        // Mensaje de seguimiento con botones de contacto
        // ================================================
        if ($whatsappEnviado) {
            $telefonoCliente = preg_replace('/[^0-9]/', '', $data['telefono']);
            // Asegurar formato internacional chileno
            if (strlen($telefonoCliente) === 9) $telefonoCliente = '56' . $telefonoCliente;

            // Botón 1: Escribir por WhatsApp al cliente
            $msgContacto1 = json_encode([
                'messaging_product' => 'whatsapp',
                'to' => $ejecutivoNotificar['whatsapp'],
                'type' => 'interactive',
                'interactive' => [
                    'type' => 'cta_url',
                    'body' => [
                        'text' => "📲 *Contactar al cliente para confirmar:*\n\n👤 {$data['nombre']}\n📞 {$data['telefono']}"
                    ],
                    'action' => [
                        'name' => 'cta_url',
                        'parameters' => [
                            'display_text' => '💬 Escribir por WhatsApp',
                            'url' => "https://wa.me/{$telefonoCliente}?text=" . urlencode("Hola {$data['nombre']}, soy {$ejecutivoTurno['ejecutivo']} de Chile Home. Te escribo para confirmar tu visita a nuestra sucursal {$nombreSucursal} el {$fechaFormateada} a las {$hora} hrs. ¿Te queda bien?")
                        ]
                    ]
                ]
            ]);

            $ch2 = curl_init("https://graph.facebook.com/v22.0/{$metaPhoneId}/messages");
            curl_setopt_array($ch2, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $msgContacto1,
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $metaToken,
                    'Content-Type: application/json'
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10
            ]);
            $res2 = curl_exec($ch2);
            $http2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
            curl_close($ch2);
            error_log("WhatsApp botón contacto: HTTP=$http2");

            // Botón 2: Llamar al cliente
            $msgContacto2 = json_encode([
                'messaging_product' => 'whatsapp',
                'to' => $ejecutivoNotificar['whatsapp'],
                'type' => 'interactive',
                'interactive' => [
                    'type' => 'cta_url',
                    'body' => [
                        'text' => '📞 También puedes llamar directamente:'
                    ],
                    'action' => [
                        'name' => 'cta_url',
                        'parameters' => [
                            'display_text' => "📞 Llamar a {$data['nombre']}",
                            'url' => "tel:+{$telefonoCliente}"
                        ]
                    ]
                ]
            ]);

            $ch3 = curl_init("https://graph.facebook.com/v22.0/{$metaPhoneId}/messages");
            curl_setopt_array($ch3, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $msgContacto2,
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $metaToken,
                    'Content-Type: application/json'
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10
            ]);
            $res3 = curl_exec($ch3);
            $http3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
            curl_close($ch3);
            error_log("WhatsApp botón llamar: HTTP=$http3");
        }
    } catch (\Exception $e) {
        $whatsappError = $e->getMessage();
        error_log("WhatsApp API citas exception: " . $whatsappError);
    }

    $notificaciones = [[
        'nombre' => $ejecutivoNotificar['nombre'],
        'whatsapp' => $ejecutivoNotificar['whatsapp'],
        'enviado' => $whatsappEnviado,
        'error' => $whatsappError
    ]];

    // ================================================
    // Enviar EMAIL de notificación automático
    // ================================================
    $emailEnviado = false;
    $emailError = '';
    try {
        require_once __DIR__ . '/../../phpmailer/PHPMailer.php';
        require_once __DIR__ . '/../../phpmailer/SMTP.php';
        require_once __DIR__ . '/../../phpmailer/Exception.php';

        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = 'smtp.hostinger.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'contacto@chilehome.cl';
        $mail->Password = 'Chilehome2026$';
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = 465;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom('contacto@chilehome.cl', 'ChileHome - Visitas');
        // Enviar a admin + tu correo
        $mail->addAddress('contacto@chilehome.cl');

        $mail->isHTML(true);
        $mail->Subject = "🏠 Nueva Visita a Sucursal {$nombreSucursal} - {$fechaFormateada} {$hora} - CONFIRMAR";

        // HTML del email
        $emailBody = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>';
        $emailBody .= '<body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f0f2f5;">';
        $emailBody .= '<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">';

        // Header
        $emailBody .= '<div style="background:#1e293b;padding:24px 30px;text-align:center;">';
        $emailBody .= '<h1 style="margin:0;color:#fff;font-size:20px;">🏠 Nueva Visita a Sucursal</h1>';
        $emailBody .= '<p style="margin:8px 0 0;color:#fbbf24;font-size:14px;font-weight:700;">⚠️ REQUIERE CONFIRMACIÓN</p>';
        $emailBody .= '</div>';

        // Alerta
        $emailBody .= '<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:14px 20px;margin:20px;border-radius:6px;">';
        $emailBody .= '<p style="margin:0;color:#dc2626;font-size:14px;font-weight:700;">El ejecutivo debe contactar al cliente para confirmar la visita.</p>';
        $emailBody .= '</div>';

        // Datos de la cita
        $emailBody .= '<div style="padding:0 30px 20px;">';
        $emailBody .= '<table style="width:100%;border-collapse:collapse;font-size:14px;">';
        $emailBody .= '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px 0;color:#6b7280;width:140px;">📍 Sucursal</td><td style="padding:12px 0;font-weight:700;color:#1e293b;">' . $nombreSucursal . '</td></tr>';
        $emailBody .= '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px 0;color:#6b7280;">📅 Fecha</td><td style="padding:12px 0;font-weight:700;color:#1e293b;">' . $fechaFormateada . '</td></tr>';
        $emailBody .= '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px 0;color:#6b7280;">🕐 Hora</td><td style="padding:12px 0;font-weight:700;color:#1e293b;">' . $hora . ' hrs</td></tr>';
        $emailBody .= '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px 0;color:#6b7280;">👔 Ejecutivo</td><td style="padding:12px 0;font-weight:700;color:#2563eb;">' . htmlspecialchars($ejecutivoTurno['ejecutivo']) . '</td></tr>';
        $emailBody .= '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px 0;color:#6b7280;">👤 Cliente</td><td style="padding:12px 0;font-weight:700;color:#1e293b;">' . htmlspecialchars($data['nombre']) . '</td></tr>';
        $emailBody .= '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px 0;color:#6b7280;">📞 Teléfono</td><td style="padding:12px 0;font-weight:700;color:#1e293b;">' . htmlspecialchars($data['telefono']) . '</td></tr>';
        if (!empty($data['email'])) {
            $emailBody .= '<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px 0;color:#6b7280;">✉️ Email</td><td style="padding:12px 0;">' . htmlspecialchars($data['email']) . '</td></tr>';
        }
        $emailBody .= '</table>';

        // Paso 1: Botón para notificar al ejecutivo
        $msgParaEjecutivo = "Hola {$ejecutivoTurno['ejecutivo']}, tienes una nueva visita agendada en sucursal {$nombreSucursal}:\n\n"
            . "📅 {$fechaFormateada}\n🕐 {$hora} hrs\n👤 {$data['nombre']}\n📞 {$data['telefono']}\n\n"
            . "Por favor contactar al cliente para *confirmar* la visita.";
        $urlNotificarEjecutivo = 'https://wa.me/' . $ejecutivoTurno['whatsapp'] . '?text=' . urlencode($msgParaEjecutivo);

        $emailBody .= '<p style="font-size:13px;font-weight:700;color:#1e293b;margin:20px 0 8px;text-align:center;">Paso 1: Notificar al ejecutivo</p>';
        $emailBody .= '<div style="text-align:center;margin:0 0 16px;">';
        $emailBody .= '<a href="' . $urlNotificarEjecutivo . '" target="_blank" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;">👔 Enviar WhatsApp a ' . htmlspecialchars($ejecutivoTurno['ejecutivo']) . '</a>';
        $emailBody .= '</div>';
        $emailBody .= '<p style="text-align:center;font-size:11px;color:#6b7280;margin:0 0 20px;">Abre WhatsApp con mensaje prellenado para ' . htmlspecialchars($ejecutivoTurno['ejecutivo']) . ' (+' . $ejecutivoTurno['whatsapp'] . ')</p>';

        // Separador
        $emailBody .= '<div style="border-top:1px solid #e5e7eb;margin:0 0 16px;"></div>';

        // Paso 2: Botón para contactar al cliente directamente
        $emailBody .= '<p style="font-size:13px;font-weight:700;color:#1e293b;margin:0 0 8px;text-align:center;">Paso 2 (opcional): Contactar al cliente directo</p>';
        $emailBody .= '<div style="text-align:center;margin:0 0 10px;">';
        $emailBody .= '<a href="' . $urlWhatsAppCliente . '" target="_blank" style="display:inline-block;background:#25D366;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;">📱 WhatsApp al Cliente</a>';
        $emailBody .= '</div>';
        $emailBody .= '<p style="text-align:center;font-size:11px;color:#6b7280;margin:0;">Abre WhatsApp con el número del cliente (' . htmlspecialchars($data['telefono']) . ')</p>';

        $emailBody .= '</div>';

        // Footer
        $emailBody .= '<div style="background:#f8fafc;padding:16px 30px;text-align:center;border-top:1px solid #e5e7eb;">';
        $emailBody .= '<p style="margin:0;font-size:11px;color:#94a3b8;">ChileHome CRM · Cita #' . $citaId . ' · ' . date('d/m/Y H:i') . '</p>';
        $emailBody .= '</div>';

        $emailBody .= '</div></body></html>';

        $mail->Body = $emailBody;

        $mail->send();
        $emailEnviado = true;

    } catch (\Exception $e) {
        $emailError = $e->getMessage();
        error_log("Citas email admin error: " . $emailError);
    }

    // ================================================
    // Enviar EMAIL de confirmación AL CLIENTE
    // ================================================
    $emailClienteEnviado = false;
    $emailClienteError = '';
    if (!empty($data['email'])) {
        try {
            $mailCliente = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mailCliente->isSMTP();
            $mailCliente->Host = 'smtp.hostinger.com';
            $mailCliente->SMTPAuth = true;
            $mailCliente->Username = 'contacto@chilehome.cl';
            $mailCliente->Password = 'Chilehome2026$';
            $mailCliente->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            $mailCliente->Port = 465;
            $mailCliente->CharSet = 'UTF-8';

            $mailCliente->setFrom('contacto@chilehome.cl', 'Chile Home');
            $mailCliente->addAddress($data['email'], $data['nombre']);

            $mailCliente->isHTML(true);
            $mailCliente->Subject = "Confirmación de visita - Chile Home | {$fechaFormateada}";

            $clienteBody = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>';
            $clienteBody .= '<body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f0f2f5;">';
            $clienteBody .= '<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">';

            // Header
            $clienteBody .= '<div style="background:#1e293b;padding:30px;text-align:center;">';
            $clienteBody .= '<h1 style="margin:0;color:#fff;font-size:22px;">🏠 Chile Home</h1>';
            $clienteBody .= '<p style="margin:8px 0 0;color:#fbbf24;font-size:16px;font-weight:700;">Tu visita ha sido agendada</p>';
            $clienteBody .= '</div>';

            // Mensaje
            $clienteBody .= '<div style="padding:24px 30px;">';
            $clienteBody .= '<p style="color:#1e293b;font-size:15px;margin:0 0 20px;">Hola <strong>' . htmlspecialchars($data['nombre']) . '</strong>, hemos recibido tu solicitud de visita. Un ejecutivo se pondrá en contacto contigo para confirmar.</p>';

            // Datos
            $clienteBody .= '<div style="background:#f8fafc;border-radius:8px;padding:20px;border:1px solid #e2e8f0;">';
            $clienteBody .= '<table style="width:100%;border-collapse:collapse;font-size:14px;">';
            $clienteBody .= '<tr><td style="padding:10px 0;color:#6b7280;width:120px;">📍 Sucursal</td><td style="padding:10px 0;font-weight:700;color:#1e293b;">' . $nombreSucursal . '</td></tr>';
            $clienteBody .= '<tr><td style="padding:10px 0;color:#6b7280;">📅 Fecha</td><td style="padding:10px 0;font-weight:700;color:#1e293b;">' . $fechaFormateada . '</td></tr>';
            $clienteBody .= '<tr><td style="padding:10px 0;color:#6b7280;">🕐 Hora</td><td style="padding:10px 0;font-weight:700;color:#1e293b;">' . $hora . ' hrs</td></tr>';
            $clienteBody .= '<tr><td style="padding:10px 0;color:#6b7280;">👔 Ejecutivo</td><td style="padding:10px 0;font-weight:700;color:#2563eb;">' . htmlspecialchars($ejecutivoTurno['ejecutivo']) . '</td></tr>';
            $clienteBody .= '</table>';
            $clienteBody .= '</div>';

            // Nota
            $clienteBody .= '<div style="background:#fefce8;border-left:4px solid #eab308;padding:12px 16px;margin:20px 0;border-radius:6px;">';
            $clienteBody .= '<p style="margin:0;color:#854d0e;font-size:13px;"><strong>Importante:</strong> Nuestro ejecutivo te contactará por WhatsApp o teléfono para confirmar tu visita. Si necesitas reagendar, escríbenos al <strong>+56 9 4431 8105</strong>.</p>';
            $clienteBody .= '</div>';

            $clienteBody .= '</div>';

            // Footer
            $clienteBody .= '<div style="background:#f8fafc;padding:16px 30px;text-align:center;border-top:1px solid #e5e7eb;">';
            $clienteBody .= '<p style="margin:0;font-size:11px;color:#94a3b8;">Chile Home · Casas Prefabricadas · www.chilehome.cl</p>';
            $clienteBody .= '</div>';

            $clienteBody .= '</div></body></html>';

            $mailCliente->Body = $clienteBody;
            $mailCliente->send();
            $emailClienteEnviado = true;

        } catch (\Exception $e) {
            $emailClienteError = $e->getMessage();
            error_log("Citas email cliente error: " . $emailClienteError);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Cita agendada correctamente',
        'cita_id' => $citaId,
        'fecha' => $fecha,
        'hora' => $hora,
        'sucursal' => $nombreSucursal,
        'ejecutivo' => $ejecutivoTurno['ejecutivo'],
        'email_enviado' => $emailEnviado,
        'email_error' => $emailError,
        'email_cliente_enviado' => $emailClienteEnviado,
        'email_cliente_error' => $emailClienteError,
        'whatsapp_enviado' => $whatsappEnviado,
        'whatsapp_error' => $whatsappError,
        'notificar_ejecutivos' => $notificaciones
    ]);
    exit;
}

// ================================================
// GET: Listar citas (admin) — requiere sesión autenticada
// ================================================
if ($action === 'list' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    // Verificar autenticación para operaciones de lectura de datos privados
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No autorizado']);
        exit;
    }
    $fecha = $_GET['fecha'] ?? null;
    $estado = $_GET['estado'] ?? null;
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    $offset = (int)($_GET['offset'] ?? 0);

    $where = ['1=1'];
    $params = [];

    if ($fecha) {
        $where[] = 'fecha = ?';
        $params[] = $fecha;
    }

    if ($estado) {
        $where[] = 'estado = ?';
        $params[] = $estado;
    }

    $whereSQL = implode(' AND ', $where);

    $stmt = $pdo->prepare("
        SELECT * FROM citas
        WHERE $whereSQL
        ORDER BY fecha ASC, hora ASC
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($params);
    $citas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Contar total
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM citas WHERE $whereSQL");
    $stmt->execute($params);
    $total = $stmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'citas' => $citas,
        'total' => $total
    ]);
    exit;
}

// ================================================
// PUT: Actualizar estado de cita (admin)
// ================================================
if ($action === 'actualizar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No autorizado']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;

    if (empty($data['id'])) {
        echo json_encode(['success' => false, 'error' => 'ID de cita requerido']);
        exit;
    }

    $campos = [];
    $params = [];

    $estadosPermitidos = ['pendiente', 'confirmada', 'cancelada', 'completada'];
    if (isset($data['estado'])) {
        if (!in_array($data['estado'], $estadosPermitidos, true)) {
            echo json_encode(['success' => false, 'error' => 'Estado no válido']);
            exit;
        }
        $campos[] = 'estado = ?';
        $params[] = $data['estado'];
    }

    if (isset($data['notas_admin'])) {
        $campos[] = 'notas_admin = ?';
        $params[] = substr(strip_tags($data['notas_admin']), 0, 1000);
    }

    if (empty($campos)) {
        echo json_encode(['success' => false, 'error' => 'No hay campos para actualizar']);
        exit;
    }

    $params[] = $data['id'];

    $stmt = $pdo->prepare("UPDATE citas SET " . implode(', ', $campos) . " WHERE id = ?");
    $stmt->execute($params);

    echo json_encode(['success' => true, 'message' => 'Cita actualizada']);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Accion no valida']);
