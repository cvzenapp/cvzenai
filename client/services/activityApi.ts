/**
 * Activity API Service
 * Fetches real user activity data including shortlists and upvotes
 */

interface ActivityItem {
  id: string;
  type: 'shortlist' | 'upvote' | 'view' | 'download';
  message: string;
  time: string;
  recruiterName?: string;
  companyName?: string;
  createdAt: string;
}

interface ActivityResponse {
  success: boolean;
  data: {
    activities: ActivityItem[];
    stats: {
      totalShortlists: number;
      totalUpvotes: number;
      totalViews: number;
      totalDownloads: number;
    };
  };
  error?: string;
}

class ActivityApiService {
  private baseUrl = '/api';

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  /**
   * Fetch user's recent activity
   */
  async getRecentActivity(): Promise<ActivityResponse> {
    try {
      // Get user ID from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      const user = JSON.parse(userStr);
      const userId = user.id;

      const response = await fetch(`${this.baseUrl}/dashboard/activities/${userId}?limit=10`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const activities = await response.json();
      
      // Transform the response to match expected format
      return {
        success: true,
        data: {
          activities: activities.map((activity: any) => ({
            id: activity.id,
            type: activity.activity_type,
            message: activity.description,
            time: activity.timestamp,
            recruiterName: activity.metadata?.recruiterName,
            companyName: activity.metadata?.company,
            createdAt: activity.created_at
          })),
          stats: {
            totalShortlists: 0,
            totalUpvotes: 0,
            totalViews: 0,
            totalDownloads: 0
          }
        }
      };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return {
        success: false,
        data: {
          activities: [],
          stats: {
            totalShortlists: 0,
            totalUpvotes: 0,
            totalViews: 0,
            totalDownloads: 0
          }
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch activity stats only
   */
  async getActivityStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/activity/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const activityApi = new ActivityApiService();
export type { ActivityItem, ActivityResponse };