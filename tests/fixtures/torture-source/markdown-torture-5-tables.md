# Torture Test 5: Tables and Cell Boundaries

This document stresses table recognition and cell editing. Edit existing plain cells, formatted cells, line breaks, escaped pipes, and Unicode while checking that neighboring cells and alignment stay intact.

## Alignment, uneven rows, and escapes

| Left | Center | Right |
| :--- | :----: | ----: |
| alpha | beta | 123 |
| short only |
| extra | fields | stay | hidden extra source |
| escaped \| pipe | first<br>second | **bold** and *italic* |
| backslash \\ value | café | 😀 |
| entity &amp; word | &#x1F680; | &copy; notice |

## Empty and single-column tables

| One column |
| :---: |
| first entry |
| |
| last entry |

| A | B | C |
| - | :-: | -: |
| | middle | |

## Inline content within cells

| Name | Content |
| --- | --- |
| link | [Visible table label](https://example.invalid/table) |
| reference | [Table reference][table-key] |
| code | `pipe\|inside` |
| multiline | first line<br>second line<br>third line |
| long | averylongunbrokenvalue0123456789012345678901234567890123456789 |

[table-key]: https://example.invalid/target "Table link"

## Non-table lookalikes

| One | Two | Three |
| --- | --- |

An escaped \| pipe in ordinary text should not create a table.

    | Not | a | table |
    | --- | --- | --- |
