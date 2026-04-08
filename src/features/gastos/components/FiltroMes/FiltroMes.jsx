import './FiltroMes.css'

function FiltroMes({ gastos, anioSeleccionado, mesSeleccionado, onChangeAnio, onChangeMes }) {
  const anios = [...new Set(
    gastos.map((g) => new Date(g.fecha).getFullYear())
  )].sort((a, b) => b - a)

  const mesesDisponibles = Array.from({ length: 12 }, (_, i) => i)

  const nombreMes = (num) =>
    new Date(2000, num).toLocaleDateString('es', { month: 'long' })

  if (anios.length === 0) return null

  const handleAnio = (e) => {
    onChangeAnio(e.target.value ? Number(e.target.value) : null)
    onChangeMes(null)
  }

  return (
    <div className="filtro-mes">
      <div className="filtro-campo">
        <label className="filtro-label">Año</label>
        <select
          className="filtro-select"
          value={anioSeleccionado ?? ''}
          onChange={handleAnio}
        >
          <option value="">Todos</option>
          {anios.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="filtro-campo">
        <label className="filtro-label">Mes</label>
        <select
          className="filtro-select"
          value={mesSeleccionado ?? ''}
          onChange={(e) => onChangeMes(e.target.value !== '' ? Number(e.target.value) : null)}
          disabled={false}
        >
          <option value="">Todos</option>
          {mesesDisponibles.map((m) => (
            <option key={m} value={m}>{nombreMes(m)}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default FiltroMes
