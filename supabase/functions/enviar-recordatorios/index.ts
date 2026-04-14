import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SALUDOS_LOOP = [
  '¡Hola amiwis!', '¡Epa causa!', '¡Buenas parce!',
  '¡Ey manito!', '¡Quiubo parcero!', '¡Hola bb!', '¡Ey ey!',
]
const SALUDOS_FIJO = [
  'Parce,', 'Causa,', 'Ey hermano/a,', 'Oiga pues,', 'Mire no más,', 'Ey manito,',
]

// ── Web Crypto helpers ───────────────────────────────────────────────────
function b64(str: string): Uint8Array {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  const p = '='.repeat((4 - s.length % 4) % 4)
  return Uint8Array.from(atob(s + p), c => c.charCodeAt(0))
}
function toB64(buf: Uint8Array): string {
  let s = ''
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
async function hkdf(ikm: ArrayBuffer, salt: ArrayBuffer, info: ArrayBuffer, len: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, len * 8)
}

// ── VAPID JWT (ES256) ────────────────────────────────────────────────────
async function vapidJWT(endpoint: string, subject: string, pubB64: string, privB64: string): Promise<string> {
  const pub = b64(pubB64)
  const priv = b64(privB64)
  const signingKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x: toB64(pub.slice(1, 33)), y: toB64(pub.slice(33, 65)), d: toB64(priv), key_ops: ['sign'] },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )
  const url = new URL(endpoint)
  const now = Math.floor(Date.now() / 1000)
  const enc = (obj: unknown) => toB64(new TextEncoder().encode(JSON.stringify(obj)))
  const hdr = enc({ typ: 'JWT', alg: 'ES256' })
  const pld = enc({ aud: `${url.protocol}//${url.host}`, exp: now + 43200, sub: subject })
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    new TextEncoder().encode(`${hdr}.${pld}`)
  )
  return `${hdr}.${pld}.${toB64(new Uint8Array(sig))}`
}

// ── Payload encryption (aes128gcm — RFC 8291) ────────────────────────────
async function encryptPayload(text: string, p256dhB64: string, authB64: string): Promise<Uint8Array> {
  const receiverPub = b64(p256dhB64)  // 65-byte uncompressed EC point
  const authSecret  = b64(authB64)    // 16-byte auth secret

  const serverKP  = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const serverPub = new Uint8Array(await crypto.subtle.exportKey('raw', serverKP.publicKey))

  const receiverKey = await crypto.subtle.importKey('raw', receiverPub, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const ecdhSecret  = await crypto.subtle.deriveBits({ name: 'ECDH', public: receiverKey }, serverKP.privateKey, 256)

  const salt = crypto.getRandomValues(new Uint8Array(16))

  // PRK (RFC 8291 §3.3)
  const infoKey = new Uint8Array([
    ...new TextEncoder().encode('WebPush: info\0'),
    ...receiverPub,
    ...serverPub,
  ])
  const prk = await hkdf(ecdhSecret, authSecret.buffer as ArrayBuffer, infoKey.buffer as ArrayBuffer, 32)

  // CEK and nonce
  const cekBuf   = await hkdf(prk, salt.buffer as ArrayBuffer, new TextEncoder().encode('Content-Encoding: aes128gcm\0').buffer as ArrayBuffer, 16)
  const nonceBuf = await hkdf(prk, salt.buffer as ArrayBuffer, new TextEncoder().encode('Content-Encoding: nonce\0').buffer as ArrayBuffer,     12)

  const aesKey    = await crypto.subtle.importKey('raw', cekBuf, 'AES-GCM', false, ['encrypt'])
  // Plaintext = message bytes + 0x02 delimiter (last-record marker)
  const plaintext = new Uint8Array([...new TextEncoder().encode(text), 2])
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceBuf }, aesKey, plaintext))

  // Header: salt(16) + rs(4 BE) + idlen(1) + serverPub(65)
  const rs     = 4096
  const header = new Uint8Array(16 + 4 + 1 + serverPub.length)
  const dv     = new DataView(header.buffer)
  header.set(salt, 0)
  dv.setUint32(16, rs, false)
  header[20] = serverPub.length
  header.set(serverPub, 21)

  const body = new Uint8Array(header.length + ciphertext.length)
  body.set(header)
  body.set(ciphertext, header.length)
  return body
}

// ── Send one push notification ────────────────────────────────────────────
async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  subject: string,
  pubKey: string,
  privKey: string
): Promise<{ status: number; body: string }> {
  const jwt  = await vapidJWT(sub.endpoint, subject, pubKey, privKey)
  const body = await encryptPayload(payload, sub.p256dh, sub.auth)
  const resp = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'TTL': '86400',
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'Authorization': `vapid t=${jwt},k=${pubKey}`,
    },
    body,
  })
  const respBody = await resp.text()
  return { status: resp.status, body: respBody }
}

