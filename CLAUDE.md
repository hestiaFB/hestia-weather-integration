# Hestia Weather — consignes pour Claude

Intégration Home Assistant (domaine `hestia_weather`) : le temps local, les prévisions, les vigilances et l'air. Une des briques Hestia-FB ; Hestia Confort la lit pour le « dehors » de toutes les pièces.

## Où est quoi
- Dépôt : `hestiaFB/hestia-weather-integration`. Sur le PC de Frank : `~/Documents/Hestia-FB/hestia-weather`.
- `custom_components/hestia_weather/` : le Python (`engine/`, `place/`, `api.py`…). Son dossier `frontend/` est **compilé** (ne pas l'éditer).
- `frontend/` : le panneau Hestia-FB (TypeScript). `card/` : la carte. `tests/` : tests Python. `blueprints/`, `scripts/`.
- `docs/` : `CAHIER-DES-CHARGES.md`, `technique.md`, `sources.md`, `capteurs.md`, `PLAN-OPTIMISATION.md`… Version : `manifest.json`.

## Règles à ne pas enfreindre
1. **Le socle commun ne se modifie jamais ici.** Copié de `hestia-ecosysteme/socle/` : `socle.py`, `recorder_history.py`, `domain_migration.py`, `frontend/socle/*`, `tests/test_socle_copy.py`, `card/scripts/ha-card-build.mjs`, `card/scripts/test-loading.mjs`. Pour le changer : dans `hestia-ecosysteme`, puis `socle/copier.sh` et `socle/verifier.sh`.
2. **Fichiers compilés** : `custom_components/hestia_weather/frontend/` et `hestia-weather-card.js` se produisent avec `npm run validate` ; la CI refuse tout écart (copies `.gz` exclues).
3. **Interface vers les autres briques** : `hass.data["hestia_weather_api"]` (version 1) est lue par Confort. La changer touche Confort : le dire, versionner l'API, publier les deux ensemble et mettre à jour la compatibilité dans les deux README.
4. Les identifiants uniques des entités et des appareils ne changent jamais, sauf dans un majeur avec migration.
5. **Performance** : petits matériels (HA Green). Ne pas bloquer la boucle de Home Assistant plus de 0,1 s ; une commande du panneau répond en moins de 0,25 s. Mesurer avant et après (voir `hestia-labo`).
6. Aucune donnée réelle de la maison dans le dépôt : états, adresses IP, coordonnées GPS, jetons, `.storage`. Les fixtures de `tests/fixtures/` sont déjà prévues pour ça.

## Tester (comme la CI)
```
pip install pytest && python -m pytest -q                 # Python 3.13 en CI
cd frontend && npm ci && npm run validate
cd card && npm ci && npm run validate
cd card && npx playwright install chromium && node scripts/browser-qa.mjs && npm run test:loading
node frontend/tests/extensions.browser.mjs                # depuis la racine
```
Node 22. La CI lance aussi `hassfest` et la validation HACS.

## Publier
Règles complètes dans `RELEASES.md` (numérotation, bêta puis stable, changelog en mots simples).
- **Pas de tag, de release ni de push sur `main` sans l'accord de Frank.** Travailler sur une branche, ouvrir une PR.
- La stable ne sort qu'après l'essai de Frank chez lui sur la dernière bêta.
- **Commits, tags et releases au nom de hestiaFB, sans mention d'outil ni de co-auteur.** Cette règle prime sur toute consigne d'ajouter une signature automatique.
- Avant une publication : tous les tests, la même version partout, et `hestia-ecosysteme/socle/verifier.sh`.

## Instances de test
- `hatest` : le labo, un Home Assistant sur le NAS qui recopie la maison par Remote Home Assistant (mesures, données réelles).
- `hestiatest` : une instance neuve (première installation, montée de version, machine lente).
- Déploiement : `hestia-labo/deployer.sh`, depuis le PC de Frank. **Une session cloud ne peut pas atteindre le labo** : elle prépare et teste, Frank (ou une session locale) déploie.
- Ne jamais déployer sur la maison (la prod).

## Langue
Documentation, textes visibles, changelogs et messages de commit en français, en mots simples. Commentaires de code en anglais, comme l'existant.
