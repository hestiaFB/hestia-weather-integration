# Sources et réglages

[Accueil](../README.md) · [Les capteurs](capteurs.md) · [Le ressenti](ressenti.md) · [La synthèse et les alertes](synthese.md) · [Le bulletin du jour](bulletin.md) · [Pluie, vent, pression](mesures.md) · [Fonctionnement technique](technique.md)

Hestia Weather assemble des données **déjà présentes** dans Home Assistant. Il ne remplace pas vos intégrations : il lit leurs entités et leurs prévisions. Seule l’entité météo est obligatoire ; le reste enrichit.

| Source | Statut | Ce qu’elle apporte |
| --- | --- | --- |
| Entité météo `weather.*` | **Obligatoire** | Ciel de la zone, prévisions heure par heure et jour par jour. Météo-France est recommandé. |
| Station météo | Conseillée | Les mesures prises chez vous. |
| Soleil (`sun.sun`) | Conseillé, déjà présent en général | Jour et nuit, effets du soleil et d’une nuit claire sur le ressenti. |
| Vigilance officielle | Facultative | Les alertes de Météo-France ou de MeteoSwiss pour votre région. |
| Saison | Facultative | La saison de l’intégration Saison ; sinon, calculée d’après la date et l’hémisphère. |
| Atmo France | Facultative | Air extérieur et pollens, aujourd’hui et demain. |
| Vigieau | Facultative | Les restrictions d’eau (sécheresse) de votre commune. |
| Blitzortung | Facultative | Les éclairs détectés autour de chez vous : l’orage vu, pas seulement prévu. |
| PyroVeille | Facultative | Les feux de forêt signalés autour de chez vous, et si le vent pousse leur fumée vers la maison. |
| CrueVeille | Facultative, **bêta** | La hauteur et la montée de la rivière à la station Vigicrues la plus proche. |
| Historique (Recorder) | Facultatif, actif par défaut dans Home Assistant | Courbes et tendances, cumuls de pluie et rafale du jour calculés quand la station ne les donne pas. |

## Configurer

Tout se règle dans le panneau **Hestia-FB** de la barre latérale, onglet **Météo**. Chaque champ arrive prérempli avec ce que Home Assistant connaît : vous vérifiez, vous corrigez si besoin.

