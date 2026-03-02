/**
 * GitHub API Service
 * Fetches repository details from GitHub API
 */

export interface GitHubRepoDetails {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  watchers: number;
  language: string | null;
  topics: string[];
  openIssues: number;
  createdAt: string;
  updatedAt: string;
  homepage: string | null;
  license: string | null;
  defaultBranch: string;
  htmlUrl: string;
}

/**
 * Extract owner and repo name from GitHub URL
 * Supports various GitHub URL formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - github.com/owner/repo
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    // Remove .git suffix if present
    const cleanUrl = url.replace(/\.git$/, '');
    
    // Handle SSH format: git@github.com:owner/repo
    if (cleanUrl.includes('git@github.com:')) {
      const match = cleanUrl.match(/git@github\.com:([^/]+)\/(.+)/);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    }
    
    // Handle HTTPS format: https://github.com/owner/repo
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing GitHub URL:', error);
    return null;
  }
}

/**
 * Extract GitHub username from profile URL
 * Supports various GitHub URL formats:
 * - https://github.com/username
 * - github.com/username
 */
function extractGitHubUsername(url: string): string | null {
  try {
    const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
    const match = cleanUrl.match(/github\.com\/([^/]+)\/?$/);
    if (match) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error('Error extracting GitHub username:', error);
    return null;
  }
}

/**
 * Fetch all public repositories for a GitHub user
 */
export async function fetchUserRepositories(
  githubProfileUrl: string
): Promise<GitHubRepoDetails[]> {
  try {
    const username = extractGitHubUsername(githubProfileUrl);
    if (!username) {
      console.warn('Invalid GitHub profile URL:', githubProfileUrl);
      return [];
    }

    const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`;

    console.log(`🔍 Fetching repositories for GitHub user: ${username}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CVZen-Resume-Builder',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`GitHub user not found: ${username}`);
        return [];
      }
      if (response.status === 403) {
        console.warn('GitHub API rate limit exceeded');
        return [];
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    const repositories: GitHubRepoDetails[] = data
      .filter((repo: any) => !repo.fork) // Exclude forked repositories
      .map((repo: any) => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        language: repo.language,
        topics: repo.topics || [],
        openIssues: repo.open_issues_count,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        homepage: repo.homepage,
        license: repo.license?.name || null,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
      }));

    console.log(`✅ Fetched ${repositories.length} repositories for ${username}`);
    return repositories;
  } catch (error) {
    console.error('Error fetching user repositories:', error);
    return [];
  }
}

/**
 * Fetch repository details from GitHub API
 * Uses the public GitHub API (no authentication required for public repos)
 */
export async function fetchGitHubRepoDetails(
  githubUrl: string
): Promise<GitHubRepoDetails | null> {
  try {
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      console.warn('Invalid GitHub URL:', githubUrl);
      return null;
    }

    const { owner, repo } = parsed;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    console.log(`🔍 Fetching GitHub repo details: ${owner}/${repo}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add User-Agent to avoid rate limiting issues
        'User-Agent': 'CVZen-Resume-Builder',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`GitHub repository not found: ${owner}/${repo}`);
        return null;
      }
      if (response.status === 403) {
        console.warn('GitHub API rate limit exceeded');
        return null;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    const repoDetails: GitHubRepoDetails = {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      watchers: data.watchers_count,
      language: data.language,
      topics: data.topics || [],
      openIssues: data.open_issues_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      homepage: data.homepage,
      license: data.license?.name || null,
      defaultBranch: data.default_branch,
      htmlUrl: data.html_url,
    };

    console.log(`✅ Fetched GitHub repo details:`, repoDetails);
    return repoDetails;
  } catch (error) {
    console.error('Error fetching GitHub repo details:', error);
    return null;
  }
}

/**
 * Fetch GitHub details for multiple projects
 * Returns a map of project ID to GitHub details
 */
export async function fetchGitHubDetailsForProjects(
  projects: Array<{ id: string; github?: string }>
): Promise<Map<string, GitHubRepoDetails>> {
  const detailsMap = new Map<string, GitHubRepoDetails>();

  // Filter projects that have GitHub URLs
  const projectsWithGitHub = projects.filter(p => p.github);

  // Fetch details for each project (with rate limiting consideration)
  const promises = projectsWithGitHub.map(async (project) => {
    if (!project.github) return;

    const details = await fetchGitHubRepoDetails(project.github);
    if (details) {
      detailsMap.set(project.id, details);
    }
  });

  await Promise.all(promises);

  return detailsMap;
}

/**
 * Cache GitHub repo details in localStorage to avoid excessive API calls
 */
const CACHE_KEY_PREFIX = 'github_repo_';
const CACHE_KEY_USER_REPOS = 'github_user_repos_';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export function getCachedUserRepositories(githubProfileUrl: string): GitHubRepoDetails[] | null {
  try {
    const cacheKey = CACHE_KEY_USER_REPOS + btoa(githubProfileUrl);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - timestamp < CACHE_DURATION) {
      console.log('📦 Using cached GitHub user repositories');
      return data;
    }
    
    // Cache expired, remove it
    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error('Error reading GitHub user repos cache:', error);
    return null;
  }
}

export function cacheUserRepositories(githubProfileUrl: string, repositories: GitHubRepoDetails[]): void {
  try {
    const cacheKey = CACHE_KEY_USER_REPOS + btoa(githubProfileUrl);
    const cacheData = {
      data: repositories,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching GitHub user repositories:', error);
  }
}

export function getCachedGitHubDetails(githubUrl: string): GitHubRepoDetails | null {
  try {
    const cacheKey = CACHE_KEY_PREFIX + btoa(githubUrl);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - timestamp < CACHE_DURATION) {
      console.log('📦 Using cached GitHub repo details');
      return data;
    }
    
    // Cache expired, remove it
    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error('Error reading GitHub cache:', error);
    return null;
  }
}

export function cacheGitHubDetails(githubUrl: string, details: GitHubRepoDetails): void {
  try {
    const cacheKey = CACHE_KEY_PREFIX + btoa(githubUrl);
    const cacheData = {
      data: details,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching GitHub details:', error);
  }
}

/**
 * Fetch GitHub details with caching
 */
export async function fetchGitHubRepoDetailsWithCache(
  githubUrl: string
): Promise<GitHubRepoDetails | null> {
  // Try cache first
  const cached = getCachedGitHubDetails(githubUrl);
  if (cached) return cached;

  // Fetch from API
  const details = await fetchGitHubRepoDetails(githubUrl);
  if (details) {
    cacheGitHubDetails(githubUrl, details);
  }

  return details;
}

/**
 * Fetch user repositories with caching
 */
export async function fetchUserRepositoriesWithCache(
  githubProfileUrl: string
): Promise<GitHubRepoDetails[]> {
  // Try cache first
  const cached = getCachedUserRepositories(githubProfileUrl);
  if (cached) return cached;

  // Fetch from API
  const repositories = await fetchUserRepositories(githubProfileUrl);
  if (repositories.length > 0) {
    cacheUserRepositories(githubProfileUrl, repositories);
  }

  return repositories;
}
