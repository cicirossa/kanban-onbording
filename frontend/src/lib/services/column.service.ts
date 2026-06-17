import type { BoardColumn } from '@/types/kanban'
import { apiDelete, apiPatch, apiPost } from '@/lib/api'

export interface ColumnInput {
  title: string
  boardId: number
}

export const createColumn = (data: ColumnInput) =>
  apiPost<BoardColumn>('/api/columns', data)

export const updateColumn = (id: number, data: { title: string }) =>
  apiPatch<BoardColumn>(`/api/columns/${id}`, data)

export const deleteColumn = (id: number) =>
  apiDelete<void>(`/api/columns/${id}`)

/** Reorder a column within its board. */
export const moveColumn = (id: number, position: number) =>
  apiPatch<BoardColumn>(`/api/columns/${id}/move`, { position })
