import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateTask } from '@/hooks/useTasks'
import type { TaskPriority, TaskStatus } from '@/types'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  deadline: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface TaskCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskCreateDialog({ open, onOpenChange }: TaskCreateDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      deadline: '',
    },
  })

  const { mutateAsync: createTask, isPending } = useCreateTask()

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: any = {
        title: values.title,
        description: values.description || null,
        priority: values.priority as TaskPriority,
        status: values.status as TaskStatus,
      }

      if (values.deadline) {
        const d = new Date(values.deadline)
        if (!isNaN(d.getTime())) {
          payload.deadline = d.toISOString()
        }
      }

      await createTask(payload)
      toast.success('Tarefa criada com sucesso')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao criar tarefa')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar nova tarefa</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" placeholder="Ex: Implementar autenticação" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <RichTextEditor
              content={form.watch('description') || ''}
              onChange={(html) => form.setValue('description', html, { shouldDirty: true })}
              placeholder="Descreva a tarefa..."
              minHeight="120px"
              maxHeight="300px"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.watch('priority')} onValueChange={(v) => form.setValue('priority', v as FormValues['priority'], { shouldDirty: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v as FormValues['status'], { shouldDirty: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">A Fazer</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                  <SelectItem value="REVIEW">Em Revisão</SelectItem>
                  <SelectItem value="DONE">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input id="deadline" type="datetime-local" {...form.register('deadline')} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Criando…' : 'Criar tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
