// TOKEN + DISPLAY MANAGEMENT

let tokens = [];
let displayStr = "";
let evalStr = "";
let history = [];

const displayEl = document.getElementById("display");
const historyEl = document.getElementById("history");

function rebuildExpression() {
    displayStr = tokens.map(t => t.disp).join("");
    evalStr = tokens.map(t => t.eval).join("");
    displayEl.textContent = displayStr || "0";
}

function pressToken(displayToken, evalToken) {
    tokens.push({ disp: displayToken, eval: evalToken });
    rebuildExpression();
}

function clearAll() {
    tokens = [];
    rebuildExpression();
}

function backspace() {
    tokens.pop();
    rebuildExpression();
}

// SPECIAL FUNCTIONS BUTTON HANDLER

function pressFunction(name) {
    switch (name) {
        case "sin":
            tokens.push({ disp: "sin(", eval: "window.sin(" });
            break;
        case "cos":
            tokens.push({ disp: "cos(", eval: "window.cos(" });
            break;
        case "tan":
            tokens.push({ disp: "tan(", eval: "window.tan(" });
            break;
        case "log":
            tokens.push({ disp: "log(", eval: "window.log10(" });
            break;
        case "ln":
            tokens.push({ disp: "ln(", eval: "window.ln(" });
            break;
        case "sqrt":
            tokens.push({ disp: "√(", eval: "Math.sqrt(" });
            break;
        case "square":
            tokens.push({ disp: "²", eval: "**2" });
            break;
        case "cube":
            tokens.push({ disp: "³", eval: "**3" });
            break;
        case "inv":
            tokens.push({ disp: "1/(", eval: "1/(" });
            break;
        case "pi":
            tokens.push({ disp: "π", eval: "Math.PI" });
            break;
        case "e":
            tokens.push({ disp: "e", eval: "Math.E" });
            break;
        case "percent":
            tokens.push({ disp: "%", eval: "/100" });
            break;
        default:
            return;
    }
    rebuildExpression();
}

// DEGREE-BASED CUSTOM MATH FUNCTIONS

function toRad(x) {
    return x * Math.PI / 180;
}

function sin(x) {
    return Math.sin(toRad(x));
}

function cos(x) {
    return Math.cos(toRad(x));
}

function tan(x) {
    // detect tan(90 + 180k) undefined
    if ((x % 180) === 90 || (x % 180) === -90) {
        return Infinity;
    }
    return Math.tan(toRad(x));
}

function log10(x) {
    return Math.log10 ? Math.log10(x) : Math.log(x) / Math.LN10;
}

function ln(x) {
    return Math.log(x);
}

// Make functions global for eval()
window.sin = sin;
window.cos = cos;
window.tan = tan;
window.log10 = log10;
window.ln = ln;

// SAFETY GUARD FOR eval()
// Only allow digits, operators, parentheses, dot, and our known function names.
function isSafeExpression(str) {
    const allowed = /^[0-9+\-*/().\s%*a-zA-Z_.]*$/;
    if (!allowed.test(str)) return false;

    // whitelist of identifiers that are allowed to appear
    const allowedIdentifiers = [
        "window", "sin", "cos", "tan", "log10", "ln",
        "Math", "sqrt", "PI", "E"
    ];

    const identifiers = str.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    return identifiers.every(id => allowedIdentifiers.includes(id));
}

// EVALUATION

function calculate() {
    if (!evalStr) return;

    if (!isSafeExpression(evalStr)) {
        displayEl.textContent = "Invalid";
        tokens = [];
        evalStr = "";
        displayStr = "";
        return;
    }

    try {
        let result = eval(evalStr);

        // Handle tan(90) → Infinity → Undefined
        if (!isFinite(result)) {
            displayEl.textContent = "Undefined";
            tokens = [];
            displayStr = "";
            evalStr = "";
            return;
        }

        // Fix float garbage like 6e-17 → 0
        if (Math.abs(result) < 1e-12) {
            result = 0;
        }

        // Fix long decimals
        if (typeof result === "number") {
            result = parseFloat(result.toPrecision(12));
        }

        // add to history before resetting
        addToHistory(displayStr, result);

        // return result as next input
        tokens = [{ disp: String(result), eval: String(result) }];
        rebuildExpression();

    } catch (err) {
        displayEl.textContent = "Error";
        tokens = [];
        displayStr = "";
        evalStr = "";
    }
}

// HISTORY

function addToHistory(expression, result) {
    history.unshift({ expression, result });
    if (history.length > 5) history.pop();
    renderHistory();
}

function renderHistory() {
    if (!historyEl) return;
    historyEl.innerHTML = history
        .map(h => `<div class="history-item"><span class="hist-expr">${h.expression}</span><span class="hist-result">= ${h.result}</span></div>`)
        .join("");
}

function clearHistory() {
    history = [];
    renderHistory();
}

// KEYBOARD SUPPORT

const keyMap = {
    "0": () => pressToken("0", "0"),
    "1": () => pressToken("1", "1"),
    "2": () => pressToken("2", "2"),
    "3": () => pressToken("3", "3"),
    "4": () => pressToken("4", "4"),
    "5": () => pressToken("5", "5"),
    "6": () => pressToken("6", "6"),
    "7": () => pressToken("7", "7"),
    "8": () => pressToken("8", "8"),
    "9": () => pressToken("9", "9"),
    ".": () => pressToken(".", "."),
    "+": () => pressToken(" + ", "+"),
    "-": () => pressToken(" − ", "-"),
    "*": () => pressToken(" × ", "*"),
    "/": () => pressToken(" ÷ ", "/"),
    "(": () => pressToken("(", "("),
    ")": () => pressToken(")", ")"),
    "Enter": () => calculate(),
    "=": () => calculate(),
    "Backspace": () => backspace(),
    "Escape": () => clearAll(),
};

document.addEventListener("keydown", (e) => {
    const action = keyMap[e.key];
    if (action) {
        e.preventDefault();
        action();
    }
});

// INITIALIZE DISPLAY
rebuildExpression();
