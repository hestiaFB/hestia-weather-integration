# Cahier des charges — Hestia Weather

Version 1 — 13 octobre 2026. Document vivant : il évolue avec le projet, et toute décision nouvelle y est écrite avant d'être codée. Il complète la documentation existante (capteurs, synthèse, bulletin, sources, technique), qui décrit le détail.

## 1. Objet

Hestia Weather est **le cerveau météo local** du logement. Il lit la station, le fournisseur de prévisions, les vigilances Météo-France ou MeteoSwiss, Atmo France et les pollens de Polleninformation, IRM KMI, Swiss Pollen ou Kleenex / Scottex ; il calcule une seule fois, dans Home Assistant ; il dit **ce que la météo implique** (ressenti, synthèse, bulletin, alertes) ; il donne ses résultats à la carte et aux autres systèmes. Version stable 2.4.0 : intégration et carte embarquée.

## 2. Principes

1. **Les règles plutôt qu'une IA** : chaque résultat est explicable et testé.
2. **Une donnée manquante reste inconnue**, jamais « pas de pluie » ou « pas d'alerte ».
3. **Capteurs génériques** : des valeurs utiles à tous ; ce qui est propre à une maison va dans des blueprints (sur GitHub).
4. **Stabilité** : de vrais utilisateurs s'en servent ; les identifiants d'entités ne changent jamais.
5. **Hestia Weather décrit le temps ; il ne décide ni ne commande rien** dans la maison.

## 3. Place dans l'écosystème Hestia-FB

Référence commune : la charte de l’écosystème Hestia-FB, partagée par toutes les briques.

**Rôle** : producteur de données météo pour tout l'écosystème. Il ne dépend d'aucune autre brique Hestia-FB.

**Ce qu'il consomme** : Home Assistant (station, entité météo du fournisseur, vigilances Météo-France ou MeteoSwiss, Atmo France, Polleninformation, IRM KMI, Swiss Pollen ou Kleenex / Scottex, soleil). Aucune brique Hestia-FB.

**Liens visibles** : la page **Extensions** du panneau montre chaque brique Hestia-FB : liée à ce lieu, à lier, ou non installée. Une brique est « liée » quand elle écoute ce lieu par l'interface et donne son domaine (`brick`). Le lien se coupe d’un interrupteur, des deux côtés à la fois.

**Panneau commun « Hestia-FB »** (depuis 2.2.0b1, structure commune depuis 2.9.4) : Hestia Weather embarque le socle et s'y inscrit avec l'onglet **Météo** (`/hestia/meteo`) : Accueil à lire seulement, Réglages généraux (lieux, nom des entités, cartes), Extensions, puis les réglages de chaque lieu par étapes (Sources météo, Station météo, Qualité de l’air, Pollens, Eau et jardin, Entités, Récapitulatif ; chacune avec son aide « À quoi sert cet onglet ? »). Mêmes détections que l'assistant de Paramètres, qui reste disponible pour la première installation. Sur l'Accueil : bleu quand chaque lieu est calculé et ses sources choisies répondent ; la station reste facultative. Orange pour une station ou un capteur choisi qui ne répond pas, des prévisions pas reçues, une entité active privée d’une source obligatoire, la carte installée deux fois (une autre ressource de tableau de bord `hestia-weather-card.js` que celle de l’intégration, ou carte HACS encore installée, depuis 2.3) ; plus les briques reliées.

**Carte embarquée** (depuis 2.3) : le code de la carte est dans `card/`, compilé dans `custom_components/hestia_weather/frontend/hestia-weather-card.js` et chargé par l’intégration sur chaque tableau de bord (`?v=` = version de l’intégration) par le socle 1.4 (`async_register_card`, depuis la 2.3.1) : ressource module créée ou mise à jour au démarrage ; module supplémentaire protégé uniquement en repli pour les ressources YAML ou une erreur d’enregistrement. Le bundle entier, Lit compris, attend l’initialisation du registre Home Assistant. Les variantes encodées de la ressource locale (`%2D`) sont regroupées automatiquement en mode stockage. L’application compagnon affiche une copie en cache de la page après une mise à jour, sans les nouveaux modules ; la liste des ressources, elle, vient toujours du serveur. La ressource part avec le dernier lieu. Ses éléments ne sont définis que s’ils n’existent pas encore, et chaque format n’est proposé qu’une fois : la carte HACS restée installée ne casse rien. L’ancien dépôt de la carte seule est archivé depuis la 2.3.0.

