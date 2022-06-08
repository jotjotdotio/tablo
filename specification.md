# Tablo File Format Specification

__Tablo__ is a plain text interchange format for tabular data.

## Table of Contents

- [Format Overview](#format-overview)
- [Types](#types)
    - [Strings](#strings)
    - [Numbers](#numbers)
    - [Dates and Times](#dates-and-times)
    - [Booleans](#booleans)
    - [Null](#null)
- [Document Structure](#document-structure)
    - [Column Headers](#column-headers)
    - [Table Data](#table-data)
    - [Formatting](#formatting)

## Format Overview

A __Tablo__ file consists of three sections: an optional header, the table data, and an optional format section. The header is a single line that specifies column labels. Table data consists of individual lines of comma-separated values, with each line consisting of a single table entry. The format section is a collection of declarations to apply text formatting rules to selected cells or groups of cells.

## Types

All values in __Tablo__ belong to one of five data types. Each type has a unique and unambiguous representation in __Tablo__. The five types are *string*, *number*, *datetime*, *boolean*, and *null*. 

### Strings

A string is a sequence of zero or more Unicode characters, surrounded by double quotes. Strings may not span multiple lines.

Quotation marks, new line characters, and certain non-printing characters must be escaped using escape sequences that begin with a backslash. The following table shows escape sequences for common special characters.

| Escape sequence | Character | Description          |
|-----------------|-----------|----------------------|
| `\0`            | `NUL`     | null                 |
| `\t`            | `TAB`     | horizontal tab       |
| `\n`            | `LF`      | line feed (new line) |
| `\r`            | `CR`      | carriage return      |
| `\"`            | "         | double quote         |
| `\\`            | \\        | backslash            |

Additionally, arbitrary Unicode code points can be written in the format `\u{n}`, where *n* is a 1–8 digit hexidecimal number. Thus, the string `"\u{E9}"` would be a Latin small e with an acute accent, and `"\u{1F354}"` would be the hamburger emoji, "🍔".

| String Examples                            |
|--------------------------------------------|
| `"155 Water Street"`                       |
| `"11201"`                                  |
| `"some \"quoted\" text"`                   |
| `"backslash, \\, or reverse solidus"`      |
| `"é can be written as \u{E9} or e\u{301}"` |

### Numbers

A number is a decimal representation of a positive or negative whole number or arbitrary precision floating-point number. Floating-point values may be written in decimal or scientific notation. Numbers represented in __Tablo__ are abstract, and no hardware representation is implied. Implementations should use their best judgement in chosing the best memory representation for a particular numeric value.

| Decimal integer | Hexadecimal | Decimal floating point | Scientific |
|-----------------|-------------|------------------------|------------|
| 0               | 0x0         | 0.                     | 0e0        |
| 42              | 0xF5        | .01                    | 5e2        |
| 1_000_000       | -0xC8       | 1_234.56               | 31e+2      |
| +102            | +0xcafe     | -4.302                 | 3.2e-4     |
| -21_345         | 0xdead_beef | 3.141_59               | -4_345.1e3 |

### Dates and Times

Dates and times are represented as modified RFC 3339 date string. Because of the ambiguity between a calendar year in RFC 3339 and an integer in the __Tabla__ format, a date must always be prefixed by a literal hash mark (`#`).

| Description                                        | Format                      | Example                  |
|----------------------------------------------------|-----------------------------|--------------------------|
| A calendar year                                    | `#YYYY`                     | `#1995`                  |
| A calendar month and year                          | `#YYYY-MM`                  | `#1995-01`               |
| A calendar month year, and day                     | `#YYYY-MM-DD`               | `#1995-01-31`            |
| A specific hour in local time                      | `#HH`                       | `#14`                    |
| A specific time in local time                      | `#HH:MM`                    | `#14:30`                 |
| A specific time with seconds with time zone offset | `#HH:MM:SS+\|-hhmm`         | `#14:30:00-0500`         |
| A local time on a particular year, month and day   | `#YYYY-MM-DDTHH:MM`         | `#1995-01-31T14:30`      |
| A time with time zone on a particular date         | `#YYYY-MM-DDTHH:MM+\|-hhmm` | `#1995-01-31T14:30-0430` |

### Booleans

A boolean is a value of either `true` or `false`.

### Null

A null, or empty cell, is represented by a hyphen.

## Header

The __*header*__ is an optional single line consisting of a comma-separated list of strings to be used as column labels. A column with no label is represented by a null value. The header is followed by a line containing a single equal sign.

```
"Title", "Medium", "Year", "Width", "Height"
=
```

## Table Data

The __*table data*__ section consists of lines of comma-separated values, one line per row of data.

```
"Gold Marilyn Monroe", "Silkscreen ink and acrylic on canvas", 1962T, 211.4, 144.7
"Double Elvis", "Silkscreen ink on acrylic on canvas", 1963T, 210.8, 134.6
"Flowers", "Offset lithograph", 1964T, 55.8, 55.7
"Cow", "Screenprint", 1966T, 116.7, 74.5
"Self-Portrait", "Screenprint", 1966T, 56, 52.8
"Mao", "Silkscreen ink and acrylic on linen", 1973T, 66.5, 55.9
```

A line consisting of a single tilde character (`~`) indicates a "table break", which creates a visual break between groups of rows with headers repeated above each group. Row numbering continues sequentially across table breaks.

## Formatting

The __*formatting*__ section begins with a line containing a single asterisk. It is followed by lines that specify formatting options for cell ranges. Format specifiers consist of a range selector enclosed in square brackets, followed by a list of formatting properties to be applied to the cell, enclosed in braces.

Format properties can adjust text style, font proportionality, and text color. Text styles are `plain`, `bold`, `italic`, `underline`, and `strike`. Styles may be combined, allowing a cell to be both bold and underlined, for example. Font proportion may be specified as either `normal`, for proportional text, or `mono` for monospaced (or fixed-width) text. Color properties can be one `black`, `red`, `orange`, `yellow`, `green`, `blue`, `violet`, `grey`, or `white`.  By default, all cells have `{plain, normal, black}` formatting.

```
*
[A] {bold}
[A3:E3] {italic, red}
```

Format specifiers are labels that .

| Style Property | Description                |
|----------------|----------------------------|
| `plain`        | plain text (default)       |
| `bold`         | **bold text**              |
| `italic`       | _italicised text_          |
| `underline`    | <ins>underlined text</ins> |
| `strike`       | ~strikethrough~            |

| Font Property | Description                   |
|---------------|-------------------------------|
| `normal`      | proportional font (default)   |
| `mono`        | `monospaced font`             |

| Color Property | Description          |
|----------------|----------------------|
| `black`        | black text (default) |
| `red`          | red text             |
| `orange`       | orange text          |
| `yellow`       | yellow text          |
| `green`        | green text           |
| `blue`         | blue text            |
| `violet`       | violet text          |
| `grey`         | grey text            |
| `white`        | white text           |

Text alignment and conditional formatting expressions are not specified at this time, but may be added in the future. 