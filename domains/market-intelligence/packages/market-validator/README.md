# AI Business Factory - Market Validator Service

Market validation and risk assessment Lambda service for the AI Business Factory platform.

## Overview

The Market Validator service performs comprehensive multi-criteria analysis to validate business opportunities through:

- **Market Demand Validation** (40% weight) - Market size, growth rate, saturation analysis
- **Competitive Advantage Validation** (25% weight) - Competitor density, differentiation analysis  
- **Technical Feasibility Validation** (20% weight) - Implementation complexity, resource requirements
- **Financial Viability Validation** (25% weight) - ROI analysis, breakeven projections

## Features

- ✅ Multi-criteria decision analysis framework
- ✅ Weighted scoring algorithms 
- ✅ Financial modeling and projections
- ✅ Risk assessment and categorization
- ✅ Recommendation generation
- ✅ SQS integration for queue-based processing
- ✅ API Gateway endpoints for direct access

## API Endpoints

### Health Check
```
GET /health
```

### Validate Opportunity
```
POST /validate
{
  "opportunityId": "opp_123",
  "validationType": "comprehensive"
}
```

## Deployment

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 18+ installed
- Lambda execution role with required permissions

### Deploy to AWS Lambda

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Package for deployment
npm run package

# Deploy to development environment
npm run deploy:dev

# Deploy to production environment  
npm run deploy:prod
```

### Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host:port/db
AWS_REGION=us-east-1
LOG_LEVEL=info
```

## Validation Algorithm

### Market Demand Score
- Market size assessment (normalized by $10M baseline)
- Growth rate scoring (higher growth = higher score)
- Market saturation analysis (lower saturation = higher score)
- Customer demand evaluation

### Competitive Advantage Score  
- Competitor density analysis (fewer competitors = higher score)
- Available market share assessment
- Differentiation opportunity evaluation
- Barrier to entry assessment

### Technical Feasibility Score
- Implementation complexity evaluation
- Resource availability assessment  
- Time-to-market analysis
- Technical risk identification

### Financial Viability Score
- Initial investment requirements
- ROI projections and analysis
- Breakeven time assessment
- Revenue potential evaluation

## Integration

This service integrates with:
- **Opportunity Analyzer** - Receives opportunities for validation
- **Strategy Manager** - Reports validation results for performance tracking
- **Scheduler** - Processes validation jobs from SQS queues

## Monitoring

The service provides comprehensive logging and metrics:
- CloudWatch logs for all validation activities
- Performance metrics for processing times
- Error tracking and alerting
- Validation success/failure rates

## Testing

```bash
# Run all tests
npm test

# Run validation-specific tests
npm run test:validation

# Run with coverage
npm test -- --coverage
```