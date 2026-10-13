(function (root) {
  'use strict';
  const DIGEST = '8d980909e2dccd532bb9f23b6908bcd49fb8b9fdef7fc661afc72799d2a77bc1';
  function create(fixture, engine) {
    const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
    fixture = freeze(JSON.parse(JSON.stringify(fixture)));
    const ids = fixture.answerOrder;
    const question = {id:fixture.contentIdentity,type:'ledger',answer:{cells:Object.fromEntries(ids.flatMap(id => [[id+'_voucher',fixture.key[id].voucher],[id+'_amount',fixture.key[id].amount]]))}};
    const blank = () => ids.map(id => ({id,voucher:'',amount:''}));
    const shape = rows => Array.isArray(rows) && rows.length===4 && new Set(rows.map(row=>row?.id)).size===4 && rows.every(row => row && typeof row==='object' && !Array.isArray(row) && ids.includes(row.id) && Object.keys(row).every(key=>['id','voucher','amount'].includes(key)));
    function amount(raw) {
      if (typeof raw!=='number' && typeof raw!=='string') return null;
      const text=String(raw).normalize('NFKC').trim();
      if (!/^(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)$/.test(text)) return null;
      const value=Number(text.replaceAll(',',''));
      return Number.isSafeInteger(value) && value>0 ? value : null;
    }
    function grade(rows) {
      if (!shape(rows)) return {valid:false,correct:false,earned:0,possible:4,errors:[{field:'rows',message:'取引IDと回答欄を確認してください。'}]};
      const cells={},errors=[];
      for (const row of rows) {
        const empty = value => value==null || (typeof value==='string' && value.trim()==='');
        const value=amount(row.amount),voucher=fixture.choices.includes(row.voucher);
        if (!voucher && !empty(row.voucher)) errors.push({id:row.id,field:'voucher',message:'伝票は選択肢から選んでください。'});
        if (value===null && !empty(row.amount)) errors.push({id:row.id,field:'amount',message:'金額は正の整数で入力してください。桁区切りのカンマも使えます。'});
        cells[row.id+'_voucher']=voucher?row.voucher:'INVALID'; cells[row.id+'_amount']=value??'INVALID';
      }
      const raw=engine.grade(question,{cells});
      const details=ids.map(id=>({id,voucherCorrect:raw.details.find(item=>item.cellId===id+'_voucher').correct,amountCorrect:raw.details.find(item=>item.cellId===id+'_amount').correct}));
      const earned=details.filter(item=>item.voucherCorrect && item.amountCorrect).length;
      return {valid:errors.length===0,correct:earned===4 && errors.length===0,earned,possible:4,details,classificationCorrect:details.filter(item=>item.voucherCorrect).length,amountCorrect:details.filter(item=>item.amountCorrect).length,components:{earned:raw.earned,possible:8},errors};
    }
    return {fixture,question,grade,blank,shape,digest:DIGEST,spec:Object.freeze({family:fixture.family,identity:fixture.contentIdentity,digest:DIGEST,rubric:fixture.rubricVersion,protocol:fixture.protocolVersion})};
  }
  if (typeof module==='object' && module.exports) module.exports={...create(require('../data/form-a.json'),require('./engine')),create};
  else root.FormAScoring={create,digest:DIGEST};
})(typeof window==='object'?window:globalThis);
