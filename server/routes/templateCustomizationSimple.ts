import express from "express";
import { z } from "zod";
import { getDatabase } from "../database/connection.js";
import { requireAuth } from '../middleware/unifiedAuth.js';
import type { Request, Response } from "express";

const router = express.Router();

// Validation schema for customization
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

// GET /api/template-customizations - Get all customizations for authenticated user
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { templateId } = req.query;
    
    const db = await getDatabase();
    let query = `
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
      WHERE user_id = $1 AND is_active = true
    `;
    
    const params: any[] = [userId];
    
    if (templateId) {
      query += " AND template_id = $2";
      params.push(templateId);
    }
    
    query += " ORDER BY is_default DESC, updated_at DESC";
    
    const result = await db.query(query, params);
    const customizations = result.rows;
    
    // Parse JSON fields
    const parsedCustomizations = customizations.map((c: any) => ({
      ...c,
      colors: JSON.parse(c.colors),
      typography: JSON.parse(c.typography),
      layout: JSON.parse(c.layout),
      sections: JSON.parse(c.sections),
    }));

    res.json({
      success: true,
      data: parsedCustomizations,
    });
  } catch (error) {
    console.error("Error fetching customizations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customizations",
    });
  }
});

// POST /api/template-customizations - Create new customization
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = customizationSchema.parse(req.body);
    
    console.log('📝 Creating template customization:', {
      userId,
      templateId: validatedData.templateId,
      name: validatedData.name
    });
    
    const db = await getDatabase();
    
    // If this is set as default, unset other defaults for this template
    if (validatedData.isDefault) {
      await db.query(`
        UPDATE template_customizations 
        SET is_default = false 
        WHERE user_id = $1 AND template_id = $2
      `, [userId, validatedData.templateId]);
    }
    
    // Insert new customization
    const result = await db.query(`
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
    
    const newCustomization = result.rows[0];
    
    console.log('✅ Template customization created:', newCustomization.id);
    
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
    console.error("❌ Error creating customization:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to create customization",
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

// PUT /api/template-customizations/:id - Update existing customization
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const validatedData = customizationSchema.partial().parse(req.body);
    
    console.log('📝 Updating template customization:', {
      userId,
      customizationId: id,
      updates: Object.keys(validatedData)
    });
    
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
    
    const updateResult = await db.query(`
      UPDATE template_customizations 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING id, created_at, updated_at
    `, updateValues);
    
    const updatedCustomization = updateResult.rows[0];
    
    console.log('✅ Template customization updated:', updatedCustomization.id);
    
    res.json({
      success: true,
      data: {
        id: updatedCustomization.id,
        userId: userId,
        ...validatedData,
        createdAt: updatedCustomization.created_at,
        updatedAt: updatedCustomization.updated_at,
      },
    });
  } catch (error) {
    console.error("❌ Error updating customization:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to update customization",
    });
  }
});

export default router;