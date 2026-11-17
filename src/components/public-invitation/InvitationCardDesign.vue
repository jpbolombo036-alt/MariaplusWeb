<template>
  <article class="ic-design" :class="`ic-${template}`" :data-card-template="template" :data-no-photo="!photoUrl">
    <header class="ic-brand"><img src="/logo.png" alt="" /><strong>Eventia<span>Easy</span></strong><small>Des événements, plus simplement</small></header>
    <div v-if="photoUrl" class="ic-photo" :style="{ backgroundImage: `url(${JSON.stringify(photoUrl)})` }"></div>
    <div class="ic-intro">
      <p class="ic-eyebrow">{{ template === 'PRESTIGE' ? 'Réservez cette date' : 'Invitation officielle' }}</p>
      <h1 :class="{ 'ic-title-long': title.length > 50 }">{{ title.length > 90 ? title.slice(0, 87) + "…" : title }}</h1>
      <p class="ic-message">{{ (invitation.message || 'Nous avons le plaisir de vous inviter à partager ce moment précieux avec nous.').slice(0, 125) }}</p>
    </div>
    <div v-if="template === 'PRESTIGE' && calendar" class="ic-calendar" aria-label="Calendrier de l’événement">
      <strong>{{ calendar.label }}</strong>
      <div class="ic-calendar-grid"><span v-for="(day, index) in ['L','M','M','J','V','S','D']" :key="index" class="ic-weekday">{{ day }}</span><span v-for="blank in calendar.offset" :key="`blank-${blank}`"></span><span v-for="day in calendar.days" :key="day" :class="{ 'ic-calendar-day': day === calendar.day }">{{ day }}</span></div>
    </div>
    <section class="ic-details">
      <div v-if="dateValue"><small>Le rendez-vous</small><strong>{{ dateValue }}</strong><span v-if="timeValue">à {{ timeValue }}</span></div>
      <div v-if="venueValue || venueSub"><small>Le lieu</small><strong>{{ venueValue }}</strong><span>{{ venueSub }}</span></div>
      <div v-if="invitation.dressColors?.length"><small>Tenue · couleurs souhaitées</small><span>{{ invitation.dressColors.map(color => color.label).join(' · ') }}</span></div>
    </section>
    <section class="ic-ticket">
      <div class="ic-person"><small>Invitation personnelle</small><h2 :class="{ 'ic-name-long': guestFullName.length > 32, 'ic-name-xl': guestFullName.length > 60 }">{{ guestFullName }}</h2><p v-if="invitation.tableName" class="ic-table">Table · {{ invitation.tableName }}</p><p class="ic-confirmed">Présence confirmée</p><p v-if="invitation.rsvpNumberOfAttendees" class="ic-attendees">{{ invitation.rsvpNumberOfAttendees }} personne(s)</p><p v-if="guestFullName.length <= 60" class="ic-instructions">Merci de présenter cette carte à l’entrée.</p></div>
      <div class="ic-qr"><div data-card-qr class="ic-qr-code"><img v-if="qrDataUri" :src="qrDataUri" alt="QR personnel d’entrée" /><span v-else class="ic-demo-qr">QR de démonstration</span></div><p>{{ preview ? 'Aperçu · invité fictif' : 'À présenter à l’accueil' }}</p></div>
    </section>
    <footer class="ic-footer"><span>EventiaEasy</span><em>Merci d’être là !</em></footer>
    <p class="ic-bottom">Une invitation personnelle. Un moment à partager.</p>
  </article>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { PublicInvitation } from '../../api/publicInvitation'
import { resolveCardTemplate } from '../../models/invitationCard'
import { useInvitationPresentation } from './presentation'
const props = defineProps<{ invitation: PublicInvitation; qrDataUri: string; photoUrl?: string; preview?: boolean }>()
const { title, guestFullName, dateValue, timeValue, venueValue, venueSub } = useInvitationPresentation(toRef(props, 'invitation'))
const template = computed(() => resolveCardTemplate(props.invitation.invitationCardTemplate))
const calendar = computed(() => {
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  const raw = props.invitation.eventDate || ''
  const french = raw.toLowerCase().match(/(\d{1,2})\s+([a-zà-ÿ]+)\s+(\d{4})/)
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const year = iso ? Number(iso[1]) : french ? Number(french[3]) : 0
  const month = iso ? Number(iso[2]) - 1 : french ? months.indexOf(french[2]) : -1
  const day = iso ? Number(iso[3]) : french ? Number(french[1]) : 0
  if (!year || month < 0 || month > 11 || !day) return null
  return { label: `${months[month]} ${year}`, day, offset: (new Date(year, month, 1).getDay() + 6) % 7, days: new Date(year, month + 1, 0).getDate() }
})
</script>

