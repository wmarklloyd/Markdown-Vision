# Torture Test 4: Inline Syntax, References, and Unicode

This document concentrates on inline delimiters, links, source-only reference targets, and Unicode. Edit the visible words without changing destinations or hidden definitions.

## Emphasis and punctuation

Plain before **bold text**, *italic text*, and ***nested emphasis*** after.

An underscore inside `sample_rate_hz` is literal. Escaped \*asterisks\* remain literal. The word pre**center**post has a styled middle.

The phrase *flows across
two source lines* while this line ends with a hard break.  
The next rendered line starts here.

## Reference links

[Editable reference label][shared key] and [another reference label][SHARED KEY] have the same destination. An [unknown reference][missing key] remains literal.

[shared key]: <https://example.invalid/a%20path> "A destination title"

An inline [external link](https://example.invalid/path_(part) "Title with spaces") and an <https://example.invalid/auto> autolink share this paragraph.

## Inline code and entities

Short `code text`, a longer delimiter ``a ` tick``, and literal `&lt;` should remain code. Text entities include &amp;, &lt;, &#65;, and &#x1F680;.

## Unicode and direction

Precomposed café and decomposed café should not silently become the same bytes. العربية and עברית share a paragraph with English. Emoji include 👩‍💻 and 🇺🇸.

Repeated word: lantern. Later in this same paragraph: lantern. Another paragraph repeats lantern below.

The final lantern is here.
