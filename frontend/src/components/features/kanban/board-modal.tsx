import { useEffect } from 'react'
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from '@heroui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LayoutGrid } from 'lucide-react'
import type { Board } from '@/types/kanban'
import type { BoardFormData } from '@/lib/schemas/kanban'
import { boardSchema } from '@/lib/schemas/kanban'

interface BoardModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingBoard: Board | null
  onSubmit: (data: BoardFormData) => void
  isLoading?: boolean
}

export function BoardModal({
  isOpen,
  onOpenChange,
  editingBoard,
  onSubmit,
  isLoading = false,
}: BoardModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BoardFormData>({ resolver: zodResolver(boardSchema) })

  useEffect(() => {
    if (isOpen) {
      reset({
        title: editingBoard?.title ?? '',
        description: editingBoard?.description ?? '',
      })
    }
  }, [isOpen, editingBoard, reset])

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <LayoutGrid size={20} className="text-primary" />
              <span>{editingBoard ? 'Edit Board' : 'New Board'}</span>
            </ModalHeader>
            <ModalBody className="pb-6">
              <form
                id="board-form"
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <Input
                  {...register('title')}
                  label="Title"
                  placeholder="e.g. Product Roadmap"
                  variant="bordered"
                  labelPlacement="outside"
                  errorMessage={errors.title?.message}
                  isInvalid={!!errors.title}
                />
                <Textarea
                  {...register('description')}
                  label="Description"
                  placeholder="What is this board about?"
                  variant="bordered"
                  labelPlacement="outside"
                />
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose} className="font-medium">
                Cancel
              </Button>
              <Button
                color="primary"
                type="submit"
                form="board-form"
                isLoading={isLoading}
                className="px-8 font-medium"
              >
                {editingBoard ? 'Save Changes' : 'Create Board'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
