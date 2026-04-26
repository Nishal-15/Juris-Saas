import { useState } from "react";
import "./DatePicker.css";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function DatePicker({ value, onChange, label = "Select Date" }) {
  const today = new Date();
  const parsed = value ? new Date(value) : null;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());
  const [tempDate, setTempDate] = useState(parsed);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day) => {
    setTempDate(new Date(viewYear, viewMonth, day));
  };

  const handleOk = () => {
    if (tempDate) {
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      onChange(dateStr);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setTempDate(parsed);
    setOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const displayValue = parsed
    ? parsed.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    : "Not set";

  const headerDisplay = tempDate
    ? tempDate.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })
    : "Select a date";

  return (
    <div className="dp-wrapper">
      <label className="cd-label">{label}</label>
      <button className="dp-trigger" onClick={() => setOpen(true)} type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        {displayValue}
      </button>

      {open && (
        <div className="dp-overlay" onClick={handleCancel}>
          <div className="dp-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="dp-header">
              <span className="dp-header-label">SELECT DATE</span>
              <span className="dp-header-date">{headerDisplay}</span>
            </div>

            {/* Calendar Body */}
            <div className="dp-body">
              <div className="dp-nav">
                <span className="dp-month-label">{MONTHS[viewMonth]} {viewYear}</span>
                <div className="dp-nav-btns">
                  <button className="dp-nav-btn" onClick={prevMonth} type="button">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  <button className="dp-nav-btn" onClick={nextMonth} type="button">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="dp-grid">
                {DAYS.map(d => <div key={d} className="dp-day-name">{d}</div>)}

                {/* Empty leading cells */}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const thisDate = new Date(viewYear, viewMonth, day);
                  const isToday = thisDate.toDateString() === today.toDateString();
                  const isSelected = tempDate && thisDate.toDateString() === tempDate.toDateString();
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={`dp-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="dp-footer">
              <button className="dp-btn-cancel" onClick={handleCancel} type="button">CANCEL</button>
              <button className="dp-btn-ok" onClick={handleOk} type="button">OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
