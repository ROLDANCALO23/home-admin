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
  const { toasts, addToast } = useToast()

  useEffect(() => {
    supabase
      .from('tareas')
      .select('*, recordatorios(*)')
      .order('orden', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setTareas(data)
      })

    const canal = supabase
      .channel('recordatorios-changes')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'recordatorios' },
        (payload) => {
          setTareas(prev => prev.map(t => ({
            ...t,
            recordatorios: (t.recordatorios ?? []).filter(r => r.id !== payload.old.id),
          })))
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'recordatorios' },
        (payload) => {
          setTareas(prev => prev.map(t => ({
            ...t,
            recordatorios: (t.recordatorios ?? []).map(r =>
              r.id === payload.new.id ? { ...r, ...payload.new } : r
            ),
          })))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [])

  const agregarTarea = async ({ recordatorios, ...tarea }) => {
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

    let recordatoriosGuardados = []
    if (recordatorios?.length > 0) {
      const { data, error: recErr } = await supabase
        .from('recordatorios')
        .insert(recordatorios.map(r => ({
          tarea_id: id,
          fecha_hora: r.fecha_hora,
          loop: r.loop ?? false,
        })))
        .select()
      if (!recErr && data) recordatoriosGuardados = data
    }

    setTareas([...tareas, { ...nueva, recordatorios: recordatoriosGuardados }])
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

  const editarTarea = async ({ recordatorios, ...tarea }) => {
    const { error } = await supabase
      .from('tareas')
      .update({
        descripcion: tarea.descripcion,
        responsable: tarea.responsable,
        fecha_vencimiento: tarea.fecha_vencimiento,
      })
      .eq('id', tarea.id)
    if (error) {
      addToast('No se pudo actualizar la tarea', 'error')
      return
    }

    await supabase.from('recordatorios').delete().eq('tarea_id', tarea.id)

    let recordatoriosGuardados = []
    if (recordatorios?.length > 0) {
      const { data, error: recErr } = await supabase
        .from('recordatorios')
        .insert(recordatorios.map(r => ({
          tarea_id: tarea.id,
          fecha_hora: r.fecha_hora,
          loop: r.loop ?? false,
        })))
        .select()
      if (!recErr && data) recordatoriosGuardados = data
    }

    setTareas(tareas.map(t =>
      t.id === tarea.id ? { ...tarea, recordatorios: recordatoriosGuardados } : t
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
      <div className="app-header">
        <h1>Lista de Tareas</h1>
        <p>Organiza y prioriza tus pendientes</p>
      </div>
      <div className="layout">
        <div className="card">
          <TareaForm onAgregar={agregarTarea} />
        </div>
        <div className="card card--tareas">
          <div className="tareas-header">
            <div className="gastos-titulo-wrap">
              <span className="gastos-titulo">TAREAS</span>
              {tareas.length > 0 && (
                <span className="gastos-badge">{tareas.length}</span>
              )}
            </div>
          </div>
          <TareaLista
            tareas={tareas}
            onEliminar={eliminarTarea}
            onReordenar={reordenarTareas}
            onEditar={setTareaEditando}
          />
        </div>
      </div>
    </div>
  )
}

export default RegistroTareas
