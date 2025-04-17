import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeePortal = ({ token }) => {
  const [shifts, setShifts] = useState([]);
  const [dayOffDate, setDayOffDate] = useState('');

  useEffect(() => {
    // Fetch shifts
    axios.get('http://localhost:5000/shifts', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => setShifts(response.data));
  }, [token]);

  const handleRequestDayOff = () => {
    axios.post('http://localhost:5000/daysoff', { date: dayOffDate }, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      alert('Day off requested!');
      setDayOffDate('');
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Employee Portal</h1>
      <div className="mb-4">
        <h2 className="text-xl">Request Day Off</h2>
        <input
          type="date"
          value={dayOffDate}
          onChange={e => setDayOffDate(e.target.value)}
          className="border p-2 mr-2"
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleRequestDayOff}
        >
          Submit
        </button>
      </div>
      <h2 className="text-xl mb-2">Your Shifts</h2>
      <ul>
        {shifts.map(shift => (
          <li key={shift.id}>
            {shift.start_time} - {shift.end_time} ({shift.role})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EmployeePortal;
