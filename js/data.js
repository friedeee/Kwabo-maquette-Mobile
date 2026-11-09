'use strict';
/*
 * Contenu de la maquette, repris du cahier des charges KWABO v1.0.
 * Numéro WhatsApp, comptes, demandes et montants de démonstration sont des exemples.
 */
const WHATSAPP = '22900000000';

const CATEGORIES = [
    { id: 'immobilier', name: 'Immobilier & Foncier', short: 'Immobilier', icon: 'home-modern', blurb: 'Construire, investir et sécuriser vos terrains.' },
    { id: 'famille', name: 'Famille & Santé', short: 'Famille', icon: 'users', blurb: 'Être présent pour vos proches, même à distance.' },
    { id: 'demarches', name: 'Démarches & Administratif', short: 'Démarches', icon: 'document-text', blurb: 'Vos papiers et vos dossiers, sans vous déplacer.' },
    { id: 'logistique', name: 'Logistique & Transferts', short: 'Logistique', icon: 'truck', blurb: 'Envoyer de l\'argent, des colis et des cadeaux.' },
];

const CITIES = ['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Ouidah', 'Parakou', 'Abomey', 'Bohicon', 'Autre ville'];
const COUNTRIES = ['France', 'Belgique', 'Canada', 'États-Unis', 'Allemagne', 'Italie', 'Royaume-Uni', 'Suisse', 'Gabon', 'Côte d\'Ivoire', 'Sénégal', 'Bénin', 'Autre'];
const DIAL_CODES = ['+33', '+32', '+1', '+49', '+39', '+44', '+41', '+241', '+225', '+221', '+229'];

