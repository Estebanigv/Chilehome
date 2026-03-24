/**
 * ChileHome - Cargador de Contenido Dinámico
 * Carga configuración y modelos desde el panel admin
 * Soporta: WhatsApp por modelo, ofertas, precios dinámicos
 */

const SiteConfig = {
    config: {},
    modelos: [],
    modelosMap: {},
    loaded: false,
    basePath: '',

    // Detectar ruta base
    getBasePath() {
        if (this.basePath) return this.basePath;
        const path = window.location.pathname;
        if (path.includes('/chilehome')) {
            this.basePath = '/chilehome';
        } else {
            this.basePath = '';
        }
        return this.basePath;
    },

    // Cargar toda la configuración
    async init() {
        try {
            await Promise.all([
                this.loadConfig(),
                this.loadModelos()
            ]);
            this.loaded = true;
            this.applyConfig();
            this.updateModelData();
            console.log('SiteConfig: Contenido cargado correctamente');
        } catch (error) {
            console.warn('SiteConfig: Usando valores por defecto', error);
        }
    },

    // Cargar configuración del sitio
    async loadConfig() {
        try {
            const response = await fetch(this.getBasePath() + '/admin/api/config.php');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.config = data.data;
                }
            }
        } catch (e) {
            console.warn('No se pudo cargar config:', e);
        }
    },

    // Cargar modelos
    async loadModelos() {
        try {
            const response = await fetch(this.getBasePath() + '/admin/api/modelos.php');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.modelos = data.data;
                    // Crear mapa por slug para acceso rápido
                    this.modelos.forEach(m => {
                        this.modelosMap[m.slug] = m;
                    });
                }
            }
        } catch (e) {
            console.warn('No se pudo cargar modelos:', e);
        }
    },

    // Obtener valor de configuración
    get(key, defaultValue = '') {
        return this.config[key] || defaultValue;
    },

    // Obtener modelo por slug
    getModelo(slug) {
        return this.modelosMap[slug] || null;
    },

    // Obtener modelos destacados
    getDestacados() {
        return this.modelos.filter(m => m.destacado);
    },

    // Obtener modelos en oferta
    getOfertas() {
        return this.modelos.filter(m => m.en_oferta);
    },

    // Aplicar configuración al DOM
    applyConfig() {
        // WhatsApp principal (para enlaces genéricos)
        const whatsapp = this.get('whatsapp_principal', '+56998654665').replace(/\D/g, '');
        const whatsappMsg = encodeURIComponent(this.get('texto_whatsapp', 'Hola, me interesa cotizar una casa prefabricada'));

        // Actualizar enlaces de WhatsApp genéricos (no de modelos específicos)
        document.querySelectorAll('a[href*="wa.me"]:not([data-model-whatsapp])').forEach(link => {
            const currentHref = link.getAttribute('href');
            if (currentHref.includes('text=')) {
                const msgMatch = currentHref.match(/text=([^&]*)/);
                const msg = msgMatch ? msgMatch[1] : whatsappMsg;
                link.href = `https://wa.me/${whatsapp}?text=${msg}`;
            } else {
                link.href = `https://wa.me/${whatsapp}?text=${whatsappMsg}`;
            }
        });

        // Actualizar teléfonos
        const telefono = this.get('telefono_oficina', '+56 9 9865 4665');
        const telClean = telefono.replace(/\D/g, '');
        document.querySelectorAll('a[href^="tel:"]').forEach(link => {
            link.href = `tel:+${telClean}`;
            if (link.textContent.match(/^\+?\d[\d\s-]+$/)) {
                link.textContent = telefono;
            }
        });

        // Actualizar precios de modelos en el DOM
        this.updateModelPrices();

        // Disparar evento personalizado
        document.dispatchEvent(new CustomEvent('siteConfigLoaded', { detail: this }));
    },

    // Actualizar precios de modelos mostrados
    updateModelPrices() {
        const modelCards = document.querySelectorAll('[onclick*="openModelModal"]');

        modelCards.forEach(card => {
            const onclick = card.getAttribute('onclick');
            const slugMatch = onclick.match(/openModelModal\(['"]([^'"]+)['"]\)/);
            if (slugMatch) {
                const slug = slugMatch[1];
                const modelo = this.getModelo(slug);
                if (modelo) {
                    const priceEl = card.querySelector('.model-price-simple, .catalog-price');
                    if (priceEl) {
                        // Si hay oferta, mostrar precio tachado y precio oferta
                        if (modelo.tiene_descuento && modelo.precio_original) {
                            priceEl.innerHTML = `
                                <span style="text-decoration:line-through;color:#999;font-size:0.85em;display:block">${modelo.precio_original}</span>
                                <span style="color:#DC2626;font-weight:700">${modelo.precio_mostrar}</span>
                            `;
                        } else {
                            priceEl.textContent = modelo.precio_mostrar || modelo.precio_texto;
                        }
                    }

                    // Agregar badge de oferta si aplica
                    if (modelo.en_oferta && !card.querySelector('.offer-badge')) {
                        const badge = document.createElement('div');
                        badge.className = 'offer-badge';
                        badge.innerHTML = '<i class="fas fa-tag"></i> Oferta';
                        badge.style.cssText = 'position:absolute;top:10px;left:10px;background:#DC2626;color:white;padding:4px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;z-index:10;';
                        const imageContainer = card.querySelector('.model-image, .catalog-card-image');
                        if (imageContainer) {
                            imageContainer.style.position = 'relative';
                            imageContainer.appendChild(badge);
                        }
                    }
                }
            }
        });
    },

    // Sincronizar con window.modelData para el modal
    updateModelData() {
        if (!window.modelData || this.modelos.length === 0) return;

        this.modelos.forEach(modelo => {
            if (window.modelData[modelo.slug]) {
                // Agregar/actualizar datos del API al modelData existente
                const md = window.modelData[modelo.slug];
                md.precio = modelo.precio;
                md.precio_texto = modelo.precio_texto;
                md.precio_mostrar = modelo.precio_mostrar;
                md.precio_original = modelo.precio_original;
                md.tiene_descuento = modelo.tiene_descuento;
                md.en_oferta = modelo.en_oferta;
                md.whatsapp_efectivo = modelo.whatsapp_efectivo;
                md.whatsapp_link = modelo.whatsapp_link;
                md.email_efectivo = modelo.email_efectivo;
                md.descripcion = modelo.descripcion;
                md.ficha_tecnica_pdf = modelo.ficha_tecnica_pdf;

                // Actualizar características si vienen del API
                if (modelo.caracteristicas_array && modelo.caracteristicas_array.length > 0) {
                    md.features = modelo.caracteristicas_array;
                }
            }
        });

        console.log('SiteConfig: modelData sincronizado con API');
    },

    // Obtener WhatsApp para un modelo específico
    getWhatsAppForModel(slug) {
        const modelo = this.getModelo(slug);
        if (modelo) {
            return modelo.whatsapp_link;
        }
        // Fallback al WhatsApp global
        const whatsapp = this.get('whatsapp_principal', '+56998654665').replace(/\D/g, '');
        return `https://wa.me/${whatsapp}`;
    },

    // Obtener datos del modelo para el modal (formato compatible)
    getModelDataForModal(slug) {
        const modelo = this.getModelo(slug);
        if (!modelo) return null;

        return {
            slug: modelo.slug,
            name: modelo.nombre,
            nombre: modelo.nombre,
            metros: modelo.metros,
            area: modelo.metros,
            bedrooms: modelo.dormitorios,
            bathrooms: modelo.banos,
            roofType: modelo.tipo_techo,
            style: modelo.tipo_techo,
            badge: modelo.linea === '2026' ? 'Línea 2026' : 'Línea Clásica',
            material: 'Paneles Pino',
            image: modelo.imagen_principal,
            imageDetail: modelo.imagen_detalle || modelo.imagen_principal,
            pdf: modelo.ficha_tecnica_pdf,
            hasPdf: !!modelo.ficha_tecnica_pdf,
            features: modelo.caracteristicas_array || [],
            descripcion: modelo.descripcion,
            // Precios
            precio: modelo.precio,
            precio_texto: modelo.precio_texto,
            precio_mostrar: modelo.precio_mostrar,
            precio_original: modelo.precio_original,
            tiene_descuento: modelo.tiene_descuento,
            en_oferta: modelo.en_oferta,
            // Contacto específico
            whatsapp_efectivo: modelo.whatsapp_efectivo,
            whatsapp_link: modelo.whatsapp_link,
            email_efectivo: modelo.email_efectivo,
            // Flags
            destacado: modelo.destacado,
            nuevo: modelo.nuevo
        };
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    SiteConfig.init();
});

// Exponer globalmente
window.SiteConfig = SiteConfig;
