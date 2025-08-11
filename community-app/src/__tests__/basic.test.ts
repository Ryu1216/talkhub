// Basic test to verify Jest setup
describe('Basic Test Setup', () => {
  test('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  test('should work with TypeScript', () => {
    interface TestInterface {
      name: string;
      value: number;
    }

    const testObj: TestInterface = {
      name: 'test',
      value: 42,
    };

    expect(testObj.name).toBe('test');
    expect(testObj.value).toBe(42);
  });
});