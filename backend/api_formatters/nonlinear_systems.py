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
        norm_symbol = "\\infty" if norm_used == "infinity" else "1"

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

        formula = ""
        k_factor = result.get("contraction_factor_K")

        error_prefix = ""
        if k_factor is not None and k_factor < 1:
            error_prefix = f"\\frac{{K}}{{1-K}} "

        if stop_option == "absolute_error":
            formula = (
                f"{error_prefix}||X^{{(k)}} - X^{{(k-1)}}||_{{{norm_symbol}}} < {stop_value}"
            )
        elif stop_option == "relative_error":
            formula = (
                f"\\frac{{{error_prefix}||X^{{(k)}} - X^{{(k-1)}}||_{{{norm_symbol}}}}}"
                f"{{||X^{{(k)}}||_{{{norm_symbol}}}}} < {stop_value}"
            )

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
            "stopping_condition_formula": formula,
        }

    return response
