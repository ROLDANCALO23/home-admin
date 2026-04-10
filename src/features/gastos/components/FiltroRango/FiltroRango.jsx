import './FiltroRango.css'

function FiltroRango({ desde, hasta, onChangeDe, onChangeHasta }) {
  return (
    <div className="filtro-rango">
      <div className="filtro-campo">
        <label className="filtro-label">Desde</label>
        <input
          type="date"
          value={desde}
          max={hasta || undefined}
          onChange={(e) => onChangeDe(e.target.value)}
        />
      </div>
      <div className="filtro-campo">
        <label className="filtro-label">Hasta</label>
        <input
          type="date"
          value={hasta}
          min={desde || undefined}
          onChange={(e) => onChangeHasta(e.target.value)}
        />
      </div>
    </div>
  )
}

export default FiltroRango
