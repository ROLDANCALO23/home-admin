import CATEGORIAS from '../../constants/categorias'
import { formatCOP } from '../../../../lib/formatCOP'
import './GastoLista.css'

function GastoLista({ gastos, onEliminar }) {
  const getCategoria = (valor) => CATEGORIAS.find((c) => c.valor === valor)

  return (
    <>
      {gastos.length === 0 ? (
        <p className="empty">Aún no hay gastos registrados</p>
      ) : (
        gastos.map((gasto) => {
          const cat = getCategoria(gasto.categoria)
          return (
            <div key={gasto.id} className="gasto-item">
              <div className="gasto-info">
                <span className="gasto-descripcion">{gasto.descripcion}</span>
                <div className="gasto-meta">
                  {cat && (
                    <span className="categoria-badge">{cat.emoji} {cat.label}</span>
                  )}
                  <span className="gasto-fecha">
                    {gasto.fecha.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="gasto-derecha">
                <span className="gasto-monto">{formatCOP(gasto.monto)}</span>
                <button className="btn-eliminar" onClick={() => onEliminar(gasto.id)}>✕</button>
              </div>
            </div>
          )
        })
      )}
    </>
  )
}

export default GastoLista
