# Analyse d’EventiaEasy — 12 novembre 2026

## Périmètre

Analyse du dépôt local : architecture, principaux parcours, appels API, état partagé, configuration, maintenabilité et tests existants. Lecture ciblée des points d’entrée et principaux modules ; cette analyse n’est pas une revue exhaustive de chaque ligne.

Le dépôt contient le frontend Vue. Aucun backend ni schéma de base de données n’a été trouvé dans les sources applicatives examinées. Les autorisations serveur, attributs réels des cookies, transactions, quotas et livraisons WhatsApp/email restent à vérifier avec le backend. Les tests navigateur utilisent une API simulée. Aucun message réel n’a été envoyé.

Aucun fichier source applicatif n’a été modifié. La compilation régénère dist/ et les tests produisent des artefacts locaux. Les fichiers déjà présents ont été conservés.

## 1. Vue d’ensemble

EventiaEasy est une application de gestion événementielle historiquement orientée mariage, désormais organisée autour d’un objet Event. Trois parcours principaux : l’organisateur prépare et suit son événement ; l’invité consulte son invitation et répond ; l’agent d’accueil contrôle les entrées. Une console SUPER_ADMIN gère la plateforme.

Le socle comprend 112 fichiers sous src/ et environ 17 000 lignes non vides selon le comptage PowerShell, templates et styles compris. La version déclarée est 0.1.0. Ces chiffres décrivent le volume, pas la qualité.

Appréciation : base fonctionnelle avancée et structurée, avec des protections de session et des tests de régression utiles. Les priorités sont la fiabilité sous réseau lent ou défaillant, la cohérence des permissions d’interface et les volumes importants. Rien dans cette analyse ne justifie une réécriture complète.

## 2. Architecture

Navigateur → main.ts/App.vue → Vue Router → vues/composants/composables → stores Pinia et services src/api → client Axios → proxy /auth ou /api → backend externe configuré sur Railway.

| Élément | Fonction et observation |
|---|---|
| Vue 3 + TypeScript | Composants et logique ; mode strict activé |
| Vue Router | Routes publiques, dashboard, agent et administration ; imports différés |
| Pinia | Authentification, événement actif, réglages, thème et notifications |
| Axios | Transport centralisé, JWT et renouvellement de session |
| Tailwind/CSS | Présentation responsive, thèmes et invitation imprimable |
| ZXing et qrcode | Lecture et génération des QR |
| html2canvas | Export PNG de carte ; import dynamique |
| Vite/Vercel | Build, proxy et routage SPA |

Le découpage par services API, vues et composants est lisible. Les composables d’invitation publique séparent déjà chargement, présentation, RSVP et carte.

La migration mariage → événement reste visible : useWeddingStore, weddingGuestsPath et permissions WEDDING_* coexistent avec /api/events. Ce n’est pas une panne démontrée, mais cela augmente le coût de compréhension. Tout renommage doit préserver les contrats serveur.

## 3. Fonctionnalités présentes

| Domaine | Couverture identifiée |
|---|---|
| Comptes | Connexion, inscription, profil, déconnexion et restauration |
| Organisations | Équipe, membres et administration des organisations |
| Événements | Liste, assistant, édition, publication, fin et archivage |
| Préparation | Photos, lieu, coordonnées, dress code et programme |
| Invités | CRUD, catégories, recherche/pagination serveur, import et export |
| Invitations | Création, envoi, relance, annulation, liens et QR |
| WhatsApp | Lots d’envoi, progression, journaux et codes d’erreur |
| Public | Invitation, programme, galerie, RSVP, boissons, carte PNG et partage |
| Tables | Capacité, affectation, déplacement et retrait des invités |
| Accueil | Scan QR, recherche et enregistrement de présence |
| Suivi | Tableau de bord, compteurs, RSVP et statistiques |
| Administration | Utilisateurs, organisations, événements, catalogue et réglages |

La récupération d’accès sur la connexion est une assistance WhatsApp. Aucun parcours autonome de réinitialisation par jeton n’a été identifié dans les routes frontend.

## 4. Points solides

