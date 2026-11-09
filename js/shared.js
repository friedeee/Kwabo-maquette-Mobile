'use strict';
/* Morceaux communs à l'espace client, à l'application mobile et à l'administration. */

const PAGE_SIZE = 5;
const currentPath = () => location.hash.split('?')[0] || '#/';
const requestUrl = (r, user) => (user.role === 'USER' ? `#/espace/demandes/${r.id}` : `#/demandes/${r.id}`);
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

function sideLink(item, path) {
    if (item.heading) return `<p class="side-heading">${esc(item.heading)}</p>`;
    const active = item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
    return `<a class="side-link" href="${item.href}" ${active ? 'aria-current="page"' : ''}>${icon(item.icon)}<span>${esc(item.label)}</span>${item.badge ? `<span class="count">${item.badge}</span>` : ''}</a>`;
}

/* Gabarit des espaces connectés : barre latérale, en-tête, barre d'onglets sur mobile. */
function appLayout({ user, nav, tabs, title, subtitle, content, actions = '', bellHref, bellCount = 0, whatsapp = true, profileHref = null }) {
    const path = currentPath();
    return `<div class="app">
        <aside class="sidebar" id="sidebar" aria-label="Menu de l'espace">
            <div class="sidebar-top">${logo(true)}<button class="sidebar-close" type="button" data-action="closeSidebar" aria-label="Fermer le menu">${icon('x-mark', 22)}</button></div>
            <nav class="side-nav">${nav.map((item) => sideLink(item, path)).join('')}</nav>
            <div class="sidebar-foot">
                ${whatsapp ? `<a class="side-whatsapp" href="${waLink()}" target="_blank" rel="noopener">${WHATSAPP_ICON}<span>WhatsApp</span></a>` : ''}
                <${profileHref ? `a href="${profileHref}"` : 'div'} class="side-user">${avatar(fullName(user))}<span><strong>${esc(fullName(user))}</strong><small>${esc(user.email)}</small></span></${profileHref ? 'a' : 'div'}>
                <button class="side-link side-logout" type="button" data-action="logout">${icon('arrow-right-on-rectangle')}<span>Se déconnecter</span></button>
                ${whatsapp ? '<p class="side-legal"><a href="#/confidentialite">Confidentialité</a> · <a href="#/cgu">CGU</a></p>' : ''}
            </div>
        </aside>
        <div class="sidebar-overlay" data-action="closeSidebar"></div>
        <div class="app-main">
            <header class="topbar">
                <button class="icon-btn menu-btn" type="button" data-action="openSidebar" aria-label="Ouvrir le menu" aria-controls="sidebar">${icon('bars-3', 24)}</button>
                <div class="topbar-title"><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>
                <div class="topbar-actions">
                    ${actions}
                    ${bellHref ? `<a class="icon-btn" href="${bellHref}" aria-label="Notifications, ${bellCount} non lues">${icon('bell', 22)}${bellCount ? `<span class="dot-count">${bellCount}</span>` : ''}</a>` : ''}
                </div>
            </header>
            <main class="app-content" id="main" tabindex="-1">${content}</main>
        </div>
        ${tabs ? `<nav class="tabbar" aria-label="Accès rapide">${tabs.map((t) => {
            const active = t.exact ? path === t.href : path === t.href || path.startsWith(`${t.href}/`);
            return `<a class="${t.primary ? 'tab-primary' : ''}" href="${t.href}" ${active ? 'aria-current="page"' : ''}>${icon(t.icon, 22)}<span>${esc(t.label)}</span>${t.badge ? `<span class="dot-count">${t.badge}</span>` : ''}</a>`;
        }).join('')}</nav>` : ''}
    </div>${whatsapp ? whatsappFloat() : ''}`;
}

ACTIONS.openSidebar = () => $('#sidebar').classList.add('open');
ACTIONS.closeSidebar = () => $('#sidebar')?.classList.remove('open');
ACTIONS.logout = () => {
    api.logout();
    toast('Vous êtes déconnecté.');
    location.hash = '#/connexion';
};

/* ---------- Morceaux réutilisés ---------- */
function requestRow(r, user) {
    const s = serviceById(r.serviceId);
    return `<a class="request-row" href="${requestUrl(r, user)}">
        <span class="tile cat-${s.cat}">${icon(s.icon)}</span>
        <span class="request-row-main">
            <strong>${esc(r.title)}</strong>
            <small>${esc(r.tracking)} · ${esc(r.city)} · ${fmtDate(r.createdAt)}</small>
        </span>
        <span class="request-row-side">${r.urgency === 'urgent' ? `<span class="badge badge-red">${icon('bolt', 14)}Urgent</span>` : ''}${statusBadge(r.status)}${icon('chevron-right', 18)}</span>
    </a>`;
}

