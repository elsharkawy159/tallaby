import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db, eq, shipmentBatches, shipmentBatchItems, shippingProviders } from "@workspace/db";
import { EGYPT_POST_COLUMNS, toEgyptPostRows, type PackageVolume } from "@workspace/lib/shipping";

import { requireShippingAdmin } from "@/lib/auth";
import {
  EGYPT_POST_MERCHANT_CODE,
  EGYPT_POST_MERCHANT_NAME,
  EGYPT_POST_WAREHOUSE_NAME,
} from "@/providers/egypt-post.constants";
import { formatBatchLabel } from "../../../orders/batch.lib";
import { loadBulkAssignOrders } from "../../../orders/batch.query";

interface BatchMetadata {
  weightKg?: number;
  volume?: PackageVolume;
}

/**
 * Regenerates the batch's Egypt Post sheet from live order data rather than
 * serving a frozen copy — the batch only pins the weight/volume defaults
 * used at assign time (`shipment_batches.metadata`), not the rows themselves.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    await requireShippingAdmin();
    const { batchId } = await params;

    const [batch] = await db
      .select({
        id: shipmentBatches.id,
        seq: shipmentBatches.seq,
        exportFormat: shipmentBatches.exportFormat,
        metadata: shipmentBatches.metadata,
      })
      .from(shipmentBatches)
      .innerJoin(shippingProviders, eq(shippingProviders.id, shipmentBatches.providerId))
      .where(eq(shipmentBatches.id, batchId))
      .limit(1);

    if (!batch || batch.exportFormat !== "egypt_post_xlsx") {
      return NextResponse.json({ error: "No sheet available for this batch" }, { status: 404 });
    }

    const items = await db
      .select({ orderId: shipmentBatchItems.orderId })
      .from(shipmentBatchItems)
      .where(eq(shipmentBatchItems.batchId, batch.id));

    const orders = await loadBulkAssignOrders(items.map((item) => item.orderId));
    const metadata = (batch.metadata ?? {}) as BatchMetadata;

    const { rows } = toEgyptPostRows(orders, {
      weightKg: metadata.weightKg ?? 1,
      volume: metadata.volume ?? "Small",
      merchantCode: EGYPT_POST_MERCHANT_CODE,
      merchantName: EGYPT_POST_MERCHANT_NAME,
      warehouseName: EGYPT_POST_WAREHOUSE_NAME,
    });

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...EGYPT_POST_COLUMNS] });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const label = formatBatchLabel(batch.seq ?? 0);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="egypt-post-${label}.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
