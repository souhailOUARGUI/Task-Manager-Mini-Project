import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectAPI, taskAPI } from '../services/api';
import Navbar from '../components/Navbar';
import ProgressBar from '../components/ProgressBar';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        projectAPI.getById(id),
        taskAPI.getByProject(id),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskAPI.create(id, newTask);
      setShowModal(false);
      setNewTask({ title: '', description: '', dueDate: '' });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await taskAPI.toggle(id, taskId);
      fetchData();
    } catch (err) {
      setError('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.delete(id, taskId);
        fetchData();
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  // Helper function to check if task is completed
  const isTaskCompleted = (task) => task.status === 'COMPLETED';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Projects
        </Link>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {project && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
              <p className="text-gray-600 mb-4">{project.description || 'No description'}</p>
              <ProgressBar
                progress={project.progressPercentage}
                completed={project.completedTasks}
                total={project.totalTasks}
              />
            </div>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Tasks</h2>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + Add Task
              </button>
            </div>

            <div className="space-y-3 max-w-3xl mx-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg shadow-md p-4 ${
                    isTaskCompleted(task) ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isTaskCompleted(task)}
                      onChange={() => handleToggleTask(task.id)}
                      className="w-5 h-5 cursor-pointer mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className={`font-semibold text-lg ${isTaskCompleted(task) ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </h3>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                          isTaskCompleted(task) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        {task.dueDate ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Due: {task.dueDate}</span>
                          </div>
                        ) : (
                          <div></div>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {tasks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-500">No tasks yet. Add your first task!</p>
              </div>
            )}
          </>
        )}

        {/* Task Modal  */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add New Task</h2>
              <form onSubmit={handleCreateTask}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    rows="3"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Must be today or in the future</p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;