import { z } from 'zod'

export const boardSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
})

export const columnSchema = z.object({
  title: z.string().min(1, 'Title is required'),
})

export const cardSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
})

export type BoardFormData = z.infer<typeof boardSchema>
export type ColumnFormData = z.infer<typeof columnSchema>
export type CardFormData = z.infer<typeof cardSchema>
