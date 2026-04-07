import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { matchesNameFilter, PAGE_SIZE } from "../helpers"

type UseSearchPaginationOptions<T> = {
  items: T[]
  dataRevision: number
  activeTab: string
  getSearchableParts: (item: T) => (string | undefined | null)[]
  /**
   * Extra values that affect `getSearchableParts` (e.g. tutors + tutees when resolving assignment names).
   * The accessor itself is read from a ref so it does not need to be memoized at the call site.
   */
  filterDeps?: readonly unknown[]
  pageSize?: number
}

export function useSearchPagination<T>({
  items,
  dataRevision,
  activeTab,
  getSearchableParts,
  filterDeps = [],
  pageSize = PAGE_SIZE,
}: UseSearchPaginationOptions<T>) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const getPartsRef = useRef(getSearchableParts)
  getPartsRef.current = getSearchableParts

  useEffect(() => {
    setPage(1)
  }, [search, dataRevision, activeTab, ...filterDeps])

  const filtered = useMemo(
    () =>
      items.filter((item) => matchesNameFilter(search, getPartsRef.current(item))),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getSearchableParts via ref; mirror closed-over values in filterDeps
    [items, search, ...filterDeps],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  )

  const onPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])
  const onNext = useCallback(() => setPage((p) => Math.min(totalPages, p + 1)), [totalPages])

  return {
    search,
    setSearch,
    filtered,
    paged,
    page,
    totalPages,
    paginationProps: { page, totalPages, onPrev, onNext } as const,
  }
}
