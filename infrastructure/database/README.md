# Database Schema Deployment

This directory contains the PostgreSQL JSONB schema for business ideas persistence.

## Files

- `schemas/business_ideas_schema.sql` - Main database schema with JSONB storage
- `deploy-schema.sh` - Deployment script for GitHub Actions
- `seed-sample-data.sql` - Sample data for testing

## Deployment

Schema is automatically deployed via GitHub Actions when changes are pushed to main branch.

**Status**: Ready for deployment (July 28, 2025) - IAM permissions fixed