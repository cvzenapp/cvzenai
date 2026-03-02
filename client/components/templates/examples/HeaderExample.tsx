import React from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';
import { Header } from '../components/Header';
import { BaseTemplateStructure, TemplateContainer } from '../foundation';

interface HeaderExampleProps {
  resume: Resume;
  templateConfig: TemplateConfig;
}

/**
 * Example demonstrating the new Header component
 * This shows how to use the Header component in a template
 */
export const HeaderExample: React.FC<HeaderExampleProps> = ({
  resume,
  templateConfig
}) => {
  const handleDownload = () => {
    // Implement PDF download functionality
    console.log('Downloading resume for:', resume.personalInfo.name);
    // In a real implementation, this would trigger PDF generation
  };

  const handleContact = () => {
    // Implement contact functionality
    console.log('Contacting candidate:', resume.personalInfo.name);
    // In a real implementation, this would open a contact modal or redirect to messaging
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Sharing profile for:', resume.personalInfo.name);
    // In a real implementation, this would open a share modal or copy link to clipboard
  };

  return (
    <BaseTemplateStructure
      resume={resume}
      templateConfig={templateConfig}
      className="header-example-template"
    >
      <TemplateContainer maxWidth="7xl">
        {/* Using the new Header component */}
        <Header
          resume={resume}
          templateConfig={templateConfig}
          onDownload={handleDownload}
          onContact={handleContact}
          onShare={handleShare}
        />

        {/* Rest of the template content would go here */}
        <div className="py-8">
          <div className="text-center text-muted-foreground">
            <p>This is an example template demonstrating the new Header component.</p>
            <p>The Header component implements Tier 1 of the three-tier hierarchy design.</p>
            <p>Additional template sections would be added below this area.</p>
          </div>
        </div>
      </TemplateContainer>
    </BaseTemplateStructure>
  );
};

export default HeaderExample;