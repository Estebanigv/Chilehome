<?php
/**
 * ChileHome CRM — Comparativas de Precios
 * Cuadro comparativo Chile Home vs competencia (uso interno)
 */

require_once __DIR__ . '/../config/config.php';
Auth::require();

$db = Database::getInstance();
$user = Auth::user();
$currentPage = 'comparativas';

// ─── CREATE TABLE ──────────────────────────────────
try {
    $db->query("CREATE TABLE IF NOT EXISTS comparativas_precios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa VARCHAR(100) NOT NULL,
        website VARCHAR(255),
        modelo VARCHAR(150) NOT NULL,
        metros DECIMAL(6,1) NOT NULL,
        dormitorios INT DEFAULT 0,
        banos INT DEFAULT 0,
        tipo_techo VARCHAR(50),
        material VARCHAR(150),
        precio INT DEFAULT 0,
        precio_texto VARCHAR(50),
        cobertura VARCHAR(200),
        observaciones TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (Exception $e) {
    error_log("Migration comparativas_precios: " . $e->getMessage());
}

// ─── AJAX HANDLERS ─────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');

    switch ($_POST['action']) {
        case 'seed_data':
            if (Auth::isReadOnly()) {
                echo json_encode(['success' => false, 'message' => 'Sin permisos']);
                exit;
            }
            try {
                // Limpiar e insertar datos frescos
                $db->query("TRUNCATE TABLE comparativas_precios");

                $data = [
                    ['Chile Home','chilehome.cl','2 Aguas 36 m² (Línea Clásica)',36,2,1,'2 Aguas','Paneles Pino',1550000,'','Nacional (Chañaral a Puerto Varas)','Precio base. Flete incluido. +25.000 casas entregadas'],
                    ['Chile Home','chilehome.cl','2 Aguas 54 m² (Línea Clásica)',54,2,1,'2 Aguas','Paneles Pino',1950000,'','Nacional (Chañaral a Puerto Varas)','PRECIO MÁS POPULAR. Puertas y ventanas incluidas'],
                    ['Chile Home','chilehome.cl','2 Aguas 72 m² (Línea Clásica)',72,3,1,'2 Aguas','Paneles Pino',2700000,'','Nacional (Chañaral a Puerto Varas)','Modelo nuevo 2026. Puertas y ventanas incluidas'],
                    ['Chile Home','chilehome.cl','6 Aguas 54 m² (Línea Clásica)',54,2,1,'6 Aguas','Paneles Pino - Siding',0,'A consultar','Nacional','Siding exterior. Precio requiere cotización'],
                    ['Chile Home','chilehome.cl','6 Aguas 72 m² (Línea Clásica)',72,3,1,'6 Aguas','Paneles Pino',0,'A consultar','Nacional','Precio requiere cotización'],
                    ['Chile Home','chilehome.cl','Terra 36 m² (Línea 2026)',36,2,1,'2 Aguas','Paneles Pino - Diseño contemporáneo',0,'A consultar','Nacional','Línea 2026 minimalista'],
                    ['Casas San Gabriel','soloprefabricadas.cl','2 Aguas 36 m²',36,2,1,'2 Aguas','Madera (Paneles)',2250000,'','Biobío (cobertura nacional)','Modelo mediterráneo. Kit básico'],
                    ['Casas San Gabriel','soloprefabricadas.cl','Mediterráneo 54 m²',54,3,1,'4 Aguas','Madera (Paneles)',2450000,'','Biobío (cobertura nacional)','3 dormitorios. Kit básico'],
                    ['Casas San Gabriel','soloprefabricadas.cl','4 Aguas 82 m²',82,3,2,'4 Aguas','Madera (Paneles)',3470000,'','Biobío (cobertura nacional)','Kit básico'],
                    ['Casas San Gabriel','soloprefabricadas.cl','4 Aguas 101 m²',101,4,2,'4 Aguas','Madera (Paneles)',3920000,'','Biobío (cobertura nacional)','Kit básico'],
                    ['Casas San Gabriel','soloprefabricadas.cl','4 Aguas 122 m²',122,6,3,'4 Aguas','Madera (Paneles)',4430000,'','Biobío (cobertura nacional)','Kit básico'],
                    ['Casas Laguna','casaslaguna.cl','Casa 36 m² 2 Aguas',36,2,1,'2 Aguas','Madera (Paneles)',1690000,'','R. Metropolitana / Coquimbo','Kit básico. Precio incluye IVA'],
                    ['Casas Laguna','casaslaguna.cl','Casa 54 m² 4 Aguas',54,3,1,'4 Aguas','Madera (Paneles)',2190000,'','R. Metropolitana / Coquimbo','Kit básico'],
                    ['Casas Laguna','casaslaguna.cl','Casa 72 m² 6 Aguas',72,4,2,'6 Aguas','Madera (Paneles)',2690000,'','R. Metropolitana / Coquimbo','Kit básico'],
                    ['Casas Laguna','casaslaguna.cl','Casa 93 m² Mediterránea',93,4,2,'4 Aguas','Madera (Paneles)',3790000,'','R. Metropolitana / Coquimbo','Kit básico'],
                    ['Casas Huelquen','casaschilespa.cl','Estrella 36 m²',36,2,1,'2 Aguas','Madera (Paneles)',1600000,'','R. Metropolitana','Kit básico'],
                    ['Casas Huelquen','casaschilespa.cl','Estrella 54 m²',54,3,1,'2 Aguas','Madera (Paneles)',2300000,'','R. Metropolitana','Kit básico'],
                    ['Casas Huelquen','casaschilespa.cl','Estrella 72 m²',72,4,2,'2 Aguas','Madera (Paneles)',3100000,'','R. Metropolitana','Kit básico'],
                    ['Casas Huelquen','casaschilespa.cl','Caupolicán 72 m²',72,4,2,'2 Aguas','Madera (Paneles)',3300000,'','R. Metropolitana','Modelo superior'],
                    ['Casas Chile SpA','casaschilespa.cl','Temuco 36 m²',36,2,1,'2 Aguas','Madera Pino 1ª selección',4070000,'','Nacional (3 sucursales)','Kit inicial. Alta calidad'],
                    ['Casas Chile SpA','casaschilespa.cl','Temuco 54 m²',54,3,1,'2 Aguas','Madera Pino 1ª selección',5092000,'','Nacional (3 sucursales)','Kit inicial'],
                    ['Casas Chile SpA','casaschilespa.cl','Temuco 72 m²',72,4,2,'2 Aguas','Madera Pino 1ª selección',6573000,'','Nacional (3 sucursales)','Kit inicial. 4 dorm 2 baños'],
                    ['Casas Chile SpA','casaschilespa.cl','Mediterránea 72 m²',72,4,2,'4 Aguas','Madera Pino 1ª selección',8569000,'','Nacional (3 sucursales)','Kit inicial. Premium'],
                    ['Casas Río Bueno','casasriobueno.cl','Crucero 37 m²',37,2,1,'2 Aguas','Madera (Paneles)',2390000,'','Los Lagos / Los Ríos','Kit básico. Sur de Chile'],
                    ['Casas Río Bueno','casasriobueno.cl','Rupanco 49 m²',49,3,1,'2 Aguas','Madera (Paneles)',2790000,'','Los Lagos / Los Ríos','Kit básico'],
                    ['Casas Río Bueno','casasriobueno.cl','Río Bueno 55 m²',55,3,1,'2 Aguas','Madera (Paneles)',3290000,'','Los Lagos / Los Ríos','Kit básico'],
                    ['Casas Río Bueno','casasriobueno.cl','Riñinahue 74 m²',74,4,2,'2 Aguas','Madera (Paneles)',3990000,'','Los Lagos / Los Ríos','Kit básico'],
                    ['Casa de Madera','casademadera.cl','2 Aguas 72 m²',72,3,1,'2 Aguas','Madera (Paneles)',3770000,'','Los Ríos','Incluye kit ventanas y puertas'],
                ];

                $sql = "INSERT INTO comparativas_precios (empresa, website, modelo, metros, dormitorios, banos, tipo_techo, material, precio, precio_texto, cobertura, observaciones) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
                foreach ($data as $row) {
                    $db->query($sql, $row);
                }
                echo json_encode(['success' => true, 'message' => count($data) . ' registros cargados']);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
            exit;

        case 'fetch_all':
            try {
                $rows = $db->fetchAll("SELECT * FROM comparativas_precios ORDER BY empresa, metros ASC");
                echo json_encode(['success' => true, 'data' => $rows]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
            exit;
    }
}

// ─── PAGE DATA ─────────────────────────────────────
$totalRegistros = 0;
$empresas = [];
$allData = [];
try {
    $totalRegistros = $db->fetchOne("SELECT COUNT(*) as c FROM comparativas_precios")['c'] ?? 0;
    $empresas = $db->fetchAll("SELECT DISTINCT empresa, COUNT(*) as modelos, MIN(CASE WHEN precio > 0 THEN precio END) as precio_min, MAX(precio) as precio_max FROM comparativas_precios GROUP BY empresa ORDER BY precio_min ASC");
    $allData = $db->fetchAll("SELECT * FROM comparativas_precios WHERE precio > 0 ORDER BY metros ASC, precio ASC");
} catch (Exception $e) {
    // Table might not have data yet
}

// Datos para gráficos
$chartCompare36 = $db->fetchAll("SELECT empresa, precio FROM comparativas_precios WHERE metros BETWEEN 35 AND 37 AND precio > 0 ORDER BY precio ASC") ?: [];
$chartCompare54 = $db->fetchAll("SELECT empresa, precio FROM comparativas_precios WHERE metros BETWEEN 53 AND 55 AND precio > 0 ORDER BY precio ASC") ?: [];
$chartCompare72 = $db->fetchAll("SELECT empresa, precio FROM comparativas_precios WHERE metros BETWEEN 71 AND 74 AND precio > 0 ORDER BY precio ASC") ?: [];
$chartPrecioM2 = $db->fetchAll("SELECT empresa, ROUND(AVG(precio/metros)) as precio_m2 FROM comparativas_precios WHERE precio > 0 GROUP BY empresa ORDER BY precio_m2 ASC") ?: [];

include __DIR__ . '/../includes/header.php';
include __DIR__ . '/../includes/sidebar.php';
?>

<style>
.comp-container { padding: 20px; max-width: 1600px; margin: 0 auto; }

/* KPIs */
.comp-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
.comp-kpi { background: var(--dash-bg-secondary); border: 1px solid var(--dash-border); border-radius: 14px; padding: 22px 16px; text-align: center; position: relative; overflow: hidden; }
.comp-kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
.comp-kpi:nth-child(1)::before { background: #3b82f6; }
.comp-kpi:nth-child(2)::before { background: #c9a86c; }
.comp-kpi:nth-child(3)::before { background: #22c55e; }
.comp-kpi:nth-child(4)::before { background: #22c55e; }
.comp-kpi .number { font-size: 1.7rem; font-weight: 800; display: block; letter-spacing: -0.02em; }
.comp-kpi .number.green { color: #22c55e; }
.comp-kpi .number.gold { color: #c9a86c; }
.comp-kpi .number.blue { color: #3b82f6; }
.comp-kpi .label { font-size: 0.75rem; color: var(--dash-text-muted); margin-top: 6px; display: block; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }

/* Cards */
.comp-card { background: var(--dash-bg-secondary); border: 1px solid var(--dash-border); border-radius: 14px; padding: 20px; margin-bottom: 20px; }
.comp-card h3 { font-size: 0.88rem; font-weight: 700; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; color: var(--dash-text-primary); }
.comp-card h3 i { color: #c9a86c; font-size: 0.85rem; }
.comp-card h3 .chart-tag { margin-left: auto; font-size: 0.65rem; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: rgba(34,197,94,0.1); color: #22c55e; text-transform: uppercase; letter-spacing: 0.04em; }

/* Charts grid — 4 en una línea */
.charts-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.chart-wrap { position: relative; height: 280px; }

/* Tabla */
.comp-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.comp-table thead { position: sticky; top: 0; z-index: 2; }
.comp-table th { background: var(--dash-bg-tertiary, #111); padding: 10px 12px; text-align: left; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--dash-text-muted); border-bottom: 2px solid var(--dash-border); white-space: nowrap; }
.comp-table td { padding: 9px 12px; border-bottom: 1px solid var(--dash-border); vertical-align: middle; }
.comp-table tbody tr { transition: background 0.15s; }
.comp-table tr:hover td { background: rgba(201,168,108,0.05); }
.comp-table tr.row-ch td { background: rgba(34,197,94,0.03); }
.comp-table .empresa-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; white-space: nowrap; }
.comp-table .badge-ch { background: rgba(34,197,94,0.12); color: #22c55e; }
.comp-table .badge-comp { background: rgba(100,116,139,0.08); color: var(--dash-text-muted); }
.comp-table .precio-val { font-weight: 700; font-variant-numeric: tabular-nums; }
.comp-table .precio-ch { color: #22c55e; }
.comp-table .diff-badge { font-size: 0.7rem; padding: 3px 8px; border-radius: 5px; font-weight: 700; white-space: nowrap; }
.comp-table .diff-win { background: rgba(34,197,94,0.12); color: #22c55e; }
.comp-table .diff-lose { background: rgba(239,68,68,0.1); color: #ef4444; }
.table-scroll { overflow-x: auto; max-height: 520px; overflow-y: auto; border-radius: 12px; border: 1px solid var(--dash-border); }

/* Tabs para tablas */
.comp-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
.comp-tab { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--dash-border); background: transparent; color: var(--dash-text-muted); cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.2s; }
.comp-tab:hover { border-color: #c9a86c; color: var(--dash-text-primary); }
.comp-tab.active { background: rgba(201,168,108,0.12); border-color: #c9a86c; color: #c9a86c; }
.comp-tab-content { display: none; }
.comp-tab-content.active { display: block; }

/* Botón */
.btn-seed { background: #c9a86c; color: #0a0a0a; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
.btn-seed:hover { background: #b8956a; transform: translateY(-1px); }

/* Empty state */
.empty-state { text-align: center; padding: 80px 20px; color: var(--dash-text-muted); }
.empty-state i { font-size: 3rem; margin-bottom: 16px; color: #c9a86c; display: block; opacity: 0.6; }

/* Responsive */
@media (max-width: 1200px) {
    .charts-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
    .charts-grid { grid-template-columns: 1fr; }
    .comp-kpis { grid-template-columns: repeat(2, 1fr); }
}
</style>

<main class="main-content">
    <div class="page-header">
        <div class="page-header-content">
            <div>
                <h1><i class="fas fa-scale-balanced" style="color:#c9a86c;margin-right:8px;"></i>Comparativas de Precios</h1>
                <p style="font-size:0.85rem;color:var(--dash-text-muted);">Chile Home vs Competencia — Uso interno | Actualizado Marzo 2026</p>
            </div>
            <button class="btn-seed" onclick="seedData()" title="Cargar/actualizar datos del spreadsheet">
                <i class="fas fa-sync-alt"></i> Actualizar Datos
            </button>
        </div>
    </div>

    <div class="comp-container">

        <?php if ($totalRegistros == 0): ?>
        <div class="empty-state">
            <i class="fas fa-database"></i>
            <h3>Sin datos cargados</h3>
            <p>Presiona "Actualizar Datos" para cargar la información del cuadro comparativo.</p>
        </div>
        <?php else: ?>

        <!-- KPIs -->
        <div class="comp-kpis">
            <div class="comp-kpi">
                <span class="number blue"><?= count($empresas) ?></span>
                <span class="label">Empresas comparadas</span>
            </div>
            <div class="comp-kpi">
                <span class="number gold"><?= $totalRegistros ?></span>
                <span class="label">Modelos registrados</span>
            </div>
            <?php
            $chMin = $db->fetchOne("SELECT MIN(precio) as p FROM comparativas_precios WHERE empresa='Chile Home' AND precio > 0")['p'] ?? 0;
            $avgComp = $db->fetchOne("SELECT ROUND(AVG(precio)) as p FROM comparativas_precios WHERE empresa != 'Chile Home' AND precio > 0")['p'] ?? 0;
            $ventaja = $avgComp > 0 ? round((1 - $chMin / $avgComp) * 100) : 0;
            ?>
            <div class="comp-kpi">
                <span class="number green"><?= $ventaja ?>%</span>
                <span class="label">Más económico (vs promedio)</span>
            </div>
            <div class="comp-kpi">
                <span class="number green">$<?= number_format($chMin, 0, ',', '.') ?></span>
                <span class="label">Precio base Chile Home</span>
            </div>
        </div>

        <!-- GRÁFICOS — 4 en línea -->
        <div class="charts-grid">
            <div class="comp-card">
                <h3><i class="fas fa-home"></i> Kit ~36 m² <span class="chart-tag"><?= count($chartCompare36) ?> empresas</span></h3>
                <div class="chart-wrap"><canvas id="chart36"></canvas></div>
            </div>
            <div class="comp-card">
                <h3><i class="fas fa-home"></i> Kit ~54 m² <span class="chart-tag"><?= count($chartCompare54) ?> empresas</span></h3>
                <div class="chart-wrap"><canvas id="chart54"></canvas></div>
            </div>
            <div class="comp-card">
                <h3><i class="fas fa-home"></i> Kit ~72 m² <span class="chart-tag"><?= count($chartCompare72) ?> empresas</span></h3>
                <div class="chart-wrap"><canvas id="chart72"></canvas></div>
            </div>
            <div class="comp-card">
                <h3><i class="fas fa-dollar-sign"></i> Promedio $/m² <span class="chart-tag">ranking</span></h3>
                <div class="chart-wrap"><canvas id="chartM2"></canvas></div>
            </div>
        </div>

        <!-- TABS -->
        <div class="comp-tabs">
            <button class="comp-tab active" onclick="switchTab('detalle', this)"><i class="fas fa-table" style="margin-right:4px;"></i> Detalle Completo</button>
            <button class="comp-tab" onclick="switchTab('resumen', this)"><i class="fas fa-building" style="margin-right:4px;"></i> Resumen por Empresa</button>
        </div>

        <!-- TABLA DETALLE -->
        <div class="comp-tab-content active" id="tab-detalle">
        <div class="comp-card">
            <h3><i class="fas fa-table"></i> Todos los Modelos <span class="chart-tag"><?= count($allData) ?> registros</span></h3>
            <div class="table-scroll">
                <table class="comp-table">
                    <thead>
                        <tr>
                            <th>Empresa</th>
                            <th>Modelo</th>
                            <th>m²</th>
                            <th>Dorm.</th>
                            <th>Baños</th>
                            <th>Techo</th>
                            <th>Precio Kit</th>
                            <th>$/m²</th>
                            <th>vs Chile Home</th>
                            <th>Cobertura</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        // Chile Home precios por m2 para comparar
                        $chPrecios = [];
                        foreach ($allData as $r) {
                            if ($r['empresa'] === 'Chile Home') {
                                $chPrecios[(int)$r['metros']] = (int)$r['precio'];
                            }
                        }

                        foreach ($allData as $r):
                            $isCH = $r['empresa'] === 'Chile Home';
                            $precio = (int)$r['precio'];
                            $metros = (float)$r['metros'];
                            $precioM2 = $metros > 0 ? round($precio / $metros) : 0;

                            // Buscar precio CH del tamaño más cercano
                            $diff = '';
                            if (!$isCH && $precio > 0) {
                                $closest = null;
                                $closestDist = 999;
                                foreach ($chPrecios as $m => $p) {
                                    $dist = abs($m - $metros);
                                    if ($dist < $closestDist) {
                                        $closestDist = $dist;
                                        $closest = $p;
                                    }
                                }
                                if ($closest && $closestDist <= 5) {
                                    $pct = round(($precio - $closest) / $closest * 100);
                                    if ($pct > 0) {
                                        $diff = '<span class="diff-badge diff-win">CH -' . $pct . '%</span>';
                                    } else {
                                        $diff = '<span class="diff-badge diff-lose">+' . abs($pct) . '%</span>';
                                    }
                                }
                            }
                        ?>
                        <tr class="<?= $isCH ? 'row-ch' : '' ?>">
                            <td>
                                <span class="empresa-badge <?= $isCH ? 'badge-ch' : 'badge-comp' ?>">
                                    <?php if ($isCH): ?><i class="fas fa-star" style="font-size:0.6rem;"></i><?php endif; ?>
                                    <?= htmlspecialchars($r['empresa']) ?>
                                </span>
                            </td>
                            <td><?= htmlspecialchars($r['modelo']) ?></td>
                            <td><strong><?= $metros ?>m²</strong></td>
                            <td><?= $r['dormitorios'] ?></td>
                            <td><?= $r['banos'] ?></td>
                            <td style="font-size:0.75rem;"><?= htmlspecialchars($r['tipo_techo']) ?></td>
                            <td class="precio-val <?= $isCH ? 'precio-ch' : '' ?>">$<?= number_format($precio, 0, ',', '.') ?></td>
                            <td style="color:var(--dash-text-muted);font-size:0.75rem;">$<?= number_format($precioM2, 0, ',', '.') ?></td>
                            <td><?= $diff ?></td>
                            <td style="font-size:0.72rem;color:var(--dash-text-muted);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><?= htmlspecialchars($r['cobertura']) ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>

        </div><!-- /tab-detalle -->

        <!-- RESUMEN POR EMPRESA -->
        <div class="comp-tab-content" id="tab-resumen">
        <div class="comp-card">
            <h3><i class="fas fa-building"></i> Resumen por Empresa</h3>
            <div class="table-scroll">
                <table class="comp-table">
                    <thead>
                        <tr>
                            <th>Empresa</th>
                            <th>Modelos</th>
                            <th>Precio Mínimo</th>
                            <th>Precio Máximo</th>
                            <th>Prom. $/m²</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($empresas as $emp):
                            $avgM2 = 0;
                            foreach ($chartPrecioM2 as $pm2) {
                                if ($pm2['empresa'] === $emp['empresa']) { $avgM2 = $pm2['precio_m2']; break; }
                            }
                            $isCH = $emp['empresa'] === 'Chile Home';
                        ?>
                        <tr>
                            <td>
                                <span class="empresa-badge <?= $isCH ? 'badge-ch' : 'badge-comp' ?>">
                                    <?php if ($isCH): ?><i class="fas fa-star" style="font-size:0.65rem;"></i><?php endif; ?>
                                    <?= htmlspecialchars($emp['empresa']) ?>
                                </span>
                            </td>
                            <td><?= $emp['modelos'] ?></td>
                            <td class="precio-val <?= $isCH ? 'precio-ch' : '' ?>">
                                <?= $emp['precio_min'] ? '$' . number_format($emp['precio_min'], 0, ',', '.') : 'A consultar' ?>
                            </td>
                            <td class="precio-val">
                                <?= $emp['precio_max'] ? '$' . number_format($emp['precio_max'], 0, ',', '.') : 'A consultar' ?>
                            </td>
                            <td style="font-weight:600;">$<?= number_format($avgM2, 0, ',', '.') ?>/m²</td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
        </div><!-- /tab-resumen -->

        <?php endif; ?>

    </div>
</main>

<script>
// ─── TABS ───────────────────────────────────────────
function switchTab(tabId, btn) {
    document.querySelectorAll('.comp-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.comp-tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
}
</script>

<script>
// ─── SEED DATA ──────────────────────────────────────
function seedData() {
    if (!confirm('¿Actualizar datos de comparativas? Esto reemplaza la información actual.')) return;
    const btn = document.querySelector('.btn-seed');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    btn.disabled = true;

    fetch('', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=seed_data'
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) {
            location.reload();
        } else {
            alert('Error: ' + d.message);
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Datos';
            btn.disabled = false;
        }
    })
    .catch(() => {
        alert('Error de conexión');
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Datos';
        btn.disabled = false;
    });
}

// ─── CHARTS ─────────────────────────────────────────
<?php if ($totalRegistros > 0): ?>
document.addEventListener('DOMContentLoaded', function() {
    const isDark = document.body.classList.contains('dark-mode') || document.documentElement.getAttribute('data-theme') === 'dark';
    const tickColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    const tooltipBg = isDark ? '#1a1a1a' : '#0f172a';

    function fmt(v) { return '$' + new Intl.NumberFormat('es-CL').format(v); }

    function makeBarChart(canvasId, labels, values, colors) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 8,
                    borderSkipped: false,
                    maxBarThickness: 56
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        titleColor: '#94a3b8',
                        bodyColor: '#f1f5f9',
                        bodyFont: { size: 13, weight: '700' },
                        padding: 12,
                        cornerRadius: 10,
                        callbacks: { label: ctx => fmt(ctx.raw) }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        border: { display: false },
                        ticks: { color: tickColor, font: { size: 11 }, callback: v => fmt(v) },
                        grid: { color: gridColor, drawBorder: false }
                    },
                    y: {
                        border: { display: false },
                        grid: { display: false },
                        ticks: { color: tickColor, font: { size: 11, weight: '600' }, padding: 8 }
                    }
                }
            }
        });
    }

    // Colores: Chile Home = verde, competencia = gris
    function getColors(labels) {
        return labels.map(l => l === 'Chile Home' ? '#22c55e' : 'rgba(148,163,184,0.35)');
    }

    // Gráfico 36m²
    <?php if (!empty($chartCompare36)): ?>
    makeBarChart('chart36',
        <?= json_encode(array_column($chartCompare36, 'empresa')) ?>,
        <?= json_encode(array_map('intval', array_column($chartCompare36, 'precio'))) ?>,
        getColors(<?= json_encode(array_column($chartCompare36, 'empresa')) ?>)
    );
    <?php endif; ?>

    // Gráfico 54m²
    <?php if (!empty($chartCompare54)): ?>
    makeBarChart('chart54',
        <?= json_encode(array_column($chartCompare54, 'empresa')) ?>,
        <?= json_encode(array_map('intval', array_column($chartCompare54, 'precio'))) ?>,
        getColors(<?= json_encode(array_column($chartCompare54, 'empresa')) ?>)
    );
    <?php endif; ?>

    // Gráfico 72m²
    <?php if (!empty($chartCompare72)): ?>
    makeBarChart('chart72',
        <?= json_encode(array_column($chartCompare72, 'empresa')) ?>,
        <?= json_encode(array_map('intval', array_column($chartCompare72, 'precio'))) ?>,
        getColors(<?= json_encode(array_column($chartCompare72, 'empresa')) ?>)
    );
    <?php endif; ?>

    // Gráfico $/m²
    <?php if (!empty($chartPrecioM2)): ?>
    makeBarChart('chartM2',
        <?= json_encode(array_column($chartPrecioM2, 'empresa')) ?>,
        <?= json_encode(array_map('intval', array_column($chartPrecioM2, 'precio_m2'))) ?>,
        getColors(<?= json_encode(array_column($chartPrecioM2, 'empresa')) ?>)
    );
    <?php endif; ?>
});
<?php endif; ?>
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
