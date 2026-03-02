import express from "express";
import { z } from "zod";
import { getDatabase } from "../database/connection.js";
import type { Request, Response } from "express";

const router = express.Router();

// Validation schemas
const customizationSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1).max(255),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    text: z.string(),
    background: z.string(),
  }),
  typography: z.object({
    fontFamily: z.string(),
    fontSize: z.number().min(10).max(24),
    lineHeight: z.number().min(1).max(3),
    fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']),
  }),
  layout: z.object({
    style: z.enum(['single-column', 'two-column', 'sidebar']),
    spacing: z.number().min(4).max(48),
    borderRadius: z.number().min(0).max(24),
    showBorders: z.boolean(),
  }),
  sections: z.object({
    showProfileImage: z.boolean(),
    showSkillBars: z.boolean(),
    showRatings: z.boolean(),
    order: z.array(z.string()),
  }),
  isDefault: z.boolean().optional(),
});

const updateCustomizationSchema = customizationSchema.partial().omit({ templateId: true });

// Import authentication middleware from unified auth system
import { requireAuth } from '../middleware/unifiedAuth.js';

// GET /api/template-customizations - Get customizations (public/default if not authenticated, user-specific if authenticated)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { templateId } = req.query;
    const db = await getDatabase();
    
    // Check if user is authenticated (but don't require it)
    const userId = (req as any).user?.id;
    
    console.log('🔍 [templateCustomization] GET request:', {
      templateId: templateId,
      userId: userId || 'not authenticated',
      hasAuth: !!userId
    });
    
    let query: string;
    let params: any[];
    
    if (userId) {
      // User is authenticated - get their customizations
      query = `
        SELECT 
          id,
          user_id as "userId",
          template_id as "templateId",
          name,
          colors,
          typography,
          layout,
          sections,
          is_default as "isDefault",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM template_customizations 
        WHERE user_id = $1 AND is_active = true
      `;
      params = [userId];
      
      if (templateId) {
        query += " AND template_id = $2";
        params.push(templateId);
      }
    } else {
      // User is not authenticated - return all available customizations
      query = `
        SELECT 
          id,
          user_id as "userId",
          template_id as "templateId",
          name,
          colors,
          typography,
          layout,
          sections,
          is_default as "isDefault",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM template_customizations 
        WHERE is_active = true
      `;
      params = [];
    }
    
    query += " ORDER BY is_default DESC, updated_at DESC";
    
    console.log('🔍 [templateCustomization] Executing query:', { query, params });
    
    const result = await db.query(query, params);
    const customizations = result.rows;
    
    console.log('🔍 [templateCustomization] Found customizations:', customizations.length);
    
    // If no customizations found, return empty array to trigger frontend fallback
    if (customizations.length === 0) {
      console.log('ℹ️ [templateCustomization] No customizations found, returning empty array');
      
      return res.json({
        success: true,
        data: [],
      });
    }
    
    // Parse JSON fields
    const parsedCustomizations = customizations.map((c: any) => ({
      ...c,
      colors: JSON.parse(c.colors),
      typography: JSON.parse(c.typography),
      layout: JSON.parse(c.layout),
      sections: JSON.parse(c.sections),
    }));
    
    console.log('✅ [templateCustomization] Returning customizations:', {
      count: parsedCustomizations.length,
      templateId: templateId,
      userId: userId || 'anonymous',
      names: parsedCustomizations.map(c => c.name)
    });
    
    res.json({
      success: true,
      data: parsedCustomizations,
    });
  } catch (error) {
    const { templateId } = req.query;
    console.error('❌ [templateCustomization] Error fetching customizations:', {
      error: error.message,
      templateId: templateId,
      userId: (req as any).user?.id || 'anonymous',
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch customizations",
    });
  }
});

