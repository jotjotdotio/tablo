from tablo.format import TableFormat
from tablo.table import Table


column_labels = {}

def int_to_alpha(value: int):
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

    def decay(value: int):
        while value > 0:
            yield value
            value //= 26

    if value not in column_labels:
        result = ''

        for v in decay(value):
            result = alphabet[v % 26] + result

        column_labels[value] = result or 'A'

    return column_labels[value]


class Serializer(object):
    @classmethod
    def serialize(cls, table):
        raise NotImplementedError()


class TabloSerializer(Serializer):
    @classmethod
    def serialize(cls, table):
        header = cls.serialize_header(table)
        data = cls.serialize_data(table)
        format = cls.serialize_format(table.format)

        return f'{header}=0.1\n{data}\n{format}'

    @classmethod
    def serialize_header(cls, table: Table):
        if not table.header:
            return ''

        return ','.join(cls.serialize_item(val) for val in table.header) + '\n'

    @classmethod
    def serialize_data(cls, table: Table):
        return '\n'.join(','.join(
            cls.serialize_item(elt) for elt in row
        ) for row in table.data)

    @classmethod
    def serialize_item(cls, item):
        if isinstance(item, str):
            return f'"{item}"'
        elif isinstance(item, (int, float)):
            return str(item)
        elif isinstance(item, bool):
            return 'true' if item else 'false'
        elif item is None:
            return '-'
    
    @classmethod
    def serialize_format(cls, format: TableFormat):
        rules = format.get_rules()
        return '*\n' + '\n'.join(
            f'{key} {{{",".join(props)}}}' for key, props in rules.items()
        )


class HtmlSerializer(Serializer):
    @classmethod
    def serialize(cls, table: Table):
        header = cls.serialize_header(table)
        data = cls.serialize_data(table)

        return f'<table>{header}{data}\n</table>'

    @classmethod
    def serialize_header(cls, table: Table):
        if not table.header:
            return ''
        
        def serialize_item(index: int, item):
            col = int_to_alpha(index)
            value = cls.serialize_item(item)
            return f'<td data-col-index="{col}">{value}</td>'

        items = (serialize_item(index, item) for index, item in enumerate(table.header))

        sep = "\n    "
        return f'\n  <thead><tr>\n    {sep.join(items)}\n  </tr></thead>'

    @classmethod
    def serialize_data(cls, table: Table):
        def serialize_item(col_idx, row_idx, item):
            col_str = int_to_alpha(col_idx)
            value = cls.serialize_item(item)

            if props := table.format and table.format.get_props(col_str, row_idx):
                class_attr = f' class="{" ".join(props)}"'
            else:
                class_attr = ''

            return f'<td data-col-index="{col_str}"{class_attr}>{value}</td>'

        def serialize_row(row_idx, row):
            items = (serialize_item(col_idx, row_idx, item) for col_idx, item in enumerate(row))
            sep = "\n      "
            return f'<tr data-row-index="{row_idx}">\n      {sep.join(items)}\n    </tr>'
        
        rows = (serialize_row(index, row) for index, row in enumerate(table.data))

        sep = "\n    "
        return f'\n  <tbody>\n    {sep.join(rows)}\n  </tbody>'

    @classmethod
    def serialize_item(cls, item):
        if isinstance(item, str):
            return item
        elif isinstance(item, (int, float)):
            return str(item)
        elif isinstance(item, bool):
            return 'True' if item else 'False'
        elif item is None:
            return ''
