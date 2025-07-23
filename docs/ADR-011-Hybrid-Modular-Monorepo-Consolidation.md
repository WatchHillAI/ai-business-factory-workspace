# ADR-011: Hybrid Modular Monorepo Consolidation

**Status**: Accepted  
**Date**: 2025-07-23  
**Deciders**: Development Team  
**Technical Story**: Consolidate 11 scattered repositories into a single Claude-optimized monorepo

---

## Context

The AI Business Factory project currently suffers from **architectural fragmentation** across 11 repositories:

### Current Repository Distribution
```
├── ai-business-factory (original hub - docs/UX)
├── ai-business-factory-workspace (active production - NX monorepo)
├── ai-business-factory-infrastructure (external Terraform)
├── ai-business-factory-business-generator (duplicate functionality)
├── ai-business-factory-data-collector (duplicate functionality)  
├── ai-business-factory-market-validator (duplicate functionality)
├── ai-business-factory-opportunity-analyzer (duplicate functionality)
├── ai-business-factory-scheduler (helper service)
├── ai-business-factory-strategy-manager (helper service)
└── 3 additional related repositories
```

### Key Problems Identified

1. **Architectural Duplication**
   - Market Research Agent implemented in main workspace (776 lines, production-ready)
   - market-validator repository has 70% overlapping functionality (469 lines, prototype-quality)
   - business-generator duplicates financial modeling capabilities
   - opportunity-analyzer duplicates market analysis features

2. **Development Friction**
   - **Claude Code Context Limitations**: Large distributed codebase exceeds context windows
   - **Cross-repository Dependencies**: GitHub Actions require external repository checkout
   - **Inconsistent Tooling**: Different build systems, linting configs, and deployment patterns
   - **Context Switching Overhead**: Developers must navigate 11 different repositories

3. **Operational Complexity**
   - **Fragmented CI/CD**: Multiple deployment pipelines with different patterns
   - **Inconsistent Infrastructure**: External Terraform repository creates deployment dependencies
   - **Maintenance Burden**: 11 repositories require individual attention for security updates, dependency management

4. **Quality Inconsistencies**
   - Main workspace: TypeScript, comprehensive validation, quality assurance
   - Separate repos: Basic JavaScript, minimal error handling, prototype-quality code

## Decision

We will adopt a **Hybrid Modular Monorepo** architecture optimized for AI-assisted development with Claude Code.

### Target Architecture

```
ai-business-factory-workspace/                 # Single consolidated repository
├── .github/
│   ├── workflows/
│   │   ├── ci-matrix.yml                     # Multi-context CI pipeline
│   │   ├── deploy-by-domain.yml              # Domain-based deployments
│   │   └── infrastructure.yml                # Terraform management
│   └── CODEOWNERS                            # Context-based ownership
│
├── infrastructure/                            # Consolidated Terraform (from external repo)
│   ├── environments/
│   ├── modules/
│   └── README-CLAUDE.md                      # Infrastructure context guide
│
├── domains/                                   # Business domain boundaries
│   ├── market-intelligence/                  # Market research & analysis
│   │   ├── packages/
│   │   │   ├── market-research-agent/        # Enhanced from current
│   │   │   ├── data-collector/               # From: data-collector repo
│   │   │   └── opportunity-analyzer/         # From: opportunity-analyzer repo
│   │   └── README-CLAUDE.md                  # Domain context for Claude
│   │
│   ├── idea-generation/                      # Business idea lifecycle
│   │   ├── packages/
│   │   │   ├── business-generator/           # From: business-generator repo
│   │   │   ├── financial-modeling/          # Enhanced from current
│   │   │   └── strategy-manager/             # From: strategy-manager repo
│   │   ├── apps/
│   │   │   ├── ideas-pwa/                   # Current: ideas-pwa
│   │   │   └── bmc-pwa/                     # Current: bmc-pwa
│   │   └── README-CLAUDE.md
│   │
│   ├── ai-orchestration/                     # AI system coordination
│   │   ├── packages/
│   │   │   ├── agent-orchestrator/          # Enhanced from current ai-agents
│   │   │   ├── scheduler/                   # From: scheduler repo
│   │   │   └── quality-assurance/           # New: Agent validation
│   │   └── README-CLAUDE.md
│   │
│   └── shared/                               # Cross-domain utilities
│       ├── packages/
│       │   ├── ui-components/               # Current: ui-components
│       │   ├── data-models/                 # Shared TypeScript types
│       │   └── utils/                       # Common utilities
│       └── README-CLAUDE.md
│
├── docs/
│   ├── claude-development/                   # Claude-specific guides
│   │   ├── context-maps.md                  # Domain boundaries
│   │   ├── development-workflows.md         # Common workflows
│   │   └── troubleshooting.md               # Common issues
│   └── legacy/                              # Historical documentation
│       ├── original-hub/                    # From: ai-business-factory
│       └── repository-evolution/            # Migration history
│
└── tools/
    ├── scripts/migration/                    # Repository migration scripts
    └── claude-helpers/                       # Claude development aids
        ├── context-builder.js                # Auto-generate context docs
        └── package-analyzer.js               # Dependency analysis
```

