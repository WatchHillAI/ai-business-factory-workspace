# ADR-009: Development Process Standards

## Status
**Accepted** - July 22, 2025

## Context
During a production deployment of the Ideas PWA with live microservices integration, we encountered a significant issue where CloudFront was serving content from the wrong S3 bucket. This occurred because we:

1. Bypassed the GitHub CI/CD pipeline
2. Deployed directly to S3 using manual AWS CLI commands
3. Did not verify CloudFront origin configuration before deployment
4. Skipped standard testing and verification procedures

This incident resulted in hours of debugging and highlighted the importance of following established development processes.

## Decision

We will implement and adhere to the following development process standards:

### Core Principles

1. **Progress Through Process** - Fast is slow when fixing takes longer than doing it right
2. **Trust but Verify** - Every deployment deserves validation
3. **Fail Fast, Fix Forward** - Catch issues early when they're cheap to fix

### Required Processes

#### For Local Development
- Use the verified server startup sequence documented in CLAUDE.md
- Run `npm run typecheck` and `npm run lint` before committing
- Document significant decisions or changes

#### For Production Deployments
- **MUST** use feature branches and pull requests
- **MUST** run full test suite (`npm test`) before deployment
- **MUST** use GitHub Actions CI/CD pipeline for all deployments
- **MUST NOT** deploy directly to S3 using manual commands
- **MUST** verify target environment configuration before deployment

#### For Infrastructure Changes
- **MUST** document current state before changes
- **MUST** create written plan with rollback strategy
- **MUST** verify changes in development environment when possible
- **SHOULD** apply changes during low-traffic periods

### Enforcement Mechanisms

1. **CLAUDE.md Integration** - Critical deployment safety checklist added at top of file
2. **Pre-deployment Verification** - Required commands for state verification
3. **Red Flag Warnings** - Claude will warn when detecting risky patterns:
   - Direct S3 uploads without PR
   - Manual CloudFront operations
   - Skipping test suites
   - Infrastructure changes without verification

## Consequences

### Positive
- Reduced production incidents and debugging time
- Consistent deployment quality
- Better audit trail through git history
- Automated validation catches errors early
- Team confidence in deployment safety

### Negative
- Slightly slower deployment for hotfixes
- Requires discipline to follow process
- May feel like overhead for "simple" changes

### Trade-offs Accepted
We explicitly accept that following proper process may slow down individual deployments, but this is outweighed by:
- Elimination of multi-hour debugging sessions
- Prevention of customer-facing issues
- Reduced stress during deployments
- Better system reliability

## Lessons Learned

From the CloudFront misconfiguration incident:
1. The GitHub Actions workflow already knew the correct bucket mappings
2. Manual deployment bypassed all safety checks
3. "Just this once" exceptions become costly habits
4. Infrastructure state assumptions are dangerous

## Implementation Notes

- Claude will proactively remind about process requirements
- Verification commands are provided in CLAUDE.md
- The "right way" is documented with copy-paste commands
- Process exceptions require explicit user override

## References

- Incident: CloudFront serving from wrong S3 bucket (July 22, 2025)
- CLAUDE.md: Development process documentation
- GitHub Actions: `.github/workflows/deploy.yml`

---

*"Move fast and break things" works until the things you break are in production at 3 AM.*