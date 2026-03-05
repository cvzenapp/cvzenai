import React from 'react';
import { Star, GitFork, Eye, Code, ExternalLink } from 'lucide-react';
import { GitHubRepoDetails } from '@/services/githubApi';

interface GitHubRepoCardProps {
  details: GitHubRepoDetails;
  className?: string;
}

/**
 * Component to display GitHub repository details
 * Shows stars, forks, language, and other metadata
 */
export const GitHubRepoCard: React.FC<GitHubRepoCardProps> = ({
  details,
  className = ''
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className={`github-repo-card ${className}`}>
      <div className="github-repo-header">
        <div className="github-repo-title">
          <Code size={18} className="github-icon" />
          <a
            href={details.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="github-repo-link"
          >
            {details.fullName}
            <ExternalLink size={14} className="external-link-icon" />
          </a>
        </div>
      </div>

      {details.description && (
        <p className="github-repo-description">{details.description}</p>
      )}

      <div className="github-repo-stats">
        <div className="github-stat">
          <Star size={16} className="stat-icon" />
          <span className="stat-value">{formatNumber(details.stars)}</span>
          <span className="stat-label">stars</span>
        </div>

        <div className="github-stat">
          <GitFork size={16} className="stat-icon" />
          <span className="stat-value">{formatNumber(details.forks)}</span>
          <span className="stat-label">forks</span>
        </div>

        {details.watchers > 0 && (
          <div className="github-stat">
            <Eye size={16} className="stat-icon" />
            <span className="stat-value">{formatNumber(details.watchers)}</span>
            <span className="stat-label">watchers</span>
          </div>
        )}
      </div>

      <div className="github-repo-meta">
        {details.language && (
          <span className="github-language">
            <span className="language-dot" style={{ backgroundColor: getLanguageColor(details.language) }} />
            {details.language}
          </span>
        )}

        {details.license && (
          <span className="github-license">{details.license}</span>
        )}

        {details.topics && details.topics.length > 0 && (
          <div className="github-topics">
            {details.topics.slice(0, 3).map((topic) => (
              <span key={topic} className="github-topic">
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Get color for programming language
 * Based on GitHub's language colors
 */
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    PHP: '#4F5D95',
    Ruby: '#701516',
    Go: '#00ADD8',
    Rust: '#dea584',
    Swift: '#ffac45',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Vue: '#41b883',
    React: '#61dafb',
  };

  return colors[language] || '#858585';
}

// Add CSS styles with template customization support
const styles = `
.github-repo-card {
  background: linear-gradient(135deg, var(--template-background-color, #f6f8fa) 0%, var(--template-background-color, #ffffff) 100%);
  border: 1px solid rgba(from var(--template-primary-color, #d0d7de) r g b / 0.2);
  border-radius: var(--template-border-radius, 8px);
  padding: 1rem;
  margin-top: 0.75rem;
  transition: all 0.3s ease;
  font-family: var(--template-font-family, inherit);
}

.github-repo-card:hover {
  border-color: var(--template-primary-color, #0969da);
  box-shadow: 0 4px 12px rgba(from var(--template-primary-color, #0969da) r g b / 0.15);
  transform: translateY(-2px);
}

.github-repo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.github-repo-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.github-icon {
  color: var(--template-primary-color, #0969da);
  flex-shrink: 0;
}

.github-repo-link {
  font-weight: var(--template-heading-weight, 600);
  color: var(--template-primary-color, #0969da);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.9375rem;
  transition: color 0.2s ease;
  font-family: var(--template-font-family, inherit);
}

.github-repo-link:hover {
  color: var(--template-accent-color, #0550ae);
  text-decoration: underline;
}

.external-link-icon {
  opacity: 0.6;
  color: var(--template-primary-color, #0969da);
}

.github-repo-description {
  font-size: 0.875rem;
  color: var(--template-secondary-color, #57606a);
  line-height: 1.5;
  margin: 0.5rem 0;
  font-family: var(--template-font-family, inherit);
}

.github-repo-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.75rem 0;
  flex-wrap: wrap;
}

.github-stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--template-secondary-color, #57606a);
  font-family: var(--template-font-family, inherit);
}

.stat-icon {
  color: var(--template-accent-color, #656d76);
}

.stat-value {
  font-weight: var(--template-heading-weight, 600);
  color: var(--template-primary-color, #24292f);
}

.stat-label {
  color: var(--template-secondary-color, #656d76);
}

.github-repo-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(from var(--template-primary-color, #d0d7de) r g b / 0.2);
}

.github-language {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--template-secondary-color, #57606a);
  font-family: var(--template-font-family, inherit);
}

.language-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.github-license {
  font-size: 0.8125rem;
  color: var(--template-secondary-color, #57606a);
  padding: 0.125rem 0.5rem;
  background: rgba(from var(--template-primary-color, #f6f8fa) r g b / 0.1);
  border-radius: var(--template-border-radius, 4px);
  font-family: var(--template-font-family, inherit);
}

.github-topics {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.github-topic {
  font-size: 0.75rem;
  color: var(--template-primary-color, #0969da);
  background: rgba(from var(--template-primary-color, #ddf4ff) r g b / 0.15);
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
  font-family: var(--template-font-family, inherit);
}

/* Fallback for browsers that don't support rgba(from ...) */
@supports not (background-color: rgba(from white r g b / 0.1)) {
  .github-repo-card {
    border: 1px solid #d0d7de;
  }
  
  .github-repo-card:hover {
    box-shadow: 0 4px 12px rgba(9, 105, 218, 0.15);
  }
  
  .github-repo-meta {
    border-top: 1px solid #d0d7de;
  }
  
  .github-license {
    background: #f6f8fa;
  }
  
  .github-topic {
    background: #ddf4ff;
  }
}

@media (max-width: 640px) {
  .github-repo-card {
    padding: 0.875rem;
  }

  .github-repo-stats {
    gap: 0.75rem;
  }

  .github-repo-meta {
    gap: 0.5rem;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'github-repo-card-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
}
