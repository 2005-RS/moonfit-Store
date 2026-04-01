import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useFeedback } from '../../context/FeedbackContext'
import type { AdminEntityItem } from '../../types/admin'

type EntityCrudSectionProps = {
  itemLabel: string
  helperText: string
  items: AdminEntityItem[]
  loading?: boolean
  externalError?: string
  onCreate: (item: AdminEntityItem) => Promise<void>
  onUpdate: (id: string, item: AdminEntityItem) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

type EntityFormState = {
  name: string
  description: string
  status: string
}

const emptyForm: EntityFormState = {
  name: '',
  description: '',
  status: '',
}

function EntityCrudSection({
  itemLabel,
  helperText,
  items,
  loading = false,
  externalError = '',
  onCreate,
  onUpdate,
  onDelete,
}: EntityCrudSectionProps) {
  const { confirm } = useFeedback()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EntityFormState>(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setSuccess('')
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleEdit = (item: AdminEntityItem) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description,
      status: item.status,
    })
    setError('')
    setSuccess('')
  }

  const handleDelete = async (itemId: string) => {
    const confirmed = await confirm({
      title: `Eliminar ${itemLabel.toLowerCase()}`,
      message: `Vas a eliminar esta ${itemLabel.toLowerCase()}. Esta accion no se puede deshacer.`,
      confirmLabel: `Eliminar ${itemLabel.toLowerCase()}`,
      cancelLabel: 'Cancelar',
      tone: 'danger',
    })

    if (!confirmed) {
      return
    }

    try {
      await onDelete(itemId)
      setSuccess(`${itemLabel} eliminada correctamente.`)
      setError('')

      if (editingId === itemId) {
        resetForm()
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : `No se pudo eliminar la ${itemLabel.toLowerCase()}.`,
      )
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    const normalizedItem: AdminEntityItem = {
      id: editingId ?? crypto.randomUUID(),
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status.trim(),
    }

    try {
      if (editingId) {
        await onUpdate(editingId, normalizedItem)
        setSuccess(`${itemLabel} actualizada correctamente.`)
      } else {
        await onCreate(normalizedItem)
        setSuccess(`${itemLabel} creada correctamente.`)
      }

      setForm(emptyForm)
      setEditingId(null)
      setError('')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : `No se pudo guardar la ${itemLabel.toLowerCase()}.`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="admin-products-layout">
      <section className="table-card">
        <div className="table-header">
          <div>
            <h2>Listado actual</h2>
            <p>{loading ? 'Cargando registros...' : `${items.length} registros en la API.`}</p>
          </div>
          <button
            className="primary-link button-link"
            type="button"
            onClick={resetForm}
          >
            Nueva {itemLabel.toLowerCase()}
          </button>
        </div>

        {externalError ? <p className="warning-note admin-banner">{externalError}</p> : null}
        {success ? <p className="success-note admin-banner">{success}</p> : null}

        <div className="table-list">
          {items.map((item) => (
            <div className="table-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </div>

              <div className="table-meta">
                <span>{item.status}</span>
                <small>{item.id}</small>
                <div className="row-actions">
                  <button
                    className="secondary-link button-link"
                    type="button"
                    onClick={() => handleEdit(item)}
                  >
                    Editar
                  </button>
                  <button
                    className="remove-link"
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="table-card product-form-card">
        <div className="table-header">
          <div>
            <h2>
              {editingId
                ? `Editar ${itemLabel.toLowerCase()}`
                : `Crear ${itemLabel.toLowerCase()}`}
            </h2>
            <p>{helperText}</p>
          </div>
        </div>

        <form className="product-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            Nombre
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Descripcion
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Estado
            <input name="status" value={form.status} onChange={handleChange} required />
          </label>

          {error ? <p className="warning-note">{error}</p> : null}
          {!error && success ? <p className="success-note">{success}</p> : null}

          <div className="form-actions">
            <button className="primary-link button-link" type="submit" disabled={isSubmitting}>
              {editingId ? 'Guardar cambios' : `Crear ${itemLabel.toLowerCase()}`}
            </button>
            <button
              className="secondary-link button-link"
              type="button"
              onClick={resetForm}
            >
              Limpiar
            </button>
          </div>
        </form>
      </aside>
    </section>
  )
}

export default EntityCrudSection
