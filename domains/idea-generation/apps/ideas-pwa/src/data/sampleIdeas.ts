import { BusinessIdea } from '../types';

// FALLBACK ONLY: Used when AI generation is disabled
// When VITE_USE_AI_GENERATION=true, this data should NEVER be shown
export const sampleIdeas: BusinessIdea[] = [
  {
    id: 'fallback-only-001',
    title: '⚠️ AI Generation Disabled',
    description: 'This is fallback content shown when VITE_USE_AI_GENERATION=false. Enable AI generation to see real business intelligence.',
    icon: '⚠️',
    category: 'ai-automation',
    tier: 'public',
    metrics: {
      marketSize: 'Fallback Mode',
      techLevel: 'Disabled',
      timeToLaunch: 'N/A',
      startupCost: '$0',
      targetMarket: 'Developers',
      growthRate: 'Set VITE_USE_AI_GENERATION=true',
      successProbability: '0%'
    },
    socialProof: {
      trending: false,
      tags: ['⚠️ Fallback Mode', '🔧 Enable AI Generation', '🤖 Real AI Available']
    },
    createdAt: new Date('2025-07-24'),
    updatedAt: new Date('2025-07-24')
  }
];