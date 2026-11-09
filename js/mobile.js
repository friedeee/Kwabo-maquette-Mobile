'use strict';
/*
 * Application mobile KWABO (maquette des écrans iOS et Android).
 * Mêmes données et mêmes adresses internes que l'espace client web, avec une navigation d'application.
 */

const ONBOARDING_KEY = 'kwabo-maquette-onboarding';
const MOBILE_PAGE_SIZE = 6;
let isFirstMobileRender = true;

const ONBOARDING = [
    { icon: 'video-camera', photo: 'chantier-tour', place: 'Un chantier suivi à Cotonou', title: 'Voyez le travail, <em>où que vous soyez</em>', text: 'Vidéos, photos datées, reçus et rapports arrivent directement dans votre téléphone.' },
    { icon: 'clipboard-document-list', photo: 'ganvie-pirogue', place: 'Ganvié, lac Nokoué', title: 'Une demande <em>en moins de 3 minutes</em>', text: 'Chantier, famille, démarches, fret : choisissez un service, décrivez votre besoin, recevez un devis.' },
    { icon: 'bell', photo: 'port', place: 'Le port de Cotonou', title: 'Prévenu <em>à chaque étape</em>', text: 'Devis, démarrage, rapport, fin de mission : une notification, et tout est à portée de main.' },
];

/* Photos libres de droits du Bénin (voir Compte > Crédits photos). */
const SERVICE_PHOTOS = {
    'suivi-chantier': 'chantier', investissement: 'quartier', foncier: 'terrain', 'soutien-famille': 'marche-ganvie', sante: 'pharmacie', evenements: 'mariage',
    'faire-venir': 'aeroport', comptabilite: 'rue-cotonou', administratif: 'mairie', transfert: 'zemidjan', fret: 'port-cargo', cadeaux: 'wax',
};
const CATEGORY_PHOTOS = { immobilier: 'chantier-tour', famille: 'ganvie-pirogue', demarches: 'aeroport', logistique: 'port' };
/* Photos et vidéos de démonstration rattachées aux documents de chantier. */
const DOCUMENT_PHOTOS = { d4: 'chantier-tour', d5: 'chantier-terrain', d2: null };
const photoUrl = (name, small = true) => `assets/photos/${name}${small ? '-500' : ''}.jpg`;
const photoTag = (name, className = '', small = true) => `<img class="m-photo ${className}" src="${photoUrl(name, small)}" alt="" loading="lazy" decoding="async">`;
const serviceThumb = (s, className = '') => `<span class="m-thumb ${className}">${photoTag(SERVICE_PHOTOS[s.id])}<span class="m-thumb-icon cat-${s.cat}">${icon(s.icon, 14)}</span></span>`;
let onboardingStep = 0;

/* ---------- Gabarits ---------- */
function mobileTabs() {
    const user = currentUser();
    const path = currentPath();
    const unread = api.unreadMessages(user);
    const tabs = [
        { href: '#/espace', icon: 'home', label: 'Accueil', exact: true },
        { href: '#/espace/demandes', icon: 'clipboard-document-list', label: 'Demandes' },
        { href: '#/espace/nouvelle-demande', icon: 'plus', label: 'Nouvelle', primary: true },
        { href: '#/espace/messages', icon: 'chat-bubble-left-right', label: 'Messages', badge: unread },
        { href: '#/espace/compte', icon: 'user', label: 'Compte' },
    ];
    return `<nav class="m-tabs" aria-label="Navigation principale">${tabs.map((t) => {
        const active = t.exact ? path === t.href : path === t.href || path.startsWith(`${t.href}/`);
        return `<a class="${t.primary ? 'm-tab-primary' : ''}" href="${t.href}" ${active ? 'aria-current="page"' : ''}><span class="m-tab-icon">${icon(t.icon, t.primary ? 26 : 24)}${t.badge ? `<span class="dot-count">${t.badge}</span>` : ''}</span><span>${esc(t.label)}</span></a>`;
    }).join('')}</nav>`;
}

function bellLink() {
    const count = api.notificationsOf(currentUser()).filter((n) => !n.read).length;
    return `<a class="icon-btn" href="#/espace/notifications" aria-label="Notifications, ${count} non lues">${icon('bell', 24)}${count ? `<span class="dot-count">${count}</span>` : ''}</a>`;
}

