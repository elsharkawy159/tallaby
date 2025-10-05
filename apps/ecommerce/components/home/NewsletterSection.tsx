import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Mail } from "lucide-react";

const NewsletterSection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="bg-white/10 backdrop-blur-sm w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Mail className="h-10 w-10 text-white" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Stay in the Loop
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new
            arrivals, exclusive deals, and special offers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
            />
            <Button className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-8 whitespace-nowrap">
              Subscribe
            </Button>
          </div>

          <p className="text-sm text-white/70">
            Join 50,000+ subscribers. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
