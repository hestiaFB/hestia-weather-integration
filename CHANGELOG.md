## 2.9.8 — Le vent, la pression et l’orage à venir

**En bref**

- **La frise des évènements annonce le vent fort à venir**, et la pression qui monte ou baisse vite.
- **Open-Meteo donne la pression à venir** quand votre service météo ne la prévoit pas (Météo-France). Il apparaît dans Extensions et se coupe lieu par lieu.
- **Les cartes Vent, Pression et Éclairs ont leur bloc « À venir »**, comme la carte Pluie.
- **La frise montre jusqu’à 8 évènements à venir**, au lieu de 5.

### Nouveautés

- Dans la frise : « Vent fort dans environ 3 h : rafales à 65 km/h », dès 30 km/h de vent moyen ou 40 km/h en rafales prévus dans les 6 heures. Rien de plus si le vent fort souffle déjà.
- Dans la frise : « La pression va baisser : −7 hPa en 6 h », dès 4 hPa d’écart prévus.
- Carte Vent, bloc « À venir » : le vent et les rafales les plus forts des 6 heures, et l’heure où le vent fort commence.
- Carte Pression, bloc « À venir » : la pression des 6 heures et son écart.
- Open-Meteo, service météo gratuit et sans compte, donne la pression à venir quand votre service météo ne la prévoit pas. Il reçoit la position de la maison, arrondie à environ 100 m. Dans Extensions, rubrique Sources météo, un interrupteur le coupe pour chaque lieu ; le bloc Pression « À venir » reste alors caché.
- Carte Éclairs, bloc « À venir » : un orage prévu dans les 6 heures, ou « Pas d’orage prévu d’ici 6 h ».

### Améliorations

- La frise garde jusqu’à 8 évènements à venir, les plus importants d’abord.
- Une carte dont vous aviez déjà choisi le contenu le garde : cochez « À venir » dans ses réglages pour l’ajouter.

## 2.9.7 — Le panneau en anglais, vos entités au nom Hestia, et le passage à la version 3 préparé

**En bref**

- **Le panneau de réglages parle anglais**, comme la carte.
- **Vos entités peuvent prendre le nom Hestia**, si vous le voulez, depuis les Réglages généraux, avec un retour en arrière possible.
- **Le passage à Hestia Weather 3 est préparé** : quand vous l’installerez, il se fera tout seul.

### Nouveautés

- Le panneau Hestia est rangé comme celui de Hestia Confort : Accueil, Réglages généraux, Extensions, puis les réglages de chaque lieu.
- Une page « Extensions » à part, rangée par thème : sources météo, qualité de l’air, pollens, eau et jardin, orages et éclairs.
- « Supprimer ce lieu » directement depuis le panneau.
- La carte « Nom des entités » montre d’abord ce qui change ; automatisations, scripts, scènes et tableaux de bord suivent ; l’historique est gardé.
- Une nouvelle installation reçoit les noms Hestia : `hestia_weather_…` et `custom:hestia-weather-card`.

### Améliorations

- Le panneau répond plus vite, et la semaine de pluie et de vent est lue plus légèrement.
- Les modèles d’automatisation ne proposent plus d’entité par défaut.
- Les diagnostics masquent le lieu, les zones et les éclairs.
- Quand Hestia Weather 3 sera installé, cette version le démarre : il reprend vos lieux, entités, historiques et tableaux de bord sous le nom Hestia.

### Corrections

- Sur un téléphone étroit, une ligne « À régler » avec un raccourci redevient lisible.
- Le lien « En savoir plus » du ressenti mène à la bonne documentation.

### À savoir

- Home Assistant 2026.7 ou plus récent est demandé. Sur une version plus ancienne, HACS ne propose pas cette mise à jour ; la version installée continue de fonctionner.

## 2.9.6 — Préversion : renommer ses entités en hestia_weather

**En bref**

- **Vos entités peuvent prendre le nom Hestia**, si vous le voulez : une installation qui a encore des entités `niak_weather_…` peut les renommer `hestia_weather_…` depuis le panneau, puis revenir en arrière.

