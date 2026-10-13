(function(root) {
  'use strict';
  const DB_NAME='boki-independent-transfer',STORE='assessment',KEY='voucher-transfer-l050';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const exact=(value,keys)=>value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).sort().join('|')===keys.slice().sort().join('|');
  const integer=value=>Number.isSafeInteger(value) && value>=0;
  const uuid=value=>typeof value==='string' && /^[a-f0-9-]{36}$/i.test(value);
  class FormAStore {
    constructor(db,scorer) { this.db=db; this.scorer=scorer; this.closed=false; db.onversionchange=()=>this.close(); }
    static open(scorer) {
      return new Promise((resolve,reject)=>{
        let done=false;
        const finish=(error,db)=>{ if(done){db?.close();return;} done=true;clearTimeout(timer);error?reject(error):resolve(new FormAStore(db,scorer)); };
        const timer=setTimeout(()=>finish(new Error('保存領域を開けません。ほかの確認画面を閉じて再試行してください。')),5000);
        try {
          const request=root.indexedDB.open(DB_NAME,1);
          request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
          request.onerror=()=>finish(new Error('保存領域を利用できません。ブラウザーの保存設定を確認してください。'));
          request.onblocked=()=>finish(new Error('保存領域の更新が待機しています。ほかの確認画面を閉じてください。'));
          request.onsuccess=()=>finish(null,request.result);
        } catch (_) { finish(new Error('この環境では回答を保存できません。保存可能なブラウザーで開いてください。')); }
      });
    }
    empty() { return {schema:1,spec:clone(this.scorer.spec),scopeId:root.crypto.randomUUID(),firstExposure:null,firstSubmission:null,lastAt:0,attempts:[]}; }
    validRows(rows) {
      return this.scorer.shape(rows) && rows.every(row=>exact(row,['id','voucher','amount']) && typeof row.voucher==='string' && (row.voucher==='' || this.scorer.fixture.choices.includes(row.voucher)) && typeof row.amount==='string' && row.amount.length<=64);
    }
    validate(state) {
      if (!exact(state,['schema','spec','scopeId','firstExposure','firstSubmission','lastAt','attempts']) || state.schema!==1 || JSON.stringify(state.spec)!==JSON.stringify(this.scorer.spec) || !uuid(state.scopeId) || !integer(state.lastAt) || !Array.isArray(state.attempts)) return false;
      const seen=new Set(); let lastAt=0;
      for(let i=0;i<state.attempts.length;i++) {
        const a=state.attempts[i];
        if(!exact(a,['id','ordinal','identity','rubric','protocol','digest','status','exposedAt','updatedAt','revision','provenance','initialEligible','draft','receipt']) || !uuid(a.id) || seen.has(a.id) || a.ordinal!==i+1 || a.identity!==state.spec.identity || a.rubric!==state.spec.rubric || a.protocol!==state.spec.protocol || a.digest!==state.spec.digest || !integer(a.exposedAt) || a.exposedAt<lastAt || !integer(a.updatedAt) || a.updatedAt<a.exposedAt || !integer(a.revision) || a.provenance!=='unknown' || a.initialEligible!==false || !this.validRows(a.draft) || !['issued','submitted','abandoned'].includes(a.status))return false;
        seen.add(a.id);lastAt=a.updatedAt;
        if(a.status==='issued' && i!==state.attempts.length-1)return false;
        if(a.status==='submitted') {
          const r=a.receipt;
          if(!exact(r,['attemptId','identity','rubric','protocol','digest','submittedAt','answer','result','localFirstPresentation','initialEligible']) || r.attemptId!==a.id || r.identity!==a.identity || r.rubric!==a.rubric || r.protocol!==a.protocol || r.digest!==a.digest || r.submittedAt!==a.updatedAt || !this.validRows(r.answer) || r.localFirstPresentation!==(i===0) || r.initialEligible!==false)return false;
          const score=this.scorer.grade(r.answer);if(!score.valid || JSON.stringify(score)!==JSON.stringify(r.result))return false;
        } else if(a.receipt!==null)return false;
      }
      if(state.lastAt<lastAt)return false;
      const first=state.attempts[0];
      if(!first)return state.firstExposure===null && state.firstSubmission===null;
      return JSON.stringify(state.firstExposure)===JSON.stringify({attemptId:first.id,identity:first.identity,at:first.exposedAt,provenance:'unknown'}) && JSON.stringify(state.firstSubmission)===JSON.stringify(first.receipt);
    }
    transaction(change,write=true) {
      return new Promise((resolve,reject)=>{
        if(this.closed){reject(new Error('保存領域の版が変わりました。回答を控えてから画面を開き直してください。'));return;}
        let tx,output,error;
        try {tx=this.db.transaction(STORE,write?'readwrite':'readonly');}catch(_){reject(new Error('保存領域を利用できません。画面を開き直してください。'));return;}
        const store=tx.objectStore(STORE),request=store.get(KEY);
        request.onsuccess=()=>{
          try {
            const state=request.result===undefined?this.empty():request.result;
            if(!this.validate(state))throw new Error('記録の版または内容を確認できません。既存記録を変更せず停止しました。');
            output=change(state);
            if(!this.validate(state))throw new Error('記録の整合性を確認できず保存を中止しました。');
            if(write)store.put(state,KEY);
          }catch(e){error=e;tx.abort();}
        };
        tx.oncomplete=()=>resolve(clone(output));
        tx.onabort=()=>reject(error || new Error('端末に保存できませんでした。回答は画面に残っています。空き容量・保存設定を確認して再試行してください。'));
        tx.onerror=()=>{};
      });
    }
    now(state) {const now=Date.now();if(!integer(now))throw new Error('端末の日時を確認してください。');return state.lastAt=Math.max(state.lastAt,now);}
    read() {return this.transaction(state=>state,false);}
    begin(retry=false) {
      return this.transaction(state=>{
        const last=state.attempts.at(-1);
        if(last?.status==='issued' || (last && !retry))return last;
        const now=this.now(state),a={id:root.crypto.randomUUID(),ordinal:state.attempts.length+1,identity:state.spec.identity,rubric:state.spec.rubric,protocol:state.spec.protocol,digest:state.spec.digest,status:'issued',exposedAt:now,updatedAt:now,revision:0,provenance:'unknown',initialEligible:false,draft:this.scorer.blank(),receipt:null};
        if(!state.firstExposure)state.firstExposure={attemptId:a.id,identity:a.identity,at:now,provenance:'unknown'};
        state.attempts.push(a);return a;
      });
    }
    edit(state,id,revision) {
      const a=state.attempts.at(-1);
      if(!a || a.id!==id || a.status!=='issued' || a.revision!==revision)throw new Error('別の画面で回答が更新されました。入力を控え、「保存済みの状態を開く」で確認してください。');
      return a;
    }
    draft(id,revision,rows) {
      if(!this.validRows(rows))return Promise.reject(new Error('回答欄の形式を確認してください。'));
      return this.transaction(state=>{const a=this.edit(state,id,revision);a.draft=clone(rows);a.revision++;a.updatedAt=this.now(state);return a;});
    }
    submit(id,revision,rows) {
      return this.transaction(state=>{
        const previous=state.attempts.find(a=>a.id===id);if(previous?.receipt)return previous.receipt;
        const a=this.edit(state,id,revision),result=this.scorer.grade(rows);
        if(!this.validRows(rows) || !result.valid)throw new Error('伝票の選択と金額の入力形式を確認してください。');
        a.draft=clone(rows);a.revision++;a.updatedAt=this.now(state);a.status='submitted';
        a.receipt={attemptId:a.id,identity:a.identity,rubric:a.rubric,protocol:a.protocol,digest:a.digest,submittedAt:a.updatedAt,answer:clone(rows),result,localFirstPresentation:a.ordinal===1,initialEligible:false};
        if(a.ordinal===1)state.firstSubmission=clone(a.receipt);
        return a.receipt;
      });
    }
    close() {this.closed=true;this.db.close();}
  }
  if(typeof module==='object' && module.exports)module.exports=FormAStore;else root.FormAStore=FormAStore;
})(typeof window==='object'?window:globalThis);
