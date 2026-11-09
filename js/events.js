'use strict';
/* Écoute des clics, formulaires et saisies, commune aux trois interfaces. Chargé en dernier : chaque interface définit route(). */

ACTIONS.closeDialog = () => closeDialog();

/* L'œil est barré quand le mot de passe est caché, ouvert quand il est visible. */
ACTIONS.togglePassword = (el) => {
    const input = el.parentElement.querySelector('input');
    const willShow = input.type === 'password';
    input.type = willShow ? 'text' : 'password';
    const label = willShow ? 'Masquer le mot de passe' : 'Afficher le mot de passe';
    el.setAttribute('aria-label', label);
    el.setAttribute('title', label);
    el.setAttribute('aria-pressed', String(willShow));
    el.innerHTML = icon(willShow ? 'eye' : 'eye-slash');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
};

function hideSearchResults(except = null) {
    $$('.search-results').forEach((list) => {
        if (list === except) return;
        list.hidden = true;
        list.closest('form, .search')?.querySelector('input')?.setAttribute('aria-expanded', 'false');
    });
}

document.addEventListener('click', (event) => {
    if (event.target.closest('.skip-link')) {
        event.preventDefault();
        $('#main')?.focus();
        return;
    }

    hideSearchResults(event.target.closest('.search')?.querySelector('.search-results'));

    /* Un clic sur le fond de la fenêtre la ferme. */
    if (event.target === $('#dialog')) { closeDialog(); return; }

    const scrollLink = event.target.closest('a[data-scroll]');
    if (scrollLink) {
        event.preventDefault();
        const id = scrollLink.dataset.scroll;
        $('#site-nav')?.classList.remove('open');
        const onHome = (location.hash.replace(/^#\/?/, '').split('?')[0]) === '';
        if (onHome && document.getElementById(id)) {
            document.getElementById(id).scrollIntoView();
        } else {
            pendingScrollTarget = id;
            location.hash = '#/';
        }
        return;
    }

    const actionEl = event.target.closest('[data-action]');
    const action = actionEl && ACTIONS[actionEl.dataset.action];
    if (action) {
        if (actionEl.tagName === 'A') event.preventDefault();
        action(actionEl, event);
    }
    if (event.target.closest('.sidebar a, .sidebar .side-link')) ACTIONS.closeSidebar?.();
});

document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-form]');
    const handler = form && FORMS[form.dataset.form];
    if (!handler) return;
    event.preventDefault();
    handler(form, event);
});

document.addEventListener('input', (event) => {
    const el = event.target.closest('[data-input]');
    const handler = el && INPUTS[el.dataset.input];
    if (handler) handler(el, event);
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { hideSearchResults(); ACTIONS.closeSidebar?.(); }
    if (event.key === 'Enter' && !event.shiftKey && event.target.matches('[data-enter-submit]')) {
        event.preventDefault();
        event.target.closest('form').requestSubmit();
    }
});

window.addEventListener('hashchange', () => { closeDialog(); route(); });

/* Une autre interface a changé les données : on met à jour, sauf si la personne est en train d'écrire. */
window.addEventListener('kwabo:data', () => {
    const typing = document.activeElement?.matches('input, textarea, select');
    if (!typing && !$('#dialog').open) route({ keepPosition: true });
});

$('.dialog-close').innerHTML = icon('x-mark', 22);
route();
