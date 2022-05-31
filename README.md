# The Tablo File Format

__Tablo__ is a plain text interchange format for tabular data. It is more
powerful than CSV while remaining easy for people to read and write.

It adds explicit headers, datatypes, and cell formatting to address
shortcomings of delimiter-separated formats like CSV or TSV. __Tablo__ solves
delimiter collision issues by having well-defined quoting and escaping rules
that are familiar to users of formats like JSON or common programming languages
like Python or JavaScript.

## What's Wrong with CSV?

> the Microsoft version of CSV is a textbook example of how *not* to design a
> textual file format

-- [Eric S. Raymond, *The Art of Unix Programming*][taop]

Stated simply, there is no single CSV standard. It exists as a myriad of
informal variants whose implementation varies from vendor to vendor. Character
encodings and escape sequences vary from one application to the next, and the
ambiguities in various edge cases means that the output of one application may
not be readable by another.

__Tablo__ is designed to solve a number of ambiguities and shortcomings in CSV.

One of the first obvious differences is that header rows are optional, but
well-defined. In other words, a document may or may not contain a header, but
header data or its absence is always unambiguous.

A crucial aspect of the __Tablo__ format is that it doesn't make assumptions
about the type of data in each cell. If a value is in quotes, it is *always* a
string. If a value is a number without quotes, it is *always* a number. If a
value is an ISO-8601 formatted date prefixed with `#`, it is *always* a datetime.

## Implementations

This repository contains both the __Tablo__ specification, a reference
implementation, and a set of example files.

[taop]: http://www.catb.org/esr/writings/taoup/html/ch05s02.html#id2901882
