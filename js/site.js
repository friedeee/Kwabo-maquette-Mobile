'use strict';
/* Site public et pages de connexion. */

const TRUST_POINTS = [
    { icon: 'video-camera', title: 'Vidéos et photos', text: 'Datées, pour voir le travail réalisé.' },
    { icon: 'receipt-percent', title: 'Reçus scannés', text: 'Pour chaque dépense engagée.' },
    { icon: 'document-check', title: 'Contrat signé', text: 'Avant le début de chaque mission.' },
    { icon: 'shield-check', title: 'Devis avant mission', text: 'Clair, sans frais cachés.' },
];

function trustStrip() {
    return `<ul class="trust-strip" aria-label="Nos garanties">${TRUST_POINTS.map((t) => `
        <li><span class="tile">${icon(t.icon)}</span><span><strong>${t.title}</strong><small>${t.text}</small></span></li>`).join('')}</ul>`;
}

function serviceCard(s, { href } = {}) {
    const cat = CATEGORIES.find((c) => c.id === s.cat);
    return `<a class="service-card" href="${href ?? `#/services/${s.id}`}">
        <span class="service-card-top cat-${s.cat}">${icon(s.icon, 26)}<span class="service-card-cat">${esc(cat.short)}</span></span>
        <span class="service-card-body">
            <strong>${esc(s.name)}</strong>
            <span class="muted">${esc(s.short)}</span>
            <span class="service-card-foot"><span class="price">${esc(s.price)}</span>${icon('arrow-right', 18)}</span>
        </span>
    </a>`;
}

function filterServices(q, category) {
    const needle = normalize(q.trim());
    return SERVICES.filter((s) => s.available && (!category || category === 'all' || s.cat === category)
        && (!needle || normalize(`${s.name} ${s.short} ${s.included.join(' ')}`).includes(needle)));
}

function searchBox({ id, large = false, placeholder }) {
    return `<form class="search ${large ? 'search-lg' : ''}" data-form="searchServices" role="search" autocomplete="off">
        <label class="sr-only" for="${id}">Rechercher un service</label>
        ${icon('magnifying-glass')}
        <input id="${id}" name="q" type="search" data-input="searchLive" placeholder="${esc(placeholder)}" role="combobox" aria-expanded="false" aria-controls="${id}-list" aria-autocomplete="list">
        <button class="btn ${large ? 'btn-gold' : 'btn-primary btn-icon'}" type="submit" aria-label="Rechercher">${large ? `${icon('magnifying-glass', 18)}<span>Rechercher</span>` : icon('magnifying-glass', 18)}</button>
        <div class="search-results" id="${id}-list" role="listbox" hidden></div>
    </form>`;
}

INPUTS.searchLive = (input) => {
    const form = input.closest('form');
    const list = $('.search-results', form);
    const q = input.value.trim();
    if (q.length < 2) { list.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
    const results = filterServices(q).slice(0, 6);
    list.innerHTML = results.length
        ? results.map((s) => `<a class="search-result" role="option" href="#/services/${s.id}"><span class="tile tile-sm">${icon(s.icon, 18)}</span><span><strong>${esc(s.name)}</strong><small>${esc(s.price)}</small></span></a>`).join('')
        : `<p class="search-empty">Aucun service pour « ${esc(q)} ». <a href="${waLink(`Bonjour KWABO, je cherche : ${q}`)}" target="_blank" rel="noopener">Demandez-nous sur WhatsApp</a></p>`;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
};

FORMS.searchServices = (form) => {
    const q = form.elements.q.value.trim();
    const inApp = location.hash.startsWith('#/espace');
    location.hash = `#/${inApp ? 'espace/' : ''}services${q ? `?q=${encodeURIComponent(q)}` : ''}`;
};

