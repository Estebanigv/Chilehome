/**
 * Chile Home — Premium Dark Design
 * JavaScript Interactions
 */

'use strict';

// Production mode - disable console.log
const DEBUG_MODE = false;
if (!DEBUG_MODE) {
    console.log = function() {};
    console.debug = function() {};
}

// =============================================
// reCAPTCHA v3 Configuration - Anti-spam
// =============================================
const RECAPTCHA_SITE_KEY = 'TU_SITE_KEY_AQUI'; // Reemplazar con tu Site Key de Google reCAPTCHA

// Detectar base path dinámicamente (funciona en localhost/chilehome/ y en producción /)
const API_BASE_PATH = (() => {
    const path = window.location.pathname;
    const base = path.includes('/chilehome') ? '/chilehome' : '';
    return base + '/admin/api';
})();

// Función para obtener token de reCAPTCHA v3
async function getRecaptchaToken(action = 'submit') {
    return new Promise((resolve) => {
        // Si reCAPTCHA no está configurado, continuar sin él
        if (RECAPTCHA_SITE_KEY === 'TU_SITE_KEY_AQUI' || !RECAPTCHA_SITE_KEY) {
            console.warn('reCAPTCHA no configurado, continuando sin token');
            resolve(null);
            return;
        }

        if (typeof grecaptcha === 'undefined') {
            console.warn('reCAPTCHA no cargado, continuando sin token');
            resolve(null);
            return;
        }

        // Timeout de 5 segundos para no quedarse colgado
        const timeout = setTimeout(() => {
            console.warn('Timeout esperando reCAPTCHA');
            resolve(null);
        }, 5000);

        grecaptcha.ready(function() {
            grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: action })
                .then(function(token) {
                    clearTimeout(timeout);
                    resolve(token);
                })
                .catch(function(error) {
                    clearTimeout(timeout);
                    console.warn('Error obteniendo token reCAPTCHA:', error);
                    resolve(null);
                });
        });
    });
}

// =============================================
// UTM Parameters Capture - CRM Tracking
// =============================================
function getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        utm_source: urlParams.get('utm_source') || '',
        utm_medium: urlParams.get('utm_medium') || '',
        utm_campaign: urlParams.get('utm_campaign') || '',
        utm_term: urlParams.get('utm_term') || '',
        utm_content: urlParams.get('utm_content') || ''
    };
}

// Guardar UTM params en sessionStorage al cargar la página
(function() {
    const utmParams = getUTMParams();
    if (utmParams.utm_source) {
        sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
    }
})();

// Obtener UTM params guardados (del sessionStorage o de la URL actual)
function getSavedUTMParams() {
    const saved = sessionStorage.getItem('utm_params');
    if (saved) {
        return JSON.parse(saved);
    }
    return getUTMParams();
}

// =============================================
// ANALYTICS TRACKING - Google Tag Manager Events
// Eventos para Meta Pixel, TikTok Pixel, Google Ads
// =============================================
window.dataLayer = window.dataLayer || [];

// Helper function para enviar eventos al dataLayer
function trackEvent(eventName, eventParams = {}) {
    const utmParams = getSavedUTMParams();
    window.dataLayer.push({
        event: eventName,
        ...eventParams,
        ...utmParams,
        page_url: window.location.href,
        timestamp: new Date().toISOString()
    });
    if (DEBUG_MODE) console.log('Track Event:', eventName, eventParams);
}

// Evento: Ver modelo (cuando se abre un modal de casa)
function trackViewItem(modelId, modelName, modelArea, modelPrice = null) {
    trackEvent('view_item', {
        item_id: modelId,
        item_name: modelName,
        item_category: 'Casa Prefabricada',
        item_variant: modelArea + 'm²',
        price: modelPrice,
        currency: 'CLP'
    });
}

// Evento: Lead por WhatsApp
function trackWhatsAppLead(source, modelName = null) {
    trackEvent('lead_whatsapp', {
        lead_type: 'whatsapp',
        lead_source: source,
        model_name: modelName,
        value: 1
    });
}

// Evento: Lead por teléfono
function trackPhoneLead(source) {
    trackEvent('lead_phone', {
        lead_type: 'phone',
        lead_source: source,
        value: 1
    });
}

// Evento: Envío de formulario (Lead)
function trackFormSubmit(formName, modelName = null, formData = {}) {
    trackEvent('generate_lead', {
        form_name: formName,
        model_name: modelName,
        lead_type: 'form',
        ...formData,
        value: 1
    });
}

// Evento: Solicitud de PDF/Ficha Técnica
function trackPDFRequest(modelId, modelName) {
    trackEvent('download_pdf', {
        item_id: modelId,
        item_name: modelName,
        content_type: 'ficha_tecnica',
        value: 1
    });
}

// Evento: Inicio de formulario (para medir abandono)
function trackFormStart(formName) {
    trackEvent('form_start', {
        form_name: formName
    });
}

// Evento: Scroll a sección importante
function trackSectionView(sectionName) {
    trackEvent('section_view', {
        section_name: sectionName
    });
}

// =============================================
// WHATSAPP ROTATION - Carga dinámica del número
// =============================================
let currentWhatsApp = null;
let currentEjecutivoId = null;
let whatsappPorEtiqueta = {}; // Cache de números por etiqueta

// Cargar WhatsApp activo desde la API (global y por ubicación)
async function loadActiveWhatsApp() {
    try {
        const apiBase = API_BASE_PATH;

        // Cargar TODAS las configuraciones (global + excepciones por ubicación)
        const response = await fetch(`${apiBase}/whatsapp.php?action=get_all&_t=${Date.now()}`);
        const data = await response.json();

        if (data.success) {
            // Guardar número global
            currentWhatsApp = data.global?.whatsapp || '56998654665';
            currentEjecutivoId = data.global?.id || null;

            // Guardar excepciones por ubicación en cache
            if (data.ubicaciones) {
                Object.keys(data.ubicaciones).forEach(ub => {
                    whatsappPorEtiqueta[ub] = {
                        numero: data.ubicaciones[ub].whatsapp,
                        ejecutivo_id: data.ubicaciones[ub].id,
                        source: 'ubicacion_' + ub
                    };
                });
            }

            if (DEBUG_MODE) {
                console.log('WhatsApp global:', currentWhatsApp);
                console.log('Excepciones:', whatsappPorEtiqueta);
            }
        }

        // Actualizar todos los enlaces
        await updateAllWhatsAppLinks();

    } catch (error) {
        if (DEBUG_MODE) console.error('Error cargando WhatsApp:', error);
        currentWhatsApp = '56998654665';
        updateWhatsAppLinks(currentWhatsApp);
    }
}

// Obtener número de WhatsApp para una ubicación específica
async function getWhatsAppForOrigen(origen) {
    // Si ya está en cache (cargado por loadActiveWhatsApp), devolver
    if (whatsappPorEtiqueta[origen]) {
        if (DEBUG_MODE) console.log(`WhatsApp para ${origen}:`, whatsappPorEtiqueta[origen].numero);
        return whatsappPorEtiqueta[origen];
    }

    // Fallback al número global
    return { numero: currentWhatsApp || '56998654665', ejecutivo_id: currentEjecutivoId, source: 'global' };
}

// Determinar etiqueta según ubicación del enlace
function getOrigenFromLink(link) {
    if (link.closest('.whatsapp-wrapper') || link.classList.contains('whatsapp-btn')) return 'flotante';
    if (link.closest('.modal')) return 'modal';
    if (link.closest('.quote-section') || link.closest('.quote-modal') || link.id === 'btnQuoteWhatsApp') return 'cotizador';
    if (link.closest('footer')) return 'footer';
    if (link.closest('.hero')) return 'hero';
    if (link.closest('.contact-section')) return 'contacto';
    return 'general';
}

// Actualizar todos los enlaces de WhatsApp según su etiqueta
async function updateAllWhatsAppLinks() {
    const links = document.querySelectorAll('a[href*="wa.me"]');

    for (const link of links) {
        const origen = getOrigenFromLink(link);
        const waData = await getWhatsAppForOrigen(origen);
        const numeroLimpio = waData.numero.replace(/\D/g, '');

        // Actualizar href manteniendo el mensaje
        const currentHref = link.href;
        const textMatch = currentHref.match(/[?&]text=([^&]*)/);
        const mensaje = textMatch ? textMatch[1] : '';
        link.href = `https://wa.me/${numeroLimpio}${mensaje ? '?text=' + mensaje : ''}`;

        // Guardar datos en el elemento para tracking
        link.dataset.whatsappOrigen = origen;
        link.dataset.whatsappEjecutivoId = waData.ejecutivo_id || '';
    }
}

// Actualizar todos los enlaces de WhatsApp en la página
function updateWhatsAppLinks(numero) {
    // Limpiar número (solo dígitos)
    const numeroLimpio = numero.replace(/\D/g, '');

    // Actualizar enlaces con href que contienen wa.me
    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        const currentHref = link.href;
        // Extraer el mensaje si existe
        const textMatch = currentHref.match(/text=([^&]*)/);
        const mensaje = textMatch ? textMatch[1] : '';

        // Reconstruir el enlace con el nuevo número
        link.href = `https://wa.me/${numeroLimpio}${mensaje ? '?text=' + mensaje : ''}`;
    });

    // Actualizar el botón flotante de WhatsApp
    const whatsappBtn = document.querySelector('.whatsapp-btn');
    if (whatsappBtn) {
        const currentHref = whatsappBtn.href;
        const textMatch = currentHref.match(/text=([^&]*)/);
        const mensaje = textMatch ? textMatch[1] : '';
        whatsappBtn.href = `https://wa.me/${numeroLimpio}${mensaje ? '?text=' + mensaje : ''}`;
    }
}

// Registrar clic en WhatsApp para estadísticas
function registerWhatsAppClick(origen, modeloSlug = null) {
    try {
        const apiBase = API_BASE_PATH;
        const utmParams = getSavedUTMParams();
        // Usar ejecutivo de la ubicación si existe, sino el global
        const ejecutivoId = (whatsappPorEtiqueta[origen] && whatsappPorEtiqueta[origen].ejecutivo_id)
            ? whatsappPorEtiqueta[origen].ejecutivo_id
            : currentEjecutivoId;
        const payload = JSON.stringify({
            ejecutivo_id: ejecutivoId,
            modelo: modeloSlug,
            origen: origen,
            utm_source: utmParams.utm_source,
            utm_campaign: utmParams.utm_campaign
        });

        // Usar sendBeacon para garantizar envío antes de navegación
        const url = `${apiBase}/whatsapp.php?action=click`;
        if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(url, blob);
        } else {
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            }).catch(() => {});
        }
    } catch (error) {
        if (DEBUG_MODE) console.error('Error registrando clic:', error);
    }
}

// Inicializar tracking de clics en WhatsApp y teléfono
function initAnalyticsTracking() {
    // Track clics en enlaces de WhatsApp
    document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]').forEach(link => {
        link.addEventListener('click', function() {
            const modelName = this.href.includes('modelo') ?
                decodeURIComponent(this.href.split('modelo%20')[1]?.split('&')[0] || '') : null;
            const source = this.closest('.whatsapp-wrapper') ? 'flotante' :
                          this.closest('.modal') ? 'modal' :
                          this.closest('.hero') ? 'hero' :
                          this.closest('.quote-section') ? 'cotizador' :
                          this.closest('footer') ? 'footer' :
                          this.closest('.cta-section, .cta') ? 'cta' :
                          this.closest('.contact, .contacto') ? 'contacto' : 'general';

            // Track en GTM/Analytics
            trackWhatsAppLead(source, modelName);

            // Registrar clic en BD para estadísticas de rotación
            registerWhatsAppClick(source, currentModelId || null);
        });
    });

    // Track clics en enlaces de teléfono
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
        link.addEventListener('click', function() {
            const source = this.closest('footer') ? 'footer' :
                          this.closest('.contact') ? 'contacto' : 'general';
            trackPhoneLead(source);
        });
    });

    // Track inicio de formularios
    document.querySelectorAll('form').forEach(form => {
        let formStarted = false;
        form.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('focus', function() {
                if (!formStarted) {
                    formStarted = true;
                    const formName = form.id || form.className || 'unknown_form';
                    trackFormStart(formName);
                }
            }, { once: true });
        });
    });

    // Track scroll a secciones importantes
    const observerOptions = { threshold: 0.5 };
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                if (sectionId) {
                    trackSectionView(sectionId);
                    sectionObserver.unobserve(entry.target);
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('section[id]').forEach(section => {
        sectionObserver.observe(section);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initCursor();
    initNavigation();
    initScrollEffects();
    initFormHandling();
    initModelsCarousel();
    initHeroVideo();
    initWhatsAppScroll();
    initFeaturedSlideshow();
    initShowcaseCarousel(); // Carrusel Línea 2026
    initAnalyticsTracking(); // GTM Analytics Events
    loadActiveWhatsApp(); // Cargar WhatsApp según rotación
    // initAssistant(); // ASISTENTE IA DESACTIVADO TEMPORALMENTE
});

// Loader with percentage counter
function initLoader() {
    const loader = document.getElementById('loader');
    const percentageEl = document.getElementById('loaderPercentage');
    const progressBar = document.getElementById('loaderProgressBar');

    if (!loader || !percentageEl) return;

    let progress = 0;
    const duration = 1500; // Total duration in ms
    const interval = 20; // Update every 20ms
    const increment = 100 / (duration / interval);

    const counter = setInterval(() => {
        progress += increment + (Math.random() * 0.5); // Slight randomness

        if (progress >= 100) {
            progress = 100;
            clearInterval(counter);

            // Hide loader after reaching 100%
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 300);
        }

        const displayProgress = Math.min(Math.floor(progress), 100);
        percentageEl.textContent = displayProgress;

        if (progressBar) {
            progressBar.style.width = displayProgress + '%';
        }
    }, interval);

    // Fallback: ensure loader hides even if something goes wrong
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (!loader.classList.contains('hidden')) {
                percentageEl.textContent = '100';
                if (progressBar) progressBar.style.width = '100%';
                setTimeout(() => loader.classList.add('hidden'), 300);
            }
        }, 2000);
    });
}

