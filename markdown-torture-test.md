# Markdown Rendering Torture Test Suite

A comprehensive Markdown stress-test file combining CommonMark edge cases, GitHub Flavored Markdown (GFM) extensions, pathological nesting, layout stressors, and HTML/XSS sanitization checks.

---

## 1. Fence-Within-a-Fence & Escaping Traps

Tests whether the parser accurately counts opening/closing backticks and tildes without prematurely terminating a code block.

````markdown
Here is a triple-backtick block inside a quadruple-backtick block:
```python
def fake_end():
    return "```"  # This should NOT close the outer block
```
And a tilde fence just to confuse state machines:
~~~html
<div data-code="```">Still inside!</div>
~~~
````

Indented code block (4 spaces) immediately following a paragraph without a blank line (should remain part of the paragraph per CommonMark):
    not_a_code_block();

    // Separated by a blank line: this SHOULD be an indented code block
    const isCodeBlock = true;

---

## 2. Deeply Nested Containers & Blockquotes

Tests indentation rules (4-space vs. 2-space), lazy continuation lines, and blockquotes containing lists, fenced code, and tables.

> Level 1 Quote
> > Level 2 Quote with a list:
> > 1. First item
> >    > Level 3 Quote inside a list item
> >    > ```js
> >    > // Code inside a blockquote inside a list inside a blockquote
> >    > const x = { nested: true };
> >    > ```
> > 2. Second item with a lazy continuation
> > that wraps onto the next line without blockquote or list markers.
>
> | Header 1 | Header 2 |
> | :--- | ---: |
> | Table inside | a blockquote |

---

## 3. Emphasis & Delimiter Run Ambiguity (CommonMark Flanking Rules)

Tests whether the parser follows strict left/right-flanking delimiter rules rather than greedy regular expressions.

* **Bold inside italic *and back to italic* inside bold** *
* ***Triple asterisks*** vs ___Triple underscores___
* **Bold with _nested italic_ and `inline code with *asterisks*` inside**
* Intraword emphasis: a*b*c (should italicize `b`) vs a_b_c (should NOT italicize `b` in CommonMark)
* Escaped delimiters: \*Escaped asterisks\* and **unclosed bold *with nested italic*
* GFM Strikethrough: ~~Strikethrough with **bold**, *italic*, and [a link](#section-4)~~
* Punctuation flanking: **"Quoted bold"** and *"Quoted italic"* and (**parenthesized bold**)

---

## 4. Pathological Links, Parentheses & Angle Brackets

Tests URL and destination parsing when parentheses, spaces, brackets, or HTML-like characters appear inside link destinations and titles.

* [Link with balanced parens](https://example.org/wiki/Markdown_(markup_language))
* [Link with title containing quotes and parens](https://example.org "Title with \"quotes\" and (parens)")
* [Link with brackets in text [like this]](https://example.org)
* Autolink with query parameters: <https://example.org/autolink?query=1&param=2&flag=true>
* Email autolink: <test.user+tag@example.org>
* [Reference link with weird spacing][ref 1]
* [Collapsed reference link][]
* [Shortcut reference link]

![Broken image with alt text containing **markdown** and `code`](nonexistent-image.png "Image Title")

[ref 1]: <https://example.org/url with spaces> 'Single quoted title'
[Collapsed reference link]: https://example.org/collapsed "Collapsed Title"
[Shortcut reference link]: https://example.org/shortcut

---

## 5. Layout & Overflow Stressors (GFM Tables & Long Tokens)

Tests CSS handling (`overflow-x`, `word-break`, `table-layout`) when content refuses to wrap naturally or contains escaped pipes.

| Column 1 (Normal) | Column 2 (Unbreakable String) | Column 3 (Inline Code & Pipes) | Column 4 (Empty) |
| :--- | :---: | ---: | --- |
| Normal text | `https://example.org/api/v1/users/authenticate?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0` | `a \| b \| c` (escaped pipes) | |
| Multi-line<br>with HTML `<br>` | **SupercalifragilisticexpialidociousPneumonoultramicroscopicsilicovolcanoconiosis** | `<div>Raw HTML tag in code</div>` | Cell 4 |
| *Formatted* cell | `11111111111111111111111111111111111111111111111111111111111111111111111111111111` | `foo\bar\baz` | |

---

## 6. Mixed Raw HTML, XSS Vectors & Entities

Tests HTML block termination rules, inline HTML tags, entity decoding, and sanitizer safety.

<div>
  <p>Raw HTML block. *Markdown here should NOT parse* unless separated by a blank line.</p>

  *Markdown here SHOULD parse* because of the blank line above.
</div>

Inline HTML: <kbd>Ctrl</kbd> + <kbd>C</kbd>, H<sub>2</sub>O, E = mc<sup>2</sup>, <mark>highlighted text</mark>.

<!-- XSS / Sanitization checks -->
* [JavaScript URI link](javascript:alert('XSS'))
* [Data URI link](data:text/html,<script>alert('XSS')</script>)
* Broken image with event handler: <img src="x" onerror="alert('XSS')">
* Script tag injection: <script>console.log("Should be stripped or escaped")</script>

HTML Entities: &copy; &mdash; &#128640; &amp; &lt;not-a-tag&gt; &quot; &#x2764;

---

## 7. Task Lists, Footnotes & Edge-Case Headings

Tests extended syntax (GFM / Pandoc / MultiMarkdown) interactions, setext headings, thematic breaks, and multi-paragraph footnotes.

### ATX Heading with `code`, *emphasis*, [link](#section-4), and trailing hashes ###

Setext Heading Level 1 with **bold**
====================================

Setext Heading Level 2 with *italic*
------------------------------------

Thematic breaks (horizontal rules) variations:

***
---
___
 *  *  *

Task lists with nested items and code blocks:

- [x] Completed task with [a link](#section-4)
- [ ] Incomplete task
  - [x] Nested completed task
  - [ ] Nested task with a footnote[^1] and inline footnote[^note-inline]
    ```bash
    # Code block aligned under a task list item
    echo "hello world"
    ```

[^1]: Footnote content with multiple paragraphs.

    Second paragraph of the footnote (indented 4 spaces).

    ```python
    # Code block inside a footnote
    print("Inside footnote")
    ```

[^note-inline]: Single-line footnote with **bold** and `code`.
