import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
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
        {
          path: 'events/:id',
          name: 'event-detail',
          component: () => import('../views/EventDetailView.vue'),
          children: [
            { path: '', name: 'event-overview', component: () => import('../views/event/OverviewTab.vue') },
            { path: 'guests', name: 'event-guests', component: () => import('../views/event/GuestsTab.vue') },
            { path: 'categories', name: 'event-categories', component: () => import('../views/event/CategoriesTab.vue') },
            { path: 'invitations', name: 'event-invitations', component: () => import('../views/event/InvitationsTab.vue') },
            { path: 'rsvp', name: 'event-rsvp', component: () => import('../views/event/RsvpTab.vue') },
            { path: 'checkin', name: 'event-checkin', component: () => import('../views/event/CheckinTab.vue') },
            { path: 'tables', name: 'event-tables', component: () => import('../views/event/TablesTab.vue') },
            { path: 'internal-events', name: 'event-internal-events', component: () => import('../views/event/WeddingEventsTab.vue') },
            { path: 'statistics', name: 'event-statistics', component: () => import('../views/event/StatisticsTab.vue') },
          ],
        },
        { path: 'profile', name: 'profile', component: () => import('../views/ProfileView.vue') },
      ],
    },
    { path: '/invitations/:token', name: 'public-invitation', component: () => import('../views/PublicInvitationView.vue'), meta: { public: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    return true
  }
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
