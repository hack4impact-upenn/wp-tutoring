import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <div className="hero">
        <h1>West Philadelphia Tutoring Project</h1>
        <p>
          Apply as a tutor or student. We match tutors with students each semester and try to keep
          pairs together when possible.
        </p>
      </div>
      <div className="cards">
        <div className="card">
          <h2>Tutors</h2>
          <p>Sign up to tutor. Tell us your availability, subjects, and any previous students.</p>
          <Link className="btn" to="/apply/tutor">
            Tutor application
          </Link>
        </div>
        <div className="card">
          <h2>Students</h2>
          <p>Sign up for tutoring. Tell us your grade, subjects you need help with, and any siblings.</p>
          <Link className="btn" to="/apply/student">
            Student application
          </Link>
        </div>
      </div>
      <p style={{ marginTop: '2rem' }}>
        <Link to="/admin">Admin: roster &amp; matching</Link>
      </p>
    </>
  );
}
