# PWA Workspace Deployment Guide

This guide covers deploying the shared PWA workspace with dual CloudFront distributions for BMC and Idea Cards applications.

## 🏗️ **Infrastructure Overview**

### **Architecture**
```
Shared S3 Bucket
├── /bmc/          # BMC PWA files
└── /ideas/        # Idea Cards PWA files

CloudFront Distributions
├── BMC Distribution    → /bmc/ path in S3
└── Ideas Distribution  → /ideas/ path in S3
```

### **Domain Strategy Options**

#### **Option A: Subdomain Approach (Recommended)**
- `bmc.ai-business-factory.com` → BMC PWA
- `ideas.ai-business-factory.com` → Idea Cards PWA

**Benefits:**
- Clean separation of applications
- Independent SSL certificates per subdomain
- Easy to remember URLs
- Future flexibility for separate domains

#### **Option B: Path-based Routing**
- `ai-business-factory.com/bmc/` → BMC PWA
- `ai-business-factory.com/ideas/` → Idea Cards PWA

**Benefits:**
- Single domain management
- Shared SSL certificate
- Lower DNS complexity

## 🚀 **Deployment Process**

### **1. Infrastructure Deployment**

```bash
# Navigate to infrastructure
cd ai-business-factory-infrastructure/terraform/environments/dev

# Deploy PWA infrastructure
terraform init
terraform plan
terraform apply
```

**Resources Created:**
- S3 bucket: `ai-business-factory-pwa-workspace-dev`
- 2 CloudFront distributions with Origin Access Control
- Cache policies optimized for SPAs
- Security headers for PWA applications
- CloudFront functions for SPA routing

### **2. Domain Configuration (Optional)**

To enable custom domains, update the Terraform configuration:

```hcl
# In terraform/environments/dev/main.tf
module "pwa_workspace" {
  source = "../../modules/s3-cloudfront-pwa"
  
  # Enable custom domain
  domain_name     = "ai-business-factory.com"
  certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"
  
  # ... rest of configuration
}
```

### **3. DNS Configuration**

For subdomain approach, create CNAME records:

```
bmc.ai-business-factory.com    CNAME  d1a2b3c4d5e6f7.cloudfront.net
ideas.ai-business-factory.com  CNAME  d7f6e5d4c3b2a1.cloudfront.net
```

### **4. PWA Build and Deployment**

The GitHub Actions workflow automatically handles:
1. Building both PWA applications
2. Uploading to correct S3 paths
3. Invalidating CloudFront caches
4. Health checks

## 📊 **Monitoring and Performance**

### **CloudWatch Metrics**
- **Origin Latency**: S3 response times
- **Cache Hit Ratio**: Should be >85% for static assets
- **Error Rates**: Monitor 4xx/5xx responses
- **Data Transfer**: Outbound data costs

### **Performance Optimization**
- **Brotli Compression**: Enabled for all text assets
- **Cache Policies**: 1 year for static assets, no-cache for HTML
- **Security Headers**: CSP, HSTS, X-Frame-Options
- **PWA Features**: Service worker caching, offline support

## 🔧 **Configuration Details**

### **Cache Strategy**
```
Static Assets (JS/CSS/Images):
- TTL: 1 year (31536000 seconds)
- Cache-Control: public,max-age=31536000,immutable

HTML/Manifest/Service Worker:
- TTL: 0 seconds (no-cache)
- Cache-Control: public,max-age=0,must-revalidate
```

### **Security Headers**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
```

### **SPA Routing**
CloudFront functions handle client-side routing:
- Non-file requests → `/index.html`
- Static assets → Direct S3 fetch
- 404/403 errors → Serve `/index.html` with 200 status

## 💰 **Cost Breakdown**

### **Monthly Costs (Dev Environment)**
```
S3 Storage: ~$1-2/month
├── Static files: ~1-5 GB
└── Request costs: Minimal with CloudFront

