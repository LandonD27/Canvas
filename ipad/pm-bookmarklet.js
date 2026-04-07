javascript:(function(){
  /* Performance Matters AI Helper — Safari Bookmarklet */
  /* Works on unify.performancematters.com             */
  var PANEL_ID='pm-ai-panel';
  if(document.getElementById(PANEL_ID)){document.getElementById(PANEL_ID).remove();return;}

  /* ── Page Scanner ── */
  function scanPage(){
    var blocks=[];

    /* 1. Grab page title / test title */
    var title=document.querySelector(
      '.test-title,.quiz-title,.assessment-title,[class*="testTitle"],[class*="quizTitle"],h1,h2'
    );
    if(title&&title.innerText.trim())
      blocks.push('=== TEST: '+title.innerText.trim()+' ===\n');

    /* 2. Try known PM selectors first */
    var qContainers=document.querySelectorAll(
      '[class*="question"],[class*="Question"],[data-question],[data-testid*="question"],.item,.passage-item'
    );

    if(qContainers.length>0){
      qContainers.forEach(function(el,i){
        var txt=el.innerText.trim();
        if(txt.length<5) return;
        /* skip if this is a child of another question container we already got */
        var parent=el.parentElement;
        var skip=false;
        while(parent&&parent!==document.body){
          if(parent.matches('[class*="question"],[class*="Question"],[data-question],.item')){skip=true;break;}
          parent=parent.parentElement;
        }
        if(!skip) blocks.push(txt);
      });
    }

    /* 3. Fallback: scan all form elements (radio/checkbox groups with labels) */
    if(blocks.length<=1){
      var inputs=document.querySelectorAll('input[type="radio"],input[type="checkbox"]');
      var groups={};
      inputs.forEach(function(inp){
        var name=inp.name||inp.getAttribute('data-name')||'group';
        if(!groups[name]) groups[name]=[];
        var label=inp.labels&&inp.labels[0]?inp.labels[0]:inp.closest('label');
        if(!label){
          /* look for sibling/parent label text */
          var p=inp.parentElement;
          if(p) label=p;
        }
        var txt=label?label.innerText.trim():'(option)';
        groups[name].push(txt);
      });
      Object.keys(groups).forEach(function(g){
        blocks.push('Choices:\n'+groups[g].map(function(t,i){return '  '+(i+1)+'. '+t;}).join('\n'));
      });
    }

    /* 4. Always append full visible body text as context (truncated) */
    var bodyText='';
    var mainEl=document.querySelector('main,[role="main"],#content,.content-area,.test-body,.assessment-body')||document.body;
    bodyText=mainEl.innerText.replace(/\s{3,}/g,'\n\n').trim();
    if(bodyText.length>6000) bodyText=bodyText.slice(0,6000)+'...[truncated]';

    /* If structured parsing got little content, rely on full body */
    if(blocks.length<=1){
      blocks.push(bodyText);
    } else {
      /* Append body as additional context */
      blocks.push('\n--- FULL PAGE TEXT (for context) ---\n'+bodyText);
    }

    return blocks.join('\n\n').trim();
  }

  /* ── Build overlay panel ── */
  var panel=document.createElement('div');
  panel.id=PANEL_ID;
  panel.style.cssText=[
    'position:fixed','top:0','right:0',
    'width:min(420px,95vw)','height:100vh','z-index:2147483647',
    'background:#ffffff','border-left:3px solid #0057a8',
    'box-shadow:-6px 0 32px rgba(0,0,0,.22)',
    'display:flex','flex-direction:column',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    'font-size:15px','color:#111','overflow:hidden'
  ].join(';');

  panel.innerHTML=
    '<div style="background:#0057a8;color:#fff;padding:13px 16px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">'+
      '<span style="font-weight:700;font-size:16px;">PM AI Scanner</span>'+
      '<div style="display:flex;gap:8px;align-items:center;">'+
        '<button id="pm-clear-key" title="Clear saved API key" style="background:rgba(255,255,255,.18);border:none;color:#fff;font-size:11px;padding:4px 8px;border-radius:5px;cursor:pointer;">Clear Key</button>'+
        '<button id="pm-x" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0 4px;">&#x2715;</button>'+
      '</div>'+
    '</div>'+
    '<div style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;">'+
      '<div>'+
        '<div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#555;margin-bottom:5px;">Scanned Content</div>'+
        '<textarea id="pm-content" rows="8" style="width:100%;box-sizing:border-box;border:1px solid #ccc;border-radius:8px;padding:10px;font-size:13px;font-family:inherit;resize:vertical;background:#f9f9f9;line-height:1.5;"></textarea>'+
      '</div>'+
      '<div>'+
        '<div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#555;margin-bottom:5px;">Your Question <span style="font-weight:400;text-transform:none;">(optional — add context)</span></div>'+
        '<textarea id="pm-extra" rows="2" placeholder="e.g. What is the answer to question 3?" style="width:100%;box-sizing:border-box;border:1px solid #ccc;border-radius:8px;padding:10px;font-size:13px;font-family:inherit;resize:vertical;background:#f9f9f9;"></textarea>'+
      '</div>'+
      '<div style="display:flex;gap:8px;">'+
        '<button id="pm-scan" style="flex:1;padding:11px;border:none;border-radius:8px;background:#e8eef5;color:#0057a8;font-weight:700;cursor:pointer;font-size:14px;">Re-scan Page</button>'+
        '<button id="pm-ask" style="flex:1;padding:11px;border:none;border-radius:8px;background:#0057a8;color:#fff;font-weight:700;cursor:pointer;font-size:14px;">Ask Claude</button>'+
      '</div>'+
      '<div id="pm-status" style="font-size:13px;min-height:16px;"></div>'+
      '<div id="pm-ans-wrap" style="display:none;border-top:1px solid #e4e4e4;padding-top:14px;">'+
        '<div style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#555;margin-bottom:6px;">Claude\'s Answer</div>'+
        '<div id="pm-ans" style="background:#f0f5ff;border:1px solid #c5d8f5;border-radius:8px;padding:14px;font-size:14px;line-height:1.7;max-height:450px;overflow-y:auto;white-space:pre-wrap;word-break:break-word;"></div>'+
        '<button id="pm-copy" style="margin-top:8px;padding:8px 14px;border:1px solid #0057a8;border-radius:7px;background:#fff;color:#0057a8;font-size:13px;font-weight:600;cursor:pointer;">Copy Answer</button>'+
      '</div>'+
    '</div>';

  document.body.appendChild(panel);

  /* ── Wire up ── */
  document.getElementById('pm-x').onclick=function(){panel.remove();};

  document.getElementById('pm-clear-key').onclick=function(){
    localStorage.removeItem('pm_cah_key');
    setStatus('API key cleared.','#0057a8');
  };

  document.getElementById('pm-scan').onclick=function(){
    var t=scanPage();
    document.getElementById('pm-content').value=t;
    setStatus(t?'Page scanned — '+t.length+' chars captured.':'Nothing found — page may use iframes.',t?'#2a7a2a':'#b45309');
  };

  document.getElementById('pm-copy').onclick=function(){
    var txt=document.getElementById('pm-ans').innerText;
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(function(){setStatus('Copied!','#2a7a2a');});
    } else {
      /* Safari fallback */
      var ta=document.createElement('textarea');
      ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();
      document.execCommand('copy');ta.remove();
      setStatus('Copied!','#2a7a2a');
    }
  };

  document.getElementById('pm-ask').onclick=async function(){
    var content=document.getElementById('pm-content').value.trim();
    var extra=document.getElementById('pm-extra').value.trim();

    if(!content&&!extra){
      setStatus('Click Re-scan first, or type a question.','#b45309');
      return;
    }

    var key=localStorage.getItem('pm_cah_key');
    if(!key){
      key=prompt('Enter your Anthropic API key (stored locally in this browser):');
      if(!key) return;
      localStorage.setItem('pm_cah_key',key);
    }

    setStatus('Asking Claude\u2026','#0057a8');
    document.getElementById('pm-ask').disabled=true;

    var systemPrompt=
      'You are an expert academic tutor. The user has shared content from a Performance Matters (unify.performancematters.com) test or assessment page.\n'+
      'Your job:\n'+
      '1. Identify every question on the page.\n'+
      '2. For each question, state the correct answer and briefly explain your reasoning.\n'+
      '3. If answer choices are shown, clearly identify which choice letter/number is correct.\n'+
      '4. Be concise but accurate. Format your response clearly with Q1, Q2, etc. headings.\n'+
      '5. If the content is reading passage or reference material, summarize the key facts that would be tested.';

    var userMsg='';
    if(content) userMsg+='=== PAGE CONTENT ===\n'+content;
    if(extra) userMsg+='\n\n=== MY QUESTION ===\n'+extra;
    if(!userMsg) userMsg='Please analyze this test page and provide answers.';

    try{
      var res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{
          'x-api-key':key,
          'anthropic-version':'2023-06-01',
          'content-type':'application/json'
        },
        body:JSON.stringify({
          model:'claude-sonnet-4-6',
          max_tokens:2048,
          system:systemPrompt,
          messages:[{role:'user',content:userMsg}]
        })
      });
      var data=await res.json();
      if(!res.ok) throw new Error((data&&data.error&&data.error.message)||res.statusText);
      var answer=(data.content&&data.content[0]&&data.content[0].text)||'No response.';
      document.getElementById('pm-ans').innerHTML=
        answer
          .replace(/&/g,'&amp;')
          .replace(/</g,'&lt;')
          .replace(/>/g,'&gt;')
          .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
          .replace(/\n/g,'<br>');
      document.getElementById('pm-ans-wrap').style.display='block';
      setStatus('');
    }catch(e){
      if(e.message&&e.message.toLowerCase().includes('401')){
        localStorage.removeItem('pm_cah_key');
        setStatus('Invalid API key — cleared. Try again.','#c0392b');
      } else {
        setStatus('Error: '+e.message,'#c0392b');
      }
    }finally{
      document.getElementById('pm-ask').disabled=false;
    }
  };

  function setStatus(msg,color){
    var el=document.getElementById('pm-status');
    el.textContent=msg;
    el.style.color=color||'';
  }

  /* Auto-scan on open */
  var initial=scanPage();
  document.getElementById('pm-content').value=initial;
  if(initial) setStatus('Page scanned — click Ask Claude to get answers.','#2a7a2a');
  else setStatus('Could not auto-scan. Page may use iframes — try Re-scan or paste content.','#b45309');

})();
