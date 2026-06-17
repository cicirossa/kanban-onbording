import { createCrudModalStore } from './create-crud-modal-store'
import type { Board, BoardColumn, Card } from '@/types/kanban'

/**
 * UI state for the kanban modals. The entity type is the union of everything a
 * modal can carry; each `open(modal, entity)` call passes the matching type.
 * - `board`  — create / edit a board (board-list page)
 * - `column` — create / edit a column
 * - `card`   — create / edit / view a card
 */
export const useKanbanUiStore = createCrudModalStore<Board | BoardColumn | Card>(
  ['board', 'column', 'card'],
)
