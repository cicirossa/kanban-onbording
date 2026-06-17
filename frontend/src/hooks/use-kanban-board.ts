import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'
import { useAppMutation } from './use-mutations'
import { useConfirmation } from './use-confirmation'
import { useUserPermission } from './use-permissions'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { Board, BoardColumn, Card } from '@/types/kanban'
import type { CardFormData, ColumnFormData } from '@/lib/schemas/kanban'
import { getBoard } from '@/lib/services/board.service'
import {
  createColumn,
  deleteColumn,
  moveColumn,
  updateColumn,
} from '@/lib/services/column.service'
import {
  createCard,
  deleteCard,
  moveCard,
  updateCard,
} from '@/lib/services/card.service'
import { useKanbanUiStore } from '@/lib/stores/kanban-ui.store'

const POSITION_STEP = 1024

/** Fractional midpoint between two neighbour positions (Trello-style ordering). */
const midpoint = (prev?: number, next?: number): number => {
  if (prev == null && next == null) return POSITION_STEP
  if (prev == null) return next! / 2
  if (next == null) return prev + POSITION_STEP
  return (prev + next) / 2
}

const byPosition = <T extends { position: number }>(a: T, b: T) =>
  a.position - b.position

export const useBoard = (id: number) =>
  useQuery({
    queryKey: ['board', id],
    queryFn: () => getBoard(id),
  })

