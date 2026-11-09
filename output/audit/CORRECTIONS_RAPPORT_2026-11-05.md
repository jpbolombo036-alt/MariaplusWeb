# Traitement du rapport du 5 novembre 2026

Analyse et corrections locales réalisées le 9 novembre 2026 à partir des quatre
pages de `rapport-eventiaeasy-5-novembre-2026.pdf`, et non du précédent rapport
concernant les tests du 31 octobre.

## Résultats du rapport

- Navigation, compteurs, inscription et menu mobile : corrections confirmées par
  le rapport, pas de réécriture de ces fonctionnalités.
- WhatsApp : lot 53, une invitation livrée, aucune erreur. Le défaut 132012 du
  rapport précédent n'est pas à considérer comme encore reproduit. Aucun envoi
  réel n'a été déclenché pour ces corrections.
- Session : `/auth/refresh` répond « Refresh token invalide ». Il s'agit d'une
  réponse applicative, pas de la preuve d'une route absente.
- Nouvelle invitation : le contrat QR ne fournit que `qrDataUri`. Le lien doit
  pouvoir être retrouvé sans appeler les endpoints d'envoi.

## Changements locaux

1. API sur la même origine par défaut : réécritures `/auth` et `/api` vers Railway
   avant le fallback SPA Vercel, proxy équivalent Vite, réponses non cachables.
   Le refresh reste un cookie HttpOnly, jamais sauvegardé en stockage JavaScript.
   Cela supprime la dépendance aux cookies tiers, sans prouver que ceux-ci étaient
   l'unique cause du jeton invalide constaté en production.
2. QR : lecteur spécialisé QR, zone blanche supplémentaire pour les images à
   faible marge, délai de décodage augmenté ; résolution du lien en lecture seule
   avec vérification de son accessibilité publique. Cache invalidé à la rotation.
   Les URL mal encodées ne provoquent plus d'exception de décodage.
3. Connexion : champs explicitement associés à leurs libellés, icônes décoratives
   masquées, accès « Mot de passe oublié ? » vers une assistance clairement
   identifiée. Ce n'est PAS une réinitialisation automatique : aucun endpoint de
   récupération n'a été trouvé dans le backend local consulté en lecture seule.
4. Même correction de libellés explicites pour les listes invité/table du
   formulaire d'invitation, détectée par les tests navigateur.

## Mise en production requise pour la session

- Sur Vercel, supprimer ou laisser vide `VITE_API_BASE_URL` pour utiliser le proxy.
  La variable est incorporée au build : un nouveau déploiement est nécessaire.
- Si le backend change, modifier les destinations dans `vercel.json`.
- Pour un backend local, définir `API_PROXY_TARGET=http://localhost:8000` avec
  `npm run dev`. L'override direct `VITE_API_BASE_URL` reste disponible.
- Après déploiement, se reconnecter une fois : l'ancien cookie Railway ne migre
  pas vers le domaine frontend.
- Contrôler `Set-Cookie: mp_refresh=…; HttpOnly; Path=/auth`, sa présence au
  renouvellement, le rechargement de la page et le renouvellement après un 401.
  Ne jamais copier les valeurs des tokens dans les captures ou les journaux.
- Si le rejet persiste, examiner côté serveur les attributs du cookie, la prise en
  compte du HTTPS derrière proxy, la validité et la rotation des tokens. Aucun
  déploiement backend ou changement de secret n'a été réalisé ici.

## Validation locale

- TypeScript : succès.
- Tests unitaires : 39 réussis, aucun échec.
- Build final : succès.
- Tests ciblés formulaire et rapport : 7 réussis.
- RSVP accepté, PNG, QR et téléchargement : test ciblé réussi.
- Première suite complète : 13/18 réussis ; les libellés du formulaire ont été
  corrigés ensuite et les quatre tests concernés ont réussi à la relance.
- Suite complète finale : **18 tests navigateur réussis sur 18**, code de sortie
  0 ; TypeScript et build relancés ensuite avec succès. Ne pas confondre un
  succès local simulé avec une restauration de session réelle sur Vercel.

Sources techniques consultées : documentation officielle Vercel sur les
réécritures externes, documentation MDN sur les cookies tiers, contrat Java local
`AuthController`/`AuthService`, et service de génération QR local. Le backend
voisin n'a pas été modifié.