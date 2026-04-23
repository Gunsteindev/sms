import dotenv from 'dotenv'; import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';
const T=process.env.AZURE_TENANT_ID!,C=process.env.AZURE_CLIENT_ID!,S=process.env.AZURE_CLIENT_SECRET!,D=process.env.DATAVERSE_URL!;
const API=`${D}/api/data/v9.2`;
async function main(){
  const token=(await axios.post(`https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
    new URLSearchParams({client_id:C,client_secret:S,scope:`${D}/.default`,grant_type:'client_credentials'}).toString(),
    {headers:{'Content-Type':'application/x-www-form-urlencoded'},timeout:20000})).data.access_token;
  const h={Authorization:`Bearer ${token}`,Accept:'application/json','OData-MaxVersion':'4.0','OData-Version':'4.0'};

  console.log('\n── sms_academicyears ──');
  // raw
  try {
    const r=await axios.get(`${API}/sms_academicyears?$top=1`,{headers:h,timeout:15000});
    const row=r.data.value?.[0]; if(row) { Object.keys(row).filter(k=>!k.startsWith('@')).sort().forEach(k=>console.log(' ',k,':',String(row[k]).slice(0,60))); }
    else console.log('  (empty)');
  } catch(e:any){console.log('raw FAIL:',e.response?.data?.error?.message??e.message);}

  // test without statuscode
  try {
    const r=await axios.get(`${API}/sms_academicyears?$select=sms_academicyearid,sms_name,sms_startdate,sms_enddate,createdon,modifiedon&$top=3`,{headers:h,timeout:15000});
    console.log('\nSELECT without statuscode: OK',r.data.value?.length,'records');
    r.data.value?.forEach((v:any)=>console.log(' ',v.sms_name,v.sms_startdate?.slice(0,10),v.sms_enddate?.slice(0,10)));
  } catch(e:any){console.log('SELECT without statuscode FAIL:',e.response?.data?.error?.message??e.message);}

  console.log('\n── sms_terms ──');
  try {
    const r=await axios.get(`${API}/sms_terms?$top=1`,{headers:h,timeout:15000});
    const row=r.data.value?.[0]; if(row) { Object.keys(row).filter(k=>!k.startsWith('@')).sort().forEach(k=>console.log(' ',k,':',String(row[k]).slice(0,60))); }
    else console.log('  (empty — testing SELECT anyway)');
    // test without termstatus
    const r2=await axios.get(`${API}/sms_terms?$select=sms_termid,sms_name,sms_startdate,sms_enddate,_sms_academicyear_value,createdon,modifiedon&$top=3`,{headers:h,timeout:15000});
    console.log('SELECT without termstatus: OK',r2.data.value?.length,'records');
  } catch(e:any){console.log('sms_terms FAIL:',e.response?.data?.error?.message??e.message);}
}
main().catch(e=>console.error(e.message));
