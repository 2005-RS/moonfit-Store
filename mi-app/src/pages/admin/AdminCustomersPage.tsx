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
  createCustomer,
  deleteCustomer,
  exportCustomersCsv,
  fetchAdminCustomers,
  resetCustomerPassword,
  updateCustomer,
} from '../../lib/adminApi'
import type { AdminCustomer, PaginationMeta } from '../../types/admin'

type CustomerFormState = {
  name: string
  email: string
  phone: string
  city: string
  orders: string
  status: string
  creditApproved: string
  creditLimit: string
  creditDays: string
}

const emptyForm: CustomerFormState = {
  name: '',
  email: '',
  phone: '',
  city: '',
  orders: '0',
  status: 'Activa',
  creditApproved: 'No',
  creditLimit: '0',
  creditDays: '0',
}

const statusOptions = ['Todos', 'Activa', 'Inactiva']

function generateTemporaryPassword() {
  const base = Math.random().toString(36).slice(2, 8)
  return `Fit${base}9`
}

function AdminCustomersPage() {
  const { confirm } = useFeedback()
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('Todos')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [form, setForm] = useState<CustomerFormState>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const deferredSearch = useDeferredValue(search)

  const loadCustomers = async () => {
    setIsLoading(true)
    try {
      const response = await fetchAdminCustomers({
        page,
        pageSize,
        search: deferredSearch,
        status: selectedStatus === 'Todos' ? undefined : selectedStatus,
        sortBy,
        sortDirection,
      })
      setCustomers(response.data)
      setMeta(response.meta)
      setPageError('')
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar los clientes.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCustomers()
  }, [deferredSearch, page, pageSize, selectedStatus, sortBy, sortDirection])

  useEffect(() => {
    setPage(1)
  }, [deferredSearch, pageSize, selectedStatus, sortBy, sortDirection])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setPageError('')
    setSuccessMessage('')
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleEdit = (customer: AdminCustomer) => {
    setEditingId(customer.id)
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      orders: String(customer.orders),
      status: customer.status,
      creditApproved: customer.creditApproved ? 'Si' : 'No',
      creditLimit: String(customer.creditLimit),
      creditDays: String(customer.creditDays),
    })
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setSuccessMessage('')
  }

  const handleDelete = async (customerId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar cliente',
      message: 'Vas a eliminar este cliente. Esta accion no se puede deshacer.',
      confirmLabel: 'Eliminar cliente',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    })

    if (!confirmed) {
      return
    }

    try {
      await deleteCustomer(customerId)
      await loadCustomers()
      setSuccessMessage('Cliente eliminado correctamente.')
      setPageError('')

      if (editingId === customerId) {
        resetForm()
      }
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo eliminar el cliente.',
      )
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedCustomer: AdminCustomer = {
      id: editingId ?? crypto.randomUUID(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      orders: Number(form.orders),
      status: form.status.trim(),
      creditApproved: form.creditApproved === 'Si',
      creditLimit: Number(form.creditLimit),
      creditDays: Number(form.creditDays),
      hasAccount: false,
    }

    try {
      if (editingId) {
        await updateCustomer(editingId, normalizedCustomer)
        setSuccessMessage('Cliente actualizado correctamente.')
      } else {
        await createCustomer(normalizedCustomer)
        setSuccessMessage('Cliente creado correctamente.')
      }

      await loadCustomers()
      setForm(emptyForm)
      setEditingId(null)
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo guardar el cliente.',
      )
    }
  }

  const editingCustomer =
    customers.find((customer) => customer.id === editingId) ?? null

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingId) {
      setPageError('Selecciona primero un cliente existente para resetear la clave.')
      return
    }

    if (newPassword.trim().length < 6) {
      setPageError('La nueva contrasena debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPageError('La confirmacion de la contrasena no coincide.')
      return
    }

    try {
      await resetCustomerPassword(editingId, newPassword.trim())
      setNewPassword('')
      setConfirmPassword('')
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      setPageError('')
      setSuccessMessage('Contrasena actualizada correctamente para este cliente.')
      await loadCustomers()
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo resetear la contrasena del cliente.',
      )
    }
  }

  return (
    <main className="admin-page">
      <PageIntro
        eyebrow="Admin Clientes"
        title="Gestion de clientes"
        description="Ahora esta seccion administra clientes reales desde el backend."
      />

      <section className="admin-products-layout">
        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Base de clientes</h2>
              <p>
                {isLoading
                  ? 'Cargando clientes...'
                  : `${meta?.total ?? customers.length} clientes visibles.`}
              </p>
            </div>
            <button
              className="secondary-link button-link"
              type="button"
              onClick={() => void exportCustomersCsv()}
            >
              Exportar CSV
            </button>

            <div className="filter-bar">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, correo, ciudad o telefono"
              />
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="createdAt">Mas recientes</option>
                <option value="name">Nombre</option>
                <option value="email">Correo</option>
                <option value="status">Estado</option>
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
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={[
                    'filter-chip',
                    selectedStatus === status ? 'filter-chip-active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {pageError ? <p className="warning-note admin-banner">{pageError}</p> : null}
          {successMessage ? <p className="success-note admin-banner">{successMessage}</p> : null}

          <div className="table-list">
            {customers.map((customer) => (
              <div className="table-row" key={customer.id}>
                <div>
                  <strong>{customer.name}</strong>
                  <p>{customer.email}</p>
                  <small className="muted-line">
                    {customer.city} - {customer.phone}
                  </small>
                  <small className="muted-line">
                    Credito: {customer.creditApproved ? 'Aprobado' : 'No aprobado'} | Limite{' '}
                    {formatCurrency(customer.creditLimit)} | {customer.creditDays} dias
                  </small>
                  <small className="muted-line">
                    Cuenta web: {customer.hasAccount ? 'Si' : 'No'}
                  </small>
                </div>

                <div className="table-meta">
                  <span>{customer.status}</span>
                  <small>{customer.orders} pedidos</small>
                  <div className="row-actions">
                    <button
                      className="secondary-link button-link"
                      type="button"
                      onClick={() => handleEdit(customer)}
                    >
                      Editar
                    </button>
                    <button
                      className="remove-link"
                      type="button"
                      onClick={() => void handleDelete(customer.id)}
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
              <h2>{editingId ? 'Editar cliente' : 'Crear cliente'}</h2>
              <p>Formulario conectado a clientes reales del backend.</p>
            </div>
          </div>

          <form className="product-form" onSubmit={(event) => void handleSubmit(event)}>
            <label>
              Nombre
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>

            <label>
              Correo
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Telefono
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </label>

            <label>
              Ciudad
              <input name="city" value={form.city} onChange={handleChange} required />
            </label>

            <div className="form-row">
              <label>
                Pedidos
                <input
                  name="orders"
                  type="number"
                  min="0"
                  value={form.orders}
                  onChange={handleChange}
                  disabled
                />
              </label>

              <label>
                Estado
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  required
                >
                  <option value="Activa">Activa</option>
                  <option value="Inactiva">Inactiva</option>
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Aprobado a credito
                <select
                  name="creditApproved"
                  value={form.creditApproved}
                  onChange={handleChange}
                  required
                >
                  <option value="No">No</option>
                  <option value="Si">Si</option>
                </select>
              </label>

              <label>
                Limite de credito (CRC)
                <input
                  name="creditLimit"
                  type="number"
                  min="0"
                  value={form.creditLimit}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label>
              Dias de credito
              <input
                name="creditDays"
                type="number"
                min="0"
                value={form.creditDays}
                onChange={handleChange}
                required
              />
            </label>

            {pageError ? <p className="warning-note">{pageError}</p> : null}
            {!pageError && successMessage ? (
              <p className="success-note">{successMessage}</p>
            ) : null}

            <div className="form-actions">
              <button className="primary-link button-link" type="submit">
                {editingId ? 'Guardar cambios' : 'Crear cliente'}
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

          {editingId ? (
            <form className="product-form" onSubmit={(event) => void handlePasswordReset(event)}>
              <div className="table-header">
                <div>
                  <h2>Reset de contrasena</h2>
                  <p>
                    {editingCustomer?.hasAccount
                      ? 'Asigna una nueva clave si el cliente olvido la anterior.'
                      : 'Este cliente todavia no tiene cuenta web ligada.'}
                  </p>
                </div>
              </div>

              <label>
                Nueva contrasena
                <div className="password-field">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={6}
                    disabled={!editingCustomer?.hasAccount}
                  />
                  <button
                    className="secondary-link button-link password-toggle"
                    type="button"
                    disabled={!editingCustomer?.hasAccount}
                    onClick={() => setShowNewPassword((current) => !current)}
                  >
                    {showNewPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </label>

              <label>
                Confirmar contrasena
                <div className="password-field">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={6}
                    disabled={!editingCustomer?.hasAccount}
                  />
                  <button
                    className="secondary-link button-link password-toggle"
                    type="button"
                    disabled={!editingCustomer?.hasAccount}
                    onClick={() => setShowConfirmPassword((current) => !current)}
                  >
                    {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </label>

              <div className="form-actions">
                <button
                  className="secondary-link button-link"
                  type="button"
                  disabled={!editingCustomer?.hasAccount}
                  onClick={() => {
                    const temporaryPassword = generateTemporaryPassword()
                    setNewPassword(temporaryPassword)
                    setConfirmPassword(temporaryPassword)
                    setShowNewPassword(true)
                    setShowConfirmPassword(true)
                    setPageError('')
                    setSuccessMessage(`Clave temporal sugerida: ${temporaryPassword}`)
                  }}
                >
                  Generar temporal
                </button>
                <button
                  className="primary-link button-link"
                  type="submit"
                  disabled={!editingCustomer?.hasAccount}
                >
                  Guardar nueva clave
                </button>
              </div>
            </form>
          ) : null}
        </aside>
      </section>
    </main>
  )
}

export default AdminCustomersPage
