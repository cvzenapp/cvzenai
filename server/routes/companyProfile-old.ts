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
  // Portfolio fields
  clients: z.array(z.any()).optional(),
  projects: z.array(z.any()).optional(),
  awards: z.array(z.any()).optional(),
  achievements: z.array(z.any()).optional(),
  assets: z.array(z.any()).optional(),
  teamMembers: z.array(z.any()).optional(),
  cultureValues: z.array(z.any()).optional(),
  testimonials: z.array(z.any()).optional(),
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

    // JOIN query - get company data from companies table
    const profileQuery = `
      SELECT 
        c.id as company_id,
        c.name,
        c.slug,
        c.logo_url,
        c.cover_image_url,
        c.cover_image_position,
        c.website,
        c.industry,
        c.location,
        c.description,
        c.founded_year,
        c.employee_count,
        c.company_type,
        c.size_range,
        c.work_environment,
        c.company_values,
        c.social_links,
        c.specialties,
        c.benefits,
        c.clients,
        c.projects,
        c.awards,
        c.achievements,
        c.assets,
        c.team_members,
        c.culture_values,
        c.testimonials,
        rp.id as recruiter_profile_id
      FROM recruiter_profiles rp
      LEFT JOIN companies c ON c.id = rp.company_id
      WHERE rp.user_id = $1
    `;
    
    console.log("🔍 Querying with JOIN, user_id:", userId);
    const profileResult = await client.query(profileQuery, [userId]);
    console.log("🔍 Query result rows:", profileResult.rows.length);

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recruiter profile not found",
      });
    }

    const row = profileResult.rows[0];
    console.log("🔍 Profile data - has company:", !!row.company_id);
    
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
    
    // Return company data from companies table (normalized)
    const company: Company = {
      id: row.company_id?.toString() || row.recruiter_profile_id.toString(),
      name: row.name || "My Company",
      slug: row.slug || (row.name || "my-company").toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logoUrl: row.logo_url || "",
      coverImageUrl: row.cover_image_url || "",
      coverImagePosition: row.cover_image_position || "center",
      website: row.website || "",
      industry: row.industry || "",
      sizeRange: row.size_range || "",
      location: row.location || "",
      description: row.description || "",
      foundedYear: row.founded_year || undefined,
      employeeCount: row.employee_count || undefined,
      companyType: row.company_type || undefined,
      socialLinks: parseJsonObject(row.social_links),
      specialties: parseJsonField(row.specialties),
      benefits: parseJsonField(row.benefits),
      companyValues: row.company_values || "",
      workEnvironment: row.work_environment || undefined,
      assets: parseJsonField(row.assets),
      clients: parseJsonField(row.clients),
      projects: parseJsonField(row.projects),
      awards: parseJsonField(row.awards),
      achievements: parseJsonField(row.achievements),
      teamMembers: parseJsonField(row.team_members),
      cultureValues: parseJsonField(row.culture_values),
      testimonials: parseJsonField(row.testimonials),
    };

    console.log("🔍 Constructed company object from normalized data:", {
      companyId: company.id,
      name: company.name,
      industry: company.industry,
      location: company.location,
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
  console.log('🔵 Request body full:', JSON.stringify(req.body, null, 2));

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
    console.log('🔵 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('🔵 Raw request body type:', typeof req.body);
    console.log('🔵 Raw request body keys:', Object.keys(req.body));
    
    // Check specifically for portfolio fields
    if (req.body.clients) {
      console.log('🔵 Clients field found:', Array.isArray(req.body.clients), req.body.clients);
    }
    if (req.body.projects) {
      console.log('🔵 Projects field found:', Array.isArray(req.body.projects), req.body.projects);
    }
    if (req.body.awards) {
      console.log('🔵 Awards field found:', Array.isArray(req.body.awards), req.body.awards);
    }
    if (req.body.achievements) {
      console.log('🔵 Achievements field found:', Array.isArray(req.body.achievements), req.body.achievements);
    }
    
    const validatedData = companyUpdateSchema.parse(req.body);
    console.log('✅ Validation passed');
    console.log('🔵 Validated data keys:', Object.keys(validatedData));
    console.log('🔵 Validated data full:', JSON.stringify(validatedData, null, 2));
    
    await client.connect();
    console.log('✅ Database connected');

    // Update recruiter_profiles table directly - simple approach
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    console.log('🔵 Processing update fields from validated data:', Object.keys(validatedData));

    if (validatedData.name !== undefined) {
      updateFields.push(`company_name = $${paramIndex++}`);
      values.push(validatedData.name || null);
      console.log('🔵 Adding company_name field');
    }
    if (validatedData.logoUrl !== undefined) {
      updateFields.push(`logo_url = $${paramIndex++}`);
      values.push(validatedData.logoUrl || null);
      console.log('🔵 Adding logo_url field, length:', validatedData.logoUrl?.length || 0);
    }
    if (validatedData.coverImageUrl !== undefined) {
      updateFields.push(`cover_image_url = $${paramIndex++}`);
      values.push(validatedData.coverImageUrl || null);
      console.log('🔵 Adding cover_image_url field, length:', validatedData.coverImageUrl?.length || 0);
    }
    if (validatedData.coverImagePosition !== undefined) {
      updateFields.push(`cover_image_position = $${paramIndex++}`);
      values.push(validatedData.coverImagePosition || 'center');
      console.log('🔵 Adding cover_image_position field:', validatedData.coverImagePosition);
    }
    if (validatedData.website !== undefined) {
      updateFields.push(`website = $${paramIndex++}`);
      values.push(validatedData.website || null);
      console.log('🔵 Adding website field');
    }
    if (validatedData.industry !== undefined) {
      updateFields.push(`industry = $${paramIndex++}`);
      values.push(validatedData.industry || null);
      console.log('🔵 Adding industry field');
    }
    if (validatedData.location !== undefined) {
      updateFields.push(`location = $${paramIndex++}`);
      values.push(validatedData.location || null);
      console.log('🔵 Adding location field');
    }
    if (validatedData.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(validatedData.description || null);
      console.log('🔵 Adding description field');
    }
    if (validatedData.foundedYear !== undefined) {
      updateFields.push(`founded_year = $${paramIndex++}`);
      values.push(validatedData.foundedYear || null);
      console.log('🔵 Adding founded_year field');
    }
    if (validatedData.employeeCount !== undefined) {
      updateFields.push(`employee_count = $${paramIndex++}`);
      values.push(validatedData.employeeCount || null);
      console.log('🔵 Adding employee_count field');
    }
    if (validatedData.companyType !== undefined) {
      updateFields.push(`company_type = $${paramIndex++}`);
      values.push(validatedData.companyType || null);
      console.log('🔵 Adding company_type field');
    }
    if (validatedData.sizeRange !== undefined) {
      updateFields.push(`size_range = $${paramIndex++}`);
      values.push(validatedData.sizeRange || null);
      console.log('🔵 Adding size_range field');
    }
    if (validatedData.workEnvironment !== undefined) {
      updateFields.push(`work_environment = $${paramIndex++}`);
      values.push(validatedData.workEnvironment || null);
      console.log('🔵 Adding work_environment field');
    }
    if (validatedData.companyValues !== undefined) {
      updateFields.push(`company_values = $${paramIndex++}`);
      values.push(validatedData.companyValues || null);
      console.log('🔵 Adding company_values field');
    }
    if (validatedData.socialLinks !== undefined) {
      updateFields.push(`social_links = $${paramIndex++}`);
      values.push(JSON.stringify(validatedData.socialLinks));
      console.log('🔵 Adding social_links field');
    }
    if (validatedData.specialties !== undefined) {
      updateFields.push(`specialties = $${paramIndex++}`);
      values.push(JSON.stringify(validatedData.specialties));
      console.log('🔵 Adding specialties field');
    }
    if (validatedData.benefits !== undefined) {
      updateFields.push(`benefits = $${paramIndex++}`);
      values.push(JSON.stringify(validatedData.benefits));
      console.log('🔵 Adding benefits field');
    }
    if (validatedData.clients !== undefined) {
      updateFields.push(`clients = $${paramIndex++}`);
      values.push(JSON.stringify(validatedData.clients));
      console.log('🔵 Adding clients field, count:', validatedData.clients?.length || 0);
    }
    if (validatedData.projects !== undefined) {
      updateFields.push(`projects = $${paramIndex++}`);
      values.push(JSON.stringify(validatedData.projects));
      console.log('🔵 Adding projects field, count:', validatedData.projects?.length || 0);
    }
    if (validatedData.awards !== undefined) {
      updateFields.push(`awards = $${paramIndex++}`);
      values.push(JSON.stringify(validatedData.awards));
      console.log('🔵 Adding awards field, count:', validatedData.awards?.length || 0);
    }
    if (validatedData.achievements !== undefined) {
      updateFields.push(`achievements = $${paramIndex++}`);
      values.push(JSON.stringify(validatedData.achievements));
      console.log('🔵 Adding achievements field, count:', validatedData.achievements?.length || 0);
    }
    if (validatedData.assets !== undefined) {
      updateFields.push(`assets = $${paramIndex++}`);
      values.push(JSON.stringify(validatedData.assets));
      console.log('🔵 Adding assets field, count:', validatedData.assets?.length || 0);
    }
    if (validatedData.teamMembers !== undefined) {
      updateFields.push(`team_members = $${paramIndex++}`);
      values.push(JSON.stringify(validatedData.teamMembers));
      console.log('🔵 Adding team_members field, count:', validatedData.teamMembers?.length || 0);
    }
    if (validatedData.cultureValues !== undefined) {
      updateFields.push(`culture_values = $${paramIndex++}`);
      values.push(JSON.stringify(validatedData.cultureValues));
      console.log('🔵 Adding culture_values field, count:', validatedData.cultureValues?.length || 0);
    }
    if (validatedData.testimonials !== undefined) {
      updateFields.push(`testimonials = $${paramIndex++}`);
      values.push(JSON.stringify(validatedData.testimonials));
      console.log('🔵 Adding testimonials field, count:', validatedData.testimonials?.length || 0);
    }

    console.log('🔵 Total update fields detected:', updateFields.length);

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

      if (updateResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Recruiter profile not found",
        });
      }

      const updatedProfile = updateResult.rows[0];

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

      const company: Company = {
        id: updatedProfile.id.toString(),
        name: updatedProfile.company_name || "My Company",
        slug: (updatedProfile.company_name || "my-company").toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        logoUrl: updatedProfile.logo_url || "",
        coverImageUrl: updatedProfile.cover_image_url || "",
        coverImagePosition: updatedProfile.cover_image_position || "center",
        website: updatedProfile.website || "",
        industry: updatedProfile.industry || "",
        sizeRange: updatedProfile.size_range || "",
        location: updatedProfile.location || "",
        description: updatedProfile.description || "",
        foundedYear: updatedProfile.founded_year || undefined,
        employeeCount: updatedProfile.employee_count || undefined,
        companyType: updatedProfile.company_type || undefined,
        socialLinks: parseJsonObject(updatedProfile.social_links),
        specialties: parseJsonField(updatedProfile.specialties),
        benefits: parseJsonField(updatedProfile.benefits),
        companyValues: updatedProfile.company_values || "",
        workEnvironment: updatedProfile.work_environment || undefined,
        assets: parseJsonField(updatedProfile.assets),
        clients: parseJsonField(updatedProfile.clients),
        projects: parseJsonField(updatedProfile.projects),
        awards: parseJsonField(updatedProfile.awards),
        achievements: parseJsonField(updatedProfile.achievements),
        teamMembers: parseJsonField(updatedProfile.team_members),
        cultureValues: parseJsonField(updatedProfile.culture_values),
        testimonials: parseJsonField(updatedProfile.testimonials),
      };

      console.log('🔵 Constructed updated company object with saved data');

      res.json({
        success: true,
        message: "Company profile updated successfully",
        company,
      });
    } else {
      res.json({
        success: true,
        message: "No changes to update",
      });
    }

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