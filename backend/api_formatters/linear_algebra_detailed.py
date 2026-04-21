from backend.api_formatters.linear_algebra import _format_numeric_data


def format_gauss_elimination_result(result):
    num_vars = result.get("num_vars", -1)
    steps_formatted = []
    step_counter = 1

    for step_data in result["steps"]:
        if step_data["type"] == "pivot":
            message = f"<b>Bước {step_counter}:</b> Hoán vị hàng {step_data['to_row'] + 1} và {step_data['from_row'] + 1}."
        elif step_data["type"] == "elimination":
            message = (
                f"<b>Bước {step_counter}:</b> Dùng hàng {step_data['pivot_row'] + 1} "
                f"để khử các phần tử trong cột {step_data['pivot_col'] + 1}."
            )
        else:
            message = (
                f"<b>Bước {step_counter}:</b> Bỏ qua cột {step_data['pivot_col'] + 1} "
                "vì không tìm được pivot khác 0."
            )

        step_formatted = _format_numeric_data(step_data)
        step_formatted["message"] = message
        step_formatted["num_vars"] = num_vars
        steps_formatted.append(step_formatted)
        step_counter += 1

    if result["status"] == "no_solution":
        return {
            "method": "Khử Gauss",
            "status": "no_solution",
            "message": "Hệ phương trình vô nghiệm.",
            "steps": steps_formatted,
        }

    if result["status"] == "infinite_solutions":
        return {
            "method": "Khử Gauss",
            "status": "infinite_solutions",
            "message": f"Hệ có vô số nghiệm (Hạng = {result['rank']} < Số ẩn = {result['num_vars']}).",
            "steps": steps_formatted,
            "general_solution": {
                "particular_solution": _format_numeric_data(result["particular_solution"]),
                "null_space_vectors": _format_numeric_data(result["null_space_vectors"]),
            },
        }

    backward_steps_formatted = []
    for bs_step in result.get("backward_steps", []):
        step_formatted = _format_numeric_data(bs_step)
        step_formatted["message"] = f"Tính toán cho biến x<sub>{bs_step['row'] + 1}</sub>."
        backward_steps_formatted.append(step_formatted)

    return {
        "method": "Khử Gauss",
        "status": "unique_solution",
        "message": "Hệ phương trình có nghiệm duy nhất.",
        "solution": _format_numeric_data(result["solution"]),
        "steps": steps_formatted,
        "backward_steps": backward_steps_formatted,
    }


def format_gauss_jordan_result(result):
    num_vars = result.get("num_vars", -1)
    steps_formatted = []
    step_counter = 1

    for step_data in result["steps"]:
        if step_data["type"] == "pivot_selection":
            pv = step_data["pivot_value"]
            pr = step_data["pivot_row"] + 1
            pc = step_data["pivot_col"] + 1
            message = f"<b>Bước {step_counter}:</b> Chọn pivot là {pv:.4f} tại ({pr}, {pc})."
        else:
            pc = step_data["pivot_col"] + 1
            message = (
                f"<b>Bước {step_counter}:</b> Chuẩn hóa hàng pivot và khử các phần tử "
                f"trong cột {pc}."
            )

        step_formatted = _format_numeric_data(step_data)
        step_formatted["message"] = message
        step_formatted["num_vars"] = num_vars
        steps_formatted.append(step_formatted)
        step_counter += 1

    if result["status"] == "no_solution":
        return {
            "method": "Gauss-Jordan",
            "status": "no_solution",
            "message": "Hệ phương trình vô nghiệm.",
            "steps": steps_formatted,
        }

    if result["status"] == "infinite_solutions":
        return {
            "method": "Gauss-Jordan",
            "status": "infinite_solutions",
            "message": f"Hệ có vô số nghiệm (Hạng = {result['rank']} < Số ẩn = {result['num_vars']}).",
            "steps": steps_formatted,
            "general_solution": {
                "particular_solution": _format_numeric_data(result["particular_solution"]),
                "null_space_vectors": _format_numeric_data(result["null_space_vectors"]),
            },
        }

    return {
        "method": "Gauss-Jordan",
        "status": "unique_solution",
        "message": "Hệ phương trình có nghiệm duy nhất.",
        "solution": _format_numeric_data(result["solution"]),
        "steps": steps_formatted,
    }


