
import { CodingProblem } from '../types';

export interface TestResult {
  passed: boolean;
  message: string;
  output?: any;
}

export const runJavaScript = (
  code: string,
  problem: CodingProblem,
  language: 'vi' | 'en' = 'vi'
): TestResult[] => {
  const results: TestResult[] = [];
  
  try {
    for (let idx = 0; idx < problem.testCases.length; idx++) {
      const tc = problem.testCases[idx];
      const entryFnName = problem.entryFunctionName;
      
      // We use Function constructor to execute user code in a semi-sandboxed environment
      // Note: This is client-side only. For production-grade judge, this should be server-side.
      const wrapperFn = new Function(
        ...problem.inputNames,
        `${code}\nreturn ${entryFnName}(${problem.inputNames.join(', ')});`
      );
      
      const output = wrapperFn(...tc.input);
      const isMatch = JSON.stringify(output) === JSON.stringify(tc.expected);
      
      results.push({
        passed: isMatch,
        output,
        message: `Testcase ${idx + 1}: ${tc.rawInput}\n👉 Output: ${JSON.stringify(output)} | ${language === 'vi' ? 'Kỳ vọng' : 'Expected'}: ${JSON.stringify(tc.expected)} ── ${isMatch ? '✅ ' + (language === 'vi' ? 'ĐẠT' : 'PASSED') : '❌ ' + (language === 'vi' ? 'SAI' : 'FAILED')}`
      });
    }
  } catch (e: any) {
    throw e;
  }
  
  return results;
};
