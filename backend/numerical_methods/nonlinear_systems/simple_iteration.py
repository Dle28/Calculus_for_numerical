import itertools
import traceback

import numpy as np
from sympy import Abs, Matrix, lambdify

from backend.utils.nonlinear_system_parser import (
    build_display_latex_expressions,
    build_display_latex_matrix,
    parse_nonlinear_system_expressions,
)
from backend.utils.real_numeric import sympy_vector_to_real_array, sympy_vector_to_step_info


def _evaluate_abs_value(func, point):
    value = np.asarray(func(*point), dtype=np.complex128)
    return float(np.max(np.abs(value)))


def _is_inside_ball(point, center, radius, tolerance=1e-12):
    return np.linalg.norm(point - center) <= radius + tolerance


def _sample_search_maximum_on_ball(func, center, radius):
    dim = len(center)
    best = 0.0
    evaluated = False

    center = np.asarray(center, dtype=float)
    candidates = [center]

    if radius <= 0:
        current_value = _evaluate_abs_value(func, center)
        return current_value if np.isfinite(current_value) else -np.inf

    axis_points = []
    for axis in range(dim):
        direction = np.zeros(dim, dtype=float)
        direction[axis] = radius
        axis_points.append(center + direction)
        axis_points.append(center - direction)
    candidates.extend(axis_points)

    bounds = [(coord - radius, coord + radius) for coord in center]

    if dim <= 3:
        axes = [np.linspace(low, high, num=5) for low, high in bounds]
        candidates.extend(
            np.array(point, dtype=float)
            for point in itertools.product(*axes)
            if _is_inside_ball(np.array(point, dtype=float), center, radius)
        )
    elif dim <= 10:
        sign_patterns = itertools.product((-1.0, 1.0), repeat=dim)
        scale = radius / np.sqrt(dim)
        candidates.extend(center + scale * np.array(pattern, dtype=float) for pattern in sign_patterns)

    rng = np.random.default_rng(0)
    sample_count = max(256, 128 * max(dim, 1))
    directions = rng.normal(size=(sample_count, dim))
    norms = np.linalg.norm(directions, axis=1, keepdims=True)
    norms[norms < 1e-12] = 1.0
    directions = directions / norms

    interior_scales = radius * np.power(rng.random(sample_count), 1.0 / max(dim, 1))
    boundary_scales = np.full(sample_count, radius)
    candidates.extend(center + interior_scales[:, None] * directions)
    candidates.extend(center + boundary_scales[:, None] * directions)

    for point in candidates:
        current_value = _evaluate_abs_value(func, point)
        if np.isfinite(current_value):
            best = max(best, current_value)
            evaluated = True

    return best if evaluated else -np.inf


def find_global_maximum_on_ball(func, variables, center, radius):
    """Tim GTLN cua ham nhieu bien tren hinh cau bang lay mau xap xi."""
    del variables
    try:
        return _sample_search_maximum_on_ball(func, center, radius)
    except Exception:
        return -np.inf


