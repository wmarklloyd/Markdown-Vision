# Markdown Table Torture Test

Use this document to exercise reading, Visual editing, Split view, search, and printing. Expected results appear next to each case. The Markdown syntax cases follow the [GitHub Flavored Markdown table specification](https://github.github.com/gfm/#tables-extension-).

## Alignment and basic structure

The first column uses the default alignment, followed by left, center, and right. The numbers should align with their headers.

| Default | Left | Center | Right |
| --- | :--- | :---: | ---: |
| North | Apple | Medium | 1 |
| South | Banana | Small | 22 |
| West | Citrus | Large | 333 |

The next table omits outer pipes and uses uneven whitespace.

Name|Amount|Status
:---|---:|:---:
 Pencil  |  4|Ready
Paper|125   | Pending

The next table has a header and no body.

| Header only | Other header |
| --- | --- |

The next table has one column.

| Single column |
| --- |
| First row |
| Second row |

## Empty and irregular rows

There are four columns throughout. The short row has empty trailing cells. The extra field in the long row is ignored in the rendered table but must remain in the Markdown source.

| First | Second | Third | Fourth |
| --- | --- | --- | --- |
| All | four | cells | present |
| Short |
| first | | third | |
| Extra | cells | are | ignored | KEEP THIS EXTRA FIELD |
| | | | |

## Inline formatting and escaped pipes

Each row has two cells. All visible vertical bars in the second column belong to its content.

| Case | Content |
| --- | --- |
| Plain | alpha \| beta |
| Bold | **bold \| bar** and normal text |
| Italic | *italic \| bar* |
| Code | `left \| right` |
| Code with backticks | ``value `inner` \| end`` |
| Link | [A linked label](https://example.com/path_(table)) |
| Reference | [Reference label][table-reference] |
| Escapes | backslash \\ and literal \*asterisks\* |
| Entity | &copy; &amp; &#x1F680; |
| Nested | **bold and *italic*** plus ~~strike~~ |

[table-reference]: https://example.com/table-reference "Reference title"

## Line breaks within cells

Each cell below is a single Markdown table cell. The HTML break tags create visible lines inside it. In Visual editing, edit a word in the middle line, apply the change, then undo and redo. Confirm the other lines and cells remain intact.

| Item | Notes |
| --- | --- |
| Three lines | First line<br>Middle line has a target word<br>Last line |
| Mixed breaks | Upper<br />Center<br>Lower |
| Literal tag | `<br>` is code<br>Actual second line |
| Empty line | First<br><br>Third |

## Unicode and layout

Make the Visual pane narrow in Split view. Long text should stay inside the table, and the surrounding document should remain readable. Check the same rows in print preview.

| Category | Sample |
| --- | --- |
| Long word | thisisaverylongunbrokentexttokendesignedtorequirewrappingwhenviewedinasmallwindowwithoutforcingthewholepagetoscroll |
| Long code | `01234567890123456789012345678901234567890123456789012345678901234567890123456789` |
| Mixed scripts | café · café · العربية · עברית · 中文 · 日本語 · 👩‍💻 |
| Numbers | −1,234.56 · 0.000001 · 12345678901234567890 |

This wider table has twelve columns. Check that no data disappears in Reader, Visual, Split, or print.

| C01 | C02 | C03 | C04 | C05 | C06 | C07 | C08 | C09 | C10 | C11 | C12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A01 | A02 | A03 | A04 | A05 | A06 | A07 | A08 | A09 | A10 | A11 | A12 |
| B01 | B02 | B03 | B04 | B05 | B06 | B07 | B08 | B09 | B10 | B11 | B12 |
| C01 | C02 | C03 | C04 | C05 | C06 | C07 | C08 | C09 | C10 | C11 | C12 |

## Block boundaries and containers

The following table ends before the blockquote.

| Key | Value |
| --- | --- |
| End | Here |
> This quote sits outside the table.

> A table inside a blockquote:
>
> | Quoted key | Quoted value |
> | --- | --- |
> | north | south |
> | east | west |

- A list item containing a table:

  | Nested item | Quantity |
  | --- | ---: |
  | Screws | 4 |
  | Nuts | 8 |

- A second list item.

The following three lines have mismatched header and divider cell counts and should remain paragraph text.

| Invalid one | Invalid two | Invalid three |
| --- | --- |
| This | is | plain text |

The next code block contains table syntax as literal code.

```markdown
| Not | a table |
| --- | --- |
| Still | code |
```

## Search and editing round trips

Search for **tabletarget**. It appears in the header, in two regular cells, across a formatted boundary, in a code span, and in a link destination. Step through the matches in Split view and check the source and Visual highlighting.

| tabletarget header | Search content |
| --- | --- |
| First | tabletarget |
| Second | TABLETARGET |
| Third | table**target** |
| Fourth | `tabletarget` |
| Fifth | [external link](https://example.com/tabletarget) |

For the following table, edit **one word** in the middle cell in Visual, then apply. The surrounding text, the unedited cells, the divider alignment, and the source outside the table should remain intact. Undo and redo the change. Then add and remove a row or column and inspect the result in Markdown.

Before-table sentinel.

| Person | Description | Score |
| :--- | :--- | ---: |
| Ada | Before middleword after | 17 |
| Ben | Keep **bold** and `code` intact | 23 |
| Cy | Keep a \| pipe intact | 31 |

After-table sentinel.

## Print pagination

Print or use print preview with enough scaling to span pages if needed. Rows should remain legible, long content should not overlap adjacent cells, and the header should repeat when a table continues onto another page.

| Row | Description |
| ---: | --- |
| 01 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 02 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 03 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 04 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 05 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 06 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 07 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 08 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 09 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 10 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 11 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 12 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 13 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 14 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 15 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 16 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 17 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 18 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 19 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 20 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 21 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 22 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 23 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
| 24 | A long record with enough text to make pagination and wrapping observable in a narrow print layout. |
