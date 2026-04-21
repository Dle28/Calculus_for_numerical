import numpy as np

from backend.utils.helpers import zero_small


def gauss_elimination(A, b, tol):
    """
    Giai he phuong trinh tuyen tinh Ax = b bang phuong phap khu Gauss.
    Ho tro ca ma tran vuong va khong vuong, dong thoi ghi lai chi tiet
    cac phep bien doi de frontend hien thi tung buoc.
    """
    A_float = A.copy().astype(float)
    b_float = b.copy().astype(float)
    if b_float.ndim == 1:
        b_float = b_float.reshape(-1, 1)

    augmented_matrix = np.hstack([A_float, b_float])
    num_rows = augmented_matrix.shape[0]
    num_vars = A.shape[1]

    steps = []
    pivot_columns = []
    pivot_row = 0
    col_index = 0

    while pivot_row < num_rows and col_index < num_vars:
        matrix_before_step = augmented_matrix.copy()

        if abs(augmented_matrix[pivot_row, col_index]) < tol:
            swap_with_row = -1
            for k in range(pivot_row + 1, num_rows):
                if abs(augmented_matrix[k, col_index]) > tol:
                    swap_with_row = k
                    break

            if swap_with_row != -1:
                row_before_current = matrix_before_step[pivot_row, :].copy()
                row_before_swap = matrix_before_step[swap_with_row, :].copy()
                augmented_matrix[[pivot_row, swap_with_row]] = augmented_matrix[[swap_with_row, pivot_row]]
                steps.append(
                    {
                        "type": "pivot",
                        "from_row": swap_with_row,
                        "to_row": pivot_row,
                        "pivot_col": col_index,
                        "operation": f"R{pivot_row + 1} <-> R{swap_with_row + 1}",
                        "row_before_current": row_before_current,
                        "row_before_swap": row_before_swap,
                        "row_after_current": augmented_matrix[pivot_row, :].copy(),
                        "row_after_swap": augmented_matrix[swap_with_row, :].copy(),
                        "matrix_before": matrix_before_step,
                        "matrix": augmented_matrix.copy(),
                    }
                )
                matrix_before_step = augmented_matrix.copy()

        pivot_element = augmented_matrix[pivot_row, col_index]

        if abs(pivot_element) < tol:
            steps.append(
                {
                    "type": "skip_column",
                    "pivot_row": pivot_row,
                    "pivot_col": col_index,
                    "message_detail": f"Khong tim duoc pivot khac 0 trong cot {col_index + 1}.",
                    "matrix_before": matrix_before_step,
                    "matrix": augmented_matrix.copy(),
                }
            )
            col_index += 1
            continue

        pivot_columns.append(col_index)
        row_operations = []

        for i in range(pivot_row + 1, num_rows):
            factor = augmented_matrix[i, col_index] / pivot_element
            if abs(factor) <= tol:
                continue

            row_before = augmented_matrix[i, :].copy()
            pivot_row_snapshot = augmented_matrix[pivot_row, :].copy()
            augmented_matrix[i, :] -= factor * augmented_matrix[pivot_row, :]
            row_after = augmented_matrix[i, :].copy()

            row_operations.append(
                {
                    "target_row": i,
                    "pivot_row": pivot_row,
                    "factor": factor,
                    "operation": f"R{i + 1} <- R{i + 1} - ({factor:.6g}) * R{pivot_row + 1}",
                    "row_before": row_before,
                    "pivot_row_snapshot": pivot_row_snapshot,
                    "row_after": row_after,
                }
            )

        augmented_matrix = zero_small(augmented_matrix, tol=tol)
        steps.append(
            {
                "type": "elimination",
                "pivot_row": pivot_row,
                "pivot_col": col_index,
                "pivot_value": pivot_element,
                "pivot_row_snapshot": augmented_matrix[pivot_row, :].copy(),
                "row_operations": row_operations,
                "matrix_before": matrix_before_step,
                "matrix": augmented_matrix.copy(),
            }
        )

        pivot_row += 1
        col_index += 1

    rank = len(pivot_columns)

    if rank < num_vars:
        for r in range(rank, num_rows):
            if np.any(np.abs(augmented_matrix[r, num_vars:]) > tol):
                return {"status": "no_solution", "steps": steps, "num_vars": num_vars}

        free_vars_indices = [i for i in range(num_vars) if i not in pivot_columns]
        particular_solution = np.zeros((num_vars, b_float.shape[1]))
        y = augmented_matrix[:, num_vars:]

        for i in range(rank - 1, -1, -1):
            pivot_col = pivot_columns[i]
            sum_val = augmented_matrix[i, pivot_col + 1:num_vars] @ particular_solution[pivot_col + 1:, :]
            particular_solution[pivot_col, :] = (y[i, :] - sum_val) / augmented_matrix[i, pivot_col]

        null_space_vectors = []
        for free_idx in free_vars_indices:
            v = np.zeros(num_vars)
            v[free_idx] = 1
            for i in range(rank - 1, -1, -1):
                pivot_col = pivot_columns[i]
                sum_val = np.dot(augmented_matrix[i, pivot_col + 1:num_vars], v[pivot_col + 1:])
                v[pivot_col] = -sum_val / augmented_matrix[i, pivot_col]
            null_space_vectors.append(v)

        return {
            "status": "infinite_solutions",
            "rank": rank,
            "num_vars": num_vars,
            "particular_solution": zero_small(particular_solution, tol=tol),
            "null_space_vectors": zero_small(np.array(null_space_vectors).T, tol=tol),
            "steps": steps,
            "num_vars": num_vars,
        }

    for r in range(rank, num_rows):
        if np.any(np.abs(augmented_matrix[r, num_vars:]) > tol):
            return {"status": "no_solution", "steps": steps, "num_vars": num_vars}

    solution = np.zeros((num_vars, b_float.shape[1]))
    backward_steps = []

    for i in range(rank - 1, -1, -1):
        pivot_col = pivot_columns[i]
        coefficient_slice = augmented_matrix[i, pivot_col + 1:num_vars].copy()
        known_solution_slice = solution[pivot_col + 1:, :].copy()
        sum_ax = coefficient_slice @ known_solution_slice
        rhs_value = augmented_matrix[i, num_vars:].copy()
        pivot_value = augmented_matrix[i, pivot_col]
        numerator = rhs_value - sum_ax
        x_i_row = numerator / pivot_value
        solution[pivot_col, :] = x_i_row

        backward_steps.append(
            {
                "row": pivot_col,
                "pivot_col": pivot_col,
                "pivot_value": pivot_value,
                "coefficients": coefficient_slice,
                "known_solution_values": known_solution_slice,
                "rhs": rhs_value,
                "known_contribution": sum_ax,
                "numerator": numerator,
                "computed_value": x_i_row.copy(),
                "solution_so_far": solution.copy(),
            }
        )

    return {
        "status": "unique_solution",
        "solution": zero_small(solution, tol=tol),
        "steps": steps,
        "backward_steps": backward_steps,
        "num_vars": num_vars,
    }
