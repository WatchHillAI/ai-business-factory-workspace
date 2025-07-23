# Idea Generation Domain - Claude Development Context

**💡 Claude Development Context for Business Idea Lifecycle Management**

## 📋 **Domain Scope**

This domain handles the complete business idea lifecycle from initial concept through detailed business planning and strategy development.

### **Core Responsibilities:**
- Business idea development and refinement
- Financial modeling and revenue projections
- Business plan generation and documentation
- Strategy management and optimization
- User interface for idea discovery and management

### **Business Value:**
Transform simple business concepts into comprehensive, actionable business plans with AI-powered analysis and user-friendly interfaces.

---

## 🎯 **Key Packages & Applications**

### **Current Structure:**
```bash
# Applications (already in domain):
apps/idea-cards-pwa/              # Ideas discovery and management UI
apps/bmc-pwa/                     # Business Model Canvas PWA

# Packages (will be moved/enhanced):
packages/ai-agents/src/agents/FinancialModelingAgent.ts → financial-modeling/
packages/ai-agents/src/agents/FounderFitAgent.ts → founder-fit-analysis/
```

### **Target Structure:**
```bash
domains/idea-generation/
├── apps/
│   ├── ideas-pwa/                # Ideas Discovery PWA (moved from apps/)
│   └── bmc-pwa/                  # Business Model Canvas PWA (moved from apps/)
├── packages/
│   ├── business-generator/       # From: business-generator repo
│   ├── financial-modeling/      # Enhanced from FinancialModelingAgent
│   ├── founder-fit-analysis/     # Enhanced from FounderFitAgent  
│   └── strategy-manager/         # From: strategy-manager repo
└── README-CLAUDE.md             # This file
```

---

## 🔧 **Common Development Tasks**

### **1. Ideas PWA Enhancement**
```bash
# Main user interface for business idea management:
domains/idea-generation/apps/ideas-pwa/
├── src/
│   ├── components/
│   │   ├── IdeaCard.tsx          # Business idea display
│   │   ├── IdeaDetailView.tsx    # Comprehensive analysis view
│   │   └── LiveAITest.tsx        # AI agent integration
│   ├── data/
│   │   └── sampleDetailedIdea.ts # Example detailed analysis
│   ├── lib/
│   │   ├── api.ts                # AI agent API integration
│   │   └── microservicesIntegration.ts
│   └── types/
│       └── detailedIdea.ts       # TypeScript definitions
```

### **2. Financial Modeling Development**
```bash
# Advanced financial analysis and projections:
domains/idea-generation/packages/financial-modeling/
├── src/
│   ├── FinancialModelingAgent.ts  # Main agent implementation
│   ├── marketSizing.ts            # TAM/SAM/SOM calculations
│   ├── revenueProjections.ts      # Revenue forecasting
│   ├── costAnalysis.ts            # Cost structure analysis
│   └── fundingRequirements.ts     # Investment analysis
```

### **3. Business Plan Generation**
```bash
# Comprehensive business plan creation:
domains/idea-generation/packages/business-generator/
├── src/
│   ├── planGenerator.ts           # Business plan compilation
│   ├── templates/                 # Plan templates and formats
│   ├── sections/                  # Individual plan sections
│   └── validation/                # Plan quality validation
```

---

## 💼 **Business Intelligence Integration**

### **Data Flow Architecture:**
```typescript
// Typical idea development flow:
1. User Input → Basic business idea concept
2. Market Intelligence → Market analysis and validation
3. Financial Modeling → Revenue projections and cost analysis
4. Founder Fit Analysis → Team requirements and investment needs
5. Business Generator → Comprehensive business plan
6. Strategy Manager → Ongoing strategy optimization
```

### **Key Integration Points:**
```typescript
// Integration with market-intelligence domain:
interface IdeaAnalysisInput {
  idea: BasicIdea;
  marketAnalysis: MarketIntelligenceOutput;  // From market-intelligence domain
  userContext: UserContext;
}

// Output to user interfaces:
interface DetailedIdea {
  overview: ExecutiveSummary;
  marketAnalysis: MarketAnalysisOutput;
  financialModel: FinancialModelOutput;
  teamAndCosts: FounderFitOutput;
  strategy: StrategyOutput;
  riskAssessment: RiskAssessmentOutput;
}
```

### **User Experience Flow:**
```typescript
// Progressive disclosure in Ideas PWA:
1. Browse Ideas → Card-based discovery interface
2. Select Idea → Basic details and quick insights  
3. Deep Dive → 6-tab comprehensive analysis:
   - Overview (executive summary, confidence scoring)
   - Market Analysis (signals, evidence, competitors)
   - Financial Model (TAM/SAM/SOM, projections, funding)
   - Team & Costs (founder fit, team composition, investment)
   - Strategy (go-to-market, competitive positioning)
   - Risk Assessment (risks, mitigations, scenarios)
```

---

## 🎨 **User Interface Guidelines**

### **Design Principles:**
- **Dark Mode First** - Premium feel with high contrast (18.3:1 ratio)
- **Progressive Disclosure** - Reveal complexity gradually
- **AI Integration** - Seamless AI-powered insights
- **Mobile Responsive** - PWA-first design
- **Accessibility** - WCAG 2.2 AA compliance

### **Component Architecture:**
```typescript
// Shared UI patterns:
interface IdeaCardProps {
  idea: BasicIdea;
  confidence?: number;
  onSelect: (id: string) => void;
  showDetails?: boolean;
}

interface DetailedViewProps {
  idea: DetailedIdea;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}
```

