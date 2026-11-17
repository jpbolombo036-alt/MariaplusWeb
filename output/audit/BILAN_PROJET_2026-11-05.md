# Bilan EventiaEasy — 5 novembre 2026

> **Mise à jour après corrections locales :** les sections ci-dessous conservent le bilan initial. EE-03, EE-04, EE-05, EE-07 et les boutons visés par EE-08 ont depuis été corrigés dans le frontend. Les compteurs sont invalidés après les écritures réussies et actualisés au changement d'onglet ; une galerie absente (404/204) ou désactivée n'affiche plus d'erreur ; les vraies erreurs de service restent signalées. L'accueil ouvre directement l'inscription, propose un menu mobile et expose des libellés accessibles. Le renouvellement automatique transmet désormais aussi `X-Client-Platform: web`. Le message WhatsApp ne conclut plus à une absence de réception lorsque la livraison est simplement non confirmée.
>
> La récupération du mot de passe (EE-06) est laissée de côté à la demande de l'utilisateur. Le backend voisin `Mariageplus-main`, confirmé par l'utilisateur, a été consulté en lecture seule : il contient déjà `POST /auth/refresh`, le cookie de renouvellement et la construction du composant image WhatsApp avec repli. Aucun déploiement ni envoi réel n'a été effectué ; leur fonctionnement en production reste à confirmer.
>
> **Validation après corrections :** TypeScript et compilation réussis ; **31 tests unitaires réussis sur 31**, dont cinq nouveaux tests couvrant les invalidations et les galeries, et une assertion du marqueur web lors du renouvellement. La relance navigateur avec une limite de 60 secondes n'a exécuté aucun des 15 scénarios : démarrage bloqué dans cet environnement. Les assertions navigateur ne sont donc pas validées.

## Périmètre et méthode

Comparaison du code local avec les sept pages du PDF « EventiaEasy — Rapport de tests et envois WhatsApp », relatif aux essais du 31 octobre 2026. Le PDF est un rapport de recette, pas un cahier des charges exhaustif. Ses recommandations sont analysées comme des constats et des propositions ; aucune opération de production ou d'envoi n'a été déclenchée pour ce bilan.

Le dépôt contient le frontend Vue 3, TypeScript, Pinia, Vue Router, Tailwind et Vite. Les adaptateurs HTTP sont dans `src/api/`. Le backend métier, sa base de données et le connecteur Meta ne sont pas présents. Les statuts ci-dessous portent sur le code local ; ils ne prouvent pas que cette version est déployée sur Vercel ou Railway.

## Ce qui est déjà réalisé

| Domaine | Éléments présents dans le projet | Niveau de preuve |
| --- | --- | --- |
| Comptes | Connexion, inscription utilisateur et organisation, profil, mot de passe du compte connecté, avatar, déconnexion | Écrans, store et appels API présents |
| Sessions | Restauration par cookie HttpOnly, renouvellement du jeton, gestion des requêtes concurrentes, nettoyage des données au changement de compte | Code et tests unitaires ; intégration serveur à confirmer |
| Événements | Assistant de création, modification, informations, visuels, programme, publication et changements de statut | Code présent ; création de brouillon déjà réussie selon le PDF |
| Invités | Ajout, modification, suppression, catégories, accompagnants, recherche et pagination serveur | Code présent ; ajout avec accompagnants validé dans le PDF |
| Fichiers invités | Import Excel/CSV, résultat et erreurs par ligne, modèle CSV, export Excel | Interface et appels API présents ; traitement réel non validé ici |
| Invitations | Création, annulation, suppression, liens publics, QR, partage WhatsApp, relances et envoi en masse | Code présent ; génération et lien validés dans le PDF |
| Parcours public | Détails, programme, dress code, réponse RSVP, nombre de personnes et choix de boisson, carte PNG avec QR | Code et tests navigateur existants ; parcours principal réussi dans le PDF |
| Accueil | Recherche manuelle, scan caméra, vérification de l'invitation, validations unitaires et liste des présents | Code présent ; recherche et limite de capacité validées dans le PDF, caméra physique à tester |
| Tables | Création, modification, suppression, capacité, affectation, déplacement et retrait des groupes | Code présent ; placement de trois personnes validé dans le PDF |
| Boissons et galerie | Catalogue, sélection de boissons ; administration des photos et galerie publique | Écrans et API présents, intégration à valider |
| Supervision | Tableau de bord, statistiques, activité récente, utilisateurs, organisations, équipe et permissions d'affichage | Code présent ; autorisations serveur et isolation non auditées |

## Comparaison point par point avec le PDF

