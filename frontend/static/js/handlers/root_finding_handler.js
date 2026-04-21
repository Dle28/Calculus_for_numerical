import { solveNonlinearEquation } from '../api.js';
import { renderRootFindingSolution, showLoading, hideLoading, showError } from '../ui.js';
import { renderLatexReference } from '../utils/latex_reference.js';
import {
    normalizeMixedExpression,
    sympyToLatex
} from '../utils/sympy_expression.js';
import {
    applyRootCustomColumns,
    getRootCustomColumnHelpText,
    parseRootCustomColumns
} from '../utils/root_custom_columns.js';

let lastRootFindingResult = null;

function setRootCustomColumnsStatus(message, isError = false) {
    const statusElement = document.getElementById('root-custom-columns-status');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `mt-2 text-xs ${isError ? 'text-red-600' : 'text-slate-600'}`;
}

function readRootCustomColumns({ suppressError = false } = {}) {
    const input = document.getElementById('root-custom-columns-input');
    const method = document.getElementById('nonlinear-method-select')?.value || 'bisection';

    try {
        const columns = parseRootCustomColumns(input?.value || '', method);
        if (columns.length === 0) {
            setRootCustomColumnsStatus('Khong co cot tuy chinh.');
        } else {
            setRootCustomColumnsStatus(`San sang them ${columns.length} cot tuy chinh.`);
        }
        return columns;
    } catch (error) {
        setRootCustomColumnsStatus(error.message, true);
        if (!suppressError) {
            throw error;
        }
        return null;
    }
}

function rerenderRootFindingResult() {
    if (!lastRootFindingResult) return;

    const customColumns = readRootCustomColumns({ suppressError: true });
    if (customColumns === null) return;

    const enrichedData = applyRootCustomColumns(lastRootFindingResult, customColumns);
    renderRootFindingSolution(document.getElementById('results-area'), enrichedData);
}

