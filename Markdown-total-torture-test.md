# Total Markdown Torture Test

This combined test is organized by Markdown feature and editing behavior. The final section ends with an intentionally unclosed code fence, so it must remain last.

## Contents

- [Block structure and nesting](#block-structure-and-nesting)
  - [Headings and block boundaries](#headings-and-block-boundaries)
  - [Lists, interruption, and indentation](#lists-interruption-and-indentation)
  - [Quotations and headings](#quotations-and-headings)
- [Inline syntax, links, and Unicode](#inline-syntax-links-and-unicode)
  - [Emphasis and punctuation](#emphasis-and-punctuation)
  - [Reference links and autolinks](#reference-links)
  - [Escapes, code spans, and entities](#inline-code-and-entities)
  - [Unicode and direction](#unicode-and-direction)
- [Tables and cell editing](#tables-and-cell-editing)
  - [Alignment and basic structure](#alignment-and-basic-structure)
  - [Empty and irregular rows](#empty-and-irregular-rows)
  - [Inline formatting and escaped pipes](#inline-formatting-and-escaped-pipes)
  - [Tables in containers](#block-boundaries-and-containers)
  - [Editing round trips and print pagination](#search-and-editing-round-trips)
- [HTML, footnotes, tasks, and code](#html-footnotes-tasks-and-code)
  - [Disclosure sections and raw HTML](#disclosure-sections)
  - [Footnotes and reference reuse](#footnotes-and-reference-reuse)
  - [Fenced code](#fenced-code)
- [Reader and editor behavior](#search-and-editing-round-trips)
  - [Search, editing, undo, and print](#search-and-editing-round-trips)

<!-- Source: markdown-table-torture-test.md -->

## Tables and cell editing

### Markdown Table Torture Test

Use this document to exercise reading, Visual editing, Split view, search, and printing. Expected results appear next to each case. The Markdown syntax cases follow the [GitHub Flavored Markdown table specification](https://github.github.com/gfm/#tables-extension-).

#### Alignment and basic structure

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

#### Empty and irregular rows

There are four columns throughout. The short row has empty trailing cells. The extra field in the long row is ignored in the rendered table but must remain in the Markdown source.

| First | Second | Third | Fourth |
| --- | --- | --- | --- |
| All | four | cells | present |
| Short |
| first | | third | |
| Extra | cells | are | ignored | KEEP THIS EXTRA FIELD |
| | | | |

#### Inline formatting and escaped pipes

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

#### Line breaks within cells

Each cell below is a single Markdown table cell. The HTML break tags create visible lines inside it. In Visual editing, edit a word in the middle line, apply the change, then undo and redo. Confirm the other lines and cells remain intact.

| Item | Notes |
| --- | --- |
| Three lines | First line<br>Middle line has a target word<br>Last line |
| Mixed breaks | Upper<br />Center<br>Lower |
| Literal tag | `<br>` is code<br>Actual second line |
| Empty line | First<br><br>Third |

#### Unicode and layout

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

#### Block boundaries and containers

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

#### Search and editing round trips

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

#### Print pagination

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

<!-- Source: markdown-torture-3-structure.md -->

## Block structure and nesting

### Torture Test 3: Containers and Block Boundaries

This document stresses block nesting, interruption, indentation, and source-preserving edits. Edit the marked sentences and check that the surrounding markers remain unchanged.

#### Nested lists and paragraphs

- Parent item for the container survey.

  This second paragraph belongs to the parent item.

  > Quoted sentence inside the parent item.
  > Continuation of the quoted sentence.
  >
  > Another paragraph in the nested quote.

  1. First ordered child.
  2. Second ordered child.

- A second parent item.

3. Ordered list starts at three.
4. Another numbered item.

#### Tasks and lazy continuation

- [x] Parent task for inspection
  - [ ] First nested task
  - [x] Second nested task
- [ ] Final top-level task

*   This list item has a hanging indent.
    This continuation keeps its four spaces.
    A third line continues the same paragraph.
*   Another hanging list item.

*   This item uses a lazy continuation.
Its next source line has no indentation.

#### Quotations and headings

> The outer quotation has plain text.
>
> > A nested quotation with its own paragraph.
>
> Back in the outer quotation.

Setext heading with **emphasis**
--------------------------------

The following line is a horizontal rule, not a heading underline.

---

#### Code and indentation

    First indented code line.
    Second indented code line.

~~~text
The next shorter marker is code.
~~
~~~

The paragraph after the code block remains outside it.

<!-- Source: markdown-torture-4-inline.md -->

## Inline syntax, links, and Unicode

### Torture Test 4: Inline Syntax, References, and Unicode

This document concentrates on inline delimiters, links, source-only reference targets, and Unicode. Edit the visible words without changing destinations or hidden definitions.

#### Emphasis and punctuation

Plain before **bold text**, *italic text*, and ***nested emphasis*** after.

An underscore inside `sample_rate_hz` is literal. Escaped \*asterisks\* remain literal. The word pre**center**post has a styled middle.

The phrase *flows across
two source lines* while this line ends with a hard break.  
The next rendered line starts here.

#### Reference links

[Editable reference label][shared key] and [another reference label][SHARED KEY] have the same destination. An [unknown reference][missing key] remains literal.

[shared key]: <https://example.invalid/a%20path> "A destination title"

An inline [external link](https://example.invalid/path_(part) "Title with spaces") and an <https://example.invalid/auto> autolink share this paragraph.

#### Inline code and entities

Short `code text`, a longer delimiter ``a ` tick``, and literal `&lt;` should remain code. Text entities include &amp;, &lt;, &#65;, and &#x1F680;.

#### Unicode and direction

Precomposed café and decomposed café should not silently become the same bytes. العربية and עברית share a paragraph with English. Emoji include 👩‍💻 and 🇺🇸.

Repeated word: lantern. Later in this same paragraph: lantern. Another paragraph repeats lantern below.

The final lantern is here.

<!-- Source: markdown-torture-5-tables.md -->

### Torture Test 5: Tables and Cell Boundaries

This document stresses table recognition and cell editing. Edit existing plain cells, formatted cells, line breaks, escaped pipes, and Unicode while checking that neighboring cells and alignment stay intact.

#### Alignment, uneven rows, and escapes

| Left | Center | Right |
| :--- | :----: | ----: |
| alpha | beta | 123 |
| short only |
| extra | fields | stay | hidden extra source |
| escaped \| pipe | first<br>second | **bold** and *italic* |
| backslash \\ value | café | 😀 |
| entity &amp; word | &#x1F680; | &copy; notice |

#### Empty and single-column tables

| One column |
| :---: |
| first entry |
| |
| last entry |

| A | B | C |
| - | :-: | -: |
| | middle | |

#### Inline content within cells

| Name | Content |
| --- | --- |
| link | [Visible table label](https://example.invalid/table) |
| reference | [Table reference][table-key] |
| code | `pipe\|inside` |
| multiline | first line<br>second line<br>third line |
| long | averylongunbrokenvalue0123456789012345678901234567890123456789 |

[table-key]: https://example.invalid/target "Table link"

#### Non-table lookalikes

| One | Two | Three |
| --- | --- |

An escaped \| pipe in ordinary text should not create a table.

    | Not | a | table |
    | --- | --- | --- |

## Additional Markdown Specification Cases

These cases complement the original files. They use the [CommonMark specification](https://spec.commonmark.org/0.31.2/), the [GitHub Flavored Markdown specification](https://github.github.com/gfm/), and the [markdown-it footnote documentation](https://github.com/markdown-it/markdown-it-footnote) as references. Extensions and sanitization behavior can differ between renderers; examples marked as comparisons are not a claim of full GFM compatibility.

### Headings and block boundaries

The following are a level-three heading and a paragraph beginning with a literal hash, respectively:

### Heading with optional closing marks ###

#Not a heading because there is no space.

The next paragraph is followed by a thematic break. It must not become a Setext heading.

* * *

The next two lines are a level-two Setext heading:

Setext boundary sample
---

Paragraph before a quote.
> A block quote can interrupt a paragraph.
> Its second line remains in the quote.

### Lists, interruption, and indentation

This paragraph is followed by a line beginning with 2; under CommonMark it does not start an ordered list here.
2. A numbered line that follows a paragraph without a blank line.

1. This ordered list starts at one and has a continuation.
   Continuation text within the first item.
2. The second item contains a quoted block:

   > Quote nested inside an ordered item.
   >
   > - A list nested inside the quote.

3. Final item after the nested containers.

- Tight first item
- Tight second item

- Loose first item

- Loose second item

### Links, images, references, and autolinks

The same reference is used in full, collapsed, and shortcut forms: [full label][mixed ref], [mixed ref][], and [mixed ref]. The first definition wins when labels normalize to the same value.

[mixed ref]: https://example.invalid/first "First reference"
[MIXED REF]: https://example.invalid/second "Duplicate reference"

[Balanced destination](https://example.invalid/a_(b_(c)) "Nested parentheses") and [empty destination]() exercise inline link boundaries. An escaped bracket \[ stays literal.

An email autolink: <test@example.invalid>. A bare URL comparison: https://example.invalid/path?q=one&x=two. Angle brackets and trailing punctuation should not become part of the destination accidentally.

An image with formatted alternative text: ![A **bold** label](https://example.invalid/missing-image.png "Image title"). The unavailable image is intentional; check the alt text and preserve its destination when editing.

The unsafe destination [should not be an executable link](javascript:alert%281%29); inspect the result without clicking it. Raw HTML filtering is application-specific and should be checked independently from CommonMark parsing.

### Inline delimiters, escapes, and line endings

Intraword underscores remain literal in alpha_beta_gamma. Compare **strong with *emphasis inside*** and *emphasis with **strong inside***. Unmatched delimiters stay visible: **open only and close only__.

Escaped punctuation: \[brackets\] \(parentheses\) \# hash \! exclamation \\ backslash. A backslash before an ordinary letter stays literal: \q.

The next line ends with a backslash hard break.\
This is the next visual line. The following source newline is a soft break:
the text continues without a forced HTML break.

An entity outside code becomes text: &#x26; and &amp;. Inside code, `&#x26;` and `&amp;` remain literal. A code span can contain backticks: ``one ` tick``.

### GFM and footnote comparisons

The extension comparison below checks a task marker in a block quote, strikethrough next to punctuation, and a footnote defined after use. Task-list interaction and supported extensions may vary by renderer.

> - [ ] Quoted unchecked task
> - [x] Quoted completed task

Punctuation around ~~removed words~~, followed by ~~two~~ adjacent ~~spans~~.

An inline footnote is here.^[Inline footnote with **emphasis**.] A separate later-defined note appears twice.[^additional-note] Here it is again.[^additional-note]

[^additional-note]: A later-defined note with `code` and a [reference link][mixed ref].

<!-- Source: markdown-torture-6-embedded.md -->

## HTML, footnotes, tasks, and code

### Torture Test 6: Embedded HTML, Footnotes, and Fences

This document combines Markdown extensions and embedded HTML. It distinguishes visible text that can be edited safely from generated content or HTML that may need source editing.

#### Disclosure sections

<details open>
<summary>Open disclosure title</summary>

The visible disclosure paragraph contains **bold words** and ordinary surrounding text.

m&#105;rage

[Invisible destination check](https://example.invalid/mirage)

| Setting | Value |
| --- | --- |
| State | Open |

</details>

<details>
<summary>Closed disclosure title</summary>

The hidden paragraph is available after expanding this section.

</details>

#### Footnotes and reference reuse

The first note marker[^note] and the repeated note marker[^note] link to the same note. A different marker[^other] links to another note.

[^note]: This footnote has one paragraph.

    A second paragraph includes **bold** and [a link](https://example.invalid/footnote).

[^other]: Another footnote definition.

#### Raw HTML and sanitization

<div class="survey-container">

This Markdown paragraph is inside a raw HTML container.

</div>

<pre>
*Literal asterisks stay literal in raw preformatted HTML.*
<b>Markup is interpreted as HTML inside this block.</b>
</pre>

Inline HTML has <kbd>Ctrl</kbd> and <mark>marked text</mark> in a sentence.

#### Fenced code

````python
print("A nested fence follows")
```
print("The shorter fence is code")
````

~~~powershell
Write-Output "Literal <tag> and | pipe"
~~~

The last fence is intentionally unclosed; all following lines belong to its code body.

~~~~text
An unclosed code block contains **literal asterisks**.
~~~
The shorter fence above is literal.
