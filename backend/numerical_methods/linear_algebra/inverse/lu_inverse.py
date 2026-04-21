# backend/numerical_methods/linear_algebra/inverse/lu_inverse.py
import numpy as np

from backend.utils.helpers import zero_small
from backend.utils.linalg_helpers import (
    backward_substitution,
    forward_substitution,
    lu_decomposition_partial_pivoting,
)


def lu_inverse(A, tol=1e-15):
    """
    Tinh ma tran nghich dao A^-1 bang cach giai n he phuong trinh Ax = e_i
    su dung phan ra LU.
    """
    if A.shape[0] != A.shape[1]:
        raise ValueError("Ma tran phai la ma tran vuong.")

    n = A.shape[0]
    if abs(np.linalg.det(A)) < tol:
        raise ValueError("Ma tran suy bien (det(A) gan bang 0), khong co nghich dao.")

    P, L, U = lu_decomposition_partial_pivoting(A, tol=tol)

    if np.any(np.abs(np.diag(U)) < tol):
        raise ValueError("Ma tran U co phan tu tren duong cheo bang 0, khong the tinh nghich dao.")

    rhs = P
    inv_A_cols = []
    steps_solve = []

    for i in range(n):
        b_col = rhs[:, i]
        y = forward_substitution(L, b_col, tol=tol)
        x = backward_substitution(U, y, tol=tol)

        inv_A_cols.append(x)
        steps_solve.append(
            {
                "column_index": i + 1,
                "b_col": zero_small(b_col, tol),
                "y_col": zero_small(y, tol),
                "x_col": zero_small(x, tol),
            }
        )

    inv_A = np.column_stack(inv_A_cols)

    return {
        "status": "success",
        "inverse": zero_small(inv_A, tol),
        "decomposition": {
            "P": zero_small(P, tol),
            "L": zero_small(L, tol),
            "U": zero_small(U, tol),
        },
        "steps_solve": steps_solve,
        "num_vars": n,
    }
