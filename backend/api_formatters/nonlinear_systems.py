def _build_stop_formula(stop_option, stop_value, norm_symbol, error_prefix=""):
    if stop_option == "absolute_error":
        return f"{error_prefix}||X^{{(k)}} - X^{{(k-1)}}||_{{{norm_symbol}}} < {stop_value}"

    if stop_option == "relative_error":
        return (
            f"\\frac{{{error_prefix}||X^{{(k)}} - X^{{(k-1)}}||_{{{norm_symbol}}}}}"
            f"{{||X^{{(k)}}||_{{{norm_symbol}}}}} < {stop_value}"
        )

    if stop_option == "iterations":
        return f"k = {int(stop_value)}"

    return ""


def _build_nonlinear_table_formulas(method_name, norm_symbol, has_standard_error=False):
    formulas = {
        "error_label": "\\eta_k",
        "error_formula": f"\\eta_k = ||X^{{(k)}} - X^{{(k-1)}}||_{{{norm_symbol}}}",
        "relative_error_label": "\\delta_k",
        "relative_error_formula": (
            f"\\delta_k = \\frac{{\\eta_k}}{{||X^{{(k)}}||_{{{norm_symbol}}}}}"
        ),
    }

    if has_standard_error:
        formulas["standard_error_label"] = "\\Delta_k"
        formulas["standard_error_formula"] = (
            f"\\Delta_k = \\frac{{K}}{{1-K}}\\eta_k, \\quad "
            f"\\delta_k = \\frac{{\\Delta_k}}{{||X^{{(k)}}||_{{{norm_symbol}}}}}"
        )

    return formulas


def _build_input_checks(method_name, result, norm_symbol, stop_formula):
    is_simple_iteration = any(
        key in result
        for key in ("row_sum_expressions_latex", "col_sum_expressions_latex", "contraction_factor_K")
    )
    system_size = result.get("system_size")
    initial_guess = result.get("initial_guess")
    checks = [
        {
            "status": "passed",
            "label": "Kich thuoc he",
            "detail": "Da kiem tra so phuong trinh bang so gia tri ban dau cua vector X0.",
            "formula": f"n = {system_size}" if system_size is not None else None,
        }
    ]

    if is_simple_iteration:
        k_infty = result.get("contraction_factor_infinity", result.get("max_row_sum"))
        k_one = result.get("contraction_factor_one", result.get("max_col_sum"))
        k_selected = result.get("contraction_factor_K")
        norm_used_for_k = result.get("norm_used_for_K")
        alpha = result.get("sphere_center")
        radius = result.get("sphere_radius")
        initial_eval = result.get("initial_evaluation_latex")

        k_formula_parts = []
        if k_infty is not None:
            k_formula_parts.append(f"K_{{\\infty}} \\approx {k_infty}")
        if k_one is not None:
            k_formula_parts.append(f"K_1 \\approx {k_one}")
        if k_selected is not None and norm_used_for_k:
            k_norm_symbol = "\\infty" if norm_used_for_k == "infinity" else "1"
            k_formula_parts.append(f"K = K_{k_norm_symbol} \\approx {k_selected}")

        checks.extend(
            [
                {
                    "status": "passed",
                    "label": "Jacobi cua anh xa lap",
                    "detail": "Da lap ma tran Jacobi J_phi(X) va so sanh he so co theo chuan 1 va vo cung.",
                    "formula": "K = ||J_{\\phi}(X)|| < 1",
                },
                {
                    "status": "passed",
                    "label": "Mien lam viec",
                    "detail": "Dieu kien hoi tu duoc danh gia tren hinh cau S(\\alpha, r) do nguoi dung cung cap.",
                    "formula": "X \\in S(\\alpha, r)",
                },
                {
                    "status": "passed",
                    "label": "He so co (thay so)",
                    "detail": "Hien thi gia tri K theo 2 chuan va K duoc chon (nho nhat).",
                    "formula": ",\\quad ".join(k_formula_parts) if k_formula_parts else None,
                },
                {
                    "status": "info",
                    "label": "Thong so hinh cau",
                    "detail": "Tam va ban kinh hinh cau dung de danh gia GTLN trong dieu kien hoi tu.",
                    "formula": (
                        f"\\alpha = \\begin{{bmatrix}}{' \\\\ '.join(str(v) for v in alpha)}\\end{{bmatrix}},\\;"
                        f"r = {radius}"
                    )
                    if isinstance(alpha, list) and radius is not None
                    else None,
                },
                {
                    "status": "passed",
                    "label": "Sai so dung de dung",
                    "detail": "Bang lap hien ca sai so buoc lap va sai so chuan sau khi nhan he so K/(1-K).",
                    "formula": "\\Delta_k = \\frac{K}{1-K}\\eta_k",
                },
            ]
        )

        if initial_eval:
            checks.append(
                {
                    "status": "info",
                    "label": "Thay so tai X0",
                    "detail": "Thay X0 vao anh xa lap de tinh \\Phi(X0) va tao buoc lap dau tien.",
                    "formula": initial_eval,
                }
            )

        if isinstance(initial_guess, list) and len(initial_guess) > 0:
            joined = " \\\\ ".join(str(v) for v in initial_guess)
            checks.append(
                {
                    "status": "info",
                    "label": "Vector ban dau",
                    "detail": "Gia tri khoi tao X0 nguoi dung cung cap.",
                    "formula": f"X^{{(0)}} = \\begin{{bmatrix}}{joined}\\end{{bmatrix}}",
                }
            )
    else:
        jacobian_mode = result.get("jacobian_check_mode", "each_iteration")
        det_threshold = result.get("jacobian_det_threshold")
        jacobian_detail = (
            "Moi buoc lap deu kiem tra det(J(X_k)) khac 0 truoc khi giai he Jacobi."
            if jacobian_mode == "each_iteration"
            else "Chi kiem tra det(J(X_0)) khac 0 mot lan truoc khi co dinh J(X_0)^{-1}."
        )
        jacobian_formula = "\\det(J(X)) \\neq 0"
        if det_threshold is not None:
            jacobian_formula = f"|\\det(J(X))| \\ge {det_threshold}"
        checks.extend(
            [
                {
                    "status": "passed",
                    "label": "Dao ham / ma tran Jacobi",
                    "detail": "Da lap ma tran Jacobi J(X) tu he F(X) = 0.",
                    "formula": "J(X) = \\left[\\frac{\\partial F_i}{\\partial x_j}\\right]",
                },
                {
                    "status": "passed",
                    "label": "Kha nghich cua Jacobi",
                    "detail": jacobian_detail,
                    "formula": jacobian_formula,
                },
                {
                    "status": "passed",
                    "label": "Chuan sai so",
                    "detail": f"Sai so buoc lap va sai so tuong doi deu duoc tinh theo chuan {norm_symbol}.",
                    "formula": stop_formula,
                },
            ]
        )

        initial_eval = result.get("initial_evaluation_latex")
        if initial_eval:
            checks.append(
                {
                    "status": "info",
                    "label": "Thay so tai X0",
                    "detail": "Gia tri X0 duoc thay vao he F(X) va Jacobi J(X) de tinh F(X0) va kiem tra Jacobi.",
                    "formula": initial_eval,
                }
            )

        if isinstance(initial_guess, list) and len(initial_guess) > 0:
            joined = " \\\\ ".join(str(v) for v in initial_guess)
            checks.append(
                {
                    "status": "info",
                    "label": "Vector ban dau",
                    "detail": "Gia tri khoi tao X0 nguoi dung cung cap.",
                    "formula": f"X^{{(0)}} = \\begin{{bmatrix}}{joined}\\end{{bmatrix}}",
                }
            )

    return checks


