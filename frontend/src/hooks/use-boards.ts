import { useQuery } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'
import { useAppMutation } from './use-mutations'
import { useConfirmation } from './use-confirmation'
import { useUserPermission } from './use-permissions'
import type { Board } from '@/types/kanban'
import type { BoardFormData } from '@/lib/schemas/kanban'
import {
  createBoard,
  deleteBoard,
  getBoards,
  updateBoard,
} from '@/lib/services/board.service'
import { useKanbanUiStore } from '@/lib/stores/kanban-ui.store'

export const useBoards = () =>
  useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
  })

export const useBoardsPage = () => {
  const { data: boards = [], isLoading } = useBoards()
  const { hasPermission } = useUserPermission()
  const { confirm } = useConfirmation()

  const ui = useKanbanUiStore(
    useShallow((s) => ({
      open: s.open,
      close: s.close,
      onOpenChange: s.onOpenChange,
      isReadOnly: s.isReadOnly,
      boardOpen: s.modals.board.isOpen,
      boardEntity: s.modals.board.entity as Board | null,
    })),
  )
  const editingBoard = ui.boardEntity

  const createMutation = useAppMutation({
    mutationFn: createBoard,
    invalidateKeys: ['boards'],
    successMessage: 'Board created successfully',
    onSuccess: () => ui.close('board'),
  })

  const updateMutation = useAppMutation({
    mutationFn: ({ id, data }: { id: number; data: BoardFormData }) =>
      updateBoard(id, data),
    invalidateKeys: ['boards'],
    successMessage: 'Board updated successfully',
    onSuccess: () => ui.close('board'),
  })

  const deleteMutation = useAppMutation({
    mutationFn: deleteBoard,
    invalidateKeys: ['boards'],
    successMessage: 'Board deleted successfully',
  })

  const handleCreate = () => ui.open('board', null)
  const handleEdit = (board: Board) => ui.open('board', board)

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Delete Board',
      message:
        'Delete this board and all its columns and cards? This cannot be undone.',
      color: 'danger',
    })
    if (isConfirmed) deleteMutation.mutate(id)
  }

  const onSubmit = (data: BoardFormData) => {
    if (editingBoard) {
      updateMutation.mutate({ id: editingBoard.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return {
    boards,
    isLoading,
    hasPermission,
    handleCreate,
    handleEdit,
    handleDelete,
    modalProps: {
      isOpen: ui.boardOpen,
      onOpenChange: ui.onOpenChange('board'),
      editingBoard,
      onSubmit,
      isLoading: createMutation.isPending || updateMutation.isPending,
    },
  }
}
