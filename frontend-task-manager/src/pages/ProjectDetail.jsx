import { useState, useEffect, useMemo } from 'react';
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
  
  // New state for filters and view
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [sortBy, setSortBy] = useState('created'); // 'alpha', 'dueDate', 'created', 'status'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [selectedTask, setSelectedTask] = useState(null); // For task detail modal

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

  const handleToggleTask = async (taskId, e) => {
    e?.stopPropagation(); // Prevent opening detail modal
    try {
      const response = await taskAPI.toggle(id, taskId);
      // Update selectedTask if it's the one being toggled
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(response.data);
      }
      fetchData();
    } catch (err) {
      setError('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e?.stopPropagation(); // Prevent opening detail modal
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.delete(id, taskId);
        setSelectedTask(null);
        fetchData();
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  // Helper function to check if task is completed
  const isTaskCompleted = (task) => task.status === 'COMPLETED';

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by search query
    if (searchQuery.trim()) {
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(task => 
        statusFilter === 'completed' ? isTaskCompleted(task) : !isTaskCompleted(task)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'alpha':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate) - new Date(b.dueDate);
          break;
        case 'created':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, searchQuery, statusFilter, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Task Card Component for Grid View
  const TaskGridCard = ({ task }) => (
    <div
      onClick={() => setSelectedTask(task)}
      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 ${
        isTaskCompleted(task) ? 'border-green-500 opacity-75' : 'border-blue-500'
      }`}
    >
      <div className="flex items-start gap-3 mb-2">
        <input
          type="checkbox"
          checked={isTaskCompleted(task)}
          onChange={(e) => handleToggleTask(task.id, e)}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 cursor-pointer flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-semibold ${isTaskCompleted(task) ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
              isTaskCompleted(task) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {task.status}
            </span>
          </div>
        </div>
      </div>
      {task.description && (
        <p className="text-gray-600 text-sm line-clamp-2 mb-2 ml-8">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        {task.dueDate ? (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{task.dueDate}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">No due date</span>
        )}
        <span className="text-xs text-blue-500 flex items-center gap-1">
          Click for details
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  );

  // Task Card Component for List View
  const TaskListCard = ({ task }) => (
    <div
      onClick={() => setSelectedTask(task)}
      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${
        isTaskCompleted(task) ? 'border-green-500 opacity-75' : 'border-blue-500'
      }`}
    >
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={isTaskCompleted(task)}
          onChange={(e) => handleToggleTask(task.id, e)}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 cursor-pointer flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h3 className={`font-semibold ${isTaskCompleted(task) ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                isTaskCompleted(task) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {task.status}
              </span>
            </div>
          </div>
          {task.description && (
            <p className="text-gray-600 text-sm mt-1 line-clamp-1">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {task.dueDate && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{task.dueDate}</span>
            </div>
          )}
          <span className="text-xs text-blue-500 flex items-center gap-1 hover:text-blue-700">
            Details
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );

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

            {/* Tasks Header with Add Button */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Tasks</h2>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + Add Task
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Status:</span>
                  <div className="flex rounded-lg overflow-hidden border border-gray-300">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'completed', label: 'Completed' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setStatusFilter(option.value)}
                        className={`px-3 py-1.5 text-sm transition-colors ${
                          statusFilter === option.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Sort:</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer"
                    >
                      <option value="created">Created Date</option>
                      <option value="dueDate">Due Date</option>
                      <option value="alpha">Alphabetical</option>
                      <option value="status">Status</option>
                    </select>
                    <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                      {sortBy === 'created' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {sortBy === 'dueDate' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {sortBy === 'alpha' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m4 0l4 4m0 0l4-4m-4 4V4" />
                        </svg>
                      )}
                      {sortBy === 'status' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortOrder === 'asc' ? (
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">View:</span>
                  <div className="flex rounded-lg overflow-hidden border border-gray-300">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 transition-colors ${
                        viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Grid View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 transition-colors ${
                        viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      title="List View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Results count */}
              <div className="mt-3 text-sm text-gray-500">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </div>
            </div>

            {/* Tasks Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.map((task) => (
                  <TaskGridCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <TaskListCard key={task.id} task={task} />
                ))}
              </div>
            )}

            {filteredTasks.length === 0 && tasks.length > 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-500">No tasks match your filters</p>
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}

            {tasks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-gray-500">No tasks yet. Add your first task!</p>
              </div>
            )}
          </>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedTask(null)}>
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={isTaskCompleted(selectedTask)}
                      onChange={(e) => handleToggleTask(selectedTask.id, e)}
                      className="w-6 h-6 cursor-pointer"
                    />
                    <h2 className={`text-xl font-bold ${isTaskCompleted(selectedTask) ? 'line-through text-gray-500' : ''}`}>
                      {selectedTask.title}
                    </h2>
                  </div>
                  <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${
                    isTaskCompleted(selectedTask) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedTask.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedTask.description || 'No description provided'}
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Due Date
                    </h3>
                    <p className="text-gray-600 bg-orange-50 p-2 rounded-lg text-sm">
                      {selectedTask.dueDate || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Created
                    </h3>
                    <p className="text-gray-600 bg-blue-50 p-2 rounded-lg text-sm">
                      {selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => handleDeleteTask(selectedTask.id, e)}
                  className="text-red-500 hover:text-red-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Task
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
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