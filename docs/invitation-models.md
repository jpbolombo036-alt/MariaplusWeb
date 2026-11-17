# Modèles de cartes d’invitation

L’organisateur choisit un modèle pour tout l’événement dans l’étape Visuels de création ou dans Modifier l’événement. Les aperçus emploient un invité fictif et un QR de démonstration. La carte publique après acceptation contient le nom et le QR personnels de l’invité.

## Modèles

- STANDARD : papier ivoire, violet et doré, photographie latérale et ticket.
- ROMANCE : rose ancien, photographie en arche et composition de mariage.
- PRESTIGE : photographie en tête, papier ivoire, tons champagne et calendrier.

Les références fournies sont adaptées au format fixe 852 × 1280 CSS px, exporté en PNG 1278 × 1920. Les pages défilantes des références ne sont pas reproduites intégralement dans la carte. Le programme détaillé et la galerie restent consultables dans l’invitation publique.

## Contrat API

Le champ `invitationCardTemplate` accepte exactement `STANDARD`, `ROMANCE` ou `PRESTIGE`.

- POST /api/events : champ facultatif ; défaut STANDARD.
- PUT /api/events/{id} : champ facultatif ; omission conserve le choix.
- Réponses événement et GET /api/public/invitations/{token} : modèle enregistré.
- Backend : colonne events.invitation_card_template, migration Flyway V49, contrainte de validation et contrainte SQL.
- Frontend : réponse inconnue ou ancienne sans champ → STANDARD. Si l’édition renvoie un autre modèle que celui sélectionné, une erreur signale que le choix n’a pas été enregistré. Après création, un avertissement évite de faire recréer un événement déjà enregistré.

Le backend modifié se trouve dans le dossier voisin Mariageplus-main. Les modifications sont locales : déployer le backend avec V49 avant ou avec le frontend. Aucun déploiement de production n’est effectué par cette implémentation.

## Cartes existantes et régénération

Les images déjà téléchargées sur un téléphone ne changent pas. Une prochaine génération emploie le modèle reçu du backend. La génération réagit aussi aux modifications des informations de la carte et invalide l’image précédente. Les rendus et sauvegardes sont sérialisés pour empêcher une ancienne génération de remplacer une nouvelle sauvegarde. La sauvegarde serveur reste facultative pour le téléchargement local.

Le QR conserve le même token à travers les modèles. Aucune place, table, date ou identité n’est inventée : les éléments facultatifs sont masqués en l’absence de données. `tableName` est pris en charge si la réponse publique le fournit ; le contrat backend actuel ne l’expose pas encore et cette intégration ne crée pas de numéro de siège.

## Ressources visuelles

Le fond botanique et la photographie de réception pour les aperçus ont été générés pour cette fonctionnalité. Les fichiers JPG sont des versions optimisées ; les PNG sources sont conservés. La photo illustrative est réservée aux aperçus : les cartes réelles utilisent la photo de l’événement ou une composition sans photo.

Great Vibes est distribuée localement avec sa licence OFL dans public/fonts. Les familles déjà utilisées par l’application gardent leurs polices de repli.

## Vérifications

- Frontend : npm.cmd run typecheck ; npm.cmd run test:unit ; npm.cmd run build.
- Navigateur : node node_modules/@playwright/test/cli.js test tests/public-invitation.spec.ts tests/invitation-template-picker.spec.ts --workers=1.
- Backend : mvn.cmd -o "-Dtest=RsvpServiceTest,InvitationCardTemplateTest" test.
- Persistance/migration : mvn.cmd -o "-Dtest=EventControllerIntegrationTest#cardTemplate_isPersisted_andUnrelatedUpdatesPreserveIt" test.

Les tests navigateur utilisent uniquement une API simulée. Les exports visuels sont conservés dans output/playwright/invitation-models/. Le bilan de comparaison visuelle se trouve dans design-qa.md.
