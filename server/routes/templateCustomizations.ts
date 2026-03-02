import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';

const router = Router();

interface TemplateCustomization {
  id: number;
  template_id: string;
  user_id?: number;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    fontWeight: string;
    fontSizeScale?: number;
    letterSpacing?: number;
    headingWeight?: string;
    bodyWeight?: string;
  };
  layout: {
    style: string;
    spacing: number;
    borderRadius: number;
    showBorders: boolean;
    density?: string;
    maxWidth?: string;
    sectionSpacing?: number;
    cardPadding?: number;
  };
  sections: {
    showProfileImage: boolean;
    showSkillBars: boolean;
    showRatings: boolean;
    order: string[];
  };
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

// Get all customizations (authenticated users get their own, unauthenticated users get default/public)
router.get('/', async (req, res) => {
  try {
    // Optional authentication - check if user is authenticated
    const authHeader = req.headers.authorization;
    let userId: number | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        userId = decoded.userId;
        console.log('🔐 Authenticated user detected:', userId);
      } catch (authError) {
        console.log('🔓 Authentication failed, serving public customizations');
        userId = null;
      }
    } else {
      console.log('🔓 No authentication provided, serving public customizations');
    }

    const templateId = req.query.templateId as string;

    console.log('📋 Getting customizations for:', { userId: userId || 'unauthenticated', templateId });

    let query = supabase
      .from('template_customizations')
      .select('*');

    if (userId) {
      // Authenticated: get user's customizations
      query = query.eq('user_id', userId);
    } else {
      // Unauthenticated: return empty array to trigger frontend default customization
      return res.json({
        success: true,
        data: []
      });
    }

    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch customizations'
      });
    }

    console.log('✅ Found customizations:', data?.length || 0);

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('❌ Error in GET /template-customizations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get customization by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const customizationId = parseInt(req.params.id);

    console.log('🔍 Getting customization:', { customizationId, userId });

    const { data, error } = await supabase
      .from('template_customizations')
      .select('*')
      .eq('id', customizationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    console.log('✅ Found customization:', data.name);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Error in GET /template-customizations/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new customization
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const customizationData = req.body;

    console.log('📝 Creating customization:', {
      userId,
      templateId: customizationData.templateId,
      name: customizationData.name,
      isDefault: customizationData.isDefault
    });

    // If this is marked as default, unset other defaults for this template
    if (customizationData.isDefault) {
      await supabase
        .from('template_customizations')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('template_id', customizationData.templateId);
    }

    // Insert new customization
    const { data, error } = await supabase
      .from('template_customizations')
      .insert({
        user_id: userId,
        template_id: customizationData.templateId,
        name: customizationData.name,
        colors: customizationData.colors,
        typography: customizationData.typography,
        layout: customizationData.layout,
        sections: customizationData.sections,
        is_default: customizationData.isDefault || false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create customization'
      });
    }

    console.log('✅ Created customization:', { id: data.id, name: data.name });

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Error in POST /template-customizations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update customization
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const customizationId = parseInt(req.params.id);
    const updates = req.body;

    console.log('✏️ Updating customization:', { customizationId, userId, updates: Object.keys(updates) });

    // If this is being marked as default, unset other defaults for this template
    if (updates.isDefault) {
      // First get the template_id for this customization
      const { data: currentCustomization } = await supabase
        .from('template_customizations')
        .select('template_id')
        .eq('id', customizationId)
        .eq('user_id', userId)
        .single();

      if (currentCustomization) {
        await supabase
          .from('template_customizations')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('template_id', currentCustomization.template_id);
      }
    }

    // Update the customization
    const { data, error } = await supabase
      .from('template_customizations')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.colors && { colors: updates.colors }),
        ...(updates.typography && { typography: updates.typography }),
        ...(updates.layout && { layout: updates.layout }),
        ...(updates.sections && { sections: updates.sections }),
        ...(updates.isDefault !== undefined && { is_default: updates.isDefault }),
        updated_at: new Date().toISOString()
      })
      .eq('id', customizationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update customization'
      });
    }

    console.log('✅ Updated customization:', { id: data.id, name: data.name });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Error in PUT /template-customizations/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete customization
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const customizationId = parseInt(req.params.id);

    console.log('🗑️ Deleting customization:', { customizationId, userId });

    const { error } = await supabase
      .from('template_customizations')
      .delete()
      .eq('id', customizationId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete customization'
      });
    }

    console.log('✅ Deleted customization:', customizationId);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('❌ Error in DELETE /template-customizations/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
