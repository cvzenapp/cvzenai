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
        (typeof interview.requirements === 'string' ? JSON.parse(interview.requirements) : interview.requirements) : [];
      
      // Build resume content from separate fields
      const personalInfo = interview.personal_info ? 
        (typeof interview.personal_info === 'string' ? JSON.parse(interview.personal_info) : interview.personal_info) : {};
      const experience = interview.experience ? 
        (typeof interview.experience === 'string' ? JSON.parse(interview.experience) : interview.experience) : [];
      const education = interview.education ? 
        (typeof interview.education === 'string' ? JSON.parse(interview.education) : interview.education) : [];
      const projects = interview.projects ? 
        (typeof interview.projects === 'string' ? JSON.parse(interview.projects) : interview.projects) : [];
      const certifications = interview.certifications ? 
        (typeof interview.certifications === 'string' ? JSON.parse(interview.certifications) : interview.certifications) : [];
      
      // Extract candidate skills from resume
      const resumeSkills = interview.resume_skills ? 
        (typeof interview.resume_skills === 'string' ? JSON.parse(interview.resume_skills) : interview.resume_skills) : [];
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
        `Generate a comprehensive mock test for interview preparation with the following details:

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

JOB REQUIREMENTS:
${jobRequirements.join(', ')}

CANDIDATE RESUME SUMMARY:
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
- Make questions challenging but fair for the ${testLevel} level`,
        prompt,
        {
          temperature: 0.7,
          maxTokens: 3000,
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

      // Parse the AI response
      const cleanedResponse = response.response.trim();
      let jsonStart = cleanedResponse.indexOf('{');
      let jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('Invalid JSON response from AI');
      }

      const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
      const parsedResponse = JSON.parse(jsonString);

      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        throw new Error('Invalid questions format in AI response');
      }

      return parsedResponse;
      
    } catch (error) {
      console.error('Error generating questions with AI:', error);
      throw new Error('Failed to generate mock test questions');
    }
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
      options: row.options ? JSON.parse(row.options) : undefined,
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
          JSON.parse(responseResult.rows[0].selected_options) : undefined,
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
      selectedOptions: row.selected_options ? JSON.parse(row.selected_options) : undefined,
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
          const options = JSON.parse(question.options || '[]');
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