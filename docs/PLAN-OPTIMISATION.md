# Plan d'optimisation de Hestia Weather

Version 0.2 du 5 novembre 2026. **Tout le plan est validé par Frank** (points 1 à 18). Lot 1 en cours.

## Pourquoi

Un utilisateur sur la box HA Green (4 petits cœurs ARM, 2 à 3 fois plus lente que le NAS du labo) a dû retirer Confort puis
Weather : tableau de bord lent, boutons en retard de 1 à 5 s.

## Ce qu'on a mesuré au labo (5 nov., soir)

**Côté Home Assistant**

- Weather fait **2 calculs par minute** : un dès que le premier capteur de la station change, un second 2 s plus tard quand
  les autres capteurs ont suivi.
- Chaque calcul bloque Home Assistant **0,3 à 0,4 s** sur le NAS, soit environ **0,7 à 1 s sur une HA Green**.
  Pendant ce temps, plus rien ne répond : boutons, automatisations, tableau de bord.
- Où part le temps : surtout les courbes du vent et de la pression (12 courbes refaites à chaque calcul à partir d'une
  semaine d'historique), puis la conversion de tout l'historique à chaque calcul, le cumul de pluie relu 67 fois par calcul.
- Une carte affichée dans une autre langue que le français refait **tout le calcul une seconde fois** (+0,1 s mesuré).
- Les lectures de l'historique et des statistiques, les entités : négligeables.
- Pour comparaison, sur les mêmes 4 minutes : Confort 8,8 s de calcul, Weather 1,1 s. **Confort est 8 fois plus lourd** ;
  il viendra ensuite, comme prévu.

**Côté navigateur**

- La « vue » envoyée à la carte pèse **49 ko**. Elle part **en entier** à chaque changement, **et une fois par carte**.
- Tableau Labo, onglet Weather (18 cartes) : **18 abonnements**, soit environ **880 ko par mise à jour**, 2 à 3 fois par
  minute. Le navigateur se fige 50 à 100 ms à chaque fois sur un PC rapide, bien plus sur une tablette ou un téléphone.
- Les courbes sont recalées sur l'heure exacte à chaque calcul, avec des nombres à 15 décimales : elles « changent »
  toujours, donc la vue repart toujours, même quand rien de visible n'a bougé.
- Les fichiers de la carte sont servis sans compression : carte 290 ko (88 ko compressée), socle 122 ko (36 ko),
  panneau 210 ko (59 ko), polices 545 ko (environ 70 ko en woff2).
- Les animations se mettent déjà en pause hors de l'écran ; le rendu d'une carte coûte 0,2 à 2,5 ms sur PC. Ce n'est pas
  le point faible.

## Le plan, du plus rentable au moins rentable

Chaque point : ce qu'on change, le gain attendu, le risque, la mesure avant/après au labo.

### Lot 1 — gros gains, peu de risque

**1. Un seul abonnement par page** (carte)
Toutes les cartes Weather d'un même lieu et d'une même langue partagent un seul flux.
- Gain : 18 fois moins de données et de travail sur le tableau Labo (880 ko → 49 ko par mise à jour) ; côté HA, une seule
  comparaison et un seul envoi au lieu de 18.
- Risque : faible.
- Mesure : octets reçus par minute sur l'onglet Weather du Labo (aujourd'hui 36 vues en 133 s pour 18 cartes).

