'use strict';
/* Petits outils partagés : texte sûr, icônes, champs de formulaire, notifications, fenêtres. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (iso) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const money = (amount) => `${Number(amount).toLocaleString('fr-FR')} €`;
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const waLink = (text = 'Bonjour KWABO, j\'ai une question.') => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

function icon(name, size = 20) {
    const paths = (ICONS[name] ?? []).map((d) => `<path stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`).join('');
    return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${paths}</svg>`;
}

const WHATSAPP_ICON = '<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.1-.7.2-.2.3-.8 1-.9 1.2-.2.2-.4.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.6-2.1-.2-.3 0-.5.1-.6l.5-.5.3-.5v-.5c-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.9 9.9 0 1 1 8.3 4.6zM20.5 3.5A11.8 11.8 0 0 0 .2 11.9c0 2.1.5 4.1 1.6 5.9L.1 24l6.3-1.7a11.9 11.9 0 0 0 5.7 1.4c6.5 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.3z"/></svg>';

const logo = (light = false) => `<a class="logo ${light ? 'logo-light' : ''}" href="#/" aria-label="KWABO, accueil"><span class="logo-mark">K</span><span class="logo-text">KWABO<span class="logo-dot">.</span></span></a>`;
const avatar = (name, size = '') => `<span class="avatar ${size}" aria-hidden="true">${esc(initials(name))}</span>`;
const statusBadge = (status) => `<span class="badge badge-${STATUS[status].tone}">${icon(STATUS[status].icon, 14)}${STATUS[status].label}</span>`;

/* Champ de formulaire accessible : libellé, aide, erreur liée au champ. */
function field(f) {
    const id = `f-${f.name}`;
    const req = f.required ? 'required' : '';
    const hintId = f.hint ? `${id}-hint` : '';
    const describedBy = `aria-describedby="${id}-error ${hintId}"`;
    const value = f.value ?? '';
    const common = `id="${id}" name="${f.name}" ${req} ${describedBy} ${f.autocomplete ? `autocomplete="${f.autocomplete}"` : ''} ${f.attrs ?? ''}`;
    let control;
    if (f.type === 'select') {
        const placeholder = f.placeholder === false ? '' : `<option value="">${esc(f.placeholder ?? 'Sélectionnez…')}</option>`;
        control = `<select ${common}>${placeholder}${f.options.map((o) => {
            const v = typeof o === 'object' ? o.value : o;
            const l = typeof o === 'object' ? o.label : o;
            return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`;
        }).join('')}</select>`;
    } else if (f.type === 'textarea') {
        control = `<textarea ${common} rows="${f.rows ?? 4}" placeholder="${esc(f.placeholder ?? '')}">${esc(value)}</textarea>`;
    } else if (f.type === 'password') {
        control = `<span class="input-with-button"><input ${common} type="password" value="${esc(value)}" placeholder="${esc(f.placeholder ?? '')}">
            <button class="eye" type="button" data-action="togglePassword" aria-label="Afficher le mot de passe" title="Afficher le mot de passe" aria-pressed="false">${icon('eye-slash')}</button></span>`;
    } else if (f.type === 'file') {
        control = `<input ${common} type="file" ${f.accept ? `accept="${f.accept}"` : ''}>`;
    } else {
        control = `<input ${common} type="${f.type ?? 'text'}" value="${esc(value)}" placeholder="${esc(f.placeholder ?? '')}">`;
    }
    return `<div class="field ${f.full ? 'field-full' : ''}">
        <label for="${id}">${esc(f.label)}${f.required ? '' : f.optionalMark === false ? '' : ' <span class="optional">(facultatif)</span>'}</label>
        ${control}
        ${f.hint ? `<p class="hint" id="${hintId}">${esc(f.hint)}</p>` : ''}
        <p class="error" id="${id}-error" hidden></p>
    </div>`;
}

function clearErrors(form) {
    $$('.error', form).forEach((e) => { e.hidden = true; e.textContent = ''; });
    $$('[aria-invalid]', form).forEach((e) => e.removeAttribute('aria-invalid'));
    const banner = $('.form-error', form);
    if (banner) { banner.hidden = true; banner.textContent = ''; }
}

/* Affiche les erreurs { champ: message } et place le curseur sur la première. */
function showErrors(form, errors) {
    clearErrors(form);
    let first = null;
    Object.entries(errors).forEach(([name, message]) => {
        const input = form.elements[name];
        const box = $(`#f-${CSS.escape(name)}-error`, form);
        if (input && box) {
            box.textContent = message;
            box.hidden = false;
            input.setAttribute?.('aria-invalid', 'true');
            first ??= input;
        } else {
            const banner = $('.form-error', form);
            if (banner) { banner.textContent = message; banner.hidden = false; }
        }
    });
    first?.focus?.();
    return Object.keys(errors).length === 0;
}

