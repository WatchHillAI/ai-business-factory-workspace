# Market Intelligence Domain - Claude Development Context

**🧠 Claude Development Context for Market Research & Analysis**

## 📋 **Domain Scope**

This domain handles all aspects of market research, data collection, opportunity analysis, and competitive intelligence.

### **Core Responsibilities:**
- Market research and signal detection
- Web scraping and data collection from free sources
- Opportunity scoring and analysis  
- Market validation and competitive intelligence
- Customer evidence generation and analysis

### **Business Value:**
Transform raw market data into actionable business intelligence using AI agents and free data sources.

---

## 🎯 **Key Packages in This Domain**

### **Current Packages:**
```bash
# Will be moved here from existing structure:
packages/ai-agents/src/agents/MarketResearchAgent.ts → market-research-agent/

# Will be consolidated from external repositories:
~/Development/ai-business-factory-data-collector → data-collector/
~/Development/ai-business-factory-market-validator → market-validator/  
~/Development/ai-business-factory-opportunity-analyzer → opportunity-analyzer/
```

### **Target Structure:**
```bash
domains/market-intelligence/
├── packages/
│   ├── market-research-agent/     # Enhanced from current MarketResearchAgent
│   ├── data-collector/            # Web scraping and data ingestion
│   ├── market-validator/          # Market validation logic
│   └── opportunity-analyzer/      # Business opportunity scoring
└── README-CLAUDE.md              # This file
```

---

## 🔧 **Common Development Tasks**

### **1. Enhancing Market Research Agent**
```bash
# Key files to work with:
domains/market-intelligence/packages/market-research-agent/
├── src/
│   ├── MarketResearchAgent.ts     # Main agent implementation
│   ├── problemAnalysis.ts         # Problem space analysis
│   ├── signalDetection.ts         # Market signal detection
│   ├── customerEvidence.ts        # Customer evidence generation
│   └── competitorAnalysis.ts      # Competitive intelligence
└── tests/                         # Comprehensive test suite
```

### **2. Data Collection Enhancement**
```bash
# Free data sources implementation:
domains/market-intelligence/packages/data-collector/
├── src/
│   ├── collectors/
│   │   ├── googleTrends.ts        # Google Trends API
│   │   ├── redditScraper.ts       # Reddit data collection
│   │   ├── hackerNews.ts          # Hacker News API
│   │   └── githubTrends.ts        # GitHub API trends
│   ├── processors/                # Data processing and validation
│   └── cache/                     # Caching strategies
```

### **3. Opportunity Analysis**
```bash
# Business opportunity scoring:
domains/market-intelligence/packages/opportunity-analyzer/
├── src/
│   ├── scoringEngine.ts           # Multi-criteria scoring
│   ├── marketTiming.ts            # Market timing analysis
│   ├── competitiveLandscape.ts    # Competitive positioning
│   └── riskAssessment.ts          # Market risk analysis
```

---

## 📊 **Data Sources & Integration**

### **Free Data Sources (Current Implementation):**
- **Google Trends API** - Search volume and trend analysis
- **Reddit API** - Community sentiment and discussions
- **Hacker News API** - Tech industry trends and sentiment
- **GitHub API** - Technology adoption and repository trends
- **Public APIs** - Various industry-specific data sources

### **Data Flow Architecture:**
```typescript
// Typical data flow in this domain:
1. Data Collector → Raw data from multiple sources
2. Data Processor → Clean, validate, and structure data
3. Market Research Agent → Generate insights using AI
4. Opportunity Analyzer → Score and rank opportunities
5. Market Validator → Validate findings and recommendations
```

### **Key Integration Points:**
```typescript
// Integration with other domains:
interface MarketIntelligenceOutput {
  problemStatement: ProblemStatement;
  marketSignals: MarketSignal[];
  customerEvidence: CustomerEvidence[];
  competitorAnalysis: Competitor[];
  marketTiming: MarketTiming;
  opportunityScore: number;
}

// Used by idea-generation domain for business planning
// Used by ai-orchestration domain for agent coordination
```

---

## 🔒 **Development Guidelines**

### **Data Quality Standards:**
- **Confidence Scoring** - All outputs include confidence metrics
- **Source Attribution** - Track data sources for transparency
- **Quality Validation** - Multi-stage validation for accuracy
- **Bias Detection** - Identify and mitigate data bias

