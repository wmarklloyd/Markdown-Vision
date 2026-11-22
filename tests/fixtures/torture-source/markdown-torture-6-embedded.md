# Torture Test 6: Embedded HTML, Footnotes, and Fences

This document combines Markdown extensions and embedded HTML. It distinguishes visible text that can be edited safely from generated content or HTML that may need source editing.

## Disclosure sections

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

## Footnotes and reference reuse

The first note marker[^note] and the repeated note marker[^note] link to the same note. A different marker[^other] links to another note.

[^note]: This footnote has one paragraph.

    A second paragraph includes **bold** and [a link](https://example.invalid/footnote).

[^other]: Another footnote definition.

## Raw HTML and sanitization

<div class="survey-container">

This Markdown paragraph is inside a raw HTML container.

</div>

<pre>
*Literal asterisks stay literal in raw preformatted HTML.*
<b>Markup is interpreted as HTML inside this block.</b>
</pre>

Inline HTML has <kbd>Ctrl</kbd> and <mark>marked text</mark> in a sentence.

## Fenced code

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
