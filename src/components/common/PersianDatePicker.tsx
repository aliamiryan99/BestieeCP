"use client";

import React from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/colors/yellow.css";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";

interface PersianDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
}

export default function PersianDatePicker({ 
  value, 
  onChange, 
  placeholder, 
  label, 
  icon 
}: PersianDatePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
          {icon}
          {label}
        </label>
      )}
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-2 py-0.5 focus-within:border-amber-500/40 focus-within:bg-white/8 transition-colors">
        {!label && icon && <span className="mr-3">{icon}</span>}
        <DatePicker
          calendar={persian}
          locale={persian_fa}
          value={value}
          onChange={(date: DateObject | null) => {
            if (date) {
              onChange(date.format("YYYY/MM/DD"));
            } else {
              onChange("");
            }
          }}
          calendarPosition="bottom-right"
          inputClass="w-full bg-transparent text-sm text-white outline-none text-left placeholder:text-white/20 cursor-pointer py-3 px-2"
          containerClassName="w-full"
          className="bg-dark yellow"
          placeholder={placeholder}
          style={{
            backgroundColor: "transparent",
            border: "none",
            width: "100%",
            boxShadow: "none"
          }}
          digits={["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]}
        />
      </div>
    </div>
  );
}
