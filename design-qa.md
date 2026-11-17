# Vérification des modèles d’invitation — 13 novembre 2026

## Périmètre et vérité visuelle

Adaptation des références validées en trois cartes PNG personnalisées : Standard, Romance et Prestige. Les captures de pages défilantes Romance/Prestige sont des directions visuelles ; la carte téléchargeable ajoute un ticket d’accès et ne reproduit pas toute la page interactive, sa galerie ni le cadre du téléphone. Ce choix correspond au périmètre approuvé avant l’implémentation.

Sources :

- C:/Users/Ir John Peter/Downloads/Invitation élégante Soirée de Gala.png — Standard, 1024 × 1536.
- C:/Users/Ir John Peter/Downloads/WhatsApp Image 2026-11-12 at 13.24.45.jpeg — Romance, 499 × 1080 ; comparaison du contenu gauche recadré à 230 × 624, hors réseau social.
- C:/Users/Ir John Peter/Downloads/WhatsApp Image 2026-11-12 at 13.24.44.jpeg — Prestige, 499 × 1080 ; contenu du téléphone recadré à 289 × 630.
- C:/Users/Ir John Peter/Downloads/WhatsApp Image 2026-11-12 at 13.24.43.jpeg et 13.42.01.jpeg — compléments Prestige : calendrier, lieu et matière papier.

## Captures de l’implémentation

- output/playwright/invitation-models/standard.png
- output/playwright/invitation-models/romance.png
- output/playwright/invitation-models/prestige.png
- output/playwright/invitation-models/selector-mobile.png

Les trois images de carte sont des exports effectivement générés dans Chromium par html2canvas, à partir des composants de l’application : 852 × 1280 CSS px, scale 1,5, PNG 1278 × 1920. Viewport navigateur des cartes : 1280 × 720, deviceScaleFactor 1. État : RSVP accepté, données fictives, modèle fourni par l’API simulée. La photographie de réception est illustrative ; les cartes réelles utilisent la photo de l’organisateur ou une composition sans photo.

Le sélecteur est vérifié à 390 × 844 CSS px, deviceScaleFactor 1. Capture de la rubrique elle-même après sélection et réouverture de Prestige ; les contrôles et messages de l’application autour de cette rubrique ne font pas partie de la comparaison des références de cartes.

Comparaisons côte à côte ouvertes et inspectées :

- output/playwright/invitation-models/comparison-standard.png
- output/playwright/invitation-models/comparison-romance.png
- output/playwright/invitation-models/comparison-prestige.png

Ces planches font 840 × 640. La carte est normalisée à 399 × 600 ; la référence conserve son ratio dans une zone de 400 × 600. Les captures originales en pleine résolution ont aussi été inspectées pour lire les noms, dates, libellés et QR. Le programme défilant et les commandes de réseau social des références ne sont pas comparés à des contrôles de la carte PNG.

## Surfaces de fidélité vérifiées

**Polices et typographie.** Titres manuscrits Standard et signature en Great Vibes, distribuée localement sous le nom CSS Eventia Script avec licence OFL. Titres serif pour Romance/Prestige, corps sans serif avec polices de repli existantes. Les zones de texte ne coupent plus les glyphes dans le PNG. Le nom personnel est lisible et sa taille s’adapte aux noms longs.

**Espacement et composition.** Standard garde la répartition texte/photo latérale et le ticket inférieur. Romance garde une photographie en arche, des noms serif et les accents rose ancien. Prestige garde photographie supérieure, papier ivoire et calendrier. Le ticket et le QR occupent une zone dédiée. Les consignes de tenue de Prestige restent au-dessus du ticket. Le sélecteur mobile ne déborde pas horizontalement.

**Couleurs.** Palette ivoire/violet/or pour Standard ; accents rose ancien pour Romance ; champagne/brun pour Prestige. Les aplats du ticket restent clairs pour préserver lisibilité et contraste du QR. Les noms et dates sont en encre sombre ; la confirmation est verte.

