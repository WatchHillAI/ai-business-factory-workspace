# Shared Domain - Claude Development Context

**🔗 Claude Development Context for Cross-Domain Utilities & Components**

## 📋 **Domain Scope**

This domain contains shared utilities, components, data models, and common functionality used across all other domains in the AI Business Factory monorepo.

### **Core Responsibilities:**
- Shared TypeScript type definitions and data models
- Common UI components and design system
- Utility functions and helper libraries
- Authentication and authorization (future)
- Shared configuration and constants

### **Business Value:**
Ensure consistency, reduce duplication, and provide a solid foundation for all domain-specific development.

---

## 🎯 **Key Packages in This Domain**

### **Current Structure:**
```bash
# Already established:
packages/ui-components/           # Shared UI component library

# Will be added:
# - data-models package for TypeScript definitions
# - utils package for common utilities
# - auth package for authentication (future)
```

### **Target Structure:**
```bash
domains/shared/
├── packages/
│   ├── ui-components/            # Shared React component library
│   │   ├── src/
│   │   │   ├── components/       # Reusable UI components
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── utils/            # UI utility functions
│   │   │   └── styles/           # Shared styles and themes
│   ├── data-models/              # TypeScript definitions for all domains
│   │   ├── src/
│   │   │   ├── api/              # API request/response types
│   │   │   ├── business/         # Business domain types
│   │   │   ├── market/           # Market intelligence types
│   │   │   └── orchestration/    # AI orchestration types
│   ├── utils/                    # Common utility functions
│   │   ├── src/
│   │   │   ├── validation/       # Data validation utilities
│   │   │   ├── formatting/       # Data formatting functions
│   │   │   ├── calculations/     # Common calculations
│   │   │   └── api/              # API utility functions
│   └── auth/                     # Authentication (future implementation)
└── README-CLAUDE.md             # This file
```

---

## 🔧 **Common Development Tasks**

### **1. UI Component Development**
```bash
# Shared React components:
domains/shared/packages/ui-components/src/
├── components/
│   ├── Button.tsx                # Button variants and states
│   ├── Card.tsx                  # Card layouts and styles
│   ├── Badge.tsx                 # Status badges and indicators
│   ├── ThemeToggle.tsx           # Dark/light mode toggle
│   └── forms/                    # Form components and validation
├── hooks/
│   ├── useTheme.ts               # Theme management hook
│   ├── useBreakpoint.ts          # Responsive design hook
│   └── useLocalStorage.ts        # Local storage management
└── utils/
    ├── cn.ts                     # Class name utilities (clsx + tailwind-merge)
    └── logger.ts                 # Frontend logging utilities
```

### **2. TypeScript Data Models**
```bash
# Shared type definitions:
domains/shared/packages/data-models/src/
├── business/
│   ├── BasicIdea.ts              # Basic business idea structure
│   ├── DetailedIdea.ts           # Complete business analysis
│   ├── MarketAnalysis.ts         # Market research outputs
│   └── FinancialModel.ts         # Financial projections
├── api/
│   ├── AgentRequests.ts          # AI agent API requests
│   ├── AgentResponses.ts         # AI agent API responses
│   └── ErrorTypes.ts             # Standardized error handling
└── orchestration/
    ├── AgentConfig.ts            # Agent configuration types
    ├── QualityMetrics.ts         # Quality assurance types
    └── ExecutionContext.ts       # Orchestration context
```

### **3. Utility Function Development**
```bash
# Common utility functions:
domains/shared/packages/utils/src/
├── validation/
│   ├── ideaValidation.ts         # Business idea validation
│   ├── financialValidation.ts    # Financial data validation
│   └── apiValidation.ts          # API input/output validation
├── formatting/
│   ├── currencyFormat.ts         # Currency formatting
│   ├── numberFormat.ts           # Number formatting utilities
│   └── dateFormat.ts             # Date formatting utilities
└── calculations/
    ├── financialCalculations.ts  # Common financial formulas
    ├── confidenceScoring.ts      # Confidence calculation utilities
    └── marketSizing.ts           # Market sizing calculations
```

---

## 🎨 **Design System Guidelines**

### **UI Component Standards:**
```typescript
// Consistent component interface pattern:
interface ComponentProps {
  className?: string;             // Allow style customization
  children?: React.ReactNode;     // Support composition
  variant?: 'default' | 'primary' | 'secondary'; // Consistent variants
  size?: 'sm' | 'md' | 'lg';     // Consistent sizing
  disabled?: boolean;             // Consistent state handling
}

// Theme-aware component pattern:
interface ThemeAwareProps {
  theme?: 'light' | 'dark' | 'auto';
  respectUserPreference?: boolean;
}
```

### **Design Tokens:**
```typescript
// Consistent design system:
export const designTokens = {
  colors: {
    primary: '#1e40af',          // Blue-600
    secondary: '#64748b',        // Slate-500
    success: '#059669',          // Emerald-600
    warning: '#d97706',          // Amber-600
    error: '#dc2626',            // Red-600
    background: {
      light: '#ffffff',
      dark: '#0a0a0b',           // Rich black for premium feel
    }
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  }
};
```

### **Accessibility Standards:**
```typescript
// WCAG 2.2 AA compliance requirements:
interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
}

// Contrast ratio requirements:
const contrastRequirements = {
  normalText: 4.5,              // WCAG AA standard
  largeText: 3.0,               // WCAG AA for large text
  currentImplementation: 18.3,  // Our high-contrast dark mode
};
```

---

## 🔒 **Development Guidelines**

