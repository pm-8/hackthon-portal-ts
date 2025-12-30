import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

// Types
interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
}

const KanbanBoard = () => {
  const { teamId } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // 1. Fetch Tasks
  useEffect(() => {
    fetchTasks();
  }, [teamId]);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get(`/tasks/${teamId}`);
      setTasks(data);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const { data } = await api.post('/tasks/create', {
        teamId,
        title: newTaskTitle,
        description: '', // Optional for now
      });
      setTasks([...tasks, data]); // Add to UI instantly
      setNewTaskTitle('');
      toast.success('Task added!');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  // 3. Handle Drag & Drop Logic
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a column? Do nothing.
    if (!destination) return;

    // Dropped in the same place? Do nothing.
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // Optimistic UI Update: Move the task in the UI immediately
    const newStatus = destination.droppableId as Task['status'];
    
    // Create a new array to avoid mutating state directly
    const updatedTasks = tasks.map(t => 
      t._id === draggableId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    // API Call to save the change
    try {
      await api.patch(`/tasks/${draggableId}/status`, { status: newStatus });
    } catch (error) {
      toast.error('Failed to move task');
      fetchTasks(); // Revert changes on error
    }
  };

  // 4. Handle Delete
  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // Helper to filter tasks by column
  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Kanban Board</h1>

        {/* Add Task Input */}
        <form onSubmit={handleCreateTask} className="mb-10 flex gap-4 max-w-xl">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-teal-400 outline-none"
          />
          <button 
            type="submit"
            className="bg-slate-800 text-white px-6 py-3 rounded-xl hover:bg-slate-900 transition flex items-center gap-2 font-medium"
          >
            <Plus size={20} /> Add
          </button>
        </form>

        {/* The Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['todo', 'in-progress', 'done'].map((columnId) => (
              <div key={columnId} className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
                <h2 className="text-lg font-bold text-slate-600 mb-4 uppercase tracking-wider flex justify-between">
                  {columnId.replace('-', ' ')}
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-sm">
                    {getTasksByStatus(columnId).length}
                  </span>
                </h2>
                
                <Droppable droppableId={columnId}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3 min-h-[200px]"
                    >
                      {getTasksByStatus(columnId).map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition group"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                  <GripVertical className="text-slate-300 w-5 h-5 cursor-grab" />
                                  <span className="text-slate-700 font-medium">{task.title}</span>
                                </div>
                                <button 
                                  onClick={() => handleDelete(task._id)}
                                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default KanbanBoard;