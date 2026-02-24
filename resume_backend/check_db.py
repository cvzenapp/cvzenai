import sqlite3

try:
    conn = sqlite3.connect('simple_resume.db')
    cursor = conn.cursor()
    
    # Check if resumes table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='resumes'")
    table_exists = cursor.fetchone()
    
    if table_exists:
        print("Resumes table exists")
        
        # Get count of resumes
        cursor.execute('SELECT COUNT(*) FROM resumes')
        count = cursor.fetchone()[0]
        print(f'Total resumes: {count}')
        
        if count > 0:
            # Get sample resumes with IDs
            cursor.execute('SELECT id, title, user_id FROM resumes LIMIT 5')
            rows = cursor.fetchall()
            print('Sample resumes:')
            for row in rows:
                print(f'ID: {row[0]}, Title: {row[1]}, User ID: {row[2]}')
        else:
            print('No resumes found in database')
    else:
        print('Resumes table does not exist')
        
    conn.close()
    
except Exception as e:
    print(f'Error: {e}')