# S3 + CloudFront module for PWA deployment
# Supports multiple PWA applications from shared workspace

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Variables
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "domain_name" {
  description = "Primary domain for the PWAs"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional)"
  type        = string
  default     = null
}

variable "pwa_applications" {
  description = "Map of PWA applications to deploy"
  type = map(object({
    subdomain     = string # e.g., "bmc" for bmc.domain.com
    source_path   = string # e.g., "apps/bmc-pwa/dist" 
    spa_mode      = bool   # Enable SPA routing
    cache_policy  = string # "default" or "spa"
  }))
  default = {
    bmc = {
      subdomain   = "bmc"
      source_path = "apps/bmc-pwa/dist"
      spa_mode    = true
      cache_policy = "spa"
    }
    ideas = {
      subdomain   = "ideas"
      source_path = "apps/idea-cards-pwa/dist"
      spa_mode    = true
      cache_policy = "spa"
    }
  }
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# Local values
locals {
  bucket_name = "${var.project_name}-pwa-workspace-${var.environment}"
  
  # Common security headers for PWAs
  security_headers = {
    "Strict-Transport-Security" = "max-age=31536000; includeSubDomains"
    "X-Content-Type-Options"    = "nosniff"
    "X-Frame-Options"          = "DENY"
    "X-XSS-Protection"         = "1; mode=block"
    "Referrer-Policy"          = "strict-origin-when-cross-origin"
    "Content-Security-Policy"  = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; manifest-src 'self';"
  }
}

# S3 Bucket for PWA workspace
resource "aws_s3_bucket" "pwa_workspace" {
  bucket = local.bucket_name
  
  tags = merge(var.tags, {
    Name    = "PWA Workspace Bucket"
    Type    = "static-hosting"
    Purpose = "shared-workspace"
  })
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "pwa_workspace" {
  bucket = aws_s3_bucket.pwa_workspace.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "pwa_workspace" {
  bucket = aws_s3_bucket.pwa_workspace.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "pwa_workspace" {
  bucket = aws_s3_bucket.pwa_workspace.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "pwa_workspace" {
  name                              = "${local.bucket_name}-oac"
  description                       = "OAC for PWA workspace S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Cache Policies
resource "aws_cloudfront_cache_policy" "spa_cache_policy" {
  name        = "${var.project_name}-spa-cache-${var.environment}"
  comment     = "Cache policy optimized for SPA applications"
  default_ttl = 86400   # 1 day
  max_ttl     = 31536000 # 1 year
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    query_strings_config {
      query_string_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    cookies_config {
      cookie_behavior = "none"
    }
  }
}

# CloudFront Response Headers Policy  
resource "aws_cloudfront_response_headers_policy" "pwa_security_headers" {
  name    = "${var.project_name}-pwa-security-${var.environment}"
  comment = "Security headers for PWA applications"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }

}

# CloudFront distributions for each PWA
resource "aws_cloudfront_distribution" "pwa_apps" {
  for_each = var.pwa_applications

  comment         = "CloudFront distribution for ${each.key} PWA"
  enabled         = true
  is_ipv6_enabled = true
  default_root_object = "index.html"
  
  # Domain configuration
  aliases = var.domain_name != null ? ["${each.value.subdomain}.${var.domain_name}"] : []

  # S3 origin
  origin {
    domain_name              = aws_s3_bucket.pwa_workspace.bucket_regional_domain_name
    origin_id                = "${each.key}-s3-origin"
    origin_path              = "/${each.key}"
    origin_access_control_id = aws_cloudfront_origin_access_control.pwa_workspace.id
  }

  # Default cache behavior
  default_cache_behavior {
    target_origin_id       = "${each.key}-s3-origin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    
    cache_policy_id            = aws_cloudfront_cache_policy.spa_cache_policy.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.pwa_security_headers.id

    # Enable real-time logs for monitoring
    realtime_log_config_arn = null
  }

  # SPA routing - catch-all for client-side routing
  ordered_cache_behavior {
    path_pattern           = "*"
    target_origin_id       = "${each.key}-s3-origin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    
    cache_policy_id            = aws_cloudfront_cache_policy.spa_cache_policy.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.pwa_security_headers.id

    # Custom function for SPA routing
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_routing[each.key].arn
    }
  }

  # SSL Certificate
  viewer_certificate {
    cloudfront_default_certificate = var.certificate_arn == null
    acm_certificate_arn           = var.certificate_arn
    ssl_support_method            = var.certificate_arn != null ? "sni-only" : null
    minimum_protocol_version      = var.certificate_arn != null ? "TLSv1.2_2021" : null
  }

  # Geographic restrictions (optional)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Error pages for SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = merge(var.tags, {
    Name        = "${each.key}-pwa-distribution"
    Application = each.key
    Type        = "cloudfront"
  })
}

# CloudFront Functions for SPA routing
resource "aws_cloudfront_function" "spa_routing" {
  for_each = var.pwa_applications

  name    = "${var.project_name}-${each.key}-spa-routing-${var.environment}"
  runtime = "cloudfront-js-1.0"
  comment = "SPA routing function for ${each.key} PWA"
  publish = true
  code    = <<-EOT
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Check if the URI ends with a file extension
    if (uri.includes('.')) {
        return request;
    }
    
    // For SPA routing, serve index.html for all non-file requests
    request.uri = '/index.html';
    return request;
}
EOT
}

# S3 Bucket Policy for CloudFront access
data "aws_iam_policy_document" "pwa_workspace_policy" {
  statement {
    sid       = "AllowCloudFrontServicePrincipal"
    effect    = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.pwa_workspace.arn}/*"]
    
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [for dist in aws_cloudfront_distribution.pwa_apps : dist.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "pwa_workspace" {
  bucket = aws_s3_bucket.pwa_workspace.id
  policy = data.aws_iam_policy_document.pwa_workspace_policy.json
}

# Outputs
output "s3_bucket" {
  description = "S3 bucket details"
  value = {
    name                = aws_s3_bucket.pwa_workspace.id
    arn                 = aws_s3_bucket.pwa_workspace.arn
    domain_name         = aws_s3_bucket.pwa_workspace.bucket_domain_name
    regional_domain_name = aws_s3_bucket.pwa_workspace.bucket_regional_domain_name
  }
}

output "cloudfront_distributions" {
  description = "CloudFront distribution details for each PWA"
  value = {
    for k, v in aws_cloudfront_distribution.pwa_apps : k => {
      id                   = v.id
      arn                  = v.arn
      domain_name          = v.domain_name
      status               = v.status
      hosted_zone_id       = v.hosted_zone_id
      distribution_config  = {
        aliases            = v.aliases
        default_root_object = v.default_root_object
      }
    }
  }
}

output "cache_policies" {
  description = "CloudFront cache policies"
  value = {
    spa_cache_policy_id = aws_cloudfront_cache_policy.spa_cache_policy.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.pwa_security_headers.id
  }
}

output "deployment_info" {
  description = "Deployment information for CI/CD"
  value = {
    bucket_name = aws_s3_bucket.pwa_workspace.id
    distribution_ids = {
      for k, v in aws_cloudfront_distribution.pwa_apps : k => v.id
    }
    upload_paths = {
      for k, v in var.pwa_applications : k => k
    }
  }
}