import { formatCell, formatGeneralSolution, formatMatrix } from './formatters.js';

const STEP_THEMES = {
    slate: {
        panel: 'border-slate-200 bg-slate-50',
        header: 'border-slate-200 bg-slate-100/80',
        detail: 'border-slate-200 bg-white/80',
    },
    blue: {
        panel: 'border-blue-200 bg-blue-50',
        header: 'border-blue-200 bg-blue-100/70',
        detail: 'border-blue-200 bg-white/85',
    },
    amber: {
        panel: 'border-amber-200 bg-amber-50',
        header: 'border-amber-200 bg-amber-100/70',
        detail: 'border-amber-200 bg-white/85',
    },
    emerald: {
        panel: 'border-emerald-200 bg-emerald-50',
        header: 'border-emerald-200 bg-emerald-100/70',
        detail: 'border-emerald-200 bg-white/85',
    },
    violet: {
        panel: 'border-violet-200 bg-violet-50',
        header: 'border-violet-200 bg-violet-100/70',
        detail: 'border-violet-200 bg-white/85',
    },
};

function getUiPrecision() {
    return parseInt(document.getElementById('setting-precision')?.value || '4', 10);
}

function escapeAttribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function latexNode(formula, displayMode = false) {
    if (!formula) return '';
    const className = displayMode ? 'katex-render' : 'katex-render-inline';
    return `<span class="${className}" data-formula="${escapeAttribute(formula)}"></span>`;
}

function renderKatexInContainer(container) {
    if (!window.katex) return;
    container.querySelectorAll('.katex-render, .katex-render-inline').forEach((element) => {
        try {
            katex.render(element.dataset.formula, element, {
                throwOnError: false,
                displayMode: element.classList.contains('katex-render'),
            });
        } catch (error) {
            element.textContent = element.dataset.formula;
        }
    });
}

function unwrapScalar(value) {
    let current = value;
    while (Array.isArray(current) && current.length === 1) {
        current = current[0];
    }
    return current;
}

function formatScalarText(value) {
    const scalar = unwrapScalar(value);
    if (Array.isArray(scalar)) {
        return scalar.flat(Infinity).map((item) => formatCell(item, getUiPrecision())).join(', ');
    }
    return formatCell(scalar, getUiPrecision());
}

function toComplexParts(value) {
    const scalar = unwrapScalar(value);
    if (typeof scalar === 'object' && scalar !== null && 'real' in scalar && 'imag' in scalar) {
        return { real: Number(scalar.real), imag: Number(scalar.imag) };
    }
    const numeric = Number(scalar);
    return { real: numeric, imag: 0 };
}

function addScalarValues(a, b) {
    const left = toComplexParts(a);
    const right = toComplexParts(b);
    const real = left.real + right.real;
    const imag = left.imag + right.imag;
    if (Math.abs(imag) < 1e-9) return real;
    return { real, imag };
}

function renderInlineValue(value) {
    if (value === null || value === undefined) {
        return '<span class="font-mono text-sm text-gray-500">N/A</span>';
    }

    const scalar = unwrapScalar(value);
    if (!Array.isArray(scalar)) {
        return `<span class="font-mono text-sm text-slate-800">${formatCell(scalar, getUiPrecision())}</span>`;
    }

    if (scalar.length === 0) {
        return '<span class="font-mono text-sm text-gray-500">[]</span>';
    }

    return Array.isArray(scalar[0]) ? formatMatrix(scalar) : formatMatrix([scalar]);
}

function renderSectionHeading(title, description = '') {
    return `<div class="mt-6 mb-3">
        <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
        ${description ? `<p class="mt-1 text-sm text-slate-600">${description}</p>` : ''}
    </div>`;
}

function renderInfoBlock(label, content) {
    if (!content) return '';
    return `<div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</p>
        <div class="mt-1 text-sm text-slate-800">${content}</div>
    </div>`;
}

function renderFormulaBlock(label, formula, displayMode = true) {
    return renderInfoBlock(label, latexNode(formula, displayMode));
}

function renderAlignedLatex(lines) {
    const validLines = lines.filter(Boolean);
    if (validLines.length === 0) return '';
    if (validLines.length === 1) return validLines[0];
    return `\\begin{aligned}${validLines.join(' \\\\ ')}\\end{aligned}`;
}

