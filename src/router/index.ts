import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  // Ramène toujours en haut de la page lors d'une navigation
  // (ex. le lien « Accueil » de la Landing) avec un défilement fluide.
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
      meta: { public: true },
    },
    {
      path: '/dashboard',
      component: () => import('../layouts/AppLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
        { path: 'events', name: 'events', component: () => import('../views/EventsView.vue') },
        { path: 'events/new', name: 'events-new', component: () => import('../views/forms/WeddingForm.vue') },
        {
          path: 'events/:id',
          name: 'event-detail',
          component: () => import('../views/EventDetailView.vue'),
          children: [
            { path: '', name: 'event-overview', component: () => import('../views/event/OverviewTab.vue') },
            { path: 'guests', name: 'event-guests', component: () => import('../views/event/GuestsTab.vue') },
            { path: 'guests/new', name: 'event-guests-new', component: () => import('../views/forms/GuestsForm.vue') },
            { path: 'categories', name: 'event-categories', component: () => import('../views/event/CategoriesTab.vue') },
            { path: 'categories/new', name: 'event-categories-new', component: () => import('../views/forms/CategoriesForm.vue') },
            { path: 'invitations', name: 'event-invitations', component: () => import('../views/event/InvitationsTab.vue') },
            { path: 'invitations/new', name: 'event-invitations-new', component: () => import('../views/forms/InvitationsForm.vue') },
            { path: 'rsvp', name: 'event-rsvp', component: () => import('../views/event/RsvpTab.vue') },
            { path: 'checkin', name: 'event-checkin', component: () => import('../views/event/CheckinTab.vue') },
            { path: 'tables', name: 'event-tables', component: () => import('../views/event/TablesTab.vue') },
            { path: 'tables/new', name: 'event-tables-new', component: () => import('../views/forms/TablesForm.vue') },
            { path: 'drinks', name: 'event-drinks', component: () => import('../views/event/DrinksTab.vue') },
            { path: 'internal-events', name: 'event-internal-events', component: () => import('../views/event/WeddingEventsTab.vue') },
            { path: 'internal-events/new', name: 'event-internal-events-new', component: () => import('../views/forms/EventForm.vue') },
            { path: 'statistics', name: 'event-statistics', component: () => import('../views/event/StatisticsTab.vue') },
          ],
        },
        { path: 'profile', name: 'profile', component: () => import('../views/ProfileView.vue') },
        { path: 'members', name: 'members', component: () => import('../views/MembersView.vue') },
        { path: 'members/new', name: 'members-new', component: () => import('../views/forms/MembersForm.vue') },
      ],
    },
    { path: '/invitations/:token', name: 'public-invitation', component: () => import('../views/PublicInvitationView.vue'), meta: { public: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  // Restaure la session depuis localStorage AVANT de décider : sans cela,
  // un rafraîchissement de page voyait user = null et déconnectait l'utilisateur.
  if (!auth.restored) {
    await auth.restore()
  }
  if (to.meta.public) {
    return true
  }
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
