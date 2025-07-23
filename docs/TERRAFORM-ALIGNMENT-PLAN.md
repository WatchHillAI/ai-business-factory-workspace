# Terraform Configuration Alignment Plan

## Current State Analysis (July 23, 2025)

### AWS Production Reality
```bash
# S3 Buckets
ai-business-factory-ideas-live-20250722     # ← Production bucket (manual deployment)
ai-business-factory-pwa-workspace-dev       # ← Dev bucket (Terraform managed)

# CloudFront Distributions  
dc275i5wdcepx.cloudfront.net → ai-business-factory-ideas-live-20250722  # Ideas PWA prod
d1u91xxklexz0v.cloudfront.net → ai-business-factory-pwa-workspace-dev   # BMC PWA dev
```

### Terraform Configuration State
```hcl
# Current Terraform bucket naming pattern:
bucket_name = "${var.project_name}-pwa-workspace-${var.environment}"

# Expected names:
# Dev:  ai-business-factory-pwa-workspace-dev    ✅ MATCHES
# Prod: ai-business-factory-pwa-workspace-prod   ❌ MISMATCH
```

## Issues Identified

### 1. **Bucket Naming Mismatch**
- **Terraform expects**: `ai-business-factory-pwa-workspace-prod`
- **Production uses**: `ai-business-factory-ideas-live-20250722`
- **Impact**: Terraform can't manage production infrastructure

### 2. **Manual vs Infrastructure-as-Code Deployment**
- Production was deployed manually (July 22, 2025)
- Terraform infrastructure exists but not aligned with production
- **Risk**: Configuration drift, disaster recovery issues

### 3. **Missing Production Terraform State**
- No `prod` environment main.tf file 
- Prod tfvars exist but not connected to infrastructure

## Alignment Options

### Option A: Update Production to Match Terraform (RECOMMENDED)
**Approach**: Rename production bucket to match Terraform naming convention

**Pros**:
- ✅ Maintains Infrastructure-as-Code discipline  
- ✅ Enables proper disaster recovery
- ✅ Consistent naming across environments
- ✅ Terraform can manage production going forward

**Steps**:
1. Create new bucket: `ai-business-factory-pwa-workspace-prod`
2. Copy all objects from current production bucket
3. Update CloudFront distributions to point to new bucket
4. Test production deployment 
5. Delete old bucket after verification

**Downtime**: ~2-3 minutes during CloudFront update

### Option B: Update Terraform to Match Production (NOT RECOMMENDED)
**Approach**: Change Terraform to use current production bucket name

**Cons**:
- ❌ Hardcoded bucket names break environment consistency
- ❌ Future deployments will be inconsistent
- ❌ Violates Infrastructure-as-Code principles

## Recommended Action Plan

### Phase 1: Backup and Preparation ⚠️ SAFETY FIRST
```bash
# 1. Document current CloudFront configuration
aws cloudfront get-distribution-config --id EUHOKVJAA3CUM > prod-cf-backup.json

# 2. List all objects in current production bucket  
aws s3 ls s3://ai-business-factory-ideas-live-20250722 --recursive > prod-objects.txt

# 3. Verify Terraform state for dev environment
cd /terraform/environments/dev && terraform plan
```

### Phase 2: Create Aligned Production Infrastructure
```bash
# 1. Create production main.tf (copy from dev)
cp terraform/environments/dev/main.tf terraform/environments/prod/main.tf

# 2. Initialize production Terraform
cd terraform/environments/prod
terraform init

# 3. Create new production bucket through Terraform
terraform plan -target=module.s3_cloudfront_pwa
terraform apply -target=module.s3_cloudfront_pwa
```

### Phase 3: Migration and Cutover
```bash
# 1. Sync objects to new bucket
aws s3 sync s3://ai-business-factory-ideas-live-20250722 s3://ai-business-factory-pwa-workspace-prod

# 2. Update CloudFront origin to new bucket
# 3. Test production endpoints
# 4. Monitor for issues
# 5. Cleanup old bucket after 24h verification period
```

## Risk Mitigation

### Pre-Migration Checklist
- [ ] Full backup of current production bucket
- [ ] CloudFront configuration documented  
- [ ] Rollback plan prepared
- [ ] Test deployment verified in staging
- [ ] Monitoring alerts configured

### Rollback Plan
If issues occur during migration:
1. Revert CloudFront origin to original bucket
2. CloudFront cache invalidation takes ~15 minutes max
3. Original bucket remains untouched during migration

## Timeline Estimate
- **Planning & Backup**: 30 minutes
- **Infrastructure Creation**: 15 minutes  
- **Migration & Testing**: 45 minutes
- **Monitoring Period**: 24 hours
- **Total**: ~2 hours active work + monitoring

## Success Criteria
- [ ] Production accessible via existing URLs
- [ ] Terraform can manage production infrastructure
- [ ] All PWA applications deploy correctly
- [ ] CloudFront caching works properly
- [ ] No downtime during migration

---

**Next Step**: Create production Terraform configuration following Option A approach.