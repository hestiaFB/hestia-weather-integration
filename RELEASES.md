# Versions et publications des briques Hestia

Les mêmes règles pour toutes les briques (Hestia Weather 3.x.x, Hestia Confort 2.x.x).

## Le numéro : MAJEUR.MINEUR.CORRECTIF

| Chiffre | Quand | Exemples |
|---|---|---|
| **Majeur** (3.0.0 → 4.0.0) | L'utilisateur peut avoir quelque chose à faire, ou quelque chose cesse de marcher | nom technique changé, action ou évènement supprimé, entité retirée, option de carte qui change de sens |
| **Mineur** (3.0.0 → 3.1.0) | Des nouveautés qui ne cassent rien | nouvelle carte, nouveau capteur, nouvelle source, version minimale de Home Assistant relevée |
| **Correctif** (3.1.0 → 3.1.1) | Des corrections seulement | bug, texte faux, affichage cassé, traduction manquante |

- Une nouveauté ne sort jamais dans un correctif.
- Ce qui casse n'arrive qu'avec un majeur, toujours avec une migration automatique ou une réparation dans **Paramètres** qui dit quoi faire.
- Retirer quelque chose se fait en deux temps : annoncé dans un mineur (réparation et « Bientôt retiré »), l'ancien marche encore ; retiré au majeur suivant, au moins deux mineurs ou trois mois plus tard.
- La version minimale de Home Assistant (`hacs.json`) ne monte que dans un mineur ou un majeur, et la note le dit en tête.

## Bêta (pre-release) et stable (release)

**Une lettre dans le numéro = bêta, publiée en pre-release. Pas de lettre = stable, publiée en release.**

| Numéro | Sur GitHub | Dans HACS |
|---|---|---|
| 3.1.0b1, 3.1.0b2… | pre-release (case cochée) | seulement pour qui a activé les bêtas |
| 3.1.0 | release, « Latest » | proposée à tout le monde |

- Une bêta porte le numéro de la version qu'elle prépare : 3.1.0b1, 3.1.0b2…, puis 3.1.0 avec le même contenu que la dernière bêta.
- Jamais b10 (GitHub la range mal) : après b9, on publie la stable.
- Une bêta n'est demandée que pour un gros changement : un moteur ou un calcul revu, de nouveaux réglages, des données gardées qui changent, ou quelque chose qui casse. Un petit ajout compatible peut sortir directement en stable, avec l'accord de Frank. Une nouvelle copie du socle ne compte pas : elle est déjà essayée dans les autres briques.
- Après une bêta, la stable ne sort qu'après l'essai de Frank chez lui : 2 à 3 jours sur la dernière bêta, sans correction entre les deux.
- Un correctif d'une stable (3.1.1) sort directement en release s'il est petit et sûr ; sinon d'abord en 3.1.1b1.
- Une bêta de nouveautés en cours (3.2.0b1) et un correctif urgent de la stable (3.1.1) : le correctif part d'une branche `3.1.x`. C'est la seule branche ; tout le reste se fait sur `main`.
- On ne supprime jamais une version publiée : si elle est mauvaise, on publie le correctif suivant.

## Le CHANGELOG

- En haut, une section **« À venir »** : chaque changement y est noté quand il est fait. À la publication, elle prend son numéro.
- Chaque version : un titre, puis **Nouveautés**, **Améliorations**, **Corrections** (seulement les sections qui ont quelque chose).
- Pas de **En bref** dans chaque version : le titre suffit. On ne l'ajoute que pour une grosse version (un majeur, ou un mineur avec beaucoup de changements), en 2 à 4 lignes en gras.
- **Avant de mettre à jour**, en premier, seulement pour un majeur ou quand l'utilisateur a quelque chose à faire.
- **Bientôt retiré**, quand un retrait est annoncé.
- La note d'une stable résume toutes ses bêtas depuis la stable précédente.
- Phrases courtes, en mots simples, une idée par ligne ; pas de détails techniques ni de nombre de tests.
- La release GitHub reprend le texte du CHANGELOG. Titre : « Hestia Weather 3.1.0 — … ». Tag : `v3.1.0`.
- Publier se fait depuis GitHub, sans le PC : **Actions → Publier → Run workflow**, avec le numéro de `manifest.json`. Le tag et la release sont créés sur main, avec le texte du CHANGELOG ; une version avec une lettre part en pre-release. Accord de Frank : « fusionne et publie » sur une PR prête suffit.

## Ce qui protège les utilisateurs

- Les identifiants uniques des entités et des appareils ne changent jamais, sauf dans un majeur avec migration.
- Les données gardées changent avec un numéro de format : version de l'entrée et migration automatique pour les réglages, version de chaque fichier `.storage`.
- Une ancienne configuration de carte s'affiche toujours ; sinon, c'est un majeur.
- Les interfaces entre briques sont numérotées (API v1). Le README de chaque brique dit avec quelles versions de l'autre elle marche : Confort 2.x ↔ Weather 3.x.
- Le socle commun a son propre numéro (`SOCLE_VERSION`) ; il entre dans la version de la brique qui le recopie.

## Avant chaque publication

1. Tous les tests au vert : Python, Home Assistant, panneau, carte, navigateur, et `hestia-ecosysteme/socle/verifier.sh`.
2. La même version partout : `manifest.json`, `package.json` du panneau et de la carte quand ils suivent la brique, constante de version ; « À venir » prend ce numéro.
3. Pour un gros changement : bêta d'abord, essai chez Frank, puis stable. Sinon, stable directement avec l'accord de Frank.
4. Commit, tag et release au nom de hestiaFB, sans mention d'outil ni de co-auteur.
5. Pour un majeur ou une interface entre briques modifiée : les deux briques publiées ensemble, compatibilité mise à jour dans les README.
