# ADR-010: Modular Terraform Architecture by Dependency Layers

**Date**: 2025-07-23  
**Status**: ✅ **ACCEPTED**  
**Deciders**: Development Team  
**Technical Story**: Terraform infrastructure management and deployment strategy

## Context

After successfully migrating from manual AWS resource management to Infrastructure-as-Code with Terraform, we discovered that our initial approach of deploying all infrastructure components simultaneously created several challenges:

### Current Pain Points
- **Monolithic Configuration**: Single `main.tf` with 15+ services and complex interdependencies
- **Forced Deployment**: Must deploy all services even when only frontend is needed in production
- **High Risk**: Cascading failures affect entire infrastructure stack
- **Testing Difficulty**: Cannot validate individual components in isolation
- **Team Bottlenecks**: Single configuration file creates merge conflicts and coordination overhead

### Success with Minimal Approach
Our recent production migration successfully used a minimal configuration focusing only on S3 + CloudFront for PWA deployment, demonstrating the value of scoped, incremental infrastructure deployment.

## Decision

We will adopt a **modular Terraform architecture organized by dependency layers and architectural boundaries**.

### Architecture Overview

```
Tier 1: Foundation Layer    (VPC, IAM, basic resources)
         ↓
Tier 2: Frontend Layer      (S3 + CloudFront for PWAs) ← Currently deployed
         ↓
Tier 3: Data Layer         (RDS + Redis + data storage)
         ↓
Tier 4: Compute Layer      (Lambda functions + AI services)
         ↓
Tier 5: API Layer          (API Gateway + AppSync + orchestration)
```

### Directory Structure
```
terraform/environments/
├── prod-foundation/        # Tier 1: Networking, IAM
├── prod-frontend/          # Tier 2: PWA deployment (✅ CURRENT)
├── prod-data/             # Tier 3: Databases and caching
├── prod-compute/          # Tier 4: Lambda and AI services
└── prod-api/              # Tier 5: API Gateway and orchestration
```

## Rationale

### ✅ **Dependency Management**
- Clear dependency chain prevents circular dependencies
- Each layer has well-defined inputs from previous layers
- Can deploy and test each layer independently
- Rollback isolated to affected layers only

### ✅ **Risk Reduction**  
- Smaller blast radius for infrastructure failures
- Incremental deployment with validation at each step
- Easier troubleshooting and debugging
- Independent scaling of architectural concerns

### ✅ **Team Collaboration**
- **Frontend Team**: Owns frontend layer (S3 + CloudFront)
- **Backend Team**: Owns compute and data layers (Lambda + RDS)
- **DevOps Team**: Owns foundation layer (VPC + IAM)
- Clear ownership boundaries reduce coordination overhead

### ✅ **Cost Optimization**
- Deploy only needed components when business requires them
- Easy cost estimation and budgeting per architectural layer
- Can shut down expensive layers while keeping essential ones running
- Better resource utilization and optimization

### ✅ **Business Alignment**
- **Current State**: Frontend-only production deployment matches business needs
- **Future Growth**: Can add backend layers as microservices mature
- **Market Validation**: Can test PWA market fit before investing in full backend
- **Scalability**: Architecture supports growth from startup to enterprise scale

## Implementation Plan

### Phase 1: ✅ COMPLETE - Frontend Layer
- **Status**: Successfully deployed to production
- **Components**: S3 bucket + 2 CloudFront distributions for Ideas and BMC PWAs
- **Location**: `terraform/environments/prod-minimal/` (to be renamed to `prod-frontend/`)

### Phase 2: Foundation Layer (When Backend Services Needed)
- **Components**: VPC, security groups, base IAM roles and policies
- **Dependencies**: None (foundation layer)
- **Triggers**: When Lambda functions or databases are required

### Phase 3: Data Layer (When Persistent Storage Needed)
- **Components**: RDS PostgreSQL Aurora, ElastiCache Redis, data S3 buckets
- **Dependencies**: Foundation layer networking and security
- **Triggers**: When PWA needs to store user data or business intelligence

### Phase 4: Compute Layer (When Business Logic Required)
- **Components**: Lambda functions, AI model router, SQS queues
- **Dependencies**: Data layer for database connections
- **Triggers**: When microservices (data collector, opportunity analyzer, etc.) are deployed

### Phase 5: API Layer (When Frontend-Backend Integration Needed)
- **Components**: API Gateway, AppSync GraphQL, EventBridge scheduling
- **Dependencies**: Compute layer for Lambda functions
- **Triggers**: When PWA frontend needs to integrate with backend services

## Consequences

### ✅ **Positive Consequences**
- **Reduced Risk**: Incremental deployment with isolated failure domains
- **Better Testing**: Each layer can be validated independently
- **Cost Control**: Deploy only what's needed, when it's needed
- **Team Autonomy**: Clear ownership boundaries enable parallel development
- **Faster Iteration**: Smaller deployments mean faster feedback cycles
- **Easier Maintenance**: Focused configurations are easier to understand and modify

### ⚠️ **Negative Consequences**
- **Complexity**: Multiple Terraform configurations to maintain
- **State Management**: Need to coordinate state between layers using remote state
- **Initial Overhead**: More setup work to establish modular structure
- **Documentation**: Need to maintain cross-layer dependency documentation

### 🔧 **Mitigation Strategies**
- **State Management**: Use Terraform remote state with S3 backend for production
- **Documentation**: Maintain architecture diagrams and dependency maps
- **Automation**: Create scripts for multi-layer deployments when needed
- **Standards**: Establish conventions for cross-layer communication

## Related Documents

- **[Modular Architecture Proposal](../terraform/environments/MODULAR-ARCHITECTURE-PROPOSAL.md)**: Detailed technical design and implementation strategy
- **[Terraform Migration Progress](../terraform-migration-backup/MIGRATION-PROGRESS.md)**: Current deployment status and completion record
- **[Production Infrastructure Backup](../terraform-migration-backup/BACKUP-SUMMARY.md)**: Rollback procedures and risk assessment
- **[Development Process Standards (ADR-009)](./ADR-009-Development-Process-Standards.md)**: Deployment safety and process discipline

## Success Metrics

### ✅ **Already Achieved**
- **Frontend Layer**: Production PWA deployment working correctly
- **Infrastructure-as-Code**: Terraform managing production resources
- **Risk Reduction**: Minimal configuration successfully deployed without issues
- **Cost Optimization**: $5-8/month for S3 + CloudFront vs potential $200+/month for full stack

### 🎯 **Future Success Criteria**
- **Independent Deployment**: Each layer deployable without affecting others
- **Team Velocity**: Reduced coordination overhead between frontend/backend teams
- **Infrastructure Reliability**: 99.9% uptime through incremental, tested deployments
- **Cost Efficiency**: Pay only for components that provide business value

## Review Schedule

- **Next Review**: When backend services are ready for production deployment
- **Success Evaluation**: After first multi-layer deployment (foundation + data layers)
- **Architecture Evolution**: Quarterly review to assess if layer boundaries remain optimal

---

**Decision Owner**: Development Team  
**Implementation Status**: ✅ **Phase 1 Complete** (Frontend Layer)  
**Next Milestone**: Foundation Layer when backend services required  
**Related ADRs**: [ADR-009 Development Process Standards](./ADR-009-Development-Process-Standards.md)