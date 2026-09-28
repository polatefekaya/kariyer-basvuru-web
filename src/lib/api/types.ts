/** Standard backend envelope. `data` is what callers actually want — see `unwrap()`. */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNext: boolean
  hasPrevious?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}
