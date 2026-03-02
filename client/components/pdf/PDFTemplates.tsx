import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from "@react-pdf/renderer";
import { Resume } from "@shared/api";

// Common styles
const commonStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
    padding: 30,
    backgroundColor: "#ffffff",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 5,
  },
  text: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.4,
  },
  boldText: {
    fontWeight: "bold",
    color: "#1f2937",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 20,
  },
  contactInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginTop: 10,
  },
  contactItem: {
    fontSize: 9,
    color: "#6b7280",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 8,
  },
  projectImage: {
    width: 60,
    height: 40,
    objectFit: "cover",
    borderRadius: 4,
    marginRight: 10,
  },
  achievementItem: {
    marginBottom: 3,
    paddingLeft: 10,
    fontSize: 9,
  },
});

// Technology Template PDF
export const TechnologyPDFTemplate: React.FC<{ resume: Resume }> = ({
  resume,
}) => {
  const styles = StyleSheet.create({
    ...commonStyles,
    techHeader: {
      backgroundColor: "#1f2937",
      color: "#ffffff",
      padding: 20,
      marginBottom: 20,
      borderRadius: 8,
    },
    techName: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 5,
    },
    techTitle: {
      fontSize: 14,
      color: "#9ca3af",
      marginBottom: 10,
    },
    techStats: {
      flexDirection: "row",
      gap: 20,
      marginTop: 10,
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#10b981",
    },
    statLabel: {
      fontSize: 8,
      color: "#9ca3af",
    },
    codeBlock: {
      backgroundColor: "#1f2937",
      color: "#10b981",
      padding: 10,
      fontFamily: "Courier",
      fontSize: 9,
      borderRadius: 4,
      marginBottom: 10,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Tech Header */}
        <View style={styles.techHeader}>
          <Text style={styles.techName}>{resume.personalInfo.name}</Text>
          <Text style={styles.techTitle}>{resume.personalInfo.title}</Text>

          <View style={styles.techStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {resume.projects?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{resume.skills?.length || 0}</Text>
              <Text style={styles.statLabel}>Skills</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {resume.experiences?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Companies</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactItem}>📧 {resume.personalInfo.email}</Text>
          <Text style={styles.contactItem}>📱 {resume.personalInfo.phone}</Text>
          <Text style={styles.contactItem}>
            📍 {resume.personalInfo.location}
          </Text>
          {resume.personalInfo.github && (
            <Text style={styles.contactItem}>
              🔗 {resume.personalInfo.github}
            </Text>
          )}
        </View>

        {/* Summary */}
        {resume.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>// About</Text>
            <Text style={styles.codeBlock}>
              {`const developer = {\n  summary: "${resume.summary}",\n  status: "available"\n};`}
            </Text>
          </View>
        )}

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>// Tech Stack</Text>
            <View style={styles.skillsContainer}>
              {resume.skills.map((skill, index) => (
                <Text key={index} style={styles.skillChip}>
                  {skill.name} ({skill.proficiency || skill.level}%)
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Experience */}
        {resume.experiences && resume.experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>// Work History</Text>
            {resume.experiences.map((exp, index) => (
              <View key={index} style={{ marginBottom: 15 }}>
                <Text style={styles.boldText}>{exp.position}</Text>
                <Text style={styles.text}>
                  {exp.company} • {exp.startDate} - {exp.endDate || "Present"}
                </Text>
                <Text style={styles.text}>{exp.description}</Text>
                {exp.achievements &&
                  exp.achievements.map((achievement, i) => (
                    <Text key={i} style={styles.achievementItem}>
                      • {achievement}
                    </Text>
                  ))}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>// Featured Projects</Text>
            {resume.projects.map((project, index) => (
              <View key={index} style={{ marginBottom: 15 }}>
                <Text style={styles.boldText}>{project.title}</Text>
                <Text style={styles.text}>{project.description}</Text>
                {project.technologies && (
                  <View style={styles.skillsContainer}>
                    {project.technologies.map((tech, i) => (
                      <Text key={i} style={styles.skillChip}>
                        {tech}
                      </Text>
                    ))}
                  </View>
                )}
                {project.url && (
                  <Link
                    src={project.url}
                    style={{ fontSize: 8, color: "#3b82f6", marginTop: 5 }}
                  >
                    🔗 {project.url}
                  </Link>
                )}
                {project.images && project.images.length > 0 && (
                  <Text style={styles.text}>
                    📷 {project.images.length} project image(s) available
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>// Education</Text>
            {resume.education.map((edu, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Text style={styles.boldText}>
                  {edu.degree} in {edu.field}
                </Text>
                <Text style={styles.text}>
                  {edu.institution} • {edu.startDate} - {edu.endDate}
                </Text>
                {edu.gpa && <Text style={styles.text}>GPA: {edu.gpa}</Text>}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

// Creative Design Template PDF
export const CreativePDFTemplate: React.FC<{ resume: Resume }> = ({
  resume,
}) => {
  const styles = StyleSheet.create({
    ...commonStyles,
    creativeHeader: {
      backgroundColor: "#ec4899",
      color: "#ffffff",
      padding: 20,
      marginBottom: 20,
      borderRadius: 12,
    },
    creativeName: {
      fontSize: 26,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 5,
    },
    creativeTitle: {
      fontSize: 16,
      color: "#fce7f3",
      marginBottom: 10,
    },
    portfolioGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    portfolioItem: {
      width: "48%",
      marginBottom: 10,
    },
    portfolioImage: {
      width: "100%",
      height: 80,
      objectFit: "cover",
      borderRadius: 8,
      marginBottom: 5,
    },
    colorAccent: {
      color: "#ec4899",
      fontWeight: "bold",
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Creative Header */}
        <View style={styles.creativeHeader}>
          <Text style={styles.creativeName}>{resume.personalInfo.name}</Text>
          <Text style={styles.creativeTitle}>{resume.personalInfo.title}</Text>
        </View>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactItem}>✉️ {resume.personalInfo.email}</Text>
          <Text style={styles.contactItem}>📞 {resume.personalInfo.phone}</Text>
          <Text style={styles.contactItem}>
            📍 {resume.personalInfo.location}
          </Text>
          {resume.personalInfo.website && (
            <Text style={styles.contactItem}>
              🌐 {resume.personalInfo.website}
            </Text>
          )}
        </View>

        {/* About */}
        {resume.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.text}>{resume.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {resume.experiences && resume.experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {resume.experiences.map((exp, index) => (
              <View key={index} style={{ marginBottom: 15 }}>
                <Text style={[styles.boldText, styles.colorAccent]}>
                  {exp.position}
                </Text>
                <Text style={styles.boldText}>{exp.company}</Text>
                <Text style={styles.text}>
                  {exp.startDate} - {exp.endDate || "Present"} • {exp.location}
                </Text>
                <Text style={styles.text}>{exp.description}</Text>
                {exp.achievements &&
                  exp.achievements.map((achievement, i) => (
                    <Text key={i} style={styles.achievementItem}>
                      → {achievement}
                    </Text>
                  ))}
              </View>
            ))}
          </View>
        )}

        {/* Portfolio Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Portfolio</Text>
            {resume.projects.map((project, index) => (
              <View key={index} style={{ marginBottom: 15 }}>
                <Text style={[styles.boldText, styles.colorAccent]}>
                  {project.title}
                </Text>
                <Text style={styles.text}>{project.description}</Text>
                {project.images && project.images.length > 0 && (
                  <Text style={styles.text}>
                    🎨 {project.images.length} portfolio image(s)
                  </Text>
                )}
                {project.url && (
                  <Link
                    src={project.url}
                    style={{ fontSize: 8, color: "#ec4899", marginTop: 3 }}
                  >
                    View Project →
                  </Link>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills & Expertise</Text>
            <View style={styles.skillsContainer}>
              {resume.skills.map((skill, index) => (
                <Text
                  key={index}
                  style={[styles.skillChip, { backgroundColor: "#fce7f3" }]}
                >
                  {skill.name}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((edu, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Text style={[styles.boldText, styles.colorAccent]}>
                  {edu.degree} in {edu.field}
                </Text>
                <Text style={styles.text}>{edu.institution}</Text>
                <Text style={styles.text}>
                  {edu.startDate} - {edu.endDate}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

// Management Template PDF
export const ManagementPDFTemplate: React.FC<{ resume: Resume }> = ({
  resume,
}) => {
  const styles = StyleSheet.create({
    ...commonStyles,
    executiveHeader: {
      backgroundColor: "#1e40af",
      color: "#ffffff",
      padding: 25,
      marginBottom: 25,
    },
    executiveName: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 5,
    },
    executiveTitle: {
      fontSize: 16,
      color: "#bfdbfe",
      marginBottom: 15,
    },
    keyMetrics: {
      flexDirection: "row",
      gap: 25,
      marginTop: 15,
    },
    metricItem: {
      alignItems: "center",
    },
    metricValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#fbbf24",
    },
    metricLabel: {
      fontSize: 9,
      color: "#bfdbfe",
    },
    leadershipSection: {
      backgroundColor: "#f8fafc",
      padding: 15,
      borderRadius: 8,
      marginBottom: 15,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Executive Header */}
        <View style={styles.executiveHeader}>
          <Text style={styles.executiveName}>{resume.personalInfo.name}</Text>
          <Text style={styles.executiveTitle}>{resume.personalInfo.title}</Text>

          <View style={styles.keyMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {resume.experiences?.length || 0}
              </Text>
              <Text style={styles.metricLabel}>Leadership Roles</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {resume.projects?.length || 0}
              </Text>
              <Text style={styles.metricLabel}>Major Initiatives</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>8+</Text>
              <Text style={styles.metricLabel}>Years Experience</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactItem}>📧 {resume.personalInfo.email}</Text>
          <Text style={styles.contactItem}>📱 {resume.personalInfo.phone}</Text>
          <Text style={styles.contactItem}>
            📍 {resume.personalInfo.location}
          </Text>
          {resume.personalInfo.linkedin && (
            <Text style={styles.contactItem}>
              💼 {resume.personalInfo.linkedin}
            </Text>
          )}
        </View>

        {/* Executive Summary */}
        {resume.summary && (
          <View style={styles.leadershipSection}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <Text style={styles.text}>{resume.summary}</Text>
          </View>
        )}

        {/* Leadership Experience */}
        {resume.experiences && resume.experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leadership Experience</Text>
            {resume.experiences.map((exp, index) => (
              <View key={index} style={{ marginBottom: 20 }}>
                <Text
                  style={[styles.boldText, { fontSize: 12, color: "#1e40af" }]}
                >
                  {exp.position}
                </Text>
                <Text style={styles.boldText}>{exp.company}</Text>
                <Text style={styles.text}>
                  {exp.startDate} - {exp.endDate || "Present"} • {exp.location}
                </Text>
                <Text style={styles.text}>{exp.description}</Text>

                {exp.achievements && (
                  <View style={{ marginTop: 8 }}>
                    <Text
                      style={[
                        styles.boldText,
                        { fontSize: 10, marginBottom: 5 },
                      ]}
                    >
                      Key Achievements:
                    </Text>
                    {exp.achievements.map((achievement, i) => (
                      <Text key={i} style={styles.achievementItem}>
                        ▸ {achievement}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Strategic Initiatives */}
        {resume.projects && resume.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strategic Initiatives</Text>
            {resume.projects.map((project, index) => (
              <View key={index} style={{ marginBottom: 15 }}>
                <Text style={[styles.boldText, { color: "#1e40af" }]}>
                  {project.title}
                </Text>
                <Text style={styles.text}>
                  {project.startDate} - {project.endDate}
                </Text>
                <Text style={styles.text}>{project.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Core Competencies */}
        {resume.skills && resume.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Core Competencies</Text>
            <View style={styles.skillsContainer}>
              {resume.skills.map((skill, index) => (
                <Text
                  key={index}
                  style={[styles.skillChip, { backgroundColor: "#dbeafe" }]}
                >
                  {skill.name}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education & Certifications</Text>
            {resume.education.map((edu, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Text style={[styles.boldText, { color: "#1e40af" }]}>
                  {edu.degree} in {edu.field}
                </Text>
                <Text style={styles.text}>{edu.institution}</Text>
                <Text style={styles.text}>
                  {edu.startDate} - {edu.endDate}
                </Text>
                {edu.gpa && <Text style={styles.text}>GPA: {edu.gpa}</Text>}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};
