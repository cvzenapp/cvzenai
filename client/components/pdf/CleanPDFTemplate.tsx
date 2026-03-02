import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Resume } from "@shared/api";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 30,
    backgroundColor: "#ffffff",
    lineHeight: 1.5,
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
    paddingBottom: 4,
  },
  title: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 8,
    marginBottom: 15,
    paddingTop: 4,
  },
  contact: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 3,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 15,
    marginTop: 10,
  },
  contactItem: {
    fontSize: 10,
    color: "#374151",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.5,
    color: "#374151",
    marginBottom: 12,
    textAlign: "justify",
  },
  jobTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
  },
  company: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 8,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.4,
    color: "#374151",
    marginBottom: 10,
  },
  achievements: {
    fontSize: 10,
    lineHeight: 1.3,
    color: "#374151",
    marginBottom: 15,
    marginLeft: 10,
  },
  achievementItem: {
    marginBottom: 3,
  },
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillItem: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 4,
    paddingRight: 15,
    minWidth: "48%",
  },
  projectTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 6,
  },
  projectMeta: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 15,
  },
  url: {
    fontSize: 9,
    color: "#2563eb",
  },
  dateRange: {
    fontSize: 9,
    color: "#6b7280",
  },
  technologies: {
    fontSize: 9,
    color: "#059669",
    marginTop: 5,
    fontWeight: "bold",
  },
  education: {
    fontSize: 11,
    color: "#374151",
    marginBottom: 8,
  },
  educationTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 3,
  },
  imageGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  projectImage: {
    width: 60,
    height: 45,
    borderRadius: 4,
  },
  linkText: {
    fontSize: 9,
    color: "#2563eb",
    textDecoration: "underline",
  },
});

export const CleanPDFTemplate: React.FC<{ resume: Resume }> = ({ resume }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={true}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {resume.personalInfo?.name || "Professional Resume"}
          </Text>
          <Text style={styles.title}>{resume.personalInfo?.title || ""}</Text>

          {/* Contact Information in a more organized layout */}
          <View style={styles.contactRow}>
            {resume.personalInfo?.email && (
              <Text style={styles.contactItem}>
                {resume.personalInfo.email}
              </Text>
            )}
            {resume.personalInfo?.phone && (
              <Text style={styles.contactItem}>
                {resume.personalInfo.phone}
              </Text>
            )}
            {resume.personalInfo?.location && (
              <Text style={styles.contactItem}>
                {resume.personalInfo.location}
              </Text>
            )}
          </View>

          {/* Additional contact links */}
          {(resume.personalInfo?.website ||
            resume.personalInfo?.linkedin ||
            resume.personalInfo?.github) && (
            <View style={styles.contactRow}>
              {resume.personalInfo?.website && (
                <Text style={styles.linkText}>
                  {resume.personalInfo.website}
                </Text>
              )}
              {resume.personalInfo?.linkedin && (
                <Text style={styles.linkText}>
                  {resume.personalInfo.linkedin}
                </Text>
              )}
              {resume.personalInfo?.github && (
                <Text style={styles.linkText}>
                  {resume.personalInfo.github}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Summary */}
        {resume.summary && (
          <View>
            <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
            <Text style={styles.paragraph}>{resume.summary}</Text>
          </View>
        )}

        {/* Objective */}
        {resume.objective && (
          <View>
            <Text style={styles.sectionTitle}>CAREER OBJECTIVE</Text>
            <Text style={styles.paragraph}>{resume.objective}</Text>
          </View>
        )}

        {/* Experience */}
        {resume.experiences && resume.experiences.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>EXPERIENCE</Text>
            {resume.experiences.map((exp, index) => (
              <View key={index} style={{ marginBottom: 15 }}>
                <Text style={styles.jobTitle}>{exp.position}</Text>
                <Text style={styles.company}>
                  {exp.company} | {exp.startDate} - {exp.endDate || "Present"}
                  {exp.location && ` | ${exp.location}`}
                </Text>
                <Text style={styles.description}>{exp.description}</Text>

                {/* Technologies used */}
                {exp.technologies && exp.technologies.length > 0 && (
                  <Text style={styles.technologies}>
                    Technologies: {exp.technologies.join(", ")}
                  </Text>
                )}

                {/* Key Achievements */}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.achievements}>
                    <Text style={{ fontWeight: "bold", marginBottom: 3 }}>
                      Key Achievements:
                    </Text>
                    {exp.achievements.map((achievement, achIndex) => (
                      <Text key={achIndex} style={styles.achievementItem}>
                        • {achievement}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>SKILLS</Text>
            <View style={styles.skillsGrid}>
              {resume.skills.map((skill, index) => (
                <Text key={index} style={styles.skillItem}>
                  {skill.name} - {skill.proficiency || skill.level}%
                  {skill.yearsOfExperience &&
                    ` (${skill.yearsOfExperience} years)`}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {resume.projects.map((project, index) => (
              <View key={index} style={{ marginBottom: 20 }}>
                <Text style={styles.projectTitle}>{project.title}</Text>

                {/* Project metadata */}
                <View style={styles.projectMeta}>
                  {project.url && <Text style={styles.url}>{project.url}</Text>}
                  {project.startDate && (
                    <Text style={styles.dateRange}>
                      {project.startDate} - {project.endDate || "Present"}
                    </Text>
                  )}
                </View>

                <Text style={styles.description}>{project.description}</Text>

                {/* Technologies */}
                {project.technologies && project.technologies.length > 0 && (
                  <Text style={styles.technologies}>
                    Technologies: {project.technologies.join(", ")}
                  </Text>
                )}

                {/* GitHub link */}
                {project.github && (
                  <Text style={styles.linkText}>GitHub: {project.github}</Text>
                )}

                {/* Project Images - Note about images in PDF */}
                {project.images && project.images.length > 0 && (
                  <Text style={styles.description}>
                    Project includes {project.images.length} visual asset
                    {project.images.length > 1 ? "s" : ""} (screenshots/demos
                    available online)
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <View style={{ marginTop: 25 }} wrap={false}>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {resume.education.map((edu, index) => (
              <View
                key={index}
                style={{ marginBottom: 15 }}
                wrap={false}
              >
                <Text style={styles.educationTitle}>
                  {edu.degree} in {edu.field}
                </Text>
                <Text style={styles.education}>
                  {edu.institution} | {edu.startDate} - {edu.endDate}
                </Text>
                {edu.location && (
                  <Text style={styles.education}>{edu.location}</Text>
                )}
                {edu.gpa && (
                  <Text style={styles.education}>GPA: {edu.gpa}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {resume.certifications && resume.certifications.length > 0 && (
          <View style={{ marginTop: 25 }} wrap={false}>
            <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
            {resume.certifications.map((cert, index) => (
              <View
                key={index}
                style={{ marginBottom: 15 }}
                wrap={false}
              >
                <Text style={styles.educationTitle}>
                  {cert.name}
                </Text>
                {cert.issuer && (
                  <Text style={styles.education}>
                    Issued by: {cert.issuer}
                  </Text>
                )}
                {cert.date && (
                  <Text style={styles.education}>
                    Date: {cert.date}
                  </Text>
                )}
                {cert.description && (
                  <Text style={styles.description}>
                    {cert.description}
                  </Text>
                )}
                {cert.url && (
                  <Text style={styles.linkText}>
                    Credential: {cert.url}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default CleanPDFTemplate;