### **State Management:**
```typescript
// Zustand store pattern:
interface IdeaStore {
  ideas: DetailedIdea[];
  selectedIdea: DetailedIdea | null;
  analysisLoading: boolean;
  
  // Actions
  selectIdea: (id: string) => void;
  analyzeIdea: (idea: BasicIdea) => Promise<DetailedIdea>;
  updateIdea: (id: string, updates: Partial<DetailedIdea>) => void;
}
```

---

## 🔒 **Development Guidelines**

### **Financial Modeling Standards:**
- **Realistic Projections** - Base on market data and comparable companies
- **Multiple Scenarios** - Pessimistic, realistic, optimistic forecasts
- **Confidence Intervals** - Quantify uncertainty in projections
- **Unit Economics** - Focus on sustainable business models

### **Business Plan Quality:**
- **Comprehensive Coverage** - All key business areas addressed
- **Data-Driven Insights** - Back all claims with market data
- **Actionable Recommendations** - Provide clear next steps
- **Professional Presentation** - Investment-ready documentation

### **User Experience Standards:**
- **Performance** - Load detailed analysis in < 5 seconds
- **Responsiveness** - Smooth interactions on all devices
- **Accessibility** - Screen reader compatible, keyboard navigation
- **Offline Support** - Core functionality available offline

---

## 🧪 **Testing Strategy**

### **Frontend Testing:**
```bash
# Component testing:
- IdeaCard rendering and interactions
- DetailedView tab navigation and data display
- API integration and error handling
- Responsive design across devices

# User experience testing:
- Complete idea discovery flow
- Analysis generation and display
- Offline functionality
- Performance benchmarks
```

### **Backend Testing:**
```bash
# Business logic testing:
- Financial model calculations and projections
- Business plan generation and validation
- Strategy recommendations and optimization
- Integration with market intelligence data
```

### **Integration Testing:**
```bash
# End-to-end workflows:
- Complete idea analysis pipeline
- Multi-agent coordination and data flow
- User interface integration with AI agents
- Performance and scalability testing
```

---

## 🎯 **Context Guidelines for Claude**

### **When Working in This Domain:**

1. **Focus on Business Value** - Prioritize features that help entrepreneurs
2. **Emphasize User Experience** - Ideas PWA is user-facing, must be polished
3. **Integrate AI Seamlessly** - AI should enhance, not complicate the experience
4. **Think Business Reality** - Models and plans must be practical and actionable
5. **Consider Complete Journey** - From idea discovery to business execution

### **Key Files to Read First:**
```bash
# User interface context:
apps/idea-cards-pwa/src/components/IdeaDetailView.tsx
apps/idea-cards-pwa/src/types/detailedIdea.ts
apps/idea-cards-pwa/src/data/sampleDetailedIdea.ts

# AI agent integration:
../../../packages/ai-agents/src/agents/FinancialModelingAgent.ts
../../../packages/ai-agents/src/orchestration/AgentOrchestrator.ts

# Business model context:
apps/bmc-pwa/src/components/bmc/BMCCanvas.tsx
```

### **Common Development Patterns:**
```typescript
// Progressive enhancement pattern:
interface AnalysisState {
  basic: BasicAnalysis;       // Quick insights
  detailed?: DetailedAnalysis; // Full AI analysis
  confidence: number;         // Analysis quality
}

// AI integration pattern:
interface AIAnalysisHook {
  analyze: (idea: BasicIdea) => Promise<DetailedIdea>;
  loading: boolean;
  error: string | null;
  confidence: number;
}
```

---

## 🔗 **Related Documentation**

### **Domain-Specific:**
- [Ideas PWA Architecture](../../apps/idea-cards-pwa/README.md)
- [BMC PWA Documentation](../../apps/bmc-pwa/CLAUDE.md)
- [Business Intelligence Strategy](../../docs/IDEA-DETAIL-STRATEGY.md)

### **Integration:**
- [Market Intelligence Integration](../market-intelligence/README-CLAUDE.md)
- [AI Orchestration](../ai-orchestration/README-CLAUDE.md)
- [Shared UI Components](../shared/packages/ui-components/)

### **User Experience:**
- [Accessibility Report](../../apps/idea-cards-pwa/docs/ACCESSIBILITY-REPORT.md)
- [Design System Documentation](../../packages/ui-components/README.md)

---

## 🚨 **Important Constraints**

### **User Experience Constraints:**
- **NEVER** break the 6-tab detail view structure (Overview, Market, Financial, Team, Strategy, Risk)
- **ALWAYS** maintain dark mode as default with high contrast ratios
- **PRESERVE** PWA functionality and offline capabilities
- **ENSURE** mobile responsiveness across all components

### **Business Logic Constraints:**
- **FINANCIAL MODELS** must be based on realistic market data
- **BUSINESS PLANS** must be investment-ready quality
- **PROJECTIONS** must include confidence intervals and scenarios
- **RECOMMENDATIONS** must be actionable and specific

### **Performance Constraints:**
- **IDEA ANALYSIS** must complete within 60 seconds
- **UI UPDATES** must be responsive (< 100ms interactions)
- **PWA LOADING** must be < 3 seconds on 3G networks
- **OFFLINE FUNCTIONALITY** must work for core features

### **Integration Constraints:**
- **MAINTAIN** compatibility with existing API structure
- **PRESERVE** all existing URLs and routing
- **ENSURE** seamless data flow between domains
- **VALIDATE** all cross-domain interfaces

---

**💡 Quick Context Summary:**

This domain creates the complete business idea experience:
- **Ideas PWA** - User-facing application for idea discovery and analysis
- **BMC PWA** - Business Model Canvas for detailed planning
- **AI-Powered Analysis** - Comprehensive business intelligence
- **Investment-Ready Output** - Professional business plans and models

**Focus**: User experience, business planning, financial modeling  
**Goal**: Transform ideas into actionable business plans  
**Integration**: Consumes market intelligence, provides business guidance