export const useKanbanBoard = (boardId: number) => {
  const queryClient = useQueryClient()
  const queryKey = ['board', boardId]
  const { data: board, isLoading } = useBoard(boardId)
  const { hasPermission } = useUserPermission()
  const { confirm } = useConfirmation()

  const [activeId, setActiveId] = useState<string | null>(null)
  // Column a "new card" modal will create into (no entity to read it from yet).
  const [cardColumnId, setCardColumnId] = useState<number | null>(null)

  const ui = useKanbanUiStore(
    useShallow((s) => ({
      open: s.open,
      close: s.close,
      onOpenChange: s.onOpenChange,
      isReadOnly: s.isReadOnly,
      columnOpen: s.modals.column.isOpen,
      columnEntity: s.modals.column.entity as BoardColumn | null,
      cardOpen: s.modals.card.isOpen,
      cardEntity: s.modals.card.entity as Card | null,
    })),
  )

  const columns = useMemo(
    () => [...(board?.columns ?? [])].sort(byPosition),
    [board],
  )

  // --- optimistic cache helpers ---

  const writeBoard = (updater: (draft: Board) => Board) => {
    const prev = queryClient.getQueryData<Board>(queryKey)
    if (prev) queryClient.setQueryData<Board>(queryKey, updater(prev))
    return prev
  }

  // --- column / card CRUD ---

  const createColumnMutation = useAppMutation({
    mutationFn: createColumn,
    invalidateKeys: [queryKey],
    successMessage: 'Column created',
    onSuccess: () => ui.close('column'),
  })

  const updateColumnMutation = useAppMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      updateColumn(id, { title }),
    invalidateKeys: [queryKey],
    successMessage: 'Column updated',
    onSuccess: () => ui.close('column'),
  })

  const deleteColumnMutation = useAppMutation({
    mutationFn: deleteColumn,
    invalidateKeys: [queryKey],
    successMessage: 'Column deleted',
  })

  const createCardMutation = useAppMutation({
    mutationFn: createCard,
    invalidateKeys: [queryKey],
    successMessage: 'Card created',
    onSuccess: () => ui.close('card'),
  })

  const updateCardMutation = useAppMutation({
    mutationFn: ({ id, data }: { id: number; data: CardFormData }) =>
      updateCard(id, data),
    invalidateKeys: [queryKey],
    successMessage: 'Card updated',
    onSuccess: () => ui.close('card'),
  })

  const deleteCardMutation = useAppMutation({
    mutationFn: deleteCard,
    invalidateKeys: [queryKey],
    successMessage: 'Card deleted',
  })

  // --- drag persistence (optimistic, no toast; reconcile on settle) ---

  const moveCardMutation = useAppMutation({
    mutationFn: ({
      id,
      columnId,
      position,
    }: {
      id: number
      columnId: number
      position: number
    }) => moveCard(id, columnId, position),
    errorMessage: 'Failed to move card',
    onError: (_e, _v, ctx) => {
      const prev = (ctx as { prev?: Board } | undefined)?.prev
      if (prev) queryClient.setQueryData(queryKey, prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const moveColumnMutation = useAppMutation({
    mutationFn: ({ id, position }: { id: number; position: number }) =>
      moveColumn(id, position),
    errorMessage: 'Failed to move column',
    onError: (_e, _v, ctx) => {
      const prev = (ctx as { prev?: Board } | undefined)?.prev
      if (prev) queryClient.setQueryData(queryKey, prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  // --- handlers ---

  const handleAddColumn = () => {
    ui.open('column', null)
  }
  const handleEditColumn = (column: BoardColumn) => ui.open('column', column)
  const handleDeleteColumn = async (id: number) => {
    const ok = await confirm({
      title: 'Delete Column',
      message: 'Delete this column and all its cards?',
      color: 'danger',
    })
    if (ok) deleteColumnMutation.mutate(id)
  }
  const onColumnSubmit = (data: ColumnFormData) => {
    if (ui.columnEntity) {
      updateColumnMutation.mutate({ id: ui.columnEntity.id, title: data.title })
    } else {
      createColumnMutation.mutate({ title: data.title, boardId })
    }
  }

  const handleAddCard = (columnId: number) => {
    setCardColumnId(columnId)
    ui.open('card', null)
  }
  const handleViewCard = (card: Card) => ui.open('card', card, { readOnly: true })
  const handleEditCard = (card: Card) => {
    setCardColumnId(card.columnId)
    ui.open('card', card)
  }
  const handleDeleteCard = async (id: number) => {
    const ok = await confirm({
      title: 'Delete Card',
      message: 'Delete this card?',
      color: 'danger',
    })
    if (ok) deleteCardMutation.mutate(id)
  }
  const onCardSubmit = (data: CardFormData) => {
    const payload = {
      ...data,
      dueDate: data.dueDate || null,
      description: data.description || null,
    }
    if (ui.cardEntity) {
      updateCardMutation.mutate({ id: ui.cardEntity.id, data: payload })
    } else if (cardColumnId != null) {
      createCardMutation.mutate({ ...payload, columnId: cardColumnId })
    }
  }

  // --- drag and drop ---

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || !board) return

    const activeData = active.data.current as
      | { type: 'card'; card: Card }
      | { type: 'column'; column: BoardColumn }
      | undefined
    const overData = over.data.current as
      | { type: 'card'; card: Card }
      | { type: 'column'; column: BoardColumn }
      | undefined
    if (!activeData) return

    if (activeData.type === 'column') {
      const ordered = [...columns]
      const fromIndex = ordered.findIndex((c) => c.id === activeData.column.id)
      const overColumnId =
        overData?.type === 'column'
          ? overData.column.id
          : overData?.type === 'card'
            ? overData.card.columnId
            : null
      if (overColumnId == null) return
      const toIndex = ordered.findIndex((c) => c.id === overColumnId)
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return

      const without = ordered.filter((c) => c.id !== activeData.column.id)
      const insertAt = without.findIndex((c) => c.id === overColumnId)
      const before = without[insertAt - 1]
      const after = without[insertAt]
      const position = midpoint(before?.position, after?.position)

      writeBoard((draft) => ({
        ...draft,
        columns: draft.columns.map((c) =>
          c.id === activeData.column.id ? { ...c, position } : c,
        ),
      }))
      moveColumnMutation.mutate({ id: activeData.column.id, position })
      return
    }

    // Dragging a card.
    const activeCard = activeData.card
    const destColumnId =
      overData?.type === 'card'
        ? overData.card.columnId
        : overData?.type === 'column'
          ? overData.column.id
          : null
    if (destColumnId == null) return

    const destCards = columns
      .find((c) => c.id === destColumnId)
      ?.cards.slice()
      .sort(byPosition)
      .filter((card) => card.id !== activeCard.id) ?? []

    let insertAt: number
    if (overData?.type === 'card') {
      const overIndex = destCards.findIndex((c) => c.id === overData.card.id)
      insertAt = overIndex === -1 ? destCards.length : overIndex
    } else {
      insertAt = destCards.length // dropped on the column body → append
    }

    const before = destCards[insertAt - 1]
    const after = destCards[insertAt]
    if (
      activeCard.columnId === destColumnId &&
      before?.id === activeCard.id
    ) {
      return // no-op drop in place
    }
    const position = midpoint(before?.position, after?.position)

    writeBoard((draft) => ({
      ...draft,
      columns: draft.columns.map((c) => {
        // remove from source
        if (c.id === activeCard.columnId && c.id !== destColumnId) {
          return { ...c, cards: c.cards.filter((cd) => cd.id !== activeCard.id) }
        }
        // upsert into destination
        if (c.id === destColumnId) {
          const others = c.cards.filter((cd) => cd.id !== activeCard.id)
          return {
            ...c,
            cards: [
              ...others,
              { ...activeCard, columnId: destColumnId, position },
            ].sort(byPosition),
          }
        }
        return c
      }),
    }))
    moveCardMutation.mutate({ id: activeCard.id, columnId: destColumnId, position })
  }

  return {
    board,
    columns,
    isLoading,
    hasPermission,
    activeId,
    dnd: { handleDragStart, handleDragEnd },
    columnActions: {
      onAdd: handleAddColumn,
      onEdit: handleEditColumn,
      onDelete: handleDeleteColumn,
    },
    cardActions: {
      onAdd: handleAddCard,
      onView: handleViewCard,
      onEdit: handleEditCard,
      onDelete: handleDeleteCard,
    },
    columnModalProps: {
      isOpen: ui.columnOpen,
      onOpenChange: ui.onOpenChange('column'),
      editingColumn: ui.columnEntity,
      onSubmit: onColumnSubmit,
      isLoading:
        createColumnMutation.isPending || updateColumnMutation.isPending,
    },
    cardModalProps: {
      isOpen: ui.cardOpen,
      onOpenChange: ui.onOpenChange('card'),
      editingCard: ui.cardEntity,
      isReadOnly: ui.isReadOnly,
      onSubmit: onCardSubmit,
      isLoading: createCardMutation.isPending || updateCardMutation.isPending,
    },
  }
}
