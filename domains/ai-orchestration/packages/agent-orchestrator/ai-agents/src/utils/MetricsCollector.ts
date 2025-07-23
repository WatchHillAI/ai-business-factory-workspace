import { AgentMetrics } from '../types/agent';

export interface ExecutionMetrics extends AgentMetrics {
  timestamp: string;
  requestId?: string;
}

export interface ErrorMetrics {
  timestamp: string;
  agentId: string;
  errorType: string;
  errorMessage: string;
  requestId?: string;
  executionTime?: number;
}

export interface AggregatedMetrics {
  totalExecutions: number;
  totalErrors: number;
  successRate: number;
  averageExecutionTime: number;
  averageTokensUsed: number;
  averageQualityScore: number;
  cacheHitRate: number;
  timeRange: {
    start: string;
    end: string;
  };
}

export class MetricsCollector {
  private agentId: string;
  private executions: ExecutionMetrics[] = [];
  private errors: ErrorMetrics[] = [];
  private maxEntries: number;

  constructor(agentId: string, maxEntries: number = 1000) {
    this.agentId = agentId;
    this.maxEntries = maxEntries;
  }

  /**
   * Record successful agent execution metrics
   */
  recordExecution(metrics: AgentMetrics, requestId?: string): void {
    const executionMetrics: ExecutionMetrics = {
      ...metrics,
      timestamp: new Date().toISOString(),
      requestId,
    };

    this.executions.push(executionMetrics);

    // Maintain max entries limit
    if (this.executions.length > this.maxEntries) {
      this.executions = this.executions.slice(-this.maxEntries);
    }

    // Send to monitoring system (if configured)
    this.sendToMonitoring('execution', executionMetrics);
  }

  /**
   * Record error metrics
   */
  recordError(error: Error, partialMetrics?: Partial<AgentMetrics>, requestId?: string): void {
    const errorMetrics: ErrorMetrics = {
      timestamp: new Date().toISOString(),
      agentId: this.agentId,
      errorType: error.name || 'UnknownError',
      errorMessage: error.message,
      requestId,
      executionTime: partialMetrics?.executionTime,
    };

    this.errors.push(errorMetrics);

    // Maintain max entries limit
    if (this.errors.length > this.maxEntries) {
      this.errors = this.errors.slice(-this.maxEntries);
    }

    // Send to monitoring system (if configured)
    this.sendToMonitoring('error', errorMetrics);
  }

  /**
   * Get aggregated metrics for a time period
   */
  getAggregatedMetrics(timeRangeHours: number = 24): AggregatedMetrics {
    const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();
    
    const recentExecutions = this.executions.filter(e => e.timestamp >= cutoffTime);
    const recentErrors = this.errors.filter(e => e.timestamp >= cutoffTime);

    const totalExecutions = recentExecutions.length;
    const totalErrors = recentErrors.length;
    const successRate = totalExecutions > 0 ? ((totalExecutions - totalErrors) / totalExecutions) * 100 : 0;

    const averageExecutionTime = totalExecutions > 0
      ? recentExecutions.reduce((sum, e) => sum + e.executionTime, 0) / totalExecutions
      : 0;

    const averageTokensUsed = totalExecutions > 0
      ? recentExecutions.reduce((sum, e) => sum + e.tokensUsed, 0) / totalExecutions
      : 0;

    const averageQualityScore = totalExecutions > 0
      ? recentExecutions.reduce((sum, e) => sum + e.qualityScore, 0) / totalExecutions
      : 0;

    const totalCacheRequests = recentExecutions.reduce((sum, e) => sum + e.cacheHits + e.cacheMisses, 0);
    const totalCacheHits = recentExecutions.reduce((sum, e) => sum + e.cacheHits, 0);
    const cacheHitRate = totalCacheRequests > 0 ? (totalCacheHits / totalCacheRequests) * 100 : 0;

    return {
      totalExecutions,
      totalErrors,
      successRate,
      averageExecutionTime,
      averageTokensUsed,
      averageQualityScore,
      cacheHitRate,
      timeRange: {
        start: cutoffTime,
        end: new Date().toISOString(),
      },
    };
  }

  /**
   * Get recent execution metrics
   */
  getRecentExecutions(count: number = 10): ExecutionMetrics[] {
    return this.executions.slice(-count);
  }

  /**
   * Get recent error metrics
   */
  getRecentErrors(count: number = 10): ErrorMetrics[] {
    return this.errors.slice(-count);
  }