### **Component Development Standards:**
- **TypeScript First** - All components must be fully typed
- **Accessibility Required** - WCAG 2.2 AA compliance mandatory
- **Mobile Responsive** - Mobile-first design approach
- **Theme Support** - Both light and dark mode support
- **Performance Optimized** - Lazy loading and code splitting

### **Data Model Standards:**
```typescript
// Consistent interface naming:
interface [DomainName][EntityName] {
  id: string;                   // Always include unique identifier
  createdAt: Date;              // Timestamp tracking
  updatedAt: Date;              // Timestamp tracking
  version?: number;             // Optimistic concurrency control
}

// Validation schema pattern:
const [EntityName]Schema = z.object({
  // Zod validation schema for runtime validation
});

// API response wrapper:
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorDetails;
  metadata: ResponseMetadata;
}
```

### **Utility Function Standards:**
```typescript
// Pure function pattern:
export function utilityFunction(input: InputType): OutputType {
  // 1. Input validation
  // 2. Pure logic (no side effects)
  // 3. Consistent error handling
  // 4. Return typed output
}

// Error handling pattern:
export class SharedError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SharedError';
  }
}
```

---

## 🧪 **Testing Strategy**

### **Component Testing:**
```bash
# UI component testing:
- Visual regression testing with Storybook
- Accessibility testing with @testing-library/jest-dom
- Interaction testing with @testing-library/user-event
- Performance testing with React DevTools Profiler
```

### **Data Model Testing:**
```bash
# Type safety and validation testing:
- TypeScript compilation tests
- Runtime validation with Zod schemas
- Serialization/deserialization testing
- API contract validation
```

### **Utility Testing:**
```bash
# Pure function testing:
- Unit tests for all utility functions
- Edge case and error condition testing
- Performance benchmarking
- Cross-browser compatibility testing
```

---

## 🎯 **Context Guidelines for Claude**

### **When Working in This Domain:**

1. **Think Cross-Domain** - Consider how changes affect all domains
2. **Prioritize Consistency** - Maintain consistent patterns and conventions
3. **Design for Reuse** - Create flexible, composable components
4. **Document Thoroughly** - Shared code needs excellent documentation
5. **Test Comprehensively** - Shared code impacts entire system

### **Key Files to Read First:**
```bash
# UI component examples:
packages/ui-components/src/components/Button.tsx
packages/ui-components/src/components/Badge.tsx
packages/ui-components/src/hooks/useTheme.ts

# Current type definitions:
apps/idea-cards-pwa/src/types/detailedIdea.ts
packages/ai-agents/src/types/

# Utility examples:
packages/ui-components/src/utils/logger.ts
```

### **Common Development Patterns:**
```typescript
// Compound component pattern:
export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
};

// Custom hook pattern:
export function useSharedHook(config: HookConfig) {
  // 1. State management
  // 2. Effect handling
  // 3. Return stable API
  return useMemo(() => ({
    // Memoized return object
  }), [dependencies]);
}

// Utility function pattern:
export const createSharedUtility = (defaultConfig: Config) => {
  return (input: Input, config?: Partial<Config>) => {
    const finalConfig = { ...defaultConfig, ...config };
    // Utility logic
  };
};
```

---

## 🔗 **Related Documentation**

### **Design System:**
- [UI Components README](./packages/ui-components/README.md)
- [Design System Guidelines](../../docs/design-system.md)
- [Accessibility Guide](../../docs/accessibility.md)

### **Type Safety:**
- [TypeScript Style Guide](../../docs/typescript-guide.md)
- [API Contract Documentation](../../docs/api-contracts.md)
- [Data Validation Guide](../../docs/data-validation.md)

### **Testing:**
- [Testing Strategy](../../docs/testing-strategy.md)
- [Component Testing Guide](../../docs/component-testing.md)

---

## 🚨 **Important Constraints**

### **Backward Compatibility:**
- **NEVER** break existing interfaces without migration path
- **ALWAYS** provide deprecation warnings before removing APIs
- **MAINTAIN** semantic versioning for all shared packages
- **DOCUMENT** breaking changes clearly

### **Performance Constraints:**
- **BUNDLE SIZE** - Keep shared components under 50KB
- **TREE SHAKING** - Ensure all exports are tree-shakeable
- **LAZY LOADING** - Support lazy loading for large components
- **MEMORY USAGE** - Avoid memory leaks in shared utilities

### **Quality Constraints:**
- **100% TYPE COVERAGE** - All shared code must be fully typed
- **ACCESSIBILITY COMPLIANCE** - WCAG 2.2 AA mandatory
- **CROSS-BROWSER SUPPORT** - Modern browsers (ES2020+)
- **MOBILE PERFORMANCE** - Optimized for mobile devices

### **Integration Constraints:**
- **ZERO DOMAIN COUPLING** - Shared code cannot depend on domain-specific code
- **CONSISTENT APIS** - All domains must use same shared interfaces
- **VERSION COMPATIBILITY** - Maintain compatibility across workspace
- **CLEAR DOCUMENTATION** - Every shared API must be documented

---

**💡 Quick Context Summary:**

This domain provides the foundation for all other domains:
- **UI Components** - Consistent, accessible React components
- **Data Models** - Shared TypeScript types and validation
- **Utilities** - Common functions and helpers
- **Design System** - Consistent visual and interaction patterns

**Focus**: Consistency, reusability, quality, accessibility  
**Goal**: Solid foundation for efficient cross-domain development  
**Integration**: Used by all other domains for consistency and efficiency