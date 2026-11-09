'use strict';
/* Routeur du site public et de l'espace client web. L'équipe a sa propre interface : admin.html. */

let pendingScrollTarget = null;
let isFirstRender = true;

function parseRoute() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, query = ''] = raw.split('?');
    return { parts: path.split('/').filter(Boolean), params: new URLSearchParams(query), raw: location.hash || '#/' };
}

function redirect(hash) {
    location.hash = hash;
    return '';
}

function clientPage(parts, params, raw) {
    if (!currentUser()) return redirect(`#/connexion?suite=${encodeURIComponent(raw)}`);
    const [section, id] = parts;
    switch (section) {
        case undefined: return pageClientDashboard();
        case 'services': return pageClientCatalog(params);
        case 'nouvelle-demande': return pageNewRequest(params);
        case 'demandes': return id ? pageClientRequestDetail(id) : pageClientRequests();
        case 'documents': return pageClientDocuments();
        case 'messages': return pageClientMessages(id);
        case 'paiements': return pageClientPayments();
        case 'parrainage': return pageClientReferral();
        case 'profil': return pageClientProfile();
        case 'notifications': return pageClientNotifications();
        default: return clientLayout({ title: 'Page introuvable', content: emptyState('magnifying-glass', 'Page introuvable', 'Cette page n\'existe pas.', '<a class="btn btn-primary" href="#/espace">Tableau de bord</a>') });
    }
}

function publicPage(parts, params) {
    const [section, id] = parts;
    if (['connexion', 'inscription'].includes(section) && currentUser()) return redirect('#/espace');
    switch (section) {
        case undefined: return pageHome();
        case 'services': return id ? pageServiceDetail(id) : pageServices(params);
        case 'connexion': return pageLogin(params);
        case 'inscription': return pageRegister(params);
        case 'verification-email': return pageVerifyEmail();
        case 'mot-de-passe-oublie': return pageForgot();
        case 'reinitialiser-mot-de-passe': return pageReset();
        case 'mentions-legales': case 'confidentialite': case 'cgu': return pageLegal(section);
        default: return pageNotFound();
    }
}

function route({ keepPosition = false } = {}) {
    const { parts, params, raw } = parseRoute();
    const scrollY = window.scrollY;
    const html = parts[0] === 'espace' ? clientPage(parts.slice(1), params, raw) : publicPage(parts, params);
    if (html === '') return;

    $('#root').innerHTML = html;
    const heading = $('h1')?.textContent.trim();
    document.title = heading ? `${heading} · KWABO` : 'KWABO';
    scrollThreadToEnd();

    if (keepPosition) { window.scrollTo(0, scrollY); return; }
    if (!isFirstRender) $('#main')?.focus({ preventScroll: true });
    isFirstRender = false;
    if (pendingScrollTarget) {
        const target = document.getElementById(pendingScrollTarget);
        pendingScrollTarget = null;
        target?.scrollIntoView();
    } else {
        window.scrollTo(0, 0);
    }
}

ACTIONS.toggleSiteMenu = (el) => {
    const open = $('#site-nav').classList.toggle('open');
    el.setAttribute('aria-expanded', String(open));
    el.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    el.innerHTML = icon(open ? 'x-mark' : 'bars-3', 24);
};
