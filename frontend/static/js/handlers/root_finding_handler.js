import { solveNonlinearEquation } from '../api.js';
import { renderRootFindingSolution, showLoading, hideLoading, showError } from '../ui.js';
import { renderLatexReference } from '../utils/latex_reference.js';
import {
    normalizeMixedExpression,
    sympyToLatex
} from '../utils/sympy_expression.js';

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

    fGroup.style.display = 'none';
    phiGroup.style.display = 'none';
    advancedGroup.style.display = 'none';
    x0Group.style.display = 'none';

    if (method === 'bisection') {
        fGroup.style.display = 'block';
        if (fInput) fInput.placeholder = 'x**3 - x - 2';
    } else if (method === 'secant') {
        fGroup.style.display = 'block';
        advancedGroup.style.display = 'block';
        if (fInput) fInput.placeholder = 'x**3 - x - 2';
        katex.render('\\frac{|f(x_n)|}{m_1}', document.getElementById('adv-stop-label-1'));
        katex.render('\\frac{M_1 - m_1}{m_1} |x_n - x_{n-1}|', document.getElementById('adv-stop-label-2'));
    } else if (method === 'newton') {
        fGroup.style.display = 'block';
        advancedGroup.style.display = 'block';
        x0Group.style.display = 'block';
        if (fInput) fInput.placeholder = 'x**3 - x - 2';
        katex.render('\\frac{|f(x_{n+1})|}{m_1}', document.getElementById('adv-stop-label-1'));
        katex.render('\\frac{M_2}{2m_1} |x_{n+1} - x_n|^2', document.getElementById('adv-stop-label-2'));
    } else if (method === 'simple_iteration') {
        phiGroup.style.display = 'block';
        x0Group.style.display = 'block';
        if (phiInput) phiInput.placeholder = '(x + 2)**(1/3)';
    }

    renderLatexReference(referenceContainer, 'root_finding', method);
}

export function setupRootFindingHandlers() {
    const calculateBtn = document.getElementById('calculate-nonlinear-btn');
    const fInput = document.getElementById('f-expression-input');
    const fPreview = document.getElementById('f-latex-preview');
    const phiInput = document.getElementById('phi-expression-input');
    const phiPreview = document.getElementById('phi-latex-preview');
    const methodSelect = document.getElementById('nonlinear-method-select');

    if (methodSelect) {
        methodSelect.addEventListener('change', updateMethodUI);
    }

    if (fInput) {
        fInput.addEventListener('input', () => renderSympyExpressionPreview(fInput, fPreview));
        renderSympyExpressionPreview(fInput, fPreview);
    }

    if (phiInput) {
        phiInput.addEventListener('input', () => renderSympyExpressionPreview(phiInput, phiPreview));
        renderSympyExpressionPreview(phiInput, phiPreview);
    }

    if (calculateBtn) {
        calculateBtn.addEventListener('click', handleCalculation);
    }

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

    showLoading();
    try {
        const data = await solveNonlinearEquation(payload);
        renderRootFindingSolution(document.getElementById('results-area'), data);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}
