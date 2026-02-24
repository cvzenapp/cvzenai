import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'

const ResumeEditor = ({ resumeData, onSave, onBack }) => {
  // Initialize state with parsed data or empty structure
  const [formData, setFormData] = useState({
    title: '',
    personal_info: {
      name: '',
      title: '',
      summary: '',
      first_name: '',
      last_name: ''
    },
    contact_info: {
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: ''
    },
    work_experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: []
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [isNewUpload, setIsNewUpload] = useState(false)

  // Populate form data when resumeData changes
  useEffect(() => {
    if (resumeData) {
      console.log('📊 Populating fields with parsed data:', resumeData)
      
      if (resumeData.isNewUpload && resumeData.parsedData) {
        // This is a new upload with parsed data - populate all fields
        const parsed = resumeData.parsedData
        setIsNewUpload(true)
        
        setFormData({
          title: resumeData.suggestedTitle || 'New Resume',
          personal_info: {
            name: parsed.personal_info?.name || '',
            title: parsed.personal_info?.title || '',
            summary: parsed.personal_info?.summary || '',
            first_name: parsed.personal_info?.first_name || '',
            last_name: parsed.personal_info?.last_name || ''
          },
          contact_info: {
            email: parsed.contact_info?.email || '',
            phone: parsed.contact_info?.phone || '',
            location: parsed.contact_info?.location || '',
            linkedin: parsed.contact_info?.linkedin || '',
            github: parsed.contact_info?.github || '',
            website: parsed.contact_info?.website || ''
          },
          work_experience: parsed.work_experience || [],
          education: parsed.education || [],
          skills: parsed.skills || [],
          certifications: parsed.certifications || [],
          projects: parsed.projects || [],
          languages: parsed.languages || []
        })
        
        setSaveStatus(`✅ Parsed ${parsed.work_experience?.length || 0} jobs, ${parsed.education?.length || 0} education entries, ${parsed.skills?.length || 0} skills`)
      } else {
        // This is existing resume data from database
        setIsNewUpload(false)
        setFormData({
          title: resumeData.resume?.title || '',
          personal_info: resumeData.personal_info || {},
          contact_info: resumeData.contact_info || {},
          work_experience: resumeData.work_experience || [],
          education: resumeData.education || [],
          skills: resumeData.skills || [],
          certifications: resumeData.certifications || [],
          projects: resumeData.projects || [],
          languages: resumeData.languages || []
        })
      }
    }
  }, [resumeData])

  const handlePersonalInfoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }))
  }

  const handleContactInfoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [field]: value
      }
    }))
  }

  const handleWorkExperienceChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      work_experience: prev.work_experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      work_experience: [...prev.work_experience, {
        company_name: '',
        job_title: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: ''
      }]
    }))
  }

  const removeWorkExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      work_experience: prev.work_experience.filter((_, i) => i !== index)
    }))
  }

  const handleEducationChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, {
        institution_name: '',
        degree_type: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        gpa: '',
        description: ''
      }]
    }))
  }

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const handleSkillChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }))
  }

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, {
        skill_name: '',
        skill_category: '',
        proficiency_level: ''
      }]
    }))
  }

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    console.log('🔄 Save button clicked - starting save process')
    setIsSaving(true)
    setSaveStatus('💾 Saving resume...')

    try {
      const token = localStorage.getItem('token')
      console.log('🔑 Token check:', token ? 'Token found' : 'No token found')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Prepare data for saving
      const saveData = {
        ...formData,
        original_filename: resumeData?.originalFilename || '',
        raw_text: resumeData?.parsedData?.raw_text || ''
      }

      console.log('💾 Saving resume data:', saveData)
      console.log('🌐 API URL:', `${API_BASE_URL}/api/resumes/save`)
      console.log('📤 Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 10)}...`
      })

      const response = await fetch(`${API_BASE_URL}/api/resumes/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saveData)
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Save failed - error data:', errorData)
        throw new Error(errorData.error || `Save failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Resume saved successfully:', result)
      
      setSaveStatus('✅ Resume saved successfully!')
      setIsNewUpload(false)
      
      // Call parent save handler
      if (onSave) {
        console.log('📞 Calling parent onSave handler')
        onSave(result)
      }

    } catch (err) {
      console.error('💥 Save error details:', err)
      setSaveStatus(`❌ Save failed: ${err.message}`)
    } finally {
      setIsSaving(false)
      console.log('🏁 Save process completed')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isNewUpload ? '🎯 Review & Edit Parsed Resume' : '📝 Edit Resume'}
          </h1>
          {isNewUpload && (
            <p className="text-green-600 mt-1">
              ✨ Enterprise AI has parsed your resume. Review and edit the fields below, then save.
            </p>
          )}
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {saveStatus && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveStatus.includes('✅') ? 'bg-green-50 text-green-700' :
          saveStatus.includes('❌') ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {saveStatus}
        </div>
      )}

      <div className="space-y-8">
        {/* Resume Title */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">📋 Resume Title</h2>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter resume title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Personal Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">👤 Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.personal_info.name}
                onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
              <input
                type="text"
                value={formData.personal_info.title}
                onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                placeholder="Software Engineer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
            <textarea
              value={formData.personal_info.summary}
              onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
              placeholder="Brief professional summary..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">📞 Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.contact_info.email}
                onChange={(e) => handleContactInfoChange('email', e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.contact_info.phone}
                onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.contact_info.location}
                onChange={(e) => handleContactInfoChange('location', e.target.value)}
                placeholder="San Francisco, CA"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <input
                type="url"
                value={formData.contact_info.linkedin}
                onChange={(e) => handleContactInfoChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Work Experience */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">💼 Work Experience ({formData.work_experience.length})</h2>
            <button
              onClick={addWorkExperience}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Experience
            </button>
          </div>
          
          {formData.work_experience.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No work experience added yet. Click "Add Experience" to start.</p>
          ) : (
            <div className="space-y-6">
              {formData.work_experience.map((exp, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium text-gray-800">Experience {index + 1}</h3>
                    <button
                      onClick={() => removeWorkExperience(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={exp.company_name || ''}
                        onChange={(e) => handleWorkExperienceChange(index, 'company_name', e.target.value)}
                        placeholder="Company Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={exp.job_title || ''}
                        onChange={(e) => handleWorkExperienceChange(index, 'job_title', e.target.value)}
                        placeholder="Job Title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={exp.location || ''}
                        onChange={(e) => handleWorkExperienceChange(index, 'location', e.target.value)}
                        placeholder="City, State"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={exp.start_date || ''}
                          onChange={(e) => handleWorkExperienceChange(index, 'start_date', e.target.value)}
                          placeholder="Start Date"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={exp.end_date || ''}
                          onChange={(e) => handleWorkExperienceChange(index, 'end_date', e.target.value)}
                          placeholder="End Date"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={exp.description || ''}
                      onChange={(e) => handleWorkExperienceChange(index, 'description', e.target.value)}
                      placeholder="Describe your responsibilities and achievements..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Education */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">🎓 Education ({formData.education.length})</h2>
            <button
              onClick={addEducation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Education
            </button>
          </div>
          
          {formData.education.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No education added yet. Click "Add Education" to start.</p>
          ) : (
            <div className="space-y-6">
              {formData.education.map((edu, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium text-gray-800">Education {index + 1}</h3>
                    <button
                      onClick={() => removeEducation(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                      <input
                        type="text"
                        value={edu.institution_name || ''}
                        onChange={(e) => handleEducationChange(index, 'institution_name', e.target.value)}
                        placeholder="University Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                      <input
                        type="text"
                        value={edu.degree_type || ''}
                        onChange={(e) => handleEducationChange(index, 'degree_type', e.target.value)}
                        placeholder="Bachelor of Science"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                      <input
                        type="text"
                        value={edu.field_of_study || ''}
                        onChange={(e) => handleEducationChange(index, 'field_of_study', e.target.value)}
                        placeholder="Computer Science"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                      <input
                        type="text"
                        value={edu.gpa || ''}
                        onChange={(e) => handleEducationChange(index, 'gpa', e.target.value)}
                        placeholder="3.8"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">🛠️ Skills ({formData.skills.length})</h2>
            <button
              onClick={addSkill}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Skill
            </button>
          </div>
          
          {formData.skills.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No skills added yet. Click "Add Skill" to start.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.skills.map((skill, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-700">Skill {index + 1}</span>
                    <button
                      onClick={() => removeSkill(index)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={skill.skill_name || ''}
                      onChange={(e) => handleSkillChange(index, 'skill_name', e.target.value)}
                      placeholder="Skill name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <select
                      value={skill.skill_category || ''}
                      onChange={(e) => handleSkillChange(index, 'skill_category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Select category</option>
                      <option value="Programming Languages">Programming Languages</option>
                      <option value="Frameworks & Libraries">Frameworks & Libraries</option>
                      <option value="Tools & Technologies">Tools & Technologies</option>
                      <option value="Databases">Databases</option>
                      <option value="Cloud Platforms">Cloud Platforms</option>
                      <option value="Soft Skills">Soft Skills</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-center pt-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              isSaving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving Resume...
              </span>
            ) : (
              '💾 Save Resume'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResumeEditor

