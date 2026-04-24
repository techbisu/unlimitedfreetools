export const unitDefinitions = {
  length: {
    label: "Length",
    units: {
      meter: { label: "Meters", toBase: (value) => value, fromBase: (value) => value },
      kilometer: { label: "Kilometers", toBase: (value) => value * 1000, fromBase: (value) => value / 1000 },
      mile: { label: "Miles", toBase: (value) => value * 1609.344, fromBase: (value) => value / 1609.344 },
      foot: { label: "Feet", toBase: (value) => value * 0.3048, fromBase: (value) => value / 0.3048 }
    }
  },
  weight: {
    label: "Weight",
    units: {
      kilogram: { label: "Kilograms", toBase: (value) => value, fromBase: (value) => value },
      gram: { label: "Grams", toBase: (value) => value / 1000, fromBase: (value) => value * 1000 },
      pound: { label: "Pounds", toBase: (value) => value * 0.45359237, fromBase: (value) => value / 0.45359237 },
      ounce: { label: "Ounces", toBase: (value) => value * 0.0283495231, fromBase: (value) => value / 0.0283495231 }
    }
  },
  temperature: {
    label: "Temperature",
    units: {
      celsius: { label: "Celsius", toBase: (value) => value, fromBase: (value) => value },
      fahrenheit: {
        label: "Fahrenheit",
        toBase: (value) => ((value - 32) * 5) / 9,
        fromBase: (value) => (value * 9) / 5 + 32
      },
      kelvin: {
        label: "Kelvin",
        toBase: (value) => value - 273.15,
        fromBase: (value) => value + 273.15
      }
    }
  }
};

export function convertValue(category, fromUnit, toUnit, rawValue) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return "";
  }

  const definition = unitDefinitions[category];
  const baseValue = definition.units[fromUnit].toBase(value);
  const converted = definition.units[toUnit].fromBase(baseValue);
  return Number.parseFloat(converted.toFixed(6)).toString();
}
