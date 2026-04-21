# backend/numerical_methods/nonlinear_systems/newton.py
import numpy as np
from sympy import Matrix

from backend.utils.nonlinear_system_parser import (
    build_display_latex_matrix,
    parse_nonlinear_system_expressions,
)
from backend.utils.real_numeric import sympy_vector_to_real_array, sympy_vector_to_step_info

# ============================================================================
# HẰNG SỐ CHO KIỂM TRA ĐIỀU KIỆN
# ============================================================================
JACOBIAN_SINGULARITY_THRESHOLD = 1e-12  # Ngưỡng det(J) để xác định ma trận Jacobi suy biến
ZERO_TOLERANCE = 1e-12                  # Ngưỡng để xác định giá trị gần bằng không


def _to_latex_sci(value: float, sig: int = 4) -> str:
    """Dinh dang so theo kieu khoa hoc cho KaTeX (a\times 10^b)."""
    value = float(value)
    if value == 0.0:
        return "0"
    mantissa_str, exp_str = f"{value:.{sig}e}".split("e")
    exp = int(exp_str)
    mantissa = float(mantissa_str)
    if exp == 0:
        return f"{mantissa:g}"
    return f"{mantissa:g}\\times 10^{{{exp}}}"


def _to_latex_num(value: float) -> str:
    value = float(value)
    abs_val = abs(value)
    if abs_val != 0.0 and (abs_val < 1e-4 or abs_val >= 1e6):
        return _to_latex_sci(value, sig=4)
    text = f"{value:.7f}".rstrip("0").rstrip(".")
    return text if text else "0"


def _vector_to_latex(values) -> str:
    parts = [str(_to_latex_num(v)) for v in values]
    return "\\begin{bmatrix}" + " \\\\ ".join(parts) + "\\end{bmatrix}"

