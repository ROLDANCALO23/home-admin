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
  const [alarmas, setAlarmas] = useState(
    (tarea.alarmas ?? []).map(r => ({
      ...r,
      fecha_hora: r.loop ? '' : utcToColombiaLocal(r.fecha_hora),
      hora: r.loop && r.fecha_hora ? new Date(r.fecha_hora).toTimeString().slice(0, 5) : '',
      loop: r.loop ?? false,
      loop_semanal: r.loop_semanal ?? false,
      esExistente: true,
    }))
  )

  const agregarAlarma = () => {
    setAlarmas([...alarmas, { fecha_hora: '', hora: '', loop: false, loop_semanal: false, esExistente: false }])
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
        <span className="card-title">Editar tarea</span>

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

          <div className="alarmas-section">
            <div className="alarmas-header">
              <label className="field-label">Alarmas</label>
              <div className="fab-btn-wrap">
                <button type="button" className="btn-fab" onClick={agregarAlarma}>＋</button>
                <span className="fab-tooltip">Agregar alarma</span>
              </div>
            </div>
            {alarmas.map((r, i) => (
              <div key={i} className="alarma-item">
                <div className="alarma-inputs">
                  {r.loop ? (
                    <input
                      type="time"
                      value={r.hora ?? ''}
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
                      checked={r.loop ?? false}
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
                      checked={r.loop_semanal ?? false}
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
