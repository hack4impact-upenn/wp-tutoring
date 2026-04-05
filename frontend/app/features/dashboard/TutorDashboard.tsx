import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';

export function TutorDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    school: '',
    major: '',
    year: '',
    subjects: '',
    availability: '',
    experience: '',
    clearances: '',
    additionalInfo: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save to localStorage
    const submissions = JSON.parse(localStorage.getItem('wptp_tutor_submissions') || '[]');
    submissions.push({
      userId: user?.id,
      userName: user?.name,
      userEmail: user?.email,
      ...formData,
      submittedAt: new Date().toISOString(),
    });
    localStorage.setItem('wptp_tutor_submissions', JSON.stringify(submissions));

    setSubmitted(true);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  if (submitted) {
    return (
      <div className="pt-20 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-primary/10 rounded-lg p-8 mb-6">
              <h1 className="text-3xl font-bold text-primary mb-4">
                Application Submitted!
              </h1>
              <p className="text-lg text-foreground/80">
                Thank you for applying to be a tutor with West Philly Tutoring. We'll review your application and contact you soon about next steps and orientation.
              </p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary">Tutor Application</h1>
              <p className="text-foreground/70 mt-2">Welcome, {user?.name}!</p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Sign Out
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg border border-border p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-foreground">School/University</label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., University of Pennsylvania"
                />
              </div>

              <div>
                <label className="block mb-2 text-foreground">Year</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select year</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Graduate">Graduate Student</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-foreground">Major/Field of Study</label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your major"
              />
            </div>

            <div>
              <label className="block mb-2 text-foreground">Subjects You Can Tutor</label>
              <input
                type="text"
                value={formData.subjects}
                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Math, English, Science, SAT Prep"
              />
            </div>

            <div>
              <label className="block mb-2 text-foreground">Availability</label>
              <textarea
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Please list your weekly availability (e.g., Mondays 4-6pm, Wednesdays 3-5pm)"
              />
            </div>

            <div>
              <label className="block mb-2 text-foreground">Previous Tutoring/Teaching Experience</label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe any relevant experience..."
              />
            </div>

            <div>
              <label className="block mb-2 text-foreground">Background Clearances Status</label>
              <select
                value={formData.clearances}
                onChange={(e) => setFormData({ ...formData, clearances: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select status</option>
                <option value="completed">Already Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="not-started">Not Started (will complete if accepted)</option>
              </select>
              <p className="text-sm text-foreground/60 mt-2">
                All tutors must complete FBI and Pennsylvania clearances before beginning.
              </p>
            </div>

            <div>
              <label className="block mb-2 text-foreground">Additional Information</label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Anything else you'd like us to know..."
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Submit Application
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
