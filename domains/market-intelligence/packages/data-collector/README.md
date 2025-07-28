# AI Business Factory - Data Collector

Web scraping and data ingestion service for opportunity discovery.

## Overview

Lambda-based service that collects market data from various sources including:
- Reddit (pain points and discussions)
- News websites (trend analysis)
- Social media (sentiment analysis)
- Industry forums (market signals)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Collector                         │
├─────────────────────────────────────────────────────────────┤
│  📥 Event Triggers  │  🕷️ Scrapers  │  🧹 Data Cleaning    │
├─────────────────────────────────────────────────────────────┤
│  🔄 Strategy Engine │  📊 Metrics   │  💾 Data Storage     │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Multi-Strategy Scraping**: A/B testing different discovery approaches
- **Bot Protection Bypass**: Advanced techniques for modern websites  
- **Smart Rate Limiting**: Respects robots.txt and API limits
- **Data Quality Assurance**: Cleaning and validation pipeline
- **Performance Monitoring**: Real-time metrics and health checks

## Deployment

This service is deployed as an AWS Lambda function with:
- **Event Sources**: CloudWatch Events (scheduled), SQS (on-demand)
- **Runtime**: Node.js 18.x
- **Memory**: 1GB (for Puppeteer operations)
- **Timeout**: 5 minutes
- **Concurrency**: 10 (rate limiting)

## Environment Variables

```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STRATEGY_MANAGER_URL=https://...
LOG_LEVEL=info
```

## Local Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Test scraping
npm run test:scraping

# Deploy to AWS
npm run deploy
```

## API

### Manual Scraping
```bash
POST /scrape
{
  "url": "https://example.com",
  "tags": ["market", "opportunity"],
  "strategyId": "pain_point_mining"
}
```

### Health Check
```bash
GET /health
```

## Strategies

- **pain_point_mining**: Discovers real-world problems from service platforms
- **startup_ecosystem**: Tracks innovation trends and VC activity
- **b2b_professional**: Identifies workflow inefficiencies

## Monitoring

- CloudWatch logs for all operations
- Custom metrics for scraping success rates
- Alerts for failures and rate limit violations
- Cost tracking per strategy

## Security

- IAM roles with minimal required permissions
- VPC configuration for database access
- Encrypted environment variables
- Rate limiting and request validation