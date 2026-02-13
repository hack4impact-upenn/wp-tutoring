import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TutorForm() {
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/subjects')
      .then((r) => r.json())
      .then(setSubjects);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const selectedSubjects = [...form.querySelectorAll('input[name="subjects"]:checked')].map(
      (c) => c.value
    );
    const body = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      availability: form.availability.value.trim(),
      subjects: selectedSubjects,
      grade_levels: form.grade_levels.value.trim(),
      previous_student_ids: form.previous_student_ids.value.trim()
        ? form.previous_student_ids.value.trim().split(',').map((s) => s.trim())
        : [],
      preferences: form.preferences.value.trim(),
    };
    setLoading(true);
    setMessage(null);
    fetch('/api/tutors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        setMessage({
          type: data.error ? 'error' : 'success',
          text: data.error || data.message || 'Application submitted.',
        });
        if (!data.error) form.reset();
      })
      .finally(() => setLoading(false));
  }

  return (
    <>
      <h1>Tutor application</h1>
      <p>
        <Link to="/">← Back to home</Link>
      </p>
      <form onSubmit={handleSubmit}>
        <label>Name *</label>
        <input type="text" name="name" required />
        <label>Email *</label>
        <input type="email" name="email" required />
        <label>Phone</label>
        <input type="tel" name="phone" />
        <label>Availability (e.g. Mon 3–5pm, Wed 4–6pm)</label>
        <textarea name="availability" placeholder="When can you tutor?" />
        <label>Subjects you can support</label>
        <div className="checkbox-group">
          {subjects.map((s) => (
            <label key={s}>
              <input type="checkbox" name="subjects" value={s} /> {s}
            </label>
          ))}
        </div>
        <label>Grade levels you can support (e.g. 9, 10, 11, 12)</label>
        <input type="text" name="grade_levels" placeholder="9, 10, 11, 12" />
        <label>Previous student IDs (if you had students last semester, comma-separated)</label>
        <input type="text" name="previous_student_ids" placeholder="e.g. 5, 12, 20" />
        <label>Preferences or constraints</label>
        <textarea name="preferences" placeholder="Any preferences or constraints?" />
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}
    </>
  );
}
