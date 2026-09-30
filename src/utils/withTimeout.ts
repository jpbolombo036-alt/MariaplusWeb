/**
 * Borne une promesse dans le temps : au-delà de `ms`, la valeur de repli est
 * renvoyée (et toute erreur est avalée de la même façon).
 *
 * Utilisé pour les traitements « best effort » côté navigateur (décodage d'un QR,
 * sondage réseau) : ils ne doivent jamais laisser l'interface bloquée sans retour.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch(() => {
        clearTimeout(timer)
        resolve(fallback)
      })
  })
}
