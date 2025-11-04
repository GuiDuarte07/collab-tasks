import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import type { Task, TaskAssignment } from "@/types";
import { useUpdateTask } from "@/hooks/useTasks";
import api from "@/lib/api";

interface AddUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
}

interface PendingUser {
  identifier: string; // email ou username
  role: "RESPONSIBLE" | "WATCHER";
}

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  username: string;
}

export function AddUsersDialog({
  open,
  onOpenChange,
  task,
}: AddUsersDialogProps) {
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<PendingUser["role"]>("WATCHER");
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { mutateAsync: updateTask } = useUpdateTask();

  const addPending = () => {
    if (!identifier.trim()) return;
    setPending((prev) => [...prev, { identifier: identifier.trim(), role }]);
    setIdentifier("");
  };

  const removePending = (idx: number) => {
    setPending((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (pending.length === 0) {
      toast.error("Adicione ao menos um usuário");
      return;
    }
    try {
      setSubmitting(true);

      const queries = pending.map((p) => {
        const raw = p.identifier.trim();
        if (raw.includes("@") && !raw.startsWith("@")) {
          return { email: raw };
        }
        const handle = raw.startsWith("@") ? raw.slice(1) : raw;
        return { username: handle };
      });

      const { data: found } = await api.post<UserSearchResult[]>(
        "/users/find-many",
        queries
      );

      const resolvedUsers: Array<{ userId: string; role: string }> = [];
      pending.forEach((p) => {
        const raw = p.identifier.trim();
        const byEmail = raw.includes("@") && !raw.startsWith("@");
        const handle = raw.startsWith("@") ? raw.slice(1) : raw;

        const user = byEmail
          ? found.find((u) => u.email?.toLowerCase() === raw.toLowerCase())
          : found.find(
              (u) => u.username?.toLowerCase() === handle.toLowerCase()
            );

        if (!user) {
          toast.error(`Usuário não encontrado: ${p.identifier}`);
          return;
        }
        const roleValue = p.role === "RESPONSIBLE" ? "responsible" : "watcher";
        resolvedUsers.push({ userId: user.id, role: roleValue });
      });

      if (resolvedUsers.length === 0) {
        toast.error("Nenhum usuário válido para adicionar");
        return;
      }

      // 2. Merge with existing assignments (keep all current assignments)
      const currentAssignments: TaskAssignment[] = task.assignments || [];
      const existingAssignments = currentAssignments.map((a) => ({
        userId: a.userId,
        role: a.role,
      }));

      // Avoid duplicates by userId
      const newUserIds = new Set(resolvedUsers.map((u) => u.userId));
      const filteredExisting = existingAssignments.filter(
        (a) => !newUserIds.has(a.userId)
      );

      const allAssignments = [...filteredExisting, ...resolvedUsers];

      // 3. Update task with complete assignments list
      await updateTask({
        id: task.id,
        assignments: allAssignments as any,
      });

      toast.success("Usuários adicionados com sucesso");
      setPending([]);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Falha ao adicionar usuários");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar usuários</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Usuário (email ou username)</Label>
            <Input
              id="identifier"
              placeholder="ex: maria@empresa.com ou @maria"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPending();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Função</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as PendingUser["role"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESPONSIBLE">Responsável</SelectItem>
                <SelectItem value="WATCHER">Acompanhando</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={addPending}>
              Adicionar à lista
            </Button>
          </div>

          {pending.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">A adicionar</div>
              <ul className="space-y-1">
                {pending.map((p, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded border px-2 py-1 text-sm"
                  >
                    <span>
                      <span className="font-mono">{p.identifier}</span> —{" "}
                      {p.role === "RESPONSIBLE"
                        ? "Responsável"
                        : "Acompanhando"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removePending(idx)}
                    >
                      Remover
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Adicionando…" : "Confirmar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