def solve_simple_iteration_system(n, expr_list, x0_list, alpha_list, radius, stop_option, stop_value):
    """
    Giai he phuong trinh phi tuyen X = phi(X) bang phuong phap lap don.
    """
    try:
        variables, phi, display_substitutions, display_phi = parse_nonlinear_system_expressions(
            expr_list, n
        )
        X = Matrix(x0_list)
        alpha = np.array(alpha_list, dtype=float)
        radius = float(radius)

        if radius <= 0:
            raise ValueError("Ban kinh r phai lon hon 0.")

        J = phi.jacobian(variables)
        abs_J = J.applyfunc(Abs)
        display_variables = [display_substitutions[var] for var in variables]
        display_J = display_phi.jacobian(display_variables)
        display_abs_J = display_J.applyfunc(Abs)

        row_sum_expressions = [
            sum((abs_J[i, j] for j in range(n)), 0) for i in range(n)
        ]
        col_sum_expressions = [
            sum((abs_J[i, j] for i in range(n)), 0) for j in range(n)
        ]
        display_row_sum_expressions = [
            sum((display_abs_J[i, j] for j in range(n)), 0) for i in range(n)
        ]
        display_col_sum_expressions = [
            sum((display_abs_J[i, j] for i in range(n)), 0) for j in range(n)
        ]

        row_sum_maxima = np.zeros(n)
        for i, row_sum_expression in enumerate(row_sum_expressions):
            func_to_optimize = lambdify(variables, row_sum_expression, "numpy")
            max_val = find_global_maximum_on_ball(func_to_optimize, variables, alpha, radius)
            if max_val == -np.inf:
                raise ValueError(f"Khong the tim GTLN cho tong hang {i + 1} cua ma tran Jacobi.")
            row_sum_maxima[i] = max_val

        col_sum_maxima = np.zeros(n)
        for j, col_sum_expression in enumerate(col_sum_expressions):
            func_to_optimize = lambdify(variables, col_sum_expression, "numpy")
            max_val = find_global_maximum_on_ball(func_to_optimize, variables, alpha, radius)
            if max_val == -np.inf:
                raise ValueError(f"Khong the tim GTLN cho tong cot {j + 1} cua ma tran Jacobi.")
            col_sum_maxima[j] = max_val

        K_infinity = float(np.max(row_sum_maxima))
        K_one = float(np.max(col_sum_maxima))

        if K_infinity < K_one:
            K = K_infinity
            norm_to_use = "infinity"
        else:
            K = K_one
            norm_to_use = "1"

        if K >= 1:
            raise ValueError(
                "Dieu kien hoi tu khong thoa man. "
                f"K_inf ~= {K_infinity:.4f}, K_1 ~= {K_one:.4f}, "
                f"gia tri nho nhat K ~= {K:.4f} >= 1."
            )

        iterations_data = []
        if stop_option == "iterations":
            max_iter = int(stop_value)
            for k in range(max_iter):
                X = phi.subs({variables[i]: X[i] for i in range(n)}).evalf()
                step_info = sympy_vector_to_step_info(X, f"Buoc lap {k + 1}:")
                step_info["k"] = k + 1
                iterations_data.append(step_info)
        else:
            tol = float(stop_value)
            priori_tol = tol * (1 - K) / K if K > 1e-12 else tol

            for k in range(200):
                X_prev = X.copy()
                X = phi.subs({variables[i]: X[i] for i in range(n)}).evalf()

                current_vec = sympy_vector_to_real_array(X, f"Buoc lap {k + 1}:")
                prev_vec = sympy_vector_to_real_array(X_prev, f"Buoc lap {k}:")
                diff_vec_abs = np.abs(current_vec - prev_vec)

                if norm_to_use == "1":
                    abs_err = np.sum(diff_vec_abs)
                    norm_X = np.sum(np.abs(current_vec))
                else:
                    abs_err = np.max(diff_vec_abs)
                    norm_X = np.max(np.abs(current_vec))

                rel_err = abs_err / norm_X if norm_X > 1e-12 else float("inf")

                step_info = {f"x{i + 1}": val for i, val in enumerate(current_vec)}
                step_info["k"] = k + 1
                step_info["error"] = abs_err if stop_option == "absolute_error" else rel_err
                iterations_data.append(step_info)

                if abs_err < priori_tol:
                    break
            else:
                raise ValueError("Phuong phap khong hoi tu sau 200 lan lap.")

        return {
            "status": "success",
            "solution": sympy_vector_to_real_array(X, "Nghiem cuoi cung:").tolist(),
            "iterations": len(iterations_data),
            "steps": iterations_data,
            "message": f"Hoi tu sau {len(iterations_data)} lan lap.",
            "jacobian_matrix_latex": build_display_latex_matrix(display_J),
            "sphere_center": alpha.tolist(),
            "sphere_radius": radius,
            "row_sum_expressions_latex": build_display_latex_expressions(
                display_row_sum_expressions
            ),
            "row_sum_maxima": row_sum_maxima.tolist(),
            "col_sum_expressions_latex": build_display_latex_expressions(
                display_col_sum_expressions
            ),
            "col_sum_maxima": col_sum_maxima.tolist(),
            "contraction_factor_infinity": K_infinity,
            "contraction_factor_one": K_one,
            "max_row_sum": K_infinity,
            "max_col_sum": K_one,
            "contraction_factor_K": float(K),
            "norm_used_for_K": norm_to_use,
        }
    except (ValueError, TypeError) as e:
        return {"status": "error", "error": f"Loi: {str(e)}"}
    except Exception as e:
        return {"status": "error", "error": f"Loi khong xac dinh: {str(e)}\n{traceback.format_exc()}"}
