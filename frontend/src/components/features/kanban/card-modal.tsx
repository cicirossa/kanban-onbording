import { useEffect } from 'react'
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, SquareKanban } from 'lucide-react'
import type { Card, CardPriority } from '@/types/kanban'
import type { CardFormData } from '@/lib/schemas/kanban'
import { cardSchema } from '@/lib/schemas/kanban'

interface CardModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingCard: Card | null
  isReadOnly?: boolean
  onSubmit: (data: CardFormData) => void
  isLoading?: boolean
}

const PRIORITIES: Array<{ key: CardPriority; label: string }> = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
]

const PRIORITY_COLOR: Record<
  CardPriority,
  'default' | 'primary' | 'danger'
> = { low: 'default', medium: 'primary', high: 'danger' }

const toDateInput = (value?: string | null) =>
  value ? value.slice(0, 10) : ''

export function CardModal({
  isOpen,
  onOpenChange,
  editingCard,
  isReadOnly = false,
  onSubmit,
  isLoading = false,
}: CardModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CardFormData>({ resolver: zodResolver(cardSchema) })

  useEffect(() => {
    if (isOpen) {
      reset({
        title: editingCard?.title ?? '',
        description: editingCard?.description ?? '',
        dueDate: toDateInput(editingCard?.dueDate),
        priority: editingCard?.priority ?? 'medium',
      })
    }
  }, [isOpen, editingCard, reset])

  const title = isReadOnly ? 'Card Details' : editingCard ? 'Edit Card' : 'New Card'

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <SquareKanban size={20} className="text-primary" />
              <span>{title}</span>
            </ModalHeader>
            <ModalBody className="pb-6">
              {isReadOnly ? (
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {editingCard?.title}
                  </h3>
                  {editingCard?.priority && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color={PRIORITY_COLOR[editingCard.priority]}
                      className="capitalize w-fit"
                    >
                      {editingCard.priority} priority
                    </Chip>
                  )}
                  {editingCard?.dueDate && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-default-500">
                      <CalendarDays size={14} />
                      Due {new Date(editingCard.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <p className="whitespace-pre-wrap text-sm text-default-600">
                    {editingCard?.description || 'No description.'}
                  </p>
                </div>
              ) : (
                <form
                  id="card-form"
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col gap-4"
                >
                  <Input
                    {...register('title')}
                    label="Title"
                    placeholder="e.g. Design the landing page"
                    variant="bordered"
                    labelPlacement="outside"
                    autoFocus
                    errorMessage={errors.title?.message}
                    isInvalid={!!errors.title}
                  />
                  <Textarea
                    {...register('description')}
                    label="Description"
                    placeholder="Add more detail…"
                    variant="bordered"
                    labelPlacement="outside"
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      {...register('dueDate')}
                      type="date"
                      label="Due date"
                      variant="bordered"
                      labelPlacement="outside"
                    />
                    <Controller
                      control={control}
                      name="priority"
                      render={({ field }) => (
                        <Select
                          label="Priority"
                          variant="bordered"
                          labelPlacement="outside"
                          selectedKeys={field.value ? [field.value] : []}
                          onSelectionChange={(keys) =>
                            field.onChange(Array.from(keys)[0])
                          }
                        >
                          {PRIORITIES.map((p) => (
                            <SelectItem key={p.key}>{p.label}</SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                  </div>
                </form>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose} className="font-medium">
                {isReadOnly ? 'Close' : 'Cancel'}
              </Button>
              {!isReadOnly && (
                <Button
                  color="primary"
                  type="submit"
                  form="card-form"
                  isLoading={isLoading}
                  className="px-8 font-medium"
                >
                  {editingCard ? 'Save Changes' : 'Create Card'}
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
