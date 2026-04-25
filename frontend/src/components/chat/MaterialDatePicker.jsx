import React, { useState, useEffect } from "react";
import "./MaterialDatePicker.css";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MaterialDatePicker({ value, onChange, onClose }) {
  const initialDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const onDateClick = (d) => {
    const newDate = new Date(year, month, d);
    setSelectedDate(newDate);
  };

  const handleOk = () => {
    const offset = selectedDate.getTimezoneOffset();
    const adjusted = new Date(selectedDate.getTime() - (offset * 60 * 1000));
    onChange(adjusted.toISOString().split('T')[0]);
    onClose();
  };

  const formatDateHeader = (date) => {
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
    const dateNum = date.getDate();
    return `${day}, ${monthStr} ${dateNum}`;
  };

  return (
    <div className="md-overlay" onClick={onClose}>
      <div className="md-container" onClick={e => e.stopPropagation()}>
        
        <div className="md-header">
          <span className="md-header-label">SELECT DATE</span>
          <div className="md-header-main">
            <span className="md-header-date">{formatDateHeader(selectedDate)}</span>
            <span className="md-header-edit">✎</span>
          </div>
        </div>

        <div className="md-body">
          <div className="md-controls">
            <div className="md-month-year">
              {MONTHS[month]} {year} ▾
            </div>
            <div className="md-arrows">
              <button onClick={handlePrevMonth}>‹</button>
              <button onClick={handleNextMonth}>›</button>
            </div>
          </div>

          <div className="md-calendar-grid">
            {DAYS.map(d => <div key={d} className="md-day-name">{d}</div>)}
            {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const d = i + 1;
              const isSelected = selectedDate.getDate() === d && 
                               selectedDate.getMonth() === month && 
                               selectedDate.getFullYear() === year;
              const isToday = new Date().getDate() === d && 
                             new Date().getMonth() === month && 
                             new Date().getFullYear() === year;
              
              return (
                <div 
                  key={d} 
                  className={`md-date-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => onDateClick(d)}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>

        <div className="md-actions">
          <button className="md-btn-flat" onClick={onClose}>CANCEL</button>
          <button className="md-btn-flat ok" onClick={handleOk}>OK</button>
        </div>
      </div>
    </div>
  );
}