### Nouveautés

- Dans les Réglages généraux, la carte « Nom des entités » montre d’abord ce qui change, sans rien modifier.
- Les automatisations, scripts, scènes, tableaux de bord et assistants qui les utilisent sont mis à jour tout seuls.
- Les fichiers YAML écrits à la main ne sont jamais modifiés : la carte indique le fichier et la ligne à corriger.
- L’historique et les statistiques sont conservés.
- « Revenir à l’ancien nom » remet les entités et ce qui les utilise comme avant.

## 2.9.5 — Préversion : correctif d’affichage sur petit écran

### Corrections

- Sur un téléphone étroit (320 px), une ligne « À régler » avec un raccourci n’était plus lisible : le raccourci passe maintenant sous le texte.

## 2.9.4 — Préversion : le panneau de Hestia Weather en anglais, plus rapide

**En bref**

- **Le panneau de réglages parle anglais** à son tour, comme la carte depuis la 2.9.0.
- **Le panneau Hestia est rangé comme celui de Hestia Confort** : Accueil, Réglages généraux, Extensions, puis les réglages de chaque lieu.
- **Noms Hestia pour les nouvelles installations** : les entités s’appellent `hestia_weather_…` et la carte `custom:hestia-weather-card`. Rien ne change pour les installations existantes.

### Nouveautés

- Une page « Extensions » à part dans le menu, rangée par thème : sources météo, qualité de l’air, pollens, eau et jardin, orages et éclairs.
- « Supprimer ce lieu » directement depuis le panneau.

### Améliorations

- Les noms Hestia existent à côté des anciens : la carte, l’évènement d’alerte `hestia_weather_alerte` et les variables de thème `hestia-…-color`. Les anciens noms `niak…` continuent de marcher.
- Une installation qui a déjà des entités `niak_weather_…` les garde : vos automatisations et tableaux de bord ne bougent pas.
- Les modèles d’automatisation ne proposent plus d’entité par défaut, et écoutent le nouvel évènement.
- La documentation montre les noms Hestia, avec une section « Noms techniques ».
- Le panneau répond plus vite : Home Assistant n’est plus relu plusieurs fois pour un même affichage.
- La semaine de pluie et de vent est lue plus légèrement dans l’historique.
- Les diagnostics masquent le lieu, les zones et les éclairs.

### Corrections

- Le lien « En savoir plus » du ressenti mène à la bonne documentation.
- Les messages d’erreur disent de chercher « weather » dans les journaux.

### À savoir

- Home Assistant 2026.7 ou plus récent est maintenant demandé (2025.1 jusqu’ici) : c’est la plus ancienne version sur laquelle Hestia Weather est testé. Sur une version plus ancienne, HACS ne proposera pas cette mise à jour ; la version installée continue de fonctionner.

## 2.9.3 — Stable : Niak Weather devient Hestia Weather

**En bref**

- **Niak Weather devient Hestia Weather.** Le nom change partout : carte, panneau, textes, traductions et documentation.
- **Rien à refaire de votre côté.** Mêmes entités, mêmes réglages, mêmes cartes, même adresse du panneau.

### Améliorations

- Nouveau logo du hub : un H à la place du N.
- Dans « Ajouter une carte », les cartes s’appellent maintenant « Hestia - Météo », « Hestia - À la pièce » et « Hestia - Petite carte ».
- Les noms internes (`niak_weather`, `niak-weather-card`) ne changent pas, pour ne rien casser chez vous.

## 2.9.1 — Stable : un bloc coché se range à sa place

### Corrections

- Dans les réglages de la carte, un bloc qu’on coche se range à sa place habituelle, et non plus tout en bas. Par exemple, les éclairs cochés se placent juste après la pression, à côté de la pluie et du vent.

## 2.9.0 — Stable : Niak Weather en anglais, cartes à la pièce et radar des éclairs

**En bref**

