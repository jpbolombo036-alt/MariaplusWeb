# Tests locaux

Les tests ne nécessitent aucun compte de démonstration ni accès à l’API de production.

## Tests de session et de pagination

Avec Node.js **22.15 ou plus récent** :

```powershell
npm.cmd run test:unit
```

Cette suite utilise `node:test` et le chargeur TypeScript local de `tests/support/register-typescript.mjs`.

Elle vérifie également le filtrage de navigation (dont `SUPER_ADMIN_GLOBAL`) et
les étapes facultatives après création d'un événement : poursuite des imports
après un échec, liste exacte des éléments non enregistrés et absence
d'avertissement lorsque toutes les étapes réussissent.

Les tests unitaires couvrent aussi la configuration API de même origine, la
restauration cookie puis `/auth/me`, et la récupération en lecture seule du lien
d'une invitation dont la réponse QR contient uniquement `qrDataUri`.
`report-regressions.spec.ts` vérifie les libellés de connexion, l'assistance de
récupération et le décodage réel des QR à faible marge (URL et jeton).

## Tests navigateur

Les dépendances du projet et le navigateur Chromium de Playwright doivent déjà être installés. Pour lancer tous les scénarios :

```powershell
npm.cmd run test:e2e
```

Pour les seuls parcours WhatsApp :

```powershell
node node_modules/@playwright/test/cli.js test tests/whatsapp-error-code.spec.ts --workers=1
```

Les exemples PowerShell emploient `npm.cmd` car la politique d’exécution de ce poste bloque `npm.ps1`. La configuration limite les tests à deux processus simultanés et accorde 120 secondes à chaque scénario, pour laisser au premier chargement Vite et aux rendus des cartes le temps de terminer.

La suite d’invitation publique couvre les écrans ordinateur et mobile, les limites du nombre d’accompagnants RSVP, la modification d’une réponse, sa conservation après rechargement et les invitations indisponibles. Elle exécute réellement `qrcode` et `html2canvas`, télécharge la carte PNG et décode son QR avec ZXing. Elle compare aussi, octet par octet, les images transmises et téléchargées, et vérifie que l’export local reste disponible lorsque la sauvegarde de l’image sur le serveur échoue.

La configuration démarre son propre serveur Vite sur `http://127.0.0.1:4183` et impose `VITE_API_BASE_URL=http://127.0.0.1:4179`. Le port 4183 doit être libre : un serveur déjà lancé n’est jamais réutilisé. Aucun serveur API n’est nécessaire au port 4179 : toutes ses réponses sont interceptées par les fixtures dans le navigateur.

Le helper `tests/support/e2e-api.ts` autorise uniquement le serveur Vite local et les réponses API simulées. Il bloque les autres requêtes, y compris les polices et les images distantes, et consigne toute route API dépourvue de fixture. Les service workers sont désactivés pendant les tests.

La suite WhatsApp parcourt le formulaire de connexion avec des identifiants fictifs en `example.test`, reçoit un cookie de renouvellement HttpOnly simulé, puis vérifie l’en-tête d’authentification transmis par l’application avec son jeton en mémoire. Les lots WhatsApp et leurs journaux sont entièrement simulés ; aucun message n’est envoyé. Les assertions portent sur les noms, messages d’échec, codes Meta présents ou absents et les chemins exacts des lots interrogés, dans la page de sélection et la modale d’envoi en masse.

Playwright ne collecte que les fichiers `*.spec.ts` ; les tests `*.test.mjs` s’exécutent séparément avec Node.js. Les traces d’échec se trouvent dans `test-results/`.

## Régressions de fiabilité des invités et RSVP

`guest-reliability.spec.ts` vérifie les réponses de recherche reçues dans le désordre, la reprise après une panne réseau, le verrouillage des soumissions et les formulaires d’édition indisponibles tant que leurs données ne sont pas chargées ou sont introuvables.

La suite publique vérifie aussi qu’un RSVP enregistré reste confirmé si la relecture échoue, pour une acceptation et un refus. Le bouton d’actualisation réessaie uniquement la lecture, sans envoyer un second RSVP.

Pour une vérification avec moins de concurrence sur une machine lente :

```powershell
node node_modules/@playwright/test/cli.js test --workers=1
```

La suite unitaire vérifie le délai explicite de 30 secondes du renouvellement et la propagation d’une erreur de timeout. Le timeout est simulé par l’adaptateur HTTP ; le test n’attend pas réellement 30 secondes.


## Modèles de cartes

Les scénarios publics vérifient les trois modèles, les exports 1278 × 1920, le décodage réel du QR, les noms longs, la composition sans photo et la régénération avec le même token. `invitation-template-picker.spec.ts` vérifie le choix, l’aperçu agrandi, la fermeture clavier, l’enregistrement et la réouverture sur mobile. Les aperçus utilisent un compte et un invité fictifs.

Sur un poste où les transformations Vite à froid sont lentes, la même suite peut vérifier une version compilée réservée aux tests. Les variables ci-dessous sont limitées au processus PowerShell courant ; ne pas déployer ce build de test :

```powershell
$env:VITE_API_BASE_URL='http://127.0.0.1:4179'
$env:VITE_PUBLIC_BASE_URL='http://127.0.0.1:4183'
npm.cmd run build -- --outDir output/playwright/e2e-build
$env:E2E_USE_PREVIEW='1'
node node_modules/@playwright/test/cli.js test tests/public-invitation.spec.ts tests/invitation-template-picker.spec.ts --workers=1
Remove-Item Env:E2E_USE_PREVIEW, Env:VITE_API_BASE_URL, Env:VITE_PUBLIC_BASE_URL
```

Le délai de démarrage serveur est de 180 secondes ; les assertions ordinaires disposent de 15 secondes et les rendus PNG complexes de 40 secondes. Les résultats et captures restent locaux dans output/playwright/.
