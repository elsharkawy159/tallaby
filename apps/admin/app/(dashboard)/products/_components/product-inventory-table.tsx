//@ts-ignore
//@ts-nocheck
"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Edit, AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { DataTable } from "@/app/(dashboard)/_components/data-table/data-table";

// Define the inventory item type
interface InventoryItem {
  id: string;
  sku: string;
  variantName: string;
  sellerId: string;
  sellerName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  incomingQuantity: number;
  expectedRestockDate?: string;
  lowStockThreshold: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  lastUpdated: string;
}

// Mock data for inventory
const mockInventory: InventoryItem[] = [
  {
    id: "inv_001",
    sku: "SP-X-PRO-BLK-128",
    variantName: "Black / 128GB",
    sellerId: "seller_001",
    sellerName: "TechRetail Inc.",
    quantity: 45,
    reservedQuantity: 3,
    availableQuantity: 42,
    incomingQuantity: 20,
    expectedRestockDate: "2023-11-15",
    lowStockThreshold: 20,
    status: "in_stock",
    lastUpdated: "2023-10-20T14:25:00Z",
  },
  {
    id: "inv_002",
    sku: "SP-X-PRO-BLK-256",
    variantName: "Black / 256GB",
    sellerId: "seller_001",
    sellerName: "TechRetail Inc.",
    quantity: 32,
    reservedQuantity: 1,
    availableQuantity: 31,
    incomingQuantity: 15,
    expectedRestockDate: "2023-11-15",
    lowStockThreshold: 15,
    status: "in_stock",
    lastUpdated: "2023-10-20T14:25:00Z",
  },
  {
    id: "inv_003",
    sku: "SP-X-PRO-BLK-512",
    variantName: "Black / 512GB",
    sellerId: "seller_001",
    sellerName: "TechRetail Inc.",
    quantity: 18,
    reservedQuantity: 2,
    availableQuantity: 16,
    incomingQuantity: 10,
    expectedRestockDate: "2023-11-15",
    lowStockThreshold: 10,
    status: "in_stock",
    lastUpdated: "2023-10-20T14:25:00Z",
  },
  {
    id: "inv_004",
    sku: "SP-X-PRO-WHT-128",
    variantName: "White / 128GB",
    sellerId: "seller_001",
    sellerName: "TechRetail Inc.",
    quantity: 27,
    reservedQuantity: 4,
    availableQuantity: 23,
    incomingQuantity: 0,
    lowStockThreshold: 15,
    status: "in_stock",
    lastUpdated: "2023-10-20T14:25:00Z",
  },
  {
    id: "inv_005",
    sku: "SP-X-PRO-WHT-256",
    variantName: "White / 256GB",
    sellerId: "seller_001",
    sellerName: "TechRetail Inc.",
    quantity: 15,
    reservedQuantity: 0,
    availableQuantity: 15,
    incomingQuantity: 0,
    lowStockThreshold: 15,
    status: "low_stock",
    lastUpdated: "2023-10-20T14:25:00Z",
  },
  {
    id: "inv_006",
    sku: "SP-X-PRO-WHT-512",
    variantName: "White / 512GB",
    sellerId: "seller_001",
    sellerName: "TechRetail Inc.",
    quantity: 0,
    reservedQuantity: 0,
    availableQuantity: 0,
    incomingQuantity: 25,
    expectedRestockDate: "2023-12-05",
    lowStockThreshold: 10,
    status: "out_of_stock",
    lastUpdated: "2023-10-20T14:25:00Z",
  },
  {
    id: "inv_007",
    sku: "SP-X-PRO-BLU-128",
    variantName: "Blue / 128GB",
    sellerId: "seller_002",
    sellerName: "MobileDepot",
    quantity: 21,
    reservedQuantity: 2,
    availableQuantity: 19,
    incomingQuantity: 0,
    lowStockThreshold: 10,
    status: "in_stock",
    lastUpdated: "2023-10-18T11:10:00Z",
  },
  {
    id: "inv_008",
    sku: "SP-X-PRO-BLU-256",
    variantName: "Blue / 256GB",
    sellerId: "seller_002",
    sellerName: "MobileDepot",
    quantity: 3,
    reservedQuantity: 1,
    availableQuantity: 2,
    incomingQuantity: 15,
    expectedRestockDate: "2023-11-10",
    lowStockThreshold: 8,
    status: "low_stock",
    lastUpdated: "2023-10-18T11:10:00Z",
  },
];

