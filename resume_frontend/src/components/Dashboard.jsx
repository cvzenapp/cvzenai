import { API_BASE_URL } from "../config"
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'

const Dashboard = () => {
  const { user, logout, token } = useAuth()
  const navigate = useNavigate()
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (token) {
      fetchResumes()
    } else {
      setLoading(false)
      setError('Please log in to view your resumes')
    }
  }, [token])

  const fetchResumes = async () => {
    try {
      setError('') // Clear previous errors
      const response = await fetch(`${API_BASE_URL}/api/resumes/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Fetched resumes data:', data) // Added log to check data structure
        console.log('Type of data:', typeof data)
        console.log('Data keys:', Object.keys(data))
        console.log('data.resumes:', data.resumes)
        console.log('Array.isArray(data.resumes):', Array.isArray(data.resumes))
        
        // Handle different possible response structures
        let resumesArray = []
        if (Array.isArray(data)) {
          resumesArray = data
        } else if (Array.isArray(data.resumes)) {
          resumesArray = data.resumes
        } else if (Array.isArray(data.data)) {
          resumesArray = data.data
        }
        
        console.log('Final resumes array:', resumesArray)
        setResumes(resumesArray)
      } else if (response.status === 401) {
        setError('Session expired. Please log in again.')
        logout()
      } else {
        setError('Failed to load resumes. Please try again.')
      }
    } catch (error) {
      console.error('Error fetching resumes:', error)
      setError('Unable to connect to server. Please check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setResumes(resumes.filter(resume => resume.id !== resumeId))
        setError('') // Clear any previous errors
      } else {
        setError('Failed to delete resume. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting resume:', error)
      setError('Unable to delete resume. Please check your connection.')
    }
  }

  const filteredResumes = resumes.filter(resume =>
    resume.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">cv</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    cvZen
                  </h1>
                  <p className="text-sm text-gray-500">Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                to="/upload" 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                + New Resume
              </Link>
              
              <div className="relative">
                <button 
                  onClick={logout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-300"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome back, {user?.first_name || user?.username}! 👋
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Manage your professional resumes and create new ones to land your dream job with cvZen's AI-powered tools.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8 flex justify-center">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search your resumes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-sm"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-700 font-medium">{error}</p>
                  <button 
                    onClick={fetchResumes}
                    className="text-red-600 hover:text-red-800 text-sm underline mt-1"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resumes Grid */}
          {filteredResumes.length === 0 && !error ? (
            <div className="text-center py-16">
              <div className="mx-auto h-24 w-24 text-6xl mb-6">📄</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No resumes yet</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Get started by creating your first professional resume with our AI-powered tools.
              </p>
              <Link 
                to="/upload"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-block"
              >
                Create Your First Resume
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredResumes.map((resume) => (
                <div key={resume.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-6 border border-gray-100 transform hover:-translate-y-1">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                      {resume.title}
                    </h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Created: {formatDate(resume.created_at)}
                      </p>
                      {resume.updated_at !== resume.created_at && (
                        <p className="flex items-center">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Updated: {formatDate(resume.updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-3">
                      <Link 
                        to={`/resume/${resume.id}/edit`}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Edit
                      </Link>
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-300">
                        Download
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteResume(resume.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors p-2 rounded-lg hover:bg-red-50"
                      title="Delete resume"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard

