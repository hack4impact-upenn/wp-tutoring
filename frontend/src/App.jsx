import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import TutorForm from './pages/TutorForm';
import StudentForm from './pages/StudentForm';
import Admin from './pages/Admin';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply/tutor" element={<TutorForm />} />
        <Route path="/apply/student" element={<StudentForm />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  );
}
