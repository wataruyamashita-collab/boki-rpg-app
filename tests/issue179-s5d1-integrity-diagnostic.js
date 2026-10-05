'use strict';
const core=require('../scripts/qa/audit-core');
const result=core.currentIntegrityCheck();
console.log('ISSUE179_S5D1_INTEGRITY_DIAGNOSTIC',JSON.stringify(result));
