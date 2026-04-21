import numpy as np

from backend.utils.helpers import zero_small


def _cholesky_upper(M, tol=1e-12, collect_steps=False):
    """
    Phân rã Cholesky kiểu tam giác trên:
        M = Q^T Q

    Hàm làm việc trong dtype complex để xử lý được căn bậc hai của số âm.
    """
    n = M.shape[0]
    Q = np.zeros((n, n), dtype=complex)
    complex_arithmetic_used = False
    factorization_steps = []

    for k in range(n):
        left_terms = Q[:k, k].copy()
        sum_sq = np.dot(left_terms, left_terms)
        radicand = M[k, k] - sum_sq

        if abs(radicand.imag) <= tol:
            radicand = radicand.real + 0j

        if abs(radicand) <= tol:
            raise ValueError(
                f"Biểu thức dưới căn tại Q[{k},{k}] gần bằng 0. "
                "Ma trận suy biến hoặc cần pivoting/permutation."
            )

        Q[k, k] = np.sqrt(radicand)

        if abs(Q[k, k]) <= tol:
            raise ValueError(
                f"Q[{k},{k}] gần bằng 0 sau khi lấy căn. "
                "Ma trận suy biến hoặc cần pivoting/permutation."
            )

        if abs(Q[k, k].imag) > tol:
            complex_arithmetic_used = True

        off_diagonal_calculations = []
        for j in range(k + 1, n):
            left_col = Q[:k, k].copy()
            right_col = Q[:k, j].copy()
            cross_term = np.dot(left_col, right_col)
            numerator = M[k, j] - cross_term
            Q[k, j] = numerator / Q[k, k]
            if abs(Q[k, j].imag) > tol:
                complex_arithmetic_used = True

            off_diagonal_calculations.append(
                {
                    "row": k,
                    "col": j,
                    "left_terms": left_col,
                    "right_terms": right_col,
                    "cross_term": cross_term,
                    "numerator": numerator,
                    "denominator": Q[k, k],
                    "result": Q[k, j],
                }
            )

        if collect_steps:
            factorization_steps.append(
                {
                    "step_index": k,
                    "diagonal_terms": left_terms,
                    "diagonal_sum": sum_sq,
                    "radicand": radicand,
                    "q_kk": Q[k, k],
                    "off_diagonal_calculations": off_diagonal_calculations,
                    "partial_Q": Q.copy(),
                }
            )

    return Q, complex_arithmetic_used, factorization_steps


def _analyze_direct_factorization(A, tol=1e-12):
    if A.shape[0] != A.shape[1]:
        return {
            "status": "not_applicable",
            "message": "Không thể thử trực tiếp phân rã A = Q^T Q trên chính A.",
            "reason": f"A không vuông, kích thước hiện tại là {A.shape[0]}x{A.shape[1]}.",
            "Q": None,
            "Qt": None,
            "complex_arithmetic_used": False,
            "factorization_steps": [],
        }

    if not np.allclose(A, A.T, atol=tol):
        return {
            "status": "not_satisfied",
            "message": "Không thể phân rã trực tiếp A = Q^T Q trên chính ma trận A.",
            "reason": "A không đối xứng, trong khi mọi ma trận dạng Q^T Q đều đối xứng.",
            "Q": None,
            "Qt": None,
            "complex_arithmetic_used": False,
            "factorization_steps": [],
        }

    try:
        Q, complex_arithmetic_used, factorization_steps = _cholesky_upper(A, tol=tol, collect_steps=True)
    except ValueError as exc:
        return {
            "status": "not_satisfied",
            "message": "Không thể phân rã trực tiếp A = Q^T Q trên chính ma trận A.",
            "reason": str(exc),
            "Q": None,
            "Qt": None,
            "complex_arithmetic_used": False,
            "factorization_steps": [],
        }

    if complex_arithmetic_used:
        message = (
            "A vẫn được phân rã trực tiếp thành A = Q^T Q bằng cách tiếp tục "
            "trong số phức do xuất hiện căn bậc hai của số âm."
        )
    else:
        message = "A thỏa trực tiếp phân rã Cholesky A = Q^T Q trong số thực."

    return {
        "status": "success",
        "message": message,
        "reason": None,
        "Q": Q,
        "Qt": Q.T,
        "complex_arithmetic_used": complex_arithmetic_used,
        "factorization_steps": factorization_steps,
    }