function renderFactGrid(facts) {
    const validFacts = facts.filter((fact) => fact && fact.label && fact.value);
    if (validFacts.length === 0) return '';

    return `<div class="grid gap-3 sm:grid-cols-2">
        ${validFacts.map((fact) => `
            <div class="rounded-lg border border-white/70 bg-white/80 p-3">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${fact.label}</p>
                <div class="mt-1 text-sm text-slate-800">${fact.value}</div>
            </div>
        `).join('')}
    </div>`;
}

function renderMatrixCollection(items, numVars = -1) {
    const validItems = items.filter((item) => item && item.matrix);
    if (validItems.length === 0) return '';

    return `<div class="mt-3 flex flex-wrap items-start justify-center gap-4">
        ${validItems.map((item) => `<div class="matrix-display">${formatMatrix(item.matrix, item.label, item.numVars ?? numVars)}</div>`).join('')}
    </div>`;
}

function renderOperationSummary(rowOperations) {
    if (!rowOperations || rowOperations.length === 0) {
        return '<p class="text-sm text-slate-500">Không có phép biến đổi hàng mới ở bước này.</p>';
    }

    return `<div class="space-y-2">
        ${rowOperations.map((op) => `
            <div class="rounded-lg border border-slate-200 bg-white p-3">
                <p class="font-mono text-sm text-slate-800">${op.operation}</p>
                ${op.factor !== undefined ? `<p class="mt-1 text-sm text-slate-600">Hệ số khử: ${renderInlineValue(op.factor)}</p>` : ''}
            </div>
        `).join('')}
    </div>`;
}

function renderOperationBreakdown(rowOperations) {
    if (!rowOperations || rowOperations.length === 0) {
        return '<p class="text-sm text-slate-500">Không có chi tiết phép biến đổi hàng cho bước này.</p>';
    }

    return `<div class="space-y-4">
        ${rowOperations.map((op, index) => `
            <div class="rounded-lg border border-slate-200 bg-white p-4">
                <p class="font-semibold text-slate-800">Phép biến đổi ${index + 1}</p>
                <p class="mt-1 font-mono text-sm text-slate-700">${op.operation}</p>
                ${op.factor !== undefined ? `<p class="mt-1 text-sm text-slate-600">Hệ số khử: ${renderInlineValue(op.factor)}</p>` : ''}
                ${renderMatrixCollection([
                    op.row_before ? { label: 'Hàng trước', matrix: [op.row_before] } : null,
                    op.pivot_row_snapshot ? { label: 'Hàng pivot', matrix: [op.pivot_row_snapshot] } : null,
                    op.row_after ? { label: 'Hàng sau', matrix: [op.row_after] } : null,
                ])}
            </div>
        `).join('')}
    </div>`;
}

function renderStepCard({
    theme = 'slate',
    title,
    summary = '',
    reason = '',
    formula = '',
    substitution = '',
    result = '',
    facts = [],
    aside = '',
    detailTitle = '',
    detailContent = '',
}) {
    const palette = STEP_THEMES[theme] || STEP_THEMES.slate;
    const sideContent = `${renderFactGrid(facts)}${aside ? `<div class="rounded-xl border border-white/70 bg-white/80 p-3">${aside}</div>` : ''}`;

    return `<div class="mb-4 overflow-hidden rounded-2xl border ${palette.panel} shadow-sm">
        <div class="border-b px-4 py-3 ${palette.header}">
            <h4 class="text-base font-semibold text-slate-900">${title}</h4>
            ${summary ? `<div class="mt-1 text-sm text-slate-700">${summary}</div>` : ''}
        </div>
        <div class="grid gap-4 p-4 ${sideContent ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]' : ''}">
            <div class="space-y-3">
                ${renderInfoBlock('Vì sao', reason)}
                ${formula ? renderFormulaBlock('Công thức', formula) : ''}
                ${substitution ? renderFormulaBlock('Thay số', substitution) : ''}
                ${result ? renderFormulaBlock('Kết quả', result) : ''}
            </div>
            ${sideContent ? `<div class="space-y-3">${sideContent}</div>` : ''}
        </div>
        ${detailContent ? `<details class="border-t px-4 py-3 ${palette.detail}">
            <summary class="cursor-pointer text-sm font-medium text-slate-700">${detailTitle || 'Xem chi tiết'}</summary>
            <div class="mt-3 space-y-4">${detailContent}</div>
        </details>` : ''}
    </div>`;
}

function latexSymbol(label) {
    if (label === 'Lambda') return '\\Lambda';
    return label;
}

