// Mock Test Badge/Progress Utilities

export interface ScoreTier {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Get score tier label based on percentage
 */
export function getScoreLabel(score: number): string {
  if (score >= 75) return 'Strong';
  if (score >= 50) return 'Good Start';
  return 'Needs Improvement';
}

/**
 * Get score tier with styling information
 */
export function getScoreTier(score: number): ScoreTier {
  if (score >= 75) {
    return {
      label: 'Strong',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  }
  
  if (score >= 50) {
    return {
      label: 'Good Start',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    };
  }
  
  return {
    label: 'Needs Improvement',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  };
}

/**
 * Get display text for specific attempt
 */
export function getAttemptDisplay(
  progress: any,
  attemptNumber: 1 | 2 | 3
): string {
  const scores = [
    progress.attempt1Score,
    progress.attempt2Score,
    progress.attempt3Score
  ];
  
  const currentScore = scores[attemptNumber - 1];
  
  if (currentScore === null || currentScore === undefined) {
    return '';
  }
  
  if (attemptNumber === 1) {
    return getScoreLabel(currentScore);
  } else if (attemptNumber === 2) {
    const previousScore = scores[0];
    if (previousScore !== null && previousScore !== undefined) {
      const delta = currentScore - previousScore;
      return `${delta >= 0 ? '+' : ''}${delta.toFixed(0)} points`;
    }
    return getScoreLabel(currentScore);
  } else if (attemptNumber === 3) {
    return `Best: ${progress.bestScore}%`;
  }
  
  return '';
}

/**
 * Get attempt status for UI display
 */
export function getAttemptStatus(
  progress: any,
  attemptNumber: 1 | 2 | 3
): 'completed' | 'available' | 'locked' {
  const scores = [
    progress.attempt1Score,
    progress.attempt2Score,
    progress.attempt3Score
  ];
  
  const currentScore = scores[attemptNumber - 1];
  
  if (currentScore !== null && currentScore !== undefined) {
    return 'completed';
  }
  
  if (attemptNumber === 1) {
    return 'available';
  }
  
  // For attempts 2 and 3, check if previous attempt is completed
  const previousScore = scores[attemptNumber - 2];
  if (previousScore !== null && previousScore !== undefined) {
    return 'available';
  }
  
  return 'locked';
}

/**
 * Check if user can take another attempt
 */
export function canTakeAttempt(progress: any): boolean {
  return progress.currentAttempts < 3;
}

/**
 * Get next attempt number
 */
export function getNextAttemptNumber(progress: any): number | null {
  if (progress.currentAttempts >= 3) {
    return null;
  }
  return progress.currentAttempts + 1;
}

/**
 * Format level name for display
 */
export function formatLevelName(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/**
 * Get level icon component name
 */
export function getLevelIcon(level: string): string {
  switch (level) {
    case 'basic': return 'Target';
    case 'moderate': return 'Brain';
    case 'complex': return 'Trophy';
    default: return 'Brain';
  }
}

/**
 * Get progress percentage for level completion
 */
export function getLevelProgress(progress: any): number {
  return (progress.currentAttempts / 3) * 100;
}