def format_lu_result(result):
    formatted = {"method": "Phân rã LU"}

    steps_formatted = []
    for step in result.get("lu_steps", []):
        step_index = step.get("step_index", 0) + 1
        step_formatted = _format_numeric_data(step)
        step_formatted["message"] = step.get(
            "message",
            f"<b>Bước {step_index}:</b> Cập nhật phân rã LU ở cột {step_index}.",
        )
        steps_formatted.append(step_formatted)
    formatted["steps"] = steps_formatted

    status = result["status"]
    formatted["status"] = status

    if status == "no_solution":
        formatted["message"] = f"Hệ vô nghiệm (hạng(A)={result['rank']} < hạng([A|B]))."
    elif status == "infinite_solutions":
        formatted["message"] = f"Hệ có vô số nghiệm (hạng(A)={result['rank']} < số ẩn={result['num_vars']})."
        formatted["general_solution"] = {
            "particular_solution": _format_numeric_data(result["particular_solution"]),
            "null_space_vectors": _format_numeric_data(result["null_space_vectors"]),
        }
        formatted["solution_note"] = (
            "LU vẫn mô tả được các bước khử và các ma trận phân rã; "
            "nghiệm tổng quát được dựng từ nghiệm riêng và không gian null."
        )
    elif status == "unique_solution":
        formatted["message"] = "Hệ có nghiệm duy nhất (hoặc nghiệm xấp xỉ tốt nhất)."
        formatted["solution"] = _format_numeric_data(result["solution"])
        if result.get("intermediate_y") is not None:
            formatted["intermediate_y"] = _format_numeric_data(result["intermediate_y"])

    if "decomposition" in result:
        decomp = result["decomposition"]
        formatted["decomposition"] = {
            "P": _format_numeric_data(decomp["P"]),
            "L": _format_numeric_data(decomp["L"]),
            "U": _format_numeric_data(decomp["U"]),
        }

    formatted["forward_steps"] = _format_numeric_data(result.get("forward_steps", []))
    formatted["backward_steps"] = _format_numeric_data(result.get("backward_steps", []))
    return formatted


def format_cholesky_result(result):
    decomp = result["decomposition"]
    formatted = {
        "method": "Cholesky",
        "status": result["status"],
        "message": result.get("message", "Không có mô tả cho kết quả Cholesky."),
        "transformation_message": result["transformation_message"],
        "factorization_note": result.get("factorization_note"),
        "working_system_description": result.get("working_system_description"),
        "decomposition_rhs_label": result.get("decomposition_rhs_label", "d"),
        "solution_heading": result.get("solution_heading"),
        "general_solution_heading": result.get("general_solution_heading"),
        "solution_note": result.get("solution_note"),
        "decomposition": {
            "Q": _format_numeric_data(decomp["Q"]) if decomp.get("Q") is not None else None,
            "Qt": _format_numeric_data(decomp["Qt"]) if decomp.get("Qt") is not None else None,
        },
    }

    if result.get("solution") is not None:
        formatted["solution"] = _format_numeric_data(result["solution"])

    if result.get("particular_solution") is not None and result.get("null_space_vectors") is not None:
        formatted["general_solution"] = {
            "particular_solution": _format_numeric_data(result["particular_solution"]),
            "null_space_vectors": _format_numeric_data(result["null_space_vectors"]),
        }

    if result.get("original_factorization") is not None:
        original = result["original_factorization"]
        formatted["original_factorization"] = {
            "status": original.get("status"),
            "message": original.get("message"),
            "reason": original.get("reason"),
            "Q": _format_numeric_data(original["Q"]) if original.get("Q") is not None else None,
            "Qt": _format_numeric_data(original["Qt"]) if original.get("Qt") is not None else None,
            "factorization_steps": _format_numeric_data(original.get("factorization_steps", [])),
        }

    if decomp.get("M") is not None:
        formatted["decomposition"]["M"] = _format_numeric_data(decomp["M"])
    if decomp.get("d") is not None:
        formatted["decomposition"]["d"] = _format_numeric_data(decomp["d"])

    if result.get("intermediate_y") is not None:
        formatted["intermediate_y"] = _format_numeric_data(result["intermediate_y"])

    if result.get("auxiliary_solution") is not None:
        formatted["auxiliary_solution"] = _format_numeric_data(result["auxiliary_solution"])
        formatted["auxiliary_solution_label"] = result.get("auxiliary_solution_label", "Lambda")

    if result.get("residual") is not None:
        formatted["residual"] = _format_numeric_data(result["residual"])
    if result.get("residual_norm") is not None:
        formatted["residual_norm"] = result["residual_norm"]

    if result.get("rank") is not None:
        formatted["rank"] = int(result["rank"])
    if result.get("num_vars") is not None:
        formatted["num_vars"] = int(result["num_vars"])

    formatted["factorization_steps"] = _format_numeric_data(result.get("factorization_steps", []))
    formatted["forward_steps"] = _format_numeric_data(result.get("forward_steps", []))
    formatted["backward_steps"] = _format_numeric_data(result.get("backward_steps", []))
    formatted["reconstruction_steps"] = _format_numeric_data(result.get("reconstruction_steps", []))

    return formatted
