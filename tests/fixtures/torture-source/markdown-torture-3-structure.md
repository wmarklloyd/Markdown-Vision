# Torture Test 3: Containers and Block Boundaries

This document stresses block nesting, interruption, indentation, and source-preserving edits. Edit the marked sentences and check that the surrounding markers remain unchanged.

## Nested lists and paragraphs

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

## Tasks and lazy continuation

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

## Quotations and headings

> The outer quotation has plain text.
>
> > A nested quotation with its own paragraph.
>
> Back in the outer quotation.

Setext heading with **emphasis**
--------------------------------

The following line is a horizontal rule, not a heading underline.

---

## Code and indentation

    First indented code line.
    Second indented code line.

~~~text
The next shorter marker is code.
~~
~~~

The paragraph after the code block remains outside it.