**Images et ressources.** Fond botanique et photographie illustrative générés pour cette fonctionnalité ; versions JPG optimisées pour l’affichage. Les photos sont rendues en background-size: cover pour éviter l’étirement observé dans html2canvas avec object-fit. Le logo existant de l’application est conservé. Les personnes présentes dans les captures d’inspiration ne sont pas réutilisées dans les aperçus du produit.

**Contenu.** Les noms, dates, lieux et messages sont dynamiques. Aucun numéro de siège fictif n’est ajouté. Une table est affichée uniquement si l’API la fournit. Le calendrier suit la date de l’événement. Le QR garde le token de l’invité, quelle que soit la mise en page. Les aperçus organisateur indiquent l’utilisation d’un invité fictif et d’un QR de démonstration.

## Historique des corrections

1. P1 — Textes coupés dans les premiers exports : suppression des zones de découpe de texte incompatibles avec les métriques de rendu, ajustement des interlignes et police manuscrite locale. Preuve après correction : les trois PNG en pleine résolution.
2. P1 — Photographie étirée dans Prestige : remplacement du rendu object-fit par une image de fond avec couverture et cadrage. Preuve : prestige.png.
3. P2 — Consignes de tenue partiellement couvertes par le ticket Prestige : espacement et tailles des informations pratiques ajustés. Preuve : prestige.png après correction.
4. P0 — Retour vers about:blank après une édition ouverte directement : remplacement du retour historique par une navigation explicite vers la fiche événement. Le parcours organisateur a ensuite passé la sauvegarde et la réouverture.
5. P2 — Alerte 404 quand une photo facultative est absente : les deux lectures d’images facultatives ne notifient plus les 404 attendus ; les autres erreurs HTTP restent signalées. Contrôle final réussi : aucune alerte d’erreur, sélection sauvegardée et retrouvée à la réouverture ; capture selector-mobile.png inspectée.

## Interactions et contrôles

- Les trois modèles génèrent un PNG de dimensions attendues et un QR décodable par ZXing.
- Le même token est conservé lors d’un changement de modèle.
- Une nouvelle carte est générée après actualisation des données ; les sauvegardes sont sérialisées.
- Le rendu sans photo et le nom long sont couverts par un scénario navigateur.
- L’aperçu agrandi utilise un dialog natif et se ferme avec Échap.
- Le choix organisateur est envoyé au backend et retrouvé à la réouverture.
- Les tableaux d’erreurs JavaScript des fixtures sont contrôlés. Les polices externes sont volontairement bloquées dans les tests ; le titre manuscrit local et les polices de repli sont vérifiés.
- 41 tests unitaires frontend réussis ; 16 tests backend de validation/réponse publique réussis et un test d’intégration de persistance/migration réussi.

## Décisions et limites

Il s’agit d’une adaptation des références à la carte finale, avec les données du produit, et non d’une copie du cadre de téléphone ou des interfaces de réseaux sociaux. Les pages publiques détaillées restent disponibles. Les changements de modèle ne modifient pas une image déjà enregistrée sur un téléphone.

Les contrôles navigateur utilisent une API simulée. La persistance réelle du champ est vérifiée séparément avec Spring et une base H2 de test. Aucun déploiement de production n’est effectué. Le backend V49 et le frontend doivent être déployés ensemble.

## Contrôle final

La dernière capture du sélecteur a été inspectée : trois choix lisibles, Prestige sélectionné, aucun débordement horizontal et aucune fausse alerte 404. Le dernier scénario organisateur passe. Les 16 scénarios navigateur ont été validés au fil des exécutions et relances ciblées, sans prétendre à une dernière exécution globale entièrement verte. La vérification TypeScript, les 41 tests unitaires frontend et la compilation de production passent après les dernières corrections. Les 17 tests backend ciblés passent également.

final result: passed
