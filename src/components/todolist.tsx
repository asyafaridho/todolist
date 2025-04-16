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
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Task[];
      const unfinishedTasks = tasksData.filter((task) => !task.completed);
      setTasks(unfinishedTasks);
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
      background: '#f0fdf4',
      color: '#064e3b',
      icon: 'info',
      iconColor: '#34d399',
      showCancelButton: true,
      confirmButtonColor: '#86efac',
      cancelButtonColor: '#fca5a5',
      confirmButtonText: '✨ Tambah',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-xl shadow-lg',
      },
      preConfirm: () => {
        const taskName = (document.getElementById('swal-input1') as HTMLInputElement)?.value;
        const deadline = (document.getElementById('swal-input2') as HTMLInputElement)?.value;

        if (!taskName || !deadline) {
          Swal.showValidationMessage('Nama tugas dan tanggal harus diisi yaa');
          return false;
        }

        return [taskName, deadline];
      },
    });

    if (formValues) {
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
      background: '#f0fdf4',
      color: '#064e3b',
      icon: 'info',
      iconColor: '#34d399',
      showCancelButton: true,
      confirmButtonColor: '#86efac',
      cancelButtonColor: '#fca5a5',
      confirmButtonText: '✨ Simpan',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-xl shadow-lg',
      },
      preConfirm: () => {
        const taskName = (document.getElementById('swal-input1') as HTMLInputElement)?.value;
        const deadline = (document.getElementById('swal-input2') as HTMLInputElement)?.value;

        if (!taskName || !deadline) {
          Swal.showValidationMessage('Nama tugas dan tanggal harus diisi yaa ');
          return false;
        }

        return [taskName, deadline];
      },
    });

    if (formValues) {
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

    await MySwal.fire({
      title: '🎉 Mantap!',
      text: 'semangat terus ya buat jadi konsisten',
      icon: 'success',
      confirmButtonColor: '#86efac',
      background: '#f0fdf4',
      color: '#064e3b',
    });

    setTasks(tasks.filter((t) => t.id !== task.id));
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
    <div className="min-h-screen w-full bg-gradient-to-br from-green-100 via-emerald-100 to-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg p-6 rounded-xl shadow-xl bg-white border border-emerald-200">
        <h1 className="text-3xl text-emerald-600 font-extrabold mb-6 text-center drop-shadow-sm">
          🌿 To-Do List
        </h1>
        <div className="flex justify-center mb-6">
          <button
            onClick={addTask}
            className="bg-emerald-300 hover:bg-emerald-400 text-gray-800 transition-all duration-200 px-6 py-2 rounded-full shadow"
          >
            + Tambah Tugas
          </button>
        </div>
        <ul className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => {
              const timeLeft = calculateTimeRemaining(task.deadline);
              const isExpired = timeLeft === 'Waktu habis!';
              const taskColor = task.completed
                ? 'bg-emerald-100'
                : isExpired
                ? 'bg-rose-100'
                : 'bg-yellow-50';

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
                          : 'text-gray-700 font-medium'
                      }`}
                    >
                      {task.completed ? '✅ ' : '📌 '}
                      {task.text}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${
                        isExpired ? 'text-rose-500' : 'text-gray-500'
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
                      className="text-xs text-gray-800 px-2 py-1 rounded bg-blue-200 hover:bg-blue-300 transition"
                    >
                      ✏️ Edit
                    </button>
                    {!task.completed && (
                      <button
                        onClick={() => markAsCompleted(task)}
                        className="text-xs text-gray-800 px-2 py-1 rounded bg-emerald-200 hover:bg-emerald-300 transition"
                      >
                        ✅ Selesai
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs text-gray-800 px-2 py-1 rounded bg-rose-200 hover:bg-rose-300 transition"
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
