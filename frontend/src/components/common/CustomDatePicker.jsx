import React, { useState, useRef, useEffect } from "react";
import "./datepicker.css";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CustomDatePicker({ value, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(value || new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date(value || new Date()));
  const pickerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (day) => {
    setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  };

  const handleConfirm = () => {
    onChange(selectedDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = 
        selectedDate.getDate() === d && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;
      
      const isToday = 
        new Date().getDate() === d && 
        new Date().getMonth() === month && 
        new Date().getFullYear() === year;

      days.push(
        <div 
          key={d} 
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}`}
          onClick={() => handleSelectDay(d)}
        >
          {d}
        </div>
      );
    }
    return days;
  };

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  return (
    <div className="custom-datepicker-container" ref={pickerRef}>
      <label className="datepicker-label">{label}</label>
      <div className="datepicker-input" onClick={() => setIsOpen(!isOpen)}>
        {value || "Select Date"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>

      {isOpen && (
        <div className="calendar-modal">
          {/* Header - Purple */}
          <div className="calendar-header">
            <span className="header-label">SELECT DATE</span>
            <div className="header-date">
              {formattedDate}
              <svg viewBox="0 0 24 24" fill="currentColor" className="edit-icon"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </div>
          </div>

          {/* Controls */}
          <div className="calendar-body">
            <div className="calendar-controls">
              <span className="month-year">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                <svg viewBox="0 0 24 24" fill="currentColor" width="16"><path d="M7 10l5 5 5-5z"/></svg>
              </span>
              <div className="nav-arrows">
                <button onClick={handlePrevMonth}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button onClick={handleNextMonth}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="calendar-weekdays">
              {DAYS.map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="calendar-grid">
              {renderDays()}
            </div>
          </div>

          {/* Footer */}
          <div className="calendar-footer">
            <button onClick={() => setIsOpen(false)}>CANCEL</button>
            <button onClick={handleConfirm}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
