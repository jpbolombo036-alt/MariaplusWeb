# QR de régression générés par Java ZXing

Ces PNG contiennent uniquement des jetons fictifs, sans accès à des invitations
réelles. Ils ont été générés avec ZXing Java 3.5.2, comme le service backend :
`QRCodeWriter`, dimensions 320 × 320, `CHARACTER_SET=UTF-8`, `MARGIN=1`,
puis `MatrixToImageWriter.writeToPath(matrix, "PNG", path)`.

Les trois jetons commençant par `1x0`, `jAg` et `uiS` reproduisent un échec du
détecteur standard dans Chromium avec la version précédente de `decodeQrPayload`.
Ils proviennent d'un corpus de 100 jetons synthétiques générés par
`new Random(42)`, 32 octets par jeton, encodés en base64 URL sans padding.
Les deux autres images sont des contrôles qui étaient déjà lisibles.

Le test `tests/report-regressions.spec.ts` décode ces images dans le navigateur.
Il complète les contrôles générés avec la bibliothèque JavaScript `qrcode`, dont
les deux images initiales ne reproduisaient pas le problème.

Validation au moment de la correction : 3 échecs sur le corpus de 100 images
avant le changement. La validation après ajout de `PURE_BARCODE` reste à terminer :
le terminal intégré ne confirme plus l'exécution des commandes. Ne pas présenter
le correctif comme validé ou déployé tant que les tests n'ont pas été relancés.