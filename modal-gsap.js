/**
 * Modal GSAP Animations & Improvements
 * Cargar después de script.js
 */

// Cargar CSS de mejoras dinámicamente
(function loadModalCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'modal-improvements.css?v=' + Date.now();
    document.head.appendChild(link);
})();

// Sobrescribir funciones del modal con animaciones GSAP
(function initModalGSAP() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupModalGSAP);
    } else {
        setupModalGSAP();
    }

    function setupModalGSAP() {
        // Sobrescribir openModelModal
        const originalOpenModal = window.openModelModal;

        window.openModelModal = function(modelId) {
            const modal = document.getElementById('modelModal');
            const data = window.modelData ? window.modelData[modelId] : null;

            if (!modal || !data) return;

            // Guardar el ID del modelo actual
            window.currentModelId = modelId;

            // Populate modal content
            const modalImage = document.getElementById('modalImage');
            if (modalImage) {
                modalImage.src = data.imageDetail || data.image;
                modalImage.alt = data.name;
            }

            const elements = {
                'modalBadge': data.badge,
                'modalTitle': data.name,
                'modalStyle': data.style,
                'modalBedrooms': data.bedrooms,
                'modalBathrooms': data.bathrooms,
                'modalArea': data.area,
                'modalMaterial': data.material,
                'modalRoofType': data.roofType || data.style
            };

            Object.keys(elements).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = elements[id];
            });

            // Features list
            const featuresEl = document.getElementById('modalFeatures');
            if (featuresEl && data.features) {
                featuresEl.innerHTML = data.features.map(feature =>
                    `<li><i class="fas fa-check"></i><span>${feature}</span></li>`
                ).join('');
            }

            // WhatsApp link - usar número específico del modelo si existe
            const whatsappEl = document.getElementById('modalWhatsApp');
            if (whatsappEl) {
                // Prioridad: whatsapp_link del modelo > whatsapp_efectivo > global
                if (data.whatsapp_link) {
                    whatsappEl.href = data.whatsapp_link;
                    whatsappEl.setAttribute('data-model-whatsapp', 'true');
                } else {
                    const modelName = encodeURIComponent(`${data.name} ${data.badge}`);
                    const whatsappNum = data.whatsapp_efectivo
                        ? data.whatsapp_efectivo.replace(/\D/g, '')
                        : (window.SiteConfig && window.SiteConfig.get
                            ? window.SiteConfig.get('whatsapp_principal', '+56998654665').replace(/\D/g, '')
                            : '56998654665');
                    whatsappEl.href = `https://wa.me/${whatsappNum}?text=Hola%2C%20me%20interesa%20el%20modelo%20${modelName}`;
                    whatsappEl.setAttribute('data-model-whatsapp', 'true');
                }
            }

            // Precio del modelo - mostrar oferta si aplica
            const priceEl = document.getElementById('modalPrice');
            if (priceEl) {
                if (data.tiene_descuento && data.precio_original) {
                    // Mostrar precio tachado y precio de oferta
                    priceEl.innerHTML = `
                        <span style="text-decoration:line-through;color:#999;font-size:0.75em;margin-right:8px">${data.precio_original}</span>
                        <span style="color:#DC2626">${data.precio_mostrar}</span>
                    `;
                    priceEl.style.display = 'block';
                } else if (data.precio_mostrar || data.precio_texto) {
                    priceEl.textContent = data.precio_mostrar || data.precio_texto;
                    priceEl.style.display = 'block';
                } else {
                    priceEl.style.display = 'none';
                }
            }

            // PDF button
            const pdfBtn = document.getElementById('modalPdfBtn');
            if (pdfBtn) {
                pdfBtn.style.display = data.hasPdf === false ? 'none' : 'flex';
            }

            // Show modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // GSAP Animation
            if (typeof gsap !== 'undefined') {
                animateModalOpen(modal);
            }
        };

        // Sobrescribir closeModelModal
        window.closeModelModal = function() {
            const modal = document.getElementById('modelModal');
            if (!modal) return;

            if (typeof gsap !== 'undefined') {
                animateModalClose(modal);
            } else {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                if (typeof showModalView === 'function') {
                    setTimeout(() => showModalView('details'), 300);
                }
            }
        };
    }

    function animateModalOpen(modal) {
        const overlay = modal.querySelector('.model-modal-overlay');
        const content = modal.querySelector('.model-modal-content');
        const imageSection = modal.querySelector('.modal-image-section');
        const infoSection = modal.querySelector('.modal-info-section');
        const closeBtn = modal.querySelector('.modal-close');
        const badge = modal.querySelector('.model-badge');
        const title = modal.querySelector('.model-name');
        const specs = modal.querySelectorAll('.spec-item');
        const features = modal.querySelectorAll('.modal-features-list li');
        const buttons = modal.querySelectorAll('.modal-actions .btn');

        // Kill any existing animations
        gsap.killTweensOf([overlay, content, imageSection, infoSection]);

        // Timeline
        const tl = gsap.timeline();

        // Reset inicial
        gsap.set(overlay, { opacity: 0 });
        gsap.set(content, { scale: 0.85, opacity: 0, rotateX: 10 });
        if (imageSection) gsap.set(imageSection, { clipPath: 'inset(0 100% 0 0)', opacity: 0 });
        if (infoSection) gsap.set(infoSection, { x: 40, opacity: 0 });
        if (closeBtn) gsap.set(closeBtn, { scale: 0, rotation: -180 });
        if (badge) gsap.set(badge, { y: -20, opacity: 0 });
        if (title) gsap.set(title, { y: 20, opacity: 0 });
        gsap.set(specs, { y: 15, opacity: 0 });
        gsap.set(features, { x: -20, opacity: 0 });
        gsap.set(buttons, { y: 20, opacity: 0 });

        // Animación secuencial
        tl.to(overlay, {
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out'
        })
        .to(content, {
            scale: 1,
            opacity: 1,
            rotateX: 0,
            duration: 0.6,
            ease: 'back.out(1.4)'
        }, '-=0.2')
        .to(imageSection, {
            clipPath: 'inset(0 0% 0 0)',
            opacity: 1,
            duration: 0.5,
            ease: 'power3.out'
        }, '-=0.4')
        .to(closeBtn, {
            scale: 1,
            rotation: 0,
            duration: 0.4,
            ease: 'back.out(2)'
        }, '-=0.3')
        .to(infoSection, {
            x: 0,
            opacity: 1,
            duration: 0.4,
            ease: 'power3.out'
        }, '-=0.3')
        .to(badge, {
            y: 0,
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
        }, '-=0.2')
        .to(title, {
            y: 0,
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
        }, '-=0.2')
        .to(specs, {
            y: 0,
            opacity: 1,
            duration: 0.3,
            stagger: 0.05,
            ease: 'power2.out'
        }, '-=0.2')
        .to(features, {
            x: 0,
            opacity: 1,
            duration: 0.25,
            stagger: 0.03,
            ease: 'power2.out'
        }, '-=0.15')
        .to(buttons, {
            y: 0,
            opacity: 1,
            duration: 0.3,
            stagger: 0.08,
            ease: 'back.out(1.5)'
        }, '-=0.1');
    }

    function animateModalClose(modal) {
        const overlay = modal.querySelector('.model-modal-overlay');
        const content = modal.querySelector('.model-modal-content');

        const tl = gsap.timeline({
            onComplete: () => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                if (typeof showModalView === 'function') {
                    showModalView('details');
                }
            }
        });

        tl.to(content, {
            scale: 0.9,
            opacity: 0,
            y: 40,
            rotateX: -5,
            duration: 0.35,
            ease: 'power3.in'
        })
        .to(overlay, {
            opacity: 0,
            duration: 0.25,
            ease: 'power2.in'
        }, '-=0.15');
    }
})();

// Mejorar hover en cards del catálogo
(function initCatalogCardHover() {
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof gsap === 'undefined') return;

        const cards = document.querySelectorAll('.catalog-card');

        cards.forEach(card => {
            const image = card.querySelector('.catalog-card-image img');
            const overlay = card.querySelector('.catalog-card-overlay');

            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    y: -12,
                    scale: 1.02,
                    duration: 0.4,
                    ease: 'power2.out'
                });

                if (image) {
                    gsap.to(image, {
                        scale: 1.1,
                        duration: 0.6,
                        ease: 'power2.out'
                    });
                }

                if (overlay) {
                    gsap.to(overlay, {
                        opacity: 1,
                        duration: 0.3
                    });
                }
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    y: 0,
                    scale: 1,
                    duration: 0.4,
                    ease: 'power2.out'
                });

                if (image) {
                    gsap.to(image, {
                        scale: 1,
                        duration: 0.4,
                        ease: 'power2.out'
                    });
                }

                if (overlay) {
                    gsap.to(overlay, {
                        opacity: 0,
                        duration: 0.3
                    });
                }
            });
        });
    });
})();
