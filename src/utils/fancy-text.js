const smallCapsMap = {
  a: "ᴀ",
  b: "ʙ",
  c: "ᴄ",
  d: "ᴅ",
  e: "ᴇ",
  f: "ꜰ",
  g: "ɢ",
  h: "ʜ",
  i: "ɪ",
  j: "ᴊ",
  k: "ᴋ",
  l: "ʟ",
  m: "ᴍ",
  n: "ɴ",
  o: "ᴏ",
  p: "ᴘ",
  q: "ǫ",
  r: "ʀ",
  s: "ꜱ",
  t: "ᴛ",
  u: "ᴜ",
  v: "ᴠ",
  w: "ᴡ",
  x: "x",
  y: "ʏ",
  z: "ᴢ"
};

const combiningAbove = ["̍", "̎", "̄", "̅", "̿", "̑", "̆", "̐", "͒", "͗", "͑", "̇", "̈", "̊", "͂", "̓", "̈́", "͊", "͋", "͌", "̃", "̂", "̌", "͐", "̀", "́", "̋", "̏", "̒", "̓", "̔", "̽", "̉", "ͣ", "ͤ", "ͥ", "ͦ", "ͧ", "ͨ", "ͩ", "ͪ", "ͫ", "ͬ", "ͭ", "ͮ", "ͯ", "̾", "͛", "͆", "̚"];
const combiningBelow = ["̖", "̗", "̘", "̙", "̜", "̝", "̞", "̟", "̠", "̤", "̥", "̦", "̩", "̪", "̫", "̬", "̭", "̮", "̯", "̰", "̱", "̲", "̳", "̹", "̺", "̻", "̼", "ͅ", "͇", "͈", "͉", "͍", "͎", "͓", "͔", "͕", "͖", "͙", "͚", "̣"];

const mathBoldStarts = {
  upper: 0x1d400,
  lower: 0x1d41a,
  digit: 0x1d7ce
};

const mathItalicStarts = {
  upper: 0x1d434,
  lower: 0x1d44e
};

const mathBoldItalicStarts = {
  upper: 0x1d468,
  lower: 0x1d482
};

function mapMathAlphabet(value, starts) {
  return Array.from(value).map((character) => {
    const code = character.codePointAt(0);

    if (code >= 65 && code <= 90 && starts.upper) {
      return String.fromCodePoint(starts.upper + (code - 65));
    }

    if (code >= 97 && code <= 122 && starts.lower) {
      return String.fromCodePoint(starts.lower + (code - 97));
    }

    if (code >= 48 && code <= 57 && starts.digit) {
      return String.fromCodePoint(starts.digit + (code - 48));
    }

    return character;
  }).join("");
}

function toSmallCaps(value) {
  return Array.from(value).map((character) => {
    const lower = character.toLowerCase();
    return smallCapsMap[lower] ?? character;
  }).join("");
}

function toFullWidth(value) {
  return Array.from(value).map((character) => {
    if (character === " ") {
      return "　";
    }

    const code = character.codePointAt(0);
    if (code >= 33 && code <= 126) {
      return String.fromCodePoint(code + 0xfee0);
    }

    return character;
  }).join("");
}

function toZalgo(value) {
  return Array.from(value).map((character, index) => {
    if (/\s/.test(character)) {
      return character;
    }

    const aboveCount = 2 + (index % 3);
    const belowCount = 1 + ((index + 1) % 2);
    let next = character;

    for (let count = 0; count < aboveCount; count += 1) {
      next += combiningAbove[(index * 7 + count * 5) % combiningAbove.length];
    }

    for (let count = 0; count < belowCount; count += 1) {
      next += combiningBelow[(index * 11 + count * 3) % combiningBelow.length];
    }

    return next;
  }).join("");
}

export function generateFancyVariants(input) {
  const value = input || "Viral text maker";

  return [
    {
      id: "bold",
      label: "Bold Unicode",
      text: mapMathAlphabet(value, mathBoldStarts)
    },
    {
      id: "italic",
      label: "Italic Unicode",
      text: mapMathAlphabet(value, mathItalicStarts)
    },
    {
      id: "bold-italic",
      label: "Bold Italic",
      text: mapMathAlphabet(value, mathBoldItalicStarts)
    },
    {
      id: "small-caps",
      label: "Small Caps",
      text: toSmallCaps(value)
    },
    {
      id: "wide",
      label: "Wide Text",
      text: toFullWidth(value)
    },
    {
      id: "zalgo",
      label: "Zalgo",
      text: toZalgo(value)
    }
  ];
}