function renderReductionDetails(step) {
    const detailParts = [];

    if (step.matrix_before || step.matrix) {
        detailParts.push(renderMatrixCollection([
            step.matrix_before ? { label: 'Ma trận trước bước này', matrix: step.matrix_before, numVars: step.num_vars } : null,
            step.matrix ? { label: 'Ma trận sau bước này', matrix: step.matrix, numVars: step.num_vars } : null,
        ], step.num_vars));
    }

    if (step.row_before_current && step.row_before_swap) {
        detailParts.push(renderMatrixCollection([
            { label: 'Hàng hiện tại trước khi đổi', matrix: [step.row_before_current] },
            { label: 'Hàng được đổi lên', matrix: [step.row_before_swap] },
            step.row_after_current ? { label: 'Hàng hiện tại sau khi đổi', matrix: [step.row_after_current] } : null,
            step.row_after_swap ? { label: 'Hàng còn lại sau khi đổi', matrix: [step.row_after_swap] } : null,
        ]));
    }

    if (step.pivot_row_before) {
        detailParts.push(renderMatrixCollection([
            { label: 'Hàng pivot trước chuẩn hóa', matrix: [step.pivot_row_before] },
            step.pivot_row_after ? { label: 'Hàng pivot sau chuẩn hóa', matrix: [step.pivot_row_after] } : null,
        ]));
    }

    if (step.row_operations?.length) {
        detailParts.push(renderOperationBreakdown(step.row_operations));
    }

    return detailParts.join('');
}

function renderReductionSteps(method, steps) {
    if (!steps || steps.length === 0) return '';

    const intro = method === 'Gauss-Jordan'
        ? 'Mỗi bước chuẩn hóa pivot về 1, sau đó khử các phần tử còn lại trong cùng cột để cột pivot chỉ còn một giá trị khác 0.'
        : 'Mỗi bước chọn một pivot rồi khử các phần tử phía dưới để ma trận dần về dạng bậc thang.';

    let html = renderSectionHeading(`Các bước khử của ${method}`, intro);

    steps.forEach((step, index) => {
        let title = `Bước ${index + 1}`;
        let reason = '';
        let formula = '';
        let substitution = '';
        let result = '';
        let facts = [];
        let aside = '';

        if (step.type === 'pivot') {
            title = `Bước ${index + 1}: đổi hàng để lấy pivot`;
            reason = 'Nếu vị trí pivot hiện tại bằng 0 thì không thể tiếp tục khử ở cột này. Cần đổi một hàng có phần tử khác 0 lên trên.';
            formula = 'R_i \\leftrightarrow R_j';
            substitution = `R_{${step.to_row + 1}} \\leftrightarrow R_{${step.from_row + 1}}`;
            result = `\\text{Cột } ${step.pivot_col + 1} \\text{ đã có pivot mới.}`;
            facts = [
                { label: 'Cột đang xét', value: `<span class="font-mono">${step.pivot_col + 1}</span>` },
                { label: 'Hàng được đưa lên', value: `<span class="font-mono">R${step.to_row + 1}</span>` },
            ];
        } else if (step.type === 'skip_column') {
            title = `Bước ${index + 1}: bỏ qua cột ${step.pivot_col + 1}`;
            reason = 'Toàn bộ các phần tử có thể làm pivot trong cột này đều bằng 0, nên cột đó không tạo thêm ràng buộc mới.';
            formula = 'a_{p,p} = 0';
            substitution = `\\text{Không tìm được pivot khác } 0 \\text{ trong cột } ${step.pivot_col + 1}`;
            result = `\\text{Chuyển sang cột } ${step.pivot_col + 2}`;
            facts = [
                { label: 'Cột bị bỏ qua', value: `<span class="font-mono">${step.pivot_col + 1}</span>` },
            ];
        } else {
            const isGaussJordan = method === 'Gauss-Jordan';
            const operationLines = (step.row_operations || []).map((op) => `R_{${op.target_row + 1}} \\leftarrow R_{${op.target_row + 1}} - (${formatScalarText(op.factor)})R_{${op.pivot_row + 1}}`);

            title = `Bước ${index + 1}: xử lý cột ${step.pivot_col + 1}`;
            reason = isGaussJordan
                ? 'Cần đưa pivot về 1 rồi khử mọi phần tử khác trong cùng cột để thu được dạng rút gọn.'
                : 'Cần tạo các số 0 phía dưới pivot để ma trận tiến dần về dạng tam giác trên.';
            formula = isGaussJordan
                ? 'R_p \\leftarrow \\frac{1}{a_{pp}}R_p,\\quad R_i \\leftarrow R_i - a_{ip}R_p'
                : 'R_i \\leftarrow R_i - m_{ip}R_p,\\quad m_{ip} = \\frac{a_{ip}}{a_{pp}}';
            substitution = step.normalization_operation
                ? renderAlignedLatex([
                    `R_{${step.pivot_row + 1}} \\leftarrow \\frac{1}{${formatScalarText(step.pivot_value)}}R_{${step.pivot_row + 1}}`,
                    ...operationLines,
                ])
                : renderAlignedLatex(operationLines.length ? operationLines : ['\\text{Không cần phép khử nào ở bước này}']);
            result = isGaussJordan
                ? `\\text{Cột } ${step.pivot_col + 1} \\text{ đã được rút gọn quanh pivot.}`
                : `\\text{Cột } ${step.pivot_col + 1} \\text{ đã được khử phía dưới pivot.}`;
            facts = [
                { label: 'Giá trị pivot', value: renderInlineValue(step.pivot_value) },
                { label: 'Số phép biến đổi', value: `<span class="font-mono">${step.row_operations?.length || 0}</span>` },
            ];
            aside = renderOperationSummary(step.row_operations);
        }

        html += renderStepCard({
            theme: method === 'Gauss-Jordan' ? 'emerald' : 'violet',
            title,
            summary: step.message || '',
            reason,
            formula,
            substitution,
            result,
            facts,
            aside,
            detailTitle: 'Xem ma trận và các phép biến đổi',
            detailContent: renderReductionDetails(step),
        });
    });

    return html;
}

