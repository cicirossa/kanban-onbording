import { Link } from '@tanstack/react-router'
import { Card } from '@heroui/react'
import { LayoutGrid, Pencil, Trash2 } from 'lucide-react'
import type { Board } from '@/types/kanban'

interface BoardTileProps {
  board: Board
  onEdit: (board: Board) => void
  onDelete: (id: number) => void
  canEdit: boolean
  canDelete: boolean
}

export function BoardTile({
  board,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: BoardTileProps) {
  return (
    <Card className="group relative overflow-hidden rounded-3xl border-none bg-white p-0 shadow-none dark:bg-content1">
      <Link
        to="/kanban/$boardId"
        params={{ boardId: String(board.id) }}
        className="flex h-full flex-col gap-3 p-5"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LayoutGrid size={22} />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-lg font-semibold text-foreground">
            {board.title}
          </h4>
          <p className="line-clamp-2 text-sm text-default-500">
            {board.description || 'No description'}
          </p>
        </div>
      </Link>

      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {canEdit && (
          <span
            className="cursor-pointer rounded-lg bg-default-100 p-1.5 text-default-500 hover:text-default-700"
            onClick={() => onEdit(board)}
          >
            <Pencil size={14} />
          </span>
        )}
        {canDelete && (
          <span
            className="cursor-pointer rounded-lg bg-default-100 p-1.5 text-danger"
            onClick={() => onDelete(board.id)}
          >
            <Trash2 size={14} />
          </span>
        )}
      </div>
    </Card>
  )
}
