import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Register = () => {
  // 1. Add state for githubUsername
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [githubUsername, setGithubUsername] = useState(''); // <--- NEW
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 2. Send githubUsername to the backend
      await api.post('/auth/register', { 
        fullName, 
        email, 
        githubUsername, // <--- NEW
        password 
      });
      
      toast.success('Account created! Please login.');
      navigate('/');
    } catch (error: any) {
      // Improved error handling to show specific backend messages
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           'Registration failed';
      toast.error(errorMessage);
      console.error("Registration Error:", error.response?.data); 
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Create Account</h1>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Full Name Input */}
        <input 
          type="text" 
          placeholder="Full Name" 
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
          required 
          style={{ padding: '10px' }} 
        />

        {/* Email Input */}
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: '10px' }} 
        />

        {/* 3. GitHub Username Input (NEW) */}
        <input 
          type="text" 
          placeholder="GitHub Username (e.g. facebook)" 
          value={githubUsername} 
          onChange={(e) => setGithubUsername(e.target.value)} 
          required 
          style={{ padding: '10px' }} 
        />

        {/* Password Input */}
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '10px' }} 
        />

        <button type="submit" style={{ padding: '10px', background: 'green', color: 'white', border: 'none', cursor: 'pointer' }}>
          Register
        </button>
      </form>
      <p>Already have an account? <Link to="/">Login here</Link></p>
    </div>
  );
};

export default Register;