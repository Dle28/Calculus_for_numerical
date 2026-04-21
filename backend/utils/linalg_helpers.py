import numpy as np


def lu_decomposition_partial_pivoting(A, tol=1e-15):
    """
    Compute P, L, U such that P @ A = L @ U.
    Works for rectangular or singular matrices as well; zero pivots are kept in U.
    """
    A = np.array(A, dtype=float, copy=True)
    if A.ndim != 2:
        raise ValueError("Ma tran phai la ma tran 2 chieu.")

    m, n = A.shape
    P = np.eye(m, dtype=float)
    L = np.eye(m, dtype=float)
    U = A.copy()

    for k in range(min(m, n)):
        pivot_row = k + int(np.argmax(np.abs(U[k:, k])))
        pivot_val = U[pivot_row, k]

        if abs(pivot_val) < tol:
            continue

        if pivot_row != k:
            U[[k, pivot_row], :] = U[[pivot_row, k], :]
            P[[k, pivot_row], :] = P[[pivot_row, k], :]
            if k > 0:
                L[[k, pivot_row], :k] = L[[pivot_row, k], :k]

        for i in range(k + 1, m):
            if abs(U[i, k]) < tol:
                U[i, k] = 0.0
                continue

            factor = U[i, k] / U[k, k]
            L[i, k] = factor
            U[i, k:] = U[i, k:] - factor * U[k, k:]
            U[i, k] = 0.0

    return P, L, U


def forward_substitution(L, B, tol=1e-15):
    L = np.array(L, dtype=float, copy=False)
    B = np.array(B, dtype=float, copy=False)
    squeeze_output = B.ndim == 1
    if squeeze_output:
        B = B.reshape(-1, 1)

    n = L.shape[0]
    Y = np.zeros((n, B.shape[1]), dtype=float)

    for i in range(n):
        diag = L[i, i]
        if abs(diag) < tol:
            raise ValueError("Ma tran tam giac duoi suy bien.")
        Y[i] = (B[i] - L[i, :i] @ Y[:i]) / diag

    return Y[:, 0] if squeeze_output else Y


def backward_substitution(U, B, tol=1e-15):
    U = np.array(U, dtype=float, copy=False)
    B = np.array(B, dtype=float, copy=False)
    squeeze_output = B.ndim == 1
    if squeeze_output:
        B = B.reshape(-1, 1)

    n = U.shape[0]
    X = np.zeros((n, B.shape[1]), dtype=float)

    for i in range(n - 1, -1, -1):
        diag = U[i, i]
        if abs(diag) < tol:
            raise ValueError("Ma tran tam giac tren suy bien.")
        X[i] = (B[i] - U[i, i + 1:] @ X[i + 1:]) / diag

    return X[:, 0] if squeeze_output else X


def null_space(A, tol=1e-15):
    A = np.array(A, dtype=float, copy=False)
    _, singular_values, vh = np.linalg.svd(A, full_matrices=True)
    rank = int(np.sum(singular_values > tol))
    return vh[rank:].T.copy()
