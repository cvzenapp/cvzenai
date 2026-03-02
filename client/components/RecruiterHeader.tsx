import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/recruiterSlice';
import { Button } from '@/components/ui/button';
import { User, LogOut, Building2 } from 'lucide-react';

const RecruiterHeader: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.recruiter);

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Recruiter info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {user.avatar ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                ) : (
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Recruiter
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Building2 className="h-3 w-3" />
                  <span>{user.jobTitle} at {user.company.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterHeader;