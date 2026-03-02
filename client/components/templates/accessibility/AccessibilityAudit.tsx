import React, { useEffect, useState, useCallback } from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { AccessibilityTester, AccessibilityTestResult } from './AccessibilityTester';
import { ContrastValidator } from './ContrastValidator';

// Accessibility audit report interface
export interface AccessibilityAuditReport {
  timestamp: Date;
  overallScore: number;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  testResults: AccessibilityTestResult[];
  recommendations: string[];
  wcagCompliance: {
    aa: boolean;
    aaa: boolean;
    level: 'fail' | 'aa' | 'aaa';
  };
}

// Accessibility audit props
export interface AccessibilityAuditProps {
  target?: HTMLElement | null;
  onAuditComplete?: (report: AccessibilityAuditReport) => void;
  showDetailedReport?: boolean;
  autoRun?: boolean;
  className?: string;
}

/**
 * AccessibilityAudit - Comprehensive accessibility audit component
 * 
 * Features:
 * - Complete WCAG 2.1 compliance audit
 * - Automated testing with detailed reporting
 * - Real-time accessibility monitoring
 * - Developer-friendly recommendations
 * - Compliance scoring and certification
 */
export const AccessibilityAudit: React.FC<AccessibilityAuditProps> = ({
  target,
  onAuditComplete,
  showDetailedReport = true,
  autoRun = false,
  className = '',
}) => {
  const { config, isAccessibilityCompliant } = useAccessibility();
  const [auditReport, setAuditReport] = useState<AccessibilityAuditReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Generate accessibility audit report
  const generateAuditReport = useCallback((testResults: AccessibilityTestResult[]): AccessibilityAuditReport => {
    const errorCount = testResults.filter(r => r.severity === 'error').length;
    const warningCount = testResults.filter(r => r.severity === 'warning').length;
    const infoCount = testResults.filter(r => r.severity === 'info').length;
    
    // Calculate overall score (0-100)
    const totalIssues = testResults.length;
    const weightedScore = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5) - (infoCount * 1));
    
    // Determine WCAG compliance level
    const hasErrors = errorCount > 0;
    const hasWarnings = warningCount > 0;
    
    let wcagLevel: 'fail' | 'aa' | 'aaa';
    if (hasErrors) {
      wcagLevel = 'fail';
    } else if (hasWarnings) {
      wcagLevel = 'aa';
    } else {
      wcagLevel = 'aaa';
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (errorCount > 0) {
      recommendations.push('Fix critical accessibility errors to meet WCAG AA standards');
    }
    if (warningCount > 0) {
      recommendations.push('Address accessibility warnings to improve user experience');
    }
    if (!config.keyboardNavigation) {
      recommendations.push('Enable keyboard navigation support');
    }
    if (!config.screenReaderOptimized) {
      recommendations.push('Enable screen reader optimization');
    }
    
    return {
      timestamp: new Date(),
      overallScore: Math.round(weightedScore),
      totalIssues,
      errorCount,
      warningCount,
      infoCount,
      testResults,
      recommendations,
      wcagCompliance: {
        aa: wcagLevel !== 'fail',
        aaa: wcagLevel === 'aaa',
        level: wcagLevel,
      },
    };
  }, [config.keyboardNavigation, config.screenReaderOptimized]);

  // Handle test completion
  const handleTestComplete = useCallback((results: AccessibilityTestResult[]) => {
    const report = generateAuditReport(results);
    setAuditReport(report);
    onAuditComplete?.(report);
  }, [generateAuditReport, onAuditComplete]);

  // Run audit manually
  const runAudit = useCallback(() => {
    setIsRunning(true);
    // The AccessibilityTester will handle the actual testing
    // and call handleTestComplete when done
  }, []);

  return (
    <div className={`accessibility-audit ${className}`}>
      <div className="space-y-6">
        {/* Audit Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Accessibility Audit</h2>
          <button
            onClick={runAudit}
            disabled={isRunning}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {isRunning ? 'Running Audit...' : 'Run Audit'}
          </button>
        </div>

        {/* Audit Summary */}
        {auditReport && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-primary">
                {auditReport.overallScore}
              </div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
            
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-red-600">
                {auditReport.errorCount}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
            
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-yellow-600">
                {auditReport.warningCount}
              </div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            
            <div className="bg-card p-4 rounded-lg border">
              <div className={`text-2xl font-bold ${
                auditReport.wcagCompliance.level === 'aaa' ? 'text-green-600' :
                auditReport.wcagCompliance.level === 'aa' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {auditReport.wcagCompliance.level.toUpperCase()}
              </div>
              <div className="text-sm text-muted-foreground">WCAG Level</div>
            </div>
          </div>
        )}

        {/* Accessibility Tester */}
        <AccessibilityTester
          target={target}
          onTestComplete={handleTestComplete}
          showResults={showDetailedReport}
          autoRun={autoRun}
        />

        {/* Recommendations */}
        {auditReport && auditReport.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Recommendations</h3>
            <ul className="space-y-1">
              {auditReport.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-blue-800">
                  • {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessibilityAudit;