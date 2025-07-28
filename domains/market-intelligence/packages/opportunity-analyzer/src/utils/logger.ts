// Simplified logger for Lambda deployment
export function createLogger(service: string) {
  return {
    info: (...args: any[]) => console.log(JSON.stringify({ 
      level: 'info', 
      service, 
      message: args.join(' '), 
      timestamp: new Date().toISOString() 
    })),
    error: (...args: any[]) => console.error(JSON.stringify({ 
      level: 'error', 
      service, 
      message: args.join(' '), 
      timestamp: new Date().toISOString() 
    })),
    warn: (...args: any[]) => console.warn(JSON.stringify({ 
      level: 'warn', 
      service, 
      message: args.join(' '), 
      timestamp: new Date().toISOString() 
    }))
  };
}