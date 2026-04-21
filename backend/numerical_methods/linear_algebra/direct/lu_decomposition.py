import numpy as np

from backend.utils.helpers import zero_small
from backend.utils.linalg_helpers import lu_decomposition_partial_pivoting, null_space


def _lu_decomposition_steps(A, tol):
    """
    Ghi lai chi tiet cac buoc phan ra LU co pivoting tung phan.
    """
    A = np.array(A, dtype=float, copy=True)
    if A.ndim != 2:
        return []

    m, n = A.shape
    P = np.eye(m, dtype=float)
    L = np.eye(m, dtype=float)
    U = A.copy()
    steps = []

    for pivot_idx in range(min(m, n)):
        pivot_row = pivot_idx + int(np.argmax(np.abs(U[pivot_idx:, pivot_idx])))
        pivot_candidate = U[pivot_row, pivot_idx]

        step = {
            "step_index": pivot_idx,
            "pivot_col": pivot_idx,
            "pivot_value": pivot_candidate,
            "swap_operation": None,
            "row_before_current": None,
            "row_before_swap": None,
            "row_after_current": None,
            "row_after_swap": None,
            "row_operations": [],
            "P": P.copy(),
            "L": L.copy(),
            "U": U.copy(),
        }

        if abs(pivot_candidate) < tol:
            step["message"] = (
                f"<b>Bước {pivot_idx + 1}:</b> Cột {pivot_idx + 1} không tìm được "
                "pivot khác 0, nên dừng khử ở cột này."
            )
            step["stopped"] = True
            steps.append(step)
            continue

        if pivot_row != pivot_idx:
            step["row_before_current"] = U[pivot_idx].copy()
            step["row_before_swap"] = U[pivot_row].copy()

            U[[pivot_idx, pivot_row], :] = U[[pivot_row, pivot_idx], :]
            P[[pivot_idx, pivot_row], :] = P[[pivot_row, pivot_idx], :]
            if pivot_idx > 0:
                L[[pivot_idx, pivot_row], :pivot_idx] = L[[pivot_row, pivot_idx], :pivot_idx]

            step["swap_operation"] = (
                f"Đổi hàng R{pivot_idx + 1} và R{pivot_row + 1} để đưa pivot lớn nhất "
                f"về vị trí ({pivot_idx + 1}, {pivot_idx + 1})."
            )
            step["row_after_current"] = U[pivot_idx].copy()
            step["row_after_swap"] = U[pivot_row].copy()

        for row_idx in range(pivot_idx + 1, m):
            if abs(U[row_idx, pivot_idx]) < tol:
                U[row_idx, pivot_idx] = 0.0
                continue

            factor = U[row_idx, pivot_idx] / U[pivot_idx, pivot_idx]
            row_before = U[row_idx].copy()
            pivot_row_snapshot = U[pivot_idx].copy()

            L[row_idx, pivot_idx] = factor
            U[row_idx, pivot_idx:] = U[row_idx, pivot_idx:] - factor * U[pivot_idx, pivot_idx:]
            U[row_idx, pivot_idx] = 0.0

            step["row_operations"].append(
                {
                    "pivot_row": pivot_idx,
                    "target_row": row_idx,
                    "factor": factor,
                    "operation": f"R{row_idx + 1} = R{row_idx + 1} - ({factor:.6g}) * R{pivot_idx + 1}",
                    "row_before": row_before,
                    "pivot_row_snapshot": pivot_row_snapshot,
                    "row_after": U[row_idx].copy(),
                }
            )

        if step["swap_operation"] and step["row_operations"]:
            step["message"] = (
                f"<b>Bước {pivot_idx + 1}:</b> {step['swap_operation']} "
                f"Sau đó khử các phần tử dưới pivot ở cột {pivot_idx + 1}."
            )
        elif step["swap_operation"]:
            step["message"] = f"<b>Bước {pivot_idx + 1}:</b> {step['swap_operation']}"
        elif step["row_operations"]:
            step["message"] = (
                f"<b>Bước {pivot_idx + 1}:</b> Dùng pivot ở cột {pivot_idx + 1} "
                "để cập nhật L và khử các phần tử dưới đường chéo của U."
            )
        else:
            step["message"] = (
                f"<b>Bước {pivot_idx + 1}:</b> Cột {pivot_idx + 1} đã ở dạng tam giác, "
                "không cần phép khử nào."
            )

        step["P"] = P.copy()
        step["L"] = L.copy()
        step["U"] = U.copy()
        step["pivot_value"] = U[pivot_idx, pivot_idx]
        step["stopped"] = False
        steps.append(step)

    return steps


