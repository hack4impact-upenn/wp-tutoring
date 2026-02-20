import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';

export function StudentDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    grade: '',
    school: '',
    subjects: '',
    availability: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    additionalInfo: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage
    const submissions = JSON.parse(localStorage.getItem('wptp_student_submissions') || '[]');
    submissions.push({
      userId: user?.id,
      userName: user?.name,
      userEmail: user?.email,
      ...formData,
      submittedAt: new Date().toISOString(),
    });
    localStorage.setItem('wptp_student_submissions', JSON.stringify(submissions));
    
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
                Thank you for your interest in West Philly Tutoring. We've received your application and will contact you soon.
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
              <h1 className="text-3xl font-bold text-primary">Student Application</h1>
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
                <label className="block mb-2 text-foreground">Grade Level</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select grade</option>
                  {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-foreground">School Name</label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter school name"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-foreground">Subjects Needed Help With</label>
              <input
                type="text"
                value={formData.subjects}
                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Math, Reading, Science"
              />
            </div>

            <div>
              <label className="block mb-2 text-foreground">Preferred Availability</label>
              <textarea
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Weekdays after 4pm, Saturdays mornings"
              />
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-xl font-semibold text-primary mb-4">Parent/Guardian Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-foreground">Parent/Guardian Name</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter parent/guardian name"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-foreground">Parent/Guardian Email</label>
                    <input
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter email"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-foreground">Parent/Guardian Phone</label>
                    <input
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-foreground">Additional Information</label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Any additional information you'd like us to know..."
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
