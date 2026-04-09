import CATEGORIAS from '../../constants/categorias'
import { formatCOP } from '../../../../lib/formatCOP'
import './ResumenCategorias.css'

function ResumenCategorias({ gastos }) {
  const totales = gastos.reduce((acc, gasto) => {
    acc[gasto.categoria] = (acc[gasto.categoria] || 0) + Number(gasto.monto)
    return acc
  }, {})

  const categoriasConGasto = CATEGORIAS.filter((cat) => totales[cat.valor])

  return (
    <div className="resumen-categorias">
      {categoriasConGasto.map((cat) => (
        <div key={cat.valor} className="resumen-fila">
          <span className="resumen-emoji">{cat.emoji}</span>
          <span className="resumen-label">{cat.label}</span>
          <span className="resumen-total">{formatCOP(totales[cat.valor])}</span>
        </div>
      ))}
    </div>
  )
}

export default ResumenCategorias
