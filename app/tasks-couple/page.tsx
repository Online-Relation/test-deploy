// /app/tasks-couple/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useUserContext } from '@/context/UserContext'
import { getXpSettings } from '@/lib/getXpSettings'
import { addXpLog } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'

interface Task {
  id: string
  title: string
  description: string | null
  deadline: string | null
  assigned_to: string
  done: boolean
  created_at: string
}

interface Profile {
  id: string
  display_name: string
  role: string
}

export default function TasksCouplePage() {
  const { user } = useUserContext()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [formTask, setFormTask] = useState({
    title: '',
    description: '',
    deadline: '',
    assigned_to: ''
  })

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, display_name, role')
    if (data) setProfiles(data)
  }

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks_couple')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setTasks(data)
  }

  useEffect(() => {
    fetchProfiles()
    fetchTasks()
  }, [])

  const handleAddTask = async () => {
    if (!formTask.title || !formTask.assigned_to) return

    await supabase.from('tasks_couple').insert({
      ...formTask,
      deadline: formTask.deadline || null
    })
    setFormTask({ title: '', description: '', deadline: '', assigned_to: '' })
    fetchTasks()
  }

  const handleUpdateTask = async () => {
    if (!editingTaskId) return

    await supabase
      .from('tasks_couple')
      .update({
        ...formTask,
        deadline: formTask.deadline || null
      })
      .eq('id', editingTaskId)

    setEditingTaskId(null)
    setFormTask({ title: '', description: '', deadline: '', assigned_to: '' })
    fetchTasks()
  }

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setFormTask({
      title: task.title,
      description: task.description || '',
      deadline: task.deadline || '',
      assigned_to: task.assigned_to
    })
  }

  const handleDeleteTask = async (id: string) => {
    await supabase.from('tasks_couple').delete().eq('id', id)
    fetchTasks()
  }

  const handleMarkDone = async (task: Task) => {
    await supabase
      .from('tasks_couple')
      .update({ done: true })
      .eq('id', task.id)

    const xpSettings = await getXpSettings()
    const xpValue: number = (xpSettings as any)?.['complete_task'] ?? 0

    if (xpValue > 0) {
      const userRole = profiles.find(p => p.id === task.assigned_to)?.role || ''
      await addXpLog({
        user_id: task.assigned_to,
        role: userRole,
        change: xpValue,
        description: `Opgave fuldført: ${task.title}`
      })
    }

    fetchTasks()
  }

  const activeTasks = tasks.filter(t => !t.done)
  const completedTasks = tasks.filter(t => t.done)

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Fælles opgaver</h1>

      <div className="grid gap-4">
        {[...activeTasks, ...completedTasks].map((task) => (
          <Card key={task.id} className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{task.title}</h2>
              <div className="flex gap-2">
                {!task.done && (
                  <Button onClick={() => handleMarkDone(task)} size="sm">Fuldfør</Button>
                )}
                <Button onClick={() => handleEditTask(task)} size="sm" className="btn btn-secondary">Rediger</Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">{task.description}</p>
            <p className="text-sm">Deadline: {task.deadline ? format(new Date(task.deadline), 'dd/MM/yyyy') : 'Ingen'}</p>
            <p className="text-sm">Ansvarlig: {profiles.find(p => p.id === task.assigned_to)?.display_name || 'Ukendt'}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 space-y-3 max-w-md">
        <h2 className="text-lg font-semibold">{editingTaskId ? 'Rediger opgave' : 'Tilføj ny opgave'}</h2>

        <Label>Titel</Label>
        <Input value={formTask.title} onChange={(e) => setFormTask({ ...formTask, title: e.target.value })} />

        <Label>Beskrivelse</Label>
        <Input value={formTask.description || ''} onChange={(e) => setFormTask({ ...formTask, description: e.target.value })} />

        <Label>Deadline</Label>
        <Input type="date" value={formTask.deadline} onChange={(e) => setFormTask({ ...formTask, deadline: e.target.value })} />

        <Label>Ansvarlig</Label>
        <select
          className="border rounded p-2 w-full"
          value={formTask.assigned_to}
          onChange={(e) => setFormTask({ ...formTask, assigned_to: e.target.value })}>
          <option value="">Vælg person</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.display_name}</option>
          ))}
        </select>

        {editingTaskId ? (
          <div className="flex gap-2">
            <Button onClick={handleUpdateTask}>Gem ændringer</Button>
            <Button variant="destructive" onClick={() => handleDeleteTask(editingTaskId)}>Slet opgave</Button>
          </div>
        ) : (
          <Button onClick={handleAddTask}>Tilføj opgave</Button>
        )}
      </Card>
    </div>
  )
}
