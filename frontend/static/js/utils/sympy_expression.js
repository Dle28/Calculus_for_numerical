import { latexToPython } from './latex_to_python.js';

const GREEK_SYMBOLS = {
    alpha: '\\alpha',
    beta: '\\beta',
    gamma: '\\gamma',
    delta: '\\delta',
    epsilon: '\\epsilon',
    zeta: '\\zeta',
    eta: '\\eta',
    theta: '\\theta',
    iota: '\\iota',
    kappa: '\\kappa',
    lambda: '\\lambda',
    mu: '\\mu',
    nu: '\\nu',
    xi: '\\xi',
    pi: '\\pi',
    rho: '\\rho',
    sigma: '\\sigma',
    tau: '\\tau',
    phi: '\\phi',
    chi: '\\chi',
    psi: '\\psi',
    omega: '\\omega'
};

export function containsLatexSyntax(expression) {
    return /\\[a-zA-Z]+|\{|\}/.test(expression || '');
}

export function normalizeSympyExpression(expression) {
    if (!expression) return '';

    return expression
        .trim()
        .replace(/\^/g, '**')
        .replace(/\bln\s*\(/g, 'log(')
        .replace(/\s+/g, ' ');
}

export function normalizeMixedExpression(expression) {
    if (!expression) return '';

    const convertedExpression = latexToPython(expression);
    const normalizedExpression = normalizeSympyExpression(convertedExpression);

    try {
        return canonicalizeSympyExpression(normalizedExpression);
    } catch (_error) {
        return normalizedExpression;
    }
}

function tokenize(input) {
    const tokens = [];
    let index = 0;

    const isDigit = (char) => /[0-9]/.test(char);
    const isIdentifierStart = (char) => /[A-Za-z_]/.test(char);
    const isIdentifierPart = (char) => /[A-Za-z0-9_]/.test(char);

    while (index < input.length) {
        const current = input[index];

        if (/\s/.test(current)) {
            index += 1;
            continue;
        }

        if (current === '*' && input[index + 1] === '*') {
            tokens.push({ type: 'op', value: '**' });
            index += 2;
            continue;
        }

        if ('+-*/(),'.includes(current)) {
            tokens.push({ type: 'op', value: current });
            index += 1;
            continue;
        }

        if (isDigit(current) || (current === '.' && isDigit(input[index + 1] || ''))) {
            const start = index;
            index += 1;

            while (index < input.length && /[0-9.]/.test(input[index])) {
                index += 1;
            }

            if ((input[index] === 'e' || input[index] === 'E')) {
                index += 1;
                if (input[index] === '+' || input[index] === '-') {
                    index += 1;
                }
                while (index < input.length && /[0-9]/.test(input[index])) {
                    index += 1;
                }
            }

            tokens.push({ type: 'number', value: input.slice(start, index) });
            continue;
        }

        if (isIdentifierStart(current)) {
            const start = index;
            index += 1;
            while (index < input.length && isIdentifierPart(input[index])) {
                index += 1;
            }
            tokens.push({ type: 'ident', value: input.slice(start, index) });
            continue;
        }

        throw new Error(`Unsupported character: ${current}`);
    }

    tokens.push({ type: 'eof', value: '' });
    return tokens;
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }

    peek() {
        return this.tokens[this.position];
    }

    consume(expectedValue = null) {
        const token = this.peek();
        if (!token) {
            throw new Error('Unexpected end of input');
        }

        if (expectedValue !== null && token.value !== expectedValue) {
            throw new Error(`Expected '${expectedValue}' but got '${token.value}'`);
        }

        this.position += 1;
        return token;
    }

    parse() {
        const expression = this.parseAdditive();
        if (this.peek().type !== 'eof') {
            throw new Error(`Unexpected token: ${this.peek().value}`);
        }
        return expression;
    }

    parseAdditive() {
        let node = this.parseMultiplicative();

        while (this.peek().type === 'op' && (this.peek().value === '+' || this.peek().value === '-')) {
            const operator = this.consume().value;
            const right = this.parseMultiplicative();
            node = { type: 'binary', operator, left: node, right };
        }

        return node;
    }

    parseMultiplicative() {
        let node = this.parsePower();

        while (true) {
            const nextToken = this.peek();

            if (nextToken.type === 'op' && (nextToken.value === '*' || nextToken.value === '/')) {
                const operator = this.consume().value;
                const right = this.parsePower();
                node = { type: 'binary', operator, left: node, right };
                continue;
            }

            if (
                nextToken.type === 'number'
                || nextToken.type === 'ident'
                || (nextToken.type === 'op' && nextToken.value === '(')
            ) {
                // Support implicit multiplication: 3x, 2(x+1), x(y+1), 2sqrt(x)
                const right = this.parsePower();
                node = { type: 'binary', operator: '*', left: node, right };
                continue;
            }

            break;
        }

        return node;
    }

    parsePower() {
        let node = this.parseUnary();

        if (this.peek().type === 'op' && this.peek().value === '**') {
            this.consume('**');
            const right = this.parsePower();
            node = { type: 'binary', operator: '**', left: node, right };
        }

        return node;
    }

    parseUnary() {
        if (this.peek().type === 'op' && (this.peek().value === '+' || this.peek().value === '-')) {
            const operator = this.consume().value;
            return {
                type: 'unary',
                operator,
                argument: this.parseUnary()
            };
        }

        return this.parsePrimary();
    }

    parsePrimary() {
        const token = this.peek();

        if (token.type === 'number') {
            this.consume();
            return { type: 'number', value: token.value };
        }

        if (token.type === 'ident') {
            this.consume();
            const name = token.value;

            if (this.peek().type === 'op' && this.peek().value === '(') {
                this.consume('(');
                const args = [];

                if (!(this.peek().type === 'op' && this.peek().value === ')')) {
                    args.push(this.parseAdditive());
                    while (this.peek().type === 'op' && this.peek().value === ',') {
                        this.consume(',');
                        args.push(this.parseAdditive());
                    }
                }

                this.consume(')');
                return { type: 'function', name, args };
            }

            return { type: 'variable', name };
        }

        if (token.type === 'op' && token.value === '(') {
            this.consume('(');
            const expression = this.parseAdditive();
            this.consume(')');
            return { type: 'group', expression };
        }

        throw new Error(`Unexpected token: ${token.value}`);
    }
}

