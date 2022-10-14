import re


class TableFormat(object):
    rules = None

    def __init__(self, rules={}):
        rule = re.compile(r'^([A-Z]+)(?::([A-Z]+))?$|^([0-9]+)(?::([0-9]+))?$|^([A-Z]+)([0-9]+)(?::([A-Z]+)([0-9]+))?$')
        
        self.rules = []

        for key, props in rules.items():
            if match := rule.match(key):
                start_row, end_row, start_col, end_col = (0, -1, 0, -1)

                groups = match.groups()

                if groups[0] is not None:
                    start_col = self._alpha_to_int(groups[0])
                    end_col = self._alpha_to_int(groups[1]) if groups[1] is not None else start_col
                elif groups[2] is not None:
                    start_row = int(groups[2])
                    end_row = int(groups[3]) if groups[3] is not None else start_row
                elif groups[4] is not None:
                    start_col = self._alpha_to_int(groups[4])
                    start_row = int(groups[5])
                    end_col = self._alpha_to_int(groups[6]) if groups[6] is not None else start_col
                    end_row = int(groups[7]) if groups[7] is not None else start_row

                if ((start_row <= end_row or end_row == -1) and 
                        (start_col <= end_col or end_col == -1)):
                    bounds = (start_col, end_col, start_row, end_row)
                    self.rules.append((
                        bounds, key, props
                    ))



    def get_props(self, col, row):
        def applicable(rule):
            bounds, _key, _props = rule
            start_col, end_col, start_row, end_row = bounds

            return (
                row >= start_row and
                (row <= end_row or end_row == -1) and
                numeric_column >= start_col and
                (numeric_column <= end_col or end_col == -1)
            )

        numeric_column = self._alpha_to_int(col)

        result = []

        for rule in filter(applicable, self.rules):
            _bounds, _key, props = rule
            result.extend(props)

        return result

    def get_rules(self):
        rules = {}

        for rule in self.rules:
            _bounds, key, props = rule

            if key in rules:
                rules[key].extend(props)
            else:
                rules[key] = props

        return rules

    def _alpha_to_int(self, index: str):
        alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        value = 0

        for idx, char in enumerate(reversed(index)):
            value += alphabet.index(char) * 26 ** idx

        return value
