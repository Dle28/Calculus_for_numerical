// frontend/static/js/handlers/find_intervals_handler.js
import { calculateFindIntervals } from '../api.js';
import { renderFindIntervalsSolution, showLoading, hideLoading, showError } from '../ui.js';

export function setupFindIntervalsHandlers() {
    const calculateBtn = document.getElementById('calculate-find-intervals-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', handleFindIntervalsCalculation);
    }

    document.querySelectorAll('input[name="find-intervals-source"]').forEach((input) => {
        input.addEventListener('change', syncFindIntervalsSourceUI);
    });

    syncFindIntervalsSourceUI();
}

function syncFindIntervalsSourceUI() {
    const sourceInput = document.querySelector('input[name="find-intervals-source"]:checked');
    const source = sourceInput ? sourceInput.value : 'csv';
    const csvSection = document.getElementById('find-intervals-csv-section');
    const manualSection = document.getElementById('find-intervals-manual-section');

    if (csvSection) csvSection.classList.toggle('hidden', source !== 'csv');
    if (manualSection) manualSection.classList.toggle('hidden', source !== 'manual');
}

async function handleFindIntervalsCalculation() {
    const sourceInput = document.querySelector('input[name="find-intervals-source"]:checked');
    const source = sourceInput ? sourceInput.value : 'csv';
    const fileInput = document.getElementById('find-intervals-file-input');
    const xNodes = document.getElementById('find-intervals-x-nodes')?.value || '';
    const yNodes = document.getElementById('find-intervals-y-nodes')?.value || '';
    const yBar = document.getElementById('find-intervals-y-bar').value;
    const num_nodes = document.getElementById('find-intervals-num-nodes').value;
    const methodInput = document.querySelector('input[name="find-intervals-method"]:checked');
    const method = methodInput ? methodInput.value : 'both';
    const resultsArea = document.getElementById('results-area');

    if (!yBar.trim()) {
        showError('Vui lòng nhập giá trị y cần tìm (ȳ).');
        return;
    }
    
    if (!num_nodes.trim()) {
        showError('Vui lòng nhập số mốc k.');
        return;
    }

    const formData = new FormData();
    formData.append('input_mode', source);
    formData.append('y_bar', yBar);
    formData.append('num_nodes', num_nodes);
    formData.append('method', method);

    if (source === 'csv') {
        if (!fileInput.files || fileInput.files.length === 0) {
            showError('Vui lòng chọn một file dữ liệu CSV.');
            return;
        }
        formData.append('file', fileInput.files[0]);
    } else {
        if (!xNodes.trim() || !yNodes.trim()) {
            showError('Vui lòng nhập đầy đủ danh sách xᵢ và yᵢ.');
            return;
        }
        formData.append('x_nodes', xNodes);
        formData.append('y_nodes', yNodes);
    }

    showLoading();
    try {
        const data = await calculateFindIntervals(formData);
        renderFindIntervalsSolution(resultsArea, data);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}
