export const feedbackCategories = ['Improvement', 'Current problem', 'Expected solution', 'Feature request'] as const;
export const feedbackQuestions = ['What could we improve in originBI?', 'What problem does your institution face today?', 'How would you like that problem to be solved?', 'Which features should we add?'] as const;
export function hasFeedbackCategory(items: string[], category: string) {
  return items.some(item => item.startsWith(category + ':'));
}