// Custom Cursor
function initCursor() {
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');

    if (!cursor || !follower) return;

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animate() {
        // Cursor
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';

        // Follower
        followerX += (mouseX - followerX) * 0.08;
        followerY += (mouseY - followerY) * 0.08;
        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';

        requestAnimationFrame(animate);
    }

    animate();

    // Hover effects
    const hoverElements = document.querySelectorAll('a, button, .project-card');

    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(2)';
            follower.style.transform = 'translate(-50%, -50%) scale(1.5)';
            follower.style.opacity = '0.3';
        });

        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            follower.style.transform = 'translate(-50%, -50%) scale(1)';
            follower.style.opacity = '0.5';
        });
    });
}

// Navigation
function initNavigation() {
    const header = document.getElementById('header');
    const nav = document.getElementById('nav');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect - show on scroll, hide when idle
    let hideTimeout;
    const HIDE_DELAY = 2000; // Hide after 2 seconds of no scrolling

    function showHeader() {
        header.classList.remove('header-hidden');
        clearTimeout(hideTimeout);

        // Only hide if not at the top of the page
        const currentScroll = window.pageYOffset;
        if (currentScroll > 100) {
            hideTimeout = setTimeout(() => {
                header.classList.add('header-hidden');
            }, HIDE_DELAY);
        }
    }

    function handleScroll() {
        const currentScroll = window.pageYOffset;

        // Add scrolled class when past 100px (for visual styling)
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
            header.classList.remove('header-hidden');
        }

        // Show header on any scroll activity
        showHeader();
    }

    window.addEventListener('scroll', handleScroll);

    // Also show header on mouse move near top of screen
    document.addEventListener('mousemove', (e) => {
        if (e.clientY < 100) {
            showHeader();
        }
    });

    // Mobile menu
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            menuToggle.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        });
    }

    // Close on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            menuToggle.classList.remove('active');
            document.body.style.overflow = '';

            // Update active
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Active section on scroll
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 200;
            const sectionId = section.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// Scroll Effects
function initScrollEffects() {
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                const headerHeight = 80;
                const targetPosition = target.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Reveal on scroll - Only for elements NOT handled by GSAP
    // (.feature and .step are handled by GSAP ScrollTrigger)
    const revealElements = document.querySelectorAll(
        '.project-card, .section-header'
    );

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        revealObserver.observe(el);
    });

    // Parallax hero image
    const heroImg = document.querySelector('.hero-img');

    if (heroImg) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            heroImg.style.transform = `translateY(${scrolled * 0.3}px)`;
        });
    }
}

// Form Handling - SMTP Backend
const SMTP_ENDPOINT = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'send-email.php'
    : 'https://chilehome.cl/send-email.php';

const PDF_ENDPOINT = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'send-pdf.php'
    : 'https://chilehome.cl/send-pdf.php';

function initFormHandling() {
    // Formulario de Contacto
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                form_type: 'contacto',
                nombre: contactForm.querySelector('#nombre').value.trim(),
                email: contactForm.querySelector('#email').value.trim(),
                telefono: contactForm.querySelector('#telefono').value.trim(),
                modelo: contactForm.querySelector('#modelo').value,
                ubicacion: contactForm.querySelector('#ubicacion').value.trim(),
                coordenadas: contactForm.querySelector('#coordenadasContact').value.trim(),
                mensaje: contactForm.querySelector('#mensaje').value.trim()
            };

            if (!formData.nombre || !formData.telefono) {
                showNotification('Por favor, completa nombre y teléfono', 'error');
                return;
            }

            await sendFormData(contactForm, formData);
        });
    }

    // Formulario de Brochure/Cotizacion
    const brochureForm = document.getElementById('brochureForm');
    if (brochureForm) {
        brochureForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const modeloSelect = brochureForm.querySelector('select[name="modelo"]');
            const formData = {
                form_type: 'brochure',
                nombre: brochureForm.querySelector('input[name="nombre"]').value.trim(),
                email: brochureForm.querySelector('input[name="email"]').value.trim(),
                telefono: brochureForm.querySelector('input[name="telefono"]').value.trim(),
                modelo: modeloSelect ? modeloSelect.value : '',
                ubicacion: brochureForm.querySelector('#ubicacionBrochure').value.trim(),
                coordenadas: brochureForm.querySelector('#coordenadasBrochure').value.trim()
            };

            if (!formData.nombre || !formData.telefono) {
                showNotification('Por favor, completa nombre y teléfono', 'error');
                return;
            }

            await sendFormData(brochureForm, formData, 'Solicitud enviada. Te contactaremos pronto con tu cotizacion.');
        });
    }
}

// Funcion generica para enviar formularios via SMTP
async function sendFormData(form, data, successMessage = 'Mensaje enviado. Te contactaremos pronto.') {
    const submitBtn = form.querySelector('button[type="submit"], .btn-submit');
    const originalHTML = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Verificando...</span>';
    }

    try {
        // Obtener token de reCAPTCHA v3
        const recaptchaToken = await getRecaptchaToken(data.form_type || 'contact');

        // Agregar token a los datos
        if (recaptchaToken) {
            data.recaptcha_token = recaptchaToken;
        }

        // Agregar parámetros UTM para tracking en CRM
        const utmParams = getSavedUTMParams();
        data.utm_source = utmParams.utm_source;
        data.utm_campaign = utmParams.utm_campaign;

        if (submitBtn) {
            submitBtn.innerHTML = '<span>Enviando...</span>';
        }

        const response = await fetch(SMTP_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showNotification(successMessage, 'success');
            form.reset();

            // ANALYTICS: Track form submission
            const formName = form.id || data.form_type || 'contact_form';
            const modelName = data.modelo || data.model || null;
            trackFormSubmit(formName, modelName, {
                form_type: data.form_type,
                has_email: !!data.email,
                has_phone: !!data.telefono
            });

            // Redirigir a pagina de agradecimiento despues de 1.5 segundos
            setTimeout(() => {
                window.location.href = 'gracias.html';
            }, 1500);
        } else {
            showNotification(result.message || 'Error al enviar el mensaje', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexion. Intenta nuevamente.', 'error');
    }

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showNotification(message, type) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Icono según tipo
    const icons = {
        success: '<i class="fas fa-check-circle" style="margin-right: 10px;"></i>',
        error: '<i class="fas fa-exclamation-circle" style="margin-right: 10px;"></i>',
        warning: '<i class="fas fa-exclamation-triangle" style="margin-right: 10px;"></i>'
    };

    notification.innerHTML = (icons[type] || '') + message;

    // Colores según tipo
    const colors = {
        success: { bg: '#c9a86c', color: '#0a0a0a' },
        error: { bg: '#ef4444', color: '#fff' },
        warning: { bg: '#f59e0b', color: '#000' }
    };
    const style = colors[type] || colors.error;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 40px;
        padding: 1.25rem 2rem;
        background: ${style.bg};
        color: ${style.color};
        font-size: 0.9rem;
        letter-spacing: 0.05em;
        z-index: 9999;
        animation: slideIn 0.4s ease;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.4s ease forwards';
        setTimeout(() => notification.remove(), 400);
    }, 4000);
}

// Models Carousel
function initModelsCarousel() {
    const carousel = document.querySelector('.models-carousel');
    const progressBar = document.querySelector('.progress-bar');

    if (!carousel || !progressBar) return;

    carousel.addEventListener('scroll', () => {
        const scrollWidth = carousel.scrollWidth - carousel.clientWidth;
        const scrollLeft = carousel.scrollLeft;
        const progress = (scrollLeft / scrollWidth) * 100;
        progressBar.style.width = `${Math.max(20, progress)}%`;
    });
}

// Video Ping-Pong Effect (for hero video only)
function initHeroVideo() {
    initPingPongVideo('heroVideo');

    // About video just loops normally
    const aboutVideo = document.getElementById('aboutVideo');
    if (aboutVideo) {
        aboutVideo.loop = true;
    }
}

function initPingPongVideo(videoId) {
    const video = document.getElementById(videoId);
    if (!video) return;

    let isReversing = false;
    let animationId = null;
    const frameTime = 1 / 30; // 30fps

    video.addEventListener('loadedmetadata', () => {
        video.playbackRate = 1;
    });

    video.addEventListener('ended', () => {
        isReversing = true;
        reversePlay();
    });

    function reversePlay() {
        if (!isReversing) return;

        video.currentTime -= frameTime;

        if (video.currentTime <= 0.1) {
            video.currentTime = 0;
            isReversing = false;
            video.play();
            cancelAnimationFrame(animationId);
            return;
        }

        animationId = requestAnimationFrame(reversePlay);
    }
}

// WhatsApp Scroll Animation
function initWhatsAppScroll() {
    const whatsappWrapper = document.getElementById('whatsappWrapper');
    if (!whatsappWrapper) return;

    let scrollTimeout;
    let isScrolling = false;

    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            whatsappWrapper.classList.add('scrolling');
            isScrolling = true;
        }

        clearTimeout(scrollTimeout);

        scrollTimeout = setTimeout(() => {
            whatsappWrapper.classList.remove('scrolling');
            isScrolling = false;
        }, 150);
    });
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(40px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(40px); }
    }