- **Niak Weather parle anglais** : la carte s’affiche en anglais quand Home Assistant n’est pas en français. Une première pour les utilisateurs hors de France.
- **Cartes à la pièce** : ressenti, pluie, vent, pression, éclairs, air et pollens, prévisions. Chacune se pose seule sur un tableau de bord.
- **Radar des éclairs** avec Blitzortung : les éclairs de la dernière heure autour de la maison.
- **Réglages → Extensions**, comme dans Niak Confort : la liaison avec Niak Confort et chaque intégration utilisée, au même endroit.

### Nouveautés

- **En anglais** : la carte, le bulletin du jour, les événements, les mesures et les prévisions.
- Chaque utilisateur voit la carte dans la langue de son profil Home Assistant : français pour l’un, anglais pour l’autre, sur le même tableau de bord.
- Les nombres et les heures s’écrivent à la manière de la langue : 8.5 et 14:00 en anglais.
- Les capteurs et les réglages restent en français pour l’instant.
- Cartes à la pièce : chacune montre les parties que vous cochez.
- Radar des éclairs : l’éclair le plus proche, le niveau (calme, secteur, proche, sur vous), le nombre d’éclairs de l’heure, des 10 dernières minutes et du mois.
- Dans la carte complète, les éclairs se rangent à côté de la pluie, du vent et de la pression. La carte seule peut se cacher quand il n’y a pas d’orage.
- Onglet Extensions : Niak Confort se relie ou se coupe d’un interrupteur. Coupé d’un côté, il l’est aussi de l’autre.
- Onglet Extensions : chaque intégration (Météo-France, Atmo France, WAQI, Vigieau, Blitzortung, pollens) montre si elle est installée, à quoi elle sert pour ce lieu, et s’allume ou s’éteint d’un interrupteur.

### Améliorations

- Réglages de la carte en deux temps : le type de carte, puis le format.
- « Ajouter une carte » propose trois entrées : Niak - Météo, Niak - À la pièce, Niak - Petite carte.
- Pendant son chargement, la carte se dessine en lignes grises balayées de lumière.

### Corrections

