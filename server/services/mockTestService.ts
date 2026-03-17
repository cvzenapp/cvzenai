import { getDatabase } from '../database/connection';
import { groqService } from './groqService';

export interface MockTestSession {
  id: number;
  candidateId: string;
  interviewId: number;
  testLevel: 'basic' | 'moderate' | 'complex';
  jobDescription: string;
  candidateResume: string;
  candidateSkills: string[];
  totalQuestions: number;
  totalScore: number;
  candidateScore?: number;
  percentageScore?: number;
  status: 'generated' | 'in_progress' | 'completed' | 'expired';
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockTestQuestion {
  id: number;
  sessionId: number;
  questionText: string;
  questionType: 'mcq' | 'single_selection' | 'objective' | 'coding';
  questionCategory?: string;
  difficultyLevel: 'basic' | 'moderate' | 'complex';
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer: string;
  explanation?: string;
  points: number;
  questionOrder: number;
  createdAt: Date;
}

export interface MockTestResponse {
  id: number;
  sessionId: number;
  questionId: number;
  candidateAnswer?: string;
  selectedOptions?: string[];
  isCorrect: boolean;
  pointsEarned: number;
  aiFeedback?: string;
  answeredAt: Date;
}

export interface GeneratedMockTest {
  questions: Array<{
    questionText: string;
    questionType: 'mcq' | 'single_selection' | 'objective' | 'coding';
    questionCategory: string;
    options?: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
    correctAnswer: string;
    explanation: string;
    points: number;
  }>;
}

export class MockTestService {
  constructor() {
    // No need for pool parameter - using getDatabase() like other services
  }

  /**
   * Safely parse JSON with better error handling
   */
  private safeJsonParse(jsonString: any, fieldName: string): any {
    try {
      // If it's already an object, return it
      if (typeof jsonString === 'object' && jsonString !== null) {
        return jsonString;
      }
      
      // If it's a string, try to parse it
      if (typeof jsonString === 'string') {
        // Check for the problematic "[object Object]" string
        if (jsonString.startsWith('[object ') && jsonString.endsWith(']')) {
          console.warn(`⚠️ [MOCK TEST] Invalid JSON string detected for ${fieldName}: ${jsonString}`);
          return null;
        }
        return JSON.parse(jsonString);
      }
      
      // For other types, return null
      console.warn(`⚠️ [MOCK TEST] Unexpected data type for ${fieldName}:`, typeof jsonString, jsonString);
      return null;
    } catch (error) {
      console.error(`❌ [MOCK TEST] Failed to parse JSON for ${fieldName}:`, error.message);
      console.error(`   Raw data:`, jsonString);
      return null;
    }
  }

