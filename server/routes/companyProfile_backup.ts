import { Router, Request, Response } from "express";
import { z } from "zod";
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import {
  Company,
  COMPANY_SIZE_RANGES,
  INDUSTRIES,
  COMPANY_TYPES,
  WORK_ENVIRONMENTS,
} from "../../shared/recruiterAuth";

dotenv.config();

const router = Router();

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function getDbClient() {
  return new Client({ connectionString });
}

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Validation schema for company update
const companyUpdateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  logoUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  coverImagePosition: z.string().optional(),
  website: z.string().optional(),
  industry: z.enum(INDUSTRIES).optional(),
  sizeRange: z.enum(COMPANY_SIZE_RANGES).optional(),
  location: z.string().min(2).max(255).optional(),
  description: z.string().max(2000).optional(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
  employeeCount: z.number().min(1).optional(),
  companyType: z.enum(COMPANY_TYPES).optional(),
  socialLinks: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
  specialties: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  companyValues: z.string().max(2000).optional(),
  workEnvironment: z.enum(WORK_ENVIRONMENTS).optional(),
  assets: z.array(z.object({
    id: z.string(),
    type: z.enum(['image', 'video', 'document']),
    url: z.string(),
    name: z.string(),
    size: z.number().optional(),
    uploadedAt: z.string(),
  })).optional(),
  clients: z.array(z.object({
    id: z.string(),
    name: z.string(),
    logo: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  projects: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    link: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  awards: z.array(z.object({
    id: z.string(),
    title: z.string(),
    issuer: z.string(),
    date: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
  })).optional(),
  achievements: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    metric: z.string().optional(),
    icon: z.string().optional(),
    date: z.string().optional(),
  })).optional(),
  teamMembers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    bio: z.string().optional(),
    photo: z.string().optional(),
    linkedin: z.string().optional(),
    email: z.string().optional(),
  })).optional(),
  cultureValues: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    icon: z.string(),
  })).optional(),
  testimonials: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    company: z.string().optional(),
    content: z.string(),
    photo: z.string().optional(),
    rating: z.number().optional(),
  })).optional(),
});

// Get company by slug (public endpoint)
router.get("/public/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;
  const client = getDbClient();

  try {
    await client.connect();

    const query = `SELECT * FROM companies WHERE slug = $1`;
    const result = await client.query(query, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const companyData = result.rows[0];
    const company: Company = {
      id: companyData.id.toString(),
      name: companyData.name,
      slug: companyData.slug,
      logoUrl: companyData.logo || "",
      coverImageUrl: "",
      coverImagePosition: "center",
      website: companyData.website || "",
      industry: companyData.industry || "",
      sizeRange: companyData.size || "",
      location: "",
      description: companyData.description || "",
      foundedYear: undefined,
      employeeCount: undefined,
      companyType: undefined,
      socialLinks: {},
      specialties: [],
      benefits: [],
      companyValues: "",
      workEnvironment: undefined,
      assets: [],
      clients: [],
      projects: [],
      awards: [],
      achievements: [],
      teamMembers: [],
      cultureValues: [],
      testimonials: [],
    };

    res.json({
      success: true,
      company,
    });

  } catch (error) {
    console.error("❌ Get company by slug error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company",
    });
  } finally {
    await client.end();
  }
});

// Get company profile
router.get("/profile", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const userId = decoded.userId;
  console.log("🔍 GET /profile - userId from token:", userId);
  
  const client = getDbClient();

  try {
    await client.connect();

    // Join recruiter_profiles with companies table to get complete company data
    const profileQuery = `
      SELECT 
        rp.*,
        c.name as company_name,
        c.slug as company_slug,
        c.logo as company_logo,
        c.website as company_website,
        c.description as company_description,
        c.industry as company_industry,
        c.location as company_location,
        c.size as company_size,
        c.size_range as company_size_range,
        c.founded_year as company_founded_year,
        c.employee_count as company_employee_count,
        c.company_type as company_type,
        c.social_links as company_social_links,
        c.specialties as company_specialties,
        c.benefits as company_benefits,
        c.company_values as company_values,
        c.work_environment as company_work_environment,
        c.assets as company_assets,
        c.clients as company_clients,
        c.projects as company_projects,
        c.awards as company_awards,
        c.achievements as company_achievements,
        c.team_members as company_team_members,
        c.culture_values as company_culture_values,
        c.testimonials as company_testimonials
      FROM recruiter_profiles rp
      LEFT JOIN companies c ON rp.company_id = c.id
      WHERE rp.user_id = $1
    `;
    
    console.log("🔍 Querying recruiter_profiles with companies join, user_id:", userId);
    const profileResult = await client.query(profileQuery, [userId]);
    console.log("🔍 Query result rows:", profileResult.rows.length);

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recruiter profile not found",
      });
    }

    const profile = profileResult.rows[0];
    console.log("🔍 Profile data keys:", Object.keys(profile));
    
    // Parse JSON fields safely
    const parseJsonField = (field: any) => {
      if (!field) return [];
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch {
          return [];
        }
      }
      return Array.isArray(field) ? field : [];
    };

    const parseJsonObject = (field: any) => {
      if (!field) return {};
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch {
          return {};
        }
      }
      return typeof field === 'object' ? field : {};
    };
    
    // Return company data from joined tables
    const company: Company = {
      id: profile.company_id?.toString() || profile.id.toString(),
      name: profile.company_name || "My Company",
      slug: profile.company_slug || (profile.company_name || "my-company").toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logoUrl: profile.company_logo || profile.cover_image_url || "",
      coverImageUrl: profile.cover_image_url || "",
      coverImagePosition: profile.cover_image_position || "center",
      website: profile.company_website || "",
      industry: profile.company_industry || "",
      sizeRange: profile.company_size_range || profile.company_size || "",
      location: profile.company_location || "",
      description: profile.company_description || "",
      foundedYear: profile.company_founded_year || undefined,
      employeeCount: profile.company_employee_count || undefined,
      companyType: profile.company_type || undefined,
      socialLinks: parseJsonObject(profile.company_social_links),
      specialties: parseJsonField(profile.company_specialties),
      benefits: parseJsonField(profile.company_benefits),
      companyValues: profile.company_values || "",
      workEnvironment: profile.company_work_environment || undefined,
      assets: parseJsonField(profile.company_assets),
      clients: parseJsonField(profile.company_clients),
      projects: parseJsonField(profile.company_projects),
      awards: parseJsonField(profile.company_awards),
      achievements: parseJsonField(profile.company_achievements),
      teamMembers: parseJsonField(profile.company_team_members),
      cultureValues: parseJsonField(profile.company_culture_values),
      testimonials: parseJsonField(profile.company_testimonials),
    };

    console.log("🔍 Constructed company object with data:", {
      name: company.name,
      industry: company.industry,
      location: company.location,
      description: company.description,
      hasLogo: !!company.logoUrl,
      hasCoverImage: !!company.coverImageUrl
    });

    res.json({
      success: true,
      company,
    });

  } catch (error) {
    console.error("❌ Get company profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company profile",
    });
  } finally {
    await client.end();
  }
});

