# La carte Hestia Weather

**La météo chez vous, en une carte qui parle.** La carte affiche ce que calcule l’intégration : la vigilance, le bulletin du jour, les alertes à leur heure, le ressenti, la pluie, le vent, la pression, l’air et les pollens, sur un ciel animé.

Depuis la 2.3, **la carte est fournie par l’intégration** : rien à installer en plus, et elle a toujours la même version que l’intégration. L’intégration l’ajoute elle-même aux ressources des tableaux de bord et la tient à jour, pour que l’application mobile la trouve aussi. Sur un tableau de bord : **Ajouter une carte → Hestia Weather**.

La carte parle **français** et **anglais** : elle suit la langue de chaque personne qui la regarde. Une autre langue s’affiche en anglais, en attendant qu’un utilisateur la propose ([comment aider](../technique.md#traduire)).

Sans station (depuis la 2.3.1), les courbes de vent et de pression utilisent les attributs historiques du service météo sélectionné, si Home Assistant les a enregistrés. Elles conservent le nom du service météo et ne deviennent pas des mesures locales. Si cet historique est absent, exclu de Recorder ou trop court, la carte le précise ; elle n’invente pas de valeurs passées. Les cumuls de pluie mesurés restent un enrichissement facultatif fourni par un pluviomètre. Retirer la station ne crée plus d’alertes « À régler » pour les entités restées actives qui dépendent de ses capteurs.

Vous aviez installé la carte depuis HACS ? Retirez-la (HACS → Hestia Weather → ⋮ → **Supprimer**), puis rechargez la page. Vos cartes restent en place et gardent leur `type:` : l’ancien comme le nouveau marchent. Tant qu’elle reste installée, l’accueil du panneau **Hestia-FB** l’indique en orange.

Dans l’application Home Assistant, une carte reste invisible juste après une mise à jour ? Réinitialisez son cache : **Paramètres → Application compagnon → Dépannage → Réinitialiser le cache du frontend**.

![Hestia Weather — votre station météo et les prévisions, réunies en une carte qui parle](images/hestia-weather-banner.png)

## Quatorze cartes à choisir

Dans **Ajouter une carte**, cherchez « Hestia-FB » : trois entrées, une par type de carte — **Hestia-FB - Météo** (complète ou tuile), **Hestia-FB - À la pièce** (ressenti, pluie, vent, pression, éclairs, air et pollens, prévisions) et **Hestia-FB - Petite carte** (mini ou alerte). Dans les réglages de la carte, choisissez d’abord le **type**, puis le **format**. Toutes s’écrivent `type: custom:hestia-weather-card`, seul `format` change.

| Carte | Pour quoi |
| --- | --- |
| **Complète** (`full`, par défaut) | Une page météo : le bandeau, puis **Aujourd’hui** et **Prévisions**, qui se replient d’un appui sur leur titre. |
| **Tuile** (`tile`) | La page d’accueil, en pleine ou demi-largeur : le lieu, la vigilance, la bulle qui défile et la météo du moment. **Un appui** la déplie sur place, **un appui long** ouvre la carte complète par-dessus la page. |
| **Tuile dépliée** (`intermediate`) | La même tuile, ouverte au départ. |
| **Mini** (`mini`) | Une seule ligne : le ciel, la température, le lieu et la vigilance. Pour un en-tête ou un téléphone. Un appui ouvre la carte complète. |
| **Ressenti** (`comfort`) | Le ressenti et son explication, sa jauge, ce qui le fait varier et les pastilles (humidité, rosée, soleil…). |
| **Pluie** (`rain`) | La pluie à venir (dans l’heure, sur 6 h, la prochaine averse), celle qui tombe, ses barres et ses cumuls. |
| **Vent** (`wind`) | Le vent du moment et sa direction, sa courbe, les rafales et le maximum du jour. |
| **Pression** (`pressure`) | La pression et sa tendance, sa courbe, les valeurs passées. |
| **Éclairs** (`lightning`) | Avec l’extension [Blitzortung](https://github.com/mrk-its/homeassistant-blitzortung) : les éclairs de la dernière heure sur un radar autour de chez vous (anneaux à 10, 30 et 50 km, les plus récents en rouge), l’éclair le plus proche et sa direction, le niveau (calme, secteur, proche, sur vous), les comptes de l’heure, des 10 dernières minutes et du mois. Peut rester cachée tant qu’aucun orage n’est à moins de 30 km. Sans Blitzortung, elle explique comment l’installer. |
| **Air et pollens** (`air`) | L’air extérieur et les pollens, aujourd’hui et demain. |
| **Prévisions** (`forecast`) | La courbe des 18 prochaines heures et le tableau des 7 jours, avec le bouton **Heures / Jours** quand les deux sont gardés. |
| **Événements** (`events`) | La frise des prochaines heures, seule : pour les petits écrans. |
| **Records** (`records`) | Les records de chaleur, de froid, de rafale et de pluie en un jour, avec leur date (et l’heure pour la station), et les jours comptés : gel, 30 °C et plus, nuits à 20 °C et plus, vigilance canicule. Trois réglages : la période (cette année, depuis toujours, les deux), la source (votre station, le lieu depuis 1940, les deux) et la disposition (liste ou cases). Pas besoin d’activer les entités Records : la carte lit seule ce qu’elle montre. |
| **Alerte** (`alert`) | Visible seulement en cas de vigilance, d’alerte mesurée chez vous ou de point sérieux à venir. Cachée quand tout est calme. Un appui ouvre la carte complète. |

**Le contenu se choisit**, dans l’ordre voulu :

- **Ressenti, Pluie, Vent, Pression, Éclairs, Air et pollens, Prévisions** : chaque partie de la carte se coche ou se décoche (réglage `card_blocks`). Ce sont les panneaux de la carte complète, chacun seul sur sa carte.

- **Tuile dépliée** : le bulletin du jour, les événements (la frise), les prochains moments (cet après-midi, ce soir, cette nuit, demain matin) et les prévisions avec **Heures / Jours** (température, pluie, vent et sa direction). Par défaut : le bulletin et les événements.
- **Complète** : trois sections, toujours dans cet ordre, chacune avec son propre contenu :
  - **le bandeau intelligent**, avec son ciel animé : bulletin, événements, prochains moments, prévisions en tuiles ;
  - **Aujourd’hui** : pluie, vent, pression (et ressenti, pastilles, air et pollens du jour) ;
  - **Prévisions** : les 18 prochaines heures, les 7 prochains jours (et l’air et les pollens de demain).

![Hestia Weather — tuile pleine et demi-largeur repliées, puis tuile dépliée, par temps d’orage avec vigilance jaune](images/hestia-weather-formats.png)

## Le bandeau

- **La vigilance officielle**, quand il y en a une : une pastille compacte, l’icône du phénomène dans un disque de la couleur du niveau, avec un halo.
- **Le bulletin du jour**, en entier.
- **Les événements des heures à venir**, sur une frise dans un verre dépoli :
  - une phrase qui défile parcourt les points un à un ;
  - chaque point est une étiquette à son heure (pluie, orage, gel, brouillard, température, pluie de demain, air et pollens dès 3 sur 6), jusqu’à 6 ; ceux du moment sont réunis dans « Maintenant » ;
  - l’alerte mesurée chez vous ouvre cette étiquette, avec son halo ;
  - la piste suit le ciel prévu heure par heure ;
  - sur un téléphone, les étiquettes ne gardent que leurs icônes quand elles ne tiennent pas toutes.

  Un appui sur une étiquette affiche son point ; le défilement se met en pause au survol.
- **La météo du moment** à droite : ciel, température, tendance, source.

Derrière, **le ciel animé** suit le temps du moment :

- soleil à rayons, lune à cratères, nuages, orages avec éclairs, rafales ;
- la neige tombe et tient au sol, la grêle rebondit, la pluie éclabousse ;
- les saisons s’y glissent : pétales, chaleur, feuilles rousses, givre.

![Hestia Weather — bandeau, puis Aujourd’hui : ressenti, pluie, vent, pression, air et pollens](images/1.png)

## Aujourd’hui et Prévisions

- **Aujourd’hui** : le ressenti et ce qui le fait monter ou baisser (un **i** détaille le calcul), puis Pluie, Vent et Pression, chacun avec sa valeur, un petit graphique et trois chiffres utiles. Ensuite, l’air extérieur et les pollens.
- **Prévisions** : la courbe des 18 prochaines heures, le tableau des 7 jours, l’air et les pollens de demain.

Un appui sur une valeur ouvre la fiche de son capteur.

![Hestia Weather — prévisions des 18 prochaines heures et des 7 prochains jours, air et pollens de demain](images/2.png)

## Réglages

Tout se règle dans l’éditeur de la carte, rangé en blocs : le lieu et le format en haut, puis **Visuel et performance**, **Bandeau**, **Sections** et **Air et pollens** (pour une tuile : **Contenu** et **Fonctionnalités**). Les sources, elles, se règlent dans l’intégration.

| Bloc | Réglage | Par défaut | Rôle |
| --- | --- | --- | --- |
| En haut | `entry_id` | — | Le lieu à afficher, s’il y en a plusieurs dans l’intégration |
| En haut | `format` | `full` | `full`, `tile`, `intermediate`, `mini`, `comfort`, `rain`, `wind`, `pressure`, `lightning`, `air`, `forecast`, `events`, `records` ou `alert` |
| Records | `records_period`, `records_source`, `records_layout` | `both`, `station`, `list` | Période : `year`, `all`, `both`. Source : `station`, `lieu` (Open-Meteo depuis 1940), `both`. Disposition : `list`, `cases` |
| Contenu (cartes seules) | `card_blocks` | tout | Ressenti : `feel`, `gauge`, `factors`, `extras`. Pluie : `ahead` (à venir), `now`, `chart`, `stats`. Vent et Pression : `now`, `chart`, `stats`. Éclairs : `now`, `radar`, `stats` (et `hide_when_calm: true` pour la cacher sans orage). Air et pollens, dans l’ordre voulu : `air_today`, `pollen_today`, `air_tomorrow`, `pollen_tomorrow`. Prévisions : `hours`, `days`. Les cartes Pluie, Vent et Pression suivent aussi `rain_span`, `wind_span` et `pressure_span` |
| Bandeau intelligent (complète) | `banner_blocks` | `bulletin`, `events` | Sous le lieu, la vigilance et la météo du moment, dans l’ordre : `bulletin`, `events` (la frise), `moments`, `forecast` (les prévisions en tuiles). Le bandeau et son ciel animé restent toujours |
| Bandeau intelligent (complète) | `clock` | `none` | L’heure de l’appareil dans le bandeau : `left` en grand sous le titre, `right` au-dessus de « En ce moment », `none` masquée |
| Aujourd’hui (complète) | `today_blocks` | tout | `rain`, `wind`, `pressure`, `lightning` (éclairs, avec Blitzortung), `comfort` (ressenti), `extras` (pastilles), `air` (air et pollens du jour). Une liste vide retire la section |
| Aujourd’hui (complète) | `rain_span` | `7d` | Les barres de pluie : `24h` (une par heure), `7d` (une par jour) ou `30d` (une par jour). 24 heures et 30 jours demandent un pluviomètre dont Home Assistant garde les statistiques ; sinon, 7 jours |
| Aujourd’hui (complète) | `wind_span` | `6h` | La courbe du vent sur `6h`, `1d` (24 heures), `2d` (2 jours) ou `7d` (7 jours). Au-delà de 6 h, les moyennes horaires et les rafales maximales de chaque heure |
| Aujourd’hui (complète) | `pressure_span` | `6h` | La courbe de pression sur `6h`, `1d` (24 heures), `2d` (2 jours) ou `7d` (7 jours). Au-delà de 6 h, les moyennes horaires gardées par Home Assistant |
| Prévisions (complète) | `forecast_blocks` | tout | `hours` (18 heures), `days` (7 jours), `air` (air et pollens de demain). Une liste vide retire la section |
| Contenu (tuile) | `tile_blocks` | `bulletin`, `events` | Ce que montre la tuile dépliée, dans l’ordre : `bulletin`, `events`, `moments`, `forecast` |
| Contenu (tuile), Prévisions | `forecast_tab` | `hours` | Les prévisions s’ouvrent sur les heures (`hours`) ou les jours (`days`). Un appui sur Heures / Jours change l’affichage, gardé sur chaque appareil |
| Visuel et performance | `weather_animations` | `true` | Ciel animé, défilement et halos. Coupées, le décor reste fixe |
| Visuel et performance | `weather_animation_quality` | `standard` | `low` : moins de gouttes, de flocons et de nuages (choisi d’office sur écran tactile pour la tuile) |
| Visuel et performance | `glass_effect` | `true` | Effet verre dépoli sur le ciel. Le flou est ce qui coûte le plus : à couper sur un appareil lent |
| Bandeau | `show_synthesis` | `true` | Complète : afficher le bandeau |
| Bandeau | `show_bulletin` | `true` | Afficher le bulletin du jour |
| Bandeau | `smart_brief` | `true` | Complète : afficher la vigilance, l’alerte mesurée et les événements (sinon, la frise ne montre que le ciel prévu) |
| Sections | `show_today`, `show_predictions` | `true` | Complète : afficher les sections Aujourd’hui et Prévisions |
| Sections | `collapse_today`, `collapse_predictions` | `false` | Complète : section repliée au départ |
| Air et pollens | `show_atmo_details` | `true` | Le pli « Détail » des polluants et des pollens |
| Air et pollens | `show_atmo_tomorrow` | `true` | L’air et les pollens de demain |
| Fonctionnalités (tuile, mini, alerte) | `hold_action` | `popup` | Ce que fait l’appui long (l’appui pour Mini et Alerte) : `popup` ouvre la météo complète en fenêtre, `page` ouvre la page `weather_path`, `none` ne fait rien (la tuile se déplie seulement) |
| Fonctionnalités (tuile, mini, alerte) | `weather_path` | — | La page ouverte avec `hold_action: page`, par exemple `/meteo` |

Configuration minimale, avec un seul lieu :

```yaml
type: custom:hestia-weather-card
```

Une tuile qui mène à votre page météo :

```yaml
type: custom:hestia-weather-card
format: tile
hold_action: page
weather_path: /meteo
```

Une tuile dépliée comme en 1.20, avec les moments et les prévisions :

```yaml
type: custom:hestia-weather-card
format: intermediate
tile_blocks: [bulletin, moments, forecast]
```

La pression seule, sa courbe sur 7 jours, sans les chiffres :

```yaml
type: custom:hestia-weather-card
format: pressure
card_blocks: [now, chart]
pressure_span: 7d
```

## Le visuel

- **Une seule charte** pour toutes les cartes : mêmes bulles, mêmes pastilles, mêmes cadres, une palette de couleurs douces accordées entre elles. Elle suit le thème Home Assistant, clair ou sombre.
- **Le contour coloré et le halo** sont réservés aux alertes ; le halo respire doucement, sans clignoter.
- **Les animations** se mettent en pause hors de l’écran, et suivent le réglage « réduire les animations » de l’appareil.
- **Les couleurs de sens** se remplacent dans un thème Home Assistant, si vous le souhaitez :

```yaml
hestia-rain-color: "#4fb3bf"
hestia-level1-color: "#f2c94c"
```

Variables : `hestia-rain-color`, `hestia-wind-color`, `hestia-heat-color`, `hestia-cold-color`, `hestia-calm-color`, `hestia-pressure-color`, `hestia-level1-color`, `hestia-level2-color`, `hestia-level3-color`.

[La charte en détail](charte.md).

## Si la carte affiche un message

| Message | Que faire |
| --- | --- |
| Hestia Weather a besoin de son intégration | Déjà téléchargée depuis HACS ? Ajoutez-la dans **Paramètres → Appareils et services** : Home Assistant ne la démarre qu’une fois ajoutée. Sinon, [installez-la](https://github.com/hestiaFB/hestia-weather-integration#installation), redémarrez, puis ajoutez-la. |
| Ajoutez l’intégration Hestia Weather | Elle est installée : ajoutez-la dans **Paramètres → Appareils et services**. |
| Choisissez un lieu | Plusieurs lieux existent : choisissez celui de la carte dans ses réglages. |
| Rechargez la page | L’intégration vient d’être mise à jour : rechargez la page (**Ctrl+F5** sur ordinateur). |

## Développement

Le code de la carte est dans [`card/`](../../card) ; il est compilé dans `custom_components/hestia_weather/frontend/hestia-weather-card.js`.

```sh
cd card
npm ci
npm run validate
npx playwright install chromium
npm run test:browser
```

Le banc dessine ses démonstrations avec le vrai moteur de l’intégration (Python 3.13). [Charte et organisation du code](charte.md).