const SERVICES = [
    {
        id: 'suivi-chantier', cat: 'immobilier', name: 'Suivi de chantier', icon: 'building-office-2', popular: true,
        price: '120-200 €/mois', short: 'Visite hebdo, vidéo 360°, contrôle matériaux, rapport écrit.',
        included: ['Visite hebdomadaire du chantier', 'Vidéo 360° de l\'avancement', 'Contrôle des matériaux', 'Rapport écrit'],
        fields: [
            { name: 'adresse', label: 'Adresse exacte du chantier', required: true },
            { name: 'gps', label: 'Coordonnées GPS (si disponibles)', placeholder: '6.3703, 2.3912' },
            { name: 'macon', label: 'Nom et contact du maçon', placeholder: 'Nom, +229…' },
            { name: 'stade', label: 'Stade d\'avancement actuel', type: 'select', options: ['Terrain nu', 'Fondations', 'Élévation des murs', 'Toiture', 'Finitions'] },
            { name: 'visite', label: 'Préférence de visite (jour/heure)', placeholder: 'Le vendredi matin' },
        ],
    },
    {
        id: 'investissement', cat: 'immobilier', name: 'Investissement immobilier', icon: 'home-modern', popular: true,
        price: 'Dès 300 €/dossier', short: 'Recherche de biens, visite et expertise, gestion locative.',
        included: ['Recherche de biens', 'Visite et expertise', 'Gestion locative'],
        fields: [
            { name: 'bien', label: 'Type de bien recherché', type: 'select', options: ['Terrain', 'Maison', 'Appartement', 'Immeuble de rapport'] },
            { name: 'zone', label: 'Zone souhaitée', placeholder: 'Abomey-Calavi, Fidjrossè…' },
            { name: 'objectif', label: 'Objectif', type: 'select', options: ['Y habiter', 'Mettre en location', 'Revendre'] },
        ],
    },
    {
        id: 'foncier', cat: 'immobilier', name: 'Accompagnement foncier', icon: 'map-pin',
        price: 'Dès 500 €', short: 'Vérification de titre ANDF, notaire, état des lieux GPS.',
        included: ['Vérification du titre auprès de l\'ANDF', 'Accompagnement chez le notaire', 'État des lieux GPS'],
        fields: [
            { name: 'parcelle', label: 'Localisation de la parcelle', required: true },
            { name: 'titre', label: 'Numéro de titre (si disponible)' },
            { name: 'besoin', label: 'Votre besoin', type: 'select', options: ['Vérifier un titre', 'Acheter un terrain', 'Régulariser un terrain'] },
        ],
    },
    {
        id: 'soutien-famille', cat: 'famille', name: 'Soutien famille quotidien', icon: 'hand-raised',
        price: '15-45 €/mois', short: 'Factures SBEE/SONEB, recharge, courses, visite aux parents.',
        included: ['Paiement des factures SBEE et SONEB', 'Recharges téléphoniques', 'Courses', 'Visite aux parents'],
        fields: [
            { name: 'beneficiaire', label: 'Nom du proche concerné', required: true },
            { name: 'telephone', label: 'Téléphone du proche', type: 'tel' },
            { name: 'frequence', label: 'Fréquence souhaitée', type: 'select', options: ['Chaque semaine', 'Chaque mois', 'Ponctuelle'] },
        ],
    },
    {
        id: 'sante', cat: 'famille', name: 'Santé de vos proches', icon: 'heart', popular: true,
        price: 'Dès 25 €/mois', short: 'Paiement de l\'hôpital, livraison de médicaments, mutuelle.',
        included: ['Paiement de l\'hôpital', 'Livraison de médicaments', 'Mutuelle'],
        fields: [
            { name: 'patient', label: 'Nom du patient', required: true },
            { name: 'pathologie', label: 'Pathologie déclarée' },
            { name: 'etablissement', label: 'Établissement de santé' },
            { name: 'budgetMensuel', label: 'Budget mensuel alloué', placeholder: '50 €/mois' },
            { name: 'ordonnance', label: 'Ordonnance', type: 'file', accept: '.pdf,.jpg,.jpeg,.png' },
        ],
    },
    {
        id: 'evenements', cat: 'famille', name: 'Événements à distance', icon: 'calendar-days',
        price: 'Dès 300 €', short: 'Mariage, baptême, funérailles, dot, avec diffusion en direct.',
        included: ['Mariage, baptême, funérailles, dot', 'Organisation sur place', 'Diffusion en direct incluse'],
        fields: [
            { name: 'evenement', label: 'Type d\'événement', type: 'select', options: ['Mariage', 'Baptême', 'Funérailles', 'Dot', 'Autre'] },
            { name: 'dateEvenement', label: 'Date prévue', type: 'date' },
            { name: 'lieu', label: 'Lieu' },
        ],
    },
    {
        id: 'faire-venir', cat: 'demarches', name: 'Faire venir un proche', icon: 'paper-airplane', popular: true,
        price: 'Dès 200 €/dossier', short: 'Dossier visa complet, invitation, inscription école ou fac.',
        included: ['Dossier de visa complet', 'Lettre d\'invitation', 'Inscription école ou université'],
        fields: [
            { name: 'parente', label: 'Lien de parenté', required: true },
            { name: 'visa', label: 'Type de visa visé', type: 'select', options: ['Visite familiale', 'Études', 'Regroupement familial', 'Tourisme', 'Autre'] },
            { name: 'destination', label: 'Pays de destination', required: true },
            { name: 'depart', label: 'Date de départ souhaitée', type: 'date' },
            { name: 'obtenus', label: 'Documents déjà obtenus', placeholder: 'Passeport, acte de naissance…' },
        ],
    },
    {
        id: 'comptabilite', cat: 'demarches', name: 'Comptabilité & Entreprise', icon: 'briefcase', popular: true,
        price: 'Dès 80 €/mois', short: 'Création de société APIEx, tenue compta, déclarations fiscales.',
        included: ['Création de société à l\'APIEx', 'Tenue de la comptabilité', 'Déclarations fiscales'],
        fields: [
            { name: 'besoinCompta', label: 'Votre besoin', type: 'select', options: ['Créer une société', 'Tenir ma comptabilité', 'Faire mes déclarations'] },
            { name: 'activite', label: 'Secteur d\'activité' },
        ],
    },
    {
        id: 'administratif', cat: 'demarches', name: 'Assistance administrative', icon: 'identification',
        price: 'Dès 50 €/démarche', short: 'Passeport, CNI, acte de naissance, casier, immatriculation.',
        included: ['Passeport et CNI', 'Acte de naissance', 'Casier judiciaire', 'Immatriculation'],
        fields: [
            { name: 'document', label: 'Document ou démarche', type: 'select', options: ['Passeport', 'CNI', 'Acte de naissance', 'Casier judiciaire', 'Immatriculation', 'Autre'] },
            { name: 'pourQui', label: 'Pour qui ?', placeholder: 'Moi-même, mon père…' },
        ],
    },
    {
        id: 'transfert', cat: 'logistique', name: 'Transfert d\'argent optimisé', icon: 'banknotes',
        price: '2 % max', short: 'Meilleur taux garanti, Mobile Money ou banque, en moins de 24 h.',
        included: ['Meilleur taux garanti', 'Mobile Money ou banque', 'Arrivée en moins de 24 h'],
        fields: [
            { name: 'montant', label: 'Montant à envoyer (€)', type: 'number', required: true },
            { name: 'reception', label: 'Mode de réception', type: 'select', options: ['Mobile Money', 'Compte bancaire'] },
            { name: 'beneficiaireTransfert', label: 'Bénéficiaire', required: true },
        ],
    },
    {
        id: 'fret', cat: 'logistique', name: 'Fret Europe → Bénin', icon: 'truck', popular: true,
        price: 'Dès 3 €/kg', short: 'Groupage mensuel maritime ou aérien, dédouanement.',
        included: ['Groupage mensuel', 'Maritime ou aérien', 'Dédouanement'],
        fields: [
            { name: 'villeEnvoi', label: 'Ville d\'envoi en Europe', required: true },
            { name: 'nature', label: 'Nature des colis' },
            { name: 'poids', label: 'Poids estimé (kg)', type: 'number' },
            { name: 'mode', label: 'Préférence', type: 'select', options: ['Maritime', 'Aérien'] },
            { name: 'destinataire', label: 'Destinataire au Bénin' },
        ],
    },
    {
        id: 'cadeaux', cat: 'logistique', name: 'Cadeaux & produits locaux', icon: 'gift',
        price: '+30 €/envoi', short: 'Sodabi, wax, karité, bijoux, envoi DHL international.',
        included: ['Sodabi, wax, karité, bijoux', 'Envoi DHL international'],
        fields: [
            { name: 'produits', label: 'Produits souhaités', required: true },
            { name: 'paysEnvoi', label: 'Pays de livraison' },
        ],
    },
];

