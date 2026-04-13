import { useState } from 'react'
import './TareaForm.css'

// Si la hora ya pasó hoy, programa para mañana
function horaAFechaHora(hora) {
  if (!hora) return ''
  const ahora = new Date()
  const [h, m] = hora.split(':').map(Number)
  const candidato = new Date(ahora)
  candidato.setHours(h, m, 0, 0)
  if (candidato <= ahora) candidato.setDate(candidato.getDate() + 1)
  return candidato.toISOString().slice(0, 16)
}

function fechaDeRecordatorios(recordatorios) {
  const hoy = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const hoyStr = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`
  const fechas = recordatorios
    .map(r => r.loop ? horaAFechaHora(r.hora) : r.fecha_hora)
    .filter(Boolean)
  if (!fechas.length) return hoyStr
  const maxIso = fechas.reduce((max, f) => (f > max ? f : max))
  const d = new Date(maxIso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function TareaForm({ onAgregar }) {
  const [descripcion, setDescripcion] = useState('')
  const [responsable, setResponsable] = useState('')
  const [recordatorios, setRecordatorios] = useState([])

  const agregarRecordatorio = () => {
    setRecordatorios([...recordatorios, { fecha_hora: '', hora: '', loop: false }])
  }

  const actualizarRecordatorio = (i, campo, valor) => {
    const nuevos = [...recordatorios]
    nuevos[i] = { ...nuevos[i], [campo]: valor }
    setRecordatorios(nuevos)
  }

  const eliminarRecordatorio = (i) => {
    setRecordatorios(recordatorios.filter((_, idx) => idx !== i))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!descripcion.trim()) return
    const recs = recordatorios
      .map(r => ({ ...r, fecha_hora: r.loop ? horaAFechaHora(r.hora) : r.fecha_hora }))
      .filter(r => r.fecha_hora)
    onAgregar({
      descripcion: descripcion.trim(),
      responsable: responsable.trim() || null,
      fecha_vencimiento: fechaDeRecordatorios(recs),
      recordatorios: recs,
    })
    setDescripcion('')
    setResponsable('')
    setRecordatorios([])
  }

  return (
    <form className="tarea-form" onSubmit={handleSubmit}>
      <span className="card-title">Nueva tarea</span>

      <div>
        <label className="field-label">Descripción</label>
        <input
          type="text"
          placeholder="¿Qué hay que hacer?"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <div>
        <label className="field-label">Responsable</label>
        <input
          type="text"
          placeholder="¿Quién lo hace?"
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
        />
      </div>

      <div className="recordatorios-section">
        <div className="recordatorios-header">
          <label className="field-label">Recordatorios</label>
          <button type="button" className="btn-add-recordatorio" onClick={agregarRecordatorio}>
            + Agregar
          </button>
        </div>

        {recordatorios.map((r, i) => (
          <div key={i} className="recordatorio-item">
            {r.loop ? (
              <input
                type="time"
                value={r.hora}
                onChange={(e) => actualizarRecordatorio(i, 'hora', e.target.value)}
              />
            ) : (
              <input
                type="datetime-local"
                value={r.fecha_hora}
                onChange={(e) => actualizarRecordatorio(i, 'fecha_hora', e.target.value)}
              />
            )}
            <label className="loop-label">
              <input
                type="checkbox"
                checked={r.loop}
                onChange={(e) => {
                  const checked = e.target.checked
                  const nuevos = [...recordatorios]
                  nuevos[i] = {
                    ...nuevos[i],
                    loop: checked,
                    hora: checked && nuevos[i].fecha_hora
                      ? new Date(nuevos[i].fecha_hora).toTimeString().slice(0, 5)
                      : nuevos[i].hora,
                  }
                  setRecordatorios(nuevos)
                }}
              />
              Diario
            </label>
            <button
              type="button"
              className="btn-eliminar"
              onClick={() => eliminarRecordatorio(i)}
            >✕</button>
          </div>
        ))}
      </div>

      <button type="submit" className="btn-agregar">Agregar tarea</button>
    </form>
  )
}

export default TareaForm