def _null_space(A, tol=1e-12):
    _, singular_values, vh = np.linalg.svd(A, full_matrices=True)
    rank = int(np.sum(singular_values > tol))
    return vh[rank:].conj().T.copy()


def _triangular_solve_with_steps(T, B, tol=1e-12, lower=False):
    T = np.array(T, dtype=complex, copy=False)
    B = np.array(B, dtype=complex, copy=False)
    if B.ndim == 1:
        B = B.reshape(-1, 1)

    n = T.shape[0]
    X = np.zeros((n, B.shape[1]), dtype=complex)
    steps = []

    row_range = range(n) if lower else range(n - 1, -1, -1)
    for i in row_range:
        diag = T[i, i]
        if abs(diag) <= tol:
            raise ValueError("Ma trận tam giác suy biến.")
            

        if lower:
            coefficients = T[i, :i].copy()
            known_values = X[:i].copy()
        else:
            coefficients = T[i, i + 1:].copy()
            known_values = X[i + 1:].copy()

        known_sum = coefficients @ known_values
        rhs = B[i].copy()
        numerator = rhs - known_sum
        X[i] = numerator / diag

        steps.append(
            {
                "row": i,
                "diag": diag,
                "coefficients": coefficients,
                "known_values": known_values,
                "rhs": rhs,
                "known_sum": known_sum,
                "numerator": numerator,
                "result": X[i].copy(),
                "solution_so_far": X.copy(),
                "triangular_type": "lower" if lower else "upper",
            }
        )

    return X, steps


def _solve_via_cholesky(M, d, tol=1e-12):
    Q, complex_arithmetic_used, factorization_steps = _cholesky_upper(M, tol=tol, collect_steps=True)
    y, forward_steps = _triangular_solve_with_steps(Q.T, d, tol=tol, lower=True)
    z, backward_steps = _triangular_solve_with_steps(Q, y, tol=tol, lower=False)
    return {
        "Q": Q,
        "y": y,
        "z": z,
        "complex_arithmetic_used": complex_arithmetic_used,
        "factorization_steps": factorization_steps,
        "forward_steps": forward_steps,
        "backward_steps": backward_steps,
    }


def _clean_nested_data(data, tol):
    if isinstance(data, dict):
        return {key: _clean_nested_data(value, tol) for key, value in data.items()}
    if isinstance(data, list):
        return [_clean_nested_data(value, tol) for value in data]
    if isinstance(data, tuple):
        return [_clean_nested_data(value, tol) for value in data]
    if isinstance(data, np.ndarray):
        return zero_small(data, tol=tol)
    return data


def _build_result(
    *,
    status,
    message,
    transformation_message,
    factorization_note,
    original_factorization,
    decomposition,
    tol,
    solution=None,
    particular_solution=None,
    null_space_vectors=None,
    intermediate_y=None,
    auxiliary_solution=None,
    auxiliary_solution_label=None,
    working_system_description=None,
    decomposition_rhs_label="d",
    solution_heading=None,
    general_solution_heading=None,
    solution_note=None,
    residual=None,
    residual_norm=None,
    rank=None,
    num_vars=None,
    factorization_steps=None,
    forward_steps=None,
    backward_steps=None,
    reconstruction_steps=None,
):
    result = {
        "status": status,
        "message": message,
        "transformation_message": transformation_message,
        "factorization_note": factorization_note,
        "original_factorization": {
            "status": original_factorization["status"],
            "message": original_factorization["message"],
            "reason": original_factorization["reason"],
            "Q": _clean_nested_data(original_factorization["Q"], tol),
            "Qt": _clean_nested_data(original_factorization["Qt"], tol),
            "factorization_steps": _clean_nested_data(original_factorization.get("factorization_steps", []), tol),
        },
        "decomposition": {
            "M": _clean_nested_data(decomposition.get("M"), tol),
            "d": _clean_nested_data(decomposition.get("d"), tol),
            "Q": _clean_nested_data(decomposition.get("Q"), tol),
            "Qt": _clean_nested_data(decomposition.get("Qt"), tol),
        },
        "intermediate_y": _clean_nested_data(intermediate_y, tol),
        "auxiliary_solution": _clean_nested_data(auxiliary_solution, tol),
        "auxiliary_solution_label": auxiliary_solution_label,
        "working_system_description": working_system_description,
        "decomposition_rhs_label": decomposition_rhs_label,
        "solution_heading": solution_heading,
        "general_solution_heading": general_solution_heading,
        "solution_note": solution_note,
        "residual": _clean_nested_data(residual, tol),
        "residual_norm": float(residual_norm) if residual_norm is not None else None,
        "rank": rank,
        "num_vars": num_vars,
        "factorization_steps": _clean_nested_data(factorization_steps or [], tol),
        "forward_steps": _clean_nested_data(forward_steps or [], tol),
        "backward_steps": _clean_nested_data(backward_steps or [], tol),
        "reconstruction_steps": _clean_nested_data(reconstruction_steps or [], tol),
    }

    if solution is not None:
        result["solution"] = _clean_nested_data(solution, tol)
    if particular_solution is not None:
        result["particular_solution"] = _clean_nested_data(particular_solution, tol)
    if null_space_vectors is not None:
        result["null_space_vectors"] = _clean_nested_data(null_space_vectors, tol)

    return result


