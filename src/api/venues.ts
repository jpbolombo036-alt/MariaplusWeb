import { http, decodeMap, decodeList } from './http'

/**
 * Module « Salles » (gestion de salle de fête). Activé par organisation par le
 * SUPER_ADMIN ; contrat backend : docs/MODULE_SALLES.md (dépôt Mariageplus).
 */

export type VenueCurrency = 'USD' | 'CDF'
export type BookingStatus = 'DEMANDE' | 'OPTION' | 'CONFIRMEE' | 'REALISEE' | 'ANNULEE'
export type PaymentMethod = 'ESPECES' | 'MPESA' | 'ORANGE_MONEY' | 'AIRTEL_MONEY' | 'VIREMENT'
export type VenueEventType = 'WEDDING' | 'COLLATION' | 'ANNIVERSARY' | 'BAPTISM' | 'GRADUATION' | 'OTHER'

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  DEMANDE: 'Demande',
  OPTION: 'Option',
  CONFIRMEE: 'Confirmée',
  REALISEE: 'Réalisée',
  ANNULEE: 'Annulée',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ESPECES: 'Espèces',
  MPESA: 'M-Pesa',
  ORANGE_MONEY: 'Orange Money',
  AIRTEL_MONEY: 'Airtel Money',
  VIREMENT: 'Virement bancaire',
}

export const EVENT_TYPE_LABELS: Record<VenueEventType, string> = {
  WEDDING: 'Mariage',
  COLLATION: 'Collation',
  ANNIVERSARY: 'Anniversaire',
  BAPTISM: 'Baptême',
  GRADUATION: 'Remise de diplôme',
  OTHER: 'Autre',
}

export interface VenueRate {
  id: number
  venueId: number
  label: string
  price: number
  currency: VenueCurrency
  active: boolean
}

export interface Venue {
  id: number
  name: string
  description?: string | null
  address?: string | null
  commune?: string | null
  city?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  capacitySeated?: number | null
  capacityStanding?: number | null
  amenities?: string | null
  active: boolean
  imageUrl?: string | null
  rates: VenueRate[]
}

export type VenuePayload = Partial<Omit<Venue, 'id' | 'rates' | 'imageUrl'>> & { name: string }

export interface VenueClient {
  id: number
  firstName?: string | null
  lastName: string
  fullName: string
  phone?: string | null
  email?: string | null
  notes?: string | null
  createdAt?: string | null
  bookings?: Booking[] | null
}

export interface VenueClientPayload {
  firstName?: string
  lastName: string
  phone?: string
  email?: string
  notes?: string
}

