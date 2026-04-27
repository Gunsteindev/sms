import dotenv from 'dotenv'; import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';
const T=process.env.AZURE_TENANT_ID!,C=process.env.AZURE_CLIENT_ID!,S=process.env.AZURE_CLIENT_SECRET!,D=process.env.DATAVERSE_URL!;
const API=`${D}/api/data/v9.2`;
async function main(){
  const tok=(await axios.post(`https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
    new URLSearchParams({client_id:C,client_secret:S,scope:`${D}/.default`,grant_type:'client_credentials'}).toString(),
    {headers:{'Content-Type':'application/x-www-form-urlencoded'},timeout:20000})).data.access_token;
  const h={Authorization:`Bearer ${tok}`,Accept:'application/json','OData-MaxVersion':'4.0','OData-Version':'4.0'};
  const r=await axios.get<any>(`${API}/EntityDefinitions(LogicalName='sms_announcement')/Attributes(LogicalName='sms_audience')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`,{headers:h,timeout:20000});
  console.log('sms_audience:');
  r.data.OptionSet?.Options?.forEach((o:any)=>console.log(`  ${o.Value}: ${o.Label?.UserLocalizedLabel?.Label}`));
}
main().catch((e:any)=>{console.error(e.response?.data?.error?.message??e.message);process.exit(1);});
