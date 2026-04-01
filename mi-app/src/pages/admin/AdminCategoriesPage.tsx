import { useEffect, useState } from 'react'
import EntityCrudSection from '../../components/admin/EntityCrudSection'
import PageIntro from '../../components/shared/PageIntro'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '../../lib/adminApi'
import type { AdminEntityItem } from '../../types/admin'

function AdminCategoriesPage() {
  const [items, setItems] = useState<AdminEntityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadCategories = async () => {
    setLoading(true)
    try {
      setItems(await fetchCategories())
      setPageError('')
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar las categorias.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCategories()
  }, [])

  return (
    <main className="admin-page">
      <PageIntro
        eyebrow="Admin Categorias"
        title="Gestion de categorias"
        description="Aqui ya puedes crear, editar y eliminar categorias usando la API real del backend."
      />

      <EntityCrudSection
        itemLabel="Categoria"
        helperText="Usa esta seccion para definir grupos principales del catalogo y su estado comercial."
        items={items}
        loading={loading}
        externalError={pageError}
        onCreate={async (item) => {
          await createCategory(item)
          await loadCategories()
        }}
        onUpdate={async (id, item) => {
          await updateCategory(id, item)
          await loadCategories()
        }}
        onDelete={async (id) => {
          await deleteCategory(id)
          await loadCategories()
        }}
      />
    </main>
  )
}

export default AdminCategoriesPage
