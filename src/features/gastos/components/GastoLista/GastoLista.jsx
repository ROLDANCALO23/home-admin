import { useState } from 'react'
import { formatCOP } from '../../../../lib/formatCOP'
import './GastoLista.css'

const EmptyState = () => (
  <div className="empty-state">
    <svg className="empty-svg" width="200" height="140" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="116" rx="74" ry="11" fill="rgba(91,78,255,0.07)"/>
      <rect x="40" y="28" width="118" height="70" rx="10" fill="rgba(30,15,60,0.4)" stroke="rgba(91,78,255,0.14)" strokeWidth="1" transform="rotate(-2,99,63)"/>
      <rect x="28" y="20" width="118" height="70" rx="10" fill="rgba(20,10,45,0.52)" stroke="rgba(79,227,225,0.18)" strokeWidth="1" transform="rotate(1,87,55)"/>
      <rect x="18" y="32" width="122" height="68" rx="10" fill="rgba(11,5,25,0.88)" stroke="rgba(160,100,255,0.42)" strokeWidth="1"/>
      <polyline points="26,90 42,78 58,83 74,65 90,71 106,56" stroke="#4fe3e1" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.88"/>
      <circle cx="106" cy="56" r="3.5" fill="#4fe3e1" opacity="0.92"/>
      <circle cx="168" cy="60" r="21" fill="rgba(91,78,255,0.05)" stroke="rgba(91,78,255,0.16)" strokeWidth="1"/>
      <text x="168" y="64" textAnchor="middle" fill="rgba(91,78,255,0.5)" fontSize="10" fontFamily="system-ui,sans-serif" fontWeight="700">$</text>
    </svg>
    <p className="empty-msg">Aún no hay gastos registrados</p>
  </div>
)

function GastoLista({ gastos, onEliminar, onEditar, categorias = [] }) {
  const [expandidas, setExpandidas] = useState(new Set())

  const toggle = (valor) => {
    setExpandidas(prev => {
      const next = new Set(prev)
      next.has(valor) ? next.delete(valor) : next.add(valor)
      return next
    })
  }

  if (gastos.length === 0) return <EmptyState />

  const grupos = categorias
    .map(cat => ({ cat, items: gastos.filter(g => g.categoria === cat.valor) }))
    .filter(g => g.items.length > 0)

  const sinCat = gastos.filter(g => !categorias.find(c => c.valor === g.categoria))
  if (sinCat.length > 0) {
    grupos.push({ cat: { valor: '__sin', label: 'Sin categoría', emoji: '📌' }, items: sinCat })
  }

  const totalGeneral = gastos.reduce((sum, g) => sum + g.monto, 0)

  return (
    <div className="gasto-grupos">
      {grupos.map(({ cat, items }) => {
        const total = items.reduce((sum, g) => sum + g.monto, 0)
        const abierto = expandidas.has(cat.valor)
        return (
          <div key={cat.valor} className={`gasto-grupo${abierto ? ' gasto-grupo--abierto' : ''}`}>
            <button className="gasto-grupo-header" onClick={() => toggle(cat.valor)}>
              <span className="gasto-cat-emoji">{cat.emoji}</span>
              <span className="gasto-cat-nombre">{cat.label}</span>
              <span className="gasto-cat-count">{items.length}</span>
              <span className="gasto-cat-total">{formatCOP(total)}</span>
              <span className="gasto-chevron">{abierto ? '▲' : '▼'}</span>
            </button>
            {abierto && (
              <div className="gasto-grupo-items">
                {items.map(gasto => (
                  <div key={gasto.id} className="gasto-item">
                    <span className="gasto-descripcion">{gasto.descripcion}</span>
                    <span className="gasto-fecha">
                      {gasto.fecha.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="gasto-monto">{formatCOP(gasto.monto)}</span>
                    <button className="btn-editar" onClick={() => onEditar(gasto)}>✎</button>
                    <button className="btn-eliminar" onClick={() => onEliminar(gasto.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
      <div className="gasto-total-general">
        <span>Total</span>
        <span>{formatCOP(totalGeneral)}</span>
      </div>
    </div>
  )
}

export default GastoLista
