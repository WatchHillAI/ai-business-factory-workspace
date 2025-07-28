// Minimal Web Scraper Lambda Handler (without Puppeteer)
const https = require('https');
const http = require('http');

// Logger utility
const createLogger = (service) => ({
  info: (msg, meta = {}) => console.log(JSON.stringify({ level: 'info', service, message: msg, ...meta })),
  error: (msg, meta = {}) => console.error(JSON.stringify({ level: 'error', service, message: msg, ...meta })),
  warn: (msg, meta = {}) => console.warn(JSON.stringify({ level: 'warn', service, message: msg, ...meta })),
});

const logger = createLogger('web-scraper-minimal');

// Business keywords for relevance scoring
const BUSINESS_KEYWORDS = [
  'startup', 'business', 'market', 'revenue', 'growth', 'innovation',
  'customer', 'technology', 'competition', 'opportunity', 'investment',
  'funding', 'entrepreneur', 'product', 'service', 'sales', 'marketing',
  'strategy', 'profit', 'scalable', 'disruption', 'venture', 'launch'
];

// Sentiment words for basic sentiment analysis
const POSITIVE_WORDS = ['good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic', 'wonderful', 'perfect', 'best', 'love', 'success', 'opportunity', 'growth', 'profitable'];
const NEGATIVE_WORDS = ['bad', 'terrible', 'awful', 'hate', 'worst', 'problem', 'issue', 'difficulty', 'challenge', 'fail', 'loss', 'expensive', 'complex'];

class SimpleScrapingService {
  async fetchUrl(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AI-Business-Factory-Bot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 30000
      };

      const req = client.get(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.setTimeout(30000);
    });
  }

  extractTextFromHTML(html) {
    // Simple HTML tag removal (basic, not as robust as Cheerio)
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove styles
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')       // Remove navigation
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Remove footer
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // Remove header
      .replace(/<[^>]*>/g, '')                          // Remove all HTML tags
      .replace(/&[^;]+;/g, ' ')                         // Remove HTML entities
      .replace(/\s+/g, ' ')                             // Normalize whitespace
      .trim();
  }

  extractTitle(html) {
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : 'Untitled';
  }

  extractDescription(html) {
    const descMatch = html.match(/<meta[^>]*name=['"](description|og:description)['"][^>]*content=['"]([^'"]*)['"]/i);
    return descMatch ? descMatch[2] : '';
  }

  async scrapeUrl(url, tags = []) {
    const startTime = Date.now();
    logger.info('Starting simple scrape', { url, tags });

    try {
      const response = await this.fetchUrl(url);
      
      if (response.statusCode >= 400) {
        throw new Error(`HTTP ${response.statusCode}`);
      }

      const html = response.body;
      const title = this.extractTitle(html);
      const description = this.extractDescription(html);
      const textContent = this.extractTextFromHTML(html);
      
      // Extract relevant tags based on content
      const extractedTags = this.extractTags(textContent + ' ' + title + ' ' + description);
      
      // Calculate relevance score
      const relevanceScore = this.calculateRelevance(textContent, title, extractedTags);
      
      // Calculate sentiment score
      const sentimentScore = this.calculateSentiment(textContent);

      const processingTime = Date.now() - startTime;

      const marketData = {
        id: `scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url,
        title,
        description,
        content: textContent.substring(0, 5000), // Limit content size
        tags: [...new Set([...tags, ...extractedTags])], // Merge and deduplicate
        source: this.getSourceDomain(url),
        relevanceScore,
        sentimentScore,
        metadata: {
          scrapedAt: new Date().toISOString(),
          processingTime,
          contentLength: textContent.length,
          statusCode: response.statusCode,
          userAgent: 'lambda-simple-scraper',
          method: 'http-only' // Indicate this is the simple version
        }
      };

      logger.info('Simple scrape completed', { 
        url, 
        relevanceScore, 
        sentimentScore, 
        processingTime,
        tagsFound: extractedTags.length 
      });

      return marketData;

    } catch (error) {
      logger.error('Simple scraping failed', { url, error: error.message });
      throw error;
    }
  }

  extractTags(text) {
    const words = text.toLowerCase().split(/\s+/);
    const tags = [];
    
    BUSINESS_KEYWORDS.forEach(keyword => {
      if (words.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    return tags;
  }

  calculateRelevance(content, title, tags) {
    const titleWords = title.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    let relevancePoints = 0;
    let totalChecks = 0;
    
    // Check title for business keywords
    BUSINESS_KEYWORDS.forEach(keyword => {
      totalChecks++;
      if (titleWords.includes(keyword)) {
        relevancePoints += 3; // Title matches are worth more
      } else if (contentWords.includes(keyword)) {
        relevancePoints += 1;
      }
    });
    
    // Bonus for having extracted tags
    relevancePoints += tags.length * 0.5;
    
    // Normalize to 0-1 scale
    const maxPossiblePoints = totalChecks * 3 + 10; // Account for tag bonus
    return Math.min(relevancePoints / maxPossiblePoints, 1);
  }

  calculateSentiment(text) {
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (POSITIVE_WORDS.includes(word)) positiveCount++;
      if (NEGATIVE_WORDS.includes(word)) negativeCount++;
    });
    
    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) return 0;
    
    // Return sentiment score between -1 (negative) and 1 (positive)
    return (positiveCount - negativeCount) / totalSentimentWords;
  }

  getSourceDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  async scrapeBatch(urls, tags = []) {
    logger.info('Starting simple batch scrape', { urlCount: urls.length, tags });
    
    const results = [];
    const errors = [];
    
    // Process URLs sequentially to avoid overwhelming the Lambda
    for (let i = 0; i < urls.length; i++) {
      try {
        const result = await this.scrapeUrl(urls[i], tags);
        results.push(result);
      } catch (error) {
        errors.push({ url: urls[i], error: error.message });
        logger.error('Simple batch scrape item failed', { url: urls[i], error: error.message });
      }
    }
    
    return {
      results,
      errors,
      successCount: results.length,
      errorCount: errors.length,
      totalCount: urls.length
    };
  }
}

const scrapingService = new SimpleScrapingService();

// API Gateway handler
exports.apiHandler = async (event, context) => {
  logger.info('API request received', { 
    path: event.path, 
    method: event.httpMethod 
  });

  try {
    // Health check
    if (event.path === '/health' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'healthy',
          service: 'web-scraper-minimal',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          features: ['http-scraping', 'content-extraction', 'relevance-scoring', 'sentiment-analysis'],
          limitations: ['no-javascript-execution', 'basic-html-parsing'],
          account: context.invokedFunctionArn.split(':')[4]
        }),
      };
    }

    // Single scrape endpoint
    if (event.path === '/scrape' && event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const { url, tags = [] } = body;

      if (!url) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'url is required' }),
        };
      }

      const result = await scrapingService.scrapeUrl(url, tags);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Batch scrape endpoint
    if (event.path === '/scrape/batch' && event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const { urls, tags = [] } = body;

      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'urls array is required' }),
        };
      }

      // Limit batch size for Lambda
      if (urls.length > 10) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Batch size limited to 10 URLs per request' }),
        };
      }

      const results = await scrapingService.scrapeBatch(urls, tags);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: results,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (error) {
    logger.error('API handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};

// Default handler
exports.handler = exports.apiHandler;