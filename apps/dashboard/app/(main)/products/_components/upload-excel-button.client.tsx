"use client";

import { useRef, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { FileSpreadsheet, LoaderIcon } from "lucide-react";
import { toast } from "sonner";
import {
  bulkUploadProductsAction,
  bulkInsertProductsAction,
  type ParsedBulkRow,
} from "@/actions/products";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";

export function UploadExcelButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{
    valid: ParsedBulkRow[];
    invalid: { row: number; message: string }[];
  } | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const res = await bulkUploadProductsAction(formData);
        if (res?.success) {
          setPreview({
            valid: res.valid || [],
            invalid: (res.invalid || []).map((x: any) => ({
              row: x.row,
              message: x.message,
            })),
          });
          setOpen(true);
        } else {
          toast.error(res?.invalid?.[0]?.message || "Could not parse file");
        }
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong while parsing the file");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  };

  const handleInsert = () => {
    if (!preview) return;
    startTransition(async () => {
      try {
        const res = await bulkInsertProductsAction(preview.valid);
        if (res?.success) {
          const msg =
            `Inserted ${res.inserted} products` +
            (res.failed ? `, ${res.failed} failed` : "");
          toast.success(msg);
          setOpen(false);
          setPreview(null);
          router.refresh();
        } else {
          toast.error(res?.errors?.[0]?.message || "Insert failed");
        }
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong while inserting");
      }
    });
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button onClick={handleClick} variant="default" disabled={isPending}>
        <FileSpreadsheet
          className="-ms-1 opacity-60"
          size={16}
          aria-hidden="true"
        />
        {isPending ? "Uploading..." : "Upload Excel Sheet"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk upload preview</DialogTitle>
          </DialogHeader>

          {preview && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>
                    Valid: <strong>{preview.valid.length}</strong>
                  </span>
                  <span>
                    Invalid: <strong>{preview.invalid.length}</strong>
                  </span>
                </div>
              </div>

              <div className="border rounded-md">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-2">Row</th>
                        <th className="text-left p-2">Title</th>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-left p-2">CategoryId</th>
                        <th className="text-left p-2">Price</th>
                        <th className="text-left p-2">Variants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(preview.valid || []).map((r) => (
                        <tr key={`valid-${r.row}`} className="border-t">
                          <td className="p-2">{r.row}</td>
                          <td className="p-2">{r.product.title}</td>
                          <td className="p-2">{r.product.sku}</td>
                          <td className="p-2">{r.product.categoryId}</td>
                          <td className="p-2">{`{base:${r.product.price.base}, list:${r.product.price.list}, final:${r.product.price.final}}`}</td>
                          <td className="p-2">{r.variants?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {preview.invalid.length > 0 && (
                <div className="border rounded-md p-3 bg-red-50">
                  <div className="font-medium text-red-700 mb-2">
                    Invalid rows
                  </div>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1 max-h-40 overflow-auto">
                    {preview.invalid.map((e) => (
                      <li key={`err-${e.row}`}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                    {preview.invalid.length > 10 && (
                      <li>+{preview.invalid.length - 10} more…</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInsert}
              disabled={isPending || !preview || preview.valid.length === 0}
            >
              {isPending ? <LoaderIcon className="animate-spin" /> : "Insert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
