// The hub in English: each French text of shell.ts and ui.ts, and its English words. test-i18n.mjs checks that none is missing.
export const SOCLE_EN:Record<string,string>={
 // The menu
 'Accueil Hestia':'Hestia home','Vue d’ensemble':'Overview','Réglages':'Settings','Accueil':'Home','Bilan du logement':'Home review',
 'Réglages généraux':'General settings','Pièces':'Rooms','Apprentissage':'Learning','Bilan':'Report','Extensions':'Extensions','Sources météo':'Weather sources','Station météo · capteurs locaux':'Weather station · local sensors',
 'Qualité de l’air':'Air quality','Pollens':'Pollen','Entités':'Entities','Météo':'Weather','Confort':'Comfort','Hestia Confort':'Hestia Comfort','Hestia Weather':'Hestia Weather',
 'Lieux':'Places','Navigation Hestia':'Hestia navigation','Ouvrir la navigation Hestia':'Open the Hestia navigation',
 'Ouvrir le menu Home Assistant':'Open the Home Assistant menu',
 // The home page
 'Votre logement, connecté':'Your home, connected','Vos briques Hestia et les points à compléter, au même endroit.':'Your Hestia bricks and what is left to complete, in one place.',
 'Version {version}':'Version {version}','Ouvrir {tab}':'Open {tab}','Tout est suivi':'All followed','À faire':'To do','État inconnu':'Unknown state',
 'À découvrir':'To discover','Installée. Ses réglages restent dans Paramètres, en attendant qu’elle rejoigne ce panneau.':'Installed. Its settings stay in Settings until it joins this panel.',
 'Ouvrir ses réglages':'Open its settings','Voir':'See',
 'La météo de votre station : prévisions, alertes, qualité de l’air et pollens.':'Your station’s weather: forecasts, alerts, air quality and pollen.',
 'Le confort de chaque pièce et le bon moment pour ouvrir, fermer ou aérer.':'Each room’s comfort, and the right time to open, close or air it.',
 // « Passage au nom Hestia » (socle 1.16)
 'Passage au nom Hestia':'Moving to the Hestia name','Tout est passé au nom Hestia':'Everything has moved to the Hestia name',
 'Le passage n’est pas terminé':'The move is not finished','Rien n’est perdu : il reprendra au prochain redémarrage de Home Assistant.':'Nothing is lost: it will start again at the next restart of Home Assistant.',
 'Passage en cours…':'Moving…','Vos réglages passent au nom Hestia. Cette page se met à jour toute seule.':'Your settings are moving to the Hestia name. This page updates by itself.',
 'Nouvelle version installée':'New version installed','Vos réglages sont repris':'Your settings are kept','{n} lieu':'{n} place','{n} lieux':'{n} places',
 '{n} pièce':'{n} room','{n} pièces':'{n} rooms','apprentissages':'what was learned',
 'Entités, historiques et statistiques gardés':'Entities, history and statistics kept','{n} entité':'{n} entity','{n} entités':'{n} entities',
 'Tableaux de bord et automatisations mis à jour':'Dashboards and automations updated','{n} tableau de bord':'{n} dashboard','{n} tableaux de bord':'{n} dashboards',
 '{n} automatisation, script ou modèle':'{n} automation, script or blueprint','{n} automatisations, scripts ou modèles':'{n} automations, scripts or blueprints',
 'Rien à mettre à jour':'Nothing to update','Quelques lignes à changer à la main':'A few lines to change by hand',
 'Remplacez l’ancien nom par le nouveau dans : {files}':'Replace the former name with the new one in: {files}','Rien à changer à la main':'Nothing to change by hand',
 'Redémarrer Home Assistant pour terminer':'Restart Home Assistant to finish','L’ancienne version est encore en mémoire jusqu’au redémarrage.':'The former version stays in memory until the restart.',
 'Confirmer le redémarrage':'Confirm the restart','Redémarrer maintenant':'Restart now','Home Assistant a redémarré':'Home Assistant has restarted',
 'Nom des entités : l’ancien nom est gardé':'Entity names: the former name is kept','Facultatif : vos entités peuvent prendre le nom « hestia_weather ».':'Optional: your entities can take the “hestia_weather” name.',
 'Choisir':'Choose','Nom des entités : « hestia_weather »':'Entity names: “hestia_weather”','Renommées le {date}.':'Renamed on {date}.',
 'Ce cadre ne reviendra plus une fois fermé.':'Once closed, this frame will not come back.','J’ai compris':'Got it',
 'Le redémarrage n’a pas été lancé.':'The restart was not started.',
 // The hub's settings
 'Réglages Hestia':'Hestia settings','Les préférences communes à votre hub.':'The preferences shared by your hub.','Thème du hub':'Hub theme','Apparence':'Appearance',
 'Suivre le thème Home Assistant':'Follow the Home Assistant theme','Utiliser le thème Hestia':'Use the Hestia theme',
 'Home Assistant reprend les couleurs et la police de votre thème. Hestia utilise sa propre palette, en suivant le mode clair ou sombre de Home Assistant.':'Home Assistant takes your theme’s colours and font. Hestia uses its own palette, following Home Assistant’s light or dark mode.',
 'Affichage':'Display','Hestia dans le menu Home Assistant':'Hestia in the Home Assistant menu','Hestia est dans le menu de gauche.':'Hestia is in the left menu.',
 'Hestia n’est pas dans le menu de gauche.':'Hestia is not in the left menu.','Masqué, il reste ouvert par la roue de chaque intégration, dans Paramètres.':'Hidden, it still opens from each integration’s cog, in Settings.',
 'Affiché':'Shown','Masqué':'Hidden',
 // Errors and loading
 'Réessayer':'Try again','Chargement…':'Loading…','Connexion indisponible.':'Connection unavailable.','Le réglage n’a pas été enregistré.':'The setting was not saved.',
 'Le thème n’a pas été enregistré.':'The theme was not saved.','L’onglet {tab} ne s’est pas chargé. Rechargez la page.':'The {tab} tab did not load. Reload the page.',
 'Cette page est indisponible':'This page is unavailable','La brique correspondante n’est pas installée ou cette adresse est inconnue.':'Its brick is not installed, or this address is unknown.',
 'Retour à l’accueil':'Back to home',
 // ui.ts: help, defaults and the common pages
 'Aide':'Help','Aide : {label}':'Help: {label}','Fermer l’aide':'Close help','Valeur par défaut':'Default value','Choisissez un capteur':'Choose a sensor',
 'par défaut':'default','Rétablir':'Restore','Rétablir la valeur par défaut':'Restore the default value','Comprendre la valeur par défaut':'About the default value','Pourquoi cette valeur ?':'Why this value?',
 'À régler':'To set','À améliorer':'To improve','Quitter sans enregistrer ?':'Leave without saving?','Vos changements de cette page seront perdus.':'Your changes on this page will be lost.',
 'Continuer à modifier':'Keep editing','Quitter sans enregistrer':'Leave without saving','Versions et liens':'Versions and links','Liens utiles':'Useful links',
 'Intégration Home Assistant':'Home Assistant integration','Journaux Home Assistant':'Home Assistant logs','Documentation':'Documentation','Versions publiées':'Releases',
 'Signaler un problème':'Report an issue','Soutenez mon travail':'Support my work',
 // « Détectées, pas encore lues » (1.18)
 'Lire l’extension {name}':'Read the {name} extension','Détectées, pas encore lues par {brick}':'Detected, not read by {brick} yet','À proposer':'To suggest','Trouvées dans votre Home Assistant. {brick} ne s’en sert pas encore ; dites-nous si elles vous seraient utiles.':'Found in your Home Assistant. {brick} does not use them yet; tell us if they would help you.','pas encore lue':'not read yet','Demander':'Ask','« Demander » ouvre une demande toute prête sur GitHub : dites-y comment vous utilisez l’extension. Si elle a déjà été demandée, un 👍 sur la demande existante suffit. Rien n’est envoyé sans vous.':'“Ask” opens a ready-made request on GitHub: say there how you use the extension. If it was already asked for, a 👍 on that request is enough. Nothing is sent without you.',
 // Socle 1.20: the save bar.
 'Modifications':'Changes','1 modification':'1 change','{n} modifications':'{n} changes','Annuler':'Cancel','Enregistrer':'Save',
 // Socle 1.22: « À propos » in every brick's menu.
 'À propos':'About','Versions':'Versions','Ajouter une carte':'Add a card','Liens':'Links','Page du projet':'Project page','Présentation, documentation et nouveautés.':'Overview, documentation and news.',
};
