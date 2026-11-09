'use strict';
/*
 * Faux serveur de la maquette : tout est gardé dans le navigateur (localStorage).
 * Ce fichier est le seul à remplacer par de vrais appels à l'API le moment venu.
 */
const DB_KEY = 'kwabo-maquette-db';
const DB_VERSION = 2;
/* Chaque interface a sa propre session : on peut être client sur l'application et admin sur le back-office. */
const APP = document.documentElement.dataset.app ?? 'web';
const SESSION_KEY = `kwabo-maquette-session-${APP}`;

/* Pas une vraie protection : évite seulement de garder le mot de passe en clair pendant la démo. */
function demoHash(text) {
    let h = 5381;
    for (const c of String(text)) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
    return `demo-${h.toString(36)}`;
}

const hoursAgo = (n) => new Date(Date.now() - n * 3600000).toISOString();
const daysAgo = (n) => hoursAgo(n * 24);

function seedDb() {
    const prefs = Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.key, true]));
    const person = (id, role, firstName, lastName, email, country, phone, extra = {}) => ({
        id, role, firstName, lastName, email, country, phone,
        password: demoHash('Demo1234'), verified: true, twoFactor: false, prefs: { ...prefs },
        referralCode: `KW-${firstName.toUpperCase().slice(0, 4)}${id.slice(-2)}`, createdAt: daysAgo(90), ...extra,
    });
    const users = [
        person('u01', 'USER', 'Aïcha', 'Sossa', 'client@kwabo.demo', 'France', '+33 6 12 34 56 78'),
        person('u02', 'USER', 'Romuald', 'Agbo', 'romuald@exemple.com', 'Belgique', '+32 470 12 34 56', { createdAt: daysAgo(40) }),
        person('u03', 'USER', 'Clarisse', 'Houngbo', 'clarisse@exemple.com', 'Canada', '+1 514 555 0147', { createdAt: daysAgo(12) }),
        person('u04', 'USER', 'Edwige', 'Tossou', 'edwige@exemple.com', 'France', '+33 7 22 33 44 55', { createdAt: daysAgo(170) }),
        person('u05', 'USER', 'Fabrice', 'Akpovi', 'fabrice@exemple.com', 'États-Unis', '+1 202 555 0183', { createdAt: daysAgo(150) }),
        person('u06', 'USER', 'Gisèle', 'Ahouansou', 'gisele@exemple.com', 'Allemagne', '+49 170 555 0192', { createdAt: daysAgo(120) }),
        person('u07', 'USER', 'Hervé', 'Gbaguidi', 'herve@exemple.com', 'Suisse', '+41 79 555 01 74', { createdAt: daysAgo(75) }),
        person('u08', 'USER', 'Inès', 'Dossa', 'ines@exemple.com', 'Gabon', '+241 06 55 01 23', { createdAt: daysAgo(25) }),
        person('u09', 'USER', 'Jules', 'Zinsou', 'jules@exemple.com', 'Canada', '+1 438 555 0166', { createdAt: daysAgo(2), verified: false }),
        person('u10', 'ADMIN', 'Équipe', 'KWABO', 'admin@kwabo.demo', 'Bénin', '+229 01 00 00 00 00'),
        person('u11', 'OPERATOR', 'Maxime', 'Dossou', 'agent@kwabo.demo', 'Bénin', '+229 01 00 00 00 01'),
        person('u12', 'OPERATOR', 'Sènan', 'Kpadé', 'senan@kwabo.demo', 'Bénin', '+229 01 00 00 00 02'),
    ];
    const request = (id, userId, serviceId, status, title, city, age, extra = {}) => ({
        id, tracking: `KW-2026-${id.slice(-4)}`, userId, serviceId, status, title, city,
        urgency: 'normal', budget: '', description: '', details: {}, operatorId: null, quote: null, rating: null,
        createdAt: daysAgo(age), history: [{ at: daysAgo(age), text: 'Demande reçue' }], ...extra,
    });
    const requests = [
        request('r0001', 'u01', 'suivi-chantier', 'active', 'Suivi de ma villa à Abomey-Calavi', 'Abomey-Calavi', 30, {
            budget: '160 €/mois', description: 'Construction d\'une villa en cours. Je veux une visite chaque semaine et un contrôle des matériaux livrés.',
            details: { adresse: 'Quartier Tankpè, von face école', macon: 'M. Zannou, +229 01 00 00 00 10', stade: 'Élévation des murs', visite: 'Le vendredi matin' },
            operatorId: 'u11', quote: { amount: 160, label: 'Suivi de chantier, 1 mois' },
            history: [{ at: daysAgo(30), text: 'Demande reçue' }, { at: daysAgo(29), text: 'Devis envoyé : 160 €' }, { at: daysAgo(28), text: 'Mission démarrée après paiement' }, { at: daysAgo(3), text: 'Rapport hebdomadaire disponible' }],
        }),
        request('r0002', 'u01', 'sante', 'pending', 'Médicaments de ma mère', 'Cotonou', 1, {
            urgency: 'urgent', budget: '50 €/mois', description: 'Ma mère a besoin de son traitement chaque mois, livré à domicile.',
            details: { patient: 'Mme Sossa', etablissement: 'CNHU de Cotonou' },
            quote: { amount: 45, label: 'Santé de vos proches, 1 mois' },
            history: [{ at: daysAgo(1), text: 'Demande reçue' }, { at: hoursAgo(5), text: 'Devis envoyé : 45 €' }],
        }),
        request('r0003', 'u01', 'administratif', 'done', 'Acte de naissance de mon fils', 'Porto-Novo', 70, {
            budget: '60 €', description: 'Obtenir une copie intégrale de l\'acte de naissance.', details: { document: 'Acte de naissance', pourQui: 'Mon fils' },
            operatorId: 'u12', quote: { amount: 55, label: 'Assistance administrative' },
            history: [{ at: daysAgo(70), text: 'Demande reçue' }, { at: daysAgo(69), text: 'Devis envoyé : 55 €' }, { at: daysAgo(68), text: 'Mission démarrée après paiement' }, { at: daysAgo(60), text: 'Mission terminée' }],
        }),
        request('r0004', 'u02', 'fret', 'pending', 'Colis de Bruxelles vers Cotonou', 'Cotonou', 0.2, {
            description: 'Deux cartons de vêtements et du petit électroménager.', details: { villeEnvoi: 'Bruxelles', poids: '45', mode: 'Maritime' },
        }),
        request('r0005', 'u03', 'faire-venir', 'active', 'Visa études pour ma nièce', 'Parakou', 12, {
            budget: '300 €', description: 'Dossier de visa études vers le Canada.', details: { parente: 'Nièce', visa: 'Études', destination: 'Canada' },
            operatorId: 'u12', quote: { amount: 250, label: 'Faire venir un proche' },
            history: [{ at: daysAgo(12), text: 'Demande reçue' }, { at: daysAgo(11), text: 'Devis envoyé : 250 €' }, { at: daysAgo(10), text: 'Mission démarrée après paiement' }],
        }),
        ...[
            ['r0006', 'u04', 'foncier', 'done', 'Vérification du titre à Ouidah', 'Ouidah', 160, 'u12', 500, 4],
            ['r0007', 'u05', 'transfert', 'done', 'Transfert pour les travaux de mes parents', 'Cotonou', 130, 'u11', 90, 5],
            ['r0008', 'u06', 'evenements', 'done', 'Funérailles de ma tante', 'Abomey', 100, 'u11', 650, 5],
            ['r0009', 'u04', 'suivi-chantier', 'active', 'Suivi de la maison de Fidjrossè', 'Cotonou', 95, 'u11', 180, null],
            ['r0010', 'u07', 'comptabilite', 'active', 'Création de ma société à Cotonou', 'Cotonou', 60, 'u12', 320, null],
            ['r0011', 'u06', 'soutien-famille', 'active', 'Factures et visites à mes parents', 'Bohicon', 45, 'u11', 45, null],
            ['r0012', 'u05', 'cadeaux', 'done', 'Sodabi et wax pour un mariage', 'Cotonou', 35, 'u12', 120, 2],
            ['r0013', 'u08', 'investissement', 'pending', 'Recherche d\'un terrain à Calavi', 'Abomey-Calavi', 3, null, null, null],
            ['r0014', 'u07', 'fret', 'pending', 'Colis de Genève vers Cotonou', 'Cotonou', 1.5, null, null, null],
            ['r0015', 'u08', 'administratif', 'cancelled', 'Casier judiciaire', 'Porto-Novo', 20, null, null, null],
        ].map(([id, userId, serviceId, status, title, city, age, operatorId, amount, rating]) => request(id, userId, serviceId, status, title, city, age, {
            operatorId, rating, urgency: id === 'r0014' ? 'urgent' : 'normal',
            description: 'Demande de démonstration.', quote: amount ? { amount, label: SERVICES.find((s) => s.id === serviceId).name } : null,
        })),
    ];
    const doc = (id, requestId, type, name, age) => ({ id, requestId, type, name, createdAt: daysAgo(age) });
    return {
        users,
        requests,
        version: DB_VERSION,
        nextRequest: 16,
        documents: [
            doc('d1', 'r0001', 'contract', 'Contrat de mission signé.pdf', 28),
            doc('d2', 'r0001', 'report', 'Rapport semaine 3.pdf', 10),
            doc('d3', 'r0001', 'report', 'Rapport semaine 4.pdf', 3),
            doc('d4', 'r0001', 'video', 'Vidéo 360° du chantier.mp4', 3),
            doc('d5', 'r0001', 'photo', 'Livraison de ciment.jpg', 4),
            doc('d6', 'r0001', 'receipt', 'Reçu ciment et fer.pdf', 4),
            doc('d7', 'r0003', 'contract', 'Contrat de mission signé.pdf', 68),
            doc('d8', 'r0003', 'receipt', 'Reçu mairie de Porto-Novo.pdf', 62),
            doc('d9', 'r0005', 'contract', 'Contrat de mission signé.pdf', 10),
        ],
        messages: [
            { id: 'm1', requestId: 'r0001', from: 'team', author: 'Équipe KWABO', text: 'Bonjour Aïcha, le rapport de la semaine est disponible dans vos documents.', at: hoursAgo(72), read: true },
            { id: 'm2', requestId: 'r0001', from: 'client', author: 'Aïcha Sossa', text: 'Merci. Le ciment livré correspond bien à ce qui était prévu ?', at: hoursAgo(50), read: true },
            { id: 'm3', requestId: 'r0001', from: 'team', author: 'Maxime Dossou', text: 'Oui, nous avons vérifié la livraison. Le reçu et la photo sont dans vos documents.', at: hoursAgo(48), read: false },
            { id: 'm4', requestId: 'r0002', from: 'team', author: 'Équipe KWABO', text: 'Votre devis est prêt. Dès le paiement reçu, nous organisons la première livraison.', at: hoursAgo(5), read: false },
            { id: 'm5', requestId: 'r0004', from: 'client', author: 'Romuald Agbo', text: 'Quelle est la date du prochain groupage maritime ?', at: hoursAgo(4), read: false },
        ],
        invoices: [
            { id: 'F-2026-0041', requestId: 'r0003', userId: 'u01', label: 'Assistance administrative', amount: 55, status: 'paid', method: 'card', createdAt: daysAgo(69), paidAt: daysAgo(68) },
            { id: 'F-2026-0042', requestId: 'r0001', userId: 'u01', label: 'Suivi de chantier, 1 mois', amount: 160, status: 'paid', method: 'wise', createdAt: daysAgo(29), paidAt: daysAgo(28) },
            { id: 'F-2026-0051', requestId: 'r0005', userId: 'u03', label: 'Faire venir un proche', amount: 250, status: 'paid', method: 'momo', createdAt: daysAgo(11), paidAt: daysAgo(10) },
            { id: 'F-2026-0058', requestId: 'r0002', userId: 'u01', label: 'Santé de vos proches, 1 mois', amount: 45, status: 'due', method: null, createdAt: hoursAgo(5), paidAt: null },
            ...[
                ['F-2026-0011', 'r0006', 'u04', 'Accompagnement foncier', 500, 'wise', 158],
                ['F-2026-0017', 'r0007', 'u05', 'Transfert d\'argent optimisé', 90, 'card', 128],
                ['F-2026-0021', 'r0009', 'u04', 'Suivi de chantier, 1 mois', 180, 'card', 92],
                ['F-2026-0023', 'r0008', 'u06', 'Événements à distance', 650, 'card', 98],
                ['F-2026-0031', 'r0009', 'u04', 'Suivi de chantier, 1 mois', 180, 'card', 62],
                ['F-2026-0033', 'r0010', 'u07', 'Comptabilité & Entreprise', 320, 'momo', 58],
                ['F-2026-0037', 'r0011', 'u06', 'Soutien famille, 1 mois', 45, 'momo', 44],
                ['F-2026-0039', 'r0012', 'u05', 'Cadeaux & produits locaux', 120, 'card', 33],
                ['F-2026-0045', 'r0009', 'u04', 'Suivi de chantier, 1 mois', 180, 'card', 30],
                ['F-2026-0049', 'r0011', 'u06', 'Soutien famille, 1 mois', 45, 'momo', 14],
                ['F-2026-0055', 'r0009', 'u04', 'Suivi de chantier, 1 mois', 180, 'card', 2],
                ['F-2026-0056', 'r0010', 'u07', 'Comptabilité & Entreprise', 80, 'wise', 1],
            ].map(([id, requestId, userId, label, amount, method, age]) => ({ id, requestId, userId, label, amount, status: 'paid', method, createdAt: daysAgo(age + 1), paidAt: daysAgo(age) })),
        ],
        reviews: [
            { id: 'a1', requestId: 'r0006', userId: 'u04', rating: 4, comment: 'Titre vérifié rapidement, le rapport était très clair.', status: 'published', at: daysAgo(120) },
            { id: 'a2', requestId: 'r0007', userId: 'u05', rating: 5, comment: 'Argent arrivé en moins de 24 h, sans surprise.', status: 'published', at: daysAgo(125) },
            { id: 'a3', requestId: 'r0008', userId: 'u06', rating: 5, comment: 'Grâce à la diffusion en direct, j\'ai pu suivre toute la cérémonie.', status: 'pending', at: daysAgo(6) },
            { id: 'a4', requestId: 'r0012', userId: 'u05', rating: 2, comment: 'Colis arrivé avec une semaine de retard, et personne pour me prévenir.', status: 'pending', at: daysAgo(4) },
        ],
        audit: [
            { id: 'j1', at: daysAgo(4), actor: 'Équipe KWABO', text: 'Avis reçu sur « Sodabi et wax pour un mariage »' },
            { id: 'j2', at: daysAgo(10), actor: 'Équipe KWABO', text: 'Mission démarrée : « Visa études pour ma nièce »' },
            { id: 'j3', at: daysAgo(12), actor: 'Équipe KWABO', text: 'Attribution de « Visa études pour ma nièce » à Sènan Kpadé' },
        ],
        serviceOverrides: {},
        notifications: [
            { id: 'n1', userId: 'u01', text: 'Devis reçu pour « Médicaments de ma mère » : 45 €', href: '#/espace/demandes/r0002', at: hoursAgo(5), read: false },
            { id: 'n2', userId: 'u01', text: 'Rapport hebdomadaire disponible pour « Suivi de ma villa à Abomey-Calavi »', href: '#/espace/demandes/r0001', at: daysAgo(3), read: false },
            { id: 'n3', userId: 'u01', text: 'Mission terminée : « Acte de naissance de mon fils »', href: '#/espace/demandes/r0003', at: daysAgo(60), read: true },
            { id: 'n4', userId: 'team', text: 'Nouvelle demande urgente : « Colis de Genève vers Cotonou »', href: '#/demandes/r0014', at: daysAgo(1.5), read: false },
            { id: 'n5', userId: 'team', text: 'Nouvelle demande : « Recherche d\'un terrain à Calavi »', href: '#/demandes/r0013', at: daysAgo(3), read: false },
            { id: 'n6', userId: 'team', text: 'Message de Romuald Agbo sur « Colis de Bruxelles vers Cotonou »', href: '#/demandes/r0004', at: hoursAgo(4), read: false },
            { id: 'n7', userId: 'u11', text: 'Rapport attendu cette semaine : « Suivi de ma villa à Abomey-Calavi »', href: '#/demandes/r0001', at: hoursAgo(20), read: false },
        ],
        savedMethods: { u01: [{ type: 'card', label: 'Visa se terminant par 4242' }] },
        referrals: { u01: [{ name: 'Romuald A.', status: 'Actif', at: daysAgo(40) }, { name: 'Clarisse H.', status: 'Inscrite', at: daysAgo(12) }], u04: [{ name: 'Gisèle A.', status: 'Actif', at: daysAgo(120) }, { name: 'Hervé G.', status: 'Actif', at: daysAgo(75) }] },
    };
}

