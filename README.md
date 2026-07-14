# NHCOJ Quiz & Code Portal

NHCOJ is a lightweight, ultra-fast in-browser quiz and competitive programming judge portal designed for school exams, practice, and code evaluation. The entire compilation and test suite evaluations run locally in the browser securely.

## Key Features

- **In-Browser Local Judge**: Evaluate competitive programming submissions for **C++ 17**, **Python 3**, and **Pascal** on-the-fly.
- **LeetCode-Style Interactive Console**: Compare custom parameters, view standard outputs (stdout), runtime durations, memory metrics, actual output tokens, and expected values.
- **Multiple Choice Exam Platform**: An integrated grid for answering theoretic questions with persistent local state.
- **Responsive Administrator Workspace**: Live interface to load custom exam sets, export JSON question sheets, add testcases, customize constraints, and audit grades.
- **Polished Slate Dark & Light Themes**: Fluid transitions, monospace code gutters, and a pristine layout.

## Technologies Used

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Compiler Mocking/Transpiling Engine**: Custom client-side evaluation engine representing token-by-token comparator (ICPC standard) and memory footprint tracker.

## Getting Started

### Prerequisites

- Node.js (version 18 or above)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/nhcoj-portal.git
   cd nhcoj-portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Folder Structure

- `src/components`: React components including the interactive compiler workspace, dashboard, login form, and admin tools.
- `src/lib/judge.ts`: Core in-browser compiler engine with syntax parsing, standard input mapping, and ICPC standard tokens verification.
- `src/locales`: Localization files for Vietnamese (default) and English.
- `src/types.ts`: TypeScript schemas for problems, testcases, and submissions.
