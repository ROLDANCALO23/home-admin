import { createClient } from 'jsr:@supabase/supabase-js@2'

const CATEGORIAS = [
  { valor: 'comida',          label: 'Comida',          emoji: '🍔' },
  { valor: 'transporte',      label: 'Transporte',      emoji: '🚗' },
  { valor: 'entretenimiento', label: 'Entretenimiento', emoji: '🎬' },
  { valor: 'salud',           label: 'Salud',           emoji: '💊' },
  { valor: 'hogar',           label: 'Hogar',           emoji: '🏠' },
  { valor: 'perros',          label: 'Perros',          emoji: '🐶' },
]

const OPCIONES_CATEGORIA = CATEGORIAS
  .map((c, i) => `${i + 1}. ${c.emoji} ${c.label}`)
  .join('\n')

const SYSTEM_PROMPT = `Eres un asistente personal que registra gastos y tareas del hogar en Colombia.

## Cuándo registrar una TAREA
Si el mensaje empieza con "tarea:" o menciona algo pendiente por hacer (llamar, comprar, ir a, agendar, recordar, pagar, etc.) → usa registrar_tarea.
Ejemplos: "tarea: llamar al médico", "recordar pagar el arriendo el viernes", "comprar comida para los perros"

## Recordatorios en tareas
Si el mensaje menciona una hora de aviso o alarma, incluye el campo recordatorios.
- "recuérdame mañana a las 3pm" → recordatorio con fecha_hora del día siguiente a las 15:00 hora Colombia
- "avísame todos los días a las 8am" → recordatorio con loop: true
- "pon alarma para el viernes a las 10am" → recordatorio con fecha_hora del próximo viernes a las 10:00
- Las horas en formato YYYY-MM-DDTHH:mm:00 (hora local Colombia, SIN offset ni Z)
- Si el usuario dice "4pm", escribe T16:00:00. Si dice "8am", escribe T08:00:00. Nunca conviertas a UTC.

## Cuándo registrar un GASTO
Si el mensaje tiene un monto o es una foto de recibo → usa registrar_gasto o solicitar_categoria.
Ejemplos: "almuerzo 35000", "25k uber", foto de recibo

## Categorías de gastos válidas:
- comida → restaurantes, domicilios, mercado, cafés, snacks
- transporte → Uber, taxi, bus, gasolina, peajes, parqueadero
- entretenimiento → Netflix, cine, conciertos, juegos, salidas
- salud → médico, farmacia, laboratorio, dentista, óptica
- hogar → arriendo, servicios públicos, reparaciones, muebles, limpieza
- perros → veterinario, comida para mascotas, accesorios

## Reglas generales:
- Montos siempre en COP. Si ves "$" asume pesos colombianos.
- "15k" o "15mil" = 15000.
- Si no mencionan fecha asume hoy.
- Siempre llama una herramienta, nunca respondas con texto libre.
- Usa reportar_error solo si no puedes entender el mensaje.`

