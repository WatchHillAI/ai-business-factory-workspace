import { BusinessIdea } from '../types';

export const sampleIdeas: BusinessIdea[] = [
  {
    id: 'ai-customer-support-001',
    title: 'AI Customer Support',
    description: 'Build intelligent chatbots that learn from customer interactions and provide 24/7 automated support with human-level understanding.',
    icon: '🤖',
    category: 'ai-automation',
    tier: 'public',
    metrics: {
      marketSize: '$2.4B',
      techLevel: 'Medium',
      timeToLaunch: '6 months',
      startupCost: '$15K',
      targetMarket: 'SMB',
      growthRate: '23% annually',
      successProbability: '78%'
    },
    socialProof: {
      saveCount: 1247,
      viewCount: 8932,
      trending: true,
      tags: ['Popular this week', 'Frequently saved', 'High ROI potential']
    },
    createdAt: new Date('2025-07-15'),
    updatedAt: new Date('2025-07-20')
  },
  {
    id: 'healthcare-ai-002',
    title: 'Healthcare AI',
    description: 'Proprietary opportunity in medical imaging analysis with validated hospital partnerships and regulatory approval pathway.',
    icon: '👑',
    category: 'healthcare',
    tier: 'exclusive',
    metrics: {
      marketSize: '$12.8B',
      techLevel: 'High',
      timeToLaunch: '18 months',
      startupCost: '$250K',
      targetMarket: 'Enterprise',
      growthRate: '45% annually'
    },
    socialProof: {
      trending: false,
      tags: ['Enterprise partnerships', 'Regulatory compliant', 'First-mover advantage']
    },
    exclusivity: {
      totalSlots: 15,
      claimedSlots: 8,
      price: '$49/month',
      benefits: [
        'Exclusive market research',
        'Hospital partnership introductions',
        'Regulatory guidance',
        'Technical architecture blueprints'
      ]
    },
    createdAt: new Date('2025-07-10'),
    updatedAt: new Date('2025-07-19')
  },
  {
    id: 'code-review-ai-003',
    title: 'AI Code Review Tools',
    description: 'AI-powered code review and quality assurance tools designed specifically for remote development teams.',
    icon: '✨',
    category: 'ai-automation',
    tier: 'ai-generated',
    metrics: {
      marketSize: '$890M',
      techLevel: 'Medium',
      timeToLaunch: '4 months',
      startupCost: '$8K',
      targetMarket: 'Developer teams',
      growthRate: '34% annually',
      successProbability: '94%'
    },
    socialProof: {
      trending: false,
      tags: ['Personalized for you', 'Skills match', 'Low competition']
    },
    personalization: {
      reason: 'Based on your coding background and experience with development tools',
      uniqueness: 'Low competition in developer tooling for remote teams',
      advantages: [
        'Leverages your technical expertise',
        'Growing remote work market',
        'Developer pain point you understand'
      ]
    },
    generatedBy: 'AI Business Factory v2.1',
    generationPrompt: 'Software engineer with 5+ years experience, interested in developer tools',
    validationScore: 94,
    createdAt: new Date('2025-07-18'),
    updatedAt: new Date('2025-07-21')
  },
  {
    id: 'sustainability-saas-004',
    title: 'Carbon Tracking SaaS',
    description: 'Help businesses track and reduce their carbon footprint with automated ESG reporting and actionable insights.',
    icon: '🌱',
    category: 'sustainability',
    tier: 'public',
    metrics: {
      marketSize: '$1.8B',
      techLevel: 'Medium',
      timeToLaunch: '8 months',
      startupCost: '$25K',
      targetMarket: 'Mid-market',
      growthRate: '67% annually'
    },
    socialProof: {
      saveCount: 892,
      viewCount: 4521,
      trending: false,
      tags: ['ESG compliance', 'Growing demand', 'Regulatory tailwinds']
    },
    createdAt: new Date('2025-07-12'),
    updatedAt: new Date('2025-07-20')
  },
  {
    id: 'fintech-payments-005',
    title: 'Embedded Payments Platform',
    description: 'White-label payment processing for vertical SaaS companies looking to monetize transactions.',
    icon: '💳',
    category: 'fintech',
    tier: 'exclusive',
    metrics: {
      marketSize: '$5.2B',
      techLevel: 'High',
      timeToLaunch: '12 months',
      startupCost: '$150K',
      targetMarket: 'SaaS platforms',
      growthRate: '156% annually'
    },
    socialProof: {
      trending: true,
      tags: ['Fintech boom', 'High barriers', 'Recurring revenue']
    },
    exclusivity: {
      totalSlots: 10,
      claimedSlots: 6,
      price: '$99/month',
      benefits: [
        'Regulatory compliance roadmap',
        'Banking partnership introductions',
        'Technical integration guides',
        'Go-to-market playbooks'
      ]
    },
    createdAt: new Date('2025-07-08'),
    updatedAt: new Date('2025-07-21')
  }
];