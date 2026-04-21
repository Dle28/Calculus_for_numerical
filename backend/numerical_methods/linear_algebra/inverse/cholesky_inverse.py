# backend/numerical_methods/linear_algebra/inverse/cholesky_inverse.py
import numpy as np

from backend.utils.helpers import zero_small


def cholesky_inverse(A, tol=1e-15):
    """
    Tinh ma tran nghich dao A^-1 bang phuong phap Cholesky.
    Neu A khong doi xung, tinh (A^T A)^-1 A^T.
    """
    if A.shape[0] != A.shape[1]:
        raise ValueError("Ma tran phai la ma tran vuong.")

    is_symmetric = np.allclose(A, A.T, atol=tol)

    M = A
    transformation_message = "Ma tran A doi xung, tien hanh phan tich Cholesky truc tiep."
    if not is_symmetric:
        M = A.T @ A
        transformation_message = "Ma tran A khong doi xung. Chuyen sang tinh M = A^T A."

    try:
        eigenvalues = np.linalg.eigvalsh(M)
        if np.min(eigenvalues) <= tol:
            raise ValueError("Ma tran (hoac A^T A) khong xac dinh duong, khong the phan tich Cholesky.")
    except np.linalg.LinAlgError as exc:
        raise ValueError("Loi tinh toan gia tri rieng. Ma tran co van de ve so hoc.") from exc

    n = M.shape[0]
    U = np.zeros((n, n), dtype=float)
    for i in range(n):
        sum_k = np.dot(U[:i, i], U[:i, i])
        val_inside_sqrt = M[i, i] - sum_k
        if val_inside_sqrt <= tol:
            raise ValueError(
                f"Phan tu tren duong cheo U[{i},{i}] khong duong. Ma tran khong xac dinh duong."
            )

        U[i, i] = np.sqrt(val_inside_sqrt)

        for j in range(i + 1, n):
            sum_k = np.dot(U[:i, i], U[:i, j])
            U[i, j] = (M[i, j] - sum_k) / U[i, i]

    I = np.eye(n)
    inv_U = np.linalg.solve(U, I)
    inv_M = inv_U @ inv_U.T

    if is_symmetric:
        inv_A = inv_M
        final_message = "Tinh ma tran nghich dao A^-1 thanh cong."
    else:
        inv_A = inv_M @ A.T
        final_message = "Tinh ma tran nghich dao A^-1 = (A^T A)^-1 A^T thanh cong."

    return {
        "status": "success",
        "inverse": zero_small(inv_A, tol),
        "is_symmetric": is_symmetric,
        "transformation_message": transformation_message,
        "final_message": final_message,
        "intermediates": {
            "M": zero_small(M, tol) if not is_symmetric else None,
            "U": zero_small(U, tol),
            "Ut": zero_small(U.T, tol),
            "U_inv": zero_small(inv_U, tol),
            "M_inv": zero_small(inv_M, tol),
        },
        "num_vars": n,
    }
