from tablo.parse import document
from tablo.serializers import Serializer, TabloSerializer


defaultSerializer: Serializer = TabloSerializer

def parse(input: str):
    _ignore, data, error = document(input, 0)

    if error:
        raise ValueError(error)
    else:
        return data

def serialize(table):
    return defaultSerializer.serialize(table)

def setSerializer(serializer: Serializer):
    global defaultSerializer
    defaultSerializer = serializer
