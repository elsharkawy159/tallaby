/**
 * Copy for the Claude Design email library (customer + seller lifecycle mail).
 * Arabic follows the designs word for word where they fit real data; English
 * mirrors it. `{name}` placeholders go through `interpolate`.
 */

export interface KitCopy {
  forSellers: string;
  order: string;
  progress: [string, string, string, string];
  needHelp: string;
  replyOrWrite: string;
  sentTo: string;
  poweredBy: string;
  sellerReason: string;
  sellerHelp: string;
  orWhatsApp: string;
  whatsapp: string;
  notificationSettings: string;
  marketingReason: string;
  unsubscribe: string;
  qty: string;
  seller: string;
  sku: string;
}

export interface TransactionalCopy {
  kit: KitCopy;
  orderConfirmationV2: {
    title: string;
    preview: string;
    eyebrow: string;
    heading: string;
    lead: string;
    arrivesBy: string;
    track: string;
    yourItems: string;
    codNote: string;
    help: string;
    helpTrack: string;
    footer: string;
  };
  orderShipped: {
    subject: string;
    preview: string;
    previewNoDate: string;
    eyebrow: string;
    heading: string;
    lead: string;
    carrier: string;
    tracking: string;
    arrivesBy: string;
    track: string;
    inShipment: string;
    shippingAddress: string;
    payment: string;
    amountDue: string;
  };
  orderDelivered: {
    subject: string;
    preview: string;
    pill: string;
    heading: string;
    lead: string;
    question: string;
    tapStars: string;
    writeReview: string;
    returnNote: string;
    returnLink: string;
    returnNoteNoLink: string;
    returnWithin: string;
  };
  orderCancelled: {
    subject: string;
    preview: string;
    pill: string;
    heading: string;
    leadCustomer: string;
    leadSeller: string;
    leadSystem: string;
    reason: string;
    codNote: string;
    refundNote: string;
    items: string;
    shopAgain: string;
  };
  refundIssued: {
    subject: string;
    preview: string;
    eyebrow: string;
    heading: string;
    lead: string;
    amount: string;
    method: string;
    date: string;
    walletNote: string;
    viewWallet: string;
    viewOrder: string;
    refundedItems: string;
    reason: string;
    itemsValue: string;
    shipping: string;
    shippingNotRefunded: string;
    total: string;
    methods: Record<"wallet" | "original" | "manual", string>;
  };
  abandonedCart: {
    subject: string;
    preview: string;
    previewCoupon: string;
    eyebrow: string;
    heading: string;
    lead: string;
    subtotal: string;
    discount: string;
    totalAfter: string;
    total: string;
    coupon: string;
    couponUntil: string;
    complete: string;
  };
  backInStock: {
    subject: string;
    preview: string;
    eyebrow: string;
    heading: string;
    lead: string;
    shop: string;
    reason: string;
    unsubscribe: string;
  };
  /** Store email campaigns (F-16a): the seller writes subject + text. */
  storeCampaign: {
    shop: string;
    viewProduct: string;
    reason: string;
    unsubscribe: string;
    testBanner: string;
    testSubject: string;
  };
  /** Win-back email (F-16e); subject/body are the default when the seller leaves them empty. */
  winback: {
    subject: string;
    body: string;
    shop: string;
    reason: string;
  };
  welcomeVerify: {
    subject: string;
    preview: string;
    eyebrow: string;
    heading: string;
    headingNoName: string;
    lead: string;
    confirm: string;
    linkNote: string;
    fallback: string;
    ignore: string;
  };
  passwordReset: {
    subject: string;
    preview: string;
    eyebrow: string;
    heading: string;
    lead: string;
    cta: string;
    linkNote: string;
    fallback: string;
    ignore: string;
  };
  sellerNewOrder: {
    subject: string;
    preview: string;
    pill: string;
    from: string;
    orderLabel: string;
    meta: string;
    oneItem: string;
    items: string;
    shipBy: string;
    shipByNote: string;
    promised: string;
    prepare: string;
    invoice: string;
    toPack: string;
    subtotal: string;
    shipping: string;
    toCollect: string;
    orderTotal: string;
    shipTo: string;
    payment: string;
    help: string;
    helpCancel: string;
    helpQuestions: string;
  };
  sellerOrderCancelled: {
    subject: string;
    preview: string;
    pill: string;
    headingCustomer: string;
    headingOther: string;
    lead: string;
    dontShip: string;
    dontShipNote: string;
    reason: string;
    value: string;
    stock: string;
    stockRestored: string;
    stockUnchanged: string;
    items: string;
    viewOrder: string;
  };
  sellerWalletTopUp: {
    subject: string;
    preview: string;
    pill: string;
    heading: string;
    lead: string;
    balance: string;
    previous: string;
    reference: string;
    method: string;
    date: string;
    details: string;
    amount: string;
    fee: string;
    paid: string;
    viewWallet: string;
    topUpAgain: string;
    notYou: string;
    contactUs: string;
    methods: Record<"card" | "wallet" | "instapay" | "bank_transfer" | "manual", string>;
  };
  sellerPayout: {
    subject: string;
    preview: string;
    eyebrow: string;
    heading: string;
    lead: string;
    leadPeriod: string;
    reference: string;
    account: string;
    date: string;
    details: string;
    net: string;
    statement: string;
    bankNote: string;
    bankLink: string;
  };
  sellerLowStock: {
    subject: string;
    subjectOne: string;
    preview: string;
    pill: string;
    heading: string;
    headingOne: string;
    lead: string;
    remaining: string;
    outOfStock: string;
    sold: string;
    update: string;
    note: string;
  };
  sellerStoreCreated: {
    subject: string;
    preview: string;
    pill: string;
    heading: string;
    lead: string;
    storeName: string;
    storeLink: string;
    stepsTitle: string;
    done: string;
    steps: [string, string][];
    addProduct: string;
    design: string;
    helpCenter: string;
  };
}