function renderGaussBackwardSteps(steps) {
    if (!steps || steps.length === 0) return '';

    let html = renderSectionHeading(
        'Các bước thế ngược',
        'Sau khi ma trận đã về dạng tam giác trên, mỗi hàng chỉ còn một ẩn chưa biết nên ta tính từ dưới lên.'
    );

    steps.forEach((step, index) => {
        const variable = `x_{${step.row + 1}}`;
        const detailContent = [
            step.coefficients?.length ? `<div class="matrix-display">${formatMatrix([step.coefficients], 'Hệ số đã biết')}</div>` : '',
            step.known_solution_values?.length ? `<div class="matrix-display">${formatMatrix(step.known_solution_values, 'Các nghiệm đã biết')}</div>` : '',
            step.solution_so_far ? `<div class="matrix-display">${formatMatrix(step.solution_so_far, 'Nghiệm sau bước này')}</div>` : '',
        ].join('');

        html += renderStepCard({
            theme: 'blue',
            title: `Bước ${index + 1}: tính ${latexNode(variable)}`,
            summary: step.message || '',
            reason: `Ở hàng ${step.row + 1}, các nghiệm phía bên phải đã biết nên chỉ còn ${latexNode(variable, false)} là chưa biết.`,
            formula: `${variable} = \\frac{b_i - \\sum_{j=i+1}^{n} a_{ij}x_j}{a_{ii}}`,
            substitution: `${variable} = \\frac{${formatScalarText(step.rhs)} - ${formatScalarText(step.known_contribution)}}{${formatScalarText(step.pivot_value)}}`,
            result: `${variable} = ${formatScalarText(step.computed_value)}`,
            facts: [
                { label: 'Hệ số chéo', value: renderInlineValue(step.pivot_value) },
                { label: 'Tổng đã biết', value: renderInlineValue(step.known_contribution) },
            ],
            detailTitle: 'Xem hệ số và nghiệm trung gian',
            detailContent,
        });
    });

    return html;
}