/* Page parente pour la flèche de retour. */
function backTarget() {
    const [path, query = ''] = (location.hash || '#/').split('?');
    const params = new URLSearchParams(query);
    if (path === '#/espace/nouvelle-demande') {
        if (params.get('confirmee')) return null;
        return params.get('service') ? '#/espace/nouvelle-demande' : '#/espace';
    }
    if (/^#\/espace\/demandes\/.+/.test(path)) return '#/espace/demandes';
    if (/^#\/espace\/messages\/.+/.test(path)) return '#/espace/messages';
    if (/^#\/espace\/services\/.+/.test(path)) return '#/espace/services';
    if (path === '#/espace/services' || path === '#/espace/notifications') return '#/espace';
    if (['#/espace/documents', '#/espace/paiements', '#/espace/parrainage', '#/espace/profil'].includes(path)) return '#/espace/compte';
    return null;
}

function mobileBar({ title, subtitle, actions = '' }) {
    const back = backTarget();
    return `<header class="m-bar">
        ${back ? `<a class="icon-btn" href="${back}" aria-label="Retour">${icon('arrow-left', 24)}</a>` : ''}
        <div class="m-bar-title"><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>
        <div class="m-bar-actions">${actions}</div>
    </header>`;
}

/* Écrans ordinaires. client.js passe aussi par ici pour Documents, Paiements, Parrainage, Profil et Notifications. */
function mobileLayout({ title, subtitle, content, actions = '', tabs = false, whatsapp = true, footer = '' }) {
    return `<div class="m-screen ${tabs ? 'm-with-tabs' : ''} ${footer ? 'm-with-footer' : ''}">
        ${mobileBar({ title, subtitle, actions })}
        <main class="m-content" id="main" tabindex="-1">${content}</main>
        ${footer ? `<div class="m-footer">${footer}</div>` : ''}
        ${tabs ? mobileTabs() : ''}
    </div>${whatsapp ? whatsappFloat() : ''}`;
}

/* Connexion, inscription et mot de passe : mêmes formulaires que le site, présentation d'application. */
function mobileAuthLayout(content) {
    return `<div class="m-auth">
        <header class="m-auth-top">${photoTag('abomey', 'm-auth-photo', false)}${logo(true)}<p>Votre présence de confiance au Bénin</p></header>
        <main class="m-auth-card m-rise" id="main" tabindex="-1">${content}
            <p class="auth-legal"><a href="#/confidentialite">Confidentialité</a> · <a href="#/cgu">CGU</a></p>
        </main>
    </div>${whatsappFloat()}`;
}

/* ---------- Bienvenue ---------- */
function screenOnboarding() {
    const slide = ONBOARDING[onboardingStep];
    const last = onboardingStep === ONBOARDING.length - 1;
    return `<main class="m-onboarding" id="main" tabindex="-1">
        <div class="m-onboarding-top" key="${onboardingStep}">
            ${photoTag(slide.photo, 'm-onboarding-photo', false)}
            ${logo(true)}
            <div class="m-onboarding-art"><span>${icon(slide.icon, 44)}</span></div>
            <p class="m-onboarding-place">${icon('map-pin', 14)}${esc(slide.place)}</p>
        </div>
        <div class="m-onboarding-body m-rise">
            <h1>${slide.title}</h1>
            <p class="muted">${esc(slide.text)}</p>
            <div class="m-dots" role="img" aria-label="Étape ${onboardingStep + 1} sur ${ONBOARDING.length}">${ONBOARDING.map((_, i) => `<span class="${i === onboardingStep ? 'is-on' : ''}"></span>`).join('')}</div>
            ${last
                ? '<a class="btn btn-primary btn-lg btn-block" href="#/inscription" data-action="finishOnboarding">Créer mon compte gratuit</a>'
                : '<button class="btn btn-primary btn-lg btn-block" type="button" data-action="nextOnboarding">Suivant</button>'}
            <a class="btn btn-ghost btn-lg btn-block" href="#/connexion" data-action="finishOnboarding">J'ai déjà un compte</a>
        </div>
    </main>`;
}
ACTIONS.nextOnboarding = () => { onboardingStep += 1; route(); };
ACTIONS.finishOnboarding = (el) => {
    store.write(localStorage, ONBOARDING_KEY, true);
    location.hash = el.getAttribute('href');
};

/* ---------- Accueil ---------- */
function mobileRequestCard(r) {
    const s = serviceById(r.serviceId);
    return `<a class="m-request" href="#/espace/demandes/${r.id}">
        ${serviceThumb(s)}
        <span class="m-request-main">
            <strong>${esc(r.title)}</strong>
            <small>${esc(r.tracking)} · ${esc(r.city)}</small>
            <span class="m-request-badges">${statusBadge(r.status)}${r.urgency === 'urgent' ? `<span class="badge badge-red">${icon('bolt', 14)}Urgent</span>` : ''}</span>
        </span>
        ${icon('chevron-right', 18)}
    </a>`;
}

function screenHome() {
    const user = currentUser();
    const requests = api.requestsOf(user);
    const count = (status) => requests.filter((r) => r.status === status).length;
    const due = api.invoicesOf(user).filter((i) => i.status === 'due');
    const active = requests.find((r) => r.status === 'active');
    const activeService = active ? serviceById(active.serviceId) : null;
    const unread = api.notificationsOf(user).filter((n) => !n.read);
    const media = db.documents.filter((d) => DOCUMENT_PHOTOS[d.id] && requests.some((r) => r.id === d.requestId));
    const popular = SERVICES.filter((s) => s.popular && s.available);
    return `<div class="m-screen m-with-tabs">
        <header class="m-hero">
            ${photoTag(activeService ? SERVICE_PHOTOS[activeService.id] : 'ganvie', 'm-hero-photo', false)}
            <div class="m-hero-top">
                <a class="m-hero-user" href="#/espace/compte">${avatar(fullName(user))}<span><small>Bonjour</small><strong>${esc(user.firstName)}</strong></span></a>
                <span class="m-hero-bell">${bellLink()}</span>
            </div>
            <a class="m-search-pill" href="#/espace/services">${icon('magnifying-glass')}<span>Que cherchez-vous ?</span></a>
        </header>
        <main class="m-content m-home m-stagger" id="main" tabindex="-1">
            <ul class="m-counters">
                ${[['Total', requests.length, '#/espace/demandes'], ['En attente', count('pending'), '#/espace/demandes?statut=pending'], ['En cours', count('active'), '#/espace/demandes?statut=active'], ['Terminées', count('done'), '#/espace/demandes?statut=done']]
                    .map(([label, value, href]) => `<li><a href="${href}"><strong data-count="${value}">${value}</strong><span>${label}</span></a></li>`).join('')}
            </ul>
            ${due.map((i) => `<div class="alert m-alert"><span class="tile tile-sm m-pulse">${icon('banknotes', 18)}</span><div><strong>Devis à payer : ${money(i.amount)}</strong><small>${esc(i.label)}</small></div><button class="btn btn-gold btn-sm" type="button" data-action="payInvoice" data-id="${i.id}">Payer</button></div>`).join('')}
            ${active ? `<a class="card m-mission" href="#/espace/demandes/${active.id}">
                <span class="m-mission-photo">${photoTag(SERVICE_PHOTOS[activeService.id])}<span class="m-section-label m-label-on-photo">${icon('bolt', 14)}Mission en cours</span></span>
                <span class="m-mission-body">
                    <strong>${esc(active.title)}</strong>
                    ${statusSteps(active.status)}
                    <small class="muted">${esc(active.history.at(-1).text)}, ${fmtDateTime(active.history.at(-1).at)}</small>
                </span>
            </a>` : ''}
            ${media.length ? `<section><div class="m-section-head"><h2>Photos du chantier</h2><a href="#/espace/documents">Tout voir</a></div>
                <div class="m-doc-row">${media.map((d) => `<button class="m-media" type="button" data-action="previewDocument" data-id="${d.id}">${photoTag(DOCUMENT_PHOTOS[d.id])}${d.type === 'video' ? `<span class="m-play">${icon('video-camera', 18)}</span>` : ''}<small>${fmtDate(d.createdAt)}</small></button>`).join('')}</div>
            </section>` : ''}
            ${unread.length ? `<section><div class="m-section-head"><h2>Notifications</h2><a href="#/espace/notifications">Tout voir</a></div><ul class="card m-list notif-list">${unread.slice(0, 2).map(notificationItem).join('')}</ul></section>` : ''}
            <section><div class="m-section-head"><h2>Nos univers</h2><a href="#/espace/services">Catalogue</a></div>
                <div class="m-universes">${CATEGORIES.map((c) => `<a href="#/espace/services?cat=${c.id}">${photoTag(CATEGORY_PHOTOS[c.id])}<span class="m-universe-icon cat-${c.id}">${icon(c.icon, 18)}</span><span class="m-universe-name">${esc(c.short)}</span></a>`).join('')}</div>
            </section>
            <section><div class="m-section-head"><h2>Les plus demandés</h2><a href="#/espace/services">Tout voir</a></div>
                <div class="m-carousel">${popular.map((s) => `<a class="m-service-card" href="#/espace/services/${s.id}">${photoTag(SERVICE_PHOTOS[s.id])}<span><strong>${esc(s.name)}</strong><small class="price">${esc(s.price)}</small></span></a>`).join('')}</div>
            </section>
            <section><div class="m-section-head"><h2>Mes dernières demandes</h2><a href="#/espace/demandes">Tout voir</a></div>
                ${requests.length ? `<div class="card m-list">${requests.slice(0, 3).map(mobileRequestCard).join('')}</div>` : `<div class="card">${emptyState('clipboard-document-list', 'Aucune demande', 'Votre première demande prend moins de 3 minutes.', '<a class="btn btn-primary" href="#/espace/nouvelle-demande">Faire une demande</a>')}</div>`}
            </section>
            <section><h2 class="m-title-alone">Vos garanties</h2>${trustStrip()}</section>
        </main>
        ${mobileTabs()}
    </div>${whatsappFloat()}`;
}

/* ---------- Catalogue ---------- */
const servicesState = { q: '', cat: 'all', forRequest: false };

function serviceRows() {
    const list = filterServices(servicesState.q, servicesState.cat);
    if (!list.length) return emptyState('magnifying-glass', 'Aucun service trouvé', 'Essayez un autre mot, ou écrivez-nous sur WhatsApp.');
    return `<div class="m-service-list">${list.map((s, i) => `<a class="m-service-tile" style="--i:${i}" href="${servicesState.forRequest ? `#/espace/nouvelle-demande?service=${s.id}` : `#/espace/services/${s.id}`}">
        <span class="m-service-tile-photo">${photoTag(SERVICE_PHOTOS[s.id])}<span class="m-thumb-icon cat-${s.cat}">${icon(s.icon, 16)}</span></span>
        <span class="m-request-main"><strong>${esc(s.name)}</strong><small>${esc(s.short)}</small><span class="price">${esc(s.price)}</span></span>
    </a>`).join('')}</div>`;
}

function catalogControls() {
    return `<div class="search-field">${icon('magnifying-glass', 18)}<label class="sr-only" for="m-services-q">Rechercher un service</label><input id="m-services-q" type="search" autocomplete="off" placeholder="Rechercher un service…" value="${esc(servicesState.q)}" data-input="mobileServicesSearch"></div>
    <div class="m-chips" role="group" aria-label="Filtrer par univers">
        <button class="chip" type="button" data-action="mobileServicesCat" data-cat="all" aria-pressed="${servicesState.cat === 'all'}">Tous</button>
        ${CATEGORIES.map((c) => `<button class="chip" type="button" data-action="mobileServicesCat" data-cat="${c.id}" aria-pressed="${servicesState.cat === c.id}">${icon(c.icon, 18)}${esc(c.short)}</button>`).join('')}
    </div>
    <div id="m-services">${serviceRows()}</div>`;
}

function screenServices(params) {
    servicesState.q = params.get('q') ?? '';
    servicesState.cat = params.get('cat') ?? 'all';
    servicesState.forRequest = false;
    return mobileLayout({ title: 'Catalogue', subtitle: `${SERVICES.filter((s) => s.available).length} services`, content: catalogControls() });
}
INPUTS.mobileServicesSearch = (input) => { servicesState.q = input.value; $('#m-services').innerHTML = serviceRows(); };
ACTIONS.mobileServicesCat = (el) => {
    servicesState.cat = el.dataset.cat;
    $$('[data-action="mobileServicesCat"]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === servicesState.cat)));
    $('#m-services').innerHTML = serviceRows();
};

function screenService(id) {
    const s = serviceById(id);
    if (!s) return mobileLayout({ title: 'Service introuvable', content: emptyState('magnifying-glass', 'Service introuvable', 'Ce service n\'existe pas.') });
    return mobileLayout({
        title: s.name,
        subtitle: CATEGORIES.find((c) => c.id === s.cat).short,
        whatsapp: false,
        content: `
        <section class="m-service-hero">${photoTag(SERVICE_PHOTOS[s.id], 'm-zoom', false)}<span class="m-thumb-icon cat-${s.cat}">${icon(s.icon, 22)}</span><p>${esc(s.short)}</p></section>
        <section class="card"><h2>Ce qui est inclus</h2><ul class="check-list m-stagger">${s.included.map((i) => `<li>${icon('check-circle', 20)}${esc(i)}</li>`).join('')}</ul></section>
        <section class="card"><h2>Comment ça se passe</h2><ol class="mini-steps"><li>Vous décrivez votre besoin en moins de 3 minutes.</li><li>Vous recevez un devis sous 12 h.</li><li>Après paiement, la mission démarre.</li><li>Vous suivez tout depuis l'application.</li></ol></section>
        ${trustStrip()}`,
        footer: `<div class="m-footer-price"><small>Tarif indicatif</small><strong>${esc(s.price)}</strong></div>${s.available ? `<a class="btn btn-primary" href="#/espace/nouvelle-demande?service=${s.id}">Demander</a>` : '<span class="badge badge-neutral">Indisponible</span>'}`,
    });
}

function screenNewRequest(params) {
    if (params.get('service') || params.get('confirmee')) return pageNewRequest(params);
    servicesState.q = '';
    servicesState.cat = 'all';
    servicesState.forRequest = true;
    return mobileLayout({ title: 'Nouvelle demande', subtitle: 'Moins de 3 minutes', whatsapp: false, content: `${wizardSteps(1)}${catalogControls()}` });
}

/* ---------- Mes demandes ---------- */
const mobileRequests = { q: '', status: 'all', visible: MOBILE_PAGE_SIZE };

function mobileFiltered() {
    const needle = normalize(mobileRequests.q.trim());
    return api.requestsOf(currentUser()).filter((r) => (mobileRequests.status === 'all' || r.status === mobileRequests.status)
        && (!needle || normalize(`${r.title} ${r.tracking}`).includes(needle)));
}

function mobileRequestList(all = false) {
    const list = mobileFiltered();
    if (!list.length) {
        return api.requestsOf(currentUser()).length
            ? `<div class="card">${emptyState('magnifying-glass', 'Aucune demande trouvée', 'Changez votre recherche ou le filtre.')}</div>`
            : `<div class="card">${emptyState('clipboard-document-list', 'Aucune demande', 'Votre première demande prend moins de 3 minutes.', '<a class="btn btn-primary" href="#/espace/nouvelle-demande">Faire une demande</a>')}</div>`;
    }
    const shown = all ? list : list.slice(0, mobileRequests.visible);
    return `<div class="card m-list">${shown.map(mobileRequestCard).join('')}</div>
    ${shown.length < list.length ? `<button class="btn btn-ghost btn-block no-print" type="button" data-action="mobileMoreRequests">Afficher plus (${list.length - shown.length})</button>` : ''}`;
}

function screenRequests(params) {
    if (params.get('statut')) mobileRequests.status = params.get('statut');
    const user = currentUser();
    const all = api.requestsOf(user);
    return mobileLayout({
        title: 'Mes demandes',
        subtitle: plural(all.length, 'demande'),
        tabs: true,
        actions: `<button class="icon-btn" type="button" data-action="mobileExport" aria-label="Exporter en PDF" title="Exporter en PDF">${icon('arrow-down-tray', 22)}</button>${bellLink()}`,
        content: `
        <div class="search-field no-print">${icon('magnifying-glass', 18)}<label class="sr-only" for="m-requests-q">Rechercher par titre</label><input id="m-requests-q" type="search" autocomplete="off" placeholder="Rechercher par titre…" value="${esc(mobileRequests.q)}" data-input="mobileRequestsSearch"></div>
        <div class="m-chips no-print" role="group" aria-label="Filtrer par statut">
            <button class="chip" type="button" data-action="mobileRequestsStatus" data-status="all" aria-pressed="${mobileRequests.status === 'all'}">Toutes <span class="chip-count">${all.length}</span></button>
            ${Object.keys(STATUS).map((key) => `<button class="chip" type="button" data-action="mobileRequestsStatus" data-status="${key}" aria-pressed="${mobileRequests.status === key}">${STATUS[key].label} <span class="chip-count">${all.filter((r) => r.status === key).length}</span></button>`).join('')}
        </div>
        <div class="print-only print-head"><strong>KWABO</strong> · Mes demandes · ${esc(fullName(user))} · ${fmtDate(new Date().toISOString())}</div>
        <div id="m-requests" class="m-stack">${mobileRequestList()}</div>`,
    });
}
const refreshMobileRequests = () => { $('#m-requests').innerHTML = mobileRequestList(); };
INPUTS.mobileRequestsSearch = (input) => { mobileRequests.q = input.value; mobileRequests.visible = MOBILE_PAGE_SIZE; refreshMobileRequests(); };
ACTIONS.mobileRequestsStatus = (el) => {
    mobileRequests.status = el.dataset.status;
    mobileRequests.visible = MOBILE_PAGE_SIZE;
    $$('[data-action="mobileRequestsStatus"]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.status === mobileRequests.status)));
    refreshMobileRequests();
};
ACTIONS.mobileMoreRequests = () => { mobileRequests.visible += MOBILE_PAGE_SIZE; refreshMobileRequests(); };
ACTIONS.mobileExport = () => {
    $('#m-requests').innerHTML = mobileRequestList(true);
    window.print();
    refreshMobileRequests();
};

/* ---------- Détail d'une demande : un onglet à la fois ---------- */
function screenRequestDetail(id, params) {
    const user = currentUser();
    const r = requestById(id);
    if (!r || r.userId !== user.id) {
        return mobileLayout({ title: 'Demande introuvable', content: emptyState('magnifying-glass', 'Demande introuvable', 'Elle n\'existe pas ou n\'est pas liée à votre compte.', '<a class="btn btn-primary" href="#/espace/demandes">Mes demandes</a>') });
    }
    const tab = params.get('onglet') ?? 'infos';
    if (tab === 'messages') api.markThreadRead(r.id, 'client');
    const docs = api.documentsOf(r.id);
    const unread = api.messagesOf(r.id).filter((m) => m.from === 'team' && !m.read).length;
    const due = dueInvoiceOf(r);
    const tabs = [['infos', 'Infos', 0], ['messages', 'Messages', unread], ['documents', 'Documents', docs.length], ['suivi', 'Suivi', 0]];
    const panels = {
        infos: () => `<section class="m-request-banner">${photoTag(SERVICE_PHOTOS[r.serviceId], 'm-zoom', false)}<div><span class="m-label-on-photo">${icon(serviceById(r.serviceId).icon, 14)}${esc(serviceById(r.serviceId).name)}</span>${statusSteps(r.status)}</div></section>
            ${requestInfoCard(r)}
            ${r.status === 'done' ? ratingCard(r) : ''}
            ${r.status === 'pending' ? `<section class="card"><h2>Changement de programme ?</h2><p class="muted">Vous pouvez annuler tant que la mission n'a pas démarré.</p><button class="btn btn-danger-ghost btn-block" type="button" data-action="cancelRequest" data-id="${r.id}">${icon('x-circle', 18)}Annuler la demande</button></section>` : ''}`,
        messages: () => `<section class="card">${threadPanel(r, user)}</section>`,
        documents: () => `<section class="card">${docs.length ? `<ul class="doc-list">${docs.map(documentItem).join('')}</ul>` : emptyState('folder', 'Aucun document', 'Vos rapports, photos, reçus et contrats apparaîtront ici.')}</section>`,
        suivi: () => historyCard(r),
    };
    return mobileLayout({
        title: r.title,
        subtitle: r.tracking,
        whatsapp: tab !== 'messages' && !due,
        actions: `<a class="icon-btn" href="${waLink(`Bonjour KWABO, ma demande ${r.tracking}`)}" target="_blank" rel="noopener" aria-label="Écrire sur WhatsApp">${WHATSAPP_ICON}</a>`,
        content: `
        <nav class="m-segments" aria-label="Sections de la demande">${tabs.map(([key, label, n]) => `<a href="#/espace/demandes/${r.id}?onglet=${key}" ${tab === key ? 'aria-current="page"' : ''}>${label}${n ? `<span class="count count-gold">${n}</span>` : ''}</a>`).join('')}</nav>
        ${(panels[tab] ?? panels.infos)()}`,
        footer: due ? `<div class="m-footer-price"><small>Devis à payer</small><strong>${money(due.amount)}</strong></div><button class="btn btn-gold" type="button" data-action="payInvoice" data-id="${due.id}">Payer</button>` : '',
    });
}

/* ---------- Messagerie ---------- */
function screenThreads() {
    const requests = api.requestsOf(currentUser());
    const threads = requests.map((r) => {
        const messages = api.messagesOf(r.id);
        return { r, last: messages.at(-1), unread: messages.filter((m) => m.from !== 'client' && !m.read).length };
    }).sort((a, b) => new Date(b.last?.at ?? 0) - new Date(a.last?.at ?? 0));
    return mobileLayout({
        title: 'Messages',
        subtitle: 'Un fil de discussion par demande',
        tabs: true,
        actions: bellLink(),
        content: threads.length ? `<div class="card m-list">${threads.map(({ r, last, unread }) => `<a class="m-thread-row" href="#/espace/messages/${r.id}">
            ${serviceThumb(serviceById(r.serviceId))}
            <span class="m-request-main"><strong>${esc(r.title)}</strong><small>${last ? esc(last.text || last.attachment) : 'Aucun message pour le moment'}</small></span>
            <span class="m-thread-side">${last ? `<small>${fmtDate(last.at).replace(/ \d{4}$/, '')}</small>` : ''}${unread ? `<span class="count count-gold">${unread}</span>` : ''}</span>
        </a>`).join('')}</div>` : `<div class="card">${emptyState('chat-bubble-left-right', 'Aucune discussion', 'Chaque demande a son fil de discussion avec notre équipe.', '<a class="btn btn-primary" href="#/espace/nouvelle-demande">Faire une demande</a>')}</div>`,
    });
}

/* Discussion en plein écran : la zone de saisie reste en bas. */
function screenChat(id) {
    const user = currentUser();
    const r = requestById(id);
    if (!r || r.userId !== user.id) return screenThreads();
    api.markThreadRead(r.id, 'client');
    return `<div class="m-chat">
        ${mobileBar({ title: r.title, subtitle: `${r.tracking} · ${STATUS[r.status].label}`, actions: `<a class="icon-btn" href="#/espace/demandes/${r.id}" aria-label="Voir la demande">${icon('information-circle', 24)}</a>` })}
        <main id="main" tabindex="-1">${threadPanel(r, user)}</main>
    </div>`;
}

/* ---------- Compte ---------- */
function screenAccount() {
    const user = currentUser();
    const dueCount = api.invoicesOf(user).filter((i) => i.status === 'due').length;
    const unread = api.notificationsOf(user).filter((n) => !n.read).length;
    const row = (href, ic, label, badge = '', external = false) => `<a class="m-menu-row" href="${href}" ${external ? 'target="_blank" rel="noopener"' : ''}><span class="tile tile-sm">${ic}</span><span>${esc(label)}</span>${badge ? `<span class="count count-gold">${badge}</span>` : ''}${icon('chevron-right', 18)}</a>`;
    return mobileLayout({
        title: 'Compte',
        tabs: true,
        whatsapp: false,
        content: `
        <a class="card m-profile-card" href="#/espace/profil"><span class="m-profile-cover">${photoTag('cotonou')}</span>${avatar(fullName(user))}<span><strong>${esc(fullName(user))}</strong><small>${esc(user.email)}</small></span>${icon('chevron-right', 18)}</a>
        <nav class="card m-list" aria-label="Mon espace">
            ${row('#/espace/documents', icon('folder', 18), 'Mes documents')}
            ${row('#/espace/paiements', icon('credit-card', 18), 'Paiements', dueCount)}
            ${row('#/espace/notifications', icon('bell', 18), 'Notifications', unread)}
            ${row('#/espace/parrainage', icon('gift', 18), 'Parrainage')}
            ${row('#/espace/services', icon('squares-2x2', 18), 'Catalogue des services')}
        </nav>
        <nav class="card m-list" aria-label="Aide et informations">
            ${row(waLink(), WHATSAPP_ICON, 'Écrire sur WhatsApp', '', true)}
            ${row('#/confidentialite', icon('lock-closed', 18), 'Confidentialité')}
            ${row('#/cgu', icon('document-text', 18), 'Conditions d\'utilisation')}
            ${row('#/mentions-legales', icon('information-circle', 18), 'Mentions légales')}
            ${row('#/credits-photos', icon('photo', 18), 'Crédits photos')}
        </nav>
        <button class="btn btn-ghost btn-block" type="button" data-action="logout">${icon('arrow-right-on-rectangle', 18)}Se déconnecter</button>
        <button class="link-btn m-center" type="button" data-action="resetDemo">Réinitialiser la démo</button>`,
    });
}

function screenCredits() {
    const back = currentUser() ? '#/espace/compte' : '#/connexion';
    return `<div class="m-screen"><header class="m-bar"><a class="icon-btn" href="${back}" aria-label="Retour">${icon('arrow-left', 24)}</a><div class="m-bar-title"><h1>Crédits photos</h1><p>Wikimedia Commons, licences libres</p></div></header>
    <main class="m-content m-stagger" id="main" tabindex="-1">${PHOTO_CREDITS.map((c) => `<a class="card m-credit" href="${esc(c.source)}" target="_blank" rel="noopener">${photoTag(c.file)}<span><strong>${esc(c.title)}</strong><small>${esc(c.author || 'Auteur non indiqué')} · ${esc(c.license)}</small></span></a>`).join('')}</main></div>`;
}

/* Les documents photo et vidéo montrent leur miniature (point d'extension de shared.js). */
function mobileDocumentItem(d) {
    const name = DOCUMENT_PHOTOS[d.id];
    if (!name) return null;
    return `<li class="doc-item"><button class="m-doc-thumb" type="button" data-action="previewDocument" data-id="${d.id}" aria-label="Voir ${esc(d.name)}">${photoTag(name)}${d.type === 'video' ? `<span class="m-play m-play-sm">${icon('video-camera', 14)}</span>` : ''}</button>
        <span class="doc-item-main"><strong>${esc(d.name)}</strong><small>${DOC_TYPES[d.type].label} · ${fmtDate(d.createdAt)}</small></span>
        <button class="icon-btn" type="button" data-action="previewDocument" data-id="${esc(d.id)}" aria-label="Voir ${esc(d.name)}" title="Voir">${icon('eye')}</button></li>`;
}

function mobileDocumentPreview(d) {
    const name = DOCUMENT_PHOTOS[d.id];
    if (!name) return null;
    return `<h2 class="dialog-title" id="dialog-heading">${esc(d.name)}</h2>
        <div class="m-viewer">${photoTag(name, '', false)}${d.type === 'video' ? `<span class="m-play m-play-lg">${icon('video-camera', 26)}</span>` : ''}</div>
        <p class="muted">${DOC_TYPES[d.type].label} du ${fmtDate(d.createdAt)}${d.type === 'video' ? ' · Démonstration : la vidéo se lira ici.' : ''}</p>`;
}

/* Les compteurs défilent jusqu'à leur valeur. */
function animateCounters() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    $$('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        const start = performance.now();
        const step = (now) => {
            const progress = Math.min(1, (now - start) / 700);
            el.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));
            if (progress < 1) requestAnimationFrame(step);
        };
        el.textContent = '0';
        requestAnimationFrame(step);
    });
}

function screenLegal(key) {
    const page = LEGAL[key];
    const back = currentUser() ? '#/espace/compte' : '#/connexion';
    return `<div class="m-screen"><header class="m-bar"><a class="icon-btn" href="${back}" aria-label="Retour">${icon('arrow-left', 24)}</a><div class="m-bar-title"><h1>${esc(page.title)}</h1></div></header>
    <main class="m-content" id="main" tabindex="-1"><div class="card legal"><p class="notice">${icon('information-circle')}Texte de travail, à faire valider par un juriste avant la mise en ligne.</p>${page.body.map(([t, d]) => `<h2>${esc(t)}</h2><p>${esc(d)}</p>`).join('')}</div></main></div>${whatsappFloat()}`;
}

/* ---------- Notifications push simulées ---------- */
let knownNotifications = new Set();
let pushUserId = null;
let pushTimer = null;

function syncPush(show) {
    const user = currentUser();
    if (!user) { pushUserId = null; return; }
    const list = api.notificationsOf(user);
    if (pushUserId !== user.id) { pushUserId = user.id; knownNotifications = new Set(list.map((n) => n.id)); return; }
    const fresh = list.filter((n) => !knownNotifications.has(n.id));
    fresh.forEach((n) => knownNotifications.add(n.id));
    if (show && fresh.length) showPush(fresh[0]);
}

function showPush(n) {
    $('#push').innerHTML = `<a class="m-push" href="${n.href}" data-action="openNotification" data-id="${n.id}">
        <span class="logo-mark">K</span>
        <span class="m-push-text"><span class="m-push-head"><strong>KWABO</strong><small>maintenant</small></span><span>${esc(n.text)}</span></span>
    </a>`;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { $('#push').innerHTML = ''; }, 7000);
}