def solve_cholesky(A, b, tol=1e-12):
    """
    Giải hệ AX = B bằng Cholesky mở rộng.

    Quy ước xử lý:
    - Nếu A vuông và thử trực tiếp được: dùng ngay A = Q^T Q.
    - Nếu A có đầy cột (m >= n và rank(A) = n): chuyển về hệ chuẩn tắc
          A^T A X = A^T B
      để tìm nghiệm duy nhất hoặc nghiệm bình phương tối thiểu duy nhất.
    - Nếu A có đầy hàng (m < n và rank(A) = m): giải hệ đối ngẫu
          (A A^T) Lambda = B, X = A^T Lambda
      để lấy nghiệm có chuẩn nhỏ nhất.
    - Nếu ma trận làm việc bị suy biến: vẫn phân tích hạng để trả về vô số nghiệm
      hoặc họ nghiệm bình phương tối thiểu bằng nghiệm riêng + không gian null.
    """
    A = np.array(A, dtype=complex)
    b = np.array(b, dtype=complex)

    if A.ndim != 2:
        raise ValueError("A phải là ma trận 2 chiều.")

    m, n = A.shape

    if b.ndim == 1:
        b = b.reshape(-1, 1)

    if b.ndim != 2:
        raise ValueError("B phải là vector cột hoặc ma trận 2 chiều.")

    if b.shape[0] != m:
        raise ValueError("Số dòng của b phải bằng số dòng của A.")

    rank_A = np.linalg.matrix_rank(A, tol=tol)
    rank_AB = np.linalg.matrix_rank(np.hstack((A, b)), tol=tol)
    exact_solution_exists = rank_A == rank_AB

    original_factorization = _analyze_direct_factorization(A, tol=tol)

    if original_factorization["status"] == "success":
        solve_data = _solve_via_cholesky(A, b, tol=tol)
        x = solve_data["z"]
        residual = A @ x - b

        factorization_note = (
            "Phân rã Cholesky diễn ra trực tiếp trên A. Hệ này có nghiệm duy nhất "
            "vì Q không suy biến."
            if not original_factorization["complex_arithmetic_used"]
            else "Phân rã được thực hiện trong số phức do xuất hiện căn bậc hai của "
            "số âm, nhưng vẫn giải trực tiếp A = Q^T Q."
        )

        return _build_result(
            status="unique_solution",
            message="Hệ có nghiệm duy nhất tìm trực tiếp từ A = Q^T Q.",
            transformation_message=(
                "A vuông và thỏa trực tiếp dạng A = Q^T Q, nên giải lần lượt "
                "Q^T Y = b và QX = Y."
            ),
            factorization_note=factorization_note,
            original_factorization=original_factorization,
            decomposition={"M": None, "d": None, "Q": solve_data["Q"], "Qt": solve_data["Q"].T},
            tol=tol,
            solution=x,
            intermediate_y=solve_data["y"],
            solution_heading="Nghiệm duy nhất (X):",
            residual=residual,
            residual_norm=np.linalg.norm(residual),
            rank=rank_A,
            num_vars=n,
            factorization_steps=solve_data["factorization_steps"],
            forward_steps=solve_data["forward_steps"],
            backward_steps=solve_data["backward_steps"],
        )

    if m < n and rank_A == m:
        M = A @ A.T
        d = b.copy()
        solve_data = _solve_via_cholesky(M, d, tol=tol)
        lambda_vec = solve_data["z"]
        x = A.T @ lambda_vec
        null_space_vectors = _null_space(A, tol=tol)
        residual = A @ x - b
        reconstruction_steps = [
            {
                "description": "Dùng nghiệm biến phụ Lambda để dựng lại nghiệm X = A^T * Lambda.",
                "matrix_at": A.T.copy(),
                "auxiliary_solution": lambda_vec.copy(),
                "result": x.copy(),
            }
        ]

        factorization_note = (
            "Với m < n và rank(A) = m, hệ có vô số nghiệm. Cholesky được áp dụng "
            "trên AA^T để tìm nghiệm riêng có chuẩn nhỏ nhất."
        )
        if solve_data["complex_arithmetic_used"]:
            factorization_note += " Trong quá trình phân rã, có xuất hiện số phức."

        return _build_result(
            status="infinite_solutions",
            message=(
                "Hệ có vô số nghiệm. Nghiệm riêng hiển thị là nghiệm có chuẩn nhỏ "
                "nhất được dựng từ hệ đối ngẫu."
            ),
            transformation_message=(
                "Vì A có ít phương trình hơn ẩn (m < n), giải hệ đối ngẫu "
                "M = AA^T, M*Lambda = b rồi dựng X = A^T*Lambda."
            ),
            factorization_note=factorization_note,
            original_factorization=original_factorization,
            decomposition={"M": M, "d": d, "Q": solve_data["Q"], "Qt": solve_data["Q"].T},
            tol=tol,
            particular_solution=x,
            null_space_vectors=null_space_vectors,
            intermediate_y=solve_data["y"],
            auxiliary_solution=lambda_vec,
            auxiliary_solution_label="Lambda",
            working_system_description="Hệ đối ngẫu trên biến phụ (M = AA^T, d = b):",
            decomposition_rhs_label="b",
            general_solution_heading="Nghiệm tổng quát:",
            solution_note=(
                "Mọi nghiệm của hệ có dạng X = Xp + V*T, trong đó Xp là nghiệm có "
                "chuẩn nhỏ nhất và các cột của V tạo cơ sở cho Null(A)."
            ),
            residual=residual,
            residual_norm=np.linalg.norm(residual),
            rank=rank_A,
            num_vars=n,
            factorization_steps=solve_data["factorization_steps"],
            forward_steps=solve_data["forward_steps"],
            backward_steps=solve_data["backward_steps"],
            reconstruction_steps=reconstruction_steps,
        )

    if rank_A == n:
        M = A.T @ A
        d = A.T @ b
        solve_data = _solve_via_cholesky(M, d, tol=tol)
        x = solve_data["z"]
        residual = A @ x - b

        if exact_solution_exists:
            status = "unique_solution"
            message = (
                "Hệ có nghiệm duy nhất. Cholesky được áp dụng trên hệ chuẩn tắc "
                "A^T A X = A^T b."
            )
            solution_heading = "Nghiệm duy nhất (X):"
            solution_note = (
                "Do rank(A) = số ẩn, nghiệm trên hệ chuẩn tắc đồng thời là nghiệm "
                "duy nhất của AX = b."
            )
        else:
            status = "least_squares_solution"
            message = (
                "Hệ không có nghiệm đúng. Đây là nghiệm bình phương tối thiểu "
                "duy nhất thu được từ A^T A X = A^T b."
            )
            solution_heading = "Nghiệm bình phương tối thiểu duy nhất (X):"
            solution_note = "Nghiệm này tối thiểu hóa chuẩn 2 của sai số ||AX - b||."

        factorization_note = "Cholesky được thực hiện trên ma trận làm việc M = A^T A."
        if solve_data["complex_arithmetic_used"]:
            factorization_note += " Trong quá trình phân rã, có xuất hiện số phức."

        if m > n:
            transformation_message = (
                "Vì A có nhiều phương trình hơn ẩn (m > n), chuyển về hệ chuẩn tắc "
                "M = A^T A, d = A^T b."
            )
        else:
            transformation_message = (
                "A không thỏa trực tiếp dạng A = Q^T Q, nên chuyển về hệ chuẩn tắc "
                "M = A^T A, d = A^T b."
            )

        return _build_result(
            status=status,
            message=message,
            transformation_message=transformation_message,
            factorization_note=factorization_note,
            original_factorization=original_factorization,
            decomposition={"M": M, "d": d, "Q": solve_data["Q"], "Qt": solve_data["Q"].T},
            tol=tol,
            solution=x,
            intermediate_y=solve_data["y"],
            working_system_description="Hệ chuẩn tắc trên biến X (M = A^T A, d = A^T b):",
            decomposition_rhs_label="d",
            solution_heading=solution_heading,
            solution_note=solution_note,
            residual=residual,
            residual_norm=np.linalg.norm(residual),
            rank=rank_A,
            num_vars=n,
            factorization_steps=solve_data["factorization_steps"],
            forward_steps=solve_data["forward_steps"],
            backward_steps=solve_data["backward_steps"],
        )

    if m >= n:
        attempted_M = A.T @ A
        attempted_d = A.T @ b
        factorization_note = (
            "Ma trận làm việc A^T A bị suy biến nên Cholesky không tiếp tục được. "
            "Ứng dụng chuyển sang phân tích hạng để mô tả họ nghiệm."
        )
        working_system_description = "Hệ chuẩn tắc đã thử (M = A^T A, d = A^T b):"
        decomposition_rhs_label = "d"
    else:
        attempted_M = A @ A.T
        attempted_d = b.copy()
        factorization_note = (
            "Ma trận làm việc AA^T bị suy biến nên không thể dùng Cholesky để tìm "
            "biến phụ. Ứng dụng chuyển sang phân tích hạng để mô tả họ nghiệm."
        )
        working_system_description = "Hệ đối ngẫu đã thử (M = AA^T, d = b):"
        decomposition_rhs_label = "b"

    particular_solution, _, _, _ = np.linalg.lstsq(A, b, rcond=None)
    null_space_vectors = _null_space(A, tol=tol)
    residual = A @ particular_solution - b

    if exact_solution_exists:
        return _build_result(
            status="infinite_solutions",
            message=(
                "Hệ có vô số nghiệm. Cholesky không phân rã được ma trận làm việc "
                "vì nó suy biến, nên kết quả được mô tả bằng nghiệm riêng và "
                "không gian nghiệm thuần nhất."
            ),
            transformation_message=(
                "A không đưa đến ma trận làm việc khả nghịch cho Cholesky, nên hệ "
                "được xử lý bằng phân tích hạng để trả về nghiệm tổng quát."
            ),
            factorization_note=factorization_note,
            original_factorization=original_factorization,
            decomposition={"M": attempted_M, "d": attempted_d, "Q": None, "Qt": None},
            tol=tol,
            particular_solution=particular_solution,
            null_space_vectors=null_space_vectors,
            working_system_description=working_system_description,
            decomposition_rhs_label=decomposition_rhs_label,
            general_solution_heading="Nghiệm tổng quát:",
            solution_note=(
                "Nghiệm riêng hiển thị là nghiệm có chuẩn nhỏ nhất trả về bởi "
                "np.linalg.lstsq."
            ),
            residual=residual,
            residual_norm=np.linalg.norm(residual),
            rank=rank_A,
            num_vars=n,
        )

    return _build_result(
        status="least_squares_infinite",
        message=(
            "Hệ không có nghiệm đúng. Cholesky không phân rã được ma trận làm việc "
            "vì nó suy biến; bên dưới là họ nghiệm bình phương tối thiểu."
        ),
        transformation_message=(
            "Do hệ không có nghiệm đúng và ma trận làm việc suy biến, kết quả được "
            "trả về dưới dạng nghiệm bình phương tối thiểu có chuẩn nhỏ nhất "
            "kèm theo không gian null của A."
        ),
        factorization_note=factorization_note,
        original_factorization=original_factorization,
        decomposition={"M": attempted_M, "d": attempted_d, "Q": None, "Qt": None},
        tol=tol,
        particular_solution=particular_solution,
        null_space_vectors=null_space_vectors,
        working_system_description=working_system_description,
        decomposition_rhs_label=decomposition_rhs_label,
        general_solution_heading="Họ nghiệm bình phương tối thiểu:",
        solution_note=(
            "Nghiệm riêng hiển thị là nghiệm bình phương tối thiểu có chuẩn nhỏ "
            "nhất."
        ),
        residual=residual,
        residual_norm=np.linalg.norm(residual),
        rank=rank_A,
        num_vars=n,
    )
