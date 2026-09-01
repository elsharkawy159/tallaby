interface PaymobIframeProps {
  checkoutUrl: string;
  title: string;
}

export function PaymobIframe({ checkoutUrl, title }: PaymobIframeProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <iframe
        src={checkoutUrl}
        title={title}
        className="min-h-[680px] w-full border-0"
        allow="payment *"
        loading="eager"
      />
    </div>
  );
}
