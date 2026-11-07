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

Hestia Weather publie pour les autres briques (Hestia Confort, futur Hestia Chauffage…) un objet versionné, `hass.data["hestia_weather_api"]` (`api.py`, version 1). Les autres briques vérifient `version` et ne lisent jamais les réglages internes de Hestia Weather.

| Méthode | Ce qu’elle donne |
| --- | --- |
| `places()` | Les lieux configurés (`entry_id`, `title`). |
| `station(entry_id)` | Les capteurs de la station choisis dans Hestia Weather, par rôle : `temperature`, `humidity`, `rain_rate`, `wind_speed`, `wind_gust`, `wind_bearing`, `solar_radiation`, `uv_index`, `pressure`. |
| `hourly(entry_id)` | Les prévisions horaires lues par Hestia Weather : heure ISO, °C, %, mm, km/h, direction du vent en degrés, condition. |
| `await degree_days(date, entry_id)` | Les degrés-jours d’un jour, comptés comme les capteurs de la famille Bâtiment : moyenne (max + min) / 2, bases 18 °C (`heating`, chauffe) et 22 °C (`cooling`, climatisation), en DJU au dixième ; avec `mean` (°C), `heating_base`, `cooling_base` et `source`. Aujourd’hui et les jours suivants viennent de la prévision journalière, comme les capteurs (`source` « prevision ») ; un jour passé, de la température de la station dans ses statistiques longues (`source` « station », aussi loin qu’elles remontent). `None` sans lieu, au-delà des prévisions, pour un jour passé sans capteur de température ou avec moins de 20 heures mesurées : jamais une valeur inventée. Coroutine (le passé est lu dans le Recorder). Lue par Hestia Énergie. |
| `add_listener(entry_id, rappel, brick=None)` | Prévient quand le lieu est recalculé ; renvoie la fonction qui arrête l’écoute. `brick` : le domaine de la brique qui écoute (`hestia_comfort`), pour qu’elle apparaisse « reliée » dans les réglages de Hestia Weather. |
| `linked(entry_id)` | Les briques qui écoutent ce lieu, par domaine. |

Dans Hestia Weather, **Configurer → Écosystème Hestia-FB** montre chaque brique : reliée à ce lieu, installée mais pas reliée, non installée, ou à venir.

Sans `entry_id`, le seul lieu configuré est utilisé ; avec plusieurs lieux, la brique doit en choisir un. Les entités restent l’autre moyen de lecture : elles sont reconnues par leur identifiant interne `<entrée>_<clé>`.

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