// Define inventory history type
interface InventoryHistory {
  id: string;
  inventoryId: string;
  sku: string;
  variantName: string;
  action: "stock_added" | "stock_removed" | "recount" | "threshold_changed";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  notes?: string;
  performedBy: string;
  timestamp: string;
}

// Mock data for inventory history
const mockInventoryHistory: InventoryHistory[] = [
  {
    id: "hist_001",
    inventoryId: "inv_001",
    sku: "SP-X-PRO-BLK-128",
    variantName: "Black / 128GB",
    action: "stock_added",
    quantity: 20,
    previousQuantity: 25,
    newQuantity: 45,
    notes: "Received new shipment",
    performedBy: "John Smith",
    timestamp: "2023-10-20T14:25:00Z",
  },
  {
    id: "hist_002",
    inventoryId: "inv_002",
    sku: "SP-X-PRO-BLK-256",
    variantName: "Black / 256GB",
    action: "stock_added",
    quantity: 15,
    previousQuantity: 17,
    newQuantity: 32,
    notes: "Received new shipment",
    performedBy: "John Smith",
    timestamp: "2023-10-20T14:25:00Z",
  },
  {
    id: "hist_003",
    inventoryId: "inv_006",
    sku: "SP-X-PRO-WHT-512",
    variantName: "White / 512GB",
    action: "stock_removed",
    quantity: 5,
    previousQuantity: 5,
    newQuantity: 0,
    notes: "Last units sold",
    performedBy: "Sarah Johnson",
    timestamp: "2023-10-19T09:15:00Z",
  },
  {
    id: "hist_004",
    inventoryId: "inv_001",
    sku: "SP-X-PRO-BLK-128",
    variantName: "Black / 128GB",
    action: "threshold_changed",
    quantity: 0,
    previousQuantity: 45,
    newQuantity: 45,
    notes: "Adjusted low stock threshold from 15 to 20",
    performedBy: "Mark Davis",
    timestamp: "2023-10-18T11:30:00Z",
  },
  {
    id: "hist_005",
    inventoryId: "inv_008",
    sku: "SP-X-PRO-BLU-256",
    variantName: "Blue / 256GB",
    action: "stock_removed",
    quantity: 2,
    previousQuantity: 5,
    newQuantity: 3,
    notes: "Order fulfillment",
    performedBy: "System",
    timestamp: "2023-10-17T16:45:00Z",
  },
];

interface ProductInventoryTableProps {
  productId: string;
}