CloudFront: ~$4-6/month  
├── BMC Distribution: ~$2-3/month
├── Ideas Distribution: ~$2-3/month
└── Data transfer: Based on usage

Total PWA Hosting: ~$5-8/month
```

### **Cost Optimization**
- **Shared S3 Bucket**: Reduces storage costs vs separate buckets
- **Aggressive Caching**: 95%+ cache hit ratio reduces origin requests
- **Brotli Compression**: ~20% bandwidth savings
- **Regional Edge Caches**: Lower latency and costs

## 🔄 **CI/CD Pipeline**

### **Automatic Deployment**
GitHub Actions workflow triggers on:
- Push to `main` branch in infrastructure repo
- Push to `main` branch in workspace repo
- Manual workflow dispatch

### **Deployment Steps**
1. **Infrastructure**: Deploy/update AWS resources
2. **Build**: Compile both PWA applications
3. **Upload**: Sync files to S3 with correct cache headers
4. **Invalidate**: Clear CloudFront caches
5. **Health Check**: Verify applications are accessible

### **Environment Variables**
```
# Required for builds
VITE_ENVIRONMENT=dev|staging|prod
VITE_API_URL=https://api.ai-business-factory.com
VITE_GRAPHQL_URL=https://graphql.ai-business-factory.com

# AWS deployment
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

## 🧪 **Testing and Validation**

### **Health Checks**
Automated tests verify:
- HTTP 200 responses for main pages
- SPA routing works correctly  
- Static assets load properly
- Service workers register successfully

### **Performance Testing**
Monitor key metrics:
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1
- **PWA Score**: >90 (Lighthouse)

### **Manual Testing Checklist**
- [ ] Both PWAs load correctly
- [ ] Client-side routing works
- [ ] Offline functionality
- [ ] PWA installation prompts
- [ ] Cross-app navigation
- [ ] Mobile responsiveness

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"Access Denied" Errors**
- Check S3 bucket policy allows CloudFront access
- Verify Origin Access Control is properly configured
- Ensure files uploaded to correct S3 paths

#### **SPA Routing Not Working**
- Verify CloudFront function is attached to distribution
- Check custom error pages (404→200 redirect)
- Confirm cache behaviors are correctly ordered

#### **Slow Loading**
- Check cache hit ratios in CloudWatch
- Verify compression is enabled
- Monitor origin response times

#### **Build Failures**
- Ensure environment variables are set
- Check Node.js/npm versions match requirements
- Verify workspace dependencies are installed

### **Recovery Procedures**

#### **Rollback Deployment**
```bash
# Revert to previous S3 version
aws s3api list-object-versions --bucket BUCKET_NAME
aws s3api restore-object --bucket BUCKET_NAME --key PATH --version-id VERSION

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

#### **Emergency Maintenance Mode**
Upload maintenance page to S3 and update CloudFront origin to serve static maintenance.html.

## 🚀 **Current Deployment Status**

### **Production URLs (Dev Environment)**
- **BMC PWA**: https://d1u91xxklexz0v.cloudfront.net
- **Ideas PWA**: https://dc275i5wdcepx.cloudfront.net

### **Infrastructure Details**
- **S3 Bucket**: `ai-business-factory-pwa-workspace-dev`
- **CloudFront Distribution IDs**:
  - BMC: `EUO9GQDWDTUHA`
  - Ideas: `EUHOKVJAA3CUM`
- **Region**: us-east-1
- **Deployment Date**: July 16, 2025

### **Verified Features**
- ✅ Dual PWA deployment from shared workspace
- ✅ S3 + CloudFront architecture with Origin Access Control
- ✅ SPA client-side routing via CloudFront functions
- ✅ Security headers and cache optimization
- ✅ Automated build and deployment pipeline
- ✅ PWA service workers and offline capabilities

## 📚 **Additional Resources**

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub Actions AWS Integration](https://github.com/aws-actions)

---

*This deployment strategy provides a robust, scalable, and cost-effective solution for hosting multiple PWA applications with shared infrastructure and optimized performance.*