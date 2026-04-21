import { sympyToLatex } from './sympy_expression.js';

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttribute(text) {
    return escapeHtml(text).replace(/\n/g, '&#10;');
}

function buildReferenceCard(item) {
    const sampleHtml = item.sample
        ? `<p class="mt-2 text-xs text-gray-600">Vi du: <code class="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-700">${escapeHtml(item.sample)}</code></p>`
        : '';
    const noteHtml = item.note
        ? `<p class="mt-2 text-xs text-gray-600">${escapeHtml(item.note)}</p>`
        : '';
    const previewFormula = item.preview_latex || sympyToLatex(item.sample || item.code);

    return `
        <div class="rounded-lg border border-amber-100 bg-white p-3 shadow-sm">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-800">${escapeHtml(item.label)}</p>
                    <code class="mt-2 block break-all rounded bg-gray-50 px-2 py-1 text-xs text-gray-700">${escapeHtml(item.code)}</code>
                </div>
                <button class="copy-btn shrink-0" data-copy-content="${escapeAttribute(item.code)}">Copy</button>
            </div>
            <div class="mt-3 rounded-md bg-gray-50 p-3">
                <div class="sympy-reference-preview min-h-[42px] text-sm" data-formula="${escapeAttribute(previewFormula)}"></div>
            </div>
            ${sampleHtml}
            ${noteHtml}
        </div>
    `;
}

function buildExampleCard(example) {
    const previewHtml = example.code
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => `<div class="sympy-reference-preview py-1" data-formula="${escapeAttribute(sympyToLatex(line))}"></div>`)
        .join('');

    return `
        <div class="rounded-lg border border-blue-100 bg-blue-50 p-3 shadow-sm">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-sm font-semibold text-blue-900">${escapeHtml(example.label)}</p>
                    <pre class="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-white px-3 py-2 text-xs text-gray-700">${escapeHtml(example.code)}</pre>
                </div>
                <button class="copy-btn shrink-0" data-copy-content="${escapeAttribute(example.code)}">Copy</button>
            </div>
            <div class="mt-3 rounded-md bg-white p-3">${previewHtml}</div>
            <p class="mt-2 text-xs text-blue-900">${escapeHtml(example.note)}</p>
        </div>
    `;
}

const COMMON_REFERENCE_ITEMS = [
    {
        label: 'Luy thua',
        code: 'x**2',
        sample: '(x + 1)**2',
        note: 'SymPy dung ** cho luy thua. Nen tranh dung ^.'
    },
    {
        label: 'Can bac hai',
        code: 'sqrt(x + 1)',
        preview_latex: '\\sqrt{x + 1}',
        sample: 'sqrt(x*y + 5*x - 1)',
        note: 'Co the nhap SymPy hoac LaTeX nhu \\sqrt{...}.'
    },
    {
        label: 'Can bac n',
        code: 'root(x + 2, 3)',
        sample: '(x + 2)**(1/3)',
        note: 'Co the dung root(a, n) hoac mu 1/n.'
    },
    {
        label: 'Log tu nhien',
        code: 'log(x)',
        sample: 'log(x + 1)',
        note: 'log(x) la log co so e.'
    },
    {
        label: 'Log co so',
        code: 'log(x, 10)',
        sample: 'log(x, 2)',
        note: 'Doi co so bang tham so thu hai.'
    },
    {
        label: 'Ham luong giac',
        code: 'sin(x), cos(x), tan(x)',
        sample: 'sin(x) + cos(x)',
        note: 'Cac ham deu viet theo kieu ham SymPy.'
    },
    {
        label: 'Ham mu',
        code: 'exp(x)',
        sample: 'exp(-x)',
        note: 'exp(x) tuong duong E**x.'
    },
    {
        label: 'Tri tuyet doi',
        code: 'Abs(x)',
        sample: 'Abs(x - 1)',
        note: 'Chu A trong Abs phai viet hoa.'
    },
    {
        label: 'Hang so dac biet',
        code: 'pi, E',
        sample: 'sin(pi/2) + E',
        note: 'Duoc SymPy hieu truc tiep.'
    },
    {
        label: 'Phep nhan',
        code: '2*x, x*y',
        sample: 'x*(y + 1)',
        note: 'Can viet ro phep nhan bang *.'
    },
    {
        label: 'Nhap mix SymPy + LaTeX',
        code: 'x**2 + \\sqrt{x} - \\frac{1}{2}',
        sample: 'x**2 + \\sqrt{x} - \\frac{1}{2}',
        note: 'He thong tu chuan hoa ve SymPy truoc khi gui backend.'
    }
];

