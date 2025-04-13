'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../app/lib/firebase';

const MySwal = withReactContent(Swal);

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        if (!task.completed) {
          newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
        } else {
          newTimeRemaining[task.id] = 'Selesai';
        }
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return 'Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}s`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await MySwal.fire({
      title: '🌟 Tambah Tugas Baru',
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <input id="swal-input1" class="swal2-input" placeholder="📝 Nama tugas" />
          <input id="swal-input2" type="datetime-local" class="swal2-input" />
        </div>
      `,
      background: '#222222',
      color: '#10b981',
      icon: 'info',
      iconColor: '#34d399',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#f87171',
      confirmButtonText: '✨ Tambah',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-xl shadow-lg',
      },
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const editTask = async (task: Task): Promise<void> => {
    const { value: formValues } = await MySwal.fire({
      title: '🌟 Edit Tugas',
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <input id="swal-input1" class="swal2-input" value="${task.text}" />
          <input id="swal-input2" type="datetime-local" class="swal2-input" value="${task.deadline}" />
        </div>
      `,
      background: '#222222',
      color: '#10b981',
      icon: 'info',
      iconColor: '#34d399',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#f87171',
      confirmButtonText: '✨ Simpan',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-xl shadow-lg',
      },
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const updatedTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: task.completed,
        deadline: formValues[1],
      };
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, updatedTask);
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, ...updatedTask } : t)));
    }
  };

  const markAsCompleted = async (task: Task): Promise<void> => {
    const updatedTask = { ...task, completed: true };
    const taskRef = doc(db, 'tasks', task.id);
    await updateDoc(taskRef, updatedTask);
    setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('id-ID', options);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-green-800 to-black flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg p-6 rounded-xl shadow-2xl bg-black/90 backdrop-blur-md border border-green-500">
        <h1 className="text-3xl text-green-400 font-extrabold mb-6 text-center drop-shadow-lg">
          🌿 To-Do List
        </h1>
        <div className="flex justify-center mb-6">
          <button
            onClick={addTask}
            className="bg-green-600 hover:bg-green-700 transition-all duration-200 text-white px-6 py-2 rounded-full shadow-md"
          >
            + Tambah Tugas
          </button>
        </div>
        <ul className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => {
              const timeLeft = calculateTimeRemaining(task.deadline);
              const isExpired = timeLeft === 'Waktu habis!'
              const taskColor = task.completed
                ? 'bg-green-100'
                : isExpired
                ? 'bg-red-100'
                : 'bg-yellow-100';

              return (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 rounded-xl shadow-sm ${taskColor}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      onClick={() => toggleTask(task.id)}
                      className={`cursor-pointer ${
                        task.completed
                          ? 'line-through text-gray-400'
                          : 'text-gray-800 font-medium'
                      }`}
                    >
                      {task.completed ? '✅ ' : '📌 '}
                      {task.text}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${
                        isExpired ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      {timeRemaining[task.id] || 'Belum ada deadline'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Deadline: {formatDate(task.deadline)}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => editTask(task)}
                      className="text-xs text-white px-2 py-1 rounded bg-blue-500 hover:bg-blue-700 transition"
                    >
                      ✏️ Edit
                    </button>
                    {!task.completed && (
                      <button
                        onClick={() => markAsCompleted(task)}
                        className="text-xs text-white px-2 py-1 rounded bg-green-500 hover:bg-green-700 transition"
                      >
                        ✅ Selesai
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs text-white px-2 py-1 rounded bg-red-500 hover:bg-red-700 transition"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