  async generateMockTest(
    candidateId: string,
    interviewId: number,
    testLevel: 'basic' | 'moderate' | 'complex'
  ): Promise<MockTestSession> {
    const db = await getDatabase();
    
    try {
      await db.query('BEGIN');

      // Get interview and candidate details
      const interviewQuery = `
        SELECT 
          ii.*,
          jp.title as job_title,
          jp.description as job_description,
          jp.requirements,
          r.summary as resume_summary,
          r.personal_info,
          r.skills as resume_skills,
          r.experience,
          r.education,
          r.projects,
          r.certifications,
          u.first_name,
          u.last_name,
          u.email as candidate_email
        FROM interview_invitations ii
        LEFT JOIN job_postings jp ON ii.job_posting_id = jp.id
        LEFT JOIN resumes r ON ii.resume_id = r.id
        LEFT JOIN users u ON ii.candidate_id = u.id
        WHERE ii.id = $1 AND ii.candidate_id = $2::uuid AND ii.status = 'accepted'
      `;
      
      const interviewResult = await db.query(interviewQuery, [interviewId, candidateId]);
      
      if (interviewResult.rows.length === 0) {
        throw new Error('Interview not found or not accepted');
      }

      const interview = interviewResult.rows[0];
      
      // Parse requirements from JSONB
      const jobRequirements = interview.requirements ? 
        this.safeJsonParse(interview.requirements, 'requirements') : [];
      
      // Build resume content from separate fields
      const personalInfo = interview.personal_info ? 
        this.safeJsonParse(interview.personal_info, 'personal_info') : {};
      const experience = interview.experience ? 
        this.safeJsonParse(interview.experience, 'experience') : [];
      const education = interview.education ? 
        this.safeJsonParse(interview.education, 'education') : [];
      const projects = interview.projects ? 
        this.safeJsonParse(interview.projects, 'projects') : [];
      const certifications = interview.certifications ? 
        this.safeJsonParse(interview.certifications, 'certifications') : [];
      
      // Extract candidate skills from resume
      const resumeSkills = interview.resume_skills ? 
        this.safeJsonParse(interview.resume_skills, 'resume_skills') : [];
      const candidateSkills = Array.isArray(resumeSkills) ? resumeSkills : [];
      
      // Build comprehensive resume content for AI
      const candidateName = `${interview.first_name || ''} ${interview.last_name || ''}`.trim() || 'N/A';
      const resumeContent = `
        PERSONAL INFO:
        Name: ${personalInfo.name || personalInfo.firstName + ' ' + personalInfo.lastName || candidateName}
        Email: ${personalInfo.email || interview.candidate_email || 'N/A'}
        Phone: ${personalInfo.phone || 'N/A'}
        Location: ${personalInfo.location || 'N/A'}
        
        PROFESSIONAL SUMMARY:
        ${interview.resume_summary || 'N/A'}
        
        WORK EXPERIENCE:
        ${experience.map((exp: any, index: number) => `
        ${index + 1}. ${exp.position || exp.title} at ${exp.company}
           Duration: ${exp.startDate} - ${exp.endDate || 'Present'}
           ${exp.description || exp.responsibilities || ''}
        `).join('\n')}
        
        EDUCATION:
        ${education.map((edu: any, index: number) => `
        ${index + 1}. ${edu.degree} in ${edu.field || edu.major}
           Institution: ${edu.institution || edu.school}
           Year: ${edu.graduationYear || edu.endDate || 'N/A'}
        `).join('\n')}
        
        SKILLS:
        ${candidateSkills.join(', ')}
        
        PROJECTS:
        ${projects.map((proj: any, index: number) => `
        ${index + 1}. ${proj.name || proj.title}
           ${proj.description || ''}
           Technologies: ${proj.technologies ? proj.technologies.join(', ') : 'N/A'}
        `).join('\n')}
        
        CERTIFICATIONS:
        ${certifications.map((cert: any, index: number) => `
        ${index + 1}. ${cert.name}
           Issuer: ${cert.issuer || 'N/A'}
           Date: ${cert.date || 'N/A'}
        `).join('\n')}
      `.trim();

      // Check if a mock test already exists for this level
      const existingTestQuery = `
        SELECT * FROM mock_test_sessions 
        WHERE candidate_id = $1::uuid AND interview_id = $2 AND test_level = $3 
        AND status != 'expired'
        ORDER BY created_at DESC LIMIT 1
      `;
      
      const existingTest = await db.query(existingTestQuery, [candidateId, interviewId, testLevel]);
      
      if (existingTest.rows.length > 0) {
        await db.query('COMMIT');
        return this.mapSessionFromDb(existingTest.rows[0]);
      }

      // Generate questions using AI
      const generatedTest = await this.generateQuestionsWithAI(
        interview.job_description || interview.description,
        interview.job_title || interview.title,
        resumeContent,
        candidateSkills,
        jobRequirements,
        testLevel
      );

      // Create mock test session
      const sessionQuery = `
        INSERT INTO mock_test_sessions (
          candidate_id, interview_id, test_level, job_description, 
          candidate_resume, candidate_skills, total_questions, total_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const totalScore = generatedTest.questions.reduce((sum, q) => sum + q.points, 0);
      
      const sessionResult = await db.query(sessionQuery, [
        candidateId,
        interviewId,
        testLevel,
        interview.job_description || interview.description,
        resumeContent,
        candidateSkills,
        generatedTest.questions.length,
        totalScore
      ]);

      const session = sessionResult.rows[0];

      // Insert questions
      for (let i = 0; i < generatedTest.questions.length; i++) {
        const question = generatedTest.questions[i];
        
        const questionQuery = `
          INSERT INTO mock_test_questions (
            session_id, question_text, question_type, question_category,
            difficulty_level, options, correct_answer, explanation, points, question_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        
        await db.query(questionQuery, [
          session.id,
          question.questionText,
          question.questionType,
          question.questionCategory,
          testLevel,
          question.options ? JSON.stringify(question.options) : null,
          question.correctAnswer,
          question.explanation,
          question.points,
          i + 1
        ]);
      }

      await db.query('COMMIT');
      return this.mapSessionFromDb(session);
      
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error generating mock test:', error);
      throw error;
    }
  }

