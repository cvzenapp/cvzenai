import { useState, useEffect } from 'react';
import { Users2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { companyApi } from '@/services/companyApi';
import TeamManager from '@/components/company/TeamManager';
import type { Company } from '../../../shared/recruiterAuth';

export const RecruiterTeamsManager: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await companyApi.getCompanyProfile();
      
      if (response.success && response.company) {
        setCompany(response.company);
      } else {
        setError('Company profile not found');
      }
    } catch (err) {
      console.error('Failed to load company:', err);
      setError('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamUpdate = async (teamMembers: any[]) => {
    if (!company) return;

    try {
      console.log('🔵 Starting team update...');
      
      const token = localStorage.getItem("recruiter_token");
      
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }
      
      const response = await fetch('/api/recruiter/company/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teamMembers })
      });

      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.success) {
          console.log('✅ Team update successful');
          setCompany(responseData.company);
        } else {
          console.error('❌ Team update failed:', responseData.message);
          alert('Team update failed: ' + (responseData.message || 'Unknown error'));
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Team update failed with status:', response.status, errorText);
        alert('Team update failed: ' + response.status);
      }
    } catch (err) {
      console.error('❌ Team update error:', err);
      alert('Team update failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Users2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-normal text-gray-900 mb-2">Unable to Load Team</h3>
          <p className="text-gray-500 mb-4">{error || 'Unable to load team members'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <TeamManager
        members={company.teamMembers || []}
        onUpdate={handleTeamUpdate}
      />
    </div>
  );
};