def solve_newton_system(n, expr_list, x0_list, stop_option, stop_value, norm_choice, max_iter=200):
    """
    Giải hệ phương trình phi tuyến F(X) = 0 bằng phương pháp Newton.
    
    Kiểm tra điều kiện:
    - Định thức Jacobi: |det(J)| < {JACOBIAN_SINGULARITY_THRESHOLD}
    """
    try:
        # 1. Khởi tạo các biến symbolic và ma trận
        variables, F, display_substitutions, display_F = parse_nonlinear_system_expressions(
            expr_list, n
        )
        X = Matrix(x0_list)
        J = F.jacobian(variables)
        display_variables = [display_substitutions[var] for var in variables]
        display_J = display_F.jacobian(display_variables)
        iterations_data = []

        # 1.1) Thay so ban dau de nguoi dung xem (X0, F(X0), det(J(X0)))
        X0_vec = sympy_vector_to_real_array(X, "X^(0)")
        F0_val = F.subs({variables[i]: X[i] for i in range(n)}).evalf()
        J0_val = J.subs({variables[i]: X[i] for i in range(n)}).evalf()
        detJ0 = float(abs(J0_val.det().evalf()))
        F0_vec = sympy_vector_to_real_array(F0_val, "F(X^(0))")
        initial_evaluation_latex = (
            f"X^{{(0)}} = {_vector_to_latex(X0_vec)}"
            f",\\quad F\\left(X^{{(0)}}\\right) = {_vector_to_latex(F0_vec)}"
            f",\\quad |\\det(J(X^{{(0)}}))| = {_to_latex_sci(detJ0, sig=4)}"
        )

        # 2. Vòng lặp chính
        # TH1: Dừng theo số lần lặp
        if stop_option == 'iterations':
            max_iter = int(stop_value)
            for k in range(max_iter):
                X_prev = X.copy()
                # ========== TÍNH GIÁ TRỊ HÀM VÀ JACOBI ==========
                F_val = F.subs({variables[i]: X[i] for i in range(n)}).evalf()
                J_val = J.subs({variables[i]: X[i] for i in range(n)}).evalf()
                
                # ========== KIỂM TRA ĐIỀU KIỆN: Ma trận Jacobi có suy biến không? ==========
                jacobian_det = float(abs(J_val.det().evalf()))
                
                # Hiển thị thông tin kiểm tra cho người dùng
                is_singular = jacobian_det < JACOBIAN_SINGULARITY_THRESHOLD
                
                if is_singular:
                    raise ValueError(
                        f"❌ LỖI: Ma trận Jacobi suy biến tại bước lặp {k+1}.\n"
                        f"   Điều kiện kiểm tra: |det(J)| < {JACOBIAN_SINGULARITY_THRESHOLD}\n"
                        f"   Giá trị thực tế: |det(J)| = {jacobian_det:.2e}\n"
                        f"   Kết luận: {jacobian_det:.2e} < {JACOBIAN_SINGULARITY_THRESHOLD} ✓ (KHÔNG ĐẠT)"
                    )
                
                # ========== TÍNH NGHIỆM PHƯƠNG TRÌNH TUYẾN TÍNH ==========
                delta_X = J_val.LUsolve(F_val)
                X = X - delta_X

                # ========== TAO THONG TIN "THAY SO" (GIẢI THÍCH) ==========
                X_prev_vec = sympy_vector_to_real_array(X_prev, f"Buoc lap {k + 1} X^(k-1)")
                F_prev_vec = sympy_vector_to_real_array(F_val, f"Buoc lap {k + 1} F")
                delta_vec = sympy_vector_to_real_array(delta_X, f"Buoc lap {k + 1} delta")
                X_next_vec = sympy_vector_to_real_array(X, f"Buoc lap {k + 1} X^(k)")
                eval_latex = (
                    f"X^{{({k})}} = {_vector_to_latex(X_prev_vec)},\\;"
                    f"F(X^{{({k})}}) = {_vector_to_latex(F_prev_vec)},\\;"
                    f"\\Delta X^{{({k})}} = {_vector_to_latex(delta_vec)},\\;"
                    f"|\\det(J(X^{{({k})}}))| = {_to_latex_sci(jacobian_det, sig=4)}\\;"
                    f"\\Rightarrow X^{{({k + 1})}} = {_vector_to_latex(X_next_vec)}"
                )
                
                step_info = sympy_vector_to_step_info(X, f"Buoc lap {k + 1}:")
                step_info['k'] = k + 1
                step_info['jacobian_determinant'] = jacobian_det
                step_info['eval_latex'] = eval_latex
                iterations_data.append(step_info)
        
        # TH2: Dừng theo sai số
        else:
            tol = float(stop_value)
            for k in range(max_iter):
                X_prev = X.copy()
                F_val = F.subs({variables[i]: X[i] for i in range(n)}).evalf()
                J_val = J.subs({variables[i]: X[i] for i in range(n)}).evalf()

                jacobian_det = float(abs(J_val.det().evalf()))
                if jacobian_det < JACOBIAN_SINGULARITY_THRESHOLD:
                    raise ValueError(
                        f"❌ LỖI: Ma trận Jacobi suy biến tại bước lặp {k+1}.\n"
                        f"   Điều kiện kiểm tra: |det(J)| < {JACOBIAN_SINGULARITY_THRESHOLD}\n"
                        f"   Giá trị thực tế: |det(J)| = {jacobian_det:.2e}"
                    )

                delta_X = J_val.LUsolve(F_val)
                X = X - delta_X

                # Thay so (giai thich) tai X^(k)
                X_prev_vec = sympy_vector_to_real_array(X_prev, f"Buoc lap {k + 1} X^(k-1)")
                F_prev_vec = sympy_vector_to_real_array(F_val, f"Buoc lap {k + 1} F")
                delta_vec = sympy_vector_to_real_array(delta_X, f"Buoc lap {k + 1} delta")
                X_next_vec = sympy_vector_to_real_array(X, f"Buoc lap {k + 1} X^(k)")
                eval_latex = (
                    f"X^{{({k})}} = {_vector_to_latex(X_prev_vec)},\\;"
                    f"F(X^{{({k})}}) = {_vector_to_latex(F_prev_vec)},\\;"
                    f"\\Delta X^{{({k})}} = {_vector_to_latex(delta_vec)},\\;"
                    f"|\\det(J(X^{{({k})}}))| = {_to_latex_sci(jacobian_det, sig=4)}\\;"
                    f"\\Rightarrow X^{{({k + 1})}} = {_vector_to_latex(X_next_vec)}"
                )

                # Tính toán sai số
                current_vec = sympy_vector_to_real_array(X, f"Buoc lap {k + 1}:")
                prev_vec = sympy_vector_to_real_array(X_prev, f"Buoc lap {k}:")
                diff_vec = current_vec - prev_vec
                
                if norm_choice == '1':
                    error = float(np.linalg.norm(diff_vec, 1))
                    norm_X = float(np.linalg.norm(current_vec, 1))
                else: # Mặc định là chuẩn vô cùng
                    error = float(np.linalg.norm(diff_vec, np.inf))
                    norm_X = float(np.linalg.norm(current_vec, np.inf))
                
                rel_err = error / norm_X if norm_X > 1e-12 else float('inf')

                step_info = {f"x{i+1}": current_vec[i] for i in range(n)}
                step_info['k'] = k + 1
                step_info['error'] = error
                step_info['relative_error'] = rel_err
                step_info['jacobian_determinant'] = jacobian_det
                step_info['eval_latex'] = eval_latex
                iterations_data.append(step_info)

                if (stop_option == 'absolute_error' and error < tol) or \
                   (stop_option == 'relative_error' and rel_err < tol):
                    break
            else: # Nếu vòng lặp kết thúc mà không break
                raise ValueError(f"Phương pháp không hội tụ sau {max_iter} lần lặp.")
        
        # 3. Chuẩn bị kết quả trả về
        # Chuyển ma trận Jacobi symbolic sang LaTeX
        try:
            J_latex = build_display_latex_matrix(display_J)
        except Exception:
            J_latex = [[str(elem) for elem in row] for row in J.tolist()]
            
        return {
            "status": "success",
            "solution": sympy_vector_to_real_array(X, "Nghiem cuoi cung:").tolist(),
            "iterations": len(iterations_data),
            "jacobian_matrix_latex": J_latex,
            "error_norm_used": norm_choice,
            "jacobian_check_mode": "each_iteration",
            "jacobian_det_threshold": JACOBIAN_SINGULARITY_THRESHOLD,
            "system_size": n,
            "initial_guess": [float(v) for v in x0_list],
            "initial_evaluation_latex": initial_evaluation_latex,
            "steps": iterations_data,
            "message": f"Hội tụ sau {len(iterations_data)} lần lặp."
        }

    except (ValueError, TypeError) as e:
        raise e # Ném lại lỗi để route xử lý
    except Exception as e:
        import traceback
        raise Exception(f"Lỗi không xác định trong thuật toán: {str(e)}\n{traceback.format_exc()}")
