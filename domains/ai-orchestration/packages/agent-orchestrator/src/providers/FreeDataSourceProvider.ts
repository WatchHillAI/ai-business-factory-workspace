import { DataSourceProvider, DataSourceResponse } from './DataSourceProvider';
import { DataSourceConfig } from '../types/agent';

/**
 * Free Data Source Providers for AI Agent System
 * Uses free APIs and unofficial libraries for development
 */

// =====================================================
// PYTRENDS PROVIDER (Google Trends Alternative)
// =====================================================

export class PyTrendsProvider extends DataSourceProvider {
  constructor(config: Omit<DataSourceConfig, 'type'>) {
    super({
      ...config,
      type: 'api',
      endpoint: config.endpoint || 'http://localhost:5000', // Local pytrends service
      name: 'pytrends'
    });
  }

  async fetchData(query: {
    keywords: string[];
    timeframe?: string;
    geo?: string;
  }): Promise<DataSourceResponse> {
    try {
      // Option 1: If you have a local pytrends service running
      if (this.config.endpoint && this.config.endpoint !== 'http://localhost:5000') {
        return await this.fetchFromLocalService(query);
      }
      
      // Option 2: Use google-trends-api npm package (unofficial but works)
      return await this.fetchFromGoogleTrendsAPI(query);
      
    } catch (error) {
      console.warn('PyTrends API failed, using mock data:', error);
      return this.getMockTrendsData(query);
    }
  }

  private async fetchFromGoogleTrendsAPI(query: any): Promise<DataSourceResponse> {
    try {
      // Using google-trends-api package (no API key needed)
      const googleTrends = require('google-trends-api');
      
      const interestOverTime = await googleTrends.interestOverTime({
        keyword: query.keywords,
        startTime: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        endTime: new Date(),
        granularTimeUnit: 'month',
        geo: query.geo || 'US'
      });

      const relatedQueries = await googleTrends.relatedQueries({
        keyword: query.keywords[0]
      });

      const parsedData = JSON.parse(interestOverTime);
      const relatedData = JSON.parse(relatedQueries);

      return {
        data: {
          interestOverTime: parsedData.default?.timelineData || [],
          averageInterest: this.calculateAverageInterest(parsedData.default?.timelineData || []),
          trendDirection: this.analyzeTrendDirection(parsedData.default?.timelineData || []),
          relatedQueries: relatedData.default?.rankedList?.[0]?.rankedKeyword || [],
          competingTopics: relatedData.default?.rankedList?.[1]?.rankedKeyword || []
        },
        metadata: {
          source: 'google_trends_unofficial',
          timestamp: new Date().toISOString(),
          cached: false,
        }
      };
    } catch (error) {
      throw new Error(`Google Trends unofficial API error: ${error}`);
    }
  }

  private async fetchFromLocalService(query: any): Promise<DataSourceResponse> {
    const response = await this.httpClient.post('/trends', {
      keywords: query.keywords,
      timeframe: query.timeframe || '12-m',
      geo: query.geo || 'US'
    });

    return {
      data: response.data,
      metadata: {
        source: 'pytrends_local',
        timestamp: new Date().toISOString(),
        cached: false
      }
    };
  }