const store = {
    read(area, key, fallback = null) {
        try { return JSON.parse(area.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    write(area, key, value) {
        try { area.setItem(key, JSON.stringify(value)); } catch { /* la maquette fonctionne aussi sans stockage */ }
    },
};

const save = () => store.write(localStorage, DB_KEY, db);
const BASE_PRICES = Object.fromEntries(SERVICES.map((s) => [s.id, s.price]));

/* Le catalogue modifié dans l'administration s'applique au site et à l'application. */
function applyServiceOverrides() {
    SERVICES.forEach((s) => {
        const change = db.serviceOverrides?.[s.id] ?? {};
        s.price = change.price ?? BASE_PRICES[s.id];
        s.available = change.available !== false;
    });
}

function loadDb() {
    const stored = store.read(localStorage, DB_KEY);
    return stored?.version === DB_VERSION ? stored : null;
}

let db = loadDb();
if (!db) { db = seedDb(); save(); }
applyServiceOverrides();

/* Une autre interface ouverte a changé les données (admin, application, site). */
window.addEventListener('storage', (event) => {
    if (event.key !== DB_KEY) return;
    db = loadDb() ?? seedDb();
    applyServiceOverrides();
    window.dispatchEvent(new CustomEvent('kwabo:data'));
});

const uid = (prefix) => `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
const fullName = (u) => `${u.firstName} ${u.lastName}`;
const serviceById = (id) => SERVICES.find((s) => s.id === id);
const userById = (id) => db.users.find((u) => u.id === id);
const requestById = (id) => db.requests.find((r) => r.id === id);

class ApiError extends Error {
    constructor(message, field = null) { super(message); this.field = field; }
}

function notify(userId, text, href) {
    db.notifications.unshift({ id: uid('n'), userId, text, href, at: new Date().toISOString(), read: false });
}

function log(request, text) {
    request.history.push({ at: new Date().toISOString(), text });
}

/* ---------- Session ---------- */
const session = {
    get userId() { return store.read(localStorage, SESSION_KEY) ?? store.read(sessionStorage, SESSION_KEY); },
    open(userId, remember) { store.write(remember ? localStorage : sessionStorage, SESSION_KEY, userId); },
    close() {
        try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch { /* rien à faire */ }
    },
};
/* Un compte suspendu perd l'accès tout de suite. */
const currentUser = () => {
    const user = session.userId ? userById(session.userId) : null;
    return user && !user.suspended ? user : null;
};

function audit(text) {
    const actor = currentUser();
    db.audit.unshift({ id: uid('j'), at: new Date().toISOString(), actor: actor ? fullName(actor) : 'Système', text });
}

/* ---------- API de démonstration ---------- */
const api = {
    register({ firstName, lastName, email, dial, phone, country, password, sponsorCode = '' }) {
        const address = email.trim().toLowerCase();
        if (db.users.some((u) => u.email === address)) throw new ApiError('Cet e-mail est déjà utilisé.', 'email');
        const code = sponsorCode.trim().toUpperCase();
        const sponsor = code ? db.users.find((u) => u.referralCode === code) : null;
        if (code && !sponsor) throw new ApiError('Ce code de parrainage n\'existe pas.', 'sponsorCode');
        if (sponsor) {
            (db.referrals[sponsor.id] ??= []).push({ name: `${firstName.trim()} ${lastName.trim()[0]?.toUpperCase() ?? ''}.`, status: 'Inscrit', at: new Date().toISOString() });
        }
        const user = {
            id: uid('u'), role: 'USER', firstName: firstName.trim(), lastName: lastName.trim(), email: address, country,
            phone: `${dial} ${phone.trim()}`, password: demoHash(password), verified: false, twoFactor: false,
            prefs: Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.key, true])),
            referralCode: `KW-${firstName.trim().toUpperCase().slice(0, 4)}${String(db.users.length).padStart(2, '0')}`, createdAt: new Date().toISOString(),
        };
        db.users.push(user);
        save();
        return user;
    },
    verifyEmail(email) {
        const user = db.users.find((u) => u.email === email);
        if (user) { user.verified = true; save(); }
        return user;
    },
    login({ email, password, remember, code }) {
        const user = db.users.find((u) => u.email === email.trim().toLowerCase());
        if (!user || user.password !== demoHash(password)) throw new ApiError('E-mail ou mot de passe incorrect.', 'email');
        if (user.suspended) throw new ApiError('Ce compte est suspendu. Contactez KWABO.', 'email');
        if (APP === 'admin' && user.role === 'USER') throw new ApiError('Cet accès est réservé à l\'équipe KWABO.', 'email');
        if (APP !== 'admin' && user.role !== 'USER') throw new ApiError('Compte équipe : connectez-vous sur l\'interface d\'administration.', 'email');
        if (!user.verified) throw new ApiError('Confirmez d\'abord votre e-mail avec le lien reçu.', 'email');
        if (user.twoFactor && code === undefined) return { needsCode: true };
        if (user.twoFactor && code !== '123456') throw new ApiError('Code incorrect.', 'code');
        session.open(user.id, remember);
        return { user };
    },
    logout: () => session.close(),
    resetPassword(email, password) {
        const user = db.users.find((u) => u.email === email);
        if (!user) throw new ApiError('Ce lien n\'est plus valable.');
        user.password = demoHash(password);
        save();
    },
    updateProfile(user, fields) { Object.assign(user, fields); save(); },
    changePassword(user, current, next) {
        if (user.password !== demoHash(current)) throw new ApiError('Mot de passe actuel incorrect.', 'current');
        user.password = demoHash(next);
        save();
    },
    deleteAccount(user) {
        this.eraseUser(user);
        session.close();
    },
    /* Droit à l'effacement : retire le compte et toutes les données associées. */
    eraseUser(user) {
        const ids = db.requests.filter((r) => r.userId === user.id).map((r) => r.id);
        db.requests = db.requests.filter((r) => r.userId !== user.id);
        db.documents = db.documents.filter((d) => !ids.includes(d.requestId));
        db.messages = db.messages.filter((m) => !ids.includes(m.requestId));
        db.invoices = db.invoices.filter((i) => i.userId !== user.id);
        db.notifications = db.notifications.filter((n) => n.userId !== user.id);
        db.reviews = db.reviews.filter((a) => a.userId !== user.id);
        delete db.referrals[user.id];
        delete db.savedMethods[user.id];
        db.users = db.users.filter((u) => u.id !== user.id);
        save();
    },

    requestsOf: (user) => db.requests.filter((r) => r.userId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    createRequest(user, payload) {
        const number = String(db.nextRequest++).padStart(4, '0');
        const request = {
            id: `r${number}`, tracking: `KW-2026-${number}`, userId: user.id, status: 'pending', operatorId: null, quote: null, rating: null,
            createdAt: new Date().toISOString(), history: [{ at: new Date().toISOString(), text: 'Demande reçue' }], ...payload,
        };
        db.requests.push(request);
        notify(user.id, `Demande reçue : « ${request.title} ». Numéro de suivi ${request.tracking}.`, `#/espace/demandes/${request.id}`);
        notify('team', `${request.urgency === 'urgent' ? 'Nouvelle demande urgente' : 'Nouvelle demande'} : « ${request.title} »`, `#/demandes/${request.id}`);
        save();
        return request;
    },
    cancelRequest(request) {
        request.status = 'cancelled';
        log(request, 'Demande annulée par le client');
        db.invoices.filter((i) => i.requestId === request.id && i.status === 'due').forEach((i) => { i.status = 'cancelled'; });
        save();
    },
    rateRequest(request, rating, comment) {
        request.rating = rating;
        log(request, `Note du client : ${rating}/5`);
        const review = db.reviews.find((a) => a.requestId === request.id);
        if (review) {
            review.rating = rating;
            if (comment !== undefined) review.comment = comment;
            review.status = 'pending';
        } else {
            db.reviews.unshift({ id: uid('a'), requestId: request.id, userId: request.userId, rating, comment: comment ?? '', status: 'pending', at: new Date().toISOString() });
            notify('team', `Avis à modérer : « ${request.title} » (${rating}/5)`, '#/avis');
        }
        save();
    },

    messagesOf: (requestId) => db.messages.filter((m) => m.requestId === requestId),
    sendMessage(request, user, text, attachment) {
        const isClient = user.role === 'USER';
        db.messages.push({ id: uid('m'), requestId: request.id, from: isClient ? 'client' : 'team', author: fullName(user), text, attachment: attachment || null, at: new Date().toISOString(), read: false });
        if (!isClient) notify(request.userId, `Nouveau message sur « ${request.title} »`, `#/espace/demandes/${request.id}`);
        if (isClient) {
            notify('team', `Message de ${fullName(user)} sur « ${request.title} »`, `#/demandes/${request.id}`);
            if (request.operatorId) notify(request.operatorId, `Message de ${fullName(user)} sur « ${request.title} »`, `#/demandes/${request.id}`);
        }
        save();
    },
    /* Messages reçus non lus, côté client ou côté équipe. */
    markThreadRead(requestId, side) {
        db.messages.filter((m) => m.requestId === requestId && m.from !== side).forEach((m) => { m.read = true; });
        save();
    },
    unreadMessages(user) {
        const side = user.role === 'USER' ? 'client' : 'team';
        const allowed = this.visibleRequests(user).map((r) => r.id);
        return db.messages.filter((m) => allowed.includes(m.requestId) && m.from !== side && !m.read).length;
    },
    visibleRequests(user) {
        if (user.role === 'USER') return this.requestsOf(user);
        const list = user.role === 'OPERATOR' ? db.requests.filter((r) => r.operatorId === user.id) : db.requests;
        return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    documentsOf: (requestId) => db.documents.filter((d) => d.requestId === requestId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    addDocument(request, type, name) {
        db.documents.push({ id: uid('d'), requestId: request.id, type, name, createdAt: new Date().toISOString() });
        audit(`Document ajouté à « ${request.title} » : ${name}`);
        if (type === 'report') {
            log(request, 'Rapport hebdomadaire disponible');
            notify(request.userId, `Rapport hebdomadaire disponible pour « ${request.title} »`, `#/espace/demandes/${request.id}`);
        }
        save();
    },

    notificationsOf: (user) => db.notifications.filter((n) => n.userId === user.id || (user.role === 'ADMIN' && n.userId === 'team')).sort((a, b) => new Date(b.at) - new Date(a.at)),
    markNotificationRead(id) {
        const n = db.notifications.find((x) => x.id === id);
        if (n) { n.read = true; save(); }
    },
    markAllRead(user) {
        this.notificationsOf(user).forEach((n) => { n.read = true; });
        save();
    },

    invoicesOf: (user) => db.invoices.filter((i) => i.userId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    payInvoice(invoiceId, method) {
        const invoice = db.invoices.find((i) => i.id === invoiceId);
        invoice.status = 'paid';
        invoice.method = method;
        invoice.paidAt = new Date().toISOString();
        const request = requestById(invoice.requestId);
        notify(invoice.userId, `Paiement confirmé : ${invoice.amount} € pour « ${request.title} »`, `#/espace/paiements`);
        if (request.status === 'pending') {
            request.status = 'active';
            log(request, 'Mission démarrée après paiement');
            notify(invoice.userId, `Votre mission « ${request.title} » a démarré.`, `#/espace/demandes/${request.id}`);
        }
        save();
    },
    methodsOf: (user) => db.savedMethods[user.id] ?? [],
    removeMethod(user, index) { (db.savedMethods[user.id] ?? []).splice(index, 1); save(); },
    referralsOf: (user) => db.referrals[user.id] ?? [],

    /* Back-office */
    setStatus(request, status) {
        request.status = status;
        log(request, `Statut : ${STATUS[status].label}`);
        audit(`Statut de « ${request.title} » : ${STATUS[status].label}`);
        if (status === 'cancelled') {
            db.invoices.filter((i) => i.requestId === request.id && i.status === 'due').forEach((i) => { i.status = 'cancelled'; });
        }
        if (status === 'done') notify(request.userId, `Mission terminée : « ${request.title} »`, `#/espace/demandes/${request.id}`);
        if (status === 'active') notify(request.userId, `Votre mission « ${request.title} » a démarré.`, `#/espace/demandes/${request.id}`);
        save();
    },
    assign(request, operatorId) {
        request.operatorId = operatorId || null;
        log(request, operatorId ? `Attribuée à ${fullName(userById(operatorId))}` : 'Attribution retirée');
        audit(operatorId ? `Attribution de « ${request.title} » à ${fullName(userById(operatorId))}` : `Attribution retirée sur « ${request.title} »`);
        if (operatorId) notify(operatorId, `Nouvelle mission : « ${request.title} »`, `#/demandes/${request.id}`);
        save();
    },
    sendQuote(request, amount, label) {
        request.quote = { amount, label };
        log(request, `Devis envoyé : ${amount} €`);
        audit(`Devis de ${amount} € envoyé pour « ${request.title} »`);
        db.invoices.filter((i) => i.requestId === request.id && i.status === 'due').forEach((i) => { i.status = 'cancelled'; });
        db.invoices.push({ id: `F-2026-${String(100 + db.invoices.length).padStart(4, '0')}`, requestId: request.id, userId: request.userId, label, amount, status: 'due', method: null, createdAt: new Date().toISOString(), paidAt: null });
        notify(request.userId, `Devis reçu pour « ${request.title} » : ${amount} €`, `#/espace/demandes/${request.id}`);
        save();
    },
    clients: () => db.users.filter((u) => u.role === 'USER'),
    operators: () => db.users.filter((u) => u.role === 'OPERATOR'),
    allInvoices: () => [...db.invoices].sort((a, b) => new Date(b.paidAt ?? b.createdAt) - new Date(a.paidAt ?? a.createdAt)),
    refundInvoice(invoice) {
        invoice.status = 'refunded';
        audit(`Remboursement de ${invoice.amount} € : facture ${invoice.id}`);
        notify(invoice.userId, `Remboursement de ${invoice.amount} € pour « ${invoice.label} »`, '#/espace/paiements');
        save();
    },
    addNote(request, user, text) {
        (request.notes ??= []).unshift({ at: new Date().toISOString(), author: fullName(user), text });
        save();
    },
    setSuspended(user, suspended) {
        user.suspended = suspended;
        audit(`Compte ${suspended ? 'suspendu' : 'réactivé'} : ${fullName(user)}`);
        save();
    },
    addOperator({ firstName, lastName, email, phone }) {
        const address = email.trim().toLowerCase();
        if (db.users.some((u) => u.email === address)) throw new ApiError('Cet e-mail est déjà utilisé.', 'opEmail');
        const user = {
            id: uid('u'), role: 'OPERATOR', firstName: firstName.trim(), lastName: lastName.trim(), email: address, country: 'Bénin', phone: phone.trim(),
            password: demoHash('Demo1234'), verified: true, twoFactor: false, prefs: {}, referralCode: '', createdAt: new Date().toISOString(),
        };
        db.users.push(user);
        audit(`Agent terrain ajouté : ${fullName(user)}`);
        save();
        return user;
    },
    setService(id, change) {
        db.serviceOverrides[id] = { ...db.serviceOverrides[id], ...change };
        applyServiceOverrides();
        const service = serviceById(id);
        audit(`Catalogue : ${service.name}, ${service.available ? 'disponible' : 'indisponible'}, ${service.price}`);
        save();
    },
    moderateReview(review, status) {
        review.status = status;
        const request = requestById(review.requestId);
        audit(`Avis ${status === 'published' ? 'publié' : 'masqué'} sur « ${request?.title ?? ''} »`);
        save();
    },
};

function resetDemo() {
    try { localStorage.removeItem(DB_KEY); } catch { /* rien à faire */ }
    session.close();
    db = seedDb();
    save();
    applyServiceOverrides();
}
