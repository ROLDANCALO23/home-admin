import { formatCOP } from '../../../../lib/formatCOP'
import './GastoLista.css'

function GastoLista({ gastos, onEliminar, onEditar, categorias = [] }) {
  const getCategoria = (valor) => categorias.find((c) => c.valor === valor)

  return (
    <>
      {gastos.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-svg" width="200" height="140" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="116" rx="74" ry="11" fill="rgba(91,78,255,0.07)"/>
            <rect x="40" y="28" width="118" height="70" rx="10" fill="rgba(30,15,60,0.4)" stroke="rgba(91,78,255,0.14)" strokeWidth="1" transform="rotate(-2,99,63)"/>
            <rect x="28" y="20" width="118" height="70" rx="10" fill="rgba(20,10,45,0.52)" stroke="rgba(79,227,225,0.18)" strokeWidth="1" transform="rotate(1,87,55)"/>
            <rect x="18" y="32" width="122" height="68" rx="10" fill="rgba(11,5,25,0.88)" stroke="rgba(160,100,255,0.42)" strokeWidth="1"/>
            <line x1="26" y1="68" x2="132" y2="68" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            <line x1="26" y1="79" x2="132" y2="79" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            <line x1="26" y1="90" x2="132" y2="90" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            <polyline points="26,90 42,78 58,83 74,65 90,71 106,56" stroke="#4fe3e1" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.88"/>
            <circle cx="106" cy="56" r="7" fill="#4fe3e1" opacity="0.12"/>
            <circle cx="106" cy="56" r="3.5" fill="#4fe3e1" opacity="0.92"/>
            <circle cx="74" cy="65" r="2.5" fill="#5b4eff" opacity="0.85"/>
            <rect x="114" y="74" width="7" height="16" rx="2" fill="rgba(79,227,225,0.18)" stroke="rgba(79,227,225,0.33)" strokeWidth="0.5"/>
            <rect x="125" y="62" width="7" height="28" rx="2" fill="rgba(91,78,255,0.28)" stroke="rgba(91,78,255,0.42)" strokeWidth="0.5"/>
            <circle cx="168" cy="60" r="21" fill="rgba(91,78,255,0.05)" stroke="rgba(91,78,255,0.16)" strokeWidth="1"/>
            <circle cx="168" cy="60" r="13" fill="rgba(91,78,255,0.04)" stroke="rgba(91,78,255,0.13)" strokeWidth="0.5"/>
            <circle cx="168" cy="60" r="7" fill="rgba(91,78,255,0.07)" stroke="rgba(91,78,255,0.18)" strokeWidth="0.5"/>
            <text x="168" y="64" textAnchor="middle" fill="rgba(91,78,255,0.5)" fontSize="10" fontFamily="system-ui,sans-serif" fontWeight="700">$</text>
            <circle cx="10" cy="26" r="1.5" fill="#4fe3e1" opacity="0.5"/>
            <circle cx="155" cy="14" r="1"   fill="rgba(91,78,255,0.8)"/>
            <circle cx="185" cy="94" r="1.5" fill="#4fe3e1" opacity="0.4"/>
            <circle cx="6"   cy="90" r="1"   fill="rgba(160,100,255,0.6)"/>
            <circle cx="175" cy="28" r="2"   fill="rgba(91,78,255,0.38)"/>
            <circle cx="55"  cy="18" r="1"   fill="rgba(79,227,225,0.45)"/>
          </svg>
          <p className="empty-msg">Aún no hay gastos registrados</p>
        </div>
      ) : (
        gastos.map((gasto) => {
          const cat = getCategoria(gasto.categoria)
          return (
            <div key={gasto.id} className="gasto-item">
              <span className="gasto-cat-emoji">{cat?.emoji}</span>
              <span className="gasto-descripcion">{gasto.descripcion}</span>
              <span className="gasto-fecha">
                {gasto.fecha.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="gasto-monto">{formatCOP(gasto.monto)}</span>
              <button className="btn-editar" onClick={() => onEditar(gasto)}>✎</button>
              <button className="btn-eliminar" onClick={() => onEliminar(gasto.id)}>✕</button>
            </div>
          )
        })
      )}
    </>
  )
}

export default GastoLista