  private async generateQuestionsWithAI(
    jobDescription: string,
    jobTitle: string,
    resumeContent: string,
    candidateSkills: string[],
    jobRequirements: string[],
    testLevel: 'basic' | 'moderate' | 'complex'
  ): Promise<GeneratedMockTest> {
    const prompt = `Generate a comprehensive mock test for interview preparation with the following details:

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

JOB REQUIREMENTS:
${jobRequirements.join(', ')}

CANDIDATE RESUME:
${resumeContent}

CANDIDATE SKILLS:
${candidateSkills.join(', ')}

TEST LEVEL: ${testLevel}

Generate exactly 15 questions with the following distribution:
- 5 MCQ (Multiple Choice Questions) with 4 options each
- 3 Single Selection questions with 3-4 options each  
- 4 Objective questions (open-ended, can include coding if relevant to skills)
- 3 Coding questions (if technical skills are present, otherwise more objective questions)

Requirements:
1. Questions must be personalized based on the candidate's resume and skills vs job requirements
2. Difficulty should match the ${testLevel} level
3. Include a mix of technical, behavioral, and domain-specific questions
4. For MCQ and Single Selection: provide clear options with only one correct answer
5. For Objective/Coding: provide detailed correct answers and explanations
6. Each question should have appropriate points (1-3 points based on complexity)

Format the response as a JSON object with this exact structure:
{
  "questions": [
    {
      "questionText": "Question text here",
      "questionType": "mcq|single_selection|objective|coding",
      "questionCategory": "technical|behavioral|domain_specific",
      "options": [
        {"id": "A", "text": "Option text", "isCorrect": false},
        {"id": "B", "text": "Option text", "isCorrect": true}
      ],
      "correctAnswer": "Correct answer or explanation",
      "explanation": "Detailed explanation of why this is correct",
      "points": 2
    }
  ]
}

IMPORTANT: 
- For MCQ/Single Selection: options array is required, correctAnswer should be the option ID
- For Objective/Coding: options should be null/undefined, correctAnswer should be the full answer
- Ensure JSON is valid and properly formatted
- Make questions challenging but fair for the ${testLevel} level`;

    try {
      const response = await groqService.generateResponse(
        `Generate a mock test for ${jobTitle} position.

CANDIDATE SKILLS: ${candidateSkills.slice(0, 5).join(', ')}
JOB REQUIREMENTS: ${jobRequirements.slice(0, 3).join(', ')}
TEST LEVEL: ${testLevel}

Generate exactly ${testLevel === 'basic' ? 5 : testLevel === 'moderate' ? 8 : 10} questions:
- Mix of MCQ (4 options) and objective questions
- Match ${testLevel} difficulty level
- Focus on candidate skills vs job requirements

JSON format:
{
  "questions": [
    {
      "questionText": "Question here",
      "questionType": "mcq|objective", 
      "questionCategory": "technical",
      "options": [{"id": "A", "text": "Option", "isCorrect": true}],
      "correctAnswer": "Answer",
      "explanation": "Why correct",
      "points": 5
    }
  ]
}

For MCQ: include options array, correctAnswer = option ID
For objective: no options, correctAnswer = full answer
Return valid JSON only.`,
        prompt,
        {
          temperature: 0.7,
          maxTokens: 2000, // Reduced to prevent truncation
          auditContext: {
            serviceName: 'mock_test_generation',
            operationType: 'generate_questions',
            userContext: {
              jobTitle,
              testLevel,
              candidateSkills,
              jobRequirements
            }
          }
        }
      );

      if (!response.success || !response.response) {
        throw new Error('Failed to generate mock test questions');
      }

      // Parse the AI response with enhanced error handling
      const cleanedResponse = response.response.trim();
      console.log('🔍 [MOCK TEST] Raw AI Response length:', cleanedResponse.length);
      console.log('🔍 [MOCK TEST] Raw AI Response preview:', cleanedResponse.substring(0, 300) + '...');
      console.log('🔍 [MOCK TEST] Raw AI Response ending:', cleanedResponse.substring(Math.max(0, cleanedResponse.length - 200)));
      
      let parsedResponse;
      
      // Try multiple JSON extraction strategies
      const jsonExtractionStrategies = [
        // Strategy 1: Find complete JSON object
        () => {
          const jsonStart = cleanedResponse.indexOf('{');
          const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
          if (jsonStart === -1 || jsonEnd === 0 || jsonEnd <= jsonStart) {
            throw new Error('No valid JSON boundaries found');
          }
          return cleanedResponse.substring(jsonStart, jsonEnd);
        },
        
        // Strategy 2: Find JSON with "questions" key
        () => {
          const questionsIndex = cleanedResponse.indexOf('"questions"');
          if (questionsIndex === -1) {
            throw new Error('No questions key found');
          }
          
          // Work backwards to find opening brace
          let jsonStart = questionsIndex;
          while (jsonStart > 0 && cleanedResponse[jsonStart] !== '{') {
            jsonStart--;
          }
          
          // Work forwards to find closing brace, counting nested braces
          let braceCount = 0;
          let jsonEnd = jsonStart;
          for (let i = jsonStart; i < cleanedResponse.length; i++) {
            if (cleanedResponse[i] === '{') braceCount++;
            if (cleanedResponse[i] === '}') braceCount--;
            if (braceCount === 0 && i > jsonStart) {
              jsonEnd = i + 1;
              break;
            }
          }
          
          if (jsonEnd <= jsonStart) {
            throw new Error('Could not find complete JSON object');
          }
          
          return cleanedResponse.substring(jsonStart, jsonEnd);
        },
        
        // Strategy 3: Try to repair truncated JSON
        () => {
          const jsonStart = cleanedResponse.indexOf('{');
          if (jsonStart === -1) {
            throw new Error('No opening brace found');
          }
          
          let jsonString = cleanedResponse.substring(jsonStart);
          
          // If JSON appears truncated, try to close it properly
          if (!jsonString.trim().endsWith('}')) {
            console.log('⚠️ [MOCK TEST] JSON appears truncated, attempting repair...');
            
            // Count open braces and brackets
            let braceCount = 0;
            let bracketCount = 0;
            let inString = false;
            let lastValidPos = 0;
            
            for (let i = 0; i < jsonString.length; i++) {
              const char = jsonString[i];
              const prevChar = i > 0 ? jsonString[i - 1] : '';
              
              if (char === '"' && prevChar !== '\\') {
                inString = !inString;
              }
              
              if (!inString) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
                if (char === '[') bracketCount++;
                if (char === ']') bracketCount--;
                
                // Track last position where we had valid structure
                if (braceCount >= 0 && bracketCount >= 0) {
                  lastValidPos = i;
                }
              }
            }
            
            // Truncate to last valid position and close structures
            jsonString = jsonString.substring(0, lastValidPos + 1);
            
            // Close any open brackets first
            while (bracketCount > 0) {
              jsonString += ']';
              bracketCount--;
            }
            
            // Close any open braces
            while (braceCount > 0) {
              jsonString += '}';
              braceCount--;
            }
            
            console.log('🔧 [MOCK TEST] Repaired JSON length:', jsonString.length);
          }
          
          return jsonString;
        }
      ];
      
      let jsonString = '';
      let strategyUsed = '';
      
      for (let i = 0; i < jsonExtractionStrategies.length; i++) {
        try {
          jsonString = jsonExtractionStrategies[i]();
          strategyUsed = `Strategy ${i + 1}`;
          console.log(`✅ [MOCK TEST] JSON extracted using ${strategyUsed}`);
          break;
        } catch (strategyError) {
          console.log(`⚠️ [MOCK TEST] Strategy ${i + 1} failed:`, strategyError.message);
          if (i === jsonExtractionStrategies.length - 1) {
            throw new Error('All JSON extraction strategies failed');
          }
        }
      }
      
      console.log('🔍 [MOCK TEST] Extracted JSON length:', jsonString.length);
      console.log('🔍 [MOCK TEST] Extracted JSON preview:', jsonString.substring(0, 300) + '...');
      
      // Try to parse the extracted JSON
      try {
        parsedResponse = JSON.parse(jsonString);
        console.log(`✅ [MOCK TEST] JSON parsed successfully using ${strategyUsed}`);
      } catch (parseError) {
        console.error('❌ [MOCK TEST] Failed to parse extracted JSON:', parseError.message);
        console.error('   JSON string length:', jsonString.length);
        console.error('   JSON preview:', jsonString.substring(0, 500));
        console.error('   JSON ending:', jsonString.substring(Math.max(0, jsonString.length - 200)));
        
        // Try jsonrepair as last resort
        try {
          const { jsonrepair } = await import('jsonrepair');
          const repairedJson = jsonrepair(jsonString);
          parsedResponse = JSON.parse(repairedJson);
          console.log('✅ [MOCK TEST] JSON repaired and parsed successfully');
        } catch (repairError) {
          console.error('❌ [MOCK TEST] JSON repair also failed:', repairError.message);
          throw new Error(`Failed to parse AI response JSON: ${parseError.message}. Repair attempt also failed: ${repairError.message}`);
        }
      }

      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        console.error('❌ [MOCK TEST] Invalid questions format in AI response:', parsedResponse);
        throw new Error('Invalid questions format in AI response');
      }