`;
document.head.appendChild(style);

console.log('%cChile Home', 'color: #c9a86c; font-size: 20px; font-weight: 300;');
console.log('%cPremium Architecture', 'color: #737373; font-size: 12px;');

// Model Modal Functionality
const modelData = {
    '36-1a': {
        name: '36 m2',
        style: 'Un Agua',
        roofType: '1 Agua',
        badge: 'Linea 2026',
        hasPdf: false,
        image: 'Imagenes/Nuevos Modelos/36m2 1A.png',
        bedrooms: '1',
        bathrooms: '1',
        area: '36',
        material: 'Paneles Pino',
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino',
            'Tabiqueria 2x3',
            'Cubiertas de zinc',
            'Cerchas de pino tradicionales'
        ]
    },
    'terra-36': {
        name: 'Terra 36 m2',
        style: 'Dos Aguas',
        roofType: '2 Aguas',
        badge: 'Linea 2026',
        hasPdf: false,
        image: 'Imagenes/Nuevos Modelos/36m2 2A.png',
        bedrooms: '1',
        bathrooms: '1',
        area: '36',
        material: 'Paneles Pino',
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino',
            'Tabiqueria 2x3',
            'Cubiertas de zinc',
            'Cerchas de pino tradicionales'
        ]
    },
    '54-1a': {
        name: '54 m2',
        style: 'Un Agua',
        roofType: '1 Agua',
        badge: 'Linea 2026',
        hasPdf: false,
        image: 'Imagenes/Nuevos Modelos/54m2 1A.png',
        bedrooms: '2',
        bathrooms: '1',
        area: '54',
        material: 'Paneles Pino',
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino',
            'Tabiqueria 2x3',
            'Cubiertas de zinc',
            'Cerchas de pino tradicionales'
        ]
    },
    'clasica-36': {
        name: '36 m2 | 2 Aguas',
        style: 'Compacto',
        roofType: '2 Aguas',
        badge: 'Linea Clasica',
        image: 'Imagenes/Modelos/36m2 2A/36 2A/36m2 2A H.png',
        bedrooms: '2',
        bathrooms: '1',
        area: '36',
        material: 'Paneles Pino',
        pdf: 'Imagenes/Fichas Tecnicas/36 2a-20260104T102238Z-3-001/36 2a/Ficha tecnica - 36mt 2a Kit basico.pdf',
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino (natural en bruto)',
            'Tabiqueria 2x3',
            'Cubiertas de zinc',
            'Caballetes de zinc de 2 mt',
            'Cerchas de pino tradicionales'
        ]
    },
    'clasica-54': {
        name: '54 m2 | 2 Aguas',
        style: 'Tradicional',
        roofType: '2 Aguas',
        badge: 'Linea Clasica',
        image: 'Imagenes/Modelos/36m2 2A/webp/54 2Ablanca/54 2A_Blanca H.png',
        imageDetail: 'Imagenes/Modelos/36m2 2A/webp/54 2Ablanca/54 2A_Blanca.webp',
        bedrooms: '2',
        bathrooms: '1',
        area: '54',
        material: 'Paneles Pino',
        pdf: 'Imagenes/Fichas Tecnicas/54 2a-20260104T102248Z-3-001/54 2a/Ficha tecnica - 54mt 2a Kit basico.pdf',
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino (natural en bruto)',
            'Tabiqueria 2x3',
            'Cubiertas de zinc',
            'Caballetes de zinc de 2 mt',
            'Cerchas de pino tradicionales 3,4x1 de altura',
            'Costaneras de tapas pino 1x4'
        ]
    },
    'clasica-54-6a': {
        name: '54 m2 | 6 Aguas',
        style: 'Techo 6 Aguas',
        roofType: '6 Aguas',
        badge: 'Linea Clasica',
        image: 'Imagenes/Modelos/36m2 2A/webp/54.6a Siding/54 6A.webp',
        bedrooms: '2',
        bathrooms: '1',
        area: '54',
        material: 'Paneles Pino',
        hasPdf: false,
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino (natural en bruto)',
            'Tabiqueria 2x3',
            'Cubiertas de zinc',
            'Caballetes de zinc de 2 mt',
            'Cerchas de pino tradicionales 3,4x1 de altura',
            'Costaneras de tapas pino 1x4'
        ]
    },
    'clasica-72': {
        name: '72 m2 | 6 Aguas',
        style: 'Techo 6 Aguas',
        roofType: '6 Aguas',
        badge: 'Linea Clasica',
        image: 'Imagenes/Modelos/36m2 2A/webp/72.6a/72m 6A.webp',
        imageDetail: 'Imagenes/Modelos/36m2 2A/webp/72.6a/72, 6 aguas..webp',
        bedrooms: '3',
        bathrooms: '2',
        area: '72',
        material: 'Paneles Pino',
        hasPdf: false,
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino (natural en bruto)',
            'Tabiqueria 2x3',
            'Cubiertas de zinc',
            'Caballetes de zinc de 2 mt',
            'Cerchas de pino tradicionales 3,4x1 de altura',
            'Costaneras de tapas pino 1x4'
        ]
    },
    'clasica-72-2a': {
        name: '72 m2 | 2 Aguas',
        style: 'Espacioso',
        roofType: '2 Aguas',
        badge: 'Nuevo Modelo',
        image: 'Imagenes/Modelos/36m2 2A/webp/72m2 2Aguas/72m2 2A portada.webp',
        imageDetail: 'Imagenes/Modelos/36m2 2A/webp/72m2 2Aguas/72m2 2A ficha.webp',
        bedrooms: '3',
        bathrooms: '2',
        area: '72',
        material: 'Paneles Pino',
        pdf: 'Imagenes/Fichas Tecnicas/72 2a-20260104T102253Z-3-001/72 2a/Ficha tecnica - 72mt 2a Kit basico.pdf',
        features: [
            'Paneles exteriores e interiores premium',
            'Forro exterior en media luna de pino',
            'Tabiqueria 2x3 reforzada',
            'Cubiertas de zinc de alta calidad',
            'Caballetes de zinc de 2 mt',
            'Cerchas de pino tradicionales',
            'Costaneras de tapas pino 1x4',
            '3 dormitorios + 2 banos completos'
        ]
    },
    'clasica-108': {
        name: '108 m2',
        style: '6 Aguas',
        roofType: '6 Aguas',
        badge: 'Linea Clasica',
        image: 'Imagenes/Modelos/36m2 2A/54 2A/freepik__quiero-la-foto-del-angulo-izquierdo-de-la-casaimg1__52838.png',
        bedrooms: '4',
        bathrooms: '2',
        area: '108',
        material: 'Paneles Pino',
        features: [
            'Paneles exteriores e interiores de alta calidad',
            'Forro exterior en media luna de pino (natural en bruto)',
            'Tabiqueria 2x3 reforzada',
            'Cubiertas de zinc de alta calidad',
            'Caballetes de zinc de 2 mt',
            'Cerchas de pino tradicionales reforzadas',
            'Costaneras de tapas pino 1x4',
            'Acabados de primera calidad'
        ]
    }
};

// Funcion para obtener modelos relacionados (diferentes al actual)
function getRelatedModels(currentModelId, limit = 3) {
    const allModels = Object.keys(modelData);
    const related = allModels.filter(id => id !== currentModelId);
    // Mezclar aleatoriamente y tomar los primeros 'limit'
    return related.sort(() => Math.random() - 0.5).slice(0, limit);
}

// Variable global para almacenar el modelo actual
let currentModelId = null;

function openModelModal(modelId) {
    const modal = document.getElementById('modelModal');
    const data = modelData[modelId];

    if (!modal || !data) return;

    // Guardar el ID del modelo actual
    currentModelId = modelId;

    // ANALYTICS: Track view_item event
    trackViewItem(modelId, data.name, data.area);

    // Populate modal content - usar imageDetail si existe, sino image
    document.getElementById('modalImage').src = data.imageDetail || data.image;
    document.getElementById('modalImage').alt = data.name;
    document.getElementById('modalBadge').textContent = data.badge;
    document.getElementById('modalTitle').textContent = data.name;
    document.getElementById('modalStyle').textContent = data.style;
    document.getElementById('modalBedrooms').textContent = data.bedrooms;
    document.getElementById('modalBathrooms').textContent = data.bathrooms;
    document.getElementById('modalArea').textContent = data.area;
    document.getElementById('modalMaterial').textContent = data.material;

    // Roof type
    const roofTypeEl = document.getElementById('modalRoofType');
    if (roofTypeEl) {
        roofTypeEl.textContent = data.roofType || data.style;
    }

    // Features list
    const featuresEl = document.getElementById('modalFeatures');
    if (featuresEl && data.features) {
        featuresEl.innerHTML = data.features.map(feature =>
            `<li><i class="fas fa-check"></i><span>${feature}</span></li>`
        ).join('');
    }

    // WhatsApp link with model name
    const whatsappEl = document.getElementById('modalWhatsApp');
    if (whatsappEl) {
        const modelName = encodeURIComponent(`${data.name} ${data.badge}`);
        whatsappEl.href = `https://wa.me/56998654665?text=Hola%2C%20me%20interesa%20el%20modelo%20${modelName}`;
    }

    // Hide/show PDF button based on hasPdf
    const pdfBtn = document.getElementById('modalPdfBtn');
    if (pdfBtn) {
        pdfBtn.style.display = data.hasPdf === false ? 'none' : 'flex';
    }

    // Mostrar modelos relacionados
    const relatedContainer = document.getElementById('modalRelatedModels');
    if (relatedContainer) {
        const relatedIds = getRelatedModels(modelId, 3);
        relatedContainer.innerHTML = relatedIds.map(id => {
            const model = modelData[id];
            return `
                <div class="related-model-card" onclick="openModelModal('${id}')">
                    <div class="related-model-image">
                        <img src="${model.image}" alt="${model.name}" loading="lazy">
                    </div>
                    <div class="related-model-info">
                        <span class="related-model-name">${model.name}</span>
                        <span class="related-model-style">${model.style}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModelModal() {
    const modal = document.getElementById('modelModal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset to details view when closing
    setTimeout(() => {
        showModalView('details');
    }, 300);
}

// Swipe to close modal en movil
function initModalSwipeToClose() {
    const modal = document.getElementById('modelModal');
    const modalContent = modal?.querySelector('.model-modal-content');
    if (!modalContent) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    modalContent.addEventListener('touchstart', (e) => {
        // Solo permitir swipe desde la parte superior del modal
        const touch = e.touches[0];
        const rect = modalContent.getBoundingClientRect();
        if (touch.clientY - rect.top < 100) { // Solo los primeros 100px
            startY = touch.clientY;
            isDragging = true;
        }
    }, { passive: true });

    modalContent.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        // Solo permitir arrastrar hacia abajo
        if (diff > 0 && diff < 200) {
            modalContent.style.transform = `translateY(${diff}px)`;
            modalContent.style.opacity = 1 - (diff / 300);
        }
    }, { passive: true });

    modalContent.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;

        const diff = currentY - startY;
        if (diff > 80) { // Si arrastra mas de 80px, cerrar
            closeModelModal();
        }

        // Reset styles
        modalContent.style.transform = '';
        modalContent.style.opacity = '';
        startY = 0;
        currentY = 0;
    });
}

// Inicializar swipe cuando carga la pagina
document.addEventListener('DOMContentLoaded', initModalSwipeToClose);

// =============================================
// MODAL INLINE FORMS - Navegacion entre vistas
// =============================================

function showModalForm(formType) {
    if (formType === 'email') {
        showModalView('email');
        // Setear el modelo en el formulario
        const modelName = document.getElementById('modalTitle')?.textContent || '';
        const modelStyle = document.getElementById('modalStyle')?.textContent || '';
        document.getElementById('emailFormModelo').value = `${modelName} - ${modelStyle}`;
    } else if (formType === 'pdf') {
        showModalView('pdf');
        // Setear el modelo en el formulario
        const modelName = document.getElementById('modalTitle')?.textContent || '';
        const modelStyle = document.getElementById('modalStyle')?.textContent || '';
        document.getElementById('pdfFormModelo').value = `${modelName} - ${modelStyle}`;
    }
}

function showModalView(viewType) {
    const views = document.querySelectorAll('.modal-view');
    views.forEach(view => view.classList.remove('active'));

    let targetView;
    switch (viewType) {
        case 'email':
            targetView = document.getElementById('modalViewEmail');
            break;
        case 'pdf':
            targetView = document.getElementById('modalViewPdf');
            break;
        case 'success':
            targetView = document.getElementById('modalViewSuccess');
            break;
        default:
            targetView = document.getElementById('modalViewDetails');
    }

    if (targetView) {
        targetView.classList.add('active');
    }
}

// Handlers para los formularios
document.addEventListener('DOMContentLoaded', function() {
    // Email Form Handler
    const emailForm = document.getElementById('modalEmailForm');
    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(emailForm);
            const data = {
                modelo: formData.get('modelo'),
                nombre: formData.get('nombre'),
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                mensaje: formData.get('mensaje')
            };

            // Simular envío (aquí conectarías con tu backend)
            console.log('Cotización por correo:', data);

            // Mostrar vista de éxito
            document.getElementById('successTitle').textContent = '¡Cotización Enviada!';
            document.getElementById('successMessage').textContent = 'Te contactaremos pronto con la información solicitada.';
            showModalView('success');

            // Reset form
            emailForm.reset();
        });
    }

    // PDF Form Handler (dentro del modal de modelo)
    const pdfForm = document.getElementById('modalPdfForm');
    if (pdfForm) {
        pdfForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(pdfForm);
            const submitBtn = pdfForm.querySelector('.modal-form-submit');
            const originalHTML = submitBtn ? submitBtn.innerHTML : '';

            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Enviando...</span>';
                submitBtn.disabled = true;
            }

            try {
                const response = await fetch(PDF_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: formData.get('nombre'),
                        email: formData.get('email'),
                        telefono: formData.get('telefono'),
                        model_name: formData.get('modelo'),
                        modelo: formData.get('modelo')
                    })
                });

                const result = await response.json();

                if (result.success) {
                    document.getElementById('successTitle').textContent = '¡Ficha Enviada!';
                    document.getElementById('successMessage').textContent = result.email_sent
                        ? 'Revisa tu correo en los próximos minutos.'
                        : 'Te contactaremos por WhatsApp con la ficha.';
                    showModalView('success');
                    pdfForm.reset();
                } else {
                    alert('Error: ' + (result.message || 'No se pudo enviar'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión. Intenta nuevamente.');
            } finally {
                if (submitBtn) {
                    submitBtn.innerHTML = originalHTML;
                    submitBtn.disabled = false;
                }
            }
        });
    }
});

// Función para abrir el modal PDF desde el modal de modelo
function openPDFModalFromModel() {
    // Mapeo de modelId a pdfId
    const modelToPdfMap = {
        'clasica-36': '36m2-2a',
        'clasica-54': '54m2-2a',
        'clasica-72-2a': '72m2-2a'
    };

    if (!currentModelId) {
        console.error('No hay modelo seleccionado');
        return;
    }

    const pdfId = modelToPdfMap[currentModelId];
    if (!pdfId) {
        console.error('No se encontró PDF para el modelo:', currentModelId);
        return;
    }

    // Cerrar el modal del modelo primero
    closeModelModal();

    // Esperar un momento para que se cierre el modal del modelo
    setTimeout(() => {
        openPDFModal(pdfId);
    }, 200);
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModelModal();
    }
});

// Featured Slideshow
let currentSlide = 0;
let slideInterval = null;
const SLIDE_DURATION = 5000; // 5 seconds

function initFeaturedSlideshow() {
    const slideshow = document.getElementById('featuredSlideshow');
    if (!slideshow) return;

    const dots = document.querySelectorAll('.slideshow-dots .dot');

    // Click on dots
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.dataset.slide);
            goToSlide(slideIndex);
        });
    });

    // Start autoplay
    startSlideshow();

    // Pause on hover
    slideshow.addEventListener('mouseenter', stopSlideshow);
    slideshow.addEventListener('mouseleave', startSlideshow);
}

function startSlideshow() {
    stopSlideshow();
    slideInterval = setInterval(() => {
        changeSlide(1);
    }, SLIDE_DURATION);
}

function stopSlideshow() {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

function changeSlide(direction) {
    const slides = document.querySelectorAll('.slideshow-container .slide');
    const dots = document.querySelectorAll('.slideshow-dots .dot');

    if (!slides.length) return;

    // Remove active from current slide
    slides[currentSlide].classList.remove('active');
    slides[currentSlide].classList.add('prev');
    dots[currentSlide].classList.remove('active');

    // Calculate new slide
    currentSlide += direction;

    if (currentSlide >= slides.length) {
        currentSlide = 0;
    } else if (currentSlide < 0) {
        currentSlide = slides.length - 1;
    }

    // Remove prev class from all slides
    setTimeout(() => {
        slides.forEach(slide => slide.classList.remove('prev'));
    }, 100);

    // Add active to new slide
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.slideshow-container .slide');
    const dots = document.querySelectorAll('.slideshow-dots .dot');

    if (!slides.length || index === currentSlide) return;

    // Remove active from current slide
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');

    // Update current slide
    currentSlide = index;

    // Add active to new slide
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');

    // Reset autoplay
    startSlideshow();
}

// =============================================
// ASISTENTE - Panel Lateral (Conectado a N8N AI Agent)
// =============================================

const EXECUTIVE_EMAIL = 'contacto@chilehome.cl';
const WHATSAPP_NUMBER = '56998654665';

// N8N Webhook Configuration (producción)
const N8N_AGENT_URL = 'https://agenciados.app.n8n.cloud/webhook/chilehome/lead-agent';

function initAssistant() {
    // Elements
    const chatFloat = document.getElementById('chatFloat');
    const openBtn = document.getElementById('openAssistant');
    const openBtnHeader = document.getElementById('openAssistantHeader');
    const closeBtn = document.getElementById('closeAssistant');
    const panel = document.getElementById('assistantPanel');
    const overlay = document.getElementById('assistantOverlay');
    const messages = document.getElementById('assistantMessages');
    const input = document.getElementById('assistantInput');
    const sendBtn = document.getElementById('assistantSend');
    const options = document.querySelectorAll('.panel-option');
    const introSection = document.querySelector('.intro-section');

    if (!openBtn || !panel) return;

    // State
    let sessionId = generateSessionId();
    let isWaitingResponse = false;
    let isHeaderMode = false;

    // Scroll behavior - show header button immediately on first scroll
    function handleScroll() {
        if (!chatFloat || !openBtnHeader) return;

        // Trigger with any scroll (just 10px to avoid accidental triggers)
        const scrollY = window.scrollY || window.pageYOffset;
        const shouldShowHeader = scrollY > 10;

        if (shouldShowHeader && !isHeaderMode) {
            isHeaderMode = true;
            chatFloat.classList.add('minimized');
            openBtnHeader.classList.add('visible');
        } else if (!shouldShowHeader && isHeaderMode) {
            isHeaderMode = false;
            chatFloat.classList.remove('minimized');
            openBtnHeader.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    // Open panel
    openBtn.addEventListener('click', openPanel);
    if (openBtnHeader) {
        openBtnHeader.addEventListener('click', openPanel);
    }

    // Close panel
    closeBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('active')) {
            closePanel();
        }
    });

    // Generate unique session ID
    function generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function openPanel() {
        panel.classList.add('active');
        overlay.classList.add('active');
        if (chatFloat) chatFloat.classList.add('hidden');
        document.body.style.overflow = 'hidden';

        // Welcome message and connect to N8N agent
        if (messages.children.length === 0) {
            setTimeout(() => {
                addBotMessage('¡Hola! Bienvenido a Chile Home.');
                setTimeout(() => {
                    addBotMessage('Estoy aquí para ayudarte a encontrar tu casa prefabricada ideal. ¿En qué puedo ayudarte?');
                }, 600);
            }, 300);
        }

        setTimeout(() => input.focus(), 400);
    }

    function closePanel() {
        panel.classList.remove('active');
        overlay.classList.remove('active');
        if (chatFloat) chatFloat.classList.remove('hidden');
        document.body.style.overflow = '';
    }

    // Quick options
    options.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            handleQuickAction(action, btn.textContent.trim());
        });
    });

    // Input handling
    input.addEventListener('input', () => {
        sendBtn.disabled = !input.value.trim();
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            handleUserInput();
        }
    });

    sendBtn.addEventListener('click', handleUserInput);

    async function handleUserInput() {
        const text = input.value.trim();
        if (!text || isWaitingResponse) return;

        addUserMessage(text);
        input.value = '';
        sendBtn.disabled = true;

        // Send to N8N AI Agent
        await sendToN8NAgent(text);
    }

    // Send message to N8N AI Agent
    async function sendToN8NAgent(message) {
        isWaitingResponse = true;
        showTyping();

        try {
            const response = await fetch(N8N_AGENT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: sessionId,
                    timestamp: new Date().toISOString(),
                    source: 'chilehome-website',
                    page_url: window.location.href
                })
            });

            hideTyping();

            if (response.ok) {
                const data = await response.json();
                // N8N should return { response: "mensaje del agente" }
                const agentResponse = data.assistant_message || data.response || data.message || data.output || data.text || 'Gracias por tu mensaje. Un ejecutivo te contactará pronto.';
                addBotMessage(agentResponse);
            } else {
                // Error de servidor
                console.error('Error N8N:', response.status);
                addBotMessage('Disculpa, hubo un problema de conexión. ¿Puedes intentar de nuevo?');
            }
        } catch (error) {
            hideTyping();
            console.error('Error conectando con N8N:', error);
            // Fallback: mostrar opciones locales
            addBotMessage('Disculpa, no pude conectar con el asistente. ¿En qué puedo ayudarte?');
            addBotMessageWithOptions('', [
                { text: 'Ver modelos', action: 'local_modelos' },
                { text: 'Contactar ejecutivo', action: 'local_contacto' }
            ]);
        }

        isWaitingResponse = false;
    }

    // Fallback functions for when N8N is unavailable
    function handleLocalAction(action) {
        if (action === 'local_modelos') {
            addBotMessage('<b>Nuestros modelos:</b><br>• 36 m² - 1 dorm, 1 baño<br>• 54 m² - 2 dorm, 1 baño<br>• 72 m² - 3 dorm, 2 baños<br>• 108 m² - 4 dorm, 2 baños');
        } else if (action === 'local_contacto') {
            addBotMessage('Puedes contactarnos directamente:<br>• WhatsApp: +56 9 9865 4665<br>• Email: contacto@chilehome.cl');
        }
    }

    // UI Functions
    // Sanitize function for XSS protection (user input only)
    function sanitizeUserInput(text) {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
        }
        // Fallback: escape HTML entities
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Sanitize bot HTML (allows safe formatting tags)
    function sanitizeBotHTML(html) {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'br', 'span', 'div', 'p'],
                ALLOWED_ATTR: ['class']
            });
        }
        return html;
    }

    function addBotMessage(text) {
        const div = document.createElement('div');
        div.className = 'chat-message bot';
        div.innerHTML = `<div class="bubble">${sanitizeBotHTML(text)}</div>`;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'chat-message user';
        div.innerHTML = `<div class="bubble">${sanitizeUserInput(text)}</div>`;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function addBotMessageWithOptions(text, opts) {
        const div = document.createElement('div');
        div.className = 'chat-message bot';
        const optionsHTML = opts.map(opt =>
            `<button class="quick-action-btn" data-action="${sanitizeUserInput(opt.action)}">${sanitizeUserInput(opt.text)}</button>`
        ).join('');
        div.innerHTML = `<div class="bubble">${sanitizeBotHTML(text)}<div class="quick-actions">${optionsHTML}</div></div>`;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;

        div.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                handleQuickAction(btn.dataset.action, btn.textContent);
            });
        });
    }

    function handleQuickAction(action, text) {
        // Handle local fallback actions
        if (action.startsWith('local_')) {
            addUserMessage(text);
            handleLocalAction(action);
            return;
        }

        // For all other actions, send to N8N agent
        addUserMessage(text);
        sendToN8NAgent(text);
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'chat-message bot';
        div.id = 'typingIndicator';
        div.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
        const typing = document.getElementById('typingIndicator');
        if (typing) typing.remove();
    }
}

// =============================================
// THEME MANAGEMENT (Dark/Light Mode)
// =============================================

function initThemeManager() {
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleHeader = document.getElementById('themeToggleHeader');
    const themeTooltip = document.getElementById('themeTooltip');

    function getPreferredTheme() {
        const savedTheme = localStorage.getItem('chileHomeTheme');
        if (savedTheme) return savedTheme;

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        const hour = new Date().getHours();
        if (hour >= 19 || hour < 7) return 'dark';

        return 'light';
    }

    function updateTooltipText(theme) {
        if (themeTooltip) {
            themeTooltip.textContent = theme === 'dark'
                ? 'Cambiar a modo claro'
                : 'Cambiar a modo oscuro';
        }
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('chileHomeTheme', theme);
        updateTooltipText(theme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        if (themeTooltip) {
            themeTooltip.classList.remove('first-visit', 'show');
        }
    }

    // Initialize theme
    const initialTheme = getPreferredTheme();
    setTheme(initialTheme);

    // Show tooltip on first visit
    if (themeTooltip && !localStorage.getItem('themeTooltipSeen')) {
        setTimeout(() => {
            themeTooltip.classList.add('show', 'first-visit');
            localStorage.setItem('themeTooltipSeen', 'true');
            setTimeout(() => {
                themeTooltip.classList.remove('show', 'first-visit');
            }, 5000);
        }, 2000);
    }

    // Theme toggle buttons
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    if (themeToggleHeader) {
        themeToggleHeader.addEventListener('click', toggleTheme);
    }

    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('chileHomeTheme')) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

// =============================================
// SEARCH FUNCTIONALITY
// =============================================

function initSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchTags = document.querySelectorAll('.search-tag');

    if (!searchToggle || !searchOverlay) return;

    // Search data
    const searchData = [
        {
            id: '36-1a',
            title: 'Casa 36 m² Un Agua',
            category: 'Modelos',
            image: 'Imagenes/Nuevos Modelos/36m2 1A.png',
            keywords: ['36', '36m2', 'un agua', 'pequeña', 'compacta', 'estudio']
        },
        {
            id: 'terra-36',
            title: 'Terra 36 m² Dos Aguas',
            category: 'Modelos',
            image: 'Imagenes/Nuevos Modelos/36m2 2A.png',
            keywords: ['36', '36m2', 'dos aguas', 'terra', 'pequeña']
        },
        {
            id: '54-1a',
            title: 'Casa 54 m² Un Agua',
            category: 'Modelos',
            image: 'Imagenes/Nuevos Modelos/54m2 1A.png',
            keywords: ['54', '54m2', 'un agua', 'mediana', 'familia']
        },
        {
            id: 'clasica-36',
            title: 'Casa 36 m² 2 Aguas Clásica',
            category: 'Línea Clásica',
            image: 'Imagenes/Modelos/36m2 2A/36 2A/36m2 2A H.png',
            keywords: ['36', '36m2', 'clásica', 'tradicional', 'dos aguas']
        },
        {
            id: 'clasica-54',
            title: 'Casa 54 m² 2 Aguas Clásica',
            category: 'Línea Clásica',
            image: 'Imagenes/Modelos/36m2 2A/webp/54 2Ablanca/54 2A_Blanca H.png',
            keywords: ['54', '54m2', 'clásica', 'tradicional']
        },
        {
            id: 'clasica-72',
            title: 'Casa 72 m² Clásica',
            category: 'Línea Clásica',
            image: 'Imagenes/Modelos/72m2.png',
            keywords: ['72', '72m2', 'clásica', 'grande', 'familia', 'espaciosa']
        },
        {
            type: 'page',
            title: 'Materiales y Especificaciones',
            category: 'Información',
            link: '#nosotros',
            keywords: ['materiales', 'madera', 'pino', 'zinc', 'especificaciones', 'calidad']
        },
        {
            type: 'page',
            title: 'Solicitar Cotización',
            category: 'Contacto',
            link: '#contacto',
            keywords: ['cotización', 'precio', 'presupuesto', 'cotizar']
        },
        {
            type: 'page',
            title: 'Proceso de Construcción',
            category: 'Información',
            link: '#proceso',
            keywords: ['proceso', 'construcción', 'etapas', 'como funciona']
        }
    ];

    // Open search
    searchToggle.addEventListener('click', () => {
        searchOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => searchInput.focus(), 100);
    });

    // Close search
    function closeSearch() {
        searchOverlay.classList.remove('active');
        document.body.style.overflow = '';
        searchInput.value = '';
        searchResults.innerHTML = '';
    }

    searchClose.addEventListener('click', closeSearch);

    searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) {
            closeSearch();
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            closeSearch();
        }
    });

    // Search tags
    searchTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const query = tag.dataset.search;
            searchInput.value = query;
            performSearch(query);
        });
    });

    // Search input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 300);
    });

    function performSearch(query) {
        if (!query || query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }

        const lowerQuery = query.toLowerCase();
        const results = searchData.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(lowerQuery);
            const keywordMatch = item.keywords.some(k => k.includes(lowerQuery));
            return titleMatch || keywordMatch;
        });

        renderResults(results);
    }

    function renderResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.6);">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    <p>No se encontraron resultados</p>
                </div>
            `;
            return;
        }

        searchResults.innerHTML = results.map(item => {
            if (item.type === 'page') {
                return `
                    <div class="search-result-item" onclick="window.location.href='${item.link}'; document.getElementById('searchOverlay').classList.remove('active'); document.body.style.overflow='';">
                        <div style="width: 60px; height: 45px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-file-alt" style="color: rgba(255,255,255,0.6);"></i>
                        </div>
                        <div class="search-result-info">
                            <h4>${item.title}</h4>
                            <span>${item.category}</span>
                        </div>
                    </div>
                `;
            }
            return `
                <div class="search-result-item" onclick="openModelModal('${item.id}'); document.getElementById('searchOverlay').classList.remove('active'); document.body.style.overflow='';">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="search-result-info">
                        <h4>${item.title}</h4>
                        <span>${item.category}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// =============================================
// GSAP ANIMATIONS
// =============================================

function initGSAPAnimations() {
    // Check if GSAP is loaded
    if (typeof gsap === 'undefined') {
        console.log('GSAP not loaded, skipping animations');
        return;
    }

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Hero Preview Card - Advanced Animation
    const heroPreview = document.querySelector('.hero-preview');
    if (heroPreview) {
        heroPreview.classList.add('gsap-animated');

        // Initial floating animation
        gsap.to(heroPreview, {
            y: -15,
            duration: 2,
            ease: 'power1.inOut',
            repeat: -1,
            yoyo: true
        });

        // Hover animation
        heroPreview.addEventListener('mouseenter', () => {
            gsap.to(heroPreview, {
                scale: 1.08,
                y: -20,
                boxShadow: '0 40px 100px rgba(0, 0, 0, 0.4)',
                duration: 0.4,
                ease: 'power2.out'
            });

            // Animate the image inside
            const img = heroPreview.querySelector('.preview-image img');
            if (img) {
                gsap.to(img, {
                    scale: 1.15,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            }

            // Show CTA
            const cta = heroPreview.querySelector('.preview-cta');
            if (cta) {
                gsap.to(cta, {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        });

        heroPreview.addEventListener('mouseleave', () => {
            gsap.to(heroPreview, {
                scale: 1,
                y: 0,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
                duration: 0.4,
                ease: 'power2.out'
            });

            const img = heroPreview.querySelector('.preview-image img');
            if (img) {
                gsap.to(img, {
                    scale: 1,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            }

            const cta = heroPreview.querySelector('.preview-cta');
            if (cta) {
                gsap.to(cta, {
                    opacity: 0,
                    y: 5,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            }
        });

        // Click animation
        heroPreview.addEventListener('click', () => {
            gsap.timeline()
                .to(heroPreview, {
                    scale: 0.95,
                    duration: 0.1,
                    ease: 'power2.out'
                })
                .to(heroPreview, {
                    scale: 1.08,
                    duration: 0.2,
                    ease: 'power2.out'
                });
        });
    }

    // Hero content animation on load
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        gsap.from(heroContent.children, {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out',
            delay: 1.5
        });
    }

    // Model cards scroll animation
    const modelCards = document.querySelectorAll('.model-card');
    modelCards.forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 60,
            opacity: 0,
            duration: 0.8,
            delay: index * 0.1,
            ease: 'power3.out'
        });
    });

    // Steps animation - using fromTo to ensure final state
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        gsap.fromTo(step,
            { y: 40, opacity: 0 },
            {
                scrollTrigger: {
                    trigger: step,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                y: 0,
                opacity: 1,
                duration: 0.6,
                delay: index * 0.1,
                ease: 'power2.out'
            }
        );
    });

    // Features animation - using fromTo to ensure final state
    const features = document.querySelectorAll('.feature');
    features.forEach((feature, index) => {
        gsap.fromTo(feature,
            { x: -40, opacity: 0 },
            {
                scrollTrigger: {
                    trigger: feature,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                x: 0,
                opacity: 1,
                duration: 0.6,
                delay: index * 0.1,
                ease: 'power2.out'
            }
        );
    });

    // Intro section - animate immediately on load
    const introTitle = document.querySelector('.intro-title');
    const introText = document.querySelector('.intro-text');
    if (introTitle) {
        gsap.from(introTitle, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 1.8,
            ease: 'power3.out'
        });
    }
    if (introText) {
        gsap.from(introText, {
            y: 20,
            opacity: 0,
            duration: 0.8,
            delay: 2,
            ease: 'power3.out'
        });
    }

    // Section titles animation (excluding intro-title)
    const sectionTitles = document.querySelectorAll('.models-title, .featured-title');
    sectionTitles.forEach(title => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        });
    });

    // Footer animation
    const footerGrid = document.querySelector('.footer-modern-grid');
    if (footerGrid) {
        gsap.from(footerGrid.children, {
            scrollTrigger: {
                trigger: footerGrid,
                start: 'top 90%',
                toggleActions: 'play none none none'
            },
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out'
        });
    }
}

// =============================================
// NEWSLETTER FORM
// =============================================

function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput ? emailInput.value.trim() : '';

        if (!email || !isValidEmail(email)) {
            showNotification('Por favor, ingresa un email valido', 'error');
            return;
        }

        const formData = {
            form_type: 'newsletter',
            email: email
        };

        await sendFormData(form, formData, 'Gracias por suscribirte. Te mantendremos informado.');
    });
}

// Initialize all new features
document.addEventListener('DOMContentLoaded', () => {
    initThemeManager();
    initSearch();
    initNewsletter();

    // Initialize GSAP after a short delay to ensure everything is loaded
    setTimeout(() => {
        initGSAPAnimations();
    }, 100);
});

// =============================================
// COMPANY VIDEO - YouTube Player with Auto-play on Scroll
// =============================================

let companyPlayer = null;
let playerReady = false;

function onYouTubeIframeAPIReady() {
    const playerContainer = document.getElementById('company-youtube-player');
    if (!playerContainer) return;

    companyPlayer = new YT.Player('company-youtube-player', {
        videoId: 'akiyg_OR0yY',
        playerVars: {
            autoplay: 0,
            mute: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 1,
            playsinline: 1,
            cc_load_policy: 0,
            iv_load_policy: 3,
            disablekb: 0
        },
        events: {
            onReady: onCompanyPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

function onCompanyPlayerReady(event) {
    playerReady = true;
    initVideoScrollObserver();
}

function onPlayerStateChange(event) {
    // Allow user to pause/play manually
}

function initVideoScrollObserver() {
    const videoSection = document.querySelector('.company-video-section');
    if (!videoSection || !companyPlayer) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (playerReady && companyPlayer) {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    // Video is visible - play it
                    companyPlayer.playVideo();
                } else {
                    // Video is not visible - pause it
                    companyPlayer.pauseVideo();
                }
            }
        });
    }, {
        threshold: [0, 0.5, 1]
    });

    observer.observe(videoSection);
}

// =============================================
// QUOTE MODAL
// =============================================
function initQuoteModal() {
    const openBtn = document.getElementById('openQuoteModal');
    const heroQuoteBtn = document.getElementById('heroQuoteBtn');
    const modal = document.getElementById('quoteModal');
    const form = document.getElementById('quoteModalForm');

    // Función para abrir el modal
    const openModal = () => {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    // Botón flotante "Cotizar Ahora"
    if (openBtn && modal) {
        openBtn.addEventListener('click', openModal);
    }

    // Botón del hero "Solicitar Cotización"
    if (heroQuoteBtn) {
        heroQuoteBtn.addEventListener('click', openModal);
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                form_type: 'contacto',
                nombre: form.querySelector('input[name="nombre"]').value.trim(),
                email: form.querySelector('input[name="email"]').value.trim(),
                telefono: form.querySelector('input[name="telefono"]').value.trim(),
                modelo: form.querySelector('select[name="modelo"]').value,
                ubicacion: form.querySelector('input[name="ubicacion"]').value.trim(),
                coordenadas: form.querySelector('input[name="coordenadas"]').value.trim(),
                mensaje: form.querySelector('textarea[name="mensaje"]').value.trim() || 'Sin mensaje adicional'
            };

            if (!formData.nombre || !formData.telefono) {
                showNotification('Por favor, completa nombre y teléfono', 'error');
                return;
            }

            const submitBtn = form.querySelector('.quote-submit-btn');
            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Verificando...</span>';

            try {
                // Obtener token de reCAPTCHA v3
                const recaptchaToken = await getRecaptchaToken('quote');
                if (recaptchaToken) {
                    formData.recaptcha_token = recaptchaToken;
                }

                // Agregar parámetros UTM para tracking en CRM
                const utmParams = getSavedUTMParams();
                formData.utm_source = utmParams.utm_source;
                formData.utm_campaign = utmParams.utm_campaign;

                submitBtn.innerHTML = '<span>Enviando...</span>';

                const response = await fetch(SMTP_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    showNotification('¡Solicitud enviada! Te contactaremos pronto.', 'success');
                    form.reset();
                    closeQuoteModal();
                } else {
                    showNotification(result.message || 'Error al enviar. Intenta nuevamente.', 'error');
                }
            } catch (error) {
                showNotification('Error de conexión. Intenta nuevamente.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
            }
        });
    }
}

function closeQuoteModal() {
    const modal = document.getElementById('quoteModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeQuoteModal();
    }
});

// Inicializar Quote Modal
document.addEventListener('DOMContentLoaded', initQuoteModal);

// =============================================
// GEOLOCATION - Interactive Maps with Draggable Markers
// =============================================

// Store map instances and autocomplete instances
const mapInstances = {};
const autocompleteInstances = {};

// Check if Google Maps API is loaded
function isGoogleMapsLoaded() {
    return typeof google !== 'undefined' && typeof google.maps !== 'undefined';
}

// Reverse Geocoding: Coordenadas a Direccion (con fallback a Nominatim)
async function reverseGeocode(lat, lng) {
    // Intentar con Google Maps si esta disponible
    if (isGoogleMapsLoaded()) {
        try {
            const geocoder = new google.maps.Geocoder();
            const googleResult = await new Promise((resolve) => {
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        resolve(results[0].formatted_address);
                    } else {
                        resolve(null);
                    }
                });
            });
            if (googleResult) return googleResult;
        } catch (e) {
            console.log('Google Geocoder error:', e);
        }
    }

    // Fallback a Nominatim (OpenStreetMap) - siempre intentar si Google falla
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'es' } }
        );
        const data = await response.json();
        if (data && data.address) {
            // Formatear direccion de manera legible
            const addr = data.address;
            const parts = [];
            if (addr.road) parts.push(addr.road);
            if (addr.house_number) parts[parts.length - 1] += ' ' + addr.house_number;
            if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
            if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
            if (addr.state) parts.push(addr.state);

            if (parts.length > 0) {
                return parts.join(', ');
            }
            // Fallback al display_name completo
            return data.display_name;
        }
    } catch (e) {
        console.log('Nominatim error:', e);
    }

    return null;
}

// Geocoding: Dirección → Coordenadas
async function geocodeAddress(address) {
    if (!isGoogleMapsLoaded()) return null;

    try {
        const geocoder = new google.maps.Geocoder();
        return new Promise((resolve) => {
            geocoder.geocode({ address: address, region: 'cl' }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    resolve({
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng()
                    });
                } else {
                    resolve(null);
                }
            });
        });
    } catch (e) {
        console.log('Geocode error:', e);
        return null;
    }
}

// Crear o actualizar mapa interactivo con marcador arrastrable
function createOrUpdateMap(mapId, lat, lng, ubicacionInput, coordenadasInput, mapContainer) {
    mapContainer.style.display = 'block';
    const mapElement = document.getElementById(mapId);
    if (!mapElement) return;

    // Mostrar loading state
    mapElement.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #c9a86c; margin-bottom: 10px;"></i>
            <p style="margin: 0; font-size: 14px; color: #666;">Cargando mapa...</p>
        </div>
    `;

    // Si Google Maps no está disponible después de 3 segundos, mostrar fallback
    const fallbackTimeout = setTimeout(() => {
        if (!isGoogleMapsLoaded()) {
            mapElement.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #e8e8e8; border-radius: 8px; padding: 20px; text-align: center;">
                    <i class="fas fa-map-marker-alt" style="font-size: 32px; color: #c9a86c; margin-bottom: 10px;"></i>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Ubicación guardada</p>
                    <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="background: #c9a86c; color: white; padding: 12px 20px; min-height: 44px; border-radius: 8px; text-decoration: none; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fas fa-external-link-alt"></i> Ver en Google Maps
                    </a>
                </div>
            `;
        }
    }, 3000);

    // Si Maps no esta disponible, mostrar mapa estatico de OpenStreetMap
    if (!isGoogleMapsLoaded()) {
        clearTimeout(fallbackTimeout);
        const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=16&size=400x200&maptype=mapnik&markers=${lat},${lng},red-pushpin`;
        mapElement.innerHTML = `
            <div style="height: 100%; border-radius: 8px; overflow: hidden; position: relative; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);">
                <img src="${staticMapUrl}" alt="Mapa" style="width: 100%; height: 100%; object-fit: cover;"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; position: absolute; inset: 0; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);">
                    <i class="fas fa-map-marker-alt" style="font-size: 40px; color: #c9a86c; margin-bottom: 15px;"></i>
                    <p style="margin: 0 0 5px; font-size: 16px; color: #fff; font-weight: 600;">Ubicacion guardada</p>
                    <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.7);">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</p>
                </div>
                <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);">
                    <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank"
                       style="background: #c9a86c; color: #0a0a0a; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                        <i class="fas fa-external-link-alt"></i> Ver en Google Maps
                    </a>
                </div>
            </div>
        `;
        return;
    }

    // Limpiar timeout si Maps cargó
    clearTimeout(fallbackTimeout);

    const position = { lat, lng };

    try {
        if (mapInstances[mapId]) {
            // Si el mapa ya existe, solo mover el marcador
            mapInstances[mapId].map.setCenter(position);
            mapInstances[mapId].marker.setPosition(position);
        } else {
            // Crear nuevo mapa
            const map = new google.maps.Map(mapElement, {
                center: position,
                zoom: 17,
                mapTypeId: 'hybrid',
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                zoomControl: true,
                gestureHandling: 'greedy' // Mejor para móvil
            });

            // Crear marcador arrastrable con icono personalizado (sin cuadro negro)
            const markerIcon = {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#c9a86c',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
                scale: 12
            };

            const marker = new google.maps.Marker({
                position: position,
                map: map,
                draggable: true,
                animation: google.maps.Animation.DROP,
                title: 'Arrastra para ajustar la ubicacion',
                icon: markerIcon
            });

            // Evento cuando se arrastra el marcador
            marker.addListener('dragend', async () => {
                const newPos = marker.getPosition();
                const newLat = newPos.lat();
                const newLng = newPos.lng();

                if (coordenadasInput) {
                    coordenadasInput.value = `${newLat},${newLng}`;
                }

                const direccion = await reverseGeocode(newLat, newLng);
                if (direccion && ubicacionInput) {
                    ubicacionInput.value = direccion;
                }

                map.panTo(newPos);
            });

            // Clic en el mapa para mover el marcador
            map.addListener('click', async (e) => {
                const newLat = e.latLng.lat();
                const newLng = e.latLng.lng();

                marker.setPosition(e.latLng);

                if (coordenadasInput) {
                    coordenadasInput.value = `${newLat},${newLng}`;
                }

                const direccion = await reverseGeocode(newLat, newLng);
                if (direccion && ubicacionInput) {
                    ubicacionInput.value = direccion;
                }
            });

            mapInstances[mapId] = { map, marker };
        }
    } catch (error) {
        console.log('Error creando mapa:', error);
        // Fallback: mostrar link a Google Maps
        mapElement.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #e8e8e8; border-radius: 8px; padding: 20px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="background: #c9a86c; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px;">
                    Ver en Google Maps
                </a>
            </div>
        `;
    }
}

function setupGeolocation(btnId, inputId, coordsId, mapContainerId, mapId) {
    const geoBtn = document.getElementById(btnId);
    const ubicacionInput = document.getElementById(inputId);
    const coordenadasInput = document.getElementById(coordsId);
    const mapContainer = document.getElementById(mapContainerId);

    if (!geoBtn || !ubicacionInput) return;

    // Configurar Autocompletado de Google Places (solo si está disponible)
    if (isGoogleMapsLoaded() && google.maps.places) {
        try {
            const autocomplete = new google.maps.places.Autocomplete(ubicacionInput, {
                types: ['geocode', 'establishment'],
                componentRestrictions: { country: 'cl' },
                fields: ['formatted_address', 'geometry', 'name']
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();

                if (place.geometry && place.geometry.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();

                    if (coordenadasInput) {
                        coordenadasInput.value = `${lat},${lng}`;
                    }

                    createOrUpdateMap(mapId, lat, lng, ubicacionInput, coordenadasInput, mapContainer);
                }
            });

            // Mejorar UX en móviles: ajustar viewport cuando se abre el teclado
            if (/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                ubicacionInput.addEventListener('focus', () => {
                    setTimeout(() => {
                        // Scroll al input cuando el teclado aparece
                        ubicacionInput.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }, 300);
                });

                // Agregar clase para estilos específicos móvil
                ubicacionInput.classList.add('mobile-input');
            }

            autocompleteInstances[inputId] = autocomplete;
        } catch (error) {
            console.log('Autocompletado no disponible:', error);
        }
    }

    // Evento: Botón de geolocalización GPS
    geoBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showNotification('Tu navegador no soporta geolocalización', 'error');
            return;
        }

        // Loading state mejorado
        geoBtn.classList.add('loading');
        geoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        geoBtn.disabled = true;

        // Detectar si es móvil para timeout más largo
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Opciones para máxima precisión GPS (importante para móviles)
        const geoOptions = {
            enableHighAccuracy: true,
            timeout: isMobile ? 30000 : 15000, // 30s en móvil, 15s en desktop
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;

                console.log(`Ubicación GPS: ${lat}, ${lng} (precisión: ${accuracy}m)`);

                // Guardar coordenadas
                if (coordenadasInput) {
                    coordenadasInput.value = `${lat},${lng}`;
                }

                // Crear/actualizar mapa con marcador arrastrable
                createOrUpdateMap(mapId, lat, lng, ubicacionInput, coordenadasInput, mapContainer);

                // Obtener dirección
                const direccion = await reverseGeocode(lat, lng);
                if (direccion) {
                    ubicacionInput.value = direccion;
                } else {
                    ubicacionInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                }

                // Success state
                geoBtn.classList.remove('loading');
                geoBtn.classList.add('success');
                geoBtn.innerHTML = '<i class="fas fa-check"></i>';

                // Aviso si precision es baja (ubicacion por IP en vez de GPS)
                if (accuracy > 1000) {
                    showNotification('Ubicacion aproximada por IP. Para mejor precision, ingresa tu direccion manualmente o activa el GPS.', 'warning');
                    ubicacionInput.placeholder = 'Ingresa tu direccion para mayor precision';
                } else if (accuracy > 100) {
                    showNotification(`Ubicacion aproximada (${Math.round(accuracy)}m). Ajusta el marcador si es necesario.`, 'warning');
                }

                setTimeout(() => {
                    geoBtn.classList.remove('success');
                    geoBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
                    geoBtn.disabled = false;
                }, 2000);
            },
            (error) => {
                geoBtn.classList.remove('loading');
                geoBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
                geoBtn.disabled = false;

                let mensaje = 'No se pudo obtener la ubicación';
                if (error.code === 1) {
                    mensaje = 'Permiso de ubicación denegado. Actívalo en configuración de tu navegador.';
                }
                if (error.code === 2) {
                    mensaje = 'GPS no disponible. Verifica que esté activado en tu dispositivo.';
                }
                if (error.code === 3) {
                    mensaje = isMobile
                        ? 'Tiempo de espera agotado. Verifica tu señal GPS y vuelve a intentar.'
                        : 'Tiempo de espera agotado. Intenta de nuevo.';
                }

                showNotification(mensaje, 'error');

                // Mostrar hint para ingresar manualmente
                setTimeout(() => {
                    if (ubicacionInput) {
                        ubicacionInput.placeholder = 'Ingresa tu ubicación manualmente';
                        ubicacionInput.focus();
                    }
                }, 500);
            },
            geoOptions
        );
    });
}

// =====================================================
// COUNTDOWN TIMER FOR SUMMER OFFERS
// =====================================================

function initCountdownTimer() {
    // Fecha límite: 31 de enero 2026 a las 23:59:59 hora Chile
    const endDate = new Date('2026-01-31T23:59:59-03:00').getTime();

    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minutesEl = document.getElementById('countdown-minutes');
    const secondsEl = document.getElementById('countdown-seconds');
    const countdownBigEl = document.getElementById('offerCountdownBig');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
        return;
    }

    // Track previous values for animation
    let prevSeconds = null;
    let prevMinutes = null;
    let prevHours = null;
    let prevDays = null;

    // Check if GSAP is available
    const hasGSAP = typeof gsap !== 'undefined';

    function animateNumberChange(element, isSeconds = false) {
        if (!hasGSAP) return;

        // Create a subtle pulse and scale animation
        gsap.fromTo(element,
            {
                scale: 1.15,
                color: '#ff9800'
            },
            {
                scale: 1,
                color: '#ffffff',
                duration: isSeconds ? 0.3 : 0.5,
                ease: 'back.out(2)'
            }
        );

        // Add a subtle glow effect on the parent container
        const parent = element.closest('.countdown-item-big');
        if (parent) {
            gsap.fromTo(parent,
                {
                    borderColor: 'rgba(255, 152, 0, 0.35)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 20px rgba(255, 152, 0, 0.3)'
                },
                {
                    borderColor: 'rgba(255, 152, 0, 0.12)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.03) inset',
                    duration: 0.6,
                    ease: 'power2.out'
                }
            );
        }
    }

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endDate - now;

        if (distance < 0) {
            // Oferta terminada
            if (countdownBigEl) {
                countdownBigEl.innerHTML = '<p class="countdown-expired"><i class="fas fa-clock"></i> ¡Oferta finalizada!</p>';
            }
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Update seconds with animation
        if (prevSeconds !== null && seconds !== prevSeconds) {
            animateNumberChange(secondsEl, true);
        }
        secondsEl.textContent = seconds.toString().padStart(2, '0');
        prevSeconds = seconds;

        // Update minutes with animation
        if (prevMinutes !== null && minutes !== prevMinutes) {
            animateNumberChange(minutesEl, false);
        }
        minutesEl.textContent = minutes.toString().padStart(2, '0');
        prevMinutes = minutes;

        // Update hours with animation
        if (prevHours !== null && hours !== prevHours) {
            animateNumberChange(hoursEl, false);
        }
        hoursEl.textContent = hours.toString().padStart(2, '0');
        prevHours = hours;

        // Update days with animation
        if (prevDays !== null && days !== prevDays) {
            animateNumberChange(daysEl, false);
        }
        daysEl.textContent = days.toString().padStart(2, '0');
        prevDays = days;
    }

    // Actualizar inmediatamente
    updateCountdown();

    // Actualizar cada segundo
    setInterval(updateCountdown, 1000);

    // Initial entrance animation for countdown container
    if (hasGSAP && countdownBigEl) {
        gsap.fromTo(countdownBigEl,
            {
                opacity: 0,
                y: 30,
                scale: 0.95
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: 'power3.out',
                delay: 0.3
            }
        );

        // Animate each countdown item
        const items = countdownBigEl.querySelectorAll('.countdown-item-big');
        gsap.fromTo(items,
            {
                opacity: 0,
                y: 20
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'back.out(1.7)',
                delay: 0.5
            }
        );
    }
}

// =====================================================
// GSAP ANIMATIONS FOR SUMMER OFFERS & REVIEWS
// =====================================================

function initOfferAnimations() {
    if (typeof gsap === 'undefined') {
        console.log('GSAP not loaded, skipping offer animations');
        return;
    }

    // Animate Offer Banner entrance
    const offerBanner = document.querySelector('.offer-banner');
    if (offerBanner) {
        gsap.from(offerBanner, {
            scrollTrigger: {
                trigger: offerBanner,
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            scale: 0,
            opacity: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.5)'
        });
    }

    // Animate Offer Badges on model cards
    const offerBadges = document.querySelectorAll('.offer-badge');
    offerBadges.forEach((badge, index) => {
        // Entrance animation
        gsap.from(badge, {
            scrollTrigger: {
                trigger: badge,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            x: -100,
            opacity: 0,
            rotation: -20,
            duration: 0.6,
            delay: index * 0.1,
            ease: 'back.out(1.7)'
        });

        // Continuous pulse animation
        gsap.to(badge, {
            scale: 1.05,
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut',
            delay: index * 0.2
        });

        // Add hover interaction
        const modelCard = badge.closest('.model-card');
        if (modelCard) {
            modelCard.addEventListener('mouseenter', () => {
                gsap.to(badge, {
                    scale: 1.15,
                    rotation: 5,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            modelCard.addEventListener('mouseleave', () => {
                gsap.to(badge, {
                    scale: 1,
                    rotation: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        }
    });

    // Animate offer model cards entrance
    const offerCards = document.querySelectorAll('.model-card-offer');
    offerCards.forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            delay: index * 0.15,
            ease: 'power3.out'
        });

        // Add glow effect on scroll
        gsap.to(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            boxShadow: '0 10px 40px rgba(255, 107, 53, 0.15)',
            duration: 0.5,
            ease: 'power2.out'
        });
    });
}

function initReviewAnimations() {
    if (typeof gsap === 'undefined') {
        console.log('GSAP not loaded, skipping review animations');
        return;
    }

    // Animate review cards
    const reviewCards = document.querySelectorAll('.review-card');
    reviewCards.forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 60,
            opacity: 0,
            duration: 0.8,
            delay: index * 0.1,
            ease: 'power3.out'
        });

        // Animate stars inside cards
        const stars = card.querySelectorAll('.review-stars i');
        stars.forEach((star, starIndex) => {
            gsap.from(star, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                },
                scale: 0,
                rotation: 180,
                opacity: 0,
                duration: 0.4,
                delay: index * 0.1 + starIndex * 0.05,
                ease: 'back.out(2)'
            });
        });
    });

    // Animate review stats
    const statItems = document.querySelectorAll('.reviews-stats .stat-item');
    statItems.forEach((stat, index) => {
        gsap.from(stat, {
            scrollTrigger: {
                trigger: stat,
                start: 'top 90%',
                toggleActions: 'play none none none'
            },
            scale: 0,
            opacity: 0,
            duration: 0.6,
            delay: index * 0.15,
            ease: 'back.out(1.7)'
        });

        // Animate numbers with counter effect
        const statNumber = stat.querySelector('.stat-number');
        if (statNumber) {
            const finalText = statNumber.textContent;
            const hasPlus = finalText.includes('+');
            const numericPart = parseFloat(finalText.replace(/[^0-9.]/g, ''));

            if (!isNaN(numericPart)) {
                statNumber.textContent = '0';

                gsap.to(statNumber, {
                    scrollTrigger: {
                        trigger: stat,
                        start: 'top 85%',
                        toggleActions: 'play none none none'
                    },
                    textContent: numericPart,
                    duration: 2,
                    delay: index * 0.15 + 0.3,
                    snap: { textContent: numericPart > 100 ? 100 : 0.1 },
                    onUpdate: function() {
                        const current = parseFloat(this.targets()[0].textContent);
                        if (finalText.includes('m²')) {
                            statNumber.textContent = Math.round(current) + ' m²';
                        } else if (hasPlus) {
                            statNumber.textContent = '+' + (current >= 1000 ? current.toLocaleString() : current.toFixed(1));
                        } else {
                            statNumber.textContent = current.toFixed(1);
                        }
                    },
                    ease: 'power2.out'
                });
            }
        }
    });
}

// Initialize all animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize countdown timer for summer offers
    initCountdownTimer();

    // Initialize offer and review animations
    initOfferAnimations();
    initReviewAnimations();

    // Initialize geolocation for all forms
    // Quote Modal form
    setupGeolocation('getLocationBtn', 'ubicacionInput', 'coordenadasInput', 'mapContainerQuote', 'mapQuote');
    // Contact form (Comencemos tu proyecto)
    setupGeolocation('getLocationBtnContact', 'ubicacion', 'coordenadasContact', 'mapContainerContact', 'mapContact');
    // Brochure form (Cotizacion Gratis)
    setupGeolocation('getLocationBtnBrochure', 'ubicacionBrochure', 'coordenadasBrochure', 'mapContainerBrochure', 'mapBrochure');
    // Quote Section form (Cotizacion con Video)
    setupGeolocation('getQuoteLocation', 'quoteUbicacion', 'quoteCoords', 'quoteMapContainer', 'quoteMap');
    // Modal Email Form (Cotizar por Correo en ficha de modelo)
    setupGeolocation('emailFormGeoBtn', 'emailFormUbicacion', 'emailFormCoordenadas', 'emailFormMapContainer', 'emailFormMap');
    // Modal PDF Form (Ficha Tecnica en ficha de modelo)
    setupGeolocation('pdfFormGeoBtn', 'pdfFormUbicacion', 'pdfFormCoordenadas', 'pdfFormMapContainer', 'pdfFormMap');

    // =============================================
    // TOGGLE "OTROS MODELOS" (EXPANDIBLE/COLAPSABLE)
    // =============================================
    const btnExpandModels = document.getElementById('btnExpandModels');
    const modelsOtherContent = document.getElementById('modelsOtherContent');

    if (btnExpandModels && modelsOtherContent) {
        btnExpandModels.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            const icon = this.querySelector('.expand-icon');
            const text = this.querySelector('.expand-text');

            if (!isExpanded) {
                // Expandir
                modelsOtherContent.style.display = 'block';
                modelsOtherContent.setAttribute('aria-hidden', 'false');
                this.setAttribute('aria-expanded', 'true');
                icon.style.transform = 'rotate(180deg)';
                text.textContent = 'Ocultar Modelos Adicionales';

                // Smooth scroll al botón para que se vea el contenido expandido
                setTimeout(() => {
                    this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            } else {
                // Colapsar
                modelsOtherContent.style.display = 'none';
                modelsOtherContent.setAttribute('aria-hidden', 'true');
                this.setAttribute('aria-expanded', 'false');
                icon.style.transform = 'rotate(0deg)';
                text.textContent = 'Ver Modelos Adicionales';
            }
        });
    }

    // =============================================
    // PDF MODAL FUNCTIONALITY
    // =============================================

    // Datos de PDF por modelo
    const pdfData = {
        '36m2-2a': {
            title: 'Ficha Técnica - Casa 36m² 2 Aguas',
            model_name: 'Casa 36m² 2 Aguas',
            pdf_path: 'Imagenes/Fichas Tecnicas/36 2a-20260104T102238Z-3-001/36 2a/Ficha tecnica - 36mt 2a Kit básico.pdf'
        },
        '54m2-2a': {
            title: 'Ficha Técnica - Casa 54m² 2 Aguas',
            model_name: 'Casa 54m² 2 Aguas',
            pdf_path: 'Imagenes/Fichas Tecnicas/54 2a-20260104T102248Z-3-001/54 2a/Ficha tecnica - 54mt 2a Kit básico.pdf'
        },
        '72m2-2a': {
            title: 'Ficha Técnica - Casa 72m² 2 Aguas',
            model_name: 'Casa 72m² 2 Aguas',
            pdf_path: 'Imagenes/Fichas Tecnicas/72 2a-20260104T102253Z-3-001/72 2a/Ficha tecnica - 72mt 2a Kit básico.pdf'
        }
    };

    // Form submission handler
    const pdfForm = document.getElementById('pdfDownloadForm');
    if (pdfForm) {
        pdfForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = {
                model_id: document.getElementById('pdfModelId').value,
                model_name: document.getElementById('pdfModelName').value,
                pdf_path: document.getElementById('pdfPath').value,
                nombre: document.getElementById('pdfNombre').value,
                email: document.getElementById('pdfEmail').value,
                telefono: document.getElementById('pdfTelefono').value
            };

            // Validar email
            if (!isValidEmail(formData.email)) {
                showNotification('Por favor ingresa un email válido', 'error');
                return;
            }

            // Validar teléfono chileno
            if (!isValidChileanPhone(formData.telefono)) {
                showNotification('Por favor ingresa un teléfono válido (ej: +56 9 XXXX XXXX)', 'error');
                return;
            }

            // Cambiar botón a estado de carga
            const submitBtn = pdfForm.querySelector('.pdf-submit-btn');
            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Verificando...</span>';
            submitBtn.disabled = true;

            try {
                // Obtener token de reCAPTCHA v3
                const recaptchaToken = await getRecaptchaToken('pdf_download');
                if (recaptchaToken) {
                    formData.recaptcha_token = recaptchaToken;
                }

                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Enviando...</span>';

                const response = await fetch(PDF_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    showNotification(result.email_sent ? '¡Ficha técnica enviada! Revisa tu email' : 'Solicitud recibida. Te contactaremos por WhatsApp', 'success');
                    closePDFModal();
                    pdfForm.reset();
                } else {
                    showNotification(result.message || 'Error al enviar', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al enviar. Intenta nuevamente', 'error');
            } finally {
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
            }
        });
    }

    // Helper functions
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidChileanPhone(phone) {
        const cleaned = phone.replace(/[\s\-()]/g, '');
        return /^(\+?56\s?)?9\d{8}$/.test(cleaned);
    }
});

// =============================================
// FUNCIONES GLOBALES PDF MODAL
// =============================================

function openPDFModal(modelId) {
    const modal = document.getElementById('pdfModal');
    const pdfData = {
        '36m2-2a': {
            title: 'Ficha Técnica - Casa 36m² 2 Aguas',
            model_name: 'Casa 36m² 2 Aguas',
            pdf_path: 'Imagenes/Fichas Tecnicas/36 2a-20260104T102238Z-3-001/36 2a/Ficha tecnica - 36mt 2a Kit básico.pdf'
        },
        '54m2-2a': {
            title: 'Ficha Técnica - Casa 54m² 2 Aguas',
            model_name: 'Casa 54m² 2 Aguas',
            pdf_path: 'Imagenes/Fichas Tecnicas/54 2a-20260104T102248Z-3-001/54 2a/Ficha tecnica - 54mt 2a Kit básico.pdf'
        },
        '72m2-2a': {
            title: 'Ficha Técnica - Casa 72m² 2 Aguas',
            model_name: 'Casa 72m² 2 Aguas',
            pdf_path: 'Imagenes/Fichas Tecnicas/72 2a-20260104T102253Z-3-001/72 2a/Ficha tecnica - 72mt 2a Kit básico.pdf'
        }
    };

    const data = pdfData[modelId];
    if (data && modal) {
        document.getElementById('pdfModalTitle').textContent = data.title;
        document.getElementById('pdfModelId').value = modelId;
        document.getElementById('pdfModelName').value = data.model_name;
        document.getElementById('pdfPath').value = data.pdf_path;

        // ANALYTICS: Track PDF request
        trackPDFRequest(modelId, data.model_name);

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closePDFModal() {
    const modal = document.getElementById('pdfModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// =============================================
// GSAP ANIMATIONS
// =============================================

// Registrar ScrollTrigger plugin
if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
    gsap.registerPlugin(ScrollTrigger);

    // Animación contador de estadísticas
    function animateCounter(element) {
        const target = parseInt(element.getAttribute('data-count'));
        gsap.to(element, {
            innerText: target,
            duration: 2,
            ease: 'power1.out',
            snap: { innerText: 1 },
            scrollTrigger: {
                trigger: element,
                start: 'top 80%',
                once: true
            }
        });
    }

    // Inicializar animaciones cuando GSAP esté listo
    document.addEventListener('DOMContentLoaded', function() {
        // Animar contadores de estadísticas
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => animateCounter(stat));

        // Fade in de características
        gsap.from('.intro-feature', {
            scrollTrigger: {
                trigger: '.intro-features',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            y: 50,
            opacity: 0,
            duration: 0.6,
            stagger: 0.2,
            ease: 'power2.out'
        });

        // Animación de entrada del título
        gsap.from('.intro-title', {
            scrollTrigger: {
                trigger: '.intro-title',
                start: 'top 85%'
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        });

        // Animación de la tarjeta de estadísticas
        gsap.from('.intro-stats-card', {
            scrollTrigger: {
                trigger: '.intro-stats-card',
                start: 'top 80%'
            },
            scale: 0.9,
            opacity: 0,
            duration: 0.8,
            ease: 'back.out(1.2)'
        });

        // Animación de modelos principales
        gsap.from('.model-card-priority', {
            scrollTrigger: {
                trigger: '.models-grid-main',
                start: 'top 75%'
            },
            y: 60,
            opacity: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: 'power2.out'
        });

        // Animación de headers elegantes
        gsap.from('.section-header-elegant', {
            scrollTrigger: {
                trigger: '.section-header-elegant',
                start: 'top 80%'
            },
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        });

        // Animación de line headers
        gsap.from('.models-line-header', {
            scrollTrigger: {
                trigger: '.models-other-section',
                start: 'top 75%'
            },
            x: -50,
            opacity: 0,
            duration: 0.6,
            stagger: 0.2,
            ease: 'power2.out'
        });

        // Animación sección intro brief
        gsap.from('.intro-brief-title', {
            scrollTrigger: {
                trigger: '.intro-brief',
                start: 'top 80%'
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        });

        gsap.from('.intro-brief-text', {
            scrollTrigger: {
                trigger: '.intro-brief',
                start: 'top 80%'
            },
            y: 20,
            opacity: 0,
            duration: 0.8,
            delay: 0.2,
            ease: 'power2.out'
        });

        // Animación custom design section
        gsap.from('.custom-design-title', {
            scrollTrigger: {
                trigger: '.custom-design-section',
                start: 'top 75%'
            },
            x: -50,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        });

        gsap.from('.showcase-card', {
            scrollTrigger: {
                trigger: '.custom-design-section',
                start: 'top 75%'
            },
            x: 50,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        });
    });
}

// =============================================
// SHOWCASE CAROUSEL (Línea 2026)
// =============================================

const showcaseImages = [
    {
        src: 'Imagenes/Nuevos Modelos/54m2 1A.png',
        alt: 'Casa 54m² Un Agua - Línea 2026',
        size: '54 m²',
        roof: 'UN AGUA'
    },
    {
        src: 'Imagenes/Nuevos Modelos/36m2 1A.png',
        alt: 'Casa 36m² Un Agua - Línea 2026',
        size: '36 m²',
        roof: 'UN AGUA'
    },
    {
        src: 'Imagenes/Nuevos Modelos/36m2 2A.png',
        alt: 'Casa Terra 36m² Dos Aguas - Línea 2026',
        size: '36 m²',
        roof: 'DOS AGUAS'
    }
];

let currentShowcaseIndex = 0;

function updateShowcase(index) {
    const image = document.querySelector('.showcase-image img');
    const sizeEl = document.querySelector('.showcase-size');
    const roofEl = document.querySelector('.showcase-roof');
    const dots = document.querySelectorAll('.showcase-dots .dot');
    const imageContainer = document.querySelector('.showcase-image');

    if (image && sizeEl && roofEl) {
        const showcase = showcaseImages[index];

        // Añadir clase para fade out
        if (imageContainer) {
            imageContainer.style.opacity = '0';
            imageContainer.style.transition = 'opacity 0.3s ease';
        }

        // Actualizar contenido después de fade out
        setTimeout(() => {
            image.src = showcase.src;
            image.alt = showcase.alt;
            sizeEl.textContent = showcase.size;
            roofEl.textContent = showcase.roof;

            // Fade in
            if (imageContainer) {
                imageContainer.style.opacity = '1';
            }
        }, 300);

        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
}

function nextShowcase() {
    currentShowcaseIndex = (currentShowcaseIndex + 1) % showcaseImages.length;
    updateShowcase(currentShowcaseIndex);
}

function previousShowcase() {
    currentShowcaseIndex = (currentShowcaseIndex - 1 + showcaseImages.length) % showcaseImages.length;
    updateShowcase(currentShowcaseIndex);
}

// Inicializar carrusel de showcase
function initShowcaseCarousel() {
    const showcaseSection = document.querySelector('.showcase-image');
    const prevBtn = document.querySelector('.showcase-nav.prev');
    const nextBtn = document.querySelector('.showcase-nav.next');

    if (!showcaseSection) return;

    // Event listeners para botones
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            previousShowcase();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            nextShowcase();
        });
    }

    // Click en dots
    const dots = document.querySelectorAll('.showcase-dots .dot');
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            currentShowcaseIndex = index;
            updateShowcase(index);
        });
    });

    // Auto-advance cada 5 segundos
    setInterval(nextShowcase, 5000);
}

// Exponer funciones globalmente
window.nextShowcase = nextShowcase;
window.previousShowcase = previousShowcase;

// =============================================
// CATÁLOGO TABS
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    const catalogTabs = document.querySelectorAll('.catalog-tab');
    const catalogContents = document.querySelectorAll('.catalog-content');

    if (catalogTabs.length > 0) {
        catalogTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetLine = this.getAttribute('data-line');

                // Remove active class from all tabs
                catalogTabs.forEach(t => t.classList.remove('active'));

                // Add active class to clicked tab
                this.classList.add('active');

                // Hide all content sections
                catalogContents.forEach(content => {
                    content.classList.remove('active');
                });

                // Show target content section
                const targetContent = document.querySelector(`.catalog-content[data-content="${targetLine}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    // GSAP animations for catalog cards
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.from('.catalog-card', {
            scrollTrigger: {
                trigger: '.catalog-grid',
                start: 'top 80%'
            },
            y: 40,
            opacity: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out'
        });

        gsap.from('.catalog-tab', {
            scrollTrigger: {
                trigger: '.catalog-tabs',
                start: 'top 85%'
            },
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out'
        });

        gsap.from('.line-intro', {
            scrollTrigger: {
                trigger: '.catalog-content.active',
                start: 'top 80%'
            },
            x: -30,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out'
        });
    }

    // Catalog Contact Form Handler
    const catalogContactForm = document.getElementById('catalogContactForm');
    if (catalogContactForm) {
        catalogContactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(catalogContactForm);
            const nombre = formData.get('nombre');
            const telefono = formData.get('telefono');

            // Mostrar confirmación
            const button = catalogContactForm.querySelector('button');
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> <span>¡Solicitud Enviada!</span>';
            button.disabled = true;
            button.style.background = '#22c55e';

            // Enviar datos por WhatsApp
            const mensaje = encodeURIComponent(`Hola, soy ${nombre}. Me gustaría recibir una llamada para conocer más sobre sus casas prefabricadas. Mi teléfono es: ${telefono}`);

            setTimeout(() => {
                window.open(`https://wa.me/56998654665?text=${mensaje}`, '_blank');

                // Resetear formulario después de un momento
                setTimeout(() => {
                    catalogContactForm.reset();
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                    button.style.background = '';
                }, 2000);
            }, 1000);
        });
    }

    // Quote Section Form Handler - Cotización por Correo y WhatsApp
    const quoteForm = document.getElementById('quoteForm');
    const btnQuoteEmail = document.getElementById('btnQuoteEmail');
    const btnQuoteWhatsApp = document.getElementById('btnQuoteWhatsApp');

    // Función para obtener datos del formulario
    function getQuoteFormData() {
        const formData = new FormData(quoteForm);
        const modeloSelect = document.getElementById('quoteModelo');

        return {
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            modelo: modeloSelect.options[modeloSelect.selectedIndex]?.text || formData.get('modelo'),
            ubicacion: formData.get('ubicacion') || 'No especificada',
            coordenadas: formData.get('coordenadas') || ''
        };
    }

    // Función para validar el formulario
    function validateQuoteForm() {
        const data = getQuoteFormData();

        if (!data.nombre || !data.telefono) {
            showNotification('Por favor, completa nombre y teléfono', 'error');
            return false;
        }

        return true;
    }

    // Función para resetear el formulario
    function resetQuoteForm() {
        quoteForm.reset();
        const mapContainer = document.getElementById('quoteMapContainer');
        if (mapContainer) {
            mapContainer.style.display = 'none';
        }
    }

    // Cotización por CORREO (submit del form)
    async function handleQuoteEmailSubmit(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!validateQuoteForm()) return;

        const data = getQuoteFormData();
        const button = btnQuoteEmail;
        const originalHTML = button.innerHTML;

        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Enviando...</span>';
        button.disabled = true;

        try {
            // Obtener token de reCAPTCHA
            const recaptchaToken = await getRecaptchaToken('quote_email');

            const response = await fetch(SMTP_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    form_type: 'cotizacion',
                    nombre: data.nombre,
                    email: data.email,
                    telefono: data.telefono,
                    modelo: data.modelo,
                    ubicacion: data.ubicacion,
                    coordenadas: data.coordenadas,
                    mensaje: 'Solicitud de cotización enviada desde el formulario web.',
                    recaptcha_token: recaptchaToken,
                    ...getSavedUTMParams()
                })
            });

            const result = await response.json();

            if (result.success) {
                button.innerHTML = '<i class="fas fa-check"></i> <span>¡Enviado!</span>';
                button.style.background = '#22c55e';
                showNotification('¡Cotización enviada! Te contactaremos pronto por correo.', 'success');

                setTimeout(() => {
                    resetQuoteForm();
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                    button.style.background = '';
                }, 3000);
            } else {
                throw new Error(result.message || 'Error al enviar');
            }
        } catch (error) {
            button.innerHTML = originalHTML;
            button.disabled = false;
            showNotification('Error al enviar. Intenta nuevamente.', 'error');
        }
    }

    // Registrar handlers para el formulario de cotización
    if (quoteForm) {
        quoteForm.addEventListener('submit', handleQuoteEmailSubmit);
    }
    if (btnQuoteEmail) {
        btnQuoteEmail.addEventListener('click', handleQuoteEmailSubmit);
    }

    // Cotización por WHATSAPP
    if (btnQuoteWhatsApp) {
        btnQuoteWhatsApp.addEventListener('click', function(e) {
            e.preventDefault();

            if (!validateQuoteForm()) return;

            const data = getQuoteFormData();
            const button = btnQuoteWhatsApp;
            const originalHTML = button.innerHTML;

            button.innerHTML = '<i class="fab fa-whatsapp"></i> <span>Abriendo WhatsApp...</span>';
            button.disabled = true;

            // Construir mensaje para WhatsApp
            let mensaje = `*Nueva Cotización Chile Home*%0A%0A`;
            mensaje += `*Nombre:* ${data.nombre}%0A`;
            mensaje += `*Email:* ${data.email}%0A`;
            mensaje += `*Teléfono:* ${data.telefono}%0A`;
            mensaje += `*Modelo:* ${data.modelo}%0A`;
            mensaje += `*Ubicación:* ${data.ubicacion}%0A`;
            if (data.coordenadas) {
                mensaje += `*Ver en mapa:* https://www.google.com/maps?q=${data.coordenadas}`;
            }

            // Abrir WhatsApp con el número correcto
            window.open(`https://wa.me/56998654665?text=${mensaje}`, '_blank');

            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-check"></i> <span>¡Enviado!</span>';
                button.style.background = '#22c55e';

                setTimeout(() => {
                    resetQuoteForm();
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                    button.style.background = '';
                }, 2000);
            }, 1000);
        });
    }
});


