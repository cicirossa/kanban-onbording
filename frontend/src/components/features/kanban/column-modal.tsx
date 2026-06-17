import { useEffect } from 'react'
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Columns3 } from 'lucide-react'
import type { BoardColumn } from '@/types/kanban'
import type { ColumnFormData } from '@/lib/schemas/kanban'
import { columnSchema } from '@/lib/schemas/kanban'

interface ColumnModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingColumn: BoardColumn | null
  onSubmit: (data: ColumnFormData) => void
  isLoading?: boolean
}

export function ColumnModal({
  isOpen,
  onOpenChange,
  editingColumn,
  onSubmit,
  isLoading = false,
}: ColumnModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ColumnFormData>({ resolver: zodResolver(columnSchema) })

  useEffect(() => {
    if (isOpen) {
      reset({ title: editingColumn?.title ?? '' })
    }
  }, [isOpen, editingColumn, reset])

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <Columns3 size={20} className="text-primary" />
              <span>{editingColumn ? 'Edit Column' : 'New Column'}</span>
            </ModalHeader>
            <ModalBody className="pb-6">
              <form
                id="column-form"
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <Input
                  {...register('title')}
                  label="Title"
                  placeholder="e.g. To Do"
                  variant="bordered"
                  labelPlacement="outside"
                  autoFocus
                  errorMessage={errors.title?.message}
                  isInvalid={!!errors.title}
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
                form="column-form"
                isLoading={isLoading}
                className="px-8 font-medium"
              >
                {editingColumn ? 'Save' : 'Create'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
