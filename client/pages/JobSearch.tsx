import React from 'react';
import { JobSearchInterface } from '../components/JobSearchInterface';
import AppHeader from '../components/AppHeader';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Home, User, Briefcase } from 'lucide-react';

export function JobSearch() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader>
        <nav className="flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link to="/builder">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
              <User className="h-4 w-4 mr-2" />
              Resume Builder
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
            <Briefcase className="h-4 w-4 mr-2" />
            Job Search
          </Button>
        </nav>
      </AppHeader>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <JobSearchInterface />
      </main>
    </div>
  );
}