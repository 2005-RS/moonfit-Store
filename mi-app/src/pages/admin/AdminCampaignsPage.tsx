import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import PageIntro from '../../components/shared/PageIntro'
import { useFeedback } from '../../context/FeedbackContext'
import {
  createCampaign,
  deleteCampaign,
  fetchCampaigns,
  updateCampaign,
} from '../../lib/adminApi'
import type { AdminCampaign, AdminCampaignPlacement } from '../../types/admin'

type CampaignFormState = {
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  image: string
  placement: AdminCampaignPlacement
  discountTag: string
  status: 'Activa' | 'Inactiva'
}

const emptyForm: CampaignFormState = {
  title: '',
  subtitle: '',
  ctaLabel: 'Comprar ahora',
  ctaHref: '/catalogo',
  image: '',
  placement: 'home-hero',
  discountTag: '',
  status: 'Activa',
}

const placementOptions: Array<{
  value: AdminCampaignPlacement
  label: string
  helper: string
}> = [
  {
    value: 'home-hero',
    label: 'Hero principal',
    helper: 'Banner mas visible de la pagina de inicio.',
  },
  {
    value: 'home-secondary',
    label: 'Inicio secundario',
    helper: 'Tarjetas secundarias debajo del hero.',
  },
  {
    value: 'catalog-highlight',
    label: 'Catalogo destacado',
    helper: 'Espacio promocional para colecciones o descuentos.',
  },
]

function toFormState(campaign: AdminCampaign): CampaignFormState {
  return {
    title: campaign.title,
    subtitle: campaign.subtitle,
    ctaLabel: campaign.ctaLabel,
    ctaHref: campaign.ctaHref,
    image: campaign.image,
    placement: campaign.placement,
    discountTag: campaign.discountTag,
    status: campaign.status,
  }
}

function getPlacementLabel(placement: AdminCampaignPlacement) {
  return (
    placementOptions.find((option) => option.value === placement)?.label ?? 'Inicio secundario'
  )
}

