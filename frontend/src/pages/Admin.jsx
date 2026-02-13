import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function currentSemester() {
  return (
    new Date().getFullYear() + '-S' + (new Date().getMonth() >= 6 ? '2' : '1')
  );
}

export default function Admin() {
  const [assignments, setAssignments] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [overrideMessage, setOverrideMessage] = useState(null);
  const semester = currentSemester();

  function loadRoster() {
    fetch(`/api/assignments?semester=${encodeURIComponent(semester)}`)
      .then((r) => r.json())
      .then(setAssignments);
  }

  function loadOptions() {
    Promise.all([
      fetch('/api/tutors').then((r) => r.json()),
      fetch('/api/students').then((r) => r.json()),
      fetch('/api/sections').then((r) => r.json()),
    ]).then(([t, s, sec]) => {
      setTutors(t);
      setStudents(s);
      setSections(sec);
    });
  }

  useEffect(() => {
    loadRoster();
    loadOptions();
  }, []);

  function handleRunMatching() {
    setMatchResult('Running…');
    fetch('/api/run-matching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ semester }),
    })
      .then((r) => r.json())
      .then((data) => {
        setMatchResult(
          <div className="message success">
            Matched {data.assignmentsCount} pairs. Unassigned tutors: {data.unassignedTutors},
            unassigned students: {data.unassignedStudents}.
            {data.log?.length > 0 && (
              <div className="log">{data.log.join('\n')}</div>
            )}
          </div>
        );
        loadRoster();
      })
      .catch(() => setMatchResult(<div className="message error">Failed to run matching.</div>));
  }

  function handleOverride(e) {
    e.preventDefault();
    const form = e.target;
    const student_id = form.student_id.value;
    const tutor_id = form.tutor_id.value;
    if (!student_id || !tutor_id) {
      setOverrideMessage(<span className="message error">Pick a student and a tutor.</span>);
      return;
    }
    setOverrideMessage(null);
    fetch('/api/assignments/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: parseInt(student_id, 10),
        tutor_id: parseInt(tutor_id, 10),
        section_id: form.section_id.value || null,
        semester,
      }),
    })
      .then((r) => {
        if (r.ok) {
          setOverrideMessage(<span className="message success">Override applied.</span>);
          loadRoster();
        } else {
          setOverrideMessage(<span className="message error">Failed.</span>);
        }
      })
      .catch(() => setOverrideMessage(<span className="message error">Failed.</span>));
  }

  return (
    <>
      <h1>Admin: Roster &amp; matching</h1>
      <p>
        <Link to="/">← Back to home</Link>
      </p>
      <div className="admin-actions">
        <button type="button" onClick={handleRunMatching}>
          Run matching
        </button>
        <button type="button" onClick={loadRoster}>
          Refresh roster
        </button>
      </div>
      {matchResult && <div id="matchResult">{matchResult}</div>}
      <h2>Current roster</h2>
      <div id="roster">
        {assignments.length === 0 ? (
          <p>No assignments yet. Run matching to generate a roster.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tutor</th>
                <th>Student</th>
                <th>Section</th>
                <th>Override?</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.tutor_name} ({a.tutor_email})
                  </td>
                  <td>
                    {a.student_name} ({a.student_email})
                  </td>
                  <td>{a.section_id ?? '—'}</td>
                  <td>{a.manual_override ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <h2>Manual override</h2>
      <p>Reassign a student to a different tutor. This will replace their current assignment for this semester.</p>
      <form onSubmit={handleOverride}>
        <label>Student</label>
        <select name="student_id">
          <option value="">—</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <label>Tutor</label>
        <select name="tutor_id">
          <option value="">—</option>
          {tutors.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label>Section (optional)</label>
        <select name="section_id">
          <option value="">—</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button type="submit">Apply override</button>
      </form>
      {overrideMessage}
    </>
  );
}
