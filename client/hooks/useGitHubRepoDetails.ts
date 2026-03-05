import { useState, useEffect } from 'react';
import { fetchGitHubRepoDetailsWithCache, fetchUserRepositoriesWithCache, GitHubRepoDetails } from '@/services/githubApi';

/**
 * Hook to fetch all repositories for a GitHub user profile
 */
export function useGitHubUserRepositories(githubProfileUrl?: string) {
  const [repositories, setRepositories] = useState<GitHubRepoDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!githubProfileUrl) {
      setRepositories([]);
      setLoading(false);
      setError(null);
      return;
    }

    console.log('🔄 GitHub hook triggered with URL:', githubProfileUrl);

    let cancelled = false;

    const fetchRepos = async () => {
      setLoading(true);
      setError(null);

      try {
        const repos = await fetchUserRepositoriesWithCache(githubProfileUrl);
        
        if (!cancelled) {
          setRepositories(repos);
          if (repos.length === 0) {
            setError('No repositories found or invalid GitHub profile');
          }
          console.log('✅ GitHub repositories loaded:', repos.length);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to fetch repositories');
          console.error('Error fetching GitHub repositories:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRepos();

    return () => {
      cancelled = true;
    };
  }, [githubProfileUrl]);

  return { repositories, loading, error };
}

/**
 * Hook to fetch GitHub repository details for a project
 */
export function useGitHubRepoDetails(githubUrl?: string) {
  const [details, setDetails] = useState<GitHubRepoDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!githubUrl) {
      setDetails(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const repoDetails = await fetchGitHubRepoDetailsWithCache(githubUrl);
        
        if (!cancelled) {
          if (repoDetails) {
            setDetails(repoDetails);
          } else {
            setError('Could not fetch repository details');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to fetch repository details');
          console.error('Error fetching GitHub details:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [githubUrl]);

  return { details, loading, error };
}

/**
 * Hook to fetch GitHub details for multiple projects
 */
export function useGitHubRepoDetailsForProjects(
  projects: Array<{ id: string; github?: string }>
) {
  const [detailsMap, setDetailsMap] = useState<Map<string, GitHubRepoDetails>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projects || projects.length === 0) {
      setDetailsMap(new Map());
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchAllDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const newDetailsMap = new Map<string, GitHubRepoDetails>();

        // Fetch details for each project with GitHub URL
        const promises = projects
          .filter(p => p.github)
          .map(async (project) => {
            if (!project.github) return;

            try {
              const details = await fetchGitHubRepoDetailsWithCache(project.github);
              if (details && !cancelled) {
                newDetailsMap.set(project.id, details);
              }
            } catch (err) {
              console.error(`Error fetching GitHub details for project ${project.id}:`, err);
            }
          });

        await Promise.all(promises);

        if (!cancelled) {
          setDetailsMap(newDetailsMap);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to fetch repository details');
          console.error('Error fetching GitHub details:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAllDetails();

    return () => {
      cancelled = true;
    };
  }, [projects]);

  return { detailsMap, loading, error };
}
