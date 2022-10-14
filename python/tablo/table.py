import re
from typing import Any
from tablo.format import TableFormat


class Table(object):
    def __init__(self, header, rows, format):
        self.header = header
        self.data = rows
        self.format = format
        self.breaks = []

    def concat(self, rows):
        self.data += rows

    def get(self, column, row):
        if isinstance(column, str):
            column = self._alpha_to_int(column)

        return self.data[row][column]

    def get_row(self, row):
        return self.data[row]

    def __getitem__(self, name: str) -> Any:
        if match := re.match(r'([A-Z]+)?([0-9]+)?', name):
            col, row = (None, None)

            if col_str := match.groups()[0]:
                col = self._alpha_to_int(col_str)
            
            if row_str := match.groups()[1]:
                row = int(row_str)

            if row is not None and col is not None:
                try:
                    return self.data[row][col]
                except IndexError:
                    raise KeyError()
            elif row is not None:
                try:
                    return self.data[row]
                except IndexError:
                    raise KeyError()
            elif col is not None:
                try:
                    return (row[col] for row in self.data)
                except IndexError:
                    raise KeyError()
            else:
                raise KeyError()
        else:
            raise KeyError()
        
    def _alpha_to_int(self, index: str):
        alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        value = 0

        for idx, char in enumerate(reversed(index)):
            value += alphabet.index(char) * 26 ** idx

        return value