export const transactionalEn: TransactionalCopy = {
  kit: {
    forSellers: "for sellers",
    order: "Order",
    progress: ["Confirmed", "Shipped", "Out for delivery", "Delivered"],
    needHelp: "Need help?",
    replyOrWrite: "Reply to this email or write to",
    sentTo: "This email was sent to",
    poweredBy: "Powered by Tallaby",
    sellerReason: "You get this email because you sell on Tallaby.",
    sellerHelp: "Need help? Email",
    orWhatsApp: "or message us on",
    whatsapp: "WhatsApp",
    notificationSettings: "Notification settings",
    marketingReason: "You get this email because you left items in your cart.",
    unsubscribe: "Unsubscribe",
    qty: "Qty {quantity}",
    seller: "Seller: {name}",
    sku: "SKU {sku}",
  },
  orderConfirmationV2: {
    title: "Your order {orderNumber} is confirmed",
    preview: "We received order {orderNumber} and are getting it ready.",
    eyebrow: "Order confirmed",
    heading: "Thanks for your order, {name}",
    lead: "We received your order and are getting it ready. We'll email you again when it ships.",
    arrivesBy: "Arrives by",
    track: "Track your order",
    yourItems: "Your items",
    codNote: "Please have {total} ready for the courier.",
    help: "Need help with this order?",
    helpTrack: "You can track your order any time from",
    footer: "Confirmation for order {orderNumber}, sent to",
  },
  orderShipped: {
    subject: "Your order {orderNumber} has shipped",
    preview: "Your order is on its way. Expected delivery {date}.",
    previewNoDate: "Your order {orderNumber} is on its way.",
    eyebrow: "Shipped",
    heading: "Your order is on its way",
    lead: "We handed your order to the courier. You can follow the shipment as it moves.",
    carrier: "Courier",
    tracking: "Tracking number",
    arrivesBy: "Arrives by",
    track: "Track shipment",
    inShipment: "In this shipment",
    shippingAddress: "Shipping address",
    payment: "Payment",
    amountDue: "Amount due:",
  },
  orderDelivered: {
    subject: "Your order {orderNumber} was delivered · rate your purchase",
    preview: "Order {orderNumber} arrived. Tell us what you think.",
    pill: "Delivered",
    heading: "Your order arrived, we hope you love it",
    lead: "Your order was delivered on {date}. Your review helps other shoppers and helps sellers improve.",
    question: "What do you think of it?",
    tapStars: "Tap a star to write your review.",
    writeReview: "Write a review",
    returnNote: "Something wrong with it? You can",
    returnLink: "request a return",
    returnNoteNoLink: "Something wrong with it? Reply to this email and we'll help.",
    returnWithin: "within {days} days of delivery",
  },
  orderCancelled: {
    subject: "Your order {orderNumber} was cancelled",
    preview: "Order {orderNumber} was cancelled.",
    pill: "Cancelled",
    heading: "Your order was cancelled",
    leadCustomer: "Order {orderNumber} was cancelled on {date} at your request.",
    leadSeller: "Order {orderNumber} was cancelled on {date} by the seller.",
    leadSystem: "Order {orderNumber} was cancelled on {date}.",
    reason: "Reason: {reason}",
    codNote: "Since you chose cash on delivery, you won't be charged anything.",
    refundNote: "Any amount you paid ({amount}) will be refunded. We'll email you when it's done.",
    items: "Cancelled items",
    shopAgain: "Shop again",
  },
  refundIssued: {
    subject: "{amount} refunded for your order {orderNumber}",
    preview: "{amount} was refunded to you.",
    eyebrow: "Refunded",
    heading: "We refunded {amount}",
    lead: "Your refund for order {orderNumber} was approved.",
    amount: "Amount",
    method: "Method",
    date: "Date",
    walletNote: "Your wallet balance is available now and you can use it on your next order.",
    viewWallet: "View wallet",
    viewOrder: "View order",
    refundedItems: "Refunded items",
    reason: "Reason: {reason}",
    itemsValue: "Items value",
    shipping: "Shipping",
    shippingNotRefunded: "Not refunded",
    total: "Total refund",
    methods: { wallet: "Tallaby wallet", original: "Original payment method", manual: "Bank transfer" },
  },
  abandonedCart: {
    subject: "You left something in your cart",
    preview: "Your items are still waiting for you.",
    previewCoupon: "Your items are still waiting. Use code {code} for {discount} off.",
    eyebrow: "Your cart is waiting",
    heading: "Forgot something in your cart?",
    lead: "We saved the items you added. Stock is limited, so complete your order before they sell out.",
    subtotal: "Subtotal",
    discount: "Discount {code}",
    totalAfter: "Total after discount",
    total: "Total",
    coupon: "{discount} off with code",
    couponUntil: "until {date}",
    complete: "Complete your order",
  },
  backInStock: {
    subject: "{product} is back in stock",
    preview: "The item you asked about is available again at {store}.",
    eyebrow: "Back in stock",
    heading: "It's back!",
    lead: "You asked us to tell you when this item is available again. It is in stock now at {store}, but quantities are limited, so order soon.",
    shop: "Order now",
    reason: "You get this email because you asked to be told when this item is back in stock.",
    unsubscribe: "Stop these alerts",
  },
  storeCampaign: {
    shop: "Shop now",
    viewProduct: "View product",
    reason: "You get this email because you ordered from {store} or subscribed to its newsletter.",
    unsubscribe: "Unsubscribe",
    testBanner: "Test email: only you received this.",
    testSubject: "[Test] {subject}",
  },
  winback: {
    subject: "We miss you at {store}",
    body: "It's been a while since your last order, and we have new things we think you'll like.\n\nTake a look at what's new at {store}. We'd love to see you again!",
    shop: "See what's new",
    reason: "You get this email because you ordered from {store} before.",
  },
  welcomeVerify: {
    subject: "Welcome to Tallaby · confirm your email",
    preview: "Confirm your email to activate your Tallaby account.",
    eyebrow: "Welcome",
    heading: "Welcome to Tallaby, {name}",
    headingNoName: "Welcome to Tallaby",
    lead: "Confirm your email address to activate your account and start shopping.",
    confirm: "Confirm my email",
    linkNote: "The link works for a limited time and can be used once.",
    fallback: "Button not working? Copy this link into your browser:",
    ignore: "Didn't create a Tallaby account? You can safely ignore this email.",
  },
  passwordReset: {
    subject: "Reset your password",
    preview: "You asked to reset your password.",
    eyebrow: "Account security",
    heading: "Reset your password",
    lead: "We got a request to reset your account password. Tap the button to choose a new one.",
    cta: "Set a new password",
    linkNote: "The link works for a limited time and can be used once.",
    fallback: "Button not working? Copy this link into your browser:",
    ignore: "Didn't ask for this? Ignore this email and your password stays the same.",
  },
  sellerNewOrder: {
    subject: "New order {orderNumber} · {total}",
    preview: "New order {orderNumber} for {total}, {payment}.",
    pill: "New order",
    from: "You have a new order from",
    orderLabel: "Order",
    meta: "{date} · {items}",
    oneItem: "1 item",
    items: "{count} items",
    shipBy: "Ship by {date}.",
    shipByNote: "Shipping fast keeps your seller rating high.",
    promised: "The customer was promised delivery by {date}.",
    prepare: "Prepare the order",
    invoice: "Print packing slip",
    toPack: "Items to pack",
    subtotal: "Subtotal",
    shipping: "Shipping (paid by customer)",
    toCollect: "Amount to collect",
    orderTotal: "Order total",
    shipTo: "Ship to",
    payment: "Payment",
    help: "Can't fulfil this order?",
    helpCancel: "Cancel it from your dashboard",
    helpQuestions: "so the customer is told right away. Questions? Write to",
  },
  sellerOrderCancelled: {
    subject: "Order {orderNumber} was cancelled",
    preview: "Order {orderNumber} was cancelled. Don't ship it.",
    pill: "Cancelled",
    headingCustomer: "The customer cancelled the order",
    headingOther: "The order was cancelled",
    lead: "Order {orderNumber} was cancelled on {date}.",
    dontShip: "Don't ship this order.",
    dontShipNote: "If you already handed it to a courier, ask for it back.",
    reason: "Reason",
    value: "Value",
    stock: "Stock",
    stockRestored: "Restored automatically",
    stockUnchanged: "Not changed",
    items: "Items",
    viewOrder: "View order",
  },
  sellerWalletTopUp: {
    subject: "Your wallet was topped up with {amount}",
    preview: "{amount} was added to your wallet. Your balance is {balance}.",
    pill: "Top-up successful",
    heading: "We added {amount} to your wallet",
    lead: "The balance is available now and pays your store's platform fees automatically.",
    balance: "Current wallet balance",
    previous: "Previous balance",
    reference: "Reference",
    method: "Payment method",
    date: "Date",
    details: "Transaction details",
    amount: "Top-up amount",
    fee: "Payment fee",
    paid: "Amount paid",
    viewWallet: "View wallet",
    topUpAgain: "Top up again",
    notYou: "Didn't make this top-up?",
    contactUs: "Contact us right away",
    methods: {
      card: "Card",
      wallet: "Mobile wallet",
      instapay: "InstaPay",
      bank_transfer: "Bank transfer",
      manual: "Added by Tallaby",
    },
  },
  sellerPayout: {
    subject: "{amount} was sent to your account",
    preview: "We sent your earnings.",
    eyebrow: "Payout sent",
    heading: "We sent {amount} to your account",
    lead: "It usually arrives within 1 to 3 business days.",
    leadPeriod: "Earnings for {period}. It usually arrives within 1 to 3 business days.",
    reference: "Payout number",
    account: "Account",
    date: "Date",
    details: "Earnings details",
    net: "Net payout",
    statement: "View statement",
    bankNote: "Bank details wrong?",
    bankLink: "Update them before the next payout",
  },
  sellerLowStock: {
    subject: "Alert: {count} products are running low",
    subjectOne: "Alert: a product is running low",
    preview: "{count} products are running low. Restock to avoid missing orders.",
    pill: "Low stock",
    heading: "{count} products are running low",
    headingOne: "A product is running low",
    lead: "When stock reaches zero the product can't be ordered. Restock to avoid missing orders.",
    remaining: "{count} left",
    outOfStock: "Out of stock",
    sold: "{count} sold this week",
    update: "Update stock",
    note: "You can change the alert threshold for each product from its page in the dashboard.",
  },
  sellerStoreCreated: {
    subject: "Your store is ready on Tallaby",
    preview: "Your store is created. Finish 4 steps to get your first order.",
    pill: "Store created",
    heading: "Congratulations, your store is ready",
    lead: "You created {storeName} on Tallaby. Finish the steps below to start receiving orders.",
    storeName: "Store name",
    storeLink: "Store link",
    stepsTitle: "Get started in 4 steps",
    done: "Done",
    steps: [
      ["Create your store", "Done"],
      ["Add your first product", "Photos, price and stock"],
      ["Set up shipping", "Choose couriers and delivery areas"],
      ["Set up payments", "Cash on delivery or online payment"],
    ],
    addProduct: "Add your first product",
    design: "Customise your store design",
    helpCenter: "Help center",
  },
};

