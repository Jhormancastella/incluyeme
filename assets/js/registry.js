/**
 * registry.js - Registro de participantes en la comunidad Incluyeme
 */

import { Storage, DATA_KEYS } from './storage.js';
import { isValidEmail, escapeHtml, showToast, generateId } from './utils.js';

export const Registry = {
  initialized: false,

  init() {
    if (this.initialized) return this;
    this.bindForm();
    this.bindSuccessReset();
    this.initialized = true;
    return this;
  },

  bindForm() {
    const form = document.getElementById('registroForm');
    if (!form) return;

    // Real-time email validation
    const emailInput = document.getElementById('emailReg');
    if (emailInput) {
      emailInput.addEventListener('blur', e => {
        if (e.target.value && !isValidEmail(e.target.value)) {
          e.target.classList.add('input-error');
        } else {
          e.target.classList.remove('input-error');
        }
      });
      emailInput.addEventListener('input', e => e.target.classList.remove('input-error'));
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const nombre    = document.getElementById('fullname')?.value.trim();
      const email     = document.getElementById('emailReg')?.value.trim();
      const telefono  = document.getElementById('phone')?.value.trim();
      const barrio    = document.getElementById('barrio')?.value.trim();
      const rol       = document.getElementById('rolParticipacion')?.value;
      const discapacidad = document.getElementById('disabilityType')?.value;
      const intereses = Array.from(document.querySelectorAll('#interesesGroup input:checked')).map(cb => cb.value);
      const consent   = document.getElementById('privacyConsent')?.checked;

      const feedback  = document.getElementById('formFeedback');
      const submitBtn = document.getElementById('registroSubmit');

      const setError = (msg) => {
        if (feedback) {
          feedback.textContent = msg;
          feedback.className = 'registro-feedback registro-feedback--error';
        }
      };

      // Validaciones
      if (!nombre || nombre.length < 2) {
        setError('Por favor ingresa tu nombre completo (mínimo 2 caracteres).');
        document.getElementById('fullname')?.focus();
        return;
      }
      if (!email || !isValidEmail(email)) {
        setError('Por favor ingresa un correo electrónico válido.');
        emailInput?.focus();
        return;
      }
      if (!consent) {
        setError('Debes aceptar el uso de tus datos para continuar.');
        document.getElementById('privacyConsent')?.focus();
        return;
      }

      // Limpiar error
      if (feedback) { feedback.textContent = ''; feedback.className = 'registro-feedback'; }

      // Deshabilitar botón mientras guarda
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      }

      const registro = {
        id:          generateId(),
        nombre:      escapeHtml(nombre),
        email:       escapeHtml(email),
        telefono:    escapeHtml(telefono || ''),
        barrio:      escapeHtml(barrio || ''),
        rol:         rol || '',
        discapacidad: discapacidad || '',
        intereses,
        consent:     true,
        fecha:       new Date().toISOString()
      };

      // Guardar en localStorage
      const users = Storage.get(DATA_KEYS.USERS, []);
      users.push(registro);
      Storage.set(DATA_KEYS.USERS, users);

      // Mostrar estado de éxito
      const formCard  = document.querySelector('.registro-form-card');
      const successEl = document.getElementById('registroSuccess');
      const successMsg = document.getElementById('registroSuccessMsg');

      if (formCard)  formCard.hidden  = true;
      if (successEl) successEl.hidden = false;
      if (successMsg) {
        successMsg.textContent = `Gracias, ${nombre}. Tu registro fue guardado. Te contactaremos al correo ${email} con información relevante según tus intereses.`;
      }

      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Registrarme en la comunidad';
      }

      document.dispatchEvent(new CustomEvent('registry:newUser', { detail: registro }));
    });
  },

  bindSuccessReset() {
    document.getElementById('registroNuevo')?.addEventListener('click', () => {
      const formCard  = document.querySelector('.registro-form-card');
      const successEl = document.getElementById('registroSuccess');
      if (formCard)  formCard.hidden  = false;
      if (successEl) successEl.hidden = true;
    });
  },

  // Para el panel admin
  getUsers(filters = {}) {
    let users = Storage.get(DATA_KEYS.USERS, []);
    if (filters.interes)      users = users.filter(u => u.intereses?.includes(filters.interes));
    if (filters.discapacidad) users = users.filter(u => u.discapacidad === filters.discapacidad);
    if (filters.rol)          users = users.filter(u => u.rol === filters.rol);
    if (filters.dateFrom)     users = users.filter(u => new Date(u.fecha) >= new Date(filters.dateFrom));
    return users;
  },

  exportUsersCSV() {
    const users = Storage.get(DATA_KEYS.USERS, []);
    if (!users.length) { showToast('No hay registros para exportar', 'warning'); return; }

    const headers = ['Fecha', 'Nombre', 'Email', 'Teléfono', 'Barrio', 'Rol', 'Discapacidad', 'Intereses'];
    const rows = users.map(u => [
      new Date(u.fecha).toLocaleString('es-CO'),
      u.nombre, u.email, u.telefono || '',
      u.barrio || '', u.rol || '',
      u.discapacidad || 'No especificado',
      (u.intereses || []).join('; ')
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `registros_incluyeme_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Registros exportados ✓');
  }
};

export default Registry;
