import { Mail, Instagram, Facebook, MapPin } from 'lucide-react';

export function ContactPage() {
  return (
    <div className="min-h-screen">
      <section className="py-12 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-16 text-center">
              Contact Us
            </h1>

            <div className="space-y-10">
              {/* General Email */}
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    General Email
                  </h3>
                  <a
                    href="mailto:wptp@pobox.upenn.edu"
                    className="text-lg text-primary hover:underline"
                  >
                    wptp@pobox.upenn.edu
                  </a>
                </div>
              </div>

              {/* Operations Email */}
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Switch/Drop/Match Email
                  </h3>
                  <a
                    href="mailto:wptpoperations@gmail.com"
                    className="text-lg text-primary hover:underline break-all"
                  >
                    wptpoperations@gmail.com
                  </a>
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-start gap-4">
                <Instagram className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Instagram
                  </h3>
                  <a
                    href="https://instagram.com/wptp.upenn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg text-primary hover:underline"
                  >
                    @wptp.upenn
                  </a>
                </div>
              </div>

              {/* Facebook */}
              <div className="flex items-start gap-4">
                <Facebook className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Facebook
                  </h3>
                  <a
                    href="https://facebook.com/wptp.upenn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg text-primary hover:underline"
                  >
                    @wptp.upenn
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Civic House Address
                  </h3>
                  <p className="text-lg text-foreground/80">
                    3914 Locust Walk
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Message */}
            <div className="mt-16 text-center">
              <p className="text-lg text-foreground/70">
                Have questions? Feel free to reach out to us through any of the channels above. 
                We're here to help and would love to hear from you!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
