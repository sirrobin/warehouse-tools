// Inside your extractSKU(title) function:

// 1. Smart Keyboard Detection
// Checks for "No Keyboard", "w/o keyboard", "without keyboard" (including typos)
const noKbRegex = /\b(no|w\/o|without)\s+keyb(?:oa|ao)?rd\b/i;
const hasNoKb = noKbRegex.test(title);

// Checks for "with keyboard" or just "keyboard", but ONLY if hasNoKb is false
const kbRegex = /\b(?:with\s+)?keyb(?:oa|ao)?rd\b/i;
const hasKb = !hasNoKb && kbRegex.test(title);

// 2. Append to Features Array
// (Make sure this happens when you are building the final SKU string in the engine)
let features = [];
// ... (your other feature extractions like LTE, Touch, etc.) ...

if (hasNoKb) {
    features.push("NOKB");
} else if (hasKb) {
    features.push("KB");
}

// Ensure your function returns these boolean states so the UI can check the boxes
return {
    // ... your other returned data ...
    hasKb: hasKb,
    hasNoKb: hasNoKb,
    features: features
};
