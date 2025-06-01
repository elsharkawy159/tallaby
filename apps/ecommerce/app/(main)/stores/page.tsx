import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { MapPin, Phone, Clock, Search, Navigation, Star } from "lucide-react";
import Link from "next/link";

const Stores = () => {
  const stores = [
    {
      id: "1",
      name: "Stylist Manhattan",
      address: "123 Fifth Avenue, New York, NY 10011",
      phone: "+1 (555) 123-4567",
      hours: "Mon-Sat 10AM-9PM, Sun 11AM-7PM",
      rating: 4.8,
      reviews: 324,
      services: ["Personal Shopping", "Alterations", "Gift Wrapping"],
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
    },
    {
      id: "2",
      name: "Stylist Brooklyn",
      address: "456 Atlantic Avenue, Brooklyn, NY 11217",
      phone: "+1 (555) 987-6543",
      hours: "Mon-Sat 10AM-8PM, Sun 12PM-6PM",
      rating: 4.7,
      reviews: 198,
      services: ["Personal Shopping", "Style Consultation", "Gift Wrapping"],
      image:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
    },
    {
      id: "3",
      name: "Stylist SoHo",
      address: "789 Broadway, New York, NY 10003",
      phone: "+1 (555) 456-7890",
      hours: "Mon-Sat 10AM-10PM, Sun 11AM-8PM",
      rating: 4.9,
      reviews: 567,
      services: [
        "Personal Shopping",
        "VIP Services",
        "Alterations",
        "Gift Wrapping",
      ],
      image:
        "https://images.unsplash.com/photo-1555529902-ce6a90a3b9aa?w=400&h=300&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Our Stores
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Visit us in person for personalized shopping experiences and
              expert styling advice
            </p>

            {/* Store Locator */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Enter your location..."
                  className="pl-10 py-3 text-lg bg-white text-gray-900"
                />
                <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-secondary text-black hover:bg-secondary/90">
                  <Navigation className="h-4 w-4 mr-2" />
                  Find Stores
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Store Listings */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Locations</h2>
              <p className="text-gray-600">
                Experience our products and services at these premium locations
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {stores.map((store) => (
                <Card
                  key={store.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={store.image}
                      alt={store.name}
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="absolute top-4 right-4 bg-white text-primary">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      {store.rating}
                    </Badge>
                  </div>

                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {store.name}
                      <Badge variant="secondary">{store.reviews} reviews</Badge>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <p className="text-gray-600">{store.address}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Phone className="h-5 w-5 text-primary" />
                      <p className="text-gray-600">{store.phone}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <p className="text-gray-600 text-sm">{store.hours}</p>
                    </div>

                    <div>
                      <p className="font-medium mb-2">Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {store.services.map((service, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button className="flex-1">Get Directions</Button>
                      <Button variant="outline" className="flex-1">
                        Call Store
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">In-Store Services</h2>
              <p className="text-gray-600">
                Exclusive services available at our physical locations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-white rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold mb-2">Personal Shopping</h3>
                <p className="text-sm text-gray-600">
                  Expert stylists help you find the perfect outfit
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold mb-2">Alterations</h3>
                <p className="text-sm text-gray-600">
                  Professional tailoring for the perfect fit
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold mb-2">Style Consultation</h3>
                <p className="text-sm text-gray-600">
                  Personalized advice from fashion experts
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold mb-2">VIP Services</h3>
                <p className="text-sm text-gray-600">
                  Exclusive shopping experiences and events
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Visit Us Today</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Experience our premium shopping environment and exceptional
              customer service
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-secondary text-black hover:bg-secondary/90"
              >
                Book Appointment
              </Button>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Stores;
