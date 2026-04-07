import { PhotoSlideshow } from './PhotoSlideshow';

export function WhatWeDo() {
  return (
    <section id="what-we-do" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
            What We Do
          </h2>
          <p className="text-lg text-foreground/70">
            The West Philadelphia Tutoring Project offers free tutoring services to local K-12 students through Civic House at the University of Pennsylvania!
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Text Content */}
          <div>
            <h3 className="text-2xl font-semibold text-primary mb-6">
              Why WPTP?
            </h3>
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                <p className="text-lg text-foreground/80">
                  1-1 weekly tutoring with a Penn student
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                <p className="text-lg text-foreground/80">
                  Sessions Sunday through Thursday in the fall and spring
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                <p className="text-lg text-foreground/80">
                  Virtual and in-person options
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                <p className="text-lg text-foreground/80">
                  Tutoring available for all grade levels and subjects
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                <p className="text-lg text-foreground/80">
                  Test prep offered
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                <p className="text-lg text-foreground/80">
                  Family friendly social events
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                <p className="text-lg text-foreground/80">
                  Completely free of charge
                </p>
              </div>
            </div>
          </div>

          {/* Photo Slideshow */}
          <div className="h-[500px]">
            <PhotoSlideshow />
          </div>
        </div>
      </div>
    </section>
  );
}
