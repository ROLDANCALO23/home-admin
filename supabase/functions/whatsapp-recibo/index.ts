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

const SYSTEM_PROMPT = `Eres un asistente especializado en registrar gastos del hogar en Colombia.
Recibes fotos de recibos o mensajes de texto y extraes los datos del gasto.

Categorías válidas:
- comida → restaurantes, domicilios, mercado, cafés, snacks
- transporte → Uber, taxi, bus, gasolina, peajes, parqueadero
- entretenimiento → Netflix, cine, conciertos, juegos, salidas
- salud → médico, farmacia, laboratorio, dentista, óptica
- hogar → arriendo, servicios públicos, reparaciones, muebles, limpieza
- perros → veterinario, comida para mascotas, accesorios

Reglas:
- Los montos son siempre en pesos colombianos (COP). Si ves "$" asume COP.
- "15k" o "15mil" = 15000.
- Si no mencionan fecha asume hoy.
- Siempre debes llamar una herramienta, nunca respondas con texto libre.
- Usa registrar_gasto cuando estés seguro de todos los datos incluida la categoría.
- Usa solicitar_categoria cuando tengas duda sobre la categoría.
- Usa reportar_error cuando no puedas extraer los datos.`

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
        { type: 'text', text: 'Extrae los datos del gasto de este recibo.' },
      ]
    } else if (body) {
      claudeContent = [
        { type: 'text', text: `Extrae los datos del gasto de este mensaje: "${body}"` },
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
