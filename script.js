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

    // Scroll effect - header hide/show
    let lastScroll = 0;
    let hideThreshold = 30; // Scroll down to hide
    let showThreshold = 10; // Scroll up to show (more responsive)

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add scrolled class when past 100px
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
            header.classList.remove('header-hidden');
        }

        // Hide/show header based on scroll direction (only after 150px)
        if (currentScroll > 150) {
            if (currentScroll > lastScroll + hideThreshold) {
                // Scrolling down - hide header
                header.classList.add('header-hidden');
                lastScroll = currentScroll;
            } else if (currentScroll < lastScroll - showThreshold) {
                // Scrolling up - show header immediately
                header.classList.remove('header-hidden');
                lastScroll = currentScroll;
            }
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
const SMTP_ENDPOINT = 'send-email.php';

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
                mensaje: contactForm.querySelector('#mensaje').value.trim()
            };

            if (!formData.nombre || !formData.email || !formData.telefono || !formData.modelo || !formData.mensaje) {
                showNotification('Por favor, completa todos los campos', 'error');
                return;
            }

            if (!isValidEmail(formData.email)) {
                showNotification('Por favor, ingresa un email valido', 'error');
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
                modelo: modeloSelect ? modeloSelect.value : ''
            };

            if (!formData.nombre || !formData.email || !formData.telefono) {
                showNotification('Por favor, completa todos los campos', 'error');
                return;
            }

            if (!isValidEmail(formData.email)) {
                showNotification('Por favor, ingresa un email valido', 'error');
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
        submitBtn.innerHTML = '<span>Enviando...</span>';
    }

    try {
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
    notification.className = 'notification';
    notification.innerHTML = message;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 40px;
        padding: 1.25rem 2rem;
        background: ${type === 'success' ? '#c9a86c' : '#ef4444'};
        color: ${type === 'success' ? '#0a0a0a' : '#fff'};
        font-size: 0.9rem;
        letter-spacing: 0.05em;
        z-index: 9999;
        animation: slideIn 0.4s ease;
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
        name: '36 m²',
        style: 'Un Agua',
        roofType: '1 Agua',
        badge: 'Línea 2026',
        image: 'Imagenes/Nuevos Modelos/36m2 1A.png',
        bedrooms: '1',
        bathrooms: '1',
        area: '36',
        material: 'Paneles Pino',
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino',
            'Tabiquería 1½×3',
            'Cubiertas de zinc',
            'Cerchas de pino tradicionales'
        ]
    },
    'terra-36': {
        name: 'Terra 36 m²',
        style: 'Dos Aguas',
        roofType: '2 Aguas',
        badge: 'Línea 2026',
        image: 'Imagenes/Nuevos Modelos/36m2 2A.png',
        bedrooms: '1',
        bathrooms: '1',
        area: '36',
        material: 'Paneles Pino',
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino',
            'Tabiquería 1½×3',
            'Cubiertas de zinc',
            'Cerchas de pino tradicionales'
        ]
    },
    '54-1a': {
        name: '54 m²',
        style: 'Un Agua',
        roofType: '1 Agua',
        badge: 'Línea 2026',
        image: 'Imagenes/Nuevos Modelos/54m2 1A.png',
        bedrooms: '2',
        bathrooms: '1',
        area: '54',
        material: 'Paneles Pino',
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino',
            'Tabiquería 1½×3',
            'Cubiertas de zinc',
            'Cerchas de pino tradicionales'
        ]
    },
    'clasica-36': {
        name: '36 m² | 2 Aguas',
        style: 'Compacto',
        roofType: '2 Aguas',
        badge: 'Línea Clásica',
        image: 'Imagenes/Modelos/36m2 2A/36 2A/36m2 2A H.png',
        bedrooms: '1',
        bathrooms: '1',
        area: '36',
        material: 'Paneles Pino',
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino (natural en bruto)',
            'Tabiquería 1½×3',
            'Cubiertas de zinc',
            'Caballetes de zinc de 2 mt',
            'Cerchas de pino tradicionales'
        ]
    },
    'clasica-54': {
        name: '54 m² | 2 Aguas',
        style: 'Tradicional',
        roofType: '2 Aguas',
        badge: 'Línea Clásica',
        image: 'Imagenes/Modelos/36m2 2A/webp/54 2Ablanca/54 2A_Blanca.webp',
        bedrooms: '2',
        bathrooms: '1',
        area: '54',
        material: 'Paneles Pino',
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino (natural en bruto)',
            'Tabiquería 1½×3',
            'Cubiertas de zinc',
            'Caballetes de zinc de 2 mt',
            'Cerchas de pino tradicionales 3,4×1 de altura',
            'Costaneras de tapas pino 1×4'
        ]
    },
    'clasica-54-6a': {
        name: '54 m² | 6 Aguas Siding',
        style: 'Siding',
        roofType: '6 Aguas',
        badge: 'Línea Clásica',
        image: 'Imagenes/Modelos/36m2 2A/webp/54.6a Siding/54 6A.webp',
        bedrooms: '2',
        bathrooms: '1',
        area: '54',
        material: 'Paneles Pino',
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino (natural en bruto)',
            'Tabiquería 1½×3',
            'Cubiertas de zinc',
            'Caballetes de zinc de 2 mt',
            'Cerchas de pino tradicionales 3,4×1 de altura',
            'Costaneras de tapas pino 1×4'
        ]
    },
    'clasica-72': {
        name: '72 m² | 6 Aguas',
        style: 'Espacioso',
        roofType: '6 Aguas',
        badge: 'Línea Clásica',
        image: 'Imagenes/Modelos/36m2 2A/webp/72.6a/72m 6A.webp',
        bedrooms: '3',
        bathrooms: '2',
        area: '72',
        material: 'Paneles Pino',
        features: [
            'Paneles exteriores e interiores',
            'Forro exterior en media luna de pino (natural en bruto)',
            'Tabiquería 1½×3',
            'Cubiertas de zinc',
            'Caballetes de zinc de 2 mt',
            'Cerchas de pino tradicionales 3,4×1 de altura',
            'Costaneras de tapas pino 1×4'
        ]
    },
    'clasica-108': {
        name: '108 m²',
        style: 'Premium',
        roofType: '6 Aguas',
        badge: 'Línea Clásica',
        image: 'Imagenes/Modelos/36m2 2A/54 2A/freepik__quiero-la-foto-del-angulo-izquierdo-de-la-casaimg1__52838.png',
        bedrooms: '4',
        bathrooms: '2',
        area: '108',
        material: 'Paneles Pino',
        features: [
            'Paneles exteriores e interiores premium',
            'Forro exterior en media luna de pino (natural en bruto)',
            'Tabiquería 1½×3 reforzada',
            'Cubiertas de zinc de alta calidad',
            'Caballetes de zinc de 2 mt',
            'Cerchas de pino tradicionales reforzadas',
            'Costaneras de tapas pino 1×4',
            'Acabados de primera calidad'
        ]
    }
};