function renderLuStepDetails(step) {
    const stepNumber = (step.step_index ?? 0) + 1;
    const operationLines = (step.row_operations || []).map((op) => `R_{${op.target_row + 1}} \\leftarrow R_{${op.target_row + 1}} - (${formatScalarText(op.factor)})R_{${op.pivot_row + 1}}`);
    const detailParts = [];

    if (step.row_before_current && step.row_before_swap) {
        detailParts.push(renderMatrixCollection([
            { label: 'Hàng hiện tại trước khi đổi', matrix: [step.row_before_current] },
            { label: 'Hàng được chọn làm pivot', matrix: [step.row_before_swap] },
            step.row_after_current ? { label: 'Hàng hiện tại sau khi đổi', matrix: [step.row_after_current] } : null,
            step.row_after_swap ? { label: 'Hàng sau đổi', matrix: [step.row_after_swap] } : null,
        ]));
    }

    detailParts.push(renderMatrixCollection([
        step.P ? { label: 'P sau bước này', matrix: step.P } : null,
        step.L ? { label: 'L sau bước này', matrix: step.L } : null,
        step.U ? { label: 'U sau bước này', matrix: step.U } : null,
    ]));

    if (step.row_operations?.length) {
        detailParts.push(renderOperationBreakdown(step.row_operations));
    }

    return renderStepCard({
        theme: 'slate',
        title: `Bước ${stepNumber}: cập nhật cột ${stepNumber} của LU`,
        summary: step.message || '',
        reason: step.swap_operation
            ? 'Trước khi khử, ta chọn pivot lớn nhất theo trị tuyệt đối để tránh chia cho số quá nhỏ và giúp phép khử ổn định hơn.'
            : 'Ta dùng pivot của cột hiện tại để khử các phần tử phía dưới; các hệ số khử được lưu vào L, còn kết quả sau khử nằm trong U.',
        formula: '\\ell_{ik} = \\frac{u_{ik}}{u_{kk}},\\quad R_i \\leftarrow R_i - \\ell_{ik}R_k',
        substitution: step.swap_operation && operationLines.length
            ? renderAlignedLatex([
                `\\text{Đổi hàng để chọn pivot ở cột } ${stepNumber}`,
                ...operationLines,
            ])
            : renderAlignedLatex(operationLines.length ? operationLines : ['\\text{Không cần khử thêm ở cột này}']),
        result: `\\text{Sau bước này, cột } ${stepNumber} \\text{ của } U \\text{ đã được xử lý và các hệ số khử tương ứng đã vào } L.`,
        facts: [
            { label: 'Pivot đang dùng', value: renderInlineValue(step.pivot_value) },
            { label: 'Số phép khử', value: `<span class="font-mono">${step.row_operations?.length || 0}</span>` },
        ],
        aside: renderOperationSummary(step.row_operations),
        detailTitle: 'Xem P, L, U và phép khử chi tiết',
        detailContent: detailParts.join(''),
    });
}

function renderLuSteps(steps) {
    if (!steps || steps.length === 0) return '';

    let html = renderSectionHeading(
        'Các bước phân rã LU',
        'Mỗi bước chọn một pivot, khử các phần tử phía dưới và lưu hệ số khử vào L. Ma trận U chứa kết quả sau khi khử.'
    );

    steps.forEach((step) => {
        html += renderLuStepDetails(step);
    });

    return html;
}

function renderCholeskyGroupedOffDiagonal(step) {
    const calculations = step.off_diagonal_calculations || [];
    if (calculations.length === 0) {
        return '<p class="text-sm text-slate-500">Không còn phần tử nào ở bên phải đường chéo trong hàng này.</p>';
    }

    const row = step.step_index + 1;
    const substitutionLines = calculations.map((calc) => {
        const col = calc.col + 1;
        const matrixValue = addScalarValues(calc.numerator, calc.cross_term);
        return `q_{${row},${col}} = \\frac{${formatScalarText(matrixValue)} - ${formatScalarText(calc.cross_term)}}{${formatScalarText(calc.denominator)}} = ${formatScalarText(calc.result)}`;
    });
    const resultLines = calculations.map((calc) => {
        const col = calc.col + 1;
        return `q_{${row},${col}} = ${formatScalarText(calc.result)}`;
    });

    const formula = row === 1
        ? `q_{1,j} = \\frac{m_{1,j}}{q_{1,1}},\\quad j = 2,\\ldots,n`
        : `q_{${row},j} = \\frac{m_{${row},j} - \\sum_{s=1}^{${row - 1}} q_{s,${row}}q_{s,j}}{q_{${row},${row}}},\\quad j = ${row + 1},\\ldots,n`;

    return `<div class="rounded-xl border border-amber-200 bg-white p-4">
        <p class="font-semibold text-slate-800">Các phần tử còn lại trên hàng ${row}</p>
        <p class="mt-1 text-sm text-slate-600">Sau khi đã biết ${latexNode(`q_{${row},${row}}`)}, ta tính toàn bộ các phần tử ${latexNode(`q_{${row},j}`)} còn lại của cùng hàng theo đúng một công thức chung.</p>
        <div class="mt-3 space-y-3">
            ${renderFormulaBlock('Công thức', formula)}
            ${renderFormulaBlock('Thay số', renderAlignedLatex(substitutionLines))}
            ${renderFormulaBlock('Kết quả', renderAlignedLatex(resultLines))}
        </div>
    </div>`;
}

