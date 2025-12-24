import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../services/api';
import Navbar from '../components/Navbar';
import ProgressBar from '../components/ProgressBar';


const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [error, setError] = useState('');

  // Filter and view state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [progressFilter, setProgressFilter] = useState('all'); // 'all', 'not-started', 'in-progress', 'completed'
  const [sortBy, setSortBy] = useState('title'); // 'title', 'progress', 'tasks'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.create(newProject);
      setShowModal(false);
      setNewProject({ title: '', description: '' });
      fetchProjects();
    } catch (err) {
        setError(err.message || 'Failed to create project');
    }
  };

  // Helper to get project status based on progress
  const getProjectStatus = (project) => {
    if (project.totalTasks === 0) return 'not-started';
    if (project.progressPercentage === 100) return 'completed';
    return 'in-progress';
  };

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Filter by search query
    if (searchQuery.trim()) {
      result = result.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by progress status
    if (progressFilter !== 'all') {
      result = result.filter(project => getProjectStatus(project) === progressFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'progress':
          comparison = (a.progressPercentage || 0) - (b.progressPercentage || 0);
          break;
        case 'tasks':
          comparison = (a.totalTasks || 0) - (b.totalTasks || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [projects, searchQuery, progressFilter, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Project Card for Grid View
  const ProjectGridCard = ({ project }) => (
    <Link
      to={`/projects/${project.id}`}
      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-4 ${
        getProjectStatus(project) === 'completed' ? 'border-green-500' :
        getProjectStatus(project) === 'in-progress' ? 'border-blue-500' : 'border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h2 className="text-xl font-semibold">{project.title}</h2>
        <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
          getProjectStatus(project) === 'completed' ? 'bg-green-100 text-green-800' :
          getProjectStatus(project) === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {getProjectStatus(project) === 'completed' ? 'Completed' :
           getProjectStatus(project) === 'in-progress' ? 'In Progress' : 'Not Started'}
        </span>
      </div>
      <p className="text-gray-600 mb-4 line-clamp-2">
        {project.description || 'No description'}
      </p>
      <ProgressBar
        progress={project.progressPercentage}
        completed={project.completedTasks}
        total={project.totalTasks}
      />
      <div className="flex items-center justify-end mt-3 pt-2 border-t border-gray-100">
        <span className="text-xs text-blue-500 flex items-center gap-1">
          View project
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );

  // Project Card for List View
  const ProjectListCard = ({ project }) => (
    <Link
      to={`/projects/${project.id}`}
      className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 border-l-4 block ${
        getProjectStatus(project) === 'completed' ? 'border-green-500' :
        getProjectStatus(project) === 'in-progress' ? 'border-blue-500' : 'border-gray-300'
      }`}
    >
      <div className="flex items-center gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-semibold">{project.title}</h2>
            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
              getProjectStatus(project) === 'completed' ? 'bg-green-100 text-green-800' :
              getProjectStatus(project) === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {getProjectStatus(project) === 'completed' ? 'Completed' :
               getProjectStatus(project) === 'in-progress' ? 'In Progress' : 'Not Started'}
            </span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-1">
            {project.description || 'No description'}
          </p>
        </div>
        <div className="w-48 flex-shrink-0">
          <ProgressBar
            progress={project.progressPercentage}
            completed={project.completedTasks}
            total={project.totalTasks}
          />
        </div>
        <span className="text-sm text-blue-500 flex items-center gap-1 flex-shrink-0">
          View
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Project
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Progress Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Status:</span>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'not-started', label: 'Not Started' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setProgressFilter(option.value)}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      progressFilter === option.value
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
                  <option value="title">Title</option>
                  <option value="progress">Progress</option>
                  <option value="tasks">Task Count</option>
                </select>
                <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                  {sortBy === 'title' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m4 0l4 4m0 0l4-4m-4 4V4" />
                    </svg>
                  )}
                  {sortBy === 'progress' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  {sortBy === 'tasks' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>

        {/* Projects Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectGridCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <ProjectListCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {filteredProjects.length === 0 && projects.length > 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500">No projects match your filters</p>
            <button
              onClick={() => { setSearchQuery(''); setProgressFilter('all'); }}
              className="mt-2 text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {projects.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No projects yet. Create your first project!</p>
          </div>
        )}

        {/* Create Project Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Create New Project</h2>
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    rows="3"
                  />
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
                    Create
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

export default Projects;