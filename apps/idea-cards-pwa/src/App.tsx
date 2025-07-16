import React from 'react';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@ai-business-factory/ui-components';

// Demo component showcasing shared components
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">🚀 AI Business Factory</h1>
              <span className="text-sm text-gray-500">Discover Your Next Opportunity</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Exploring ideas...</span>
              <Button variant="outline" size="sm">Sign In</Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Discover Your Next Business Opportunity
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse curated opportunities, see what's trending, and find ideas that match your skills and interests.
          </p>
        </div>
        
        {/* Demo Cards showcasing shared components */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card variant="public">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-900">🤖 AI Customer Support</CardTitle>
                <Badge variant="trending">🔥 Trending</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Build intelligent chatbots that learn from customer interactions and provide 24/7 automated support
              </CardDescription>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span>💰 $15K</span>
                <span>⏰ 6 months</span>
                <span>📈 23% growth</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="save" className="flex-1 mr-2">
                <i className="fas fa-heart mr-2"></i>Save
              </Button>
              <Button variant="public" className="flex-1">
                <i className="fas fa-eye mr-2"></i>Details
              </Button>
            </CardFooter>
          </Card>

          <Card variant="exclusive">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-purple-900">👑 Healthcare AI</CardTitle>
                <Badge variant="premium">⭐ Premium</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Proprietary opportunity in medical imaging analysis with validated hospital partnerships
              </CardDescription>
              <div className="bg-purple-50 p-3 rounded-lg mb-4">
                <div className="text-sm text-purple-800">7 of 15 exclusive slots remaining</div>
                <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{width: '47%'}}></div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="exclusive" className="w-full">
                <i className="fas fa-unlock mr-2"></i>Claim Access - $49/month
              </Button>
            </CardFooter>
          </Card>

          <Card variant="ai-generated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-yellow-900">✨ Custom for You</CardTitle>
                <Badge variant="ai-generated">🤖 AI Generated</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Based on your coding background: AI-powered code review tools for remote teams
              </CardDescription>
              <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                <div className="text-sm text-yellow-800">94% match for your profile</div>
                <div className="text-xs text-yellow-700 mt-1">Personalized based on your skills</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ai-generated" className="w-full">
                <i className="fas fa-star mr-2"></i>Develop This Idea
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-600 text-center">
            ✅ Shared components working! Next: Core Idea Cards functionality
          </p>
          <p className="text-sm text-gray-500 text-center mt-2">
            Button, Badge, and Card components successfully extracted and imported
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;