<style scoped>
@font-face { font-family:'Eventia Script'; src:url('/fonts/GreatVibes-Regular.ttf') format('truetype'); font-style:normal; font-weight:400; font-display:swap; }
.ic-design { --ink:#10152e; --accent:#562496; --pale:#eee4ff; position:relative; width:852px; height:1280px; overflow:hidden; color:var(--ink); background:#fcf9f5 url('/images/invitations/ivory-botanical.jpg') center/cover; font-family:'Inter',Arial,sans-serif; text-align:left; color-scheme:light; }
.ic-design * { box-sizing:border-box; }
.ic-brand { position:absolute; top:48px; left:56px; z-index:2; display:grid; grid-template-columns:54px auto; column-gap:13px; align-items:center; }
.ic-brand img { width:54px; height:54px; object-fit:contain; grid-row:span 2; }
.ic-brand strong { font-size:34px; letter-spacing:-1.3px; line-height:1.1; }
.ic-brand strong span { color:var(--accent); }
.ic-brand small { font-size:12px; letter-spacing:.5px; opacity:.65; padding-top:5px; }
.ic-photo { position:absolute; top:0; right:0; width:365px; height:710px; overflow:hidden; border-left:9px solid #d8b36a; border-radius:52% 0 0 14%; background-size:cover; background-position:center; }
.ic-photo img { width:100%; height:100%; object-fit:cover; object-position:center; display:block; }
.ic-intro { position:absolute; top:176px; left:62px; width:410px; z-index:1; }
.ic-eyebrow { text-transform:uppercase; font-size:14px; letter-spacing:3px; margin:0 0 22px; }
.ic-intro h1 { font:400 63px/1.25 'Eventia Script','Playfair Display',Georgia,serif; overflow-wrap:anywhere; margin:0 0 25px; }
.ic-intro h1.ic-title-long { font-size:40px; }
.ic-message { font-size:18px; line-height:1.55; margin:0; display:block; }
.ic-details { position:absolute; top:457px; left:62px; width:370px; display:flex; flex-direction:column; gap:21px; }
.ic-details div { display:flex; flex-direction:column; gap:5px; border-left:3px solid var(--accent); padding-left:17px; }
.ic-details small { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.7px; color:var(--accent); }
.ic-details strong { font-size:17px; line-height:1.5; overflow-wrap:anywhere;  }
.ic-details span { font-size:13px; line-height:1.5; display:block; }
.ic-ticket { position:absolute; top:727px; left:42px; right:42px; height:326px; padding:35px 38px; display:grid; grid-template-columns:minmax(0,1fr) 230px; column-gap:26px; background:#fff; border:1px solid #e9e0e8; border-radius:25px 25px 12px 12px; }
.ic-person { min-width:0; position:relative; height:100%; }
.ic-person>small { font-size:13px; color:#666075; }
.ic-person h2 { margin:6px 0 10px; font-size:28px; font-weight:700; line-height:1.35; overflow-wrap:anywhere;  }
.ic-person h2.ic-name-long { font-size:21px; }
.ic-person h2.ic-name-xl { font-size:17px; }
.ic-table { display:inline-block; background:var(--pale); border-radius:20px; padding:7px 12px; font-size:13px; margin:0 0 5px; }
.ic-confirmed { color:#13713e; font-weight:700; font-size:16px; margin:10px 0 3px; }
.ic-attendees { font-size:13px; margin:0; color:#5e5866; }
.ic-instructions { position:absolute; bottom:0; left:0; margin:0; font-size:12px; max-width:280px; line-height:1.5; }
.ic-qr { border-left:1px solid #e7dfe8; padding-left:25px; align-self:center; text-align:center; }
.ic-qr [data-card-qr] { background:#fff; width:205px; height:205px; padding:9px; display:grid; place-items:center; }
.ic-qr img { width:187px; height:187px; display:block; }
.ic-demo-qr { font-size:15px; color:#817487; }
.ic-qr p { font-size:11px; margin:8px -8px 0; }
.ic-footer { position:absolute; top:1053px; left:42px; right:42px; height:105px; background:#2d194d; color:#fff; border-radius:0 0 25px 25px; display:flex; align-items:center; justify-content:space-between; padding:0 38px; }
.ic-footer>span { font-size:25px; font-weight:800; }
.ic-footer em { font:400 35px 'Eventia Script',Georgia,serif; color:#e9c77e; }
.ic-bottom { position:absolute; bottom:52px; width:100%; margin:0; text-align:center; font-size:12px; letter-spacing:1px; color:#766b7a; }
/* Romance : photographie dans une arche et composition rose ancien. */
.ic-ROMANCE { --accent:#9c4960; --pale:#f7e4ea; background-color:#fff8fa; }
.ic-ROMANCE .ic-brand { top:39px; left:48px; }
.ic-ROMANCE .ic-brand strong { font-size:25px; }
.ic-ROMANCE .ic-brand img { width:42px; height:42px; }
.ic-ROMANCE .ic-photo { top:132px; right:45px; width:430px; height:520px; border:4px solid #d6b1b7; border-radius:48% 48% 43% 8%; }
.ic-ROMANCE .ic-intro { top:177px; left:49px; width:280px; }
.ic-ROMANCE .ic-intro h1 { font-family:'Playfair Display',Georgia,serif; font-size:49px; line-height:1.35; color:#934457;  }
.ic-ROMANCE .ic-intro h1.ic-title-long { font-size:36px; }
.ic-ROMANCE .ic-eyebrow { font-size:10px; letter-spacing:2px; max-width:230px; }
.ic-ROMANCE .ic-message { font-size:14px; max-width:230px; -webkit-line-clamp:4; }
.ic-ROMANCE .ic-details { top:682px; left:57px; right:57px; width:auto; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.ic-ROMANCE .ic-details div:last-child:nth-child(3) { grid-column:span 2; }
.ic-ROMANCE .ic-ticket { top:858px; height:287px; padding:24px 32px; }
.ic-ROMANCE .ic-qr [data-card-qr] { width:190px; height:190px; }
.ic-ROMANCE .ic-qr img { width:172px; height:172px; }
.ic-ROMANCE .ic-footer { top:1145px; height:78px; background:#98495c; }
.ic-ROMANCE .ic-bottom { bottom:20px; font-size:10px; }
/* Prestige : photographie, papier ivoire et calendrier champagne. */
.ic-PRESTIGE { --accent:#80623c; --pale:#f1e7d7; }
.ic-PRESTIGE .ic-photo { top:0; left:0; width:852px; height:410px; border:0; background-position:center 35%; border-radius:0; }
.ic-PRESTIGE .ic-photo img { object-position:center 35%; }
.ic-PRESTIGE .ic-brand { top:26px; left:34px; background:#fffaf0; padding:9px 14px; border-radius:8px; }
.ic-PRESTIGE .ic-brand img { width:32px; height:32px; }
.ic-PRESTIGE .ic-brand strong { font-size:23px; }
.ic-PRESTIGE .ic-brand small { font-size:9px; }
.ic-PRESTIGE .ic-intro { top:410px; left:65px; width:722px; padding-top:25px; text-align:center; }
.ic-PRESTIGE .ic-eyebrow { font-size:12px; letter-spacing:4px; margin-bottom:12px; }
.ic-PRESTIGE .ic-intro h1 { font-family:'Playfair Display',Georgia,serif; font-size:43px; margin-bottom:12px;  }
.ic-PRESTIGE .ic-intro h1.ic-title-long { font-size:32px; }
.ic-PRESTIGE .ic-message { font-size:14px; margin:0 auto; max-width:590px; -webkit-line-clamp:2; }
.ic-calendar { position:absolute; top:645px; left:65px; width:235px; padding:16px 19px; color:#674f33; background:#efe4d1; text-align:center; }
.ic-calendar>strong { font:400 16px 'Playfair Display',Georgia,serif; text-transform:capitalize; }
.ic-calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; margin-top:12px; font-size:10px; line-height:21px; }
.ic-weekday { font-weight:bold; opacity:.6; }
.ic-calendar-day { background:#80623c; color:#fff; border-radius:50%; }
.ic-PRESTIGE .ic-details { top:645px; left:340px; width:445px; gap:10px; }
.ic-PRESTIGE .ic-details div { gap:3px; }
.ic-PRESTIGE .ic-details small { font-size:9px; line-height:1.2; }
.ic-PRESTIGE .ic-details strong { font-size:16px; line-height:1.3; }
.ic-PRESTIGE .ic-details span { font-size:12px; line-height:1.4; }
.ic-PRESTIGE .ic-ticket { top:867px; height:278px; border-color:#e1d5c0; padding-top:20px; padding-bottom:20px; }
.ic-PRESTIGE .ic-qr [data-card-qr] { width:190px; height:190px; }
.ic-PRESTIGE .ic-qr img { width:172px; height:172px; }
.ic-PRESTIGE .ic-footer { top:1145px; height:78px; background:#72583b; }
.ic-PRESTIGE .ic-bottom { bottom:20px; font-size:10px; }
.ic-design[data-no-photo='true'] .ic-intro { width:690px; }
.ic-ROMANCE[data-no-photo='true'] .ic-intro { top:205px; left:85px; text-align:center; }
.ic-ROMANCE[data-no-photo='true'] .ic-message { max-width:none; }
.ic-PRESTIGE[data-no-photo='true'] .ic-intro { top:220px; }
</style>
