import { solveNonlinearSystem } from '../api.js';
import { renderNonlinearSystemSolution, showLoading, hideLoading, showError } from '../ui.js';
import { renderLatexReference } from '../utils/latex_reference.js';
import {
    normalizeMixedExpression,
    sympyToLatex
} from '../utils/sympy_expression.js';

function renderSystemSympyPreview(inputElement, previewElement) {
    if (!inputElement || !previewElement) return;

    const rawLines = inputElement.value.trim().split('\n');
    previewElement.innerHTML = '';
    previewElement.className = 'mt-2 p-3 bg-gray-50 rounded-md min-h-[80px] flex flex-col justify-center space-y-2';

    if (rawLines.length === 0 || rawLines[0].trim() === '') {
        previewElement.textContent = 'Xem truoc he phuong trinh dang LaTeX...';
        previewElement.classList.add('text-gray-400');
        return;
    }

    previewElement.classList.remove('text-gray-400');

    rawLines.forEach((line, index) => {
        if (!line.trim()) return;

        const lineDiv = document.createElement('div');
        lineDiv.className = 'flex items-center gap-2';

        const indexSpan = document.createElement('span');
        indexSpan.className = 'text-xs text-gray-500 font-mono';
        indexSpan.textContent = `${index + 1}.`;

        const formulaSpan = document.createElement('span');
        formulaSpan.className = 'text-base text-gray-800';

        const normalizedLine = normalizeMixedExpression(line);
        const latexFormula = sympyToLatex(normalizedLine);

        if (window.katex) {
            try {
                katex.render(latexFormula, formulaSpan, {
                    throwOnError: false,
                    displayMode: false
                });
            } catch (_error) {
                formulaSpan.className = 'text-sm text-gray-700 font-mono break-all';
                formulaSpan.textContent = normalizedLine;
            }
        } else {
            formulaSpan.className = 'text-sm text-gray-700 font-mono break-all';
            formulaSpan.textContent = normalizedLine;
        }

        lineDiv.appendChild(indexSpan);
        lineDiv.appendChild(formulaSpan);

        previewElement.appendChild(lineDiv);
    });
}

function updateNonlinearSystemUI() {
    const method = document.getElementById('ns-method-select').value;
    const normGroup = document.getElementById('ns-norm-selection-group');
    const domainGroup = document.getElementById('ns-domain-group');
    const expressionsLabel = document.getElementById('ns-expressions-label');
    const expressionsInput = document.getElementById('ns-expressions-input');
    const expressionsHelp = document.getElementById('ns-expressions-help');
    const referenceContainer = document.getElementById('ns-latex-reference');

    normGroup.style.display = 'none';
    domainGroup.style.display = 'none';

    if (method === 'newton' || method === 'newton_modified') {
        normGroup.style.display = 'block';
        expressionsInput.placeholder = `x - sqrt(x*y + 5*x - 1)/sqrt(2)
y - sqrt(x + 3*log(x, 10))`;
        expressionsHelp.textContent = 'Nhap moi dong theo SymPy hoac mix SymPy + LaTeX, he thong se chuan hoa ve SymPy dang F_i(X)=0. Neu he dang X = phi(X), hay chuyen thanh x_i - phi_i(X) = 0 de dung Newton.';
        expressionsLabel.textContent = 'He phuong trinh F(X) = 0 (nhap SymPy/LaTeX mix, hien thi LaTeX)';
    } else if (method === 'simple_iteration') {
        domainGroup.style.display = 'block';
        expressionsInput.placeholder = `sqrt(x*y + 5*x - 1)/sqrt(2)
sqrt(x + 3*log(x, 10))`;
        expressionsHelp.textContent = 'Nhap truc tiep cac ham lap phi_i(X) theo SymPy hoac mix SymPy + LaTeX. Ben duoi hay nhap hinh cau S(alpha, r) gom tam alpha va ban kinh r.';
        expressionsLabel.textContent = 'He phuong trinh X = phi(X) (nhap SymPy/LaTeX mix, hien thi LaTeX)';
    }

    renderLatexReference(referenceContainer, 'nonlinear_system', method);
}

export function setupNonlinearSystemsHandlers() {
    const calculateBtn = document.getElementById('calculate-ns-btn');
    const expressionsInput = document.getElementById('ns-expressions-input');
    const previewDiv = document.getElementById('ns-latex-preview');
    const methodSelect = document.getElementById('ns-method-select');

    katex.render('||X_k - X_{k-1}||_\\infty', document.getElementById('ns-norm-inf-katex'));
    katex.render('||X_k - X_{k-1}||_1', document.getElementById('ns-norm-1-katex'));

    if (expressionsInput) {
        expressionsInput.addEventListener('input', () => renderSystemSympyPreview(expressionsInput, previewDiv));
        renderSystemSympyPreview(expressionsInput, previewDiv);
    }

    if (methodSelect) {
        methodSelect.addEventListener('change', updateNonlinearSystemUI);
    }

    if (calculateBtn) {
        calculateBtn.addEventListener('click', handleCalculation);
    }

    updateNonlinearSystemUI();
}

async function handleCalculation() {
    const method = document.getElementById('ns-method-select').value;
    const expressions = document
        .getElementById('ns-expressions-input')
        .value
        .trim()
        .split('\n')
        .map(normalizeMixedExpression);
    const x0 = document.getElementById('ns-x0-input').value.trim().split('\n');
    const stopOption = document.getElementById('ns-stop-option-select').value;
    const stopValue = document.getElementById('ns-stop-value-input').value;
    const normChoice = document.querySelector('input[name="ns-norm-option"]:checked').value;

    if (expressions.some((expr) => expr.trim() === '') || x0.some((value) => value.trim() === '')) {
        showError('Vui long nhap day du cac phuong trinh va gia tri ban dau.');
        return;
    }

    const payload = {
        method,
        expressions,
        x0,
        stop_option: stopOption,
        stop_value: stopValue,
        norm_choice: normChoice
    };

    if (method === 'simple_iteration') {
        const center = document.getElementById('ns-center-input').value.trim().split('\n');
        const radius = document.getElementById('ns-radius-input').value.trim();
        if (center.some((item) => item.trim() === '')) {
            showError('Vui long nhap day du toa do tam alpha.');
            return;
        }
        if (center.length !== expressions.length) {
            showError('So luong toa do cua tam alpha phai bang so phuong trinh.');
            return;
        }
        if (!radius) {
            showError('Vui long nhap ban kinh r.');
            return;
        }
        if (Number(radius) <= 0) {
            showError('Ban kinh r phai lon hon 0.');
            return;
        }
        payload.center = center;
        payload.radius = radius;
    }

    showLoading();
    try {
        const data = await solveNonlinearSystem(payload);
        renderNonlinearSystemSolution(document.getElementById('results-area'), data);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}
