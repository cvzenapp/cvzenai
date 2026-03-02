import { getDatabase } from '../database/connection';

/**
 * Shared Authentication Store
 * Single source of truth for sessions and users across all modules
 */

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  profile?: {
    bio?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
  resetToken?: string;
  resetTokenExpiry?: Date;
}

export interface Session {
  userId: string;
  expiresAt: Date;
}

// Shared stores - single instances across the entire application
export const authSessions: Map<string, Session> = new Map();
export const authUsers: Map<string, User> = new Map();

// Utility functions
export const getUserFromToken = (token: string): User | null => {
  const session = authSessions.get(token);
  if (!session || session.expiresAt < new Date()) {
    authSessions.delete(token);
    return null;
  }

  const db = getDatabase();
  const stmt = db.prepare('SELECT id, email, first_name || " " || last_name AS name, avatar_url AS avatar, created_at AS createdAt, updated_at AS updatedAt, email_verified AS emailVerified, bio, location, portfolio_url AS website, linkedin_url AS linkedin, github_url AS github FROM users WHERE id = ?');
  const userRow = stmt.get(session.userId);
  if (!userRow) return null;

  const user: User = {
    id: userRow.id.toString(),
    email: userRow.email,
    name: userRow.name,
    avatar: userRow.avatar,
    createdAt: userRow.createdAt,
    updatedAt: userRow.updatedAt,
    emailVerified: !!userRow.emailVerified,
    profile: {
      bio: userRow.bio,
      location: userRow.location,
      website: userRow.website,
      linkedin: userRow.linkedin,
      github: userRow.github,
    }
  };

  return user;
};

export const generateToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};