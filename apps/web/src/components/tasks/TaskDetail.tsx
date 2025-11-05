import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Task, TaskStatus, TaskAssignment } from '@/types';
import { Calendar, User, Clock, ChevronDown, Plus, X } from 'lucide-react';
import { AddUsersDialog } from './AddUsersDialog';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { useEffect, useMemo, useState } from 'react';
import { useUpdateTask } from '@/hooks/useTasks';
import { useUser } from '@/hooks/useUsers';
import { toast } from 'sonner';
import { RichTextViewer } from '@/components/ui/rich-text-viewer';

interface TaskDetailProps {
  task: Task;
  open: boolean;
  onClose: () => void;
}

export function TaskDetail({ task, open, onClose }: TaskDetailProps) {
  const priorityColors = {
    LOW: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    MEDIUM: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    HIGH: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    URGENT: 'bg-red-100 text-red-800 hover:bg-red-100',
  };

  const priorityLabels = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  };

  const statusLabels: Record<TaskStatus, string> = {
    TODO: 'A Fazer',
    IN_PROGRESS: 'Em Progresso',
    REVIEW: 'Em Revisão',
    DONE: 'Concluído',
  };

  const statusColors: Record<TaskStatus, string> = {
    TODO: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    REVIEW: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    DONE: 'bg-green-100 text-green-800 hover:bg-green-100',
  };

  const [currentTask, setCurrentTask] = useState<Task>(task);
  useEffect(() => setCurrentTask(task), [task]);

  const { mutateAsync: updateTask, isPending } = useUpdateTask();
  const { data: creator } = useUser(currentTask.createdBy);

  const otherStatuses = useMemo(
    () => (['TODO','IN_PROGRESS','REVIEW','DONE'] as TaskStatus[]).filter(s => s !== currentTask.status),
    [currentTask.status]
  );

  const otherPriorities = useMemo(
    () => (['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).filter(p => p !== currentTask.priority),
    [currentTask.priority]
  );

  const handleChangeStatus = async (newStatus: TaskStatus) => {
    try {
      await updateTask({ id: currentTask.id, status: newStatus });
      setCurrentTask(prev => ({ ...prev, status: newStatus }));
      toast.success(`Status atualizado para ${statusLabels[newStatus]}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Falha ao atualizar status');
    }
  };

  const handleChangePriority = async (newPriority: typeof currentTask.priority) => {
    try {
      await updateTask({ id: currentTask.id, priority: newPriority });
      setCurrentTask(prev => ({ ...prev, priority: newPriority }));
      toast.success(`Prioridade atualizada para ${priorityLabels[newPriority]}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Falha ao atualizar prioridade');
    }
  };

  const assignments = currentTask.assignments || [];
  const isRole = (role: string | undefined, includes: string[]) =>
    !!role && includes.some((r) => role.toLowerCase().includes(r));

  const creatorName = creator?.name || creator?.username || currentTask.createdBy || 'Desconhecido';

  const responsaveis = assignments.filter((a) =>
    isRole(a.role, ['responsible', 'owner', 'assignee'])
  );
  const watchers = assignments.filter((a) =>
    isRole(a.role, ['watch', 'follower', 'observer'])
  );

  const renderUserChip = (assignment: TaskAssignment) => {
    const displayName = assignment.name || assignment.username || assignment.userId;
    const hasUserData = !!(assignment.name || assignment.username);
    
    return (
      <span
        key={assignment.userId}
        className="group inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:border-destructive/50 transition-colors"
        title={hasUserData ? `${assignment.name} (@${assignment.username})` : assignment.userId}
      >
        <span>{displayName}</span>
        <button
          type="button"
          onClick={() => handleRemoveUser(assignment.userId)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remover usuário"
        >
          <X className="h-3 w-3 text-destructive" />
        </button>
      </span>
    );
  };

  const [openAddUsers, setOpenAddUsers] = useState(false);

  const handleRemoveUser = async (userId: string) => {
    try {
      const currentAssignments = currentTask.assignments || [];
      const updatedAssignments = currentAssignments
        .filter((a) => a.userId !== userId)
        .map((a) => ({ userId: a.userId, role: a.role }));

      await updateTask({
        id: currentTask.id,
        assignments: updatedAssignments as any,
      });

      setCurrentTask((prev) => ({
        ...prev,
        assignments: prev.assignments?.filter((a) => a.userId !== userId),
      }));

      toast.success('Usuário removido da tarefa');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Falha ao remover usuário');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="flex-1">{task.title}</DialogTitle>
            <Badge className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
          </div>
        </DialogHeader>

        <div className="w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: title, description, comments */}
            <div className="md:col-span-2 space-y-4">
              {currentTask.description && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <RichTextViewer html={currentTask.description} />
                </div>
              )}

              {/* Comments */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-base font-semibold">Comentários</h3>
                <CommentForm taskId={currentTask.id} />
                <CommentList taskId={currentTask.id} />
              </div>
            </div>

            {/* Right: sidebar info & quick actions */}
            <div className="md:col-span-1 space-y-5">
              <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Prioridade</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className={priorityColors[currentTask.priority] + ' h-7 gap-1'}
                        disabled={isPending}
                      >
                        {priorityLabels[currentTask.priority]}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {otherPriorities.map((p) => (
                        <DropdownMenuItem key={p} onClick={() => handleChangePriority(p)}>
                          {priorityLabels[p]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="h-px bg-border" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className={statusColors[currentTask.status] + ' h-7 gap-1'}
                        disabled={isPending}
                      >
                        {statusLabels[currentTask.status]}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {otherStatuses.map((s) => (
                        <DropdownMenuItem key={s} onClick={() => handleChangeStatus(s)}>
                          {statusLabels[s]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-1">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <User className="h-4 w-4" /> Criado por
                  </span>
                  <span className="text-sm text-muted-foreground">{creatorName}</span>
                </div>

                {currentTask.deadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Prazo
                    </span>
                    <span className="text-sm">
                      {new Date(currentTask.deadline).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Criado em
                  </span>
                  <span className="text-sm">
                    {new Date(currentTask.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <User className="h-4 w-4" /> Responsável
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {responsaveis.length > 0 ? `${responsaveis.length} usuário(s)` : 'Não definido'}
                    </span>
                  </div>
                  {responsaveis.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {responsaveis.map((a) => renderUserChip(a))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <User className="h-4 w-4" /> Acompanhando
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {watchers.length > 0 ? `${watchers.length} usuário(s)` : 'Nenhum'}
                    </span>
                  </div>
                  {watchers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {watchers.map((a) => renderUserChip(a))}
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <Button size="sm" variant="secondary" className="w-full gap-1" onClick={() => setOpenAddUsers(true)}>
                    <Plus className="h-4 w-4" /> Adicionar usuários
                  </Button>
                </div>
              </div>
              <AddUsersDialog open={openAddUsers} onOpenChange={setOpenAddUsers} task={currentTask} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
