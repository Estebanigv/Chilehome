<?php
/**
 * ChileHome CRM - Sidebar Navigation
 */

// Detectar si estamos en subcarpeta pages
$baseUrl = strpos($_SERVER['SCRIPT_NAME'], '/pages/') !== false ? '../' : '';

$menuSections = [
    // Inicio (sin sección header)
    [
        'items' => [
            ['id' => 'index', 'icon' => 'fa-home', 'label' => 'Inicio', 'url' => $baseUrl . 'index'],
        ]
    ],
    // COMERCIAL
    [
        'section' => 'Comercial',
        'items' => [
            ['id' => 'leads', 'icon' => 'fa-users', 'label' => 'Leads', 'url' => '#', 'submenu' => [
                ['id' => 'leads-all', 'icon' => 'fa-address-book', 'label' => 'Contactos', 'url' => $baseUrl . 'pages/leads'],
                ['id' => 'leads-correos', 'icon' => 'fa-envelope', 'label' => 'Correos Web', 'url' => $baseUrl . 'pages/leads?tipo=formulario'],
                ['id' => 'leads-whatsapp', 'icon' => 'fa-whatsapp', 'label' => 'WhatsApp Web', 'url' => $baseUrl . 'pages/whatsapp-clicks', 'iconPrefix' => 'fab'],
            ]],
            ['id' => 'citas', 'icon' => 'fa-calendar-alt', 'label' => 'Agenda', 'url' => $baseUrl . 'pages/citas'],
            ['id' => 'ventas', 'icon' => 'fa-dollar-sign', 'label' => 'Ventas', 'url' => $baseUrl . 'pages/ventas', 'badge' => true],
            ['id' => 'rendimiento', 'icon' => 'fa-chart-line', 'label' => 'Rendimiento', 'url' => $baseUrl . 'pages/rendimiento', 'badge' => true],
        ]
    ],
    // MARKETING
    [
        'section' => 'Marketing',
        'items' => [
            ['id' => 'campanas', 'icon' => 'fa-bullhorn', 'label' => 'Campañas', 'url' => $baseUrl . 'pages/campanas'],
            // Meta Ads oculto por ahora - descomentar cuando se necesite
            // ['id' => 'meta-ads', 'icon' => 'fa-ad', 'label' => 'Meta Ads', 'url' => $baseUrl . 'pages/meta-ads'],
            ['id' => 'creativos', 'icon' => 'fa-images', 'label' => 'Creativos', 'url' => $baseUrl . 'pages/creativos'],
            ['id' => 'analytics', 'icon' => 'fa-chart-pie', 'label' => 'Analytics', 'url' => $baseUrl . 'pages/analytics'],
        ]
    ],
    // GESTIÓN
    [
        'section' => 'Gestión',
        'items' => [
            ['id' => 'ejecutivos', 'icon' => 'fa-headset', 'label' => 'Ejecutivos', 'url' => $baseUrl . 'pages/ejecutivos'],
            ['id' => 'rotacion', 'icon' => 'fa-sync-alt', 'label' => 'Rotación WhatsApp', 'url' => $baseUrl . 'pages/rotacion'],
            ['id' => 'modelos', 'icon' => 'fa-building', 'label' => 'Modelos', 'url' => $baseUrl . 'pages/modelos'],
            ['id' => 'emails', 'icon' => 'fa-envelope', 'label' => 'Emails', 'url' => $baseUrl . 'pages/emails'],
            ['id' => 'contenido', 'icon' => 'fa-edit', 'label' => 'Contenido', 'url' => $baseUrl . 'pages/contenido'],
            ['id' => 'comparativas', 'icon' => 'fa-scale-balanced', 'label' => 'Comparativas', 'url' => $baseUrl . 'pages/comparativas'],
        ]
    ],
    // SISTEMA (solo master_control)
    ...Auth::isMasterControl() ? [[
        'section' => 'Sistema',
        'items' => [
            ['id' => 'actividad', 'icon' => 'fa-history', 'label' => 'Actividad', 'url' => $baseUrl . 'pages/actividad'],
            ['id' => 'configuracion', 'icon' => 'fa-cog', 'label' => 'Configuración', 'url' => $baseUrl . 'pages/configuracion'],
        ]
    ]] : [],
];

// Usuarios visible para master_control y superadmin
if (Auth::canManageUsers()) {
    $menuSections[count($menuSections) - 1]['items'][] = ['id' => 'usuarios', 'icon' => 'fa-user-shield', 'label' => 'Usuarios', 'url' => $baseUrl . 'pages/usuarios'];
}
?>

<!-- Mobile Toggle Button -->
<button class="sidebar-mobile-toggle" id="sidebarMobileToggle">
    <i class="fas fa-bars"></i>
</button>

<!-- Mobile theme toggle (top-right, cycles through modes) -->
<button class="theme-toggle-btn theme-toggle-mobile" id="themeToggleMobile" onclick="cycleTheme()" title="Cambiar tema">
    <i class="fas fa-sun theme-icon-light"></i>
    <i class="fas fa-circle-half-stroke theme-icon-auto"></i>
    <i class="fas fa-moon theme-icon-dark"></i>
