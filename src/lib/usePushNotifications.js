import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [estado, setEstado] = useState('idle') // idle | solicitando | activo | no-soportado | denegado

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setEstado('no-soportado')
      return
    }
    if (Notification.permission === 'denied') {
      setEstado('denegado')
      return
    }
    if (Notification.permission === 'granted') {
      // Verificar si ya hay suscripción activa y sincronizarla con Supabase
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (!sub) return
          const { endpoint, keys } = sub.toJSON()
          supabase.from('push_subscriptions').upsert(
            { endpoint, p256dh: keys.p256dh, auth: keys.auth },
            { onConflict: 'endpoint' }
          )
          setEstado('activo')
        })
    }
  }, [])

  const activar = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    setEstado('solicitando')

    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        setEstado('denegado')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const suscripcion = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const { endpoint, keys } = suscripcion.toJSON()
      await supabase.from('push_subscriptions').upsert({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }, { onConflict: 'endpoint' })

      setEstado('activo')
    } catch (err) {
      console.error('Error activando push:', err)
      setEstado('idle')
    }
  }

  return { estado, activar }
}
