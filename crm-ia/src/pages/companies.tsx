import { Building2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CompanyCard } from '@/components/crm/company-card'
import { FilterBar, FilterSelect } from '@/components/crm/filter-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { COMPANY_SIZES } from '@/constants/labels'
import { useCrmData } from '@/hooks/use-crm'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { matches } from '@/lib/utils'

export function CompaniesPage() {
  const { companies, opportunities } = useCrmData()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)
  const [segment, setSegment] = useState('todos')
  const [size, setSize] = useState('todos')
  const [relation, setRelation] = useState('todos')

  const segments = useMemo(
    () => [...new Set(companies.map((company) => company.segment))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [companies],
  )

  const openByCompany = useMemo(() => {
    const map = new Map<string, number>()
    for (const opportunity of opportunities) {
      if (opportunity.stage === 'ganho' || opportunity.stage === 'perdido') continue
      map.set(opportunity.companyId, (map.get(opportunity.companyId) ?? 0) + 1)
    }
    return map
  }, [opportunities])

  const filtered = useMemo(
    () =>
      companies.filter((company) => {
        if (segment !== 'todos' && company.segment !== segment) return false
        if (size !== 'todos' && company.size !== size) return false
        if (relation === 'cliente' && company.mrr === 0) return false
        if (relation === 'prospect' && company.mrr > 0) return false
        return matches([company.tradeName, company.legalName, company.segment, company.city, company.cnpj], debouncedQuery)
      }),
    [companies, segment, size, relation, debouncedQuery],
  )

  const activeFilters = [segment, size, relation].filter((value) => value !== 'todos').length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Empresas"
        description={`${filtered.length} de ${companies.length} empresas cadastradas`}
      />

      <FilterBar
        activeCount={activeFilters}
        onClear={() => {
          setSegment('todos')
          setSize('todos')
          setRelation('todos')
          setQuery('')
        }}
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nome, CNPJ, segmento ou cidade"
          className="w-full sm:w-80"
        />
        <FilterSelect
          label="Segmento"
          value={segment}
          onChange={setSegment}
          options={segments.map((item) => ({ value: item, label: item }))}
        />
        <FilterSelect
          label="Porte"
          value={size}
          onChange={setSize}
          options={COMPANY_SIZES.map((item) => ({ value: item.id, label: item.label }))}
        />
        <FilterSelect
          label="Relação"
          value={relation}
          onChange={setRelation}
          options={[
            { value: 'cliente', label: 'Clientes' },
            { value: 'prospect', label: 'Prospects' },
          ]}
        />
      </FilterBar>

      {filtered.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} openCount={openByCompany.get(company.id) ?? 0} />
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-line bg-surface">
          <EmptyState
            icon={Building2}
            title="Nenhuma empresa encontrada"
            description="Tente outro termo de busca ou limpe os filtros aplicados."
          />
        </div>
      )}
    </div>
  )
}
