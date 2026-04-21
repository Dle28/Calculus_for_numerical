// frontend/static/js/handlers/iterative_methods_handler.js
import { solveIterativeLinearSystem, solveSimpleIterationSystem } from '../api.js';
import { renderIterativeSolution, showLoading, hideLoading, showError } from '../ui.js';
import { renderFormulaList } from '../utils/formula_panel.js';

function updateJacobiGaussSeidelFormulaUI() {
    renderFormulaList(document.getElementById('iter-jacobi-gs-formula-content'), [
        {
            label: 'Jacobi - cheo troi hang',
            latex: '\\frac{q}{1-q}\\|X^{(k+1)} - X^{(k)}\\|_{\\infty} < \\varepsilon',
            text: '(q / (1-q)) * ||X^(k+1) - X^k||_inf < eps'
        },
        {
            label: 'Jacobi - cheo troi cot',
            latex: '\\frac{\\lambda q}{1-q}\\|X^{(k+1)} - X^{(k)}\\|_{1} < \\varepsilon',
            text: '(lambda*q / (1-q)) * ||X^(k+1) - X^k||_1 < eps'
        },
        {
            label: 'Gauss-Seidel - cheo troi hang',
            latex: '\\frac{q}{(1-s)(1-q)}\\|X^{(k)} - X^{(k-1)}\\|_{\\infty} < \\varepsilon',
            text: '(q / ((1-s)(1-q))) * ||X^k - X^(k-1)||_inf < eps'
        },
        {
            label: 'Gauss-Seidel - cheo troi cot',
            latex: '\\frac{q}{(1-s)(1-q)}\\|X^{(k)} - X^{(k-1)}\\|_{1} < \\varepsilon',
            text: '(q / ((1-s)(1-q))) * ||X^k - X^(k-1)||_1 < eps'
        }
    ]);
}

function updateSimpleIterationFormulaUI() {
    const normChoice = document.getElementById('simple-iter-norm-choice')?.value || 'inf';
    const normLatex = normChoice === '1' ? '1' : '\\infty';
    const normText = normChoice === '1' ? '1' : 'inf';

    renderFormulaList(document.getElementById('iter-simple-formula-content'), [
        {
            label: 'Neu ||B|| < 1',
            latex: `\\frac{\\|B\\|_{${normLatex}}}{1-\\|B\\|_{${normLatex}}}\\|X^{(k+1)} - X^{(k)}\\|_{${normLatex}} < \\varepsilon`,
            text: `(||B||_${normText} / (1-||B||_${normText})) * ||X^(k+1) - X^k||_${normText} < eps`,
            note: 'Ung dung doi dieu kien dung ve nguong tren sai khac hai buoc lap lien tiep.'
        },
        {
            label: 'Neu ||B|| >= 1',
            latex: `\\|X^{(k+1)} - X^{(k)}\\|_{${normLatex}} < \\varepsilon`,
            text: `||X^(k+1) - X^k||_${normText} < eps`,
            note: 'Day la nguong fallback ma app dang dung khi dieu kien hoi tu khong duoc dam bao.'
        }
    ]);
}

