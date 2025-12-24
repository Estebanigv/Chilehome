/**
 * CSRF Protection Module
 * Chile Home - Security Enhancement
 *
 * Genera y valida tokens CSRF para proteger formularios
 * contra ataques Cross-Site Request Forgery
 *
 * @version 1.0.0
 * @date 2025-12-23
 */

'use strict';

const CSRFProtection = {
    tokenName: '_csrf_token',
    tokenExpiry: 3600000, // 1 hora en milisegundos
    storageKey: 'chile_home_csrf',

    /**
     * Genera un token CSRF criptograficamente seguro
     * @returns {string} Token CSRF en formato hexadecimal
     */
    generateToken() {
        try {
            // Usar Web Crypto API para generar token seguro
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('Error generando token CSRF:', error);
            // Fallback a metodo menos seguro si Web Crypto no esta disponible
            return this.generateFallbackToken();
        }
    },

    /**
     * Fallback para generar token si crypto.getRandomValues no esta disponible
     * @returns {string} Token generado
     */
    generateFallbackToken() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 15);
        const random2 = Math.random().toString(36).substring(2, 15);
        return `${timestamp}-${random}${random2}`;
    },

    /**
     * Guarda el token en sessionStorage con timestamp
     * @returns {string} Token generado
     */
    setToken() {
        const token = this.generateToken();
        const data = {
            token: token,
            timestamp: Date.now(),
            userAgent: navigator.userAgent.substring(0, 100) // Fingerprint basico
        };

        try {
            sessionStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error guardando token CSRF:', error);
        }

        return token;
    },

    /**
     * Obtiene el token actual o genera uno nuevo si expiro
     * @returns {string} Token CSRF valido
     */
    getToken() {
        try {
            const data = sessionStorage.getItem(this.storageKey);

            if (!data) {
                return this.setToken();
            }

            const parsed = JSON.parse(data);
            const age = Date.now() - parsed.timestamp;

            // Si el token expiro, generar uno nuevo
            if (age > this.tokenExpiry) {
                return this.setToken();
            }

            // Validacion adicional de User Agent (basic fingerprinting)
            const currentUA = navigator.userAgent.substring(0, 100);
            if (parsed.userAgent && parsed.userAgent !== currentUA) {
                console.warn('CSRF: User Agent cambio, regenerando token');
                return this.setToken();
            }

            return parsed.token;
        } catch (error) {
            console.error('Error obteniendo token CSRF:', error);
            return this.setToken();
        }
    },

    /**
     * Valida un token CSRF
     * @param {string} token - Token a validar
     * @returns {boolean} True si el token es valido
     */
    validateToken(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }

        try {
            const data = sessionStorage.getItem(this.storageKey);

            if (!data) {
                console.warn('CSRF: No hay token almacenado');
                return false;
            }

            const parsed = JSON.parse(data);
            const age = Date.now() - parsed.timestamp;

            // Validar que no haya expirado
            if (age > this.tokenExpiry) {
                console.warn('CSRF: Token expirado');
                return false;
            }

            // Validar que coincida (usando comparacion segura)
            return this.secureCompare(parsed.token, token);
        } catch (error) {
            console.error('Error validando token CSRF:', error);
            return false;
        }
    },

    /**
     * Comparacion segura de strings para prevenir timing attacks
     * @param {string} a - Primer string
     * @param {string} b - Segundo string
     * @returns {boolean} True si son iguales
     */
    secureCompare(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') {
            return false;
        }

        if (a.length !== b.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }

        return result === 0;
    },

    /**
     * Inyecta el token CSRF en un formulario
     * @param {HTMLFormElement} formElement - Elemento form del DOM
     * @returns {boolean} True si se inyecto correctamente
     */
    protectForm(formElement) {
        if (!formElement || formElement.tagName !== 'FORM') {
            console.error('CSRFProtection: Se requiere un elemento form valido');
            return false;
        }

        // Verificar si ya tiene proteccion
        let existingInput = formElement.querySelector(`input[name="${this.tokenName}"]`);

        if (existingInput) {
            // Actualizar token existente
            existingInput.value = this.getToken();
            return true;
        }

        // Crear input hidden con el token
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = this.tokenName;
        input.value = this.getToken();
        input.setAttribute('data-csrf-protection', 'true');

        formElement.appendChild(input);

        return true;
    },

    /**
     * Valida un formulario antes del envio
     * @param {HTMLFormElement} formElement - Elemento form del DOM
     * @returns {boolean} True si el formulario es valido
     */
    validateForm(formElement) {
        if (!formElement || formElement.tagName !== 'FORM') {
            console.error('CSRFProtection: Elemento form invalido');
            return false;
        }

        const input = formElement.querySelector(`input[name="${this.tokenName}"]`);

        if (!input) {
            console.error('CSRFProtection: Formulario sin token CSRF');
            return false;
        }

        const isValid = this.validateToken(input.value);

        if (!isValid) {
            console.error('CSRFProtection: Token CSRF invalido');
        }

        return isValid;
    },

    /**
     * Renueva el token CSRF en un formulario
     * @param {HTMLFormElement} formElement - Elemento form del DOM
     */
    renewToken(formElement) {
        if (!formElement) return;

        const input = formElement.querySelector(`input[name="${this.tokenName}"]`);
        if (input) {
            const newToken = this.setToken();
            input.value = newToken;
        }
    },

    /**
     * Inicializa la proteccion para todos los formularios de la pagina
     */
    init() {
        // Esperar a que el DOM este listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initForms());
        } else {
            this.initForms();
        }
    },

    /**
     * Inicializa formularios
     */
    initForms() {
        const forms = document.querySelectorAll('form');

        if (forms.length === 0) {
            console.warn('CSRFProtection: No se encontraron formularios');
            return;
        }

        forms.forEach(form => {
            // Proteger formulario
            this.protectForm(form);

            // Agregar listener de submit
            form.addEventListener('submit', (e) => {
                // Validar token
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    this.showError('Error de seguridad: Token CSRF invalido. Por favor, recarga la pagina.');
                    return false;
                }

                // Renovar token para el proximo envio
                setTimeout(() => {
                    this.renewToken(form);
                }, 100);
            });
        });

        console.log(`CSRFProtection: ${forms.length} formulario(s) protegido(s)`);
    },

    /**
     * Muestra un error al usuario
     * @param {string} message - Mensaje de error
     */
    showError(message) {
        // Usar el sistema de notificaciones existente si esta disponible
        if (typeof showNotification === 'function') {
            showNotification(message, 'error');
        } else {
            alert(message);
        }
    },

    /**
     * Obtiene el token para uso en fetch/AJAX
     * @returns {Object} Headers con el token CSRF
     */
    getHeaders() {
        return {
            'X-CSRF-Token': this.getToken(),
            'X-Requested-With': 'XMLHttpRequest'
        };
    },

    /**
     * Limpia tokens expirados del storage
     */
    cleanup() {
        try {
            const data = sessionStorage.getItem(this.storageKey);
            if (!data) return;

            const parsed = JSON.parse(data);
            const age = Date.now() - parsed.timestamp;

            if (age > this.tokenExpiry) {
                sessionStorage.removeItem(this.storageKey);
            }
        } catch (error) {
            console.error('Error limpiando tokens CSRF:', error);
        }
    }
};

// Auto-inicializar cuando el DOM este listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        CSRFProtection.init();

        // Cleanup periodico de tokens expirados
        setInterval(() => CSRFProtection.cleanup(), 300000); // Cada 5 minutos
    });
} else {
    CSRFProtection.init();
    setInterval(() => CSRFProtection.cleanup(), 300000);
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSRFProtection;
} else {
    window.CSRFProtection = CSRFProtection;
}
