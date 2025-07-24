# ADR-003: PostgreSQL JSONB Storage Architecture for AI-Generated Business Ideas

## Status
Accepted

## Date
2025-07-24

## Context

The AI Business Factory Ideas PWA currently generates comprehensive business intelligence through AI agents but lacks persistent storage. All idea cards display the same fallback data because:

1. **No Database Integration**: AI-generated analysis exists only in memory during API calls
2. **Missing Persistence Layer**: Rich business intelligence data (market analysis, financial modeling, founder fit, risk assessment) is not saved
3. **Poor User Experience**: Users cannot revisit previously analyzed ideas or track analysis history
4. **Scalability Issues**: Each detail view regenerates analysis, causing unnecessary API calls and costs

The system generates complex nested JSON structures containing:
- Market analysis with signals, customer evidence, competitor analysis
- Financial modeling with projections and key metrics  
- Founder fit analysis with skills, costs, and investment needs
- Go-to-market strategy with segments and positioning
- Risk assessment with categorized risks and mitigation plans
- Multi-dimensional confidence scoring

## Decision

We will implement **PostgreSQL with JSONB** as the primary storage solution for AI-generated business ideas.

### Architecture Choice: Hybrid Relational + Document Storage

**Primary Storage**: Aurora PostgreSQL Serverless with JSONB columns
- **Structured fields** for indexing: `title`, `confidence_overall`, `market_size_tam`, `tier`
- **JSONB field** for complete AI analysis: `idea_data`
- **Performance indexes** including GIN indexes for JSONB queries
- **Full-text search** with tsvector for content discovery

### Key Components

1. **Database Schema** (`business_ideas_schema.sql`):
   - Main table: `business_ideas` with JSONB storage
   - Extracted fields for fast filtering/sorting
   - Comprehensive indexes for performance
   - Helper functions for common queries

2. **Deployment Pipeline**:
   - GitHub Actions-driven Terraform deployment
   - Automated schema migrations
   - Connection through AWS Secrets Manager

3. **API Integration**:
   - CRUD endpoints for business ideas persistence
   - AI orchestrator saves results to database
   - Ideas PWA loads from database instead of generating on-demand

## Alternatives Considered

### Option 1: Pure NoSQL (DynamoDB)
**Pros**: Native JSON support, serverless scaling, AWS-native
**Cons**: Limited complex queries, no full-text search, higher costs for analytical workloads
**Cost**: $0.25/GB/month + request costs = ~$50-100/month

### Option 2: Document Database (MongoDB)
**Pros**: Native JSON, powerful queries, flexible schema
**Cons**: Additional infrastructure, higher operational complexity, licensing costs
**Cost**: ~$57-200/month for managed instances

### Option 3: Pure Relational (Separate Tables)
**Pros**: Strong consistency, complex relationships, SQL familiarity  
**Cons**: Rigid schema, complex migrations for AI evolution, development overhead

## Rationale

PostgreSQL JSONB provides the optimal balance:

1. **Cost Efficiency**: Aurora Serverless scales to zero, existing infrastructure
2. **Query Flexibility**: Complex JSONB queries + SQL joins + full-text search
3. **Performance**: GIN indexes provide fast JSONB queries (sub-100ms)
4. **Schema Evolution**: AI agents can add new fields without migrations
5. **ACID Compliance**: Strong consistency for business data
6. **Ecosystem**: Rich tooling, monitoring, backup/restore capabilities

### Data Structure Compatibility

The JSONB schema perfectly matches the UI structure:
- **6 Detail Tabs**: Overview, Market Analysis, Financial Model, Team & Costs, Strategy, Risk Assessment
- **TypeScript Interfaces**: Direct mapping between database and frontend types
- **AI Agent Output**: Native compatibility with orchestrator responses

## Implementation Plan

### Phase 1: Database Deployment (Current)
- [x] Create comprehensive PostgreSQL schema with JSONB storage
- [x] Implement deployment script with Terraform integration
- [ ] Deploy via GitHub Actions workflow
- [ ] Verify schema creation and indexing

### Phase 2: API Integration
- [ ] Implement CRUD Lambda functions for business ideas
- [ ] Update AI orchestrator to persist analysis results
- [ ] Create database service layer with connection pooling

### Phase 3: Frontend Integration  
- [ ] Replace in-memory generation with database queries
- [ ] Implement idea history and favorites
- [ ] Add search and filtering capabilities

## Consequences

### Positive
- **Persistent Storage**: Users can revisit and track idea analysis history
- **Performance**: Faster detail view loading (database query vs AI generation)
- **Cost Optimization**: Reduces redundant AI API calls
- **Scalability**: Supports thousands of ideas with fast search/filter
- **Analytics**: Enables idea trending, user behavior analysis
- **Data Integrity**: ACID compliance ensures consistent business data

### Negative
- **Complexity**: Additional database layer to maintain
- **Migration Overhead**: Future schema changes require careful planning
- **Storage Costs**: ~$10-20/month for Aurora Serverless (minimal for current scale)

### Risks & Mitigations
- **Schema Evolution**: JSONB provides flexible schema updates
- **Performance**: Comprehensive indexing strategy implemented
- **Backup/Recovery**: Aurora provides automated backups and point-in-time recovery
- **Security**: Row-level security and IAM integration available

## Success Metrics

- **Performance**: Detail view loads in <500ms (vs current 2-4s generation time)
- **Cost**: Reduce AI API costs by 60-80% through persistent storage
- **User Experience**: Enable idea history, search, and favorites features
- **Scalability**: Support 10,000+ ideas with sub-second query performance

## Related Documents

- [Database Schema](../infrastructure/database/schemas/business_ideas_schema.sql)
- [Deployment Script](../infrastructure/database/deploy-schema.sh)
- [Sample Data](../infrastructure/database/seed-sample-data.sql)
- [TypeScript Interfaces](../domains/idea-generation/apps/ideas-pwa/src/types/detailedIdea.ts)
- [AI Agent Architecture](./AI-AGENT-ARCHITECTURE.md)

---

**Authors**: Claude AI Assistant  
**Reviewers**: Development Team  
**Implementation Status**: In Progress (Phase 1)