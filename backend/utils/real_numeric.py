import numpy as np


IMAG_TOL = 1e-10


def _to_numeric_complex(value, context):
    try:
        numeric_value = complex(value.evalf())
    except Exception as exc:
        raise ValueError(
            f"{context} khong the danh gia thanh so. Kiem tra bieu thuc, bien va mien xac dinh."
        ) from exc

    if not np.isfinite(numeric_value.real) or not np.isfinite(numeric_value.imag):
        raise ValueError(f"{context} khong huu han.")

    if abs(numeric_value.imag) > IMAG_TOL:
        raise ValueError(
            f"{context} sinh gia tri phuc ({numeric_value}). "
            "Diem lap hien tai da di ra ngoai mien xac dinh cua bai toan."
        )

    return numeric_value.real


def sympy_scalar_to_real_float(value, context):
    return float(_to_numeric_complex(value, context))


def sympy_vector_to_real_array(vector, context_prefix):
    return np.array(
        [
            sympy_scalar_to_real_float(vector[i], f"{context_prefix} x{i + 1}")
            for i in range(len(vector))
        ],
        dtype=float,
    )


def sympy_vector_to_step_info(vector, context_prefix):
    values = sympy_vector_to_real_array(vector, context_prefix)
    return {f"x{i + 1}": values[i] for i in range(len(values))}


def sympy_matrix_to_real_nested_list(matrix, context_prefix):
    rows, cols = matrix.shape
    result = []
    for i in range(rows):
        row = []
        for j in range(cols):
            row.append(
                sympy_scalar_to_real_float(
                    matrix[i, j],
                    f"{context_prefix} phan tu ({i + 1}, {j + 1})",
                )
            )
        result.append(row)
    return result