// Update company profile
router.put("/profile", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  console.log('🔵 PUT /profile - Request received');
  console.log('🔵 Has token:', !!token);
  console.log('🔵 Request body keys:', Object.keys(req.body));
  console.log('🔵 Has coverImageUrl:', !!req.body.coverImageUrl);
  if (req.body.coverImageUrl) {
    console.log('🔵 coverImageUrl length:', req.body.coverImageUrl.length);
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const userId = decoded.userId;
  console.log('🔵 User ID from token:', userId);
  const client = getDbClient();

  try {
    // Validate request body
    console.log('🔵 Validating request body...');
    const validatedData = companyUpdateSchema.parse(req.body);
    console.log('✅ Validation passed');
    
    await client.connect();
    console.log('✅ Database connected');

    // Update recruiter_profiles with basic company info
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (validatedData.name) {
      updateFields.push(`company_name = $${paramIndex++}`);
      values.push(validatedData.name);
    }
    if (validatedData.website !== undefined) {
      updateFields.push(`company_website = $${paramIndex++}`);
      values.push(validatedData.website || null);
    }
    if (validatedData.logoUrl !== undefined) {
      updateFields.push(`company_logo = $${paramIndex++}`);
      values.push(validatedData.logoUrl || null);
    }
    if (validatedData.coverImageUrl !== undefined) {
      updateFields.push(`cover_image_url = $${paramIndex++}`);
      values.push(validatedData.coverImageUrl || null);
      console.log('🔵 Adding cover_image_url to update, length:', validatedData.coverImageUrl?.length || 0);
    }
    if (validatedData.coverImagePosition !== undefined) {
      updateFields.push(`cover_image_position = $${paramIndex++}`);
      values.push(validatedData.coverImagePosition || 'center');
      console.log('🔵 Adding cover_image_position to update:', validatedData.coverImagePosition);
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      values.push(userId);

      const updateQuery = `
        UPDATE recruiter_profiles 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;

      console.log('🔵 Executing update query with', updateFields.length, 'fields');
      const updateResult = await client.query(updateQuery, values);
      console.log('✅ Update successful, rows affected:', updateResult.rowCount);
    }

    // Get updated profile
    const profileQuery = `SELECT * FROM recruiter_profiles WHERE user_id = $1`;
    const profileResult = await client.query(profileQuery, [userId]);
    const profile = profileResult.rows[0];

    console.log('🔵 Retrieved profile after update:');
    console.log('  - cover_image_url length:', profile.cover_image_url?.length || 0);
    console.log('  - cover_image_position:', profile.cover_image_position);

    const company: Company = {
      id: profile.id.toString(),
      name: profile.company_name || "My Company",
      slug: (profile.company_name || "my-company").toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logoUrl: profile.company_logo || "",
      coverImageUrl: profile.cover_image_url || "",
      coverImagePosition: profile.cover_image_position || "center",
      website: profile.company_website || "",
      industry: "",
      sizeRange: "",
      location: "",
      description: "",
      foundedYear: undefined,
      employeeCount: undefined,
      companyType: undefined,
      socialLinks: {},
      specialties: [],
      benefits: [],
      companyValues: "",
      workEnvironment: undefined,
      assets: [],
      clients: [],
      projects: [],
      awards: [],
      achievements: [],
      teamMembers: [],
      cultureValues: [],
      testimonials: [],
    };

    console.log('🔵 Constructed company object:');
    console.log('  - coverImageUrl length:', company.coverImageUrl?.length || 0);
    console.log('  - coverImagePosition:', company.coverImagePosition);

    res.json({
      success: true,
      message: "Company profile updated successfully",
      company,
    });

  } catch (error) {
    console.error("❌ Update company profile error:", error);

    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message;
        }
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update company profile",
    });
  } finally {
    await client.end();
  }
});

export default router;
