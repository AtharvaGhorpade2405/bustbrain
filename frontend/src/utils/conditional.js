export function shouldShowQuestion(conditionalRules, answers) {
  if (!conditionalRules) return true;
  const { logic = "AND", conditions = [] } = conditionalRules;
  if (!conditions.length) return true;

  const results = conditions.map((cond) => {
    const answer = answers[cond.questionKey];
    if (answer === undefined || answer === null) return false; 
    switch (cond.operator) {
      case "equals":
        return answer === cond.value;
      case "notEquals":
        return answer !== cond.value;
      case "contains":
        if (Array.isArray(answer)) {
          return answer.includes(cond.value);
        }
        return String(answer).includes(String(cond.value));
      default:
        return false;
    }
  });

  if (logic === "OR") {
    return results.some(Boolean);
  }
  return results.every(Boolean);
}