function apiErrorToForm(form, error, fallbackField) {
    if (!(error instanceof ApiError)) throw error;
    showErrors(form, { [error.field ?? fallbackField ?? '_']: error.message });
}

function passwordProblem(password) {
    if (password.length < 8 || !/[A-ZÀ-Ý]/.test(password) || !/\d/.test(password)) return 'Au moins 8 caractères, avec 1 majuscule et 1 chiffre.';
    return null;
}

function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { el.hidden = true; }, 3200);
}

/* Fenêtre (native <dialog> : garde le clavier à l'intérieur, Échap ferme). */
function openDialog(html, { wide = false } = {}) {
    const dialog = $('#dialog');
    dialog.classList.toggle('dialog-wide', wide);
    $('#dialog-body').innerHTML = html;
    if (!dialog.open) dialog.showModal();
    $('#dialog-body input:not([type="radio"]), #dialog-body select, #dialog-body textarea, #dialog-body button')?.focus();
}
const closeDialog = () => { const d = $('#dialog'); if (d.open) d.close(); };

/* Confirmation stylée : renvoie true ou false. */
function confirmDialog({ title, body = '', confirm = 'Confirmer', danger = false }) {
    return new Promise((resolve) => {
        openDialog(`
            <h2 class="dialog-title" id="dialog-heading">${esc(title)}</h2>
            ${body ? `<p class="muted">${esc(body)}</p>` : ''}
            <div class="dialog-actions">
                <button class="btn btn-ghost" type="button" id="confirm-no">Annuler</button>
                <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" id="confirm-yes">${esc(confirm)}</button>
            </div>`);
        const dialog = $('#dialog');
        const finish = (value) => { dialog.removeEventListener('close', onClose); resolve(value); closeDialog(); };
        const onClose = () => finish(false);
        dialog.addEventListener('close', onClose);
        $('#confirm-no').addEventListener('click', () => finish(false));
        $('#confirm-yes').addEventListener('click', () => finish(true));
        $('#confirm-yes').focus();
    });
}

function emptyState(iconName, title, body, action = '') {
    return `<div class="empty"><span class="tile tile-lg">${icon(iconName, 28)}</span><h3>${esc(title)}</h3><p class="muted">${esc(body)}</p>${action}</div>`;
}

function pagination(page, pages, action) {
    if (pages <= 1) return '';
    return `<nav class="pagination" aria-label="Pagination">
        <button class="btn btn-ghost btn-sm" type="button" data-action="${action}" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>${icon('arrow-left', 16)}Précédent</button>
        <span class="muted">Page ${page} sur ${pages}</span>
        <button class="btn btn-ghost btn-sm" type="button" data-action="${action}" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Suivant${icon('arrow-right', 16)}</button>
    </nav>`;
}

/* Boîtes à actions : chaque page y ajoute ses clics, formulaires et saisies. */
const ACTIONS = {};
const FORMS = {};
const INPUTS = {};

function whatsappFloat() {
    return `<a class="wa-float" href="${waLink()}" target="_blank" rel="noopener" aria-label="Nous écrire sur WhatsApp" title="WhatsApp">${WHATSAPP_ICON}</a>`;
}