- Le jeton d’accès reste en mémoire, sans persistance dans localStorage. Le renouvellement est conçu autour d’un cookie HttpOnly ; ses attributs effectifs dépendent du backend.
- Les renouvellements simultanés partagent une promesse ; une révision empêche les anciennes requêtes de session de réauthentifier un compte quitté.
- Les stores d’événement et de plateforme sont nettoyés aux changements de compte et à l’expiration.
- collectAllPages contrôle les pages inattendues, doublons et collections incomplètes ; il est utilisé pour les événements et invités.
- Les pages publiques n’imposent pas de restauration de session avant affichage.
- L’assistant de création poursuit les étapes facultatives après un échec et signale les éléments non enregistrés.
- L’export local de carte est prévu même si sa sauvegarde serveur échoue.
- Les tests ciblent des cas utiles : courses de session, pagination, QR réellement décodés et reprises après erreur.

## 5. Constats prioritaires

### A. Recherche d’invités : réponses obsolètes — haute priorité

Source : src/views/event/GuestsTab.vue:205 et :218.

Le délai de 350 ms réduit les départs de recherche, mais load() n’annule pas les requêtes et ne contrôle pas leur ordre de retour. Une recherche A peut finir après B et remplacer ses résultats. La pagination présente le même risque.

loading n’est pas remis à true au début des chargements suivants. Le délai de recherche n’est pas nettoyé au démontage. Un échec initial peut laisser apparaître un écran vide plutôt qu’un état d’erreur. L’intercepteur global ne notifie pas les erreurs sans statut HTTP.

Action : accepter uniquement la dernière réponse, nettoyer le minuteur, distinguer chargement/erreur/liste vide et offrir une nouvelle tentative. Vérifier avec deux réponses volontairement inversées.

### B. Formulaire invité : soumissions multiples et initialisation — haute priorité

Source : src/views/forms/GuestsForm.vue:84 et :101.

submit() n’a pas de verrou d’exécution et le bouton n’est pas désactivé pendant la requête. Plusieurs clics peuvent produire plusieurs POST. Les doublons effectifs dépendent des protections serveur.

En édition, le formulaire reste utilisable pendant le chargement. Les valeurs arrivant du serveur peuvent écraser une saisie commencée. Si l’invité est introuvable, le formulaire reste vide tout en conservant le mode édition.

Action : états loading/saving/error, verrou au début de submit(), formulaire bloqué avant initialisation et message introuvable explicite. Le formulaire d’invitation possède déjà un verrou et fournit un exemple local.

### C. Renouvellement de session sans délai explicite — haute priorité

Source : src/api/http.ts:83.

Le client http dispose d’un timeout de 30 secondes. doRefresh() appelle directement axios.post avec une autre configuration qui ne reprend pas ce délai. Son AbortSignal annule les changements de session mais ne fixe pas de durée maximale.

Effet possible : si le renouvellement reste en attente, les appels ayant reçu 401 attendent la même promesse.

Action : borner la durée du renouvellement et tester un serveur qui ne répond pas. Distinguer une panne temporaire d’un renouvellement refusé lorsque le contrat le permet.

### D. RSVP enregistré mais présenté comme un échec — haute priorité

Source : src/composables/useInvitationRsvp.ts:81 et :103.

Le POST de réponse et le GET de relecture sont dans le même try ; success n’est mis à jour qu’après les deux. Si l’écriture réussit mais que la relecture échoue, l’invité voit une erreur alors que sa réponse peut déjà être enregistrée.

Action : séparer confirmation de l’écriture et actualisation. Permettre une relecture sans resoumettre. Ajouter le cas POST réussi/GET échoué aux tests.

### E. Permissions des boutons invités — priorité moyenne

Sources : src/views/event/GuestsTab.vue:24, :85 et :127 ; src/router/index.ts:90.

Ajouter est visible avec GUEST_CREATE ou GUEST_IMPORT alors qu’il ouvre une création manuelle. Modifier n’est pas protégé par GUEST_UPDATE. Le routeur vérifie l’authentification et certains accès SUPER_ADMIN, sans permissions métier déclarées pour chaque route.

Cela peut exposer une interface proposant des actions refusées ensuite par le serveur. Ce constat ne démontre pas une faille d’autorisation backend.

Action : aligner les boutons et routes avec les permissions attendues ; vérifier séparément les contrôles serveur et l’isolation entre organisations.

### F. Pagination hétérogène — priorité moyenne

Sources : src/api/guests.ts:107, src/api/drinks.ts:29, src/api/weddingEvents.ts:68, src/api/invitations.ts:42 et :287.

Catégories, boissons, sessions et journaux demandent une taille fixe sans parcourir les pages suivantes. Risque conditionnel : si le backend pagine ou plafonne ces collections, certaines données restent invisibles. Il faut vérifier chaque contrat avant d’affirmer une troncature réelle.

