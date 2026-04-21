// frontend/static/js/handlers/polynomial_handler.js
import { solvePolynomial } from '../api.js';
import { renderPolynomialSolution, showLoading, hideLoading, showError } from '../ui.js';
import { renderFormulaList } from '../utils/formula_panel.js';

function updatePolynomialStopFormulaUI() {
    renderFormulaList(document.getElementById('poly-stop-formula-content'), [
        {
            label: 'Chia doi tren moi khoang cach ly',
            latex: '\\frac{b-a}{2} < \\varepsilon',
            text: '(b - a) / 2 < eps'
        },
        {
            label: 'Hoac dung neu tim duoc nghiem chinh xac',
            latex: 'P(c) = 0',
            text: 'P(c) = 0'
        }
    ]);
}

export function setupPolynomialHandlers() {
    const calculateBtn = document.getElementById('calculate-poly-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', handleCalculation);
    }

    updatePolynomialStopFormulaUI();
}

async function handleCalculation() {
    const coeffs = document.getElementById('poly-coeffs-input').value;
    const tolerance = document.getElementById('poly-tolerance').value;
    const maxIter = document.getElementById('poly-max-iter').value;

    if (!coeffs.trim()) {
        showError('Vui lòng nhập các hệ số của đa thức.');
        return;
    }

    showLoading();
    try {
        const data = await solvePolynomial(coeffs, tolerance, maxIter);
        renderPolynomialSolution(document.getElementById('results-area'), data);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}