  private calculateAverageInterest(timelineData: any[]): number {
    if (!timelineData.length) return 0;
    const values = timelineData.map(d => d.value?.[0] || 0);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  private analyzeTrendDirection(timelineData: any[]): string {
    if (timelineData.length < 3) return 'stable';
    
    const recent = timelineData.slice(-3).map(d => d.value?.[0] || 0);
    const earlier = timelineData.slice(-6, -3).map(d => d.value?.[0] || 0);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    const change = ((recentAvg - earlierAvg) / Math.max(1, earlierAvg)) * 100;
    
    if (change > 25) return 'rising';
    if (change < -25) return 'declining';
    return 'stable';
  }

  private getMockTrendsData(query: any): DataSourceResponse {
    return {
      data: {
        interestOverTime: this.generateMockTimeline(),
        averageInterest: 45,
        trendDirection: 'rising',
        relatedQueries: [
          { query: 'ai customer support', value: 100 },
          { query: 'chatbot for business', value: 85 },
          { query: 'automated customer service', value: 73 }
        ],
        competingTopics: [
          { query: 'live chat software', value: 90 },
          { query: 'help desk software', value: 78 }
        ]
      },
      metadata: {
        source: 'mock_trends',
        timestamp: new Date().toISOString(),
        cached: false,
      }
    };
  }

  private generateMockTimeline(): any[] {
    const timeline = [];
    const startValue = 20;
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      timeline.push({
        time: date.getTime(),
        formattedTime: date.toISOString().substring(0, 7),
        value: [Math.max(0, startValue + Math.random() * 60 + i * 3)]
      });
    }
    return timeline;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.fetchData({ keywords: ['test'] });
      return true;
    } catch {
      return false;
    }
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime: string } | null> {
    // Google Trends unofficial API has no formal rate limits
    return { remaining: 100, resetTime: new Date(Date.now() + 3600000).toISOString() };
  }
}

// =====================================================
// REDDIT API PROVIDER (Free, No Auth Required)
// =====================================================

export class RedditProvider extends DataSourceProvider {
  constructor(config: Omit<DataSourceConfig, 'type'>) {
    super({
      ...config,
      type: 'api',
      endpoint: config.endpoint || 'https://www.reddit.com',
      name: 'reddit'
    });
  }

  async fetchData(query: {
    keywords: string[];
    subreddits?: string[];
    timeRange?: string;
    limit?: number;
  }): Promise<DataSourceResponse> {
    try {
      const searchQuery = query.keywords.join(' ');
      const limit = query.limit || 25;
      const timeRange = query.timeRange || 'week';
      
      // Search across all of Reddit
      const generalSearch = await this.httpClient.get('/search.json', {
        params: {
          q: searchQuery,
          sort: 'hot',
          t: timeRange,
          limit: limit
        }
      });

      // Search in specific business/startup subreddits
      const targetSubreddits = query.subreddits || [
        'entrepreneur', 'startups', 'smallbusiness', 'business', 
        'saas', 'technology', 'artificial'
      ];

      const subredditSearches = await Promise.allSettled(
        targetSubreddits.map(sub => 
          this.httpClient.get(`/r/${sub}/search.json`, {
            params: {
              q: searchQuery,
              restrict_sr: 'on',
              sort: 'hot',
              limit: 10
            }
          }).catch(() => ({ data: { data: { children: [] as any[] } } }))
        )
      );

      const allPosts = [
        ...(generalSearch.data?.data?.children || []),
        ...subredditSearches
          .filter(result => result.status === 'fulfilled')
          .flatMap(result => (result as any).value?.data?.data?.children || [])
      ];

      const analysis = this.analyzeRedditData(allPosts);

      return {
        data: {
          posts: allPosts.slice(0, 20), // Return top 20 posts
          sentiment: analysis.sentiment,
          engagement: analysis.engagement,
          keyThemes: analysis.themes,
          subredditDistribution: analysis.subreddits,
          marketSignals: analysis.signals
        },
        metadata: {
          source: 'reddit',
          timestamp: new Date().toISOString(),
          cached: false,
        }
      };

    } catch (error) {
      throw new Error(`Reddit API error: ${error}`);
    }
  }

