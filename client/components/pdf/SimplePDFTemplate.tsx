import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Resume } from "@shared/api";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 40,
    backgroundColor: "#ffffff",
    lineHeight: 1.6,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1f2937",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 20,
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 25,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  contactItem: {
    fontSize: 9,
    color: "#374151",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
    pageBreakInside: false,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1f2937",
    borderBottomWidth: 1,
    borderBottomColor: "#3b82f6",
    paddingBottom: 3,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#374151",
    marginBottom: 6,
    textAlign: "justify",
  },
  bold: {
    fontWeight: "bold",
    color: "#1f2937",
  },
  itemContainer: {
    marginBottom: 16,
    paddingLeft: 0,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 4,
    fontStyle: "italic",
  },
  itemDescription: {
    fontSize: 10,
    lineHeight: 1.4,
    color: "#374151",
    marginBottom: 6,
    textAlign: "justify",
  },
  bulletPoint: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 3,
    marginLeft: 12,
    lineHeight: 1.3,
  },
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  skillChip: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    fontSize: 9,
    color: "#374151",
    marginBottom: 4,
  },
});

export const SimplePDFTemplate: React.FC<{ resume: Resume }> = ({ resume }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={{ marginBottom: 25 }}>
          <Text style={styles.title}>
            {resume.personalInfo?.name || "Professional Resume"}
          </Text>
          <Text style={styles.subtitle}>
            {resume.personalInfo?.title || "Professional"}
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.contactRow}>
          <Text style={styles.contactItem}>
            Email: {resume.personalInfo?.email || "N/A"}
          </Text>
          <Text style={styles.contactItem}>
            Phone: {resume.personalInfo?.phone || "N/A"}
          </Text>
          <Text style={styles.contactItem}>
            Location: {resume.personalInfo?.location || "N/A"}
          </Text>
        </View>

        {resume.personalInfo?.github && (
          <View style={{ textAlign: "center", marginBottom: 20 }}>
            <Text style={styles.contactItem}>
              GitHub: {resume.personalInfo.github}
            </Text>
          </View>
        )}

        {/* Professional Summary */}
        {resume.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
            <Text style={styles.itemDescription}>{resume.summary}</Text>
          </View>
        )}

        {/* Core Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CORE SKILLS</Text>
            <View style={styles.skillsGrid}>
              {resume.skills.map((skill, index) => (
                <Text key={index} style={styles.skillChip}>
                  {skill.name} ({skill.proficiency || skill.level}%)
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Professional Experience */}
        {resume.experiences && resume.experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROFESSIONAL EXPERIENCE</Text>
            {resume.experiences.map((exp, index) => (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>{exp.position}</Text>
                <Text style={styles.itemSubtitle}>
                  {exp.company} | {exp.startDate} - {exp.endDate || "Present"}
                </Text>
                {exp.location && (
                  <Text style={styles.itemSubtitle}>{exp.location}</Text>
                )}
                <Text style={styles.itemDescription}>{exp.description}</Text>

                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={[styles.text, styles.bold]}>
                      Key Achievements:
                    </Text>
                    {exp.achievements.map((achievement, i) => (
                      <Text key={i} style={styles.bulletPoint}>
                        • {achievement}
                      </Text>
                    ))}
                  </View>
                )}

                {exp.technologies && exp.technologies.length > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={[styles.text, styles.bold]}>
                      Technologies:
                    </Text>
                    <Text style={styles.text}>
                      {exp.technologies.join(", ")}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Featured Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FEATURED PROJECTS</Text>
            {resume.projects.map((project, index) => (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>{project.title}</Text>
                <Text style={styles.itemSubtitle}>
                  {project.startDate} - {project.endDate || "Ongoing"}
                </Text>
                <Text style={styles.itemDescription}>
                  {project.description}
                </Text>

                {project.technologies && project.technologies.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={[styles.text, styles.bold]}>Tech Stack:</Text>
                    <Text style={styles.text}>
                      {project.technologies.join(", ")}
                    </Text>
                  </View>
                )}

                {project.url && (
                  <Text style={styles.text}>Live URL: {project.url}</Text>
                )}

                {project.github && (
                  <Text style={styles.text}>Repository: {project.github}</Text>
                )}

                {project.images && project.images.length > 0 && (
                  <Text style={styles.text}>
                    Portfolio Images: {project.images.length} available
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {resume.education.map((edu, index) => (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>
                  {edu.degree} in {edu.field}
                </Text>
                <Text style={styles.itemSubtitle}>
                  {edu.institution} | {edu.startDate} - {edu.endDate}
                </Text>
                {edu.location && (
                  <Text style={styles.itemSubtitle}>{edu.location}</Text>
                )}
                {edu.gpa && <Text style={styles.text}>GPA: {edu.gpa}</Text>}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};