</button>

<aside class="sidebar" id="sidebar">
    <!-- Botón cerrar en móvil - Posición fija arriba -->
    <button class="sidebar-close-mobile" id="sidebarCloseMobile" title="Cerrar menu">
        <i class="fas fa-times"></i>
    </button>

    <!-- Header con Logo -->
    <div class="sidebar-header">
        <a href="<?php echo $baseUrl; ?>index" class="sidebar-brand">
            <img src="<?php echo $baseUrl; ?>assets/img/logo-blanco.svg" alt="Chile Home" class="sidebar-logo sidebar-logo-full">
            <img src="<?php echo $baseUrl; ?>assets/img/isotipo.svg" alt="CH" class="sidebar-logo sidebar-logo-icon">
            <div class="sidebar-version-row">
                <span class="sidebar-version">v<?php echo APP_VERSION; ?></span>
                <span class="sidebar-version-status" id="sidebarVersionStatus"></span>
            </div>
        </a>
        <button class="sidebar-toggle-btn" id="sidebarToggle" title="Colapsar menu">
            <i class="fas fa-chevron-left"></i>
        </button>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
        <ul class="nav-list">
            <?php foreach ($menuSections as $group): ?>
                <?php if (!empty($group['section'])): ?>
                    <li class="nav-section-title"><span><?php echo $group['section']; ?></span></li>
                <?php endif; ?>
                <?php foreach ($group['items'] as $item): ?>
                    <?php if (!empty($item['submenu'])): ?>
                        <?php
                        $subActive = false;
                        foreach ($item['submenu'] as $sub) {
                            if ($currentPage === $sub['id'] || $currentPage === $item['id']) { $subActive = true; break; }
                        }
                        ?>
                        <li class="nav-item nav-has-submenu <?php echo $subActive ? 'active open' : ''; ?>" data-tooltip="<?php echo $item['label']; ?>">
                            <a href="javascript:void(0)" class="nav-link nav-submenu-toggle">
                                <i class="fas <?php echo $item['icon']; ?>"></i>
                                <span><?php echo $item['label']; ?></span>
                                <i class="fas fa-chevron-down nav-submenu-arrow"></i>
                            </a>
                            <ul class="nav-submenu">
                                <?php foreach ($item['submenu'] as $sub): ?>
                                    <li class="nav-subitem <?php echo $currentPage === $sub['id'] ? 'active' : ''; ?>">
                                        <a href="<?php echo $sub['url']; ?>" class="nav-sublink">
                                            <i class="<?php echo ($sub['iconPrefix'] ?? 'fas') . ' ' . $sub['icon']; ?>"></i>
                                            <span><?php echo $sub['label']; ?></span>
                                        </a>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        </li>
                    <?php else: ?>
                        <li class="nav-item <?php echo $currentPage === $item['id'] ? 'active' : ''; ?>" data-tooltip="<?php echo $item['label']; ?>">
                            <a href="<?php echo $item['url']; ?>" class="nav-link">
                                <i class="fas <?php echo $item['icon']; ?>"></i>
                                <span><?php echo $item['label']; ?></span>
                                <?php if (!empty($item['badge'])): ?>
                                    <span class="nav-new-badge" data-badge-id="<?php echo $item['id']; ?>">New</span>
                                <?php endif; ?>
                            </a>
                        </li>
                    <?php endif; ?>
                <?php endforeach; ?>
            <?php endforeach; ?>
            <!-- Update pendiente (hidden by default, shown by JS) -->
            <li class="nav-item nav-update-item" id="navUpdateItem" style="display:none;" data-tooltip="Actualizar">
                <a href="javascript:void(0)" class="nav-link" onclick="showUpdateBanner()">
                    <i class="fas fa-rotate"></i>
                    <span>Actualizar</span>
                    <span class="nav-update-badge" id="navUpdateBadge">1</span>
                </a>
            </li>
            <!-- Instalar App (hidden by default, shown by JS when not installed) -->
            <li class="nav-item nav-install-item" id="navInstallItem" style="display:none;" data-tooltip="Instalar App">
                <a href="javascript:void(0)" class="nav-link" id="sidebarInstallBtn">
                    <i class="fas fa-download"></i>
                    <span>Instalar App</span>
                </a>
            </li>
        </ul>
    </nav>

    <!-- Theme Selector -->
    <div class="sidebar-theme-bar">
        <div class="theme-switcher" id="themeSwitcher">
            <button class="theme-opt" data-theme="light" onclick="setTheme('light')" title="Claro">
                <i class="fas fa-sun"></i>
            </button>
            <button class="theme-opt" data-theme="auto" onclick="setTheme('auto')" title="Automático">
                <i class="fas fa-circle-half-stroke"></i>
            </button>
            <button class="theme-opt" data-theme="dark" onclick="setTheme('dark')" title="Oscuro">
                <i class="fas fa-moon"></i>
            </button>
        </div>
    </div>

    <!-- Footer con Usuario -->
    <div class="sidebar-footer">
        <div class="user-card">
            <div class="user-avatar">
                <?php echo getInitials($user['nombre']); ?>
            </div>
            <div class="user-info">
                <span class="user-name"><?php echo htmlspecialchars($user['nombre']); ?></span>
                <span class="user-role"><?php echo ucfirst($user['rol']); ?></span>
            </div>
            <a href="<?php echo $baseUrl; ?>logout" class="btn-logout" title="Cerrar sesion">
                <i class="fas fa-sign-out-alt"></i>
            </a>
        </div>
    </div>