function statusSteps(status) {
    if (status === 'cancelled') {
        return `<p class="notice notice-red">${icon('x-circle')}Cette demande a été annulée.</p>`;
    }
    const order = ['pending', 'active', 'done'];
    const reached = order.indexOf(status);
    return `<ol class="status-steps">${order.map((key, i) => `
        <li class="${i < reached || status === 'done' ? 'is-done' : ''} ${i === reached && status !== 'done' ? 'is-current' : ''}" ${i === reached ? 'aria-current="step"' : ''}>
            <span class="status-step-dot">${i < reached || status === 'done' ? icon('check', 16) : icon(STATUS[key].icon, 16)}</span>
            <span>${STATUS[key].label}</span>
        </li>`).join('')}</ol>`;
}

function requestInfoCard(r) {
    const s = serviceById(r.serviceId);
    const details = s.fields.filter((f) => r.details?.[f.name]).map((f) => [f.label, r.details[f.name]]);
    const rows = [
        ['Service', s.name], ['Ville', r.city], ['Urgence', r.urgency === 'urgent' ? 'Urgent' : 'Normale'],
        ...(r.budget ? [['Budget indiqué', r.budget]] : []), ['Date de la demande', fmtDate(r.createdAt)], ...details,
    ];
    return `<section class="card"><h2>Informations</h2>
        <dl class="info-list">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        ${r.description ? `<h3>Description</h3><p>${esc(r.description)}</p>` : ''}
    </section>`;
}

function historyCard(r) {
    return `<section class="card"><h2>Historique</h2>
        <ol class="timeline">${[...r.history].reverse().map((h) => `<li><strong>${esc(h.text)}</strong><small>${fmtDateTime(h.at)}</small></li>`).join('')}</ol>
    </section>`;
}

function documentItem(d) {
    const custom = typeof mobileDocumentItem === 'function' ? mobileDocumentItem(d) : null;
    if (custom) return custom;
    const type = DOC_TYPES[d.type];
    return `<li class="doc-item">
        <span class="tile tile-sm">${icon(type.icon, 18)}</span>
        <span class="doc-item-main"><strong>${esc(d.name)}</strong><small>${type.label} · ${fmtDate(d.createdAt)}</small></span>
        <button class="icon-btn" type="button" data-action="previewDocument" data-id="${esc(d.id)}" aria-label="Voir ${esc(d.name)}" title="Voir">${icon('eye')}</button>
        <button class="icon-btn" type="button" data-action="downloadDocument" aria-label="Télécharger ${esc(d.name)}" title="Télécharger">${icon('arrow-down-tray')}</button>
    </li>`;
}

ACTIONS.previewDocument = (el) => {
    const d = db.documents.find((x) => x.id === el.dataset.id);
    const custom = typeof mobileDocumentPreview === 'function' ? mobileDocumentPreview(d) : null;
    if (custom) { openDialog(custom, { wide: true }); return; }
    const type = DOC_TYPES[d.type];
    openDialog(`<h2 class="dialog-title" id="dialog-heading">${esc(d.name)}</h2>
        <div class="doc-preview">${icon(type.icon, 56)}<p><strong>${type.label}</strong></p><p class="muted">Aperçu de démonstration : le vrai fichier s'affichera ici.</p></div>
        <p class="muted">Ajouté le ${fmtDate(d.createdAt)}</p>`, { wide: true });
};
ACTIONS.downloadDocument = () => toast('Démonstration : le vrai fichier se téléchargera ici.');

function threadMessages(r, user) {
    const messages = api.messagesOf(r.id);
    if (!messages.length) return '<p class="muted thread-empty">Aucun message pour le moment. Posez votre question ici.</p>';
    const mineSide = user.role === 'USER' ? 'client' : 'team';
    return messages.map((m) => `<div class="bubble ${m.from === mineSide ? 'bubble-mine' : ''}">
        <span class="bubble-author">${esc(m.author)}</span>
        ${m.text ? `<p>${esc(m.text)}</p>` : ''}
        ${m.attachment ? `<span class="bubble-file">${icon('paper-clip', 16)}${esc(m.attachment)}</span>` : ''}
        <time datetime="${m.at}">${fmtDateTime(m.at)}</time>
    </div>`).join('');
}