function precedence(node) {
    if (!node) return 0;

    if (node.type === 'binary') {
        if (node.operator === '+' || node.operator === '-') return 1;
        if (node.operator === '*' || node.operator === '/') return 2;
        if (node.operator === '**') return 3;
    }

    if (node.type === 'unary') return 4;
    return 5;
}

function formatIdentifier(name) {
    if (name in GREEK_SYMBOLS) {
        return GREEK_SYMBOLS[name];
    }

    if (name === 'E') {
        return 'e';
    }

    const suffixMatch = /^([A-Za-z]+)(\d+)$/.exec(name);
    if (suffixMatch) {
        return `${suffixMatch[1]}_{${suffixMatch[2]}}`;
    }

    const underscoreMatch = /^([A-Za-z]+)_(.+)$/.exec(name);
    if (underscoreMatch) {
        return `${underscoreMatch[1]}_{${underscoreMatch[2]}}`;
    }

    return name;
}

function wrapIfNeeded(latex, node, minPrecedence) {
    if (precedence(node) < minPrecedence) {
        return `\\left(${latex}\\right)`;
    }
    return latex;
}

function renderFunction(node) {
    const functionName = node.name;
    const lowerName = functionName.toLowerCase();
    const argsLatex = node.args.map((arg) => renderNode(arg));

    if (lowerName === 'sqrt' && node.args.length === 1) {
        return `\\sqrt{${argsLatex[0]}}`;
    }

    if (lowerName === 'root' && node.args.length === 2) {
        return `\\sqrt[${argsLatex[1]}]{${argsLatex[0]}}`;
    }

    if (lowerName === 'log') {
        if (node.args.length === 2) {
            return `\\log_{${argsLatex[1]}}\\left(${argsLatex[0]}\\right)`;
        }
        if (node.args.length === 1) {
            return `\\log\\left(${argsLatex[0]}\\right)`;
        }
    }

    if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan'].includes(lowerName) && node.args.length === 1) {
        return `\\${lowerName}\\left(${argsLatex[0]}\\right)`;
    }

    if (lowerName === 'exp' && node.args.length === 1) {
        return `e^{${argsLatex[0]}}`;
    }

    if ((lowerName === 'abs' || functionName === 'Abs') && node.args.length === 1) {
        return `\\left|${argsLatex[0]}\\right|`;
    }

    return `${formatIdentifier(functionName)}\\left(${argsLatex.join(', ')}\\right)`;
}

function renderPowerBase(node) {
    const baseLatex = renderNode(node);
    if (node.type === 'binary' || node.type === 'unary') {
        return `\\left(${baseLatex}\\right)`;
    }
    return baseLatex;
}