def _forward_substitution_with_steps(L, B, tol):
    L = np.array(L, dtype=float, copy=False)
    B = np.array(B, dtype=float, copy=False)
    if B.ndim == 1:
        B = B.reshape(-1, 1)

    n = L.shape[0]
    Y = np.zeros((n, B.shape[1]), dtype=float)
    steps = []

    for i in range(n):
        diag = L[i, i]
        if abs(diag) < tol:
            raise ValueError("Ma tran tam giac duoi suy bien.")

        coefficient_slice = L[i, :i].copy()
        known_values = Y[:i].copy()
        known_sum = coefficient_slice @ known_values
        rhs = B[i].copy()
        numerator = rhs - known_sum
        Y[i] = numerator / diag

        steps.append(
            {
                "row": i,
                "diag": diag,
                "coefficients": coefficient_slice,
                "known_values": known_values,
                "rhs": rhs,
                "known_sum": known_sum,
                "numerator": numerator,
                "result": Y[i].copy(),
                "solution_so_far": Y.copy(),
            }
        )

    return Y, steps


def _backward_substitution_with_steps(U, B, tol):
    U = np.array(U, dtype=float, copy=False)
    B = np.array(B, dtype=float, copy=False)
    if B.ndim == 1:
        B = B.reshape(-1, 1)

    n = U.shape[0]
    X = np.zeros((n, B.shape[1]), dtype=float)
    steps = []

    for i in range(n - 1, -1, -1):
        diag = U[i, i]
        if abs(diag) < tol:
            raise ValueError("Ma tran tam giac tren suy bien.")

        coefficient_slice = U[i, i + 1:].copy()
        known_values = X[i + 1:].copy()
        known_sum = coefficient_slice @ known_values
        rhs = B[i].copy()
        numerator = rhs - known_sum
        X[i] = numerator / diag

        steps.append(
            {
                "row": i,
                "diag": diag,
                "coefficients": coefficient_slice,
                "known_values": known_values,
                "rhs": rhs,
                "known_sum": known_sum,
                "numerator": numerator,
                "result": X[i].copy(),
                "solution_so_far": X.copy(),
            }
        )

    return X, steps


def solve_lu(A, b, tol):
    """
    Giai he phuong trinh AX = B bang phan ra LU.
    """
    if b.ndim == 1:
        b = b.reshape(-1, 1)

    m, n = A.shape
    lu_steps = _lu_decomposition_steps(A, tol)

    P, L, U = lu_decomposition_partial_pivoting(A, tol=tol)
    forward_steps = []
    backward_steps = []
    is_square = m == n

    rank_A = np.linalg.matrix_rank(A, tol=tol)
    AB = np.hstack((A, b))
    rank_AB = np.linalg.matrix_rank(AB, tol=tol)

    result = {"lu_steps": lu_steps, "num_vars": n, "rank": rank_A}

    if rank_A < rank_AB:
        result.update({"status": "no_solution"})
    elif rank_A < n:
        particular_solution, _, _, _ = np.linalg.lstsq(A, b, rcond=None)
        null_space_vectors = null_space(A, tol=tol)
        result.update(
            {
                "status": "infinite_solutions",
                "particular_solution": zero_small(particular_solution, tol=tol),
                "null_space_vectors": zero_small(null_space_vectors, tol=tol),
            }
        )
    else:
        if is_square:
            pb = P @ b
            Y, forward_steps = _forward_substitution_with_steps(L, pb, tol=tol)
            X, backward_steps = _backward_substitution_with_steps(U, Y, tol=tol)
        else:
            X, _, _, _ = np.linalg.lstsq(A, b, rcond=None)
            Y = None

        result.update(
            {
                "status": "unique_solution",
                "solution": zero_small(X, tol=tol),
                "intermediate_y": zero_small(Y, tol=tol) if Y is not None else None,
            }
        )

    result.update(
        {
            "decomposition": {
                "P": zero_small(P, tol=tol),
                "L": zero_small(L, tol=tol),
                "U": zero_small(U, tol=tol),
            },
            "forward_steps": [
                {
                    **step,
                    "rhs": zero_small(step["rhs"], tol=tol),
                    "known_sum": zero_small(step["known_sum"], tol=tol),
                    "numerator": zero_small(step["numerator"], tol=tol),
                    "result": zero_small(step["result"], tol=tol),
                    "solution_so_far": zero_small(step["solution_so_far"], tol=tol),
                }
                for step in forward_steps
            ],
            "backward_steps": [
                {
                    **step,
                    "rhs": zero_small(step["rhs"], tol=tol),
                    "known_sum": zero_small(step["known_sum"], tol=tol),
                    "numerator": zero_small(step["numerator"], tol=tol),
                    "result": zero_small(step["result"], tol=tol),
                    "solution_so_far": zero_small(step["solution_so_far"], tol=tol),
                }
                for step in backward_steps
            ],
        }
    )

    return result
