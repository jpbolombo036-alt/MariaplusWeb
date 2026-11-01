# Tests locaux

Les tests ne nécessitent aucun compte de démonstration ni accès à l’API de production.

## Tests de session et de pagination

Avec Node.js **22.15 ou plus récent** :

```powershell
npm.cmd run test:unit
```

Cette suite utilise `node:test` et le chargeur TypeScript local de `tests/support/register-typescript.mjs`.

## Tests navigateur

Les dépendances du projet et le navigateur Chromium de Playwright doivent déjà être installés. Pour lancer tous les scénarios :

```powershell
npm.cmd run test:e2e
```

Pour les seuls parcours WhatsApp :

```powershell
node node_modules/@playwright/test/cli.js test tests/whatsapp-error-code.spec.ts --workers=1
```

Les exemples PowerShell emploient `npm.cmd` car la politique d’exécution de ce poste bloque `npm.ps1`. La configuration limite les tests à deux processus simultanés et accorde 60 secondes à chaque scénario, pour laisser au premier chargement Vite et aux rendus des cartes le temps de terminer.

La suite d’invitation publique couvre les écrans ordinateur et mobile, les limites du nombre d’accompagnants RSVP, la modification d’une réponse, sa conservation après rechargement et les invitations indisponibles. Elle exécute réellement `qrcode` et `html2canvas`, télécharge la carte PNG et décode son QR avec ZXing. Elle compare aussi, octet par octet, les images transmises et téléchargées, et vérifie que l’export local reste disponible lorsque la sauvegarde de l’image sur le serveur échoue.

La configuration démarre son propre serveur Vite sur `http://127.0.0.1:4183` et impose `VITE_API_BASE_URL=http://127.0.0.1:4179`. Le port 4183 doit être libre : un serveur déjà lancé n’est jamais réutilisé. Aucun serveur API n’est nécessaire au port 4179 : toutes ses réponses sont interceptées par les fixtures dans le navigateur.

Le helper `tests/support/e2e-api.ts` autorise uniquement le serveur Vite local et les réponses API simulées. Il bloque les autres requêtes, y compris les polices et les images distantes, et consigne toute route API dépourvue de fixture. Les service workers sont désactivés pendant les tests.

La suite WhatsApp parcourt le formulaire de connexion avec des identifiants fictifs en `example.test`, reçoit un cookie de renouvellement HttpOnly simulé, puis vérifie l’en-tête d’authentification transmis par l’application avec son jeton en mémoire. Les lots WhatsApp et leurs journaux sont entièrement simulés ; aucun message n’est envoyé. Les assertions portent sur les noms, messages d’échec, codes Meta présents ou absents et les chemins exacts des lots interrogés, dans la page de sélection et la modale d’envoi en masse.

Playwright ne collecte que les fichiers `*.spec.ts` ; les tests `*.test.mjs` s’exécutent séparément avec Node.js. Les traces d’échec se trouvent dans `test-results/`.