      // Validate each question has required fields
      const validQuestions = parsedResponse.questions.filter((q: any, index: number) => {
        const isValid = q.questionText && q.questionType && q.correctAnswer;
        if (!isValid) {
          console.warn(`⚠️ [MOCK TEST] Question ${index + 1} is invalid:`, q);
        }
        return isValid;
      });

      if (validQuestions.length === 0) {
        console.error('❌ [MOCK TEST] No valid questions found in AI response');
        throw new Error('No valid questions generated by AI');
      }

      console.log(`✅ [MOCK TEST] Generated ${validQuestions.length} valid questions out of ${parsedResponse.questions.length} total`);
      
      return {
        ...parsedResponse,
        questions: validQuestions
      };
      
    } catch (error) {
      console.error('❌ [MOCK TEST] Error generating questions with AI:', error);
      
      // Try fallback question generation
      console.log('🔄 [MOCK TEST] Attempting fallback question generation...');
      try {
        return await this.generateFallbackQuestions(jobTitle, testLevel, candidateSkills, jobRequirements);
      } catch (fallbackError) {
        console.error('❌ [MOCK TEST] Fallback question generation also failed:', fallbackError);
        throw new Error('Failed to generate mock test questions: ' + error.message);
      }
    }
  }

  /**
   * Generate fallback questions when AI fails
   */
  private async generateFallbackQuestions(
    jobTitle: string,
    testLevel: 'basic' | 'moderate' | 'complex',
    candidateSkills: string[],
    jobRequirements: string[]
  ): Promise<any> {
    console.log('🔄 [MOCK TEST] Generating fallback questions...');
    
    const fallbackQuestions = [];
    const questionCount = testLevel === 'basic' ? 5 : testLevel === 'moderate' ? 8 : 10;
    
    // Generate basic technical questions based on skills
    const commonSkills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS'];
    const relevantSkills = candidateSkills.filter(skill => 
      commonSkills.some(common => skill.toLowerCase().includes(common.toLowerCase()))
    ).slice(0, 3);
    
    if (relevantSkills.length === 0) {
      relevantSkills.push('Programming', 'Software Development', 'Problem Solving');
    }
    
    for (let i = 0; i < questionCount; i++) {
      const skill = relevantSkills[i % relevantSkills.length];
      const questionTypes = ['mcq', 'objective'];
      const questionType = questionTypes[i % questionTypes.length];
      
      let question;
      
      if (questionType === 'mcq') {
        question = {
          questionText: `What is a key concept in ${skill} that every developer should understand?`,
          questionType: 'mcq',
          questionCategory: 'technical',
          options: [
            { id: 'a', text: 'Basic syntax and fundamentals', isCorrect: true },
            { id: 'b', text: 'Advanced optimization techniques', isCorrect: false },
            { id: 'c', text: 'Historical development', isCorrect: false },
            { id: 'd', text: 'Marketing applications', isCorrect: false }
          ],
          correctAnswer: 'a',
          explanation: `Understanding basic syntax and fundamentals is crucial for any ${skill} developer.`,
          points: testLevel === 'basic' ? 5 : testLevel === 'moderate' ? 7 : 10
        };
      } else {
        question = {
          questionText: `Explain the importance of ${skill} in modern software development.`,
          questionType: 'objective',
          questionCategory: 'technical',
          correctAnswer: `${skill} is important because it enables developers to build efficient and scalable applications.`,
          explanation: `This tests understanding of ${skill}'s role in development.`,
          points: testLevel === 'basic' ? 8 : testLevel === 'moderate' ? 10 : 15
        };
      }
      
      fallbackQuestions.push(question);
    }
    
    console.log(`✅ [MOCK TEST] Generated ${fallbackQuestions.length} fallback questions`);
    
    return {
      questions: fallbackQuestions,
      totalQuestions: fallbackQuestions.length,
      testLevel: testLevel,
      generatedBy: 'fallback_system'
    };
  }

  async getMockTestSession(sessionId: number, candidateId: string): Promise<MockTestSession | null> {
    const db = await getDatabase();
    const query = `
      SELECT * FROM mock_test_sessions 
      WHERE id = $1 AND candidate_id = $2::uuid
    `;
    
    const result = await db.query(query, [sessionId, candidateId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapSessionFromDb(result.rows[0]);
  }

  async getMockTestQuestions(sessionId: number): Promise<MockTestQuestion[]> {
    const db = await getDatabase();
    const query = `
      SELECT * FROM mock_test_questions 
      WHERE session_id = $1 
      ORDER BY question_order ASC
    `;
    
    const result = await db.query(query, [sessionId]);
    
    return result.rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      questionText: row.question_text,
      questionType: row.question_type,
      questionCategory: row.question_category,
      difficultyLevel: row.difficulty_level,
      options: row.options ? this.safeJsonParse(row.options, 'options') : undefined,
      correctAnswer: row.correct_answer,
      explanation: row.explanation,
      points: row.points,
      questionOrder: row.question_order,
      createdAt: row.created_at
    }));
  }

  async submitAnswer(
    sessionId: number,
    questionId: number,
    candidateId: string,
    answer: string | string[]
  ): Promise<MockTestResponse> {
    const db = await getDatabase();
    
    try {
      await db.query('BEGIN');

      // Verify session belongs to candidate
      const sessionCheck = await db.query(
        'SELECT * FROM mock_test_sessions WHERE id = $1 AND candidate_id = $2::uuid',
        [sessionId, candidateId]
      );
      
      if (sessionCheck.rows.length === 0) {
        throw new Error('Session not found or unauthorized');
      }

      // Get question details
      const questionQuery = await db.query(
        'SELECT * FROM mock_test_questions WHERE id = $1 AND session_id = $2',
        [questionId, sessionId]
      );
      
      if (questionQuery.rows.length === 0) {
        throw new Error('Question not found');
      }

      const question = questionQuery.rows[0];
      
      // Evaluate answer
      const { isCorrect, pointsEarned } = this.evaluateAnswer(question, answer);
      
      // Insert or update response
      const responseQuery = `
        INSERT INTO mock_test_responses (
          session_id, question_id, candidate_answer, selected_options, 
          is_correct, points_earned
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (session_id, question_id) 
        DO UPDATE SET 
          candidate_answer = EXCLUDED.candidate_answer,
          selected_options = EXCLUDED.selected_options,
          is_correct = EXCLUDED.is_correct,
          points_earned = EXCLUDED.points_earned,
          answered_at = NOW()
        RETURNING *
      `;
      
      const candidateAnswer = Array.isArray(answer) ? answer.join(', ') : answer;
      const selectedOptions = Array.isArray(answer) ? answer : null;
      
      const responseResult = await db.query(responseQuery, [
        sessionId,
        questionId,
        candidateAnswer,
        selectedOptions ? JSON.stringify(selectedOptions) : null,
        isCorrect,
        pointsEarned
      ]);

      // Update session if in_progress
      await db.query(
        `UPDATE mock_test_sessions 
         SET status = 'in_progress', started_at = COALESCE(started_at, NOW()), updated_at = NOW()
         WHERE id = $1 AND status = 'generated'`,
        [sessionId]
      );

      await db.query('COMMIT');
      
      return {
        id: responseResult.rows[0].id,
        sessionId: responseResult.rows[0].session_id,
        questionId: responseResult.rows[0].question_id,
        candidateAnswer: responseResult.rows[0].candidate_answer,
        selectedOptions: responseResult.rows[0].selected_options ? 
          this.safeJsonParse(responseResult.rows[0].selected_options, 'selected_options') : undefined,
        isCorrect: responseResult.rows[0].is_correct,
        pointsEarned: responseResult.rows[0].points_earned,
        aiFeedback: responseResult.rows[0].ai_feedback,
        answeredAt: responseResult.rows[0].answered_at
      };
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  async completeMockTest(sessionId: number, candidateId: string): Promise<MockTestSession> {
    const db = await getDatabase();
    
    try {
      await db.query('BEGIN');

      // Calculate final score
      const scoreQuery = `
        SELECT 
          COUNT(*) as total_answered,
          SUM(points_earned) as total_earned,
          mts.total_score
        FROM mock_test_responses mtr
        JOIN mock_test_sessions mts ON mtr.session_id = mts.id
        WHERE mtr.session_id = $1 AND mts.candidate_id = $2::uuid
        GROUP BY mts.total_score
      `;
      
      const scoreResult = await db.query(scoreQuery, [sessionId, candidateId]);
      
      if (scoreResult.rows.length === 0) {
        throw new Error('No responses found for this test');
      }

      const { total_earned, total_score } = scoreResult.rows[0];
      const percentageScore = total_score > 0 ? (total_earned / total_score) * 100 : 0;

      // Update session
      const updateQuery = `
        UPDATE mock_test_sessions 
        SET 
          status = 'completed',
          candidate_score = $1,
          percentage_score = $2,
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = $3 AND candidate_id = $4::uuid
        RETURNING *
      `;
      
      const result = await db.query(updateQuery, [
        total_earned,
        percentageScore,
        sessionId,
        candidateId
      ]);

      await db.query('COMMIT');
      
      if (result.rows.length === 0) {
        throw new Error('Session not found or unauthorized');
      }

      return this.mapSessionFromDb(result.rows[0]);
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  async getMockTestResults(sessionId: number, candidateId: string): Promise<{
    session: MockTestSession;
    questions: MockTestQuestion[];
    responses: MockTestResponse[];
  }> {
    // Get session
    const session = await this.getMockTestSession(sessionId, candidateId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Get questions
    const questions = await this.getMockTestQuestions(sessionId);

    // Get responses
    const db = await getDatabase();
    const responseQuery = `
      SELECT * FROM mock_test_responses 
      WHERE session_id = $1 
      ORDER BY question_id ASC
    `;
    
    const responseResult = await db.query(responseQuery, [sessionId]);
    
    const responses = responseResult.rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      questionId: row.question_id,
      candidateAnswer: row.candidate_answer,
      selectedOptions: row.selected_options ? this.safeJsonParse(row.selected_options, 'selected_options') : undefined,
      isCorrect: row.is_correct,
      pointsEarned: row.points_earned,
      aiFeedback: row.ai_feedback,
      answeredAt: row.answered_at
    }));

    return { session, questions, responses };
  }

  async getCandidateMockTests(candidateId: string, interviewId?: number): Promise<MockTestSession[]> {
    const db = await getDatabase();
    let query = `
      SELECT * FROM mock_test_sessions 
      WHERE candidate_id = $1::uuid
    `;
    const params = [candidateId];

    if (interviewId) {
      query += ' AND interview_id = $2';
      params.push(interviewId.toString());
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    
    return result.rows.map(row => this.mapSessionFromDb(row));
  }

  private evaluateAnswer(question: any, answer: string | string[]): { isCorrect: boolean; pointsEarned: number } {
    const questionType = question.question_type;
    const correctAnswer = question.correct_answer;
    const points = question.points;

    switch (questionType) {
      case 'mcq':
        if (Array.isArray(answer)) {
          // For MCQ, check if all selected options are correct
          const options = this.safeJsonParse(question.options || '[]', 'question_options');
          const correctOptions = options.filter((opt: any) => opt.isCorrect).map((opt: any) => opt.id);
          const isCorrect = answer.length === correctOptions.length && 
            answer.every(opt => correctOptions.includes(opt));
          return { isCorrect, pointsEarned: isCorrect ? points : 0 };
        }
        return { isCorrect: false, pointsEarned: 0 };

      case 'single_selection':
        const singleAnswer = Array.isArray(answer) ? answer[0] : answer;
        const isCorrect = singleAnswer === correctAnswer;
        return { isCorrect, pointsEarned: isCorrect ? points : 0 };

      case 'objective':
      case 'coding':
        // For objective and coding questions, we'll need AI evaluation
        // For now, we'll mark as partially correct and let AI provide feedback later
        const answerText = Array.isArray(answer) ? answer.join(' ') : answer;
        const hasAnswer = answerText && answerText.trim().length > 0;
        return { isCorrect: hasAnswer, pointsEarned: hasAnswer ? Math.floor(points * 0.5) : 0 };

      default:
        return { isCorrect: false, pointsEarned: 0 };
    }
  }

  private mapSessionFromDb(row: any): MockTestSession {
    return {
      id: row.id,
      candidateId: row.candidate_id,
      interviewId: row.interview_id,
      testLevel: row.test_level,
      jobDescription: row.job_description,
      candidateResume: row.candidate_resume,
      candidateSkills: row.candidate_skills,
      totalQuestions: row.total_questions,
      totalScore: row.total_score,
      candidateScore: row.candidate_score,
      percentageScore: row.percentage_score ? parseFloat(row.percentage_score) : undefined,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}