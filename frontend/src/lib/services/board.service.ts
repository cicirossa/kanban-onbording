import type { Board } from '@/types/kanban'
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api'

export interface BoardInput {
  title: string
  description?: string | null
}

/** All boards owned by the current user (no nested columns/cards). */
export const getBoards = () => apiGet<Array<Board>>('/api/boards')

/** A single board, hydrated with ordered columns and their cards. */
export const getBoard = (id: number) => apiGet<Board>(`/api/boards/${id}`)

export const createBoard = (data: BoardInput) =>
  apiPost<Board>('/api/boards', data)

export const updateBoard = (id: number, data: Partial<BoardInput>) =>
  apiPatch<Board>(`/api/boards/${id}`, data)

export const deleteBoard = (id: number) =>
  apiDelete<void>(`/api/boards/${id}`)
