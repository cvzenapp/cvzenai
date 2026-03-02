import React, { useState, useEffect } from 'react';
import { Palette, Type, Layout, Save, RotateCcw, Download } from 'lucide-react';
import { ColorCustomizer } from './ColorCustomizer';
import { TypographyCustomizer } from './TypographyCustomizer';
import { LayoutCustomizer } from './LayoutCustomizer';
import { customizationService } from '../../services/customizationService';
import type { CustomizationSettings } from '../../../shared/types/customization';
import './customization.css';

interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | number;
  resumeId?: number;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  isOpen,
  onClose,
  userId,
  resumeId
}) => {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'layout'>('colors');
  const [settings, setSettings] = useState<CustomizationSettings>(
    customizationService.getDefaultSettings()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const loaded = await customizationService.loadSettings(resumeId);
      setSettings(loaded);
      customizationService.applySettings(loaded);
    };
    loadSettings();
  }, [resumeId]);

  // Apply settings in real-time and auto-save
  const handleSettingsChange = (newSettings: Partial<CustomizationSettings>) => {
    console.log('🎨 Settings changed:', newSettings);
    console.log('📋 Current userId:', userId, 'resumeId:', resumeId);
    
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    customizationService.applySettings(updated);
    
    // Auto-save after a short delay (debounced)
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    console.log('⏱️ Setting auto-save timeout...');
    autoSaveTimeoutRef.current = setTimeout(() => {
      console.log('💾 Auto-save triggered');
      if (resumeId && userId) {
        console.log('✅ Has resumeId and userId, saving...');
        customizationService.saveSettings(updated, resumeId, userId)
          .then(() => {
            console.log('✅ Auto-save successful');
            setSaveMessage('✓ Auto-saved');
            setTimeout(() => setSaveMessage(''), 2000);
          })
          .catch((error) => {
            console.error('❌ Auto-save error:', error);
          });
      } else {
        console.warn('⚠️ Missing resumeId or userId for auto-save:', { resumeId, userId });
      }
    }, 1000); // Save 1 second after user stops making changes
  };

  const handleSave = async () => {
    console.log('🔘 Save button clicked');
    console.log('📋 Current state:', { resumeId, userId, hasSettings: !!settings });
    
    if (!resumeId || !userId) {
      const errorMsg = `✗ Missing ${!resumeId ? 'resume' : 'user'} info`;
      console.error(errorMsg, { resumeId, userId });
      setSaveMessage(errorMsg);
      return;
    }
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      console.log('💾 Calling customizationService.saveSettings...');
      await customizationService.saveSettings(settings, resumeId, userId);
      console.log('✅ Save successful');
      setSaveMessage('✓ Saved!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('❌ Save error:', error);
      setSaveMessage('✗ Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaults = customizationService.getDefaultSettings();
    setSettings(defaults);
    customizationService.applySettings(defaults);
    setSaveMessage('Reset to defaults');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleExport = () => {
    customizationService.exportSettings(settings);
    setSaveMessage('✓ Exported!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="customization-overlay" onClick={onClose}>
      <div className="customization-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="customization-header">
          <h2>Customize Template</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="customization-tabs">
          <button
            className={`tab ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            <Palette size={18} />
            <span>Colors</span>
          </button>
          <button
            className={`tab ${activeTab === 'typography' ? 'active' : ''}`}
            onClick={() => setActiveTab('typography')}
          >
            <Type size={18} />
            <span>Typography</span>
          </button>
          <button
            className={`tab ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
          >
            <Layout size={18} />
            <span>Layout</span>
          </button>
        </div>

        {/* Content */}
        <div className="customization-content">
          {activeTab === 'colors' && (
            <ColorCustomizer
              settings={settings}
              onChange={handleSettingsChange}
            />
          )}
          {activeTab === 'typography' && (
            <TypographyCustomizer
              settings={settings}
              onChange={handleSettingsChange}
            />
          )}
          {activeTab === 'layout' && (
            <LayoutCustomizer
              settings={settings}
              onChange={handleSettingsChange}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="customization-footer">
          {saveMessage && (
            <div className="save-message">{saveMessage}</div>
          )}
          <div className="action-buttons">
            <button
              className="action-btn"
              onClick={handleSave}
              disabled={isSaving}
              title="Save settings"
            >
              <Save size={18} />
            </button>
            <button
              className="action-btn"
              onClick={handleReset}
              title="Reset to defaults"
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="action-btn"
              onClick={handleExport}
              title="Export settings"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
