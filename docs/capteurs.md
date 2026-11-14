# Les capteurs et les automatisations

[Accueil](../README.md) · [Le ressenti](ressenti.md) · [La synthèse et les alertes](synthese.md) · [Le bulletin du jour](bulletin.md) · [Sources et réglages](sources.md) · [Pluie, vent, pression](mesures.md) · [Fonctionnement technique](technique.md)

Hestia Weather dit **ce que la météo implique** ; chaque maison décide quoi en faire. Arrosage, chauffage, volets, notifications : tous lisent les mêmes valeurs.

Il y a cinq façons de s’en servir :

| | Pour quoi |
| --- | --- |
| **Des capteurs** | Des valeurs avec leur unité, à lire directement : `sensor.hestia_weather_pluie_6h`. |
| **Des oui/non** | Prêts à servir de déclencheur ou de condition : `binary_sensor.hestia_weather_gel`. |
| **Un évènement d’alerte** | À chaque alerte qui commence, change ou finit : `hestia_weather_alerte`. Une seule automatisation suffit pour toutes les notifications. |
| **Une action qui répond** | « Quel temps entre 16 h 15 et 17 h ? » : `hestia_weather.prevision`. |
| **Une entité météo** · *à activer* | Le temps vu par votre station, avec les prévisions du fournisseur : `weather.hestia_weather`. |

## Les mêmes attributs partout

| Attribut | Ce qu’il dit |
| --- | --- |
| `raison` | La phrase qui explique la valeur : « Rafales mesurées à 68 km/h ». |
| `source` | D’où vient la valeur : `station`, `bulletin`, `prevision`, `vigilance` ou `atmo`. |
| `debut`, `fin` | Quand cela commence et finit, quand c’est connu. |
| `partiel` | `true` si une partie des données manquait. Un total peut alors être plus élevé. |
| `niveau` | Pour une alerte : 1 à surveiller, 2 sérieux, 3 vigilance rouge. |

Une donnée manquante donne **inconnu**, jamais « pas de pluie » ou « pas d’alerte ».

Les entités marquées « à activer » existent mais sont désactivées au départ. Pour en activer : panneau **Hestia-FB → Météo → Réglages généraux**, **Modifier** le lieu, étape **Entités**. Tout y est rangé par famille, et l’écran dit ce qui manque à certaines (un capteur UV, Atmo France…). À la première installation, les familles choisies décident de ce qui est activé.

## Maintenant

Ce qui se passe chez vous, mesuré par la station (sinon le bulletin).

| Entité | Ce qu’elle donne | Exemple d’usage |
| --- | --- | --- |
| `sensor.hestia_weather_ressenti` | La température ressentie, ses causes en attributs | Consigne de confort, déclencheur chaleur ou froid |
| `sensor.hestia_weather_point_de_rosee` | Le point de rosée | Savoir si aérer assèche ou humidifie |
| `sensor.hestia_weather_point_de_givre` | Le point de givre | Prévoir la gelée blanche |
| `sensor.hestia_weather_humidex` | L’humidex, toujours renseigné | Remplace Thermal Comfort |
| `sensor.hestia_weather_temps_observe` | Le temps chez vous : la pluie mesurée passe devant le bulletin | Affichage, scénario d’éclairage |
| `binary_sensor.hestia_weather_pluie_en_cours` | Il pleut en ce moment | Fermer un velux, rentrer le linge |
| `binary_sensor.hestia_weather_brouillard` · *à activer* | Brouillard observé, annoncé ou probable cette nuit | Prudence sur la route le matin |
| `sensor.hestia_weather_tendance_pression` | L’écart de pression sur 3 h | Annoncer un changement de temps |
| `sensor.hestia_weather_tendance_temperature` | La température monte ou baisse, en °C par heure | Fermer avant le coup de chaud |
| `sensor.hestia_weather_pluie_24h` | La pluie tombée sur 24 h | Suivi du jardin |
| `sensor.hestia_weather_rafale_max_jour` | La plus forte rafale du jour | Suivi, inspection après un coup de vent |

