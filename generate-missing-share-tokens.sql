-- Migration to generate shareTokens for existing resumes that don't have them
-- This script creates resume_shares entries for resumes that don't have shareTokens yet

DO $$
DECLARE
    resume_record RECORD;
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER;
    existing_count INTEGER;
BEGIN
    -- Loop through all resumes that don't have a share_token
    FOR resume_record IN 
        SELECT r.id, r.user_id, r.personal_info 
        FROM resumes r 
        LEFT JOIN resume_shares rs ON r.id = rs.resume_id 
        WHERE rs.resume_id IS NULL
    LOOP
        -- Extract name from personal_info JSON
        base_slug := COALESCE(
            (resume_record.personal_info->>'fullName'),
            (resume_record.personal_info->>'name'),
            CONCAT(
                COALESCE(resume_record.personal_info->>'firstName', ''),
                ' ',
                COALESCE(resume_record.personal_info->>'lastName', '')
            ),
            'resume'
        );
        
        -- Clean up the slug
        base_slug := LOWER(TRIM(base_slug));
        base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
        base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
        base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
        base_slug := TRIM(base_slug, '-');
        
        -- If slug is empty, use 'resume'
        IF base_slug = '' OR base_slug IS NULL THEN
            base_slug := 'resume';
        END IF;
        
        -- Find unique slug
        final_slug := base_slug;
        counter := 1;
        
        LOOP
            SELECT COUNT(*) INTO existing_count 
            FROM resume_shares 
            WHERE share_token = final_slug;
            
            EXIT WHEN existing_count = 0;
            
            final_slug := base_slug || '-' || counter;
            counter := counter + 1;
        END LOOP;
        
        -- Insert the share token
        INSERT INTO resume_shares (resume_id, user_id, share_token, is_active, expires_at)
        VALUES (resume_record.id, resume_record.user_id, final_slug, true, NULL);
        
        RAISE NOTICE 'Created shareToken % for resume %', final_slug, resume_record.id;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;