'use strict';
/* Interface d'administration (admin.kwabo.bj) : administrateurs (tout) et agents terrain (leurs missions). */

const ADMIN_ONLY = ['indicateurs', 'paiements', 'clients', 'avis', 'parrainage', 'catalogue', 'equipe', 'journal'];
const LIST_SIZE = 10;
const ROLE_LABEL = { ADMIN: 'Administrateur', OPERATOR: 'Agent terrain', USER: 'Client' };

/* Objectifs de la section 2.3 du cahier des charges. */
const KPI_TARGETS = [
    { key: 'accounts', label: 'Comptes créés', m6: 150, m12: 500, format: (v) => String(v) },
    { key: 'payers', label: 'Clients actifs payants', m6: 12, m12: 40, format: (v) => String(v) },
    { key: 'requests', label: 'Demandes de service', m6: 50, m12: 200, format: (v) => String(v) },
    { key: 'revenue', label: 'CA mensuel net', m6: 500, m12: 1500, format: (v) => money(v) },
    { key: 'rating', label: 'Note de satisfaction (sur 5)', m6: 4.2, m12: 4.5, format: (v) => (v ? v.toFixed(1).replace('.', ',') : '–') },
];

const startOfMonth = (offset = 0) => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + offset, 1); };
const paidInvoices = () => db.invoices.filter((i) => i.status === 'paid');
const sum = (list) => list.reduce((total, i) => total + i.amount, 0);

function monthlyRevenue(months = 6) {
    return Array.from({ length: months }, (_, index) => {
        const offset = index - months + 1;
        const from = startOfMonth(offset);
        const to = startOfMonth(offset + 1);
        const amount = sum(paidInvoices().filter((i) => { const d = new Date(i.paidAt); return d >= from && d < to; }));
        return { label: from.toLocaleDateString('fr-FR', { month: 'short' }), full: from.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), amount };
    });
}

function kpiValues() {
    const since = Date.now() - 90 * 86400000;
    const ratings = db.reviews.map((a) => a.rating);
    return {
        accounts: api.clients().length,
        payers: new Set(paidInvoices().filter((i) => new Date(i.paidAt).getTime() >= since).map((i) => i.userId)).size,
        requests: db.requests.length,
        revenue: monthlyRevenue(1)[0].amount,
        rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
    };
}

/* Ce qui attend une action, avec la raison affichée à côté. */
function pendingWork(user) {
    return api.visibleRequests(user).filter((r) => ['pending', 'active'].includes(r.status)).map((r) => {
        const reasons = [];
        const unread = api.messagesOf(r.id).filter((m) => m.from === 'client' && !m.read).length;
        if (r.status === 'pending' && !r.quote && user.role === 'ADMIN') reasons.push(['document-text', 'Devis à préparer']);
        if (!r.operatorId && user.role === 'ADMIN') reasons.push(['user-plus', 'Agent à attribuer']);
        if (unread) reasons.push(['chat-bubble-left-right', plural(unread, 'message')]);
        if (user.role === 'OPERATOR' && r.status === 'active' && !reasons.length) reasons.push(['document-text', 'Rapport à déposer']);
        return { r, reasons };
    }).filter((w) => w.reasons.length).sort((a, b) => (b.r.urgency === 'urgent') - (a.r.urgency === 'urgent'));
}

/* ---------- Gabarit ---------- */
function adminLayout(options) {
    const user = currentUser();
    const isAdmin = user.role === 'ADMIN';
    const unread = api.unreadMessages(user);
    const pendingReviews = db.reviews.filter((a) => a.status === 'pending').length;
    const nav = isAdmin ? [
        { heading: 'Pilotage' },
        { href: '#/', icon: 'squares-2x2', label: 'Vue d\'ensemble', exact: true },
        { href: '#/indicateurs', icon: 'chart-bar', label: 'Indicateurs' },
        { heading: 'Opérations' },
        { href: '#/demandes', icon: 'clipboard-document-list', label: 'Demandes' },
        { href: '#/messages', icon: 'chat-bubble-left-right', label: 'Messagerie', badge: unread },
        { href: '#/paiements', icon: 'banknotes', label: 'Paiements' },
        { heading: 'Clients' },
        { href: '#/clients', icon: 'users', label: 'Clients' },
        { href: '#/avis', icon: 'star', label: 'Avis', badge: pendingReviews },
        { href: '#/parrainage', icon: 'gift', label: 'Parrainage' },
        { heading: 'Configuration' },
        { href: '#/catalogue', icon: 'adjustments-horizontal', label: 'Catalogue' },
        { href: '#/equipe', icon: 'user-group', label: 'Équipe et rôles' },
        { href: '#/journal', icon: 'document-check', label: 'Journal d\'activité' },
    ] : [
        { href: '#/', icon: 'squares-2x2', label: 'Mes missions', exact: true },
        { href: '#/demandes', icon: 'clipboard-document-list', label: 'Demandes attribuées' },
        { href: '#/messages', icon: 'chat-bubble-left-right', label: 'Messagerie', badge: unread },
    ];
    const notifications = api.notificationsOf(user).filter((n) => !n.read).length;
    return appLayout({
        user, nav, whatsapp: false, profileHref: '#/compte', bellHref: '#/notifications', bellCount: notifications,
        ...options,
        actions: `<div class="search admin-search" role="search">${icon('magnifying-glass', 18)}<label class="sr-only" for="admin-search-all">Rechercher une demande ou un client</label><input id="admin-search-all" type="search" autocomplete="off" placeholder="Demande, client, n° de suivi…" data-input="adminSearchAll"><div class="search-results" id="admin-search-list" hidden></div></div>${options.actions ?? ''}`,
    });
}

INPUTS.adminSearchAll = (input) => {
    const list = $('#admin-search-list');
    const needle = normalize(input.value.trim());
    if (needle.length < 2) { list.hidden = true; return; }
    const user = currentUser();
    const requests = api.visibleRequests(user).filter((r) => normalize(`${r.title} ${r.tracking}`).includes(needle)).slice(0, 5);
    const clients = user.role === 'ADMIN' ? api.clients().filter((c) => normalize(`${fullName(c)} ${c.email}`).includes(needle)).slice(0, 4) : [];
    list.innerHTML = requests.length + clients.length
        ? [...requests.map((r) => `<a class="search-result" href="#/demandes/${r.id}"><span class="tile tile-sm">${icon(serviceById(r.serviceId).icon, 18)}</span><span><strong>${esc(r.title)}</strong><small>${esc(r.tracking)} · ${STATUS[r.status].label}</small></span></a>`),
            ...clients.map((c) => `<a class="search-result" href="#/clients/${c.id}">${avatar(fullName(c), 'avatar-sm')}<span><strong>${esc(fullName(c))}</strong><small>${esc(c.email)}</small></span></a>`)].join('')
        : `<p class="search-empty">Aucun résultat pour « ${esc(input.value.trim())} ».</p>`;
    list.hidden = false;
};

