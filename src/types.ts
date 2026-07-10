export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  descriptionHtml: string;
  inputFormat: string;
  outputFormat: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  entryFunctionName: string;
  inputNames: string[];
  defaultCode: {
    [lang: string]: string;
  };
  testCases: {
    input: any[]; // arguments array
    expected: any; // expected value
    rawInput: string; // display string
  }[];
}

export type SupportedLanguage = 'cpp' | 'python' | 'pascal';

export interface UserSubmission {
  codingAnswers: { [problemId: string]: { code: string; language: string; passed: boolean } };
  timeLeft: number; // in seconds
  score?: number;
  isFinished: boolean;
}
