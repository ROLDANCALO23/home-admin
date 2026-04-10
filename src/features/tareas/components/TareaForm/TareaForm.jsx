import { useState } from 'react'
import './TareaForm.css'

function TareaForm({ onAgregar }) {
  const [descripcion, setDescripcion] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!descripcion.trim()) return
    onAgregar({
      descripcion: descripcion.trim(),
      fecha_vencimiento: fechaVencimiento || null,
    })
    setDescripcion('')
    setFechaVencimiento('')
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
        <label className="field-label">Fecha de vencimiento</label>
        <input
          type="date"
          value={fechaVencimiento}
          onChange={(e) => setFechaVencimiento(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-agregar">Agregar tarea</button>
    </form>
  )
}

export default TareaForm
