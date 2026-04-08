import CATEGORIAS from '../../constants/categorias'
import './ResumenCategorias.css'

function ResumenCategorias({ gastos }) {
  const totales = gastos.reduce((acc, gasto) => {
    acc[gasto.categoria] = (acc[gasto.categoria] || 0) + gasto.monto
    return acc
  }, {})

  const totalGeneral = gastos.reduce((acc, g) => acc + g.monto, 0)

  const categoriasConGasto = CATEGORIAS.filter((cat) => totales[cat.valor])

  return (
    <>
      <span className="card-title">Resumen por categoría</span>
      <ul className="resumen-lista">
        {categoriasConGasto.map((cat) => (
          <li key={cat.valor}>
            <span className="categoria-badge">{cat.emoji} {cat.label}</span>
            <span className="tag-total">${totales[cat.valor].toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="total-general">
        <span>Total general</span>
        <span>${totalGeneral.toFixed(2)}</span>
      </div>
    </>
  )
}

export default ResumenCategorias
