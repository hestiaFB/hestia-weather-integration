# Traductions · Translations

Hestia Weather parle la langue de Home Assistant : français, anglais, allemand. Toute autre langue s’affiche en anglais.
Hestia Weather follows Home Assistant's language: French, English, German. Any other language is shown in English.

## Améliorer un texte · Improve a text

Vous n’avez pas besoin de connaître git ni de compiler quoi que ce soit.
You do not need to know git or to build anything.

1. Ouvrez le fichier de votre langue sur GitHub · Open the file for your language on GitHub:
   - Anglais · English: [`card/src/i18n/en.ts`](../card/src/i18n/en.ts) (carte · card), [`frontend/i18n-en.ts`](../frontend/i18n-en.ts) (panneau · panel), [`engine/i18n_en.py`](../custom_components/hestia_weather/engine/i18n_en.py) (bulletin, événements, mesures · bulletin, events, measurements), [`translations/en.json`](../custom_components/hestia_weather/translations/en.json) (installation, configuration et noms des entités · setup, options and entity names)
   - Allemand · German: [`card/src/i18n/de.ts`](../card/src/i18n/de.ts), [`frontend/i18n-de.ts`](../frontend/i18n-de.ts), [`engine/i18n_de.py`](../custom_components/hestia_weather/engine/i18n_de.py), [`translations/de.json`](../custom_components/hestia_weather/translations/de.json)
2. Cliquez sur le crayon (Edit) · Click the pencil (Edit). GitHub crée une copie à votre nom · GitHub makes a copy under your name.
3. Corrigez ce qui est **à droite des deux-points** · Change only what is **on the right of the colon**:
   ```ts
   'Pluie': 'Regen',      // à gauche : le français, à ne pas changer · left: French source, do not change
   ```
4. Gardez tels quels les mots entre accolades, comme `{place}` ou `{speed}` · Keep the words between braces, like `{place}` or `{speed}`, exactly as they are.
5. Cliquez sur **Commit changes… → Propose changes**, puis **Create pull request** · Click **Commit changes… → Propose changes**, then **Create pull request**.

Le mainteneur relit et fusionne. Les tests vérifient qu’aucun texte ne manque et que les `{noms}` sont intacts.
The maintainer reviews and merges. The tests check that no text is missing and that the `{names}` are intact.

Pas à l’aise avec GitHub ? Écrivez les corrections dans l’[issue #7](https://github.com/hestiaFB/hestia-weather-integration/issues/7) : le mainteneur les reporte.
Not comfortable with GitHub? Post your corrections in [issue #7](https://github.com/hestiaFB/hestia-weather-integration/issues/7) and the maintainer will apply them.

## Ajouter une langue · Add a language

Partez des fichiers anglais, un par partie · Start from the English files, one per part:

| Fichier · File | Ce qu’il traduit · What it translates |
| --- | --- |
| `card/src/i18n/en.ts` | La carte · The card |
| `frontend/i18n-en.ts` | Le panneau Hestia-FB, onglet Météo · The Hestia-FB panel, Weather tab |
| `custom_components/hestia_weather/engine/i18n_en.py` | Le bulletin, les événements, les mesures · Bulletin, events, measurements |
| `custom_components/hestia_weather/translations/en.json` | L’installation, la configuration, les noms des entités · Setup, options, entity names |

Vous pouvez simplement envoyer vos phrases dans une [demande « Traduction »](https://github.com/hestiaFB/hestia-weather-integration/issues/new?title=Translation%3A%20) : le mainteneur les range au bon endroit.
You can simply send your sentences in a [“Translation” issue](https://github.com/hestiaFB/hestia-weather-integration/issues/new?title=Translation%3A%20): the maintainer puts them in the right place.

## Ce qui n’est pas encore traduit · Not translated yet

- Les valeurs des capteurs (bulletin, raisons, alertes) restent en français : vos automatisations ne changent pas avec la langue.
  Sensor values (bulletin, reasons, alerts) stay in French, so your automations do not change with the language.
- En allemand, le menu et l’accueil du panneau Hestia-FB s’affichent en anglais pour l’instant. L’onglet Météo est en allemand.
  In German, the Hestia-FB panel's menu and home page are shown in English for now. The Weather tab is in German.
