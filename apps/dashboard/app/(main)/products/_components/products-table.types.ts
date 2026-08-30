export interface ProductTableRow {
  id: string;
  title: string;
  description?: string;
  images: string[];
  status: "draft" | "pending" | "active" | "rejected";
}
