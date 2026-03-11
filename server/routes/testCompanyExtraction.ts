import { Router, Request, Response } from "express";
import { companyDataExtractionService } from "../services/companyDataExtractionService";

const router = Router();

// Test endpoint for company data extraction
router.post("/test-extraction", async (req: Request, res: Response) => {
  try {
    const { website } = req.body;
    
    if (!website) {
      return res.status(400).json({
        success: false,
        message: "Website URL is required"
      });
    }

    console.log(`🧪 Testing company data extraction for: ${website}`);
    
    const companyData = await companyDataExtractionService.extractCompanyDataFromWebsite(website);
    
    res.json({
      success: true,
      message: "Company data extracted successfully",
      data: companyData
    });
    
  } catch (error) {
    console.error("❌ Test extraction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to extract company data",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;