  /**
   * Get performance percentiles
   */
  getPerformancePercentiles(timeRangeHours: number = 24): {
    executionTime: { p50: number; p95: number; p99: number };
    tokensUsed: { p50: number; p95: number; p99: number };
    qualityScore: { p50: number; p95: number; p99: number };
  } {
    const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();
    const recentExecutions = this.executions.filter(e => e.timestamp >= cutoffTime);

    if (recentExecutions.length === 0) {
      return {
        executionTime: { p50: 0, p95: 0, p99: 0 },
        tokensUsed: { p50: 0, p95: 0, p99: 0 },
        qualityScore: { p50: 0, p95: 0, p99: 0 },
      };
    }

    const calculatePercentile = (values: number[], percentile: number): number => {
      const sorted = [...values].sort((a, b) => a - b);
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
    };

    const executionTimes = recentExecutions.map(e => e.executionTime);
    const tokenCounts = recentExecutions.map(e => e.tokensUsed);
    const qualityScores = recentExecutions.map(e => e.qualityScore);

    return {
      executionTime: {
        p50: calculatePercentile(executionTimes, 50),
        p95: calculatePercentile(executionTimes, 95),
        p99: calculatePercentile(executionTimes, 99),
      },
      tokensUsed: {
        p50: calculatePercentile(tokenCounts, 50),
        p95: calculatePercentile(tokenCounts, 95),
        p99: calculatePercentile(tokenCounts, 99),
      },
      qualityScore: {
        p50: calculatePercentile(qualityScores, 50),
        p95: calculatePercentile(qualityScores, 95),
        p99: calculatePercentile(qualityScores, 99),
      },
    };
  }

  /**
   * Get error distribution by type
   */
  getErrorDistribution(timeRangeHours: number = 24): Record<string, number> {
    const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();
    const recentErrors = this.errors.filter(e => e.timestamp >= cutoffTime);

    const distribution: Record<string, number> = {};
    recentErrors.forEach(error => {
      distribution[error.errorType] = (distribution[error.errorType] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Clear all stored metrics
   */
  clear(): void {
    this.executions = [];
    this.errors = [];
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): {
    executions: ExecutionMetrics[];
    errors: ErrorMetrics[];
    aggregated: AggregatedMetrics;
  } {
    return {
      executions: [...this.executions],
      errors: [...this.errors],
      aggregated: this.getAggregatedMetrics(),
    };
  }

  /**
   * Send metrics to external monitoring system (placeholder)
   * In production, this would integrate with DataDog, New Relic, etc.
   */
  private sendToMonitoring(type: 'execution' | 'error', data: any): void {
    // Placeholder for external monitoring integration
    // console.log(`[MONITORING] ${type}:`, data);
    
    // Example integration points:
    // - DataDog StatsD
    // - New Relic APM
    // - Prometheus metrics
    // - CloudWatch metrics
    // - Custom analytics endpoints
  }

  /**
   * Get real-time health check based on recent metrics
   */
  getHealthCheck(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: {
      errorRate: number;
      avgResponseTime: number;
      cacheHitRate: number;
      qualityScore: number;
    };
  } {
    const recentMetrics = this.getAggregatedMetrics(1); // Last hour
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check error rate
    const errorRate = 100 - recentMetrics.successRate;
    if (errorRate > 20) {
      status = 'critical';
      issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
    } else if (errorRate > 5) {
      status = 'warning';
      issues.push(`Elevated error rate: ${errorRate.toFixed(1)}%`);
    }

    // Check response time
    if (recentMetrics.averageExecutionTime > 30000) {
      status = 'critical';
      issues.push(`Slow response time: ${(recentMetrics.averageExecutionTime / 1000).toFixed(1)}s`);
    } else if (recentMetrics.averageExecutionTime > 10000) {
      if (status !== 'critical') status = 'warning';
      issues.push(`Elevated response time: ${(recentMetrics.averageExecutionTime / 1000).toFixed(1)}s`);
    }

    // Check quality score
    if (recentMetrics.averageQualityScore < 50) {
      status = 'critical';
      issues.push(`Low quality score: ${recentMetrics.averageQualityScore.toFixed(1)}`);
    } else if (recentMetrics.averageQualityScore < 70) {
      if (status !== 'critical') status = 'warning';
      issues.push(`Below target quality score: ${recentMetrics.averageQualityScore.toFixed(1)}`);
    }

    return {
      status,
      issues,
      metrics: {
        errorRate,
        avgResponseTime: recentMetrics.averageExecutionTime,
        cacheHitRate: recentMetrics.cacheHitRate,
        qualityScore: recentMetrics.averageQualityScore,
      },
    };
  }
}