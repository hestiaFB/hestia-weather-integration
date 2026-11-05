# Renommer mes entités en hestia_weather — conception

État : codé en local le 29 oct., non publié. Carte placée dans Réglages généraux de Weather (choix de Frank). Code :
`migration.py`, `engine/renaming.py`, commandes `niak_weather/rename/preview|apply|undo` dans `panel.py`, carte `renameFrame()` dans
`frontend/panel.ts` ; tests `tests/test_renaming.py` et `tests/test_migration_ha.py`.

## Ce qu'on a trouvé

- Le code sait déjà choisir le préfixe (`sensor.py`, `prefix()`) :
  - une nouvelle maison reçoit `hestia_weather_…` ;
  - une maison déjà installée garde `niak_weather_…`, pour ne rien casser.
- Il ne manque donc qu'un outil qui fait passer une ancienne maison de l'un à l'autre.
- Quand il ne reste plus aucune entité `niak_weather…`, `prefix()` passe tout seul à `hestia_weather` : il n'y a rien à changer de ce côté.
- **Hestia Confort n'a rien à migrer** : ses entités portent le nom de la pièce (`binary_sensor.chambre_p_trop_humide`).
- Chez Frank (lu par le MCP le 29 oct.) :
  - 24 entités Weather : 15 `sensor`, 8 `binary_sensor` et 1 `weather`.
  - Ne sont pas à nous, donc jamais touchées :
    - les entités `binary_sensor.sentinel_…_niak_comfort`, qui appartiennent à l'intégration Sentinel ;
    - `update.niak_weather_update_2` et `update.niak_comfort_integration_update`, qui appartiennent à HACS.
  - Aucune automatisation, aucun script ni aucune scène créés dans l'interface ne les utilisent.
  - Restent à lire : 8 automatisations en YAML et les tableaux de bord.

## Ce que voit l'utilisateur

Une carte dans les réglages de Hestia Weather, **seulement** si la maison a encore des entités `niak_weather_…` :

> Vos entités portent encore l'ancien nom « niak_weather ».
> Vous pouvez les renommer en « hestia_weather ».
> Rien ne change tant que vous ne validez pas.
> [Voir ce qui change]

**Aperçu** (rien n'est encore modifié) :

- La liste des entités, sous la forme `sensor.niak_weather_ressenti → sensor.hestia_weather_ressenti`.
- « Mis à jour tout seuls » : les automatisations, les scripts, les scènes et les cartes de tableau de bord, chacun avec son nom.
- « À corriger vous-même » : les fichiers YAML écrits à la main (`packages/`, `configuration.yaml`…), avec le fichier et le numéro de ligne.
- « Gardés tels quels » : les identifiants que vous avez choisis vous-même et les entités dont le nouveau nom est déjà pris.
- La mention « L'historique et les statistiques sont conservés ».
- Le conseil « Faites une sauvegarde avant ».
- Les boutons [Renommer] et [Annuler].

**Après** :

> 24 entités renommées. 3 automatisations et 2 tableaux de bord mis à jour.
> [Revenir à l'ancien nom]

Le bouton « Revenir à l'ancien nom » reste disponible tant que l'utilisateur ne l'a pas utilisé.

## Comment ça marche

Le code va dans un nouveau module `custom_components/niak_weather/migration.py`, avec trois commandes websocket réservées à l'administrateur : `…/migration/preview`, `…/migration/apply` et `…/migration/undo`.

1. **Correspondance des noms**
   - On parcourt les entrées du registre de chaque lieu (`async_entries_for_config_entry`).
   - On ne retient que celles qui commencent par `niak_weather`.
   - Le nouveau nom remplace la racine : `niak_weather_marseille_x` devient `hestia_weather_marseille_x`.
   - Une entité est écartée si son nouveau nom existe déjà.
2. **Recherche des usages**
   - Dans `automations.yaml`, `scripts.yaml` et `scenes.yaml` : les fichiers que l'interface écrit.
   - Dans les tableaux de bord enregistrés (stockage Lovelace).
   - Dans les options des assistants : groupes, modèles (template), compteurs.
   - Dans les autres fichiers `*.yaml` du dossier de configuration : lecture seule, pour la liste « À corriger vous-même ».
   - On remplace l'identifiant **en entier**, jamais un bout : `niak_weather_pluie_24h` ne doit pas toucher `niak_weather_pluie_24h_prevue`. On applique pour ça une expression régulière avec des limites de mot, et on traite les noms les plus longs d'abord.
3. **Application**
   - On écrit d'abord la liste des changements dans un `Store` (`niak_weather.migration`) : c'est elle qui permet le retour en arrière.
   - On renomme dans le registre (`async_update_entity(new_entity_id=…)`). Le recorder suit le renommage : l'historique et les statistiques restent.
   - On réécrit les fichiers et les tableaux de bord, puis on recharge les automatisations, les scripts et les scènes.
   - Si une étape échoue, on défait ce qui a déjà été fait et on l'affiche.
4. **Retour en arrière** : le même mécanisme, avec la liste inversée lue dans le `Store`.

## Ce qu'on ne fait pas

- On ne réécrit jamais les YAML écrits à la main : on les signale seulement.
- On ne touche jamais aux entités d'autres intégrations (Sentinel, HACS…).
- On ne lance jamais de renommage automatique : c'est toujours l'utilisateur qui valide.
- On ne touche pas à ce qui vit hors de Home Assistant : Node-RED, l'appli mobile, les outils tiers. Une phrase dans l'aperçu le rappelle.

## Tests

- **Correspondance** : un lieu, puis deux lieux, un nom déjà pris, un identifiant choisi par l'utilisateur.
- **Remplacement** : uniquement des identifiants entiers, les préfixes partagés, du YAML et du JSON de tableau de bord.
- **Aller-retour** : appliquer puis annuler doit rendre exactement l'état de départ.
- **Avec Home Assistant**, sur le modèle de `tests/test_entity_ids_ha.py` : après la migration, `prefix()` renvoie `hestia_weather`.

## À trancher par Frank

1. **Place de la carte** : dans les réglages de Weather, ou sur l'accueil du panneau Hestia-FB (qui est en lecture seule aujourd'hui).
2. **Usages Lovelace des cartes Hestia-FB** : les mettre à jour en même temps (recommandé).
3. **Version** : un correctif de la série en cours, en préversion d'abord.
