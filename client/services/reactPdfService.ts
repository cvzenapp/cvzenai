import { pdf } from "@react-pdf/renderer";
import { Resume } from "@shared/api";
import {
  TechnologyPDFTemplate,
  CreativePDFTemplate,
  ManagementPDFTemplate,
} from "@/components/pdf/PDFTemplates";
import { SimplePDFTemplate } from "@/components/pdf/SimplePDFTemplate";
import { CleanPDFTemplate } from "@/components/pdf/CleanPDFTemplate";

interface PDFGenerationOptions {
  filename?: string;
  templateType?: "technology" | "design" | "management";
}

class ReactPDFService {
  async generateResumePDF(
    resume: Resume,
    options: PDFGenerationOptions = {},
  ): Promise<void> {
    const {
      filename = `${resume.personalInfo?.name?.replace(/\s+/g, "_") || "resume"}.pdf`,
      templateType = "technology",
    } = options;

    try {
      // Show loading state
      this.showLoadingState(true);

      // Use clean template with proper text formatting
      let TemplateComponent = CleanPDFTemplate;

      console.log("Using CleanPDFTemplate for proper formatting");
      console.log("Resume data for PDF:", JSON.stringify(resume, null, 2));
      console.log("Education data specifically:", resume.education);
      console.log("Education count:", resume.education?.length || 0);

      // Create the PDF document
      const MyDocument = () => TemplateComponent({ resume });

      // Generate PDF blob
      const blob = await pdf(MyDocument()).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      this.showLoadingState(false);
    } catch (error) {
      this.showLoadingState(false);
      console.error("Detailed PDF generation error:", error);
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack trace",
      );
      console.error("Resume data:", resume);
      console.error("Template type:", templateType);

      // More specific error message
      let errorMessage = "Failed to generate PDF. ";
      if (error instanceof Error) {
        errorMessage += `Error: ${error.message}`;
      } else {
        errorMessage += "Unknown error occurred.";
      }

      throw new Error(errorMessage);
    }
  }

  private showLoadingState(show: boolean): void {
    const existingLoader = document.getElementById("pdf-loader");

    if (show) {
      if (!existingLoader) {
        const loader = document.createElement("div");
        loader.id = "pdf-loader";
        loader.innerHTML = `
          <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
          ">
            <div style="
              background: white;
              padding: 2rem;
              border-radius: 12px;
              color: black;
              text-align: center;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
              max-width: 400px;
              width: 90%;
            ">
              <div style="
                width: 50px;
                height: 50px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1.5rem;
              "></div>
              <h3 style="margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 600; color: #1f2937;">
                Generating Professional PDF
              </h3>
              <p style="margin: 0; color: #6b7280; line-height: 1.5;">
                Creating your resume with professional formatting, images, and styling. This may take a moment...
              </p>
              <div style="
                margin-top: 1rem;
                padding: 0.75rem;
                background: #f3f4f6;
                border-radius: 6px;
                font-size: 0.875rem;
                color: #374151;
              ">
                ✓ Processing resume data<br>
                ✓ Applying template styling<br>
                ✓ Optimizing images<br>
                ⏳ Generating PDF document...
              </div>
            </div>
          </div>
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        `;
        document.body.appendChild(loader);
      }
    } else {
      if (existingLoader) {
        existingLoader.remove();
      }
    }
  }

  // Preview PDF in new window
  async previewResumePDF(
    resume: Resume,
    templateType: "technology" | "design" | "management" = "technology",
  ): Promise<void> {
    try {
      this.showLoadingState(true);

      // Select appropriate template component
      let TemplateComponent;
      switch (templateType) {
        case "design":
          TemplateComponent = CreativePDFTemplate;
          break;
        case "management":
          TemplateComponent = ManagementPDFTemplate;
          break;
        case "technology":
        default:
          TemplateComponent = TechnologyPDFTemplate;
          break;
      }

      // Create the PDF document
      const MyDocument = () => TemplateComponent({ resume });

      // Generate PDF blob
      const blob = await pdf(MyDocument()).toBlob();

      // Open in new window
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      this.showLoadingState(false);
    } catch (error) {
      this.showLoadingState(false);
      console.error("Error previewing PDF:", error);
      throw new Error("Failed to preview PDF. Please try again.");
    }
  }

  // Get PDF as blob for further processing
  async getResumePDFBlob(
    resume: Resume,
    templateType: "technology" | "design" | "management" = "technology",
  ): Promise<Blob> {
    // Select appropriate template component
    let TemplateComponent;
    switch (templateType) {
      case "design":
        TemplateComponent = CreativePDFTemplate;
        break;
      case "management":
        TemplateComponent = ManagementPDFTemplate;
        break;
      case "technology":
      default:
        TemplateComponent = TechnologyPDFTemplate;
        break;
    }

    // Create the PDF document
    const MyDocument = () => TemplateComponent({ resume });

    // Generate and return PDF blob
    return await pdf(MyDocument()).toBlob();
  }
}

export const reactPdfService = new ReactPDFService();
export default reactPdfService;
