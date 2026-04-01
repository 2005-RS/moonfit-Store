import {
  useDeferredValue,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import PageIntro from '../../components/shared/PageIntro'
import { useFeedback } from '../../context/FeedbackContext'
import { formatCurrency } from '../../lib/currency'
import {
  formatFileSize,
  optimizeProductImageFile,
  optimizeProductImageFromUrl,
} from '../../lib/imageOptimization'
import {
  enhanceProductImageWithAi,
  exportProductsCsv,
  fetchAdminProducts,
  fetchBrandOptions,
  fetchCategoryOptions,
} from '../../lib/adminApi'
import { API_BASE_URL } from '../../lib/api'
import { useCommerce } from '../../context/CommerceContext'
import type { Product, ProductMutationInput } from '../../types/catalog'
import type { PaginationMeta } from '../../types/admin'

type ProductFormState = {
  name: string
  brandId: string
  categoryId: string
  price: string
  previousPrice: string
  stock: string
  expirationDate: string
  badge: string
  image: string
  description: string
  features: string
  goals: string
}

type EntityOption = {
  id: string
  name: string
}

const emptyForm: ProductFormState = {
  name: '',
  brandId: '',
  categoryId: '',
  price: '',
  previousPrice: '',
  stock: '',
  expirationDate: '',
  badge: '',
  image: '',
  description: '',
  features: '',
  goals: '',
}

function toFormState(product: Product): ProductFormState {
  return {
    name: product.name,
    brandId: '',
    categoryId: '',
    price: String(product.price),
    previousPrice: product.previousPrice ? String(product.previousPrice) : '',
    stock: String(product.stock),
    expirationDate: product.expirationDate ?? '',
    badge: product.badge ?? '',
    image: product.image,
    description: product.description,
    features: product.features.join(', '),
    goals: product.goals.join(', '),
  }
}

function formatExpirationDate(value?: string) {
  if (!value) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

function getExpirationCopy(product: Product) {
  if (!product.expirationDate) {
    return {
      label: 'Sin vencimiento',
      detail: 'No hay fecha registrada.',
      tone: 'muted',
    } as const
  }

  if (product.isExpired) {
    const elapsedDays = Math.abs(product.daysUntilExpiration ?? 0)
    return {
      label: 'Vencido',
      detail:
        elapsedDays === 0
          ? 'Venció hoy.'
          : `Venció hace ${elapsedDays} ${elapsedDays === 1 ? 'día' : 'días'}.`,
      tone: 'danger',
    } as const
  }

  if (product.isExpiringSoon) {
    const remainingDays = product.daysUntilExpiration ?? 0
    return {
      label: remainingDays === 0 ? 'Vence hoy' : 'Por vencer',
      detail:
        remainingDays <= 1
          ? 'Queda menos de un día para vencer.'
          : `Vence en ${remainingDays} días.`,
      tone: 'warning',
    } as const
  }

  return {
    label: 'Vigente',
    detail: `Fecha: ${formatExpirationDate(product.expirationDate)}.`,
    tone: 'safe',
  } as const
}

function AdminProductsPage() {
  const { confirm } = useFeedback()
  const {
    createProduct,
    updateProduct,
    deleteProduct,
    refreshCommerce,
  } = useCommerce()
  const [productList, setProductList] = useState<Product[]>([])
  const [brands, setBrands] = useState<EntityOption[]>([])
  const [categories, setCategories] = useState<EntityOption[]>([])
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [isOptimizingImage, setIsOptimizingImage] = useState(false)
  const [isEnhancingImage, setIsEnhancingImage] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Todos')
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [optionsError, setOptionsError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const deferredSearch = useDeferredValue(search)

  const loadProducts = async () => {
    setIsLoading(true)

    try {
      const response = await fetchAdminProducts({
        page,
        pageSize,
        search: deferredSearch,
        status: selectedStatus === 'Todos' ? undefined : selectedStatus,
        brandId: selectedBrandFilter || undefined,
        categoryId: selectedCategoryFilter || undefined,
        sortBy,
        sortDirection,
      })

      setProductList(response.data)
      setMeta(response.meta)
      setPageError('')
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar los productos.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [brandOptions, categoryOptions] = await Promise.all([
          fetchBrandOptions(),
          fetchCategoryOptions(),
        ])

        setBrands(brandOptions.map((brand) => ({ id: brand.id, name: brand.name })))
        setCategories(
          categoryOptions.map((category) => ({ id: category.id, name: category.name })),
        )
        setOptionsError('')
      } catch (requestError) {
        setOptionsError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudieron cargar las marcas y categorias.',
        )
      }
    }

    void loadOptions()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [
    deferredSearch,
    pageSize,
    selectedBrandFilter,
    selectedCategoryFilter,
    selectedStatus,
    sortBy,
    sortDirection,
  ])

  useEffect(() => {
    void loadProducts()
  }, [
    deferredSearch,
    page,
    pageSize,
    selectedBrandFilter,
    selectedCategoryFilter,
    selectedStatus,
    sortBy,
    sortDirection,
  ])

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setSelectedImageFile(null)
    setImagePreview('')
    setEditingId(null)
    setPageError('')
    setSuccessMessage('')
  }

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const updateImagePreview = (nextPreview: string) => {
    setImagePreview((currentPreview) => {
      if (currentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreview)
      }

      return nextPreview
    })
  }

  const resolvePreviewUrl = (value: string) =>
    value.startsWith('/') ? `${API_BASE_URL}${value}` : value

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setForm({
      ...toFormState(product),
      brandId:
        brands.find((brand) => brand.name === product.brand)?.id ??
        form.brandId,
      categoryId:
        categories.find((category) => category.name === product.category)?.id ??
        form.categoryId,
    })
    setSelectedImageFile(null)
    updateImagePreview(resolvePreviewUrl(product.image))
    setPageError('')
    setSuccessMessage('')
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setSelectedImageFile(nextFile)

    if (nextFile) {
      updateImagePreview(URL.createObjectURL(nextFile))
      return
    }

    updateImagePreview(resolvePreviewUrl(form.image))
  }

  const handleEnhanceImage = () => {
    if (!selectedImageFile && !form.image.trim()) {
      setPageError('Selecciona o guarda primero una imagen para mejorarla con IA.')
      return
    }

    setIsEnhancingImage(true)
    setPageError('')

    void (async () => {
      try {
        const response = await enhanceProductImageWithAi({
          imageFile: selectedImageFile,
          imagePath: selectedImageFile ? undefined : form.image.trim() || undefined,
          productName: form.name.trim() || undefined,
        })

        setForm((current) => ({
          ...current,
          image: response.image,
        }))
        setSelectedImageFile(null)
        updateImagePreview(resolvePreviewUrl(response.image))
        setSuccessMessage(response.message)
      } catch (requestError) {
        setPageError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo mejorar la imagen con IA.',
        )
      } finally {
        setIsEnhancingImage(false)
      }
    })()
  }

  const handleOptimizeImage = () => {
    if (!selectedImageFile && !form.image.trim()) {
      setPageError('Selecciona primero una imagen para optimizarla.')
      return
    }

    setIsOptimizingImage(true)
    setPageError('')

    void (async () => {
      try {
        const result = selectedImageFile
          ? await optimizeProductImageFile(selectedImageFile)
          : await optimizeProductImageFromUrl(
              resolvePreviewUrl(form.image.trim()),
              `${form.name.trim() || 'producto'}.jpg`,
            )

        setSelectedImageFile(result.file)
        updateImagePreview(URL.createObjectURL(result.file))
        setSuccessMessage(
          `Imagen optimizada gratis. Paso de ${formatFileSize(result.beforeSize)} a ${formatFileSize(result.afterSize)} en formato ${result.width} x ${result.height}.`,
        )
      } catch (requestError) {
        setPageError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo optimizar la imagen.',
        )
      } finally {
        setIsOptimizingImage(false)
      }
    })()
  }

  const handleDelete = async (productId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar producto',
      message: 'Vas a eliminar este producto. Esta accion no se puede deshacer.',
      confirmLabel: 'Eliminar producto',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    })

    if (!confirmed) {
      return
    }

    try {
      await deleteProduct(productId)
      await loadProducts()
      setSuccessMessage('Producto eliminado correctamente.')
      setPageError('')
      await refreshCommerce()

      if (editingId === productId) {
        resetForm()
      }
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo eliminar el producto.',
      )
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setPageError('')

    const payload: ProductMutationInput = {
      name: form.name.trim(),
      brandId: form.brandId || null,
      categoryId: form.categoryId || null,
      price: Number(form.price),
      previousPrice: form.previousPrice ? Number(form.previousPrice) : undefined,
      stock: Number(form.stock),
      expirationDate: form.expirationDate || null,
      badge: form.badge.trim() || undefined,
      imageFile: selectedImageFile,
      description: form.description.trim(),
      goals: form.goals
        .split(',')
        .map((goal) => goal.trim())
        .filter(Boolean),
      features: [],
    }

    try {
      if (editingId) {
        await updateProduct(editingId, payload)
        setSuccessMessage('Producto actualizado correctamente.')
      } else {
        await createProduct(payload)
        setSuccessMessage('Producto creado correctamente.')
      }

      await loadProducts()
      await refreshCommerce()
      setForm(emptyForm)
      setSelectedImageFile(null)
      setImagePreview('')
      setEditingId(null)
      setPageError('')
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo guardar el producto.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-page">
      <PageIntro
        eyebrow="Admin Productos"
        title="Gestion de productos"
        description="Esta seccion ya crea, edita y elimina productos usando el backend real."
      />

      <section className="admin-products-layout">
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Listado actual</h2>
              <p>
                {isLoading
                  ? 'Cargando productos...'
                  : `${meta?.total ?? productList.length} productos encontrados.`}
              </p>
            </div>
            <button
              className="primary-link button-link"
              type="button"
              onClick={resetForm}
            >
              Nuevo producto
            </button>
            <button
              className="secondary-link button-link"
              type="button"
              onClick={() => void exportProductsCsv()}
            >
              Exportar CSV
            </button>
          </div>

          <div className="filter-bar">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, slug o descripcion"
            />
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              <option value="Todos">Todos los estados</option>
              <option value="Activa">Activa</option>
              <option value="Inactiva">Inactiva</option>
            </select>
            <select
              value={selectedBrandFilter}
              onChange={(event) => setSelectedBrandFilter(event.target.value)}
            >
              <option value="">Todas las marcas</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <select
              value={selectedCategoryFilter}
              onChange={(event) => setSelectedCategoryFilter(event.target.value)}
            >
              <option value="">Todas las categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="createdAt">Mas recientes</option>
              <option value="name">Nombre</option>
              <option value="price">Precio</option>
              <option value="stock">Stock</option>
              <option value="expirationDate">Vencimiento</option>
            </select>
            <select
              value={sortDirection}
              onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
            <select
              value={String(pageSize)}
              onChange={(event) => setPageSize(Number(event.target.value))}
            >
              <option value="8">8 por pagina</option>
              <option value="12">12 por pagina</option>
              <option value="20">20 por pagina</option>
            </select>
          </div>

          {optionsError || pageError ? (
            <p className="warning-note admin-banner">{pageError || optionsError}</p>
          ) : null}
          {successMessage ? <p className="success-note admin-banner">{successMessage}</p> : null}

          <div className="table-list">
            {productList.map((product) => (
              <div className="table-row product-admin-row" key={product.id}>
                <div className="product-admin-main">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="admin-product-thumb"
                  />
                    <div>
                      <strong>{product.name}</strong>
                      <p>
                        {product.brand} - {product.category}
                      </p>
                      <small className="muted-line">{product.description}</small>
                      <div className="product-admin-notes">
                        <span className={`expiration-pill ${getExpirationCopy(product).tone}`}>
                          {getExpirationCopy(product).label}
                        </span>
                        <small className="muted-line">
                          {getExpirationCopy(product).detail}
                        </small>
                      </div>
                    </div>
                  </div>

                <div className="table-meta">
                  <span>{formatCurrency(product.price)}</span>
                  <small>Stock: {product.stock}</small>
                  <small>Vence: {formatExpirationDate(product.expirationDate)}</small>
                  <div className="row-actions">
                    <button
                      className="secondary-link button-link"
                      type="button"
                      onClick={() => handleEdit(product)}
                    >
                      Editar
                    </button>
                    <button
                      className="remove-link"
                      type="button"
                      onClick={() => void handleDelete(product.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {meta ? (
            <div className="pagination-bar">
              <span>
                Pagina {meta.page} de {meta.totalPages}
              </span>
              <div className="row-actions">
                <button
                  className="secondary-link button-link"
                  type="button"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Anterior
                </button>
                <button
                  className="secondary-link button-link"
                  type="button"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="table-card product-form-card">
          <div className="table-header">
            <div>
              <h2>{editingId ? 'Editar producto' : 'Crear producto'}</h2>
              <p>Formulario conectado a productos, marcas y categorias reales.</p>
            </div>
          </div>

          <form className="product-form" onSubmit={(event) => void handleSubmit(event)}>
            <label>
              Nombre
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>

            <label className="status-editor">
              Marca
              <select name="brandId" value={form.brandId} onChange={handleChange} required>
                <option value="">Selecciona una marca</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="status-editor">
              Categoria
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona una categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-row">
              <label>
                Precio (CRC)
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
                Stock
                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Fecha de vencimiento
                <input
                  name="expirationDate"
                  type="date"
                  value={form.expirationDate}
                  onChange={handleChange}
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

            <label>
              Badge
              <input name="badge" value={form.badge} onChange={handleChange} />
            </label>

            <label>
              Imagen del producto
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </label>

            {imagePreview ? (
              <div className="image-upload-preview">
                <img
                  src={imagePreview}
                  alt="Vista previa del producto"
                  className="admin-product-thumb image-upload-preview-thumb"
                />
                <div>
                  <strong>
                    {selectedImageFile ? selectedImageFile.name : 'Imagen actual guardada'}
                  </strong>
                  <small className="muted-line">
                    Esta imagen se guarda en el servidor y queda ligada al producto.
                  </small>
                </div>
              </div>
            ) : (
              <small className="muted-line">
                Selecciona una imagen desde tu computadora. Ya no hace falta pegar una URL.
              </small>
            )}

            <div className="image-tools-panel">
              <p className="muted-line">
                Optimizar imagen recorta al formato catalogo, mejora un poco
                luz/contraste y comprime sin usar servicios de pago.
              </p>
              <div className="form-actions image-tools-actions">
                <button
                  className="primary-link button-link"
                  type="button"
                  disabled={isOptimizingImage || (!selectedImageFile && !form.image.trim())}
                  onClick={handleOptimizeImage}
                >
                  {isOptimizingImage ? 'Optimizando...' : 'Optimizar imagen gratis'}
                </button>
                <button
                  className="secondary-link button-link"
                  type="button"
                  disabled={isEnhancingImage || (!selectedImageFile && !form.image.trim())}
                  onClick={handleEnhanceImage}
                >
                  {isEnhancingImage
                    ? 'Mejorando con IA...'
                    : 'Mejorar con IA (requiere API)'}
                </button>
              </div>
            </div>

            <label>
              Descripcion
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                required
              />
            </label>

            <label>
              Objetivos separados por coma
              <textarea
                name="goals"
                value={form.goals}
                onChange={handleChange}
                rows={2}
              />
            </label>

            <label>
              Features separadas por coma
              <textarea
                name="features"
                value={form.features}
                onChange={handleChange}
                rows={3}
              />
            </label>

            {pageError || optionsError ? (
              <p className="warning-note">{pageError || optionsError}</p>
            ) : null}
            {!pageError && !optionsError && successMessage ? (
              <p className="success-note">{successMessage}</p>
            ) : null}

            <div className="form-actions">
              <button
                className="primary-link button-link"
                type="submit"
                disabled={isSubmitting}
              >
                {editingId ? 'Guardar cambios' : 'Crear producto'}
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
    </main>
  )
}

export default AdminProductsPage