const TOOLS = [
  {
    name: 'registrar_gasto',
    description: 'Registra el gasto cuando estás seguro de todos los datos incluyendo la categoría.',
    input_schema: {
      type: 'object',
      properties: {
        descripcion: { type: 'string', description: 'Nombre del comercio o descripción del gasto (máx 60 chars)' },
        monto:       { type: 'number', description: 'Monto en pesos colombianos' },
        categoria:   { type: 'string', enum: CATEGORIAS.map(c => c.valor) },
        fecha:       { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
      },
      required: ['descripcion', 'monto', 'categoria', 'fecha'],
    },
  },
  {
    name: 'solicitar_categoria',
    description: 'Úsala cuando no estás seguro de la categoría. Guarda el gasto como pendiente y le pide al usuario que elija.',
    input_schema: {
      type: 'object',
      properties: {
        descripcion: { type: 'string', description: 'Nombre del comercio o descripción del gasto' },
        monto:       { type: 'number', description: 'Monto en pesos colombianos' },
        fecha:       { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
      },
      required: ['descripcion', 'monto', 'fecha'],
    },
  },
  {
    name: 'registrar_tarea',
    description: 'Registra una tarea o pendiente cuando el mensaje no tiene monto sino algo por hacer.',
    input_schema: {
      type: 'object',
      properties: {
        descripcion:       { type: 'string', description: 'Qué hay que hacer (máx 120 chars)' },
        fecha_vencimiento: { type: 'string', description: 'Fecha límite en formato YYYY-MM-DD. Omitir si no se menciona.' },
        recordatorios: {
          type: 'array',
          description: 'Lista de recordatorios/alarmas para esta tarea. Omitir si no se menciona hora.',
          items: {
            type: 'object',
            properties: {
              fecha_hora: { type: 'string', description: 'Hora local Colombia sin offset: YYYY-MM-DDTHH:mm:00. Ejemplo: 4pm → T16:00:00, 8am → T08:00:00. NUNCA pongas Z ni -05:00.' },
              loop:       { type: 'boolean', description: 'true si el usuario pide que se repita todos los días a esa hora' },
            },
            required: ['fecha_hora', 'loop'],
          },
        },
      },
      required: ['descripcion'],
    },
  },
  {
    name: 'reportar_error',
    description: 'Úsala cuando no puedes extraer los datos del recibo o mensaje.',
    input_schema: {
      type: 'object',
      properties: {
        mensaje: { type: 'string', description: 'Explicación del problema' },
      },
      required: ['mensaje'],
    },
  },
]

// Convierte hora local Colombia (sin offset) a UTC ISO string para guardar en DB
function colombiaLocalToUTC(fechaHora: string): string {
  const local = fechaHora.replace(/(Z|[+-]\d{2}:?\d{2})$/, '') // quita cualquier offset
  const asIfUTC = new Date(local + 'Z')                         // parsea los dígitos como UTC
  return new Date(asIfUTC.getTime() + 5 * 60 * 60 * 1000).toISOString() // suma 5h → UTC real
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const formData = await req.formData()
    const mediaUrl = formData.get('MediaUrl0') as string | null
    const body = (formData.get('Body') as string ?? '').trim()

    // ── Caso 1: el usuario elige categoría respondiendo con un número 1-6 ──
    const eleccion = parseInt(body)
    if (!mediaUrl && eleccion >= 1 && eleccion <= 6) {
      const categoriaElegida = CATEGORIAS[eleccion - 1]

      const { data: pendiente, error: fetchErr } = await supabase
        .from('gastos')
        .select('*')
        .eq('estado', 'pendiente')
        .order('fecha', { ascending: false })
        .limit(1)
        .single()

      if (fetchErr || !pendiente) {
        return twimlResponse('No hay ningún gasto pendiente por confirmar.')
      }

      const { error: updateErr } = await supabase
        .from('gastos')
        .update({ categoria: categoriaElegida.valor, estado: 'confirmado' })
        .eq('id', pendiente.id)

      if (updateErr) {
        return twimlResponse('Error al confirmar el gasto. Intenta de nuevo.')
      }

      return twimlResponse(
        `✅ Gasto confirmado:\n` +
        `${categoriaElegida.emoji} *${pendiente.descripcion}*\n` +
        `💰 $${Number(pendiente.monto).toLocaleString('es-CO')}\n` +
        `📅 ${String(pendiente.fecha).split('T')[0]}`
      )
    }

    // ── Caso 2: imagen o texto → llamar a Claude con tool use ──
    let claudeContent: unknown[]

    const hoy     = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
    const ahoraStr = new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).replace(' ', 'T').slice(0, 16)
    // ej: "2026-04-13T15:30" — hora actual Colombia para que Claude calcule "en 1 hora", "mañana a las 8am", etc.

    if (mediaUrl) {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
      const authToken  = Deno.env.get('TWILIO_AUTH_TOKEN')!
      const credentials = btoa(`${accountSid}:${authToken}`)

      const imgResponse = await fetch(mediaUrl, {
        headers: { Authorization: `Basic ${credentials}` },
      })

      if (!imgResponse.ok) {
        return twimlResponse('No pude descargar la imagen. Intenta de nuevo.')
      }

      const imgBuffer  = await imgResponse.arrayBuffer()
      const imgBase64  = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)))
      const mediaType  = imgResponse.headers.get('content-type') || 'image/jpeg'

      claudeContent = [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: imgBase64 },
        },
        { type: 'text', text: `Extrae los datos del gasto de este recibo. Fecha y hora actual en Colombia: ${ahoraStr}.` },
      ]
    } else if (body) {
      claudeContent = [
        { type: 'text', text: `Extrae los datos de este mensaje: "${body}". Fecha y hora actual en Colombia: ${ahoraStr}.` },
      ]
    } else {
      return twimlResponse(
        'Envíame una foto de un recibo o un mensaje como:\n"Almuerzo en El Corral 35000 comida"'
      )
    }

    // Llamar a Claude con tool use
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':          Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json',
      },
      body: JSON.stringify({
        model:       'claude-sonnet-4-6',
        max_tokens:  1024,
        system:      SYSTEM_PROMPT,
        tools:       TOOLS,
        tool_choice: { type: 'any' }, // fuerza siempre el uso de una herramienta
        messages:    [{ role: 'user', content: claudeContent }],
      }),
    })

    const claudeData = await claudeResponse.json()

    // Leer qué herramienta eligió Claude
    const toolBlock = claudeData.content?.find((b: { type: string }) => b.type === 'tool_use')

    if (!toolBlock) {
      return twimlResponse('No pude procesar la solicitud. Intenta de nuevo.')
    }

    const { name, input } = toolBlock

    // ── registrar_tarea ──
    if (name === 'registrar_tarea') {
      const { data: ultimasTareas } = await supabase
        .from('tareas')
        .select('orden')
        .order('orden', { ascending: false })
        .limit(1)

      const siguienteOrden = ultimasTareas?.[0]?.orden != null ? ultimasTareas[0].orden + 1 : 0

      const tareaId = Date.now()
      const { error } = await supabase.from('tareas').insert({
        id:                tareaId,
        descripcion:       String(input.descripcion).slice(0, 120),
        fecha_vencimiento: input.fecha_vencimiento ?? null,
        fecha_registro:    new Date().toISOString(),
        orden:             siguienteOrden,
      })

      if (error) return twimlResponse('Error al guardar la tarea. Intenta de nuevo.')

      // Insertar recordatorios si los hay
      if (Array.isArray(input.recordatorios) && input.recordatorios.length > 0) {
        await supabase.from('recordatorios').insert(
          input.recordatorios.map((r: { fecha_hora: string; loop: boolean }) => ({
            tarea_id:  tareaId,
            fecha_hora: colombiaLocalToUTC(r.fecha_hora),
            loop:       r.loop ?? false,
            enviado:    false,
          }))
        )
      }

      const fechaMsg = input.fecha_vencimiento ? `\n📅 Vence: ${input.fecha_vencimiento}` : ''
      const recMsg   = input.recordatorios?.length
        ? `\n🔔 ${input.recordatorios.length} recordatorio(s) programado(s)`
        : ''
      return twimlResponse(`📋 Tarea registrada:\n*${input.descripcion}*${fechaMsg}${recMsg}`)
    }

    // ── registrar_gasto: Claude está seguro de todo ──
    if (name === 'registrar_gasto') {
      const cat = CATEGORIAS.find(c => c.valor === input.categoria)!

      const { error } = await supabase.from('gastos').insert({
        id:          Date.now(),
        descripcion: String(input.descripcion).slice(0, 60),
        monto:       Number(input.monto),
        categoria:   input.categoria,
        fecha:       `${input.fecha}T12:00:00Z`,
        estado:      'confirmado',
      })

      if (error) return twimlResponse('Error al guardar el gasto. Intenta de nuevo.')

      return twimlResponse(
        `✅ Gasto registrado:\n` +
        `${cat.emoji} *${input.descripcion}*\n` +
        `💰 $${Number(input.monto).toLocaleString('es-CO')}\n` +
        `📅 ${input.fecha}`
      )
    }

    // ── solicitar_categoria: Claude tiene duda, guarda pendiente y pregunta ──
    if (name === 'solicitar_categoria') {
      const { error } = await supabase.from('gastos').insert({
        id:          Date.now(),
        descripcion: String(input.descripcion).slice(0, 60),
        monto:       Number(input.monto),
        categoria:   'comida', // temporal, se actualiza cuando el usuario elige
        fecha:       `${input.fecha}T12:00:00Z`,
        estado:      'pendiente',
      })

      if (error) return twimlResponse('Error al guardar. Intenta de nuevo.')

      return twimlResponse(
        `Registré *${input.descripcion}* por $${Number(input.monto).toLocaleString('es-CO')} ` +
        `pero no estoy seguro de la categoría.\n\n¿Cuál es?\n\n${OPCIONES_CATEGORIA}`
      )
    }

    // ── reportar_error: Claude no pudo leer el recibo ──
    if (name === 'reportar_error') {
      return twimlResponse(
        `No pude registrar el gasto: ${input.mensaje}\n\n` +
        `Puedes escribirme algo como:\n"Almuerzo 35000 comida"`
      )
    }

    return twimlResponse('Respuesta inesperada. Intenta de nuevo.')

  } catch (err) {
    console.error('Error:', err)
    return twimlResponse('Ocurrió un error inesperado. Intenta de nuevo.')
  }
})

function twimlResponse(message: string): Response {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
  return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } })
}
