import { useState } from 'react'
import CATEGORIAS from '../../constants/categorias'
import './GastoForm.css'

function GastoForm({ onAgregar }) {
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!descripcion.trim() || !monto || parseFloat(monto) <= 0 || !categoria) return
    onAgregar({ descripcion: descripcion.trim(), monto: parseFloat(monto), categoria })
    setDescripcion('')
    setMonto('')
    setCategoria('')
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

      <button type="submit" className="btn-agregar">Agregar gasto</button>
    </form>
  )
}

export default GastoForm
