// Lambda entry points
export { apiHandler, sqsHandler, scheduledHandler } from './handlers/analyzer';

// For local development
if (require.main === module) {
  const express = require('express');
  const { apiHandler } = require('./handlers/analyzer');
  
  const app = express();
  app.use(express.json());
  
  // Convert Express request to Lambda event format
  app.all('*', async (req: any, res: any) => {
    const event = {
      httpMethod: req.method,
      path: req.path,
      headers: req.headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : null,
      queryStringParameters: req.query,
    };
    
    try {
      const result = await apiHandler(event as any);
      res.status(result.statusCode);
      
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.set(key, value as string);
        });
      }
      
      res.send(result.body);
    } catch (error) {
      console.error('Local dev error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  const port = process.env.PORT || 3002;
  app.listen(port, () => {
    console.log(`🧠 Opportunity Analyzer running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔬 Analysis endpoint: POST http://localhost:${port}/analyze`);
    console.log(`📊 Batch analysis: POST http://localhost:${port}/analyze/batch`);
  });
}