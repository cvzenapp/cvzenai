import { Link } from 'react-router-dom';
import { Users, Search, Calendar, BarChart3 } from 'lucide-react';
import RecruiterFooter from '@/components/RecruiterFooter';

export default function RecruiterLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/recruiter" className="flex items-center gap-2">
              <img 
                src="/assets/cvzen_logo.png" 
                alt="CVZen Logo" 
                className="h-10 w-auto"
              />
              <span className="text-slate-300 text-sm">Recruiter Portal</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/recruiter/dashboard" className="text-slate-300 hover:text-white transition-colors">Dashboard</Link>
              <Link to="/recruiter/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="hero-title text-4xl lg:text-6xl text-gray-900 mb-6">
            Find Top Talent with CVZen
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Access thousands of qualified candidates, streamline your hiring process, 
            and build your dream team with our comprehensive recruiter platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/recruiter/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Recruiting
            </Link>
            <Link 
              to="/recruiter/login" 
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Powerful Recruiting Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to find, evaluate, and hire the best candidates
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Search</h3>
              <p className="text-gray-600">
                Find candidates using advanced filters and AI-powered matching
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Candidate Management</h3>
              <p className="text-gray-600">
                Organize and track candidates through your hiring pipeline
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Interview Scheduling</h3>
              <p className="text-gray-600">
                Schedule and manage interviews with integrated calendar tools
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h3>
              <p className="text-gray-600">
                Track hiring metrics and optimize your recruitment process
              </p>
            </div>
          </div>
        </div>
      </section>

      <RecruiterFooter />
    </div>
  );
}