/* Téléchargement réel d'un fichier CSV lisible par Excel. */
function downloadCsv(filename, rows) {
    const safe = (value) => {
        const text = String(value ?? '');
        const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
        return `"${guarded.replace(/"/g, '""')}"`;
    };
    const blob = new Blob([`﻿${rows.map((row) => row.map(safe).join(';')).join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    toast(`${filename} téléchargé.`);
}

function listPagination(state, count, action) {
    const pages = Math.max(1, Math.ceil(count / LIST_SIZE));
    state.page = Math.min(state.page, pages);
    return pagination(state.page, pages, action);
}
const pageSlice = (list, state) => list.slice((state.page - 1) * LIST_SIZE, state.page * LIST_SIZE);

function statsRow(items) {
    return `<ul class="stats stats-${items.length}">${items.map(([ic, value, label, tone, href]) => `<li class="stat stat-${tone} ${href ? 'stat-link' : ''}"><span class="tile tile-sm">${icon(ic, 18)}</span><strong>${value}</strong><span>${href ? `<a href="${href}">${label}</a>` : label}</span></li>`).join('')}</ul>`;
}

/* ---------- Graphiques : une seule série, valeurs écrites et tableau disponible ---------- */
function revenueChart(months) {
    const max = Math.max(1, ...months.map((m) => m.amount));
    return `<figure class="vchart">
        <figcaption class="sr-only">Chiffre d'affaires encaissé par mois</figcaption>
        <ul class="vbars">${months.map((m) => `<li class="vbar" tabindex="0" data-tip="${esc(m.full)} : ${money(m.amount)}">
            <span class="vbar-value">${m.amount ? money(m.amount) : '0'}</span>
            <span class="vbar-track"><span class="vbar-fill" style="height:${(m.amount / max) * 100}%"></span></span>
            <span class="vbar-label">${esc(m.label)}</span>
        </li>`).join('')}</ul>
    </figure>
    <details class="chart-table"><summary>Voir en tableau</summary><table class="table"><thead><tr><th>Mois</th><th>Encaissé</th></tr></thead><tbody>${months.map((m) => `<tr><td>${esc(m.full)}</td><td>${money(m.amount)}</td></tr>`).join('')}</tbody></table></details>`;
}

function categoryBars(requests) {
    const rows = CATEGORIES.map((c) => ({ c, value: requests.filter((r) => serviceById(r.serviceId).cat === c.id).length }));
    const max = Math.max(1, ...rows.map((r) => r.value));
    return `<ul class="bars">${rows.map(({ c, value }) => `<li title="${esc(c.name)} : ${plural(value, 'demande')}">
        <span class="bars-label">${esc(c.short)}</span>
        <span class="bars-track"><span class="bars-fill" style="width:${(value / max) * 100}%"></span></span>
        <span class="bars-value">${value}</span>
    </li>`).join('')}</ul>`;
}

function workList(work, user) {
    if (!work.length) return emptyState('check-circle', 'Tout est à jour', 'Aucune demande n\'attend d\'action.');
    return `<div class="request-list">${work.slice(0, 6).map(({ r, reasons }) => `<a class="work-row" href="${requestUrl(r, user)}">
        <span class="tile cat-${serviceById(r.serviceId).cat}">${icon(serviceById(r.serviceId).icon)}</span>
        <span class="request-row-main"><strong>${esc(r.title)}</strong><small>${esc(r.tracking)} · ${esc(fullName(userById(r.userId)))}</small>
            <span class="reasons">${r.urgency === 'urgent' ? `<span class="badge badge-red">${icon('bolt', 14)}Urgent</span>` : ''}${reasons.map(([ic, text]) => `<span class="badge badge-gold">${icon(ic, 14)}${text}</span>`).join('')}</span></span>
        ${icon('chevron-right', 18)}
    </a>`).join('')}</div>`;
}

function operatorLoad() {
    const operators = api.operators();
    const max = Math.max(1, ...operators.map((o) => db.requests.filter((r) => r.operatorId === o.id && r.status === 'active').length));
    return `<ul class="bars bars-wide">${operators.map((o) => {
        const value = db.requests.filter((r) => r.operatorId === o.id && r.status === 'active').length;
        return `<li title="${esc(fullName(o))} : ${value} en cours"><span class="bars-label">${esc(fullName(o))}</span><span class="bars-track"><span class="bars-fill" style="width:${(value / max) * 100}%"></span></span><span class="bars-value">${value}</span></li>`;
    }).join('')}</ul>`;
}

/* ---------- Vue d'ensemble ---------- */
function pageDashboard() {
    const user = currentUser();
    if (user.role === 'OPERATOR') return pageOperatorDashboard(user);
    const requests = db.requests;
    const count = (status) => requests.filter((r) => r.status === status).length;
    const work = pendingWork(user);
    const thisMonth = kpiValues().revenue;
    const due = sum(db.invoices.filter((i) => i.status === 'due'));
    return adminLayout({
        title: 'Vue d\'ensemble',
        subtitle: new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        content: `
        ${statsRow([
            ['document-text', requests.filter((r) => r.status === 'pending' && !r.quote).length, 'Devis à préparer', 'gold', '#/demandes?statut=pending'],
            ['bolt', count('active'), 'Missions en cours', 'green', '#/demandes?statut=active'],
            ['banknotes', money(thisMonth), 'Encaissé ce mois-ci', 'green', '#/paiements'],
            ['clock', money(due), 'En attente de paiement', 'gold', '#/paiements?statut=due'],
        ])}
        <div class="dash-grid">
            <section class="card"><div class="card-head"><h2>À traiter en priorité</h2><a href="#/demandes">Toutes les demandes</a></div>${workList(work, user)}</section>
            <section class="card"><div class="card-head"><h2>Encaissements</h2><a href="#/indicateurs">Indicateurs</a></div>${revenueChart(monthlyRevenue())}</section>
        </div>
        <div class="grid-3">
            <section class="card"><h2>Demandes par univers</h2>${categoryBars(requests)}</section>
            <section class="card"><div class="card-head"><h2>Charge des agents</h2><a href="#/equipe">Équipe</a></div><p class="muted small-text">Missions en cours par agent</p>${operatorLoad()}</section>
            <section class="card"><div class="card-head"><h2>Activité récente</h2><a href="#/journal">Journal</a></div><ol class="timeline">${db.audit.slice(0, 4).map((j) => `<li><strong>${esc(j.text)}</strong><small>${esc(j.actor)} · ${fmtDateTime(j.at)}</small></li>`).join('')}</ol></section>
        </div>`,
    });
}

function pageOperatorDashboard(user) {
    const requests = api.visibleRequests(user);
    const count = (status) => requests.filter((r) => r.status === status).length;
    const docs = db.documents.filter((d) => requests.some((r) => r.id === d.requestId)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
    return adminLayout({
        title: `Bonjour ${user.firstName}`,
        subtitle: 'Vos missions sur le terrain',
        content: `
        ${statsRow([
            ['clipboard-document-list', requests.length, 'Missions attribuées', 'neutral'],
            ['clock', count('pending'), 'En attente', 'gold'],
            ['bolt', count('active'), 'En cours', 'green'],
            ['check-circle', count('done'), 'Terminées', 'neutral'],
        ])}
        <div class="dash-grid">
            <section class="card"><div class="card-head"><h2>À faire</h2><a href="#/demandes">Toutes mes missions</a></div>${workList(pendingWork(user), user)}</section>
            <section class="card"><h2>Derniers documents déposés</h2>${docs.length ? `<ul class="doc-list">${docs.map(documentItem).join('')}</ul>` : '<p class="muted">Aucun document pour le moment.</p>'}</section>
        </div>`,
    });
}

/* ---------- Indicateurs ---------- */
function pageKpis() {
    const values = kpiValues();
    const paid = paidInvoices();
    const average = paid.length ? sum(paid) / paid.length : 0;
    return adminLayout({
        title: 'Indicateurs',
        subtitle: 'Objectifs de la première année, selon le cahier des charges',
        content: `
        <p class="notice">${icon('information-circle')}Valeurs calculées sur les données de démonstration.</p>
        <section class="card"><h2>Objectifs à 6 et 12 mois</h2>
            <div class="table-wrap"><table class="table table-cards"><thead><tr><th>Indicateur</th><th>Actuel</th><th>Objectif M6</th><th>Objectif M12</th><th>Progression vers M6</th></tr></thead><tbody>
            ${KPI_TARGETS.map((k) => {
                const share = Math.min(100, Math.round((values[k.key] / k.m6) * 100));
                return `<tr><td data-label="Indicateur"><strong>${esc(k.label)}</strong></td><td data-label="Actuel"><strong>${k.format(values[k.key])}</strong></td><td data-label="Objectif M6">${k.format(k.m6)}</td><td data-label="Objectif M12">${k.format(k.m12)}</td>
                <td data-label="Progression"><span class="meter" role="img" aria-label="${share} % de l'objectif à 6 mois"><span class="bars-track"><span class="bars-fill" style="width:${share}%"></span></span><span>${share} %</span></span></td></tr>`;
            }).join('')}
            </tbody></table></div>
        </section>
        <div class="dash-grid dash-grid-even">
            <section class="card"><h2>Encaissements sur 6 mois</h2>${revenueChart(monthlyRevenue())}</section>
            <div class="stack">
                ${statsRow([['receipt-percent', money(Math.round(average)), 'Facture moyenne', 'neutral'], ['banknotes', money(sum(paid)), 'Total encaissé', 'green']])}
                <section class="card"><h2>Demandes par univers</h2>${categoryBars(db.requests)}</section>
            </div>
        </div>`,
    });
}

/* ---------- Demandes ---------- */
const requestsFilter = { q: '', status: 'all', operator: 'all', category: 'all', urgency: 'all', page: 1, view: 'list' };

function filteredRequests(user) {
    const needle = normalize(requestsFilter.q.trim());
    return api.visibleRequests(user).filter((r) => {
        const client = userById(r.userId);
        return (requestsFilter.status === 'all' || r.status === requestsFilter.status)
            && (requestsFilter.operator === 'all' || (requestsFilter.operator === 'none' ? !r.operatorId : r.operatorId === requestsFilter.operator))
            && (requestsFilter.category === 'all' || serviceById(r.serviceId).cat === requestsFilter.category)
            && (requestsFilter.urgency === 'all' || r.urgency === requestsFilter.urgency)
            && (!needle || normalize(`${r.title} ${r.tracking} ${client ? fullName(client) : ''}`).includes(needle));
    });
}

function requestsTable(user) {
    const list = filteredRequests(user);
    if (!list.length) return emptyState('magnifying-glass', 'Aucune demande', 'Changez votre recherche ou vos filtres.');
    const pages = listPagination(requestsFilter, list.length, 'requestsPage');
    return `<div class="table-wrap"><table class="table table-cards"><thead><tr><th>Suivi</th><th>Demande</th><th>Client</th><th>Agent</th><th>Statut</th><th>Date</th></tr></thead><tbody>
    ${pageSlice(list, requestsFilter).map((r) => {
        const operator = r.operatorId ? userById(r.operatorId) : null;
        const unread = api.messagesOf(r.id).filter((m) => m.from === 'client' && !m.read).length;
        return `<tr>
            <td data-label="Suivi" class="nowrap">${esc(r.tracking)}</td>
            <td data-label="Demande"><a class="table-link" href="#/demandes/${r.id}">${esc(r.title)}</a>${r.urgency === 'urgent' ? ` <span class="badge badge-red">${icon('bolt', 14)}Urgent</span>` : ''}${unread ? ` <span class="count count-gold" title="Messages non lus">${unread}</span>` : ''}</td>
            <td data-label="Client">${esc(fullName(userById(r.userId)))}</td>
            <td data-label="Agent">${operator ? esc(fullName(operator)) : '<span class="muted">Non attribuée</span>'}</td>
            <td data-label="Statut">${statusBadge(r.status)}</td>
            <td data-label="Date" class="nowrap">${fmtDate(r.createdAt)}</td>
        </tr>`;
    }).join('')}
    </tbody></table></div>${pages}`;
}

function requestsKanban(user) {
    const list = filteredRequests(user);
    return `<div class="kanban">${Object.keys(STATUS).map((key) => {
        const cards = list.filter((r) => r.status === key);
        return `<section class="kanban-col" data-status="${key}" aria-label="${STATUS[key].label}">
            <header>${statusBadge(key)}<strong>${cards.length}</strong></header>
            <div class="kanban-cards">${cards.map((r) => `<a class="kanban-card" href="#/demandes/${r.id}" draggable="true" data-id="${r.id}">
                <strong>${esc(r.title)}</strong>
                <small>${esc(r.tracking)}</small>
                <small>${esc(fullName(userById(r.userId)))}</small>
                <span class="kanban-foot">${r.urgency === 'urgent' ? `<span class="badge badge-red">${icon('bolt', 14)}Urgent</span>` : ''}${r.operatorId ? avatar(fullName(userById(r.operatorId)), 'avatar-xs') : '<span class="muted small-text">Sans agent</span>'}</span>
            </a>`).join('') || '<p class="muted small-text kanban-empty">Aucune demande</p>'}</div>
        </section>`;
    }).join('')}</div>`;
}

const requestsBody = (user) => (requestsFilter.view === 'kanban' ? requestsKanban(user) : `<section class="card">${requestsTable(user)}</section>`);

function pageRequests(params) {
    const user = currentUser();
    const isAdmin = user.role === 'ADMIN';
    if (params.get('statut')) { requestsFilter.status = params.get('statut'); requestsFilter.page = 1; }
    const option = (value, label, current) => `<option value="${esc(value)}" ${current === value ? 'selected' : ''}>${esc(label)}</option>`;
    return adminLayout({
        title: isAdmin ? 'Demandes' : 'Demandes attribuées',
        subtitle: plural(api.visibleRequests(user).length, 'demande'),
        content: `
        <div class="toolbar">
            <div class="search-field">${icon('magnifying-glass', 18)}<label class="sr-only" for="requests-filter-q">Filtrer les demandes</label><input id="requests-filter-q" type="search" placeholder="Filtrer : titre, suivi ou client…" value="${esc(requestsFilter.q)}" data-input="requestsFilterText"></div>
            <label class="sr-only" for="filter-status">Statut</label>
            <select id="filter-status" class="select-inline" data-input="requestsFilterSelect" data-key="status">${option('all', 'Tous les statuts', requestsFilter.status)}${Object.keys(STATUS).map((k) => option(k, STATUS[k].label, requestsFilter.status)).join('')}</select>
            ${isAdmin ? `<label class="sr-only" for="filter-operator">Agent</label>
            <select id="filter-operator" class="select-inline" data-input="requestsFilterSelect" data-key="operator">${option('all', 'Tous les agents', requestsFilter.operator)}${option('none', 'Non attribuées', requestsFilter.operator)}${api.operators().map((o) => option(o.id, fullName(o), requestsFilter.operator)).join('')}</select>` : ''}
            <label class="sr-only" for="filter-category">Univers</label>
            <select id="filter-category" class="select-inline" data-input="requestsFilterSelect" data-key="category">${option('all', 'Tous les univers', requestsFilter.category)}${CATEGORIES.map((c) => option(c.id, c.short, requestsFilter.category)).join('')}</select>
            <label class="sr-only" for="filter-urgency">Urgence</label>
            <select id="filter-urgency" class="select-inline" data-input="requestsFilterSelect" data-key="urgency">${option('all', 'Toute urgence', requestsFilter.urgency)}${option('urgent', 'Urgentes', requestsFilter.urgency)}${option('normal', 'Normales', requestsFilter.urgency)}</select>
        </div>
        <div class="toolbar toolbar-between">
            <div class="segmented" role="group" aria-label="Affichage">
                <button type="button" data-action="requestsView" data-view="list" aria-pressed="${requestsFilter.view === 'list'}">${icon('bars-3', 18)}Liste</button>
                <button type="button" data-action="requestsView" data-view="kanban" aria-pressed="${requestsFilter.view === 'kanban'}">${icon('squares-2x2', 18)}Tableau</button>
            </div>
            <button class="btn btn-ghost btn-sm" type="button" data-action="exportRequestsCsv">${icon('arrow-down-tray', 18)}Exporter en CSV</button>
        </div>
        <div id="requests-body">${requestsBody(user)}</div>`,
    });
}

const refreshRequests = () => { $('#requests-body').innerHTML = requestsBody(currentUser()); };
INPUTS.requestsFilterText = (input) => { requestsFilter.q = input.value; requestsFilter.page = 1; refreshRequests(); };
INPUTS.requestsFilterSelect = (input) => { requestsFilter[input.dataset.key] = input.value; requestsFilter.page = 1; refreshRequests(); };
ACTIONS.requestsPage = (el) => { requestsFilter.page = Number(el.dataset.page); refreshRequests(); };
ACTIONS.requestsView = (el) => {
    requestsFilter.view = el.dataset.view;
    $$('[data-action="requestsView"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === requestsFilter.view)));
    refreshRequests();
};
ACTIONS.exportRequestsCsv = () => {
    const rows = filteredRequests(currentUser()).map((r) => [r.tracking, r.title, serviceById(r.serviceId).name, fullName(userById(r.userId)), r.operatorId ? fullName(userById(r.operatorId)) : '', STATUS[r.status].label, r.urgency === 'urgent' ? 'Urgent' : 'Normale', fmtDate(r.createdAt)]);
    downloadCsv('kwabo-demandes.csv', [['Suivi', 'Titre', 'Service', 'Client', 'Agent', 'Statut', 'Urgence', 'Date'], ...rows]);
};

/* Tableau : glisser une carte d'une colonne à l'autre change le statut. */
document.addEventListener('dragstart', (event) => {
    const card = event.target.closest?.('.kanban-card');
    if (card) { event.dataTransfer.setData('text/plain', card.dataset.id); event.dataTransfer.effectAllowed = 'move'; }
});
document.addEventListener('dragover', (event) => {
    const column = event.target.closest?.('.kanban-col');
    if (column) { event.preventDefault(); $$('.kanban-col').forEach((c) => c.classList.toggle('is-over', c === column)); }
});
document.addEventListener('dragend', () => $$('.kanban-col').forEach((c) => c.classList.remove('is-over')));
document.addEventListener('drop', async (event) => {
    const column = event.target.closest?.('.kanban-col');
    if (!column) return;
    event.preventDefault();
    $$('.kanban-col').forEach((c) => c.classList.remove('is-over'));
    const r = requestById(event.dataTransfer.getData('text/plain'));
    const status = column.dataset.status;
    if (!r || r.status === status) return;
    if (status === 'cancelled' && !(await confirmDialog({ title: 'Annuler cette demande ?', body: `« ${r.title} » sera annulée, et son devis en attente aussi.`, confirm: 'Annuler la demande', danger: true }))) return;
    api.setStatus(r, status);
    toast(`Statut : ${STATUS[status].label}. Le client est prévenu.`);
    refreshRequests();
});

/* ---------- Détail d'une demande ---------- */
function pageRequestDetail(id) {
    const user = currentUser();
    const isAdmin = user.role === 'ADMIN';
    const r = api.visibleRequests(user).find((x) => x.id === id);
    if (!r) {
        return adminLayout({ title: 'Demande introuvable', content: emptyState('magnifying-glass', 'Demande introuvable', 'Elle n\'existe pas ou ne vous est pas attribuée.', '<a class="btn btn-primary" href="#/demandes">Retour aux demandes</a>') });
    }
    api.markThreadRead(r.id, 'team');
    const client = userById(r.userId);
    const docs = api.documentsOf(r.id);
    const due = dueInvoiceOf(r);
    const invoices = db.invoices.filter((i) => i.requestId === r.id);
    const review = db.reviews.find((a) => a.requestId === r.id);
    return adminLayout({
        title: r.title,
        subtitle: `${r.tracking} · ${serviceById(r.serviceId).name}`,
        content: `
        <a class="breadcrumb" href="#/demandes">${icon('arrow-left', 16)}Demandes</a>
        <section class="card status-card">${statusSteps(r.status)}</section>
        <div class="detail-grid">
            <div class="stack">
                ${requestInfoCard(r)}
                <section class="card"><h2>Messages avec le client</h2>${threadPanel(r, user)}</section>
                <section class="card"><h2>Documents</h2>
                    ${docs.length ? `<ul class="doc-list">${docs.map(documentItem).join('')}</ul>` : '<p class="muted">Aucun document pour le moment.</p>'}
                    <form class="doc-form" data-form="addDocument" data-request="${r.id}" novalidate>
                        <h3>Déposer un document</h3>
                        <div class="form-grid">
                            ${field({ name: 'docType', label: 'Type', type: 'select', required: true, placeholder: false, options: Object.entries(DOC_TYPES).map(([value, t]) => ({ value, label: t.label })) })}
                            ${field({ name: 'docName', label: 'Nom du document', required: true, placeholder: 'Rapport semaine 5.pdf' })}
                        </div>
                        <button class="btn btn-ghost" type="submit">${icon('plus', 18)}Déposer</button>
                    </form>
                </section>
                <section class="card card-note"><h2>${icon('lock-closed')}Notes internes</h2><p class="muted small-text">Jamais visibles par le client.</p>
                    ${(r.notes ?? []).map((n) => `<div class="note"><p>${esc(n.text)}</p><small>${esc(n.author)} · ${fmtDateTime(n.at)}</small></div>`).join('')}
                    <form data-form="addNote" data-request="${r.id}" novalidate>
                        ${field({ name: 'noteText', label: 'Ajouter une note', type: 'textarea', rows: 2, optionalMark: false })}
                        <button class="btn btn-ghost btn-sm" type="submit">Enregistrer la note</button>
                    </form>
                </section>
            </div>
            <aside class="stack">
                <section class="card"><div class="card-head"><h2>Client</h2>${isAdmin ? `<a href="#/clients/${client.id}">Fiche</a>` : ''}</div>
                    <div class="client-mini">${avatar(fullName(client))}<span><strong>${esc(fullName(client))}</strong><small>${esc(client.country)}</small></span></div>
                    <ul class="contact-list"><li>${icon('envelope', 18)}<a href="mailto:${esc(client.email)}">${esc(client.email)}</a></li><li>${icon('phone', 18)}<a href="tel:${esc(client.phone.replace(/\s/g, ''))}">${esc(client.phone)}</a></li></ul>
                </section>
                <form class="card form-card" data-form="changeStatus" data-request="${r.id}" novalidate>
                    <h2>Statut</h2>
                    ${field({ name: 'statusValue', label: 'Statut de la demande', type: 'select', required: true, placeholder: false, value: r.status, options: Object.keys(STATUS).map((k) => ({ value: k, label: STATUS[k].label })) })}
                    <button class="btn btn-primary btn-block" type="submit">Mettre à jour</button>
                </form>
                ${isAdmin ? `<form class="card form-card" data-form="assignOperator" data-request="${r.id}" novalidate>
                    <h2>Agent terrain</h2>
                    ${field({ name: 'operatorId', label: 'Attribuer à', type: 'select', optionalMark: false, placeholder: 'Personne pour le moment', value: r.operatorId ?? '', options: api.operators().filter((o) => !o.suspended).map((o) => ({ value: o.id, label: fullName(o) })) })}
                    <button class="btn btn-ghost btn-block" type="submit">Attribuer</button>
                </form>
                <form class="card form-card" data-form="sendQuote" data-request="${r.id}" novalidate>
                    <h2>Devis</h2>
                    ${r.quote ? `<p class="notice">${icon('document-text')}<span>${due ? 'En attente de paiement' : 'Dernier devis'} : <strong>${money(r.quote.amount)}</strong>, ${esc(r.quote.label)}</span></p>` : ''}
                    ${field({ name: 'quoteAmount', label: 'Montant (€)', type: 'number', required: true, attrs: 'min="1" inputmode="decimal"' })}
                    ${field({ name: 'quoteLabel', label: 'Objet', required: true, value: serviceById(r.serviceId).name })}
                    <button class="btn btn-gold btn-block" type="submit">${r.quote ? 'Envoyer un nouveau devis' : 'Envoyer le devis'}</button>
                </form>
                ${invoices.length ? `<section class="card"><h2>Factures</h2><ul class="mini-invoices">${invoices.map((i) => `<li><button class="link-btn" type="button" data-action="viewInvoice" data-id="${i.id}">${esc(i.id)}</button><strong>${money(i.amount)}</strong>${invoiceBadge(i)}</li>`).join('')}</ul></section>` : ''}` : ''}
                ${r.rating ? `<section class="card"><h2>Avis du client</h2><p class="rating-readout">${icon('star', 20)}<strong>${r.rating} sur 5</strong></p>${review?.comment ? `<p class="muted">${esc(review.comment)}</p>` : ''}</section>` : ''}
                ${historyCard(r)}
            </aside>
        </div>`,
    });
}

FORMS.changeStatus = async (form) => {
    const r = requestById(form.dataset.request);
    const status = form.elements.statusValue.value;
    if (status === r.status) return;
    if (status === 'cancelled' && !(await confirmDialog({ title: 'Annuler cette demande ?', body: 'Le client sera prévenu et son devis en attente sera annulé.', confirm: 'Annuler la demande', danger: true }))) {
        route({ keepPosition: true });
        return;
    }
    api.setStatus(r, status);
    toast(`Statut : ${STATUS[status].label}. Le client est prévenu.`);
    route({ keepPosition: true });
};

FORMS.assignOperator = (form) => {
    const r = requestById(form.dataset.request);
    const operatorId = form.elements.operatorId.value;
    if (operatorId === (r.operatorId ?? '')) return;
    api.assign(r, operatorId);
    toast(operatorId ? `Attribuée à ${fullName(userById(operatorId))}.` : 'Attribution retirée.');
    route({ keepPosition: true });
};

FORMS.sendQuote = (form) => {
    const amount = Number(form.elements.quoteAmount.value);
    const label = form.elements.quoteLabel.value.trim();
    const errors = {};
    if (!(amount > 0)) errors.quoteAmount = 'Saisissez un montant supérieur à 0.';
    if (!label) errors.quoteLabel = 'Saisissez l\'objet du devis.';
    if (!showErrors(form, errors)) return;
    api.sendQuote(requestById(form.dataset.request), amount, label);
    toast('Devis envoyé au client.');
    route({ keepPosition: true });
};

FORMS.addDocument = (form) => {
    const name = form.elements.docName.value.trim();
    if (!showErrors(form, name ? {} : { docName: 'Donnez un nom au document.' })) return;
    api.addDocument(requestById(form.dataset.request), form.elements.docType.value, name);
    toast('Document déposé. Il est visible par le client.');
    route({ keepPosition: true });
};

FORMS.addNote = (form) => {
    const text = form.elements.noteText.value.trim();
    if (!showErrors(form, text ? {} : { noteText: 'Écrivez votre note.' })) return;
    api.addNote(requestById(form.dataset.request), currentUser(), text);
    toast('Note enregistrée.');
    route({ keepPosition: true });
};

/* ---------- Messagerie ---------- */
function pageInbox(id) {
    const user = currentUser();
    const requests = api.visibleRequests(user);
    const selected = id ? requests.find((r) => r.id === id) : null;
    if (selected) api.markThreadRead(selected.id, 'team');
    const threads = requests.map((r) => {
        const messages = api.messagesOf(r.id);
        return { r, last: messages.at(-1), unread: messages.filter((m) => m.from === 'client' && !m.read).length };
    }).filter((t) => t.last || t.r.id === id).sort((a, b) => (b.unread - a.unread) || new Date(b.last?.at ?? 0) - new Date(a.last?.at ?? 0));
    return adminLayout({
        title: 'Messagerie',
        subtitle: 'Les discussions avec les clients, par demande',
        content: threads.length ? `<div class="messenger ${selected ? 'has-thread' : ''}">
            <nav class="messenger-list" aria-label="Discussions">${threads.map(({ r, last, unread }) => `
                <a href="#/messages/${r.id}" ${selected?.id === r.id ? 'aria-current="true"' : ''}>
                    ${avatar(fullName(userById(r.userId)), 'avatar-sm')}
                    <span class="messenger-item"><strong>${esc(fullName(userById(r.userId)))}</strong><small>${esc(r.title)}</small><small>${last ? esc(last.text || last.attachment) : ''}</small></span>
                    ${unread ? `<span class="count count-gold">${unread}</span>` : ''}
                </a>`).join('')}</nav>
            <section class="messenger-thread">${selected ? `
                <header><a class="icon-btn messenger-back" href="#/messages" aria-label="Retour aux discussions">${icon('arrow-left')}</a><div><a href="#/demandes/${selected.id}"><strong>${esc(selected.title)}</strong></a><small class="muted">${esc(selected.tracking)} · ${esc(fullName(userById(selected.userId)))}</small></div>${statusBadge(selected.status)}</header>
                ${threadPanel(selected, user)}` : emptyState('chat-bubble-left-right', 'Choisissez une discussion', 'Les discussions non lues sont en haut de la liste.')}</section>
        </div>` : emptyState('chat-bubble-left-right', 'Aucune discussion', 'Les messages des clients apparaîtront ici.'),
    });
}

/* ---------- Paiements ---------- */
const invoicesFilter = { q: '', status: 'all', page: 1 };

function filteredInvoices() {
    const needle = normalize(invoicesFilter.q.trim());
    return api.allInvoices().filter((i) => (invoicesFilter.status === 'all' || i.status === invoicesFilter.status)
        && (!needle || normalize(`${i.id} ${i.label} ${fullName(userById(i.userId) ?? { firstName: '', lastName: '' })}`).includes(needle)));
}

function invoicesTable() {
    const list = filteredInvoices();
    if (!list.length) return emptyState('magnifying-glass', 'Aucune facture', 'Changez votre recherche ou le filtre.');
    const pages = listPagination(invoicesFilter, list.length, 'invoicesPage');
    return `<div class="table-wrap"><table class="table table-cards"><thead><tr><th>Facture</th><th>Client</th><th>Objet</th><th>Moyen</th><th>Date</th><th>Montant</th><th>État</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>
    ${pageSlice(list, invoicesFilter).map((i) => `<tr>
        <td data-label="Facture" class="nowrap">${esc(i.id)}</td>
        <td data-label="Client">${esc(fullName(userById(i.userId)))}</td>
        <td data-label="Objet">${esc(i.label)}</td>
        <td data-label="Moyen">${i.method ? esc(PAYMENT_METHODS[i.method].label) : '<span class="muted">–</span>'}</td>
        <td data-label="Date" class="nowrap">${fmtDate(i.paidAt ?? i.createdAt)}</td>
        <td data-label="Montant"><strong>${money(i.amount)}</strong></td>
        <td data-label="État">${invoiceBadge(i)}</td>
        <td class="td-action"><span class="row-actions"><button class="btn btn-ghost btn-sm" type="button" data-action="viewInvoice" data-id="${i.id}">Voir</button>${i.status === 'paid' ? `<button class="btn btn-danger-ghost btn-sm" type="button" data-action="refundInvoice" data-id="${i.id}">Rembourser</button>` : ''}</span></td>
    </tr>`).join('')}
    </tbody></table></div>${pages}`;
}

function pagePayments(params) {
    if (params.get('statut')) { invoicesFilter.status = params.get('statut'); invoicesFilter.page = 1; }
    const refunded = sum(db.invoices.filter((i) => i.status === 'refunded'));
    return adminLayout({
        title: 'Paiements',
        subtitle: 'Factures et encaissements',
        content: `
        ${statsRow([
            ['banknotes', money(kpiValues().revenue), 'Encaissé ce mois-ci', 'green'],
            ['chart-bar', money(sum(paidInvoices())), 'Total encaissé', 'neutral'],
            ['clock', money(sum(db.invoices.filter((i) => i.status === 'due'))), 'En attente', 'gold'],
            ['arrow-left', money(refunded), 'Remboursé', 'neutral'],
        ])}
        <div class="toolbar">
            <div class="search-field">${icon('magnifying-glass', 18)}<label class="sr-only" for="invoices-q">Filtrer les factures</label><input id="invoices-q" type="search" placeholder="Facture, client ou objet…" value="${esc(invoicesFilter.q)}" data-input="invoicesText"></div>
            <label class="sr-only" for="invoices-status">État</label>
            <select id="invoices-status" class="select-inline" data-input="invoicesStatus">${[['all', 'Tous les états'], ['due', 'À payer'], ['paid', 'Payées'], ['refunded', 'Remboursées'], ['cancelled', 'Annulées']].map(([v, l]) => `<option value="${v}" ${invoicesFilter.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <button class="btn btn-ghost btn-sm" type="button" data-action="exportInvoicesCsv">${icon('arrow-down-tray', 18)}Exporter en CSV</button>
        </div>
        <section class="card" id="invoices-table">${invoicesTable()}</section>
        <p class="notice">${icon('lock-closed')}Les données de carte restent chez Stripe, Flutterwave et Wise : KWABO n'en conserve aucune.</p>`,
    });
}

const refreshInvoices = () => { $('#invoices-table').innerHTML = invoicesTable(); };
INPUTS.invoicesText = (input) => { invoicesFilter.q = input.value; invoicesFilter.page = 1; refreshInvoices(); };
INPUTS.invoicesStatus = (input) => { invoicesFilter.status = input.value; invoicesFilter.page = 1; refreshInvoices(); };
ACTIONS.invoicesPage = (el) => { invoicesFilter.page = Number(el.dataset.page); refreshInvoices(); };
ACTIONS.exportInvoicesCsv = () => {
    const rows = filteredInvoices().map((i) => [i.id, fullName(userById(i.userId)), i.label, i.method ? PAYMENT_METHODS[i.method].label : '', fmtDate(i.paidAt ?? i.createdAt), i.amount, i.status]);
    downloadCsv('kwabo-factures.csv', [['Facture', 'Client', 'Objet', 'Moyen', 'Date', 'Montant (€)', 'État'], ...rows]);
};
ACTIONS.refundInvoice = async (el) => {
    const invoice = db.invoices.find((i) => i.id === el.dataset.id);
    const yes = await confirmDialog({ title: `Rembourser ${money(invoice.amount)} ?`, body: `Facture ${invoice.id}, ${invoice.label}. Le client sera prévenu.`, confirm: 'Rembourser', danger: true });
    if (!yes) return;
    api.refundInvoice(invoice);
    toast('Remboursement enregistré.');
    route({ keepPosition: true });
};

/* ---------- Clients ---------- */
const clientsFilter = { q: '', state: 'all', page: 1 };
const clientState = (c) => (c.suspended ? 'suspended' : c.verified ? 'active' : 'unverified');
const CLIENT_STATE = {
    active: `<span class="badge badge-green">${'Actif'}</span>`,
    unverified: `<span class="badge badge-gold">${'E-mail à confirmer'}</span>`,
    suspended: `<span class="badge badge-red">${'Suspendu'}</span>`,
};

function filteredClients() {
    const needle = normalize(clientsFilter.q.trim());
    return api.clients().filter((c) => (clientsFilter.state === 'all' || clientState(c) === clientsFilter.state)
        && (!needle || normalize(`${fullName(c)} ${c.email} ${c.country}`).includes(needle)))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function clientsTable() {
    const list = filteredClients();
    if (!list.length) return emptyState('magnifying-glass', 'Aucun client trouvé', 'Essayez un autre nom, e-mail ou pays.');
    const pages = listPagination(clientsFilter, list.length, 'clientsPage');
    return `<div class="table-wrap"><table class="table table-cards"><thead><tr><th>Client</th><th>E-mail</th><th>Pays</th><th>Demandes</th><th>Payé</th><th>État</th><th>Inscription</th></tr></thead><tbody>
    ${pageSlice(list, clientsFilter).map((c) => `<tr>
        <td data-label="Client"><a class="client-mini table-link" href="#/clients/${c.id}">${avatar(fullName(c), 'avatar-sm')}${esc(fullName(c))}</a></td>
        <td data-label="E-mail">${esc(c.email)}</td>
        <td data-label="Pays">${esc(c.country)}</td>
        <td data-label="Demandes">${api.requestsOf(c).length}</td>
        <td data-label="Payé" class="nowrap">${money(sum(api.invoicesOf(c).filter((i) => i.status === 'paid')))}</td>
        <td data-label="État">${CLIENT_STATE[clientState(c)]}</td>
        <td data-label="Inscription" class="nowrap">${fmtDate(c.createdAt)}</td>
    </tr>`).join('')}
    </tbody></table></div>${pages}`;
}

function pageClients() {
    return adminLayout({
        title: 'Clients',
        subtitle: plural(api.clients().length, 'client'),
        content: `<div class="toolbar">
            <div class="search-field">${icon('magnifying-glass', 18)}<label class="sr-only" for="clients-q">Filtrer les clients</label><input id="clients-q" type="search" placeholder="Nom, e-mail ou pays…" value="${esc(clientsFilter.q)}" data-input="clientsText"></div>
            <label class="sr-only" for="clients-state">État</label>
            <select id="clients-state" class="select-inline" data-input="clientsState">${[['all', 'Tous les états'], ['active', 'Actifs'], ['unverified', 'E-mail à confirmer'], ['suspended', 'Suspendus']].map(([v, l]) => `<option value="${v}" ${clientsFilter.state === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <button class="btn btn-ghost btn-sm" type="button" data-action="exportClientsCsv">${icon('arrow-down-tray', 18)}Exporter en CSV</button>
        </div>
        <section class="card" id="clients-table">${clientsTable()}</section>`,
    });
}

const refreshClients = () => { $('#clients-table').innerHTML = clientsTable(); };
INPUTS.clientsText = (input) => { clientsFilter.q = input.value; clientsFilter.page = 1; refreshClients(); };
INPUTS.clientsState = (input) => { clientsFilter.state = input.value; clientsFilter.page = 1; refreshClients(); };
ACTIONS.clientsPage = (el) => { clientsFilter.page = Number(el.dataset.page); refreshClients(); };
ACTIONS.exportClientsCsv = () => {
    const rows = filteredClients().map((c) => [fullName(c), c.email, c.phone, c.country, api.requestsOf(c).length, fmtDate(c.createdAt)]);
    downloadCsv('kwabo-clients.csv', [['Client', 'E-mail', 'Téléphone', 'Pays', 'Demandes', 'Inscription'], ...rows]);
};

function pageClientFile(id) {
    const user = currentUser();
    const c = userById(id);
    if (!c || c.role !== 'USER') {
        return adminLayout({ title: 'Client introuvable', content: emptyState('magnifying-glass', 'Client introuvable', 'Ce compte n\'existe pas ou a été supprimé.', '<a class="btn btn-primary" href="#/clients">Retour aux clients</a>') });
    }
    const requests = api.requestsOf(c);
    const invoices = api.invoicesOf(c);
    return adminLayout({
        title: fullName(c),
        subtitle: `Client depuis le ${fmtDate(c.createdAt)}`,
        content: `
        <a class="breadcrumb" href="#/clients">${icon('arrow-left', 16)}Clients</a>
        ${statsRow([
            ['clipboard-document-list', requests.length, 'Demandes', 'neutral'],
            ['bolt', requests.filter((r) => r.status === 'active').length, 'En cours', 'green'],
            ['banknotes', money(sum(invoices.filter((i) => i.status === 'paid'))), 'Total payé', 'green'],
            ['clock', money(sum(invoices.filter((i) => i.status === 'due'))), 'À payer', 'gold'],
        ])}
        <div class="detail-grid">
            <div class="stack">
                <section class="card"><h2>Demandes</h2>${requests.length ? `<div class="request-list">${requests.map((r) => requestRow(r, user)).join('')}</div>` : '<p class="muted">Aucune demande.</p>'}</section>
                <section class="card"><h2>Factures</h2>${invoices.length ? `<ul class="mini-invoices">${invoices.map((i) => `<li><button class="link-btn" type="button" data-action="viewInvoice" data-id="${i.id}">${esc(i.id)}</button><span class="muted">${esc(i.label)}</span><strong>${money(i.amount)}</strong>${invoiceBadge(i)}</li>`).join('')}</ul>` : '<p class="muted">Aucune facture.</p>'}</section>
            </div>
            <aside class="stack">
                <section class="card"><div class="client-mini">${avatar(fullName(c))}<span><strong>${esc(fullName(c))}</strong><small>${esc(c.country)}</small></span></div>
                    <p class="client-state">${CLIENT_STATE[clientState(c)]}</p>
                    <ul class="contact-list"><li>${icon('envelope', 18)}<a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li><li>${icon('phone', 18)}<a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a></li><li>${icon('gift', 18)}<span>Code : ${esc(c.referralCode)}</span></li><li>${icon('shield-check', 18)}<span>Double authentification ${c.twoFactor ? 'activée' : 'désactivée'}</span></li></ul>
                </section>
                <section class="card"><h2>Actions sur le compte</h2><div class="action-stack">
                    <button class="btn btn-ghost btn-block" type="button" data-action="sendResetLink" data-id="${c.id}">${icon('envelope', 18)}Envoyer un lien de mot de passe</button>
                    <button class="btn btn-ghost btn-block" type="button" data-action="toggleSuspend" data-id="${c.id}">${icon(c.suspended ? 'check-circle' : 'hand-raised', 18)}${c.suspended ? 'Réactiver le compte' : 'Suspendre le compte'}</button>
                    <button class="btn btn-danger-ghost btn-block" type="button" data-action="eraseClient" data-id="${c.id}">${icon('x-circle', 18)}Effacer le compte et ses données</button>
                </div><p class="muted small-text">L'effacement répond au droit à l'effacement (RGPD). Il est définitif.</p></section>
            </aside>
        </div>`,
    });
}

ACTIONS.sendResetLink = (el) => {
    const c = userById(el.dataset.id);
    toast(`Démonstration : lien valable 1 heure envoyé à ${c.email}.`);
};
ACTIONS.toggleSuspend = async (el) => {
    const c = userById(el.dataset.id);
    const suspending = !c.suspended;
    const yes = await confirmDialog({
        title: suspending ? `Suspendre ${fullName(c)} ?` : `Réactiver ${fullName(c)} ?`,
        body: suspending ? 'Cette personne perd l\'accès immédiatement, sur tous ses appareils.' : 'Cette personne pourra se reconnecter.',
        confirm: suspending ? 'Suspendre' : 'Réactiver', danger: suspending,
    });
    if (!yes) return;
    api.setSuspended(c, suspending);
    toast(suspending ? 'Compte suspendu.' : 'Compte réactivé.');
    route({ keepPosition: true });
};
ACTIONS.eraseClient = async (el) => {
    const c = userById(el.dataset.id);
    const yes = await confirmDialog({ title: `Effacer le compte de ${fullName(c)} ?`, body: 'Demandes, documents, messages, factures et avis seront supprimés. Cette action est irréversible.', confirm: 'Effacer définitivement', danger: true });
    if (!yes) return;
    const name = fullName(c);
    audit(`Compte effacé : ${name}`);
    api.eraseUser(c);
    toast(`Compte de ${name} effacé.`);
    location.hash = '#/clients';
};

/* ---------- Avis ---------- */
let reviewsTab = 'pending';
const REVIEW_TABS = { pending: 'À modérer', published: 'Publiés', hidden: 'Masqués' };
const starsReadout = (rating) => `<span class="stars-read" role="img" aria-label="${rating} sur 5">${[1, 2, 3, 4, 5].map((n) => `<span class="${n <= rating ? 'is-on' : ''}">${icon('star', 18)}</span>`).join('')}</span>`;

function reviewsList() {
    const list = db.reviews.filter((a) => a.status === reviewsTab).sort((a, b) => new Date(b.at) - new Date(a.at));
    if (!list.length) return emptyState('star', 'Aucun avis ici', reviewsTab === 'pending' ? 'Tous les avis ont été modérés.' : 'Les avis apparaîtront ici après modération.');
    return `<ul class="review-list">${list.map((a) => {
        const r = requestById(a.requestId);
        const client = userById(a.userId);
        return `<li class="card">
            <div class="review-head">${starsReadout(a.rating)}<small class="muted">${fmtDate(a.at)}</small></div>
            <p class="review-text">${a.comment ? esc(a.comment) : '<span class="muted">Pas de commentaire.</span>'}</p>
            <p class="muted small-text">${esc(client ? fullName(client) : 'Client')} · ${r ? `<a href="#/demandes/${r.id}">${esc(r.title)}</a>` : ''}</p>
            <div class="btn-row">
                ${a.status !== 'published' ? `<button class="btn btn-primary btn-sm" type="button" data-action="moderateReview" data-id="${a.id}" data-status="published">${icon('check', 16)}Publier</button>` : ''}
                ${a.status !== 'hidden' ? `<button class="btn btn-ghost btn-sm" type="button" data-action="moderateReview" data-id="${a.id}" data-status="hidden">${icon('eye-slash', 16)}Masquer</button>` : ''}
            </div>
        </li>`;
    }).join('')}</ul>`;
}

function pageReviews() {
    const ratings = db.reviews.map((a) => a.rating);
    const average = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1).replace('.', ',') : '–';
    return adminLayout({
        title: 'Avis',
        subtitle: `Note moyenne : ${average} sur 5, sur ${plural(ratings.length, 'avis').replace('aviss', 'avis')}`,
        content: `<div class="chips" role="group" aria-label="Filtrer les avis">${Object.entries(REVIEW_TABS).map(([key, label]) => `<button class="chip" type="button" data-action="reviewsTab" data-tab="${key}" aria-pressed="${reviewsTab === key}">${label} <span class="chip-count">${db.reviews.filter((a) => a.status === key).length}</span></button>`).join('')}</div>
        <div id="reviews-list">${reviewsList()}</div>`,
    });
}
ACTIONS.reviewsTab = (el) => { reviewsTab = el.dataset.tab; route({ keepPosition: true }); };
ACTIONS.moderateReview = (el) => {
    api.moderateReview(db.reviews.find((a) => a.id === el.dataset.id), el.dataset.status);
    toast(el.dataset.status === 'published' ? 'Avis publié.' : 'Avis masqué.');
    route({ keepPosition: true });
};

/* ---------- Parrainage ---------- */
function pageReferrals() {
    const rows = Object.entries(db.referrals).map(([id, referrals]) => ({ user: userById(id), referrals })).filter((row) => row.user);
    const active = rows.reduce((total, row) => total + row.referrals.filter((r) => r.status === 'Actif').length, 0);
    const total = rows.reduce((count, row) => count + row.referrals.length, 0);
    const example = 10;
    return adminLayout({
        title: 'Parrainage',
        subtitle: 'Parrains, filleuls et récompenses',
        content: `
        ${statsRow([['user-group', rows.length, 'Parrains', 'neutral'], ['user-plus', total, 'Filleuls', 'neutral'], ['check-circle', active, 'Filleuls convertis', 'green'], ['gift', money(active * example), 'Récompenses', 'gold']])}
        <p class="notice">${icon('information-circle')}Exemple : ${example} € par filleul converti. Le montant réel reste à fixer par KWABO.</p>
        <section class="card">${rows.length ? `<div class="table-wrap"><table class="table table-cards"><thead><tr><th>Parrain</th><th>Code</th><th>Filleuls</th><th>Convertis</th><th>Récompense</th></tr></thead><tbody>
        ${rows.map(({ user, referrals }) => {
            const converted = referrals.filter((r) => r.status === 'Actif').length;
            return `<tr><td data-label="Parrain"><a class="table-link" href="#/clients/${user.id}">${esc(fullName(user))}</a></td><td data-label="Code">${esc(user.referralCode)}</td><td data-label="Filleuls">${esc(referrals.map((r) => r.name).join(', '))}</td><td data-label="Convertis">${converted}</td><td data-label="Récompense"><strong>${money(converted * example)}</strong></td></tr>`;
        }).join('')}
        </tbody></table></div>` : emptyState('gift', 'Aucun parrainage', 'Les parrainages apparaîtront ici.')}</section>`,
    });
}

/* ---------- Catalogue ---------- */
function pageCatalog() {
    return adminLayout({
        title: 'Catalogue',
        subtitle: 'Un service indisponible disparaît du site et de l\'application',
        content: CATEGORIES.map((c) => `<section class="card"><h2>${esc(c.name)}</h2>
            <div class="table-wrap"><table class="table table-cards"><thead><tr><th>Service</th><th>Tarif affiché</th><th>Demandes</th><th>Disponible</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>
            ${SERVICES.filter((s) => s.cat === c.id).map((s) => `<tr>
                <td data-label="Service"><span class="client-mini"><span class="tile tile-sm cat-${s.cat}">${icon(s.icon, 18)}</span><strong>${esc(s.name)}</strong></span></td>
                <td data-label="Tarif">${esc(s.price)}</td>
                <td data-label="Demandes">${db.requests.filter((r) => r.serviceId === s.id).length}</td>
                <td data-label="Disponible"><label class="switch switch-inline"><span class="sr-only">${esc(s.name)} disponible</span><input type="checkbox" data-input="serviceAvailable" data-id="${s.id}" ${s.available ? 'checked' : ''}><span class="switch-track" aria-hidden="true"></span></label></td>
                <td class="td-action"><button class="btn btn-ghost btn-sm" type="button" data-action="editServicePrice" data-id="${s.id}">Modifier le tarif</button></td>
            </tr>`).join('')}
            </tbody></table></div></section>`).join(''),
    });
}

INPUTS.serviceAvailable = (input) => {
    api.setService(input.dataset.id, { available: input.checked });
    toast(input.checked ? 'Service disponible.' : 'Service retiré du site et de l\'application.');
};
ACTIONS.editServicePrice = (el) => {
    const s = serviceById(el.dataset.id);
    openDialog(`<h2 class="dialog-title" id="dialog-heading">${esc(s.name)}</h2>
    <form data-form="saveServicePrice" data-id="${s.id}" novalidate>
        ${field({ name: 'servicePrice', label: 'Tarif affiché', required: true, value: s.price, hint: 'Exemple : Dès 50 €/démarche. Le prix exact figure dans le devis.' })}
        <div class="dialog-actions"><button class="btn btn-ghost" type="button" data-action="closeDialog">Annuler</button><button class="btn btn-primary" type="submit">Enregistrer</button></div>
    </form>`);
};
FORMS.saveServicePrice = (form) => {
    const price = form.elements.servicePrice.value.trim();
    if (!showErrors(form, price ? {} : { servicePrice: 'Saisissez un tarif.' })) return;
    api.setService(form.dataset.id, { price });
    closeDialog();
    toast('Tarif enregistré.');
    route({ keepPosition: true });
};

/* ---------- Équipe et rôles ---------- */
const PERMISSIONS = [
    ['Voir ses propres demandes et documents', true, true, true],
    ['Écrire au client sur une demande', true, true, true],
    ['Déposer rapports, photos, reçus', false, true, true],
    ['Changer le statut d\'une demande attribuée', false, true, true],
    ['Voir toutes les demandes', false, false, true],
    ['Attribuer un agent, envoyer un devis', false, false, true],
    ['Gérer clients, paiements et avis', false, false, true],
    ['Gérer le catalogue et l\'équipe', false, false, true],
];

function pageTeam() {
    const me = currentUser();
    const team = db.users.filter((u) => u.role !== 'USER');
    return adminLayout({
        title: 'Équipe et rôles',
        subtitle: plural(team.length, 'membre'),
        actions: `<button class="btn btn-primary btn-sm" type="button" data-action="addOperator">${icon('user-plus', 18)}<span>Ajouter un agent</span></button>`,
        content: `<ul class="team-grid">${team.map((u) => {
            const assigned = db.requests.filter((r) => r.operatorId === u.id);
            return `<li class="card">
                <div class="client-mini">${avatar(fullName(u))}<span><strong>${esc(fullName(u))}</strong><small>${ROLE_LABEL[u.role]}</small></span>${u.suspended ? '<span class="badge badge-red">Suspendu</span>' : ''}</div>
                <ul class="contact-list"><li>${icon('envelope', 18)}<span>${esc(u.email)}</span></li><li>${icon('phone', 18)}<span>${esc(u.phone)}</span></li></ul>
                ${u.role === 'OPERATOR' ? `<p class="team-load"><strong>${assigned.filter((r) => r.status === 'active').length}</strong> en cours · <strong>${assigned.length}</strong> au total</p>` : '<p class="team-load muted">Accès à toutes les demandes</p>'}
                ${u.id !== me.id ? `<button class="btn btn-ghost btn-sm" type="button" data-action="toggleSuspend" data-id="${u.id}">${u.suspended ? 'Réactiver' : 'Suspendre'}</button>` : ''}
            </li>`;
        }).join('')}</ul>
        <section class="card"><h2>Qui peut faire quoi</h2>
            <div class="table-wrap"><table class="table table-perms"><thead><tr><th>Permission</th><th>Client</th><th>Agent terrain</th><th>Administrateur</th></tr></thead><tbody>
            ${PERMISSIONS.map(([label, ...roles]) => `<tr><td>${esc(label)}</td>${roles.map((allowed) => `<td>${allowed ? `<span class="perm-yes">${icon('check', 18)}<span class="sr-only">Oui</span></span>` : '<span class="perm-no" aria-label="Non">–</span>'}</td>`).join('')}</tr>`).join('')}
            </tbody></table></div>
        </section>`,
    });
}

ACTIONS.addOperator = () => {
    openDialog(`<h2 class="dialog-title" id="dialog-heading">Ajouter un agent terrain</h2>
    <form data-form="addOperator" novalidate>
        <div class="form-grid">
            ${field({ name: 'opFirstName', label: 'Prénom', required: true })}
            ${field({ name: 'opLastName', label: 'Nom', required: true })}
        </div>
        ${field({ name: 'opEmail', label: 'E-mail', type: 'email', required: true })}
        ${field({ name: 'opPhone', label: 'Téléphone', type: 'tel', required: true, placeholder: '+229 01…' })}
        <p class="muted small-text">Démonstration : le mot de passe de ce compte est Demo1234. En vrai, l'agent reçoit une invitation par e-mail.</p>
        <div class="dialog-actions"><button class="btn btn-ghost" type="button" data-action="closeDialog">Annuler</button><button class="btn btn-primary" type="submit">Ajouter</button></div>
    </form>`);
};
FORMS.addOperator = (form) => {
    const v = Object.fromEntries(new FormData(form));
    const errors = {};
    if (!v.opFirstName.trim()) errors.opFirstName = 'Saisissez le prénom.';
    if (!v.opLastName.trim()) errors.opLastName = 'Saisissez le nom.';
    if (!/^\S+@\S+\.\S+$/.test(v.opEmail)) errors.opEmail = 'Saisissez une adresse e-mail valide.';
    if (v.opPhone.replace(/\D/g, '').length < 6) errors.opPhone = 'Saisissez un numéro valide.';
    if (!showErrors(form, errors)) return;
    try {
        api.addOperator({ firstName: v.opFirstName, lastName: v.opLastName, email: v.opEmail, phone: v.opPhone });
        closeDialog();
        toast('Agent ajouté.');
        route({ keepPosition: true });
    } catch (error) { apiErrorToForm(form, error, 'opEmail'); }
};

/* ---------- Journal ---------- */
const journalFilter = { q: '', page: 1 };

function journalList() {
    const needle = normalize(journalFilter.q.trim());
    const list = db.audit.filter((j) => !needle || normalize(`${j.text} ${j.actor}`).includes(needle));
    if (!list.length) return emptyState('document-check', 'Aucune activité', 'Changez votre recherche.');
    const pages = listPagination(journalFilter, list.length, 'journalPage');
    return `<ol class="timeline">${pageSlice(list, journalFilter).map((j) => `<li><strong>${esc(j.text)}</strong><small>${esc(j.actor)} · ${fmtDateTime(j.at)}</small></li>`).join('')}</ol>${pages}`;
}

function pageJournal() {
    return adminLayout({
        title: 'Journal d\'activité',
        subtitle: 'Qui a fait quoi, et quand',
        content: `<div class="toolbar"><div class="search-field">${icon('magnifying-glass', 18)}<label class="sr-only" for="journal-q">Filtrer le journal</label><input id="journal-q" type="search" placeholder="Action ou personne…" value="${esc(journalFilter.q)}" data-input="journalText"></div></div>
        <section class="card" id="journal-list">${journalList()}</section>`,
    });
}
INPUTS.journalText = (input) => { journalFilter.q = input.value; journalFilter.page = 1; $('#journal-list').innerHTML = journalList(); };
ACTIONS.journalPage = (el) => { journalFilter.page = Number(el.dataset.page); $('#journal-list').innerHTML = journalList(); };

/* ---------- Notifications et compte ---------- */
function pageNotifications() {
    const list = api.notificationsOf(currentUser());
    const unread = list.filter((n) => !n.read).length;
    return adminLayout({
        title: 'Notifications',
        subtitle: unread > 1 ? `${unread} non lues` : `${unread} non lue`,
        content: `<section class="card">
            ${unread ? '<div class="card-head card-head-end"><button class="btn btn-ghost btn-sm" type="button" data-action="markAllRead">Tout marquer comme lu</button></div>' : ''}
            ${list.length ? `<ul class="notif-list">${list.map(notificationItem).join('')}</ul>` : emptyState('bell', 'Aucune notification', 'Vous serez prévenu ici.')}
        </section>`,
    });
}
ACTIONS.markAllRead = () => { api.markAllRead(currentUser()); route({ keepPosition: true }); };

function pageAccount() {
    const user = currentUser();
    return adminLayout({
        title: 'Mon compte',
        subtitle: `${ROLE_LABEL[user.role]} · ${user.email}`,
        content: `<div class="dash-grid dash-grid-even">
            <form class="card form-card" data-form="staffPassword" novalidate>
                <h2>Mot de passe</h2>
                ${field({ name: 'current', label: 'Mot de passe actuel', type: 'password', required: true, autocomplete: 'current-password' })}
                ${field({ name: 'next', label: 'Nouveau mot de passe', type: 'password', required: true, autocomplete: 'new-password', hint: 'Au moins 8 caractères, avec 1 majuscule et 1 chiffre.' })}
                <button class="btn btn-primary" type="submit">Changer le mot de passe</button>
            </form>
            <div class="stack">
                <section class="card"><h2>Sécurité</h2>
                    <div class="setting"><span class="tile tile-sm">${icon('shield-check', 18)}</span><div><strong>Double authentification</strong><small>${user.twoFactor ? 'Activée.' : 'Conseillée pour les comptes de l\'équipe.'}</small></div>
                        <button class="btn btn-ghost btn-sm" type="button" data-action="staffTwoFactor">${user.twoFactor ? 'Désactiver' : 'Activer'}</button></div>
                </section>
                <section class="card card-soft"><h2>Démonstration</h2><p class="muted">Remet les comptes et les données d'exemple à leur état de départ, sur les trois interfaces.</p><button class="btn btn-ghost" type="button" data-action="staffResetDemo">Réinitialiser la démo</button></section>
            </div>
        </div>`,
    });
}

FORMS.staffPassword = (form) => {
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
ACTIONS.staffTwoFactor = async () => {
    const user = currentUser();
    if (user.twoFactor) {
        const yes = await confirmDialog({ title: 'Désactiver la double authentification ?', body: 'Votre compte sera moins bien protégé.', confirm: 'Désactiver', danger: true });
        if (!yes) return;
        api.updateProfile(user, { twoFactor: false });
        route({ keepPosition: true });
        return;
    }
    openDialog(`<h2 class="dialog-title" id="dialog-heading">Activer la double authentification</h2>
    <p class="muted">Pour la démonstration, le code est 123456.</p>
    <form data-form="staffEnableTwoFactor" novalidate>
        ${field({ name: 'twoFactorCode', label: 'Code à 6 chiffres', required: true, autocomplete: 'one-time-code', attrs: 'inputmode="numeric" maxlength="6"' })}
        <div class="dialog-actions"><button class="btn btn-ghost" type="button" data-action="closeDialog">Annuler</button><button class="btn btn-primary" type="submit">Activer</button></div>
    </form>`);
};
FORMS.staffEnableTwoFactor = (form) => {
    if (!showErrors(form, form.elements.twoFactorCode.value.trim() === '123456' ? {} : { twoFactorCode: 'Code incorrect.' })) return;
    api.updateProfile(currentUser(), { twoFactor: true });
    closeDialog();
    toast('Double authentification activée.');
    route({ keepPosition: true });
};
ACTIONS.staffResetDemo = async () => {
    const yes = await confirmDialog({ title: 'Réinitialiser la démonstration ?', body: 'Les données créées pendant vos essais seront effacées.', confirm: 'Réinitialiser', danger: true });
    if (!yes) return;
    resetDemo();
    toast('Démonstration réinitialisée.');
    location.hash = '#/connexion';
};

/* ---------- Connexion de l'équipe ---------- */
let pendingStaffLogin = null;

function pageStaffLogin() {
    const form = pendingStaffLogin ? `
        <h1>Code de vérification</h1>
        <p class="muted">Saisissez le code à 6 chiffres de votre application d'authentification.</p>
        <form data-form="staffCode" novalidate>
            ${field({ name: 'code', label: 'Code', required: true, autocomplete: 'one-time-code', hint: 'Démonstration : 123456', attrs: 'inputmode="numeric" maxlength="6"' })}
            <button class="btn btn-primary btn-lg btn-block" type="submit">Vérifier</button>
        </form>
        <button class="link-btn" type="button" data-action="staffCancelCode">${icon('arrow-left', 16)}Retour</button>` : `
        <h1>Espace équipe</h1>
        <p class="muted">Accès réservé aux administrateurs et aux agents terrain.</p>
        <form data-form="staffLogin" novalidate>
            ${field({ name: 'email', label: 'E-mail professionnel', type: 'email', required: true, autocomplete: 'username', placeholder: 'prenom@kwabo.bj' })}
            ${field({ name: 'password', label: 'Mot de passe', type: 'password', required: true, autocomplete: 'current-password' })}
            <button class="btn btn-primary btn-lg btn-block" type="submit">Se connecter</button>
        </form>
        <div class="demo-accounts"><p>Comptes de démonstration</p><div>
            <button class="btn btn-ghost btn-sm" type="button" data-action="staffDemo" data-email="admin@kwabo.demo">Administrateur</button>
            <button class="btn btn-ghost btn-sm" type="button" data-action="staffDemo" data-email="agent@kwabo.demo">Agent terrain</button>
        </div></div>`;
    const values = kpiValues();
    return `<div class="auth">
        <aside class="auth-aside">
            ${logo(true)}
            <div>
                <h2>Toutes les missions, <em>au même endroit</em></h2>
                <ul class="auth-points">
                    ${[['clipboard-document-list', 'Demandes et devis', 'Attribuez, chiffrez et suivez chaque mission.'],
                        ['chat-bubble-left-right', 'Messagerie client', 'Un fil de discussion par demande.'],
                        ['document-check', 'Preuves de terrain', 'Rapports, photos, vidéos et reçus déposés par les agents.'],
                        ['chart-bar', 'Indicateurs', `${values.requests} demandes suivies dans cette démonstration.`]]
                        .map(([ic, title, text]) => `<li><span class="trust-card-icon">${icon(ic, 20)}</span><span><strong>${title}</strong><small>${text}</small></span></li>`).join('')}
                </ul>
            </div>
            <p class="auth-foot">admin.kwabo.bj</p>
        </aside>
        <main class="auth-main" id="main" tabindex="-1">
            <div class="auth-mobile-logo">${logo()}</div>
            <div class="auth-card">${form}</div>
            <p class="auth-legal"><a href="index.html">Site public</a> · <a href="mobile.html">Application mobile</a></p>
        </main>
    </div>`;
}

ACTIONS.staffDemo = (el) => {
    const form = $('form[data-form="staffLogin"]');
    form.elements.email.value = el.dataset.email;
    form.elements.password.value = 'Demo1234';
    clearErrors(form);
    form.querySelector('button[type="submit"]').focus();
};
FORMS.staffLogin = (form) => {
    const email = form.elements.email.value;
    const password = form.elements.password.value;
    const errors = {};
    if (!email.includes('@')) errors.email = 'Saisissez une adresse e-mail valide.';
    if (!password) errors.password = 'Saisissez votre mot de passe.';
    if (!showErrors(form, errors)) return;
    try {
        const result = api.login({ email, password, remember: false });
        if (result.needsCode) { pendingStaffLogin = { email, password }; route(); return; }
        location.hash = '#/';
        route();
    } catch (error) { apiErrorToForm(form, error, 'email'); }
};
FORMS.staffCode = (form) => {
    try {
        api.login({ ...pendingStaffLogin, remember: false, code: form.elements.code.value.trim() });
        pendingStaffLogin = null;
        location.hash = '#/';
        route();
    } catch (error) { apiErrorToForm(form, error, 'code'); }
};
ACTIONS.staffCancelCode = () => { pendingStaffLogin = null; route(); };

/* ---------- Routeur ---------- */
let isFirstAdminRender = true;

function adminRoute(parts, params) {
    const [section, id] = parts;
    const user = currentUser();
    if (section === 'connexion') {
        if (user) { location.hash = '#/'; return ''; }
        return pageStaffLogin();
    }
    if (!user) { location.hash = '#/connexion'; return ''; }
    if (ADMIN_ONLY.includes(section) && user.role !== 'ADMIN') { location.hash = '#/'; return ''; }
    switch (section) {
        case undefined: return pageDashboard();
        case 'indicateurs': return pageKpis();
        case 'demandes': return id ? pageRequestDetail(id) : pageRequests(params);
        case 'messages': return pageInbox(id);
        case 'paiements': return pagePayments(params);
        case 'clients': return id ? pageClientFile(id) : pageClients();
        case 'avis': return pageReviews();
        case 'parrainage': return pageReferrals();
        case 'catalogue': return pageCatalog();
        case 'equipe': return pageTeam();
        case 'journal': return pageJournal();
        case 'notifications': return pageNotifications();
        case 'compte': return pageAccount();
        default: return adminLayout({ title: 'Page introuvable', content: emptyState('magnifying-glass', 'Page introuvable', 'Cette page n\'existe pas.', '<a class="btn btn-primary" href="#/">Retour</a>') });
    }
}

function route({ keepPosition = false } = {}) {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, query = ''] = raw.split('?');
    const scrollY = window.scrollY;
    const html = adminRoute(path.split('/').filter(Boolean), new URLSearchParams(query));
    if (html === '') return;
    $('#root').innerHTML = html;
    const heading = $('h1')?.textContent.trim();
    document.title = heading ? `${heading} · Administration KWABO` : 'Administration KWABO';
    scrollThreadToEnd();
    if (keepPosition) { window.scrollTo(0, scrollY); return; }
    if (!isFirstAdminRender) $('#main')?.focus({ preventScroll: true });
    isFirstAdminRender = false;
    window.scrollTo(0, 0);
}
