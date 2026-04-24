const characterGroups = {
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  numbers: "23456789",
  symbols: "!@#$%^&*()_+-={}[]:;,.?"
};

export function generatePassword({
  length,
  includeLowercase,
  includeUppercase,
  includeNumbers,
  includeSymbols
}) {
  const pool = [
    includeLowercase ? characterGroups.lowercase : "",
    includeUppercase ? characterGroups.uppercase : "",
    includeNumbers ? characterGroups.numbers : "",
    includeSymbols ? characterGroups.symbols : ""
  ].join("");

  if (!pool) {
    throw new Error("Select at least one character group.");
  }

  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  return Array.from(randomValues, (value) => pool[value % pool.length]).join("");
}

export function calculatePasswordStrength(password, options) {
  let score = 0;

  if (password.length >= 12) score += 25;
  if (password.length >= 18) score += 15;
  if (options.includeLowercase) score += 15;
  if (options.includeUppercase) score += 15;
  if (options.includeNumbers) score += 15;
  if (options.includeSymbols) score += 15;

  const label = score >= 85 ? "Strong" : score >= 60 ? "Good" : score >= 35 ? "Fair" : "Weak";

  return { score: Math.min(score, 100), label };
}