function renderMathFormula(element, formula, fallbackText, displayMode = false) {
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

function getAdvancedStopFormulas(method, stopMode) {
    if (method === 'secant') {
        if (stopMode === 'absolute_error') {
            return {
                first: {
                    latex: '\\frac{|f(x_n)|}{m_1}',
                    text: '|f(x_n)| / m1'
                },
                second: {
                    latex: '\\frac{(M_1 - m_1)|x_n - x_{n-1}|}{m_1}',
                    text: '((M1 - m1) * |x_n - x_(n-1)|) / m1'
                }
            };
        }
        if (stopMode === 'relative_error') {
            return {
                first: {
                    latex: '\\frac{|f(x_n)|}{m_1|x_n|}',
                    text: '|f(x_n)| / (m1 * |x_n|)'
                },
                second: {
                    latex: '\\frac{(M_1 - m_1)|x_n - x_{n-1}|}{m_1|x_n|}',
                    text: '((M1 - m1) * |x_n - x_(n-1)|) / (m1 * |x_n|)'
                }
            };
        }
    }

    if (method === 'newton') {
        if (stopMode === 'absolute_error') {
            return {
                first: {
                    latex: '\\frac{|f(x_{n+1})|}{m_1}',
                    text: '|f(x_(n+1))| / m1'
                },
                second: {
                    latex: '\\frac{M_2}{2m_1}|x_{n+1} - x_n|^2',
                    text: '(M2 / (2*m1)) * |x_(n+1) - x_n|^2'
                }
            };
        }
        if (stopMode === 'relative_error') {
            return {
                first: {
                    latex: '\\frac{|f(x_{n+1})|}{m_1|x_{n+1}|}',
                    text: '|f(x_(n+1))| / (m1 * |x_(n+1)|)'
                },
                second: {
                    latex: '\\frac{M_2|x_{n+1} - x_n|^2}{2m_1|x_{n+1}|}',
                    text: '(M2 * |x_(n+1) - x_n|^2) / (2*m1*|x_(n+1)|)'
                }
            };
        }
    }

    return null;
}

function getRootStopFormulaSummary(method, stopMode, advStopCondition) {
    if (stopMode === 'iterations') {
        const iterationSymbol = method === 'simple_iteration' || method === 'newton' ? 'k' : 'n';
        return {
            latex: `${iterationSymbol} = N`,
            text: `${iterationSymbol} = N`,
            note: 'Ung dung se dung sau dung so buoc lap N nhap o o Gia tri.'
        };
    }

    if (method === 'bisection') {
        if (stopMode === 'absolute_error') {
            return {
                latex: '|c_n - c_{n-1}| < \\varepsilon',
                text: '|c_n - c_(n-1)| < eps',
                note: 'Sai so duoc danh gia bang do lech giua hai trung diem lien tiep.'
            };
        }
        return {
            latex: '\\frac{|c_n - c_{n-1}|}{|c_n|} < \\varepsilon',
            text: '|c_n - c_(n-1)| / |c_n| < eps',
            note: 'Sai so tuong doi duoc tinh bang sai so buoc lap chia cho do lon cua nghiem gan dung hien tai.'
        };
    }

    if (method === 'simple_iteration') {
        if (stopMode === 'absolute_error') {
            return {
                latex: '\\frac{q}{1-q}|x_{k+1} - x_k| < \\varepsilon',
                text: '(q / (1-q)) * |x_(k+1) - x_k| < eps',
                note: 'Dung cong thuc hau nghiem cua phuong phap lap don.'
            };
        }
        return {
            latex: '\\frac{q}{1-q}\\frac{|x_{k+1} - x_k|}{|x_{k+1}|} < \\varepsilon',
            text: '(q / (1-q)) * |x_(k+1) - x_k| / |x_(k+1)| < eps',
            note: 'Sai so tuong doi duoc lay tu cong thuc hau nghiem chia cho do lon cua nghiem moi.'
        };
    }

    const advancedFormulas = getAdvancedStopFormulas(method, stopMode);
    if (advancedFormulas) {
        const selected = advStopCondition === 'xn_x_prev' ? advancedFormulas.second : advancedFormulas.first;
        return {
            latex: `${selected.latex} < \\varepsilon`,
            text: `${selected.text} < eps`,
            note: 'Cong thuc nay duoc chon trong nhom cong thuc danh gia sai so ben duoi.'
        };
    }

    return {
        latex: '\\varepsilon',
        text: 'eps',
        note: 'Khong xac dinh duoc cong thuc dieu kien dung.'
    };
}

function updateStopConditionFormulaUI() {
    const method = document.getElementById('nonlinear-method-select')?.value || 'bisection';
    const stopMode = document.getElementById('stop-mode-select')?.value || 'absolute_error';
    const advancedGroup = document.getElementById('advanced-stop-condition-group');
    const firstAdvancedLabel = document.getElementById('adv-stop-label-1');
    const secondAdvancedLabel = document.getElementById('adv-stop-label-2');
    const formulaElement = document.getElementById('root-stop-formula-katex');
    const noteElement = document.getElementById('root-stop-formula-note');
    const selectedAdvancedOption = document.querySelector('input[name="advanced-stop-option"]:checked')?.value || 'f_xn';

    const shouldShowAdvanced = (method === 'secant' || method === 'newton') && stopMode !== 'iterations';
    if (advancedGroup) {
        advancedGroup.style.display = shouldShowAdvanced ? 'block' : 'none';
    }

    const advancedFormulas = shouldShowAdvanced ? getAdvancedStopFormulas(method, stopMode) : null;
    if (advancedFormulas) {
        renderMathFormula(firstAdvancedLabel, advancedFormulas.first.latex, advancedFormulas.first.text);
        renderMathFormula(secondAdvancedLabel, advancedFormulas.second.latex, advancedFormulas.second.text);
    } else {
        if (firstAdvancedLabel) firstAdvancedLabel.textContent = '';
        if (secondAdvancedLabel) secondAdvancedLabel.textContent = '';
    }

    const summary = getRootStopFormulaSummary(method, stopMode, selectedAdvancedOption);
    renderMathFormula(formulaElement, summary.latex, summary.text, true);
    if (noteElement) {
        noteElement.textContent = summary.note;
    }
}

function renderSympyExpressionPreview(inputElement, previewElement) {
    if (!inputElement || !previewElement) return;

    const rawExpression = inputElement.value.trim();
    previewElement.innerHTML = '';
    previewElement.className = 'mt-2 p-3 bg-gray-50 rounded-md min-h-[50px] flex items-center justify-center text-lg';

    if (rawExpression === '') {
        previewElement.textContent = 'Xem truoc bieu thuc LaTeX...';
        previewElement.classList.add('text-gray-400');
        return;
    }

    previewElement.classList.remove('text-gray-400');

    const normalizedExpression = normalizeMixedExpression(rawExpression);
    const latexFormula = sympyToLatex(normalizedExpression);

    if (window.katex) {
        try {
            katex.render(latexFormula, previewElement, {
                throwOnError: false,
                displayMode: true
            });
            return;
        } catch (_error) {
            // Fall back to plain text below.
        }
    }

    previewElement.className = 'mt-2 p-3 bg-gray-50 rounded-md min-h-[50px] flex items-center justify-center text-sm font-mono';
    previewElement.textContent = normalizedExpression;
}

function updateMethodUI() {
    const method = document.getElementById('nonlinear-method-select').value;
    const fGroup = document.getElementById('f-expression-group');
    const phiGroup = document.getElementById('phi-expression-group');
    const advancedGroup = document.getElementById('advanced-stop-condition-group');
    const x0Group = document.getElementById('x0-group');
    const referenceContainer = document.getElementById('root-latex-reference');
    const fInput = document.getElementById('f-expression-input');
    const phiInput = document.getElementById('phi-expression-input');
    const customColumnsHelp = document.getElementById('root-custom-columns-help');

    fGroup.style.display = 'none';
    phiGroup.style.display = 'none';
    advancedGroup.style.display = 'none';
    x0Group.style.display = 'none';

    if (method === 'bisection') {
        fGroup.style.display = 'block';
        if (fInput) fInput.placeholder = 'x**3 - x - 2';
    } else if (method === 'secant') {
        fGroup.style.display = 'block';
        if (fInput) fInput.placeholder = 'x**3 - x - 2';
    } else if (method === 'newton') {
        fGroup.style.display = 'block';
        x0Group.style.display = 'block';
        if (fInput) fInput.placeholder = 'x**3 - x - 2';
    } else if (method === 'simple_iteration') {
        phiGroup.style.display = 'block';
        x0Group.style.display = 'block';
        if (phiInput) phiInput.placeholder = '(x + 2)**(1/3)';
    }

    if (customColumnsHelp) {
        customColumnsHelp.textContent = getRootCustomColumnHelpText(method);
    }
    readRootCustomColumns({ suppressError: true });
    updateStopConditionFormulaUI();
    renderLatexReference(referenceContainer, 'root_finding', method);
}

export function setupRootFindingHandlers() {
    const calculateBtn = document.getElementById('calculate-nonlinear-btn');
    const fInput = document.getElementById('f-expression-input');
    const fPreview = document.getElementById('f-latex-preview');
    const phiInput = document.getElementById('phi-expression-input');
    const phiPreview = document.getElementById('phi-latex-preview');
    const methodSelect = document.getElementById('nonlinear-method-select');
    const stopModeSelect = document.getElementById('stop-mode-select');
    const customColumnsInput = document.getElementById('root-custom-columns-input');
    const advancedStopOptions = document.querySelectorAll('input[name="advanced-stop-option"]');

    if (methodSelect) {
        methodSelect.addEventListener('change', () => {
            updateMethodUI();
            rerenderRootFindingResult();
        });
    }

    if (stopModeSelect) {
        stopModeSelect.addEventListener('change', updateStopConditionFormulaUI);
    }

    advancedStopOptions.forEach((option) => {
        option.addEventListener('change', updateStopConditionFormulaUI);
    });

    if (fInput) {
        fInput.addEventListener('input', () => renderSympyExpressionPreview(fInput, fPreview));
        renderSympyExpressionPreview(fInput, fPreview);
    }

    if (phiInput) {
        phiInput.addEventListener('input', () => renderSympyExpressionPreview(phiInput, phiPreview));
        renderSympyExpressionPreview(phiInput, phiPreview);
    }

    if (customColumnsInput) {
        customColumnsInput.addEventListener('input', rerenderRootFindingResult);
    }

    if (calculateBtn) {
        calculateBtn.addEventListener('click', handleCalculation);
    }

    lastRootFindingResult = null;
    updateMethodUI();
}

async function handleCalculation() {
    const method = document.getElementById('nonlinear-method-select').value;
    const a = document.getElementById('interval-a-input').value;
    const b = document.getElementById('interval-b-input').value;
    const stopMode = document.getElementById('stop-mode-select').value;
    const stopValue = document.getElementById('stop-value-input').value;
    const x0 = document.getElementById('x0-input').value;

    if (!a.trim() || !b.trim() || !stopValue.trim()) {
        showError('Vui long nhap day du khoang [a, b] va gia tri dieu kien dung.');
        return;
    }

    const payload = {
        method,
        a,
        b,
        stop_mode: stopMode,
        stop_value: stopValue,
        x0
    };

    if (method === 'simple_iteration') {
        const phiExpression = normalizeMixedExpression(document.getElementById('phi-expression-input').value);
        if (!phiExpression.trim()) {
            showError('Vui long nhap ham lap phi(x).');
            return;
        }
        if (!x0.trim()) {
            showError('Vui long nhap diem bat dau x0.');
            return;
        }
        payload.phi_expression = phiExpression;
    } else {
        const expression = normalizeMixedExpression(document.getElementById('f-expression-input').value);
        if (!expression.trim()) {
            showError('Vui long nhap bieu thuc f(x).');
            return;
        }
        payload.expression = expression;
    }

    if (method === 'secant' || method === 'newton') {
        payload.adv_stop_condition = document.querySelector('input[name="advanced-stop-option"]:checked').value;
    }

    if (method === 'newton' && !x0.trim()) {
        showError('Vui long nhap diem bat dau x0.');
        return;
    }

    let customColumns;
    try {
        customColumns = readRootCustomColumns();
    } catch (error) {
        showError(error.message);
        return;
    }

    showLoading();
    try {
        const data = await solveNonlinearEquation(payload);
        lastRootFindingResult = data;
        renderRootFindingSolution(
            document.getElementById('results-area'),
            applyRootCustomColumns(data, customColumns)
        );
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}
