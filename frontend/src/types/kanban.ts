// Kanban domain types. Mirrors the backend entities in backend/src/{boards,
// columns,cards}. Hand-defined (like `Invitation` in types/api.ts) rather than
// generated, so the feature is self-contained.

export type CardPriority = 'low' | 'medium' | 'high'

export interface Card {
  id: number
  title: string
  description: string | null
  dueDate: string | null
  priority: CardPriority
  position: number
  columnId: number
  createdAt: string
  updatedAt: string
}

export interface BoardColumn {
  id: number
  title: string
  position: number
  boardId: number
  cards: Array<Card>
  createdAt: string
  updatedAt: string
}

export interface Board {
  id: number
  title: string
  description: string | null
  userId: number
  columns: Array<BoardColumn>
  createdAt: string
  updatedAt: string
}
