# Fonctionnement technique

[Accueil](../README.md) · [Les capteurs](capteurs.md) · [Le ressenti](ressenti.md) · [La synthèse et les alertes](synthese.md) · [Le bulletin du jour](bulletin.md) · [Sources et réglages](sources.md) · [Pluie, vent, pression](mesures.md)

Cette page s’adresse à qui veut comprendre ou modifier Hestia Weather.

## Le but

Hestia Weather est **le cerveau** : il lit les sources, calcule, et donne le résultat à ceux qui l’affichent ou s’en servent.

- La [carte Hestia Weather](carte/README.md) ne fait qu’afficher ce qu’il lui envoie. Son code est dans `card/`, compilé dans `custom_components/hestia_weather/frontend/hestia-weather-card.js` ; l’intégration la charge sur chaque tableau de bord (depuis 2.3), à sa propre version.
- Les capteurs servent aux automatisations : volets, chauffage, arrosage, notifications.

Les calculs sont faits **une fois, dans Home Assistant**, au lieu de l’être dans chaque navigateur ouvert.

## Deux étages

| Dossier | Rôle |
| --- | --- |
| `custom_components/hestia_weather/engine` | **Le moteur**, en Python pur, sans Home Assistant : unités, humidité, ressenti, conditions, prévisions, tendances, historiques, saisons, Atmo, synthèse, bulletin, modèle de vue. Il se teste seul. |
| `custom_components/hestia_weather` | **La couche Home Assistant**, mince : parcours de configuration, coordinateur, capteurs, oui/non, entité météo, action, API websocket. |

Fichiers principaux du moteur : `feel.py` (ressenti et alerte de la station), `local.py` (la météo locale assemblée), `brief.py` (synthèse), `alerts.py` (ce que montrent les bulles et la frise), `bulletin.py` (bulletin du jour), `station.py` et `series.py` (historiques), `view.py` (ce que reçoit la carte), `detection.py` (reconnaissance de la station et des sources), `catalogue.py` (les entités pour les automatisations), `watch.py` (début, changement et fin des alertes), `prevision.py` (la réponse de l’action).

## Le coordinateur

- Il écoute les capteurs choisis et recalcule **2 secondes** après un changement (plusieurs changements rapprochés font un seul calcul).
- Il recalcule aussi **chaque minute**, pour ce qui dépend de l’heure.
- Il demande les prévisions (`weather.get_forecasts`, heures et jours) toutes les **15 minutes**, et réessaie en cas d’échec : après 10 s, 20 s, 40 s… jusqu’à 1 minute. Il relance aussi la lecture à la fin du démarrage de Home Assistant.
- Il lit l’historique du Recorder : vent et pression toutes les 5 minutes, pluie et statistiques toutes les 15 minutes.

## Les capteurs

Par lieu : 26 capteurs, 9 oui/non et une entité météo, aux identifiants fixes (`sensor.hestia_weather_ressenti`, `binary_sensor.hestia_weather_gel`, `weather.hestia_weather`…). Pour un deuxième lieu, son nom s’ajoute : `sensor.hestia_weather_marseille_ressenti`. La liste complète, rangée par famille, est dans [Les capteurs et les automatisations](capteurs.md). Les identifiants des onze capteurs de la 2.0.0 ne changent jamais.

Une valeur inconnue reste **inconnue** : rien n’est inventé. Les longs textes (synthèse, bulletin, raisons) sont en attributs, non enregistrés par le Recorder.

Les alertes en cours (`engine/watch.py`) sont gardées dans `.storage/hestia_weather.alertes.<entry_id>` : un redémarrage ne renvoie pas l’évènement `debut`, et une valeur inconnue (station ou prévisions indisponibles) ne termine jamais une alerte.

## L’API websocket

| Commande | Réponse |
| --- | --- |
| `hestia_weather/entries` | La liste des lieux configurés (`entry_id`, `title`). |
| `hestia_weather/subscribe` (`entry_id` facultatif avec un seul lieu) | Un message `{version, entryId, title, view}` à l’abonnement, puis à chaque changement de la vue. `{reload: true}` quand le lieu est reconfiguré. |

La **vue** contient tout ce que la carte affiche, déjà calculé et rédigé en français :