def format_nonlinear_system_result(method_name, result, stop_option=None, stop_value=None):
    """
    Dinh dang ket qua tu cac phuong phap giai he phi tuyen.
    """
    if result.get("status") != "success":
        return {"error": result.get("error", "Loi khong xac dinh")}

    response = {
        "method": method_name,
        "status": "success",
        "message": result.get("message"),
        "solution": result.get("solution"),
        "iterations": result.get("iterations"),
        "steps": result.get("steps"),
    }

    if "jacobian_matrix_latex" in result:
        response["jacobian_matrix_latex"] = result["jacobian_matrix_latex"]

    if "J0_inv_matrix" in result:
        response["J0_inv_matrix"] = result["J0_inv_matrix"]

    error_norm_used = result.get("error_norm_used", result.get("norm_used_for_K", "infinity"))
    norm_symbol = "\\infty" if error_norm_used == "infinity" else "1"
    has_standard_error = any(
        isinstance(step, dict) and "standard_error" in step for step in (result.get("steps") or [])
    )
    response["table_formulas"] = _build_nonlinear_table_formulas(
        method_name,
        norm_symbol,
        has_standard_error=has_standard_error,
    )

    stop_formula = _build_stop_formula(stop_option, stop_value, norm_symbol)
    response["input_checks"] = _build_input_checks(
        method_name,
        result,
        norm_symbol,
        stop_formula,
    )

    has_convergence_info = any(
        key in result
        for key in (
            "norm_used_for_K",
            "contraction_factor_K",
            "row_sum_expressions_latex",
            "col_sum_expressions_latex",
        )
    )

    if has_convergence_info:
        norm_used = result.get("norm_used_for_K")
        selected_norm_symbol = "\\infty" if norm_used == "infinity" else "1"

        selected_sum_expressions_latex = (
            result.get("row_sum_expressions_latex")
            if norm_used == "infinity"
            else result.get("col_sum_expressions_latex")
        )
        selected_sum_maxima = (
            result.get("row_sum_maxima")
            if norm_used == "infinity"
            else result.get("col_sum_maxima")
        )
        selected_label_prefix = "R" if norm_used == "infinity" else "C"
        selected_index_symbol = "i" if norm_used == "infinity" else "j"

        error_prefix = ""
        k_factor = result.get("contraction_factor_K")
        if k_factor is not None and k_factor < 1:
            error_prefix = "\\frac{K}{1-K} "

        response["convergence_info"] = {
            "sphere_center": result.get("sphere_center"),
            "sphere_radius": result.get("sphere_radius"),
            "row_sum_expressions_latex": result.get("row_sum_expressions_latex"),
            "row_sum_maxima": result.get("row_sum_maxima"),
            "col_sum_expressions_latex": result.get("col_sum_expressions_latex"),
            "col_sum_maxima": result.get("col_sum_maxima"),
            "selected_norm_sum_expressions_latex": selected_sum_expressions_latex,
            "selected_norm_sum_maxima": selected_sum_maxima,
            "selected_norm_sum_label_prefix": selected_label_prefix,
            "selected_norm_sum_index_symbol": selected_index_symbol,
            "contraction_factor_infinity": result.get("contraction_factor_infinity"),
            "contraction_factor_one": result.get("contraction_factor_one"),
            "max_row_sum": result.get("max_row_sum"),
            "max_col_sum": result.get("max_col_sum"),
            "contraction_factor_K": result.get("contraction_factor_K"),
            "norm_used_for_K": result.get("norm_used_for_K"),
            "norm_symbol": selected_norm_symbol,
            "stopping_condition_formula": _build_stop_formula(
                stop_option,
                stop_value,
                selected_norm_symbol,
                error_prefix=error_prefix,
            ),
        }

    return response
