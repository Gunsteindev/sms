import { NextRequest, NextResponse } from 'next/server';
import { getMovements, createMovement } from '@/lib/dataverse/inventoryMovements';
import { getInventoryItemById, updateInventoryItem } from '@/lib/dataverse/inventory';
import { serverError, badRequest, withSchool, getSession, makeTableGuard } from '@/lib/api-guard';

const isTableMissing = makeTableGuard('sms_inventorymovement');

export async function GET(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const sp = request.nextUrl.searchParams;
            const movements = await getMovements({
                itemid:       sp.get('itemid')       || undefined,
                movementtype: sp.get('movementtype') ? Number(sp.get('movementtype')) : undefined,
                from:         sp.get('from')         || undefined,
                to:           sp.get('to')           || undefined,
            });
            return NextResponse.json({ success: true, data: movements, total: movements.length });
        } catch (error) {
            if (isTableMissing(error)) {
                return NextResponse.json({ success: true, data: [], total: 0, setup_required: true });
            }
            return serverError(error);
        }
    });
}

export async function POST(request: NextRequest) {
    return withSchool(request, async () => {
        try {
            const session = await getSession(request);
            const body = await request.json();

            if (!body.itemid)       return badRequest('itemid is required');
            if (!body.movementtype) return badRequest('movementtype is required');
            const qty = Number(body.quantity);
            if (isNaN(qty) || qty < 0) return badRequest('quantity must be >= 0');

            const item = await getInventoryItemById(body.itemid);
            const before = item.quantity;

            let after: number;
            switch (body.movementtype) {
                case 1: // Stock In
                case 5: // Return
                    after = before + qty;
                    break;
                case 2: // Stock Out
                case 4: // Loss/Damage
                    after = Math.max(0, before - qty);
                    break;
                case 3: // Adjustment — qty is the new absolute quantity
                    after = qty;
                    break;
                default:
                    return badRequest('invalid movementtype (1–5)');
            }

            const movement = await createMovement({
                name:           `MOV-${Date.now()}`,
                itemid:         body.itemid,
                itemname:       item.name,
                movementtype:   body.movementtype,
                quantity:       qty,
                quantitybefore: before,
                quantityafter:  after,
                reason:         body.reason  || undefined,
                notes:          body.notes   || undefined,
                movedby:        session?.name ?? 'Unknown',
            });

            await updateInventoryItem(body.itemid, { quantity: after });

            return NextResponse.json({ success: true, data: movement }, { status: 201 });
        } catch (error) {
            if (isTableMissing(error)) {
                return NextResponse.json(
                    { success: false, error: 'The sms_inventorymovements table has not been created in Dataverse yet.', setup_required: true },
                    { status: 503 }
                );
            }
            return serverError(error);
        }
    });
}