export interface BookingExtra {
  id: number
  label: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type PaymentKind = 'PAYMENT' | 'REFUND'

export interface BookingPayment {
  id: number
  bookingId: number
  /** PAYMENT = encaissement, REFUND = remboursement (montant positif). */
  kind: PaymentKind
  receiptNumber: string
  amount: number
  currency: VenueCurrency
  exchangeRate?: number | null
  amountInBookingCurrency: number
  method: PaymentMethod
  reference?: string | null
  paidAt: string
  note?: string | null
}

export interface Booking {
  id: number
  reference: string
  venueId: number
  venueName?: string | null
  clientId: number
  clientName?: string | null
  clientPhone?: string | null
  title?: string | null
  eventType?: VenueEventType | null
  startAt: string
  endAt: string
  guestCount?: number | null
  status: BookingStatus
  currency: VenueCurrency
  rateId?: number | null
  basePrice: number
  extrasTotal: number
  discount: number
  totalAmount: number
  /** Total des paiements reçus. */
  paidAmount: number
  /** Total remboursé au client. */
  refundedAmount: number
  /** Réservation annulée : ce que la salle garde (payé − remboursé). */
  retainedAmount?: number | null
  /** Reste à payer (0 si annulée). */
  balance: number
  optionExpiresAt?: string | null
  notes?: string | null
  cancelReason?: string | null
  eventId?: number | null
  createdAt?: string | null
  extras?: BookingExtra[] | null
  payments?: BookingPayment[] | null
}

export interface BookingPayload {
  venueId?: number
  clientId?: number
  client?: VenueClientPayload
  title?: string
  eventType?: VenueEventType
  startAt?: string
  endAt?: string
  guestCount?: number
  currency?: VenueCurrency
  rateId?: number
  basePrice?: number
  discount?: number
  notes?: string
  status?: BookingStatus
  optionDays?: number
}

export interface PaymentPayload {
  amount: number
  currency?: VenueCurrency
  exchangeRate?: number
  method: PaymentMethod
  reference?: string
  paidAt?: string
  note?: string
}

export interface CurrencyAmount {
  currency: VenueCurrency
  amount: number
}

/** Un remboursement de la période (liste du tableau de bord). */
export interface VenueRefundLine {
  paymentId: number
  receiptNumber: string
  bookingId: number
  bookingReference?: string | null
  clientName?: string | null
  venueName?: string | null
  amount: number
  currency: VenueCurrency
  method: PaymentMethod
  reference?: string | null
  paidAt: string
}

/** Encaissements d'une personne (caissier, gérant) pour le contrôle de caisse. */
export interface CashierTotal {
  userId: number
  name: string
  today: CurrencyAmount[]
  collected: CurrencyAmount[]
  cash: CurrencyAmount[]
  mobileMoney: CurrencyAmount[]
  transfer: CurrencyAmount[]
  paymentCount: number
  refundCount: number
}

export interface VenueDashboard {
  from: string
  to: string
  venueId?: number | null
  venueCount: number
  bookingsByStatus: Record<BookingStatus, number>
  /** Encaissé net (paiements − remboursements). */
  collected: CurrencyAmount[]
  refunded: CurrencyAmount[]
  /** Remboursements de la période, les plus récents d'abord. */
  refunds?: VenueRefundLine[]
  /** Encaissements par personne (contrôle de caisse). */
  byCashier?: CashierTotal[]
  bookedValue: CurrencyAmount[]
  outstanding: CurrencyAmount[]
  occupancyRate: number
  occupiedVenueDays: number
  availableVenueDays: number
  unpaid: Booking[]
  upcoming: Booking[]
}

export interface ClientAccess {
  userId: number
  email: string
  eventId: number
  existingAccount: boolean
  temporaryPassword?: string | null
  whatsappNumber?: string | null
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
}

function page<T>(data: unknown): Page<T> {
  const j = decodeMap(data)
  return {
    content: decodeList(j.content) as T[],
    totalElements: Number(j.totalElements ?? 0),
    totalPages: Number(j.totalPages ?? 1),
  }
}

// ---- Module ------------------------------------------------------------------

/** true si le SUPER_ADMIN a activé le module pour l'organisation de l'utilisateur. */
export async function getVenueModuleStatus(): Promise<boolean> {
  const res = await http.get('/api/venues/module-status', { skipNotification: true })
  return Boolean(decodeMap(res.data).enabled)
}

// ---- Salles & tarifs -----------------------------------------------------------

export async function listVenues(): Promise<Venue[]> {
  return decodeList((await http.get('/api/venues')).data) as Venue[]
}

export async function createVenue(payload: VenuePayload): Promise<Venue> {
  return decodeMap((await http.post('/api/venues', payload)).data) as unknown as Venue
}

export async function updateVenue(id: number, payload: VenuePayload): Promise<Venue> {
  return decodeMap((await http.put(`/api/venues/${id}`, payload)).data) as unknown as Venue
}

export async function deleteVenue(id: number): Promise<void> {
  await http.delete(`/api/venues/${id}`)
}

/** Salles supprimées de l'organisation (pour les restaurer). */
export async function listDeletedVenues(): Promise<Venue[]> {
  return decodeList((await http.get('/api/venues/deleted')).data) as Venue[]
}

export async function restoreVenue(id: number): Promise<Venue> {
  return decodeMap((await http.post(`/api/venues/${id}/restore`)).data) as unknown as Venue
}

export async function addVenueRate(venueId: number, payload: Omit<VenueRate, 'id' | 'venueId' | 'active'>): Promise<VenueRate> {
  return decodeMap((await http.post(`/api/venues/${venueId}/rates`, payload)).data) as unknown as VenueRate
}

export async function deleteVenueRate(venueId: number, rateId: number): Promise<void> {
  await http.delete(`/api/venues/${venueId}/rates/${rateId}`)
}

export async function uploadVenueImage(venueId: number, file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  await http.put(`/api/venues/${venueId}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export async function getVenueCalendar(venueId: number, month: string): Promise<Booking[]> {
  return decodeList((await http.get(`/api/venues/${venueId}/calendar`, { params: { month } })).data) as Booking[]
}

export async function getVenueDashboard(params: { from?: string; to?: string; venueId?: number }): Promise<VenueDashboard> {
  return decodeMap((await http.get('/api/venues/dashboard', { params })).data) as unknown as VenueDashboard
}

export async function downloadVenueExport(params: { from?: string; to?: string }): Promise<void> {
  const res = await http.get('/api/venues/export.xlsx', { params, responseType: 'blob' })
  saveBlob(res.data as Blob, `salles-${params.from ?? 'mois'}-${params.to ?? ''}.xlsx`)
}

// ---- Taux de change ----------------------------------------------------------------

export interface ExchangeRate {
  id: number
  /** Francs congolais pour 1 dollar. */
  cdfPerUsd: number
  effectiveAt: string
  setByName?: string | null
  note?: string | null
}

export interface ExchangeRateOverview {
  current: ExchangeRate | null
  history: ExchangeRate[]
}

/** Taux du jour de la salle (fixé à la main par le gérant) et historique. */
export async function getExchangeRate(): Promise<ExchangeRateOverview> {
  const j = decodeMap((await http.get('/api/venues/exchange-rate')).data)
  return { current: (j.current ?? null) as ExchangeRate | null, history: decodeList(j.history) as ExchangeRate[] }
}

export async function setExchangeRate(cdfPerUsd: number, note?: string): Promise<ExchangeRateOverview> {
  const j = decodeMap((await http.post('/api/venues/exchange-rate', { cdfPerUsd, note })).data)
  return { current: (j.current ?? null) as ExchangeRate | null, history: decodeList(j.history) as ExchangeRate[] }
}

// ---- Ma caisse ---------------------------------------------------------------------

export interface CashMethodTotal {
  method: PaymentMethod
  currency: VenueCurrency
  amount: number
  count: number
}

export interface CashLine {
  paymentId: number
  receiptNumber: string
  kind: PaymentKind
  bookingId: number
  bookingReference?: string | null
  clientName?: string | null
  venueName?: string | null
  amount: number
  currency: VenueCurrency
  method: PaymentMethod
  reference?: string | null
  paidAt: string
}

/** Ce que l'utilisateur connecté a lui-même encaissé (pas le chiffre d'affaires global). */
export interface CashierSummary {
  from: string
  to: string
  today: CurrencyAmount[]
  collected: CurrencyAmount[]
  paymentCount: number
  refundCount: number
  byMethod: CashMethodTotal[]
  movements: CashLine[]
  upcoming: Booking[]
}

export async function getMyCash(params: { from?: string; to?: string }): Promise<CashierSummary> {
  return decodeMap((await http.get('/api/venues/my-cash', { params })).data) as unknown as CashierSummary
}

// ---- Clients ---------------------------------------------------------------------

export async function listVenueClients(q = '', pageIndex = 0, size = 25): Promise<Page<VenueClient>> {
  return page<VenueClient>((await http.get('/api/venue-clients', { params: { q: q || undefined, page: pageIndex, size } })).data)
}

export async function getVenueClient(id: number): Promise<VenueClient> {
  return decodeMap((await http.get(`/api/venue-clients/${id}`)).data) as unknown as VenueClient
}

export async function createVenueClient(payload: VenueClientPayload): Promise<VenueClient> {
  return decodeMap((await http.post('/api/venue-clients', payload)).data) as unknown as VenueClient
}

export async function updateVenueClient(id: number, payload: VenueClientPayload): Promise<VenueClient> {
  return decodeMap((await http.put(`/api/venue-clients/${id}`, payload)).data) as unknown as VenueClient
}

// ---- Réservations --------------------------------------------------------------

export async function listBookings(params: {
  venueId?: number
  clientId?: number
  status?: BookingStatus
  from?: string
  to?: string
  page?: number
  size?: number
}): Promise<Page<Booking>> {
  return page<Booking>((await http.get('/api/bookings', { params })).data)
}

export async function getBooking(id: number): Promise<Booking> {
  return decodeMap((await http.get(`/api/bookings/${id}`)).data) as unknown as Booking
}

export async function createBooking(payload: BookingPayload): Promise<Booking> {
  return decodeMap((await http.post('/api/bookings', payload)).data) as unknown as Booking
}

export async function updateBooking(id: number, payload: BookingPayload): Promise<Booking> {
  return decodeMap((await http.put(`/api/bookings/${id}`, payload)).data) as unknown as Booking
}

export async function bookingAction(id: number, action: 'confirm' | 'complete'): Promise<Booking> {
  return decodeMap((await http.post(`/api/bookings/${id}/${action}`)).data) as unknown as Booking
}

/** Annule la réservation ; `refund` enregistre en même temps le remboursement du client. */
export async function cancelBooking(id: number, reason?: string, refund?: PaymentPayload): Promise<Booking> {
  return decodeMap((await http.post(`/api/bookings/${id}/cancel`, { reason, refund })).data) as unknown as Booking
}

/** Remboursement (total ou partiel) d'une réservation annulée. */
export async function recordRefund(id: number, payload: PaymentPayload): Promise<BookingPayment> {
  return decodeMap((await http.post(`/api/bookings/${id}/refunds`, payload)).data) as unknown as BookingPayment
}

export async function addBookingExtra(id: number, payload: { label: string; quantity: number; unitPrice: number }): Promise<Booking> {
  return decodeMap((await http.post(`/api/bookings/${id}/extras`, payload)).data) as unknown as Booking
}

export async function removeBookingExtra(id: number, extraId: number): Promise<Booking> {
  return decodeMap((await http.delete(`/api/bookings/${id}/extras/${extraId}`)).data) as unknown as Booking
}

export async function recordPayment(id: number, payload: PaymentPayload): Promise<BookingPayment> {
  return decodeMap((await http.post(`/api/bookings/${id}/payments`, payload)).data) as unknown as BookingPayment
}

export async function deletePayment(id: number, paymentId: number): Promise<void> {
  await http.delete(`/api/bookings/${id}/payments/${paymentId}`)
}

export async function createEventFromBooking(
  id: number,
  payload: { name?: string; weddingDetails?: { groomFirstName: string; groomLastName: string; brideFirstName: string; brideLastName: string } },
): Promise<Booking> {
  return decodeMap((await http.post(`/api/bookings/${id}/event`, payload)).data) as unknown as Booking
}

export async function grantClientAccess(id: number, payload: { email?: string }): Promise<ClientAccess> {
  return decodeMap((await http.post(`/api/bookings/${id}/client-access`, payload)).data) as unknown as ClientAccess
}

/** Ouvre le devis ou le reçu PDF dans un nouvel onglet (requête authentifiée). */
export async function openBookingPdf(id: number, paymentId?: number): Promise<void> {
  const path = paymentId == null ? `/api/bookings/${id}/quote.pdf` : `/api/bookings/${id}/payments/${paymentId}/receipt.pdf`
  // Ouvrir l'onglet avant l'await : sinon le navigateur le bloque comme popup.
  const tab = window.open('', '_blank')
  try {
    const res = await http.get(path, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data as Blob)
    if (tab) tab.location.href = url
    else saveBlob(res.data as Blob, paymentId == null ? `devis-${id}.pdf` : `recu-${paymentId}.pdf`)
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (e) {
    tab?.close()
    throw e
  }
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// ---- Formatage ---------------------------------------------------------------------

/** « 1 250,00 USD » */
export function formatMoney(amount: number | null | undefined, currency?: VenueCurrency | null): string {
  const n = Number(amount ?? 0)
  const formatted = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(n)
    .replace(/ | /g, ' ')
  return currency ? `${formatted} ${currency}` : formatted
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Valeur d'un <input type="datetime-local"> → ISO local sans fuseau, attendu par l'API. */
export function toApiDateTime(local: string): string {
  return local.length === 16 ? `${local}:00` : local
}

export function toLocalInput(iso?: string | null): string {
  return iso ? iso.slice(0, 16) : ''
}