- conventions : clés en camelCase, temps en secondes depuis 1970, valeur inconnue absente (jamais `null`), points de graphique `[secondes, valeur]` ;
- chaque point de la synthèse porte son heure (`at`, `clock`), et chaque heure de prévision la sienne (`time`), pour la frise ;
- `timeline` est la liste de la frise : les points de maintenant, puis ceux des prochaines heures à leur heure, chacun avec son texte court ; `points` reste la sélection courte de la bulle qui défile ;
- elle est décrite par `engine/view.py`, et côté carte par `src/view.ts` ;
- `version` monte seulement si une carte plus ancienne ne peut plus la lire : elle demande alors sa mise à jour.

## L’interface pour les autres briques Hestia-FB

Hestia Weather publie pour les autres briques (Hestia Confort, Hestia Énergie, futur Hestia Chauffage…) un objet versionné, `hass.data["hestia_weather_api"]` (`api.py`). C’est le contrat entre briques : les autres briques ne lisent jamais les réglages internes de Hestia Weather.

### Version et règles

- `version` vaut **1** (`API_VERSION`). Une brique vérifie `api.version == 1` avant de s’en servir, sinon elle se comporte comme si Hestia Weather n’était pas installé.
- Dans la version 1, l’objet ne grandit que de façon compatible : une nouvelle méthode ou un nouveau champ peut apparaître, rien n’est retiré ni renommé. Une brique ignore les champs qu’elle ne connaît pas.
- Un changement incompatible fait passer à la version 2 et se publie avec les briques qui la lisent (voir `CLAUDE.md`).
- Toutes les méthodes prennent un `entry_id` facultatif, l’identifiant d’un lieu (une entrée de configuration). Sans `entry_id`, le seul lieu configuré est utilisé ; avec plusieurs lieux, sans `entry_id`, il n’y a pas de réponse (`None`, ou liste vide pour `hourly`) : la brique doit faire choisir un lieu avec `places()`. Un lieu non chargé compte comme absent.
- Toutes les méthodes sont synchrones et lisent ce qui est déjà en mémoire, sauf `degree_days`, qui est une coroutine (`await`).
- Les heures sont des textes ISO 8601 avec fuseau. Les méthodes qui lisent le dernier calcul du lieu (`air`, `pollen`, `rain`, `lightning`, `water`, `sky_now`) donnent `at`, l’heure de ce calcul. `at` change à chaque recalcul, même quand rien d’autre n’a changé : une brique qui compare deux réponses pour savoir s’il faut se recalculer doit **laisser `at` de côté**.
- Chaque réponse de type dictionnaire (sauf `station_shade` et `station_trust`) porte aussi `entry_id`.

### Les méthodes

| Méthode | Ce qu’elle donne |
| --- | --- |
| `places()` | Les lieux configurés et chargés : liste de `{entry_id, title}`. |
| `station(entry_id)` | Les capteurs de la station choisis dans Hestia Weather. |
| `station_shade(entry_id)` | L’ombre portée sur le capteur de soleil de la station, selon la position du soleil. |
| `station_trust(entry_id)` | Jusqu’où chaque mesure de la station est fiable, et ce qui est retenu en ce moment. |
| `hourly(entry_id)` | Les prévisions heure par heure. |
| `sky_now(entry_id)` | Le ciel de maintenant, tel que l’affiche l’entité météo : `condition`, `observed` (vu par la station plutôt que prévu), `cloud_coverage` en % quand le service météo la donne. Confort s’en sert pour ne pas annoncer de grand soleil sous un ciel gris. |
| `air(entry_id)` | La qualité de l’air du jour. |
| `pollen(entry_id)` | Les pollens du jour et du lendemain. |
| `season(entry_id)` | La saison du jour et la durée du jour. |
| `rain(entry_id)` | Quand commence la prochaine pluie. |
| `lightning(entry_id)` | L’orage vu par Blitzortung. |
| `water(entry_id)` | Les restrictions d’eau (sécheresse) du jour. |
| `await degree_days(day, entry_id)` | Les degrés-jours d’un jour. |
| `add_listener(entry_id, update, brick=None)` | S’abonner aux recalculs d’un lieu. |
| `linked(entry_id)` | Les briques abonnées à ce lieu. |

Le détail de chaque réponse suit. « Absent » veut dire que le champ peut valoir `None`.

#### `places() -> list[dict]`

`[{"entry_id": str, "title": str}, …]`, liste vide sans lieu.

#### `station(entry_id=None) -> dict | None`

