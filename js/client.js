'use strict';
/* Espace client, et gabarit commun avec le back-office. */

function clientLayout(options) {
    if (typeof mobileLayout === 'function') return mobileLayout(options);
    const user = currentUser();
    const unreadMessages = api.unreadMessages(user);
    const unreadNotifications = api.notificationsOf(user).filter((n) => !n.read).length;
    return appLayout({
        user,
        bellHref: '#/espace/notifications',
        bellCount: unreadNotifications,
        nav: [
            { href: '#/espace', icon: 'home', label: 'Tableau de bord', exact: true },
            { href: '#/espace/services', icon: 'squares-2x2', label: 'Catalogue' },
            { href: '#/espace/nouvelle-demande', icon: 'plus-circle', label: 'Nouvelle demande' },
            { href: '#/espace/demandes', icon: 'clipboard-document-list', label: 'Mes demandes' },
            { href: '#/espace/documents', icon: 'folder', label: 'Mes documents' },
            { href: '#/espace/messages', icon: 'chat-bubble-left-right', label: 'Messagerie', badge: unreadMessages },
            { href: '#/espace/paiements', icon: 'credit-card', label: 'Paiements' },
            { href: '#/espace/parrainage', icon: 'gift', label: 'Parrainage' },
            { href: '#/espace/profil', icon: 'user', label: 'Mon profil' },
        ],
        tabs: [
            { href: '#/espace', icon: 'home', label: 'Accueil', exact: true },
            { href: '#/espace/demandes', icon: 'clipboard-document-list', label: 'Demandes' },
            { href: '#/espace/nouvelle-demande', icon: 'plus', label: 'Nouvelle', primary: true },
            { href: '#/espace/messages', icon: 'chat-bubble-left-right', label: 'Messages', badge: unreadMessages },
            { href: '#/espace/profil', icon: 'user', label: 'Profil' },
        ],
        ...options,
    });
}

/* ---------- Tableau de bord ---------- */
function pageClientDashboard() {
    const user = currentUser();
    const requests = api.requestsOf(user);
    const count = (status) => requests.filter((r) => r.status === status).length;
    const unread = api.notificationsOf(user).filter((n) => !n.read);
    const due = api.invoicesOf(user).filter((i) => i.status === 'due');
    const active = requests.find((r) => r.status === 'active');
    const lastDocs = db.documents.filter((d) => requests.some((r) => r.id === d.requestId)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
    const stats = [
        ['clipboard-document-list', requests.length, 'Demandes au total', 'neutral'],
        ['clock', count('pending'), 'En attente', 'gold'],
        ['bolt', count('active'), 'En cours', 'green'],
        ['check-circle', count('done'), 'Terminées', 'neutral'],
    ];
    return clientLayout({
        title: 'Tableau de bord',
        content: `
        <section class="welcome">
            <div><h2>Bonjour ${esc(user.firstName)}</h2><p>${active ? `Votre mission « ${esc(active.title)} » avance. Tout est à jour ci-dessous.` : 'Dites-nous ce dont vous avez besoin au Bénin, nous nous en occupons.'}</p></div>
            <a class="btn btn-gold btn-lg" href="#/espace/nouvelle-demande">${icon('plus-circle')}Nouvelle demande</a>
        </section>
        <ul class="stats">${stats.map(([ic, value, label, tone]) => `<li class="stat stat-${tone}"><span class="tile tile-sm">${icon(ic, 18)}</span><strong>${value}</strong><span>${label}</span></li>`).join('')}</ul>
        ${due.map((i) => `<div class="alert"><span class="tile tile-sm">${icon('banknotes', 18)}</span><p><strong>Un devis attend votre paiement.</strong> ${esc(i.label)} : ${money(i.amount)}. La mission démarre dès le paiement.</p><button class="btn btn-gold btn-sm" type="button" data-action="payInvoice" data-id="${i.id}">Payer</button></div>`).join('')}
        <div class="dash-grid">
            <div class="stack">
                <section class="card"><div class="card-head"><h2>Mes dernières demandes</h2><a href="#/espace/demandes">Tout voir</a></div>
                    ${requests.length ? `<div class="request-list">${requests.slice(0, 3).map((r) => requestRow(r, user)).join('')}</div>` : emptyState('clipboard-document-list', 'Aucune demande', 'Votre première demande prend moins de 3 minutes.', '<a class="btn btn-primary" href="#/espace/nouvelle-demande">Faire une demande</a>')}
                </section>
                ${active ? `<section class="card"><div class="card-head"><h2>Mission en cours</h2><a href="${requestUrl(active, user)}">Ouvrir</a></div>
                    <p class="card-lead">${esc(active.title)}</p>${statusSteps(active.status)}
                    <p class="muted last-event">${icon('clock', 16)}Dernière mise à jour : ${esc(active.history.at(-1).text)}, ${fmtDateTime(active.history.at(-1).at)}</p>
                </section>` : ''}
            </div>
            <div class="stack">
                <section class="card"><div class="card-head"><h2>Notifications</h2><a href="#/espace/notifications">Tout voir</a></div>
                    ${unread.length ? `<ul class="notif-list">${unread.slice(0, 3).map(notificationItem).join('')}</ul>` : '<p class="muted">Rien de nouveau. Vous êtes à jour.</p>'}
                </section>
                ${lastDocs.length ? `<section class="card"><div class="card-head"><h2>Derniers documents</h2><a href="#/espace/documents">Tout voir</a></div><ul class="doc-list">${lastDocs.map(documentItem).join('')}</ul></section>` : ''}
            </div>
        </div>
        <section class="section-in-app"><div class="card-head"><h2>Services les plus demandés</h2><a href="#/espace/services">Voir le catalogue</a></div>
            <div class="service-grid service-grid-compact">${SERVICES.filter((s) => s.popular && s.available).slice(0, 4).map((s) => serviceCard(s, { href: `#/espace/nouvelle-demande?service=${s.id}` })).join('')}</div>
        </section>`,
    });
}

/* ---------- Catalogue et nouvelle demande ---------- */
function pageClientCatalog(params) {
    catalogState = { q: params.get('q') ?? '', cat: params.get('cat') ?? 'all' };
    return clientLayout({ title: 'Catalogue', subtitle: 'Choisissez un service pour faire votre demande', content: catalogBody(params, true) });
}

function wizardSteps(step) {
    return `<ol class="wizard">${['Choix du service', 'Votre besoin', 'Confirmation'].map((label, i) => `<li class="${i + 1 < step ? 'is-done' : ''} ${i + 1 === step ? 'is-current' : ''}" ${i + 1 === step ? 'aria-current="step"' : ''}><span>${i + 1 < step ? icon('check', 16) : i + 1}</span>${label}</li>`).join('')}</ol>`;
}

function pageNewRequest(params) {
    const created = params.get('confirmee') ? requestById(params.get('confirmee')) : null;
    if (created) {
        return clientLayout({ title: 'Nouvelle demande', content: `${wizardSteps(3)}
        <section class="card confirm-card">
            <span class="tile tile-lg tile-success">${icon('check-circle', 32)}</span>
            <h2>Votre demande est bien reçue</h2>
            <p class="muted">Gardez ce numéro de suivi. Vous le retrouvez aussi dans « Mes demandes ».</p>
            <p class="tracking"><strong>${esc(created.tracking)}</strong><button class="icon-btn" type="button" data-action="copyText" data-text="${esc(created.tracking)}" aria-label="Copier le numéro de suivi" title="Copier">${icon('clipboard-document')}</button></p>
            <ol class="mini-steps"><li>Notre équipe étudie votre besoin.</li><li>Vous recevez un devis sous 12 h, par notification et par e-mail.</li><li>La mission démarre après votre paiement.</li></ol>
            <div class="btn-row btn-row-center">
                <a class="btn btn-primary" href="#/espace/demandes/${created.id}">Suivre ma demande</a>
                <a class="btn btn-ghost" href="#/espace">Retour au tableau de bord</a>
            </div>
        </section>` });
    }
    const service = serviceById(params.get('service'));
    if (!service) {
        catalogState = { q: params.get('q') ?? '', cat: params.get('cat') ?? 'all' };
        return clientLayout({ title: 'Nouvelle demande', subtitle: 'Moins de 3 minutes', content: `${wizardSteps(1)}${catalogBody(params, true)}` });
    }
    const specific = service.fields.map((f) => field({ ...f, name: f.name, type: f.type ?? 'text' })).join('');
    return clientLayout({ title: 'Nouvelle demande', subtitle: service.name, content: `${wizardSteps(2)}
    <div class="detail-grid">
        <form class="card form-card" data-form="createRequest" data-service="${service.id}" novalidate>
            <p class="form-error" role="alert" hidden></p>
            <h2>Votre besoin en quelques mots</h2>
            ${field({ name: 'title', label: 'Titre de la demande', required: true, placeholder: 'Ex. : Suivi de ma maison à Calavi', hint: 'Il vous servira à retrouver votre demande.' })}
            <div class="form-grid">
                ${field({ name: 'city', label: 'Ville au Bénin', type: 'select', required: true, options: CITIES })}
                ${field({ name: 'urgency', label: 'Urgence', type: 'select', required: true, placeholder: false, value: 'normal', options: [{ value: 'normal', label: 'Normale' }, { value: 'urgent', label: 'Urgent' }] })}
            </div>
            ${field({ name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Expliquez ce que vous attendez de nous.' })}
            ${field({ name: 'budget', label: 'Budget estimé', placeholder: 'Ex. : 200 €' })}
            <h2 class="form-section">Détails pour « ${esc(service.name)} »</h2>
            <div class="form-grid form-grid-auto">${specific}</div>
            <div class="form-actions">
                <a class="btn btn-ghost" href="#/espace/nouvelle-demande">${icon('arrow-left', 18)}Changer de service</a>
                <button class="btn btn-primary btn-lg" type="submit">Envoyer ma demande</button>
            </div>
        </form>
        <aside class="stack">
            <section class="card">
                <span class="tile cat-${service.cat}">${icon(service.icon)}</span>
                <h2>${esc(service.name)}</h2>
                <p class="price">${esc(service.price)}</p>
                <ul class="check-list">${service.included.map((i) => `<li>${icon('check-circle', 18)}${esc(i)}</li>`).join('')}</ul>
            </section>
            <section class="card card-soft"><h2>Rien à payer maintenant</h2><p class="muted">Vous recevez d'abord un devis. La mission démarre seulement après votre accord et votre paiement.</p></section>
        </aside>
    </div>` });
}

FORMS.createRequest = (form) => {
    const service = serviceById(form.dataset.service);
    const v = Object.fromEntries(new FormData(form));
    const errors = {};
    if (!v.title.trim()) errors.title = 'Donnez un titre à votre demande.';
    if (!v.city) errors.city = 'Choisissez une ville.';
    if (!v.description.trim()) errors.description = 'Décrivez votre besoin en quelques mots.';
    service.fields.filter((f) => f.required && !String(v[f.name] ?? '').trim()).forEach((f) => { errors[f.name] = 'Ce champ est obligatoire.'; });
    if (!showErrors(form, errors)) return;
    const details = {};
    service.fields.forEach((f) => {
        const value = v[f.name];
        if (value instanceof File) { if (value.name) details[f.name] = value.name; } else if (value) { details[f.name] = value; }
    });
    const request = api.createRequest(currentUser(), {
        serviceId: service.id, title: v.title.trim(), city: v.city, urgency: v.urgency, budget: v.budget.trim(), description: v.description.trim(), details,
    });
    location.hash = `#/espace/nouvelle-demande?confirmee=${request.id}`;
};

/* ---------- Mes demandes ---------- */
const requestsState = { q: '', status: 'all', page: 1 };

function filteredClientRequests(user) {
    const needle = normalize(requestsState.q.trim());
    return api.requestsOf(user).filter((r) => (requestsState.status === 'all' || r.status === requestsState.status)
        && (!needle || normalize(`${r.title} ${r.tracking}`).includes(needle)));
}

function clientRequestsList(printAll = false) {
    const user = currentUser();
    const list = filteredClientRequests(user);
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    requestsState.page = Math.min(requestsState.page, pages);
    const start = (requestsState.page - 1) * PAGE_SIZE;
    const shown = printAll ? list : list.slice(start, start + PAGE_SIZE);
    if (!list.length) {
        return api.requestsOf(user).length
            ? emptyState('magnifying-glass', 'Aucune demande trouvée', 'Changez votre recherche ou le filtre de statut.')
            : emptyState('clipboard-document-list', 'Aucune demande', 'Votre première demande prend moins de 3 minutes.', '<a class="btn btn-primary" href="#/espace/nouvelle-demande">Faire une demande</a>');
    }
    return `<div class="request-list">${shown.map((r) => requestRow(r, user)).join('')}</div>${printAll ? '' : pagination(requestsState.page, pages, 'requestsPage')}`;
}

function pageClientRequests() {
    const user = currentUser();
    const all = api.requestsOf(user);
    return clientLayout({
        title: 'Mes demandes',
        subtitle: plural(all.length, 'demande'),
        actions: `<a class="btn btn-primary btn-sm topbar-cta" href="#/espace/nouvelle-demande">${icon('plus', 18)}<span>Nouvelle demande</span></a>`,
        content: `
        <div class="toolbar no-print">
            <div class="search-field">${icon('magnifying-glass', 18)}<label class="sr-only" for="requests-q">Rechercher par titre</label><input id="requests-q" type="search" placeholder="Rechercher par titre…" value="${esc(requestsState.q)}" data-input="requestsSearch"></div>
            <button class="btn btn-ghost" type="button" data-action="exportRequests">${icon('printer', 18)}Exporter en PDF</button>
        </div>
        <div class="chips no-print" role="group" aria-label="Filtrer par statut">
            <button class="chip" type="button" data-action="requestsStatus" data-status="all" aria-pressed="${requestsState.status === 'all'}">Toutes <span class="chip-count">${all.length}</span></button>
            ${Object.keys(STATUS).map((key) => `<button class="chip" type="button" data-action="requestsStatus" data-status="${key}" aria-pressed="${requestsState.status === key}">${STATUS[key].label} <span class="chip-count">${all.filter((r) => r.status === key).length}</span></button>`).join('')}
        </div>
        <div class="print-only print-head"><strong>KWABO</strong> · Mes demandes · ${esc(fullName(user))} · ${fmtDate(new Date().toISOString())}</div>
        <section class="card" id="requests-list">${clientRequestsList()}</section>`,
    });
}

const refreshClientRequests = () => { $('#requests-list').innerHTML = clientRequestsList(); };
INPUTS.requestsSearch = (input) => { requestsState.q = input.value; requestsState.page = 1; refreshClientRequests(); };
ACTIONS.requestsStatus = (el) => {
    requestsState.status = el.dataset.status;
    requestsState.page = 1;
    $$('[data-action="requestsStatus"]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.status === requestsState.status)));
    refreshClientRequests();
};
ACTIONS.requestsPage = (el) => { requestsState.page = Number(el.dataset.page); refreshClientRequests(); };
ACTIONS.exportRequests = () => {
    $('#requests-list').innerHTML = clientRequestsList(true);
    window.print();
    refreshClientRequests();
};

/* ---------- Détail d'une demande ---------- */
function pageClientRequestDetail(id) {
    const user = currentUser();
    const r = requestById(id);
    if (!r || r.userId !== user.id) {
        return clientLayout({ title: 'Demande introuvable', content: emptyState('magnifying-glass', 'Demande introuvable', 'Elle n\'existe pas ou n\'est pas liée à votre compte.', '<a class="btn btn-primary" href="#/espace/demandes">Mes demandes</a>') });
    }
    api.markThreadRead(r.id, 'client');
    const due = dueInvoiceOf(r);
    const docs = api.documentsOf(r.id);
    return clientLayout({
        title: r.title,
        subtitle: r.tracking,
        content: `
        <a class="breadcrumb" href="#/espace/demandes">${icon('arrow-left', 16)}Mes demandes</a>
        <section class="card status-card">${statusSteps(r.status)}</section>
        ${due ? `<div class="alert"><span class="tile tile-sm">${icon('banknotes', 18)}</span><p><strong>Devis : ${money(due.amount)}</strong> (${esc(due.label)}). La mission démarre dès le paiement.</p><button class="btn btn-gold btn-sm" type="button" data-action="payInvoice" data-id="${due.id}">Payer</button></div>` : ''}
        <div class="detail-grid">
            <div class="stack">
                ${requestInfoCard(r)}
                <section class="card"><h2>Messages</h2>${threadPanel(r, user)}</section>
                <section class="card"><h2>Documents</h2>${docs.length ? `<ul class="doc-list">${docs.map(documentItem).join('')}</ul>` : '<p class="muted">Vos rapports, photos, reçus et contrats apparaîtront ici.</p>'}</section>
            </div>
            <aside class="stack">
                ${r.status === 'done' ? ratingCard(r) : ''}
                ${historyCard(r)}
                ${r.status === 'pending' ? `<section class="card"><h2>Changement de programme ?</h2><p class="muted">Vous pouvez annuler tant que la mission n'a pas démarré.</p><button class="btn btn-danger-ghost btn-block" type="button" data-action="cancelRequest" data-id="${r.id}">${icon('x-circle', 18)}Annuler la demande</button></section>` : ''}
                <a class="card card-link" href="${waLink(`Bonjour KWABO, ma demande ${r.tracking}`)}" target="_blank" rel="noopener">${WHATSAPP_ICON}<span><strong>Besoin d'une réponse rapide ?</strong><small>Écrivez-nous sur WhatsApp</small></span></a>
            </aside>
        </div>`,
    });
}

function ratingCard(r) {
    const review = db.reviews.find((a) => a.requestId === r.id);
    return `<section class="card"><h2>Votre avis</h2>
        <p class="muted">${r.rating ? `Merci. Vous avez donné ${r.rating} sur 5.` : 'Comment s\'est passée cette mission ?'}</p>
        <div class="stars" role="group" aria-label="Noter la mission">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star ${r.rating >= n ? 'is-on' : ''}" data-action="rateRequest" data-id="${r.id}" data-value="${n}" aria-label="Donner ${n} sur 5" aria-pressed="${r.rating === n}">${icon('star', 26)}</button>`).join('')}</div>
        ${r.rating ? `<form class="review-form" data-form="saveReviewComment" data-id="${r.id}" novalidate>
            ${field({ name: 'reviewComment', label: 'Votre commentaire', type: 'textarea', rows: 2, value: review?.comment ?? '', hint: 'Il est relu par KWABO avant publication.' })}
            <button class="btn btn-ghost btn-sm" type="submit">Enregistrer</button>
        </form>` : ''}
    </section>`;
}

ACTIONS.rateRequest = (el) => {
    api.rateRequest(requestById(el.dataset.id), Number(el.dataset.value));
    toast('Merci pour votre avis.');
    route({ keepPosition: true });
};

FORMS.saveReviewComment = (form) => {
    const r = requestById(form.dataset.id);
    api.rateRequest(r, r.rating, form.elements.reviewComment.value.trim());
    toast('Commentaire enregistré. Merci !');
    route({ keepPosition: true });
};

ACTIONS.cancelRequest = async (el) => {
    const r = requestById(el.dataset.id);
    const yes = await confirmDialog({ title: 'Annuler cette demande ?', body: `« ${r.title} » sera annulée, et son devis éventuel aussi.`, confirm: 'Annuler la demande', danger: true });
    if (!yes) return;
    api.cancelRequest(r);
    toast('Demande annulée.');
    route({ keepPosition: true });
};

/* ---------- Documents ---------- */
function pageClientDocuments() {
    const groups = api.requestsOf(currentUser()).map((r) => ({ r, docs: api.documentsOf(r.id) })).filter((g) => g.docs.length);
    return clientLayout({
        title: 'Mes documents',
        subtitle: 'Rapports, photos, vidéos, reçus et contrats',
        content: groups.length
            ? `<div class="stack">${groups.map(({ r, docs }) => `<section class="card"><div class="card-head"><div><h2>${esc(r.title)}</h2><small class="muted">${esc(r.tracking)} · ${plural(docs.length, 'document')}</small></div><a href="#/espace/demandes/${r.id}">Voir la demande</a></div><ul class="doc-list doc-list-grid">${docs.map(documentItem).join('')}</ul></section>`).join('')}</div>`
            : emptyState('folder', 'Aucun document', 'Les documents de vos missions apparaîtront ici.'),
    });
}

/* ---------- Messagerie ---------- */
function pageClientMessages(id) {
    const user = currentUser();
    const requests = api.requestsOf(user);
    const selected = id ? requests.find((r) => r.id === id) : null;
    if (selected) api.markThreadRead(selected.id, 'client');
    const threads = requests.map((r) => {
        const messages = api.messagesOf(r.id);
        return { r, last: messages.at(-1), unread: messages.filter((m) => m.from !== 'client' && !m.read).length };
    }).sort((a, b) => new Date(b.last?.at ?? 0) - new Date(a.last?.at ?? 0));
    if (!requests.length) {
        return clientLayout({ title: 'Messagerie', content: emptyState('chat-bubble-left-right', 'Aucune discussion', 'Chaque demande a son fil de discussion avec notre équipe.', '<a class="btn btn-primary" href="#/espace/nouvelle-demande">Faire une demande</a>') });
    }
    return clientLayout({
        title: 'Messagerie',
        subtitle: 'Un fil de discussion par demande',
        content: `<div class="messenger ${selected ? 'has-thread' : ''}">
            <nav class="messenger-list" aria-label="Discussions">${threads.map(({ r, last, unread }) => `
                <a href="#/espace/messages/${r.id}" ${selected?.id === r.id ? 'aria-current="true"' : ''}>
                    <span class="tile tile-sm cat-${serviceById(r.serviceId).cat}">${icon(serviceById(r.serviceId).icon, 18)}</span>
                    <span class="messenger-item"><strong>${esc(r.title)}</strong><small>${last ? esc(last.text || last.attachment) : 'Aucun message'}</small></span>
                    ${unread ? `<span class="count count-gold">${unread}</span>` : ''}
                </a>`).join('')}</nav>
            <section class="messenger-thread">${selected ? `
                <header><a class="icon-btn messenger-back" href="#/espace/messages" aria-label="Retour aux discussions">${icon('arrow-left')}</a><div><a href="#/espace/demandes/${selected.id}"><strong>${esc(selected.title)}</strong></a><small class="muted">${esc(selected.tracking)}</small></div>${statusBadge(selected.status)}</header>
                ${threadPanel(selected, user)}` : emptyState('chat-bubble-left-right', 'Choisissez une discussion', 'Sélectionnez une demande pour voir ses messages.')}</section>
        </div>`,
    });
}

/* ---------- Paiements ---------- */
function pageClientPayments() {
    const user = currentUser();
    const invoices = api.invoicesOf(user);
    const due = invoices.filter((i) => i.status === 'due');
    const paid = invoices.filter((i) => i.status === 'paid');
    const methods = api.methodsOf(user);
    const total = (list) => list.reduce((sum, i) => sum + i.amount, 0);
    return clientLayout({
        title: 'Paiements',
        subtitle: 'Factures, historique et moyens de paiement',
        content: `
        <ul class="stats stats-3">
            <li class="stat stat-gold"><span class="tile tile-sm">${icon('clock', 18)}</span><strong>${money(total(due))}</strong><span>À payer</span></li>
            <li class="stat stat-green"><span class="tile tile-sm">${icon('check-circle', 18)}</span><strong>${money(total(paid))}</strong><span>Total payé</span></li>
            <li class="stat stat-neutral"><span class="tile tile-sm">${icon('receipt-percent', 18)}</span><strong>${invoices.length}</strong><span>Factures</span></li>
        </ul>
        ${due.map((i) => `<div class="alert"><span class="tile tile-sm">${icon('banknotes', 18)}</span><p><strong>${esc(i.label)} : ${money(i.amount)}</strong><br><small>Facture ${esc(i.id)} du ${fmtDate(i.createdAt)}</small></p><button class="btn btn-gold btn-sm" type="button" data-action="payInvoice" data-id="${i.id}">Payer</button></div>`).join('')}
        <div class="stack">
            <section class="card"><h2>Historique</h2>
                ${invoices.length ? `<div class="table-wrap"><table class="table table-cards"><thead><tr><th>Facture</th><th>Objet</th><th>Date</th><th>Montant</th><th>État</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>
                ${invoices.map((i) => `<tr><td data-label="Facture">${esc(i.id)}</td><td data-label="Objet">${esc(i.label)}</td><td data-label="Date">${fmtDate(i.paidAt ?? i.createdAt)}</td><td data-label="Montant"><strong>${money(i.amount)}</strong></td><td data-label="État">${invoiceBadge(i)}</td><td class="td-action"><button class="btn btn-ghost btn-sm" type="button" data-action="viewInvoice" data-id="${i.id}">Voir</button></td></tr>`).join('')}
                </tbody></table></div>` : '<p class="muted">Aucune facture pour le moment.</p>'}
            </section>
            <div class="dash-grid dash-grid-even">
                <section class="card"><h2>Moyens enregistrés</h2>
                    ${methods.length ? `<ul class="method-list">${methods.map((m, index) => `<li>${icon(PAYMENT_METHODS[m.type].icon)}<span>${esc(m.label)}</span><button class="icon-btn" type="button" data-action="removeMethod" data-index="${index}" aria-label="Retirer ${esc(m.label)}">${icon('x-mark', 18)}</button></li>`).join('')}</ul>` : '<p class="muted">Aucun moyen enregistré.</p>'}
                </section>
                <section class="card card-soft"><h2>${icon('lock-closed')}Paiement sécurisé</h2><p class="muted">Le paiement se fait chez Stripe, Flutterwave ou Wise. KWABO ne conserve jamais les données de votre carte.</p></section>
            </div>
        </div>`,
    });
}

ACTIONS.payInvoice = (el) => {
    const i = db.invoices.find((x) => x.id === el.dataset.id);
    openDialog(`<h2 class="dialog-title" id="dialog-heading">Payer ${money(i.amount)}</h2>
    <p class="muted">${esc(i.label)}</p>
    <form data-form="choosePayment" data-invoice="${i.id}" novalidate>
        <fieldset class="pay-options"><legend class="sr-only">Moyen de paiement</legend>
        ${Object.entries(PAYMENT_METHODS).map(([key, m], index) => `<label class="pay-option"><input type="radio" name="method" value="${key}" ${index === 0 ? 'checked' : ''}><span class="tile tile-sm">${icon(m.icon, 18)}</span><span><strong>${m.label}</strong><small>${m.via}</small></span></label>`).join('')}
        </fieldset>
        <p class="muted small">${icon('lock-closed', 16)}Vous serez redirigé vers le prestataire. KWABO ne voit jamais les données de votre carte.</p>
        <div class="dialog-actions"><button class="btn btn-ghost" type="button" data-action="closeDialog">Annuler</button><button class="btn btn-primary" type="submit">Continuer</button></div>
    </form>`);
};

FORMS.choosePayment = (form) => {
    const method = form.elements.method.value;
    const i = db.invoices.find((x) => x.id === form.dataset.invoice);
    openDialog(`<h2 class="dialog-title" id="dialog-heading">Page du prestataire</h2>
    <div class="doc-preview">${icon(PAYMENT_METHODS[method].icon, 48)}<p><strong>${PAYMENT_METHODS[method].label} : ${money(i.amount)}</strong></p><p class="muted">Démonstration : aucun paiement réel. Ici, le client serait sur la page sécurisée du prestataire.</p></div>
    <div class="dialog-actions"><button class="btn btn-ghost" type="button" data-action="paymentFails">Simuler un échec</button><button class="btn btn-primary" type="button" data-action="paymentSucceeds" data-id="${i.id}" data-method="${method}">Simuler le paiement</button></div>`);
};

ACTIONS.paymentSucceeds = (el) => {
    api.payInvoice(el.dataset.id, el.dataset.method);
    closeDialog();
    toast('Paiement confirmé. Merci !');
    route({ keepPosition: true });
};
ACTIONS.paymentFails = () => {
    closeDialog();
    toast('Le paiement a échoué. Aucun montant n\'a été prélevé, vous pouvez réessayer.');
};

ACTIONS.removeMethod = async (el) => {
    const yes = await confirmDialog({ title: 'Retirer ce moyen de paiement ?', confirm: 'Retirer', danger: true });
    if (!yes) return;
    api.removeMethod(currentUser(), Number(el.dataset.index));
    toast('Moyen de paiement retiré.');
    route({ keepPosition: true });
};

/* ---------- Notifications ---------- */
function pageClientNotifications() {
    const user = currentUser();
    const list = api.notificationsOf(user);
    return clientLayout({
        title: 'Notifications',
        content: `<section class="card">
            <div class="card-head"><h2>${plural(list.filter((n) => !n.read).length, 'non lue').replace('non lues', 'non lues')}</h2>${list.some((n) => !n.read) ? '<button class="btn btn-ghost btn-sm" type="button" data-action="markAllRead">Tout marquer comme lu</button>' : ''}</div>
            ${list.length ? `<ul class="notif-list">${list.map(notificationItem).join('')}</ul>` : emptyState('bell', 'Aucune notification', 'Vous serez prévenu ici à chaque étape de vos missions.')}
        </section>`,
    });
}
ACTIONS.markAllRead = () => { api.markAllRead(currentUser()); route({ keepPosition: true }); };

/* ---------- Parrainage ---------- */
const REFERRAL_REWARD_EXAMPLE = 10;

function pageClientReferral() {
    const user = currentUser();
    const referrals = api.referralsOf(user);
    const activeCount = referrals.filter((r) => r.status === 'Actif').length;
    const text = `Je te recommande KWABO pour tes projets au Bénin. Mon code de parrainage : ${user.referralCode}`;
    return clientLayout({
        title: 'Parrainage',
        subtitle: 'Recommandez KWABO à vos proches',
        content: `
        <section class="welcome welcome-center">
            <div><h2>Votre code de parrainage</h2><p class="referral-code">${esc(user.referralCode)}</p></div>
            <div class="btn-row">
                <button class="btn btn-gold" type="button" data-action="copyText" data-text="${esc(user.referralCode)}">${icon('clipboard-document', 18)}Copier le code</button>
                <a class="btn btn-outline-light" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">${WHATSAPP_ICON}Partager</a>
            </div>
        </section>
        <ul class="stats stats-3">
            <li class="stat stat-neutral"><span class="tile tile-sm">${icon('user-group', 18)}</span><strong>${referrals.length}</strong><span>Filleuls</span></li>
            <li class="stat stat-green"><span class="tile tile-sm">${icon('check-circle', 18)}</span><strong>${activeCount}</strong><span>Filleuls actifs</span></li>
            <li class="stat stat-gold"><span class="tile tile-sm">${icon('gift', 18)}</span><strong>${money(activeCount * REFERRAL_REWARD_EXAMPLE)}</strong><span>Récompenses</span></li>
        </ul>
        <p class="notice">${icon('information-circle')}Exemple : ${REFERRAL_REWARD_EXAMPLE} € par filleul actif. Le montant réel reste à fixer par KWABO.</p>
        <div class="dash-grid">
            <section class="card"><h2>Mes filleuls</h2>
                ${referrals.length ? `<ul class="referral-list">${referrals.map((r) => `<li>${avatar(r.name, 'avatar-sm')}<span><strong>${esc(r.name)}</strong><small>Depuis le ${fmtDate(r.at)}</small></span><span class="badge ${r.status === 'Actif' ? 'badge-green' : 'badge-neutral'}">${esc(r.status)}</span></li>`).join('')}</ul>` : emptyState('user-group', 'Aucun filleul', 'Partagez votre code pour commencer.')}
            </section>
            <section class="card"><h2>Comment ça marche</h2><ol class="mini-steps"><li>Partagez votre code à un proche.</li><li>Il crée son compte avec votre code.</li><li>Sa première mission payée vous donne une récompense.</li></ol></section>
        </div>`,
    });
}

/* ---------- Profil ---------- */
function pageClientProfile() {
    const user = currentUser();
    return clientLayout({
        title: 'Mon profil',
        subtitle: user.email,
        content: `<div class="dash-grid dash-grid-even">
        <div class="stack">
            <form class="card form-card" data-form="saveProfile" novalidate>
                <h2>Mes informations</h2>
                <div class="form-grid">
                    ${field({ name: 'firstName', label: 'Prénom', required: true, value: user.firstName, autocomplete: 'given-name' })}
                    ${field({ name: 'lastName', label: 'Nom', required: true, value: user.lastName, autocomplete: 'family-name' })}
                </div>
                ${field({ name: 'email', label: 'E-mail', type: 'email', value: user.email, optionalMark: false, attrs: 'readonly', hint: 'Pour le changer, écrivez-nous : il sera vérifié à nouveau.' })}
                ${field({ name: 'phone', label: 'Téléphone', type: 'tel', required: true, value: user.phone, autocomplete: 'tel' })}
                ${field({ name: 'country', label: 'Pays de résidence', type: 'select', required: true, value: user.country, options: COUNTRIES })}
                <button class="btn btn-primary" type="submit">Enregistrer</button>
            </form>
            <form class="card form-card" data-form="savePassword" novalidate>
                <h2>Mot de passe</h2>
                <p class="form-error" role="alert" hidden></p>
                ${field({ name: 'current', label: 'Mot de passe actuel', type: 'password', required: true, autocomplete: 'current-password' })}
                ${field({ name: 'next', label: 'Nouveau mot de passe', type: 'password', required: true, autocomplete: 'new-password', hint: 'Au moins 8 caractères, avec 1 majuscule et 1 chiffre.' })}
                <button class="btn btn-primary" type="submit">Changer le mot de passe</button>
            </form>
        </div>
        <div class="stack">
            <section class="card"><h2>Sécurité</h2>
                <div class="setting"><span class="tile tile-sm">${icon('shield-check', 18)}</span><div><strong>Double authentification</strong><small>${user.twoFactor ? 'Activée. Un code est demandé à chaque connexion.' : 'Désactivée. Ajoutez un code à chaque connexion.'}</small></div>
                    <button class="btn btn-ghost btn-sm" type="button" data-action="toggleTwoFactor">${user.twoFactor ? 'Désactiver' : 'Activer'}</button></div>
                <div class="setting"><span class="tile tile-sm">${icon('arrow-right-on-rectangle', 18)}</span><div><strong>Tous mes appareils</strong><small>Vous déconnecte partout, y compris ici.</small></div>
                    <button class="btn btn-ghost btn-sm" type="button" data-action="logoutEverywhere">Déconnecter</button></div>
            </section>
            <section class="card"><h2>Notifications par e-mail</h2>
                <div class="pref-list">${NOTIFICATION_PREFS.map((p) => `<label class="switch"><span>${esc(p.label)}</span><input type="checkbox" data-input="togglePref" data-key="${p.key}" ${user.prefs[p.key] ? 'checked' : ''}><span class="switch-track" aria-hidden="true"></span></label>`).join('')}</div>
            </section>
            <section class="card"><h2>Mes données</h2>
                <p class="muted">Supprimer votre compte efface définitivement vos demandes, documents, messages et factures.</p>
                <div class="btn-row"><a class="btn btn-ghost" href="#/confidentialite">Confidentialité</a><button class="btn btn-danger-ghost" type="button" data-action="deleteAccount">${icon('x-circle', 18)}Supprimer mon compte</button></div>
            </section>
            <section class="card card-soft"><h2>Démonstration</h2><p class="muted">Remet les comptes et les données d'exemple à leur état de départ.</p><button class="btn btn-ghost" type="button" data-action="resetDemo">Réinitialiser la démo</button></section>
        </div></div>`,
    });
}

FORMS.saveProfile = (form) => {
    const v = Object.fromEntries(new FormData(form));
    const errors = {};
    if (!v.firstName.trim()) errors.firstName = 'Saisissez votre prénom.';
    if (!v.lastName.trim()) errors.lastName = 'Saisissez votre nom.';
    if (v.phone.replace(/\D/g, '').length < 6) errors.phone = 'Saisissez un numéro valide.';
    if (!v.country) errors.country = 'Choisissez votre pays.';
    if (!showErrors(form, errors)) return;
    api.updateProfile(currentUser(), { firstName: v.firstName.trim(), lastName: v.lastName.trim(), phone: v.phone.trim(), country: v.country });
    toast('Informations enregistrées.');
    route({ keepPosition: true });
};

FORMS.savePassword = (form) => {
    const current = form.elements.current.value;
    const next = form.elements.next.value;
    const errors = {};
    if (!current) errors.current = 'Saisissez votre mot de passe actuel.';
    const problem = passwordProblem(next);
    if (problem) errors.next = problem;
    if (!showErrors(form, errors)) return;
    try {
        api.changePassword(currentUser(), current, next);
        form.reset();
        toast('Mot de passe changé.');
    } catch (error) { apiErrorToForm(form, error, 'current'); }
};

ACTIONS.toggleTwoFactor = async () => {
    const user = currentUser();
    if (user.twoFactor) {
        const yes = await confirmDialog({ title: 'Désactiver la double authentification ?', body: 'Votre compte sera moins bien protégé.', confirm: 'Désactiver', danger: true });
        if (!yes) return;
        api.updateProfile(user, { twoFactor: false });
        toast('Double authentification désactivée.');
        route({ keepPosition: true });
        return;
    }
    openDialog(`<h2 class="dialog-title" id="dialog-heading">Activer la double authentification</h2>
    <p class="muted">Scannez le QR code avec une application d'authentification, puis saisissez le code affiché.</p>
    <div class="doc-preview">${icon('shield-check', 48)}<p class="muted">Le QR code s'affichera ici. Pour la démonstration, le code est 123456.</p></div>
    <form data-form="enableTwoFactor" novalidate>
        ${field({ name: 'twoFactorCode', label: 'Code à 6 chiffres', required: true, autocomplete: 'one-time-code', attrs: 'inputmode="numeric" maxlength="6"' })}
        <div class="dialog-actions"><button class="btn btn-ghost" type="button" data-action="closeDialog">Annuler</button><button class="btn btn-primary" type="submit">Activer</button></div>
    </form>`);
};

FORMS.enableTwoFactor = (form) => {
    if (!showErrors(form, form.elements.twoFactorCode.value.trim() === '123456' ? {} : { twoFactorCode: 'Code incorrect.' })) return;
    api.updateProfile(currentUser(), { twoFactor: true });
    closeDialog();
    toast('Double authentification activée.');
    route({ keepPosition: true });
};

INPUTS.togglePref = (input) => {
    const user = currentUser();
    api.updateProfile(user, { prefs: { ...user.prefs, [input.dataset.key]: input.checked } });
    toast('Préférence enregistrée.');
};

ACTIONS.logoutEverywhere = async () => {
    const yes = await confirmDialog({ title: 'Déconnecter tous vos appareils ?', body: 'Vous devrez vous reconnecter partout.', confirm: 'Déconnecter' });
    if (yes) ACTIONS.logout();
};

ACTIONS.deleteAccount = async () => {
    const yes = await confirmDialog({ title: 'Supprimer définitivement votre compte ?', body: 'Vos demandes, documents, messages et factures seront effacés. Cette action est irréversible.', confirm: 'Supprimer mon compte', danger: true });
    if (!yes) return;
    api.deleteAccount(currentUser());
    toast('Votre compte et vos données ont été supprimés.');
    location.hash = '#/';
};

ACTIONS.resetDemo = async () => {
    const yes = await confirmDialog({ title: 'Réinitialiser la démonstration ?', body: 'Les données créées pendant vos essais seront effacées.', confirm: 'Réinitialiser', danger: true });
    if (!yes) return;
    resetDemo();
    toast('Démonstration réinitialisée.');
    if (location.hash === '#/connexion') { route(); } else { location.hash = '#/connexion'; }
};
