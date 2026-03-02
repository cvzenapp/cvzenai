import React from 'react';

// Responsive breakpoint configuration
export const BREAKPOINTS = {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px'
} as const;

// Grid configuration types
export interface GridConfig {
    columns: number;
    gap: 'sm' | 'md' | 'lg' | 'xl';
    breakpoint?: keyof typeof BREAKPOINTS;
}

export interface ResponsiveGridProps {
    children: React.ReactNode;
    className?: string;
    config?: {
        mobile?: GridConfig;
        tablet?: GridConfig;
        desktop?: GridConfig;
        wide?: GridConfig;
    };
}

// Default grid configurations for different breakpoints
const DEFAULT_GRID_CONFIG = {
    mobile: { columns: 1, gap: 'md' as const },
    tablet: { columns: 2, gap: 'md' as const },
    desktop: { columns: 3, gap: 'lg' as const },
    wide: { columns: 4, gap: 'xl' as const }
};

// Gap size mappings
const GAP_SIZES = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
} as const;

/**
 * ResponsiveGrid component that adapts to different screen sizes
 * Following the three-tier hierarchy design principles
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
    children,
    className = '',
    config = DEFAULT_GRID_CONFIG
}) => {
    // Merge provided config with defaults
    const gridConfig = {
        ...DEFAULT_GRID_CONFIG,
        ...config
    };

    // Generate responsive grid classes using safe Tailwind classes
    const getGridColsClass = (columns: number, prefix = '') => {
        const colsMap: Record<number, string> = {
            1: `${prefix}grid-cols-1`,
            2: `${prefix}grid-cols-2`,
            3: `${prefix}grid-cols-3`,
            4: `${prefix}grid-cols-4`,
            5: `${prefix}grid-cols-5`,
            6: `${prefix}grid-cols-6`,
            12: `${prefix}grid-cols-12`
        };
        return colsMap[columns] || `${prefix}grid-cols-1`;
    };

    const gridClasses = [
        // Base grid
        'grid',

        // Mobile (default)
        getGridColsClass(gridConfig.mobile.columns),
        GAP_SIZES[gridConfig.mobile.gap],

        // Tablet
        getGridColsClass(gridConfig.tablet.columns, 'sm:'),
        `sm:${GAP_SIZES[gridConfig.tablet.gap]}`,

        // Desktop
        getGridColsClass(gridConfig.desktop.columns, 'lg:'),
        `lg:${GAP_SIZES[gridConfig.desktop.gap]}`,

        // Wide screens
        getGridColsClass(gridConfig.wide.columns, 'xl:'),
        `xl:${GAP_SIZES[gridConfig.wide.gap]}`,

        // Additional classes
        className
    ].join(' ');

    return (
        <div className={gridClasses}>
            {children}
        </div>
    );
};

/**
 * TierGrid component for the three-tier layout system
 * Optimized for recruiter scanning patterns
 */
export interface TierGridProps {
    children: React.ReactNode;
    tier: 1 | 2 | 3;
    className?: string;
}

export const TierGrid: React.FC<TierGridProps> = ({
    children,
    tier,
    className = ''
}) => {
    // Tier-specific grid configurations
    const tierConfigs = {
        1: {
            // Tier 1: Critical Assessment - Identity and CTAs
            mobile: { columns: 1, gap: 'md' as const },
            tablet: { columns: 1, gap: 'md' as const },
            desktop: { columns: 3, gap: 'lg' as const }, // Identity spans 2, CTAs span 1
            wide: { columns: 3, gap: 'xl' as const }
        },
        2: {
            // Tier 2: Qualification Review - Summary and Skills
            mobile: { columns: 1, gap: 'md' as const },
            tablet: { columns: 1, gap: 'md' as const },
            desktop: { columns: 2, gap: 'lg' as const }, // Summary and Skills side by side
            wide: { columns: 2, gap: 'xl' as const }
        },
        3: {
            // Tier 3: Detailed Evaluation - Experience, Projects, Education
            mobile: { columns: 1, gap: 'md' as const },
            tablet: { columns: 1, gap: 'lg' as const },
            desktop: { columns: 1, gap: 'lg' as const }, // Single column for detailed content
            wide: { columns: 2, gap: 'xl' as const } // Two columns on very wide screens
        }
    };

    return (
        <ResponsiveGrid
            config={tierConfigs[tier]}
            className={`tier-${tier}-grid ${className}`}
        >
            {children}
        </ResponsiveGrid>
    );
};

/**
 * ContentGrid component for flexible content layouts within tiers
 */
export interface ContentGridProps {
    children: React.ReactNode;
    layout: 'single' | 'two-column' | 'three-column' | 'auto-fit';
    className?: string;
    minItemWidth?: string;
}

