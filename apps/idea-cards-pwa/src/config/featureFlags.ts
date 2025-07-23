/**
 * Feature Flags for Environment-based Control
 * ADR-008 Implementation
 * 
 * Controls the behavior of the Ideas PWA across different environments:
 * - Development: Demo data, no API calls (cost control)
 * - Staging: Selective feature testing
 * - Production: Full live microservices integration
 */

export const FEATURE_FLAGS = {
  // Enable live data from AWS microservices instead of demo data
  LIVE_MICROSERVICES: process.env.REACT_APP_ENABLE_LIVE_DATA === 'true',
  
  // Enable AI agent system for comprehensive analysis
  AI_AGENT_SYSTEM: process.env.REACT_APP_ENABLE_AI_AGENTS === 'true',
  
  // Enable periodic health checks of microservices
  SYSTEM_HEALTH_CHECKS: process.env.REACT_APP_HEALTH_CHECKS === 'true',
  
  // Enable detailed analysis views with business plans
  COMPREHENSIVE_ANALYSIS: process.env.REACT_APP_DETAILED_ANALYSIS === 'true',
  
  // Debug mode for verbose logging
  DEBUG_MODE: process.env.REACT_APP_DEBUG === 'true'
} as const;

// Environment detection helper
export const ENVIRONMENT = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isStaging: process.env.REACT_APP_ENV === 'staging',
  isProduction: process.env.NODE_ENV === 'production' && process.env.REACT_APP_ENV !== 'staging'
} as const;

// Feature availability helper functions
export const isLiveDataEnabled = (): boolean => {
  return FEATURE_FLAGS.LIVE_MICROSERVICES;
};

export const shouldUseHealthChecks = (): boolean => {
  return FEATURE_FLAGS.SYSTEM_HEALTH_CHECKS && FEATURE_FLAGS.LIVE_MICROSERVICES;
};

export const canAccessDetailedAnalysis = (): boolean => {
  return FEATURE_FLAGS.COMPREHENSIVE_ANALYSIS && FEATURE_FLAGS.LIVE_MICROSERVICES;
};

// Cost control helper - prevent expensive operations in dev
export const isExpensiveOperationAllowed = (): boolean => {
  return !ENVIRONMENT.isDevelopment || FEATURE_FLAGS.LIVE_MICROSERVICES;
};

// Logging helper
export const logFeatureStatus = (): void => {
  if (FEATURE_FLAGS.DEBUG_MODE) {
    console.log('🚀 Feature Flags Status:', {
      environment: ENVIRONMENT.isDevelopment ? 'development' : ENVIRONMENT.isStaging ? 'staging' : 'production',
      flags: FEATURE_FLAGS,
      liveDataEnabled: isLiveDataEnabled(),
      healthChecksEnabled: shouldUseHealthChecks()
    });
  }
};