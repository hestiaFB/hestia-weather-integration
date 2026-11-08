## À venir

### Nouveautés

- Hestia Énergie peut lire les degrés-jours de chauffage et de climatisation, passés et prévus.
- Nouvelle carte à la pièce « Événements » : la frise des prochaines heures, seule, pour les petits écrans (#15).
- Records en entités (#16) : chaleur, froid, rafale et pluie en un jour, avec l’année et le mois en attributs. Deux sources à part : votre station, et le lieu depuis 1940 (Open-Meteo).
- Jours de gel, jours chauds (30 °C et plus), nuits tropicales (20 °C et plus) et jours de vigilance canicule, cette année et ce mois.

### Améliorations

- Emplacement de la station : une seule rose pour la maison et le vent. Placer la maison suffit, son côté compte toujours comme gêné pour le vent.
- En France, l’entité Canicule suit la vigilance de Météo-France : orange = canicule, rouge = canicule extrême.

## 3.2.1 — Prête pour la liste officielle du Marketplace

### Améliorations

- Hestia Weather se range dans la catégorie « Météo et alertes » du Marketplace.
- Mise à jour refusée pour changement de nom (« changed its domain… ») : un guide pas à pas, lié depuis le README, explique quoi faire sans rien perdre.

### Corrections

- La réparation « Reprendre les mises à jour » respecte les règles de Home Assistant.

## 3.2.0 — Le nom Hestia, une nouvelle carte, une station mieux comprise, et bien plus léger

### Avant de mettre à jour

- Vous êtes en 2.9.x : installez d’abord la **2.9.9**. Elle fait passer toute votre maison au nom Hestia, sans rien perdre. Redémarrez quand Home Assistant le demande, puis installez cette version.
- Home Assistant 2026.11 : une réparation « Reprendre les mises à jour » apparaît après la 2.9.9. Appuyez sur Réparer.
- Le Marketplace affiche « changed its domain… uninstall it and install it again » ? Vous n’êtes pas passé par la 2.9.9 : ne désinstallez rien. Dans le Marketplace, ouvrez Hestia Weather, téléchargez la version **2.9.9**, redémarrez, puis suivez les étapes ci-dessus.
- Hestia Confort 1.7.30 reste relié à cette version. Hestia Confort 2 suivra.
- Si une réparation liste des lignes YAML écrites à la main, remplacez-y l’ancien nom.

### Nouveautés

- Le nom technique devient `hestia_weather`. Vos lieux, réglages, alertes, historiques et statistiques sont gardés, comme le nom, la pièce et l’icône de vos entités.
- Automatisations, scripts, scènes, tableaux de bord et blueprints faits dans l’interface suivent tout seuls.
- Hestia Weather parle allemand : carte, bulletin du jour, panneau et hub Hestia.
- Une nouvelle carte : la frise du temps prévu avec ses évènements, la vigilance dans le bandeau et sur la frise.
- Ressenti : la valeur, un mot, l’échelle de la saison et ce qui joue (vent, humidité, soleil, rosée).
- Air extérieur et pollens : aujourd’hui et demain.
- Un « i » à côté de chaque bloc dit d’où viennent ses données.
- Où est votre station ? Sept questions simples (côté de la maison, mur, hauteur, sol, soleil, pluviomètre, vent), ouvertes d’un appui depuis la Vue d’ensemble.
- Une station mal placée (contre un mur au soleil, sur un toit) ne fausse plus la carte : Hestia apprend chaque nuit son écart avec la prévision et corrige seulement la température.
- L’ombre sur votre station (une maison, un arbre) est apprise chaque nuit sur les trois derniers mois. Vous pouvez aussi la donner tout de suite : le matin ou l’après-midi.
- Nouvelle page État › Fiabilité de la station : ce que vaut chaque mesure.
- Les pollens, l’ombre et la fiabilité de la station sont partagés avec Hestia Confort 2.
- Les extensions trouvées chez vous se demandent en un clic.
- Le panneau a une page « À propos ».

### Améliorations

- Hestia Weather est bien plus léger : Home Assistant ne se fige plus pendant ses calculs, même sur un petit boîtier.
- Le tableau de bord travaille moins : une seule mise à jour pour toutes les cartes d’une page, et seulement ce qui a changé.
- La carte et le panneau se chargent plus vite, surtout sur l’appli mobile.
- Le panneau Hestia répond plus vite quand on ouvre un lieu ou change un réglage.
- Hestia Weather ne ralentit plus le démarrage de Home Assistant.
- Le hub s’appelle « Hestia-FB » dans le menu de Home Assistant.
- Sur téléphone, le bandeau ressemble à la tuile, et le ciel reste bien visible.
- Un texte trop long (vigilance, évènements, alertes de la station) défile au lieu d’être coupé.
- La carte prend la police, les pièces et les tailles de texte communes à toutes les briques Hestia.
- Les animations s’arrêtent quand la carte n’est pas à l’écran.
- L’onglet Station s’ouvre bien plus vite.

### Corrections

- Le panneau Hestia ne reste plus vide quand une brique garde un fichier d’une autre version (issue #48).
- Une bulle d’aide ne se referme plus toute seule pendant qu’on la lit.
- Thème sombre : bulletin, frise et échelle plus lisibles.
- La tuile ne dépasse plus de l’écran d’un téléphone.
- Deux cartes sur une même page ne mélangent plus leurs graphiques.

## 3.1.0 — Le nom Hestia, une nouvelle carte, et l’allemand

### Avant de mettre à jour

- Vous êtes en 2.9.x : installez d’abord la **2.9.9**. Elle fait passer toute votre maison au nom Hestia, sans rien perdre. Redémarrez quand Home Assistant le demande.
- Home Assistant 2026.11 : une réparation « Reprendre les mises à jour » apparaît ensuite. Appuyez sur Réparer.
- Le Marketplace affiche « changed its domain… uninstall it and install it again » ? Vous n’êtes pas passé par la 2.9.9 : ne désinstallez rien. Dans le Marketplace, ouvrez Hestia Weather, téléchargez la version **2.9.9**, redémarrez, puis suivez les étapes ci-dessus.
- Hestia Confort 1.7.30 reste relié à cette version. Hestia Confort 2 suivra.
- Si une réparation liste des lignes YAML écrites à la main, remplacez-y l’ancien nom.

### Nouveautés

- Le nom technique devient `hestia_weather`. Vos lieux, réglages, alertes, historiques et statistiques sont gardés, comme le nom, la pièce et l’icône de vos entités.
- Automatisations, scripts, scènes, tableaux de bord et blueprints faits dans l’interface suivent tout seuls.
- Hestia Weather parle allemand : carte, bulletin du jour, panneau et hub Hestia.
- Une nouvelle carte : la frise du temps prévu avec ses évènements, la vigilance dans le bandeau et sur la frise.
- Ressenti : la valeur, un mot, l’échelle de la saison et ce qui joue (vent, humidité, soleil, rosée).
- Air extérieur et pollens : aujourd’hui et demain.
- Un « i » à côté de chaque bloc dit d’où viennent ses données.
- Les pollens du jour sont partagés avec Hestia Confort 2.
- Les extensions trouvées chez vous se demandent en un clic.
- Le panneau a une page « À propos ».

### Améliorations

- Sur téléphone, le bandeau ressemble à la tuile, et le ciel reste bien visible.
- Un texte trop long (vigilance, évènements, alertes de la station) défile au lieu d’être coupé.
- La carte prend la police, les pièces et les tailles de texte communes à toutes les briques Hestia.
- Les animations s’arrêtent quand la carte n’est pas à l’écran.
- L’onglet Station s’ouvre bien plus vite.

### Corrections

- Le panneau Hestia ne reste plus vide quand une brique garde un fichier d’une autre version (issue #48).
- Thème sombre : bulletin, frise et échelle plus lisibles.
- La tuile ne dépasse plus de l’écran d’un téléphone.
- Deux cartes sur une même page ne mélangent plus leurs graphiques.

## 3.1.0b9 — Bêta : les textes longs défilent

### Avant de mettre à jour

- Gardez Hestia Confort 2.1.0b8, si vous l’avez.

### Améliorations

- Vigilance : un message trop long défile lentement au lieu d’être coupé. La pastille prend toute la largeur.
- Événements et alertes de la station : une phrase trop longue défile, et reste affichée le temps d’être lue en entier.
- Hestia Confort 1.7, pas encore mis à jour, reste relié à Hestia Weather.

### Corrections

- Home Assistant 2026.11 : quand le Marketplace ne suit plus Hestia Weather après le passage au nom Hestia, une réparation « Reprendre les mises à jour » le règle en un appui.

## 3.1.0b8 — Bêta : le cadre du moment collé en haut

### Avant de mettre à jour

- Gardez Hestia Confort 2.1.0b8, si vous l’avez.

### Améliorations

- Le cadre du temps du moment est collé en haut de la carte, sur téléphone comme sur tablette et ordinateur : il laisse plus de ciel visible sous lui.
- Les chiffres sont bien au centre de ce cadre.

### Corrections

- Thème sombre : l’heure de la frise et la bulle de l’échelle sont plus lisibles, leur fond est un peu plus foncé.

## 3.1.0b7 — Bêta : un ciel plus grand sur la tuile

### Avant de mettre à jour

- Gardez Hestia Confort 2.1.0b8, si vous l’avez.

### Améliorations

- Tuile : l’animation du ciel est plus grande, en pleine largeur comme sur téléphone.

## 3.1.0b6 — Bêta : le ciel bien visible et des textes harmonisés

### Avant de mettre à jour

- Gardez Hestia Confort 2.1.0b8, si vous l’avez.

### Améliorations

- Sur téléphone, le temps du moment passe sous « Bulletin du jour » : le cadre ne garde que les chiffres et laisse voir le ciel.
- Sur téléphone, le voile sous le bulletin est plus léger et sans bord : l’animation du ciel reste visible.
- Ressenti : un trait fin marque la température réelle sur l’échelle, pour voir d’un coup d’œil l’écart avec le ressenti.
- La carte et le panneau Hestia suivent l’échelle de textes commune aux briques Hestia : sept tailles, la même hiérarchie partout.

## 3.1.0b5 — Bêta : la carte sur téléphone

### Avant de mettre à jour

- Gardez Hestia Confort 2.1.0b8, si vous l’avez.

### Améliorations

- Sur téléphone, le bandeau ressemble à la tuile : le titre à gauche, le temps du moment dans un petit cadre à droite, le soleil bien visible entre les deux.
- Le bulletin du jour reste lisible en thème sombre, quel que soit le ciel.

### Corrections

- La tuile ne dépasse plus de l’écran d’un téléphone quand le bandeau défilant a beaucoup de points.
- La pluie des 7 prochains jours se lit mieux en thème clair.
- Deux cartes sur une même page ne mélangent plus les dégradés de leurs graphiques et de leur ciel.

## 3.1.0b4 — Bêta : une nouvelle carte et la page « À propos »

### Avant de mettre à jour

- Gardez Hestia Confort 2.1.0b8, si vous l’avez.
- La carte change d’allure : regardez-la après la mise à jour et dites-nous ce qui vous gêne.

### Nouveautés

- La frise : le temps prévu dans la piste, un tronçon par temps, les évènements en bulles au-dessus. Plusieurs évènements au même moment tiennent dans une seule bulle.
- Vigilance Météo-France : une pastille dans le bandeau et une bande de sa couleur sur la frise, jusqu’à sa fin.
- Ressenti : la valeur et un mot, l’échelle de la saison, et 4 cases qui disent ce qui joue (vent, humidité, soleil, rosée). Il remplace le bloc Conditions.
- Air extérieur et Pollens : un onglet Aujourd’hui et un onglet Demain.
- Un « i » à côté du titre de chaque bloc dit d’où viennent ses données.
- Le panneau a une page « À propos » : les versions, comment ajouter la carte, la page du projet, signaler un problème, les versions publiées.

### Améliorations

- La carte prend la police et les pièces communes à toutes les cartes Hestia.
- Les animations s’arrêtent quand la carte n’est pas à l’écran.
- Le menu n’a plus d’entrée « Réglages » : le renommage des entités est dans la Vue d’ensemble tant qu’il reste à faire, puis dans « À propos ».
- L’onglet Station d’un lieu s’ouvre bien plus vite quand Home Assistant a beaucoup d’entités.
- Le menu replie les autres briques ; sur téléphone, il s’ouvre et se ferme en glissant.

### Corrections

- Le panneau Hestia ne reste plus vide quand une brique garde un fichier d’une autre version (Hestia Confort, issue #48).

## 3.1.0b3 — Bêta : le vent, la pression et l’orage à venir

### Avant de mettre à jour

- Gardez Hestia Confort 2.1.0b8, si vous l’avez.
- Vous venez de la 2.9.x ? Le passage au nom Hestia se fait comme avec la 3.0.0b2 : voir ses notes. Vous retrouvez tout ce que la 2.9.8 a apporté.

### Nouveautés

- Dans la frise : « Vent fort dans environ 3 h : rafales à 65 km/h », dès 30 km/h de vent moyen ou 40 km/h en rafales prévus dans les 6 heures. Rien de plus si le vent fort souffle déjà.
- Dans la frise : « La pression va baisser : −7 hPa en 6 h », dès 4 hPa d’écart prévus.
- Carte Vent, bloc « À venir » : le vent et les rafales les plus forts des 6 heures, et l’heure où le vent fort commence.
- Carte Pression, bloc « À venir » : la pression des 6 heures et son écart.
- Carte Éclairs, bloc « À venir » : un orage prévu dans les 6 heures, ou « Pas d’orage prévu d’ici 6 h ».
- Open-Meteo, service météo gratuit et sans compte, donne la pression à venir quand votre service météo ne la prévoit pas. Il reçoit la position de la maison, arrondie à environ 100 m. Dans Extensions, rubrique Sources météo, un interrupteur le coupe pour chaque lieu ; le bloc Pression « À venir » reste alors caché.

### Améliorations

- La frise garde jusqu’à 8 évènements à venir au lieu de 5, les plus importants d’abord.
- Une carte dont vous aviez déjà choisi le contenu le garde : cochez « À venir » dans ses réglages pour l’ajouter.
- Ces nouveautés parlent aussi allemand et anglais.

## 3.1.0b2 — Bêta : les pollens pour Hestia Confort

**En bref**

- **Les pollens pour Hestia Confort** : Confort lit les pollens du jour de la source choisie dans Hestia Weather.
- **Demander une extension en un clic** : Vigicrues, Meteoalarm ou Pirate Weather trouvés chez vous se demandent avec un formulaire déjà rempli.

### Avant de mettre à jour

- Mettez à jour Hestia Confort en même temps (2.1.0b2), si vous l’avez.

### Nouveautés

- Les pollens du jour et de demain sont partagés avec Hestia Confort, quelle que soit leur source.
- Dans Extensions, les intégrations trouvées mais pas encore lues, avec un bouton pour les demander.

## 3.1.0b1 — Bêta : Hestia Weather en allemand

**En bref**

- **Hestia Weather parle allemand** : carte, bulletin du jour, panneau de réglages et fenêtres de configuration, quand Home Assistant est en allemand.
- **Le hub Hestia aussi** : le menu, l’accueil et les réglages communs.

### Avant de mettre à jour

- Vous venez de la 2.9.x ? Le passage au nom Hestia se fait comme avec la 3.0.0b2 : voir ses notes.
- Mettez à jour Hestia Confort en même temps (2.1.0b1), si vous l’avez.

### Nouveautés

- La carte, ses formats et son bulletin du jour en allemand.
- Les alertes, les évènements et les mesures en allemand.
- Le panneau de réglages, les fenêtres d’installation et le nom des entités en allemand.
- Le menu, l’accueil et les réglages du hub Hestia en allemand.
- Un guide explique comment ajouter une langue (docs/traductions.md).
- Une langue sans traduction s’affiche toujours en anglais.

## 3.0.0b2 — Bêta : le passage au nom Hestia, suivi pas à pas

**En bref**

- **Le passage au nom Hestia se suit dans le hub** : un encart dans Hestia → Accueil montre chaque étape, puis s’en va quand tout est fait.
- **La 3.0.0b1 ne démarrait pas après la mise à jour** : c’est corrigé.

### Avant de mettre à jour

- Mettez à jour Hestia Confort en même temps (2.0.0b2), si vous l’avez.
- Avec Hestia Weather 2.9.7 installée avant, tout démarre seul au redémarrage.
- Sinon, après le redémarrage : **Paramètres → Ajouter une intégration → Hestia Weather**. Votre installation est reprise, rien n’est créé en double.
- Si HACS affiche « No manifest.json file found », redémarrez Home Assistant puis relancez la mise à jour.

### Nouveautés

- L’encart « Passage au nom Hestia » dit ce qui a été repris : lieux, entités, tableaux de bord et automatisations.
- Il liste les lignes à changer à la main, s’il y en a.
- Il propose de redémarrer Home Assistant quand il le faut, en un bouton.
- Le nom des entités y est aussi : gardé ou renommé, et où le changer.
- Un clic sur « J’ai compris » le ferme pour de bon.

### Corrections

- « Ajouter une intégration » reprend maintenant l’installation existante au lieu d’en créer une nouvelle.
- Hestia Weather démarre Hestia Confort quand il le faut, et l’inverse : un seul geste suffit pour les deux.

## 3.0.0b1 — Bêta : le nom technique devient hestia_weather

**En bref**

- **Hestia Weather prend son nom technique Hestia : `hestia_weather`.** Au premier démarrage, votre installation passe seule au nouveau nom.
- **Rien n’est perdu** : vos lieux, réglages, alertes en cours, historiques et statistiques restent, comme le nom, la pièce et l’icône de vos entités.

### Avant de mettre à jour

- Mettez à jour Hestia Confort en même temps (2.0.0b1), si vous l’avez.
- Après le redémarrage, une réparation peut demander un second redémarrage : faites-le.
- Si une réparation « quelques lignes à changer à la main » apparaît, elle liste les fichiers YAML et les lignes où remplacer l’ancien nom.

### Améliorations

- Les automatisations, scripts, scènes, tableaux de bord et blueprints faits dans l’interface sont mis à jour tout seuls.
- L’action devient `hestia_weather.prevision`, la carte `custom:hestia-weather-card`, l’évènement d’alerte `hestia_weather_alerte`.
- L’évènement d’alerte est encore envoyé sous son nom d’origine, pour les automatisations écrites à la main.
- L’ancienne adresse du panneau mène toujours à `/hestia`.
- Les variables de thème s’appellent `hestia-…-color`.

## 2.9.6 — Préversion : renommer ses entités en hestia_weather

**En bref**

- **Vos entités peuvent prendre le nom Hestia**, si vous le voulez : une installation dont les entités portent encore le nom technique d’origine peut les renommer `hestia_weather_…` depuis le panneau, puis revenir en arrière.

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

- Les noms Hestia existent à côté des anciens : la carte, l’évènement d’alerte `hestia_weather_alerte` et les variables de thème `hestia-…-color`. Les noms techniques d’origine continuent de marcher.
- Une installation dont les entités portent le nom technique d’origine les garde : vos automatisations et tableaux de bord ne bougent pas.
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

## 2.9.3 — Stable : le nouveau nom, Hestia Weather

**En bref**

- **Le projet prend le nom Hestia Weather.** Le nom change partout : carte, panneau, textes, traductions et documentation.
- **Rien à refaire de votre côté.** Mêmes entités, mêmes réglages, mêmes cartes, même adresse du panneau.

### Améliorations

- Nouveau logo du hub : un H à la place du N.
- Dans « Ajouter une carte », les cartes s’appellent maintenant « Hestia - Météo », « Hestia - À la pièce » et « Hestia - Petite carte ».
- Les noms techniques d’origine ne changent pas, pour ne rien casser chez vous.

## 2.9.1 — Stable : un bloc coché se range à sa place

### Corrections

- Dans les réglages de la carte, un bloc qu’on coche se range à sa place habituelle, et non plus tout en bas. Par exemple, les éclairs cochés se placent juste après la pression, à côté de la pluie et du vent.

## 2.9.0 — Stable : Hestia Weather en anglais, cartes à la pièce et radar des éclairs

**En bref**

- **Hestia Weather parle anglais** : la carte s’affiche en anglais quand Home Assistant n’est pas en français. Une première pour les utilisateurs hors de France.
- **Cartes à la pièce** : ressenti, pluie, vent, pression, éclairs, air et pollens, prévisions. Chacune se pose seule sur un tableau de bord.
- **Radar des éclairs** avec Blitzortung : les éclairs de la dernière heure autour de la maison.
- **Réglages → Extensions**, comme dans Hestia Confort : la liaison avec Hestia Confort et chaque intégration utilisée, au même endroit.

### Nouveautés

- **En anglais** : la carte, le bulletin du jour, les événements, les mesures et les prévisions.
- Chaque utilisateur voit la carte dans la langue de son profil Home Assistant : français pour l’un, anglais pour l’autre, sur le même tableau de bord.
- Les nombres et les heures s’écrivent à la manière de la langue : 8.5 et 14:00 en anglais.
- Les capteurs et les réglages restent en français pour l’instant.
- Cartes à la pièce : chacune montre les parties que vous cochez.
- Radar des éclairs : l’éclair le plus proche, le niveau (calme, secteur, proche, sur vous), le nombre d’éclairs de l’heure, des 10 dernières minutes et du mois.
- Dans la carte complète, les éclairs se rangent à côté de la pluie, du vent et de la pression. La carte seule peut se cacher quand il n’y a pas d’orage.
- Onglet Extensions : Hestia Confort se relie ou se coupe d’un interrupteur. Coupé d’un côté, il l’est aussi de l’autre.
- Onglet Extensions : chaque intégration (Météo-France, Atmo France, WAQI, Vigieau, Blitzortung, pollens) montre si elle est installée, à quoi elle sert pour ce lieu, et s’allume ou s’éteint d’un interrupteur.

### Améliorations

- Réglages de la carte en deux temps : le type de carte, puis le format.
- « Ajouter une carte » propose trois entrées : Hestia - Météo, Hestia - À la pièce, Hestia - Petite carte.
- Pendant son chargement, la carte se dessine en lignes grises balayées de lumière.

### Corrections

- Une baisse passagère du compteur de pluie de la station n’est plus comptée comme de la pluie (issue #9).

## 2.9.0b1 — Bêta : Hestia Weather en anglais

**La carte parle la langue de Home Assistant : français, ou anglais pour toutes les autres langues.**

### Nouveautés

- La carte, le bulletin du jour, les événements, les mesures et les prévisions s’affichent en anglais quand Home Assistant n’est pas en français.
- Chaque utilisateur voit la carte dans la langue de son profil Home Assistant.
- Les nombres et les heures s’écrivent à la manière de la langue choisie : 8.5 et 14:00 en anglais.
- Les capteurs et le panneau de réglages restent en français pour l’instant.

## 2.8.3 — Stable : barres de pluie sur 24 h et 30 jours

- Les barres de pluie sur 24 heures et 30 jours s’affichent même quand la station démarre après Hestia Weather : elles restaient sur 7 jours.
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
- Menu à icônes conforme à Hestia Confort et cadres lisibles avec les thèmes Home Assistant, notamment Nordic.
- Choix conservés entre les onglets et anciens liens compatibles.

Cette version stable reprend la bêta 2.8.0b4 validée, sans changement fonctionnel supplémentaire.

## 2.8.0b4 — Bêta : réglages par sujet

- L’onglet Extensions est supprimé : les intégrations d’air et de pollens se règlent dans leurs onglets, Vigieau dans Eau et jardin, Blitzortung dans Sources météo.
- Météo-France est identifié dans Sources météo, avec son état d’installation et sa sélection enregistrée pour le lieu.
- Le menu de configuration reprend les deux rangées arrondies à icônes de Hestia Confort.
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

- **L’orage vu, pas seulement prévu.** Avec l’intégration Blitzortung, Hestia Weather voit les éclairs autour de chez vous : à moins de 30 km, le capteur Orage s’allume et dit où est l’orage et s’il se rapproche.
- **Les restrictions d’eau de votre commune.** Avec l’intégration Vigieau, un nouveau capteur « Restrictions d’eau » (famille Jardin) donne le niveau de l’arrêté sécheresse.

### Nouveautés

- Éclairs à moins de 30 km : le capteur Orage s’allume, même sans orage prévu. « Orage à 12 km au sud-ouest, il se rapproche ». Distance, direction et tendance en attributs.
- Éclairs à moins de 10 km : le temps du moment et le ciel animé passent à « Orage ».
- Un orage plus lointain est signalé pour information, sans alerte.
- Capteur « Restrictions d’eau » : pas de restriction, vigilance, alerte, alerte renforcée ou crise ; usages restreints et lien de l’arrêté en attributs.
- Dès le niveau « Alerte », la carte et la synthèse le disent, en précisant si l’arrosage est restreint.
- Les autres briques Hestia reçoivent les éclairs et les restrictions d’eau.

### Améliorations

- Vigieau et Blitzortung se choisissent dans l’étape Sources météo ; Hestia les trouve seul quand il n’y a qu’un choix (pour Vigieau, la zone de l’eau du robinet).

## 2.6.3 — Stable : la couverture nuageuse partagée

**En bref**

- **La couverture nuageuse est partagée avec les autres briques Hestia.** Hestia Confort s’en sert pour estimer le soleil quand votre station est à l’ombre.

### Nouveautés

- La prévision heure par heure transmise aux autres briques donne aussi la couverture nuageuse (en %), quand le service météo la fournit.

## 2.6.2 — Stable : la saison partagée

**En bref**

- **La saison est partagée avec les autres briques Hestia.** Hestia Confort s’en sert pour adapter ses conseils à l’été, à l’hiver et aux entre-saisons.

### Nouveautés

- Les autres briques Hestia reçoivent la saison affichée par Hestia Weather : celle de votre capteur Saison s’il est choisi, sinon celle du calendrier, avec la durée du jour.

## 2.6.1 — Stable : la pluie à la minute

**En bref**
- **« Pluie dans » donne enfin le temps qui reste**, à la minute près grâce à la pluie dans l’heure de Météo-France.

### Améliorations
- Le capteur « Pluie dans » donnait le numéro du créneau horaire (0 voulait dire « quelque part dans ce créneau »). Il donne maintenant le temps qui reste, en heures avec une décimale ; ses attributs disent aussi les minutes et d’où vient l’information (radar ou prévision).
- Quand la pluie dans l’heure de Météo-France ne voit rien tomber, la pluie de la prévision horaire est repoussée après cette heure sèche.

### Nouveautés
- Les autres briques Hestia (Hestia Confort) reçoivent l’heure de la prochaine pluie.

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

- Nouveau capteur **Bulletin du jour** (`sensor.hestia_weather_bulletin_du_jour`) : le texte de la prévision, prêt à lire sur une enceinte ou à envoyer en notification. Le texte entier et chaque moment de la journée sont aussi en attributs.
- Correction : sans pluviomètre, une humidité de 99 % ne fait plus afficher « Brouillard » quand le bulletin annonce de la pluie ou de la neige. Un pluviomètre qui ne mesure rien garde le brouillard.

## 2.5.5b2 — WAQI, deuxième source pour l’air

- Nouvelle source de qualité de l’air au choix, à côté d’Atmo France : **WAQI** (intégration « World Air Quality Index » de Home Assistant, jeton gratuit sur aqicn.org).
- Aujourd’hui : la mesure de la station choisie, ramenée à l’indice de 1 à 6 d’Atmo.
- Demain : la prévision Open-Meteo (modèle européen Copernicus), sans clé. Elle n’est demandée qu’avec WAQI, à la position de la maison.
- La carte, le panneau Hestia et le capteur Qualité de l’air disent d’où vient l’air : « WAQI » ou « Open-Meteo ».
- Une station qui ne répond plus s’affiche « Indisponible » : aucun relais automatique.

## 2.5.2 — Formulaires harmonisés

- Les rubriques Weather reprennent les composants de Confort : réglages regroupés par sujet, mêmes titres et espacements, aides nommées en info-bulles.
- Les prévisions, alertes, mesures principales, sources d’air et de pollens et familles d’entités restent visibles. Les détails avancés gardent un repli.
- Les réglages généraux de Confort utilisent des lignes ouvertes à l’intérieur des groupes, sans cadre supplémentaire pour chaque capteur.

## 2.5.1 — Affichage du hub

- L’accueil et le menu occupent toute la hauteur disponible dans Home Assistant, y compris lorsque seule une brique est à jour.
- Le menu de configuration d’une pièce s’aligne sur toute la largeur du formulaire.
- Dans Accueil Hestia → Réglages, choix mémorisé entre les couleurs et la police du thème Home Assistant et la palette Hestia. Hestia conserve le suivi du mode clair ou sombre de Home Assistant.
- La section Affichage reste toujours visible, sans repli.

## 2.5.0 — Le nouveau hub Hestia

- Menu latéral regroupé par brique, avec accès direct aux sources météo, à la station, à la qualité de l’air, aux pollens et aux entités.
- Vue d’ensemble des lieux configurés et bouton Configurer pour chacun.
- Interface harmonisée en clair et sombre, adaptée au téléphone ; aides nommées en info-bulles, recommandations et erreurs visibles.
- Choix et brouillons conservés pendant la navigation. Weather reste utilisable seul ; les briques absentes ne créent pas de menus inutiles.
- Préférence pour masquer l’entrée Hestia dans le menu Home Assistant, en gardant l’accès aux réglages par l’intégration.

Les sources, paramètres, entités et données existantes sont conservés. Après mise à jour HACS, redémarrez Home Assistant.
