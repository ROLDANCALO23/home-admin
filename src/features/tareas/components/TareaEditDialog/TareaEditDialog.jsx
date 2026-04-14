import { useState } from 'react'
import './TareaEditDialog.css'

function utcToColombiaLocal(utcStr) {
  if (!utcStr) return ''
  const d = new Date(utcStr)
  return d.toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).replace(' ', 'T').slice(0, 16)
}

function horaAFechaHora(hora) {
  if (!hora) return ''
  const ahora = new Date()
  const [h, m] = hora.split(':').map(Number)
  const candidato = new Date(ahora)
  candidato.setHours(h, m, 0, 0)
  if (candidato <= ahora) candidato.setDate(candidato.getDate() + 1)
  return candidato.toISOString().slice(0, 16)
}


function TareaEditDialog({ tarea, onGuardar, onCancelar }) {
  const [descripcion, setDescripcion] = useState(tarea.descripcion)
  const [responsable, setResponsable] = useState(tarea.responsable ?? '')
  const [recordatorios, setRecordatorios] = useState(
    (tarea.alarmas ?? []).map(r => ({
      ...r,
      fecha_hora: r.loop ? '' : utcToColombiaLocal(r.fecha_hora),
      hora: r.loop && r.fecha_hora ? new Date(r.fecha_hora).toTimeString().slice(0, 5) : '',
      loop: r.loop ?? false,
      loop_semanal: r.loop_semanal ?? false,
      esExistente: true,
    }))
  )

  const agregarRecordatorio = () => {
    setRecordatorios([...recordatorios, { fecha_hora: '', hora: '', loop: false, loop_semanal: false, esExistente: false }])
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
      .map(r => ({
        ...r,
        fecha_hora: r.loop
          ? horaAFechaHora(r.hora)
          : (r.fecha_hora ? new Date(r.fecha_hora + ':00-05:00').toISOString() : ''),
      }))
      .filter(r => r.fecha_hora)
    onGuardar({
      ...tarea,
      descripcion: descripcion.trim(),
      responsable: responsable.trim() || null,
      alarmas: recs,
    })
  }

  return (
    <div className="edit-overlay" onClick={onCancelar}>
      <div className="edit-dialog" onClick={(e) => e.stopPropagation()}>
        <span className="card-title">Editar recordatorio</span>

        <form className="edit-form" onSubmit={handleSubmit}>
          <div>
            <label className="field-label">Descripción</label>
            <input
              type="text"
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
              <label className="field-label">Alarmas</label>
              <button type="button" className="btn-add-recordatorio" onClick={agregarRecordatorio}>
                + Agregar
              </button>
            </div>
            {recordatorios.map((r, i) => (
              <div key={i} className="recordatorio-item">
                <div className="recordatorio-inputs">
                  {r.loop ? (
                    <input
                      type="time"
                      value={r.hora ?? ''}
                      onChange={(e) => actualizarRecordatorio(i, 'hora', e.target.value)}
                    />
                  ) : (
                    <input
                      type="datetime-local"
                      value={r.fecha_hora}
                      onChange={(e) => actualizarRecordatorio(i, 'fecha_hora', e.target.value)}
                    />
                  )}
                </div>
                <div className="recordatorio-controls">
                  <label className="loop-label">
                    <input
                      type="checkbox"
                      checked={r.loop ?? false}
                      onChange={(e) => {
                        const checked = e.target.checked
                        const nuevos = [...recordatorios]
                        nuevos[i] = {
                          ...nuevos[i],
                          loop: checked,
                          loop_semanal: false,
                          hora: checked && nuevos[i].fecha_hora
                            ? new Date(nuevos[i].fecha_hora).toTimeString().slice(0, 5)
                            : nuevos[i].hora,
                        }
                        setRecordatorios(nuevos)
                      }}
                    />
                    Diario
                  </label>
                  <label className="loop-label">
                    <input
                      type="checkbox"
                      checked={r.loop_semanal ?? false}
                      onChange={(e) => {
                        const checked = e.target.checked
                        const nuevos = [...recordatorios]
                        nuevos[i] = { ...nuevos[i], loop_semanal: checked, loop: false }
                        setRecordatorios(nuevos)
                      }}
                    />
                    Semanal
                  </label>
                  <button
                    type="button"
                    className="btn-eliminar"
                    onClick={() => eliminarRecordatorio(i)}
                  >✕</button>
                </div>
              </div>
            ))}
          </div>

          <div className="edit-acciones">
            <button type="button" className="confirm-btn confirm-btn--cancelar" onClick={onCancelar}>
              Cancelar
            </button>
            <button type="submit" className="confirm-btn confirm-btn--guardar">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TareaEditDialog
