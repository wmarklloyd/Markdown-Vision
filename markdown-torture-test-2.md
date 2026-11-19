# Markdown Rendering Torture Test 2

This companion fixture tests where blocks begin and end, how source ranges survive editing, and how layout changes in a narrow pane. Each section gives the expected behavior before or after its sample.

- [Block boundaries](#block-boundaries)
- [List boundaries](#list-boundaries)
- [References and source preservation](#references-and-source-preservation)
- [Table shape and alignment](#table-shape-and-alignment)
- [Whitespace and Unicode](#whitespace-and-unicode)
- [HTML containers](#html-containers)
- [Footnote reuse](#footnote-reuse)
- [Search and narrow panes](#search-and-narrow-panes)
- [Fence closed by end of file](#fence-closed-by-end-of-file)

The syntax cases are based on the [CommonMark 0.31.2 specification](https://spec.commonmark.org/0.31.2/) and the [GitHub Flavored Markdown specification](https://github.github.com/gfm/). Heading slugs, fragment navigation, footnotes, editing, and pane layout are application checks.

## Block boundaries

The following underline makes a level-two heading.

Boundary heading
---

The same dashes after a blank line make a horizontal rule.

---

A four-space line in the middle of a paragraph stays in that paragraph.
    continuation, with no code block

    New block after a blank line.
    Its indentation makes it code.

The escaped \# stays literal. The line below is ordinary text because its opening hashes have no separating space.

##NoHeading

## List boundaries

The first list starts at zero. Switching from a period to a closing parenthesis creates a separate list.

0. Zero
1. One
2) Two, in a new list
3) Three

Only an ordered marker starting at one can interrupt a paragraph.
2. This line still belongs to the paragraph.

A new paragraph starts here.
1. This item interrupts the preceding paragraph.

- Loose item with two paragraphs.

  Its second paragraph belongs to the same item.

  > Quoted text inside this item.
  > The blank quote line below separates two paragraphs.
  >
  > The second quoted paragraph.

- Next loose item.

The two nested task checkboxes belong to their parent item.

- [x] Parent task
  - [ ] Nested task
  - [x] Nested task done
- [ ] Sibling task

## References and source preservation

[Case-insensitive reference][RELAY KEY] and [first definition wins][relay key] should have the same destination and title. [The quoted definition][in a quote] should work outside the quote. The [unresolved reference][absent key] should stay literal.

[relay key]: <https://example.invalid/relay path>
  "Relay title on a continuation line"
[relay key]: https://example.invalid/duplicate "Unused title"

> [in a quote]: #block-boundaries
>
> This text is visible inside the quote.

Edit the word **sentinel** in Visual, then inspect the Markdown. The definitions above should still be present, with their original order and line breaks.

## Table shape and alignment

The header establishes three columns. The short row gets two empty cells. The extra field in the long row is dropped. Check left, center, and right alignment and confirm the escaped pipe stays inside its cell.

| Left | Center | Right |
| :--- | :----: | ----: |
| short |
| expanded | literal \| pipe | 12345 | dropped field |
| paragraph<br>inside a cell | **bold** and *italic* | 9 |

The next pair of lines has unequal header and delimiter counts. It should read as paragraph text.

| One | Two | Three |
| --- | --- |

| One-column header |
| --- |
| One-column body |

## Whitespace and Unicode

This soft line break
stays within one rendered line when there is enough space.

This backslash makes a hard break.\
This line starts below it.

The two spaces at the end of this line make a hard break.  
This line also starts below it.

An emphasized phrase can cross a source line: *river on
both banks*. The underscores in sample_rate_hz stay literal.

These entities decode once: &amp;lt; becomes the visible characters `&lt;`, while &lt; becomes a single less-than sign. These two numeric forms show the same character: &#128640; &#x1F680;.

Combining characters and right-to-left text should remain intact when switching views: café / café / العربية / עברית / 中文 / 👩‍💻.

The first and last spaces inside this code span are trimmed evenly: ``  a single ` tick  ``.

## HTML containers

<details open>
<summary>Open mixed container</summary>

The **bold text** and the table below belong inside the open container in both Reader and Visual.

| Key | Value |
| --- | --- |
| Mode | Open |

</details>

<details>
<summary>Closed mixed container</summary>

This paragraph belongs inside the collapsed disclosure. Expand it to read **hidden until opened**.

</details>

<pre>
*Literal asterisks inside raw pre.*

**A blank line does not terminate this HTML block.**
</pre>

This paragraph appears outside both disclosures and the raw preformatted block.

## Footnote reuse

The first citation[^repeat] and second citation[^repeat] share one note. The other citation[^aside] has its own note. Check that each citation jumps to its note and that the repeated note provides a return link to each place it was cited.

[^repeat]: This note has two paragraphs.

    The next paragraph contains **bold** and [a return to the table section](#table-shape-and-alignment).

[^aside]: A second note. Its definition appears ahead of the next heading in the Markdown source.

## Search and narrow panes

Search for **starlight** in Split view. It appears as plain starlight, across a styled boundary as star**light**, and inside a code span as `starlight`. The destination of [the telescope link](https://example.invalid/starlight) contains a source-only match. Step through the matches and check that the two panes agree when a match is visible in both.

Drag the Split divider until the Visual pane is narrow. The table should stay within its pane and the code block should contain its own horizontal scrollbar.

| Category | Long content |
| --- | --- |
| Text | thisisaverylongunbrokentexttokenthatshouldwrapwithintheavailablewidthwithoutmovingthedivider |
| Code | `long_unbroken_code_span_0123456789_0123456789_0123456789_0123456789_0123456789` |

~~~text
This deliberately long preformatted line should scroll horizontally inside its code block when the available width is small. 0123456789012345678901234567890123456789
~~~

## Fence closed by end of file

Everything after the next fence stays in one code block until the file ends. The shorter fence inside it stays literal. This case belongs at the end of the file.

~~~~text
# This is code, even though it looks like a heading.
~~~
| These pipes are literal | So is **this** |
