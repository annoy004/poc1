export const normalizeKey = (key) => {
  const synonyms = {
    fine: "penalty",
    punishment: "penalty",
    deduction: "penalty",
    "leave policy": "leave_days",
    "casual leaves": "leave_days",
    bonus: "bonus_percentage",
    "bonus percent": "bonus_percentage",
  };
  return synonyms[key.toLowerCase()] || key.toLowerCase();
};