export function setupIterativeMethodsHandlers() {
    const calculateJacobiBtn = document.getElementById('calculate-jacobi-btn');
    if (calculateJacobiBtn) {
        calculateJacobiBtn.addEventListener('click', handleJacobiCalculation);
    }
    const calculateGSBtn = document.getElementById('calculate-gs-btn');
    if (calculateGSBtn) {
        calculateGSBtn.addEventListener('click', handleGaussSeidelCalculation);
    }
    const calculateSimpleIterBtn = document.getElementById('calculate-simple-iteration-btn');
    if (calculateSimpleIterBtn) {
        calculateSimpleIterBtn.addEventListener('click', handleSimpleIterationCalculation);
    }
    const simpleIterNormChoice = document.getElementById('simple-iter-norm-choice');
    if (simpleIterNormChoice) {
        simpleIterNormChoice.addEventListener('change', updateSimpleIterationFormulaUI);
    }
    // Logic xử lý chuyển tab cho trang phương pháp lặp
    const iterTabs = document.querySelectorAll('.iter-hpt-tab');
    iterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabTarget = tab.dataset.tab;

            // 1. Cập nhật trạng thái active cho các nút tab
            iterTabs.forEach(t => {
                t.classList.remove('text-blue-600', 'border-blue-500');
                t.classList.add('text-gray-500', 'border-transparent', 'hover:text-gray-700', 'hover:border-gray-300');
            });
            tab.classList.add('text-blue-600', 'border-blue-500');
            tab.classList.remove('text-gray-500', 'border-transparent', 'hover:text-gray-700', 'hover:border-gray-300');

            // 2. Ẩn tất cả các nội dung tab
            document.querySelectorAll('.iter-hpt-tab-content').forEach(content => {
                content.classList.add('hidden');
            });

            // 3. Hiển thị nội dung tab tương ứng
            const activeContent = document.getElementById(`iter-hpt-${tabTarget}-content`);
            if (activeContent) {
                activeContent.classList.remove('hidden');
            }
        });
    });

    updateJacobiGaussSeidelFormulaUI();
    updateSimpleIterationFormulaUI();
}

async function handleJacobiCalculation() {
    const matrixA = document.getElementById('matrix-a-input-iter').value;
    const matrixB = document.getElementById('matrix-b-input-iter').value;
    const x0 = document.getElementById('x0-input-iter').value;
    const tolerance = document.getElementById('iter-tolerance').value;
    const maxIter = document.getElementById('iter-max-iter').value;
    
    if (!matrixA.trim() || !matrixB.trim() || !x0.trim()) {
        showError('Vui lòng nhập đầy đủ các ma trận A, b và vector lặp ban đầu X₀.');
        return;
    }

    showLoading();
    
    try {
        const data = await solveIterativeLinearSystem('jacobi', matrixA, matrixB, x0, tolerance, maxIter);
        renderIterativeSolution(document.getElementById('results-area'), data);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function handleGaussSeidelCalculation() {
    // Xử lý sự kiện cho nút Gauss-Seidel.
    const matrixA = document.getElementById('matrix-a-input-iter').value;
    const matrixB = document.getElementById('matrix-b-input-iter').value;
    const x0 = document.getElementById('x0-input-iter').value;
    const tolerance = document.getElementById('iter-tolerance').value;
    const maxIter = document.getElementById('iter-max-iter').value;
    
    if (!matrixA.trim() || !matrixB.trim() || !x0.trim()) {
        showError('Vui lòng nhập đầy đủ các ma trận A, b và vector lặp ban đầu X₀.');
        return;
    }

    showLoading();
    
    try {
        const data = await solveIterativeLinearSystem('gauss-seidel', matrixA, matrixB, x0, tolerance, maxIter);
        renderIterativeSolution(document.getElementById('results-area'), data);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function handleSimpleIterationCalculation() {
    const matrixB = document.getElementById('matrix-b-input-simple-iter').value;
    const matrixD = document.getElementById('matrix-d-input-simple-iter').value;
    const x0 = document.getElementById('x0-input-simple-iter').value;
    const tolerance = document.getElementById('simple-iter-tolerance').value;
    const maxIter = document.getElementById('simple-iter-max-iter').value;
    const normChoice = document.getElementById('simple-iter-norm-choice').value;

    if (!matrixB.trim() || !matrixD.trim()) {
        showError('Vui lòng nhập đầy đủ ma trận B và vector d.');
        return;
    }

    showLoading();
    
    try {
        const data = await solveSimpleIterationSystem(matrixB, matrixD, x0, tolerance, maxIter, normChoice);
        renderIterativeSolution(document.getElementById('results-area'), data);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}
