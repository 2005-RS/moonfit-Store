import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import PageIntro from '../../components/shared/PageIntro'
import { useFeedback } from '../../context/FeedbackContext'
import { formatCurrency } from '../../lib/currency'
import {
  createCombo,
  deleteCombo,
  fetchAdminProducts,
  fetchCombos,
  updateCombo,
} from '../../lib/adminApi'
import type { AdminCombo } from '../../types/admin'
import type { Product } from '../../types/catalog'

type ComboFormState = {
  title: string
  subtitle: string
  image: string
  price: string
  previousPrice: string
  ctaLabel: string
  status: 'Activa' | 'Inactiva'
  items: Array<{
    productId: string
    quantity: string
  }>
}

const emptyForm: ComboFormState = {
  title: '',
  subtitle: '',
  image: '',
  price: '',
  previousPrice: '',
  ctaLabel: 'Agregar combo',
  status: 'Activa',
  items: [{ productId: '', quantity: '1' }],
}

function toFormState(combo: AdminCombo): ComboFormState {
  return {
    title: combo.title,
    subtitle: combo.subtitle,
    image: combo.image,
    price: String(combo.price),
    previousPrice: combo.previousPrice ? String(combo.previousPrice) : '',
    ctaLabel: combo.ctaLabel,
    status: combo.status,
    items: combo.items.map((item) => ({
      productId: item.productId,
      quantity: String(item.quantity),
    })),
  }
}

function AdminCombosPage() {
  const { confirm } = useFeedback()
  const [combos, setCombos] = useState<AdminCombo[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<ComboFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadPage = async () => {
    setIsLoading(true)

    try {
      const [comboData, productData] = await Promise.all([
        fetchCombos(),
        fetchAdminProducts({ pageSize: 100 }),
      ])

      setCombos(comboData)
      setProducts(productData.data)
      setPageError('')
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo cargar el modulo de combos.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPage()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setPageError('')
    setSuccessMessage('')
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleItemChange = (
    index: number,
    field: 'productId' | 'quantity',
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const handleAddItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, { productId: '', quantity: '1' }],
    }))
  }

  const handleRemoveItem = (index: number) => {
    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setPageError('')

    const payload: AdminCombo = {
      id: editingId ?? '',
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      image: form.image.trim(),
      price: Number(form.price),
      previousPrice: form.previousPrice ? Number(form.previousPrice) : undefined,
      ctaLabel: form.ctaLabel.trim(),
      status: form.status,
      items: form.items
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
    }

    try {
      if (editingId) {
        await updateCombo(editingId, payload)
        setSuccessMessage('Combo actualizado correctamente.')
      } else {
        await createCombo(payload)
        setSuccessMessage('Combo creado correctamente.')
      }

      await loadPage()
      setForm(emptyForm)
      setEditingId(null)
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo guardar el combo.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (combo: AdminCombo) => {
    setEditingId(combo.id)
    setForm(toFormState(combo))
    setPageError('')
    setSuccessMessage('')
  }

  const handleDelete = async (comboId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar combo',
      message: 'Vas a eliminar este combo. Esta accion no se puede deshacer.',
      confirmLabel: 'Eliminar combo',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    })

    if (!confirmed) {
      return
    }

    try {
      await deleteCombo(comboId)
      await loadPage()
      setSuccessMessage('Combo eliminado correctamente.')

      if (editingId === comboId) {
        resetForm()
      }
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo eliminar el combo.',
      )
    }
  }

  return (
    <main className="admin-page">
      <PageIntro
        eyebrow="Admin Combos"
        title="Gestion de combos deportivos"
        description="Aqui ya puedes crear paquetes reales para elevar ticket promedio y vender productos juntos."
      />

      <section className="admin-products-layout">
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Combos actuales</h2>
              <p>{isLoading ? 'Cargando combos...' : `${combos.length} combos disponibles.`}</p>
            </div>
            <button className="primary-link button-link" type="button" onClick={resetForm}>
              Nuevo combo
            </button>
          </div>

          {pageError ? <p className="warning-note admin-banner">{pageError}</p> : null}
          {successMessage ? <p className="success-note admin-banner">{successMessage}</p> : null}

          <div className="table-list">
            {combos.map((combo) => (
              <div className="table-row product-admin-row" key={combo.id}>
                <div className="product-admin-main">
                  <img src={combo.image} alt={combo.title} className="admin-product-thumb" />
                  <div>
                    <strong>{combo.title}</strong>
                    <p>{combo.subtitle}</p>
                    <small className="muted-line">
                      {combo.items
                        .map(
                          (item) =>
                            `${item.productName ?? item.productId} x${item.quantity}`,
                        )
                        .join(', ')}
                    </small>
                  </div>
                </div>

                <div className="table-meta">
                  <span>{formatCurrency(combo.price)}</span>
                  <small>{combo.status}</small>
                  <div className="row-actions">
                    <button
                      className="secondary-link button-link"
                      type="button"
                      onClick={() => handleEdit(combo)}
                    >
                      Editar
                    </button>
                    <button
                      className="remove-link"
                      type="button"
                      onClick={() => void handleDelete(combo.id)}
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
              <h2>{editingId ? 'Editar combo' : 'Crear combo'}</h2>
              <p>Configura titulo, precio de paquete y los productos incluidos.</p>
            </div>
          </div>

          <form className="product-form" onSubmit={(event) => void handleSubmit(event)}>
            <label>
              Titulo
              <input name="title" value={form.title} onChange={handleChange} required />
            </label>

            <label>
              Subtitulo
              <textarea
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                rows={3}
                required
              />
            </label>

            <label>
              Imagen
              <input name="image" value={form.image} onChange={handleChange} required />
            </label>

            <div className="form-row">
              <label>
                Precio combo (CRC)
                <input
                  name="price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Precio anterior (CRC)
                <input
                  name="previousPrice"
                  type="number"
                  min="0"
                  value={form.previousPrice}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                CTA
                <input name="ctaLabel" value={form.ctaLabel} onChange={handleChange} required />
              </label>

              <label>
                Estado
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="Activa">Activa</option>
                  <option value="Inactiva">Inactiva</option>
                </select>
              </label>
            </div>

            <div className="table-header">
              <div>
                <h2>Productos del combo</h2>
                <p>Selecciona productos y cantidad.</p>
              </div>
              <button
                className="secondary-link button-link"
                type="button"
                onClick={handleAddItem}
              >
                Agregar fila
              </button>
            </div>

            {form.items.map((item, index) => (
              <div className="form-row" key={`${item.productId}-${index}`}>
                <label className="status-editor">
                  Producto
                  <select
                    value={item.productId}
                    onChange={(event) =>
                      handleItemChange(index, 'productId', event.target.value)
                    }
                    required
                  >
                    <option value="">Selecciona un producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) =>
                      handleItemChange(index, 'quantity', event.target.value)
                    }
                    required
                  />
                </label>

                <button
                  className="remove-link"
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                >
                  Quitar
                </button>
              </div>
            ))}

            <div className="form-actions">
              <button className="primary-link button-link" type="submit" disabled={isSubmitting}>
                {editingId ? 'Guardar combo' : 'Crear combo'}
              </button>
              <button className="secondary-link button-link" type="button" onClick={resetForm}>
                Limpiar
              </button>
            </div>
          </form>
        </aside>
      </section>
    </main>
  )
}

export default AdminCombosPage