## Alertes

Des oui/non prêts à déclencher, et la vigilance officielle. Une alerte s’allume tout de suite. Elle ne s’éteint qu’après **15 minutes** sans être observée, pour qu’une rafale autour du seuil n’envoie pas dix messages. La vigilance s’éteint dès que Météo-France la lève.

| Entité | S’allume quand | Exemple d’usage |
| --- | --- | --- |
| `sensor.hestia_weather_vigilance` | Verte, jaune, orange ou rouge, avec les phénomènes en attribut | Le niveau officiel dans une notification |
| `sensor.hestia_weather_alerte` | La situation la plus marquante, en un mot | Un badge, une couleur de tableau de bord |
| `sensor.hestia_weather_en_bref` | Le titre de la synthèse ; le texte et le bulletin du jour en attributs | Le résumé du matin |
| `binary_sensor.hestia_weather_orage` | Orage ou grêle en cours ou prévu dans les 6 h ; avec Blitzortung, des éclairs à moins de 30 km (distance, direction et tendance en attributs) | Débrancher, abriter le robot tondeuse |
| `binary_sensor.hestia_weather_vent_fort` | Vent ≥ 30 km/h ou rafales ≥ 40 km/h | Rentrer les stores et le parasol |
| `binary_sensor.hestia_weather_pluie_forte` | ≥ 4 mm/h mesurés, ou forte pluie prévue dans les 6 h | Surveiller gouttières et pompe de relevage |
| `binary_sensor.hestia_weather_gel` | Gel mesuré, ou gel au sol possible cette nuit (≤ 3 °C prévus) | Rentrer les plantes, hors-gel |
| `binary_sensor.hestia_weather_neige` | Risque de neige estimé dans les 24 h, d’après les prévisions ; l’attribut `tient_au_sol` dit si elle peut tenir (≤ 1 °C prévus) | Sortir la pelle, prévoir les pneus neige |
| `binary_sensor.hestia_weather_verglas` | Risque de verglas estimé dans les 18 h : pluie verglaçante, regel d’une route mouillée, neige sur route froide, brouillard givrant, ou vigilance neige-verglas. Niveau 1 = risque, 2 = risque fort ; la cause en attribut (`cause`). C’est une estimation d’après l’air, pas une mesure de la route | Se lever plus tôt, partir prudemment |
| `binary_sensor.hestia_weather_canicule` | En France, la vigilance canicule de Météo-France : orange = canicule, rouge = canicule extrême (niveau 3). Ailleurs : ressenti ≥ 34 °C, ou 35 °C prévus dans les 24 h ou demain | Fermer les volets côté soleil |
| `binary_sensor.hestia_weather_uv_fort` · *à activer* | Indice UV ≥ 6 (capteur UV nécessaire) | Rappel crème solaire |
| `sensor.hestia_weather_incendie_proche` · *à activer* | Le feu le plus proche signalé par PyroVeille : `aucun`, `eteint`, `signale` ou `actif` ; distance, direction et fumée vers la maison en attributs | Fermer les fenêtres quand la fumée arrive |
| `sensor.hestia_weather_riviere` · *à activer* | La rivière à la station Vigicrues proche, via CrueVeille (bêta) : `calme`, `a_surveiller`, `vigilance` ou `critique` ; hauteur et montée en attributs | Surélever ce qui craint au sous-sol |

## Prochaines heures

Les prévisions du fournisseur, résumées en chiffres utiles.

