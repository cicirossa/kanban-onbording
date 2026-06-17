import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@heroui/react'
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { KanbanCard } from './card'
import type { BoardColumn, Card as CardType } from '@/types/kanban'

interface KanbanColumnProps {
  column: BoardColumn
  onAddCard: (columnId: number) => void
  onEditColumn: (column: BoardColumn) => void
  onDeleteColumn: (id: number) => void
  onViewCard: (card: CardType) => void
  onEditCard: (card: CardType) => void
  onDeleteCard: (id: number) => void
  hasPermission: (permission: string) => boolean
}

export function KanbanColumn({
  column,
  onAddCard,
  onEditColumn,
  onDeleteColumn,
  onViewCard,
  onEditCard,
  onDeleteCard,
  hasPermission,
}: KanbanColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `col:${column.id}`, data: { type: 'column', column } })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const cards = [...column.cards].sort((a, b) => a.position - b.position)
  const cardIds = cards.map((c) => `card:${c.id}`)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex w-72 shrink-0 flex-col rounded-3xl bg-default-100/60 dark:bg-content1 p-3"
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-default-300 hover:text-default-500 touch-none"
          aria-label="Drag column"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <h3 className="flex-1 truncate text-sm font-semibold text-foreground">
          {column.title}
        </h3>
        <span className="rounded-full bg-default-200/80 px-2 text-tiny font-medium text-default-600">
          {cards.length}
        </span>
        {hasPermission('columns.update') && (
          <span
            className="cursor-pointer text-default-400 hover:text-default-600"
            onClick={() => onEditColumn(column)}
          >
            <Pencil size={14} />
          </span>
        )}
        {hasPermission('columns.delete') && (
          <span
            className="cursor-pointer text-danger"
            onClick={() => onDeleteColumn(column.id)}
          >
            <Trash2 size={14} />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-0.5 py-1 min-h-[8px]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onView={onViewCard}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              canEdit={hasPermission('cards.update')}
              canDelete={hasPermission('cards.delete')}
            />
          ))}
        </SortableContext>
      </div>

      {hasPermission('cards.create') && (
        <Button
          size="sm"
          variant="light"
          startContent={<Plus size={16} />}
          className="mt-2 justify-start font-medium text-default-500"
          onPress={() => onAddCard(column.id)}
        >
          Add card
        </Button>
      )}
    </div>
  )
}