listInvitations lance toutes les pages suivantes en parallèle, sans limite de concurrence, et dépend de totalPages. Une grande collection peut produire une pointe de requêtes.

Action : choisir une pagination d’écran ou une collecte complète contrôlée selon le besoin ; borner la concurrence et harmoniser les garanties.

### G. Une édition charge tous les invités — priorité moyenne

Source : src/views/forms/GuestsForm.vue:87 ; src/views/event/TablesTab.vue.

Le formulaire charge listGuests(id) puis recherche un seul identifiant. Le coût augmente avec la collection. Le placement charge lui aussi tous les invités et utilise des recherches imbriquées pour identifier les non-affectés.

Action : endpoint de détail si disponible, recherche serveur pour les placements importants et Set/Map pour les affectations. Aucun nouvel endpoint ne doit être supposé disponible sans validation backend.

### H. Réponses API permissives et typage incomplet — priorité moyenne

Sources : src/api/http.ts:186, src/models/auth.ts, src/views/ProfileView.vue et src/components/invitations/InvitationActions.vue.

decodeMap/decodeList transforment certains formats inattendus en objets ou listes vides. Les parseurs convertissent fréquemment les champs absents en 0 ou chaîne vide. Cela peut masquer une rupture de contrat sous une apparence de données métier vides. Plusieurs any limitent la protection de TypeScript strict.

Action : valider d’abord identifiants, statuts et réponses de session. Remplacer progressivement les any aux frontières importantes.

## 6. Maintenabilité et interface

- AgentCheckinView.vue dépasse 850 lignes ; EventWizard.vue environ 630 ; plusieurs vues d’invitation dépassent 450. Extraire des responsabilités ciblées sans refonte générale.
- Le CSS de l’invitation publique approche 1 800 lignes. Le découpage existant en composants peut guider la séparation des styles.
- Le mode sombre utilise de nombreuses surcharges globales !important. Étendre les tokens sémantiques existants simplifierait les évolutions.
- Les styles .input sont répétés dans plusieurs formulaires ; mutualiser les états et styles de base.
- Certains dialogues utilisent des div sans rôle dialog explicite, notamment le résultat d’import d’invités. Vérifier nom accessible, focus initial, retour du focus et fermeture clavier. Aucun audit WCAG complet n’a été réalisé.
- Les points du carrousel de EventDetailView n’ont pas de libellé accessible explicite ; ajouter un nom et un contrôle de l’animation. Le carrousel de l’invitation publique possède déjà des libellés.
- Les polices et certaines images dépendent de domaines externes. Tester le repli et le rendu PNG sous réseau lent.
- index.html contient langue et titre, mais aucune meta description identifiée. Définir les métadonnées et prévisualisations de liens selon les besoins, sans publier par défaut les informations privées d’une invitation.

## 7. Configuration et exploitation

Le proxy /auth et /api de même origine est cohérent avec la restauration par cookie. L’hôte Railway apparaît dans vite.config.ts et vercel.json : ces configurations doivent rester cohérentes.

Point opérationnel : sans API_PROXY_TARGET explicite, le développement relaie les appels vers l’hôte nommé production. Utiliser un backend local ou staging avant des essais manuels qui écrivent des données. Les tests existants imposent au contraire une API locale simulée.

Les réponses /auth et /api sont marquées no-store dans vercel.json. Le comportement réel du déploiement, des cookies et de leurs attributs reste à contrôler sur l’hébergement.

npm run build lance Vite uniquement : il ne lance ni vue-tsc ni les tests. Aucun workflow GitHub Actions n’a été trouvé dans .github/workflows. Le .github présent contient des artefacts de réarchitecture non suivis dans l’état initial, pas un pipeline CI.

Aucun README racine n’a été identifié. tests/README.md explique les tests. Ajouter installation, version Node attendue, environnements, rôles et déploiement. La documentation actuelle demande Node 22.15 ou plus récent pour les tests unitaires.

Les fichiers .env locaux et artefacts Vite sont ignorés par Git. Aucun contenu confidentiel de configuration n’est reproduit ici.

## 8. Vérifications exécutées

| Contrôle | Résultat |
|---|---|
| npm.cmd run typecheck | Réussi, sortie 0 |
| npm.cmd run test:unit | 39 tests réussis, 0 échec |
| npm.cmd run build | Réussi : Vite 5.4.21, 592 modules transformés |
| Suite Playwright complète, 2 workers | 19 réussis, 4 échecs, 23 scénarios |
| Relance ciblée invitation publique, 1 worker | 9 scénarios réussis, 0 échec, environ 1,1 minute |

