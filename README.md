# Calculus for Numerical

Ứng dụng web hỗ trợ học và thực hành các phương pháp của môn Giải tích số / Phương pháp số. Dự án tập trung vào việc nhập dữ liệu trực tiếp trên giao diện web, gọi các solver từ backend, và hiển thị kết quả cùng các bước trung gian để người học theo dõi được toàn bộ quá trình tính toán.

## Chức năng chính

### 1. Đại số tuyến tính

- Giải hệ phương trình tuyến tính bằng các phương pháp trực tiếp: Gauss, Gauss-Jordan, LU, Cholesky.
- Giải hệ bằng các phương pháp lặp: Jacobi, Gauss-Seidel, lặp đơn dạng `x = Bx + d`.
- Tính ma trận nghịch đảo bằng Gauss-Jordan, LU, Cholesky, viền quanh và các phương pháp lặp.
- Phân tích trị riêng, vector riêng và SVD.

### 2. Giải phương trình phi tuyến một ẩn

- Chia đôi.
- Dây cung.
- Newton.
- Lặp đơn.
- Giải đa thức và phân ly nghiệm thực.

### 3. Giải hệ phương trình phi tuyến

- Newton.
- Newton cải tiến.
- Lặp đơn.

### 4. Nội suy và xấp xỉ

- Lagrange.
- Newton sai phân, tỉ sai phân.
- Nội suy trung tâm.
- Mốc Chebyshev.

### 5. Sơ đồ Horner

- Chia Horner.
- Nhân Horner.
- Đổi biến đa thức.
- Tính đạo hàm nhiều cấp.

## Công nghệ sử dụng

### Backend

- Python
- Flask
- NumPy
- SymPy
- SciPy

### Frontend

- HTML
- Tailwind CSS
- JavaScript
- KaTeX

## Cấu trúc thư mục

```text
.
├─ backend/
│  ├─ numerical_methods/        # Thuật toán số
│  ├─ routes/                   # API Flask
│  ├─ api_formatters/           # Chuẩn hóa kết quả trả về cho frontend
│  └─ utils/                    # Parser, helper, xử lý dữ liệu
├─ frontend/
│  └─ static/                   # JS, CSS, tài nguyên giao diện
├─ app.py                       # Điểm khởi động ứng dụng Flask
├─ README.md
├─ BACKEND_ARCHITECTURE_AND_ALGORITHMS.md
└─ DETAILED_SOLVER_ALGORITHMS.md
```

## Tài liệu đi kèm

- [Kiến trúc backend và tổng quan thuật toán](./BACKEND_ARCHITECTURE_AND_ALGORITHMS.md)
- [Mô tả chi tiết các solver hiện có](./DETAILED_SOLVER_ALGORITHMS.md)

## Cài đặt và chạy local

### 1. Tạo môi trường ảo

```bash
python -m venv .venv
```

Trên Windows:

```bash
.venv\Scripts\activate
```

Trên macOS/Linux:

```bash
source .venv/bin/activate
```

### 2. Cài dependencies

```bash
pip install -r requirements.txt
```

### 3. Chạy ứng dụng

```bash
python app.py
```

Ứng dụng mặc định chạy tại:

```text
http://127.0.0.1:5001
```

## Quy ước nhập liệu

- Ma trận hoặc vector: các phần tử trên cùng một hàng cách nhau bằng dấu cách, các hàng cách nhau bằng xuống dòng.
- Biểu thức toán học: nhập theo cú pháp mà frontend/backend parser đang hỗ trợ.
- Với các phương pháp lặp: nên nhập thêm vector khởi tạo, dung sai và số vòng lặp tối đa phù hợp.

## Mục tiêu của dự án

Dự án hướng đến ba mục tiêu:

1. Minh họa rõ quá trình tính toán của từng phương pháp.
2. Hỗ trợ kiểm tra điều kiện áp dụng và điều kiện hội tụ ngay trên giao diện.
3. Tạo một codebase đủ rõ để tiếp tục mở rộng thêm phương pháp, thêm formatter và cải thiện phần giải thích trung gian.

## Ghi chú

- Một số thuật toán đã được mở rộng so với phiên bản giáo trình cơ bản, ví dụ Cholesky cho ma trận không vuông và các nhánh bình phương tối thiểu.
- Kết quả hiển thị có thể bao gồm bước trung gian, trạng thái nghiệm, không gian null và nghiệm bình phương tối thiểu tùy từng solver.
