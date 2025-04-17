import React, { useState } from 'react';
import axios from 'axios';
import AdminDashboard from './AdminDashboard';
import EmployeePortal from './EmployeePortal';

const App = () => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    axios.post('http://localhost:5000/auth/login', { email, password })
      .then(response => {
        setToken(response.data.token);
        setRole(response.data.role);
      })
      .catch(() => alert('Login failed'));
  };

  if (!token) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Business Scheduling</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border p-2 mb-2 w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border p-2 mb-2 w-full"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div>
      {role === 'admin' ? <AdminDashboard token={token} /> : <EmployeePortal token={token} />}
    </div>
  );
};

export default App;