Les premiers lancements du build et du serveur de tests ont échoué sur un refus d’accès esbuild aux dossiers parents. La relance avec les permissions adaptées a permis de compiler ; ce refus initial n’est donc pas imputé au code.

Les quatre échecs navigateur initiaux : titre d’invitation non trouvé dans les 15 secondes sur ordinateur et mobile ; aperçu PNG absent dans les 20 secondes pour l’acceptation RSVP et le repli après échec de sauvegarde. Les traces montrent des délais de chargement et de rendu html2canvas. La relance des neuf scénarios publics avec un seul worker passe intégralement, y compris les quatre cas initialement en échec. Cela indique une sensibilité aux délais et aux conditions de concurrence/chargement ; aucune régression fonctionnelle de ces quatre parcours ne se reproduit dans cette relance. La suite complète ne fait pas partie de cette relance. Conserver les deux résultats séparés et stabiliser les tests avant leur intégration en CI.

Le build émet un fichier principal d’environ 194 kB avant gzip (72,5 kB gzip), html2canvas autour de 201 kB (48 kB gzip) et un autre chunk autour de 458 kB (120 kB gzip). Ce sont des tailles de fichiers, pas une mesure de vitesse ni un total de téléchargement initial. Des imports différés sont déjà présents.

Les tests unitaires couvrent notamment restauration, frontières entre comptes, courses de renouvellement, invalidation des stores et pagination. Les tests navigateur ciblent invitations, RSVP, QR, PNG, reprises après erreur et codes WhatsApp. Ces validations n’attestent pas les endpoints réels ni une caméra physique.

## 9. Ordre de travail proposé

1. Fiabiliser les écritures et confirmations : verrou de formulaire invité, séparation RSVP/relecture, délai du renouvellement.
2. Fiabiliser les listes : réponses obsolètes, états d’erreur et contrats de pagination.
3. Harmoniser les permissions des actions et tester les profils lecture seule/import/modification.
4. Automatiser typecheck, tests unitaires, build et tests navigateur dans une CI reproductible.
5. Réduire les chargements complets et tester des jeux de données représentatifs.
6. Extraire progressivement les responsabilités des grandes vues et harmoniser le vocabulaire Event et les styles.
7. Effectuer une recette de staging avec plusieurs organisations, rôles et agents ; contrôler capacités, doublons et isolation des ressources côté serveur.

Le socle existant et les tests de régression doivent être préservés. La prochaine étape utile est une série de corrections ciblées suivie d’une recette avec le backend.


## 10. Corrections appliquées après accord — 12 novembre 2026

Les quatre points de haute priorité A à D ont été traités dans le frontend :

- GuestsTab : invalidation des réponses obsolètes dès la modification de la recherche, nettoyage du minuteur au démontage, état de chargement à chaque lecture et erreur explicite avec nouvelle tentative.
- GuestsForm : blocage du formulaire pendant le chargement et la sauvegarde, garde contre les doubles soumissions, erreur de chargement/sauvegarde et invité introuvable. Les valeurs saisies sont conservées après un échec de sauvegarde.
- Client HTTP : délai explicite de 30 secondes sur le renouvellement Axios, en complément de son signal d’annulation.
- RSVP : confirmation locale après écriture réussie, actualisation séparée dont l’échec conserve la confirmation, message explicite et bouton qui réessaie uniquement la lecture. Les acceptations et refus sont couverts. Les modifications sont verrouillées pendant les opérations pour éviter une relecture concurrente avec une nouvelle réponse.

Validation après modification : TypeScript réussi ; build de production réussi ; 40 tests unitaires réussis. La suite navigateur de 29 scénarios a d’abord validé 25 scénarios ; les 4 nouveaux tests d’invités ont nécessité des corrections de sélecteurs de test (bouton de connexion ambigu puis initiales incluses dans les cellules). Deux tests ont ensuite passé une première relance ciblée et les deux derniers ont passé la relance finale. Les 29 scénarios ont donc chacun été validés, sur plusieurs exécutions ; aucune exécution unique de la suite complète après correction de tous les sélecteurs n’est revendiquée.

Les tests utilisent une API simulée. Aucun déploiement ni modification backend n’a été effectué. Les points de priorité moyenne et les recommandations générales du rapport restent ouverts.
