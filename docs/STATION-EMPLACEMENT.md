# L'emplacement de la station : ce que les capteurs ne disent pas

Version 1.0 — 5 novembre 2026. **Validée par Frank le 5 novembre** (« ok go », tout le cahier tel quel, sol compris).

**Codé le 5 novembre** dans `niak-weather-integration` (branche `main`, non commité), déployé et vérifié au labo : `engine/station_place.py` (méfiance, apprentissage, fiabilité), `place/shade.py` (même nuit et même appel Open-Meteo que l'ombre, `Store` `hestia_weather.station.<entry_id>`), surcouche dans `coordinator.py`, `api.station_trust`, onglet Station › Emplacement et questionnaire (`frontend/emplacement.ts`), État › Fiabilité de la station, lignes « Où est votre station ? » et « Le pluviomètre semble à l'abri » dans « À améliorer ». Tests : `tests/test_station_place.py`.

Reste :
- **Hestia Confort** ne lit pas encore `api.station_trust` (température retenue, rafales du côté abrité, pluie non démentie) : à faire dans `niak-comfort-integration`.
- Le **ressenti de Weather à l'ombre** (§ 4.2, « Ajout pour Weather lui-même ») n'est pas codé : Weather n'a pas le soleil prévu en W/m² à l'instant.
- Les **gouttes de l'arbre** (§ 4.3) ne sont pas codées : sous 0,3 mm/h, Weather ne dit déjà pas « pluie en cours ».
- Au labo, la première nuit n'a lu que 6 jours (il garde son historique depuis le 1er novembre) : la maison en aura 92.

La maquette : [maquette-station-emplacement.html](maquette-station-emplacement.html), à ouvrir dans un navigateur.

Modèle suivi : le questionnaire « Vos habitudes » de Hestia Confort (`niak-comfort/docs/HABITUDES-FOYER.md`, validé le 5 novembre) : une question par écran, « Je ne sais pas » par défaut, les mêmes réponses modifiables ensuite en lignes.

Sources lues : `engine/station_shade.py`, `place/shade.py` (commit 22d2e3e), `draft.py` (`SHADES`, `_station`), `engine/settings.py` (`station_shade`), `frontend/panel.ts` (`station()`, `stateTab()`), `engine/current.py`, `engine/local.py`, `engine/catalogue.py`, `api.py` (`station`, `station_shade`) ; côté Confort : `weather_link.py` (`ROLES`), `advisor_home.py` (`_read_outdoor`, `coming`, `shade`), `advisor/safety.py` (`rain_believed`, `forbidden`).

---

## 1. Le problème, vu dans le code

- **La station passe toujours devant la prévision.** `current_metrics` et `build_local` prennent la mesure dès qu'elle existe ; le bulletin ne la remplace que si le capteur est muet. Une station contre un mur au soleil donne 3 °C de trop à 16 h : la carte, le ressenti, l'alerte de chaleur et les entités les reprennent tels quels.
- **Confort prolonge l'erreur.** `advisor_home.coming` calcule l'écart entre la station et la prévision à l'instant, puis le garde en le laissant s'éteindre sur les heures suivantes. Un mur chaud à 16 h rend toute la soirée prévue plus chaude : « Il fait plus chaud dehors » peut empêcher une aération utile.
- **Un pluviomètre à l'abri dément la pluie.** Weather écrit « Nuageux, sans pluie mesurée » quand le pluviomètre reste à 0 pendant une pluie annoncée (`current.py`, `NO_RAIN_MEASURED`). Confort cesse de croire une pluie annoncée après une attente sans goutte (`rain_believed`). Sous un arbre, les deux ont tort.
- **Un anémomètre abrité laisse ouvrir par grand vent.** `vent_fort` (catalogue) et `forbidden(gust)` (Confort) lisent les rafales de la station. Si la maison l'abrite de l'ouest, un coup de vent d'ouest passe pour du calme.
- **L'ombre, seule, est déjà traitée.** Le choix « Station à l'ombre » (`station_shade` : jamais, le matin, l'après-midi) sert en attendant que les nuits l'apprennent (`station_shade.filled`). C'est le bon modèle : on le généralise.

---

## 2. Le principe

**Ce que vous dites sert tout de suite. Ce que Hestia apprend le remplace.**

1. **D'abord se méfier.** Une réponse ne change aucun chiffre. Elle dit **quand** une mesure peut être fausse (« par beau temps, de 13 h à 17 h ») : à ces moments, Weather prend la prévision et le dit.
2. **Puis vérifier.** Chaque nuit, Weather compare la station à la prévision du même lieu sur les 92 derniers jours (statistiques à long terme de HA et Open-Meteo, le même appel que l'ombre). Il en tire l'écart propre à chaque situation.
3. **Ne corriger qu'un écart appris.** Une valeur n'est corrigée que de l'écart mesuré, jamais d'un chiffre écrit d'avance. Si l'écart appris est nul, la méfiance tombe : « Le mur ne chauffe pas la station, vérifié sur 41 jours ».
4. **Jamais l'écart de fond.** Une station plus froide que la prévision la nuit, dans un vallon, dit vrai : c'est la prévision qui voit large. Seul l'écart **en plus** par beau temps, ou d'un côté du vent, est traité.
5. **L'apprentissage agit même sans réponse.** Une réponse aide les premières nuits, et les saisons pas encore vues (le soleil d'été sur un mur, en novembre). Sans réponse, Weather apprend quand même, plus lentement.

**Pas de constante du foyer.** Les heures de méfiance viennent de la position du soleil (`station_shade.sun_position`), les écarts de l'historique. Les seuils d'apprentissage sont listés au § 7 pour validation.

---

## 3. Les questions retenues (7, dont 5 à 7 posées selon la station)

Chaque réponse est un réglage du lieu, dans `Settings`, avec « Je ne sais pas » par défaut : le moteur se comporte alors comme aujourd'hui, plus ce qu'il apprend.

| # | Question | Réponses | Posée si | Clé (`Settings`) |
|---|---|---|---|---|
| 1 | Où est la station ? | Côté de la maison : N · NE · E · SE · S · SO · O · NO (une rose) · Sur le toit · Loin de la maison, au jardin · Je ne sais pas | toujours | `station_side` : `n`… `nw`, `roof`, `open`, vide |
| 2 | À quelle distance du mur ? | Contre le mur (moins de 1 m) · De 1 à 3 m · Plus loin · Je ne sais pas | 1 = un côté | `station_wall` : `against`, `near`, `far`, vide |
| 3 | À quelle hauteur ? | Moins de 1,5 m · De 1,5 à 2 m (la norme) · Plus haut · Je ne sais pas | 1 ≠ toit | `station_height` : `low`, `standard`, `high`, vide |
| 4 | Le sol en dessous ? | Herbe ou terre · Gravier · Dalle, terrasse, bitume · Je ne sais pas | 1 ≠ toit | `station_ground` : `grass`, `gravel`, `paving`, vide |
| 5 | Le soleil sur la station ? | Plein soleil · Ombre le matin · Ombre l'après-midi · Presque toujours à l'ombre · Je ne sais pas | capteur de soleil choisi | `station_shade` (existant) : `never`, `morning`, `afternoon`, **`always`** (nouveau), vide |
| 6 | Le pluviomètre est-il à l'abri ? | À découvert · Sous un arbre · Près d'un mur ou sous un avant-toit · Je ne sais pas | pluviomètre choisi | `rain_gauge_shelter` : `open`, `tree`, `eave`, vide |
| 7 | Autour de la station, d'où le vent arrive-t-il librement ? | Une rose de 8 côtés autour de la station, chacun « dégagé » (bleu) ou « gêné » (pointillé gris) ; on touche un côté pour le changer · Je ne sais pas | anémomètre choisi | `wind_shelter` : liste des côtés gênés, `[]` = dégagée de tous côtés, absent = je ne sais pas |

- **La question 5 remplace « Station à l'ombre »** (`SHADES` de `draft.py`, ligne « Pour aller plus loin » de l'étape Station). Les valeurs gardées ne bougent pas : « Jamais » devient le libellé « Plein soleil ». Une seule valeur nouvelle, `always`.
- **La question 7 montre les côtés dégagés** (remarque de Frank, 5 novembre) : la rose part de « dégagé » partout, et la phrase dessous les nomme : « Dégagée : N, NE, E, SE, S, SO, NO · gênée : O ». Elle est **préremplie** par les questions 1 et 2 : une station contre le mur sud a la maison au nord, le côté N est déjà « gêné · la maison ». On touche la haie pour l'ajouter.
- Une station Netatmo sans anémomètre ni pluviomètre : 5 questions. Une station complète loin de la maison : 6 (pas de distance au mur).

### Écartées ou fondues

| Proposition | Pourquoi |
|---|---|
| « Sur le toit » en question 3 (hauteur) | Déjà dit en question 1 ; la 3 ne se pose pas pour le toit |
| Le sol, pour une station sur le toit | Le toit est le sol : réglé par la question 1 |
| L'orientation exacte en degrés | La rose à 8 côtés suffit au calcul du soleil sur le mur (§ 4.1) ; l'apprentissage fait le reste |
| Le modèle d'abri du thermomètre (ventilé ou non) | La famille ne le sait pas ; l'écart par beau temps appris le contient |

---

## 4. Ce que chaque réponse fait

### 4.1 Température — questions 1, 2, 3, 4 (et 5)

**Avant l'apprentissage, se méfier :**

| Réponse | Quand se méfier | Ce que fait Weather à ces moments |
|---|---|---|
| Contre le mur, côté C | Quand le soleil fait face au mur : azimut du soleil à moins de 45° de l'orientation du mur, jusqu'au coucher (le mur rend sa chaleur), et ciel prévu à moins de 60 % couvert (`DIRECT_CLOUDS`, déjà employé pour l'ombre). Mur SO à 46° N en novembre : de 12 h 30 à 17 h 20 ; en juillet : de 13 h 50 à 21 h 25 (calculé avec `sun_position`) | Si la station dépasse la prévision, la **prévision** est prise : carte, ressenti, chaleur, entités. Source : « Prévision · la station est au soleil contre le mur » |
| De 1 à 3 m du mur, côté C | Mêmes heures | Rien ne change ; la ligne de fiabilité dit « à vérifier » jusqu'à l'apprentissage |
| Sur le toit | Toute la journée au soleil (ciel prévu à moins de 60 % couvert) | Comme « contre le mur » |
| Moins de 1,5 m, ou dalle, gravier | Par beau temps l'après-midi ; la nuit claire pour une station basse sur l'herbe | Rien ne change ; « à vérifier ». Le gel mesuré par une station basse est dit « gelée au sol » |
| Ombre (question 5) au moment voulu | La méfiance de la ligne 1 ne s'applique pas quand la station est à l'ombre (ombre apprise, sinon déclarée) | — |

**L'apprentissage, chaque nuit** (avec l'ombre, `place/shade.py`, un seul appel Open-Meteo : on ajoute `temperature_2m`) :

- **Écart de fond** : station moins prévision, par ciel couvert (au moins 80 % de nuages), le jour et la nuit à part. Gardé tel quel, jamais corrigé (§ 2, point 4).
- **Écart de beau temps** : le même écart par ciel clair (moins de 20 %, `CLEAR_CLOUDS`) et par ciel mêlé (20 à 60 %), **par position du soleil** (secteurs de 30° d'azimut, et la nuit à part), moins l'écart de fond. La position du soleil plutôt que l'heure : le mur d'été se reconnaît au printemps.
- Un secteur est appris au bout de 12 heures (comme `RECENT_HOURS`), puis suit ses dernières heures à mi-chemin chaque nuit (`BLEND`), comme l'ombre.

**Après l'apprentissage, corriger ce qui est appris :**

| Appris | Weather fait | La carte dit |
|---|---|---|
| Écart de beau temps de 1 °C ou plus dans ce secteur, par ce ciel | Mesure **moins l'écart appris** | « Corrigée : le mur au soleil ajoute 2 °C » |
| Écart de moins de 1 °C | La mesure, la méfiance tombe | rien (« Station locale ») |
| Nuit claire plus froide de 1 °C ou plus (station basse) | La mesure, gardée : c'est le froid au ras du sol | Gel : « Gelée au sol » ; la minimale prévue reste celle de la prévision |
| Secteur pas encore appris | La règle d'avant l'apprentissage | « Prévision · la station est au soleil contre le mur » |

**Hestia Confort** lit aujourd'hui le capteur brut (`ROLES` : `temperature` → `outdoor_temperature`). Proposition : une méthode `api.station_trust(entry_id)` (§ 5) qui donne la température retenue et sa raison. Confort la prend à la place du capteur, et `coming()` ne prolonge plus dans la soirée un écart dû au mur.

### 4.2 Soleil — question 5

| Réponse | Aujourd'hui | Proposé |
|---|---|---|
| Plein soleil | `never` : 1,0 partout | inchangé |
| Ombre le matin / l'après-midi | 0,3 à l'est / à l'ouest | inchangé |
| Presque toujours à l'ombre | n'existe pas | `always` : 0,3 partout (`SHADED`) |
| Je ne sais pas | rien | inchangé |

L'ombre apprise la nuit prend le relais, case par case (`station_shade.filled` : appris, puis voisines, puis déclaré). **Ajout pour Weather lui-même** : quand la station est dans une case apprise à l'ombre (part sous 0,5), le ressenti (`verdict`, `solar_radiation`) prend le soleil de la prévision, et « du soleil malgré le bulletin » ne se dit pas à l'ombre. Confort le fait déjà (`api.station_shade`).

### 4.3 Pluie — question 6

**Avant l'apprentissage, se méfier :**

| Réponse | Weather | Confort |
|---|---|---|
| Sous un arbre, ou près d'un mur / avant-toit | Un pluviomètre à 0 **ne dément plus** une pluie annoncée : pas de « Nuageux, sans pluie mesurée », le ciel du bulletin reste. Une pluie mesurée reste dite (s'il mesure, il pleut). Les cumuls disent « peut-être en dessous de la vraie pluie » | `rain_believed` ne cesse plus de croire une pluie annoncée faute de goutte |
| Sous un arbre | En plus : 30 minutes après la fin de la pluie annoncée, une petite intensité est dite « gouttes de l'arbre », pas « pluie en cours » | pareil, via `pluie_en_cours` |

**L'apprentissage** : par jour de pluie (au moins 1 mm à la station ou à la prévision), le cumul mesuré sur le cumul prévu. Sur 15 jours de pluie au moins, la médiane dit ce que recueille le pluviomètre.

**Pas de correction de la pluie, jamais.** Une averse est trop locale pour qu'une prévision serve d'étalon, et un arbre change avec ses feuilles. Ce qui est appris s'affiche seulement : « Votre pluviomètre recueille environ la moitié de la pluie prévue (22 jours de pluie) ». Appris sans réponse, cela se dit aussi, et la question 6 remonte dans « À améliorer ».

### 4.4 Vent — questions 7 (et 1, 2, 3)

**Avant l'apprentissage, se méfier** : quand le vent **prévu** vient d'un côté abrité (la girouette de la station est elle aussi déviée par l'obstacle : on lit la direction du bulletin), la station ne peut pas dire « calme ».

| Weather | Confort |
|---|---|
| Vent et rafales : la plus forte des deux valeurs, station ou prévision. Source : « Prévision · station abritée à l'ouest ». `vent_fort` peut s'allumer sur la prévision | `forbidden(gust)` prend la plus forte des rafales, station ou prévision : pas de fenêtre grande ouverte par vent d'ouest |

**L'apprentissage** : vent moyen de la station sur vent prévu (`wind_speed_10m`), par côté du vent prévu (8 côtés), aux heures où il souffle au moins à 10 km/h. Toutes les stations d'amateur lisent moins que la prévision à 10 m : on compare chaque côté à la médiane des côtés. Un côté à moins de la moitié de la médiane est **abrité appris**, sur 12 heures au moins.

**Pas de correction du vent** : un anémomètre abrité perd surtout les rafales, de façon irrégulière. Pour un côté abrité appris, la prévision est prise, comme avant l'apprentissage. Un côté déclaré mais pas abrité à l'usage est rendu à la station : « La haie ne gêne pas le vent, vérifié sur 60 heures ».

Une station sur le toit ou à plus de 2 m lit mieux le vent : rien de plus à faire.

---

## 5. Ce qui est déclaré, ce qui est appris

| Mesure | Déclaré (sert tout de suite) | Appris chaque nuit (remplace) | Correction permise |
|---|---|---|---|
| Température | côté, mur, hauteur, sol | écart de beau temps par position du soleil ; écart de fond | oui, de l'écart appris seulement |
| Soleil | ombre (5 choix) | part du soleil par case (existe, 22d2e3e) | déjà : case apprise |
| Pluie | abri du pluviomètre | part de la pluie recueillie | **non**, affichée seulement |
| Vent | côtés abrités | côtés abrités | **non**, prévision prise du côté abrité |

**Rangement** : les réponses dans `Settings` (options du lieu), à côté de `station_shade`. L'appris dans un `Store` `hestia_weather.station.<entry_id>`, à côté de `hestia_weather.ombre.<entry_id>` : `{"temperature": {"fond": {...}, "beau_temps": {"180/clair": 2.1, …}}, "vent": {"w": 0.31, …}, "pluie": {"part": 0.52, "jours": 22}, "learned_at": …}`.

**Partagé avec les briques** : `api.station_trust(entry_id)` donne, pour `temperature`, `wind`, `rain`, `sun` :

```
{"level": "ok" | "watch" | "handled",   # fiable · à vérifier · fiable sauf (pris en compte)
 "now": "station" | "corrected" | "forecast",
 "value": 17.4,                          # la valeur retenue maintenant (température, rafale)
 "why": "le mur au soleil ajoute 2 °C",
 "until": "2026-11-05T17:00:00+01:00"}
```

Confort l'emploie si Weather le donne, sinon garde ses capteurs bruts (même règle que `station_shade` : un Weather plus ancien ne casse rien).

---

## 6. Où, dans le panneau

- **Choisir une station** (étape Station, nouvelle station) : sous les capteurs, la ligne « Où est votre station ? · 6 questions, une minute ». Elle ouvre le questionnaire : une question par écran, gros boutons, « Je ne sais pas », « Précédent ». À la fin : « C'est noté. Tout se change dans Station › Emplacement. »
- **Depuis la Vue d'ensemble, en un clic** (Frank, 5 novembre) : la ligne « Où est votre station ? » de « À améliorer » ouvre le questionnaire sur sa propre page (`/hestia/meteo/<lieu>/emplacement`, retour « Vue d'ensemble »), qui reprend à la première question sans réponse. À la fin, « Enregistrer » garde les réponses et ramène à la Vue d'ensemble ; revenir en arrière en cours de route enregistre aussi ce qui a été répondu. Les réponses remplissent Station › Emplacement.
- **L'un ou l'autre** (Frank, 5 novembre : pas deux fois la même chose sur une page) : tant que rien n'est répondu, la section Emplacement ne montre que la carte « Où est votre station ? » ; dès la première réponse, seulement les lignes ci-dessous.
- **Étape Station › Emplacement** : remplace « Pour aller plus loin › Station à l'ombre ». Les mêmes questions en lignes (libellé à gauche, choix à droite), « Par défaut : Je ne sais pas », « Rétablir ». Sous chaque ligne, ce qui est appris : « Appris : le mur chauffe la station de 13 h à 18 h par beau temps (2 °C) ». Les lignes 5 à 7 ne paraissent que pour les capteurs présents.
- **État du lieu › Fiabilité de la station** : une ligne par mesure (température, vent, pluie, soleil), un repère et une phrase. Puis « Appris sur 92 jours · cette nuit à 4 h 10 ».
- **Vue d'ensemble du hub › À améliorer** : « Emplacement de la station · 6 questions » tant qu'il en reste, gris. Et quand l'apprentissage trouve seul un écart non déclaré (pluviomètre qui recueille la moitié), la ligne le dit.
- **Sur la carte** : la source sous la tuile (Température, Vent) dit quand la valeur n'est pas la mesure brute ; l'appui ouvre la bulle « i » des sources avec l'explication.

**Couleurs** : bleu « Fiable » ; gris « Fiable, sauf… » (Hestia s'en charge, rien à faire) et « À vérifier » ; violet pointillé pour l'explication à lire (hub seulement). Ni orange ni vert : il n'y a pas de geste à faire, ni de bénéfice.

---

## 7. Seuils proposés (à valider, pas des réglages du foyer)

Ce sont des seuils de mesure, pas des habitudes : ils ne deviennent pas des réglages.

| Seuil | Valeur | D'où |
|---|---|---|
| Ciel clair / mêlé / couvert | 20 % · 60 % · 80 % | 20 et 60 existent déjà pour l'ombre |
| Le soleil « fait face » au mur | à moins de 45° de son orientation | géométrie : 70 % du soleil reçu |
| Écart de température qui compte | 1 °C | la prévision Météo-France est donnée au degré |
| Heures pour apprendre un secteur | 12 | `RECENT_HOURS` de l'ombre |
| Vent pour comparer | au moins 10 km/h prévus | sous ce vent, la girouette tourne au hasard |
| Côté abrité | moins de la moitié de la médiane des côtés | — |
| Jours de pluie pour apprendre | 15 | — |
| Gouttes de l'arbre | 30 min après la fin de la pluie annoncée | — (pas codé) |
| Température « vérifiée », vent « vérifié » | 3 positions du soleil de jour apprises ; 3 côtés du vent | ajouté au codage : une seule case de nuit ne suffit pas |

---

## 8. Questions pour Frank

1. Les **7 questions** vous vont ? Le **sol** (question 4) sert peu à 1,5 m de haut : le garder, ou le fondre dans « à vérifier » sans le demander ?
2. **Corriger la température** une fois l'écart appris (mesure moins l'écart), mais **jamais la pluie ni le vent** (prévision prise, ou simple affichage) : d'accord ?
3. Avant l'apprentissage, **prendre la prévision** dans la fenêtre de méfiance (contre le mur, toit), et seulement **« à vérifier »** pour 1 à 3 m, station basse, dalle : d'accord ?
4. **L'apprentissage agit même sans réponse** (comme l'ombre) : d'accord ?
5. Confort lit la **température retenue** par Weather (`api.station_trust`) plutôt que le capteur brut : d'accord ?
6. Le questionnaire à la **première station choisie**, plus la ligne du hub : ou seulement les lignes de l'étape Station ?
7. Les **seuils du § 7**, surtout le 1 °C.

---

## 9. Historique

- **v1.0 — 5 novembre 2026** : validée (« ok go ») et codée dans Weather ; restent Confort, le ressenti à l'ombre et les gouttes de l'arbre.
- **v0.2 — 5 novembre 2026** : le vent dit les côtés dégagés (remarque de Frank) : rose « dégagé / gêné » dans le questionnaire et dans la ligne de réglage, phrase « Dégagée : … · gênée : … », même phrase dans la fiabilité.
- **v0.1 — 5 novembre 2026** : questions, effet de chaque réponse, déclaré et appris, repères de fiabilité, place dans le panneau, maquette.
