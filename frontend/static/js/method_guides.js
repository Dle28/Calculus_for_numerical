const formula = (latex) =>
    `<span class="katex-render" data-formula="${latex}"></span>`;

function stripStepPrefix(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/^Bước\s*\d+\s*:\s*/i, '').trim();
}

function renderList(title, items, ordered = false, options = {}) {
    if (!items || items.length === 0) return '';
    const { collapsible = false, open = false, hint = '' } = options;
    const tag = ordered ? 'ol' : 'ul';
    const listClass = ordered
        ? 'space-y-2.5 text-sm text-slate-700'
        : 'list-disc pl-5 space-y-2.5 text-sm leading-7 text-slate-700 marker:text-slate-400';
    const itemsHtml = items
        .map((item, index) => {
            if (!ordered) return `<li>${item}</li>`;
            const cleanItem = stripStepPrefix(item);
            return `
                <li class="rounded-xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm">
                    <div class="flex items-start gap-3">
                        <span class="inline-flex min-w-[72px] items-center justify-center rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                            Bước ${index + 1}
                        </span>
                        <span class="min-w-0 flex-1 leading-7 text-slate-700">${cleanItem}</span>
                    </div>
                </li>
            `;
        })
        .join('');
    const content = `
        <${tag} class="${listClass} mt-3">
            ${itemsHtml}
        </${tag}>
    `;

    if (collapsible) {
        return `
            <details class="rounded-lg border border-slate-200 bg-slate-50 p-4" ${open ? 'open' : ''}>
                <summary class="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                    <span>${title}</span>
                    <span class="text-[11px] font-medium normal-case tracking-normal text-slate-500">${hint || 'Bấm để ẩn/hiện'}</span>
                </summary>
                ${content}
            </details>
        `;
    }

    return `
        <div class="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
            <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">${title}</h4>
            ${content}
        </div>
    `;
}