// ── Main ─────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const vapidPub  = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPriv = Deno.env.get('VAPID_PRIVATE_KEY')!
  const vapidSub  = Deno.env.get('VAPID_EMAIL') ?? 'mailto:admin@homeadmin.app'

  // ── Modo test: envia push de prueba y devuelve resultado detallado ──
  const url = new URL(req.url)
  if (url.searchParams.get('test') === '1') {
    const { data: subs, error: subsErr } = await supabase.from('push_subscriptions').select('*')
    if (subsErr) return new Response(JSON.stringify({ error: 'DB error', detail: subsErr.message }), { headers: { 'Content-Type': 'application/json' } })
    if (!subs?.length) return new Response(JSON.stringify({ error: 'No hay suscripciones', count: subs?.length ?? 0, url: Deno.env.get('SUPABASE_URL') }), { headers: { 'Content-Type': 'application/json' } })
    const payload = JSON.stringify({ title: 'Test Home Admin', body: '¡Push de prueba funcionando!' })
    const results = await Promise.all(subs.map(async (sub) => {
      try {
        const { status, body } = await sendPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload, vapidSub, vapidPub, vapidPriv
        )
        return { endpoint: sub.endpoint.slice(0, 80), status, body }
      } catch (e) {
        return { endpoint: sub.endpoint.slice(0, 80), error: String(e) }
      }
    }))
    return new Response(JSON.stringify(results, null, 2), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── Flujo normal ─────────────────────────────────────────────────
  const now = new Date()

  const { data: alarmas, error } = await supabase
    .from('alarmas')
    .select('*, recordatorios(id, descripcion)')
    .lte('fecha_hora', now.toISOString())
    .eq('enviado', false)

  if (error) return new Response('Error DB: ' + error.message, { status: 500 })
  if (!alarmas?.length) return new Response('OK - sin alarmas')

  const { data: suscripciones } = await supabase.from('push_subscriptions').select('*')

  const accountSid    = Deno.env.get('TWILIO_ACCOUNT_SID')!
  const authToken     = Deno.env.get('TWILIO_AUTH_TOKEN')!
  const from          = 'whatsapp:+14155238886'
  const destinatarios = (Deno.env.get('WHATSAPP_OWNER') ?? '')
    .split(',').map(n => n.trim()).filter(Boolean)

  for (const rec of alarmas) {
    const descripcion = rec.recordatorios?.descripcion ?? 'recordatorio'
    let mensajeWA: string
    let pushBody: string

    if (rec.loop) {
      // ── Recordatorio diario ──
      const s = SALUDOS_LOOP[Math.floor(Math.random() * SALUDOS_LOOP.length)]
      mensajeWA = `${s} tu recordatorio es: *${descripcion}* 🔁`
      pushBody  = `${s} tu recordatorio es: ${descripcion}`
      const proxima = new Date(new Date(rec.fecha_hora).getTime() + 86400000)
      await supabase.from('alarmas').update({ fecha_hora: proxima.toISOString() }).eq('id', rec.id)

    } else if (rec.loop_semanal) {
      // ── Recordatorio semanal ──
      const s = SALUDOS_LOOP[Math.floor(Math.random() * SALUDOS_LOOP.length)]
      mensajeWA = `${s} tu recordatorio semanal: *${descripcion}* 📅`
      pushBody  = `${s} recordatorio semanal: ${descripcion}`
      const proxima = new Date(new Date(rec.fecha_hora).getTime() + 7 * 86400000)
      await supabase.from('alarmas').update({ fecha_hora: proxima.toISOString() }).eq('id', rec.id)

    } else {
      // ── Recordatorio único ──
      const { data: proximos } = await supabase
        .from('alarmas').select('fecha_hora')
        .eq('recordatorio_id', rec.recordatorio_id).neq('id', rec.id)
        .gt('fecha_hora', now.toISOString())
        .order('fecha_hora', { ascending: false }).limit(1)

      const s = SALUDOS_FIJO[Math.floor(Math.random() * SALUDOS_FIJO.length)]
      if (proximos?.length) {
        const diffMs = new Date(proximos[0].fecha_hora).getTime() - now.getTime()
        const h = Math.floor(diffMs / 3600000)
        const m = Math.floor((diffMs % 3600000) / 60000)
        const t = h > 0 ? `${h}h ${m}m` : `${m} minuto${m === 1 ? '' : 's'}`
        mensajeWA = `${s} te recuerdo que tienes un pendiente: *${descripcion}* — faltan ${t} para el último recordatorio ⏰`
        pushBody  = `${s} pendiente: ${descripcion} — faltan ${t} para el último`
      } else {
        mensajeWA = `${s} te recuerdo que tienes un pendiente: *${descripcion}* — y este es el último recordatorio 🔔`
        pushBody  = `${s} pendiente: ${descripcion} — último recordatorio`
      }
      await supabase.from('alarmas').delete().eq('id', rec.id)
    }

    // WhatsApp
    if (destinatarios.length) {
      await Promise.all(destinatarios.map(to =>
        fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: from, To: to, Body: mensajeWA }).toString(),
        })
      ))
    }

    // Push notifications
    console.log(`Push subs: ${suscripciones?.length ?? 0} | payload: ${pushBody}`)
    if (suscripciones?.length) {
      const payload = JSON.stringify({ title: 'Home Admin', body: pushBody })
      await Promise.allSettled(suscripciones.map(async (sub) => {
        try {
          const { status, body } = await sendPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload, vapidSub, vapidPub, vapidPriv
          )
          console.log(`Push [${status}] ${sub.endpoint.slice(0, 60)} | ${body.slice(0, 200)}`)
          if (status === 410 || status === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
        } catch (e) {
          console.error('Push error:', String(e))
        }
      }))
    }
  }

  return new Response(`OK - procesados: ${alarmas.length}`)
})