function threadPanel(r, user) {
    const closed = r.status === 'cancelled';
    return `<div class="thread">
        <div class="thread-messages" id="thread-messages" role="log" aria-label="Messages de la demande">${threadMessages(r, user)}</div>
        ${closed ? '<p class="notice">Cette demande est annulée : la discussion est fermée.</p>' : `
        <form class="thread-form" data-form="sendMessage" data-request="${r.id}" novalidate>
            <p class="attachment-name" hidden></p>
            <div class="thread-form-row">
                <label class="icon-btn attach" title="Joindre un fichier">${icon('paper-clip')}<span class="sr-only">Joindre un fichier</span><input class="sr-only" type="file" name="attachment" data-input="attachmentChosen"></label>
                <label class="sr-only" for="message-text">Votre message</label>
                <textarea id="message-text" name="text" rows="1" placeholder="Écrivez votre message…" data-enter-submit></textarea>
                <button class="btn btn-primary btn-icon" type="submit" aria-label="Envoyer">${icon('paper-airplane', 18)}</button>
            </div>
        </form>`}
    </div>`;
}

function scrollThreadToEnd() {
    const box = $('#thread-messages');
    if (box) box.scrollTop = box.scrollHeight;
}

INPUTS.attachmentChosen = (input) => {
    const label = $('.attachment-name', input.closest('form'));
    label.textContent = input.files[0] ? `Pièce jointe : ${input.files[0].name}` : '';
    label.hidden = !input.files[0];
};

FORMS.sendMessage = (form) => {
    const text = form.elements.text.value.trim();
    const file = form.elements.attachment.files[0];
    if (!text && !file) { form.elements.text.focus(); return; }
    const user = currentUser();
    const r = requestById(form.dataset.request);
    api.sendMessage(r, user, text, file?.name);
    form.reset();
    INPUTS.attachmentChosen(form.elements.attachment);
    $('#thread-messages').innerHTML = threadMessages(r, user);
    scrollThreadToEnd();
    form.elements.text.focus();
};

const dueInvoiceOf = (r) => db.invoices.find((i) => i.requestId === r.id && i.status === 'due');

const invoiceBadge = (i) => ({
    due: `<span class="badge badge-gold">${icon('clock', 14)}À payer</span>`,
    paid: `<span class="badge badge-green">${icon('check-circle', 14)}Payée</span>`,
    cancelled: `<span class="badge badge-neutral">${icon('x-circle', 14)}Annulée</span>`,
    refunded: `<span class="badge badge-red">${icon('arrow-left', 14)}Remboursée</span>`,
}[i.status]);

ACTIONS.viewInvoice = (el) => {
    const i = db.invoices.find((x) => x.id === el.dataset.id);
    const user = userById(i.userId);
    openDialog(`<div class="invoice">
        <div class="invoice-head">${logo()}<div><h2 class="dialog-title" id="dialog-heading">Facture ${esc(i.id)}</h2>${invoiceBadge(i)}</div></div>
        <dl class="info-list"><div><dt>Client</dt><dd>${esc(fullName(user))}</dd></div><div><dt>Date</dt><dd>${fmtDate(i.createdAt)}</dd></div>
        ${i.paidAt ? `<div><dt>Payée le</dt><dd>${fmtDate(i.paidAt)}</dd></div><div><dt>Moyen</dt><dd>${esc(PAYMENT_METHODS[i.method]?.label ?? '')}</dd></div>` : ''}
        <div><dt>Objet</dt><dd>${esc(i.label)}</dd></div></dl>
        <p class="invoice-total"><span>Total</span><strong>${money(i.amount)}</strong></p>
    </div>
    <div class="dialog-actions no-print"><button class="btn btn-ghost" type="button" data-action="printPage">${icon('printer', 18)}Imprimer ou PDF</button><button class="btn btn-primary" type="button" data-action="closeDialog">Fermer</button></div>`, { wide: true });
};
ACTIONS.printPage = () => window.print();

function notificationItem(n) {
    return `<li><a class="notif ${n.read ? '' : 'is-unread'}" href="${n.href}" data-action="openNotification" data-id="${n.id}"><span class="notif-dot" aria-hidden="true"></span><span><span class="notif-text">${esc(n.text)}${n.read ? '' : '<span class="sr-only"> (non lue)</span>'}</span><small>${fmtDateTime(n.at)}</small></span></a></li>`;
}

ACTIONS.openNotification = (el) => {
    api.markNotificationRead(el.dataset.id);
    location.hash = el.getAttribute('href');
};

ACTIONS.copyText = async (el) => {
    try {
        await navigator.clipboard.writeText(el.dataset.text);
        toast('Copié.');
    } catch {
        toast(`À copier : ${el.dataset.text}`);
    }
};

