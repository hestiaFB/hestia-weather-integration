# Mise à jour bloquée : « changed its domain from niak_weather to hestia_weather »

*English below.*

Depuis la 3.0, le nom technique de Hestia Weather est `hestia_weather` (avant : `niak_weather`).
Le Marketplace de Home Assistant (2026.11 et plus récent) refuse une mise à jour qui change ce nom. Il affiche :

> The update could not be started: hestiaFB/hestia-weather-integration changed its domain from niak_weather to hestia_weather, uninstall it and install it again.

**Ne supprimez pas l'intégration** dans Paramètres → Appareils et services : vos lieux, réglages et apprentissages partiraient avec.
Il suffit de changer le dossier. Tout le reste est repris seul.

## Ce qu'il faut

- Un accès aux fichiers de Home Assistant : l'extension **File editor**, **Studio Code Server**, ou un partage **Samba**.
- Cinq minutes, et deux redémarrages.

## Les étapes

1. **Faites une sauvegarde** : Paramètres → Système → Sauvegardes.
2. **Supprimez le dossier** `/config/custom_components/niak_weather`.
   - Seulement ce dossier. Ne touchez pas à `/config/.storage`.
3. **Redémarrez Home Assistant.**
   - Le Marketplace voit que l'ancien dossier n'est plus là et ne bloque plus.
   - Une réparation « intégration introuvable » peut apparaître pour Niak Weather : laissez-la, elle partira seule.
4. **Paramètres → Marketplace → Hestia Weather → Télécharger** (la dernière version).
5. **Redémarrez Home Assistant.**
6. **Paramètres → Appareils et services → Ajouter une intégration → Hestia Weather.**
   - Hestia Weather retrouve votre installation et la reprend : rien n'est créé en double.
   - Le message « Votre installation a été reprise sous le nouveau nom » s'affiche.
7. Ouvrez **Hestia-FB → Accueil** : l'encart « Passage au nom Hestia » montre chaque étape, puis s'en va.

## Ce qui est gardé

- Vos lieux, réglages, alertes en cours, historiques et statistiques.
- Le nom de vos entités : vos automatisations et tableaux de bord continuent de marcher.
- Les automatisations, scripts, scènes et tableaux de bord faits dans l'interface sont mis à jour.
- Ce qui est écrit à la main en YAML n'est jamais modifié : une réparation dans **Paramètres** liste les fichiers et les lignes à changer.

## Vous avez aussi Hestia Confort ?

Faites la même chose pour lui, dans la foulée : dossier `niak_comfort`, puis **Hestia Confort** dans le Marketplace.
La liaison entre les deux suit d'elle-même.

## Ça ne marche pas ?

- **« Ajouter une intégration » propose de créer un nouveau lieu** : l'ancienne installation n'a pas été trouvée. Arrêtez-vous là et ouvrez une issue : ne créez pas de nouveau lieu.
- **Le Marketplace refuse encore** : vérifiez que le dossier `niak_weather` a bien disparu, puis redémarrez.
- **Vous avez supprimé l'intégration par erreur** : restaurez la sauvegarde de l'étape 1.

Dans tous les cas, [ouvrez une issue](https://github.com/hestiaFB/hestia-weather-integration/issues/new) avec le journal de Home Assistant (Paramètres → Système → Journaux, filtre `hestia`).

---

## English

Since 3.0, Hestia Weather's technical name is `hestia_weather` (formerly `niak_weather`). Home Assistant's Marketplace (2026.11 and later) refuses an update that changes it.

**Do not delete the integration** in Settings → Devices & services: your places, settings and learning would go with it.

1. Make a backup (Settings → System → Backups).
2. Delete the folder `/config/custom_components/niak_weather` (File editor, Studio Code Server or Samba). Nothing else.
3. Restart Home Assistant. A repair saying Niak Weather is not found may show: leave it.
4. Settings → Marketplace → Hestia Weather → Download (latest version).
5. Restart Home Assistant.
6. Settings → Devices & services → Add integration → Hestia Weather. It finds your installation and carries it over: nothing is set up twice.
7. Open Hestia-FB → Home: the « Moving to the Hestia name » box shows each step.

Your places, settings, alerts, history, statistics and entity names are kept. If « Add integration » offers to set up a new place instead, stop there and open an issue.