**2. Des courbes qui ne bougent que quand une mesure bouge** (moteur)
Courbes calées sur une grille fixe (10 min, 1 h, 3 h) au lieu de « maintenant moins 6 h » ; heures en secondes entières,
valeurs arrondies au dixième. Seul le dernier point « maintenant » suit la mesure en direct.
- Gain : la vue ne repart plus quand rien n'a changé à l'écran ; vue 17 % plus légère.
- Risque : faible ; à vérifier à l'œil sur les courbes vent et pression.
- Mesure : nombre de vues envoyées par minute (aujourd'hui ~3, toutes avec vent et pression « changés »).

**3. Un seul calcul par salve de capteurs** (intégration)
Attendre 2 s que tous les capteurs de la station aient changé, puis calculer une fois.
- Gain : 2 calculs par minute → 1. Moitié moins de blocage.
- Risque : faible ; la carte se met à jour 2 s plus tard.
- Mesure : calculs par minute dans le profil (aujourd'hui 8 en 4 min).

**4. Fichiers compressés et polices légères** (construction de la carte)
Fichiers `.gz` à côté des `.js` (vérifié au labo : Home Assistant les sert bien compressés) ; polices en woff2 limitées
aux caractères latins.
- Gain : environ 1,2 Mo → 250 ko au premier chargement et après chaque mise à jour, surtout sur l'appli mobile.
- Risque : faible.
- Mesure : taille servie (`curl`, en-tête Content-Length).

### Lot 2 — Home Assistant ne se fige plus

**5. Un calcul moins cher** (moteur)
Convertir l'historique une fois quand il arrive (toutes les 5 min), pas à chaque calcul ; garder les morceaux de courbe
déjà terminés ; lire le cumul de pluie une fois par calcul ; accélérer la conversion en JSON.
- Gain estimé : 0,25 s → moins de 0,1 s par calcul.
- Risque : moyen-faible ; les tests du moteur (séries, vue, parité) le couvrent.
- Mesure : temps par calcul dans le profil.

**6. Le calcul hors de la boucle de Home Assistant** (intégration)
Faire le calcul dans un fil à part ; seuls les événements d'alerte et les capteurs restent sur la boucle. La langue de
rendu devient propre à chaque calcul (aujourd'hui elle est globale, ce qui interdit le fil à part).
- Gain : Home Assistant ne se fige plus du tout pendant le calcul de Weather, même sur une HA Green.
- Risque : moyen ; à faire après le point 5 pour garder un calcul court.
- Mesure : asyncio debug — les blocages de 0,3-0,4 s chaque minute doivent disparaître.

**7. Les autres langues sans tout recalculer** (intégration)
Le calcul en anglais ou en allemand passe dans le même fil (point 6), une fois par calcul et non par carte (point 1).
- Gain : supprime le +0,1 s par langue sur la boucle.
- Risque : faible.
- Mesure : asyncio debug avec une carte en anglais.

### Lot 3 — à décider après les mesures des lots 1 et 2

**8. N'envoyer que ce qui a changé** (intégration + carte)
Seules les rubriques modifiées (vent, pression…) partent ; la carte les recolle.
- Gain : 49 ko → 10-20 ko par mise à jour.
- Risque : moyen ; change le format entre l'intégration et la carte, une carte gardée en cache par l'appli mobile doit
  continuer à marcher.
- Mesure : octets par vue.

**9. Verre dépoli sur les appareils faibles** (carte)
L'option « sans verre dépoli » existe déjà. On ne change rien sans une mesure sur une vraie tablette ou un téléphone
d'entrée de gamme.

**10. Mémoire**
Rien de mesuré d'anormal (l'historique gardé est petit). Une vérification au labo est prévue après le lot 2.

## Le rendu de la carte

Mesuré sur le banc local avec la vraie vue du labo, 18 cartes comme l'onglet Weather du Labo, processeur ralenti 6 fois
(proche d'une tablette ou d'un téléphone d'entrée de gamme).

- **Premier affichage** des 18 cartes : 730 ms (calcul des styles 140 ms, mise en page 190 ms).
- **Chaque mise à jour** : 100 à 140 ms. Avec un seul abonnement (point 1) : 90 à 115 ms seulement. Le vrai gain vient donc
  du nombre de mises à jour (point 2) : 2 à 3 par minute aujourd'hui, presque toutes inutiles.
- **Au repos** : chaque ciel animé (complète, tuile, intermédiaire) prend environ 3 % d'un petit processeur ; les cartes à la
  pièce, rien. Les animations du ciel ne touchent que la position et la transparence : c'est déjà la façon la moins chère.
- **Lecture du fichier de la carte** : 30 ms. Sa taille compte pour le téléchargement, pas pour le processeur.

Ce qu'on ajoute :

**11. Une carte à la pièce ne se redessine que si sa rubrique a changé** (carte)
La carte Vent ne se redessine plus quand seul l'air change, la carte Air plus quand le vent souffle.
- Gain : la plupart des 18 cartes ne bougent plus à chaque mise à jour.
- Risque : faible ; à faire avec le point 1.
- Mesure : temps d'une mise à jour sur le banc (aujourd'hui 100-140 ms au ralenti ×6).

**12. Les langues et l'éditeur chargés à la demande** (carte)
Les traductions anglaise et allemande (44 ko) et l'éditeur de carte (14 ko) sont aujourd'hui dans chaque chargement.
- Gain : modeste (environ 15 ko une fois compressé, après le point 4).
- Risque : faible. À faire seulement si on touche déjà à la construction de la carte.

Rien à changer sur les animations sans mesure sur un vrai appareil (point 9).

## Le code lui-même

**13. Un seul chemin de calcul** (intégration)
Le calcul en français (`_compute`) et celui des autres langues (`view_for`) sont deux copies presque identiques. On les
réunit : c'est aussi la condition pour passer le calcul dans un fil à part (point 6).

**14. Des nombres plutôt que du texte dans l'historique** (moteur)
L'historique est gardé en texte (« 12.4 ») et relu en nombre à chaque calcul : 64 000 conversions par 4 minutes. On le
garde en nombres, dans la bonne unité, dès la lecture (fait avec le point 5).

**15. Les recherches dans le registre mises de côté** (intégration)
Le capteur « description Météo-France » et le radar de pluie sont recherchés dans tout le registre à chaque calcul. On les
cherche une fois, puis à chaque changement du registre. Petit gain, code plus clair.

**16. Une mesure qu'on peut refaire en une commande** (labo)
Un script dans `hestia-labo/` : ajoute le Profiler, profile 4 minutes, active asyncio debug, compte les vues envoyées,
résume les chiffres, retire tout. Mêmes chiffres avant et après chaque lot, et réutilisable pour Confort.

**17. Un garde-fou dans les tests** (tests)
Un test qui compte le travail d'un calcul sur un jeu fixe (nombre de courbes refaites, de conversions) : une régression
de performance casse les tests au lieu d'arriver chez les utilisateurs.

**18. Le code de l'ancien nom (Niak)** — à décider plus tard
La migration Niak → Hestia (environ 700 lignes) ne coûte presque rien en marche : elle s'arrête tout de suite quand il n'y a
plus rien à migrer. On la retirera dans une future version majeure, quand plus personne ne sera sur l'ancien nom.

## Résultats

### Lot 1 (points 1 à 4, 11 et 16) — fait le 5 nov. au soir, au labo, non publié

Mesuré avec `hestia-labo/mesurer.py`, mêmes conditions qu'avant (4 min de profil, 3 min d'asyncio debug, abonnés fr + en).

| Mesure | Avant | Après |
|---|---|---|
| Calculs de Weather en 4 min | 8 | **4** |
| Temps de calcul propre de Weather en 4 min | 1,13 s | **0,59 s** |
| Vues envoyées à un abonnement | ~3 par minute, 49 ko | **~1,3 par minute, 41 ko** |
| Abonnements pour 18 cartes d'une page (banc local) | 18 | **1** |
| Cartes redessinées quand seul le vent change (banc) | toutes | **celles qui montrent le vent** |
| Carte servie au navigateur | 290 ko | **89 ko** (gzip) |
| Polices servies | 4 × 95 ko + 165 ko | **4 × 16 ko + 30 ko** (woff2) |
| Boucle de HA bloquée par Weather, par minute | 2 × 0,3-0,4 s | **1 × 0,35 s** ; 0,6 s avec un abonné en anglais |

Reste pour le lot 2 : ce blocage de 0,35 s par minute (0,6 s avec une autre langue) disparaîtra avec le calcul hors de
la boucle (point 6) et un calcul moins cher (point 5).

### Lot 2 (points 5, 6, 7, 13, 14, 15 et 17) — fait le 5 nov. vers minuit, au labo, non publié

- Le calcul tourne dans un fil à part (`coordinator.py` : `Inputs` pris sur la boucle, `calculate()` seul chemin de calcul,
  `_publish()` de retour sur la boucle pour les alertes). La langue appartient au calcul (`engine/i18n.py`, ContextVar).
- Les autres langues sont calculées avec le français, seulement tant qu'une carte les affiche (`async_want_language`).
- Les historiques sont convertis une fois par lecture, pas à chaque calcul (`engine/series.py`, `engine/station.py`) ;
  la conversion en JSON garde les noms de champs (`engine/view.py`).
- Les capteurs Météo-France (description, radar) sont cherchés une fois, puis à chaque changement du registre.
- Garde-fous : un historique n'est converti qu'une fois sur plusieurs calculs (`tests/test_series.py`), deux calculs
  en deux langues en même temps ne se mélangent pas (`tests/test_i18n.py`), le calcul se fait hors de la boucle
  (`tests/test_calculation_ha.py`).

| Mesure | Avant le lot 1 | Après le lot 1 | Après le lot 2 |
|---|---|---|---|
| Temps d'un calcul, français + anglais (sous profileur) | ~0,25 + 0,1 s | 0,19 s + anglais | **0,14 s les deux** |
| Boucle de HA bloquée par la mise à jour de Weather | 2 × 0,3-0,4 s / min | 0,35 s ; 0,6 s avec l'anglais | **0,16 s, dont ~0,015 s de Weather** |
| Lien Remote Home-Assistant bloqué (labo) | 0,33-0,43 s / min | — | 0,15 s |

Les 0,16 s qui restent ne sont plus Weather : c'est Confort qui réagit à chaque mise à jour de Weather, sur la boucle
(`hestia_comfort/coordinator.py`, l'écouteur de la ligne 169 : 0,36 s en 3 minutes). À traiter dans le plan de Confort.

### Lot 3 (points 8, 9, 10, 12) — fait le 6 nov. vers minuit et demi, au labo, non publié

- **Point 8 fait** : une carte qui le demande (`changes: true`) reçoit la vue entière une fois, puis seulement les
  rubriques changées ; la carte les recolle sur la dernière vue (`card/src/stream.ts`). Une carte plus ancienne, gardée en
  cache par l'appli mobile, reçoit toujours la vue entière. Une intégration plus ancienne que la carte refuse `changes` :
  la carte redemande alors la vue entière.
- **En plus, trouvé en mesurant la mémoire** : avec une station qui envoie toutes les 10 s, les 12 courbes coûtaient
  240 ms par calcul (PC). Les cases de courbe déjà terminées sont maintenant gardées avec leur historique : **6 ms**.
  Vérifié identique au calcul complet sur 8 000 cas tirés au hasard ; un test en garde 1 200 (`tests/test_series.py`).
- **Point 10 (mémoire)** : Weather garde environ 1 Mo d'historique et 1,7 Mo de calculs mis de côté pour une station très
  bavarde (toutes les 10 s) ; au labo, environ 3 000 relevés en tout. Rien d'anormal ; les mises de côté sont bornées
  (32 entrées, 8 pour le cumul de pluie).
- **Point 9 (verre dépoli)** : rien changé. Sur le banc ralenti, le coût vient des ciels animés (3 % d'un petit processeur
  chacun), pas du verre ; l'option « sans verre dépoli » reste là pour les appareils faibles.
- **Point 12 (langues et éditeur à la demande)** : écarté. Le gain n'est plus que d'environ 15 ko compressés, une fois par
  mise à jour de la carte, et il faudrait changer le format de la carte, chargée très tôt par Home Assistant
  (frontend#53890) : risque plus grand que le gain.

| Mesure (labo) | Au départ | Lot 1 | Lot 2 | Lot 3 |
|---|---|---|---|---|
| Calculs par minute | 2 | 1 | 1 | 1 |
| Un calcul en français (sous profileur) | 0,25 s | 0,19 s | — | — |
| Français + anglais ensemble (sous profileur) | — | — | 0,14 s | **0,08 s** |
| Part de Weather sur la boucle de HA, par minute | 0,6-0,8 s | 0,35-0,6 s | ~0,015 s | **~0,015 s** |
| Mise à jour envoyée à la carte | 49 ko × nombre de cartes | 41 ko × 1 | 41 ko | **14-17 ko** |
| Carte + polices au premier chargement | 835 ko | 185 ko | 185 ko | 185 ko |

Ce qui bloque encore la boucle environ 0,16-0,18 s par minute pendant la mise à jour de Weather, c'est Confort qui y
réagit (son écouteur sur Weather) : à traiter dans le plan de Confort.

Notes :
- À la publication, changer de numéro de version : l'adresse de la carte porte la version (`?v=`) et le navigateur garde
  l'ancienne carte jusqu'à 31 jours sinon. Au labo, les onglets déjà ouverts gardent l'ancienne carte jusqu'au rechargement.
- Le panneau Hestia-FB charge encore ses polices TTF : elles viennent du socle commun (`hestia-ecosysteme/socle`), à passer
  en woff2 là-bas, pour toutes les briques.
- La vérification navigateur `npm run test:browser` échoue déjà sur la version commitée (débordement du texte défilant de la
  tuile, pastille de vigilance doublée) : sans lien avec ce lot, à corriger à part.

## Comment on avance

1. Un lot à la fois : code, tests, déploiement au labo, mesure avant/après notée ici.
2. Version de test (préversion) seulement quand Frank le décide.
3. Confort ensuite, quand ses changements se seront calmés : c'est lui qui pèse le plus.
