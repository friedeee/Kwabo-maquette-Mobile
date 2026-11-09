'use strict';
/* Page de présentation : le téléphone contient la vraie application, ce script ne fait que la piloter. */
const frame = document.getElementById('app');
const send = (message) => frame.contentWindow.postMessage(message, '*');

const SCREENS = [
    ['Démarrage', [['Bienvenue et connexion', '#/connexion'], ['Inscription', '#/inscription']]],
    ['Au quotidien', [['Accueil', '#/espace'], ['Catalogue', '#/espace/services'], ['Fiche d\'un service', '#/espace/services/suivi-chantier'], ['Notifications', '#/espace/notifications']]],
    ['Demandes', [['Nouvelle demande', '#/espace/nouvelle-demande'], ['Formulaire adapté', '#/espace/nouvelle-demande?service=sante'], ['Mes demandes', '#/espace/demandes'], ['Détail d\'une demande', '#/espace/demandes/r0001']]],
    ['Suivi', [['Messages', '#/espace/messages'], ['Discussion', '#/espace/messages/r0001'], ['Documents', '#/espace/documents'], ['Paiements', '#/espace/paiements']]],
    ['Compte', [['Compte', '#/espace/compte'], ['Mon profil', '#/espace/profil'], ['Parrainage', '#/espace/parrainage']]],
];
const PUSHES = [['quote', 'Devis reçu'], ['started', 'Mission démarrée'], ['report', 'Rapport disponible'], ['done', 'Mission terminée'], ['payment', 'Paiement confirmé']];

document.getElementById('screens').innerHTML = SCREENS.map(([group, items]) => `<p>${group}</p>${items.map(([label, hash]) => `<button type="button" data-hash="${hash}">${label}</button>`).join('')}`).join('');
document.getElementById('push-buttons').innerHTML = PUSHES.map(([name, label]) => `<button class="preview-btn" type="button" data-push="${name}">${label}</button>`).join('');

document.addEventListener('click', (event) => {
    const screen = event.target.closest('[data-hash]');
    if (screen) send({ type: 'kwabo-go', hash: screen.dataset.hash });
    const push = event.target.closest('[data-push]');
    if (push) send({ type: 'kwabo-push', name: push.dataset.push });
    if (event.target.closest('#demo-login')) send({ type: 'kwabo-login' });
});

window.addEventListener('message', (event) => {
    if (event.source !== frame.contentWindow || event.data?.type !== 'kwabo-route') return;
    const current = event.data.hash.split('?')[0];
    document.querySelectorAll('[data-hash]').forEach((button) => {
        if (button.dataset.hash.split('?')[0] === current) { button.setAttribute('aria-current', 'true'); } else { button.removeAttribute('aria-current'); }
    });
    document.getElementById('demo-login').hidden = event.data.loggedIn;
});

const clock = document.getElementById('phone-clock');
const tick = () => { clock.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); };
tick();
setInterval(tick, 30000);
