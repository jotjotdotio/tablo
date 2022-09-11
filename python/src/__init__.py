
import parse

defaultSerializer = object()

def parse(input: str):
    _ignore, data, error = parse.document(input, 0)

    if error:
        raise error
    else:
        return data

def serialize(table):
    return defaultSerializer.serialize(table)

def setSerializer(serializer):
    defaultSerializer = serializer()
