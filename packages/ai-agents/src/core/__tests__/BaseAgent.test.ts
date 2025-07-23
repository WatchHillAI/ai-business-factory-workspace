import { BaseAgent } from '../BaseAgent';

// Mock implementation for testing
class TestAgent extends BaseAgent {
  protected async executeTask(input: any): Promise<any> {
    return { result: `Processed: ${input.data}` };
  }

  protected validateInput(input: any): boolean {
    return input && typeof input.data === 'string';
  }
}

describe('BaseAgent', () => {
  let testAgent: TestAgent;

  beforeEach(() => {
    testAgent = new TestAgent({
      name: 'TestAgent',
      version: '1.0.0',
      timeout: 5000,
    });
  });

  it('should initialize with correct configuration', () => {
    expect(testAgent.getName()).toBe('TestAgent');
    expect(testAgent.getVersion()).toBe('1.0.0');
  });

  it('should process valid input successfully', async () => {
    const input = { data: 'test input' };
    const result = await testAgent.process(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ result: 'Processed: test input' });
    expect(result.error).toBeUndefined();
  });

  it('should handle invalid input', async () => {
    const input = { invalid: true };
    const result = await testAgent.process(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Invalid input');
  });

  it('should handle processing errors', async () => {
    // Create an agent that throws an error
    class ErrorAgent extends BaseAgent {
      protected async executeTask(): Promise<any> {
        throw new Error('Processing failed');
      }

      protected validateInput(): boolean {
        return true;
      }
    }

    const errorAgent = new ErrorAgent({
      name: 'ErrorAgent',
      version: '1.0.0',
    });

    const result = await errorAgent.process({ data: 'test' });

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Processing failed');
  });

  it('should track processing metrics', async () => {
    const input = { data: 'test input' };
    const result = await testAgent.process(input);

    expect(result.metrics).toBeDefined();
    expect(result.metrics?.startTime).toBeDefined();
    expect(result.metrics?.endTime).toBeDefined();
    expect(result.metrics?.duration).toBeGreaterThan(0);
    expect(result.metrics?.agentName).toBe('TestAgent');
  });

  it('should handle timeout configuration', () => {
    const timeoutAgent = new TestAgent({
      name: 'TimeoutAgent',
      version: '1.0.0',
      timeout: 1000,
    });

    expect(timeoutAgent.getTimeout()).toBe(1000);
  });
});