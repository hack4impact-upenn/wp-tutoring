import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function StudentForm() {
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
    const subjectsNeeded = [...form.querySelectorAll('input[name="subjects_needed"]:checked')].map(
      (c) => c.value
    );
    const body = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      grade_level: form.grade_level.value || null,
      subjects_needed: subjectsNeeded,
      sibling_ids: form.sibling_ids.value.trim()
        ? form.sibling_ids.value.trim().split(',').map((s) => s.trim())
        : [],
      previous_tutor_id: form.previous_tutor_id.value || null,
      availability: form.availability.value.trim(),
      constraints: form.constraints.value.trim(),
    };
    setLoading(true);
    setMessage(null);
    fetch('/api/students', {
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
      <h1>Student application</h1>
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
        <label>Grade level</label>
        <input type="number" name="grade_level" min={1} max={12} placeholder="e.g. 10" />
        <label>Subjects needing support</label>
        <div className="checkbox-group">
          {subjects.map((s) => (
            <label key={s}>
              <input type="checkbox" name="subjects_needed" value={s} /> {s}
            </label>
          ))}
        </div>
        <label>Sibling student IDs (if siblings are also applying, comma-separated)</label>
        <input type="text" name="sibling_ids" placeholder="e.g. 3, 7" />
        <label>Previous tutor ID (if you had a tutor last semester)</label>
        <input type="number" name="previous_tutor_id" min={1} placeholder="e.g. 5" />
        <label>Availability or constraints</label>
        <textarea name="availability" placeholder="When can you meet? Any constraints?" />
        <label>Other constraints</label>
        <textarea name="constraints" placeholder="Anything else we should know?" />
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