function renderCholeskyFactorizationSteps(steps) {
    if (!steps || steps.length === 0) return '';

    let html = renderSectionHeading(
        'Các bước phân rã Cholesky',
        'Ở mỗi bước, ta luôn tính phần tử đường chéo trước. Lý do là mọi phần tử còn lại trên cùng hàng đều phải chia cho giá trị đường chéo này.'
    );

    steps.forEach((step) => {
        const index = step.step_index + 1;
        const diagonalValue = addScalarValues(step.radicand, step.diagonal_sum);
        const diagonalFormula = index === 1
            ? `q_{1,1} = \\sqrt{m_{1,1}}`
            : `q_{${index},${index}} = \\sqrt{m_{${index},${index}} - \\sum_{s=1}^{${index - 1}} q_{s,${index}}^2}`;

        html += renderStepCard({
            theme: 'amber',
            title: `Bước ${index}: tính ${latexNode(`q_{${index},${index}}`)}`,
            summary: `Từ các giá trị đã biết ở các bước trước, ta xác định phần tử đường chéo ${latexNode(`q_{${index},${index}}`)} trước rồi mới tính các phần tử ${latexNode(`q_{${index},j}`)}.`,
            reason: 'Trong Cholesky, phần tử đường chéo đóng vai trò làm mẫu số cho các phần tử còn lại trên cùng hàng, nên phải tính trước để tránh thiếu dữ liệu.',
            formula: diagonalFormula,
            substitution: `q_{${index},${index}} = \\sqrt{${formatScalarText(diagonalValue)} - ${formatScalarText(step.diagonal_sum)}}`,
            result: `q_{${index},${index}} = ${formatScalarText(step.q_kk)}`,
            facts: [
                { label: 'Tổng đã biết', value: renderInlineValue(step.diagonal_sum) },
                { label: 'Biểu thức dưới căn', value: renderInlineValue(step.radicand) },
                { label: 'Phần tử cùng hàng cần tính tiếp', value: `<span class="font-mono">${step.off_diagonal_calculations?.length || 0}</span>` },
            ],
            detailTitle: 'Xem Q sau bước này và các phần tử cùng hàng',
            detailContent: `
                ${step.partial_Q ? `<div class="matrix-display">${formatMatrix(step.partial_Q, 'Q sau bước này')}</div>` : ''}
                ${renderCholeskyGroupedOffDiagonal(step)}
            `,
        });
    });

    return html;
}

function renderTriangularSolveSteps(title, steps, resultLabel) {
    if (!steps || steps.length === 0) return '';

    const intro = steps[0]?.triangular_type === 'lower'
        ? 'Vì ma trận tam giác dưới chỉ phụ thuộc vào các giá trị phía trên đã biết, ta tính lần lượt từ trên xuống.'
        : 'Vì ma trận tam giác trên chỉ phụ thuộc vào các giá trị phía dưới đã biết, ta tính lần lượt từ dưới lên.';

    let html = renderSectionHeading(title, intro);
    const symbol = latexSymbol(resultLabel);

    steps.forEach((step, index) => {
        const variable = `${symbol}_{${step.row + 1}}`;
        const formula = step.triangular_type === 'lower'
            ? `${variable} = \\frac{r_i - \\sum_{j<i} t_{ij}z_j}{t_{ii}}`
            : `${variable} = \\frac{r_i - \\sum_{j>i} t_{ij}z_j}{t_{ii}}`;
        const detailContent = `
            ${step.coefficients?.length ? `<div class="matrix-display">${formatMatrix([step.coefficients], 'Hệ số đã biết')}</div>` : '<p class="text-sm text-slate-500">Không có hệ số đã biết ở bước này.</p>'}
            ${step.known_values?.length ? `<div class="matrix-display mt-3">${formatMatrix(step.known_values, 'Giá trị đã biết')}</div>` : ''}
            ${step.solution_so_far ? `<div class="matrix-display mt-3">${formatMatrix(step.solution_so_far, `${resultLabel} sau bước này`)}</div>` : ''}
        `;

        html += renderStepCard({
            theme: 'blue',
            title: `Bước ${index + 1}: tính ${latexNode(variable)}`,
            summary: `Ở hàng ${step.row + 1}, chỉ còn ${latexNode(variable)} là giá trị mới cần tìm.`,
            reason: step.triangular_type === 'lower'
                ? 'Các giá trị đứng trước trong cùng hàng đã được tính xong, nên chỉ cần chuyển chúng sang vế phải rồi chia cho phần tử đường chéo.'
                : 'Các giá trị đứng sau trong cùng hàng đã được biết, nên chỉ cần gom phần đã biết rồi chia cho phần tử đường chéo.',
            formula,
            substitution: `${variable} = \\frac{${formatScalarText(step.rhs)} - ${formatScalarText(step.known_sum)}}{${formatScalarText(step.diag)}}`,
            result: `${variable} = ${formatScalarText(step.result)}`,
            facts: [
                { label: 'Phần tử đường chéo', value: renderInlineValue(step.diag) },
                { label: 'Vế phải hiện tại', value: renderInlineValue(step.rhs) },
                { label: 'Tổng phần đã biết', value: renderInlineValue(step.known_sum) },
            ],
            detailTitle: 'Xem hệ số và nghiệm trung gian',
            detailContent,
        });
    });

    return html;
}

