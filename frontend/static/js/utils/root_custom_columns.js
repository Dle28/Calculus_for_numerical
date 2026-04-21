const ROOT_CUSTOM_COLUMN_HELPERS = {
    abs: Math.abs,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt ? Math.cbrt : (x) => Math.pow(x, 1 / 3),
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    exp: Math.exp,
    pow: Math.pow,
    min: Math.min,
    max: Math.max,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    sign: Math.sign ? Math.sign : (x) => (x > 0 ? 1 : (x < 0 ? -1 : 0)),
    ln: Math.log,
    log: (x, base) => {
        if (base === undefined) return Math.log(x);
        return Math.log(x) / Math.log(base);
    },
    log10: Math.log10 ? Math.log10.bind(Math) : (x) => Math.log(x) / Math.LN10,
    pi: Math.PI,
    e: Math.E
};

const ROOT_METHOD_VARIABLES = {
    bisection: ['n', 'a', 'b', 'c', 'fc', 'error', 'relative_error', 'V'],
    secant: ['n', 'xn', 'fxn', 'error'],
    newton: ['k', 'xn', 'fxn', 'dfxn', 'error'],
    simple_iteration: ['k', 'xn', 'phixn', 'abs_diff', 'error']
};

const ROOT_HELPER_NAMES = Object.keys(ROOT_CUSTOM_COLUMN_HELPERS);
const ROOT_ALLOWED_EXPRESSION = /^[0-9A-Za-z_+\-*/%^().,\s]+$/;

function normalizeRootCustomExpression(expression) {
    return expression.replace(/\^/g, '**').trim();
}

function extractIdentifiers(expression) {
    return [...new Set(expression.match(/[A-Za-z_]\w*/g) || [])];
}

function buildEvaluator(expression) {
    const compiled = new Function(
        'row',
        'helpers',
        `"use strict";
        const { n, k, a, b, c, xn, fc, fxn, dfxn, phixn, abs_diff, error, relative_error, V } = row;
        const x = c !== undefined ? c : (xn !== undefined ? xn : phixn);
        const iter = n !== undefined ? n : k;
        const { abs, sqrt, cbrt, sin, cos, tan, asin, acos, atan, exp, pow, min, max, floor, ceil, round, sign, ln, log, log10, pi, e } = helpers;
        return (${expression});
        `
    );

    return (row) => compiled(row, ROOT_CUSTOM_COLUMN_HELPERS);
}

export function getRootCustomColumnHelpText(method) {
    const variables = ROOT_METHOD_VARIABLES[method] || [];
    return `Moi dong theo dang Ten cot = bieu thuc. Bien co san: ${variables.join(', ') || 'khong co'}. Alias them: x, iter. Ham duoc ho tro: abs, sqrt, cbrt, sin, cos, tan, exp, ln, log, log10, pow, min, max, floor, ceil, round, sign, pi, e.`;
}

export function parseRootCustomColumns(rawText, method) {
    const text = (rawText || '').trim();
    if (!text) return [];

    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const allowedIdentifiers = new Set([
        ...(ROOT_METHOD_VARIABLES[method] || []),
        ...ROOT_HELPER_NAMES,
        'x',
        'iter'
    ]);
    const seenLabels = new Set();

    return lines.map((line, index) => {
        const separatorIndex = line.indexOf('=');
        if (separatorIndex <= 0 || separatorIndex === line.length - 1) {
            throw new Error(`Dong ${index + 1} phai co dang "Ten cot = bieu thuc".`);
        }

        const label = line.slice(0, separatorIndex).trim();
        const rawExpression = line.slice(separatorIndex + 1).trim();
        if (!label) {
            throw new Error(`Dong ${index + 1} chua co ten cot.`);
        }
        if (!rawExpression) {
            throw new Error(`Dong ${index + 1} chua co bieu thuc.`);
        }
        if (seenLabels.has(label)) {
            throw new Error(`Ten cot "${label}" dang bi trung.`);
        }
        seenLabels.add(label);

        const expression = normalizeRootCustomExpression(rawExpression);
        if (!ROOT_ALLOWED_EXPRESSION.test(expression)) {
            throw new Error(`Bieu thuc cua cot "${label}" co ky tu khong hop le.`);
        }

        const invalidIdentifiers = extractIdentifiers(expression).filter((identifier) => !allowedIdentifiers.has(identifier));
        if (invalidIdentifiers.length > 0) {
            throw new Error(`Cot "${label}" dung bien/ham khong ho tro: ${invalidIdentifiers.join(', ')}.`);
        }

        let evaluate;
        try {
            evaluate = buildEvaluator(expression);
        } catch (_error) {
            throw new Error(`Khong bien dich duoc bieu thuc cua cot "${label}".`);
        }

        return {
            key: `custom_col_${index}`,
            label,
            expression,
            evaluate
        };
    });
}

export function applyRootCustomColumns(result, customColumns) {
    const columns = Array.isArray(customColumns) ? customColumns : [];
    if (!result || !Array.isArray(result.steps) || columns.length === 0) {
        return {
            ...result,
            custom_columns_meta: []
        };
    }

    const steps = result.steps.map((row) => {
        const nextRow = { ...row };
        columns.forEach((column) => {
            try {
                const value = column.evaluate(nextRow);
                nextRow[column.key] = Number.isNaN(value) ? null : value;
            } catch (_error) {
                nextRow[column.key] = null;
            }
        });
        return nextRow;
    });

    return {
        ...result,
        steps,
        custom_columns_meta: columns.map(({ key, label, expression }) => ({
            key,
            label,
            expression
        }))
    };
}
