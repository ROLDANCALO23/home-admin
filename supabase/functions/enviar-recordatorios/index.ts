import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date()

  const { data: alarmas, error } = await supabase
    .from('alarmas')
    .select('*, tareas(id, descripcion)')
    .lte('fecha_hora', now.toISOString())
    .eq('enviado', false)

  if (error) return new Response('Error DB: ' + error.message, { status: 500 })
  if (!alarmas?.length) return new Response('OK - sin alarmas')

  const accountSid  = Deno.env.get('TWILIO_ACCOUNT_SID')!
  const authToken   = Deno.env.get('TWILIO_AUTH_TOKEN')!
  const from        = `whatsapp:${Deno.env.get('WHATSAPP_FROM')!.trim()}`
  const templateSid = Deno.env.get('TWILIO_TEMPLATE_SID')!
  const destinatarios = (Deno.env.get('WHATSAPP_OWNER') ?? '')
    .split(',').map(n => `whatsapp:${n.trim()}`).filter(Boolean)

  for (const rec of alarmas) {
    const descripcion = rec.tareas?.descripcion ?? 'tarea'
    let textoVariable: string

    if (rec.loop) {
      textoVariable = `${descripcion} 🔁`
      const proxima = new Date(new Date(rec.fecha_hora).getTime() + 86400000)
      await supabase.from('alarmas').update({ fecha_hora: proxima.toISOString() }).eq('id', rec.id)

    } else if (rec.loop_semanal) {
      textoVariable = `${descripcion} 📅`
      const proxima = new Date(new Date(rec.fecha_hora).getTime() + 7 * 86400000)
      await supabase.from('alarmas').update({ fecha_hora: proxima.toISOString() }).eq('id', rec.id)

    } else {
      textoVariable = descripcion
      await supabase.from('alarmas').delete().eq('id', rec.id)
    }

    if (destinatarios.length) {
      await Promise.all(destinatarios.map(async to => {
        const params = new URLSearchParams({
          From: from,
          To: to,
          ContentSid: templateSid,
          ContentVariables: JSON.stringify({ '1': textoVariable }),
        })
        console.log('Enviando a Twilio:', Object.fromEntries(params))
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        })
        const data = await res.json()
        console.log('Respuesta Twilio:', JSON.stringify(data))
      }))
    }
  }

  return new Response(`OK - procesados: ${alarmas.length}`)
})
