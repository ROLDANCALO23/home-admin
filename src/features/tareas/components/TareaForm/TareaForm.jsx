import { useState } from 'react'
import './TareaForm.css'

function TareaForm({ onAgregar }) {
  const [descripcion, setDescripcion] = useState('')
  const [responsable, setResponsable] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [recordatorios, setRecordatorios] = useState([])

  const agregarRecordatorio = () => {
    setRecordatorios([...recordatorios, { fecha_hora: '', loop: false }])
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
    onAgregar({
      descripcion: descripcion.trim(),
      responsable: responsable.trim() || null,
      fecha_vencimiento: fechaVencimiento || null,
      recordatorios: recordatorios.filter(r => r.fecha_hora),
    })
    setDescripcion('')
    setResponsable('')
    setFechaVencimiento('')
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

      <div>
        <label className="field-label">Fecha de vencimiento</label>
        <input
          type="date"
          value={fechaVencimiento}
          onChange={(e) => setFechaVencimiento(e.target.value)}
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
            <input
              type="datetime-local"
              value={r.fecha_hora}
              onChange={(e) => actualizarRecordatorio(i, 'fecha_hora', e.target.value)}
            />
            <label className="loop-label">
              <input
                type="checkbox"
                checked={r.loop}
                onChange={(e) => actualizarRecordatorio(i, 'loop', e.target.checked)}
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