export const transactionalAr: TransactionalCopy = {
  kit: {
    forSellers: "للبائعين",
    order: "طلب",
    progress: ["تم التأكيد", "تم الشحن", "جاري التوصيل", "تم التوصيل"],
    needHelp: "تحتاج مساعدة؟",
    replyOrWrite: "رُد على هذه الرسالة أو راسلنا على",
    sentTo: "أُرسلت هذه الرسالة إلى",
    poweredBy: "يعمل على طلبي",
    sellerReason: "تصلك هذه الرسالة لأنك تبيع على طلبي.",
    sellerHelp: "تحتاج مساعدة؟ راسلنا على",
    orWhatsApp: "أو تواصل معنا عبر",
    whatsapp: "واتساب",
    notificationSettings: "إعدادات الإشعارات",
    marketingReason: "تصلك هذه الرسالة لأنك تركت منتجات في سلتك.",
    unsubscribe: "إلغاء الاشتراك",
    qty: "الكمية {quantity}",
    seller: "البائع: {name}",
    sku: "رمز المنتج {sku}",
  },
  orderConfirmationV2: {
    title: "تم تأكيد طلبك {orderNumber}",
    preview: "استلمنا طلبك رقم {orderNumber} ونجهّزه الآن.",
    eyebrow: "تم تأكيد الطلب",
    heading: "شكرًا لطلبك يا {name}",
    lead: "استلمنا طلبك ونجهّزه الآن، وسنراسلك مرة أخرى عند شحنه.",
    arrivesBy: "يصل بحلول",
    track: "تتبّع طلبك",
    yourItems: "منتجاتك",
    codNote: "يُرجى تجهيز {total} لمندوب التوصيل.",
    help: "تحتاج مساعدة بخصوص هذا الطلب؟",
    helpTrack: "ويمكنك تتبّع طلبك في أي وقت من",
    footer: "رسالة تأكيد للطلب رقم {orderNumber}، أُرسلت إلى",
  },
  orderShipped: {
    subject: "تم شحن طلبك {orderNumber}",
    preview: "طلبك في الطريق إليك. التوصيل المتوقع {date}.",
    previewNoDate: "طلبك {orderNumber} في الطريق إليك.",
    eyebrow: "تم الشحن",
    heading: "طلبك في الطريق إليك",
    lead: "سلّمنا طلبك لشركة الشحن. يمكنك متابعة الشحنة لحظة بلحظة.",
    carrier: "شركة الشحن",
    tracking: "رقم التتبع",
    arrivesBy: "يصل بحلول",
    track: "تتبّع الشحنة",
    inShipment: "في هذه الشحنة",
    shippingAddress: "عنوان الشحن",
    payment: "الدفع",
    amountDue: "المبلغ المطلوب:",
  },
  orderDelivered: {
    subject: "تم توصيل طلبك {orderNumber} · قيّم مشترياتك",
    preview: "وصل طلبك {orderNumber}. شاركنا رأيك في المنتج.",
    pill: "تم التوصيل",
    heading: "وصل طلبك، نتمنى أن ينال إعجابك",
    lead: "تم توصيل طلبك يوم {date}. رأيك يساعد المتسوقين الآخرين والبائعين على التحسّن.",
    question: "ما رأيك في المنتج؟",
    tapStars: "اضغط على عدد النجوم لكتابة تقييمك.",
    writeReview: "اكتب تقييمك",
    returnNote: "هناك مشكلة في المنتج؟ يمكنك",
    returnLink: "طلب إرجاع",
    returnNoteNoLink: "هناك مشكلة في المنتج؟ رُد على هذه الرسالة وسنساعدك.",
    returnWithin: "خلال {days} يومًا من الاستلام",
  },
  orderCancelled: {
    subject: "تم إلغاء طلبك {orderNumber}",
    preview: "تم إلغاء طلبك {orderNumber}.",
    pill: "تم الإلغاء",
    heading: "تم إلغاء طلبك",
    leadCustomer: "أُلغي الطلب رقم {orderNumber} بتاريخ {date} بناءً على طلبك.",
    leadSeller: "أُلغي الطلب رقم {orderNumber} بتاريخ {date} من قِبل البائع.",
    leadSystem: "أُلغي الطلب رقم {orderNumber} بتاريخ {date}.",
    reason: "السبب: {reason}",
    codNote: "بما أن الدفع عند الاستلام، لن يتم تحصيل أي مبلغ منك.",
    refundNote: "سيتم رد أي مبلغ دفعته ({amount})، وسنراسلك عند إتمام الاسترداد.",
    items: "المنتجات الملغاة",
    shopAgain: "تسوّق مرة أخرى",
  },
  refundIssued: {
    subject: "تم رد {amount} لطلبك {orderNumber}",
    preview: "تم رد {amount} إليك.",
    eyebrow: "تم الاسترداد",
    heading: "أعدنا لك {amount}",
    lead: "تمت الموافقة على استرداد طلبك رقم {orderNumber}.",
    amount: "المبلغ",
    method: "الطريقة",
    date: "التاريخ",
    walletNote: "رصيد المحفظة متاح الآن ويمكنك استخدامه في طلبك القادم.",
    viewWallet: "عرض المحفظة",
    viewOrder: "عرض الطلب",
    refundedItems: "المنتجات المستردة",
    reason: "السبب: {reason}",
    itemsValue: "قيمة المنتجات",
    shipping: "رسوم الشحن",
    shippingNotRefunded: "غير مستردة",
    total: "إجمالي الاسترداد",
    methods: { wallet: "محفظة طلبي", original: "وسيلة الدفع الأصلية", manual: "تحويل بنكي" },
  },
  abandonedCart: {
    subject: "نسيت شيئًا في سلتك",
    preview: "منتجاتك ما زالت في انتظارك.",
    previewCoupon: "منتجاتك ما زالت في انتظارك. استخدم كود {code} لخصم {discount}.",
    eyebrow: "سلتك في انتظارك",
    heading: "نسيت شيئًا في سلتك؟",
    lead: "احتفظنا لك بالمنتجات التي أضفتها. الكميات محدودة، أكمل طلبك قبل نفادها.",
    subtotal: "المجموع الفرعي",
    discount: "خصم {code}",
    totalAfter: "الإجمالي بعد الخصم",
    total: "الإجمالي",
    coupon: "خصم {discount} بكود",
    couponUntil: "حتى {date}",
    complete: "أكمل الطلب",
  },
  backInStock: {
    subject: "{product} رجع تاني",
    preview: "المنتج اللي طلبت نبلغك بيه متوفر دلوقتي في {store}.",
    eyebrow: "رجع المخزون",
    heading: "رجع تاني!",
    lead: "طلبت مننا نبلغك أول ما المنتج ده يرجع. هو متوفر دلوقتي في {store}، بس الكمية محدودة، فاطلبه بسرعة.",
    shop: "اطلب دلوقتي",
    reason: "وصلك الإيميل ده لأنك طلبت نبلغك لما المنتج ده يرجع.",
    unsubscribe: "إيقاف التنبيهات دي",
  },
  storeCampaign: {
    shop: "تسوّق دلوقتي",
    viewProduct: "شوف المنتج",
    reason: "وصلك الإيميل ده لأنك طلبت قبل كده من {store} أو اشتركت في النشرة بتاعته.",
    unsubscribe: "إلغاء الاشتراك",
    testBanner: "إيميل تجربة: وصلك إنت بس.",
    testSubject: "[تجربة] {subject}",
  },
  winback: {
    subject: "وحشتنا في {store}",
    body: "بقالك فترة مطلبتش مننا، وعندنا حاجات جديدة هتعجبك.\n\nبص على الجديد في {store}، مستنيينك!",
    shop: "شوف الجديد",
    reason: "وصلك الإيميل ده لأنك طلبت من {store} قبل كده.",
  },
  welcomeVerify: {
    subject: "أهلًا بك في طلبي · أكّد بريدك الإلكتروني",
    preview: "أكّد بريدك الإلكتروني لتفعيل حسابك في طلبي.",
    eyebrow: "مرحبًا بك",
    heading: "أهلًا بك في طلبي يا {name}",
    headingNoName: "أهلًا بك في طلبي",
    lead: "أكّد بريدك الإلكتروني لتفعيل حسابك والبدء في التسوق.",
    confirm: "تأكيد البريد الإلكتروني",
    linkNote: "الرابط صالح لفترة محدودة ويمكن استخدامه مرة واحدة فقط.",
    fallback: "الزر لا يعمل؟ انسخ هذا الرابط في المتصفح:",
    ignore: "لم تنشئ حسابًا على طلبي؟ يمكنك تجاهل هذه الرسالة بأمان.",
  },
  passwordReset: {
    subject: "إعادة تعيين كلمة المرور",
    preview: "طلبت إعادة تعيين كلمة المرور.",
    eyebrow: "أمان الحساب",
    heading: "إعادة تعيين كلمة المرور",
    lead: "تلقّينا طلبًا لإعادة تعيين كلمة المرور لحسابك. اضغط على الزر لاختيار كلمة مرور جديدة.",
    cta: "تعيين كلمة مرور جديدة",
    linkNote: "الرابط صالح لفترة محدودة ويمكن استخدامه مرة واحدة فقط.",
    fallback: "الزر لا يعمل؟ انسخ هذا الرابط في المتصفح:",
    ignore: "لم تطلب ذلك؟ تجاهل هذه الرسالة وستبقى كلمة مرورك كما هي.",
  },
  sellerNewOrder: {
    subject: "طلب جديد {orderNumber} · {total}",
    preview: "طلب جديد رقم {orderNumber} بقيمة {total}، {payment}.",
    pill: "طلب جديد",
    from: "لديك طلب جديد من",
    orderLabel: "طلب رقم",
    meta: "{date} · {items}",
    oneItem: "منتج واحد",
    items: "{count} منتجات",
    shipBy: "اشحن قبل {date}.",
    shipByNote: "الشحن السريع يحافظ على تقييمك كبائع.",
    promised: "وُعد العميل بالتوصيل بحلول {date}.",
    prepare: "جهّز الطلب",
    invoice: "طباعة إيصال التغليف",
    toPack: "منتجات للتغليف",
    subtotal: "المجموع الفرعي",
    shipping: "الشحن (يدفعه العميل)",
    toCollect: "المبلغ المطلوب تحصيله",
    orderTotal: "إجمالي الطلب",
    shipTo: "الشحن إلى",
    payment: "الدفع",
    help: "لا تستطيع تنفيذ هذا الطلب؟",
    helpCancel: "ألغِه من لوحة التحكم",
    helpQuestions: "ليصل إشعار للعميل فورًا. لديك أسئلة؟ راسلنا على",
  },
  sellerOrderCancelled: {
    subject: "أُلغي الطلب {orderNumber}",
    preview: "أُلغي الطلب {orderNumber}. لا تقم بشحنه.",
    pill: "تم الإلغاء",
    headingCustomer: "ألغى العميل الطلب",
    headingOther: "تم إلغاء الطلب",
    lead: "أُلغي الطلب رقم {orderNumber} بتاريخ {date}.",
    dontShip: "لا تقم بشحن هذا الطلب.",
    dontShipNote: "إذا سلّمته لمندوب الشحن بالفعل، اطلب إرجاعه.",
    reason: "السبب",
    value: "القيمة",
    stock: "المخزون",
    stockRestored: "أُعيد تلقائيًا",
    stockUnchanged: "لم يتغير",
    items: "المنتجات",
    viewOrder: "عرض الطلب",
  },
  sellerWalletTopUp: {
    subject: "تم شحن محفظتك بمبلغ {amount}",
    preview: "تمت إضافة {amount} إلى محفظتك. رصيدك الحالي {balance}.",
    pill: "تم الشحن بنجاح",
    heading: "أضفنا {amount} إلى محفظتك",
    lead: "الرصيد متاح الآن ويُستخدم تلقائيًا لدفع رسوم المنصة في متجرك.",
    balance: "رصيد المحفظة الحالي",
    previous: "الرصيد السابق",
    reference: "رقم العملية",
    method: "طريقة الدفع",
    date: "التاريخ",
    details: "تفاصيل العملية",
    amount: "مبلغ الشحن",
    fee: "رسوم الدفع",
    paid: "المبلغ المدفوع",
    viewWallet: "عرض المحفظة",
    topUpAgain: "شحن مرة أخرى",
    notYou: "لم تقم بهذه العملية؟",
    contactUs: "تواصل معنا فورًا",
    methods: {
      card: "بطاقة",
      wallet: "محفظة إلكترونية",
      instapay: "إنستاباي",
      bank_transfer: "تحويل بنكي",
      manual: "أضافها فريق طلبي",
    },
  },
  sellerPayout: {
    subject: "تم تحويل {amount} إلى حسابك",
    preview: "أرسلنا أرباحك.",
    eyebrow: "تم تحويل الأرباح",
    heading: "أرسلنا {amount} إلى حسابك",
    lead: "يصل المبلغ عادةً خلال 1 إلى 3 أيام عمل.",
    leadPeriod: "أرباح الفترة {period}. يصل المبلغ عادةً خلال 1 إلى 3 أيام عمل.",
    reference: "رقم التحويل",
    account: "الحساب",
    date: "التاريخ",
    details: "تفاصيل الأرباح",
    net: "صافي التحويل",
    statement: "عرض كشف الحساب",
    bankNote: "هل البيانات البنكية غير صحيحة؟",
    bankLink: "حدّثها قبل التحويل القادم",
  },
  sellerLowStock: {
    subject: "تنبيه: {count} منتجات أوشكت على النفاد",
    subjectOne: "تنبيه: منتج أوشك على النفاد",
    preview: "{count} منتجات أوشكت على النفاد. أعد التخزين لتجنب فقدان الطلبات.",
    pill: "مخزون منخفض",
    heading: "{count} منتجات أوشكت على النفاد",
    headingOne: "منتج أوشك على النفاد",
    lead: "عندما يصل المخزون إلى صفر لا يمكن طلب المنتج. أعد التخزين لتجنّب فقدان الطلبات.",
    remaining: "{count} متبقي",
    outOfStock: "نفد المخزون",
    sold: "بيع {count} هذا الأسبوع",
    update: "تحديث المخزون",
    note: "يمكنك تغيير حد التنبيه لكل منتج من صفحة المنتج في لوحة التحكم.",
  },
  sellerStoreCreated: {
    subject: "متجرك جاهز على طلبي",
    preview: "تم إنشاء متجرك. أكمل 4 خطوات لاستقبال أول طلب.",
    pill: "تم إنشاء المتجر",
    heading: "مبروك، متجرك جاهز",
    lead: "أنشأت {storeName} على طلبي بنجاح. أكمل الخطوات التالية لتبدأ باستقبال الطلبات.",
    storeName: "اسم المتجر",
    storeLink: "رابط المتجر",
    stepsTitle: "ابدأ في 4 خطوات",
    done: "تم",
    steps: [
      ["إنشاء المتجر", "تم"],
      ["أضف أول منتج", "الصور والسعر والمخزون"],
      ["فعّل الشحن", "اختر شركات الشحن ومناطق التوصيل"],
      ["فعّل طرق الدفع", "الدفع عند الاستلام أو الدفع الإلكتروني"],
    ],
    addProduct: "أضف أول منتج",
    design: "خصّص تصميم المتجر",
    helpCenter: "مركز المساعدة",
  },
};
