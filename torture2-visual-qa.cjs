const assert = require('node:assert/strict');
const delay = require('node:timers/promises').setTimeout;
async function main() {
  let target;
  for (let i=0;i<100&&!target;i++) { try { target=(await(await fetch('http://127.0.0.1:'+process.argv[2]+'/json/list')).json()).find(x=>x.url.includes('index.html')); } catch {} if(!target) await delay(150); }
  assert.ok(target);
  const socket=new WebSocket(target.webSocketDebuggerUrl); await new Promise(r=>socket.addEventListener('open',r)); let id=0;
  const req=(method,params)=>new Promise((resolve,reject)=>{const n=++id;const listener=({data})=>{const x=JSON.parse(data);if(x.id!==n)return;socket.removeEventListener('message',listener);if(x.error||x.result.exceptionDetails)reject(new Error(JSON.stringify(x.error||x.result.exceptionDetails)));else resolve(x.result)};socket.addEventListener('message',listener);socket.send(JSON.stringify({id:n,method,params}))});
  const ev=async expression=>(await req('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  try {
    for(let i=0;i<100&&!await ev('window.markdownVisionReader?.getDocument()');i++)await delay(100);
    const original=await ev('window.markdownVisionReader.getDocument().content.replace(/\\r\\n?/g,"\\n")');
    await ev('document.querySelector("#editorToggle").click()');
    console.log('Initial source identical:',await ev('document.querySelector("#markdownSource").value')===original);
    const fields=await ev('[...document.querySelectorAll("#editorPreview [data-editable-list-link]")].map(x=>x.textContent)');
    for(const text of ['Case-insensitive reference','first definition wins','The quoted definition','The first citation','Quoted text inside this item.','The second quoted paragraph.','Open mixed container','bold text','Closed mixed container','hidden until opened']) assert.ok(fields.includes(text),'Missing editable '+text);
    const select=async text=>ev('('+ (text=>{const f=[...document.querySelectorAll('#editorPreview [data-editable-list-link]')].find(x=>x.textContent===text);if(!f)throw Error('Missing '+text);f.focus();const r=document.createRange();r.selectNodeContents(f);getSelection().removeAllRanges();getSelection().addRange(r)}).toString()+')('+JSON.stringify(text)+')');
    const edit=async (from,to)=>{await select(from);await req('Input.insertText',{text:to})};
    const markdown=()=>ev('document.querySelector("#markdownSource").value');
    let expected=original;
    await edit('Case-insensitive reference','Edited reference'); expected=expected.replace('[Case-insensitive reference][RELAY KEY]','[Edited reference][RELAY KEY]');assert.equal(await markdown(),expected);
    await edit('The first citation','The initial citation'); expected=expected.replace('The first citation[^repeat]','The initial citation[^repeat]');assert.equal(await markdown(),expected);
    await edit('Quoted text inside this item.','Updated quoted paragraph.');expected=expected.replace('> Quoted text inside this item.','> Updated quoted paragraph.');assert.equal(await markdown(),expected);
    await edit('Open mixed container','Title <new> & safe');expected=expected.replace('<summary>Open mixed container</summary>','<summary>Title &lt;new&gt; &amp; safe</summary>');assert.equal(await markdown(),expected);
    await edit('bold text','stronger text');expected=expected.replace('**bold text**','**stronger text**');assert.equal(await markdown(),expected);
    await ev('document.querySelector("[data-command=undo]").click()');assert.equal(await markdown(),expected.replace('**stronger text**','**bold text**'));
    await ev('document.querySelector("[data-command=redo]").click()');assert.equal(await markdown(),expected);
    await ev('document.querySelector(".editor-views [data-view=source]").click();document.querySelector(".editor-views [data-view=visual]").click()');
    assert.equal(await ev('document.querySelector("#editorPreview details summary").textContent'),'Title <new> & safe');
    assert.equal(await markdown(),expected);
    console.log('PASS reference labels, citations, nested quotes, HTML details, escaping, undo, redo, and view switching');
  } finally {socket.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
