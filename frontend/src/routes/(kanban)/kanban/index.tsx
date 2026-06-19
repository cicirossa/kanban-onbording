import { createFileRoute } from '@tanstack/react-router'
import { Button, Spinner } from '@heroui/react'
import { LayoutGrid, Plus } from 'lucide-react'
import { useBoardsPage } from '@/hooks/use-boards'
import { BoardTile } from '@/components/features/kanban/board-card'
import { BoardModal } from '@/components/features/kanban/board-modal'
import { PageHeader } from '@/components/templates/page-header'

export const Route = createFileRoute('/(kanban)/kanban/')({
  component: KanbanBoardsPage,
})

function KanbanBoardsPage() {
  const {
    boards,
    isLoading,
    hasPermission,
    handleCreate,
    handleEdit,
    handleDelete,
    modalProps,
  } = useBoardsPage()

  return (
    <div>
      <PageHeader
        title="Kanban"
        breadcrumbs={[{ label: 'Kanban', isCurrent: true }]}
        actions={
          hasPermission('boards.create') ? (
            <Button
              color="primary"
              startContent={<Plus size={18} />}
              onPress={handleCreate}
              className="font-medium"
            >
              New Board
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : boards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <LayoutGrid size={28} />
          </div>
          <p className="text-default-500">
            No boards yet. Create your first board to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards.map((board) => (
            <BoardTile
              key={board.id}
              board={board}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canEdit={hasPermission('boards.update')}
              canDelete={hasPermission('boards.delete')}
            />
          ))}
        </div>
      )}

      <BoardModal {...modalProps} />
    </div>
  )
}
