import './ConfirmDialog.css'

function ConfirmDialog({ mensaje, onConfirmar, onCancelar }) {
  return (
    <div className="confirm-overlay" onClick={onCancelar}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-mensaje">{mensaje}</p>
        <div className="confirm-acciones">
          <button className="confirm-btn confirm-btn--cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="confirm-btn confirm-btn--confirmar" onClick={onConfirmar}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
