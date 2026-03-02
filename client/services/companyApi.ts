import { Company, CompanyUpdateRequest } from "../../shared/recruiterAuth";
import { BaseApiClient } from './baseApiClient';

class CompanyApiService extends BaseApiClient {
  constructor() {
    super('/api/recruiter/company');
  }

  async getCompanyProfile(): Promise<{ success: boolean; company: Company }> {
    const response = await this.get<{ success: boolean; company: Company }>('/profile');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to fetch company profile');
  }

  async getCompanyBySlug(slug: string): Promise<{ success: boolean; company: Company }> {
    const response = await this.get<{ success: boolean; company: Company }>(
      `/public/${slug}`,
      { skipAuth: true }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to fetch company');
  }

  async updateCompanyProfile(
    data: CompanyUpdateRequest
  ): Promise<{ success: boolean; company: Company; message: string }> {
    console.log('📤 companyApi.updateCompanyProfile called');
    console.log('📤 Data keys:', Object.keys(data));
    console.log('📤 coverImageUrl length:', data.coverImageUrl?.length || 0);
    
    // Check if data is too large
    const dataSize = JSON.stringify(data).length;
    console.log('📤 Request body size:', (dataSize / 1024 / 1024).toFixed(2), 'MB');
    
    if (dataSize > 10 * 1024 * 1024) {
      console.error('❌ Request body too large!', (dataSize / 1024 / 1024).toFixed(2), 'MB');
      throw new Error('Image too large. Please use a smaller image.');
    }
    
    try {
      console.log('📤 Making request...');
      const response = await this.put<{ success: boolean; company: Company; message: string }>(
        '/profile',
        data
      );
      if (response.success && response.data) {
        console.log('📥 companyApi response:', response.data);
        return response.data;
      }
      throw new Error(response.error as string || 'Failed to update company profile');
    } catch (error: any) {
      console.error('📥 companyApi error:', error);
      throw error;
    }
  }

  async updateCompany(
    companyId: string,
    data: Partial<Company>
  ): Promise<{ success: boolean; company: Company; message: string }> {
    console.log('📤 companyApi.updateCompany called');
    console.log('📤 Company ID:', companyId);
    console.log('📤 Data:', data);
    
    try {
      const response = await this.put<{ success: boolean; company: Company; message: string }>(
        '/profile',
        data
      );
      if (response.success && response.data) {
        console.log('📥 companyApi response:', response.data);
        return response.data;
      }
      throw new Error(response.error as string || 'Failed to update company');
    } catch (error) {
      console.error('📥 companyApi error:', error);
      throw error;
    }
  }
}

export const companyApi = new CompanyApiService();