- `entry_id`, `title` : le lieu.
- `sensors` : `{rôle: entity_id}`, seulement pour les rôles qui ont un capteur. Rôles : `temperature`, `humidity`, `rain_rate`, `wind_speed`, `wind_gust`, `wind_bearing`, `solar_radiation`, `uv_index`, `pressure`.

`None` sans lieu.

#### `station_shade(entry_id=None) -> dict | None`

Appris chaque nuit dans les statistiques longues du capteur de soleil (`place/shade.py`, `engine/station_shade.py`).

- `sensor` : le capteur de rayonnement solaire.
- `cells` : `{"170/25": 0.38, …}`. Chaque clé est une case du ciel, « azimut/hauteur » en degrés (coin de la case) ; la valeur est la part du soleil d’un ciel clair que la station reçoit quand le soleil est dans cette case, de 0 (à l’ombre) à 1 (plein soleil), parfois un peu plus. On y trouve toutes les cases que le soleil traverse ici, remplies par ce qui a été appris, sinon par les cases voisines apprises, sinon par la déclaration du foyer. Une case absente est inconnue : garder alors le soleil prévu.
- `steps` : `[10, 5]`, la taille d’une case (10° d’azimut × 5° de hauteur).
- `learned` : nombre de cases apprises ; `reachable` : nombre de cases que le soleil traverse ici.
- `hours` : nombre d’heures de statistiques utilisées ; `learned_at` : heure ISO du dernier apprentissage, absent avant le premier.
- `declared` : ce que le foyer a déclaré dans les réglages (« never », « morning », « afternoon », « always »), absent sinon.

`None` sans lieu ou sans capteur de soleil.

#### `station_trust(entry_id=None) -> dict | None`

Voir `docs/STATION-EMPLACEMENT.md`. Un dictionnaire par mesure, sous les clés `temperature`, `wind`, `rain`, `sun`, seulement pour les mesures que donne la station :

- `level` : « ok » (fiable), « handled » (fiable sauf…, Hestia-FB s’en charge) ou « watch » (à vérifier).
- `title`, `line`, `learned` : les textes à afficher, dans la langue de Home Assistant (`learned` peut être absent).
- `now` : ce qui est retenu au dernier calcul : « station » (la mesure telle quelle), « corrected » (l’excès appris retiré) ou « forecast » (la prévision prise à sa place). Seuls `temperature` et `wind` peuvent valoir autre chose que « station ».
- `value` et `why`, seulement quand `now` n’est pas « station » : la valeur retenue (°C pour la température, km/h pour la rafale) et la raison en une phrase.

Hestia Confort lit `temperature.value` plutôt que le capteur brut, et la rafale la plus forte d’un côté abrité. `None` sans lieu.

#### `hourly(entry_id=None) -> list[dict]`

Une entrée par heure de prévision, dans l’ordre :

| Champ | Unité |
| --- | --- |
| `time` | heure ISO du début de l’heure |
| `temperature` | °C |
| `humidity` | % |
| `precipitation` | mm sur l’heure |
| `wind_speed`, `wind_gust` | km/h |
| `wind_bearing` | degrés (d’où vient le vent) |
| `condition` | condition Home Assistant (`sunny`, `rainy`…) |
| `cloud_coverage` | % de ciel couvert, absent quand le service météo ne le donne pas |

Chaque champ autre que `time` peut être absent. Hestia Confort estime avec `cloud_coverage` le soleil que sa station ne voit pas. Liste vide sans lieu.

#### `air(entry_id=None) -> dict | None`

La qualité de l’air du jour, sur l’échelle d’Atmo.

- `source` : « atmo » (l’indice régional du jour) ou « waqi » (la mesure d’une station) ; `provider` : « Atmo France » ou « WAQI » ; `entity_id` : son capteur.
- `index` : de 1 (Bon) à 6 (Extrêmement mauvais), absent tant que la source ne répond pas ; `label` : son mot.
- `at` : heure du calcul.

`None` sans lieu ou sans source d’air.

#### `pollen(entry_id=None) -> dict | None`

Les pollens du jour, quelle que soit la source (Atmo France, Polleninformation, IRM KMI, Swiss Pollen, Kleenex).