const TAGS = ['Suivi de chantier', 'Titre foncier', 'Gestion locative', 'Payer l\'hôpital', 'Dossier visa', 'Lettre d\'invitation', 'Création de société', 'Comptabilité', 'Acte de naissance', 'Casier judiciaire', 'Transfert d\'argent', 'Fret maritime', 'Sodabi', 'Wax', 'Mariage à distance', 'Funérailles', 'Factures SBEE'];

const FAQ = [
    { q: 'Comment savoir que le travail est vraiment fait ?', a: 'Chaque intervention est documentée dans votre espace : vidéos, photos, reçus scannés pour chaque dépense, rapport écrit et contrat de mission signé.' },
    { q: 'La création du compte est-elle payante ?', a: 'Non. Le compte est gratuit et sans engagement. Vous recevez un devis avant toute mission, et vous ne payez qu\'après l\'avoir accepté.' },
    { q: 'En combien de temps ai-je une réponse ?', a: 'Notre équipe vous répond sous 12 h avec un devis clair. Vous suivez ensuite tout depuis votre espace client.' },
    { q: 'Comment puis-je payer ?', a: 'Par carte bancaire, par Mobile Money (MTN, Moov, Orange Money) ou par Wise. KWABO ne conserve aucune donnée de carte bancaire.' },
    { q: 'Puis-je parler directement à quelqu\'un ?', a: 'Oui. WhatsApp est accessible en un clic depuis toutes les pages, et chaque demande a son propre fil de discussion avec l\'équipe.' },
    { q: 'Où êtes-vous basés ?', a: 'Notre équipe terrain est à Cotonou, au Bénin. Elle accompagne les Béninois de la diaspora, où qu\'ils vivent.' },
];

const STATUS = {
    pending: { label: 'En attente', tone: 'gold', icon: 'clock' },
    active: { label: 'En cours', tone: 'green', icon: 'bolt' },
    done: { label: 'Terminée', tone: 'neutral', icon: 'check-circle' },
    cancelled: { label: 'Annulée', tone: 'red', icon: 'x-circle' },
};

const DOC_TYPES = {
    report: { label: 'Rapport', icon: 'document-text' },
    photo: { label: 'Photo', icon: 'photo' },
    video: { label: 'Vidéo', icon: 'video-camera' },
    receipt: { label: 'Reçu', icon: 'receipt-percent' },
    contract: { label: 'Contrat', icon: 'document-check' },
};

const PAYMENT_METHODS = {
    card: { label: 'Carte bancaire', via: 'Stripe', icon: 'credit-card' },
    momo: { label: 'Mobile Money', via: 'MTN, Moov, Orange Money', icon: 'phone' },
    wise: { label: 'Virement Wise', via: 'Meilleur taux EUR → FCFA', icon: 'globe-alt' },
};

const NOTIFICATION_PREFS = [
    { key: 'received', label: 'Demande reçue' },
    { key: 'quote', label: 'Devis envoyé' },
    { key: 'started', label: 'Démarrage de la mission' },
    { key: 'report', label: 'Rapport hebdomadaire disponible' },
    { key: 'done', label: 'Mission terminée' },
    { key: 'payment', label: 'Paiement confirmé ou échoué' },
];
