import re


class TableFormat(object):
    rules = None

    def __init__(self, rules):
        rule = re.compile(r'^([A-Z]+)(?::([A-Z]+))?$|^([0-9]+)(?::([0-9]+))?$|^([A-Z]+)([0-9]+)(?::([A-Z]+)([0-9]+))?$')
        
        self.rules = []

        for key, props in rules:
            if match := rule.match(key):
                startRow, endRow, startCol, endCol = (0, -1, 0, -1)

                