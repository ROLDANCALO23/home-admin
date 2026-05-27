import { useState } from 'react'
import './TareaForm.css'

function horaAFechaHora(hora) {
  if (!hora) return ''
  const ahora = new Date()
  const [h, m] = hora.split(':').map(Number)
  const candidato = new Date(ahora)
  candidato.setHours(h, m, 0, 0)
  if (candidato <= ahora) candidato.setDate(candidato.getDate() + 1)
  return candidato.toISOString().slice(0, 16)
}


function TareaForm({ onAgregar }) {
  const [descripcion, setDescripcion] = useState('')
  const [responsable, setResponsable] = useState('')
  const [alarmas, setAlarmas] = useState([])

  const agregarAlarma = () => {
    setAlarmas([...alarmas, { fecha_hora: '', hora: '', loop: false, loop_semanal: false }])
  }

  const actualizarAlarma = (i, campo, valor) => {
    const nuevos = [...alarmas]
    nuevos[i] = { ...nuevos[i], [campo]: valor }
    setAlarmas(nuevos)
  }

  const eliminarAlarma = (i) => {
    setAlarmas(alarmas.filter((_, idx) => idx !== i))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!descripcion.trim()) return
    const recs = alarmas
      .map(r => ({
        ...r,
        fecha_hora: r.loop ? horaAFechaHora(r.hora) : r.fecha_hora,
      }))
      .filter(r => r.fecha_hora)
    onAgregar({
      descripcion: descripcion.trim(),
      responsable: responsable.trim() || null,
      alarmas: recs,
    })
    setDescripcion('')
    setResponsable('')
    setAlarmas([])
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

      <div className="alarmas-section">
        <div className="alarmas-header">
          <label className="field-label">Alarmas</label>
          <button type="button" className="btn-add-alarma" onClick={agregarAlarma}>
            + Agregar
          </button>
        </div>

        {alarmas.map((r, i) => (
          <div key={i} className="alarma-item">
            <div className="alarma-inputs">
              {r.loop ? (
                <input
                  type="time"
                  value={r.hora}
                  onChange={(e) => actualizarAlarma(i, 'hora', e.target.value)}
                />
              ) : (
                <input
                  type="datetime-local"
                  value={r.fecha_hora}
                  onChange={(e) => actualizarAlarma(i, 'fecha_hora', e.target.value)}
                />
              )}
            </div>
            <div className="alarma-controls">
              <label className="loop-label">
                <input
                  type="checkbox"
                  checked={r.loop}
                  onChange={(e) => {
                    const checked = e.target.checked
                    const nuevos = [...alarmas]
                    nuevos[i] = {
                      ...nuevos[i],
                      loop: checked,
                      loop_semanal: false,
                      hora: checked && nuevos[i].fecha_hora
                        ? new Date(nuevos[i].fecha_hora).toTimeString().slice(0, 5)
                        : nuevos[i].hora,
                    }
                    setAlarmas(nuevos)
                  }}
                />
                Diario
              </label>
              <label className="loop-label">
                <input
                  type="checkbox"
                  checked={r.loop_semanal}
                  onChange={(e) => {
                    const checked = e.target.checked
                    const nuevos = [...alarmas]
                    nuevos[i] = { ...nuevos[i], loop_semanal: checked, loop: false }
                    setAlarmas(nuevos)
                  }}
                />
                Semanal
              </label>
              <button
                type="button"
                className="btn-eliminar"
                onClick={() => eliminarAlarma(i)}
              >✕</button>
            </div>
          </div>
        ))}
      </div>

      <button type="submit" className="btn-agregar">Agregar tarea</button>
    </form>
  )
}

export default TareaForm
