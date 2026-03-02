import { Router } from 'express';
import { getDatabase, closeDatabase } from '../database/connection';
import type { CustomizationSettings } from '../../shared/types/customization';

const router = Router();

// Save customization settings for a specific resume
router.post('/save', async (req, res) => {
  let db;
  try {
    const { resumeId, userId, settings } = req.body;

    console.log('📥 Received customization save request');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Parsed values:', { 
      resumeId, 
      resumeIdType: typeof resumeId,
      userId, 
      userIdType: typeof userId,
      hasSettings: !!settings 
    });

    if (!resumeId || !userId || !settings) {
      console.error('❌ Missing required fields:', { 
        hasResumeId: !!resumeId, 
        hasUserId: !!userId, 
        hasSettings: !!settings 
      });
      return res.status(400).json({ error: 'Missing resumeId, userId, or settings' });
    }

    db = await getDatabase();

    // Try the newer table structure first (customization_data column)
    try {
      console.log('💾 Attempting INSERT/UPDATE with customization_data column...');
      const result = await db.query(`
        INSERT INTO resume_customizations (resume_id, user_id, customization_data, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (resume_id) 
        DO UPDATE SET customization_data = $3, updated_at = NOW()
        RETURNING *
      `, [resumeId, userId, JSON.stringify(settings)]);
      
      console.log('✅ Saved to resume_customizations (customization_data column)');
      console.log('📊 Saved row:', result.rows[0]);
    } catch (error: any) {
      console.error('❌ Save error:', error.message);
      // If that fails, try the older table structure (settings column)
      if (error.message?.includes('column') || error.message?.includes('uuid')) {
        console.log('⚠️ Trying older table structure (settings column)...');
        await db.query(`
          INSERT INTO resume_customizations (resume_id, user_id, settings, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (resume_id) 
          DO UPDATE SET settings = $3, updated_at = NOW()
        `, [resumeId, userId, JSON.stringify(settings)]);
        
        console.log('✅ Saved to resume_customizations (settings column)');
      } else {
        throw error;
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error saving customization:', error);
    res.status(500).json({ error: 'Failed to save customization' });
  } finally {
    if (db && (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
      await closeDatabase(db);
    }
  }
});

// Load customization settings for a specific resume
router.get('/load/:resumeId', async (req, res) => {
  let db;
  try {
    const { resumeId } = req.params;
    
    console.log('📥 Loading customization for resume:', resumeId);

    db = await getDatabase();

    // Try newer column name first (customization_data)
    let result = await db.query(`
      SELECT customization_data as settings, updated_at
      FROM resume_customizations
      WHERE resume_id = $1
    `, [resumeId]);

    // If no results or column doesn't exist, try older column name (settings)
    if (result.rows.length === 0) {
      try {
        result = await db.query(`
          SELECT settings, updated_at
          FROM resume_customizations
          WHERE resume_id = $1
        `, [resumeId]);
      } catch (columnError) {
        console.warn('⚠️ Both customization_data and settings columns failed, table may not exist');
      }
    }

    if (result.rows.length > 0) {
      console.log('✅ Found customization settings for resume:', resumeId);
      res.json({
        settings: result.rows[0].settings,
        updatedAt: result.rows[0].updated_at
      });
    } else {
      console.log('ℹ️ No customization settings found for resume:', resumeId, '- returning null');
      // Return null settings gracefully - client will use defaults
      res.json({ settings: null });
    }
  } catch (error) {
    console.error('❌ Error loading customization:', error);
    // Return null settings instead of error - allows graceful fallback to defaults
    res.json({ settings: null });
  } finally {
    if (db && (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
      await closeDatabase(db);
    }
  }
});

// Delete customization settings for a specific resume
router.delete('/delete/:resumeId', async (req, res) => {
  let db;
  try {
    const { resumeId } = req.params;

    db = await getDatabase();

    await db.query('DELETE FROM resume_customizations WHERE resume_id = $1', [resumeId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting customization:', error);
    res.status(500).json({ error: 'Failed to delete customization' });
  } finally {
    if (db && (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
      await closeDatabase(db);
    }
  }
});

export default router;
