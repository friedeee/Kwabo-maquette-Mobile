'use strict';
/* Photos libres de droits (Wikimedia Commons) : auteur, licence et source. */
const PHOTO_CREDITS = [
 {
  "file": "cotonou",
  "title": "Vue panoramique quartier cadjéhoun-Cotonou au Bénin 1",
  "author": "Adoscam",
  "license": "CC BY-SA 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:Vue_panoramique_quartier_cadj%C3%A9houn-Cotonou_au_B%C3%A9nin_1.jpg"
 },
 {
  "file": "ganvie",
  "title": "The village of Ganvié on Lake Nokoué",
  "author": "Dr. Ondřej Havelka (cestovatel)",
  "license": "CC BY-SA 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:The_village_of_Ganvi%C3%A9_on_Lake_Nokou%C3%A9.jpg"
 },
 {
  "file": "ouidah-porte",
  "title": "Rénovation de la porte du non retour 01",
  "author": "Step may",
  "license": "CC0",
  "source": "https://commons.wikimedia.org/wiki/File:R%C3%A9novation_de_la_porte_du_non_retour_01.jpg"
 },
 {
  "file": "dantokpa",
  "title": "Marché Dantokpa 4",
  "author": "Alacoolwiki",
  "license": "CC BY 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:March%C3%A9_Dantokpa_4.jpg"
 },
 {
  "file": "ganvie-pirogue",
  "title": "A Beninese woman paddles to a nearby market",
  "author": "Dr. Ondřej Havelka (cestovatel)",
  "license": "CC BY 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:A_Beninese_woman_paddles_to_a_nearby_market.jpg"
 },
 {
  "file": "abomey",
  "title": "Abomey 2006 1",
  "author": "Joachim Huber",
  "license": "CC BY-SA 2.0",
  "source": "https://commons.wikimedia.org/wiki/File:Abomey_2006_1.jpg"
 },
 {
  "file": "port",
  "title": "Port autonome de Cotonou vu de haut (3)",
  "author": "Fawaz.tairou",
  "license": "CC BY-SA 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:Port_autonome_de_Cotonou_vu_de_haut_(3).jpg"
 },
 {
  "file": "port-cargo",
  "title": "Cargo Handling Port of Cotonou Benin",
  "author": "SteKrueBe",
  "license": "CC BY-SA 3.0",
  "source": "https://commons.wikimedia.org/wiki/File:Cargo_Handling_Port_of_Cotonou_Benin.jpg"
 },
 {
  "file": "chantier",
  "title": "Ancien site de construction du siege lassemblee nationale a porto novo au Bénin demoli 02",
  "author": "Adoscam",
  "license": "CC0",
  "source": "https://commons.wikimedia.org/wiki/File:Ancien_site_de_construction_du_siege_lassemblee_nationale_a_porto_novo_au_B%C3%A9nin_demoli_02.jpg"
 },
 {
  "file": "chantier-tour",
  "title": "Vue de l'étage de l'ancien site de l'école nationale de Police du Bénin derrière BCEAO Bénin à Zongo 01",
  "author": "Adoscam",
  "license": "CC0",
  "source": "https://commons.wikimedia.org/wiki/File:Vue_de_l%27%C3%A9tage_de_l%27ancien_site_de_l%27%C3%A9cole_nationale_de_Police_du_B%C3%A9nin_derri%C3%A8re_BCEAO_B%C3%A9nin_%C3%A0_Zongo_01.jpg"
 },
 {
  "file": "chantier-terrain",
  "title": "Vue de l'étage de l'ancien site de l'école nationale de Police du Bénin derrière BCEAO Bénin à Zongo Cotonou",
  "author": "Adoscam",
  "license": "CC0",
  "source": "https://commons.wikimedia.org/wiki/File:Vue_de_l%27%C3%A9tage_de_l%27ancien_site_de_l%27%C3%A9cole_nationale_de_Police_du_B%C3%A9nin_derri%C3%A8re_BCEAO_B%C3%A9nin_%C3%A0_Zongo_Cotonou.jpg"
 },
 {
  "file": "quartier",
  "title": "Vue panoramique du quartier à Cadjéhoun à Cotonou au Bénin 02",
  "author": "Adoscam",
  "license": "CC0",
  "source": "https://commons.wikimedia.org/wiki/File:Vue_panoramique_du_quartier_%C3%A0_Cadj%C3%A9houn_%C3%A0_Cotonou_au_B%C3%A9nin_02.jpg"
 },
 {
  "file": "terrain",
  "title": "USACE visits project sites in Benin, Africa (8166427445)",
  "author": "U.S. Army Corps of Engineers Europe District from Wiesbaden, Germany",
  "license": "Public domain",
  "source": "https://commons.wikimedia.org/wiki/File:USACE_visits_project_sites_in_Benin,_Africa_(8166427445).jpg"
 },
 {
  "file": "marche-ganvie",
  "title": "Market at Ganvie Benin Dec 2017",
  "author": "Kulttuurinavigaattori",
  "license": "CC BY-SA 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:Market_at_Ganvie_Benin_Dec_2017.jpg"
 },
 {
  "file": "pharmacie",
  "title": "Pharmacie Akossombo",
  "author": "Charbel1719",
  "license": "CC BY-SA 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:Pharmacie_Akossombo.jpg"
 },
 {
  "file": "mariage",
  "title": "Wedding guests",
  "author": "Adoscam",
  "license": "CC BY-SA 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:Wedding_guests.jpg"
 },
 {
  "file": "aeroport",
  "title": "Façade principale de l'aéroport international de Cotonou",
  "author": "Fawaz.tairou",
  "license": "CC BY-SA 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:Fa%C3%A7ade_principale_de_l%27a%C3%A9roport_international_de_Cotonou.jpg"
 },
 {
  "file": "rue-cotonou",
  "title": "Rue de cotonou 3",
  "author": "Grind24",
  "license": "CC BY-SA 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:Rue_de_cotonou_3.JPG"
 },
 {
  "file": "mairie",
  "title": "3ème Arrondissement de Cotonou (Siège d'Agbodjèdo)",
  "author": "Saliousoft",
  "license": "CC BY-SA 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:3%C3%A8me_Arrondissement_de_Cotonou_(Si%C3%A8ge_d%27Agbodj%C3%A8do).jpg"
 },
 {
  "file": "zemidjan",
  "title": "Taxi moto et clients sur le boulevard Saint-Michel à Cotonou au Bénin",
  "author": "Saliousoft",
  "license": "CC BY-SA 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:Taxi_moto_et_clients_sur_le_boulevard_Saint-Michel_%C3%A0_Cotonou_au_B%C3%A9nin.jpg"
 },
 {
  "file": "wax",
  "title": "Wax print",
  "author": "M_nunoo",
  "license": "CC BY-SA 3.0",
  "source": "https://commons.wikimedia.org/wiki/File:Wax_print.jpeg"
 },
 {
  "file": "plage",
  "title": "Plage de Ouidah Benin",
  "author": "jbdodane",
  "license": "CC BY 2.0",
  "source": "https://commons.wikimedia.org/wiki/File:Plage_de_Ouidah_Benin.jpg"
 },
 {
  "file": "artisanat",
  "title": "Ustensiles en bois (Paniers éventails Palettes) traditionnels exposés au marché Dantokpa au Bénin",
  "author": "Adoscam",
  "license": "CC BY-SA 4.0",
  "source": "https://commons.wikimedia.org/wiki/File:Ustensiles_en_bois_(Paniers_%C3%A9ventails_Palettes)_traditionnels_expos%C3%A9s_au_march%C3%A9_Dantokpa_au_B%C3%A9nin.jpg"
 }
];
