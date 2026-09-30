import { ref, type Ref } from 'vue'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'

interface UseQrCameraOptions {
  videoEl: Ref<HTMLVideoElement | null>
  onDetected: (value: string) => void
}

export function useQrCamera({ videoEl, onDetected }: UseQrCameraOptions) {
  const open = ref(false)
  const loading = ref(false)
  const error = ref('')
  let controls: IScannerControls | null = null
  let reader: BrowserMultiFormatReader | null = null

  async function openCamera() {
    open.value = true
    error.value = ''
    loading.value = true
    await new Promise((resolve) => setTimeout(resolve, 60))
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Caméra non disponible sur cet appareil/navigateur.')
      const nextReader = new BrowserMultiFormatReader()
      reader = nextReader
      controls = await nextReader.decodeFromVideoDevice(undefined, videoEl.value!, (result) => {
        if (result) onDetected(result.getText())
      })
      loading.value = false
    } catch (cause: any) {
      loading.value = false
      const name = cause?.name ?? ''
      error.value = name === 'NotAllowedError'
        ? 'Accès à la caméra refusé. Autorisez la caméra puis réessayez.'
        : (name === 'NotFoundError' || name === 'OverconstrainedError')
          ? 'Aucune caméra détectée sur cet appareil.'
          : name === 'NotReadableError'
            ? 'La caméra est déjà utilisée par une autre application.'
            : (cause?.message || "Impossible d'accéder à la caméra.")
      stopCamera()
    }
  }

  function stopCamera() {
    try { controls?.stop() } catch { /* Le lecteur peut déjà être arrêté. */ }
    controls = null
    reader = null
    const video = videoEl.value
    if (video?.srcObject) {
      ;(video.srcObject as MediaStream).getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }
  }

  function closeCamera() {
    open.value = false
    stopCamera()
  }

  return { open, loading, error, openCamera, closeCamera, stopCamera }
}
