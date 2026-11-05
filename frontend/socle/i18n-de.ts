// The hub in German: each French text of shell.ts and ui.ts, and its German words. test-i18n.mjs checks that none is missing.
// To improve a text, change only what is on the right of the colon; keep the {names} between braces as they are.
export const SOCLE_DE:Record<string,string>={
 // The menu
 'Accueil Hestia-FB':'Hestia-FB-Start','Vue d’ensemble':'Übersicht','Réglages':'Einstellungen','Accueil':'Start','Bilan du logement':'Bilanz der Wohnung',
 'Réglages généraux':'Allgemeine Einstellungen','Pièces':'Räume','Apprentissage':'Lernen','Bilan':'Bilanz','Extensions':'Erweiterungen','Sources météo':'Wetterquellen','Station météo · capteurs locaux':'Wetterstation · lokale Sensoren',
 'Qualité de l’air':'Luftqualität','Pollens':'Pollen','Entités':'Entitäten','Météo':'Wetter','Confort':'Komfort','Hestia Confort':'Hestia Comfort','Hestia Weather':'Hestia Weather',
 'Lieux':'Orte','Navigation Hestia-FB':'Hestia-FB-Navigation','Ouvrir la navigation Hestia-FB':'Hestia-FB-Navigation öffnen',
 'Ouvrir le menu Home Assistant':'Menü von Home Assistant öffnen',
 // The home page
 'Votre logement, connecté':'Ihr Zuhause, vernetzt','Vos briques Hestia-FB et les points à compléter, au même endroit.':'Ihre Hestia-FB-Bausteine und was noch zu ergänzen ist, an einem Ort.',
 'Version {version}':'Version {version}','Ouvrir {tab}':'{tab} öffnen','Tout est suivi':'Alles wird verfolgt','À faire':'Zu tun','État inconnu':'Unbekannter Zustand',
 'À découvrir':'Zu entdecken','Installée. Ses réglages restent dans Paramètres, en attendant qu’elle rejoigne ce panneau.':'Installiert. Die Einstellungen bleiben unter Einstellungen, bis der Baustein in dieses Panel kommt.',
 'Ouvrir ses réglages':'Einstellungen öffnen','Voir':'Ansehen',
 'La météo de votre station : prévisions, alertes, qualité de l’air et pollens.':'Das Wetter Ihrer Station: Vorhersagen, Warnungen, Luftqualität und Pollen.',
 'Le confort de chaque pièce et le bon moment pour ouvrir, fermer ou aérer.':'Der Komfort jedes Raumes und der richtige Moment zum Öffnen, Schließen oder Lüften.',
 // « Passage au nom Hestia » (socle 1.16)
 'Passage au nom Hestia':'Wechsel zum Namen Hestia','Tout est passé au nom Hestia':'Alles ist zum Namen Hestia gewechselt',
 'Le passage n’est pas terminé':'Der Wechsel ist nicht abgeschlossen','Rien n’est perdu : il reprendra au prochain redémarrage de Home Assistant.':'Nichts ist verloren: Er startet beim nächsten Neustart von Home Assistant erneut.',
 'Passage en cours…':'Wechsel läuft…','Vos réglages passent au nom Hestia. Cette page se met à jour toute seule.':'Ihre Einstellungen wechseln zum Namen Hestia. Diese Seite aktualisiert sich von selbst.',
 'Nouvelle version installée':'Neue Version installiert','Vos réglages sont repris':'Ihre Einstellungen bleiben erhalten','{n} lieu':'{n} Ort','{n} lieux':'{n} Orte',
 '{n} pièce':'{n} Raum','{n} pièces':'{n} Räume','apprentissages':'Gelerntes',
 'Entités, historiques et statistiques gardés':'Entitäten, Verläufe und Statistiken behalten','{n} entité':'{n} Entität','{n} entités':'{n} Entitäten',
 'Tableaux de bord et automatisations mis à jour':'Dashboards und Automatisierungen angepasst','{n} tableau de bord':'{n} Dashboard','{n} tableaux de bord':'{n} Dashboards',
 '{n} automatisation, script ou modèle':'{n} Automatisierung, Skript oder Blueprint','{n} automatisations, scripts ou modèles':'{n} Automatisierungen, Skripte oder Blueprints',
 'Rien à mettre à jour':'Nichts anzupassen','Quelques lignes à changer à la main':'Ein paar Zeilen von Hand ändern',
 'Remplacez l’ancien nom par le nouveau dans : {files}':'Ersetzen Sie den früheren Namen durch den neuen in: {files}','Rien à changer à la main':'Nichts von Hand zu ändern',
 'Redémarrer Home Assistant pour terminer':'Home Assistant neu starten, um abzuschließen','L’ancienne version est encore en mémoire jusqu’au redémarrage.':'Die frühere Version bleibt bis zum Neustart im Speicher.',
 'Confirmer le redémarrage':'Neustart bestätigen','Redémarrer maintenant':'Jetzt neu starten','Home Assistant a redémarré':'Home Assistant wurde neu gestartet',
 'Nom des entités : l’ancien nom est gardé':'Namen der Entitäten: Der frühere Name bleibt','Facultatif : vos entités peuvent prendre le nom « hestia_weather ».':'Optional: Ihre Entitäten können den Namen „hestia_weather“ bekommen.',
 'Choisir':'Wählen','Nom des entités : « hestia_weather »':'Namen der Entitäten: „hestia_weather“','Renommées le {date}.':'Umbenannt am {date}.',
 'Ce cadre ne reviendra plus une fois fermé.':'Einmal geschlossen, erscheint dieser Rahmen nicht wieder.','J’ai compris':'Verstanden',
 'Le redémarrage n’a pas été lancé.':'Der Neustart wurde nicht gestartet.',
 // The hub's settings
 'Réglages Hestia-FB':'Hestia-FB-Einstellungen','Les préférences communes à votre hub.':'Die gemeinsamen Einstellungen Ihres Hubs.','Thème du hub':'Design des Hubs','Apparence':'Aussehen',
 'Suivre le thème Home Assistant':'Dem Design von Home Assistant folgen','Utiliser le thème Hestia-FB':'Das Hestia-FB-Design verwenden',
 'Home Assistant reprend les couleurs et la police de votre thème. Hestia-FB utilise sa propre palette, en suivant le mode clair ou sombre de Home Assistant.':'Home Assistant übernimmt die Farben und die Schrift Ihres Designs. Hestia-FB verwendet eine eigene Palette und folgt dem hellen oder dunklen Modus von Home Assistant.',
 'Affichage':'Anzeige','Hestia-FB dans le menu Home Assistant':'Hestia-FB im Menü von Home Assistant','Hestia-FB est dans le menu de gauche.':'Hestia-FB ist im linken Menü.',
 'Hestia-FB n’est pas dans le menu de gauche.':'Hestia-FB ist nicht im linken Menü.','Masqué, il reste ouvert par la roue de chaque intégration, dans Paramètres.':'Ausgeblendet öffnet es sich weiterhin über das Zahnrad jeder Integration, unter Einstellungen.',
 'Affiché':'Angezeigt','Masqué':'Ausgeblendet',
 // Errors and loading
 'Réessayer':'Erneut versuchen','Chargement…':'Wird geladen…','Connexion indisponible.':'Verbindung nicht verfügbar.','Le réglage n’a pas été enregistré.':'Die Einstellung wurde nicht gespeichert.',
 'Le thème n’a pas été enregistré.':'Das Design wurde nicht gespeichert.','L’onglet {tab} ne s’est pas chargé. Rechargez la page.':'Der Reiter {tab} wurde nicht geladen. Laden Sie die Seite neu.',
 'Cette page est indisponible':'Diese Seite ist nicht verfügbar','La brique correspondante n’est pas installée ou cette adresse est inconnue.':'Der zugehörige Baustein ist nicht installiert, oder diese Adresse ist unbekannt.',
 'Retour à l’accueil':'Zurück zum Start',
 // ui.ts: help, defaults and the common pages
 'Aide':'Hilfe','Aide : {label}':'Hilfe: {label}','Fermer l’aide':'Hilfe schließen','Valeur par défaut':'Standardwert','Choisissez un capteur':'Sensor wählen',
 'par défaut':'Standard','Rétablir':'Zurücksetzen','Rétablir la valeur par défaut':'Standardwert wiederherstellen','Comprendre la valeur par défaut':'Zum Standardwert','Pourquoi cette valeur ?':'Warum dieser Wert?',
 'À régler':'Einzustellen','À améliorer':'Zu verbessern','Quitter sans enregistrer ?':'Ohne Speichern verlassen?','Vos changements de cette page seront perdus.':'Ihre Änderungen auf dieser Seite gehen verloren.',
 'Continuer à modifier':'Weiter bearbeiten','Quitter sans enregistrer':'Ohne Speichern verlassen','Versions et liens':'Versionen und Links','Liens utiles':'Nützliche Links',
 'Intégration Home Assistant':'Integration für Home Assistant','Journaux Home Assistant':'Protokolle von Home Assistant','Documentation':'Dokumentation','Versions publiées':'Veröffentlichte Versionen',
 'Signaler un problème':'Problem melden','Soutenez mon travail':'Meine Arbeit unterstützen',
 // « Détectées, pas encore lues » (1.18)
 'Lire l’extension {name}':'Erweiterung {name} lesen','Détectées, pas encore lues par {brick}':'Erkannt, von {brick} noch nicht gelesen','À proposer':'Vorschlagen','Trouvées dans votre Home Assistant. {brick} ne s’en sert pas encore ; dites-nous si elles vous seraient utiles.':'In Ihrem Home Assistant gefunden. {brick} nutzt sie noch nicht; sagen Sie uns, ob sie Ihnen helfen würden.','pas encore lue':'noch nicht gelesen','Demander':'Anfragen','« Demander » ouvre une demande toute prête sur GitHub : dites-y comment vous utilisez l’extension. Si elle a déjà été demandée, un 👍 sur la demande existante suffit. Rien n’est envoyé sans vous.':'„Anfragen“ öffnet eine fertige Anfrage auf GitHub: Schreiben Sie dort, wie Sie die Erweiterung nutzen. Wurde sie schon angefragt, genügt ein 👍 auf der bestehenden Anfrage. Nichts wird ohne Sie gesendet.',
 // Socle 1.20: the save bar.
 'Modifications':'Änderungen','1 modification':'1 Änderung','{n} modifications':'{n} Änderungen','Annuler':'Abbrechen','Enregistrer':'Speichern',
 // Socle 1.22: « À propos » in every brick's menu.
 'À propos':'Über','Versions':'Versionen','Ajouter une carte':'Karte hinzufügen','Liens':'Links','Page du projet':'Projektseite','Présentation, documentation et nouveautés.':'Überblick, Dokumentation und Neuigkeiten.',
};