### **Performance Requirements:**
- **Response Time** - Market analysis < 30 seconds
- **Data Freshness** - Update signals every 24 hours
- **Cache Strategy** - Intelligent caching for cost optimization
- **Rate Limiting** - Respect API rate limits for free sources

### **Cost Optimization:**
```typescript
// Free-first approach:
- Prefer free APIs over paid alternatives
- Implement intelligent caching to reduce API calls
- Use batch processing for efficiency
- Monitor usage to stay within free tier limits
```

---

## 🧪 **Testing Strategy**

### **Unit Testing:**
```bash
# Test individual components:
- Market signal detection algorithms
- Data collection and validation
- Opportunity scoring calculations  
- Customer evidence generation
```

### **Integration Testing:**
```bash
# Test end-to-end workflows:
- Complete market research pipeline
- Data source integration and failover
- Multi-agent coordination
- Output quality validation
```

### **Data Quality Testing:**
```bash
# Validate data quality:
- Source reliability checks
- Confidence score validation
- Bias detection and mitigation
- Output consistency verification
```

---

## 🎯 **Context Guidelines for Claude**

### **When Working in This Domain:**

1. **Focus on Market Intelligence** - Stay within market research and data collection scope
2. **Prioritize Free Data Sources** - Maintain zero-cost development approach
3. **Emphasize Quality** - Confidence scoring and validation are critical
4. **Consider Performance** - Optimize for speed and cost efficiency
5. **Think Integration** - Consider how outputs integrate with other domains

### **Key Files to Read First:**
```bash
# Always read these for context:
../../../packages/ai-agents/src/agents/MarketResearchAgent.ts
../../../docs/ADR-002-Free-Data-Sources-Implementation.md
../../../docs/FREE-DATA-SOURCES-GUIDE.md

# For current implementation details:
../../../packages/ai-agents/src/orchestration/AgentOrchestrator.ts
```

### **Common Patterns:**
```typescript
// Confidence scoring pattern:
interface AnalysisOutput {
  data: any;
  confidence: number;          // 0-100
  sources: string[];          // Data source attribution
  timestamp: string;          // When analysis was performed
  qualityMetrics: QualityMetrics;
}

// Free data source pattern:
interface DataCollector {
  collect(): Promise<RawData>;
  validate(data: RawData): ValidationResult;
  cache(data: RawData, ttl: number): void;
  getCached(): RawData | null;
}
```

---

## 🔗 **Related Documentation**

### **Domain-Specific:**
- [Free Data Sources Guide](../../docs/FREE-DATA-SOURCES-GUIDE.md)
- [ADR-002: Free Data Sources Implementation](../../docs/ADR-002-Free-Data-Sources-Implementation.md)
- [Market Research Agent Implementation](../../docs/AGENT-IMPLEMENTATION-SPECS.md)

### **Integration:**
- [AI Agent Architecture](../../docs/AI-AGENT-ARCHITECTURE.md)
- [Agent Orchestration](../ai-orchestration/README-CLAUDE.md)
- [Data Models](../shared/packages/data-models/)

### **Testing:**
- [Quality Assurance Framework](../ai-orchestration/packages/quality-assurance/)
- [Testing Strategy Guide](../../docs/testing-strategy.md)

---

## 🚨 **Important Constraints**

### **Cost Constraints:**
- **NEVER** use paid APIs without explicit approval
- **ALWAYS** implement rate limiting for free APIs
- **MONITOR** usage to stay within free tier limits
- **CACHE** aggressively to reduce API calls

### **Quality Constraints:**
- **EVERY** output must include confidence scoring
- **ALL** data sources must be attributed
- **VALIDATE** all external data before use
- **DETECT** and mitigate potential bias

### **Performance Constraints:**
- **MARKET ANALYSIS** must complete within 30 seconds
- **DATA COLLECTION** should batch requests for efficiency
- **CACHING** required for frequently accessed data
- **MONITORING** required for API health and performance

---

**💡 Quick Context Summary:**

This domain transforms raw market data into business intelligence using:
- **Free APIs only** (Google Trends, Reddit, HN, GitHub)
- **AI-powered analysis** with confidence scoring
- **Multi-source validation** for accuracy
- **Real-time market signals** for opportunity detection

**Focus**: Market research, data collection, opportunity analysis  
**Goal**: Zero-cost market intelligence with enterprise-grade quality  
**Integration**: Feeds insights to idea-generation and ai-orchestration domains