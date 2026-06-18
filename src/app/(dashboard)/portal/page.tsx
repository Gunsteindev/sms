import { redirect } from 'next/navigation';

// The parent portal now lives in its own standalone experience at /parent.
// Redirect any old /portal links there.
export default function PortalRedirect() {
    redirect('/parent');
}
