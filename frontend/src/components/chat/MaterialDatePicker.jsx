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
  const [showYearPicker, setShowYearPicker] = useState(false);

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
            <div className="md-month-year" onClick={() => setShowYearPicker(!showYearPicker)} style={{ cursor: 'pointer' }}>
              {MONTHS[month]} {year} {showYearPicker ? '▴' : '▾'}
            </div>
            <div className="md-arrows">
              <button onClick={handlePrevMonth} disabled={showYearPicker}>‹</button>
              <button onClick={handleNextMonth} disabled={showYearPicker}>›</button>
            </div>
          </div>

          {showYearPicker ? (
            <div className="md-year-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', 
              maxHeight: '220px', overflowY: 'auto', padding: '10px 5px'
            }}>
              {Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - 100 + i).reverse().map(y => (
                <div 
                  key={y}
                  onClick={() => {
                    setViewDate(new Date(y, month, 1));
                    setShowYearPicker(false);
                  }}
                  style={{
                    padding: '8px 0', textAlign: 'center', borderRadius: '8px', cursor: 'pointer',
                    background: y === year ? 'var(--gold)' : 'transparent',
                    color: y === year ? '#0f111a' : '#e2e8f0',
                    fontWeight: y === year ? '800' : '500',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                  onMouseEnter={(e) => { if (y !== year) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={(e) => { if (y !== year) e.currentTarget.style.background = 'transparent' }}
                >
                  {y}
                </div>
              ))}
            </div>
          ) : (
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
          )}
        </div>

        <div className="md-actions">
          <button className="md-btn-flat" onClick={onClose}>CANCEL</button>
          <button className="md-btn-flat ok" onClick={handleOk}>OK</button>
        </div>
      </div>
    </div>
  );
}