function renderCard(card) {
    return `
        <article class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <details class="group" ${card.detailsOpen === false ? '' : 'open'}>
                <summary class="list-none cursor-pointer px-5 py-4 [&::-webkit-details-marker]:hidden">
                    <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0">
                            <h3 class="text-xl font-semibold text-slate-900">${card.title}</h3>
                            ${card.summary ? `<p class="mt-2 max-w-4xl text-sm leading-7 text-slate-600">${card.summary}</p>` : ''}
                        </div>
                        <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
                            ${card.badge ? `<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">${card.badge}</span>` : ''}
                            <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">${card.detailsHint || 'Đóng / mở nội dung'}</span>
                        </div>
                    </div>
                </summary>
                <div class="border-t border-slate-100 px-5 py-4">
                    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
                    ${renderList('Lý thuyết', card.theory)}
                    ${renderList(card.algorithmTitle || 'Logic thuật toán', card.algorithm, true)}
                    </div>
                    ${card.notes && card.notes.length > 0 ? `
                        <div class="mt-4 rounded-xl border border-amber-200/80 bg-amber-50 p-4">
                            <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Ghi chú</h4>
                            <ul class="mt-3 list-disc space-y-2.5 pl-5 text-sm leading-7 text-amber-900 marker:text-amber-500">
                                ${card.notes.map((item) => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>` : ''}
                </div>
            </details>
        </article>
    `;
}

function renderPanel(spec) {
    return `
        <section id="method-guide-panel" class="mb-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5">
                <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div class="min-w-0">
                        <h2 class="text-2xl font-semibold text-slate-900">Lý thuyết và thuật toán</h2>
                        ${spec.intro ? `<p class="mt-1 max-w-4xl text-sm leading-7 text-slate-600">${spec.intro}</p>` : ''}
                    </div>
                    ${spec.contextLabel ? `<p class="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">${spec.contextLabel}</p>` : ''}
                </div>
            </div>
            <div class="grid grid-cols-1 gap-4 p-5 ${spec.cards.length > 1 ? '2xl:grid-cols-2' : ''}">
                ${spec.cards.map(renderCard).join('')}
            </div>
        </section>
    `;
}

function renderKatex(root) {
    if (!window.katex || !root) return;
    root.querySelectorAll('.katex-render').forEach((element) => {
        try {
            katex.render(element.dataset.formula, element, {
                throwOnError: false,
                displayMode: false,
            });
        } catch (error) {
            element.textContent = element.dataset.formula;
        }
    });
}

function getActiveTab(root, selector) {
    const active = root.querySelector(`${selector}[aria-selected="true"]`);
    if (active) return active.dataset.tab;
    const first = root.querySelector(selector);
    return first ? first.dataset.tab : null;
}

function getCheckedValue(root, name, fallback = null) {
    return root.querySelector(`input[name="${name}"]:checked`)?.value || fallback;
}

function buildCard(title, summary, theory, algorithm, options = {}) {
    return {
        title,
        summary,
        theory,
        algorithm,
        algorithmTitle: options.algorithmTitle,
        notes: options.notes || [],
        badge: options.badge || '',
        theoryCollapsible: options.theoryCollapsible,
        theoryOpen: options.theoryOpen,
        theoryHint: options.theoryHint,
        detailsOpen: options.detailsOpen,
        detailsHint: options.detailsHint,
    };
}

function rootFindingCards(root) {
    const method = root.querySelector('#nonlinear-method-select')?.value || 'bisection';

    if (method === 'newton') {
        return {
            contextLabel: 'Giải phương trình f(x)=0',
            cards: [
                buildCard(
                    'Phương pháp Newton',
                    `Phương pháp tiếp tuyến thay ${formula(String.raw`f(x)=0`)} bằng tuyến tính cục bộ tại ${formula(String.raw`x_k`)} và cập nhật theo ${formula(String.raw`x_{k+1}=x_k-\frac{f(x_k)}{f'(x_k)}`)}.`,
                    [
                        `Theo PDF, trên đoạn làm việc cần dùng các hằng số ${formula(String.raw`m_1=\min_{x\in[a,b]}|f'(x)|`)}` + ' và ' + `${formula(String.raw`M_2=\max_{x\in[a,b]}|f''(x)|`)}` + ' để đánh giá sai số.',
                        `Điểm khởi tạo được chọn theo quy tắc ${formula(String.raw`f(a)f''(a)>0 \Rightarrow x_0=a`)}` + ', ngược lại lấy ' + `${formula(String.raw`x_0=b`)}` + '.',
                        `Hai công thức sai số thường dùng là ${formula(String.raw`|x_n-\alpha|\le \frac{|f(x_n)|}{m_1}`)}` + ' và ' + `${formula(String.raw`|x_n-\alpha|\le \frac{M_2}{2m_1}|x_n-x_{n-1}|^2`)}` + '.',
                        'Newton có tốc độ hội tụ bậc hai khi giả thiết trơn thỏa mãn nên sai số phương pháp thường giảm rất nhanh chỉ sau vài bước.',
                        `Ngoài khoảng cách ly ${formula(String.raw`[a,b]`)}, cần kiểm tra ${formula(String.raw`f'(x), f''(x)`)}` + ' không đổi dấu trên đoạn để bám đúng logic thuật toán trong tài liệu.',
                    ],
                    [
                        `Bước 1: Kiểm tra ${formula(String.raw`f(a)f(b)<0`)}` + ' và xác nhận ' + `${formula(String.raw`f'(x),f''(x)`)}` + ' không đổi dấu trên đoạn làm việc.',
                        `Bước 2: Tính ${formula(String.raw`m_1, M_2`)}` + ' trên đoạn ' + `${formula(String.raw`[a,b]`)}` + ' và chọn điểm đầu theo quy tắc dấu ' + `${formula(String.raw`f(a)f''(a)`)}` + '.',
                        `Bước 3: Lặp theo công thức ${formula(String.raw`x_{k+1}=x_k-\frac{f(x_k)}{f'(x_k)}`)}.`,
                        `Bước 4: Sau mỗi vòng, đánh giá sai số theo ${formula(String.raw`\frac{|f(x_k)|}{m_1}`)}` + ' hoặc theo ' + `${formula(String.raw`\frac{M_2}{2m_1}|x_k-x_{k-1}|^2`)}` + '.',
                        'Bước 5: Nếu có làm tròn đến l chữ số thập phân, cộng thêm phần sai số làm tròn cỡ nửa đơn vị ở chữ số cuối như trong PDF.',
                        'Bước 6: Dừng khi đạt ngưỡng sai số tuyệt đối, sai số tương đối hoặc đủ số lần lặp; nghiệm gần đúng là giá trị mới nhất.',
                    ],
                    {
                        notes: [
                            'Theo tài liệu PDF, nên ưu tiên công thức dựa trên hai lần lặp liên tiếp vì phản ánh đúng đặc trưng hội tụ nhanh của Newton.',
                        ],
                    }
                ),
            ],
        };
    }

    if (method === 'secant') {
        return {
            contextLabel: 'Giải phương trình f(x)=0',
            cards: [
                buildCard(
                    'Phương pháp Dây Cung',
                    `Phương pháp dây cung dùng đường thẳng qua hai điểm gần nhất trên đồ thị để xấp xỉ nghiệm, không cần tính trực tiếp ${formula(String.raw`f'(x)`)}`,
                    [
                        `Thuật toán trong PDF giữ một điểm mốc ${formula(String.raw`mrk`)}` + ' và cập nhật điểm lặp theo công thức dây cung.',
                        `Công thức lõi là ${formula(String.raw`x_{i+1}=\frac{mrk\cdot f(x_i)-x_i\cdot f(mrk)}{f(x_i)-f(mrk)}`)}.`,
                        `Sai số được ước lượng bởi ${formula(String.raw`|x_{i+1}-x^\*|\le \frac{|f(x_{i+1})|}{m_1}`)}` + ' với ' + `${formula(String.raw`m_1=\min_{x\in[a,b]}|f'(x)|`)}` + '.',
                        'Phương pháp thường nhanh hơn chia đôi nhưng kém ổn định hơn Newton khi hai giá trị hàm ở mẫu số quá gần nhau.',
                        'Hai điểm đầu phải thuộc khoảng cách ly để việc cập nhật mốc theo dấu vẫn giữ được logic kẹp nghiệm của thuật toán.',
                    ],
                    [
                        `Bước 1: Tính ${formula(String.raw`m_1=\min_{x\in[a,b]}|f'(x)|`)}` + ' và kiểm tra ' + `${formula(String.raw`f(a)f(b)<0`)}` + ' để xác nhận đây là khoảng cách ly.',
                        `Bước 2: Khởi tạo ${formula(String.raw`x=a`)}` + ' và ' + `${formula(String.raw`mrk=b`)}` + ' như trong tài liệu.',
                        `Bước 3: Tính ${formula(String.raw`x_{i+1}`)}` + ' theo công thức dây cung, rồi lưu ' + `${formula(String.raw`f(x_{i+1})`)}` + ' và ' + `${formula(String.raw`\delta_x=\frac{|f(x_{i+1})|}{m_1}`)}` + '.',
                        `Bước 4: Cập nhật mốc theo dấu: nếu ${formula(String.raw`f(a)f(x_{i+1})<0`)}` + ' thì giữ phía a, ngược lại giữ phía b.',
                        'Bước 5: Lặp đến khi đạt sai số yêu cầu hoặc đủ số bước; nếu có làm tròn thì cộng thêm sai số làm tròn ở chữ số cuối.',
                    ],
                    {
                        notes: [
                            'Nếu mẫu số rất nhỏ thì bước dây cung dễ mất ổn định; khi đó nên đổi điểm đầu hoặc quay về chia đôi.',
                        ],
                    }
                ),
            ],
        };
    }

    if (method === 'simple_iteration') {
        return {
            contextLabel: 'Giải phương trình f(x)=0',
            cards: [
                buildCard(
                    'Phương pháp Lặp Đơn',
                    `Ta đưa phương trình về dạng ${formula(String.raw`x=\varphi(x)`)} rồi sinh dãy ${formula(String.raw`x_{k+1}=\varphi(x_k)`)}.`,
                    [
                        `Điều kiện co chuẩn trong tài liệu là ${formula(String.raw`q=\max_{x\in[a,b]}|\varphi'(x)|<1`)}` + ' cùng với điều kiện ổn định ánh xạ trên đoạn làm việc.',
                        `Sai số hậu nghiệm thường dùng là ${formula(String.raw`|x^\*-x_k|\le \frac{q}{1-q}|x_k-x_{k-1}|`)}` + ', còn dạng tiên nghiệm cho phép dự báo số bước trước khi lặp.',
                        `Nếu biết ${formula(String.raw`x_1=\varphi(x_0)`)}` + ', có thể ước lượng trước số vòng lặp bởi ' + `${formula(String.raw`n \ge \frac{\ln\left(\varepsilon(1-q)/|x_1-x_0|\right)}{\ln q}+1`)}` + '.',
                        `Ngoài điều kiện co, thường còn cần ${formula(String.raw`\varphi([a,b])\subset[a,b]`)}` + ' để dãy lặp không rời khỏi miền đang xét.',
                        'Chất lượng của phép đổi từ f(x)=0 sang x=φ(x) quyết định gần như toàn bộ việc phương pháp có hội tụ hay không.',
                    ],
                    [
                        `Bước 1: Kiểm tra ${formula(String.raw`\varphi([a,b])\subset[a,b]`)}` + ' và tính ' + `${formula(String.raw`q=\max_{x\in[a,b]}|\varphi'(x)|`)}` + '; nếu ' + `${formula(String.raw`q\ge 1`)}` + ' thì dừng.',
                        `Bước 2: Chọn ${formula(String.raw`x_0\in[a,b]`)}` + ' và tính lần lượt ' + `${formula(String.raw`x_i=\varphi(x_{i-1})`)}` + '.',
                        `Bước 3: Nếu dùng hậu nghiệm, dừng khi ${formula(String.raw`|x_i-x_{i-1}|<\frac{1-q}{q}\varepsilon`)}` + '.',
                        `Bước 4: Nếu muốn biết trước số bước, dùng công thức tiên nghiệm với ${formula(String.raw`x_1-x_0`)}` + ' để tính n rồi lặp đúng n bước.',
                        'Bước 5: Trả về xấp xỉ cuối cùng và đọc sai số theo công thức tiên nghiệm hoặc hậu nghiệm tương ứng.',
                    ],
                    {
                        notes: [
                            'Theo Algorithm 6 và 7 trong PDF, có thể đánh giá số bước trước bằng tiên nghiệm hoặc dừng trực tiếp theo hậu nghiệm.',
                        ],
                    }
                ),
            ],
        };
    }

    return {
        contextLabel: 'Giải phương trình f(x)=0',
        cards: [
            buildCard(
                'Phương pháp Chia Đôi',
                `Chia đôi là phương pháp khép kín dựa trên tính liên tục: nếu ${formula(String.raw`f(a)f(b)<0`)} thì tồn tại ít nhất một nghiệm trong ${formula(String.raw`[a,b]`)}.`,
                [
                    `Theo PDF, hai công thức sai số cốt lõi là tiên nghiệm ${formula(String.raw`|x_n-\alpha|\le \frac{|b-a|}{2^n}`)}` + ' và hậu nghiệm ' + `${formula(String.raw`|x_n-\alpha|\le |x_n-x_{n-1}|`)}` + '.',
                    `Nếu biết trước sai số mục tiêu ${formula(String.raw`\varepsilon`)}` + ', số bước có thể chọn bằng ' + `${formula(String.raw`n=\left\lceil \log_2\frac{b-a}{\varepsilon}\right\rceil+1`)}` + '.',
                    `Mỗi bước đều dùng trung điểm ${formula(String.raw`x_{i+1}=\frac{a_i+b_i}{2}`)}` + ' nên độ dài khoảng bị chia đôi một cách đơn điệu.',
                    'Phương pháp chậm hơn Newton hay dây cung nhưng rất ổn định vì luôn bảo toàn khoảng chứa nghiệm.',
                    'Giả thiết cốt lõi là hàm liên tục trên đoạn; nếu mất liên tục thì dấu ở hai đầu không còn đảm bảo có nghiệm ở giữa.',
                ],
                [
                    `Bước 1: Tính ${formula(String.raw`f(a), f(b)`)}` + '; nếu một đầu mút cho giá trị 0 thì trả về ngay, còn nếu ' + `${formula(String.raw`f(a)f(b)>0`)}` + ' thì kết luận không phải khoảng cách ly.',
                    `Bước 2: Nếu người dùng cho sai số ${formula(String.raw`\varepsilon`)}` + ', tính trước số bước n theo công thức log ở phần lý thuyết.',
                    `Bước 3: Ở mỗi vòng lặp, tính trung điểm ${formula(String.raw`x_{i+1}=\frac{a_i+b_i}{2}`)}` + ' và giá trị ' + `${formula(String.raw`f(x_{i+1})`)}` + '.',
                    `Bước 4: Nếu ${formula(String.raw`f(x_{i+1})f(a_i)<0`)}` + ' thì cập nhật ' + `${formula(String.raw`b_{i+1}=x_{i+1}`)}` + ', ngược lại cập nhật ' + `${formula(String.raw`a_{i+1}=x_{i+1}`)}` + '.',
                    'Bước 5: Báo sai số theo công thức tiên nghiệm hoặc hậu nghiệm và dừng khi đạt ngưỡng hoặc đủ số bước.',
                ],
                {
                    notes: [
                        'Trong tài liệu PDF, chia đôi được trình bày theo cả tiên nghiệm, hậu nghiệm và chế độ biết trước số bước lặp.',
                    ],
                }
            ),
        ],
    };
}

function nonlinearSystemCards(root) {
    const method = root.querySelector('#ns-method-select')?.value || 'newton';

    if (method === 'newton_modified') {
        return {
            contextLabel: 'Giải hệ phương trình phi tuyến',
            cards: [
                buildCard(
                    'Newton Cải Tiến',
                    `Newton cải tiến giữ cố định ma trận Jacobi tại điểm đầu ${formula(String.raw`J_F(X_0)`)} để tránh phải nghịch đảo lại sau mỗi bước.`,
                    [
                        `Công thức lặp là ${formula(String.raw`X_{k+1}=X_k-J_F(X_0)^{-1}F(X_k)`)}` + ', tức chỉ tính Jacobi một lần tại điểm đầu.',
                        'Chi phí mỗi vòng lặp thấp hơn Newton chuẩn, nhưng tốc độ hội tụ thường giảm khi đi xa điểm đầu.',
                        'Phương pháp đặc biệt hữu ích khi việc tính và phân rã Jacobi tốn kém.',
                        'Sau khi cố định Jacobi, phương pháp thường chỉ còn hội tụ tuyến tính hoặc siêu tuyến tính yếu hơn Newton chuẩn.',
                    ],
                    [
                        `Bước 1: Tính ${formula(String.raw`J_F(X_0)`)}` + ' và kiểm tra ma trận này khả nghịch.',
                        'Bước 2: Phân rã trước ma trận Jacobi cố định để có thể tái sử dụng ở mọi vòng lặp.',
                        `Bước 3: Lặp ${formula(String.raw`X^{(k+1)}=X^{(k)}-J_F(X_0)^{-1}F(X^{(k)})`)}.`,
                        'Bước 4: Theo dõi chuẩn của bước hiệu chỉnh và chuẩn của vector dư để phát hiện trường hợp chững lại.',
                        'Bước 5: Dừng khi đạt sai số tuyệt đối, sai số tương đối hoặc đủ số vòng lặp.',
                    ],
                    {
                        notes: [
                            'Nếu điểm đầu quá xa nghiệm, việc cố định Jacobi có thể làm phương pháp chậm hoặc mất hội tụ.',
                        ],
                    }
                ),
            ],
        };
    }

    if (method === 'simple_iteration') {
        return {
            contextLabel: 'Giải hệ phương trình phi tuyến',
            cards: [
                buildCard(
                    'Lặp Đơn Cho Hệ Phi Tuyến',
                    `Ta viết hệ dưới dạng ${formula(String.raw`X=\Phi(X)`)} và kiểm tra hệ số co từ ma trận Jacobi ${formula(String.raw`J_\Phi(X)`)}`,
                    [
                        `Theo PDF, cần kiểm tra đồng thời ${formula(String.raw`\Phi(D)\subset D`)}` + ' và hệ số co ' + `${formula(String.raw`q=\|J_\Phi(X)\|_p<1`)}` + ' trên miền khảo sát.',
                        `Sai số hậu nghiệm của hệ có dạng ${formula(String.raw`\|X^\*-X_k\|_p\le \frac{q}{1-q}\|X_k-X_{k-1}\|_p`)}` + '.',
                        `Với tiêu chuẩn tương đối, tài liệu dùng ${formula(String.raw`\delta^{(k+1)}=\frac{\|X^{(k+1)}-X^{(k)}\|_p}{\|X^{(k+1)}\|_p+\eta}`)}` + ' với ' + `${formula(String.raw`\eta=10^{-15}`)}` + ' để tránh chia cho 0.',
                        `Trong giao diện, ${formula(String.raw`K_\infty`)}` + ' được lấy từ tổng trị tuyệt đối theo hàng, còn ' + `${formula(String.raw`K_1`)}` + ' được lấy từ tổng trị tuyệt đối theo cột.',
                    ],
                    [
                        `Bước 1: Kiểm tra ${formula(String.raw`\Phi(D)\subset D`)}` + ' và tính hệ số co ' + `${formula(String.raw`q`)}` + ' theo chuẩn người dùng chọn.',
                        `Bước 2: Khởi tạo ${formula(String.raw`X^{(0)}=X_0`)}` + ' với ' + `${formula(String.raw`X_0\in D`)}` + '.',
                        `Bước 3: Lặp ${formula(String.raw`X^{(k+1)}=\Phi(X^{(k)})`)}` + ' và tính ' + `${formula(String.raw`d^{(k+1)}=X^{(k+1)}-X^{(k)}`)}` + '.',
                        `Bước 4: Nếu dùng sai số tuyệt đối, dừng khi ${formula(String.raw`\|d^{(k+1)}\|_p<\frac{1-q}{q}\varepsilon`)}` + '; nếu dùng sai số tương đối, so sánh ' + `${formula(String.raw`\delta^{(k+1)}`)}` + ' với ngưỡng tương ứng.',
                        `Bước 5: Nếu ${formula(String.raw`i>N_0`)}` + ' thì kết luận thuật toán không hội tụ với điểm đầu hiện tại.',
                    ],
                    {
                        notes: [
                            'Phần hiển thị kết quả của ứng dụng bây giờ bám đúng logic này: hiện các tổng hàng hoặc cột cuối cùng theo chuẩn được chọn, không hiển thị một “ma trận sau khi lấy max” mơ hồ nữa.',
                        ],
                    }
                ),
            ],
        };
    }

    return {
        contextLabel: 'Giải hệ phương trình phi tuyến',
        cards: [
            buildCard(
                'Newton Cho Hệ Phi Tuyến',
                `Newton tuyến tính hóa hệ ${formula(String.raw`F(X)=0`)} quanh ${formula(String.raw`X_k`)} bằng ma trận Jacobi ${formula(String.raw`J_F(X_k)`)}`,
                [
                    `Ma trận Jacobi được lập theo ${formula(String.raw`J_F(X)=\left[\frac{\partial F_i}{\partial x_j}(X)\right]`)}` + ' như trong thuật toán 14 của PDF.',
                    `Bước hiệu chỉnh ${formula(String.raw`\Delta X_k`)}` + ' thỏa ' + `${formula(String.raw`J_F(X_k)\Delta X_k=-F(X_k)`)}` + ', tương đương ' + `${formula(String.raw`X_{k+1}=X_k-J_F(X_k)^{-1}F(X_k)`)}` + '.',
                    'Nếu Jacobi khả nghịch và điểm đầu đủ gần nghiệm đơn, phương pháp có hội tụ rất nhanh.',
                    'Về mặt số học, ta không nên tính nghịch đảo Jacobi tường minh mà nên giải hệ tuyến tính cho bước hiệu chỉnh ở mỗi vòng lặp.',
                ],
                [
                    'Bước 1: Từ hệ phương trình đầu vào, lập vector hàm và ma trận Jacobi đầy đủ.',
                    `Bước 2: Tại vòng lặp k, nếu ${formula(String.raw`\det J_F(X_k)=0`)}` + ' thì dừng vì Jacobi suy biến.',
                    `Bước 3: Giải hệ tuyến tính ${formula(String.raw`J_F(X_k)\Delta X_k=-F(X_k)`)}` + ' rồi cập nhật ' + `${formula(String.raw`X_{k+1}=X_k+\Delta X_k`)}` + '.',
                    'Bước 4: Kiểm tra thêm điều kiện dừng theo phần dư hoặc theo sai khác hai nghiệm liên tiếp.',
                    'Bước 5: Nếu vượt quá số vòng lặp tối đa thì kết luận chưa hội tụ với điểm đầu hiện tại.',
                ],
                {
                    notes: [
                        'Nếu ma trận Jacobi suy biến ở một vòng lặp, thuật toán phải dừng vì không thể xác định bước Newton.',
                    ],
                }
            ),
        ],
    };
}

function directLinearCards() {
    return {
        contextLabel: 'Giải hệ phương trình tuyến tính',
        cards: [
            buildCard(
                'Khử Gauss',
                `Khử Gauss biến ma trận mở rộng ${formula(String.raw`[A|B]`)} về dạng tam giác trên rồi giải lùi.`,
                [
                    `Theo thuật toán 16 trong PDF, trước hết lập ma trận mở rộng ${formula(String.raw`AB=[A|B]`)}` + ' rồi chuẩn hóa các số rất nhỏ về 0.',
                    `Mỗi hàng được gắn một chỉ số pivot ${formula(String.raw`index[i]`)}` + ' là cột đầu tiên chứa phần tử khác 0; việc sắp xếp theo index giúp khử và biện luận nghiệm rõ ràng hơn.',
                    'Sau quá trình khử thuận, hệ có thể rơi vào ba trường hợp: vô nghiệm, nghiệm duy nhất hoặc vô số nghiệm do có ẩn tự do.',
                    `Khi có ẩn tự do, tài liệu chuyển các cột tự do sang vế phải theo dạng ${formula(String.raw`B'=B'-A_{\text{free}}x_{\text{free}}`)}` + ' trước khi thế ngược.',
                ],
                [
                    `Bước 1: Lập ${formula(String.raw`AB=[A|B]`)}` + ' và gán mọi phần tử rất nhỏ về 0 theo ngưỡng ε.',
                    `Bước 2: Với mỗi hàng, xác định ${formula(String.raw`index[i]`)}` + ' là cột khác 0 đầu tiên; hàng toàn 0 được gán chỉ số đặc biệt.',
                    'Bước 3: Sắp xếp các hàng theo thứ tự tăng dần của index rồi thực hiện khử Gauss theo từng pivot.',
                    'Bước 4: Sau mỗi bước khử, cập nhật lại index, chuẩn hóa số nhỏ và kiểm tra hàng mâu thuẫn dạng [0 ... 0 | b], b ≠ 0.',
                    'Bước 5: Nếu có ẩn tự do thì tách cột pivot/cột tự do, sau đó thế ngược trên hệ rút gọn để lấy nghiệm cơ sở.',
                ]
            ),
            buildCard(
                'Gauss-Jordan',
                `Gauss-Jordan tiếp tục từ khử Gauss để đưa ma trận về dạng bậc thang rút gọn ${formula(String.raw`\operatorname{RREF}`)}`,
                [
                    `Thuật toán 18-20 trong PDF chọn pivot theo ưu tiên phần tử gần 1 trước, nếu không có thì chọn phần tử có trị tuyệt đối lớn hơn để tăng ổn định.`,
                    `Sau khi chuẩn hóa pivot và khử cả trên lẫn dưới, ma trận mở rộng tiến về ${formula(String.raw`\operatorname{RREF}`)}` + ' nên có thể đọc nghiệm trực tiếp.',
                    `Nếu ${formula(String.raw`A`)} khả nghịch thì ${formula(String.raw`[A|B]\to[I|X]`)}` + ', còn khi tính nghịch đảo thì ' + `${formula(String.raw`[A|I]\to[I|A^{-1}]`)}` + '.',
                    'Dạng RREF giúp nhìn trực tiếp các cột trụ, biến tự do và cấu trúc của không gian nghiệm nếu hệ không xác định duy nhất.',
                ],
                [
                    'Bước 1: Lập ma trận mở rộng và chuẩn hóa các phần tử có trị tuyệt đối nhỏ hơn ε về 0.',
                    'Bước 2: Trong tập hàng/cột chưa dùng, chọn pivot tốt nhất, hoán vị nếu cần và đưa pivot về 1.',
                    'Bước 3: Khử toàn bộ các hàng còn lại trên cả phía trên lẫn phía dưới pivot.',
                    'Bước 4: Cập nhật tập hàng/cột đã dùng rồi tiếp tục cho đến khi không còn pivot khác 0.',
                    'Bước 5: Từ ma trận RREF cuối cùng, kết luận vô nghiệm, nghiệm duy nhất hoặc biểu diễn nghiệm tổng quát theo ẩn tự do.',
                ]
            ),
            buildCard(
                'Phân Rã LU',
                `LU tách ma trận thành ${formula(String.raw`PA=LU`)}, trong đó ${formula(String.raw`L`)} tam giác dưới và ${formula(String.raw`U`)} tam giác trên.`,
                [
                    `Thuật toán Doolittle trong PDF xây dần một cột của ${formula(String.raw`L`)}` + ' và một hàng của ' + `${formula(String.raw`U`)}` + ' ở mỗi bước.',
                    `Công thức phân rã được viết dưới dạng ${formula(String.raw`l_{ik}=a_{ik}^{(k)}-\sum_{t=0}^{k-1}l_{it}u_{tk}`)}` + ' và ' + `${formula(String.raw`u_{kj}=\frac{a_{kj}^{(k)}-\sum_{t=0}^{k-1}l_{kt}u_{tj}}{l_{kk}}`)}` + '.',
                    'Sau khi phân rã xong, nhiều vế phải khác nhau chỉ cần giải hai hệ tam giác nên rất hiệu quả.',
                    `Bài toán ${formula(String.raw`AX=B`)}` + ' được đổi thành ' + `${formula(String.raw`LY=PB`)}` + ' rồi ' + `${formula(String.raw`UX=Y`)}` + '.',
                    'Nếu xuất hiện pivot xấu, cần hoán vị hàng và đưa vào ma trận P.',
                ],
                [
                    'Bước 1: Kiểm tra A là ma trận vuông và chuẩn bị Awork, P, L, U như trong tài liệu.',
                    'Bước 2: Với mỗi k, tính cột k của L; nếu cần thì chọn hàng có phần tử lớn nhất để hoán vị.',
                    'Bước 3: Từ pivot hiện tại, tính tiếp hàng k của U theo công thức Doolittle.',
                    `Bước 4: Khi đã có ${formula(String.raw`P,L,U`)}` + ', giải ' + `${formula(String.raw`LY=PB`)}` + ' rồi ' + `${formula(String.raw`UX=Y`)}` + ' để thu nghiệm.',
                    'Bước 5: Nếu có nhiều vế phải, tái sử dụng cùng một phân rã LU và chỉ lặp lại hai bước giải tam giác.',
                ]
            ),
            buildCard(
                'Cholesky Mở Rộng',
                `Trong ứng dụng này, hệ được kiểm tra trực tiếp theo dạng ${formula(String.raw`A=Q^TQ`)} trước. Nếu không thỏa thì giao diện ghi rõ lý do; riêng khi chỉ gặp ${formula(String.raw`\sqrt{\text{so am}}`)} thì thuật toán tiếp tục trong số phức.`,
                [
                    `Khung thuật toán trong PDF dùng ma trận làm việc ${formula(String.raw`A_{\text{input}}`)}` + ': nếu A không vuông thì cần chọn ma trận chuẩn tắc phù hợp, thường là ' + `${formula(String.raw`A^TA`)}` + ' khi ' + `${formula(String.raw`m \ge n`)}` + ' và ' + `${formula(String.raw`AA^T`)}` + ' khi ' + `${formula(String.raw`m < n`)}` + '.',
                    `Ứng dụng hiện tại mở rộng bước này: luôn thử trực tiếp ${formula(String.raw`A=Q^TQ`)}` + ' trước, và chỉ khi A không đối xứng mới chuyển sang ma trận chuẩn tắc.',
                    `Đường chéo của ${formula(String.raw`Q`)} được tính theo ${formula(String.raw`q_{ii}=\sqrt{m_{ii}-\sum_{k=1}^{i-1}q_{ki}^2}`)}` + ' như đúng công thức Cholesky tam giác trên trong tài liệu.',
                    `Nếu biểu thức dưới căn âm thì ${formula(String.raw`q_{ii}`)} trở thành số phức, ví dụ ${formula(String.raw`\sqrt{-a}=i\sqrt{a}`)} với ${formula(String.raw`a>0`)}` + '; đây là phần mở rộng thêm ngoài khung thực trong PDF.',
                    `Sau khi có ${formula(String.raw`Q`)}, bài toán giải hệ được đưa về ${formula(String.raw`Q^Ty=d`)}` + ' rồi ' + `${formula(String.raw`Qx=y`)}` + '.',
                ],
                [
                    'Bước 1: Kiểm tra A có vuông hay không và thử phân rã trực tiếp trên A trước.',
                    `Bước 2: Nếu A không thỏa trực tiếp, chọn ma trận làm việc ${formula(String.raw`M`)}` + ' theo kích thước của A: dùng ' + `${formula(String.raw`M=A^TA,\ d=A^Tb`)}` + ' khi ' + `${formula(String.raw`m \ge n`)}` + ', còn khi ' + `${formula(String.raw`m<n`)}` + ' thì dùng hệ đối ngẫu ' + `${formula(String.raw`M=AA^T,\ M\lambda=b,\ x=A^T\lambda`)}` + '.',
                    `Bước 3: Với từng hàng ${formula(String.raw`i`)}, tính ${formula(String.raw`q_{ii}`)}` + ' từ phần tử chéo hiệu dụng.',
                    `Bước 4: Với ${formula(String.raw`j>i`)}` + ', tính ' + `${formula(String.raw`q_{ij}=\frac{m_{ij}-\sum_{k=1}^{i-1}q_{ki}q_{kj}}{q_{ii}}`)}` + '.',
                    `Bước 5: Nếu ${formula(String.raw`q_{ii}\approx 0`)}` + ' thì dừng và ghi rõ vì sao phép phân rã kiểu Cholesky không tiếp tục được.',
                    `Bước 6: Giải lần lượt ${formula(String.raw`Q^Ty=d`)}` + ' và ' + `${formula(String.raw`Qx=y`)}` + ' để thu nghiệm cuối.',
                ],
                {
                    notes: [
                        `Ví dụ ${formula(String.raw`A=[-1]`)} cho ${formula(String.raw`Q=[i]`)} vì ${formula(String.raw`Q^TQ=i^2=-1`)}`,
                        'Không phải mọi ma trận không xác định dương đều đi được hết bằng Cholesky không pivoting; nếu gặp phần tử chéo hiệu dụng bằng 0 thì phải dừng.',
                        'Với ma trận không vuông, nhánh m > n cho nghiệm bình phương tối thiểu; nhánh m < n cho một nghiệm riêng có chuẩn nhỏ nhất rồi ghép với Null(A) để mô tả họ nghiệm.',
                    ],
                }
            ),
        ],
    };
}

function iterativeLinearCards(root) {
    const activeTab = getActiveTab(root, '.iter-hpt-tab');

    if (activeTab === 'simple-iteration') {
        return {
            contextLabel: 'Giải hệ tuyến tính bằng phương pháp lặp',
            cards: [
                buildCard(
                    'Lặp Đơn Tuyến Tính',
                    `Ta đưa hệ về dạng điểm bất động ${formula(String.raw`X=BX+d`)} và lặp ${formula(String.raw`X^{(k+1)}=BX^{(k)}+d`)}`,
                    [
                        `Điều kiện hội tụ cơ bản là ${formula(String.raw`q=\|B\|<1`)}, với chuẩn 1 hoặc chuẩn vô cùng tùy lựa chọn.`,
                        `Sai số hậu nghiệm được chặn bởi ${formula(String.raw`\|X^\*-X_k\|\le \frac{q}{1-q}\|X_k-X_{k-1}\|`)}`,
                        'Ưu điểm là đơn giản và dễ cài đặt; nhược điểm là cần biến đổi hệ để ma trận lặp có chuẩn nhỏ hơn 1.',
                        `Điều kiện chính xác hơn là ${formula(String.raw`\rho(B)<1`)}` + '; dùng chuẩn chỉ là cách đủ để kiểm tra nhanh hội tụ trong thực hành.',
                        'Việc chọn tách hệ hay tiền xử lý để sinh B tốt là phần khó nhất của phương pháp này.',
                    ],
                    [
                        `Xây dựng ${formula(String.raw`B`)} và ${formula(String.raw`d`)}, sau đó chọn chuẩn dùng để đánh giá ${formula(String.raw`\|B\|`)}`,
                        `Khởi tạo ${formula(String.raw`X^{(0)}`)} và tính ${formula(String.raw`X^{(k+1)}=BX^{(k)}+d`)}`,
                        'Sau mỗi bước, tính sai số theo chuẩn đã chọn và đối chiếu với ngưỡng dừng.',
                        'Nếu đã có q, có thể ước lượng trước số vòng lặp cần thiết bằng công thức tiên nghiệm.',
                        'Khi đạt sai số hoặc đủ số lần lặp, trả về nghiệm gần đúng cuối cùng.',
                    ]
                ),
            ],
        };
    }

    return {
        contextLabel: 'Giải hệ tuyến tính bằng phương pháp lặp',
        cards: [
            buildCard(
                'Jacobi',
                `Tách ${formula(String.raw`A=D+L+U`)} rồi lặp theo ${formula(String.raw`X^{(k+1)}=D^{-1}(b-(L+U)X^{(k)})`)}`,
                [
                    'Mỗi ẩn ở bước mới chỉ dùng các giá trị của bước cũ, nên Jacobi dễ song song hóa.',
                    'Hội tụ thường được đảm bảo tốt khi ma trận chéo trội theo hàng hoặc theo cột.',
                    'So với Gauss-Seidel, Jacobi ổn định trong cài đặt nhưng thường chậm hơn.',
                    `Ma trận lặp của Jacobi là ${formula(String.raw`B_J=-D^{-1}(L+U)`)}` + '; điều kiện gốc vẫn là ' + `${formula(String.raw`\rho(B_J)<1`)}`,
                    'Đường chéo của A phải không chứa phần tử 0 vì mỗi bước đều cần chia cho các phần tử chéo.',
                ],
                [
                    'Tách A thành phần chéo, tam giác dưới và tam giác trên.',
                    'Từ X0, cập nhật đồng thời toàn bộ các thành phần của X mới.',
                    'Tính sai số giữa hai lần lặp liên tiếp.',
                    'Có thể kiểm tra thêm chuẩn của phần dư b-AXk để đánh giá chất lượng nghiệm gần đúng.',
                    'Dừng khi đạt ngưỡng hoặc đạt số lần lặp tối đa.',
                ]
            ),
            buildCard(
                'Gauss-Seidel',
                `Gauss-Seidel dùng ngay các giá trị mới vừa tính trong cùng vòng lặp qua công thức ${formula(String.raw`(D+L)X^{(k+1)}=b-UX^{(k)}`)}`,
                [
                    'Do tận dụng thông tin mới, Gauss-Seidel thường hội tụ nhanh hơn Jacobi trên cùng hệ.',
                    'Phương pháp vẫn cần điều kiện hội tụ phù hợp, phổ biến nhất là chéo trội hoặc ma trận xác định dương.',
                    'Thứ tự cập nhật ảnh hưởng trực tiếp đến quỹ đạo lặp.',
                    `Ma trận lặp có thể viết là ${formula(String.raw`B_{GS}=-(D+L)^{-1}U`)}` + ', nên mỗi vòng thực chất là một phép giải tam giác dưới.',
                    'Vì dùng giá trị mới ngay lập tức, Gauss-Seidel khó song song hóa hơn Jacobi nhưng thường giảm số vòng lặp đáng kể.',
                ],
                [
                    'Tách ma trận và viết lại hệ theo dạng tam giác dưới khả giải tiến.',
                    'Từ X0, lần lượt cập nhật từng ẩn bằng giá trị mới nhất đang có.',
                    'Đánh giá sai số sau khi hoàn tất một vòng lặp.',
                    'Có thể kèm theo kiểm tra phần dư để biết nghiệm gần đúng đã thực sự thỏa hệ đến mức nào.',
                    'Dừng khi đạt sai số hoặc chạm giới hạn số vòng lặp.',
                ]
            ),
        ],
    };
}

function inverseDirectCards() {
    return {
        contextLabel: 'Tính ma trận nghịch đảo',
        cards: [
            buildCard(
                'Gauss-Jordan Tìm Nghịch Đảo',
                `Dựa trên phép biến đổi ${formula(String.raw`[A|I]\to[I|A^{-1}]`)}, nên chỉ áp dụng khi ${formula(String.raw`A`)} vuông và khả nghịch.`,
                [
                    'Các phép biến đổi sơ cấp trên hàng biến đổi đồng thời cả A và ma trận đơn vị I.',
                    'Nếu gặp pivot bằng 0 mà không hoán vị được, ma trận không khả nghịch.',
                    'Đây là cách trực tiếp nhất để thấy cấu trúc nghịch đảo.',
                    'Ưu điểm là ý tưởng rõ ràng; nhược điểm là số phép khử khá lớn và sai số làm tròn có thể tích lũy nếu ma trận kém điều kiện.',
                ],
                [
                    `Ghép ma trận mở rộng ${formula(String.raw`[A|I]`)}`,
                    'Chọn pivot, chuẩn hóa hàng pivot và khử các phần tử còn lại trong cột.',
                    'Lặp lại cho mọi cột đến khi phần trái thành ma trận đơn vị.',
                    `Đọc ${formula(String.raw`A^{-1}`)} từ phần phải của ma trận mở rộng.`,
                    'Có thể kiểm tra lại bằng phép nhân A·A⁻¹ để xác nhận kết quả gần ma trận đơn vị.',
                ]
            ),
            buildCard(
                'LU Tìm Nghịch Đảo',
                `Sau khi có ${formula(String.raw`PA=LU`)}, nghịch đảo được dựng bằng cách giải ${formula(String.raw`AX=e_i`)} cho từng cột chuẩn ${formula(String.raw`e_i`)}`,
                [
                    'Một lần phân rã LU có thể tái sử dụng cho mọi vế phải nên rất phù hợp cho bài toán nghịch đảo.',
                    `Mỗi cột ${formula(String.raw`x_i`)} của ${formula(String.raw`A^{-1}`)} là nghiệm của ${formula(String.raw`Ax_i=e_i`)}`,
                    'Phương pháp thường ổn định hơn tính nghịch đảo trực tiếp bằng công thức đại số.',
                    'Nếu dùng pivoting từng phần, ma trận hoán vị P giúp tránh chia cho pivot xấu và cải thiện ổn định số học.',
                ],
                [
                    `Phân rã ${formula(String.raw`PA=LU`)}`,
                    `Với từng ${formula(String.raw`e_i`)}, giải ${formula(String.raw`Ly=Pe_i`)}`,
                    `Giải tiếp ${formula(String.raw`Ux_i=y`)}`,
                    `Ghép các cột ${formula(String.raw`x_i`)} để thu được ${formula(String.raw`A^{-1}`)}`,
                    'Do cùng dùng chung P, L, U, chi phí chính nằm ở một lần phân rã ban đầu và nhiều lần thế tiến/thế lùi ngắn gọn.',
                ]
            ),
            buildCard(
                'Cholesky Tìm Nghịch Đảo',
                `Nếu ma trận làm việc thỏa điều kiện của Cholesky, ta giải nhiều hệ tam giác thay vì đảo trực tiếp.`,
                [
                    `Nếu ${formula(String.raw`A`)} đối xứng xác định dương thì có thể phân rã trực tiếp ${formula(String.raw`A=U^TU`)}`,
                    `Nếu ${formula(String.raw`A`)} không đối xứng, ứng dụng hiện tại chuyển về ${formula(String.raw`M=A^TA`)}` + ' rồi áp dụng Cholesky trên M.',
                    'Mỗi cột của nghịch đảo được quy về hai bước giải tam giác trên cùng một ma trận U nên rất tiết kiệm khi cần toàn bộ A⁻¹.',
                    'Nếu ma trận làm việc không xác định dương, phương pháp Cholesky cho nghịch đảo sẽ dừng và báo lỗi.',
                ],
                [
                    'Kiểm tra ma trận vuông và xác định ma trận làm việc: A nếu đối xứng, hoặc M = AᵀA nếu không đối xứng.',
                    'Thực hiện phân rã Cholesky để thu được ma trận tam giác trên U.',
                    'Lần lượt lấy từng vector đơn vị eᵢ làm vế phải, rồi giải Uᵀy = eᵢ và Uxᵢ = y.',
                    'Ghép các cột xᵢ lại thành ma trận nghịch đảo của ma trận làm việc.',
                    'Nếu đang ở chế độ chuẩn tắc, chuyển tiếp từ M⁻¹ sang biểu thức nghịch đảo/phản nghịch đảo đang dùng trong code.',
                ]
            ),
            buildCard(
                'Phương pháp Viền Quanh',
                `Viền quanh xây nghịch đảo tăng dần theo cấp ma trận con, dựa trên công thức khối và bổ đề Schur.`,
                [
                    `Nếu đã biết ${formula(String.raw`A_k^{-1}`)} thì có thể xây ${formula(String.raw`A_{k+1}^{-1}`)} từ các khối mới thêm.`,
                    `Đại lượng quyết định là ${formula(String.raw`\theta=d-cA_k^{-1}b`)}` + '; nếu ' + `${formula(String.raw`\theta=0`)}` + ' thì bước mở rộng thất bại.',
                    'Phương pháp hay dùng trong các bài toán cần cập nhật nghịch đảo khi tăng kích thước ma trận.',
                    'Điểm mạnh là tái sử dụng kết quả cấp trước; điểm yếu là rất nhạy khi Schur complement gần 0.',
                ],
                [
                    'Bắt đầu từ ma trận con cấp 1 và nghịch đảo của nó.',
                    'Ở mỗi cấp mới, tách ma trận thành các khối cũ và phần viền mới.',
                    `Tính ${formula(String.raw`\theta`)} rồi áp dụng công thức khối để suy ra nghịch đảo cấp tiếp theo.`,
                    'Cập nhật các khối góc trên trái, góc trên phải, góc dưới trái và phần tử cuối theo cùng một công thức viền quanh.',
                    'Lặp đến khi đạt kích thước ma trận đầy đủ.',
                ]
            ),
        ],
    };
}

function inverseIterativeCards() {
    return {
        contextLabel: 'Tính ma trận nghịch đảo bằng lặp',
        cards: [
            buildCard(
                'Jacobi Cho Nghịch Đảo',
                `Bản chất là giải hệ ma trận ${formula(String.raw`AX=I`)} bằng Jacobi, nghĩa là giải đồng thời nhiều vế phải.`,
                [
                    'Điều kiện hội tụ tương tự Jacobi giải hệ: ma trận cần có cấu trúc đủ tốt để ma trận lặp có chuẩn nhỏ hơn 1.',
                    'Một lần lặp cập nhật toàn bộ ma trận X theo từng cột.',
                    'Điểm đầu X0 có thể lấy theo chuẩn 2 hoặc tích chuẩn 1 và vô cùng như giao diện đang cho phép.',
                    'Sai số được theo dõi dưới dạng chuẩn của chênh lệch hai ma trận lặp liên tiếp hoặc ước lượng hậu nghiệm tương ứng.',
                ],
                [
                    `Chọn ${formula(String.raw`X_0`)}`,
                    `Viết lại ${formula(String.raw`AX=I`)} thành dạng lặp Jacobi cho ma trận.`,
                    'Cập nhật mọi phần tử của X bằng giá trị từ vòng trước.',
                    'Tính chuẩn của chênh lệch hoặc sai số ước lượng sau mỗi vòng lặp.',
                    'Dừng khi sai số ma trận đạt ngưỡng hoặc hết số vòng lặp.',
                ]
            ),
            buildCard(
                'Lặp Tựa Newton',
                `Phương pháp Newton cho nghịch đảo dùng công thức nổi tiếng ${formula(String.raw`X_{k+1}=X_k(2I-AX_k)`)}`,
                [
                    `Nếu ${formula(String.raw`\|I-AX_0\|<1`)}, phương pháp hội tụ bậc hai về ${formula(String.raw`A^{-1}`)}`,
                    'Mỗi bước chỉ cần nhân ma trận, không phải giải hệ tuyến tính mới.',
                    'Chất lượng của X0 quyết định rất mạnh tốc độ và tính ổn định.',
                    'Khi đã vào vùng hội tụ, số chữ số đúng thường tăng rất nhanh so với các phương pháp lặp tuyến tính.',
                ],
                [
                    `Khởi tạo ${formula(String.raw`X_0`)}`,
                    `Tính sai lệch ${formula(String.raw`R_k=I-AX_k`)}`,
                    `Cập nhật ${formula(String.raw`X_{k+1}=X_k(2I-AX_k)`)}`,
                    'Đánh giá chuẩn của R_k hoặc của X_{k+1} - X_k để theo dõi hội tụ.',
                    'Kiểm tra chuẩn của sai lệch hoặc chênh lệch hai lần lặp liên tiếp để dừng.',
                ]
            ),
            buildCard(
                'Gauss-Seidel Cho Nghịch Đảo',
                `Tương tự Jacobi nghịch đảo nhưng mỗi cột của ${formula(String.raw`X`)} được cập nhật theo tinh thần Gauss-Seidel.`,
                [
                    'Giá trị mới trong cùng vòng lặp được tái sử dụng ngay, nên thường hội tụ nhanh hơn Jacobi.',
                    `Bài toán vẫn xuất phát từ ${formula(String.raw`AX=I`)}`,
                    'Điều kiện hội tụ vẫn phụ thuộc cấu trúc A và ma trận lặp sinh ra.',
                    'Phương pháp đặc biệt hữu ích khi A có dạng chéo trội hoặc gần tam giác nên phần cập nhật tuần tự phát huy tác dụng.',
                ],
                [
                    `Chọn ${formula(String.raw`X_0`)}`,
                    `Viết ${formula(String.raw`AX=I`)} theo dạng giải tiến cho từng vòng lặp.`,
                    'Cập nhật tuần tự từng phần tử hoặc từng cột bằng thông tin mới nhất.',
                    'Sau mỗi vòng lặp, tính chuẩn của sai số hoặc chênh lệch ma trận.',
                    'Dừng khi sai số đạt ngưỡng hoặc hết số vòng lặp.',
                ]
            ),
        ],
    };
}

function svdCards(root) {
    const method = root.querySelector('#svd-method-select')?.value || 'default';
    if (method === 'power') {
        return {
            contextLabel: 'Phân tích SVD',
            cards: [
                buildCard(
                    'SVD Bằng Power Method + Deflation',
                    `Ý tưởng là tìm trị riêng trội của ${formula(String.raw`A^TA`)} để suy ra các giá trị kỳ dị ${formula(String.raw`\sigma_i=\sqrt{\lambda_i}`)}`,
                    [
                        `Vì ${formula(String.raw`A^TA`)} đối xứng nửa xác định dương nên các trị riêng của nó không âm và chính là bình phương các giá trị kỳ dị.`,
                        'Power method cho vector riêng trội; sau đó deflation loại ảnh hưởng của thành phần vừa tìm được.',
                        `Sau khi có ${formula(String.raw`v_i`)}, ta lấy ${formula(String.raw`u_i=\frac{Av_i}{\sigma_i}`)}` + ' nếu giá trị kỳ dị đủ lớn.',
                        'Cách này hữu ích khi chỉ cần một vài giá trị kỳ dị lớn nhất thay vì toàn bộ phổ.',
                        'Tốc độ hội tụ phụ thuộc độ tách biệt giữa trị riêng lớn nhất và trị riêng đứng sau của ma trận làm việc.',
                    ],
                    [
                        `Tạo ma trận làm việc ${formula(String.raw`B=A^TA`)}` + ' và chọn vector khởi tạo khác 0.',
                        'Lặp power method: nhân với B, chuẩn hóa, rồi ước lượng trị riêng trội hiện tại.',
                        'Theo dõi chuẩn dư riêng để quyết định khi nào cặp riêng đã đủ ổn định.',
                        'Suy ra một bộ ba kỳ dị từ trị riêng và vector riêng vừa tìm được.',
                        'Thực hiện deflation hoặc trực chuẩn hóa để loại thành phần đã khai thác khỏi ma trận làm việc.',
                        'Lặp lại cho đến khi đủ số giá trị kỳ dị yêu cầu hoặc gặp giá trị kỳ dị gần 0.',
                    ]
                ),
            ],
        };
    }

    return {
        contextLabel: 'Phân tích SVD',
        cards: [
            buildCard(
                'SVD Chuẩn',
                `Phân tích giá trị kỳ dị viết ma trận dưới dạng ${formula(String.raw`A=U\Sigma V^T`)}`,
                [
                    `${formula(String.raw`U`)} chứa các vector kỳ dị trái, ${formula(String.raw`V`)} chứa các vector kỳ dị phải, còn ${formula(String.raw`\Sigma`)} là đường chéo các giá trị kỳ dị không âm.`,
                    'SVD tồn tại cho mọi ma trận thực hoặc phức và đặc biệt mạnh trong xấp xỉ hạng thấp, nén dữ liệu và phân tích hạng hiệu dụng.',
                    `Các cột của ${formula(String.raw`U`)} và ${formula(String.raw`V`)} là trực chuẩn nên SVD tách riêng phần quay/phản xạ và phần co giãn của phép biến đổi tuyến tính.`,
                    'Các giá trị kỳ dị thường được sắp giảm dần; trị lớn biểu diễn hướng mang nhiều năng lượng hay thông tin hơn.',
                    'Ứng dụng mặc định dùng thuật toán chuẩn của thư viện số để đạt độ ổn định cao.',
                ],
                [
                    'Từ ma trận đầu vào, gọi thủ tục SVD ổn định để tách U, Sigma và V.',
                    'Sắp xếp các giá trị kỳ dị theo thứ tự giảm dần và đồng bộ lại các vector tương ứng nếu cần.',
                    'Xác định hạng số của ma trận thông qua số giá trị kỳ dị còn đáng kể so với ngưỡng máy.',
                    'Ghép lại các thành phần để hiển thị và kiểm tra sai số tái tạo.',
                    'Trả về đầy đủ các ma trận phân tích cùng thông tin phụ trợ như thứ tự các giá trị kỳ dị.',
                ]
            ),
        ],
    };
}

function eigenCards(root) {
    const activeTab = getActiveTab(root, '.eigen-tab');

    if (activeTab === 'power-single') {
        return {
            contextLabel: 'Giá trị riêng và vector riêng',
            cards: [
                buildCard(
                    'Phương pháp Lũy Thừa',
                    `Power method lặp ${formula(String.raw`Y_{k+1}=AX_k`)} rồi chuẩn hóa để tìm trị riêng trội theo mô đun.`,
                    [
                        'Nếu A có trị riêng trội tách biệt và vector đầu không trực giao với vector riêng tương ứng, dãy sẽ hội tụ về hướng riêng đó.',
                        `Tốc độ hội tụ xấp xỉ theo tỉ lệ ${formula(String.raw`\left|\frac{\lambda_2}{\lambda_1}\right|`)}` + ' nên chậm khi hai trị riêng lớn nhất gần nhau về mô đun.',
                        `Trị riêng thường ước lượng bởi thương Rayleigh hoặc bởi tỉ số ${formula(String.raw`\frac{(AX_k)_i}{(X_k)_i}`)}`,
                        'Đây là phương pháp nền tảng cho nhiều thuật toán trị riêng quy mô lớn.',
                        'Điều quan trọng là không chỉ nhìn chênh lệch giữa hai lần lặp mà còn nên kiểm tra chuẩn dư riêng để biết vector đã gần là vector riêng thật hay chưa.',
                    ],
                    [
                        `Chọn ${formula(String.raw`X_0\neq 0`)}` + ' rồi chuẩn hóa.',
                        `Lặp nhân ${formula(String.raw`Y_{k+1}=AX_k`)}, sau đó chuẩn hóa để được ${formula(String.raw`X_{k+1}`)}`,
                        'Ước lượng trị riêng ở mỗi bước từ vector mới.',
                        `Tính chuẩn dư ${formula(String.raw`\|AX_k-\lambda_k X_k\|`)}` + ' để đánh giá chất lượng xấp xỉ.',
                        'Dừng khi trị riêng, vector hoặc chuẩn dư đã nhỏ hơn ngưỡng đặt trước.',
                    ]
                ),
            ],
        };
    }

    if (activeTab === 'power-deflation') {
        return {
            contextLabel: 'Giá trị riêng và vector riêng',
            cards: [
                buildCard(
                    'Lũy Thừa Kết Hợp Deflation',
                    `Sau khi tìm được một cặp riêng trội, ta khử ảnh hưởng của nó khỏi ma trận làm việc để tìm tiếp các cặp khác.`,
                    [
                        'Deflation biến bài toán nhiều trị riêng thành chuỗi các bài toán trị riêng trội.',
                        'Độ chính xác của các bước sau phụ thuộc chất lượng cặp riêng đã tìm được ở bước trước.',
                        'Nếu ma trận gần đối xứng hoặc có cơ sở riêng gần trực giao, deflation thường ổn định hơn.',
                        'Phương pháp phù hợp khi cần vài trị riêng đầu tiên thay vì toàn bộ phổ.',
                        'Khi các trị riêng gần nhau hoặc bội số cao, bước khử có thể làm tích lũy sai số nên cần đọc kết quả thận trọng.',
                    ],
                    [
                        'Dùng power method để tìm cặp riêng trội đầu tiên.',
                        'Xây ma trận đã khử thành phần vừa tìm được hoặc trực chuẩn hóa lại không gian tìm kiếm.',
                        'Lặp lại trên ma trận mới cho đến đủ số trị riêng yêu cầu.',
                        'Theo dõi chuẩn dư của từng cặp riêng sau mỗi lần khử để tránh chấp nhận nghiệm giả.',
                        'Khôi phục hoặc ghép các vector riêng vào không gian ban đầu nếu cần.',
                    ]
                ),
            ],
        };
    }

    return {
        contextLabel: 'Giá trị riêng và vector riêng',
        cards: [
            buildCard(
                'Phương pháp Danilevsky',
                `Danilevsky dùng các phép biến đổi tương tự để đưa ma trận về dạng Frobenius, từ đó đọc đa thức đặc trưng.`,
                [
                    `Nếu ${formula(String.raw`F=M^{-1}AM`)} là ma trận Frobenius thì hàng đầu của ${formula(String.raw`F`)} mã hóa trực tiếp đa thức đặc trưng.`,
                    'Phương pháp đặc biệt thích hợp cho bài toán tính đa thức đặc trưng của ma trận vuông.',
                    'Mỗi bước Danilevsky thực chất là một phép biến đổi tương tự nên không làm thay đổi phổ của ma trận.',
                    'Nếu phần tử chốt ở vị trí cần khử bằng 0, thuật toán phải hoán vị phù hợp hoặc dừng vì không thể tiếp tục chuỗi biến đổi hiện tại.',
                    'Sau khi có các trị riêng, vector riêng được truy hồi ngược từ các phép biến đổi đã lưu.',
                ],
                [
                    'Thực hiện lần lượt các phép biến đổi Danilevsky từ dưới lên để tạo ma trận Frobenius.',
                    'Kiểm tra ở mỗi bước xem pivot có đủ khác 0 để biến đổi tiếp hay cần đổi hàng/cột.',
                    'Đọc hoặc dựng đa thức đặc trưng từ ma trận kết quả.',
                    'Giải đa thức đặc trưng để lấy các trị riêng.',
                    'Từ chuỗi biến đổi đã lưu, truy hồi vector riêng cho ma trận gốc.',
                    'Đối chiếu lại bằng cách thay vào phương trình riêng để kiểm tra sai số hậu nghiệm.',
                ]
            ),
        ],
    };
}

function polynomialCards() {
    return {
        contextLabel: 'Giải phương trình đa thức',
        cards: [
            buildCard(
                'Tìm Nghiệm Thực Của Đa Thức',
                `Ứng dụng hiện tại kết hợp cận Lagrange cho miền tìm kiếm, đạo hàm để chia miền đơn điệu, rồi chia đôi trên từng khoảng đổi dấu.`,
                [
                    `Đầu tiên tìm cận ${formula(String.raw`[-N_2,N_1]`)} chứa toàn bộ nghiệm thực có thể có.`,
                    'Các điểm cực trị thực của đa thức đạo hàm chia trục số thành những khoảng mà đa thức đơn điệu hơn.',
                    'Trên mỗi khoảng đổi dấu, chia đôi được dùng để tìm nghiệm thực ổn định.',
                    'Các nghiệm bội chẵn có thể không làm đổi dấu, nên chúng cần được phát hiện gián tiếp qua các điểm dừng của đạo hàm hoặc các giá trị rất nhỏ của đa thức tại điểm cực trị.',
                    'Ý tưởng chia miền bằng đạo hàm giúp tránh quét mù toàn trục số và làm rõ cấu trúc “mỗi khoảng đơn điệu chứa nhiều nhất một nghiệm đơn”.',
                ],
                [
                    'Từ dãy hệ số, dựng đa thức và cận tìm kiếm của nghiệm thực.',
                    'Tính nghiệm thực của đạo hàm để chia miền thành các khoảng con.',
                    'Ghép các điểm biên cận và các điểm cực trị thành dãy mốc chia miền có thứ tự tăng dần.',
                    'Kiểm tra đổi dấu trên từng khoảng con để phát hiện khoảng chứa nghiệm.',
                    'Với các điểm cực trị nơi giá trị đa thức gần 0, đánh dấu ứng viên nghiệm bội.',
                    'Dùng chia đôi trên từng khoảng phù hợp để tìm nghiệm đến sai số yêu cầu.',
                    'Hợp nhất và làm sạch danh sách nghiệm gần trùng trước khi trả kết quả cuối cùng.',
                ]
            ),
        ],
    };
}

function matrixApproximationCards(root) {
    const method = root.querySelector('#approx-method-select')?.value || 'rank-k';
    if (method === 'threshold') {
        return {
            contextLabel: 'Ma trận xấp xỉ SVD',
            cards: [
                buildCard(
                    'Xấp Xỉ Theo Ngưỡng',
                    `Giữ lại các giá trị kỳ dị ${formula(String.raw`\sigma_i`)} lớn hơn ngưỡng đặt trước và loại bỏ phần nhỏ.`,
                    [
                        'Cách này phù hợp khi muốn cắt nhiễu hoặc bỏ các thành phần năng lượng thấp.',
                        'Số hạng giữ lại không cần cho trước; nó phụ thuộc trực tiếp vào ngưỡng.',
                        'Nếu ngưỡng quá cao, ma trận xấp xỉ có thể mất nhiều thông tin quan trọng.',
                        'Nếu dữ liệu đã được chuẩn hóa theo cùng thang đo, ngưỡng có thể được hiểu như một mức cắt trực tiếp trên độ lớn của các mode.',
                        'Khi các giá trị kỳ dị giảm rất chậm, cắt theo ngưỡng có thể giữ lại nhiều hạng hơn mong đợi.',
                    ],
                    [
                        'Phân tích SVD của ma trận đầu vào.',
                        'So sánh từng giá trị kỳ dị với ngưỡng người dùng đặt ra.',
                        'Giữ lại các bộ ba kỳ dị tương ứng với giá trị vượt ngưỡng.',
                        'Tái tạo ma trận xấp xỉ từ các thành phần còn lại.',
                        'Báo lại số hạng giữ được và mức sai số tái tạo tương ứng.',
                    ]
                ),
            ],
        };
    }

    if (method === 'error-bound') {
        return {
            contextLabel: 'Ma trận xấp xỉ SVD',
            cards: [
                buildCard(
                    'Xấp Xỉ Theo Sai Số',
                    `Chọn số hạng giữ lại sao cho phần đuôi bị cắt có chuẩn Frobenius nhỏ hơn ngưỡng cho trước.`,
                    [
                        `Theo SVD cắt cụt, sai số Frobenius của xấp xỉ hạng ${formula(String.raw`r`)} bằng căn tổng bình phương các ${formula(String.raw`\sigma_i`)} bị bỏ đi.`,
                        'Phương pháp tự động chọn hạng phù hợp thay vì yêu cầu người dùng nhập k.',
                        'Đây là cách thực dụng khi mục tiêu chính là kiểm soát độ lệch cho phép.',
                        'Nó đặc biệt hợp lý khi người dùng quan tâm đến sai số toàn cục chứ không quan tâm trực tiếp số mode được giữ lại.',
                        'Nếu ngưỡng sai số quá nhỏ, kết quả có thể quay về gần ma trận gốc vì phải giữ gần hết các giá trị kỳ dị.',
                    ],
                    [
                        'Tính SVD của ma trận đầu vào.',
                        'Xét lần lượt các hạng xấp xỉ từ nhỏ đến lớn.',
                        'Tính chuẩn Frobenius của phần sai số đuôi cho từng mức cắt.',
                        'Chọn mức đầu tiên thỏa ràng buộc và tái tạo ma trận xấp xỉ.',
                        'Xuất thêm sai số đạt được và tỉ lệ năng lượng đã giữ lại để người dùng so sánh.',
                    ]
                ),
            ],
        };
    }

    return {
        contextLabel: 'Ma trận xấp xỉ SVD',
        cards: [
            buildCard(
                'Xấp Xỉ Hạng-k',
                `Giữ lại ${formula(String.raw`k`)} giá trị kỳ dị lớn nhất để tạo xấp xỉ tốt nhất theo nghĩa chuẩn Frobenius và chuẩn phổ.`,
                [
                    `Định lý Eckart-Young cho biết xấp xỉ SVD cắt cụt là tối ưu trong lớp ma trận hạng không vượt quá ${formula(String.raw`k`)}`,
                    'K càng nhỏ thì nén dữ liệu càng mạnh nhưng sai số càng lớn.',
                    'Đây là chế độ phổ biến nhất cho nén ảnh, giảm chiều và lọc nhiễu hạng thấp.',
                    `Sai số phổ của xấp xỉ hạng ${formula(String.raw`k`)} bằng ${formula(String.raw`\sigma_{k+1}`)}` + ', còn sai số Frobenius phụ thuộc toàn bộ đuôi bị cắt.',
                    'Việc chọn k thường dựa trên điểm gãy của phổ kỳ dị hoặc trên tỉ lệ năng lượng tích lũy.',
                ],
                [
                    'Tính SVD của ma trận A.',
                    `Giữ lại ${formula(String.raw`k`)} bộ ba kỳ dị đầu tiên.`,
                    `Tạo ${formula(String.raw`A_k=U_k\Sigma_kV_k^T`)}`,
                    'So sánh ma trận xấp xỉ với ma trận gốc qua sai số tái tạo.',
                    'Báo lại phần trăm năng lượng đã giữ để người dùng đánh giá mức nén.',
                ]
            ),
        ],
    };
}

function nodeSelectionCards(root) {
    const method = getCheckedValue(root, 'node-selection-method', 'both');
    const titleMap = {
        both: 'Trích Xuất Mốc Lân Cận Hai Phía',
        left: 'Trích Xuất Mốc Cho Newton Lùi',
        right: 'Trích Xuất Mốc Cho Newton Tiến',
    };
    const theoryMap = {
        both: [
            'Chọn k mốc cân bằng nhất quanh giá trị cần nội suy để giảm thiên lệch trái/phải.',
            'Chiến lược này phù hợp cho các công thức nội suy trung tâm, Stirling và Bessel.',
            'Nếu chạm biên dữ liệu, tập mốc được điều chỉnh để vẫn đủ số điểm yêu cầu.',
            'Mọi thao tác chọn mốc đều diễn ra sau bước sắp xếp dữ liệu theo x tăng dần, nên ý nghĩa “trái/phải” luôn được hiểu theo trục x.',
        ],
        left: [
            'Chọn các mốc sao cho điểm cần nội suy nằm gần mốc cuối của dãy đã lấy.',
            'Đây là cấu hình phù hợp với công thức Newton lùi.',
            'Khi không đủ điểm về một phía, thuật toán tự bù từ phía còn lại.',
            'Cách chọn này giúp các tích kiểu (x-x_n), (x-x_{n-1}), ... nhỏ hơn khi điểm cần tính gần cuối tập mốc.',
        ],
        right: [
            'Chọn các mốc sao cho điểm cần nội suy nằm gần mốc đầu của dãy đã lấy.',
            'Đây là cấu hình phù hợp với công thức Newton tiến.',
            'Khi không đủ điểm về một phía, thuật toán tự bù từ phía còn lại.',
            'Cách chọn này đặc biệt hợp lý khi điểm cần tính nằm gần đầu bảng và công thức dùng sai phân tiến.',
        ],
    };
    const algorithmMap = {
        both: [
            'Đọc dữ liệu CSV, ép kiểu số và sắp xếp theo x tăng dần.',
            'Loại bỏ các mốc x trùng hoặc không hợp lệ nếu có, đồng thời lưu cảnh báo để hiển thị cho người dùng.',
            'Tìm vị trí của mốc gần x̄ nhất hoặc điểm chèn lân cận tương ứng.',
            'Mở rộng cân bằng sang trái và phải để đủ k mốc, ưu tiên cấu trúc đối xứng quanh x̄.',
            'Nếu chạm biên bảng, bù số mốc thiếu từ phía còn lại rồi trả về tập mốc cuối cùng.',
        ],
        left: [
            'Đọc dữ liệu, làm sạch và sắp xếp theo x tăng dần.',
            'Tìm mốc x_i lớn hơn hoặc bằng x̄ gần nhất để x̄ nằm gần cuối đoạn chọn.',
            'Lấy k mốc kết thúc tại vị trí này, rồi dịch trái/phải nếu gặp biên dữ liệu.',
            'Kiểm tra lại số lượng mốc thực tế và thứ tự các điểm sau khi chọn.',
            'Xuất ra tập mốc phục vụ Newton lùi.',
        ],
        right: [
            'Đọc dữ liệu, làm sạch và sắp xếp theo x tăng dần.',
            'Tìm mốc x_i nhỏ hơn hoặc bằng x̄ gần nhất để x̄ nằm gần đầu đoạn chọn.',
            'Lấy k mốc bắt đầu từ vị trí này, rồi dịch trái/phải nếu gặp biên dữ liệu.',
            'Kiểm tra lại số lượng mốc thực tế và thứ tự các điểm sau khi chọn.',
            'Xuất ra tập mốc phục vụ Newton tiến.',
        ],
    };

    return {
        contextLabel: 'Chuẩn bị dữ liệu nội suy',
        cards: [
            buildCard(
                titleMap[method],
                'Bước này không tính đa thức nội suy trực tiếp mà tạo tập mốc phù hợp với công thức bạn sẽ dùng sau đó.',
                theoryMap[method],
                algorithmMap[method],
                {
                    notes: [
                        'Chức năng trích xuất mốc hiện dùng dữ liệu từ CSV. Nếu dữ liệu đầu vào đã được làm sạch tốt ngay từ đầu, các công thức nội suy phía sau sẽ ổn định hơn rõ rệt.',
                    ],
                }
            ),
        ],
    };
}

function findIntervalsCards(root) {
    const method = getCheckedValue(root, 'find-intervals-method', 'both');
    const source = getCheckedValue(root, 'find-intervals-source', 'csv');
    const labelMap = {
        both: 'Mở rộng hai phía',
        left: 'Mở rộng bên trái',
        right: 'Mở rộng bên phải',
    };
    const sourceTitle = source === 'manual' ? 'Nhập tay x, y' : 'Đọc từ CSV';
    return {
        contextLabel: 'Tìm khoảng cách ly từ dữ liệu bảng',
        cards: [
            buildCard(
                `Chuẩn Bị Dữ Liệu (${sourceTitle})`,
                source === 'manual'
                    ? 'Bạn có thể tự nhập hai dãy xᵢ, yᵢ trực tiếp trên giao diện. Hệ thống sẽ kiểm tra độ dài hai dãy, ép kiểu số và sắp xếp lại theo x tăng dần trước khi tìm khoảng cách ly.'
                    : 'Bạn có thể nạp một file CSV. Hệ thống chỉ dùng hai cột đầu tiên làm dữ liệu x, y; sau đó tự làm sạch, sắp xếp và loại các dòng không hợp lệ.',
                [
                    source === 'manual'
                        ? 'Hai danh sách xᵢ và yᵢ phải có cùng số phần tử; mỗi cặp (xᵢ, yᵢ) là một điểm của bảng số.'
                        : 'File CSV chỉ cần hai cột đầu tiên là x và y; backend đọc theo vị trí cột nên không phụ thuộc việc có header hay không.',
                    'Dữ liệu sau khi đọc sẽ được ép kiểu số, loại dòng lỗi/rỗng và sắp xếp theo x tăng dần để việc quét đổi dấu không bị lệch thứ tự.',
                    'Nếu có các mốc x trùng nhau, hệ thống giữ mốc đầu tiên và phát cảnh báo vì dữ liệu như vậy không còn là đồ thị một hàm đơn trị theo x.',
                    'Số mốc yêu cầu k phải nằm trong miền hợp lệ từ 2 đến số mốc còn lại sau khi làm sạch dữ liệu.',
                ],
                [
                    source === 'manual'
                        ? 'Tách chuỗi xᵢ và yᵢ theo dấu cách hoặc xuống dòng, rồi chuyển từng phần tử về số thực.'
                        : 'Đọc file CSV và chỉ lấy hai cột đầu tiên làm bảng dữ liệu.',
                    'Làm sạch dữ liệu: ép kiểu số, loại dòng lỗi, sắp xếp theo x và loại trùng x nếu cần.',
                    'Đếm lại số mốc hợp lệ và kiểm tra ràng buộc của k trước khi tìm khoảng.',
                    'Tạo bảng chuẩn hóa cuối cùng để dùng chung cho bước phát hiện đổi dấu và mở rộng khoảng.',
                ],
                {
                    notes: [
                        'Màn này hỗ trợ cả hai kiểu input: tải file CSV hoặc tự nhập tay hai dãy x, y.',
                    ],
                }
            ),
            buildCard(
                `Tìm Và Mở Rộng Khoảng Cách Ly (${labelMap[method]})`,
                `Từ bảng dữ liệu đã chuẩn hóa, thuật toán xét dấu của ${formula(String.raw`y_i-\bar y`)} để phát hiện các cặp mốc kề nhau có đổi dấu, tức các khoảng gốc có thể chứa nghiệm của ${formula(String.raw`f(x)=\bar y`)}`,
                [
                    `Đặt ${formula(String.raw`d_i=y_i-\bar y`)}` + '; nếu ' + `${formula(String.raw`d_i d_{i+1}<0`)}` + ' thì trên đoạn ' + `${formula(String.raw`[x_i,x_{i+1}]`)}` + ' có đổi dấu.',
                    'Nếu một mốc nằm đúng trên mức ȳ, thuật toán tạm bỏ dấu 0 và lan truyền dấu lân cận để tránh sinh ra nhiều khoảng giả do nhiễu bảng số.',
                    'Khoảng đổi dấu gốc chỉ gồm hai mốc kề nhau; sau đó có thể mở rộng thêm nhưng vẫn phải giữ tính cách ly của khoảng.',
                    'Mở rộng chỉ được phép lấy thêm các mốc cùng phía dấu với biên hiện tại; nếu không thì khoảng đã chạm sang một nghiệm khác.',
                    'Chiến lược này tạo ra các khoảng dữ liệu đủ rộng để phục vụ nội suy ngược ổn định hơn mà vẫn bảo toàn ý nghĩa “một khoảng cho một nghiệm”.',
                ],
                [
                    'Tính dãy chênh lệch dᵢ = yᵢ - ȳ và dãy dấu tương ứng sau khi xử lý các mốc có dᵢ = 0.',
                    'Quét từng cặp liên tiếp để tìm các vị trí dấu đổi từ âm sang dương hoặc từ dương sang âm.',
                    'Với mỗi khoảng gốc, khởi tạo hai biên trái/phải và số mốc hiện có bằng 2.',
                    `Thử mở rộng ${labelMap[method].toLowerCase()}: chỉ nhận mốc mới nếu dấu của nó trùng với dấu ở biên cùng phía.`,
                    'Dừng mở rộng khi đủ k mốc, chạm biên dữ liệu, hoặc gặp mốc làm xuất hiện thêm một lần đổi dấu.',
                    'Trả về toàn bộ các khoảng đã tìm được cùng khoảng gốc ban đầu, danh sách mốc sau mở rộng và số mốc thực tế thu được.',
                ],
                {
                    notes: [
                        'Chế độ `cả 2 bên` mở rộng xen kẽ trái/phải; `bên trái` và `bên phải` chỉ lấy thêm mốc về đúng một phía.',
                        'Nếu dữ liệu quá thưa hoặc gần mép bảng, số mốc thực tế của một khoảng có thể nhỏ hơn k dù khoảng gốc vẫn hợp lệ.',
                    ],
                }
            ),
        ],
    };
}

function inverseInterpolationCards(root) {
    const method = getCheckedValue(root, 'inv-inter-method', 'forward');
    const isForward = method === 'forward';
    return {
        contextLabel: 'Nội suy ngược',
        cards: [
            buildCard(
                isForward ? 'Nội Suy Ngược Newton Tiến' : 'Nội Suy Ngược Newton Lùi',
                `Bài toán là tìm ${formula(String.raw`x`)} sao cho ${formula(String.raw`f(x)=\bar y`)}. Ứng dụng hiện tại dựng đa thức Newton theo biến ${formula(String.raw`t`)} rồi giải bằng lặp điểm bất động.`,
                [
                    isForward
                        ? `Dùng mốc đầu ${formula(String.raw`x_0`)} và sai phân ${formula(String.raw`\Delta y_0,\Delta^2y_0,\ldots`)}.`
                        : `Dùng mốc cuối ${formula(String.raw`x_n`)} và sai phân lùi ${formula(String.raw`\nabla y_n,\nabla^2y_n,\ldots`)}.`,
                    `Đổi biến ${formula(String.raw`x=x_{\text{start}}+th`)} để đưa bài toán tìm x về bài toán tìm ${formula(String.raw`t`)}`,
                    'Sau khi có t, suy ra x qua công thức tuyến tính với bước h.',
                    'Điều kiện quan trọng là các mốc x phải cách đều và vùng dữ liệu dùng để nội suy nên tương đối đơn điệu quanh mức ȳ để phép lặp ổn định.',
                    'Về bản chất, ta thay phương trình P_n(x) = ȳ bằng một phương trình theo t rồi biến nó thành ánh xạ lặp t = φ(t).',
                ],
                [
                    'Kiểm tra dữ liệu x cách đều và dựng bảng sai phân.',
                    'Chọn công thức Newton tiến hoặc lùi tùy radio đang bật.',
                    'Tính giá trị khởi tạo t₀ từ sai phân bậc một để có điểm bắt đầu gần nghiệm hơn.',
                    'Sắp xếp lại phương trình nội suy để thu được ánh xạ lặp theo t rồi lặp đến hội tụ.',
                    'Ở mỗi bước, theo dõi |t_{k+1} - t_k| để quyết định dừng.',
                    `Từ ${formula(String.raw`t^\*`)}, suy ra ${formula(String.raw`x^\*=x_{\text{start}}+t^\*h`)}`,
                ],
                {
                    notes: [
                        'Trong thực hành, nên tìm trước một khoảng cách ly thích hợp bằng màn “Tìm khoảng cách ly nghiệm” rồi mới chạy nội suy ngược để tránh lặp sang nhánh nghiệm khác.',
                    ],
                }
            ),
        ],
    };
}

function hornerCards(root) {
    const activeTab = getActiveTab(root, '.horner-tab');

    const guides = {
        'synthetic-division': buildCard(
            'Bảng Chia Horner',
            `Horner chia ${formula(String.raw`P(x)`)} cho ${formula(String.raw`x-c`)} bằng truy hồi hệ số, tránh phải khai triển dài.`,
            [
                `Nếu ${formula(String.raw`P(x)=(x-c)Q(x)+r`)}, Horner cho đồng thời hệ số của ${formula(String.raw`Q(x)`)} và số dư ${formula(String.raw`r=P(c)`)}`,
                'Thuật toán chỉ dùng phép nhân và cộng nên rất gọn và ổn định hơn cách khai triển trực tiếp.',
                'Đây cũng là nền tảng cho nhiều thao tác khác như tính đạo hàm, đổi biến và nội suy.',
                'Mọi hệ số đều được xử lý theo thứ tự từ bậc cao xuống bậc thấp nên rất phù hợp với cách lưu đa thức bằng mảng.',
            ],
            [
                'Viết dãy hệ số của đa thức từ bậc cao xuống thấp.',
                'Hạ hệ số đầu tiên xuống, rồi lặp quy tắc nhân với c và cộng vào hệ số kế tiếp.',
                'Các giá trị trung gian tạo thành hệ số của thương.',
                'Phần tử cuối cùng là số dư, tức P(c).',
                'Nếu số dư gần 0 thì c là nghiệm gần đúng của đa thức.',
            ]
        ),
        'all-derivatives': buildCard(
            'Horner Tính Đạo Hàm Mọi Cấp',
            'Lặp Horner nhiều lần cho phép truy xuất các hệ số liên quan đến các đạo hàm của đa thức tại một điểm c.',
            [
                `Các đạo hàm tại ${formula(String.raw`c`)} liên hệ trực tiếp với các hệ số cuối của các bảng Horner lồng nhau.`,
                `Về bản chất, đa thức được viết lại theo khai triển Taylor quanh ${formula(String.raw`x=c`)}`,
                'Phương pháp đặc biệt tiện khi cần nhiều đạo hàm cùng lúc.',
                'Thay vì tính đạo hàm ký hiệu rồi thế c, ta tái sử dụng liên tiếp chính cấu trúc chia Horner nên cách làm rất gọn.',
            ],
            [
                'Thực hiện Horner tại c để lấy P(c).',
                'Lấy đa thức thương và tiếp tục Horner trên thương đó.',
                'Lặp lại đến bậc đạo hàm mong muốn hoặc đến khi đa thức hết bậc.',
                'Quy đổi các hệ số thu được về giá trị đạo hàm thông qua giai thừa.',
                'Tổng hợp kết quả thành dãy P(c), P\'(c), P\'\'(c), ... để người dùng đọc trực tiếp.',
            ]
        ),
        'change-variables': buildCard(
            'Đổi Biến t = ax + b',
            `Mục tiêu là viết lại ${formula(String.raw`P(x)`)} thành một đa thức mới theo biến ${formula(String.raw`t`)}`,
            [
                `Đổi biến tuyến tính ${formula(String.raw`t=ax+b`)} thường được dùng để tịnh tiến hoặc co giãn miền tính toán.`,
                'Horner kết hợp Taylor quanh điểm phù hợp giúp tránh khai triển thủ công nhiều lần.',
                'Kết quả là đa thức mới có thể thuận lợi hơn cho đánh giá hoặc giải tích tiếp theo.',
                'Kỹ thuật này đặc biệt hữu ích trong các công thức Newton cách đều và các công thức trung tâm, nơi biến t có ý nghĩa chuẩn hóa vị trí.',
            ],
            [
                `Xác định quan hệ nghịch ${formula(String.raw`x=\frac{t-b}{a}`)}`,
                'Chọn điểm khai triển thích hợp và tính các hệ số bằng Horner.',
                'Thay biến để viết lại đa thức dưới dạng theo t.',
                'Chuẩn hóa lại thứ tự hệ số nếu cần để khớp với biến mới.',
                'Xuất ra đa thức mới và các bước trung gian.',
            ]
        ),
        'reverse-horner': buildCard(
            'Bảng Nhân Horner',
            `Reverse Horner nhân ${formula(String.raw`P(x)`)} với ${formula(String.raw`x-c`)} mà không cần khai triển từng hạng.`,
            [
                'Đây là thao tác ngược với bảng chia Horner.',
                'Thuật toán hữu ích khi cần thêm một nghiệm vào đa thức Omega hoặc xây đa thức theo tích tuyến tính.',
                'Cấu trúc truy hồi vẫn chỉ dùng các phép toán đơn giản trên hệ số.',
                'Nếu lặp nhiều lần với các nghiệm x_i, ta thu được đa thức có tập nghiệm đã cho mà không phải nhân đa thức dài bằng tay.',
            ],
            [
                'Ghi dãy hệ số của P(x).',
                'Xây hệ số mới từ bậc cao xuống thấp theo quy tắc nhân ngược với c.',
                'Kiểm tra lại đa thức kết quả bằng khai triển hoặc thay một giá trị thử.',
                'Lặp lại nếu cần nhân thêm với nhiều nhân tử tuyến tính khác.',
                'Trả về đa thức tích cuối cùng.',
            ]
        ),
        'w-function': buildCard(
            'Đa Thức Omega',
            `Đa thức Omega được định nghĩa bởi ${formula(String.raw`w(x)=\prod_{i=0}^n(x-x_i)`)}`,
            [
                'Đây là đa thức cơ sở quan trọng trong nội suy, công thức sai số và nhiều thủ tục chọn mốc.',
                'Bậc của w(x) đúng bằng số mốc trừ một, và các nghiệm của nó chính là các mốc nội suy.',
                'Có thể dựng nhanh bằng cách nhân dồn từng nhân tử bằng reverse Horner.',
                `Trong công thức sai số nội suy, ${formula(String.raw`w(x)`)}` + ' quyết định vị trí và mức dao động của phần dư.',
            ],
            [
                'Nhập dãy nghiệm x0, x1, ..., xn.',
                'Khởi tạo w(x)=1.',
                'Lần lượt nhân với từng nhân tử (x-x_i).',
                'Lưu lại các bước trung gian nếu muốn theo dõi sự tăng bậc của đa thức.',
                'Thu gọn và trả về đa thức Omega cuối cùng.',
            ]
        ),
    };

    return {
        contextLabel: 'Sơ đồ Horner',
        cards: [guides[activeTab || 'synthetic-division']],
    };
}

function approximationCards(root) {
    const activeTab = getActiveTab(root, '.approx-tab');

    if (activeTab === 'approx-optimal') {
        return {
            contextLabel: 'Xấp xỉ hàm số và nội suy',
            cards: [
                buildCard(
                    'Mốc Nội Suy Tối Ưu',
                    `Các mốc Chebyshev làm nhỏ đại lượng ${formula(String.raw`\max_{x\in[a,b]}|w_{n+1}(x)|`)} nên giảm dao động Runge so với mốc đều.`,
                    [
                        `Trên ${formula(String.raw`[-1,1]`)}, các nút tối ưu là ${formula(String.raw`t_k=\cos\frac{(2k+1)\pi}{2(n+1)}`)}`,
                        'Khi đổi sang [a,b], chỉ cần co giãn tuyến tính các nút này.',
                        'Đây là bước chuẩn bị dữ liệu rất quan trọng trước khi dựng đa thức nội suy bậc cao.',
                        'Các mốc Chebyshev dày hơn ở gần hai đầu đoạn, đúng nơi hiện tượng Runge thường xuất hiện mạnh nhất.',
                        'Ý nghĩa thực tế là cùng bậc đa thức nhưng sai số cực đại trên toàn đoạn thường tốt hơn rõ rệt so với chọn mốc đều.',
                    ],
                    [
                        'Chọn số mốc n+1 và khoảng [a,b].',
                        'Sinh các nút Chebyshev chuẩn trên [-1,1].',
                        'Đổi biến để đưa các nút về khoảng [a,b].',
                        'Sắp xếp lại các nút theo thứ tự tăng dần nếu cần để thuận tiện cho các bước nội suy phía sau.',
                        'Trả ra dãy mốc tối ưu để dùng cho các thuật toán nội suy tiếp theo.',
                    ]
                ),
            ],
        };
    }

    if (activeTab === 'approx-newton-divided') {
        return {
            contextLabel: 'Xấp xỉ hàm số và nội suy',
            cards: [
                buildCard(
                    'Tỷ Sai Phân',
                    `Tỷ sai phân tạo ra hệ số của đa thức Newton cho các mốc bất kỳ: ${formula(String.raw`P_n(x)=f[x_0]+\sum_{k=1}^n f[x_0,\ldots,x_k]\prod_{j=0}^{k-1}(x-x_j)`)}`,
                    [
                        'Không yêu cầu các mốc x cách đều.',
                        'Bảng tỷ sai phân cho phép bổ sung mốc mới mà không phải tính lại từ đầu toàn bộ đa thức.',
                        'Đây là lựa chọn tự nhiên khi dữ liệu lấy mẫu không đều.',
                    ],
                    [
                        'Sắp xếp các mốc dữ liệu theo thứ tự nhập hoặc theo logic sử dụng.',
                        'Dựng bảng tỷ sai phân từ bậc 0 đến bậc n.',
                        'Lấy đường chéo đầu của bảng làm hệ số Newton.',
                        'Ghép các hệ số với tích (x-x_i) để tạo đa thức nội suy.',
                    ]
                ),
            ],
        };
    }

    if (activeTab === 'approx-newton-finite-difference') {
        return {
            contextLabel: 'Xấp xỉ hàm số và nội suy',
            cards: [
                buildCard(
                    'Sai Phân Mốc Cách Đều',
                    `Khi các mốc x cách đều, thay vì tỷ sai phân ta dùng bảng sai phân tiến hoặc lùi để dựng đa thức hiệu quả hơn.`,
                    [
                        `Đổi biến ${formula(String.raw`t=\frac{x-x_0}{h}`)} để đa thức viết theo các tích ${formula(String.raw`t(t-1)\cdots`)}`,
                        'Bảng sai phân giúp khai thác trực tiếp cấu trúc mốc đều.',
                        'Công thức này là nền tảng của Newton tiến, Newton lùi và các công thức trung tâm.',
                    ],
                    [
                        'Kiểm tra dữ liệu x cách đều và xác định bước h.',
                        'Dựng bảng sai phân tiến từ cột y.',
                        'Lấy các hệ số thích hợp từ bảng sai phân.',
                        'Ghép lại thành đa thức theo biến t rồi đổi ngược về x nếu cần.',
                    ]
                ),
            ],
        };
    }

    if (activeTab === 'approx-lagrange') {
        return {
            contextLabel: 'Xấp xỉ hàm số và nội suy',
            cards: [
                buildCard(
                    'Nội Suy Lagrange',
                    `Đa thức Lagrange có dạng ${formula(String.raw`P_n(x)=\sum_{i=0}^n y_iL_i(x)`)} với ${formula(String.raw`L_i(x)=\prod_{j\ne i}\frac{x-x_j}{x_i-x_j}`)}`,
                    [
                        'Công thức đối xứng theo các mốc, không cần bảng trung gian.',
                        'Phù hợp để mô tả lý thuyết rõ ràng, nhưng nếu cần cập nhật thêm mốc thì kém linh hoạt hơn Newton.',
                        'Mỗi đa thức cơ sở Li bằng 1 tại mốc i và bằng 0 tại mọi mốc còn lại.',
                        'Điều kiện tiên quyết là các mốc x_i phải đôi một phân biệt, nếu không mẫu số sẽ bằng 0.',
                        `Sai số lý thuyết có dạng ${formula(String.raw`R_{n+1}(x)=\frac{f^{(n+1)}(\xi)}{(n+1)!}\prod_{i=0}^n(x-x_i)`)}` + ', nhờ đó có thể thấy vai trò của cách chọn mốc.',
                    ],
                    [
                        'Từ các mốc x_i, dựng từng đa thức cơ sở L_i(x).',
                        'Tiền tính các mẫu số cố định x_i - x_j để tránh lặp lại phép nhân không cần thiết.',
                        'Nhân mỗi L_i với giá trị y_i tương ứng.',
                        'Cộng tất cả các hạng để nhận P_n(x).',
                        'Thu gọn và xuất đa thức nội suy cuối cùng.',
                    ]
                ),
            ],
        };
    }

    if (activeTab === 'approx-newton') {
        const variant = root.querySelector('#newton-method-select')?.value || 'equidistant';
        if (variant === 'arbitrary') {
            return {
                contextLabel: 'Xấp xỉ hàm số và nội suy',
                cards: [
                    buildCard(
                        'Nội Suy Newton Với Mốc Bất Kỳ',
                        'Đây là cách dựng đa thức Newton dựa trên tỷ sai phân, phù hợp cho dữ liệu không cách đều.',
                        [
                            'Hệ số của đa thức chính là các tỷ sai phân trên đường chéo đầu của bảng.',
                            'Dạng Newton rất thuận tiện khi cần thêm mốc mới vì chỉ phải tính thêm một cột.',
                            'Đa thức cuối có thể thu gọn về dạng chuẩn sau khi dựng xong.',
                            'Cũng như Lagrange, điều kiện bắt buộc là các mốc x phải phân biệt để tỷ sai phân xác định.',
                            'Khi các mốc rất gần nhau, bảng tỷ sai phân có thể khuếch đại nhiễu làm hệ số bậc cao dao động mạnh.',
                        ],
                        [
                            'Tạo bảng tỷ sai phân từ dữ liệu x, y.',
                            'Lấy các hệ số f[x0], f[x0,x1], ...',
                            'Ghép hệ số với cơ sở lồng nhau để tận dụng cấu trúc tích từng bước.',
                            'Ghép các hệ số với tích (x-x0)(x-x1)...',
                            'Thu gọn và hiển thị đa thức nội suy.',
                        ]
                    ),
                ],
            };
        }

        return {
            contextLabel: 'Xấp xỉ hàm số và nội suy',
            cards: [
                buildCard(
                    'Nội Suy Newton Với Mốc Cách Đều',
                    `Khi dữ liệu cách đều, đa thức Newton được viết thuận tiện theo biến ${formula(String.raw`t=\frac{x-x_0}{h}`)} và các sai phân.`,
                    [
                        'Tùy vị trí điểm cần tính so với bảng dữ liệu, có thể chọn Newton tiến hoặc Newton lùi.',
                        'Hệ số lấy trực tiếp từ bảng sai phân nên tính toán gọn hơn so với tỷ sai phân.',
                        'Đây là dạng được dùng nhiều trong các bài toán bảng số.',
                        'Điều kiện cốt lõi là bước lưới h phải gần như không đổi; nếu dữ liệu không đều thì công thức này không còn đúng.',
                        'Newton tiến thường dùng khi x nằm gần đầu bảng, còn Newton lùi phù hợp khi x nằm gần cuối bảng.',
                    ],
                    [
                        'Kiểm tra h không đổi giữa các mốc x.',
                        'Dựng bảng sai phân tiến hoặc lùi.',
                        'Lập đa thức theo biến t với các tích t(t-1)... hoặc t(t+1)...',
                        'Chọn số hạng cần giữ nếu muốn dùng đa thức nội suy rút gọn bậc thấp hơn.',
                        'Đổi lại về biến x để thu kết quả cuối cùng.',
                    ]
                ),
            ],
        };
    }

    if (activeTab === 'approx-central') {
        const centralMethod = root.querySelector('#central-method-select')?.value || 'gauss_i';
        const guideMap = {
            gauss_i: buildCard(
                'Nội Suy Trung Tâm Gauss I',
                'Gauss I phù hợp khi điểm cần nội suy nằm gần mốc trung tâm và số mốc là lẻ.',
                [
                    `Đổi biến ${formula(String.raw`t=\frac{x-x_0}{h}`)} với ${formula(String.raw`x_0`)} là mốc trung tâm.`,
                    'Các sai phân được lấy đối xứng quanh mốc giữa nhưng theo thứ tự đặc trưng của Gauss I.',
                    'Phương pháp tận dụng tốt dữ liệu gần tâm bảng hơn Newton tiến/lùi thuần túy.',
                    'Gauss I thường được ưu tiên khi điểm nội suy lệch nhẹ về phía trước của mốc trung tâm.',
                ],
                [
                    'Chọn mốc trung tâm x0 và dựng bảng sai phân đều.',
                    'Lấy các hệ số đúng vị trí của công thức Gauss I.',
                    'Dựng các tích trung tâm theo biến t.',
                    'Ghép các hạng theo đúng thứ tự dấu và chỉ số của công thức Gauss I.',
                    'Ghép và thu gọn đa thức nội suy.',
                ]
            ),
            gauss_ii: buildCard(
                'Nội Suy Trung Tâm Gauss II',
                'Gauss II cũng dùng mốc trung tâm nhưng đảo cách lấy một số sai phân so với Gauss I.',
                [
                    'Thích hợp khi điểm nội suy vẫn gần tâm nhưng lệch về phía còn lại so với cấu hình của Gauss I.',
                    'Cấu trúc công thức vẫn dựa trên dữ liệu mốc đều.',
                    'Sai phân được chọn theo hàng lệch khác so với Gauss I.',
                    'Có thể xem Gauss II như biến thể đối xứng của Gauss I để giảm độ lệch khi điểm tính nằm về nửa còn lại quanh tâm bảng.',
                ],
                [
                    'Chọn mốc trung tâm và lập bảng sai phân.',
                    'Lấy các sai phân theo mẫu Gauss II.',
                    'Dựng các tích theo biến t với thứ tự phù hợp.',
                    'Ghép các hạng bậc thấp trước để dễ kiểm soát sai số do làm tròn.',
                    'Ghép đa thức và đổi về biến x nếu cần.',
                ]
            ),
            stirlin: buildCard(
                'Công Thức Stirling',
                'Stirling là công thức trung tâm đối xứng, thường dùng khi số mốc lẻ và điểm cần tính rất gần chính giữa bảng.',
                [
                    'Công thức trộn trung bình của các sai phân lẻ để tăng tính đối xứng.',
                    'Đây là lựa chọn đẹp về mặt lý thuyết khi dữ liệu cân bằng quanh trung tâm.',
                    'Điều kiện tiên quyết là các mốc x cách đều.',
                    'Khi điểm tính lệch xa trung tâm, lợi thế đối xứng của Stirling giảm đi và nên cân nhắc Gauss hoặc Bessel.',
                ],
                [
                    'Chọn mốc trung tâm và dựng bảng sai phân.',
                    'Lấy các sai phân chẵn trực tiếp, còn sai phân lẻ lấy trung bình hai phía.',
                    'Lập đa thức Stirling theo biến t.',
                    'Ghép từng cặp hạng đối xứng để giữ đúng cấu trúc của công thức.',
                    'Đổi về x và trả kết quả.',
                ]
            ),
            bessel: buildCard(
                'Công Thức Bessel',
                'Bessel phù hợp khi số mốc chẵn và điểm cần nội suy nằm gần trung điểm của hai mốc giữa.',
                [
                    `Dùng biến ${formula(String.raw`u=t-\frac12`)}` + ' để đối xứng quanh trung điểm.',
                    'Một số hệ số lấy theo trung bình sai phân ở hai phía trung tâm.',
                    'Bessel thường chính xác hơn Stirling khi điểm nội suy lệch nửa bước khỏi mốc giữa.',
                    'Đây là lựa chọn tự nhiên khi hai mốc trung tâm đều quan trọng như nhau và không có một mốc giữa duy nhất.',
                ],
                [
                    'Xác định hai mốc trung tâm và dựng bảng sai phân đều.',
                    'Đổi biến về u = t - 1/2.',
                    'Lấy các hệ số đúng theo công thức Bessel.',
                    'Ghép các cặp hạng trung bình quanh hai mốc giữa để duy trì tính cân bằng.',
                    'Ghép đa thức theo u rồi đổi lại về x.',
                ]
            ),
        };

        return {
            contextLabel: 'Xấp xỉ hàm số và nội suy',
            cards: [guideMap[centralMethod]],
        };
    }

    return null;
}

function splineCards(root) {
    const activeTab = getActiveTab(root, '.spline-tab');
    const guideMap = {
        'spline-linear': buildCard(
            'Spline Cấp 1',
            'Spline tuyến tính nối từng cặp điểm bằng một đoạn thẳng, đơn giản nhất nhưng chỉ liên tục C0.',
            [
                'Trên mỗi đoạn [x_i,x_{i+1}], hàm xấp xỉ là một đa thức bậc nhất.',
                'Giá trị đi qua đúng các mốc nhưng đạo hàm bị gián đoạn tại nút nối.',
                'Đây là lựa chọn nhanh, dễ hiểu và ít điều kiện nhất.',
                'Mỗi đoạn chỉ phụ thuộc vào hai mốc lân cận nên khi sửa một điểm dữ liệu, chỉ các đoạn kề nó thay đổi.',
            ],
            [
                'Chia miền dữ liệu thành các đoạn con liên tiếp.',
                'Trên mỗi đoạn, viết phương trình đường thẳng đi qua hai đầu mút.',
                'Tính hệ số góc và hệ số tự do cho từng đoạn độc lập.',
                'Ghép các đoạn lại thành spline từng khúc.',
                'Hiển thị toàn bộ các đa thức đoạn.',
            ]
        ),
        'spline-quadratic': buildCard(
            'Spline Cấp 2',
            'Spline bậc hai dùng đa thức bậc hai trên từng đoạn và ép thêm điều kiện liên tục đạo hàm bậc một.',
            [
                'Cần một điều kiện biên để đóng hệ phương trình hệ số.',
                'So với spline tuyến tính, đường cong mượt hơn vì có liên tục C1.',
                'Số ẩn tăng nhưng vẫn giải được bằng hệ tuyến tính cấu trúc.',
                'Vì chỉ đạt C1, spline bậc hai vẫn có thể làm đạo hàm bậc hai nhảy tại các nút nối.',
            ],
            [
                'Dựng một đa thức bậc hai cho mỗi khoảng con.',
                'Áp đặt điều kiện đi qua mốc và liên tục giá trị, đạo hàm bậc một.',
                'Bổ sung điều kiện biên do người dùng nhập.',
                'Giải hệ để thu được các hệ số spline.',
                'Xuất các đa thức đoạn cùng miền áp dụng tương ứng.',
            ]
        ),
        'spline-cubic': buildCard(
            'Spline Cấp 3',
            'Spline bậc ba là lựa chọn chuẩn trong thực hành vì cho độ trơn C2 và hình dạng mềm hơn hẳn.',
            [
                'Mỗi đoạn dùng một đa thức bậc ba.',
                'Điều kiện ghép gồm liên tục giá trị, đạo hàm bậc một và đạo hàm bậc hai.',
                'Nếu hai điều kiện biên bậc hai bằng 0 thì thu được spline tự nhiên.',
                'Trong triển khai số, hệ ẩn thường quy về một hệ tam chéo theo các đạo hàm bậc hai hoặc các hệ số tương đương.',
                'Spline bậc ba thường cân bằng tốt giữa độ mượt, độ ổn định và chi phí tính toán.',
            ],
            [
                'Thiết lập hệ số cho từng đoạn spline bậc ba.',
                'Áp điều kiện nội suy tại các mốc và điều kiện trơn C2 tại các nút trong.',
                'Áp điều kiện biên người dùng chọn.',
                'Giải hệ tam chéo hoặc hệ tuyến tính tương đương để tìm các ẩn spline.',
                'Xuất đa thức trên từng khoảng và các hệ số biên liên quan.',
            ]
        ),
    };

    return {
        contextLabel: 'Hàm ghép trơn',
        cards: [guideMap[activeTab || 'spline-linear']],
    };
}

function leastSquaresCards() {
    return {
        contextLabel: 'Xấp xỉ bình phương tối thiểu',
        cards: [
            buildCard(
                'Phương pháp Bình Phương Tối Thiểu',
                `Ta tìm ${formula(String.raw`g(x)=\sum_{j=0}^m a_j\phi_j(x)`)} sao cho tổng bình phương sai lệch tại các mốc dữ liệu là nhỏ nhất.`,
                [
                    `Hàm mục tiêu là ${formula(String.raw`S(a)=\sum_{i=1}^n(g(x_i)-y_i)^2=\|\Phi a-y\|_2^2`)}`,
                    `Bài toán dẫn đến hệ chuẩn tắc ${formula(String.raw`(\Phi^T\Phi)a=\Phi^Ty`)}`,
                    `Trong đó ${formula(String.raw`\Phi_{ij}=\phi_j(x_i)`)}` + ' là ma trận thiết kế.',
                    'Về hình học, nghiệm bình phương tối thiểu là hình chiếu trực giao của vector dữ liệu y lên không gian sinh bởi các cột của Φ.',
                    'Nếu các hàm cơ sở độc lập tuyến tính trên tập dữ liệu, hệ chuẩn tắc có nghiệm duy nhất.',
                    'Nếu các hàm cơ sở gần phụ thuộc tuyến tính, ma trận chuẩn tắc có thể kém điều kiện và hệ số thu được nhạy với nhiễu dữ liệu.',
                ],
                [
                    'Chọn họ hàm cơ sở và bậc xấp xỉ cần dùng.',
                    'Lập ma trận thiết kế từ các hàm cơ sở và các mốc x.',
                    'Tính ma trận chuẩn tắc và vế phải tương ứng.',
                    'Giải hệ tuyến tính để tìm vector hệ số a.',
                    'Ghép lại thành hàm xấp xỉ cuối cùng, rồi tính vector dư và tổng bình phương sai số.',
                    'Đối chiếu độ khớp của mô hình với dữ liệu để quyết định có cần tăng/giảm số hàm cơ sở hay không.',
                ]
            ),
        ],
    };
}

function pageGuideSpec(pageId, root) {
    switch (pageId) {
        case 'matrix-solve-direct':
            return directLinearCards();
        case 'matrix-solve-iterative':
            return iterativeLinearCards(root);
        case 'matrix-inverse-direct':
            return inverseDirectCards();
        case 'matrix-inverse-iterative':
            return inverseIterativeCards();
        case 'matrix-svd':
            return svdCards(root);
        case 'matrix-approximation':
            return matrixApproximationCards(root);
        case 'matrix-eigen-methods':
            return eigenCards(root);
        case 'nonlinear-solve':
            return rootFindingCards(root);
        case 'polynomial-solve':
            return polynomialCards();
        case 'nonlinear-system-solve':
            return nonlinearSystemCards(root);
        case 'find-intervals':
            return findIntervalsCards(root);
        case 'node-selection':
            return nodeSelectionCards(root);
        case 'horner-table':
            return hornerCards(root);
        case 'approximation':
            return approximationCards(root);
        case 'inverse-interpolation':
            return inverseInterpolationCards(root);
        case 'spline-interpolation':
            return splineCards(root);
        case 'least-squares':
            return leastSquaresCards();
        default:
            return null;
    }
}

function attachGuideListeners(root, render) {
    [
        '#nonlinear-method-select',
        '#ns-method-select',
        '#svd-method-select',
        '#approx-method-select',
        '#newton-method-select',
        '#central-method-select',
    ].forEach((selector) => {
        const element = root.querySelector(selector);
        if (element) {
            element.addEventListener('change', render);
        }
    });

    [
        '.iter-hpt-tab',
        '.eigen-tab',
        '.horner-tab',
        '.approx-tab',
        '.spline-tab',
    ].forEach((selector) => {
        root.querySelectorAll(selector).forEach((button) => {
            button.addEventListener('click', () => {
                window.requestAnimationFrame(render);
            });
        });
    });

    [
        'node-selection-method',
        'find-intervals-method',
        'find-intervals-source',
        'inv-inter-method',
    ].forEach((groupName) => {
        root.querySelectorAll(`input[name="${groupName}"]`).forEach((input) => {
            input.addEventListener('change', render);
        });
    });
}

export function setupMethodGuides(container, pageId) {
    if (!container || !pageId) return;

    const render = () => {
        const spec = pageGuideSpec(pageId, container);
        const existing = container.querySelector('#method-guide-panel');

        if (!spec || !spec.cards || spec.cards.length === 0) {
            if (existing) existing.remove();
            return;
        }

        const html = renderPanel({
            intro: 'Khối này tóm tắt đầu vào, điều kiện áp dụng, công thức toán học và logic thuật toán của phương pháp đang chọn. Mỗi card có thể bấm để đóng/mở toàn bộ phần lý thuyết và logic, còn phần thuật toán được trình bày rõ theo từng bước.',
            contextLabel: spec.contextLabel,
            cards: spec.cards,
        });

        if (existing) {
            existing.outerHTML = html;
        } else {
            container.insertAdjacentHTML('afterbegin', html);
        }

        renderKatex(container.querySelector('#method-guide-panel'));
    };

    attachGuideListeners(container, render);
    render();
}