| Référence | État actuel | Preuve et travail restant |
| --- | --- | --- |
| EE-01 — perte de session | Partiellement traité ; résolution en production non démontrée | `src/stores/auth.ts` attend le renouvellement et recharge le profil ; `src/router/index.ts` attend `restore()` avant de protéger les routes. `src/api/http.ts` transmet les cookies et mutualise les renouvellements. L'appel reste `POST /auth/refresh`, route signalée en 404 dans le PDF. Vérifier route, réponse, cookie et configuration interdomaines côté serveur, puis tester une connexion suivie d'un rechargement sur le déploiement. |
| EE-02 — mauvais événement dans le menu | Correction identifiable dans le code local | `src/layouts/AppLayout.vue` synchronise `route.params.id` avec le store, y compris après son chargement. La clé du `router-view` recrée les vues au changement d'événement. Sidebar et navigation mobile lisent le même store. À confirmer par un test dédié création → nouvel événement → menus ordinateur/mobile → précédent/suivant. |
| EE-03 — compteurs à zéro | Reste à corriger | `src/views/EventDetailView.vue` charge les statistiques au montage et les conserve pendant les changements d'onglet. Aucun mécanisme d'invalidation après ajout d'invité, création d'invitation ou check-in n'y est présent. Prévoir une actualisation après mutation et/ou retour sur la fiche. |
| EE-04 — galerie facultative en erreur | Reste à corriger | `PublicGallerySection.vue` masque la section après échec, mais `getPublicGallery()` dans `src/api/gallery.ts` utilise le client HTTP sans `skipNotification`. L'intercepteur affiche donc encore le message d'un 404 avant que le composant ne l'intercepte. Gérer silencieusement l'absence prévue et distinguer les véritables pannes. |
| EE-05 — inscription depuis l'accueil | Reste à corriger | Les appels de l'accueil ouvrent `/login` ; `LoginView.vue` initialise toujours le mode `login`. Prévoir un mode d'inscription explicite dans la navigation. |
| EE-06 — mot de passe oublié | Non trouvé dans le périmètre inspecté | Le changement de mot de passe depuis un compte connecté existe ; le parcours public de récupération, ses routes et ses appels API ne sont pas présents. Ajouter demande, confirmation neutre, lien à durée limitée et réinitialisation côté frontend et backend. |
| EE-07 — menu mobile public | Reste à corriger | `LandingView.vue` masque les liens avec `hidden md:flex`, sans menu de remplacement. Ajouter l'accès aux sections sur petit écran et vérifier 320/390 px. |
| EE-08 — noms accessibles | Reste à corriger | Les boutons concernés contiennent encore les textes d'icônes `dark_mode` / `visibility`. Certains ont un `title`, mais pas de nom accessible explicite adapté à l'état ni d'icône masquée aux lecteurs d'écran. Vérifier l'arbre d'accessibilité après correction. |
| WhatsApp — code 132012 | Diagnostic amélioré ; correction métier non prouvée | Les journaux exposent `errorCode`, les interfaces distinguent acceptation et livraison et les tests simulent les erreurs. `startBulkSend()` demande un traitement au backend ; le composant d'en-tête envoyé à Meta n'est pas construit dans ce dépôt. Inspecter le modèle et le média côté backend, bloquer les envois invalides et vérifier ensuite une livraison réelle autorisée. |

Le PDF rapporte deux échecs WhatsApp, lots 46 et 47 : zéro envoyé, zéro livré et une erreur par lot. Ajouter une photo n'a pas réglé l'erreur. Un lot `COMPLETED` signifie que son traitement est terminé ; il ne prouve pas la livraison. Les tests locaux simulés ne peuvent pas établir une correction de ce point.

## Reste à faire, dans l'ordre conseillé

1. **P1 — Session en production :** vérifier le contrat frontend/backend de renouvellement et prouver la conservation de session après rechargement.
2. **P1 — WhatsApp :** corriger ou confirmer la construction de l'en-tête IMAGE côté backend et la disponibilité du média, puis contrôler la livraison et son retour de statut.
3. **P2 — Compteurs :** actualiser les indicateurs de la fiche après les opérations métier.
4. **P2 — Galerie :** traiter l'absence facultative sans notification d'erreur et conserver un signalement approprié des pannes.
5. **P2 — Recette de navigation :** valider la correction EE-02 sur ordinateur et mobile et ajouter une couverture de régression.
6. **P2 — Accès au compte :** ouvrir directement l'inscription depuis les appels concernés et réaliser le parcours de récupération du mot de passe.
7. **P3 — Accueil et accessibilité :** menu mobile et libellés accessibles des boutons.
8. **Avant validation complète :** tester avec l'API réelle les imports/exports, modifications/annulations, permissions, séparation des organisations, emails et check-in concurrent ; essayer la caméra sur de vrais téléphones et les navigateurs Safari/Firefox.

## Éléments à ne pas compter comme terminés

Les entrées Prestataires, Budget et Messages sont présentées dans `soonItems` dans la sidebar et n'ont pas de parcours métier associé dans le routeur inspecté. Elles relèvent d'évolutions éventuelles : le PDF ne permet pas de les qualifier d'exigences contractuelles manquantes. Même prudence pour les paiements et le fonctionnement hors ligne, mentionnés uniquement parmi les limites des essais.

Les statistiques ont une page fonctionnelle mais simple (quatre indicateurs). Le dépôt ne permet pas d'attester un reporting métier complet ou une capacité à gérer une charge réelle donnée.

## Vérifications techniques de cette analyse

- `npm.cmd run typecheck` : terminé sans erreur.
- `npm.cmd run test:unit` : **26 tests réussis sur 26**, couvrant pagination, limites de compte et requêtes concurrentes.
- `npm.cmd run build` : **réussi**, 590 modules transformés.
- `npm.cmd run test:e2e` : **non validé**. Les deux premiers scénarios échouent avant toute assertion : `browserType.launch: Timeout 180000ms exceeded`. Chromium ne termine pas son démarrage dans cet environnement. La suite a été interrompue pour éviter de répéter ce même blocage sur les 15 scénarios. Cela ne démontre pas un défaut fonctionnel des formulaires et ne permet pas de déclarer les tests navigateur réussis.
- Les premiers lancements de Vite ont rencontré un refus d'accès du bac à sable aux dossiers parents ; les contrôles ont été relancés avec autorisation hors bac à sable. Cette restriction d'exécution n'est pas un défaut applicatif démontré.
- Les tests navigateur utilisent une API simulée et ne valident ni le serveur de production ni une livraison de message.

## Conclusion

Le socle de gestion événementielle est développé et le rapport précédent confirme un parcours métier principal réussi. La priorité est de fiabiliser les intégrations de session et de messagerie, corriger les états d'affichage restants et compléter la recette. Un pourcentage global d'achèvement serait trompeur sans cahier des charges complet, backend et critères d'acceptation.
