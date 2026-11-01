<template>
  <section class="mp-inv-section mp-inv-rsvp">
    <div class="mp-inv-section-heading">
      <span class="mp-inv-section-kicker">Votre réponse</span>
      <h2 class="mp-inv-section-title">
        Confirmez votre présence
      </h2>
    </div>
    <span class="mp-inv-heart mp-inv-heart--violet">♥</span>

    <!-- État succès -->
    <div v-if="success" class="mp-inv-success" :class="success">
      <template v-if="success === 'ACCEPTED'">
        <p class="mp-inv-success-kicker">Invitation de</p>
        <h3 class="mp-inv-success-name">{{ guestFullName }}</h3>
        <div class="mp-inv-success-pillrow">
          <span class="mp-inv-pill">
            <span class="mp-inv-pill-check">✓</span>
            <span class="mp-inv-pill-text">Présence confirmée</span>
          </span>
        </div>
        <p class="mp-inv-success-text">Merci de faire partie de cet événement !</p>

        <!-- Carte visuelle (PNG) + actions -->
        <div v-if="!card.finished" class="mp-inv-cardzone">
          <div class="mp-inv-cardframe">
            <img v-if="card.cardDataUrl" :src="card.cardDataUrl" alt="Votre invitation confirmée" class="mp-inv-cardimg" />
            <div v-else class="mp-inv-cardimg mp-inv-cardimg--loading">
              <span class="mp-spinner"></span>
              <p>{{ card.cardError || 'Génération de votre invitation…' }}</p>
            </div>
          </div>
          <p v-if="card.cardSaved" class="mp-inv-savednote">
            <span class="material-symbols-outlined">cloud_done</span>
            Enregistrée — présentée à l'accueil
          </p>
          <div class="mp-inv-cardactions">
            <button type="button" class="mp-inv-btn mp-inv-btn--primary" :disabled="!card.cardDataUrl" @click="card.downloadCardImage">
              <span class="material-symbols-outlined">download</span>
              Télécharger l'invitation
            </button>
            <button type="button" class="mp-inv-btn mp-inv-btn--ghost" :disabled="!card.cardDataUrl" @click="card.shareCardImage">
              <span class="material-symbols-outlined">share</span>
              Partager
            </button>
            <button type="button" class="mp-inv-btn mp-inv-btn--ghost" @click="card.finished = true">
              Terminer
            </button>
          </div>
        </div>

        <button type="button" class="mp-inv-link" @click="editAnswer">Modifier ma réponse</button>
      </template>

      <template v-else>
        <span class="mp-inv-success-icon">✓</span>
        <h3 class="mp-inv-success-title">Merci pour votre réponse !</h3>
        <p class="mp-inv-success-text">{{ successText }}</p>
        <button type="button" class="mp-inv-link" @click="editAnswer">Modifier ma réponse</button>
      </template>
    </div>

    <!-- Choix ACCEPTED / DECLINED -->
    <div v-else class="mp-inv-choices">
      <button
        type="button"
        class="mp-inv-choice"
        :class="{ 'mp-inv-choice--ok': choice === 'ACCEPTED' }"
        @click="choice = 'ACCEPTED'"
      >
        <span class="mp-inv-choice-icon">✓</span>
        <span class="mp-inv-choice-title">Je serai présent(e)</span>
        <span class="mp-inv-choice-desc">Nous avons hâte de vous accueillir !</span>
      </button>
      <button
        type="button"
        class="mp-inv-choice"
        :class="{ 'mp-inv-choice--no': choice === 'DECLINED' }"
        @click="choice = 'DECLINED'"
      >
        <span class="mp-inv-choice-icon">✕</span>
        <span class="mp-inv-choice-title">Je ne pourrai pas venir</span>
        <span class="mp-inv-choice-desc">Désolé, je ne pourrai pas être des vôtres.</span>
      </button>
    </div>

    <!-- Formulaire ACCEPTED -->
    <form v-if="choice === 'ACCEPTED'" class="mp-inv-form" novalidate @submit.prevent="submitAccepted">
      <label class="mp-inv-label" for="mp-attendees">
        Nombre de personnes présentes <span class="mp-inv-label-muted">(vous inclus)</span>
      </label>
      <div class="mp-inv-stepper">
        <button type="button" class="mp-inv-step-btn" :disabled="attendees <= 1" aria-label="Retirer une personne" @click="attendees--">−</button>
        <span class="mp-inv-step-value">{{ attendees }}</span>
        <button type="button" class="mp-inv-step-btn" :disabled="attendees >= maxAccepted" aria-label="Ajouter une personne" @click="attendees++">+</button>
      </div>
      <p class="mp-inv-hint">Vous pouvez inviter jusqu'à {{ maxAccepted }} personne(s) au total.</p>

      <label class="mp-inv-label">
        Vos boissons <span class="mp-inv-label-muted">(optionnel — 3 max)</span>
      </label>
      <div v-if="drinksLoading" class="mp-inv-hint">Chargement des boissons…</div>
      <p v-else-if="!drinks.length" class="mp-inv-hint">Aucune boisson disponible pour le moment.</p>
      <div v-else class="mp-drinks-grid">
        <button
          v-for="d in drinks"
          :key="d.id"
          type="button"
          class="mp-drink-card"
          :class="{ 'mp-drink-card--selected': drinkChoices.includes(d.name) }"
          @click="toggleDrink(d.name)"
        >
          <span v-if="drinkChoices.includes(d.name)" class="mp-drink-check">✓</span>
          <img v-if="d.imageUrl" :src="absoluteUrl(d.imageUrl)" :alt="d.name" class="mp-drink-img" loading="lazy" />
          <span v-else class="mp-drink-img mp-drink-img--empty">🍹</span>
          <span class="mp-drink-name">{{ d.name }}</span>
        </button>
      </div>
      <p v-if="drinkChoices.length" class="mp-inv-hint">{{ drinkChoices.length }} / 3 sélectionnée(s)</p>

      <label class="mp-inv-label" for="mp-note">
        Message pour les mariés <span class="mp-inv-label-muted">(optionnel)</span>
      </label>
      <textarea id="mp-note" v-model="note" class="mp-inv-input" rows="4" maxlength="250" placeholder="Écrivez un petit mot…"></textarea>
      <span class="mp-inv-count">{{ note.length }} / 250</span>

      <button type="submit" class="mp-inv-btn mp-inv-btn--primary" :disabled="sending || attendees < 1">
        <span v-if="sending" class="mp-spinner mp-spinner--sm"></span>
        <span v-else class="mp-inv-btn-icon">✓</span>
        {{ sending ? 'Envoi en cours…' : 'Confirmer ma présence' }}
      </button>
    </form>

    <!-- Formulaire DECLINED -->
    <form v-else-if="choice === 'DECLINED'" class="mp-inv-form" novalidate @submit.prevent="submitDecline">
      <label class="mp-inv-label" for="mp-decline-note">
        Message pour les mariés <span class="mp-inv-label-muted">(optionnel)</span>
      </label>
      <textarea
        id="mp-decline-note"
        v-model="note"
        class="mp-inv-input"
        rows="4"
        maxlength="250"
        placeholder="Souhaitez-vous leur laisser un petit mot ?"
      ></textarea>
      <span class="mp-inv-count">{{ note.length }} / 250</span>

      <button type="submit" class="mp-inv-btn mp-inv-btn--decline" :disabled="sending">
        <span v-if="sending" class="mp-spinner mp-spinner--sm"></span>
        <span v-else class="mp-inv-btn-icon">✕</span>
        {{ sending ? 'Envoi en cours…' : 'Confirmer mon absence' }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { toRef, watch } from 'vue'
import type { PublicInvitation } from '../../api/publicInvitation'
import type { InvitationCardController } from '../../composables/useInvitationCard'
import { useInvitationRsvp } from '../../composables/useInvitationRsvp'
import { absoluteUrl } from './presentation'

const props = defineProps<{
  invitation: PublicInvitation
  token: string
  card: InvitationCardController
}>()
const emit = defineEmits<{ 'update:invitation': [invitation: PublicInvitation] }>()
const {
  choice, success, attendees, note, drinkChoices, drinks, drinksLoading, sending,
  maxAccepted, guestFullName, successText, editAnswer, toggleDrink, submitAccepted, submitDecline,
} = useInvitationRsvp(props.token, toRef(props, 'invitation'), (invitation) => emit('update:invitation', invitation))
watch(success, (status) => { props.card.accepted = status === 'ACCEPTED' }, { immediate: true })
</script>