| Entité | Ce qu’elle donne | Exemple d’usage |
| --- | --- | --- |
| `sensor.hestia_weather_bulletin_du_jour` | Le bulletin du jour en toutes lettres ; le texte entier et chaque moment de la journée en attributs (`text`, `periods`) | Le lire sur une enceinte, l’envoyer chaque matin |
| `sensor.hestia_weather_pluie_dans` | Les heures avant la prochaine pluie | Lancer une tonte si la pluie est loin |
| `sensor.hestia_weather_pluie_heure` | La pluie prévue dans l’heure, en mm | Fermer avant l’averse |
| `sensor.hestia_weather_pluie_6h` | La pluie prévue sur 6 h | Seuil d’arrosage, récupérateur d’eau |
| `sensor.hestia_weather_pluie_24h_prevue` | La pluie prévue sur 24 h | Annuler l’arrosage du lendemain |
| `sensor.hestia_weather_minimale_nuit` | La température la plus basse d’ici demain 10 h, et son heure | Anticiper le chauffage, le hors-gel |
| `sensor.hestia_weather_maximale_demain` | La plus haute température de demain | Préparer la maison la veille |
| `sensor.hestia_weather_rafales_6h` · *à activer* | La plus forte rafale prévue sur 6 h | Un seuil à soi pour un store, une voile d’ombrage |

## Jardin

| Entité | Ce qu’elle donne | Exemple d’usage |
| --- | --- | --- |
| `sensor.hestia_weather_pluie_7j` · *à activer* | La pluie mesurée sur 7 jours, aujourd’hui compris | Alerte sécheresse |
| `sensor.hestia_weather_restrictions_eau` · *à activer* | Les restrictions d’eau de votre commune (Vigieau) : `aucune`, `vigilance`, `alerte`, `alerte_renforcee` ou `crise` ; les usages restreints et le lien de l’arrêté en attributs | Couper l’arrosage automatique en alerte |

L’évapotranspiration et le bilan hydrique arriveront avec le chantier de l’arrosage.

## Bâtiment

| Entité | Ce qu’elle donne | Exemple d’usage |
| --- | --- | --- |
| `sensor.hestia_weather_degres_jours_chauffe` · *à activer* | Les degrés-jours du jour (base 18 °C), ceux de demain en attribut | Anticiper la chauffe, estimer les granulés |
| `sensor.hestia_weather_degres_jours_clim` · *à activer* | Les degrés-jours de climatisation (base 22 °C) | Programmer la clim, la ventilation de nuit |

## Énergie

| Entité | Ce qu’elle donne | Exemple d’usage |
| --- | --- | --- |
| `sensor.hestia_weather_ensoleillement_demain` · *à activer* | La part de ciel dégagé demain en journée, en % | Chauffer l’eau au soleil, ou en heures creuses |

## Vie pratique

| Entité | Ce qu’elle donne | Exemple d’usage |
| --- | --- | --- |
| `sensor.hestia_weather_sechage_linge` · *à activer* | Excellent, bon, moyen, mauvais ou impossible, et jusqu’à quand | « Bon moment pour étendre » |
| `binary_sensor.hestia_weather_givre_pare_brise` · *à activer* | Givre attendu au plus froid de la nuit | Rappel la veille du trajet |
| `sensor.hestia_weather_qualite_air` · *à activer* | L’indice Atmo du jour (1 à 6), le polluant principal en attribut | Ne pas aérer, purificateur |
| `sensor.hestia_weather_pollens` · *à activer* | L’indice pollens du jour : Atmo (1 à 6), Polleninformation ou IRM KMI (0 à 4, l’échelle est en attribut) | Fermer les fenêtres, prévenir les allergiques |

## Records

Deux sources, affichées à part :

- **La station** : ce que vos capteurs ont mesuré chez vous, depuis leur installation (les statistiques de Home Assistant).
- **Le lieu** (`…_lieu`) : l’archive Open-Meteo depuis 1940, disponible dès le premier jour. Ses valeurs sont un peu adoucies (moyenne sur une zone d’une dizaine de km) : un record de chaleur y est souvent 1 à 2 °C sous celui d’une station.