## Rationale

### 1. **Claude Code Optimization**

**Problem**: Claude Code has context limitations that make large distributed codebases difficult to work with.

**Solution**: Domain-based boundaries create **context-sized work areas**:
```markdown
# Working on market research - scoped context
claude: "Let's enhance the market research agent"
# Claude only needs: domains/market-intelligence/packages/market-research-agent/
# + its direct dependencies in shared/packages/data-models/
```

**Benefits**:
- **Explicit Boundaries**: Clear interfaces prevent invisible coupling
- **Scoped Contexts**: Most tasks stay within 1-2 packages  
- **Independent Development**: Each domain can be developed in isolation
- **Interface-First Design**: TypeScript contracts define all interactions

### 2. **Eliminate Architectural Duplication**

**Current State**: 70% functionality overlap between main workspace and separate repositories
**Target State**: Single authoritative implementation per capability

**Migration Strategy**:
- **Enhance Main Workspace**: Use production-ready TypeScript implementations as foundation
- **Extract Valuable Logic**: Preserve unique functionality from prototype repositories  
- **Archive Duplicates**: Safely retire redundant implementations
- **Quality Consistency**: Apply consistent patterns, validation, and error handling

### 3. **Unified Development Experience**

**Current Pain Points**:
- 11 repositories with different tooling
- Cross-repo GitHub Actions dependencies
- Inconsistent deployment patterns
- Context switching overhead

**Target Benefits**:
- **Single `git clone`** for entire project
- **Unified tooling**: ESLint, TypeScript, Jest, deployment scripts
- **Shared dependencies**: Workspace protocols eliminate version conflicts
- **Consistent CI/CD**: Domain-aware deployment triggers

### 4. **Infrastructure Consolidation**

**Current**: External Terraform repository creates deployment dependencies
**Target**: Infrastructure as part of monorepo with local management

**Benefits**:
- **No External Dependencies**: GitHub Actions use local infrastructure configs
- **Unified State Management**: Single repository for all infrastructure changes
- **Simplified Deployment**: Domain-based infrastructure deployments
- **Better Integration**: Infrastructure changes alongside application changes

### 5. **Operational Efficiency**

**Cost-Benefit Analysis**:
- **Implementation Cost**: 3-4 weeks development time
- **Maintenance Reduction**: 90% fewer repositories to maintain
- **Development Speed**: 50% reduction in context switching
- **Quality Improvement**: Consistent patterns and tooling across all components
- **ROI**: Very high - significant long-term maintenance savings

## Implementation Plan

### Phase 1: Infrastructure Consolidation (Week 1)
1. **Move Terraform configurations** to `infrastructure/` directory
2. **Update GitHub Actions** to use local infrastructure configs  
3. **Test deployment pipeline** with consolidated infrastructure
4. **Verify zero production impact**

