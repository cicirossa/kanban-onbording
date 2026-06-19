import type { Card, CardPriority } from '@/types/kanban'
import { apiDelete, apiPatch, apiPost } from '@/lib/api'

export interface CardInput {
  title: string
  description?: string | null
  dueDate?: string | null
  priority?: CardPriority
  columnId: number
}

export const createCard = (data: CardInput) =>
  apiPost<Card>('/api/cards', data)

export const updateCard = (
  id: number,
  data: Partial<Omit<CardInput, 'columnId'>>,
) => apiPatch<Card>(`/api/cards/${id}`, data)

export const deleteCard = (id: number) => apiDelete<void>(`/api/cards/${id}`)

/** Move a card to a column and/or a new position. */
export const moveCard = (id: number, columnId: number, position: number) =>
  apiPatch<Card>(`/api/cards/${id}/move`, { columnId, position })