Un record donne la valeur de tous les temps ; ceux de l’année et du mois sont en attributs. Exemple : `sensor.hestia_weather_record_chaleur` = 38,2 °C, avec `date` = 2003-08-12, `cette_annee` = 35,1 et `ce_mois` = 18,4.
Un compte de jours donne le nombre de cette année, celui du mois en attribut (`ce_mois`), et pour le lieu la moyenne des années complètes (`moyenne_par_an`).
Les journées comptent une fois finies : celle d’aujourd’hui entre demain.

| Entité | Ce qu’elle donne | Exemple d’usage |
| --- | --- | --- |
| `sensor.hestia_weather_record_chaleur` · *à activer* | La plus haute température mesurée, et sa date | Fêter un record, comparer les étés |
| `sensor.hestia_weather_record_froid` · *à activer* | La plus basse, et sa date | Protéger les plantes fragiles |
| `sensor.hestia_weather_record_rafale` · *à activer* | La plus forte rafale (km/h), et sa date | Vérifier le jardin après un coup de vent |
| `sensor.hestia_weather_record_pluie` · *à activer* | La plus forte pluie en une journée (mm), et sa date | Surveiller les gouttières |
| `sensor.hestia_weather_jours_gel` · *à activer* | Jours de gel cette année (minimale ≤ 0 °C) | Hiverner les plantes |
| `sensor.hestia_weather_jours_chauds` · *à activer* | Jours chauds cette année (maximale ≥ 30 °C) | Bilan de l’été |
| `sensor.hestia_weather_nuits_tropicales` · *à activer* | Nuits tropicales cette année (minimale ≥ 20 °C) | Ventiler la nuit |
| `sensor.hestia_weather_jours_canicule` · *à activer* | Jours en vigilance canicule orange ou rouge cette année (Météo-France), comptés depuis la mise à jour ; la liste des jours en attribut | Bilan de l’été |
| `sensor.hestia_weather_record_chaleur_lieu`, `…_froid_lieu`, `…_rafale_lieu`, `…_pluie_lieu` · *à activer* | Les mêmes records pour le lieu, depuis 1940 | Situer un été dans l’histoire |
| `sensor.hestia_weather_jours_gel_lieu`, `…_jours_chauds_lieu`, `…_nuits_tropicales_lieu` · *à activer* | Les mêmes comptes pour le lieu, avec la moyenne par an | Comparer l’année à la normale |

L’archive du lieu n’est demandée à Open-Meteo que si une entité `…_lieu` est activée : environ 1 Mo la première fois, puis les deux derniers mois toutes les 6 heures. Seule la position de la maison, arrondie à une centaine de mètres, est envoyée.

## L’évènement `hestia_weather_alerte`

Il part quand une alerte commence (`debut`), change de niveau (`change`) ou se termine (`fin`). Les alertes en cours sont gardées au redémarrage : un redémarrage ne renvoie pas les messages.

```yaml
event_type: hestia_weather_alerte
data:
  lieu: Gardanne
  type: vent_fort     # vigilance, orage, vent_fort, pluie_forte, gel, neige, verglas, canicule, uv_fort
  etat: debut         # debut, change ou fin
  niveau: 2           # 1 à surveiller, 2 sérieux, 3 vigilance rouge
  source: station
  texte: "Rafales mesurées à 70 km/h"
```

Une notification pour toutes les alertes :

```yaml
triggers:
  - trigger: event
    event_type: hestia_weather_alerte
actions:
  - action: notify.mobile_app_telephone
    data:
      title: Météo
      message: "{{ trigger.event.data.texte }}"
```

## L’action `hestia_weather.prevision`

Une question précise, une réponse prête à utiliser. `debut` et `fin` acceptent une heure (`"16:15"`) ou une date et heure. Une heure déjà passée vaut pour demain. Une fin avant le début tombe le lendemain.

```yaml
action: hestia_weather.prevision
data:
  debut: "16:15"
  fin: "17:00"
response_variable: meteo
# meteo.texte : « Fortes pluies, 6,8 mm de pluie, rafales à 68 km/h, 15 °C »
# meteo.pluie, condition, ciel, temperature_min/max, ressenti_min/max, vent_max, rafales_max, partiel
```