function renderCholeskyReconstructionSteps(steps) {
    if (!steps || steps.length === 0) return '';

    let html = renderSectionHeading(
        'Bước dựng lại nghiệm',
        'Ở bài toán thiếu phương trình hơn ẩn, ta tìm biến phụ trước rồi dùng công thức dựng lại nghiệm có chuẩn nhỏ nhất.'
    );

    steps.forEach((step, index) => {
        html += renderStepCard({
            theme: 'emerald',
            title: `Bước ${index + 1}: dựng lại nghiệm X`,
            summary: step.description || '',
            reason: 'Sau khi giải được biến phụ, ta nhân ngược với A^T để thu được nghiệm riêng có chuẩn nhỏ nhất.',
            formula: 'X = A^{T}\\Lambda',
            substitution: 'X = A^{T}\\Lambda',
            result: '\\text{Thu được nghiệm riêng } X',
            detailTitle: 'Xem A^T, biến phụ và nghiệm thu được',
            detailContent: renderMatrixCollection([
                step.matrix_at ? { label: 'Aᵀ', matrix: step.matrix_at } : null,
                step.auxiliary_solution ? { label: 'Lambda', matrix: step.auxiliary_solution } : null,
                step.result ? { label: 'X', matrix: step.result } : null,
            ]),
        });
    });

    return html;
}

