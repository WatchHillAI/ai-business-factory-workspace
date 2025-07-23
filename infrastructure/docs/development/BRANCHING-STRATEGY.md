# Git Branching Strategy Implementation Guide

## Overview
This guide implements the **GitHub Flow + Release Branches** strategy as defined in [ADR-008](../KEY-DECISIONS.md#adr-008-git-branching-strategy-for-multi-repository-serverless-architecture).

## Branch Strategy

### Branch Types
```
main (production-ready)
├── feature/ai-model-optimization
├── feature/lambda-performance-tuning  
├── hotfix/memory-leak-fix
└── release/v1.3.0 (optional for coordinated releases)
```

### Branch Purposes
- **`main`**: Production-ready code, always deployable
- **`feature/*`**: New features or enhancements
- **`hotfix/*`**: Critical bug fixes
- **`release/*`**: Coordinated releases across services (optional)

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/add-ai-model-caching

# Work on feature
git add .
git commit -m "feat(opportunity-analyzer): add Redis caching for AI models"

# Push and create PR
git push -u origin feature/add-ai-model-caching
gh pr create --title "Add AI model caching" --body "Improves response time by 60%"
```

### 2. Hotfix Process
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/memory-leak-lambda

# Fix issue
git add .
git commit -m "fix(data-collector): resolve memory leak in scraper"

# Push and create urgent PR
git push -u origin hotfix/memory-leak-lambda
gh pr create --title "🚨 HOTFIX: Memory leak in data collector" --body "Critical fix for production"
```

### 3. Release Coordination (Optional)
```bash
# For coordinated releases across multiple services
git checkout main
git pull origin main
git checkout -b release/v1.3.0

# Test integration across services
# Deploy to staging environment
# Run full test suite

# When ready, merge to main and tag
git checkout main
git merge release/v1.3.0
git tag -a v1.3.0 -m "Release v1.3.0: AI model optimization"
git push origin main --tags
```

## Commit Convention

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (no logic changes)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Build process or tooling changes

### Scopes (Service Names)
- `infrastructure`
- `data-collector`
- `opportunity-analyzer`
- `market-validator`
- `business-generator`
- `scheduler`
- `strategy-manager`
- `shared-utilities`
- `bmc-pwa`

### Examples
```bash
feat(opportunity-analyzer): add TensorFlow.js ML model
fix(data-collector): resolve Puppeteer timeout issue
docs(infrastructure): update deployment guide
refactor(shared-utilities): optimize database connection pooling
test(market-validator): add integration tests for API
chore(scheduler): update Lambda runtime to Node.js 18
```

## Pull Request Process

### 1. PR Creation
```bash
# Create PR with proper title and description
gh pr create \
  --title "feat(service-name): descriptive title" \
  --body "$(cat <<EOF
## Summary
- Brief description of changes
- Key improvements or fixes

## Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed

## Deployment
- [ ] Infrastructure changes documented
- [ ] Environment variables updated
- [ ] Migration scripts included (if needed)
EOF
)"
```

### 2. PR Requirements
All PRs must pass:
- ✅ **ci/build**: Code compilation and bundling
- ✅ **ci/test**: Unit and integration tests
- ✅ **ci/security-scan**: Security vulnerability scanning
- ✅ **1 reviewer approval**: Code review from team member

### 3. PR Review Checklist
**Reviewers should verify:**
- [ ] Code follows service conventions
- [ ] Tests are comprehensive
- [ ] Security best practices followed
- [ ] Documentation updated
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

## Repository-Specific Guidelines

### Infrastructure Repository
```bash
# Always test infrastructure changes
cd terraform/environments/dev
terraform plan
terraform apply

# Update documentation
git add .
git commit -m "docs(infrastructure): update Aurora Serverless config"
```

### Service Repositories
```bash
# Test locally before pushing
npm test
npm run lint
npm run build

# Follow Lambda deployment patterns
git commit -m "feat(data-collector): optimize memory usage for large datasets"
```

### Shared Utilities
```bash
# Version bump for breaking changes
npm version patch  # or minor/major
git commit -m "feat(shared-utilities): add new database helper functions"
```

## CI/CD Integration

### GitHub Actions Status Checks
Each repository has automated checks:

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  pull_request:
    branches: [main, release/*]
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm audit
```

### Deployment Triggers
- **Push to main**: Deploys to dev environment
- **Tag creation**: Deploys to production
- **Release branch**: Deploys to staging

## Multi-Repository Coordination

### Independent Service Updates
```bash
# Most changes can be deployed independently
cd ai-business-factory-data-collector
# Make changes, create PR, merge to main
# Service deploys automatically
```

### Coordinated Releases
```bash
# For changes affecting multiple services
# 1. Create release branch in each affected repo
# 2. Test integration in staging
# 3. Merge all release branches simultaneously
# 4. Tag all repositories with same version
```

## Emergency Procedures

### Critical Hotfix
```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-security-fix

# 2. Make minimal fix
git commit -m "fix(service): patch security vulnerability"

# 3. Create emergency PR
gh pr create --title "🚨 CRITICAL: Security fix" --body "Immediate deployment required"

# 4. Fast-track review and merge
# 5. Verify production deployment
```

### Rollback Process
```bash
# 1. Lambda rollback (immediate)
aws lambda update-function-code \
  --function-name ai-business-factory-service \
  --zip-file fileb://previous-version.zip

# 2. Infrastructure rollback
cd terraform/environments/prod
terraform apply -target=module.service

# 3. Database rollback (if needed)
# Use Aurora point-in-time recovery
```

## Best Practices

### Do's ✅
- Keep feature branches small and focused
- Write descriptive commit messages
- Test locally before pushing
- Update documentation with code changes
- Use conventional commit format
- Squash commits before merging (if needed)

### Don'ts ❌
- Don't commit directly to main
- Don't force push to shared branches
- Don't merge without PR review
- Don't include secrets in commits
- Don't create long-lived feature branches
- Don't skip CI/CD checks

## Troubleshooting

### Common Issues

**Q: Branch protection preventing merge**
```bash
# Ensure all status checks pass
gh pr checks
gh pr review --approve
```

**Q: Merge conflicts**
```bash
# Rebase feature branch on latest main
git checkout feature/branch-name
git rebase main
git push --force-with-lease
```

**Q: Failed CI/CD pipeline**
```bash
# Check logs and fix issues
gh run list
gh run view <run-id>
```

## Tools and Scripts

### Useful Commands
```bash
# Check branch protection status
gh api repos/WatchHillAI/repo-name/branches/main/protection

# List all PRs
gh pr list

# Create release
gh release create v1.0.0 --notes "Release notes"

# View CI/CD status
gh run list --branch main
```

### Automation Scripts
- **`scripts/setup-branch-protection.sh`**: Configure branch protection
- **`scripts/create-release.sh`**: Coordinated release process
- **`scripts/deploy-hotfix.sh`**: Emergency deployment

## Success Metrics

### Target KPIs
- **Deployment Frequency**: 2-3 deployments/week
- **Lead Time**: <2 days commit to production
- **Change Failure Rate**: <5% deployments need rollback
- **Recovery Time**: <30 minutes for hotfixes

### Monitoring
- GitHub Insights for PR metrics
- AWS CloudWatch for deployment success
- Developer satisfaction surveys

---

## Quick Reference

### Branch Naming
```
feature/descriptive-name
hotfix/issue-description
release/v1.2.3
```

### PR Template
```markdown
## Summary
[Brief description]

## Testing
- [ ] Tests passing
- [ ] Manual testing done

## Deployment
- [ ] Infrastructure documented
- [ ] Environment variables updated
```

### Commit Format
```
type(scope): description

feat(data-collector): add new scraping endpoint
fix(opportunity-analyzer): resolve memory leak
docs(infrastructure): update deployment guide
```

This strategy optimizes for serverless development velocity while maintaining production stability across all 8 AI Business Factory repositories.