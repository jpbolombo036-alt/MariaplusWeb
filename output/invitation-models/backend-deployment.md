# Déploiement backend — 13 novembre 2026

- Dépôt : https://github.com/jpbolombo036-alt/Mariageplus
- Branche : main
- Commit : 7f38a08f02e762718706d2b5300dabdfc2b475ed
- Périmètre : 11 fichiers des modèles de carte et de leurs tests, dont migration V49. Les modifications locales de gestion des utilisateurs sont exclues.
- Source isolée : output/backend-deploy ; le dépôt voisin conserve ses changements locaux.
- Validation locale : mvn.cmd -o -B test, 284 tests, zéro échec/erreur, BUILD SUCCESS.
- GitHub CI : Maven tests, success, https://github.com/jpbolombo036-alt/Mariageplus/actions/runs/43421977988/job/131873932585
- Railway : earnest-rejoicing / production, déploiement GitHub 7764712054.
- Résultat Railway : success à 2026-11-13 13:04:22 Africa/Lagos (12:04:22 UTC).
- Suivi : https://railway.com/project/fd204c72-5d74-436d-91a3-834694a29f04?environmentId=aba29d0a-9b24-42ed-a872-711e5de87194
- Le contrôle HTTP direct n’a pas été autorisé ; le succès est attesté par le statut Railway remonté à GitHub. Railway est configuré avec /health comme healthcheck.
- Le frontend n’a pas été déployé dans cette opération.
