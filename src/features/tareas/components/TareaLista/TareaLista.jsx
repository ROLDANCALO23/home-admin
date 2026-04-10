import { useRef, useState } from 'react'
import './TareaLista.css'

function TareaLista({ tareas, onEliminar, onReordenar }) {
  const dragIndex = useRef(null)
  const [draggingOver, setDraggingOver] = useState(null)

  const handleDragStart = (i) => {
    dragIndex.current = i
  }

  const handleDragOver = (e, i) => {
    e.preventDefault()
    setDraggingOver(i)
  }

  const handleDrop = (i) => {
    setDraggingOver(null)
    if (dragIndex.current === null || dragIndex.current === i) return
    onReordenar(dragIndex.current, i)
    dragIndex.current = null
  }

  const handleDragEnd = () => {
    setDraggingOver(null)
    dragIndex.current = null
  }

  const formatFecha = (fecha) =>
    fecha
      ? new Date(fecha + 'T00:00:00').toLocaleDateString('es', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : null

  const hoy = new Date().toISOString().split('T')[0]

  if (tareas.length === 0) {
    return <p className="empty">No hay tareas pendientes</p>
  }

  return (
    <ul className="tarea-lista">
      {tareas.map((tarea, i) => {
        const vencida = tarea.fecha_vencimiento && tarea.fecha_vencimiento < hoy
        return (
          <li
            key={tarea.id}
            className={`tarea-item ${draggingOver === i ? 'drag-over' : ''}`}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
          >
            <span className="drag-handle">⠿</span>
            <div className="tarea-info">
              <span className="tarea-descripcion">{tarea.descripcion}</span>
              {tarea.fecha_vencimiento && (
                <span className={`tarea-vencimiento ${vencida ? 'vencida' : ''}`}>
                  {vencida ? '⚠ ' : ''}
                  {formatFecha(tarea.fecha_vencimiento)}
                </span>
              )}
            </div>
            <button className="btn-eliminar" onClick={() => onEliminar(tarea.id)}>✕</button>
          </li>
        )
      })}
    </ul>
  )
}

export default TareaLista
