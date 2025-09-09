import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export function ProductSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 rounded-md border bg-muted" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions & Answers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 rounded-md border bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