function AdminCampaignsPage() {
  const { confirm } = useFeedback()
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([])
  const [form, setForm] = useState<CampaignFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadCampaigns = async () => {
    setIsLoading(true)

    try {
      setCampaigns(await fetchCampaigns())
      setPageError('')
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar las promociones.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCampaigns()
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

  const handleEdit = (campaign: AdminCampaign) => {
    setEditingId(campaign.id)
    setForm(toFormState(campaign))
    setPageError('')
    setSuccessMessage('')
  }

  const handleDelete = async (campaignId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar promocion',
      message: 'Vas a eliminar esta promocion. Esta accion no se puede deshacer.',
      confirmLabel: 'Eliminar promocion',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    })

    if (!confirmed) {
      return
    }

    try {
      await deleteCampaign(campaignId)
      await loadCampaigns()
      setSuccessMessage('Promocion eliminada correctamente.')

      if (editingId === campaignId) {
        setForm(emptyForm)
        setEditingId(null)
      }
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo eliminar la promocion.',
      )
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setPageError('')

    const payload: AdminCampaign = {
      id: editingId ?? '',
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      ctaLabel: form.ctaLabel.trim(),
      ctaHref: form.ctaHref.trim(),
      image: form.image.trim(),
      placement: form.placement,
      discountTag: form.discountTag.trim(),
      status: form.status,
    }

    try {
      if (editingId) {
        await updateCampaign(editingId, payload)
        setSuccessMessage('Promocion actualizada correctamente.')
      } else {
        await createCampaign(payload)
        setSuccessMessage('Promocion creada correctamente.')
      }

      await loadCampaigns()
      setForm(emptyForm)
      setEditingId(null)
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo guardar la promocion.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-page">
      <PageIntro
        eyebrow="Admin Promociones"
        title="Gestion de promociones y banners"
        description="Administra los banners que aparecen en inicio y catalogo usando la API real del backend."
      />

      <section className="admin-products-layout">
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Promociones activas y programadas</h2>
              <p>
                {isLoading
                  ? 'Cargando promociones...'
                  : `${campaigns.length} promociones disponibles.`}
              </p>
            </div>
            <button className="primary-link button-link" type="button" onClick={resetForm}>
              Nueva promocion
            </button>
          </div>

          {pageError ? <p className="warning-note admin-banner">{pageError}</p> : null}
          {successMessage ? <p className="success-note admin-banner">{successMessage}</p> : null}

          <div className="table-list">
            {!isLoading && campaigns.length === 0 ? (
              <p className="muted-line">
                Todavia no hay promociones cargadas. Crea la primera desde el formulario.
              </p>
            ) : null}

            {campaigns.map((campaign) => (
              <div className="table-row product-admin-row" key={campaign.id}>
                <div className="product-admin-main">
                  <img
                    src={campaign.image}
                    alt={campaign.title}
                    className="admin-product-thumb"
                  />
                  <div>
                    <strong>{campaign.title}</strong>
                    <p>{campaign.subtitle}</p>
                    <small className="muted-line">
                      {getPlacementLabel(campaign.placement)} | CTA: {campaign.ctaLabel}
                    </small>
                    <small className="muted-line">Destino: {campaign.ctaHref}</small>
                    {campaign.discountTag ? (
                      <small className="muted-line">Sello: {campaign.discountTag}</small>
                    ) : null}
                  </div>
                </div>

                <div className="table-meta">
                  <span>{campaign.status}</span>
                  <small>{getPlacementLabel(campaign.placement)}</small>
                  <div className="row-actions">
                    <button
                      className="secondary-link button-link"
                      type="button"
                      onClick={() => handleEdit(campaign)}
                    >
                      Editar
                    </button>
                    <button
                      className="remove-link"
                      type="button"
                      onClick={() => void handleDelete(campaign.id)}
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
              <h2>{editingId ? 'Editar promocion' : 'Crear promocion'}</h2>
              <p>Define copy, imagen, destino y el lugar donde se mostrara.</p>
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
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://..."
                required
              />
            </label>

            <div className="form-row">
              <label>
                Texto CTA
                <input name="ctaLabel" value={form.ctaLabel} onChange={handleChange} required />
              </label>

              <label>
                Destino CTA
                <input
                  name="ctaHref"
                  value={form.ctaHref}
                  onChange={handleChange}
                  placeholder="/catalogo"
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Ubicacion
                <select
                  name="placement"
                  value={form.placement}
                  onChange={handleChange}
                  required
                >
                  {placementOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Estado
                <select name="status" value={form.status} onChange={handleChange} required>
                  <option value="Activa">Activa</option>
                  <option value="Inactiva">Inactiva</option>
                </select>
              </label>
            </div>

            <label>
              Sello promocional
              <input
                name="discountTag"
                value={form.discountTag}
                onChange={handleChange}
                placeholder="Hasta 25% OFF"
              />
            </label>

            <div className="table-card" style={{ padding: 0 }}>
              <div className="table-header">
                <div>
                  <h2>Vista rapida</h2>
                  <p>
                    {
                      placementOptions.find((option) => option.value === form.placement)?.helper
                    }
                  </p>
                </div>
              </div>
              <div className="table-row">
                <div>
                  <strong>{form.title || 'Titulo de promocion'}</strong>
                  <p>{form.subtitle || 'Subtitulo y propuesta de valor.'}</p>
                  <small className="muted-line">
                    {form.discountTag || 'Sin sello adicional'} | {form.ctaLabel || 'CTA'}
                  </small>
                  <small className="muted-line">{form.ctaHref || '/catalogo'}</small>
                </div>
                <div className="table-meta">
                  <span>{getPlacementLabel(form.placement)}</span>
                  <small>{form.status}</small>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="primary-link button-link" type="submit" disabled={isSubmitting}>
                {editingId ? 'Guardar promocion' : 'Crear promocion'}
              </button>
              <button
                className="secondary-link button-link"
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Limpiar
              </button>
            </div>
          </form>
        </aside>
      </section>
    </main>
  )
}

export default AdminCampaignsPage