- **Accueil** : à lire seulement. L’état de chaque lieu, ce qui reste à régler, les extensions et les versions.
- **Réglages généraux** : vos lieux (**Modifier**, **Ajouter un lieu**) et les cartes. Une installation faite sous l’ancien nom y trouve aussi « Nom des entités » ([les noms techniques](capteurs.md#noms-techniques)).
- **Extensions** : chaque intégration que Hestia Weather sait lire, rangée par thème (sources météo, qualité de l’air, pollens, eau et jardin, orages et éclairs, feux et crues), avec son état : utilisée, installée ou non installée. **Comment l’installer** donne la marche à suivre. Hestia Confort s’y relie d’un interrupteur.

Un lieu se règle en sept étapes :

1. **Sources météo** : l’entité météo, le nom du lieu, la vigilance, la saison, les éclairs (Blitzortung), les feux de forêt (PyroVeille) et la rivière (CrueVeille).
2. **Station météo** : le modèle reconnu, puis chaque capteur. Laissez vide ce que la station ne mesure pas.
3. **Qualité de l’air** : Atmo France, une station WAQI, ou aucune.
4. **Pollens** : Atmo France, Polleninformation, IRM KMI (Belgique), Swiss Pollen (Suisse), Kleenex / Scottex (France et autres pays couverts) ou aucune. Avec Swiss Pollen, choisissez une station commune aux espèces suivies ; avec les autres fournisseurs par espèce, choisissez leurs capteurs.
5. **Eau et jardin** : les restrictions d’eau de votre commune (Vigieau).
6. **Entités** : les familles d’entités à activer (Maintenant, Alertes, Prochaines heures, Jardin…), et ce qui manque à certaines (un capteur UV, Atmo France…).
7. **Récapitulatif** : tout ce que vous avez choisi.

Rien n’est enregistré avant **Enregistrer**. **Un champ laissé vide est un choix** : il n’est jamais rempli à votre place ensuite. Plusieurs lieux ? **Ajouter un lieu**, une fois par lieu.

La toute première fois, l’intégration s’ajoute comme les autres : **Paramètres → Appareils et services → Ajouter une intégration → Hestia Weather**. Vous aviez déjà la carte ? Le guide propose de reprendre ses réglages.

Pour les éclairs, le nom à chercher dans HACS est **Blitzortung.org Lightning Detector**. Après le téléchargement et le redémarrage de Home Assistant, ajoutez l’intégration Blitzortung dans **Appareils et services**, puis choisissez son capteur de distance dans **Sources météo**.

## Météo-France — ciel et prévisions

Configurez [l’intégration Météo-France](https://www.home-assistant.io/integrations/meteo_france/) pour votre commune, puis choisissez son entité `weather.*`. Une autre entité météo convient si elle fournit les prévisions horaires et quotidiennes ; tous les fournisseurs ne sont pas vérifiés.

Hestia Weather lit jusqu’à 18 heures et 7 jours, selon ce que le fournisseur donne : un horizon absent n’est pas inventé. La température du bulletin sert seulement quand il n’y a pas de thermomètre local.

**Pour un ciel plus fidèle**, activez le capteur « Condition d’origine » de Météo-France (désactivé par défaut : Paramètres → Appareils et services → Météo-France → entités masquées). Le ciel animé distingue alors ce que Météo-France distingue : bruine, averses, pluie verglaçante, brume, bancs de brouillard, brouillard givrant… Sans lui, Hestia Weather déduit ce qu’il peut des chiffres (bruine, verglas, quelques flocons, neige forte).

**La station passe devant le bulletin** pour le temps du moment quand elle constate autre chose : pluie mesurée (dès 0,3 mm/h), brouillard probable, soleil fort sous un ciel annoncé couvert. Elle ne prétend jamais constater la foudre : sans [Blitzortung](#blitzortung--éclairs), les orages restent des prévisions. Cela change la présentation du temps actuel, pas les prévisions.

## Station météo

Les capteurs peuvent venir de [l’intégration Ecowitt](https://www.home-assistant.io/integrations/ecowitt/) (GW2000A), d’une WS90 via Zigbee2MQTT, d’une station [Netatmo](https://www.home-assistant.io/integrations/netatmo/), ou de n’importe quel appareil, choisis à la main. Hestia Weather reconnaît la station et propose ses capteurs ; les listes sont filtrées par type et par unité. Vérifiez que température et humidité sont bien celles de **l’extérieur**, et préférez la pression **relative**.

| Mesure | Utilité |
| --- | --- |
| Température et humidité extérieures | Thermomètre local, base du ressenti, de l’humidex, des points de rosée et de givre |
| Vent moyen, direction, rafales, rafale maximale du jour | Ressenti, alertes de vent, cadre Vent |
| Intensité de pluie, pluie depuis minuit | Pluie en cours, temps observé, cadre Pluie |
| Pluie sur 24 h, semaine, mois, année, épisode, compteur total | Bilans de pluie, sans additionner les compteurs entre eux |
| Pression | Cadre Pression et tendance |
| Rayonnement solaire, UV, luminosité | Effet du soleil sur le ressenti, alerte UV |
| Point de rosée, tendance de température | Gardés tels quels quand la station les donne |

Chaque mesure est facultative. Sans mesure locale, les cadres de la carte utilisent le bulletin et le disent. Un capteur configuré qui devient indisponible n’est pas remplacé en silence : le repli est signalé. Les compteurs semaine et mois sont ceux de la station : ils suivent ses remises à zéro.

### Netatmo

Choisissez **Netatmo** : la station se choisit en entier, par son module principal, et Hestia Weather prend chaque mesure dans le bon module, même renommé.

| Module | Mesures prises |
| --- | --- |
| Module extérieur | Température, humidité |
| Module principal (intérieur) | Pression seulement : sa température et son humidité sont celles de la maison |
| Pluviomètre | Pluie de la dernière heure (« il pleut maintenant »), pluie du jour, qui sert aussi de compteur pour la semaine et le mois |
| Anémomètre | Vent moyen, rafales, direction en degrés |

Home Assistant livre trois de ces capteurs **désactivés** : rafales, angle du vent et pluie de la dernière heure. L’onglet Météo les signale ; activez-les dans **Paramètres → Appareils**, puis **Rechercher à nouveau les capteurs**. Sans eux, pas d’alerte de vent fort ni de pluie mesurée en ce moment.

La pluie de la dernière heure reste positive jusqu’à une heure après l’averse : la carte dit « il pleut » un peu plus longtemps qu’avec une station qui mesure l’intensité. Les modules intérieurs et les stations publiques Netatmo ne sont jamais pris.

Toutes les unités sont converties avant calcul (°F, m/s, mph, pouces, Pa…). Une valeur inconnue, indisponible ou vide ne devient jamais un zéro.

## Soleil

[L’intégration Soleil](https://www.home-assistant.io/integrations/sun/) est utilisée automatiquement (`sun.sun`). Elle donne la hauteur du soleil, donc le jour, le crépuscule et la nuit, et les effets du soleil et d’une nuit claire. Sans elle, ces effets sont réduits.

## Atmo France — air et pollens

Installez [l’intégration Atmo France](https://github.com/sebcaps/atmofrance) avec son compte Atmo Data, pour votre commune, et activez-y les indicateurs de pollution, de pollens et leurs prévisions si vous le souhaitez. Vos identifiants restent dans cette intégration : Hestia Weather n’en demande aucun.

Hestia Weather lit, pour aujourd’hui et pour demain, **19 mesures** : l’indice de l’air, cinq sous-indices (PM2.5, PM10, NO₂, O₃, SO₂), l’indice pollen, et le niveau et la concentration de six espèces (graminées, ambroisie, armoise, aulne, bouleau, olivier).

- Échelle de l’air : **1 (bon) à 6 (extrêmement mauvais)** ; pollens : **1 (très faible) à 6 (extrêmement élevé)**. **0 veut dire indisponible**, pas « aucun pollen ». **7 est un évènement**, pas un niveau.
- Un sous-indice pire que l’indice global reste visible, sous son nom.
- Les concentrations gardent leur unité, sans conversion ni seuil inventé.
- Ce sont des données de **zone**, pas des mesures du jardin. Une publication de plus de 48 h est signalée.

### Polleninformation, l’autre source de pollens

[Polleninformation EU](https://github.com/krissen/polleninformation) donne un capteur par espèce et un risque d’allergie global, aujourd’hui et demain. Choisissez **Polleninformation** dans **Qualité de l’air et pollens** : Hestia-FB propose les capteurs de votre lieu, vous vérifiez, ajoutez ou retirez.

- Échelle : **0 (aucun) à 4 (très élevé)**, gardée telle quelle : la carte affiche « Niveau 2 sur 4 ».
- Le panneau Pollens de la carte, le capteur `sensor.hestia_weather_pollens` et la synthèse les utilisent.
- Le niveau du jour est le risque d’allergie global quand il est choisi, sinon l’espèce la plus élevée.
- Une seule source de pollens à la fois : Atmo France, Polleninformation, IRM KMI, Swiss Pollen ou Kleenex / Scottex.

### IRM KMI, les pollens en Belgique

[IRM KMI](https://github.com/jdejaegh/irm-kmi-ha) (version HACS) donne un capteur par espèce : aulne, frêne, bouleau, graminées, noisetier, armoise et chêne. Choisissez **IRM KMI (Belgique)** dans **Pollens** : Hestia-FB propose ses capteurs, vous vérifiez, ajoutez ou retirez.

- Ses couleurs sont lues sur la même échelle **0 à 4** : vert ou « aucun » = 0, jaune = 1, orange = 2, rouge = 3, violet = 4.
- Pas de risque global : le niveau du jour est celui de l’espèce la plus élevée.
- Pollens du jour seulement : le panneau « Pollens demain » reste vide.
- Sa météo peut aussi servir d’entité météo de Hestia Weather.

### Swiss Pollen, les pollens en Suisse

Installez [Swiss Pollen](https://github.com/frimtec/hass-swiss-pollen) dans HACS et configurez les espèces et stations souhaitées. Dans Hestia-FB, choisissez **Swiss Pollen (Suisse)**, une station de mesure, puis les espèces à suivre. Une station unique est proposée automatiquement ; plusieurs stations demandent un choix.

- Hestia-FB reprend le niveau calculé par le fournisseur : **0 aucun, 1 faible, 2 modéré, 3 élevé, 4 très élevé**. Il ne convertit pas les concentrations en indice Atmo.
- Les mesures concernent le présent : aucune prévision pollen pour demain n’est inventée.
- Les capteurs de diagnostic « état de la station » doivent être activés. Si l’état est absent, hors service ou en erreur, le niveau reste indisponible, y compris lorsqu’un capteur conserve une ancienne valeur.
- La carte, la synthèse et le capteur Pollens utilisent la même disponibilité.

### Kleenex / Scottex — France et autres pays couverts

Installez [Kleenex Pollen Radar](https://github.com/MarcoGos/kleenex_pollenradar) dans HACS et configurez le lieu. Choisissez ensuite **Kleenex / Scottex** dans Hestia-FB. Les pays couverts sont indiqués à côté du fournisseur : France, Italie, Pays-Bas, Royaume-Uni, Irlande et États-Unis. La Suisse n’est pas annoncée par ce fournisseur. Polleninformation indique « Europe, selon les zones » : la couverture dépend du lieu.

Hestia-FB propose un seul lieu à la fois, puis les groupes **arbres, graminées, herbacées** et les capteurs détaillés par espèce que vous avez activés dans Kleenex. Il utilise les niveaux **1 faible, 2 modéré, 3 élevé, 4 très élevé** ; une concentration de zéro n’est pas transformée en niveau « aucun ».

Les prévisions de **demain** sont retrouvées par leur date, sans supposer un ordre dans la liste. Une date absente reste inconnue. Hestia-FB contrôle les capteurs de diagnostic **Date** et **Last Updated (Pollen)** : ils doivent être activés. Les données d’un autre jour, sans date de mise à jour ou de plus de 48 heures restent indisponibles. Si le capteur facultatif **Error** est activé, une erreur signalée rend également les niveaux indisponibles.

Hestia-FB reprend les entités Home Assistant existantes, sans connexion supplémentaire au service Kleenex. La carte, la synthèse et les automatisations utilisent les mêmes données validées.

## MeteoSwiss — prévisions et vigilances suisses

Installez [MeteoSwiss](https://github.com/izacus/hass-swissweather) dans HACS. Choisissez son entité `weather.*` pour les prévisions, et son capteur **Weather warnings** pour les vigilances officielles. Ce dernier regroupe toutes les alertes ; Hestia-FB le reconnaît même si vous l’avez renommé.

Hestia-FB conserve les phénomènes, leurs degrés suisses de **1 à 5**, leurs consignes et leurs dates de validité. Les alertes expirées sont retirées ; les avertissements publiés pour les prochaines heures restent visibles. Des attributs incomplets restent inconnus.

Le capteur Vigilance conserve son état compatible avec les automatisations existantes (`vert`, `jaune`, `orange`, `rouge`). Les degrés 2, 3 et 4–5 correspondent respectivement aux présentations jaune, orange et rouge. Le **degré 5 reste explicitement visible** dans le texte et les attributs `degre`, `echelle`, `degres_phenomenes` et `alertes` ; une transition de 4 à 5 déclenche aussi un événement de changement d’alerte. Les attributs `alertes` donnent les dates et les consignes ; le capteur source donne accès aux liens officiels.

## Vigieau — restrictions d’eau

Installez [Vigieau](https://github.com/kamaradclimber/vigieau) dans HACS, pour votre commune. Choisissez son capteur **niveau d’alerte** (pas sa version chiffrée). Vigieau crée une zone par type d’eau : avec plusieurs zones, Hestia-FB propose celle de l’**eau du robinet (AEP)** ; changez-la si vous arrosez avec un puits (eau souterraine, SOU) ou une rivière (eau de surface, SUP).

Le capteur **Restrictions d’eau** (famille Jardin) reprend le niveau : pas de restriction, vigilance, alerte, alerte renforcée ou crise. La vigilance demande d’économiser l’eau sans rien interdire : la carte et la synthèse n’en parlent qu’**à partir de l’alerte**, en disant si l’arrosage fait partie des usages restreints. Le détail des usages et le lien de l’arrêté préfectoral sont en attributs. Une Vigieau qui ne répond pas laisse le capteur inconnu, jamais « pas de restriction ».

## Blitzortung — éclairs

Installez [Blitzortung](https://github.com/mrk-its/homeassistant-blitzortung) dans HACS, centré sur votre maison (c’est le réglage par défaut). Choisissez son capteur **distance** : chaque éclair le met à jour.

Ce capteur ne garde que le dernier éclair ; Hestia Weather retient lui-même ceux de la dernière heure et lit ceux des **20 dernières minutes** :

- **à moins de 30 km**, le capteur Orage s’allume, même sans orage prévu. Il dit la distance, la direction et si l’orage se rapproche ou s’éloigne : « Orage à 12 km au sud-ouest, il se rapproche ». Il reste allumé environ 35 minutes après le dernier éclair proche : 20 minutes d’éclairs lus, puis les 15 minutes de tenue de toutes les alertes ;
- **à moins de 10 km** dans les 10 dernières minutes, le temps du moment devient « Orage », quel que soit le bulletin ;
- **plus loin**, la synthèse le signale pour information (« Orage au loin : 45 km au nord »), sans alerte.

Les éclairs ne font jamais tomber une vigilance ni un orage prévu : quand le bulletin annonce un orage en cours sans éclair à moins de 30 km, le capteur Orage reste allumé et le dit. Après un redémarrage, les éclairs de la dernière heure reviennent de l’historique, sans leur direction. Les données viennent d’un réseau bénévole de détecteurs : très fiables en France, mais ce n’est pas un service officiel.

## PyroVeille — feux de forêt

Installez [PyroVeille](https://github.com/vico34/pyroveille) dans HACS, centré sur votre maison, avec le rayon qui vous intéresse. Choisissez son capteur **Alerte incendie proche** : il liste les feux du rayon.

Le capteur **Incendie proche** (famille Alertes) dit le feu le plus proche : `aucun`, `eteint`, `signale` ou `actif`, avec sa distance, sa direction et sa commune : « Feu actif à 4,6 km au sud-ouest (Gignac 34) ».

- Un feu **signalé ou actif** dans le rayon apparaît dans la synthèse, à surveiller.
- Un feu **actif à moins de 10 km**, ou dont **le vent pousse la fumée vers la maison**, demande une attention renforcée. Le vent est celui de votre station quand elle a une girouette, sinon celui du service météo.
- Un feu éteint reste en attribut, sans alerte.

Les attributs donnent la distance, la direction, la fumée vers la maison (`fumee_vers_maison`), le nombre de feux, le rayon et le lien du signalement. Les données viennent de la carte participative feuxdeforet.fr : ce n’est **pas une vigilance officielle**. Un PyroVeille qui ne répond pas laisse le capteur inconnu, jamais « aucun ».

## CrueVeille — rivière (bêta)

Installez [CrueVeille](https://github.com/vico34/crueveille) dans HACS, sur votre position ou une station précise, avec vos seuils. Choisissez son capteur **Alerte inondation** : il porte toutes les mesures.

Le capteur **Rivière** (famille Alertes) reprend le niveau que CrueVeille calcule avec vos seuils : `calme`, `a_surveiller`, `vigilance` ou `critique`, avec la station, la hauteur et la montée : « Seuil de vigilance · La Loire à Orléans : 2,10 m, +8 cm/h ». La synthèse en parle **à partir du seuil de vigilance**. La hauteur projetée et l’heure de la mesure sont en attributs.

Les hauteurs viennent de Hub’Eau (Vigicrues). Le niveau est celui de CrueVeille, **pas la vigilance crues officielle**, qui arrive avec la vigilance Météo-France (« Crues », « Inondation »). CrueVeille est récent : Hestia-FB le lit en **bêta**, ses capteurs peuvent encore changer.

## Historique (Recorder)

Les capteurs de vent, de pression et de pluie doivent être enregistrés par l’historique de Home Assistant (c’est le cas par défaut). Il sert aux courbes, aux tendances et aux bilans calculés : voir [Pluie, vent, pression](mesures.md). Sans historique, les valeurs du moment restent affichées et rien n’est inventé.

## Les réglages

Les clés sont les mêmes que dans le YAML de la carte avant la 2.0 : les réglages d’une ancienne carte se reprennent tels quels.

| Réglage | Rôle |
| --- | --- |
| `weather_entity` | Entité météo, obligatoire |
| `location`, `forecast_source` | Nom du lieu et du fournisseur, si vous voulez les changer |
| `vigilance_entity` | Vigilance Météo-France ou capteur agrégé des alertes MeteoSwiss |
| `season_entity` | Capteur de l’intégration Saison |
| `water_restriction_entity` | Capteur niveau d’alerte de Vigieau |
| `lightning_entity` | Capteur distance de Blitzortung |
| `fire_entity` | Capteur « Alerte incendie proche » de PyroVeille |
| `river_entity` | Capteur « Alerte inondation » de CrueVeille (bêta) |
| `sun_entity`, `sun_elevation_entity` | Soleil, si ce n’est pas `sun.sun` |
| `station_model` | `gw2000a`, `ws90`, `netatmo` ou `manual` |
| `station_history` | Calculer les cumuls de pluie et la rafale du jour depuis l’historique quand la station ne les donne pas (activé) |
| `temperature_entity`, `humidity_entity`, `dew_point_entity`, `temperature_trend_entity` | Température, humidité, point de rosée, tendance en °C/h |
| `wind_speed_entity`, `wind_gust_entity`, `wind_bearing_entity`, `max_daily_gust_entity` | Vent moyen, rafales, direction, rafale maximale du jour |
| `rain_rate_entity`, `daily_rain_entity`, `rain_24h_entity`, `weekly_rain_entity`, `monthly_rain_entity`, `yearly_rain_entity`, `event_rain_entity`, `rain_total_entity` | Intensité, cumuls de la station, compteur total |
| `pressure_entity` | Pression relative |
| `solar_radiation_entity`, `uv_index_entity`, `illuminance_entity` | Rayonnement, UV, luminosité |
| `atmo_area` | Zone Atmo France pour la qualité de l’air et les polluants |
| `atmo_pollen_area` | Zone Atmo France pour les pollens ; reprend `atmo_area` pour les anciens réglages |
| `atmo_<mesure>_entity`, `atmo_<mesure>_tomorrow_entity` | Les mesures Atmo du jour et de demain (`air`, `pm25`, `grass`, `grass_concentration`…) |
| `pollen_source` | `atmo`, `legacy` (un capteur par espèce : Polleninformation, IRM KMI, Swiss Pollen ou Kleenex / Scottex) ou `none` |
| `pollen_provider` | `polleninformation` (par défaut), `irm_kmi`, `swiss_pollen` ou `kleenex_pollenradar` : d’où viennent les capteurs par espèce |
| `pollen_station` | Code de la station Swiss Pollen ou identifiant du lieu Kleenex / Scottex |
| `air_source` | `none` : pas de qualité de l’air, même si la zone Atmo sert aux pollens |
| `pollens`, `pollen_risk_entity` | Les capteurs par espèce suivis, et le risque d’allergie global de Polleninformation |
| `families` | Les familles d’entités choisies à l’installation (elles décident des entités activées au départ) |

Les anciens réglages Thermal Comfort sont ignorés : Hestia Weather calcule lui-même humidex, point de rosée et point de givre.

Atmo France peut fournir l’air à l’échelle intercommunale et les pollens à celle de la commune. Choisissez leur zone séparément dans **Qualité de l’air** et **Pollens** : modifier l’une ne change pas l’autre.

Pour les pollens Atmo France, l’indice 0 signifie qu’aucun indice exploitable n’est fourni. Pour demain, la carte indique **Prévision non disponible** et en explique la raison. Une concentration à 0 reste affichée : elle peut être réellement nulle ou remplacer une donnée manquante dans l’intégration Atmo ; la carte précise cette ambiguïté si l’indice associé est indisponible. Une entité `unknown` ou `unavailable` reste distincte de ce code 0.
