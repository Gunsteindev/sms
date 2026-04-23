/**
 * test-connection.ts
 * Tests Azure AD token acquisition and basic Dataverse connectivity.
 * Run: npm run test:connection
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const TENANT_ID     = process.env.AZURE_TENANT_ID!;
const CLIENT_ID     = process.env.AZURE_CLIENT_ID!;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET!;
const DATAVERSE_URL = process.env.DATAVERSE_URL!;

function check(label: string, value: string | undefined) {
  if (!value) {
    console.error(`  ✗ ${label} — MISSING`);
    return false;
  }
  console.log(`  ✓ ${label} — ${value.slice(0, 8)}…`);
  return true;
}

async function main() {
  console.log('\n══════════════════════════════════════════');
  console.log('  Dataverse Connection Test');
  console.log('══════════════════════════════════════════\n');

  // ── 1. Env vars ─────────────────────────────────────────────────────────────
  console.log('① Checking environment variables…');
  const ok = [
    check('AZURE_TENANT_ID',     TENANT_ID),
    check('AZURE_CLIENT_ID',     CLIENT_ID),
    check('AZURE_CLIENT_SECRET', CLIENT_SECRET),
    check('DATAVERSE_URL',       DATAVERSE_URL),
  ].every(Boolean);

  if (!ok) {
    console.error('\n❌ Fix the missing env vars in .env.local and retry.\n');
    process.exit(1);
  }

  // ── 2. Azure AD token ────────────────────────────────────────────────────────
  console.log('\n② Acquiring Azure AD access token…');
  const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const scope = `${DATAVERSE_URL}/.default`;

  let token: string;
  try {
    const res = await axios.post(
      tokenEndpoint,
      new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, scope, grant_type: 'client_credentials' }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    );
    token = res.data.access_token;
    const expiresIn: number = res.data.expires_in;
    console.log(`  ✓ Token acquired — expires in ${expiresIn}s`);
    console.log(`  ✓ Token preview: ${token.slice(0, 40)}…`);
  } catch (err: any) {
    const status = err.response?.status;
    const detail = JSON.stringify(err.response?.data ?? err.message);
    console.error(`  ✗ Token request failed [${status}]: ${detail}`);
    process.exit(1);
  }

  // ── 3. Dataverse ping ────────────────────────────────────────────────────────
  console.log('\n③ Pinging Dataverse API…');
  const apiBase = `${DATAVERSE_URL}/api/data/v9.2`;

  try {
    const res = await axios.get(`${apiBase}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
      timeout: 20000,
    });
    console.log(`  ✓ Dataverse responded [${res.status}]`);
  } catch (err: any) {
    const status = err.response?.status;
    const detail = JSON.stringify(err.response?.data ?? err.message);
    console.error(`  ✗ Dataverse ping failed [${status}]: ${detail}`);
    process.exit(1);
  }

  // ── 4. WhoAmI ────────────────────────────────────────────────────────────────
  console.log('\n④ Calling WhoAmI to verify identity…');
  try {
    const res = await axios.get(`${apiBase}/WhoAmI`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
      timeout: 20000,
    });
    const { UserId, BusinessUnitId, OrganizationId } = res.data;
    console.log(`  ✓ UserId:          ${UserId}`);
    console.log(`  ✓ BusinessUnitId:  ${BusinessUnitId}`);
    console.log(`  ✓ OrganizationId:  ${OrganizationId}`);
  } catch (err: any) {
    const status = err.response?.status;
    const detail = JSON.stringify(err.response?.data ?? err.message);
    console.error(`  ✗ WhoAmI failed [${status}]: ${detail}`);
    process.exit(1);
  }

  console.log('\n✅ All connection checks passed!\n');
}

main();