Au-delà des prévisions heure par heure, la réponse vient des prévisions par jour, avec `partiel: true`.

## L’entité `weather.hestia_weather`

Maintenant : la station (sinon le bulletin), le ressenti de Hestia Weather, et le temps observé, où la pluie mesurée chez vous passe devant le bulletin. Prévisions : celles de votre fournisseur, par heure et par jour. Toute carte ou intégration qui accepte une entité météo en profite.

Elle est désactivée au départ : activez-la si une carte, un thermostat ou l’assistant vocal doit lire votre station. Elle n’est jamais proposée comme source de Hestia Weather lui-même.

## Les modèles d’automatisation (blueprints)

Ils sont sur GitHub, à importer en un clic. Vos réglages (téléphones, heure, plantes, appareils) se font dans le modèle, jamais dans l’intégration.

Téléphones et enceintes se choisissent dans une liste : les téléphones de l’application Home Assistant, les enceintes avec une voix (« Google Translate », « Home Assistant Cloud »…). Un groupe `notify.famille` peut toujours s’ajouter à la main.

Sur les téléphones, le message a une icône qui dit de quoi il parle (un éclair pour un orage, un flocon pour le gel…), à changer si vous voulez. Pour les alertes, elle prend aussi la couleur du niveau : jaune, orange, rouge, et vert quand c’est fini (Android). Chaque modèle peut joindre l’image d’une caméra, prise à l’envoi, et ouvrir la page de votre choix quand on touche le message, par exemple `/lovelace/meteo`.

| Modèle | Ce qu’il fait | |
| --- | --- | --- |
| **Notifier les alertes** | Un message au début, au changement et à la fin de chaque alerte choisie ; le message de fin remplace celui du début | [![Importer](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FhestiaFB%2Fhestia-weather-integration%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fhestia_weather%2Fnotifier_alertes.yaml) |
| **Protéger avant le gel** | La veille au soir : ce qu’il faut rentrer, le givre du pare-brise, vos actions hors-gel | [![Importer](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FhestiaFB%2Fhestia-weather-integration%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fhestia_weather%2Fproteger_gel.yaml) |
| **Le bulletin du matin** | À l’heure du réveil, le bulletin du jour et la vigilance en cours | [![Importer](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FhestiaFB%2Fhestia-weather-integration%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fhestia_weather%2Fbulletin_du_matin.yaml) |
| **Réveil plus tôt si la route glisse** | La veille au soir, un réveil avancé quand le risque de neige ou de verglas est estimé à l’heure du départ ; confirmé ou annulé le matin | [![Importer](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FhestiaFB%2Fhestia-weather-integration%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fhestia_weather%2Freveil_route.yaml) |

## Noms techniques

Le nom technique de l’intégration est `hestia_weather` : l’action `hestia_weather.prevision`, la carte `custom:hestia-weather-card`, l’évènement `hestia_weather_alerte`, les variables de thème `hestia-rain-color`…

Installée sous son nom technique d’origine, l’intégration passe seule au nouveau au premier démarrage de la mise à jour :

- vos lieux, réglages, alertes en cours, historiques et statistiques sont gardés ;
- vos entités gardent leur nom, et donc vos automatisations et vos tableaux de bord aussi ;
- les automatisations, scripts, scènes et tableaux de bord faits dans l’interface sont mis à jour ;
- ce qui est écrit à la main en YAML n’est jamais modifié : une réparation dans **Paramètres** liste les fichiers et les lignes à changer.

**Entités** : une nouvelle installation crée des `sensor.hestia_weather_…`. Installée avant la 2.9.4, vos entités gardent leur nom d’origine. Pour leur donner le nom Hestia, **Réglages généraux → Nom des entités** : un aperçu d’abord, puis vos automatisations, scripts, scènes et tableaux de bord suivent, et un retour en arrière reste possible.
