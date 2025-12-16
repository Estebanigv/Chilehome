/**
 * Chile Home — Premium Dark Design
 * JavaScript Interactions
 */

'use strict';

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
});

// Loader
function initLoader() {
    const loader = document.getElementById('loader');

    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 1200);
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

    // Scroll effect
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
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

    // Reveal on scroll
    const revealElements = document.querySelectorAll(
        '.project-card, .feature, .step, .section-header'
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

// Form Handling
function initFormHandling() {
    const form = document.getElementById('contactForm');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            nombre: form.querySelector('#nombre').value.trim(),
            email: form.querySelector('#email').value.trim(),
            telefono: form.querySelector('#telefono').value.trim(),
            modelo: form.querySelector('#modelo').value,
            mensaje: form.querySelector('#mensaje').value.trim()
        };

        // Validation
        if (!formData.nombre || !formData.email || !formData.telefono || !formData.modelo || !formData.mensaje) {
            showNotification('Por favor, completa todos los campos', 'error');
            return;
        }

        if (!isValidEmail(formData.email)) {
            showNotification('Por favor, ingresa un email válido', 'error');
            return;
        }

        const submitBtn = form.querySelector('.btn-submit');
        const originalHTML = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Enviando...</span>';

        // Simulate submission
        await new Promise(resolve => setTimeout(resolve, 1500));

        showNotification('Mensaje enviado. Te contactaremos pronto.', 'success');
        form.reset();

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    });
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
        badge: 'Línea 2026',
        image: 'Imagenes/Nuevos Modelos/36m2 1A.png',
        bedrooms: '1',
        bathrooms: '1',
        area: '36',
        material: 'Paneles SIP',
        description: 'Diseño moderno y compacto con techo a un agua. Ideal para espacios reducidos o como oficina independiente. Máxima eficiencia térmica y construcción sustentable.'
    },
    'terra-36': {
        name: 'Terra 36 m²',
        style: 'Dos Aguas',
        badge: 'Línea 2026',
        image: 'Imagenes/Nuevos Modelos/36m2 2A.png',
        bedrooms: '1',
        bathrooms: '1',
        area: '36',
        material: 'Paneles SIP',
        description: 'El modelo Terra combina diseño clásico de dos aguas con acabados premium. Perfecto para integrarse en entornos naturales con su estética acogedora.'
    },
    '54-1a': {
        name: '54 m²',
        style: 'Un Agua',
        badge: 'Línea 2026',
        image: 'Imagenes/Nuevos Modelos/54m2 1A.png',
        bedrooms: '2',
        bathrooms: '1',
        area: '54',
        material: 'Paneles SIP',
        description: 'Espacioso modelo de dos dormitorios con líneas contemporáneas. Techo a un agua que maximiza la luminosidad interior y ofrece amplitud visual.'
    },
    'clasica-36': {
        name: '36 m²',
        style: 'Clásico',
        badge: 'Línea Clásica',
        image: 'Imagenes/Modelos/36m2 2A/36 2A/36m2 2A H.png',
        bedrooms: '1',
        bathrooms: '1',
        area: '36',
        material: 'Paneles SIP',
        description: 'Modelo clásico compacto, ideal para parejas o como estudio independiente. Diseño probado con excelente relación calidad-precio.'
    },
    'clasica-54': {
        name: '54 m²',
        style: 'Clásico',
        badge: 'Línea Clásica',
        image: 'Imagenes/Modelos/36m2 2A/54 2A/freepik__foto-realista-de-esta-imagen__52834.png',
        bedrooms: '2',
        bathrooms: '1',
        area: '54',
        material: 'Paneles SIP',
        description: 'Casa familiar de dos dormitorios con distribución optimizada. Amplios espacios de estar y cocina integrada para el confort diario.'
    },
    'clasica-72': {
        name: '72 m²',
        style: 'Clásico',
        badge: 'Línea Clásica',
        image: 'Imagenes/Modelos/36m2 2A/54 2A/freepik__quiero-la-foto-del-angulo-izquierdo-de-la-casaimg1__52838.png',
        bedrooms: '3',
        bathrooms: '2',
        area: '72',
        material: 'Paneles SIP',
        description: 'Nuestro modelo más amplio con tres dormitorios y dos baños. Perfecto para familias que buscan espacio y comodidad sin comprometer la eficiencia.'
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
    document.getElementById('modalDescription').textContent = data.description;

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
