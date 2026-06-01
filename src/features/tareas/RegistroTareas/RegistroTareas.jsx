import { useState, useEffect } from 'react'
import TareaForm from '../components/TareaForm'
import TareaLista from '../components/TareaLista'
import TareaEditDialog from '../components/TareaEditDialog'
import ToastContainer from '../../gastos/components/ToastContainer'
import { supabase } from '../../../lib/supabase'
import { useToast } from '../../../lib/useToast'
import './RegistroTareas.css'

function RegistroTareas() {
  const [tareas, setTareas] = useState([])
  const [tareaEditando, setTareaEditando] = useState(null)
  const [formAbierto, setFormAbierto] = useState(false)
  const { toasts, addToast } = useToast()

  useEffect(() => {
    supabase
      .from('tareas')
      .select('*, alarmas(*)')
      .order('orden', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setTareas(data)
      })

    const canal = supabase
      .channel('alarmas-changes')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'alarmas' },
        (payload) => {
          setTareas(prev => prev.map(t => ({
            ...t,
            alarmas: (t.alarmas ?? []).filter(r => r.id !== payload.old.id),
          })))
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'alarmas' },
        (payload) => {
          setTareas(prev => prev.map(t => ({
            ...t,
            alarmas: (t.alarmas ?? []).map(r =>
              r.id === payload.new.id ? { ...r, ...payload.new } : r
            ),
          })))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [])

  const agregarTarea = async ({ alarmas, ...tarea }) => {
    const id = Date.now()
    const nueva = {
      ...tarea,
      id,
      fecha_registro: new Date().toISOString(),
      orden: tareas.length,
    }
    const { error } = await supabase.from('tareas').insert(nueva)
    if (error) {
      addToast('No se pudo guardar la tarea', 'error')
      return
    }

    let alarmasGuardadas = []
    if (alarmas?.length > 0) {
      const { data, error: recErr } = await supabase
        .from('alarmas')
        .insert(alarmas.map(r => ({
          tarea_id: id,
          fecha_hora: r.fecha_hora,
          loop: r.loop ?? false,
          loop_semanal: r.loop_semanal ?? false,
        })))
        .select()
      if (!recErr && data) alarmasGuardadas = data
    }

    setTareas([...tareas, { ...nueva, alarmas: alarmasGuardadas }])
    setFormAbierto(false)
    addToast('Tarea agregada', 'success')
  }

  const eliminarTarea = async (id) => {
    const { error } = await supabase.from('tareas').delete().eq('id', id)
    if (error) {
      addToast('No se pudo eliminar la tarea', 'error')
    } else {
      setTareas(tareas.filter((t) => t.id !== id))
      addToast('Tarea eliminada', 'success')
    }
  }

  const editarTarea = async ({ alarmas, ...tarea }) => {
    const { error } = await supabase
      .from('tareas')
      .update({
        descripcion: tarea.descripcion,
        responsable: tarea.responsable,
      })
      .eq('id', tarea.id)
    if (error) {
      addToast('No se pudo actualizar la tarea', 'error')
      return
    }

    await supabase.from('alarmas').delete().eq('tarea_id', tarea.id)

    let alarmasGuardadas = []
    if (alarmas?.length > 0) {
      const { data, error: recErr } = await supabase
        .from('alarmas')
        .insert(alarmas.map(r => ({
          tarea_id: tarea.id,
          fecha_hora: r.fecha_hora,
          loop: r.loop ?? false,
          loop_semanal: r.loop_semanal ?? false,
        })))
        .select()
      if (!recErr && data) alarmasGuardadas = data
    }

    setTareas(tareas.map(t =>
      t.id === tarea.id ? { ...tarea, alarmas: alarmasGuardadas } : t
    ))
    setTareaEditando(null)
    addToast('Tarea actualizada', 'success')
  }

  const reordenarTareas = async (desde, hasta) => {
    const nuevas = [...tareas]
    const [movida] = nuevas.splice(desde, 1)
    nuevas.splice(hasta, 0, movida)
    const conOrden = nuevas.map((t, i) => ({ ...t, orden: i }))
    setTareas(conOrden)

    const updates = conOrden.map((t) =>
      supabase.from('tareas').update({ orden: t.orden }).eq('id', t.id)
    )
    await Promise.all(updates)
  }

  return (
    <div className="registro-tareas">
      <div className="pagina-fondo" />
      <ToastContainer toasts={toasts} />
      {tareaEditando && (
        <TareaEditDialog
          tarea={tareaEditando}
          onGuardar={editarTarea}
          onCancelar={() => setTareaEditando(null)}
        />
      )}
      {formAbierto && (
        <div className="form-overlay" onClick={() => setFormAbierto(false)}>
          <div className="form-dialog" onClick={e => e.stopPropagation()}>
            <button className="form-dialog-cerrar" onClick={() => setFormAbierto(false)}>✕</button>
            <TareaForm onAgregar={agregarTarea} />
          </div>
        </div>
      )}
      <div className="app-header">
        <h1>Tareas</h1>
        <p>Organiza y prioriza tus pendientes</p>
      </div>
      <div className="layout">
        <div className="card card--tareas">
          <TareaLista
            tareas={tareas}
            onEliminar={eliminarTarea}
            onReordenar={reordenarTareas}
            onEditar={setTareaEditando}
          />
          <div className="fab-zone">
            <span className="fab-arrows">›  ›  ›</span>
            <div className="fab-btn-wrap">
              <button className="btn-fab" onClick={() => setFormAbierto(true)}>＋</button>
              <span className="fab-tooltip">Nueva tarea</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistroTareas
