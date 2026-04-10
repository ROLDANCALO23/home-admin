import { useState } from 'react'
import CATEGORIAS from '../../constants/categorias'
import './GastoEditDialog.css'

function GastoEditDialog({ gasto, onGuardar, onCancelar }) {
  const hoy = new Date().toISOString().split('T')[0]
  const fechaInicial = gasto.fecha instanceof Date
    ? gasto.fecha.toISOString().split('T')[0]
    : new Date(gasto.fecha).toISOString().split('T')[0]

  const [descripcion, setDescripcion] = useState(gasto.descripcion)
  const [monto, setMonto] = useState(gasto.monto)
  const [categoria, setCategoria] = useState(gasto.categoria)
  const [fecha, setFecha] = useState(fechaInicial)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!descripcion.trim() || !monto || parseFloat(monto) <= 0 || !categoria || !fecha) return
    onGuardar({
      ...gasto,
      descripcion: descripcion.trim(),
      monto: parseFloat(monto),
      categoria,
      fecha: new Date(fecha + 'T12:00:00'),
    })
  }

  return (
    <div className="edit-overlay" onClick={onCancelar}>
      <div className="edit-dialog" onClick={(e) => e.stopPropagation()}>
        <span className="card-title">Editar gasto</span>

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
            <label className="field-label">Monto</label>
            <input
              type="number"
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
            <label className="field-label">Categoría</label>
            <div className="categoria-grid">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.valor}
                  type="button"
                  className={`categoria-btn ${categoria === cat.valor ? 'activa' : ''}`}
                  onClick={() => setCategoria(cat.valor)}
                >
                  <span className="cat-emoji">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
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

export default GastoEditDialog