const CONTEXT_EXAMPLES = {
    root_finding: {
        default: [
            {
                label: 'Vi du f(x) = 0',
                code: 'x**3 - x - 2',
                note: 'Moi phuong phap tren trang nay deu nhap mot bieu thuc theo bien x.'
            },
            {
                label: 'Vi du mix',
                code: 'x**3 - x - \\frac{1}{2}',
                note: 'Cho phep ket hop SymPy va LaTeX trong cung mot dong.'
            }
        ],
        newton: [
            {
                label: 'Vi du Newton',
                code: 'x**3 - x - 2',
                note: 'Nhap truc tiep f(x), khong phai dang x = phi(x).'
            }
        ],
        simple_iteration: [
            {
                label: 'Vi du ham lap phi(x)',
                code: '(x + 2)**(1/3)',
                note: 'O phuong phap lap don mot bien, nhap phi(x) vao o ham lap.'
            }
        ]
    },
    nonlinear_system: {
        default: [
            {
                label: 'Vi du he 2 bien',
                code: 'x1**2 + x2**2 - 1\nx1**2 - x2',
                note: 'Moi dong la mot phuong trinh rieng.'
            },
            {
                label: 'Vi du he mix',
                code: 'x**2 + y**2 - 1\nx - \\sqrt{y + 2}',
                note: 'Moi dong co the ket hop SymPy va LaTeX.'
            }
        ],
        newton: [
            {
                label: 'Vi du Newton cho he F(X)=0',
                code: 'x - sqrt(x*y + 5*x - 1)/sqrt(2)\ny - sqrt(x + 3*log(x, 10))',
                note: 'Moi dong phai o dang F_i(X)=0.'
            }
        ],
        newton_modified: [
            {
                label: 'Vi du Newton Modified',
                code: 'x - sqrt(x*y + 5*x - 1)/sqrt(2)\ny - sqrt(x + 3*log(x, 10))',
                note: 'Nhap giong Newton: dang F(X)=0.'
            }
        ],
        simple_iteration: [
            {
                label: 'Vi du he lap X = phi(X)',
                code: 'sqrt(x*y + 5*x - 1)/sqrt(2)\nsqrt(x + 3*log(x, 10))',
                note: 'Moi dong la mot ham lap phi_i(X). Ben duoi nhap them tam alpha va ban kinh r cua S(alpha, r).'
            }
        ]
    }
};

export function renderLatexReference(container, pageType, method) {
    if (!container) return;

    const pageExamples = CONTEXT_EXAMPLES[pageType] || {};
    const exampleItems = pageExamples[method] || pageExamples.default || [];
    const exampleTitle = pageType === 'nonlinear_system' ? 'Vi du theo phuong phap dang chon' : 'Vi du nhanh';

    container.innerHTML = `
        <details class="mt-4 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/80 shadow-sm">
            <summary class="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-amber-900">
                So tay cu phap SymPy
                <span class="ml-2 text-xs font-normal text-amber-700">Nhan de mo / dong</span>
            </summary>
            <div class="space-y-4 border-t border-amber-200 px-4 py-4">
                <p class="text-sm text-amber-900">
                    Nhap bieu thuc theo SymPy hoac mix SymPy + LaTeX. He thong se chuan hoa ve SymPy, va ben duoi la xem truoc theo dang LaTeX.
                </p>

                <div>
                    <h4 class="mb-3 text-sm font-semibold text-gray-800">${exampleTitle}</h4>
                    <div class="grid grid-cols-1 gap-3">${exampleItems.map(buildExampleCard).join('')}</div>
                </div>

                <div>
                    <h4 class="mb-3 text-sm font-semibold text-gray-800">Bang cu phap SymPy thong dung</h4>
                    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                        ${COMMON_REFERENCE_ITEMS.map(buildReferenceCard).join('')}
                    </div>
                </div>

                <div class="rounded-lg border border-amber-100 bg-white p-3 text-sm text-gray-700">
                    <p class="font-semibold text-gray-800">Luu y khi nhap</p>
                    <ul class="mt-2 list-disc space-y-1 pl-5">
                        <li>Neu la he phuong trinh, moi dong la mot bieu thuc rieng.</li>
                        <li>Co the nhap SymPy, LaTeX, hoac mix ca hai trong cung mot dong.</li>
                        <li>Viet luy thua bang <code>**</code> va phep nhan bang <code>*</code>.</li>
                        <li>Cho he nhieu bien, co the dung <code>x1, x2, ...</code> hoac <code>x, y, z</code>.</li>
                        <li>Voi Newton cho he, can nhap dang <code>F(X)=0</code>; voi Lap don, can nhap dang <code>X = phi(X)</code>.</li>
                        <li>Neu dung Lap don cho he, mien xet hoi tu duoc nhap theo hinh cau <code>S(alpha, r)</code>.</li>
                    </ul>
                </div>
            </div>
        </details>
    `;

    container.querySelectorAll('.sympy-reference-preview').forEach((element) => {
        const formula = element.dataset.formula;
        if (!formula) return;

        if (window.katex) {
            try {
                katex.render(formula, element, {
                    throwOnError: false,
                    displayMode: false
                });
                return;
            } catch (_error) {
                // Fall back to plain text below.
            }
        }

        element.textContent = formula;
    });
}
