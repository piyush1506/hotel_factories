import React, { useState, useEffect } from 'react';

export default function StatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hrs}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="status-bar">
      <span>{time || '14:00'}</span>
      <div className="punch-hole"></div>
      <div className="status-icons">
        <i className="fa-solid fa-signal"></i>
        <i className="fa-solid fa-wifi"></i>
        <i className="fa-solid fa-battery-three-quarters"></i>
      </div>
    </div>
  );
}
