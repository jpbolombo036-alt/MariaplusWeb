import { computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usePlatformStore } from '../stores/platform'

/**
 * True only when the backend has explicitly answered that this account cannot
 * create events (new organization not yet activated, or creation disabled by
 * the SUPER_ADMIN). Unknown state (loading, network error) is not "locked":
 * the backend remains the authority when the user tries to create.
 *
 * `refresh: true` re-reads the setting on mount, so an activation done by the
 * SUPER_ADMIN shows up on the next visit of the page, without a reload.
 */
export function useEventCreationLock(options: { refresh?: boolean } = {}) {
  const auth = useAuthStore()
  const platform = usePlatformStore()
  if (options.refresh) onMounted(() => { if (!auth.isSuperAdmin) void platform.load(true) })
  const locked = computed(() => !auth.isSuperAdmin && platform.eventCreationEnabled === false)
  return { locked }
}
