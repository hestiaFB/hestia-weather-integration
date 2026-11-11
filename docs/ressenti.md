# Le ressenti

[Accueil](../README.md) · [Les capteurs](capteurs.md) · [La synthèse et les alertes](synthese.md) · [Le bulletin du jour](bulletin.md) · [Sources et réglages](sources.md) · [Pluie, vent, pression](mesures.md) · [Fonctionnement technique](technique.md)

Le ressenti dit quelle température l’air **donne l’impression** d’avoir : plus chaude quand l’air est lourd ou le soleil fort, plus froide sous le vent ou la pluie. Hestia Weather le calcule lui-même : **aucune intégration Thermal Comfort n’est nécessaire**.

## D’où viennent les mesures

- **Avec une station** : sa température et son humidité. Un point de rosée mesuré par la station est gardé tel quel.
- **Sans station** : la température et l’humidité du bulletin météo. La carte l’indique sous le ressenti.
- **Sans aucune humidité** : le calcul part du thermomètre et le dit.

## Le calcul

Le calcul part de l’**indice de chaleur**, calculé à partir de la température et de l’humidité extérieures (formule du service météo américain, la NOAA). C’est une température ressentie : l’humidité n’ajoute presque rien sous 26 °C, puis beaucoup quand il fait chaud et lourd (30 °C et 60 % d’humidité donnent 32,8 °C). Il y ajoute les effets estimés du vent, du soleil, de la pluie et d’une nuit claire, quand leurs données existent.

Par temps frais ou sec, l’indice descend sous le thermomètre : le calcul part alors du thermomètre.

**Formule : ressenti = indice de chaleur (ou température) + vent + soleil + pluie + nuit.**

L’humidex reste un capteur à part (`sensor.hestia_weather_humidex`) : c’est une note de gêne, pas une température ressentie. À 20 °C et 74 % d’humidité, il dit 25 °C quand on ressent 20 °C. Une correction dont les données manquent reste nulle. Chaque correction et le résultat sont arrondis au dixième.

| Effet | Règle |
| --- | --- |
| Vent | Vent effectif = 75 % du vent moyen + 25 % du plus fort entre vent moyen et rafale, moins 3 km/h, jamais négatif. Correction de −0,25 °C par km/h, ou −0,15 quand la base dépasse 27 °C. Au-dessus de 32 °C réels, passage progressif (sur 3 °C) à un coefficient qui dépend de l’humidité, entre −0,08 et +0,06 : dans une fournaise humide, le vent peut réchauffer. Correction totale entre −6 et +1,5 °C. |
| Soleil | Si le soleil est à plus de 5° au-dessus de l’horizon et que le rayonnement mesuré dépasse 50 W/m² : rayonnement ÷ 300, jusqu’à +3,5 °C. Les UV et la luminosité ne remplacent pas le rayonnement. |
| Pluie | Dès 0,3 mm/h mesurés : −1,5 × min(intensité ÷ 2, 1) × (1 + min(vent effectif, 30) ÷ 60), jusqu’à −2,25 °C. |
| Nuit | Si le soleil est à 3° ou plus sous l’horizon et la couverture nuageuse sous 40 % : −1 × (1 − couverture ÷ 40), jusqu’à −1 °C. |

Exemple : **30 °C** au thermomètre et 60 % d’humidité donnent un indice de chaleur de **32,8 °C** ; un vent qui retire **0,4 °C** et un soleil qui ajoute **1 °C** donnent **33,4 °C ressentis**.

La pression, les UV, la pollution et les pollens n’entrent pas dans ce chiffre : ils peuvent en revanche nourrir la synthèse.

## Le mot et la nuance

Un mot résume la sensation, selon les seuils de l’échelle de stress thermique **UTCI** : Froid intense, Froid, Frais, **Agréable** (9 à 26 °C), Chaud, Très chaud, Chaleur intense, Chaleur extrême.

Le point de rosée ajoute une nuance quand elle compte : *air sec*, *un peu humide*, *lourd*, *très lourd* ou *étouffant*.

## Rosée, givre, gelée et brouillard

Hestia Weather calcule aussi le **point de rosée** et le **point de givre**. La synthèse compare la minimale prévue de la nuit :

- au point de givre : **gelée blanche** possible (dès 3 °C prévus sous abri, car le sol se refroidit de 2 à 3 °C de plus) ;
- au point de rosée : **brouillard** possible au petit matin, si l’air prévu est saturé, sans vent ni pluie.

Le brouillard « maintenant » est estimé avec l’humidité (97 % ou plus) et un écart de 0,4 °C au plus entre température et point de rosée, sans pluie. La visibilité n’est pas mesurée.

## L’alerte de la station

Le capteur **Alerte de la station** retient la situation la plus marquante, dans cet ordre :

| Alerte | Quand |
| --- | --- |
| Orage | Orage ou grêle prévus dans les 6 prochaines heures |
| Forte pluie | 12 mm/h mesurés ou plus |
| Rafales | 80 km/h ou plus (puis 60 km/h, après la chaleur et le froid extrêmes) |
| Canicule | 38 °C ressentis ou plus |
| Gel | −3 °C ressentis ou moins |
| Chaleur | 34 °C ressentis ou plus |
| Froid | 2 °C ressentis ou moins |
| UV | Indice 8 ou plus |

Orage, canicule, gel et rafales dès 80 km/h sont **urgents** (attribut `level` : `urgent`) ; les autres demandent une **action** (`action`) ; sans alerte, le niveau est `optimized`.

## Les limites

Le ressenti est une **estimation de l’ambiance extérieure** propre à Hestia Weather : pas un indice météorologique officiel, ni une mesure physiologique. Ces coefficients sont des règles d’estimation, pas une formule standard validée. Hestia Weather ne connaît ni vos vêtements, ni votre activité, ni votre exposition réelle : l’effet du soleil représente une ambiance exposée, pas forcément le ressenti à l’ombre.

[Le calcul dans le code](../custom_components/hestia_weather/engine/feel.py).
