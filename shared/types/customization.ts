export interface CustomizationSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
  };
  layout: {
    spacing: 'compact' | 'normal' | 'spacious';
    borderRadius: number;
    sectionPadding: number;
  };
}

export interface SavedCustomization {
  id: number;
  userId: number;
  settings: CustomizationSettings;
  createdAt: string;
  updatedAt: string;
}
