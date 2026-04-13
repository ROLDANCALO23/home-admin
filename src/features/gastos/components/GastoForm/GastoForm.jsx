import { useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import './GastoForm.css'

// ── Emoji picker ──────────────────────────────────────────
const EMOJIS = [
  '🍔','🍕','🍜','🥗','🍱','🥤','☕','🍺','🛒','🥩',
  '🚗','🚕','🛵','✈️','🚌','⛽','🅿️','🚲','🛺','🚂',
  '🎬','🎮','🎵','🎭','📺','🎲','⚽','🏋️','🎸','🧩',
  '💊','🏥','🦷','👓','💉','🧬','🩺','🧘','🏃','💆',
  '🏠','💡','🪣','🛋️','🪴','🔧','🧹','🛁','🪟','🗑️',
  '🐶','🐱','🐰','🐟','🐦','🐾','🦮','🐕','🐈','🪺',
  '👕','👟','👜','💄','💍','🧴','🪒','🧺','🛍️','👔',
  '📚','🖥️','📱','⌚','🎓','✏️','📎','🖨️','🔋','💾',
  '💰','🏦','📊','💳','🧾','💸','📈','🪙','🏧','💹',
  '🎁','🎂','🥳','🎊','🎉','🌹','💐','🪅','🎈','🧨',
]

const COLORES = ['#f97316','#3b82f6','#a855f7','#22c55e','#eab308','#ec4899','#14b8a6','#ef4444']

function slugify(label) {
  return label.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function EmojiPicker({ value, onSelect }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="emoji-picker-wrap">
      <button type="button" className="emoji-trigger" onClick={() => setOpen(o => !o)}>
        {value || '＋'}
      </button>
      {open && (
        <div className="emoji-dropdown">
          {EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              className={`emoji-opt ${value === e ? 'activo' : ''}`}
              onClick={() => { onSelect(e); setOpen(false) }}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CatMiniForm({ inicial, esNueva, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState(inicial)

  const set = (campo, valor) =>
    setDatos(prev => {
      const sig = { ...prev, [campo]: valor }
      if (campo === 'label' && esNueva) sig.valor = slugify(valor)
      return sig
    })

  const handleGuardar = () => {
    if (!datos.emoji || !datos.label.trim() || !datos.valor.trim()) return
    onGuardar(datos)
  }

  return (
    <div className="cat-mini-form">
      <div className="cat-mini-fila">
        <EmojiPicker value={datos.emoji} onSelect={e => set('emoji', e)} />
        <input
          className="cat-mini-input"
          type="text"
          placeholder="Nombre"
          value={datos.label}
          onChange={e => set('label', e.target.value)}
        />
      </div>
      <div className="cat-mini-acciones">
        <button type="button" className="confirm-btn confirm-btn--cancelar" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="button" className="confirm-btn confirm-btn--guardar" onClick={handleGuardar}>
          {esNueva ? 'Agregar' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ── GastoForm ─────────────────────────────────────────────
function GastoForm({ onAgregar, onCategoriaChange, categorias = [], onCambioCategorias }) {
  const hoy = new Date().toISOString().split('T')[0]
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [fecha, setFecha] = useState(hoy)

  // CRUD categorías
  const [agregandoCat, setAgregandoCat] = useState(false)
  const [editandoCatId, setEditandoCatId] = useState(null)
  const [confirmarEliminarId, setConfirmarEliminarId] = useState(null)

  const seleccionarCategoria = (valor) => {
    setCategoria(valor)
    onCategoriaChange?.(valor)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!descripcion.trim() || !monto || parseFloat(monto) <= 0 || !categoria || !fecha) return
    onAgregar({
      descripcion: descripcion.trim(),
      monto: parseFloat(monto),
      categoria,
      fecha: new Date(fecha + 'T12:00:00'),
    })
    setDescripcion('')
    setMonto('')
    setCategoria('')
    setFecha(hoy)
    onCategoriaChange?.('')
  }

  const agregarCategoria = async (datos) => {
    const maxOrden = categorias.reduce((m, c) => Math.max(m, c.orden ?? 0), -1)
    const colorAuto = COLORES[categorias.length % COLORES.length]
    const { error } = await supabase.from('categorias').insert({
      emoji: datos.emoji,
      label: datos.label.trim(),
      valor: datos.valor.trim(),
      color: colorAuto,
      orden: maxOrden + 1,
    })
    if (!error) { setAgregandoCat(false); onCambioCategorias?.() }
  }

  const editarCategoria = async (datos) => {
    const { error } = await supabase
      .from('categorias')
      .update({ emoji: datos.emoji, label: datos.label.trim(), color: datos.color })
      .eq('id', datos.id)
    if (!error) { setEditandoCatId(null); onCambioCategorias?.() }
  }

  const eliminarCategoria = async (id) => {
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (!error) {
      setConfirmarEliminarId(null)
      if (categoria === categorias.find(c => c.id === id)?.valor) {
        setCategoria('')
        onCategoriaChange?.('')
      }
      onCambioCategorias?.()
    }
  }

  return (
    <form className="gasto-form" onSubmit={handleSubmit}>
      <span className="card-title">Nuevo gasto</span>

      <div>
        <label className="field-label">Descripción</label>
        <input
          type="text"
          placeholder="Ej. Café, Uber, Netflix..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <div>
        <label className="field-label">Monto</label>
        <input
          type="number"
          placeholder="0.00"
          value={monto}
          min="0"
          step="0.01"
          onChange={(e) => setMonto(e.target.value)}
        />
      </div>

      <div>
        <label className="field-label">Fecha</label>
        <input
          type="date"
          value={fecha}
          max={hoy}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      <div>
        <div className="cat-section-header">
          <label className="field-label" style={{ margin: 0 }}>Categoría</label>
          <button
            type="button"
            className="btn-nueva-cat-inline"
            onClick={() => { setAgregandoCat(true); setEditandoCatId(null) }}
          >
            + Nueva
          </button>
        </div>

        {(agregandoCat || editandoCatId) && (
          <div className="cat-popup-overlay" onClick={() => { setAgregandoCat(false); setEditandoCatId(null) }}>
            <div className="cat-popup" onClick={e => e.stopPropagation()}>
              <span className="card-title">{agregandoCat ? 'Nueva categoría' : 'Editar categoría'}</span>
              <CatMiniForm
                inicial={agregandoCat
                  ? { emoji: '', label: '', valor: '', color: COLORES[0] }
                  : categorias.find(c => c.id === editandoCatId)
                }
                esNueva={agregandoCat}
                onGuardar={agregandoCat ? agregarCategoria : editarCategoria}
                onCancelar={() => { setAgregandoCat(false); setEditandoCatId(null) }}
              />
            </div>
          </div>
        )}

        <div className="categoria-grid">
          {categorias.map((cat) => (
            <div key={cat.id} className="cat-btn-wrap">
              {false ? null : (
                <>
                  <button
                    type="button"
                    className={`categoria-btn ${categoria === cat.valor ? 'activa' : ''}`}
                    onClick={() => seleccionarCategoria(cat.valor)}
                  >
                    <span className="cat-emoji">{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                  <div className="cat-btn-acciones">
                    <button
                      type="button"
                      className="cat-accion-btn"
                      onClick={() => { setEditandoCatId(cat.id); setAgregandoCat(false) }}
                      title="Editar"
                    >✎</button>
                    {confirmarEliminarId === cat.id ? (
                      <>
                        <button
                          type="button"
                          className="cat-accion-btn cat-accion-btn--ok"
                          onClick={() => eliminarCategoria(cat.id)}
                          title="Confirmar"
                        >✓</button>
                        <button
                          type="button"
                          className="cat-accion-btn"
                          onClick={() => setConfirmarEliminarId(null)}
                          title="Cancelar"
                        >✕</button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="cat-accion-btn cat-accion-btn--del"
                        onClick={() => setConfirmarEliminarId(cat.id)}
                        title="Eliminar"
                      >✕</button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="btn-agregar">Agregar gasto</button>
    </form>
  )
}

export default GastoForm