  private analyzeRedditData(posts: any[]): any {
    if (!posts.length) {
      return {
        sentiment: 'neutral',
        engagement: 'low',
        themes: [],
        subreddits: {},
        signals: []
      };
    }

    let totalScore = 0;
    let totalComments = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    const themes = new Set<string>();
    const subreddits: Record<string, number> = {};
    const signals: string[] = [];

    // Sentiment analysis keywords
    const positiveWords = ['great', 'awesome', 'love', 'best', 'amazing', 'perfect', 'excellent', 'innovative', 'useful'];
    const negativeWords = ['bad', 'terrible', 'hate', 'worst', 'awful', 'broken', 'fail', 'useless', 'terrible'];
    const opportunityWords = ['need', 'problem', 'solution', 'opportunity', 'market', 'demand', 'gap'];

    posts.forEach(post => {
      const data = post.data;
      const title = (data.title || '').toLowerCase();
      const body = (data.selftext || '').toLowerCase();
      const text = `${title} ${body}`;
      
      totalScore += data.score || 0;
      totalComments += data.num_comments || 0;
      
      // Sentiment analysis
      const hasPositive = positiveWords.some(word => text.includes(word));
      const hasNegative = negativeWords.some(word => text.includes(word));
      const hasOpportunity = opportunityWords.some(word => text.includes(word));
      
      if (hasPositive || data.score > 20) positiveCount++;
      if (hasNegative || data.score < 0) negativeCount++;
      if (hasOpportunity) signals.push(`Market opportunity discussed in r/${data.subreddit}`);
      
      // Track subreddit distribution
      if (data.subreddit) {
        subreddits[data.subreddit] = (subreddits[data.subreddit] || 0) + 1;
        themes.add(data.subreddit);
      }
      
      // Extract themes from flairs and categories
      if (data.link_flair_text) themes.add(data.link_flair_text.toLowerCase());
    });

    const avgScore = totalScore / posts.length;
    const avgComments = totalComments / posts.length;
    
    // Determine overall sentiment
    let sentiment = 'neutral';
    const sentimentRatio = positiveCount / Math.max(1, positiveCount + negativeCount);
    if (sentimentRatio > 0.6) sentiment = 'positive';
    else if (sentimentRatio < 0.4) sentiment = 'negative';
    
    // Determine engagement level
    let engagement = 'low';
    if (avgScore > 10 && avgComments > 5) engagement = 'medium';
    if (avgScore > 50 && avgComments > 20) engagement = 'high';

    return {
      sentiment,
      engagement,
      themes: Array.from(themes).slice(0, 8),
      subreddits: Object.entries(subreddits)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}),
      signals: signals.slice(0, 5),
      metrics: {
        avgScore: Math.round(avgScore),
        avgComments: Math.round(avgComments),
        totalPosts: posts.length,
        positiveRatio: sentimentRatio
      }
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.httpClient.get('/r/test.json?limit=1');
      return true;
    } catch {
      return false;
    }
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime: string } | null> {
    // Reddit API is generous for read-only access
    return { remaining: 1000, resetTime: new Date(Date.now() + 3600000).toISOString() };
  }
}

// =====================================================
// HACKER NEWS API PROVIDER (Free, No Auth)
// =====================================================

export class HackerNewsProvider extends DataSourceProvider {
  constructor(config: Omit<DataSourceConfig, 'type'>) {
    super({
      ...config,
      type: 'api',
      endpoint: config.endpoint || 'https://hn.algolia.com/api/v1',
      name: 'hackernews'
    });
  }

  async fetchData(query: {
    keywords: string[];
    tags?: string[];
    numericFilters?: string;
    hitsPerPage?: number;
  }): Promise<DataSourceResponse> {
    try {
      const searchQuery = query.keywords.join(' ');
      const tags = (query.tags || ['story']).join(',');
      
      const response = await this.httpClient.get('/search', {
        params: {
          query: searchQuery,
          tags: tags,
          hitsPerPage: query.hitsPerPage || 20,
          numericFilters: query.numericFilters
        }
      });

      const hits = response.data.hits || [];
      const analysis = this.analyzeHackerNewsData(hits);

      return {
        data: {
          stories: hits,
          techInterest: analysis.techScore,
          discussionVolume: analysis.volume,
          sentiment: analysis.sentiment,
          keyTopics: analysis.topics,
          timeDistribution: analysis.timeDistribution,
          authorInsights: analysis.authors
        },
        metadata: {
          source: 'hackernews',
          timestamp: new Date().toISOString(),
          cached: false,
        }
      };

    } catch (error) {
      throw new Error(`Hacker News API error: ${error}`);
    }
  }

  private analyzeHackerNewsData(stories: any[]): any {
    if (!stories.length) {
      return {
        techScore: 0,
        volume: 'none',
        sentiment: 'neutral',
        topics: [],
        timeDistribution: {},
        authors: []
      };
    }

    const totalPoints = stories.reduce((sum, story) => sum + (story.points || 0), 0);
    const totalComments = stories.reduce((sum, story) => sum + (story.num_comments || 0), 0);
    const avgPoints = totalPoints / stories.length;
    
    const topics = new Set<string>();
    const authors: Record<string, number> = {};
    const timeDistribution: Record<string, number> = {};
    let techScore = 0;

    // Tech/business keywords for scoring
    const techKeywords = [
      'ai', 'api', 'saas', 'startup', 'tech', 'software', 'platform', 
      'app', 'service', 'ml', 'algorithm', 'data', 'automation',
      'business', 'market', 'product', 'customer', 'revenue'
    ];

    const positiveKeywords = ['successful', 'growth', 'profitable', 'innovative', 'breakthrough'];
    const negativeKeywords = ['failed', 'struggling', 'problem', 'issues', 'decline'];

    let positiveStories = 0;
    let negativeStories = 0;

    stories.forEach(story => {
      const title = (story.title || '').toLowerCase();
      const url = story.url || '';
      
      // Calculate tech relevance score
      const techMatches = techKeywords.filter(keyword => title.includes(keyword)).length;
      techScore += techMatches;
      
      // Extract topics
      techKeywords.forEach(keyword => {
        if (title.includes(keyword)) topics.add(keyword);
      });
      
      // Sentiment analysis
      const hasPositive = positiveKeywords.some(word => title.includes(word));
      const hasNegative = negativeKeywords.some(word => title.includes(word));
      
      if (hasPositive || (story.points || 0) > 100) positiveStories++;
      if (hasNegative || (story.points || 0) < 5) negativeStories++;
      
      // Track authors (for influence analysis)
      if (story.author) {
        authors[story.author] = (authors[story.author] || 0) + (story.points || 0);
      }
      
      // Time distribution
      if (story.created_at) {
        const date = new Date(story.created_at).toISOString().substring(0, 10);
        timeDistribution[date] = (timeDistribution[date] || 0) + 1;
      }
    });

    // Normalize tech score
    techScore = Math.min(1.0, techScore / (stories.length * 3));
    
    // Determine volume
    let volume = 'low';
    if (stories.length > 10 && avgPoints > 10) volume = 'medium';
    if (stories.length > 20 && avgPoints > 25) volume = 'high';
    
    // Determine sentiment
    let sentiment = 'neutral';
    const sentimentRatio = positiveStories / Math.max(1, positiveStories + negativeStories);
    if (sentimentRatio > 0.6) sentiment = 'positive';
    else if (sentimentRatio < 0.4) sentiment = 'negative';
    
    // Top authors by influence
    const topAuthors = Object.entries(authors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([author, points]) => ({ author, points }));

    return {
      techScore,
      volume,
      sentiment,
      topics: Array.from(topics).slice(0, 8),
      timeDistribution,
      authors: topAuthors,
      metrics: {
        totalStories: stories.length,
        avgPoints: Math.round(avgPoints),
        totalComments,
        positiveRatio: sentimentRatio
      }
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.httpClient.get('/search?query=test&hitsPerPage=1');
      return true;
    } catch {
      return false;
    }
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime: string } | null> {
    // Hacker News API is very generous
    return { remaining: 10000, resetTime: new Date(Date.now() + 3600000).toISOString() };
  }
}

// =====================================================
// GITHUB API PROVIDER (Free with Rate Limits)
// =====================================================

export class GitHubProvider extends DataSourceProvider {
  constructor(config: Omit<DataSourceConfig, 'type'>) {
    super({
      ...config,
      type: 'api',
      endpoint: config.endpoint || 'https://api.github.com',
      name: 'github'
    });
  }

  async fetchData(query: {
    keywords: string[];
    language?: string;
    sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
    order?: 'desc' | 'asc';
  }): Promise<DataSourceResponse> {
    try {
      const searchQuery = query.keywords.join(' ');
      
      // Search repositories
      const repoResponse = await this.httpClient.get('/search/repositories', {
        params: {
          q: `${searchQuery} ${query.language ? `language:${query.language}` : ''}`,
          sort: query.sort || 'stars',
          order: query.order || 'desc',
          per_page: 30
        }
      });

      const repos = repoResponse.data.items || [];
      const analysis = this.analyzeGitHubData(repos);

      return {
        data: {
          repositories: repos.slice(0, 15),
          trendingTech: analysis.technologies,
          marketActivity: analysis.activity,
          competitorAnalysis: analysis.competitors,
          innovationScore: analysis.innovation,
          openSourceTrends: analysis.trends
        },
        metadata: {
          source: 'github',
          timestamp: new Date().toISOString(),
          cached: false,
          rateLimit: this.extractGitHubRateLimit(repoResponse.headers)
        }
      };

    } catch (error) {
      throw new Error(`GitHub API error: ${error}`);
    }
  }

  private analyzeGitHubData(repos: any[]): any {
    if (!repos.length) {
      return {
        technologies: [],
        activity: 'low',
        competitors: [],
        innovation: 0,
        trends: []
      };
    }

    const languages: Record<string, number> = {};
    const topics = new Set<string>();
    let totalStars = 0;
    let totalForks = 0;
    let recentActivity = 0;

    repos.forEach(repo => {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      
      // Track languages
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
      
      // Track topics/tags
      (repo.topics || []).forEach((topic: string) => topics.add(topic));
      
      // Measure recent activity
      const updatedAt = new Date(repo.updated_at);
      const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) recentActivity++;
    });

    const avgStars = totalStars / repos.length;
    const avgForks = totalForks / repos.length;
    
    // Determine activity level
    let activity = 'low';
    const recentActivityRatio = recentActivity / repos.length;
    if (recentActivityRatio > 0.3 && avgStars > 100) activity = 'medium';
    if (recentActivityRatio > 0.5 && avgStars > 1000) activity = 'high';
    
    // Innovation score based on stars, forks, and recent activity
    const innovation = Math.min(1.0, 
      (avgStars / 1000) * 0.4 + 
      (avgForks / 100) * 0.3 + 
      recentActivityRatio * 0.3
    );

    // Top technologies
    const topTechnologies = Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([lang, count]) => ({ language: lang, repositories: count }));

    // Identify potential competitors (high-star repos in same space)
    const competitors = repos
      .filter(repo => (repo.stargazers_count || 0) > 500)
      .slice(0, 5)
      .map(repo => ({
        name: repo.name,
        owner: repo.owner.login,
        stars: repo.stargazers_count,
        description: repo.description
      }));

    return {
      technologies: topTechnologies,
      activity,
      competitors,
      innovation,
      trends: Array.from(topics).slice(0, 8),
      metrics: {
        avgStars: Math.round(avgStars),
        avgForks: Math.round(avgForks),
        recentActivityRatio: Math.round(recentActivityRatio * 100)
      }
    };
  }

  private extractGitHubRateLimit(headers: any): any {
    return {
      remaining: parseInt(headers['x-ratelimit-remaining'] || '60'),
      resetTime: new Date(parseInt(headers['x-ratelimit-reset'] || '0') * 1000).toISOString()
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.httpClient.get('/repos/octocat/Hello-World');
      return true;
    } catch {
      return false;
    }
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime: string } | null> {
    try {
      const response = await this.httpClient.get('/rate_limit');
      const rateLimit = response.data.rate;
      return {
        remaining: rateLimit.remaining,
        resetTime: new Date(rateLimit.reset * 1000).toISOString()
      };
    } catch {
      return null;
    }
  }
}

// =====================================================
// FACTORY FUNCTION FOR FREE DATA SOURCES
// =====================================================

export function createFreeDataSourceProvider(
  type: 'pytrends' | 'reddit' | 'hackernews' | 'github',
  config: Omit<DataSourceConfig, 'type'>
): DataSourceProvider {
  switch (type) {
    case 'pytrends':
      return new PyTrendsProvider(config);
    
    case 'reddit':
      return new RedditProvider(config);
    
    case 'hackernews':
      return new HackerNewsProvider(config);
    
    case 'github':
      return new GitHubProvider(config);
    
    default:
      throw new Error(`Unknown free data source provider type: ${type}`);
  }
}