// frontend/static/js/handlers/inverse_iterative_methods_handler.js
import { calculateInverseIterative } from '../api.js';
import { renderInverseIterativeSolution, showLoading, hideLoading, showError } from '../ui.js';
import { renderFormulaList } from '../utils/formula_panel.js';

function updateInverseIterativeFormulaUI() {
    renderFormulaList(document.getElementById('inv-iter-stop-formula-content'), [
        {
            label: 'Jacobi inverse - cheo troi hang',
            latex: '\\frac{q}{1-q}\\|X_{k+1} - X_k\\|_{\\infty} < \\varepsilon',
            text: '(q / (1-q)) * ||X_(k+1) - X_k||_inf < eps'
        },
        {
            label: 'Jacobi inverse - cheo troi cot',
            latex: '\\frac{\\lambda q}{1-q}\\|X_{k+1} - X_k\\|_{1} < \\varepsilon',
            text: '(lambda*q / (1-q)) * ||X_(k+1) - X_k||_1 < eps'
        },
        {
            label: 'Newton inverse',
            latex: '\\frac{q}{1-q}\\|X_{k+1} - X_k\\|_{2} < \\varepsilon',
            text: '(q / (1-q)) * ||X_(k+1) - X_k||_2 < eps'
        },
        {
            label: 'Gauss-Seidel inverse',
            latex: '\\frac{q}{(1-s)(1-q)}\\|X_k - X_{k-1}\\|_{*} < \\varepsilon',
            text: '(q / ((1-s)(1-q))) * ||X_k - X_(k-1)||_* < eps',
            note: 'Norm * la vo cung neu cheo troi hang, va la 1 neu cheo troi cot.'
        }
    ]);
}

export function setupInverseIterativeMethodsHandlers() {
    const jacobiBtn = document.getElementById('calculate-inv-jacobi-btn');
    if (jacobiBtn) {
        jacobiBtn.addEventListener('click', () => handleInverseIterativeCalculation('jacobi'));
    }
    const newtonBtn = document.getElementById('calculate-inv-newton-btn');
    if (newtonBtn) {
        newtonBtn.addEventListener('click', () => handleInverseIterativeCalculation('newton'));
    }
    const gsBtn = document.getElementById('calculate-inv-gauss-seidel-btn');
    if (gsBtn) {
        gsBtn.addEventListener('click', () => handleInverseIterativeCalculation('gauss-seidel'));
    }

    updateInverseIterativeFormulaUI();
}

// Gộp thành một hàm chung để xử lý
async function handleInverseIterativeCalculation(method) {
    const matrixA = document.getElementById('matrix-a-input-inv-iter').value;
    const tolerance = document.getElementById('inv-iter-tolerance').value;
    const maxIter = document.getElementById('inv-iter-max-iter').value;
    const x0Method = document.getElementById('inv-iter-x0-select').value;

    if (!matrixA.trim()) {
        showError('Vui lòng nhập ma trận A.');
        return;
    }

    showLoading();
    try {
        const data = await calculateInverseIterative(method, matrixA, tolerance, maxIter, x0Method);
        renderInverseIterativeSolution(document.getElementById('results-area'), data);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}
