exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'AI Agent Orchestrator is deployed!',
            version: '2.0.0',
            capabilities: [
                'Market Research Agent',
                'Financial Modeling Agent',
                'Founder Fit Agent', 
                'Risk Assessment Agent'
            ],
            status: 'ready',
            path: event.path,
            method: event.httpMethod
        })
    };
    
    return response;
};