export function ProductInventoryTable({
  productId,
}: ProductInventoryTableProps) {
  // In a real app, you would fetch inventory data using the productId
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [history, setHistory] =
    useState<InventoryHistory[]>(mockInventoryHistory);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [action, setAction] = useState<"add" | "remove" | "set">("add");
  const [notes, setNotes] = useState<string>("");

  // Function to update inventory
  const handleUpdateInventory = () => {
    if (!selectedItem) return;

    let updatedQuantity = selectedItem.quantity;
    if (action === "add") {
      updatedQuantity = selectedItem.quantity + newQuantity;
    } else if (action === "remove") {
      updatedQuantity = Math.max(0, selectedItem.quantity - newQuantity);
    } else if (action === "set") {
      updatedQuantity = Math.max(0, newQuantity);
    }

    // Update inventory item
    const updatedInventory = inventory.map((item) =>
      item.id === selectedItem.id
        ? {
            ...item,
            quantity: updatedQuantity,
            availableQuantity: updatedQuantity - item.reservedQuantity,
            status:
              updatedQuantity === 0
                ? "out_of_stock"
                : updatedQuantity <= item.lowStockThreshold
                  ? "low_stock"
                  : "in_stock",
            lastUpdated: new Date().toISOString(),
          }
        : item
    );

    // Add history entry
    const historyEntry: InventoryHistory = {
      id: `hist_${Date.now()}`,
      inventoryId: selectedItem.id,
      sku: selectedItem.sku,
      variantName: selectedItem.variantName,
      action:
        action === "add"
          ? "stock_added"
          : action === "remove"
            ? "stock_removed"
            : "recount",
      quantity: Math.abs(updatedQuantity - selectedItem.quantity),
      previousQuantity: selectedItem.quantity,
      newQuantity: updatedQuantity,
      notes: notes || undefined,
      performedBy: "Admin User", // In a real app, this would be the logged-in user
      timestamp: new Date().toISOString(),
    };

    setInventory(updatedInventory);
    setHistory([historyEntry, ...history]);
    setIsUpdateDialogOpen(false);
    setNewQuantity(0);
    setNotes("");
  };

  // Inventory table columns
  const inventoryColumns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: "variantName",
      header: "Variant",
    },
    {
      accessorKey: "sku",
      header: "SKU",
    },
    {
      accessorKey: "sellerName",
      header: "Seller",
    },
    {
      accessorKey: "quantity",
      header: "Total",
      cell: ({ row }) => {
        return (
          <div className="text-center font-medium">
            {row.getValue("quantity")}
          </div>
        );
      },
    },
    {
      accessorKey: "availableQuantity",
      header: "Available",
      cell: ({ row }) => {
        return (
          <div className="text-center">{row.getValue("availableQuantity")}</div>
        );
      },
    },
    {
      accessorKey: "reservedQuantity",
      header: "Reserved",
      cell: ({ row }) => {
        const reservedQty = parseInt(row.getValue("reservedQuantity"));
        return (
          <div className="text-center">
            {reservedQty > 0 ? (
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-200"
              >
                {reservedQty}
              </Badge>
            ) : (
              <span>0</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "incomingQuantity",
      header: "Incoming",
      cell: ({ row }) => {
        const incoming = parseInt(row.getValue("incomingQuantity"));
        const date = row.original.expectedRestockDate;

        return (
          <div className="text-center">
            {incoming > 0 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {incoming}
                    </Badge>
                  </TooltipTrigger>
                  {date && (
                    <TooltipContent>
                      <p>Expected: {new Date(date).toLocaleDateString()}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span>0</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;

        let badgeVariant: "default" | "secondary" | "destructive" | "outline" =
          "default";
        let badgeText = "In Stock";
        let icon = null;

        switch (status) {
          case "in_stock":
            badgeVariant = "default";
            badgeText = "In Stock";
            icon = <CheckCircle className="h-3 w-3 mr-1" />;
            break;
          case "low_stock":
            badgeVariant = "secondary";
            badgeText = "Low Stock";
            icon = <AlertTriangle className="h-3 w-3 mr-1" />;
            break;
          case "out_of_stock":
            badgeVariant = "destructive";
            badgeText = "Out of Stock";
            icon = <AlertTriangle className="h-3 w-3 mr-1" />;
            break;
        }

        return (
          <Badge
            variant={badgeVariant}
            className="flex items-center justify-center w-28 mx-auto"
          >
            {icon}
            {badgeText}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedItem(item);
                setNewQuantity(0);
                setAction("add");
                setIsUpdateDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Update
            </Button>
          </div>
        );
      },
    },
  ];

  // History table columns
  const historyColumns: ColumnDef<InventoryHistory>[] = [
    {
      accessorKey: "timestamp",
      header: "Date & Time",
      cell: ({ row }) => {
        const date = new Date(row.getValue("timestamp"));
        return (
          <div>
            <div className="font-medium">{date.toLocaleDateString()}</div>
            <div className="text-xs text-gray-500">
              {date.toLocaleTimeString()}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "variantName",
      header: "Variant",
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.getValue("action") as string;

        let badgeVariant: "default" | "secondary" | "destructive" | "outline" =
          "default";
        let badgeText = "";

        switch (action) {
          case "stock_added":
            badgeVariant = "default";
            badgeText = "Stock Added";
            break;
          case "stock_removed":
            badgeVariant = "secondary";
            badgeText = "Stock Removed";
            break;
          case "recount":
            badgeVariant = "outline";
            badgeText = "Inventory Recount";
            break;
          case "threshold_changed":
            badgeVariant = "outline";
            badgeText = "Threshold Changed";
            break;
        }

        return <Badge variant={badgeVariant}>{badgeText}</Badge>;
      },
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const quantity = parseInt(row.getValue("quantity"));
        const action = row.getValue("action") as string;

        if (action === "threshold_changed") {
          return <span>-</span>;
        }

        return (
          <div className="font-medium">
            {action === "stock_added"
              ? "+"
              : action === "stock_removed"
                ? "-"
                : ""}
            {quantity}
          </div>
        );
      },
    },
    {
      accessorKey: "previousQuantity",
      header: "Previous",
      cell: ({ row }) => {
        return <div>{row.getValue("previousQuantity")}</div>;
      },
    },
    {
      accessorKey: "newQuantity",
      header: "New",
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("newQuantity")}</div>;
      },
    },
    {
      accessorKey: "performedBy",
      header: "Performed By",
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string | undefined;
        return <div>{notes || "-"}</div>;
      },
    },
  ];

  return (
    <div className="space-y-8">
      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Current Inventory</TabsTrigger>
          <TabsTrigger value="history">Inventory History</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          <DataTable
            columns={inventoryColumns}
            data={inventory}
            searchableColumns={[
              {
                id: "sku",
                title: "SKU",
              },
              {
                id: "variantName",
                title: "Variant",
              },
            ]}
            filterableColumns={[
              {
                id: "status",
                title: "Status",
                options: [
                  { label: "In Stock", value: "in_stock" },
                  { label: "Low Stock", value: "low_stock" },
                  { label: "Out of Stock", value: "out_of_stock" },
                ],
              },
              {
                id: "sellerName",
                title: "Seller",
                options: [
                  { label: "TechRetail Inc.", value: "TechRetail Inc." },
                  { label: "MobileDepot", value: "MobileDepot" },
                ],
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="history">
          <DataTable
            columns={historyColumns}
            data={history}
            searchableColumns={[
              {
                id: "sku",
                title: "SKU",
              },
              {
                id: "variantName",
                title: "Variant",
              },
            ]}
            filterableColumns={[
              {
                id: "action",
                title: "Action",
                options: [
                  { label: "Stock Added", value: "stock_added" },
                  { label: "Stock Removed", value: "stock_removed" },
                  { label: "Inventory Recount", value: "recount" },
                  { label: "Threshold Changed", value: "threshold_changed" },
                ],
              },
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Update Inventory Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <div>
                  <p className="mb-1">
                    <span className="font-semibold">
                      {selectedItem.variantName}
                    </span>{" "}
                    ({selectedItem.sku})
                  </p>
                  <p className="mb-2">
                    Current quantity:{" "}
                    <span className="font-semibold">
                      {selectedItem.quantity}
                    </span>
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <select
                id="action"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={action}
                onChange={(e) => setAction(e.target.value as any)}
              >
                <option value="add">Add stock</option>
                <option value="remove">Remove stock</option>
                <option value="set">Set exact quantity</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                {action === "add"
                  ? "Quantity to add"
                  : action === "remove"
                    ? "Quantity to remove"
                    : "New quantity"}
              </Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Add notes about this inventory update"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {action === "remove" &&
              selectedItem &&
              newQuantity > selectedItem.quantity && (
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Warning: You are trying to remove more units than
                        available. This will set the inventory to zero.
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateInventory}>Update Inventory</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
