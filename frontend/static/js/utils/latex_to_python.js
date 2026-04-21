function extractDelimitedGroup(text, startIndex, openChar, closeChar) {
    if (text[startIndex] !== openChar) return null;

    let depth = 0;
    for (let i = startIndex; i < text.length; i += 1) {
        const currentChar = text[i];
        if (currentChar === openChar) {
            depth += 1;
        } else if (currentChar === closeChar) {
            depth -= 1;
            if (depth === 0) {
                return {
                    content: text.slice(startIndex + 1, i),
                    end: i + 1
                };
            }
        }
    }

    return null;
}

function replaceLatexCommand(text, command, replacer) {
    let result = '';
    let cursor = 0;

    while (cursor < text.length) {
        const commandIndex = text.indexOf(command, cursor);
        if (commandIndex === -1) {
            result += text.slice(cursor);
            break;
        }

        result += text.slice(cursor, commandIndex);
        const replacement = replacer(text, commandIndex);

        if (!replacement) {
            result += text.slice(commandIndex, commandIndex + command.length);
            cursor = commandIndex + command.length;
            continue;
        }

        result += replacement.text;
        cursor = replacement.end;
    }

    return result;
}

function replaceLatexStructuresOnce(text) {
    let output = text;

    output = replaceLatexCommand(output, '\\frac', (source, index) => {
        const numerator =
            extractDelimitedGroup(source, index + '\\frac'.length, '{', '}')
            || extractDelimitedGroup(source, index + '\\frac'.length, '(', ')');
        if (!numerator) return null;

        const denominator =
            extractDelimitedGroup(source, numerator.end, '{', '}')
            || extractDelimitedGroup(source, numerator.end, '(', ')');
        if (!denominator) return null;

        return {
            text: `(${numerator.content})/(${denominator.content})`,
            end: denominator.end
        };
    });

    output = replaceLatexCommand(output, '\\sqrt', (source, index) => {
        const bracketGroup = extractDelimitedGroup(source, index + '\\sqrt'.length, '[', ']');
        if (bracketGroup) {
            const radicand =
                extractDelimitedGroup(source, bracketGroup.end, '{', '}')
                || extractDelimitedGroup(source, bracketGroup.end, '(', ')');
            if (!radicand) return null;

            return {
                text: `(${radicand.content})**(1/(${bracketGroup.content}))`,
                end: radicand.end
            };
        }

        const radicand =
            extractDelimitedGroup(source, index + '\\sqrt'.length, '{', '}')
            || extractDelimitedGroup(source, index + '\\sqrt'.length, '(', ')');
        if (!radicand) return null;

        return {
            text: `sqrt(${radicand.content})`,
            end: radicand.end
        };
    });

    output = replaceLatexCommand(output, '\\log_', (source, index) => {
        const base = extractDelimitedGroup(source, index + '\\log_'.length, '{', '}');
        if (!base) return null;

        const argument =
            extractDelimitedGroup(source, base.end, '{', '}')
            || extractDelimitedGroup(source, base.end, '(', ')');
        if (!argument) return null;

        return {
            text: `log(${argument.content}, ${base.content})`,
            end: argument.end
        };
    });

    return output;
}

function replaceLatexStructures(text) {
    let previousText = text;
    let currentText = replaceLatexStructuresOnce(text);

    while (currentText !== previousText) {
        previousText = currentText;
        currentText = replaceLatexStructuresOnce(currentText);
    }

    return currentText;
}

export function latexToPython(latex) {
    if (!latex) return '';

    let pyExpr = latex.trim();

    pyExpr = pyExpr.replace(/([a-zA-Z])_\{(\d+)\}/g, '$1$2');
    pyExpr = pyExpr.replace(/([a-zA-Z])_(\d+)/g, '$1$2');
    pyExpr = replaceLatexStructures(pyExpr);

    pyExpr = pyExpr.replace(/\\left/g, '');
    pyExpr = pyExpr.replace(/\\right/g, '');
    pyExpr = pyExpr.replace(/\\ln\b/g, 'log');
    pyExpr = pyExpr.replace(/\\(sin|cos|tan|asin|acos|atan|log|exp|abs|pi|sqrt|root)\b/g, '$1');
    pyExpr = pyExpr.replace(/\^/g, '**');
    pyExpr = pyExpr.replace(/\\cdot/g, '*');
    pyExpr = pyExpr.replace(/\{/g, '(');
    pyExpr = pyExpr.replace(/\}/g, ')');
    pyExpr = pyExpr.replace(/\)(?=\s*(sqrt|log|sin|cos|tan|asin|acos|atan|exp|abs|\())/g, ')*');
    pyExpr = pyExpr.replace(/(\d)(?=\s*(sqrt|log|sin|cos|tan|asin|acos|atan|exp|abs|\())/g, '$1*');

    return pyExpr.replace(/\s+/g, ' ').trim();
}
