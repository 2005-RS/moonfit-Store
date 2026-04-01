import { useEffect, useState } from 'react'
import EntityCrudSection from '../../components/admin/EntityCrudSection'
import PageIntro from '../../components/shared/PageIntro'
import {
  createBrand,
  deleteBrand,
  fetchBrands,
  updateBrand,
} from '../../lib/adminApi'
import type { AdminEntityItem } from '../../types/admin'

function AdminBrandsPage() {
  const [items, setItems] = useState<AdminEntityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadBrands = async () => {
    setLoading(true)
    try {
      setItems(await fetchBrands())
      setPageError('')
    } catch (requestError) {
      setPageError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar las marcas.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBrands()
  }, [])

  return (
    <main className="admin-page">
      <PageIntro
        eyebrow="Admin Marcas"
        title="Gestion de marcas"
        description="Aqui ya puedes administrar marcas usando la API real del backend."
      />

      <EntityCrudSection
        itemLabel="Marca"
        helperText="Usa esta seccion para controlar marcas activas, nuevas y destacadas del ecommerce."
        items={items}
        loading={loading}
        externalError={pageError}
        onCreate={async (item) => {
          await createBrand(item)
          await loadBrands()
        }}
        onUpdate={async (id, item) => {
          await updateBrand(id, item)
          await loadBrands()
        }}
        onDelete={async (id) => {
          await deleteBrand(id)
          await loadBrands()
        }}
      />
    </main>
  )
}

export default AdminBrandsPage