### Phase 2: Repository Consolidation (Week 2-3)
1. **Create domain boundaries** with clear interfaces
2. **Migrate valuable functionality** from separate repositories
3. **Archive duplicate implementations** after functionality preservation
4. **Update all integration points** to use consolidated system

### Phase 3: Claude Development Optimization (Week 4)
1. **Create domain context guides** for efficient Claude development
2. **Implement helper tools** for context-aware development
3. **Document development workflows** and troubleshooting guides
4. **Validate Claude development experience** with real tasks

### Phase 4: Production Validation (Week 5)
1. **Comprehensive testing** across all integrated components
2. **Performance benchmarking** vs. current architecture
3. **Documentation finalization** and team training
4. **Production deployment** with monitoring

## Consequences

### Positive

1. **Unified Development Experience**
   - Single repository for all development work
   - Consistent tooling and patterns across all components
   - Reduced context switching and cognitive overhead

2. **Claude-Optimized Architecture**
   - Domain boundaries create manageable context windows
   - Clear interfaces enable focused AI-assisted development
   - Context guides optimize Claude development workflows

3. **Operational Simplification**
   - 90% reduction in repositories to maintain
   - Unified CI/CD pipeline with domain-aware deployments
   - Consolidated infrastructure management

4. **Quality Consistency**
   - Single set of coding standards and patterns
   - Consistent error handling and validation
   - Unified testing and quality assurance

5. **Improved Integration**
   - Direct imports between packages
   - Shared utilities and data models
   - Coordinated releases and versioning

### Negative

1. **Migration Complexity**
   - 3-4 weeks of intensive migration work
   - Risk of breaking existing functionality during transition
   - Learning curve for new domain boundaries

2. **Repository Size**
   - Larger repository may have longer clone times
   - More complex git history after consolidation
   - Potential for larger context in some scenarios

3. **Team Coordination**
   - Need to coordinate changes across multiple domains
   - Potential for merge conflicts in shared components
   - Requires clear ownership boundaries (CODEOWNERS)

### Risks and Mitigations

1. **Risk**: Production disruption during migration
   **Mitigation**: Blue-green deployment with comprehensive testing

2. **Risk**: Loss of functionality during consolidation  
   **Mitigation**: Systematic migration with functionality validation

3. **Risk**: Team productivity loss during transition
   **Mitigation**: Phased migration with training and documentation

4. **Risk**: Claude context still too large in some scenarios
   **Mitigation**: Fine-grained domain boundaries and helper tools

## Success Metrics

1. **Development Efficiency**
   - Repository count: 11 → 1 (90% reduction)
   - Average task context: < 5 files for 80% of development tasks
   - Developer onboarding: < 30 minutes for full environment setup

2. **Code Quality**
   - Zero breaking changes to production APIs
   - Consistent TypeScript coverage across all packages
   - Unified testing patterns and >80% coverage

3. **Operational Metrics**
   - Build time: < 5 minutes for complete monorepo
   - Deployment frequency: Enable daily deployments
   - Mean time to recovery: < 15 minutes

4. **Claude Development Experience**
   - 90% of tasks completable within single domain context
   - Clear context guides for all major development workflows
   - Helper tools reduce context setup time by 70%

## Related ADRs

- **ADR-009: Development Process Standards** - Establishes deployment safety requirements
- **ADR-010: Modular Terraform Architecture** - Defines infrastructure modularity patterns
- **Future ADR-012: Domain Ownership Model** - Will define CODEOWNERS and responsibility boundaries

## Links

- [Architecture Analysis Report](./architecture-analysis-2025-07-23.md)
- [Migration Implementation Plan](./migration-plan-2025-07-23.md)
- [Claude Development Optimization Guide](./claude-development-guide.md)

---

**Decision Recorded**: 2025-07-23  
**Implementation Start**: 2025-07-23  
**Expected Completion**: 2025-08-20  
**Review Date**: 2025-09-01