/**
 * Builds a system-context string to inject into the AI before answering
 * calculator-specific questions. Keeps the AI focused on the user's exact
 * numbers rather than giving generic advice.
 */
export function buildCalcContext(
  page: string,
  inputs: Record<string, unknown>,
  outputs: Record<string, unknown>
): string {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    `The user has just used the ${page} calculator with the following inputs and outputs. ` +
    `Answer their question in this specific context. Do not re-explain what they already see on screen. ` +
    `Go straight to the insight, action, or explanation they need.\n\n` +
    `Inputs:\n${JSON.stringify(inputs, null, 2)}\n\n` +
    `Outputs:\n${JSON.stringify(outputs, null, 2)}\n\n` +
    `Today is ${today}. FY 2025-26 ends March 31, 2026. All INR figures are in rupees unless noted.`
  );
}
