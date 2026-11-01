<template>
  <div class="mp-inv-page">
    <div class="mp-inv-card">

      <!-- État : chargement -->
      <div v-if="loading" class="mp-inv-centered">
        <span class="mp-spinner"></span>
        <p class="mp-inv-centered-text">Chargement de votre invitation…</p>
      </div>

      <!-- État : invitation indisponible / expirée / annulée / erreur -->
      <div v-else-if="unavailable" class="mp-inv-centered mp-inv-unavailable">
        <span class="mp-inv-unavailable-icon material-symbols-outlined">mark_email_unread</span>
        <h1 class="mp-inv-unavailable-title">Invitation indisponible</h1>
        <p class="mp-inv-unavailable-text">{{ unavailableText }}</p>
        <span class="mp-inv-heart mp-inv-heart--violet">♥</span>
      </div>

      <!-- Carte d'invitation -->
      <template v-else-if="inv">
        <InvitationCover :invitation="inv" />

        <!-- ================= CORPS ================= -->
        <div class="mp-inv-body">

          <InvitationEventDetails :invitation="inv" />

          <PublicGallerySection :token="token" />

          <!-- Votre invitation -->
          <section class="mp-inv-you">
            <h3 class="mp-inv-you-title">
              <span class="material-symbols-outlined">mail</span>
              Votre invitation
            </h3>
            <p class="mp-inv-you-text">
              Bonjour {{ firstNameText }}, nous serions heureux de vous compter parmi nous.
            </p>
            <p class="mp-inv-you-count">
              <span class="material-symbols-outlined">group</span>
              Invitation valable pour <strong>{{ maxAccepted }}</strong> personne(s)
            </p>
          </section>

          <InvitationRsvp v-model:invitation="inv" :token="token" :card="card" />

          <!-- Besoin d'aide ? (uniquement si le backend fournit les coordonnées) -->
          <section v-if="helpPhone || helpEmail" class="mp-inv-help">
            <div class="mp-inv-help-text">
              <h3 class="mp-inv-help-title">Besoin d'aide ?</h3>
              <p class="mp-inv-help-desc">
                Si vous avez des questions concernant cet événement, n'hésitez pas à contacter l'organisateur.
              </p>
            </div>
            <div class="mp-inv-help-actions">
              <a v-if="helpPhone" :href="'tel:' + helpPhone" class="mp-inv-help-action">
                <span class="material-symbols-outlined">call</span>{{ helpPhone }}
              </a>
              <a v-if="helpEmail" :href="'mailto:' + helpEmail" class="mp-inv-help-action">
                <span class="material-symbols-outlined">mail</span>{{ helpEmail }}
              </a>
            </div>
          </section>
        </div>

        <!-- ================= FOOTER ================= -->
        <footer class="mp-inv-footer">
          <p class="mp-inv-footer-brand">
            <span class="mp-inv-footer-heart">♥</span>
            Propulsé par <strong class="mp-inv-footer-strong">EventiaEasy</strong>
          </p>
          <p v-if="deadlineText" class="mp-inv-footer-deadline">
            Merci de répondre avant le {{ deadlineText }}
          </p>
        </footer>
      </template>
    </div>

    <InvitationOfficialCard
      v-if="card.accepted && inv"
      ref="officialCard"
      :invitation="inv"
      :qr-data-uri="card.qrDataUri"
      :card-bg-url="card.cardBgUrl"
    />
  </div>
</template>


<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import PublicGallerySection from '../components/common/PublicGallerySection.vue'
import InvitationCover from '../components/public-invitation/InvitationCover.vue'
import InvitationEventDetails from '../components/public-invitation/InvitationEventDetails.vue'
import InvitationRsvp from '../components/public-invitation/InvitationRsvp.vue'
import InvitationOfficialCard from '../components/public-invitation/InvitationOfficialCard.vue'
import { useInvitationPresentation } from '../components/public-invitation/presentation'
import { usePublicInvitation } from '../composables/usePublicInvitation'
import { useInvitationCard } from '../composables/useInvitationCard'

const token = String(useRoute().params.token ?? '')
const { loading, unavailable, unavailableText, inv } = usePublicInvitation(token)
const { firstNameText, maxAccepted, helpPhone, helpEmail, deadlineText } = useInvitationPresentation(inv)
const officialCard = ref<InstanceType<typeof InvitationOfficialCard> | null>(null)
const card = reactive(useInvitationCard(inv, () => officialCard.value?.renderElement ?? null))
</script>

<style src="../components/public-invitation/public-invitation.css"></style>