export const ContentGrid: React.FC<ContentGridProps> = ({
    children,
    layout,
    className = '',
    minItemWidth = '280px'
}) => {
    const layoutClasses = {
        single: 'grid grid-cols-1 gap-4',
        'two-column': 'grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6',
        'three-column': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6',
        'auto-fit': `grid gap-4 lg:gap-6`
    };

    const gridClass = layout === 'auto-fit'
        ? `${layoutClasses[layout]} grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`
        : layoutClasses[layout];

    return (
        <div className={`${gridClass} ${className}`}>
            {children}
        </div>
    );
};

/**
 * SectionGrid component for organizing resume sections
 */
export interface SectionGridProps {
    children: React.ReactNode;
    section: 'header' | 'summary' | 'skills' | 'experience' | 'projects' | 'education';
    className?: string;
}

export const SectionGrid: React.FC<SectionGridProps> = ({
    children,
    section,
    className = ''
}) => {
    // Section-specific grid configurations
    const sectionConfigs = {
        header: {
            mobile: { columns: 1, gap: 'md' as const },
            tablet: { columns: 1, gap: 'md' as const },
            desktop: { columns: 3, gap: 'lg' as const },
            wide: { columns: 3, gap: 'xl' as const }
        },
        summary: {
            mobile: { columns: 1, gap: 'md' as const },
            tablet: { columns: 1, gap: 'md' as const },
            desktop: { columns: 1, gap: 'lg' as const },
            wide: { columns: 1, gap: 'xl' as const }
        },
        skills: {
            mobile: { columns: 1, gap: 'sm' as const },
            tablet: { columns: 2, gap: 'md' as const },
            desktop: { columns: 3, gap: 'md' as const },
            wide: { columns: 4, gap: 'lg' as const }
        },
        experience: {
            mobile: { columns: 1, gap: 'lg' as const },
            tablet: { columns: 1, gap: 'lg' as const },
            desktop: { columns: 1, gap: 'lg' as const },
            wide: { columns: 1, gap: 'xl' as const }
        },
        projects: {
            mobile: { columns: 1, gap: 'md' as const },
            tablet: { columns: 1, gap: 'lg' as const },
            desktop: { columns: 2, gap: 'lg' as const },
            wide: { columns: 3, gap: 'xl' as const }
        },
        education: {
            mobile: { columns: 1, gap: 'md' as const },
            tablet: { columns: 1, gap: 'md' as const },
            desktop: { columns: 2, gap: 'lg' as const },
            wide: { columns: 2, gap: 'xl' as const }
        }
    };

    return (
        <ResponsiveGrid
            config={sectionConfigs[section]}
            className={`section-${section}-grid ${className}`}
        >
            {children}
        </ResponsiveGrid>
    );
};

/**
 * TemplateContainer component that provides the main layout structure
 */
export interface TemplateContainerProps {
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
    className?: string;
}

export const TemplateContainer: React.FC<TemplateContainerProps> = ({
    children,
    maxWidth = '7xl',
    className = ''
}) => {
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '7xl': 'max-w-7xl',
        full: 'max-w-full'
    };

    return (
        <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
            {children}
        </div>
    );
};

/**
 * Utility function to generate responsive grid classes
 */
export const generateGridClasses = (config: ResponsiveGridProps['config']) => {
    if (!config) return '';

    const getGridColsClass = (columns: number, prefix = '') => {
        const colsMap: Record<number, string> = {
            1: `${prefix}grid-cols-1`,
            2: `${prefix}grid-cols-2`,
            3: `${prefix}grid-cols-3`,
            4: `${prefix}grid-cols-4`,
            5: `${prefix}grid-cols-5`,
            6: `${prefix}grid-cols-6`,
            12: `${prefix}grid-cols-12`
        };
        return colsMap[columns] || `${prefix}grid-cols-1`;
    };

    const classes: string[] = [];

    Object.entries(config).forEach(([breakpoint, gridConfig]) => {
        const prefix = breakpoint === 'mobile' ? '' : `${breakpoint === 'tablet' ? 'sm' : breakpoint === 'desktop' ? 'lg' : 'xl'}:`;
        classes.push(getGridColsClass(gridConfig.columns, prefix));
        classes.push(`${prefix}${GAP_SIZES[gridConfig.gap]}`);
    });

    return classes.join(' ');
};

/**
 * Hook for responsive grid utilities
 */
export const useResponsiveGrid = () => {
    return {
        BREAKPOINTS,
        GAP_SIZES,
        generateGridClasses,
        DEFAULT_GRID_CONFIG
    };
};