// GET /api/template-customizations/:id - Get specific customization
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    
    const db = await getDatabase();
    const result = await db.query(`
      SELECT 
        id,
        template_id as "templateId",
        name,
        colors,
        typography,
        layout,
        sections,
        is_default as "isDefault",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM template_customizations 
      WHERE id = $1 AND user_id = $2 AND is_active = true
    `, [id, userId]);
    
    const customization = result.rows[0];
    
    if (!customization) {
      return res.status(404).json({
        success: false,
        error: "Customization not found",
      });
    }
    
    // Parse JSON fields
    const parsedCustomization = {
      ...customization,
      colors: JSON.parse(customization.colors),
      typography: JSON.parse(customization.typography),
      layout: JSON.parse(customization.layout),
      sections: JSON.parse(customization.sections),
    };
    
    res.json({
      success: true,
      data: parsedCustomization,
    });
  } catch (error) {
    console.error("Error fetching customization:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customization",
    });
  }
});

// POST /api/template-customizations - Create new customization
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = customizationSchema.parse(req.body);
    
    const db = await getDatabase();
    
    // Check if customization exists for this user+template (upsert logic)
    const existingResult = await db.query(`
      SELECT id FROM template_customizations 
      WHERE user_id = $1 AND template_id = $2 AND is_active = true
    `, [userId, validatedData.templateId]);
    
    let result;
    if (existingResult.rows.length > 0) {
      // Update existing customization
      const existingId = existingResult.rows[0].id;
      result = await db.query(`
        UPDATE template_customizations 
        SET name = $3, colors = $4, typography = $5, layout = $6, sections = $7, 
            is_default = $8, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id, created_at, updated_at
      `, [
        existingId, userId,
        validatedData.name,
        JSON.stringify(validatedData.colors),
        JSON.stringify(validatedData.typography),
        JSON.stringify(validatedData.layout),
        JSON.stringify(validatedData.sections),
        validatedData.isDefault || false
      ]);
    } else {
      // Insert new customization
      result = await db.query(`
        INSERT INTO template_customizations (
          user_id, template_id, name, colors, typography, layout, sections, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at, updated_at
      `, [
        userId,
        validatedData.templateId,
        validatedData.name,
        JSON.stringify(validatedData.colors),
        JSON.stringify(validatedData.typography),
        JSON.stringify(validatedData.layout),
        JSON.stringify(validatedData.sections),
        validatedData.isDefault || false
      ]);
    }
    
    const newCustomization = result.rows[0];
    
    // Track usage
    await db.query(`
      INSERT INTO template_usage (user_id, template_id, customization_id, usage_type)
      VALUES ($1, $2, $3, 'save')
    `, [userId, validatedData.templateId, newCustomization.id]);
    
    res.status(201).json({
      success: true,
      data: {
        id: newCustomization.id,
        userId: userId,
        ...validatedData,
        createdAt: newCustomization.created_at,
        updatedAt: newCustomization.updated_at,
      },
    });
  } catch (error) {
    console.error("Error creating customization:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid data",
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to create customization",
    });
  }
});

// PUT /api/template-customizations/:id - Update customization
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const validatedData = updateCustomizationSchema.parse(req.body);
    
    const db = await getDatabase();
    
    // Check if customization exists and belongs to user
    const checkResult = await db.query(`
      SELECT id, template_id FROM template_customizations 
      WHERE id = $1 AND user_id = $2 AND is_active = true
    `, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Customization not found",
      });
    }
    
    const existing = checkResult.rows[0];
    
    // If this is set as default, unset other defaults for this template
    if (validatedData.isDefault) {
      await db.query(`
        UPDATE template_customizations 
        SET is_default = false 
        WHERE user_id = $1 AND template_id = $2 AND id != $3
      `, [userId, existing.template_id, id]);
    }
    
    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    let paramIndex = 1;
    
    if (validatedData.name) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(validatedData.name);
    }
    if (validatedData.colors) {
      updateFields.push(`colors = $${paramIndex++}`);
      updateValues.push(JSON.stringify(validatedData.colors));
    }
    if (validatedData.typography) {
      updateFields.push(`typography = $${paramIndex++}`);
      updateValues.push(JSON.stringify(validatedData.typography));
    }
    if (validatedData.layout) {
      updateFields.push(`layout = $${paramIndex++}`);
      updateValues.push(JSON.stringify(validatedData.layout));
    }
    if (validatedData.sections) {
      updateFields.push(`sections = $${paramIndex++}`);
      updateValues.push(JSON.stringify(validatedData.sections));
    }
    if (validatedData.isDefault !== undefined) {
      updateFields.push(`is_default = $${paramIndex++}`);
      updateValues.push(validatedData.isDefault);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }
    
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id, userId);
    
    await db.query(`
      UPDATE template_customizations 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
    `, updateValues);
    
    // Track usage
    await db.query(`
      INSERT INTO template_usage (user_id, template_id, customization_id, usage_type)
      VALUES ($1, $2, $3, 'apply')
    `, [userId, existing.template_id, id]);
    
    res.json({
      success: true,
      message: "Customization updated successfully",
    });
  } catch (error) {
    console.error("Error updating customization:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid data",
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to update customization",
    });
  }
});

// DELETE /api/template-customizations/:id - Delete customization
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    
    const db = await getDatabase();
    
    // Soft delete (set is_active = false)
    const result = await db.query(`
      UPDATE template_customizations 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
    `, [id, userId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Customization not found",
      });
    }
    
    res.json({
      success: true,
      message: "Customization deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customization:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete customization",
    });
  }
});

// POST /api/template-customizations/:id/share - Create share link
router.post("/:id/share", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { isPublic = false, expiresIn } = req.body;
    
    const db = await getDatabase();
    
    // Check if customization exists and belongs to user
    const checkStmt = db.prepare(`
      SELECT id FROM template_customizations 
      WHERE id = ? AND user_id = ? AND is_active = 1
    `);
    const existing = checkStmt.get(id, userId);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Customization not found",
      });
    }
    
    // Generate share token
    const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    }
    
    // Create share record
    const shareStmt = db.prepare(`
      INSERT INTO template_shares (customization_id, shared_by_user_id, share_token, is_public, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    shareStmt.run(id, userId, shareToken, isPublic ? 1 : 0, expiresAt);
    
    res.json({
      success: true,
      data: {
        shareToken,
        shareUrl: `${req.protocol}://${req.get('host')}/shared/template/${shareToken}`,
        isPublic,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating share link:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create share link",
    });
  }
});

// GET /api/template-customizations/shared/:token - Get shared customization
router.get("/shared/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    const db = await getDatabase();
    
    // Get shared customization
    const stmt = db.prepare(`
      SELECT 
        tc.id,
        tc.template_id as templateId,
        tc.name,
        tc.colors,
        tc.typography,
        tc.layout,
        tc.sections,
        ts.is_public as isPublic,
        ts.expires_at as expiresAt,
        u.first_name || ' ' || u.last_name as sharedBy
      FROM template_shares ts
      JOIN template_customizations tc ON ts.customization_id = tc.id
      JOIN users u ON ts.shared_by_user_id = u.id
      WHERE ts.share_token = ? AND tc.is_active = 1
    `);
    
    const shared = stmt.get(token);
    
    if (!shared) {
      return res.status(404).json({
        success: false,
        error: "Shared template not found",
      });
    }
    
    // Check if expired
    if (shared.expiresAt && new Date(shared.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        error: "Shared template has expired",
      });
    }
    
    // Increment view count
    const updateViewStmt = db.prepare(`
      UPDATE template_shares 
      SET view_count = view_count + 1 
      WHERE share_token = ?
    `);
    updateViewStmt.run(token);
    
    // Parse JSON fields
    const parsedCustomization = {
      id: shared.id,
      templateId: shared.templateId,
      name: shared.name,
      colors: JSON.parse(shared.colors),
      typography: JSON.parse(shared.typography),
      layout: JSON.parse(shared.layout),
      sections: JSON.parse(shared.sections),
      isPublic: shared.isPublic,
      sharedBy: shared.sharedBy,
    };
    
    res.json({
      success: true,
      data: parsedCustomization,
    });
  } catch (error) {
    console.error("Error fetching shared customization:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch shared customization",
    });
  }
});

export default router;