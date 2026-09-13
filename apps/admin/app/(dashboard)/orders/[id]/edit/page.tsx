import { OrderEditData } from "./order-edit.data";

export const dynamic = "force-dynamic";

interface OrderEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderEditPage({ params }: OrderEditPageProps) {
  const { id } = await params;

  return <OrderEditData orderId={id} />;
}