</aside>

<script>
// ============================================================
// NAV BADGES — "New" basado en tiempo de primer acceso
// Verde  < 7 días desde que el usuario visitó por primera vez
// Amarillo 7–14 días
// Desaparece > 14 días
// ============================================================
(function() {
    const FIRST_SEEN_KEY = 'crm-first-seen';
    const currentPage    = '<?php echo addslashes($currentPage); ?>';
    const DAY_MS         = 86400000;

    function getFirstSeen() {
        try { return JSON.parse(localStorage.getItem(FIRST_SEEN_KEY) || '{}'); }
        catch(e) { return {}; }
    }
    function saveFirstSeen(data) {
        localStorage.setItem(FIRST_SEEN_KEY, JSON.stringify(data));
    }

    const firstSeen = getFirstSeen();
    const now       = Date.now();

    // Registrar primera visita a la página actual (si tiene badge)
    const badgeEl = document.querySelector('[data-badge-id="' + currentPage + '"]');
    if (badgeEl && !firstSeen[currentPage]) {
        firstSeen[currentPage] = now;
        saveFirstSeen(firstSeen);
    }

    // Aplicar color / ocultar cada badge según edad
    document.querySelectorAll('[data-badge-id]').forEach(function(el) {
        const id        = el.dataset.badgeId;
        const seenAt    = firstSeen[id];

        if (!seenAt) {
            // Nunca visto → verde (se verá cuando entre por primera vez)
            el.classList.add('nav-new-badge--green');
            return;
        }

        const days = (now - seenAt) / DAY_MS;

        if (days < 7) {
            el.classList.add('nav-new-badge--green');
        } else if (days < 14) {
            // Amarillo — estilos por defecto del badge
        } else {
            el.style.display = 'none';
        }
    });

    // Banner informativo solo en la primera visita (día 0)
    if (badgeEl && firstSeen[currentPage] && (now - firstSeen[currentPage]) < DAY_MS) {
        window.addEventListener('DOMContentLoaded', function() {
            showNewFeatureNotif(currentPage);
        });
    }

    function showNewFeatureNotif(id) {
        const main = document.querySelector('.main-content');
        if (!main) return;

        const notif = document.createElement('div');
        notif.className = 'nav-badge-notif';
        notif.innerHTML =
            '<i class="fas fa-star-of-life"></i>' +
            '<span>Esta sección fue actualizada con nuevas funcionalidades.</span>' +
            '<button class="nav-badge-notif-btn">Entendido</button>';

        const firstChild = main.querySelector('.page-header');
        main.insertBefore(notif, firstChild ? firstChild.nextSibling : main.firstChild);

        notif.querySelector('.nav-badge-notif-btn').addEventListener('click', function() {
            notif.style.opacity = '0';
            notif.style.transform = 'translateY(-8px)';
            setTimeout(function() { notif.remove(); }, 300);
        });
    }
})();
</script>

<div class="sidebar-overlay" id="sidebarOverlay"></div>

<!-- Bottom Navigation Bar (Mobile) -->
<nav class="bottom-nav" id="bottomNav" role="navigation" aria-label="Navegación principal">
    <a href="<?php echo $baseUrl; ?>index"
       class="bottom-nav-item <?php echo $currentPage === 'index' ? 'active' : ''; ?>"
       aria-label="Inicio">
        <i class="fas fa-home" aria-hidden="true"></i>
        <span>Inicio</span>
    </a>
    <a href="<?php echo $baseUrl; ?>pages/leads"
       class="bottom-nav-item <?php echo in_array($currentPage, ['leads', 'leads-all', 'leads-correos', 'leads-whatsapp']) ? 'active' : ''; ?>"
       aria-label="Leads">
        <i class="fas fa-users" aria-hidden="true"></i>
        <span>Leads</span>
    </a>
    <a href="<?php echo $baseUrl; ?>pages/citas"
       class="bottom-nav-item <?php echo $currentPage === 'citas' ? 'active' : ''; ?>"
       aria-label="Agenda">
        <i class="fas fa-calendar-alt" aria-hidden="true"></i>
        <span>Agenda</span>
    </a>
    <a href="<?php echo $baseUrl; ?>pages/campanas"
       class="bottom-nav-item <?php echo $currentPage === 'campanas' ? 'active' : ''; ?>"
       aria-label="Campañas">
        <i class="fas fa-bullhorn" aria-hidden="true"></i>
        <span>Campañas</span>
    </a>
    <button type="button"
            class="bottom-nav-item"
            id="bottomNavMenu"
            aria-label="Abrir menú"
            aria-expanded="false">
        <i class="fas fa-bars" aria-hidden="true"></i>
        <span>Más</span>
    </button>
</nav>
