from sympy import Matrix, log, symbols, sympify, together
from sympy.printing.latex import LatexPrinter


COMMON_VARIABLE_ALIASES = ("x", "y", "z", "t", "u", "v", "w")


class CompactLatexPrinter(LatexPrinter):
    def _print_log(self, expr, exp=None):
        if len(expr.args) == 2:
            argument, base = expr.args
            argument_latex = self._print(argument)
            if not argument.is_Atom:
                argument_latex = rf"\left({argument_latex} \right)"
            return rf"\log_{{{self._print(base)}}}{{{argument_latex}}}"

        return super()._print_log(expr, exp)


def _collect_free_symbols(expressions):
    return {symbol for expr in expressions for symbol in expr.free_symbols}


def _display_log(argument, base=None):
    if base is None:
        return log(argument)
    return log(argument, base, evaluate=False)


def _sympify_expressions(expr_list, parse_locals):
    return Matrix([sympify(expr, locals=parse_locals) for expr in expr_list])


def build_display_latex_matrix(matrix, display_substitutions=None):
    """
    Convert a symbolic matrix to LaTeX after renaming internal variables
    back to the user's variables and compacting each entry for display.
    """
    display_substitutions = display_substitutions or {}
    printer = CompactLatexPrinter()

    latex_rows = []
    for row in matrix.tolist():
        latex_row = []
        for element in row:
            display_element = together(element.xreplace(display_substitutions))
            latex_row.append(printer.doprint(display_element))
        latex_rows.append(latex_row)

    return latex_rows


def build_display_latex_expressions(expressions, display_substitutions=None):
    """
    Convert a list of symbolic expressions to compact LaTeX strings.
    """
    display_substitutions = display_substitutions or {}
    printer = CompactLatexPrinter()

    latex_expressions = []
    for expression in expressions:
        display_expression = together(expression.xreplace(display_substitutions))
        latex_expressions.append(printer.doprint(display_expression))

    return latex_expressions


def parse_nonlinear_system_expressions(expr_list, n):
    """
    Parse nonlinear-system expressions and normalize user variable names
    to the internal convention x1, x2, ..., xn while preserving the
    original variable names for display.
    """
    variables = symbols(f"x1:{n+1}")
    canonical_set = set(variables)
    display_parse_locals = {"log": _display_log}
    display_expressions = _sympify_expressions(expr_list, display_parse_locals)
    raw_symbol_by_name = {
        str(symbol): symbol for symbol in _collect_free_symbols(display_expressions)
    }

    parse_locals = {str(var): var for var in variables}
    alias_to_canonical = {}
    for alias, var in zip(COMMON_VARIABLE_ALIASES, variables):
        parse_locals[alias] = var
        alias_to_canonical[alias] = var

    expressions = _sympify_expressions(expr_list, parse_locals)

    free_symbols = _collect_free_symbols(expressions)
    unknown_symbols = sorted(
        (symbol for symbol in free_symbols if symbol not in canonical_set),
        key=lambda symbol: str(symbol),
    )

    display_substitutions = {
        var: raw_symbol_by_name.get(str(var), var) for var in variables
    }
    for alias, var in alias_to_canonical.items():
        alias_symbol = raw_symbol_by_name.get(alias)
        if alias_symbol is not None:
            display_substitutions[var] = alias_symbol

    if unknown_symbols:
        used_canonical = [var for var in variables if var in free_symbols]
        available_variables = [var for var in variables if var not in used_canonical]

        if len(unknown_symbols) > len(available_variables):
            expected_variables = ", ".join(str(var) for var in variables)
            raise ValueError(
                "So bien trong he khong phu hop voi so phuong trinh. "
                f"Hay dung mot trong cac bien: {expected_variables} "
                "hoac cac ten tuong ung nhu x, y, z."
            )

        substitution_map = {
            symbol: available_variables[index]
            for index, symbol in enumerate(unknown_symbols)
        }
        expressions = expressions.subs(substitution_map)
        for symbol, canonical_var in substitution_map.items():
            display_substitutions[canonical_var] = raw_symbol_by_name.get(
                str(symbol), symbol
            )

    return variables, expressions, display_substitutions, display_expressions