window.addEventListener('kwabo:data', () => syncPush(true));

const PUSH_EXAMPLES = {
    quote: (t) => `Devis reçu pour « ${t} » : 120 €`,
    started: (t) => `Votre mission « ${t} » a démarré.`,
    report: (t) => `Rapport hebdomadaire disponible pour « ${t} »`,
    done: (t) => `Mission terminée : « ${t} »`,
    payment: (t) => `Paiement confirmé pour « ${t} »`,
};

/* Pilotage depuis la page de présentation mobile.html. */
function tellPreview() {
    if (window.parent === window) return;
    window.parent.postMessage({ type: 'kwabo-route', hash: location.hash || '#/', loggedIn: Boolean(currentUser()) }, '*');
}

window.addEventListener('message', (event) => {
    if (event.source !== window.parent || window.parent === window) return;
    const { type, hash, name } = event.data ?? {};
    if (type === 'kwabo-go') location.hash = hash;
    if (type === 'kwabo-login' && !currentUser()) {
        store.write(localStorage, ONBOARDING_KEY, true);
        api.login({ email: 'client@kwabo.demo', password: 'Demo1234', remember: true });
        location.hash = '#/espace';
    }
    if (type === 'kwabo-push') {
        const user = currentUser();
        if (!user) { toast('Connectez-vous d\'abord pour recevoir une notification.'); return; }
        const request = api.requestsOf(user)[0];
        const title = request?.title ?? 'Votre demande';
        notify(user.id, PUSH_EXAMPLES[name](title), request ? `#/espace/demandes/${request.id}` : '#/espace/notifications');
        save();
        syncPush(true);
        route({ keepPosition: true });
    }
});

