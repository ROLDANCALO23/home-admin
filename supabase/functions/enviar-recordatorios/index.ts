import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SALUDOS_LOOP = [
  '¡Hola amiwis!', '¡Epa causa!', '¡Buenas parce!',
  '¡Ey manito!', '¡Quiubo parcero!', '¡Hola bb!', '¡Ey ey!',
]
const SALUDOS_FIJO = [
  'Parce,', 'Causa,', 'Ey hermano/a,', 'Oiga pues,', 'Mire no más,', 'Ey manito,',
]

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date()

  const { data: alarmas, error } = await supabase
    .from('alarmas')
    .select('*, recordatorios(id, descripcion)')
    .lte('fecha_hora', now.toISOString())
    .eq('enviado', false)

  if (error) return new Response('Error DB: ' + error.message, { status: 500 })
  if (!alarmas?.length) return new Response('OK - sin alarmas')

  const accountSid    = Deno.env.get('TWILIO_ACCOUNT_SID')!
  const authToken     = Deno.env.get('TWILIO_AUTH_TOKEN')!
  const from          = 'whatsapp:+16624994231'
  const destinatarios = (Deno.env.get('WHATSAPP_OWNER') ?? '')
    .split(',').map(n => n.trim()).filter(Boolean)

  for (const rec of alarmas) {
    const descripcion = rec.recordatorios?.descripcion ?? 'recordatorio'
    let mensajeWA: string

    if (rec.loop) {
      const s = SALUDOS_LOOP[Math.floor(Math.random() * SALUDOS_LOOP.length)]
      mensajeWA = `${s} tu recordatorio es: *${descripcion}* 🔁`
      const proxima = new Date(new Date(rec.fecha_hora).getTime() + 86400000)
      await supabase.from('alarmas').update({ fecha_hora: proxima.toISOString() }).eq('id', rec.id)

    } else if (rec.loop_semanal) {
      const s = SALUDOS_LOOP[Math.floor(Math.random() * SALUDOS_LOOP.length)]
      mensajeWA = `${s} tu recordatorio semanal: *${descripcion}* 📅`
      const proxima = new Date(new Date(rec.fecha_hora).getTime() + 7 * 86400000)
      await supabase.from('alarmas').update({ fecha_hora: proxima.toISOString() }).eq('id', rec.id)

    } else {
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
      } else {
        mensajeWA = `${s} te recuerdo que tienes un pendiente: *${descripcion}* — y este es el último recordatorio 🔔`
      }
      await supabase.from('alarmas').delete().eq('id', rec.id)
    }

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
  }

  return new Response(`OK - procesados: ${alarmas.length}`)
})
