import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Search, Upload, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Search Bar */}
      <div className="mb-6 flex justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 transform text-gray-400 h-4 w-4" />
          <Input placeholder="Search" className="pl-10 border-gray-300 h-10" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-5 mb-6">
          <Button asChild>
            <Link href="/products/new">Add</Link>
          </Button>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 px-4 py-3 h-10 font-bold disabled:opacity-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 px-4 py-3 h-10 font-bold"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload sheet
          </Button>
          <Button
            variant="destructive"
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 h-10 font-bold"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
