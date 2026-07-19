import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";

// Table to store coding problems
export const problems = pgTable("problems", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  difficulty: text("difficulty").notNull(), // 'Dễ' | 'Trung bình' | 'Khó'
  descriptionHtml: text("description_html").notNull(),
  inputFormat: text("input_format").notNull(),
  outputFormat: text("output_format").notNull(),
  examples: text("examples").notNull(), // JSON string representing CodingProblem['examples']
  constraints: text("constraints").notNull(), // JSON string representing CodingProblem['constraints']
  entryFunctionName: text("entry_function_name").notNull(),
  inputNames: text("input_names").notNull(), // JSON string representing CodingProblem['inputNames']
  defaultCode: text("default_code").notNull(), // JSON string representing CodingProblem['defaultCode']
  testCases: text("test_cases").notNull(), // JSON string representing CodingProblem['testCases']
});

// Table to store student submissions
export const submissions = pgTable("submissions", {
  username: text("username").primaryKey(), // lowercase normalized username
  codingAnswers: text("coding_answers").notNull(), // JSON string representing UserSubmission['codingAnswers']
  timeLeft: integer("time_left").notNull().default(5400),
  isFinished: boolean("is_finished").notNull().default(false),
  score: text("score").notNull().default("0"), // store score as string (e.g., "7.5") to avoid float precision issues in text field
  updatedAt: text("updated_at").notNull(),
});
