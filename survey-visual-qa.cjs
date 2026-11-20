const assert = require('node:assert/strict');
const fs = require('node:fs');
const delay = require('node:timers/promises').setTimeout;
async function main() {
  let target; for(let i=0;i<100&&!target;i++){try{target=(await(await fetch('http://127.0.0.1:'+process.argv[2]+'/json/list')).json()).find(x=>x.url.includes('index.html'))}catch{}if(!target)await delay(150)}
  assert.ok(target); const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r));let id=0;
  const req=(method,params)=>new Promise((resolve,reject)=>{const n=++id;const receive=({data})=>{const x=JSON.parse(data);if(x.id!==n)return;socket.removeEventListener('message',receive);if(x.error||x.result.exceptionDetails)reject(Error(JSON.stringify(x.error||x.result.exceptionDetails)));else resolve(x.result)};socket.addEventListener('message',receive);socket.send(JSON.stringify({id:n,method,params}))});
  const ev=async expression=>(await req('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  try {
    for(let i=0;i<100&&!await ev('window.markdownVisionReader');i++)await delay(100);
    await ev('document.querySelector("#editorToggle").click()');
    const fixtures=[
      {file:'markdown-torture-3-structure.md',checks:'document.querySelectorAll("#editorPreview input[type=checkbox]").length===4 && document.querySelectorAll("#editorPreview blockquote").length>=3',from:'This continuation keeps its four spaces.',to:'This continuation was edited safely.',old:'    This continuation keeps its four spaces.',replacement:'    This continuation was edited safely.'},
      {file:'markdown-torture-4-inline.md',checks:'document.querySelectorAll("#editorPreview a").length>=4 && document.querySelector("#editorPreview").textContent.includes("👩‍💻")',from:'Editable reference label',to:'Updated reference label',old:'[Editable reference label][shared key]',replacement:'[Updated reference label][shared key]'},
      {file:'markdown-torture-5-tables.md',checks:'document.querySelectorAll("#editorPreview table").length===4 && document.querySelector("#editorPreview table tbody tr td").textContent==="alpha"',from:'alpha',to:'changed alpha',old:'| alpha | beta | 123 |',replacement:'| changed alpha | beta | 123 |'},
      {file:'markdown-torture-6-embedded.md',checks:'document.querySelectorAll("#editorPreview details").length===2 && document.querySelectorAll("#editorPreview .footnote-ref").length===3 && document.querySelectorAll("#editorPreview .visual-code-editor").length===3',from:'Open disclosure title',to:'Updated disclosure title',old:'<summary>Open disclosure title</summary>',replacement:'<summary>Updated disclosure title</summary>'}
    ];
    for(const fixture of fixtures){
      const text=fs.readFileSync(fixture.file,'utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
      await ev('window.markdownVisionReader.showDocument('+JSON.stringify(text)+','+JSON.stringify(fixture.file)+')');
      assert.equal(await ev('document.querySelector("#markdownSource").value'),text,fixture.file+' load preserves source');
      assert.ok(await ev(fixture.checks),fixture.file+' render checks');
      const inventory=await ev('(()=>{const p=[...document.querySelectorAll("#editorPreview > .visual-protected-block:not([hidden])")];return {protected:p.length,partiallyEditable:p.filter(x=>x.querySelector("[contenteditable=plaintext-only],.visual-code-editor,[data-direct-table-cell]")).length,withoutDirect:p.filter(x=>!x.querySelector("[contenteditable=plaintext-only],.visual-code-editor,[data-direct-table-cell]")).map(x=>x.textContent.trim().slice(0,80))}})()');
      console.log('INVENTORY',fixture.file,JSON.stringify(inventory));
      await ev('('+ (from=>{const f=[...document.querySelectorAll('#editorPreview [contenteditable="plaintext-only"]')].find(x=>x.textContent===from);if(!f)throw Error('No direct field: '+from);f.focus();const r=document.createRange();r.selectNodeContents(f);getSelection().removeAllRanges();getSelection().addRange(r)}).toString()+')('+JSON.stringify(fixture.from)+')');
      await req('Input.insertText',{text:fixture.to});
      let expected=text.replace(fixture.old,fixture.replacement);assert.notEqual(expected,text);
      assert.equal(await ev('document.querySelector("#markdownSource").value'),expected,fixture.file+' exact source after edit');
      await ev('document.querySelector("[data-command=undo]").click()');assert.equal(await ev('document.querySelector("#markdownSource").value'),text,fixture.file+' undo');
      await ev('document.querySelector("[data-command=redo]").click()');assert.equal(await ev('document.querySelector("#markdownSource").value'),expected,fixture.file+' redo');
      await ev('document.querySelector(".editor-views [data-view=source]").click();document.querySelector(".editor-views [data-view=visual]").click()');
      assert.equal(await ev('document.querySelector("#markdownSource").value'),expected,fixture.file+' view switching');
      const second = {
        'markdown-torture-3-structure.md': {from:'Quoted sentence inside the parent item.',to:'Edited nested quotation.',old:'> Quoted sentence inside the parent item.',replacement:'> Edited nested quotation.'},
        'markdown-torture-4-inline.md': {from:'another reference label',to:'second revised label',old:'[another reference label][SHARED KEY]',replacement:'[second revised label][SHARED KEY]'},
        'markdown-torture-5-tables.md': {from:'escaped | pipe',to:'edited | value',old:'escaped \\| pipe',replacement:'edited \\| value'}
      }[fixture.file];
      if (second) {
        await ev('('+ (from=>{const f=[...document.querySelectorAll('#editorPreview [contenteditable="plaintext-only"]')].find(x=>x.textContent===from);if(!f)throw Error('No direct field: '+from);f.focus();const r=document.createRange();r.selectNodeContents(f);getSelection().removeAllRanges();getSelection().addRange(r)}).toString()+')('+JSON.stringify(second.from)+')');
        await req('Input.insertText',{text:second.to});expected=expected.replace(second.old,second.replacement);
        assert.equal(await ev('document.querySelector("#markdownSource").value'),expected,fixture.file+' second edit');
      }
      if (fixture.file==='markdown-torture-5-tables.md') {
        await ev(`(() => {
          const cell = [...document.querySelectorAll('#editorPreview [data-direct-table-cell]')].find(node => node.textContent === '🚀');
          if (!cell) throw Error('Encoded emoji cell must be directly editable');
          cell.focus();
          getSelection().selectAllChildren(cell);
        })()`);
        await req('Input.insertText',{text:'🚁'});
        expected=expected.replace('&#x1F680;','🚁');
        assert.equal(await ev('document.querySelector("#markdownSource").value'),expected,'Replacing an entity preserves neighboring source');
      }
      if (fixture.file==='markdown-torture-6-embedded.md') {
        assert.equal(await ev(`[...document.querySelectorAll('#editorPreview details [data-editable-list-link]')].some(node => node.textContent === 'mirage')`),false,'Do not map decoded visible text to a link destination');
        await ev(`(() => {
          const field = document.querySelector('#editorPreview pre b [contenteditable="plaintext-only"]');
          if (!field) throw Error('Raw preformatted text must be directly editable');
          field.focus();
          getSelection().selectAllChildren(field);
        })()`);
        await req('Input.insertText',{text:'Updated <literal> & formatted text.'});
        expected=expected.replace('<b>Markup is interpreted as HTML inside this block.</b>','<b>Updated &lt;literal&gt; &amp; formatted text.</b>');
        assert.equal(await ev('document.querySelector("#markdownSource").value'),expected,'Raw preformatted edit retains HTML tags');
        const old='This Markdown paragraph is inside a raw HTML container.';
        const replacement='This Markdown paragraph can be edited directly.';
        await ev('('+ (from=>{const f=[...document.querySelectorAll('#editorPreview [contenteditable="plaintext-only"]')].find(x=>x.textContent===from);if(!f)throw Error('No direct field: '+from);f.focus();const r=document.createRange();r.selectNodeContents(f);getSelection().removeAllRanges();getSelection().addRange(r)}).toString()+')('+JSON.stringify(old)+')');
        await req('Input.insertText',{text:replacement});expected=expected.replace(old,replacement);
        assert.equal(await ev('document.querySelector("#markdownSource").value'),expected,'Markdown inside HTML preserves its container');
        console.log('PASS Markdown paragraph inside HTML container');
      }
      console.log('PASS',fixture.file,'render, direct edit, exact source, undo, redo, view switching');
    }
  } finally {socket.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1});