function siteHeader() {
    const user = currentUser();
    const home = user ? '#/espace' : null;
    return `<header class="site-header">
        <div class="container site-header-inner">
            ${logo()}
            <div class="site-header-search">${searchBox({ id: 'nav-search', placeholder: 'Cherchez un service…' })}</div>
            <button class="menu-toggle" type="button" data-action="toggleSiteMenu" aria-expanded="false" aria-controls="site-nav" aria-label="Ouvrir le menu">${icon('bars-3', 24)}</button>
            <nav class="site-nav" id="site-nav" aria-label="Navigation principale">
                <a href="#/services">Services</a>
                <a href="#/" data-scroll="confiance">Confiance</a>
                <a href="#/" data-scroll="faq">FAQ</a>
                ${user
                    ? `<a class="user-pill" href="${home}">${avatar(fullName(user), 'avatar-sm')}<span>Mon espace</span></a>`
                    : `<a href="#/connexion">Se connecter</a><a class="btn btn-primary" href="#/inscription">S'inscrire</a>`}
            </nav>
        </div>
    </header>`;
}

function siteFooter() {
    return `<footer class="site-footer">
        <div class="container footer-grid">
            <div class="footer-brand">
                ${logo(true)}
                <p>Votre présence de confiance au Bénin. Kwabo signifie « bienvenue » en fon.</p>
                <a class="btn btn-outline-light" href="${waLink()}" target="_blank" rel="noopener">${WHATSAPP_ICON}WhatsApp</a>
            </div>
            <div><h3>Services</h3><ul>${CATEGORIES.map((c) => `<li><a href="#/services?cat=${c.id}">${esc(c.name)}</a></li>`).join('')}</ul></div>
            <div><h3>KWABO</h3><ul>
                <li><a href="#/" data-scroll="comment">Comment ça marche</a></li>
                <li><a href="#/" data-scroll="confiance">Notre engagement</a></li>
                <li><a href="#/" data-scroll="faq">Questions fréquentes</a></li>
                <li><a href="#/espace">Mon espace client</a></li>
                <li><a href="mobile.html">Application mobile</a></li>
            </ul></div>
            <div><h3>Légal</h3><ul>
                <li><a href="#/mentions-legales">Mentions légales</a></li>
                <li><a href="#/confidentialite">Confidentialité</a></li>
                <li><a href="#/cgu">CGU</a></li>
            </ul></div>
        </div>
        <div class="container footer-bottom"><span>© 2026 KWABO Services · Cotonou, Bénin</span><span>Conçu pour la diaspora béninoise</span></div>
    </footer>`;
}

const siteLayout = (content) => `${siteHeader()}<main id="main" tabindex="-1">${content}</main>${siteFooter()}${whatsappFloat()}`;

/* ---------- Accueil ---------- */
let homeCategory = 'all';

function homeServicesGrid() {
    const list = filterServices('', homeCategory);
    return list.map((s) => serviceCard(s)).join('');
}

function pageHome() {
    const popularTags = [['suivi-chantier', 'Suivi de chantier'], ['sante', 'Santé de vos proches'], ['faire-venir', 'Dossier visa'], ['fret', 'Fret Europe'], ['comptabilite', 'Création d\'entreprise']];
    return siteLayout(`
    <section class="hero">
        <div class="container hero-inner">
            <p class="hero-eyebrow">Services de confiance pour la diaspora béninoise</p>
            <h1>Vos projets au Bénin,<br><em>entre de bonnes mains</em></h1>
            <p class="hero-sub">Immobilier, famille, démarches, logistique : une équipe sur place à Cotonou, qui prouve son travail par des vidéos, des reçus et des rapports.</p>
            ${searchBox({ id: 'hero-search', large: true, placeholder: 'Que cherchez-vous ? Suivi de chantier, visa, fret…' })}
            <div class="hero-tags">${popularTags.map(([id, label]) => `<a href="#/services/${id}">${esc(label)}</a>`).join('')}</div>
            <ul class="hero-checks">
                ${['Compte gratuit, sans engagement', 'Devis sous 12 h', 'Satisfait ou remboursé 30 jours'].map((t) => `<li>${icon('check-circle', 18)}${t}</li>`).join('')}
            </ul>
        </div>
    </section>

    <section class="section" id="services">
        <div class="container">
            <div class="section-head"><div><h2>12 services, 4 univers</h2><p class="muted">Tout ce que vous ne pouvez pas faire sur place, nous le faisons pour vous.</p></div>
                <a class="btn btn-ghost" href="#/services">Voir le catalogue${icon('arrow-right', 18)}</a></div>
            <div class="chips" role="group" aria-label="Filtrer par univers">
                <button class="chip" type="button" data-action="homeCategory" data-cat="all" aria-pressed="${homeCategory === 'all'}">${icon('squares-2x2', 18)}Tous</button>
                ${CATEGORIES.map((c) => `<button class="chip" type="button" data-action="homeCategory" data-cat="${c.id}" aria-pressed="${homeCategory === c.id}">${icon(c.icon, 18)}${esc(c.name)}</button>`).join('')}
            </div>
            <div class="service-grid" id="home-services">${homeServicesGrid()}</div>
        </div>
    </section>

    <section class="section section-white" id="comment">
        <div class="container">
            <div class="section-head section-head-center"><div><h2>Comment ça marche</h2><p class="muted">De l'inscription à la mission réalisée, en 4 étapes.</p></div></div>
            <ol class="steps">
                ${[['Créez votre compte', 'Gratuit, en moins d\'une minute. Votre espace personnel est prêt.'],
                    ['Décrivez votre besoin', 'Choisissez un service et remplissez un formulaire adapté, en moins de 3 minutes.'],
                    ['Recevez un devis', 'Notre équipe répond sous 12 h. Clair, tout compris, sans frais cachés.'],
                    ['Suivez en direct', 'Vidéos, reçus, rapports et messages : tout est dans votre espace.']]
                    .map(([t, d], i) => `<li><span class="step-num">${i + 1}</span><h3>${t}</h3><p class="muted">${d}</p></li>`).join('')}
            </ol>
        </div>
    </section>

    <section class="section trust-section" id="confiance">
        <div class="container trust-grid">
            <div>
                <p class="eyebrow-gold">Pourquoi KWABO</p>
                <h2>La transparence, notre seule loi</h2>
                <p>Chaque intervention est documentée : vidéo, photos datées, reçus scannés pour chaque dépense, rapport écrit. Votre confiance n'est pas un bonus, c'est notre produit principal.</p>
                <div class="btn-row">
                    <a class="btn btn-gold btn-lg" href="#/inscription">Créer mon compte gratuit</a>
                    <a class="btn btn-outline-light btn-lg" href="${waLink()}" target="_blank" rel="noopener">${WHATSAPP_ICON}WhatsApp</a>
                </div>
            </div>
            <ul class="trust-cards">${TRUST_POINTS.map((t) => `<li><span class="trust-card-icon">${icon(t.icon, 24)}</span><strong>${t.title}</strong><span>${t.text}</span></li>`).join('')}</ul>
        </div>
    </section>

    <section class="section section-white">
        <div class="container">
            <div class="section-head section-head-center"><div><h2>Ce que la diaspora nous demande</h2></div></div>
            <div class="tag-cloud">${TAGS.map((t) => `<a href="#/services?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div>
        </div>
    </section>

    <section class="section" id="faq">
        <div class="container container-narrow">
            <div class="section-head section-head-center"><div><h2>Questions fréquentes</h2></div></div>
            <div class="faq">${FAQ.map((f) => `<details><summary>${esc(f.q)}${icon('chevron-down', 20)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>
        </div>
    </section>

    <section class="section section-tight">
        <div class="container">
            <div class="cta-box">
                <h2>Votre espace personnel vous attend</h2>
                <p class="muted">Inscription gratuite, aucune carte bancaire. Un devis clair avant chaque mission.</p>
                <div class="btn-row btn-row-center">
                    <a class="btn btn-primary btn-lg" href="#/inscription">${icon('user-plus', 20)}Créer mon compte gratuit</a>
                    <a class="btn btn-ghost btn-lg" href="#/connexion">J'ai déjà un compte</a>
                </div>
            </div>
        </div>
    </section>`);
}

ACTIONS.homeCategory = (el) => {
    homeCategory = el.dataset.cat;
    $$('[data-action="homeCategory"]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === homeCategory)));
    $('#home-services').innerHTML = homeServicesGrid();
};

/* ---------- Catalogue ---------- */
function catalogBody(params, inApp) {
    const q = params.get('q') ?? '';
    const cat = params.get('cat') ?? 'all';
    const base = inApp ? '#/espace/services' : '#/services';
    const list = filterServices(q, cat);
    const link = (s) => (inApp ? `#/espace/nouvelle-demande?service=${s.id}` : `#/services/${s.id}`);
    return `
    <div class="toolbar">
        <div class="field-inline">
            <label class="sr-only" for="catalog-q">Rechercher</label>
            <input id="catalog-q" type="search" value="${esc(q)}" data-input="catalogFilter" data-base="${base}" placeholder="Rechercher un service…" autocomplete="off">
        </div>
    </div>
    <div class="chips" role="group" aria-label="Filtrer par univers">
        <button class="chip" type="button" data-action="catalogCategory" data-cat="all" aria-pressed="${cat === 'all'}">Tous</button>
        ${CATEGORIES.map((c) => `<button class="chip" type="button" data-action="catalogCategory" data-cat="${c.id}" aria-pressed="${cat === c.id}">${icon(c.icon, 18)}${esc(c.name)}</button>`).join('')}
    </div>
    <p class="muted result-count" aria-live="polite" id="catalog-count">${list.length} service${list.length > 1 ? 's' : ''}</p>
    <div class="service-grid" id="catalog-grid" data-in-app="${inApp ? 1 : 0}">
        ${list.length ? list.map((s) => serviceCard(s, { href: link(s) })).join('') : emptyState('magnifying-glass', 'Aucun service trouvé', 'Essayez un autre mot, ou écrivez-nous sur WhatsApp.')}
    </div>`;
}

let catalogState = { q: '', cat: 'all' };

function refreshCatalog(inApp) {
    const list = filterServices(catalogState.q, catalogState.cat);
    const link = (s) => (inApp ? `#/espace/nouvelle-demande?service=${s.id}` : `#/services/${s.id}`);
    $('#catalog-grid').innerHTML = list.length ? list.map((s) => serviceCard(s, { href: link(s) })).join('') : emptyState('magnifying-glass', 'Aucun service trouvé', 'Essayez un autre mot, ou écrivez-nous sur WhatsApp.');
    $('#catalog-count').textContent = `${list.length} service${list.length > 1 ? 's' : ''}`;
}

INPUTS.catalogFilter = (input) => {
    catalogState.q = input.value;
    refreshCatalog($('#catalog-grid').dataset.inApp === '1');
};

ACTIONS.catalogCategory = (el) => {
    catalogState.cat = el.dataset.cat;
    $$('[data-action="catalogCategory"]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === catalogState.cat)));
    refreshCatalog($('#catalog-grid').dataset.inApp === '1');
};

function pageServices(params) {
    catalogState = { q: params.get('q') ?? '', cat: params.get('cat') ?? 'all' };
    return siteLayout(`
    <section class="page-banner"><div class="container"><h1>Nos services</h1><p>Trouvez le service adapté à votre besoin, en quelques secondes.</p></div></section>
    <section class="section section-tight"><div class="container">${catalogBody(params, false)}<div class="spacer"></div>${trustStrip()}</div></section>`);
}

function pageServiceDetail(id) {
    const s = serviceById(id);
    if (!s) return pageNotFound();
    const cat = CATEGORIES.find((c) => c.id === s.cat);
    const others = SERVICES.filter((x) => x.cat === s.cat && x.id !== s.id);
    const start = currentUser() ? `#/espace/nouvelle-demande?service=${s.id}` : `#/inscription?service=${s.id}`;
    return siteLayout(`
    <section class="page-banner cat-banner cat-${s.cat}">
        <div class="container">
            <a class="breadcrumb" href="#/services?cat=${s.cat}">${icon('arrow-left', 16)}${esc(cat.name)}</a>
            <h1>${esc(s.name)}</h1>
            <p>${esc(s.short)}</p>
        </div>
    </section>
    <section class="section section-tight">
        <div class="container detail-grid">
            <div>
                <div class="card"><h2>Ce qui est inclus</h2>
                    <ul class="check-list">${s.included.map((i) => `<li>${icon('check-circle', 20)}${esc(i)}</li>`).join('')}</ul>
                </div>
                <div class="card"><h2>Comment ça se passe</h2>
                    <ol class="mini-steps"><li>Vous décrivez votre besoin en moins de 3 minutes.</li><li>Vous recevez un devis sous 12 h.</li><li>Après paiement, la mission démarre.</li><li>Vous suivez tout depuis votre espace : documents, messages, statut.</li></ol>
                </div>
                ${trustStrip()}
            </div>
            <aside class="card price-card">
                <span class="muted">Tarif indicatif</span>
                <strong class="price-big">${esc(s.price)}</strong>
                <p class="muted">Le prix exact figure dans votre devis, avant tout paiement.</p>
                <a class="btn btn-primary btn-lg btn-block" href="${start}">Demander ce service</a>
                <a class="btn btn-ghost btn-block" href="${waLink(`Bonjour KWABO, j'ai une question sur : ${s.name}`)}" target="_blank" rel="noopener">${WHATSAPP_ICON}Une question ?</a>
            </aside>
        </div>
    </section>
    ${others.length ? `<section class="section section-white"><div class="container"><div class="section-head"><div><h2>Dans le même univers</h2></div></div><div class="service-grid">${others.map((x) => serviceCard(x)).join('')}</div></div></section>` : ''}`);
}

/* ---------- Pages légales : textes de travail, à faire valider ---------- */
const LEGAL = {
    'mentions-legales': { title: 'Mentions légales', body: [
        ['Éditeur', 'KWABO Services, Cotonou, Bénin. Forme juridique, numéro d\'immatriculation et adresse complète : à compléter.'],
        ['Contact', 'À compléter : e-mail et téléphone officiels.'],
        ['Hébergement', 'À compléter selon l\'hébergeur retenu.'],
    ] },
    confidentialite: { title: 'Politique de confidentialité', body: [
        ['Données collectées', 'Identité, e-mail, téléphone, pays de résidence, et les informations que vous donnez dans vos demandes.'],
        ['Utilisation', 'Traiter vos demandes, vous envoyer vos devis et rapports, et vous informer de l\'avancement de vos missions.'],
        ['Données bancaires', 'Aucune donnée de carte bancaire n\'est conservée par KWABO. Les paiements sont gérés par le prestataire de paiement.'],
        ['Vos droits', 'Vous pouvez consulter, corriger et supprimer vos données. La suppression de votre compte efface toutes les données associées, depuis « Mon profil ».'],
    ] },
    cgu: { title: 'Conditions générales d\'utilisation', body: [
        ['Objet', 'Ces conditions encadrent l\'utilisation de la plateforme KWABO.'],
        ['Devis et paiement', 'Une mission démarre après acceptation et paiement du devis.'],
        ['Annulation', 'Vous pouvez annuler une demande tant qu\'elle n\'a pas été acceptée.'],
    ] },
};

function pageLegal(key) {
    const page = LEGAL[key];
    return siteLayout(`
    <section class="page-banner"><div class="container"><h1>${esc(page.title)}</h1></div></section>
    <section class="section section-tight"><div class="container container-narrow"><div class="card legal">
        <p class="notice">${icon('information-circle')}Texte de travail, à faire valider par un juriste avant la mise en ligne.</p>
        ${page.body.map(([t, d]) => `<h2>${esc(t)}</h2><p>${esc(d)}</p>`).join('')}
    </div></div></section>`);
}

function pageNotFound() {
    return siteLayout(`<section class="section"><div class="container container-narrow">${emptyState('magnifying-glass', 'Page introuvable', 'Cette page n\'existe pas ou a été déplacée.', '<a class="btn btn-primary" href="#/">Retour à l\'accueil</a>')}</div></section>`);
}

/* ---------- Connexion et inscription ---------- */
function authLayout(content, aside = true) {
    if (typeof mobileAuthLayout === 'function') return mobileAuthLayout(content);
    return `<div class="auth">
        ${aside ? `<aside class="auth-aside">
            ${logo(true)}
            <div>
                <h2>Votre présence de confiance <em>au Bénin</em></h2>
                <ul class="auth-points">${TRUST_POINTS.map((t) => `<li><span class="trust-card-icon">${icon(t.icon, 20)}</span><span><strong>${t.title}</strong><small>${t.text}</small></span></li>`).join('')}</ul>
            </div>
            <p class="auth-foot">Kwabo : « bienvenue » en fon.</p>
        </aside>` : ''}
        <main class="auth-main" id="main" tabindex="-1">
            <div class="auth-mobile-logo">${logo()}</div>
            <div class="auth-card">${content}</div>
            <p class="auth-legal"><a href="#/confidentialite">Confidentialité</a> · <a href="#/cgu">CGU</a> · <a href="#/">Retour au site</a></p>
        </main>
    </div>${whatsappFloat()}`;
}

let pendingLogin = null;

function pageLogin(params) {
    const next = params.get('suite') ?? '';
    if (pendingLogin) {
        return authLayout(`
        <h1>Code de vérification</h1>
        <p class="muted">Saisissez le code à 6 chiffres de votre application d'authentification.</p>
        <form data-form="loginCode" novalidate>
            <p class="form-error" role="alert" hidden></p>
            ${field({ name: 'code', label: 'Code', required: true, autocomplete: 'one-time-code', hint: 'Démonstration : 123456', attrs: 'inputmode="numeric" maxlength="6" autofocus' })}
            <button class="btn btn-primary btn-lg btn-block" type="submit">Vérifier</button>
        </form>
        <button class="link-btn" type="button" data-action="cancelCode">${icon('arrow-left', 16)}Retour</button>`);
    }
    return authLayout(`
    <h1>Bon retour</h1>
    <p class="muted">Connectez-vous à votre espace KWABO.</p>
    <form data-form="login" data-next="${esc(next)}" novalidate>
        <p class="form-error" role="alert" hidden></p>
        ${field({ name: 'email', label: 'E-mail', type: 'email', required: true, autocomplete: 'username', placeholder: 'vous@exemple.com' })}
        ${field({ name: 'password', label: 'Mot de passe', type: 'password', required: true, autocomplete: 'current-password' })}
        <div class="form-row-between">
            <label class="check"><input type="checkbox" name="remember">Rester connecté</label>
            <a href="#/mot-de-passe-oublie">Mot de passe oublié ?</a>
        </div>
        <button class="btn btn-primary btn-lg btn-block" type="submit">Se connecter</button>
    </form>
    <p class="auth-switch">Pas encore de compte ? <a href="#/inscription${next ? `?suite=${encodeURIComponent(next)}` : ''}">Créer un compte</a></p>
    <div class="demo-accounts">
        <p>Comptes de démonstration</p>
        <div>
            <button class="btn btn-ghost btn-sm" type="button" data-action="demoLogin" data-email="client@kwabo.demo">Client</button>
            <a class="btn btn-ghost btn-sm" href="admin.html">Espace équipe</a>
            <a class="btn btn-ghost btn-sm" href="mobile.html">Application mobile</a>
        </div>
        <button class="link-btn" type="button" data-action="resetDemo">Réinitialiser la démo</button>
    </div>`);
}

ACTIONS.demoLogin = (el) => {
    const form = $('form[data-form="login"]');
    form.elements.email.value = el.dataset.email;
    form.elements.password.value = 'Demo1234';
    clearErrors(form);
    form.querySelector('button[type="submit"]').focus();
};

function afterLogin(user, next) {
    pendingLogin = null;
    location.hash = next || '#/espace';
    route();
}

FORMS.login = (form) => {
    const email = form.elements.email.value;
    const password = form.elements.password.value;
    const errors = {};
    if (!email.includes('@')) errors.email = 'Saisissez une adresse e-mail valide.';
    if (!password) errors.password = 'Saisissez votre mot de passe.';
    if (!showErrors(form, errors)) return;
    const remember = form.elements.remember.checked;
    try {
        const result = api.login({ email, password, remember });
        if (result.needsCode) {
            pendingLogin = { email, password, remember, next: form.dataset.next };
            route();
            return;
        }
        afterLogin(result.user, form.dataset.next);
    } catch (error) { apiErrorToForm(form, error, 'email'); }
};

FORMS.loginCode = (form) => {
    try {
        afterLogin(api.login({ ...pendingLogin, code: form.elements.code.value.trim() }).user, pendingLogin.next);
    } catch (error) { apiErrorToForm(form, error, 'code'); }
};

ACTIONS.cancelCode = () => { pendingLogin = null; route(); };

function pageRegister(params) {
    const service = params.get('service');
    const next = params.get('suite') ?? (service ? `#/espace/nouvelle-demande?service=${service}` : '');
    return authLayout(`
    <h1>Créer mon compte</h1>
    <p class="muted">Gratuit, sans engagement, en moins d'une minute.</p>
    <form data-form="register" data-next="${esc(next)}" novalidate>
        <p class="form-error" role="alert" hidden></p>
        <div class="form-grid">
            ${field({ name: 'firstName', label: 'Prénom', required: true, autocomplete: 'given-name' })}
            ${field({ name: 'lastName', label: 'Nom', required: true, autocomplete: 'family-name' })}
        </div>
        ${field({ name: 'email', label: 'E-mail', type: 'email', required: true, autocomplete: 'email', placeholder: 'vous@exemple.com' })}
        <div class="form-grid form-grid-phone">
            ${field({ name: 'dial', label: 'Indicatif', type: 'select', required: true, placeholder: false, value: '+33', options: DIAL_CODES })}
            ${field({ name: 'phone', label: 'Téléphone', type: 'tel', required: true, autocomplete: 'tel-national' })}
        </div>
        ${field({ name: 'country', label: 'Pays de résidence', type: 'select', required: true, options: COUNTRIES, autocomplete: 'country-name' })}
        ${field({ name: 'password', label: 'Mot de passe', type: 'password', required: true, autocomplete: 'new-password', hint: 'Au moins 8 caractères, avec 1 majuscule et 1 chiffre.' })}
        ${field({ name: 'sponsorCode', label: 'Code de parrainage', placeholder: 'KW-…' })}
        <label class="check check-top" for="f-terms"><input type="checkbox" id="f-terms" name="terms"><span>J'accepte les <a href="#/cgu">CGU</a> et la <a href="#/confidentialite">politique de confidentialité</a>.</span></label>
        <p class="error" id="f-terms-error" hidden></p>
        <button class="btn btn-primary btn-lg btn-block" type="submit">Créer mon compte</button>
    </form>
    <p class="auth-switch">Déjà un compte ? <a href="#/connexion">Se connecter</a></p>`);
}

let signupEmail = null;
let signupNext = '';

FORMS.register = (form) => {
    const v = Object.fromEntries(new FormData(form));
    const errors = {};
    if (!v.firstName?.trim()) errors.firstName = 'Saisissez votre prénom.';
    if (!v.lastName?.trim()) errors.lastName = 'Saisissez votre nom.';
    if (!/^\S+@\S+\.\S+$/.test(v.email ?? '')) errors.email = 'Saisissez une adresse e-mail valide.';
    if ((v.phone ?? '').replace(/\D/g, '').length < 6) errors.phone = 'Saisissez un numéro valide.';
    if (!v.country) errors.country = 'Choisissez votre pays.';
    const problem = passwordProblem(v.password ?? '');
    if (problem) errors.password = problem;
    if (!form.elements.terms.checked) errors.terms = 'Vous devez accepter les conditions pour continuer.';
    if (!showErrors(form, errors)) return;
    try {
        const user = api.register(v);
        signupEmail = user.email;
        signupNext = form.dataset.next;
        location.hash = '#/verification-email';
    } catch (error) { apiErrorToForm(form, error, 'email'); }
};

function pageVerifyEmail() {
    return authLayout(`
    <span class="tile tile-lg">${icon('envelope', 28)}</span>
    <h1>Vérifiez votre e-mail</h1>
    <p class="muted">Nous avons envoyé un lien de confirmation à <strong>${esc(signupEmail ?? 'votre adresse')}</strong>. Votre compte s'active dès que vous cliquez dessus.</p>
    ${signupEmail ? `<div class="demo-accounts"><p>Démonstration : aucun e-mail n'est vraiment envoyé.</p><button class="btn btn-primary btn-block" type="button" data-action="confirmEmail">Simuler le clic sur le lien</button></div>` : '<a class="btn btn-primary btn-block" href="#/connexion">Aller à la connexion</a>'}`);
}

ACTIONS.confirmEmail = () => {
    const user = api.verifyEmail(signupEmail);
    signupEmail = null;
    session.open(user.id, false);
    toast(`Bienvenue ${user.firstName}, votre compte est actif.`);
    location.hash = signupNext || '#/espace';
};

let resetEmail = null;

function pageForgot() {
    return authLayout(`
    <h1>Mot de passe oublié</h1>
    <p class="muted">Indiquez votre e-mail : nous vous enverrons un lien valable 1 heure.</p>
    <form data-form="forgot" novalidate>
        ${field({ name: 'email', label: 'E-mail', type: 'email', required: true, autocomplete: 'email' })}
        <button class="btn btn-primary btn-lg btn-block" type="submit">Envoyer le lien</button>
    </form>
    <p class="auth-switch"><a href="#/connexion">Retour à la connexion</a></p>`);
}

FORMS.forgot = (form) => {
    const email = form.elements.email.value.trim().toLowerCase();
    if (!showErrors(form, email.includes('@') ? {} : { email: 'Saisissez une adresse e-mail valide.' })) return;
    resetEmail = email;
    location.hash = '#/reinitialiser-mot-de-passe';
};

function pageReset() {
    if (!resetEmail) { location.hash = '#/mot-de-passe-oublie'; return ''; }
    return authLayout(`
    <h1>Nouveau mot de passe</h1>
    <p class="notice">${icon('information-circle')}Démonstration : en vrai, on arrive ici par le lien reçu par e-mail.</p>
    <form data-form="reset" novalidate>
        <p class="form-error" role="alert" hidden></p>
        ${field({ name: 'password', label: 'Nouveau mot de passe', type: 'password', required: true, autocomplete: 'new-password', hint: 'Au moins 8 caractères, avec 1 majuscule et 1 chiffre.' })}
        <button class="btn btn-primary btn-lg btn-block" type="submit">Enregistrer</button>
    </form>`);
}

FORMS.reset = (form) => {
    const problem = passwordProblem(form.elements.password.value);
    if (!showErrors(form, problem ? { password: problem } : {})) return;
    try {
        api.resetPassword(resetEmail, form.elements.password.value);
        resetEmail = null;
        toast('Mot de passe enregistré. Vous pouvez vous connecter.');
        location.hash = '#/connexion';
    } catch (error) { apiErrorToForm(form, error); }
};