**Langues** (depuis 2.9.0 pour la carte, 2.9.4 pour le panneau) : français et anglais ; une autre langue s’affiche en anglais. Les valeurs des capteurs et de l’évènement d’alerte restent en français, pour que les automatisations ne dépendent pas de la langue. D’autres langues viendront des utilisateurs qui les proposent ([technique.md](technique.md#traduire)).

**Ce qu'il fournit**

Corrections de la 2.3.1 (15 octobre 2026) : sans station, les courbes de vent et de pression peuvent lire les attributs historiques de l’entité météo du fournisseur dans Recorder. Leurs valeurs restent celles du service météo ; les données absentes ou exclues ne sont jamais reconstituées. Les cumuls de pluie mesurés nécessitent toujours un pluviomètre facultatif. Les entités restées activées après le retrait de la station ne créent plus de fausses alertes de configuration pour ces capteurs facultatifs, sur l’Accueil, la synthèse Météo ou le récapitulatif des réglages. Un capteur choisi qui ne répond plus reste une panne à signaler.

| Destinataire | Ce qu'il fournit | Intensité |
|---|---|---|
| Hestia Confort | station déjà réglée (température, humidité, pluie, vent et direction, ensoleillement) ; pluie en cours et à venir, orage, vent fort, gel, canicule, vigilance ; prévisions horaires ; qualité de l'air et pollens ; point de rosée, tendance | forte |
| Hestia Chauffage (futur) | prévisions (froid à venir, nuit, ensoleillement), degrés-jours de chauffe et de climatisation | forte |
| Hestia Jardin (futur) | pluie tombée (24 h, 7 jours) et prévue (heure, 6 h, 24 h), et plus tard évapotranspiration et bilan hydrique | forte |
| Hestia Énergie (futur) | ensoleillement prévu demain | moyenne |
| Automatisations | capteurs, oui/non, évènement `hestia_weather_alerte`, action `hestia_weather.prevision`, blueprints | — |

**Partage des rôles** : les décisions qui concernent la maison appartiennent aux autres briques. « Aérer, rafraîchissement, apports solaires » (prévus à l'étape 3) relèvent de **Hestia Confort** ; « arrosage utile » relève de la future brique **Jardin** ; la production solaire estimée relève de la future brique **Énergie**. Hestia Weather leur fournit les données météo nécessaires.

## 4. Interfaces publiées (contrat pour les autres briques)

Ces interfaces sont stables ; un changement incompatible change la version majeure.
- **Interface Python versionnée** `hass.data["hestia_weather_api"]` (version 1) : `places()`, `station()`, `hourly()`, `add_listener(…, brick=)`, `linked()` — détail dans [technique.md](technique.md). Une brique qui écoute un lieu donne son domaine (`brick`) : elle apparaît alors « reliée » dans **Configurer → Écosystème Hestia-FB**, qui montre aussi les briques installées non reliées, absentes ou à venir (règle 4 de l'écosystème).
- **Entités** : `sensor.hestia_weather_<clé>` et `binary_sensor.hestia_weather_<clé>` (deuxième lieu : `hestia_weather_<lieu>_<clé>`). Identifiant interne stable : `<entrée>_<clé>`. Les autres briques les reconnaissent par cet identifiant, jamais par le nom. Liste et attributs communs (`raison`, `source`, `debut`, `fin`, `partiel`, `niveau`) : [capteurs.md](capteurs.md).
- **Entité météo** `weather.hestia_weather` (désactivée par défaut) : prévisions horaires et journalières.
- **Action** `hestia_weather.prevision` (`debut`, `fin`, `lieu`) : la météo d'une fenêtre de temps.
- **Évènement** `hestia_weather_alerte` : début, changement, fin d'une alerte.
- **API WebSocket** `hestia_weather/entries`, `hestia_weather/subscribe` (vue v1, réservée à la carte ; les autres briques utilisent les interfaces ci-dessus). Depuis 2.5.3, une lecture Atmo pollen peut préciser `unavailableReason: "no_index"` pour le code 0 : cet ajout facultatif distingue l’absence d’indice exploitable d’une entité indisponible, sans changer les valeurs ni les concentrations.

## 5. Feuille de route

| Étape | Contenu | État |
|---|---|---|
| 1 | Catalogue de capteurs (7 familles), évènement d'alerte, blueprints alertes / gel / bulletin | ✅ |
| 2 | Action `hestia_weather.prevision`, entité `weather.hestia_weather` | ✅ |
| **2 bis** | **Interfaces pour l'écosystème** : objet versionné `hass.data["hestia_weather_api"]` (lieux, station par rôle dont la **direction du vent**, prévisions horaires avec direction du vent, abonnement) — voir [technique.md](technique.md) | ✅ 2.1.0b1 |
| **2.4.0** | Pollens Swiss Pollen et Kleenex / Scottex, vigilances MeteoSwiss avec leurs degrés natifs, pays couverts indiqués dans les sources | ✅ 2.4.0 |
| 2 ter | Écran **Écosystème Hestia-FB** dans les réglages ; pollens **IRM KMI** (Belgique), 3ᵉ source à côté d'Atmo France et de Polleninformation | ✅ 2.1.0b2 |
| 2 quater | Onglet **Météo** du panneau commun « Hestia-FB » et état sur son Accueil (socle 1.1) | 🧪 2.2.0b1 |
| 2 quinquies | Page d'accueil technique de l'onglet Météo : à régler, à améliorer, sources, capteurs de la station, entités, versions et liens | 🧪 2.2.0b2 |
| 3 | Données pour les autres briques : évapotranspiration (ET0), bilan hydrique, ensoleillement prévu par heure. Les décisions (aérer, rafraîchir, arroser, production solaire) partent dans les briques concernées | à décider |
| — | Correction locale des prévisions par la station | abandonnée le 11 oct. 2026 (gain ~5 %, défauts d'emplacement des capteurs) |

## 6. Historique

- **v1 — 13 octobre 2026** : première version du cahier des charges, centrée sur la place de Hestia Weather dans l'écosystème Hestia-FB et ses interfaces publiées.
- **v1.1 — 14 octobre 2026** : liens visibles dans les réglages (écran Écosystème Hestia-FB, `add_listener(…, brick=)`, `linked()`) ; pollens IRM KMI.
- **v1.2 — 14 octobre 2026** : Hestia Weather rejoint le panneau commun « Hestia-FB » (onglet Météo, état sur l'Accueil) ; l'assistant de Paramètres reste en secours.
