'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useUserContext } from '@/context/UserContext'
import { addXpLog } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import XpBadge from '@/components/ui/XpBadge'
import { format } from 'date-fns'
import Image from 'next/image'

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
  avatar_url?: string | null
}

export default function TasksCouplePage() {
  const { user } = useUserContext()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [xpSettings, setXpSettings] = useState<any[]>([])
  const [view, setView] = useState<'open' | 'done'>('open')

  const [formTask, setFormTask] = useState({
    title: '',
    description: '',
    deadline: '',
    assigned_to: ''
  })

  useEffect(() => {
    fetchProfiles()
    fetchTasks()
    fetchXp()
  }, [])

  const fetchXp = async () => {
    const { data } = await supabase.from('xp_settings').select('*')
    if (data) setXpSettings(data)
  }

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, display_name, role, avatar_url')
    if (data) setProfiles(data)
  }

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks_couple')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setTasks(data)
  }

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
    setEditingTaskId(null)
    setFormTask({ title: '', description: '', deadline: '', assigned_to: '' })
  }

  const handleMarkDone = async (task: Task) => {
    await supabase
      .from('tasks_couple')
      .update({ done: true })
      .eq('id', task.id)

    const assigneeProfile = profiles.find(p => p.id === task.assigned_to)
    const userRole = assigneeProfile?.role || ''

    const { data } = await supabase
      .from('xp_settings')
      .select('xp')
      .eq('role', userRole)
      .eq('action', 'complete_task')
      .maybeSingle()

    const xpValue: number = data?.xp ?? 0

    if (xpValue > 0) {
      await addXpLog({
        user_id: task.assigned_to,
        role: userRole,
        change: xpValue,
        description: `Opgave fuldført: ${task.title}`
      })
    }

    fetchTasks()
  }

  const getDeadlineClass = (deadline: string | null) => {
    if (!deadline) return 'border-gray-300'

    const daysLeft = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysLeft <= 0) return 'border-red-500'
    if (daysLeft <= 2) return 'border-yellow-400'
    return 'border-green-400'
  }

  const activeTasks = tasks.filter(t => !t.done)
  const completedTasks = tasks.filter(t => t.done)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">🛠️ Fælles opgaver</h1>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setView('open')}
            className={`px-4 py-1 rounded-full border text-sm font-medium ${
              view === 'open' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Åbne opgaver
          </button>
          <button
            onClick={() => setView('done')}
            className={`px-4 py-1 rounded-full border text-sm font-medium ${
              view === 'done' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Lukkede opgaver
          </button>
        </div>
      </div>

      {view === 'open' && (
        <Card className="p-6 bg-gradient-to-r from-indigo-100 to-purple-100 shadow-xl rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">➕ {editingTaskId ? 'Rediger opgave' : 'Tilføj ny opgave'}</h2>
          <div className="grid gap-3">
            <div>
              <Label>Titel</Label>
              <Input value={formTask.title} onChange={(e) => setFormTask({ ...formTask, title: e.target.value })} />
            </div>
            <div>
              <Label>Beskrivelse</Label>
              <Input value={formTask.description || ''} onChange={(e) => setFormTask({ ...formTask, description: e.target.value })} />
            </div>
            <div>
              <Label>Deadline</Label>
              <Input type="date" value={formTask.deadline} onChange={(e) => setFormTask({ ...formTask, deadline: e.target.value })} />
            </div>
            <div>
              <Label>Ansvarlig</Label>
              <select
                className="border rounded p-2 w-full"
                value={formTask.assigned_to}
                onChange={(e) => setFormTask({ ...formTask, assigned_to: e.target.value })}
              >
                <option value="">Vælg person</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name}</option>
                ))}
              </select>
            </div>
            {editingTaskId ? (
              <div className="flex gap-2">
                <Button onClick={handleUpdateTask}>Gem ændringer</Button>
                <Button variant="destructive" onClick={() => handleDeleteTask(editingTaskId)}>Slet opgave</Button>
              </div>
            ) : (
              <Button onClick={handleAddTask}>Tilføj opgave</Button>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-6">
        {(view === 'open' ? activeTasks : completedTasks).map((task) => {
          const assignee = profiles.find(p => p.id === task.assigned_to)
          const xp = xpSettings.find(s => s.role === assignee?.role && s.action === 'complete_task')?.xp ?? 0

          return (
            <Card
              key={task.id}
              className={`p-4 rounded-xl shadow-md bg-white border-l-4 transition-all duration-300 ${
                task.done ? 'border-green-500' : getDeadlineClass(task.deadline)
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-purple-800">{task.title}</h2>
                  <p className="text-sm text-gray-600 mb-1">{task.description}</p>
                  <p className="text-sm">📅 Deadline: {task.deadline ? format(new Date(task.deadline), 'dd/MM/yyyy') : 'Ingen'}</p>
                  <p className="text-sm">👤 Ansvarlig: {assignee?.display_name || 'Ukendt'}</p>

                  {assignee && (
                    <div className="mt-1">
                      <XpBadge
                        xp={xp}
                        variant={task.done ? 'success' : 'default'}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  {assignee?.avatar_url && (
                    <Image src={assignee.avatar_url} alt="avatar" width={40} height={40} className="rounded-full border object-cover" />
                  )}

                  {!task.done ? (
                    <>
                      <Button onClick={() => handleMarkDone(task)} size="sm">✔️ Fuldfør</Button>
                      <Button onClick={() => handleEditTask(task)} size="sm" variant="secondary">✏️ Rediger</Button>
                    </>
                  ) : (
                    <p className="text-sm text-green-700 mt-1">
                      ✅ Fuldført: {format(new Date(task.created_at), 'dd/MM/yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