function openModelModal(modelId) {
    const modal = document.getElementById('modelModal');
    const data = modelData[modelId];

    if (!modal || !data) return;

    // Populate modal content
    document.getElementById('modalImage').src = data.image;
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
        whatsappEl.href = `https://wa.me/56964169548?text=Hola%2C%20me%20interesa%20el%20modelo%20${modelName}`;
    }

    // Email link with model name
    const emailEl = document.getElementById('modalEmail');
    if (emailEl) {
        const modelName = encodeURIComponent(`${data.name} ${data.badge}`);
        const subject = encodeURIComponent(`Cotización Casa Prefabricada ${data.name} ${data.badge}`);
        const body = encodeURIComponent(`Hola,\n\nMe interesa solicitar una cotización para el modelo ${data.name} de la ${data.badge}.\n\nQuedo atento a su respuesta.\n\nSaludos.`);
        emailEl.href = `mailto:contacto@chilehome.cl?subject=${subject}&body=${body}`;
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
const WHATSAPP_NUMBER = '56964169548';

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
            addBotMessage('Puedes contactarnos directamente:<br>• WhatsApp: +56 9 6416 9548<br>• Email: contacto@chilehome.cl');
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
    const modal = document.getElementById('quoteModal');
    const form = document.getElementById('quoteForm');

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
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
                mensaje: form.querySelector('textarea[name="mensaje"]').value.trim() || 'Sin mensaje adicional'
            };

            if (!formData.nombre || !formData.email || !formData.telefono || !formData.modelo || !formData.ubicacion) {
                showNotification('Por favor, completa todos los campos requeridos', 'error');
                return;
            }

            if (!isValidEmail(formData.email)) {
                showNotification('Por favor, ingresa un email válido', 'error');
                return;
            }

            const submitBtn = form.querySelector('.quote-submit-btn');
            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Enviando...</span>';

            try {
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
