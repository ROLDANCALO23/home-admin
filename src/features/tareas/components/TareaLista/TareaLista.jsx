import { useRef, useState } from 'react'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import './TareaLista.css'

function TareaLista({ tareas, onEliminar, onReordenar, onEditar }) {
  const dragIndex = useRef(null)
  const [draggingOver, setDraggingOver] = useState(null)
  const [confirmandoId, setConfirmandoId] = useState(null)

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

  const formatFecha = (iso) => {
    if (!iso) return null
    const d = new Date(iso)
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const ultimoRecordatorio = (recordatorios) => {
    if (!recordatorios?.length) return null
    return recordatorios.reduce((max, r) =>
      r.fecha_hora > max.fecha_hora ? r : max
    )
  }

  const hoy = new Date().toISOString().split('T')[0]

  if (tareas.length === 0) {
    return <p className="empty">No hay tareas pendientes</p>
  }

  return (
    <>
    {confirmandoId && (
      <ConfirmDialog
        mensaje="¿Eliminar esta tarea?"
        onConfirmar={() => { onEliminar(confirmandoId); setConfirmandoId(null) }}
        onCancelar={() => setConfirmandoId(null)}
      />
    )}
    <ul className="tarea-lista">
      {tareas.map((tarea, i) => {
        const ultimo = ultimoRecordatorio(tarea.recordatorios)
        const vencida = ultimo && ultimo.fecha_hora.slice(0, 10) < hoy
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
              <div className="tarea-meta">
                {tarea.responsable && (
                  <span className="tarea-responsable">👤 {tarea.responsable}</span>
                )}
                {ultimo && (
                  <span className={`tarea-vencimiento ${vencida ? 'vencida' : ''}`}>
                    {ultimo.loop
                      ? '🔁 Diario'
                      : `${vencida ? '⚠ ' : '🔔 '}${formatFecha(ultimo.fecha_hora)}`
                    }
                  </span>
                )}
              </div>
            </div>
            <button className="btn-editar" onClick={() => onEditar(tarea)}>✎</button>
            <button className="btn-eliminar" onClick={() => setConfirmandoId(tarea.id)}>✕</button>
          </li>
        )
      })}
    </ul>
    </>
  )
}

export default TareaLista
