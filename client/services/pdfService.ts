import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PDFOptions {
  filename?: string;
  quality?: number;
  format?: "a4" | "letter";
  includeImages?: boolean;
}

class PDFService {
  async generatePDF(
    elementId: string,
    options: PDFOptions = {},
  ): Promise<void> {
    const {
      filename = "resume.pdf",
      quality = 1,
      format = "a4",
      includeImages = true,
    } = options;

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`);
      }

      // Show loading state
      this.showLoadingState(true);

      // Wait for images to load if includeImages is true
      if (includeImages) {
        await this.waitForImages(element);
      }

      // Generate canvas with high quality
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        quality,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        removeContainer: true,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure all styles are preserved in the cloned document
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            // Force display of all elements
            clonedElement.style.display = "block";
            clonedElement.style.visibility = "visible";

            // Remove any transforms that might affect layout
            const allElements = clonedElement.querySelectorAll("*");
            allElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.transform = "none";
            });

            // Enhance spacing for name and title in PDF
            const nameElements = clonedElement.querySelectorAll(".template-name-title");
            nameElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.marginBottom = "1.5rem";
              htmlEl.style.lineHeight = "1.5";
              htmlEl.style.paddingBottom = "0.5rem";
            });

            const titleElements = clonedElement.querySelectorAll(".template-job-title");
            titleElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.marginTop = "0.75rem";
              htmlEl.style.marginBottom = "1.5rem";
              htmlEl.style.paddingTop = "0.5rem";
              htmlEl.style.lineHeight = "1.3";
            });
          }
        },
      });

      // Calculate PDF dimensions
      const imgWidth = format === "a4" ? 210 : 216; // mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "landscape",
        unit: "mm",
        format: format === "a4" ? "a4" : "letter",
      });

      // Add image to PDF
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      // If content is longer than one page, split it
      const pdfHeight = format === "a4" ? 297 : 279; // mm
      let position = 0;

      while (position < imgHeight) {
        const remainingHeight = imgHeight - position;
        const currentPageHeight = Math.min(pdfHeight, remainingHeight);

        if (position > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          "JPEG",
          0,
          -position,
          imgWidth,
          imgHeight,
          undefined,
          "FAST",
        );

        position += pdfHeight;
      }

      // Save the PDF
      pdf.save(filename);

      this.showLoadingState(false);
    } catch (error) {
      this.showLoadingState(false);
      console.error("Error generating PDF:", error);
      throw new Error("Failed to generate PDF. Please try again.");
    }
  }

  private async waitForImages(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll("img");
    const imagePromises: Promise<void>[] = [];

    images.forEach((img) => {
      if (!img.complete) {
        imagePromises.push(
          new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => {
              console.warn("Image failed to load:", img.src);
              resolve(); // Don't fail the entire process
            };

            // Timeout after 10 seconds
            setTimeout(() => {
              console.warn("Image load timeout:", img.src);
              resolve();
            }, 10000);
          }),
        );
      }
    });

    await Promise.all(imagePromises);

    // Additional wait to ensure all images are rendered
    await new Promise((resolve) => setTimeout(resolve, 500));
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
            background: rgba(0, 0, 0, 0.7);
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
              border-radius: 8px;
              color: black;
              text-align: center;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            ">
              <div style="
                width: 40px;
                height: 40px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
              "></div>
              <p style="margin: 0; font-weight: 500;">Generating PDF...</p>
              <p style="margin: 0.5rem 0 0; font-size: 0.875rem; color: #666;">
                Please wait while we process images and formatting
              </p>
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

  async generateTemplatePDF(
    resumeData: any,
    templateType: string,
    options: PDFOptions = {},
  ): Promise<void> {
    const filename =
      options.filename ||
      `${resumeData.personalInfo?.name || "resume"}-${templateType}.pdf`;

    // The element ID should be the template container
    const elementId = "resume-template-container";

    return this.generatePDF(elementId, {
      ...options,
      filename,
      includeImages: true,
    });
  }
}

export const pdfService = new PDFService();
export default pdfService;