'use strict';
const path=require('path'),auditLock=require('./audit-lock');
const root=process.env.BOKI_AUDIT_ROOT?path.resolve(process.env.BOKI_AUDIT_ROOT):path.resolve(__dirname,'../..');
try{console.log(auditLock.create(root,process.argv[2]).baselineIdentity);}catch(error){console.error(error.message);process.exit(1);}
