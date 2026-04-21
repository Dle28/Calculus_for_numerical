import numpy as np


def _build_check_item(status, label, detail, formula=None):
    return {
        "status": status,
        "label": label,
        "detail": detail,
        "formula": formula,
    }


def _build_input_checks(method_name, result):
    if "Chia" in method_name:
        return [
            _build_check_item("passed", "Khoang cach ly", "Da kiem tra f(a)f(b) < 0 tren khoang [a, b].", "f(a)f(b) < 0"),
            _build_check_item("info", "Dao ham", "Phuong phap chia doi khong can dao ham de cap nhat nghiem."),
        ]

    if "Dây cung" in method_name or "DÃ¢y cung" in method_name:
        return [
            _build_check_item("passed", "Khoang cach ly", "Da kiem tra f(a)f(b) < 0 truoc khi lap.", "f(a)f(b) < 0"),
            _build_check_item("passed", "Dao ham", "Da kiem tra dau cua f'(x), f''(x) tren khoang va uoc luong m1.", "f'(x), f''(x)"),
            _build_check_item("passed", "Diem Fourier", "Da chon diem co dinh d va diem lap ban dau x0 theo quy tac Fourier."),
        ]

    if "Newton" in method_name:
        return [
            _build_check_item("passed", "Dao ham", "Da kiem tra dau cua f'(x), f''(x) tren khoang va uoc luong m1, M2.", "f'(x), f''(x)"),
            _build_check_item("passed", "Diem bat dau", "Da xac dinh x0 theo quy tac Fourier de uu tien hoi tu."),
        ]

    if "Lặp đơn" in method_name or "Láº·p Ä‘Æ¡n" in method_name:
        q = result.get("q")
        detail = (
            f"Da kiem tra q = max|phi'(x)| ~= {q:.6f} < 1 tren khoang lam viec."
            if q is not None
            else "Da kiem tra q = max|phi'(x)| < 1 tren khoang lam viec."
        )
        return [
            _build_check_item("passed", "Khoang cach ly", "Da kiem tra f(a)f(b) < 0 voi f(x) = phi(x) - x.", "f(a)f(b) < 0"),
            _build_check_item("passed", "Dao ham cua phi", detail, "q = \\max |\\phi'(x)| < 1"),
            _build_check_item("passed", "Diem lap", "Da kiem tra diem lap x_k luon duoc giu trong khoang [a, b].", "x_k \\in [a,b]"),
        ]

    return []


def format_root_finding_result(method_name, result, mode=None, stop_condition=None):
    """
    Dinh dang ket qua tu cac phuong phap tim nghiem.
    """
    if not result:
        return {"error": "Khong co ket qua de dinh dang."}

    error_col_name = "error"
    if "Chia" in method_name:
        error_col_name = "|c_n - c_{n-1}|"
    elif "DÃ¢y cung" in method_name or "Dây cung" in method_name:
        if mode == 'absolute_error':
            error_col_name = "|f(x_n)|/m_1" if stop_condition == 'f_xn' else "(M_1-m_1)|x_n-x_{n-1}|/m_1"
        elif mode == 'relative_error':
            error_col_name = "|f(x_n)|/(m_1|x_n|)" if stop_condition == 'f_xn' else "(M_1-m_1)|x_n-x_{n-1}|/(m_1|x_n|)"
    elif "Newton" in method_name:
        if mode == 'absolute_error':
            error_col_name = "|f(x_{n+1})|/m_1" if stop_condition == 'f_xn' else "(M_2/2m_1)|x_{n+1}-x_n|^2"
        elif mode == 'relative_error':
            error_col_name = "|f(x_{n+1})|/(m_1|x_{n+1}|)" if stop_condition == 'f_xn' else "(M_2/2m_1)|x_{n+1}-x_n|^2/|x_{n+1}|"
    elif "Láº·p Ä‘Æ¡n" in method_name or "Lặp đơn" in method_name:
        error_col_name = "(q/(1-q))|x_{k+1}-x_k|"

    for step in result['steps']:
        for key, value in step.items():
            if isinstance(value, np.generic):
                step[key] = value.item()

    return {
        "method": method_name,
        "status": "success",
        "message": f"Tim thay nghiem thanh cong sau {result['iterations']} lan lap.",
        "solution": result['solution'],
        "steps": result['steps'],
        "error_col_name": error_col_name,
        "input_checks": _build_input_checks(method_name, result),
        "extra_info": {
            "m1": result.get("m1"),
            "M1": result.get("M1"),
            "M2": result.get("M2"),
            "d": result.get("d"),
            "x0": result.get("x0"),
            "q": result.get("q"),
        }
    }
