import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Chip } from '@heroui/react'
import { CalendarDays, GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { CardPriority, Card as CardType } from '@/types/kanban'

const PRIORITY_COLOR: Record<
  CardPriority,
  'default' | 'primary' | 'warning' | 'danger'
> = {
  low: 'default',
  medium: 'primary',
  high: 'danger',
}

interface KanbanCardProps {
  card: CardType
  onView: (card: CardType) => void
  onEdit: (card: CardType) => void
  onDelete: (id: number) => void
  canEdit: boolean
  canDelete: boolean
}

const formatDue = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

export function KanbanCard({
  card,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `card:${card.id}`, data: { type: 'card', card } })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-2xl bg-white dark:bg-content2 border border-default-100 p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab active:cursor-grabbing text-default-300 hover:text-default-500 touch-none"
          aria-label="Drag card"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>

        <button
          type="button"
          onClick={() => onView(card)}
          className="flex-1 text-left"
        >
          <p className="text-sm font-medium text-foreground line-clamp-3">
            {card.title}
          </p>
        </button>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <span
              className="cursor-pointer text-default-400 hover:text-default-600"
              onClick={() => onEdit(card)}
            >
              <Pencil size={14} />
            </span>
          )}
          {canDelete && (
            <span
              className="cursor-pointer text-danger"
              onClick={() => onDelete(card.id)}
            >
              <Trash2 size={14} />
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <Chip
          size="sm"
          variant="flat"
          color={PRIORITY_COLOR[card.priority]}
          className="capitalize"
        >
          {card.priority}
        </Chip>
        {card.dueDate && (
          <span className="inline-flex items-center gap-1 text-tiny text-default-500">
            <CalendarDays size={12} />
            {formatDue(card.dueDate)}
          </span>
        )}
      </div>
    </div>
  )
}