- `level` : la même échelle pour toutes les sources, 0 aucun, 1 faible, 2 moyen, 3 élevé, 4 très élevé (l’indice 1 à 6 d’Atmo y est ramené) ; absent tant que la source ne répond pas.
- `high` : `True` à partir de « élevé » (`level` ≥ 3).
- `source` : la source qui a répondu, absent sinon. `index` et `scale` : la valeur propre de la source et son maximum (6 pour Atmo, 4 pour les autres). `label` : son mot. `main` : l’espèce qui pèse le plus.
- `tomorrow` : le `level` du lendemain, absent si la source ne le donne pas.
- `at` : heure du calcul.

`None` sans lieu ou sans source de pollens.

#### `season(entry_id=None) -> dict | None`

- `season` : « spring », « summer », « autumn » ou « winter » ; `label` : son nom dans la langue de Home Assistant.
- `from_sensor` : `True` quand elle vient du capteur Saison choisi dans les réglages, `False` quand elle vient de la date astronomique.
- `days_in` : jours depuis le début de la saison (0 le premier jour), absent quand le début ne peut pas être daté.
- `day_length` : heures de jour aujourd’hui (nombre décimal).

Pas de `at` : calculée à l’appel. `None` sans lieu.

#### `rain(entry_id=None) -> dict | None`

Quand commence la prochaine pluie (`engine/nowcast.py`).

- `minutes` : minutes avant la pluie (0 : elle arrive maintenant), absent si aucune pluie n’est vue.
- `precision` : « minute » quand la prévision radar de Météo-France la voit, « hour » quand seule la prévision horaire la donne (elle tombe quelque part dans cette heure).
- `source` : « radar » ou « forecast », comme `precision`.
- `amount` : mm prévus sur l’heure, seulement avec `source` « forecast ».
- `intensity` : seulement avec `source` « radar », la pluie la plus forte que le radar voit à partir de là dans son heure : 1 faible, 2 modérée, 3 forte.
- `chance` : probabilité de pluie en %, entier : celle de Météo-France pour ses prochaines heures, sinon la plus haute de la prévision horaire sur les trois prochaines heures ; absent si aucune n’est donnée.
- `dry_until` : heure ISO de fin de l’heure que le radar voit sèche, absent sinon.
- `at` : heure du calcul.

Tous les champs sauf `entry_id` et `at` peuvent être absents. `None` sans lieu ou avant le premier calcul.

#### `lightning(entry_id=None) -> dict | None`

L’orage vu par Blitzortung, à partir des éclairs des 20 dernières minutes (`engine/lightning.py`).

- `entity_id` : le capteur Blitzortung ; `available` : `False` tant qu’il ne répond pas (aucun éclair ne veut alors rien dire).
- `near` : un éclair à moins de 30 km (le capteur Orage est allumé). `overhead` : à moins de 10 km dans les 10 dernières minutes.
- `level` : 0 rien à moins de 30 km, 1 orage dans le secteur, 2 orage proche (15 km ou moins) ou qui approche (20 km ou moins).
- `nearest_km` : distance de l’éclair le plus proche, en km au dixième ; `direction` : en mots (« au sud-ouest ») ; `azimuth` : en degrés. Absents sans éclair.
- `trend` : « approche », « eloigne » ou absent.
- `count` : éclairs en 20 minutes ; `near_count` : ceux à moins de 30 km.
- `text` : la phrase à afficher (« Orage à 8 km au sud-ouest, il se rapproche »), absent sans éclair.
- `last` : heure ISO du dernier éclair, absent sans éclair.
- `at` : heure du calcul.

`None` sans lieu, avant le premier calcul ou sans Blitzortung.

#### `water(entry_id=None) -> dict | None`

Les restrictions d’eau du jour, d’après Vigieau.

- `entity_id` : le capteur Vigieau.
- `level` : de 0 (aucune) à 4 (crise), absent tant que Vigieau ne répond pas ; `state` : « aucune » à « crise » ; `label` : le mot affiché.
- `restricted` : `True` à partir de « Alerte » (`level` ≥ 2).
- `watering_restricted` : `True` quand l’arrosage fait partie des usages restreints ; `usages` : la liste des usages restreints (liste vide sinon).
- `order` : l’arrêté préfectoral, absent sinon.
- `at` : heure du calcul.

`None` sans lieu, avant le premier calcul ou sans Vigieau.

#### `await degree_days(day, entry_id=None) -> dict | None`

Les degrés-jours d’un jour (`day` : une `date`, ou un `datetime` dont seule la date compte), comptés comme les capteurs de la famille Bâtiment : moyenne (max + min) / 2, bases 18 °C et 22 °C, en DJU au dixième.

