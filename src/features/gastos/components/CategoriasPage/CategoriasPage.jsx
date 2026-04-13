import { useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import './CategoriasPage.css'

function slugify(label) {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

const COLORES = ['#f97316', '#3b82f6', '#a855f7', '#22c55e', '#eab308', '#ec4899', '#14b8a6', '#ef4444']

const VACIO = { emoji: '', label: '', valor: '', color: COLORES[0] }

function CategoriaForm({ inicial, onGuardar, onCancelar, esNueva }) {
  const [datos, setDatos] = useState(inicial)

  const set = (campo, valor) => {
    setDatos((prev) => {
      const siguiente = { ...prev, [campo]: valor }
      if (campo === 'label' && esNueva) siguiente.valor = slugify(valor)
      return siguiente
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!datos.emoji.trim() || !datos.label.trim() || !datos.valor.trim()) return
    onGuardar(datos)
  }

  return (
    <form className="cat-form" onSubmit={handleSubmit}>
      <div className="cat-form-fila">
        <input
          className="cat-input cat-input--emoji"
          type="text"
          placeholder="🍔"
          value={datos.emoji}
          maxLength={4}
          onChange={(e) => set('emoji', e.target.value)}
        />
        <input
          className="cat-input cat-input--label"
          type="text"
          placeholder="Nombre"
          value={datos.label}
          onChange={(e) => set('label', e.target.value)}
        />
        <input
          className="cat-input cat-input--valor"
          type="text"
          placeholder="slug"
          value={datos.valor}
          onChange={(e) => set('valor', e.target.value)}
          disabled={!esNueva}
        />
      </div>
      <div className="cat-colores">
        {COLORES.map((color) => (
          <button
            key={color}
            type="button"
            className={`cat-color-btn ${datos.color === color ? 'activo' : ''}`}
            style={{ background: color }}
            onClick={() => set('color', color)}
          />
        ))}
      </div>
      <div className="cat-form-acciones">
        <button type="button" className="confirm-btn confirm-btn--cancelar" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="confirm-btn confirm-btn--guardar">
          {esNueva ? 'Agregar' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

function CategoriasPage({ categorias, onCambio }) {
  const [agregando, setAgregando] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)

  const agregarCategoria = async (datos) => {
    const maxOrden = categorias.reduce((m, c) => Math.max(m, c.orden ?? 0), -1)
    const { error } = await supabase.from('categorias').insert({
      emoji: datos.emoji.trim(),
      label: datos.label.trim(),
      valor: datos.valor.trim(),
      color: datos.color,
      orden: maxOrden + 1,
    })
    if (!error) {
      setAgregando(false)
      onCambio()
    }
  }

  const editarCategoria = async (datos) => {
    const { error } = await supabase
      .from('categorias')
      .update({ emoji: datos.emoji.trim(), label: datos.label.trim(), color: datos.color })
      .eq('id', datos.id)
    if (!error) {
      setEditandoId(null)
      onCambio()
    }
  }

  const eliminarCategoria = async (id) => {
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (!error) {
      setConfirmarId(null)
      onCambio()
    }
  }

  return (
    <div className="categorias-page card">
      <div className="categorias-header">
        <span className="card-title">Categorías</span>
        {!agregando && (
          <button className="btn-nueva-cat" onClick={() => setAgregando(true)}>
            + Nueva
          </button>
        )}
      </div>

      {agregando && (
        <CategoriaForm
          inicial={VACIO}
          esNueva
          onGuardar={agregarCategoria}
          onCancelar={() => setAgregando(false)}
        />
      )}

      <div className="cat-lista">
        {categorias.map((cat) => (
          <div key={cat.id} className="cat-item">
            {editandoId === cat.id ? (
              <CategoriaForm
                inicial={cat}
                esNueva={false}
                onGuardar={editarCategoria}
                onCancelar={() => setEditandoId(null)}
              />
            ) : (
              <>
                <span
                  className="cat-item-dot"
                  style={{ background: cat.color }}
                />
                <span className="cat-item-emoji">{cat.emoji}</span>
                <span className="cat-item-label">{cat.label}</span>
                <span className="cat-item-valor">{cat.valor}</span>
                <div className="cat-item-acciones">
                  <button className="btn-editar" onClick={() => setEditandoId(cat.id)}>✎</button>
                  {confirmarId === cat.id ? (
                    <>
                      <button className="btn-confirmar-eliminar" onClick={() => eliminarCategoria(cat.id)}>
                        Eliminar
                      </button>
                      <button className="btn-cancelar-eliminar" onClick={() => setConfirmarId(null)}>
                        ✕
                      </button>
                    </>
                  ) : (
                    <button className="btn-eliminar" onClick={() => setConfirmarId(cat.id)}>✕</button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategoriasPage
