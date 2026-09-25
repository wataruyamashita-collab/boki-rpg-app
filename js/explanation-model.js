(function(root,factory){
  'use strict';
  let feedback=root.WrongAnswerFeedback;
  if(typeof module==='object'&&module.exports){try{feedback=require('./feedback');}catch(_){}}
  const api=factory(feedback);
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.ExplanationModel=api;
})(typeof window!=='undefined'?window:globalThis,function(Feedback){
  'use strict';
  const SCHEMA_VERSION=1;
  const REQUIRED_SECTIONS=Object.freeze(['sources','summary','calculation','transfer','checks','mistakes']);
  const labels={date:'日付',description:'摘要',transaction:'取引内容',account:'勘定科目',item:'項目',quantity:'数量',unitPrice:'単価',amount:'金額',debit:'借方',credit:'貸方',balance:'残高',asset:'固定資産',acquisitionDate:'取得日',acquisitionCost:'取得原価',life:'耐用年数',months:'使用月数',openingAccumulated:'期首減価償却累計額',currentDepreciation:'当期減価償却費',closingAccumulated:'期末減価償却累計額',closingBookValue:'期末帳簿価額'};
  const obj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const arr=v=>Array.isArray(v)?v:(v==null?[]:[v]);
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const num=v=>typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('ja-JP'):String(v??'');
  const shown=v=>v!=null&&v!==''&&v!=='入力'&&v!=='—';
  const rowName=(q,r,i)=>String(['date','asset','account','item','description'].map(k=>r?.[k]).find(shown)||`${q.category||'表'} ${i+1}行目`);
  function locations(q){const m=new Map();let n=0;if(!q?.table?.rows||!Array.isArray(q.table.inputCells))return m;q.table.rows.forEach((r,ri)=>Object.entries(r).forEach(([c,v])=>{if(v==='入力'){const id=q.table.inputCells[n++];if(id)m.set(id,{ri,c,r});}}));return m;}
  const cellLabel=(q,id,p)=>q?.table?.inputMetadata?.[id]?.label||(!p?id:`${rowName(q,p.r,p.ri)}／${labels[p.c]||p.c}`);
  function sourceValues(m){if(!obj(m))return[{label:'内容',value:String(m??'')}];return Object.entries(m).filter(([k,v])=>!['資料','title','name','type','document'].includes(k)&&shown(v)).map(([k,v])=>({label:labels[k]||String(k),value:num(v)}));}
  const tableColumnLabel=k=>k==='unitPrice'?'単価（円）':k==='amount'?'金額（円）':labels[k]||String(k);
  function sourceTable(q){const columns=arr(q.table?.columns),rows=arr(q.table?.rows);if(!columns.length||!rows.length||!columns.every(key=>rows.some(row=>obj(row)&&Object.prototype.hasOwnProperty.call(row,key))))return null;return{columns:columns.map(key=>({key:String(key),label:tableColumnLabel(key)})),rows:rows.map(row=>columns.map(key=>({key:String(key),value:obj(row)?row[key]:null})))};}
  const tableFocus=q=>{const format=q.format||'',category=String(q.category||'');if(format==='bookkeeping-inventory-ledger'||/商品有高帳/u.test(category))return '日付ごとに「数量 → 単価 → 金額」の順で横に確認します。';if(format==='fixed-asset-ledger'||/固定資産台帳/u.test(category))return '取得原価・耐用年数など、計算に使う条件を横に確認します。';return '表に書かれている内容と、空欄の位置を確認します。';};
  const materialFocus=q=>{const format=q.format||'',category=String(q.category||'');if(format==='bookkeeping-voucher-entry')return '取引内容と金額を確認する';if(format==='bookkeeping-notes-receivable'||format==='bookkeeping-notes-payable')return '日付・相手先・金額を確認する';if(format==='fixed-asset-ledger'||/固定資産台帳/u.test(category))return '取得原価・耐用年数など、計算に使う条件を確認する';return '資料に書かれている内容を確認する';};
  function sources(q){const ms=arr(q.materials).filter(v=>v!=null);if(ms.length)return ms.map((m,i)=>({kind:'material',title:String(m?.['資料']||m?.title||m?.name||m?.type||m?.document||`資料${i+1}`),focus:materialFocus(q),values:sourceValues(m),evidenceRef:`materials[${i}]`}));if(q.table?.rows?.length)return[{kind:'table',title:q.category||'問題の表',focus:tableFocus(q),values:q.table.rows.map((r,i)=>({label:rowName(q,r,i),value:Object.entries(r).filter(([,v])=>shown(v)).map(([k,v])=>`${labels[k]||k}:${num(v)}`).join(' / ')})),table:sourceTable(q),evidenceRef:'table.rows'}];return[{kind:'prompt',title:'問題文',focus:'問題文の条件と、何を求める問題かを確認する',values:[{label:'問題',value:String(q.question||'')}],evidenceRef:'question'}];}
  function valueAt(q,cells,locs,ri,c){const raw=q.table.rows[ri]?.[c];if(typeof raw==='number'&&Number.isFinite(raw))return raw;if(raw!=='入力')return null;for(const[id,p]of locs)if(p.ri===ri&&p.c===c){const v=cells[id];return typeof v==='number'&&Number.isFinite(v)?v:null;}return null;}
  const calcItem=(label,expression,result,evidenceRefs=['answer'])=>({label,expression,result,operands:[],evidenceRefs});
  const comma=v=>Number(v).toLocaleString('ja-JP');
  function chapter8Calculations(q){
    if(q?.chapter!==8||q?.type!=='ledger')return null;
    const cells=q.answer?.cells||{},format=q.format||'',category=String(q.category||''),materials=arr(q.materials),rows=q.table?.rows||[];
    if(format==='journal-book')return [];
    if(format==='fixed-asset-ledger'||/固定資産台帳/u.test(category)){
      const out=[];
      if(cells.annualDepreciation!=null){
        const row=rows[0]||{},cost=Number(row.acquisitionCost),life=Number(row.life),months=Number(cells.months);
        if(Number.isFinite(cost)&&Number.isFinite(life))out.push(calcItem('1年分の減価償却費',`${comma(cost)} ÷ ${life} = ${comma(cells.annualDepreciation)}`,cells.annualDepreciation,['table.rows[0]','answer.cells.annualDepreciation']));
        if(Number.isFinite(months))out.push(calcItem('当期減価償却費',`${comma(cells.annualDepreciation)} × ${months} ÷ 12 = ${comma(cells.currentDepreciation)}`,cells.currentDepreciation,['answer.cells.annualDepreciation','answer.cells.months','answer.cells.currentDepreciation']));
        if(cells.closingBookValue!=null)out.push(calcItem('期末帳簿価額',`${comma(cost)} − ${comma(cells.closingAccumulated)} = ${comma(cells.closingBookValue)}`,cells.closingBookValue,['table.rows[0]','answer.cells.closingAccumulated','answer.cells.closingBookValue']));
        return out;
      }
      if(cells.acquisitionCost!=null&&cells.currentDepreciation!=null){
        const life=Number(String(materials.find(m=>m?.['耐用年数'])?.['耐用年数']||'').replace(/[^0-9.]/g,'')),cost=Number(cells.acquisitionCost),months=Number(cells.months),annual=life?cost/life:null;
        if(Number.isFinite(annual))out.push(calcItem('1年分の減価償却費',`${comma(cost)} ÷ ${life} = ${comma(annual)}`,annual,['materials','answer.cells.acquisitionCost']));
        if(Number.isFinite(annual)&&Number.isFinite(months))out.push(calcItem('当期減価償却費',`${comma(annual)} × ${months} ÷ 12 = ${comma(cells.currentDepreciation)}`,cells.currentDepreciation,['answer.cells.months','answer.cells.currentDepreciation']));
        if(cells.closingBookValue!=null)out.push(calcItem('期末帳簿価額',`${comma(cost)} − ${comma(cells.closingAccumulated)} = ${comma(cells.closingBookValue)}`,cells.closingBookValue,['answer.cells.closingAccumulated','answer.cells.closingBookValue']));
        return out;
      }
      if(cells.annualA!=null&&cells.annualB!=null){
        const a=materials.find(m=>m?.['固定資産']==='備品A')||{},b=materials.find(m=>m?.['固定資産']==='備品B')||{},life=Number((/耐用年数\s*(\d+)年/u.exec(q.question||'')||[])[1]||5);
        out.push(calcItem('備品A 1年分の減価償却費',`${comma(a['取得原価'])} ÷ ${life} = ${comma(cells.annualA)}`,cells.annualA,['materials','answer.cells.annualA']));
        out.push(calcItem('備品A 当期減価償却費',`${comma(cells.annualA)} × ${cells.monthsA} ÷ 12 = ${comma(cells.depreciationA)}`,cells.depreciationA,['answer.cells.monthsA','answer.cells.depreciationA']));
        out.push(calcItem('備品A 売却時帳簿価額',`${comma(a['取得原価'])} − ${comma(cells.depreciationA)} = ${comma(cells.bookA)}`,cells.bookA,['materials','answer.cells.bookA']));
        out.push(calcItem('備品A 固定資産売却損',`${comma(cells.bookA)} − ${comma(a['売却価額'])} = ${comma(cells.lossA)}`,cells.lossA,['materials','answer.cells.lossA']));
        out.push(calcItem('備品B 1年分の減価償却費',`${comma(b['取得原価'])} ÷ ${life} = ${comma(cells.annualB)}`,cells.annualB,['materials','answer.cells.annualB']));
        out.push(calcItem('備品B 当期減価償却費',`${comma(cells.annualB)} × ${cells.monthsB} ÷ 12 = ${comma(cells.depreciationB)}`,cells.depreciationB,['answer.cells.monthsB','answer.cells.depreciationB']));
        out.push(calcItem('備品B 期末帳簿価額',`${comma(b['取得原価'])} − ${comma(cells.depreciationB)} = ${comma(cells.bookB)}`,cells.bookB,['materials','answer.cells.bookB']));
        return out;
      }
    }
    if(format==='bookkeeping-notes-receivable'||format==='bookkeeping-notes-payable'){
      const relevant=materials.filter(m=>!m?.['種類']||(format==='bookkeeping-notes-receivable'?String(m['種類']).includes('約束手形受取'):String(m['種類']).includes('約束手形振出')));
      const amounts=relevant.map(m=>Number(m?.['金額'])).filter(Number.isFinite),total=Number(cells.total);
      return amounts.length>1&&Number.isFinite(total)?[calcItem('手形金額合計',`${amounts.map(comma).join(' + ')} = ${comma(total)}`,total,['materials','answer.cells.total'])]:[];
    }
    if(format==='bookkeeping-cash-book'||format==='bookkeeping-checking-book'){
      const a=Number(cells.value1),b=Number(cells.value2),balance=Number(cells.value3);
      return [calcItem('残高',`${comma(a)} − ${comma(b)} = ${comma(balance)}`,balance,['answer.cells.value1','answer.cells.value2','answer.cells.value3'])];
    }
    if(format==='bookkeeping-petty-cash-book'){
      const a=Number(cells.value1),b=Number(cells.value2),total=Number(cells.value3);
      return [calcItem('補給額',`${comma(a)} + ${comma(b)} = ${comma(total)}`,total,['answer.cells.value1','answer.cells.value2','answer.cells.value3'])];
    }
    if(format==='bookkeeping-purchase-book'||format==='bookkeeping-sales-book'){
      const gross=Number(cells.value1),returns=Number(cells.value2),net=Number(cells.value3);
      return [calcItem(format==='bookkeeping-purchase-book'?'純仕入高':'純売上高',`${comma(gross)} − ${comma(returns)} = ${comma(net)}`,net,['answer.cells.value1','answer.cells.value2','answer.cells.value3'])];
    }
    if(format==='bookkeeping-inventory-ledger'){
      const match=/期首(\d+)個@([\d,]+)円、仕入(\d+)個@([\d,]+)円.*?(\d+)個を払い出/u.exec(q.question||'');
      if(match){
        const q1=Number(match[1]),p1=Number(match[2].replaceAll(',','')),q2=Number(match[3]),p2=Number(match[4].replaceAll(',','')),issued=Number(match[5]),avg=Number(cells.value1),issue=Number(cells.value2),remain=Number(cells.value3);
        return [
          calcItem('移動平均単価',`(${q1} × ${comma(p1)} + ${q2} × ${comma(p2)}) ÷ (${q1} + ${q2}) = ${comma(avg)}`,avg,['question','answer.cells.value1']),
          calcItem('払出額',`${issued} × ${comma(avg)} = ${comma(issue)}`,issue,['question','answer.cells.value2']),
          calcItem('残高額',`(${q1+q2} − ${issued}) × ${comma(avg)} = ${comma(remain)}`,remain,['question','answer.cells.value3'])
        ];
      }
    }
    if(format==='bookkeeping-voucher-entry')return [];
    if(format==='bookkeeping-general-ledger'){
      const openingMatch=/期首(?:貸方)?残高([\d,]+)円/u.exec(q.question||''),opening=openingMatch?Number(openingMatch[1].replaceAll(',','')):null,balance=Number(cells.balance);
      if(Number.isFinite(opening)&&Number.isFinite(balance)){
        const increases=materials.map(m=>Number(m?.['増加'])).filter(Number.isFinite),decreases=materials.map(m=>Number(m?.['減少'])).filter(Number.isFinite);
        if(increases.length||decreases.length)return [calcItem('期末残高',`${[comma(opening),...increases.map(v=>'+ '+comma(v)),...decreases.map(v=>'− '+comma(v))].join(' ')} = ${comma(balance)}`,balance,['question','materials','answer.cells.balance'])];
        const debits=materials.map(m=>Number(m?.['借方'])).filter(Number.isFinite),credits=materials.map(m=>Number(m?.['貸方'])).filter(Number.isFinite);
        return [calcItem('期末残高',`${[comma(opening),...debits.map(v=>'+ '+comma(v)),...credits.map(v=>'− '+comma(v))].join(' ')} = ${comma(balance)}`,balance,['question','materials','answer.cells.balance'])];
      }
    }
    if(format==='bookkeeping-account-ledger'&&/支払利息/u.test(category)){
      const m=/借入金([\d,]+)円（年利率(\d+(?:\.\d+)?)%/u.exec(q.question||'');
      if(m){const principal=Number(m[1].replaceAll(',','')),rate=Number(m[2]),annual=Number(cells.annualPayment),half=Number(cells.currentAccrual);return[
        calcItem('1年分の支払利息',`${comma(principal)} × ${rate}% = ${comma(annual)}`,annual,['question','answer.cells.annualPayment']),
        calcItem('6か月分の未払利息',`${comma(annual)} × 6 ÷ 12 = ${comma(half)}`,half,['question','answer.cells.currentAccrual'])
      ];}
    }
    if(!format&&/買掛金元帳/u.test(category)&&rows.length>=3){
      const opening=Number(rows[0]?.balance),first=Number(rows[1]?.credit),second=Number(rows[2]?.debit),b1=Number(cells.r2_balance),b2=Number(cells.r3_balance);
      return [
        calcItem('掛仕入後の残高',`${comma(opening)} + ${comma(first)} = ${comma(b1)}`,b1,['table.rows[0]','table.rows[1]','answer.cells.r2_balance']),
        calcItem('支払後の残高',`${comma(b1)} − ${comma(second)} = ${comma(b2)}`,b2,['table.rows[2]','answer.cells.r3_balance'])
      ];
    }
    if(!format&&/商品有高帳/u.test(category)&&rows.length>=4){
      const openingQty=Number(rows[0]?.quantity),openingUnit=Number(rows[0]?.unitPrice),purchaseQty=Number(rows[1]?.quantity),purchaseUnit=Number(rows[1]?.unitPrice),issuedQty=Number(rows[2]?.quantity),issueAmount=Number(cells.r3_amount),remain=Number(cells.r4_amount);
      return [
        calcItem('払出額',`${issuedQty} × ${comma(openingUnit)} = ${comma(issueAmount)}`,issueAmount,['table.rows[0]','table.rows[2]','answer.cells.r3_amount']),
        calcItem('残高額',`(${openingQty} − ${issuedQty}) × ${comma(openingUnit)} + ${purchaseQty} × ${comma(purchaseUnit)} = ${comma(remain)}`,remain,['table.rows[0]','table.rows[1]','table.rows[2]','answer.cells.r4_amount'])
      ];
    }
    return null;
  }
  function calculations(q){if(q.type==='journal')return [...(q.answer?.debit||[]),...(q.answer?.credit||[])].map(r=>({label:r.account,expression:null,result:r.amount,operands:[],evidenceRefs:['answer']}));const special=chapter8Calculations(q);if(special)return special;const cells=q.answer?.cells||{},locs=locations(q);return Object.entries(cells).map(([id,expected])=>{const p=locs.get(id);if(typeof expected==='number'&&p?.c==='balance'&&p.ri>0){const prev=valueAt(q,cells,locs,p.ri-1,'balance'),d=valueAt(q,cells,locs,p.ri,'debit')||0,c=valueAt(q,cells,locs,p.ri,'credit')||0;if(Number.isFinite(prev)&&prev+d-c===expected){const parts=[num(prev)];if(d)parts.push('+',num(d));if(c)parts.push('−',num(c));parts.push('=',num(expected));return{label:cellLabel(q,id,p),expression:parts.join(' '),result:expected,operands:[{label:'直前残高',value:prev},...(d?[{label:'借方記入（増加）',value:d}]:[]),...(c?[{label:'貸方記入（減少）',value:c}]:[])],evidenceRefs:[`table.rows[${p.ri-1}]`,`table.rows[${p.ri}]`,`answer.cells.${id}`]};}}if(typeof expected==='number'&&p?.c==='amount'){const qty=valueAt(q,cells,locs,p.ri,'quantity'),unit=valueAt(q,cells,locs,p.ri,'unitPrice');if(Number.isFinite(qty)&&Number.isFinite(unit)&&qty*unit===expected)return{label:cellLabel(q,id,p),expression:`${num(qty)} × ${num(unit)} = ${num(expected)}`,result:expected,operands:[{label:'数量',value:qty},{label:'単価',value:unit}],evidenceRefs:[`table.rows[${p.ri}]`,`answer.cells.${id}`]};}return{label:cellLabel(q,id,p),expression:null,result:expected,operands:[],evidenceRefs:[p?`table.rows[${p.ri}]`:'answer.cells',`answer.cells.${id}`]};});}
  function transfer(q){if(q.type==='journal')return['debit','credit'].flatMap(side=>(q.answer?.[side]||[]).map(r=>({from:'問題文・証憑',decision:r.account,to:side==='debit'?'借方':'貸方',debitCredit:side,value:r.amount,evidenceRefs:[`answer.${side}`]})));const locs=locations(q);return Object.entries(q.answer?.cells||{}).map(([id,value])=>{const p=locs.get(id);return{from:p?rowName(q,p.r,p.ri):(q.category||'問題資料'),decision:cellLabel(q,id,p),to:labels[p?.c]||p?.c||id,debitCredit:null,value,evidenceRefs:[p?`table.rows[${p.ri}]`:'table',`answer.cells.${id}`]};});}
  function checks(q){if(q.type==='journal'){const d=(q.answer?.debit||[]).reduce((s,r)=>s+(Number(r.amount)||0),0),c=(q.answer?.credit||[]).reduce((s,r)=>s+(Number(r.amount)||0),0);return[{label:'借方合計と貸方合計が合っているか確認する',expected:d===c?`${num(d)} = ${num(c)}`:'不一致',evidenceRefs:['answer.debit','answer.credit']}];}const locs=locations(q),out=Object.entries(q.answer?.cells||{}).map(([id,v])=>({label:`${cellLabel(q,id,locs.get(id))}を確認する`,expected:num(v),evidenceRefs:[`answer.cells.${id}`]})),format=q.format||'',category=String(q.category||'');if(format==='bookkeeping-voucher-entry'){out.unshift({label:'現金の動きに合った伝票を選べているか確認する',expected:'増える → 入金伝票 / 減る → 出金伝票 / 動かない → 振替伝票',evidenceRefs:['table.rows']});return out;}if(format==='bookkeeping-inventory-ledger'||/商品有高帳/u.test(category)){out.unshift({label:'数量・単価・金額の流れを確認する',expected:'払出後の残りを次の行へつなげる',evidenceRefs:['table.rows']});return out;}if(['bookkeeping-general-ledger','bookkeeping-account-ledger','bookkeeping-cash-book','bookkeeping-checking-book'].includes(format)||/元帳/u.test(category))out.unshift({label:'残高を上から順に確認する',expected:'前の残高に増減を反映して、次の残高を求める',evidenceRefs:['table.rows']});return out;}
  function diagnostics(q,a,s,o){return Array.isArray(o?.diagnostics)?o.diagnostics:(Feedback?.diagnoseWrongAnswer?Feedback.diagnoseWrongAnswer(q,a||{},s||{correct:false}):[]);}
  function generated(q,a,s,o){const ds=diagnostics(q,a,s,o);return{schemaVersion:SCHEMA_VERSION,source:'generated',sources:sources(q),summary:String(q.question||'').trim()?[{text:String(q.question).trim(),evidenceRef:'question'}]:[],calculation:calculations(q),transfer:transfer(q),checks:checks(q),mistakes:ds.slice(0,3).map(x=>({title:x.title||'今回の間違い',reason:x.reason||'',correction:x.nextRule||x.thinking||'',diagnosticKind:x.kind||'general',cause:x.cause||x.kind||'general'})),fallback:{authoredExplanation:String(q.explanation||''),diagnostics:clone(ds)}};}
  function merge(g,a){if(!obj(a))return g;const m={...g,source:'authored'};REQUIRED_SECTIONS.forEach(k=>{if(Array.isArray(a[k]))m[k]=clone(a[k]);});if(obj(a.fallback))m.fallback={...g.fallback,...clone(a.fallback)};return m;}
  function validate(m){const e=[];if(!obj(m))return{valid:false,errors:['model must be an object']};if(m.schemaVersion!==SCHEMA_VERSION)e.push(`schemaVersion must be ${SCHEMA_VERSION}`);REQUIRED_SECTIONS.forEach(k=>{if(!Array.isArray(m[k]))e.push(`${k} must be an array`);});if(!obj(m.fallback))e.push('fallback must be an object');if(m.fallback&&typeof m.fallback.authoredExplanation!=='string')e.push('fallback.authoredExplanation must be a string');if(m.fallback&&!Array.isArray(m.fallback.diagnostics))e.push('fallback.diagnostics must be an array');return{valid:e.length===0,errors:e};}
  function build(q,a={},s={correct:false},o={}){if(!obj(q))throw new TypeError('question must be an object');const m=merge(generated(q,a,s,o),q.explanationModel),v=validate(m);if(!v.valid)throw new Error(`invalid explanation model: ${v.errors.join('; ')}`);return m;}
  return Object.freeze({SCHEMA_VERSION,REQUIRED_SECTIONS,build,validate});
});
