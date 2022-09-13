# The Tablo File Format

__tablo__ is a plain text interchange format for tabular data. It is more
expressive than CSV while remaining easy for people to read and write.

It adds explicit headers, datatypes, and cell formatting to address
shortcomings of delimiter-separated formats like CSV or TSV. __tablo__ solves
delimiter collision issues by having well-defined quoting and escaping rules
that are familiar to users of formats like JSON or common programming languages
like Python or JavaScript.

## What's Wrong with CSV?

> the Microsoft version of CSV is a textbook example of how *not* to design a
> textual file format

—Eric S. Raymond, [*The Art of Unix Programming*][taoup]

Stated simply, there is no single CSV standard. It exists as a myriad of
informal variants whose implementation varies from vendor to vendor. Character
encodings and escape sequences vary from one application to the next, and the
ambiguities in various edge cases means that the output of one application may
not be readable by another.

__tablo__ is designed to solve a number of ambiguities and shortcomings in CSV.

One of the first obvious differences is that header rows are optional, but
well-defined. In other words, a document may or may not contain a header, but
determining whether the document includes a header is always unambiguous.

A crucial aspect of the __tablo__ format is that it doesn't make assumptions
about the type of data in each cell. If a value is surrounded by quotes, it is 
*always* a string. If a value is a number without quotes, it is *always* a
number. If a value is an ISO-8601 formatted date preceded by a hash mark, it
is *always* a datetime.

## Installation

Install with `pip`:

```
python -m pip install tablo-fyi
```

## Usage

Parsing is accomplished with the `parse` function.

```
import tablo

data = tablo.parse('"name", "age"\n=0.1\n"Tom", 24\n"Jerry", 27\n')

name = data['A0']  # Retrieves the value in column A, row 0 => 'Tom'
age = data['B1']   # Retrieves the value in column B, row 1 => 27
```

## More Information

More information can be found in [the __tablo__ specification][spec], and a
set of [example files][examples] can be found in the [project repository][repo].

[taoup]: http://www.catb.org/esr/writings/taoup/html/ch05s02.html#id2901882
[spec]: https://tablo.fyi
[examples]: https://github.com/jotjotdotio/tablo/tree/main/examples
[repo]: https://github.com/jotjotdotio/tablo
