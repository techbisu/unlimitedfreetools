export function formatJSON(input) {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, 2);
}

export function minifyJSON(input) {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}

export function validateJSON(input) {
  try {
    JSON.parse(input);
    return { valid: true, message: "Valid JSON" };
  } catch (error) {
    return { valid: false, message: error.message };
  }
}
