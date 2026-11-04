// School details in one place. Change them here and they change on the
// landing page, the fee slip, the admission slip and the printed reports.
import React from "react";

export const SCHOOL = {
  name: " Lunar Public School",
  shortName: " Lunar Public School",
  city: "Skardu, Gilgit-Baltistan",
  tagline: "Teaching children of this valley since 1974.",
  address: "Thowar Bala, Rondu Gilgit-Baltistan",
  phone: "+92 5815 920011",
  email: "office@modelschool.edu.pk",
  hours: "Monday to Saturday, 8am to 2pm",
  classesRange: "Nursery to Class 10",
};

// A simple drawn crest, so there is no image file to lose.
export function Crest({ className = "" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <path
        d="M20 3 L35 9 V21 C35 29 28 35 20 37 C12 35 5 29 5 21 V9 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path d="M12 17 L20 13 L28 17 L20 21 Z" fill="currentColor" />
      <path d="M15 21 V26 C15 26 17 28 20 28 C23 28 25 26 25 26 V21" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