export function renderMatrixSolution(container, data) {
    const errorMessageDiv = document.getElementById('error-message');
    if (errorMessageDiv) errorMessageDiv.classList.add('hidden');

    const positiveStatuses = new Set(['unique_solution', 'least_squares_solution']);
    let html = `<h2 class="result-heading">Kết quả - ${data.method}</h2>`;
    html += `<p class="text-center font-semibold text-lg mb-6 ${
        positiveStatuses.has(data.status) ? 'text-green-600' : 'text-orange-600'
    }">${data.message}</p>`;

    if (data.transformation_message) {
        html += `<p class="text-center text-sm text-gray-600 italic mb-6">${data.transformation_message}</p>`;
    }
    if (data.factorization_note) {
        html += `<div class="mx-auto mb-6 max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">${data.factorization_note}</div>`;
    }
    if (data.solution_note) {
        html += `<div class="mx-auto mb-6 max-w-4xl rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">${data.solution_note}</div>`;
    }

    if (data.method === 'Cholesky' && data.original_factorization) {
        const original = data.original_factorization;
        html += `<div class="mx-auto mb-6 max-w-4xl rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <p class="font-semibold">${original.message || ''}</p>
            ${original.reason ? `<p class="mt-2 text-slate-700">Lý do: ${original.reason}</p>` : ''}
        </div>`;
    }

    if (data.decomposition) {
        if (
            data.method === 'Cholesky' &&
            data.original_factorization &&
            (data.original_factorization.Q || data.original_factorization.Qt)
        ) {
            html += renderSectionHeading('Phân rã trực tiếp trên A', 'Trường hợp A tự thỏa điều kiện Cholesky thì có thể phân rã ngay trên chính A.');
            html += renderMatrixCollection([
                data.original_factorization.Qt ? { label: 'Qᵀ', matrix: data.original_factorization.Qt } : null,
                data.original_factorization.Q ? { label: 'Q', matrix: data.original_factorization.Q } : null,
            ]);
        }

        if (data.decomposition.M) {
            html += renderSectionHeading(
                data.working_system_description || 'Hệ tương đương',
                'Đây là hệ làm việc mà phương pháp đang giải sau khi biến đổi từ bài toán ban đầu.'
            );
            html += renderMatrixCollection([
                { label: 'M', matrix: data.decomposition.M },
                { label: data.decomposition_rhs_label || 'd', matrix: data.decomposition.d },
            ]);
        }

        if (data.method === 'Phân rã LU') {
            html += renderSectionHeading('Ma trận phân rã cuối cùng', 'Sau khi khử xong, ta có P*A = L*U.');
            html += renderMatrixCollection([
                data.decomposition.P ? { label: 'P', matrix: data.decomposition.P } : null,
                data.decomposition.L ? { label: 'L', matrix: data.decomposition.L } : null,
                data.decomposition.U ? { label: 'U', matrix: data.decomposition.U } : null,
            ]);
        }

        if (data.method === 'Cholesky' && data.decomposition.Q && data.decomposition.Qt) {
            html += renderSectionHeading('Ma trận Cholesky cuối cùng', 'Kết quả phân rã của hệ làm việc có dạng M = QᵀQ.');
            html += renderMatrixCollection([
                { label: 'Qᵀ', matrix: data.decomposition.Qt },
                { label: 'Q', matrix: data.decomposition.Q },
            ]);
        }
    }

    if (data.intermediate_y) {
        html += renderSectionHeading('Vector trung gian Y', 'Đây là kết quả sau bước thế thuận.');
        html += renderMatrixCollection([{ label: 'Y', matrix: data.intermediate_y }]);
    }

    if (data.auxiliary_solution) {
        html += renderSectionHeading(
            `Biến phụ ${data.auxiliary_solution_label || 'Lambda'}`,
            'Biến phụ xuất hiện khi giải hệ đối ngẫu hoặc hệ trung gian.'
        );
        html += renderMatrixCollection([{ label: data.auxiliary_solution_label || 'Lambda', matrix: data.auxiliary_solution }]);
    }

    if (data.solution) {
        html += renderSectionHeading(data.solution_heading || 'Nghiệm tìm được', 'Nghiệm được suy ra trực tiếp từ các bước giải phía trên.');
        html += renderMatrixCollection([{ label: 'X', matrix: data.solution }]);
    }

    if (data.general_solution) {
        html += renderSectionHeading(data.general_solution_heading || 'Nghiệm tổng quát', 'Một nghiệm riêng cộng với tổ hợp tuyến tính của các vector trong không gian null.');
        html += `<div class="matrix-display">${formatGeneralSolution(data.general_solution)}</div>`;
    }

    if (data.method === 'Cholesky' && data.residual) {
        const residualNorm = Number.isFinite(data.residual_norm) ? data.residual_norm.toExponential(4) : 'N/A';
        html += renderSectionHeading('Sai số dư', 'Dùng để kiểm tra nghiệm vừa tìm được khớp với hệ gốc đến mức nào.');
        html += `<div class="matrix-display">${formatMatrix(data.residual, 'R')}</div>`;
        html += `<p class="mt-2 text-center text-sm text-gray-600">||R||₂ = ${residualNorm}</p>`;
    }

    if (data.method === 'Khử Gauss') {
        html += renderReductionSteps('Khử Gauss', data.steps);
        html += renderGaussBackwardSteps(data.backward_steps);
    }

    if (data.method === 'Gauss-Jordan') {
        html += renderReductionSteps('Gauss-Jordan', data.steps);
    }

    if (data.method === 'Phân rã LU') {
        html += renderLuSteps(data.steps);
        html += renderTriangularSolveSteps('Các bước thế thuận LY = P*B', data.forward_steps, 'Y');
        html += renderTriangularSolveSteps('Các bước thế ngược UX = Y', data.backward_steps, 'X');
    }

    if (data.method === 'Cholesky') {
        html += renderCholeskyFactorizationSteps(data.factorization_steps);
        html += renderTriangularSolveSteps('Các bước giải QᵀY = d', data.forward_steps, 'Y');
        html += renderTriangularSolveSteps(
            data.auxiliary_solution ? `Các bước giải Q${data.auxiliary_solution_label || 'Lambda'} = Y` : 'Các bước giải QX = Y',
            data.backward_steps,
            data.auxiliary_solution ? (data.auxiliary_solution_label || 'Lambda') : 'X'
        );
        html += renderCholeskyReconstructionSteps(data.reconstruction_steps);
    }

    container.innerHTML = html;
    renderKatexInContainer(container);
}
