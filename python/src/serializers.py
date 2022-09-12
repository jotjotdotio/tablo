from table import Table


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
    def serlialize_data(cls, table: Table):
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