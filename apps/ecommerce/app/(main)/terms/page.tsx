import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb customLabels={{ terms: "Terms & Conditions" }} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Terms and Conditions</h1>
            <p className="text-gray-600">Last updated: January 1, 2024</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Agreement to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600">
                By accessing and using this website, you accept and agree to be
                bound by the terms and provision of this agreement. If you do
                not agree to abide by the above, please do not use this service.
              </p>

              <Separator />

              <div className="space-y-6">
                <section>
                  <h3 className="text-xl font-bold mb-3">1. Use License</h3>
                  <p className="text-gray-600 mb-3">
                    Permission is granted to temporarily download one copy of
                    the materials on our website for personal, non-commercial
                    transitory viewing only. This is the grant of a license, not
                    a transfer of title, and under this license you may not:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                    <li>modify or copy the materials</li>
                    <li>
                      use the materials for any commercial purpose or for any
                      public display
                    </li>
                    <li>
                      attempt to reverse engineer any software contained on our
                      website
                    </li>
                    <li>
                      remove any copyright or other proprietary notations from
                      the materials
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-3">2. Account Terms</h3>
                  <p className="text-gray-600 mb-3">
                    When you create an account with us, you must provide
                    information that is accurate, complete, and current at all
                    times. You are responsible for safeguarding the password and
                    for maintaining the security of your account.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                    <li>
                      You must be at least 18 years old to use our service
                    </li>
                    <li>
                      You are responsible for all activities that occur under
                      your account
                    </li>
                    <li>
                      You must immediately notify us of any unauthorized uses of
                      your account
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-3">3. Purchase Terms</h3>
                  <p className="text-gray-600 mb-3">
                    All purchases are subject to product availability. We
                    reserve the right to discontinue any product at any time.
                    All prices are subject to change without notice.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                    <li>Payment must be received before product shipment</li>
                    <li>We accept major credit cards and PayPal</li>
                    <li>Orders are processed within 1-2 business days</li>
                    <li>Shipping costs are calculated at checkout</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-3">
                    4. Returns and Refunds
                  </h3>
                  <p className="text-gray-600 mb-3">
                    We offer a 30-day return policy for most items. Items must
                    be returned in original condition with all packaging and
                    tags attached.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                    <li>Refunds will be processed within 5-10 business days</li>
                    <li>Original shipping costs are non-refundable</li>
                    <li>Customer is responsible for return shipping costs</li>
                    <li>Some items may not be eligible for return</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-3">5. Privacy Policy</h3>
                  <p className="text-gray-600">
                    Your privacy is important to us. Our Privacy Policy explains
                    how we collect, use, and protect your information when you
                    use our service. By using our service, you agree to the
                    collection and use of information in accordance with our
                    Privacy Policy.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-3">6. Prohibited Uses</h3>
                  <p className="text-gray-600 mb-3">
                    You may not use our service for any unlawful purpose or to
                    solicit others to perform unlawful acts. You may not violate
                    any international, federal, provincial, or state
                    regulations, rules, or laws.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                    <li>
                      Transmit any worms, viruses, or any code of a destructive
                      nature
                    </li>
                    <li>
                      Infringe upon or violate our intellectual property rights
                    </li>
                    <li>
                      Harass, abuse, insult, harm, defame, slander, disparage,
                      intimidate, or discriminate
                    </li>
                    <li>Submit false or misleading information</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-3">7. Disclaimer</h3>
                  <p className="text-gray-600">
                    The materials on our website are provided on an 'as is'
                    basis. We make no warranties, expressed or implied, and
                    hereby disclaim and negate all other warranties including
                    without limitation, implied warranties or conditions of
                    merchantability, fitness for a particular purpose, or
                    non-infringement of intellectual property or other violation
                    of rights.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-3">8. Limitations</h3>
                  <p className="text-gray-600">
                    In no event shall our company or its suppliers be liable for
                    any damages (including, without limitation, damages for loss
                    of data or profit, or due to business interruption) arising
                    out of the use or inability to use the materials on our
                    website, even if we or our authorized representative has
                    been notified orally or in writing of the possibility of
                    such damage.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-3">9. Governing Law</h3>
                  <p className="text-gray-600">
                    These terms and conditions are governed by and construed in
                    accordance with the laws of the United States and you
                    irrevocably submit to the exclusive jurisdiction of the
                    courts in that State or location.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-3">
                    10. Changes to Terms
                  </h3>
                  <p className="text-gray-600">
                    We reserve the right, at our sole discretion, to modify or
                    replace these Terms at any time. If a revision is material,
                    we will try to provide at least 30 days notice prior to any
                    new terms taking effect.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-3">
                    Contact Information
                  </h3>
                  <p className="text-gray-600">
                    If you have any questions about these Terms and Conditions,
                    please contact us at:
                  </p>
                  <div className="mt-3 text-gray-600">
                    <p>Email: legal@tallaby.com</p>
                    <p>Phone: +1 (555) 123-4567</p>
                    <p>
                      Address: 123 Fifth Avenue, Suite 100, New York, NY 10011
                    </p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Terms;