- Une baisse passagère du compteur de pluie de la station n’est plus comptée comme de la pluie (issue #9).

## 2.9.0b1 — Bêta : Niak Weather en anglais

**La carte parle la langue de Home Assistant : français, ou anglais pour toutes les autres langues.**

### Nouveautés

- La carte, le bulletin du jour, les événements, les mesures et les prévisions s’affichent en anglais quand Home Assistant n’est pas en français.
- Chaque utilisateur voit la carte dans la langue de son profil Home Assistant.
- Les nombres et les heures s’écrivent à la manière de la langue choisie : 8.5 et 14:00 en anglais.
- Les capteurs et le panneau de réglages restent en français pour l’instant.

## 2.8.3 — Stable : barres de pluie sur 24 h et 30 jours

- Les barres de pluie sur 24 heures et 30 jours s’affichent même quand la station démarre après Niak Weather : elles restaient sur 7 jours.
- Même correction pour les cumuls de la semaine, du mois et de l’année calculés depuis le compteur total, et pour les courbes du vent et de la pression sur plusieurs jours.

## 2.8.2 — Stable : UV avec une station Netatmo

- Avec une station Netatmo, la case « Indice UV » est de nouveau proposée dans Réglages → Station, rubrique Soleil : on peut y choisir le capteur UV d’un autre appareil, comme OpenUV.
- L’indice UV actuel d’OpenUV est reconnu automatiquement (ni son maximum du jour, ni son niveau en toutes lettres).
- Sans capteur UV, « UV forts » utilise l’indice UV du service météo au lieu de rester inconnu.

## 2.8.1 — Stable : l’heure, et pluie, vent et pression sur plusieurs jours

- Barres de pluie au choix : 24 dernières heures (une par heure), 7 jours ou 30 jours (une par jour), avec le total de la période.
- Courbes du vent et de la pression au choix : 6 heures, 24 heures, 2 jours ou 7 jours.
- L’heure peut s’afficher dans le bandeau, en grand sous le titre ou au-dessus de « En ce moment ».

Cette version stable reprend la bêta 2.8.1b1, avec en plus les périodes de la pluie et du vent.

## 2.8.1b1 — Bêta : l’heure et la pression sur plusieurs jours

- La courbe de pression peut montrer les 6 dernières heures, 24 heures, 2 jours ou 7 jours : réglage « Courbe de pression » dans la section Aujourd’hui de la carte.
- L’heure peut s’afficher dans le bandeau, en grand sous le titre ou au-dessus de « En ce moment » : réglage « Heure dans le bandeau ».

## 2.8.0 — Stable : accueil technique et réglages par sujet

- Nouvel accueil technique : état de Weather, problèmes à corriger, extensions installées/configurées, statistiques, versions et liens utiles.
- Réglages regroupés par sujet : Météo-France et Blitzortung dans Sources météo, air et pollens dans leurs onglets, Vigieau dans Eau et jardin.
- Menu à icônes conforme à Niak Confort et cadres lisibles avec les thèmes Home Assistant, notamment Nordic.
- Choix conservés entre les onglets et anciens liens compatibles.

Cette version stable reprend la bêta 2.8.0b4 validée, sans changement fonctionnel supplémentaire.

## 2.8.0b4 — Bêta : réglages par sujet

- L’onglet Extensions est supprimé : les intégrations d’air et de pollens se règlent dans leurs onglets, Vigieau dans Eau et jardin, Blitzortung dans Sources météo.
- Météo-France est identifié dans Sources météo, avec son état d’installation et sa sélection enregistrée pour le lieu.
- Le menu de configuration reprend les deux rangées arrondies à icônes de Niak Confort.
- Les anciens liens Extensions ouvrent Sources météo ; le brouillon reste conservé entre les onglets et le nouvel assistant passe par Eau et jardin.

## 2.8.0b3 — Bêta : tableau de bord technique et thèmes Home Assistant

- La vue d’ensemble Météo devient un accueil technique : état des sources, prévisions reçues, dernier calcul, capteurs de la station, historique, entités et liaisons avec les autres briques.
- Les indicateurs distinguent les capteurs qui répondent, les entités avec une valeur et les points à régler. Les données pas encore reçues restent inconnues.
- L’accueil affiche une synthèse des extensions par catégorie, avec leur état installé/configuré, les accès directs aux réglages, les versions et les liens utiles. La sélection des données et l’aide à l’installation restent dans les réglages.
- En suivant le thème Home Assistant, les cadres restent visibles même si le thème donne aux séparateurs la couleur du fond, comme Nordic Perso. Les couleurs et la typographie du thème sont conservées.

## 2.8.0b2 — Bêta : extensions rangées par usage

- Les extensions sont regroupées dans quatre catégories repliables : **Qualité de l’air**, **Pollens**, **Eau et jardin**, **Orages et éclairs**.
- L’accueil et les réglages présentent les mêmes catégories, avec le nombre d’extensions configurées visible sans les ouvrir.
- Atmo France apparaît dans Air et dans Pollens ; chaque entrée indique son propre état et ouvre le bon réglage.

## 2.8.0b1 — Bêta : les extensions météo à portée de main

- L’accueil Météo présente les extensions : installées, configurées pour le lieu, ou pas encore installées.
- Blitzortung et Vigieau sont visibles avec un accès à leur configuration et des indications d’installation.
- Le menu Météo rejoint la logique de Confort : **Vue d’ensemble** et **Réglages généraux**.
- Les rubriques Sources météo, Station météo · capteurs locaux, Qualité de l’air, Pollens et Entités sont regroupées dans les réglages, avec les Extensions.
- Les anciens liens de configuration restent utilisables. Les changements restent en brouillon jusqu’à l’enregistrement.

## 2.7.0 — Stable : les éclairs et les restrictions d’eau

**En bref**

- **L’orage vu, pas seulement prévu.** Avec l’intégration Blitzortung, Niak Weather voit les éclairs autour de chez vous : à moins de 30 km, le capteur Orage s’allume et dit où est l’orage et s’il se rapproche.
- **Les restrictions d’eau de votre commune.** Avec l’intégration Vigieau, un nouveau capteur « Restrictions d’eau » (famille Jardin) donne le niveau de l’arrêté sécheresse.

### Nouveautés

- Éclairs à moins de 30 km : le capteur Orage s’allume, même sans orage prévu. « Orage à 12 km au sud-ouest, il se rapproche ». Distance, direction et tendance en attributs.
- Éclairs à moins de 10 km : le temps du moment et le ciel animé passent à « Orage ».
- Un orage plus lointain est signalé pour information, sans alerte.
- Capteur « Restrictions d’eau » : pas de restriction, vigilance, alerte, alerte renforcée ou crise ; usages restreints et lien de l’arrêté en attributs.
- Dès le niveau « Alerte », la carte et la synthèse le disent, en précisant si l’arrosage est restreint.
- Les autres briques Niak reçoivent les éclairs et les restrictions d’eau.

### Améliorations

- Vigieau et Blitzortung se choisissent dans l’étape Sources météo ; Niak les trouve seul quand il n’y a qu’un choix (pour Vigieau, la zone de l’eau du robinet).

## 2.6.3 — Stable : la couverture nuageuse partagée

**En bref**

- **La couverture nuageuse est partagée avec les autres briques Niak.** Niak Confort s’en sert pour estimer le soleil quand votre station est à l’ombre.

### Nouveautés

- La prévision heure par heure transmise aux autres briques donne aussi la couverture nuageuse (en %), quand le service météo la fournit.

## 2.6.2 — Stable : la saison partagée

**En bref**

- **La saison est partagée avec les autres briques Niak.** Niak Confort s’en sert pour adapter ses conseils à l’été, à l’hiver et aux entre-saisons.

### Nouveautés

- Les autres briques Niak reçoivent la saison affichée par Niak Weather : celle de votre capteur Saison s’il est choisi, sinon celle du calendrier, avec la durée du jour.

## 2.6.1 — Stable : la pluie à la minute

**En bref**
- **« Pluie dans » donne enfin le temps qui reste**, à la minute près grâce à la pluie dans l’heure de Météo-France.

### Améliorations
- Le capteur « Pluie dans » donnait le numéro du créneau horaire (0 voulait dire « quelque part dans ce créneau »). Il donne maintenant le temps qui reste, en heures avec une décimale ; ses attributs disent aussi les minutes et d’où vient l’information (radar ou prévision).
- Quand la pluie dans l’heure de Météo-France ne voit rien tomber, la pluie de la prévision horaire est repoussée après cette heure sèche.

### Nouveautés
- Les autres briques Niak (Niak Confort) reçoivent l’heure de la prochaine pluie.

## 2.6.0 — Stable : ciel animé plus vivant

- Nouveauté : le vent se voit enfin. Météo-France n’annonce jamais « venteux » : c’est maintenant la force du vent qui compte. Une brise (dès 25 km/h, ou rafales à 45 km/h) dessine quelques filets d’air, un vent fort (dès 40 km/h, ou rafales à 70 km/h) des filets rapides qui poussent la pluie et la neige de biais.
- Nouveauté : par vent fort, la saison s’envole : pétales au printemps, aigrettes de pissenlit en été, feuilles de platane en automne, feuilles sèches en hiver.
- Amélioration : une pluie plus naturelle, chaque goutte avec sa longueur, son épaisseur et sa vitesse.
- Amélioration : une neige plus douce, aux flocons de tailles variées, un peu flous de près.
- Amélioration : le brouillard se voit mieux sur un thème clair.
- Nouveauté : le ciel animé distingue ce que Météo-France distingue : bruine, averses avec éclaircies, pluie verglaçante, brume, bancs de brouillard, brouillard givrant, quelques flocons, neige forte, risque d’orages, orage avec grêle… Le plus fidèle avec le capteur « Condition d’origine » de Météo-France activé ; sans lui, une partie se déduit des chiffres.

## 2.5.9 — Stable : appui court au choix

- Nouveauté : sur la tuile, l’appui court se choisit comme l’appui long, dans Fonctionnalités : déplier ou replier, ouvrir la météo complète en fenêtre, ouvrir une page, ou rien.
- Par défaut, rien ne change : l’appui déplie la tuile, l’appui long ouvre la météo complète (ou la page choisie).

## 2.5.8 — Stable : mini et maxi du jour

- Nouveauté : sous la température actuelle, la tuile et la carte complète montrent le mini et le maxi prévus aujourd’hui (↓ 16° ↑ 25°), jusqu’à minuit.

## 2.5.6 — Stable : bordures des événements

- Correction : dans les Événements, l’icône de la phrase qui défile (pluie, qualité de l’air…) n’a plus son bord gauche coupé.
- Correction : le contour de la pastille active de la frise n’est plus mangé par son icône.

## 2.5.5 — Stable : WAQI, Bulletin du jour, brouillard sous la pluie

Reprend les préversions 2.5.5b1 à 2.5.5b3 ci-dessous : panne d’une source d’air ou de pollens signalée, WAQI comme deuxième source pour l’air, capteur Bulletin du jour, brouillard corrigé sous la pluie.

## 2.5.5b3 — Bulletin du jour et brouillard sous la pluie

- Nouveau capteur **Bulletin du jour** (`sensor.niak_weather_bulletin_du_jour`) : le texte de la prévision, prêt à lire sur une enceinte ou à envoyer en notification. Le texte entier et chaque moment de la journée sont aussi en attributs.
- Correction : sans pluviomètre, une humidité de 99 % ne fait plus afficher « Brouillard » quand le bulletin annonce de la pluie ou de la neige. Un pluviomètre qui ne mesure rien garde le brouillard.

## 2.5.5b2 — WAQI, deuxième source pour l’air

- Nouvelle source de qualité de l’air au choix, à côté d’Atmo France : **WAQI** (intégration « World Air Quality Index » de Home Assistant, jeton gratuit sur aqicn.org).
- Aujourd’hui : la mesure de la station choisie, ramenée à l’indice de 1 à 6 d’Atmo.
- Demain : la prévision Open-Meteo (modèle européen Copernicus), sans clé. Elle n’est demandée qu’avec WAQI, à la position de la maison.
- La carte, le panneau Niak et le capteur Qualité de l’air disent d’où vient l’air : « WAQI » ou « Open-Meteo ».
- Une station qui ne répond plus s’affiche « Indisponible » : aucun relais automatique.

## 2.5.2 — Formulaires harmonisés

- Les rubriques Weather reprennent les composants de Confort : réglages regroupés par sujet, mêmes titres et espacements, aides nommées en info-bulles.
- Les prévisions, alertes, mesures principales, sources d’air et de pollens et familles d’entités restent visibles. Les détails avancés gardent un repli.
- Les réglages généraux de Confort utilisent des lignes ouvertes à l’intérieur des groupes, sans cadre supplémentaire pour chaque capteur.

## 2.5.1 — Affichage du hub

- L’accueil et le menu occupent toute la hauteur disponible dans Home Assistant, y compris lorsque seule une brique est à jour.
- Le menu de configuration d’une pièce s’aligne sur toute la largeur du formulaire.
- Dans Accueil Niak → Réglages, choix mémorisé entre les couleurs et la police du thème Home Assistant et la palette Niak. Niak conserve le suivi du mode clair ou sombre de Home Assistant.
- La section Affichage reste toujours visible, sans repli.

## 2.5.0 — Le nouveau hub Niak

- Menu latéral regroupé par brique, avec accès direct aux sources météo, à la station, à la qualité de l’air, aux pollens et aux entités.
- Vue d’ensemble des lieux configurés et bouton Configurer pour chacun.
- Interface harmonisée en clair et sombre, adaptée au téléphone ; aides nommées en info-bulles, recommandations et erreurs visibles.
- Choix et brouillons conservés pendant la navigation. Weather reste utilisable seul ; les briques absentes ne créent pas de menus inutiles.
- Préférence pour masquer l’entrée Niak dans le menu Home Assistant, en gardant l’accès aux réglages par l’intégration.

Les sources, paramètres, entités et données existantes sont conservés. Après mise à jour HACS, redémarrez Home Assistant.
