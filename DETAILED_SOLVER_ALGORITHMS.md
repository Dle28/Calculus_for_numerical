# Tài liệu chi tiết các thuật toán giải phương trình và hệ phương trình

## Điều hướng nhanh

| Nhóm nội dung | Đi tới |
| --- | --- |
| Mục tiêu và phạm vi | [Mục tiêu](#muc-tieu), [Phạm vi](#pham-vi), [Quy ước](#quy-uoc) |
| Giải phương trình một ẩn | [Tổng quan](#giai-phuong-trinh-mot-an), [Chia đôi](#chia-doi), [Newton](#newton-mot-an), [Dây cung](#day-cung), [Lặp đơn](#lap-don-mot-an) |
| Giải hệ phương trình tuyến tính | [Tổng quan](#giai-he-tuyen-tinh), [Gauss](#gauss), [Gauss-Jordan](#gauss-jordan), [LU](#lu), [Cholesky](#cholesky), [Jacobi](#jacobi), [Gauss-Seidel](#gauss-seidel), [Lặp đơn](#lap-don-he-tuyen-tinh) |
| Giải hệ phương trình phi tuyến | [Tổng quan](#giai-he-phi-tuyen), [Newton](#newton-he-phi-tuyen), [Newton cải tiến](#newton-cai-tien-he-phi-tuyen), [Lặp đơn](#lap-don-he-phi-tuyen) |
| Review và tổng kết | [Các điểm nên review](#review-points), [Kết luận](#ket-luan) |

<details open>
<summary><strong>Mục lục chi tiết</strong></summary>

- [1. Mục tiêu tài liệu](#muc-tieu)
- [2. Phạm vi và nguồn mã](#pham-vi)
- [3. Quy ước chung](#quy-uoc)
- [4. Giải phương trình một ẩn](#giai-phuong-trinh-mot-an)
  - [4.1. Phương pháp chia đôi](#chia-doi)
  - [4.2. Phương pháp Newton một ẩn](#newton-mot-an)
  - [4.3. Phương pháp dây cung](#day-cung)
  - [4.4. Phương pháp lặp đơn cho một ẩn](#lap-don-mot-an)
- [5. Giải hệ phương trình tuyến tính](#giai-he-tuyen-tinh)
  - [5.1. Khử Gauss](#gauss)
  - [5.2. Gauss-Jordan](#gauss-jordan)
  - [5.3. Phân rã LU](#lu)
  - [5.4. Cholesky mở rộng](#cholesky)
  - [5.5. Jacobi](#jacobi)
  - [5.6. Gauss-Seidel](#gauss-seidel)
  - [5.7. Lặp đơn cho hệ tuyến tính](#lap-don-he-tuyen-tinh)
- [6. Giải hệ phương trình phi tuyến](#giai-he-phi-tuyen)
  - [6.1. Newton cho hệ phi tuyến](#newton-he-phi-tuyen)
  - [6.2. Newton cải tiến cho hệ phi tuyến](#newton-cai-tien-he-phi-tuyen)
  - [6.3. Lặp đơn cho hệ phi tuyến](#lap-don-he-phi-tuyen)
- [7. Các điểm đáng review riêng bởi Claude](#review-points)
- [8. Kết luận](#ket-luan)

</details>

<a id="muc-tieu"></a>
## 1. Mục tiêu tài liệu

Tài liệu này mô tả **đúng theo implementation backend hiện tại** của các nhóm thuật toán:

1. Giải phương trình một ẩn.
2. Giải hệ phương trình tuyến tính.
3. Giải hệ phương trình phi tuyến.

Mục tiêu không phải là viết lại lý thuyết thuần túy, mà là ghi rõ:

- Bài toán mà từng thuật toán đang xử lý.
- Điều kiện đầu vào và các kiểm tra trước khi lặp/khử.
- Công thức cốt lõi.
- Điều kiện dừng đúng như code hiện tại.
- Dữ liệu trả về cho formatter/frontend.
- Những điểm implementation khác với cách trình bày chuẩn trong giáo trình.

Lưu ý về yêu cầu gốc: trong cụm "giải hệ pt tiếp tuyến", tài liệu này hiểu theo ngữ cảnh codebase là **giải hệ phương trình tuyến tính**. Nếu ý định là "phương pháp tiếp tuyến/Newton", phần đó đã được bao phủ trong mục giải phương trình một ẩn và hệ phi tuyến.

<a id="pham-vi"></a>
## 2. Phạm vi và nguồn mã

### 2.1. Route liên quan

- `backend/routes/root_finding_routes.py`
- `backend/routes/linear_algebra_routes.py`
- `backend/routes/nonlinear_systems_routes.py`

### 2.2. Implementation thuật toán

- `backend/numerical_methods/root_finding/bisection.py`
- `backend/numerical_methods/root_finding/newton.py`
- `backend/numerical_methods/root_finding/secant.py`
- `backend/numerical_methods/root_finding/simple_iteration.py`
- `backend/numerical_methods/linear_algebra/direct/gauss_elimination.py`
- `backend/numerical_methods/linear_algebra/direct/gauss_jordan.py`
- `backend/numerical_methods/linear_algebra/direct/lu_decomposition.py`
- `backend/numerical_methods/linear_algebra/direct/cholesky.py`
- `backend/numerical_methods/linear_algebra/iterative/jacobi.py`
- `backend/numerical_methods/linear_algebra/iterative/gauss_seidel.py`
- `backend/numerical_methods/linear_algebra/iterative/simple_iteration.py`
- `backend/numerical_methods/nonlinear_systems/newton.py`
- `backend/numerical_methods/nonlinear_systems/newton_modified.py`
- `backend/numerical_methods/nonlinear_systems/simple_iteration.py`

<a id="quy-uoc"></a>
## 3. Quy ước chung

- `tol`, `tolerance`, `zero_tolerance` là các ngưỡng số học.
- `rank(A)` được xác định bằng `np.linalg.matrix_rank(..., tol=...)` ở các nơi có truyền `tol`.
- Với hệ tuyến tính, nhiều hàm hỗ trợ cả `b` là vector cột lẫn ma trận nhiều vế phải.
- Tài liệu này dùng ký hiệu:

$$
A x = b,\quad F(X) = 0,\quad X = \Phi(X)
$$

- Khi nói "nghiệm riêng + không gian null", ta hiểu dạng:

$$
x = x_p + V t
$$

trong đó `x_p` là một nghiệm riêng, `V` là ma trận có các cột là cơ sở của `Null(A)`, và `t` là vector tham số tự do.

<a id="giai-phuong-trinh-mot-an"></a>
## 4. Giải phương trình một ẩn

API tương ứng:

- Route: `POST /api/root-finding/solve`
- `method` hỗ trợ: `bisection`, `newton`, `secant`, `simple_iteration`

Các chế độ dừng dùng chung:

- `stop_mode = "iterations"`: dừng sau số vòng lặp cố định.
- `stop_mode = "absolute_error"`: dừng theo sai số tuyệt đối.
- `stop_mode = "relative_error"`: dừng theo sai số tương đối.

Riêng Newton và Secant còn nhận:

- `adv_stop_condition = "f_xn"` hoặc `adv_stop_condition = "xn_x_prev"`

<a id="chia-doi"></a>
### 4.1. Phương pháp chia đôi

Nguồn: `backend/numerical_methods/root_finding/bisection.py`

#### 4.1.1. Bài toán

Tìm nghiệm của:

$$
f(x) = 0,\quad x \in [a,b]
$$

với điều kiện đầu vào kỳ vọng là `f(a)` và `f(b)` trái dấu.

#### 4.1.2. Kiểm tra đầu vào

Code đang thực hiện:

1. Kiểm tra `f(a)f(b) < 0`.
2. Có một bước kiểm tra đơn điệu gần đúng bằng sai phân trung tâm trên 20 điểm:

$$
f'(x) \approx \frac{f(x+h) - f(x-h)}{2h},\quad h = 10^{-6}
$$

Tuy nhiên bước này **không chặn thuật toán**. Nếu kết quả không đơn điệu, code vẫn tiếp tục.

#### 4.1.3. Công thức lặp

Ở mỗi bước:

$$
c_n = \frac{a_n + b_n}{2}
$$

Sau đó:

- Nếu `f(a_n)f(c_n) < 0` thì cập nhật `b_{n+1} = c_n`.
- Ngược lại cập nhật `a_{n+1} = c_n`.

#### 4.1.4. Sai số và điều kiện dừng

Trong code:

$$
e_n = |c_n - c_{n-1}|
$$

$$
e_n^{(rel)} = \frac{|c_n - c_{n-1}|}{|c_n|}
$$

Điều kiện dừng là một trong các trường hợp:

- `mode = "iterations"`: chạy đúng `N` bước, trừ khi `f(c_n) = 0`.
- `mode = "absolute_error"`: dừng khi `e_n < \varepsilon`.
- `mode = "relative_error"`: dừng khi `e_n^{(rel)} < \varepsilon`.
- Ngoài ra nếu `f(c_n) = 0` thì dừng ngay.

#### 4.1.5. Dữ liệu trả về

- `solution`
- `steps`
- `iterations`

Mỗi phần tử của `steps` có thể chứa:

- `a`, `b`, `c`
- `fc`
- `error`
- `relative_error`

#### 4.1.6. Ghi chú implementation

- Đây là một implementation khá mềm: kiểm tra đơn điệu chỉ mang tính tham khảo.
- Trong chế độ sai số, giá trị `c_prev` ban đầu được gán bằng `a`, nên sai số ở bước đầu tiên là `|c_1 - a|`.

<a id="newton-mot-an"></a>
### 4.2. Phương pháp Newton một ẩn

Nguồn: `backend/numerical_methods/root_finding/newton.py`

#### 4.2.1. Bài toán

Tìm nghiệm của:

$$
f(x) = 0
$$

theo công thức tiếp tuyến:

$$
x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}
$$

#### 4.2.2. Kiểm tra đầu vào

Code kiểm tra gần đúng các điều kiện hội tụ trên đoạn `[a,b]`:

1. `f'(x)` không đổi dấu trên 20 điểm mẫu.
2. `f''(x)` không đổi dấu trên 20 điểm mẫu.

Sau đó tính các hằng số trên 500 điểm mẫu:

$$
m_1 = \min_{x \in [a,b]} |f'(x)|
$$

$$
M_2 = \max_{x \in [a,b]} |f''(x)|
$$

Nếu `m_1` quá nhỏ, code coi công thức sai số không còn đáng tin và báo lỗi.

#### 4.2.3. Công thức lặp

$$
x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}
$$

Nếu `f'(x_k)` gần 0, thuật toán dừng với lỗi.

Nếu `x_{k+1}` ra ngoài đoạn `[a,b]`, thuật toán cũng dừng với lỗi.

#### 4.2.4. Sai số và điều kiện dừng

Nếu chọn `adv_stop_condition = "xn_x_prev"`, code dùng ước lượng hậu nghiệm:

$$
e_k \approx \frac{M_2}{2m_1}(x_{k+1} - x_k)^2
$$

Nếu chọn `adv_stop_condition = "f_xn"`, code dùng:

$$
e_k \approx \frac{|f(x_{k+1})|}{m_1}
$$

Trong chế độ sai số tương đối:

$$
e_k^{(rel)} = \frac{e_k}{|x_{k+1}|}
$$

Thuật toán dừng khi:

- `mode = "iterations"`: đủ số bước yêu cầu.
- `mode = "absolute_error"`: `e_k < \varepsilon`.
- `mode = "relative_error"`: `e_k^{(rel)} < \varepsilon`.

#### 4.2.5. Dữ liệu trả về

- `solution`
- `iterations`
- `steps`
- `m1`
- `M2`
- `x0`

#### 4.2.6. Ghi chú implementation

- Điều kiện hội tụ chỉ được kiểm tra bằng lấy mẫu số học, không phải chứng minh giải tích.
- Sai số residual-based của Newton dùng `f(x_{k+1})`, đúng với bước mới nhất.

<a id="day-cung"></a>
### 4.3. Phương pháp dây cung (Secant)

Nguồn: `backend/numerical_methods/root_finding/secant.py`

#### 4.3.1. Bài toán

Tìm nghiệm của:

$$
f(x) = 0
$$

bằng dạng dây cung với một điểm cố định Fourier `d`.

#### 4.3.2. Kiểm tra đầu vào

Code kiểm tra:

1. `f(a)f(b) < 0`.
2. `f'(x)` không đổi dấu trên 20 điểm mẫu.
3. `f''(x)` không đổi dấu trên 20 điểm mẫu.

#### 4.3.3. Chọn điểm cố định Fourier

Code chọn:

- Nếu `f(a)f''(a) > 0` thì `d = a`, `x0 = b`.
- Nếu `f(b)f''(b) > 0` thì `d = b`, `x0 = a`.
- Nếu cả hai không thỏa, code dùng một nhánh nới lỏng dựa trên `x_mid = (a+b)/2`.

Nếu vẫn không chọn được `d`, thuật toán báo lỗi.

#### 4.3.4. Công thức lặp

Với `d` là điểm cố định:

$$
x_{n+1} = x_n - \frac{f(x_n)(x_n - d)}{f(x_n) - f(d)}
$$

Đồng thời code tính:

$$
m_1 = \min_{x \in [a,b]} |f'(x)|,\quad M_1 = \max_{x \in [a,b]} |f'(x)|
$$

#### 4.3.5. Sai số và điều kiện dừng

Nếu `adv_stop_condition = "xn_x_prev"`:

$$
e_n \approx \frac{M_1 - m_1}{m_1}|x_n - x_{n-1}|
$$

Nếu dùng sai số tương đối:

$$
e_n^{(rel)} = \frac{e_n}{|x_n|}
$$

Nếu `adv_stop_condition = "f_xn"`, code dùng:

$$
e_n \approx \frac{|f(x_n)|}{m_1}
$$

Thuật toán dừng khi:

- đủ số bước yêu cầu, hoặc
- sai số tuyệt đối/tương đối nhỏ hơn ngưỡng.

#### 4.3.6. Dữ liệu trả về

- `solution`
- `steps`
- `iterations`
- `m1`
- `M1`
- `d`
- `x0`

#### 4.3.7. Ghi chú implementation

- Khác với Newton, nhánh `f_xn` ở đây dùng `f(x_n)` của điểm hiện tại trước khi cập nhật, không dùng `f(x_{n+1})`.
- Thuật toán sẽ báo lỗi nếu mẫu số `f(x_n) - f(d)` tiến về 0.

<a id="lap-don-mot-an"></a>
### 4.4. Phương pháp lặp đơn cho một ẩn

Nguồn: `backend/numerical_methods/root_finding/simple_iteration.py`

#### 4.4.1. Bài toán

Giải phương trình điểm bất động:

$$
x = \phi(x)
$$

#### 4.4.2. Kiểm tra đầu vào

Code quy về:

$$
f(x) = \phi(x) - x
$$

và kiểm tra:

$$
f(a)f(b) < 0
$$

Sau đó ước lượng hệ số co:

$$
q = \max_{x \in [a,b]} |\phi'(x)|
$$

trên 200 điểm mẫu. Nếu `q \ge 1`, thuật toán báo lỗi.

#### 4.4.3. Công thức lặp

$$
x_{k+1} = \phi(x_k)
$$

Nếu `x_{k+1}` ra ngoài đoạn `[a,b]`, thuật toán dừng với lỗi.

#### 4.4.4. Sai số và điều kiện dừng

Code dùng ước lượng:

$$
e_k = \frac{q}{1-q}|x_{k+1} - x_k|
$$

Nếu chọn sai số tương đối:

$$
e_k^{(rel)} = \frac{e_k}{|x_{k+1}|}
$$

Điều kiện dừng:

- `mode = "iterations"`: đủ số vòng lặp.
- `mode = "absolute_error"`: `e_k < \varepsilon`.
- `mode = "relative_error"`: `e_k^{(rel)} < \varepsilon`.

#### 4.4.5. Dữ liệu trả về

- `solution`
- `iterations`
- `steps`
- `q`
- `x0`

<a id="giai-he-tuyen-tinh"></a>
## 5. Giải hệ phương trình tuyến tính

API tương ứng:

- `POST /api/linear-algebra/solve/gauss`
- `POST /api/linear-algebra/solve/gauss-jordan`
- `POST /api/linear-algebra/solve/lu`
- `POST /api/linear-algebra/solve/cholesky`
- `POST /api/linear-algebra/solve/jacobi`
- `POST /api/linear-algebra/solve/gauss-seidel`
- `POST /api/linear-algebra/solve/simple-iteration`

<a id="gauss"></a>
### 5.1. Khử Gauss

Nguồn: `backend/numerical_methods/linear_algebra/direct/gauss_elimination.py`

#### 5.1.1. Bài toán

Giải:

$$
A X = B
$$

Code hỗ trợ cả:

- `A` vuông.
- `A` không vuông.
- `B` là vector cột hoặc nhiều cột.

#### 5.1.2. Ý tưởng thuật toán

Code ghép ma trận mở rộng:

$$
[A \mid B]
$$

rồi đưa về dạng bậc thang theo từng cột.

#### 5.1.3. Chọn pivot

Ở cột hiện tại:

- Nếu phần tử tại vị trí pivot hiện tại có trị tuyệt đối nhỏ hơn `tol`, code tìm **hàng đầu tiên phía dưới** có phần tử khác 0 theo `tol`.
- Nếu tìm được thì đổi hàng.
- Nếu không tìm được thì **bỏ qua cột đó**.

Điểm quan trọng: đây **không phải partial pivoting chuẩn theo max-abs**. Nó chỉ tìm hàng khả dụng đầu tiên.

#### 5.1.4. Khử

Với pivot tại `(r,c)`:

$$
R_i \leftarrow R_i - \frac{a_{ic}}{a_{rc}} R_r,\quad i > r
$$

Các phép biến đổi được lưu đầy đủ vào `steps`.

#### 5.1.5. Phân loại kết quả

Sau pha khử:

- Nếu xuất hiện hàng:

$$
[0\ 0\ \dots\ 0 \mid \beta],\quad \beta \ne 0
$$

thì `status = "no_solution"`.

- Nếu `rank(A) < số_ẩn`, code dựng:
  - một nghiệm riêng bằng cách cho các ẩn tự do bằng 0,
  - các vector cơ sở của không gian null bằng thế ngược.

- Nếu `rank(A) = số_ẩn`, code giải thế ngược để lấy nghiệm duy nhất.

#### 5.1.6. Dữ liệu trả về

Tùy nhánh, có thể gồm:

- `status`
- `solution`
- `particular_solution`
- `null_space_vectors`
- `steps`
- `backward_steps`
- `rank`
- `num_vars`

#### 5.1.7. Ghi chú implementation

- Vì không dùng max-abs pivoting, độ ổn định số học của Gauss hiện tại thấp hơn LU.
- `rank` thực chất được xác định bằng số pivot cột tìm được trong quá trình khử.

<a id="gauss-jordan"></a>
### 5.2. Gauss-Jordan

Nguồn: `backend/numerical_methods/linear_algebra/direct/gauss_jordan.py`

#### 5.2.1. Bài toán

Giải:

$$
A X = B
$$

trực tiếp về dạng gần-rút gọn.

#### 5.2.2. Chọn pivot

Thuật toán duyệt trên các hàng và cột chưa được pivot hóa:

1. Ưu tiên phần tử đúng bằng `1` hoặc `-1`.
2. Nếu không có, chọn phần tử có trị tuyệt đối lớn nhất trong phần chưa dùng.

Điểm này khác với Gauss thường, vì pivot có thể được chọn ở bất kỳ hàng/cột chưa dùng nào.

#### 5.2.3. Chuẩn hóa và khử

Chuẩn hóa hàng pivot:

$$
R_p \leftarrow \frac{1}{a_{pc}} R_p
$$

Sau đó khử mọi hàng còn lại:

$$
R_i \leftarrow R_i - a_{ic} R_p,\quad i \ne p
$$

#### 5.2.4. Phân loại kết quả

- Nếu có hàng `0 = \beta`, `\beta \ne 0` thì vô nghiệm.
- Nếu thiếu pivot so với số ẩn thì có vô số nghiệm.
- Nếu đủ pivot thì lấy nghiệm trực tiếp từ dạng sau khử.

#### 5.2.5. Dữ liệu trả về

- `status`
- `solution` hoặc `particular_solution`
- `null_space_vectors`
- `steps`
- `rank`
- `num_vars`

#### 5.2.6. Ghi chú implementation

- Sau khi khử, code phải sắp xếp lại cặp `(pivot_col, pivot_row)` để dựng nghiệm đúng theo thứ tự biến.
- Đây là một version thiên về hiển thị chi tiết hơn là tối ưu số học.

<a id="lu"></a>
### 5.3. Phân rã LU

Nguồn:

- `backend/numerical_methods/linear_algebra/direct/lu_decomposition.py`
- `backend/utils/linalg_helpers.py`

#### 5.3.1. Bài toán

Giải:

$$
A X = B
$$

bằng phân rã:

$$
P A = L U
$$

Code hỗ trợ:

- Ma trận vuông.
- Ma trận chữ nhật.
- Ma trận suy biến.

#### 5.3.2. Thuật toán phân rã

Ở cột `k`, chọn:

$$
p = \arg\max_{i \ge k} |u_{ik}|
$$

Nếu pivot đủ lớn:

1. Đổi hàng `k` với `p` trong `U`, `P`.
2. Nếu `k > 0`, đổi cả phần tương ứng của `L`.
3. Khử các hàng phía dưới:

$$
\ell_{ik} = \frac{u_{ik}}{u_{kk}}
$$

$$
R_i \leftarrow R_i - \ell_{ik} R_k
$$

Nếu cột không tìm được pivot đủ lớn, code giữ nguyên cột đó và tiếp tục.

#### 5.3.3. Giải hệ sau khi phân rã

Code chia thành các trường hợp:

1. Nếu `rank(A) < rank([A|B])`:
   - `status = "no_solution"`.

2. Nếu `rank(A) < n`:
   - `status = "infinite_solutions"`.
   - Một nghiệm riêng được lấy từ `np.linalg.lstsq(A, b, rcond=None)`.
   - Không gian null lấy bằng SVD.

3. Nếu `rank(A) = n` và `A` vuông:
   - Giải:

$$
L Y = P B
$$

$$
U X = Y
$$

4. Nếu `rank(A) = n` và `A` không vuông:
   - Code gọi trực tiếp `np.linalg.lstsq(A, b, rcond=None)`.

#### 5.3.4. Dữ liệu trả về

- `status`
- `decomposition = {P, L, U}`
- `lu_steps`
- `forward_steps`
- `backward_steps`
- `solution` hoặc `particular_solution`
- `null_space_vectors`
- `rank`
- `num_vars`

#### 5.3.5. Ghi chú implementation quan trọng

- LU hiện tại hỗ trợ ma trận chữ nhật, điều này không phải lúc nào cũng được trình bày trong giáo trình cơ bản.
- Với trường hợp `A` không vuông nhưng `rank(A) = n`, code luôn gán:

$$
\texttt{status = "unique\_solution"}
$$

trong khi về mặt ý nghĩa toán học, nếu hệ gốc không tương thích thì nghiệm trả về từ `lstsq` là **nghiệm bình phương tối thiểu duy nhất**, không phải nghiệm đúng của `AX = b`.

Nói cách khác, LU hiện tại đang **gộp hai trường hợp**:

- Nghiệm đúng duy nhất.
- Nghiệm bình phương tối thiểu duy nhất.

Điểm này đáng được Claude review riêng.

<a id="cholesky"></a>
### 5.4. Cholesky mở rộng

Nguồn: `backend/numerical_methods/linear_algebra/direct/cholesky.py`

#### 5.4.1. Ý tưởng chung

Implementation này không giới hạn Cholesky ở dạng SPD truyền thống. Nó triển khai nhiều nhánh:

1. Phân rã trực tiếp trên `A` nếu có thể.
2. Chuyển sang hệ chuẩn tắc `A^T A X = A^T b` nếu `A` đầy cột.
3. Chuyển sang hệ đối ngẫu `(A A^T)\Lambda = b`, rồi dựng `X = A^T \Lambda` nếu `A` đầy hàng.
4. Fallback sang `lstsq + null_space` nếu ma trận làm việc suy biến.

#### 5.4.2. Dạng phân rã được dùng

Code dùng tam giác trên `Q`:

$$
M = Q^T Q
$$

chứ không dùng dạng tam giác dưới `L` như nhiều giáo trình.

#### 5.4.3. Công thức phân rã

Phần tử đường chéo:

$$
q_{kk} = \sqrt{m_{kk} - \sum_{s=1}^{k-1} q_{sk}^2}
$$

Phần tử cùng hàng phía bên phải:

$$
q_{kj} = \frac{m_{kj} - \sum_{s=1}^{k-1} q_{sk} q_{sj}}{q_{kk}},\quad j > k
$$

Sau đó giải:

$$
Q^T y = d,\quad Q z = y
$$

Trong từng nhánh, `z` là nghiệm trực tiếp hoặc là biến phụ `\Lambda`.

#### 5.4.4. Nhánh 1: phân rã trực tiếp trên `A`

Điều kiện implementation:

- `A` phải vuông.
- `A` phải đối xứng theo `np.allclose(A, A.T, atol=tol)`.
- Trong quá trình tính `q_{kk}`, biểu thức dưới căn không được gần 0.

Nếu thỏa, code giải trực tiếp:

$$
A = Q^T Q,\quad Q^T Y = b,\quad Q X = Y
$$

#### 5.4.5. Nhánh 2: `m < n`, `rank(A) = m`

Đây là hệ thiếu phương trình, đầy hàng. Code chuyển sang hệ đối ngẫu:

$$
M = A A^T,\quad d = b
$$

Giải:

$$
M \Lambda = b
$$

rồi dựng:

$$
X = A^T \Lambda
$$

Kết quả trả về là:

- một nghiệm riêng có chuẩn nhỏ nhất,
- kèm cơ sở của `Null(A)` để mô tả họ nghiệm tổng quát.

#### 5.4.6. Nhánh 3: `rank(A) = n`

Đây là trường hợp ma trận đầy cột. Code lập hệ chuẩn tắc:

$$
M = A^T A,\quad d = A^T b
$$

Sau đó giải:

$$
M X = d
$$

Nếu hệ gốc tương thích:

- `status = "unique_solution"`

Nếu hệ gốc không tương thích:

- `status = "least_squares_solution"`

Điểm mạnh của Cholesky hiện tại là phân biệt được rõ nghiệm đúng và nghiệm bình phương tối thiểu ở nhánh này.

#### 5.4.7. Nhánh 4: fallback khi ma trận làm việc suy biến

Nếu `A^T A` hoặc `A A^T` suy biến, code không ném lỗi ngay mà fallback sang:

- `np.linalg.lstsq(A, b, rcond=None)` để lấy một nghiệm riêng.
- SVD để lấy `Null(A)`.

Tùy tình huống, code trả:

- `infinite_solutions`
- `least_squares_infinite`

#### 5.4.8. Dữ liệu trả về

Kết quả của Cholesky là phong phú nhất trong nhóm trực tiếp:

- `status`
- `message`
- `transformation_message`
- `factorization_note`
- `original_factorization`
- `decomposition`
- `solution` hoặc `particular_solution`
- `null_space_vectors`
- `intermediate_y`
- `auxiliary_solution`
- `factorization_steps`
- `forward_steps`
- `backward_steps`
- `reconstruction_steps`
- `residual`
- `residual_norm`
- `rank`
- `num_vars`

#### 5.4.9. Ghi chú implementation quan trọng

- Code làm việc với `dtype=complex`, nên nếu xuất hiện căn bậc hai của số âm, Cholesky **vẫn tiếp tục trong số phức**.
- Vì vậy implementation hiện tại không tương đương hoàn toàn với "Cholesky SPD chuẩn" trong sách.
- Phân rã trực tiếp dùng:

$$
Q^T Q
$$

chứ không dùng liên hợp chuyển vị:

$$
Q^* Q
$$

Điều này nhất quán với việc code dùng `np.dot` thay vì Hermitian product.

<a id="jacobi"></a>
### 5.5. Jacobi

Nguồn: `backend/numerical_methods/linear_algebra/iterative/jacobi.py`

#### 5.5.1. Bài toán

Giải:

$$
A x = b
$$

bằng lặp Jacobi.

#### 5.5.2. Kiểm tra đầu vào

Code yêu cầu:

- `A` vuông.
- Đường chéo chính không có phần tử gần 0.
- `A` chéo trội hàng **hoặc** chéo trội cột:

$$
|a_{ii}| > \sum_{j \ne i} |a_{ij}|
$$

theo hàng hoặc theo cột.

#### 5.5.3. Ma trận lặp

Code đặt:

$$
T = \operatorname{diag}\left(\frac{1}{a_{11}},\dots,\frac{1}{a_{nn}}\right)
$$

$$
B = I - T A,\quad d = T b
$$

nên:

$$
x^{(k+1)} = B x^{(k)} + d
$$

#### 5.5.4. Ước lượng sai số

Nếu chéo trội hàng:

- dùng chuẩn `\infty`,
- hệ số co là `\|B\|_\infty`,
- sai số ước lượng:

$$
e_k \approx \frac{\|B\|_\infty}{1 - \|B\|_\infty}\|x^{(k+1)} - x^{(k)}\|_\infty
$$

Nếu chéo trội cột:

- dùng chuẩn `1`,
- code tính thêm:

$$
\lambda = \frac{\max_i |a_{ii}|}{\min_i |a_{ii}|}
$$

và:

$$
e_k \approx \lambda \cdot \frac{\|I - A T\|_1}{1 - \|I - A T\|_1}\|x^{(k+1)} - x^{(k)}\|_1
$$

#### 5.5.5. Điều kiện dừng

Thuật toán dừng khi:

$$
e_k < \varepsilon
$$

nếu không sẽ báo không hội tụ sau `max_iter`.

#### 5.5.6. Dữ liệu trả về

- `solution`
- `iterations`
- `iterations_data`
- `contraction_coefficient`
- `norm_used`
- `is_row_dominant`
- `is_col_dominant`
- `matrix_B`
- `vector_d`

<a id="gauss-seidel"></a>
### 5.6. Gauss-Seidel

Nguồn: `backend/numerical_methods/linear_algebra/iterative/gauss_seidel.py`

#### 5.6.1. Bài toán

Giải:

$$
A x = b
$$

bằng Gauss-Seidel.

#### 5.6.2. Kiểm tra đầu vào

Code yêu cầu:

- `A` vuông.
- Đường chéo chính không có phần tử gần 0.
- `A` chéo trội hàng hoặc chéo trội cột.

#### 5.6.3. Công thức lặp

Mỗi thành phần được cập nhật theo dạng:

$$
x_j^{(k+1)} =
\frac{1}{a_{jj}}
\left(
b_j
- \sum_{i<j} a_{ji} x_i^{(k+1)}
- \sum_{i>j} a_{ji} x_i^{(k)}
\right)
$$

Trong code, vế phải được tính đúng theo nguyên tắc "dùng giá trị mới ở vế trái, giá trị cũ ở vế phải".

#### 5.6.4. Hệ số sai số

Nếu chéo trội hàng, code đặt:

$$
s = 0
$$

$$
q = \max_i \frac{\sum_{j<i}|a_{ij}|}{|a_{ii}| - \sum_{j>i}|a_{ij}|}
$$

Nếu chéo trội cột, code dùng:

$$
s = \max_j \frac{\sum_{i>j}|a_{ij}|}{|a_{jj}|}
$$

$$
q = \max_j \frac{\sum_{i<j}|a_{ij}|}{|a_{jj}| - \sum_{i>j}|a_{ij}|}
$$

và sai số được ước lượng bởi:

$$
e_k \approx \frac{q}{(1-s)(1-q)} \|x^{(k+1)} - x^{(k)}\|
$$

theo chuẩn `\infty` hoặc `1` tương ứng.

#### 5.6.5. Điều kiện dừng

Thuật toán dừng khi:

$$
e_k < \varepsilon
$$

#### 5.6.6. Dữ liệu trả về

- `solution`
- `iterations`
- `iterations_data`
- `coeff_q`
- `coeff_s`
- `norm_used`
- `is_row_dominant`

#### 5.6.7. Ghi chú implementation

- Kết quả trả về hiện có `is_row_dominant`, nhưng không trả trực tiếp `is_col_dominant` như Jacobi.

<a id="lap-don-he-tuyen-tinh"></a>
### 5.7. Lặp đơn cho hệ tuyến tính

Nguồn: `backend/numerical_methods/linear_algebra/iterative/simple_iteration.py`

#### 5.7.1. Bài toán

Giải hệ ở dạng:

$$
x = Bx + d
$$

#### 5.7.2. Kiểm tra đầu vào

Code yêu cầu:

- `B` vuông.
- Kích thước của `d`, `x0` phù hợp với `B`.

#### 5.7.3. Chuẩn và điều kiện hội tụ

Frontend truyền `norm_choice = "inf"` hoặc `"1"`.

Code tính:

$$
\|B\|
$$

theo chuẩn tương ứng.

Nếu:

$$
\|B\| \ge 1
$$

code **không chặn thuật toán**, chỉ sinh `warning_message`.

#### 5.7.4. Công thức lặp

$$
x^{(k+1)} = B x^{(k)} + d
$$

#### 5.7.5. Điều kiện dừng

Nếu `\|B\| < 1`, code dùng ngưỡng nội bộ:

$$
\texttt{stopping\_threshold} = \left|\frac{1-\|B\|}{\|B\|}\right| \varepsilon
$$

Nếu `\|B\| \ge 1`, code dùng trực tiếp:

$$
\texttt{stopping\_threshold} = \varepsilon
$$

Sau đó dừng khi:

$$
\|x^{(k+1)} - x^{(k)}\| < \texttt{stopping\_threshold}
$$

#### 5.7.6. Dữ liệu trả về

- `solution`
- `iterations`
- `iterations_data`
- `norm_B`
- `warning_message`
- `norm_used`
- `stopping_threshold`

#### 5.7.7. Ghi chú implementation

- Code không nhân thêm hệ số hậu nghiệm kiểu `\|B\|/(1-\|B\|)` vào sai số báo cáo; thay vào đó nó biến đổi trực tiếp ngưỡng dừng.

<a id="giai-he-phi-tuyen"></a>
## 6. Giải hệ phương trình phi tuyến

API tương ứng:

- Route: `POST /api/nonlinear-systems/solve`
- `method` hỗ trợ:
  - `newton`
  - `newton_modified`
  - `simple_iteration`

Điều kiện dừng:

- `stop_option = "iterations"`
- `stop_option = "absolute_error"`
- `stop_option = "relative_error"`

<a id="newton-he-phi-tuyen"></a>
### 6.1. Newton cho hệ phi tuyến

Nguồn: `backend/numerical_methods/nonlinear_systems/newton.py`

#### 6.1.1. Bài toán

Giải hệ:

$$
F(X) = 0,\quad F = (f_1,\dots,f_n)^T
$$

#### 6.1.2. Tiền xử lý

Code:

1. Parse danh sách biểu thức thành vector symbolic `F`.
2. Tạo ma trận Jacobi:

$$
J(X) = \frac{\partial F}{\partial X}
$$

3. Dựng thêm các bản display latex cho frontend.

#### 6.1.3. Công thức lặp

Ở mỗi bước:

$$
\Delta X_k = J(X_k)^{-1} F(X_k)
$$

$$
X_{k+1} = X_k - \Delta X_k
$$

#### 6.1.4. Kiểm tra trong quá trình lặp

Tại mỗi bước:

- Code tính `J(X_k)`.
- Nếu `|\det J(X_k)| < 10^{-12}`, thuật toán báo Jacobi suy biến và dừng.

#### 6.1.5. Sai số và điều kiện dừng

Nếu `stop_option = "iterations"`:

- chạy đúng số vòng lặp được yêu cầu.

Nếu dừng theo sai số, code dùng:

$$
\Delta_k = X_{k+1} - X_k
$$

Nếu `norm_choice = "1"`:

$$
e_k = \|\Delta_k\|_1
$$

$$
e_k^{(rel)} = \frac{\|\Delta_k\|_1}{\|X_{k+1}\|_1}
$$

Ngược lại, mặc định dùng chuẩn vô cùng:

$$
e_k = \|\Delta_k\|_\infty,\quad
e_k^{(rel)} = \frac{\|\Delta_k\|_\infty}{\|X_{k+1}\|_\infty}
$$

Điều kiện dừng:

- `absolute_error`: `e_k < \varepsilon`
- `relative_error`: `e_k^{(rel)} < \varepsilon`

#### 6.1.6. Dữ liệu trả về

- `status`
- `solution`
- `iterations`
- `jacobian_matrix_latex`
- `steps`
- `message`

#### 6.1.7. Ghi chú implementation

- Code nghịch đảo Jacobi một cách tường minh ở từng bước (`J_val.inv()`), không giải hệ tuyến tính phụ.
- Kiểm tra suy biến bằng định thức là trực quan, nhưng có thể nhạy cảm số học.

<a id="newton-cai-tien-he-phi-tuyen"></a>
### 6.2. Newton cải tiến cho hệ phi tuyến

Nguồn: `backend/numerical_methods/nonlinear_systems/newton_modified.py`

#### 6.2.1. Ý tưởng

Khác với Newton chuẩn, Jacobi chỉ được tính và nghịch đảo **một lần tại `X_0`**:

$$
J_0 = J(X_0)
$$

$$
X_{k+1} = X_k - J_0^{-1} F(X_k)
$$

#### 6.2.2. Kiểm tra đầu vào

Nếu:

$$
|\det J(X_0)| < 10^{-12}
$$

thì thuật toán dừng ngay với lỗi.

#### 6.2.3. Sai số và điều kiện dừng

Giống Newton chuẩn:

- sai số tuyệt đối/tương đối được tính từ `X_{k+1} - X_k`
- chuẩn là `1` hoặc `\infty`

#### 6.2.4. Dữ liệu trả về

- `status`
- `solution`
- `iterations`
- `J0_inv_matrix`
- `steps`
- `message`

#### 6.2.5. Ghi chú implementation

- Đây là một trade-off rõ ràng:
  - ít tốn chi phí tính Jacobi/nghịch đảo,
  - nhưng độ hội tụ có thể chậm hơn hoặc mất hội tụ nếu `J(X)` thay đổi mạnh.

<a id="lap-don-he-phi-tuyen"></a>
### 6.3. Lặp đơn cho hệ phi tuyến

Nguồn: `backend/numerical_methods/nonlinear_systems/simple_iteration.py`

#### 6.3.1. Bài toán

Giải hệ điểm bất động:

$$
X = \Phi(X)
$$

với:

- `X_0` là điểm đầu.
- `\alpha` là tâm quả cầu kiểm tra hội tụ.
- `r` là bán kính quả cầu.

#### 6.3.2. Miền kiểm tra hội tụ

Code làm việc trên quả cầu:

$$
\overline{B}(\alpha, r) = \{X : \|X - \alpha\| \le r\}
$$

và yêu cầu `r > 0`.

#### 6.3.3. Ma trận Jacobi và hệ số co

Tính:

$$
J_\Phi(X) = \frac{\partial \Phi}{\partial X}
$$

Sau đó lập hai loại biểu thức:

1. Tổng hàng:

$$
R_i(X) = \sum_{j=1}^n \left|\frac{\partial \phi_i}{\partial x_j}(X)\right|
$$

2. Tổng cột:

$$
C_j(X) = \sum_{i=1}^n \left|\frac{\partial \phi_i}{\partial x_j}(X)\right|
$$

Code xấp xỉ:

$$
K_\infty = \max_i \sup_{X \in \overline{B}(\alpha,r)} R_i(X)
$$

$$
K_1 = \max_j \sup_{X \in \overline{B}(\alpha,r)} C_j(X)
$$

rồi chọn:

$$
K = \min(K_\infty, K_1)
$$

và lấy chuẩn tương ứng với giá trị nhỏ hơn.

Nếu `K \ge 1`, thuật toán báo không thỏa điều kiện hội tụ.

#### 6.3.4. Cách xấp xỉ cực đại trên quả cầu

Code không giải bài toán tối ưu chính xác, mà dùng lấy mẫu xấp xỉ:

- điểm tâm,
- các điểm trục `\alpha \pm r e_i`,
- lưới 5 điểm mỗi chiều nếu `dim <= 3`,
- các đỉnh kiểu `(\pm 1,\dots,\pm 1)` đã scale nếu `4 <= dim <= 10`,
- mẫu ngẫu nhiên trong lòng và trên biên quả cầu với seed cố định `0`.

Do đó `K_\infty` và `K_1` là **ước lượng số học**, không phải giá trị giải tích chính xác.

#### 6.3.5. Công thức lặp

$$
X_{k+1} = \Phi(X_k)
$$

#### 6.3.6. Điều kiện dừng

Nếu `stop_option = "iterations"`:

- chạy đúng `N` bước.

Nếu dừng theo sai số, code dùng:

$$
\Delta_k = X_{k+1} - X_k
$$

và lấy:

$$
\|\Delta_k\|_*
$$

theo chuẩn đã chọn tự động từ `K_\infty` hoặc `K_1`.

Sau đó lập ngưỡng tiên nghiệm:

$$
\texttt{priori\_tol} =
\begin{cases}
\varepsilon \dfrac{1-K}{K}, & K > 10^{-12} \\
\varepsilon, & \text{ngược lại}
\end{cases}
$$

và dừng khi:

$$
\|\Delta_k\|_* < \texttt{priori\_tol}
$$

Nếu người dùng chọn `relative_error`, code vẫn ghi thêm:

$$
e_k^{(rel)} = \frac{\|\Delta_k\|_*}{\|X_{k+1}\|_*}
$$

nhưng **điều kiện dừng thực tế vẫn là bất đẳng thức tuyệt đối ở trên**.

#### 6.3.7. Dữ liệu trả về

- `status`
- `solution`
- `iterations`
- `steps`
- `jacobian_matrix_latex`
- `sphere_center`
- `sphere_radius`
- `row_sum_expressions_latex`
- `row_sum_maxima`
- `col_sum_expressions_latex`
- `col_sum_maxima`
- `contraction_factor_infinity`
- `contraction_factor_one`
- `contraction_factor_K`
- `norm_used_for_K`

#### 6.3.8. Ghi chú implementation quan trọng

- Đây là solver phi tuyến có logic kiểm tra hội tụ chặt nhất, nhưng cũng là solver phụ thuộc nhiều nhất vào xấp xỉ số học.
- Trong nhánh lỗi, hàm này không `raise` như Newton, mà trả trực tiếp:

$$
\{\texttt{"status": "error", ...}\}
$$

để route/formatter xử lý tiếp.

<a id="review-points"></a>
## 7. Các điểm đáng review riêng bởi Claude

Đây là các điểm implementation có khả năng tạo ra câu hỏi khi review:

### 7.1. LU đang gộp "nghiệm đúng duy nhất" và "nghiệm bình phương tối thiểu duy nhất"

Ở nhánh `A` không vuông nhưng `rank(A)=n`, code dùng `np.linalg.lstsq` nhưng vẫn trả:

- `status = "unique_solution"`

Điều này đúng về mặt "vector trả về là duy nhất", nhưng chưa đúng về semantics nếu hệ gốc vô nghiệm.

### 7.2. Cholesky hiện tại không phải Cholesky SPD chuẩn

Implementation cho phép:

- tiếp tục trong số phức,
- làm việc với `Q^T Q`,
- dùng trên hệ chuẩn tắc và hệ đối ngẫu,
- fallback sang `lstsq`.

Vì vậy cần xem đây là một **solver kiểu Cholesky mở rộng**, không phải bản textbook thuần túy.

### 7.3. Gauss có pivoting yếu hơn LU

Gauss chỉ đổi với hàng khả dụng đầu tiên khi pivot hiện tại gần 0, còn LU dùng max-abs partial pivoting.

Nếu cần ổn định số học nhất quán, đây là chỗ nên chuẩn hóa.

### 7.4. Simple iteration cho hệ phi tuyến đang ghi sai số tương đối nhưng dừng theo ngưỡng tuyệt đối

Ở nhánh `relative_error`, code vẫn break theo:

$$
\|\Delta_k\|_* < \texttt{priori\_tol}
$$

không phải theo sai số tương đối đã hiển thị.

Đây là điểm đáng lưu ý nếu muốn UI và backend diễn giải thống nhất.

### 7.5. Newton/Newton hệ phi tuyến đang dùng nghịch đảo tường minh

Việc dùng:

$$
J^{-1}F
$$

hoặc `det(J)` để kiểm tra suy biến là dễ hiểu và tiện hiển thị, nhưng không phải cách ổn định số học nhất nếu sau này muốn scale lên hệ lớn hơn.

### 7.6. Các kiểm tra hội tụ theo đạo hàm đều là kiểm tra lấy mẫu

Trong các solver Newton/Secant/Lặp đơn 1 ẩn, điều kiện hội tụ được kiểm tra trên tập điểm mẫu rời rạc. Điều này phù hợp cho ứng dụng học tập và UI, nhưng không nên diễn đạt như một chứng minh toán học chặt.

<a id="ket-luan"></a>
## 8. Kết luận

Nhìn ở mức kiến trúc, backend hiện tại có ba tầng hành vi khác nhau:

1. **Solver thuần tính toán**: thực hiện phép lặp/khử và trả cấu trúc dữ liệu chi tiết.
2. **Route**: parse đầu vào, kiểm tra định dạng, chọn solver tương ứng.
3. **Formatter/UI**: diễn giải kết quả cho người dùng.

Điểm mạnh của codebase là:

- nhiều solver đã trả về bước trung gian khá giàu dữ liệu,
- Cholesky đã được mở rộng tốt cho ma trận không vuông,
- phần phi tuyến đã hỗ trợ cả Newton, Newton cải tiến, và lặp đơn.

Điểm cần chú ý khi review là tính nhất quán giữa:

- tên trạng thái (`unique_solution`, `least_squares_solution`, ...),
- ý nghĩa toán học thật sự của nghiệm,
- và điều kiện dừng được hiển thị ra UI.
