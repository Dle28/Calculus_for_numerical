export function renderMathFormula(element, formula, fallbackText, displayMode = false) {
    if (!element) return;

    if (window.katex) {
        try {
            katex.render(formula, element, {
                throwOnError: false,
                displayMode
            });
            return;
        } catch (_error) {
            // Fall back to plain text below.
        }
    }

    element.textContent = fallbackText;
}

export function renderFormulaList(container, items, noteElement = null) {
    if (!container) return;

    container.innerHTML = '';
    items.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'mt-2';

        if (item.label) {
            const label = document.createElement('p');
            label.className = 'text-sm font-medium text-slate-700';
            label.textContent = item.label;
            row.appendChild(label);
        }

        const formula = document.createElement('div');
        formula.className = 'mt-1 text-lg text-slate-900';
        row.appendChild(formula);
        renderMathFormula(formula, item.latex, item.text, true);

        if (item.note) {
            const note = document.createElement('p');
            note.className = 'mt-1 text-xs text-slate-600';
            note.textContent = item.note;
            row.appendChild(note);
        }

        container.appendChild(row);
    });

    if (noteElement) {
        noteElement.textContent = '';
    }
}

export function renderFormulaSummary(formulaElement, noteElement, item) {
    if (!formulaElement) return;

    renderMathFormula(formulaElement, item.latex, item.text, true);
    if (noteElement) {
        noteElement.textContent = item.note || '';
    }
}
