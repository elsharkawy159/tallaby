import { getProduct } from "@/actions/products";
import { ProductQA } from "./product.qa";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export async function ProductData({ productId }: { productId: string }) {
  const res = await getProduct(productId);
  if (!res.success || !res.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">Failed to load product.</div>
        </CardContent>
      </Card>
    );
  }

  const product = res.data as any;

  // Sort questions by newest first
  const questions = Array.isArray(product.productQuestions)
    ? [...product.productQuestions].sort((a: any, b: any) => {
        const ad = new Date(a.createdAt || 0).getTime();
        const bd = new Date(b.createdAt || 0).getTime();
        return bd - ad;
      })
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-lg font-semibold">{product.title}</div>
            {product.description && (
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {product.description}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ProductQA productId={product.id} questions={questions} />
    </div>
  );
}
