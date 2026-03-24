import { getDatabase } from '../database/connection';
import { abstractedAiService } from './abstractedAiService';

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
  durationMinutes: number;
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

      // Create mock test session (no questions generated upfront)
      const duration = testLevel === 'basic' ? 30 : testLevel === 'moderate' ? 45 : 60;
      const totalQuestions = testLevel === 'basic' ? 5 : testLevel === 'moderate' ? 8 : 12;
      
      const sessionQuery = `
        INSERT INTO mock_test_sessions (
          candidate_id, interview_id, test_level, job_description, 
          candidate_resume, candidate_skills, total_questions, total_score, duration_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const sessionResult = await db.query(sessionQuery, [
        candidateId,
        interviewId,
        testLevel,
        interview.job_description || interview.description,
        resumeContent,
        candidateSkills,
        totalQuestions,
        totalQuestions * 10, // 10 points per question
        duration
      ]);

      await db.query('COMMIT');
      return this.mapSessionFromDb(sessionResult.rows[0]);
      
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
      const response = await abstractedAiService.generateResponse({
        systemPrompt: `Generate a mock test for ${jobTitle} position.

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
        userPrompt: prompt,
        options: {
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
      });

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

  async getNextQuestion(sessionId: number, candidateId: string): Promise<{
    question: MockTestQuestion;
    questionNumber: number;
    totalQuestions: number;
    isLastQuestion: boolean;
  }> {
    const db = await getDatabase();
    
    // Get session details
    const session = await this.getMockTestSession(sessionId, candidateId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Count existing questions
    const questionCountQuery = `
      SELECT COUNT(*) as count FROM mock_test_questions WHERE session_id = $1
    `;
    const countResult = await db.query(questionCountQuery, [sessionId]);
    const currentQuestionCount = parseInt(countResult.rows[0].count);
    
    // Check if we've reached the total questions limit
    if (currentQuestionCount >= session.totalQuestions) {
      throw new Error('All questions have been generated for this session');
    }

    // Get previous questions and answers for context
    const previousQuestionsQuery = `
      SELECT 
        q.question_text,
        q.question_type,
        r.candidate_answer,
        r.is_correct,
        r.ai_feedback
      FROM mock_test_questions q
      LEFT JOIN mock_test_responses r ON q.id = r.question_id
      WHERE q.session_id = $1
      ORDER BY q.question_order ASC
    `;
    const previousResult = await db.query(previousQuestionsQuery, [sessionId]);
    const previousQuestions = previousResult.rows;

    // Generate next question using AI
    const nextQuestion = await this.generateNextQuestionWithAI(
      session,
      previousQuestions,
      currentQuestionCount + 1
    );

    // Insert the generated question
    const insertQuery = `
      INSERT INTO mock_test_questions (
        session_id, question_text, question_type, question_category,
        difficulty_level, options, correct_answer, explanation, points, question_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const result = await db.query(insertQuery, [
      sessionId,
      nextQuestion.questionText,
      nextQuestion.questionType,
      nextQuestion.questionCategory,
      session.testLevel,
      nextQuestion.options ? JSON.stringify(nextQuestion.options) : null,
      '', // No predefined correct answer
      '', // No predefined explanation
      10, // Standard points per question
      currentQuestionCount + 1
    ]);

    const questionRow = result.rows[0];
    const question: MockTestQuestion = {
      id: questionRow.id,
      sessionId: questionRow.session_id,
      questionText: questionRow.question_text,
      questionType: questionRow.question_type,
      questionCategory: questionRow.question_category,
      difficultyLevel: questionRow.difficulty_level,
      options: questionRow.options ? this.safeJsonParse(questionRow.options, 'options') : undefined,
      correctAnswer: questionRow.correct_answer,
      explanation: questionRow.explanation,
      points: questionRow.points,
      questionOrder: questionRow.question_order,
      createdAt:  questionRow.created_at
    };

    return {
      question,
      questionNumber: currentQuestionCount + 1,
      totalQuestions: session.totalQuestions,
      isLastQuestion: (currentQuestionCount + 1) >= session.totalQuestions
    };
  }

  private async generateNextQuestionWithAI(
    session: MockTestSession,
    previousQuestions: any[],
    questionNumber: number
  ): Promise<{
    questionText: string;
    questionType: 'mcq' | 'single_selection' | 'objective' | 'coding';
    questionCategory: string;
    options?: Array<{ id: string; text: string; }>;
  }> {
    const contextSummary = previousQuestions.length > 0 
      ? previousQuestions.map((pq, idx) => 
          `Q${idx + 1}: ${pq.question_text}\nAnswer: ${pq.candidate_answer || 'Not answered'}\nCorrect: ${pq.is_correct ? 'Yes' : 'No'}`
        ).join('\n\n')
      : 'This is the first question.';

    const prompt = `
You are an expert technical interviewer creating a personalized mock test question.

CONTEXT:
- Job Description: ${session.jobDescription}
- Candidate Skills: ${session.candidateSkills.join(', ')}
- Test Level: ${session.testLevel}
- Question Number: ${questionNumber} of ${session.totalQuestions}

PREVIOUS QUESTIONS & PERFORMANCE:
${contextSummary}

INSTRUCTIONS:
1. Generate a ${session.testLevel} level question appropriate for this candidate
2. Make it relevant to the job requirements and candidate's background
3. Consider previous questions to avoid repetition and build complexity
4. Choose appropriate question type based on the topic

QUESTION TYPES:
- mcq: Multiple choice with 4 options (for knowledge/concepts)
- single_selection: Single choice with 4 options (for specific facts)
- objective: Open-ended short answer (for explanations/reasoning)
- coding: Code writing/problem solving (for technical skills)

Respond with JSON only:
{
  "questionText": "Clear, specific question text",
  "questionType": "mcq|single_selection|objective|coding",
  "questionCategory": "technical|behavioral|domain_specific|problem_solving",
  "options": [
    {"id": "A", "text": "Option A text"},
    {"id": "B", "text": "Option B text"},
    {"id": "C", "text": "Option C text"},
    {"id": "D", "text": "Option D text"}
  ]
}

Note: Only include "options" for mcq and single_selection types.`;

    try {
      const aiResponse = await abstractedAiService.generateResponse({
        systemPrompt: 'You are an expert technical interviewer who creates personalized, contextual questions.',
        userPrompt: prompt,
        options: {
          temperature: 0.7,
          maxTokens: 800
        }
      });

      const questionData = JSON.parse(aiResponse.response);
      return questionData;
      
    } catch (error) {
      console.error('AI question generation failed:', error);
      // Fallback question
      return {
        questionText: `What is your experience with ${session.candidateSkills[0] || 'the main technologies'} mentioned in your resume?`,
        questionType: 'objective',
        questionCategory: 'technical'
      };
    }
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
      
      // Evaluate answer using AI (no predefined correct answer)
      const { isCorrect, pointsEarned, feedback } = await this.evaluateAnswerWithAI(question, answer);
      
      // Insert or update response
      const responseQuery = `
        INSERT INTO mock_test_responses (
          session_id, question_id, candidate_answer, selected_options, 
          is_correct, points_earned, ai_feedback
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (session_id, question_id) 
        DO UPDATE SET 
          candidate_answer = EXCLUDED.candidate_answer,
          selected_options = EXCLUDED.selected_options,
          is_correct = EXCLUDED.is_correct,
          points_earned = EXCLUDED.points_earned,
          ai_feedback = EXCLUDED.ai_feedback,
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
        pointsEarned,
        feedback || null
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

  private async evaluateAnswerWithAI(question: any, answer: string | string[]): Promise<{ isCorrect: boolean; pointsEarned: number; feedback?: string }> {
    try {
      const answerText = Array.isArray(answer) ? answer.join(' ') : answer;
      
      if (!answerText || answerText.trim().length === 0) {
        return { isCorrect: false, pointsEarned: 0, feedback: 'No answer provided' };
      }

      const questionType = question.question_type;
      const points = question.points;

      let prompt = '';
      
      if (questionType === 'mcq' || questionType === 'single_selection') {
        // For multiple choice, evaluate the selected option
        const options = question.options ? this.safeJsonParse(question.options, 'options') : [];
        const selectedOption = options.find((opt: any) => opt.id === answerText);
        const selectedText = selectedOption ? selectedOption.text : answerText;

        prompt = `
Evaluate this multiple choice answer:

Question: ${question.question_text}
Available Options: ${options.map((opt: any) => `${opt.id}: ${opt.text}`).join('\n')}
Selected Answer: ${answerText} - ${selectedText}

Evaluate if the selected answer is correct for this question. Consider:
1. Technical accuracy of the selected option
2. Relevance to the question asked
3. Completeness of the answer

Respond with JSON only:
{
  "isCorrect": boolean,
  "score": number (0-1),
  "feedback": "brief explanation of why this answer is correct/incorrect"
}`;
      } else if (questionType === 'coding') {
        prompt = `
Evaluate this coding solution:

Question: ${question.question_text}
Candidate Code:
\`\`\`
${answerText}
\`\`\`

Evaluate the code based on:
1. CORRECTNESS: Does it solve the problem?
2. LOGIC: Is the approach sound?
3. SYNTAX: Is it syntactically correct?
4. EFFICIENCY: Is it reasonably efficient?
5. BEST PRACTICES: Does it follow good coding practices?

Respond with JSON only:
{
  "isCorrect": boolean,
  "score": number (0-1, where 0.6+ is passing),
  "feedback": "detailed feedback on the code quality and correctness"
}`;
      } else {
        // For objective questions
        prompt = `
Evaluate this open-ended answer:

Question: ${question.question_text}
Candidate Answer: ${answerText}

Evaluate the answer based on:
1. ACCURACY: Is the information technically correct?
2. COMPLETENESS: Does it adequately address the question?
3. CLARITY: Is the explanation clear and well-structured?
4. DEPTH: Does it show good understanding of the topic?

Respond with JSON only:
{
  "isCorrect": boolean,
  "score": number (0-1, where 0.7+ is considered correct),
  "feedback": "constructive feedback on the answer quality"
}`;
      }

      const aiResponse = await abstractedAiService.generateResponse({
        systemPrompt: 'You are a fair and experienced technical evaluator. Focus on understanding and correctness rather than perfect wording.',
        userPrompt: prompt,
        options: {
          temperature: 0.2,
          maxTokens: 400
        }
      });
      
      const evaluation = JSON.parse(aiResponse.response);
      
      // Determine correctness based on question type
      const threshold = questionType === 'coding' ? 0.6 : 0.7;
      const isCorrect = evaluation.score >= threshold;
      const pointsEarned = Math.round(evaluation.score * points);
      
      return {
        isCorrect,
        pointsEarned,
        feedback: evaluation.feedback
      };
      
    } catch (error) {
      console.error('AI evaluation failed:', error);
      // Fallback evaluation
      const answerText = Array.isArray(answer) ? answer.join(' ') : answer;
      const hasSubstantialAnswer = answerText && answerText.trim().length > 5;
      
      return { 
        isCorrect: hasSubstantialAnswer, 
        pointsEarned: hasSubstantialAnswer ? Math.floor(question.points * 0.6) : 0,
        feedback: 'AI evaluation unavailable, partial credit given for substantial answer'
      };
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
    results: {
      sessionId: number;
      testLevel: string;
      totalQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
      percentageScore: number;
      timeTaken: number;
      feedback?: string;
      questionResults?: Array<{
        question: string;
        userAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
        explanation?: string;
      }>;
    };
  }> {
    // Get session
    const session = await this.getMockTestSession(sessionId, candidateId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'completed') {
      throw new Error('Test must be completed to view results');
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

    // Calculate results summary
    const correctAnswers = responses.filter(r => r.isCorrect).length;
    const incorrectAnswers = responses.length - correctAnswers;
    const percentageScore = session.percentageScore || 0;
    
    // Calculate time taken (in seconds)
    const timeTaken = session.startedAt && session.completedAt 
      ? Math.floor((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
      : 0;

    // Build question results
    const questionResults = questions.map(question => {
      const response = responses.find(r => r.questionId === question.id);
      return {
        question: question.questionText,
        userAnswer: response?.candidateAnswer || 'No answer',
        correctAnswer: question.correctAnswer,
        isCorrect: response?.isCorrect || false,
        explanation: question.explanation
      };
    });

    const results = {
      sessionId: session.id,
      testLevel: session.testLevel,
      totalQuestions: session.totalQuestions,
      correctAnswers,
      incorrectAnswers,
      percentageScore,
      timeTaken,
      feedback: 'Test completed successfully',
      questionResults
    };

    return { session, questions, responses, results };
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

  private async evaluateAnswer(question: any, answer: string | string[]): Promise<{ isCorrect: boolean; pointsEarned: number; feedback?: string }> {
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
        // Use AI for semantic evaluation of objective questions
        return await this.evaluateWithAI(question, answer, points);

      case 'coding':
        // Use AI for code evaluation
        return await this.evaluateCodeWithAI(question, answer, points);

      default:
        return { isCorrect: false, pointsEarned: 0 };
    }
  }

  private async evaluateWithAI(question: any, answer: string | string[], points: number): Promise<{ isCorrect: boolean; pointsEarned: number; feedback?: string }> {
    try {
      const answerText = Array.isArray(answer) ? answer.join(' ') : answer;
      
      if (!answerText || answerText.trim().length === 0) {
        return { isCorrect: false, pointsEarned: 0, feedback: 'No answer provided' };
      }

      // Get the full correct answer text, not just the option letter
      let correctAnswerText = question.correct_answer;
      
      // If the correct answer is just a letter (A, B, C, D), try to get the full text from options
      if (question.options && /^[A-D]$/i.test(correctAnswerText)) {
        const options = this.safeJsonParse(question.options, 'question_options');
        const correctOption = options.find((opt: any) => opt.id === correctAnswerText || opt.isCorrect);
        if (correctOption) {
          correctAnswerText = correctOption.text;
        }
      }

      const prompt = `
You are an expert evaluator for technical assessments. Evaluate this answer semantically and provide a fair score.

Question: ${question.question_text}
Expected Answer: ${correctAnswerText}
Candidate Answer: ${answerText}

Evaluation Criteria:
1. SEMANTIC CORRECTNESS: Does the candidate's answer convey the same meaning as the expected answer?
2. CORE CONCEPTS: Are the key technical concepts correctly identified?
3. COMPLETENESS: Does the answer cover the main points?
4. TECHNICAL ACCURACY: Is the information technically correct?

IMPORTANT: 
- Give credit for semantically equivalent answers even if worded differently
- Focus on meaning and understanding, not exact wording
- A shorter but accurate answer should get full credit
- Consider partial credit for answers that are partially correct

Respond with JSON only:
{
  "isCorrect": boolean,
  "score": number (0-1, where 0.7+ should be considered correct),
  "feedback": "brief explanation of the evaluation"
}`;

      const aiResponse = await abstractedAiService.generateResponse({
        systemPrompt: 'You are a fair and understanding technical evaluator. Focus on semantic meaning rather than exact word matching.',
        userPrompt: prompt,
        options: {
          temperature: 0.2, // Lower temperature for more consistent evaluation
          maxTokens: 300
        }
      });
      
      const evaluation = JSON.parse(aiResponse.response);
      
      // Consider scores of 0.7 and above as correct
      const isCorrect = evaluation.score >= 0.7;
      const pointsEarned = Math.round(evaluation.score * points);
      
      return {
        isCorrect,
        pointsEarned,
        feedback: evaluation.feedback
      };
      
    } catch (error) {
      console.error('AI evaluation failed:', error);
      // Improved fallback evaluation
      const answerText = Array.isArray(answer) ? answer.join(' ') : answer;
      const hasSubstantialAnswer = answerText && answerText.trim().length > 10;
      
      // Check for key terms from the correct answer
      const correctAnswerLower = question.correct_answer.toLowerCase();
      const answerLower = answerText.toLowerCase();
      const hasKeyTerms = correctAnswerLower.split(' ').some((term: string) => 
        term.length > 3 && answerLower.includes(term)
      );
      
      const fallbackScore = hasSubstantialAnswer && hasKeyTerms ? 0.7 : hasSubstantialAnswer ? 0.5 : 0;
      
      return { 
        isCorrect: fallbackScore >= 0.7, 
        pointsEarned: Math.round(fallbackScore * points),
        feedback: 'AI evaluation unavailable, scored based on content analysis'
      };
    }
  }

  private async evaluateCodeWithAI(question: any, answer: string | string[], points: number): Promise<{ isCorrect: boolean; pointsEarned: number; feedback?: string }> {
    try {
      const codeAnswer = Array.isArray(answer) ? answer.join('\n') : answer;
      
      if (!codeAnswer || codeAnswer.trim().length === 0) {
        return { isCorrect: false, pointsEarned: 0, feedback: 'No code provided' };
      }

      // Get the full correct answer text, not just option letter
      let correctAnswerText = question.correct_answer;
      if (question.options && /^[A-D]$/i.test(correctAnswerText)) {
        const options = this.safeJsonParse(question.options, 'question_options');
        const correctOption = options.find((opt: any) => opt.id === correctAnswerText || opt.isCorrect);
        if (correctOption) {
          correctAnswerText = correctOption.text;
        }
      }

      const prompt = `
You are an expert code evaluator. Evaluate this code solution fairly and comprehensively.

Question: ${question.question_text}
Expected Solution Approach: ${correctAnswerText}
Candidate Code: 
\`\`\`
${codeAnswer}
\`\`\`

Evaluation Criteria:
1. CORRECTNESS: Does it solve the problem correctly?
2. LOGIC: Is the approach sound and well-reasoned?
3. SYNTAX: Is it syntactically correct for the language?
4. EFFICIENCY: Is it reasonably efficient?
5. BEST PRACTICES: Does it follow good coding practices?
6. COMPLETENESS: Does it address all requirements?

IMPORTANT:
- Give credit for working solutions even if different from expected approach
- Consider partial credit for solutions with minor issues
- Focus on problem-solving ability over perfect syntax
- A working solution should get high marks even if not optimal

Respond with JSON only:
{
  "isCorrect": boolean,
  "score": number (0-1, where 0.6+ should be considered passing),
  "feedback": "detailed feedback on the code quality and correctness"
}`;

      const aiResponse = await abstractedAiService.generateResponse({
        systemPrompt: 'You are a fair and experienced code reviewer. Focus on problem-solving ability and correctness over perfect style.',
        userPrompt: prompt,
        options: {
          temperature: 0.2,
          maxTokens: 600
        }
      });
      const evaluation = JSON.parse(aiResponse.response);
      
      // Consider scores of 0.6 and above as correct for code
      const isCorrect = evaluation.score >= 0.6;
      const pointsEarned = Math.round(evaluation.score * points);
      
      return {
        isCorrect,
        pointsEarned,
        feedback: evaluation.feedback
      };
      
    } catch (error) {
      console.error('AI code evaluation failed:', error);
      // Improved fallback for code evaluation
      const codeAnswer = Array.isArray(answer) ? answer.join('\n') : answer;
      const hasCode = codeAnswer && codeAnswer.trim().length > 0;
      
      // Basic code quality checks
      const hasFunction = /function|def|class|=>|\{/.test(codeAnswer);
      const hasLogic = /if|for|while|return|=/.test(codeAnswer);
      const isSubstantial = codeAnswer.length > 20;
      
      let fallbackScore = 0;
      if (hasCode && hasFunction && hasLogic && isSubstantial) {
        fallbackScore = 0.7; // Good attempt
      } else if (hasCode && (hasFunction || hasLogic)) {
        fallbackScore = 0.5; // Partial attempt
      } else if (hasCode) {
        fallbackScore = 0.3; // Some effort
      }
      
      return { 
        isCorrect: fallbackScore >= 0.6, 
        pointsEarned: Math.round(fallbackScore * points),
        feedback: 'AI evaluation unavailable, scored based on code structure analysis'
      };
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
      updatedAt: row.updated_at,
      durationMinutes: row.duration_minutes || 60
    };
  }
}