function renderNode(node, minPrecedence = 0) {
    if (!node) return '';

    if (node.type === 'number') {
        return node.value;
    }

    if (node.type === 'variable') {
        return formatIdentifier(node.name);
    }

    if (node.type === 'group') {
        return `\\left(${renderNode(node.expression)}\\right)`;
    }

    if (node.type === 'function') {
        return renderFunction(node);
    }

    if (node.type === 'unary') {
        const argumentLatex = renderNode(node.argument, precedence(node));
        const unaryLatex = node.operator === '-' ? `-${argumentLatex}` : argumentLatex;
        return wrapIfNeeded(unaryLatex, node, minPrecedence);
    }

    if (node.type === 'binary') {
        if (node.operator === '/') {
            const numerator = renderNode(node.left);
            const denominator = renderNode(node.right);
            const fractionLatex = `\\frac{${numerator}}{${denominator}}`;
            return wrapIfNeeded(fractionLatex, node, minPrecedence);
        }

        if (node.operator === '**') {
            const base = renderPowerBase(node.left);
            const exponent = renderNode(node.right);
            const powerLatex = `${base}^{${exponent}}`;
            return wrapIfNeeded(powerLatex, node, minPrecedence);
        }

        const currentPrecedence = precedence(node);
        const leftLatex = renderNode(node.left, currentPrecedence);
        const rightMinPrecedence = node.operator === '-' ? currentPrecedence + 1 : currentPrecedence;
        const rightLatex = renderNode(node.right, rightMinPrecedence);

        if (node.operator === '*') {
            const multiplyLatex = `${leftLatex} \\cdot ${rightLatex}`;
            return wrapIfNeeded(multiplyLatex, node, minPrecedence);
        }

        const addSubLatex = `${leftLatex} ${node.operator} ${rightLatex}`;
        return wrapIfNeeded(addSubLatex, node, minPrecedence);
    }

    return '';
}

function fallbackSympyToLatex(expression) {
    return expression
        .replace(/\*\*/g, '^')
        .replace(/\*/g, ' \\cdot ')
        .replace(/\bpi\b/g, '\\pi')
        .replace(/\s+/g, ' ')
        .trim();
}

function wrapSympyIfNeeded(sympyExpr, node, minPrecedence) {
    if (precedence(node) < minPrecedence) {
        return `(${sympyExpr})`;
    }
    return sympyExpr;
}

function renderSympyNode(node, minPrecedence = 0) {
    if (!node) return '';

    if (node.type === 'number') {
        return node.value;
    }

    if (node.type === 'variable') {
        return node.name;
    }

    if (node.type === 'group') {
        return `(${renderSympyNode(node.expression)})`;
    }

    if (node.type === 'function') {
        const args = node.args.map((arg) => renderSympyNode(arg)).join(', ');
        return `${node.name}(${args})`;
    }

    if (node.type === 'unary') {
        const argExpr = renderSympyNode(node.argument, precedence(node));
        const unaryExpr = node.operator === '-' ? `-${argExpr}` : argExpr;
        return wrapSympyIfNeeded(unaryExpr, node, minPrecedence);
    }

    if (node.type === 'binary') {
        const currentPrecedence = precedence(node);

        if (node.operator === '**') {
            let leftExpr = renderSympyNode(node.left, currentPrecedence);
            if (node.left.type === 'unary' || precedence(node.left) < currentPrecedence) {
                leftExpr = `(${renderSympyNode(node.left)})`;
            }

            let rightExpr = renderSympyNode(node.right, currentPrecedence);
            if (precedence(node.right) < currentPrecedence) {
                rightExpr = `(${renderSympyNode(node.right)})`;
            }

            return wrapSympyIfNeeded(`${leftExpr}**${rightExpr}`, node, minPrecedence);
        }

        const leftExpr = renderSympyNode(node.left, currentPrecedence);
        const rightMinPrecedence = (node.operator === '-' || node.operator === '/')
            ? currentPrecedence + 1
            : currentPrecedence;
        const rightExpr = renderSympyNode(node.right, rightMinPrecedence);

        return wrapSympyIfNeeded(`${leftExpr}${node.operator}${rightExpr}`, node, minPrecedence);
    }

    return '';
}

function canonicalizeSympyExpression(expression) {
    const tokens = tokenize(expression);
    const ast = new Parser(tokens).parse();
    return renderSympyNode(ast);
}

export function sympyToLatex(expression) {
    const normalized = normalizeSympyExpression(expression);
    if (!normalized) return '';

    try {
        const tokens = tokenize(normalized);
        const ast = new Parser(tokens).parse();
        return renderNode(ast);
    } catch (_error) {
        return fallbackSympyToLatex(normalized);
    }
}