- `date` : le jour, ISO. `heating` : DJU de chauffe ; `cooling` : DJU de climatisation. `heating_base`, `cooling_base` : les bases (°C).
- `mean` : température moyenne du jour, °C au dixième.
- `source` : « prevision » pour aujourd’hui et les jours suivants (la prévision, comme les capteurs) ; « station » pour un jour passé (la température de la station dans ses statistiques longues, aussi loin qu’elles remontent).

`None` sans lieu, au-delà des prévisions, pour un jour passé sans capteur de température ou avec moins de 20 heures mesurées : jamais une valeur inventée. C’est une coroutine, car le passé est lu dans le Recorder. Lue par Hestia Énergie.

#### `add_listener(entry_id, update, brick=None) -> Callable[[], None]`

Appelle `update()` (sans argument, dans la boucle de Home Assistant) à chaque recalcul du lieu : nouvelles mesures ou nouvelles prévisions. Renvoie la fonction qui arrête l’écoute ; l’appeler deux fois ne fait rien de plus.

- `entry_id` : le lieu ; `None` prend le seul lieu configuré. Sans lieu trouvé, rien n’est abonné et la fonction renvoyée ne fait rien : une brique doit donc s’abonner après le chargement de Hestia Weather.
- `brick` : le domaine de la brique qui écoute (par exemple `"hestia_comfort"`). À toujours donner : c’est ce qui fait apparaître la brique « reliée » à ce lieu dans les réglages de Hestia Weather.

`update` doit être court : il est appelé à chaque recalcul. Une brique relit ensuite ce dont elle a besoin, et compare sans `at` (voir plus haut) pour ne pas se recalculer pour rien.

#### `linked(entry_id) -> dict[str, int]`

Les briques abonnées à ce lieu : `{domaine: nombre d’abonnements}`, `""` pour celles qui n’ont pas donné `brick`.

Dans Hestia Weather, **Configurer → Écosystème Hestia-FB** montre chaque brique : reliée à ce lieu, installée mais pas reliée, non installée, ou à venir.

Les entités restent l’autre moyen de lecture : elles sont reconnues par leur identifiant interne `<entrée>_<clé>`.

## Tests

```sh
python -m venv .venv && .venv/bin/pip install pytest
.venv/bin/python -m pytest -q
```

Plus de 300 tests couvrent :

- le ressenti, comparé à 96 jeux de référence calculés indépendamment ;
- les conditions observées, la synthèse et ses seuils, les alertes ;
- le bulletin, les historiques de la station, Atmo France, les saisons ;
- la reconnaissance des capteurs et la vue envoyée à la carte.

La CI lance aussi `hassfest` et la validation HACS.

`scripts/view_cli.py` calcule une vue à partir d’un scénario JSON : le banc de la carte s’en sert pour dessiner ses démonstrations avec le vrai moteur.

## Traduire

Hestia Weather parle français, anglais et allemand. Le français est écrit dans le code ; chaque autre langue est un dictionnaire « phrase française → traduction ». Pour ajouter une langue, il suffit de traduire ces fichiers, en partant de l’anglais :

| Fichier | Ce qu’il traduit |
| --- | --- |
| `card/src/i18n/en.ts` | La carte |
| `frontend/i18n-en.ts` et `frontend/socle/i18n-en.ts` | Le panneau Hestia-FB (en allemand, `frontend/i18n-de.ts` porte aussi les mots du socle, qui n’a pas encore d’allemand) |
| `custom_components/hestia_weather/engine/i18n_en.py` | Les textes calculés pour la carte et le panneau |
| `custom_components/hestia_weather/translations/en.json` | L’assistant de Paramètres et les noms des entités |

Les valeurs des capteurs restent en français : elles servent aux automatisations. Les tests vérifient qu’aucune phrase n’est oubliée et que les `{noms}` entre accolades sont gardés.

Le guide pas à pas, sans git : [Traductions](traductions.md). Pas à l’aise avec ces fichiers ? [Ouvrez une demande « Traduction »](https://github.com/hestiaFB/hestia-weather-integration/issues/new?title=Traduction%20%3A%20) : on vous envoie la liste des phrases, et on s’occupe du reste.

## L’icône

`custom_components/hestia_weather/brand/icon.png` : Home Assistant l’affiche pour l’intégration, à partir de la version 2026.
