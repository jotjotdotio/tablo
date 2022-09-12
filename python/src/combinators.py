from typing import Iterable


def concat(*rules):
    def combinator(input: str, offset: int):
        cursor = offset
        results = []

        for rule in rules:
            offset, match, error = rule(input, cursor)

            if error:
                return (cursor, None, error)
            else:
                cursor = offset

                if isinstance(match, Iterable):
                    results.extend(match)
                else:
                    results.append(match)

        return (cursor, results, None)

    return combinator

def altern(*rules):
    def combinator(input: str, offset: int):
        cursor = offset
        errors = []

        for rule in rules:
            offset, result, error = rule(input, cursor)

            if not error:
                return (offset, result, None)
            else:
                cursor = offset
                errors.extend(error)
        
        return (offset, None, f'one of {",".join(errors)}')

    return combinator

def repeat(*rules):
    def combinator(input: str, offset: int):
        cursor = offset
        results = []
        error = None

        while True:
            first, *rest = rules
            cursor, result, error = first(input, cursor)

            if error:
                break
            else:
                results.append(result)

            cursor, result, error = concat(*rest)(input, cursor)

            if error:
                return (offset, None, error)
            else:
                results.extend(result)
        
        return (cursor, results, error)
    
    return combinator
