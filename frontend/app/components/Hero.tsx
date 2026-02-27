import { Button } from './ui/button';
import { useNavigate } from 'react-router';

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1629360035258-2ccb13aa3679?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dXRvciUyMHN0dWRlbnQlMjBsZWFybmluZyUyMHRvZ2V0aGVyfGVufDF8fHx8MTc3MTU0NjMyMXww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Tutor and student learning together"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">University of Pennsylvania Tutoring and Mentoring</h1>
          <p className="text-xl lg:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
            Connecting West Philadelphia students with dedicated tutors to build brighter futures together.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg cursor-pointer"
              onClick={() => navigate('/apply/tutee')}
            >
              Apply as Tutee
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white hover:text-primary px-8 py-6 text-lg cursor-pointer"
              onClick={() => navigate('/apply/tutor')}
            >
              Apply as Tutor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}