/* ---------- Routeur ---------- */
function mobileScreen(parts, params) {
    const user = currentUser();
    const [section, sub, id] = parts;
    if (section === 'espace') {
        if (!user) { location.hash = `#/connexion?suite=${encodeURIComponent(location.hash)}`; return ''; }
        switch (sub) {
            case undefined: return screenHome();
            case 'services': return id ? screenService(id) : screenServices(params);
            case 'nouvelle-demande': return screenNewRequest(params);
            case 'demandes': return id ? screenRequestDetail(id, params) : screenRequests(params);
            case 'messages': return id ? screenChat(id) : screenThreads();
            case 'compte': return screenAccount();
            case 'documents': return pageClientDocuments();
            case 'paiements': return pageClientPayments();
            case 'parrainage': return pageClientReferral();
            case 'profil': return pageClientProfile();
            case 'notifications': return pageClientNotifications();
            default: location.hash = '#/espace'; return '';
        }
    }
    if (['connexion', 'inscription'].includes(section) && user) { location.hash = '#/espace'; return ''; }
    switch (section) {
        case undefined:
            if (user) { location.hash = '#/espace'; return ''; }
            if (store.read(localStorage, ONBOARDING_KEY)) { location.hash = '#/connexion'; return ''; }
            return screenOnboarding();
        case 'connexion': return pageLogin(params);
        case 'inscription': return pageRegister(params);
        case 'verification-email': return pageVerifyEmail();
        case 'mot-de-passe-oublie': return pageForgot();
        case 'reinitialiser-mot-de-passe': return pageReset();
        case 'mentions-legales': case 'confidentialite': case 'cgu': return screenLegal(section);
        case 'credits-photos': return screenCredits();
        default: location.hash = '#/'; return '';
    }
}

function route({ keepPosition = false } = {}) {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, query = ''] = raw.split('?');
    const scrollY = window.scrollY;
    const html = mobileScreen(path.split('/').filter(Boolean), new URLSearchParams(query));
    tellPreview();
    if (html === '') return;
    $('#root').innerHTML = html;
    syncPush(false);
    const heading = $('h1')?.textContent.trim();
    document.title = heading ? `${heading} · KWABO` : 'KWABO';
    scrollThreadToEnd();
    if (keepPosition) { window.scrollTo(0, scrollY); return; }
    document.body.classList.remove('m-enter');
    void document.body.offsetWidth;
    document.body.classList.add('m-enter');
    animateCounters();
    if (!isFirstMobileRender) $('#main')?.focus({ preventScroll: true });
    isFirstMobileRender = false;
    window.scrollTo(0, 0);
}
