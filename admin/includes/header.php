<?php
/**
 * ChileHome CRM - Header
 */

if (!isset($currentPage)) {
    $currentPage = basename($_SERVER['PHP_SELF'], '.php');
}
$user = Auth::user();

// Detectar si estamos en subcarpeta pages
$assetBase = strpos($_SERVER['SCRIPT_NAME'], '/pages/') !== false ? '../' : '';

// Check if PWA is installed (server-side flag)
$_pwaInstalled = false;
try {
    $db = Database::getInstance();
    $_pwaInstalled = ($db->fetchOne("SELECT config_value FROM site_config WHERE config_key = 'pwa_installed'")['config_value'] ?? '0') === '1';
} catch (Exception $e) {}

// Log page view (skip AJAX requests and the activity page itself)
if (Auth::check() && !isset($_GET['action']) && $_SERVER['REQUEST_METHOD'] === 'GET' && ($currentPage ?? '') !== 'actividad') {
    try {
        $db = Database::getInstance();
        $_pageLabels = [
            'index'          => 'Dashboard principal',
            'campanas'       => 'Campañas WhatsApp · Ejecutivos',
            'leads'          => 'Leads / Contactos',
            'ventas'         => 'Ventas SmartCRM',
            'rotacion'       => 'Rotación WhatsApp',
            'modelos'        => 'Modelos de Casas',
            'analytics'      => 'Analytics GA4',
            'whatsapp-clicks'=> 'Clics WhatsApp',
            'meta-ads'       => 'Meta Ads',
            'usuarios'       => 'Usuarios y Roles',
            'configuracion'  => 'Configuración',
            'agenda'         => 'Agenda / Citas',
            'actividad'      => 'Actividad',
        ];
        $_cp = $currentPage ?? 'unknown';
        $_detail = $_pageLabels[$_cp] ?? ('Visitó ' . $_cp);
        $db->query(
            "INSERT INTO user_activity_log (user_id, user_name, user_rol, action_type, page, details, ip_address) VALUES (?,?,?,?,?,?,?)",
            [
                $_SESSION['user_id'] ?? 0,
                $_SESSION['user_nombre'] ?? 'unknown',
                $_SESSION['user_rol'] ?? '',
                'page_view',
                $_cp,
                $_detail,
                $_SERVER['REMOTE_ADDR'] ?? ''
            ]
        );
        unset($_pageLabels, $_cp, $_detail);
    } catch (Exception $e) {} // fail silently
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="csrf-token" content="<?php echo Auth::generateCSRFToken(); ?>">
    <title><?php echo $pageTitle ?? 'Dashboard'; ?> - <?php echo APP_NAME; ?></title>
    <link rel="icon" type="image/svg+xml" href="<?php echo $assetBase; ?>assets/img/favicon.svg">

    <!-- PWA -->
    <meta name="theme-color" content="#111827">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="ChileHome CRM">
    <link rel="manifest" href="<?php echo $assetBase; ?>manifest.json">
    <link rel="apple-touch-icon" sizes="180x180" href="<?php echo $assetBase; ?>assets/img/apple-touch-icon.png?v=<?php echo APP_VERSION; ?>">
    <link rel="icon" type="image/png" sizes="192x192" href="<?php echo $assetBase; ?>assets/img/icon-192.png?v=<?php echo APP_VERSION; ?>">

    <!-- Fonts (non-blocking) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
    <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"></noscript>

    <!-- Icons (non-blocking) -->
    <link rel="preload" as="style" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></noscript>
    <!-- Flatpickr datepicker -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/es.js"></script>
    <!-- Chart.js y GSAP -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

    <!-- Styles -->
    <link rel="stylesheet" href="<?php echo $assetBase; ?>assets/css/admin.css?v=<?php echo APP_VERSION; ?>">
    <link rel="stylesheet" href="<?php echo $assetBase; ?>assets/css/admin-pro.css?v=<?php echo APP_VERSION; ?>">
    <link rel="stylesheet" href="<?php echo $assetBase; ?>assets/css/dashboard-pro.css?v=<?php echo APP_VERSION; ?>">
    <link rel="stylesheet" href="<?php echo $assetBase; ?>assets/css/mobile-fixes.css?v=<?php echo APP_VERSION; ?>">
</head>
<body>
    <script>
    // Theme init (prevent FOUC) — supports light / auto / dark
    (function(){
        var t = localStorage.getItem('crm-theme') || 'auto';
        var isDark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) document.body.classList.add('dark-mode');
    })();
    </script>

    <!-- PWA Splash Loader -->
    <div id="pwa-splash">
        <div class="splash-content">
            <div class="splash-logo-wrap">
                <svg class="splash-ring" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" stroke-width="3" fill="none" stroke="#e2e8f0" />
                    <circle id="splash-progress-ring" cx="60" cy="60" r="54" stroke-width="3" fill="none" stroke="#D4A84B"
                        stroke-linecap="round" stroke-dasharray="339.29" stroke-dashoffset="339.29"
                        style="transform:rotate(-90deg);transform-origin:center;transition:stroke-dashoffset .3s ease" />
                </svg>
                <img src="<?php echo $assetBase; ?>assets/img/isotipo-negro.svg" alt="ChileHome" class="splash-logo" id="splash-img">
                <script>(function(){if(document.body.classList.contains('dark-mode')){var i=document.getElementById('splash-img');if(i)i.src=i.src.replace('isotipo-negro.svg','isotipo-blanco.svg');}})();</script>
            </div>
            <div class="splash-text">
                <span class="splash-title">ChileHome CRM</span>
                <span class="splash-version">v<?php echo APP_VERSION; ?></span>
            </div>
            <span id="splash-pct" class="splash-pct">0%</span>
        </div>
    </div>
    <style>
    #pwa-splash{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:#fff;transition:opacity .5s ease,visibility .5s ease}
    .splash-content{display:flex;flex-direction:column;align-items:center;gap:24px}
    .splash-logo-wrap{position:relative;width:110px;height:110px;display:flex;align-items:center;justify-content:center}
    .splash-ring{position:absolute;inset:0;width:110px;height:110px}
    .splash-logo{width:72px;height:auto;position:relative;z-index:1}
    .splash-text{display:flex;flex-direction:column;align-items:center;gap:2px}
    .splash-title{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:17px;font-weight:700;color:#0f172a;letter-spacing:-.02em}
    .splash-version{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#94a3b8;font-weight:500}
    .splash-pct{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:600;color:#D4A84B;letter-spacing:.5px;min-width:36px;text-align:center}
    body.dark-mode #pwa-splash{background:#111111}
    body.dark-mode .splash-title{color:#ededec}
    body.dark-mode .splash-version{color:#6b6b6b}
    body.dark-mode .splash-ring circle:first-child{stroke:#222}
    </style>
    <script>
    (function(){
        var pct=0,ring=null,txt=null,total=339.29;
        function tick(){
            if(!ring)ring=document.getElementById('splash-progress-ring');
            if(!txt)txt=document.getElementById('splash-pct');
            if(!ring||!txt)return;
            pct+=Math.random()*12+3;
            if(pct>92)pct=92;
            ring.setAttribute('stroke-dashoffset',total-(total*pct/100));
            txt.textContent=Math.round(pct)+'%';
        }
        var iv=setInterval(tick,200);
        window._splashDone=function(){
            clearInterval(iv);
            if(ring)ring.setAttribute('stroke-dashoffset','0');
            if(txt)txt.textContent='100%';
        };
        // Fallback: force hide splash after 25s (emergency only — DOMContentLoaded handles normal case)
        setTimeout(function(){
            var splash=document.getElementById('pwa-splash');
            if(!splash||splash._hidden)return;
            splash._hidden=true;
            if(window._splashDone)window._splashDone();
            setTimeout(function(){
                splash.style.opacity='0';
                splash.style.visibility='hidden';
                setTimeout(function(){if(splash.parentNode)splash.parentNode.removeChild(splash);},500);
            },300);
        },25000);
    })();
    </script>

    <div class="admin-wrapper">
