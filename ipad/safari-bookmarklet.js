javascript:(function(){
  /* Canvas AI Helper — Safari Bookmarklet for iPad */
  var SIDEBAR_ID='cah-safari-sidebar';
  if(document.getElementById(SIDEBAR_ID)){document.getElementById(SIDEBAR_ID).remove();return;}

  /* ── Extract assignment text ── */
  function extract(){
    var parts=[];
    var h=document.querySelector('h1.title,#assignment_show h1,.quiz-header h1,h1');
    if(h) parts.push('Assignment: '+h.innerText.trim());
    var bodySelectors=['#assignment_show .description','.assignment-description','.user_content','#content .description','.quiz-description'];
    for(var i=0;i<bodySelectors.length;i++){
      var el=document.querySelector(bodySelectors[i]);
      if(el&&el.innerText.trim().length>20){parts.push(el.innerText.trim());break;}
    }
    var qs=document.querySelectorAll('.question .question_text');
    qs.forEach(function(q,i){parts.push('Q'+(i+1)+': '+q.innerText.trim());});
    return parts.join('\n\n').trim();
  }

  /* ── Build sidebar DOM ── */
  var s=document.createElement('div');
  s.id=SIDEBAR_ID;
  s.style.cssText='position:fixed;top:0;right:0;width:min(400px,92vw);height:100vh;z-index:2147483647;background:#fff;border-left:3px solid #e66000;box-shadow:-4px 0 24px rgba(0,0,0,.18);display:flex;flex-direction:column;font-family:-apple-system,sans-serif;font-size:15px;color:#111;overflow:hidden;';
  s.innerHTML=`
    <div style="background:#e66000;color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
      <span style="font-weight:700;font-size:16px;">AI Assignment Helper</span>
      <button id="cah-x" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0 4px;">✕</button>
    </div>
    <div style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;">
      <div>
        <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#555;margin-bottom:6px;">Question / Text</div>
        <textarea id="cah-q" rows="7" style="width:100%;box-sizing:border-box;border:1px solid #ccc;border-radius:8px;padding:10px;font-size:14px;font-family:inherit;resize:vertical;background:#fafafa;"></textarea>
      </div>
      <div style="display:flex;gap:8px;">
        <button id="cah-ext" style="flex:1;padding:10px;border:none;border-radius:8px;background:#f0f0f0;color:#333;font-weight:600;cursor:pointer;font-size:14px;">Extract</button>
        <button id="cah-ask" style="flex:1;padding:10px;border:none;border-radius:8px;background:#e66000;color:#fff;font-weight:600;cursor:pointer;font-size:14px;">Ask Claude</button>
      </div>
      <div id="cah-st" style="font-size:13px;min-height:16px;"></div>
      <div id="cah-ans-wrap" style="display:none;border-top:1px solid #eee;padding-top:12px;">
        <div style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#555;margin-bottom:6px;">Claude's Answer</div>
        <div id="cah-ans" style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:8px;padding:12px;font-size:14px;line-height:1.65;max-height:420px;overflow-y:auto;white-space:pre-wrap;word-break:break-word;"></div>
      </div>
    </div>`;
  document.body.appendChild(s);

  /* ── Wire up buttons ── */
  document.getElementById('cah-x').onclick=function(){s.remove();};

  document.getElementById('cah-ext').onclick=function(){
    var t=extract();
    document.getElementById('cah-q').value=t||'';
    if(!t) setStatus('Could not auto-extract. Paste text manually.','#b45309');
    else setStatus('');
  };

  document.getElementById('cah-ask').onclick=async function(){
    var question=document.getElementById('cah-q').value.trim();
    if(!question){setStatus('Enter a question first.','#b45309');return;}

    var key=localStorage.getItem('cah_api_key');
    if(!key){
      key=prompt('Enter your Anthropic API key (saved locally for this site):');
      if(!key) return;
      localStorage.setItem('cah_api_key',key);
    }

    setStatus('Asking Claude…','#e66000');
    document.getElementById('cah-ask').disabled=true;

    try{
      var res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1024,messages:[{role:'user',content:'You are a helpful academic assistant. Answer clearly and show your reasoning.\n\n'+question}]})
      });
      var data=await res.json();
      if(!res.ok) throw new Error(data?.error?.message||res.statusText);
      var answer=data.content?.[0]?.text||'No response.';
      document.getElementById('cah-ans').innerHTML=answer.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      document.getElementById('cah-ans-wrap').style.display='block';
      setStatus('');
    }catch(e){
      setStatus('Error: '+e.message,'#c0392b');
    }finally{
      document.getElementById('cah-ask').disabled=false;
    }
  };

  function setStatus(msg,color){
    var el=document.getElementById('cah-st');
    el.textContent=msg;
    el.style.color=color||'';
  }

  /* Auto-extract on open */
  var t=extract();
  if(t) document.getElementById('cah-q').value=t;
})();
