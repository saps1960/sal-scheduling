import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import axios from 'axios';

const AdminDashboard = ({ token }) => {
  const [shifts, setShifts] = useState([]);
  const [daysoff, setDaysOff] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Fetch shifts
    axios.get('http://localhost:5000/shifts', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => {
      setShifts(response.data.map(shift => ({
        id: shift.id,
        title: `${shift.employee_name} - ${shift.role}`,
        start: shift.start_time,
        end: shift.end_time,
        extendedProps: { is_released: shift.is_released },
      })));
    });

    // Fetch days off
    axios.get('http://localhost:5000/daysoff', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => {
      setDaysOff(response.data.map(dayoff => ({
        title: `${dayoff.employee_name} - Day Off (${dayoff.status})`,
        start: dayoff.date,
        allDay: true,
        color: 'red',
      })));
    });

    // Fetch employees
    axios.get('http://localhost:5000/users', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => setEmployees(response.data));
  }, [token]);

  const handleReleaseSchedule = () => {
    const shiftIds = shifts.map(shift => shift.id);
    axios.post('http://localhost:5000/shifts/release', { shift_ids: shiftIds }, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => alert('Schedule released!'));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={handleReleaseSchedule}
      >
        Release Schedule
      </button>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="timeGridWeek"
        events={[...shifts, ...daysoff]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
      />
    </div>
  );
};

export default AdminDashboard;
