import React from 'react';

const BrewNestLogo = ({ className = "h-9 w-auto", showTagline = true, light = false }) => (
  <div className="flex items-center gap-2.5 cursor-pointer select-none">
    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#53301B] to-[#2B170B] shadow-md border border-[#C87D32]/30">
      <svg viewBox="0 0 40 40" className="w-6 h-6 fill-none stroke-current text-[#EBD9C8]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 18h16a1 1 0 0 1 1 1v6a8 8 0 0 1-8 8h0a8 8 0 0 1-8-8v-6a1 1 0 0 1 1-1z" fill="#432514" stroke="#DDA15E" />
        <path d="M27 21h2a3 3 0 0 1 0 6h-2" stroke="#DDA15E" />
        <path d="M14 14c0-3 3-3 3-6" stroke="#588157" strokeWidth="2.2" />
        <path d="M20 15c0-4 4-4 4-8" stroke="#DDA15E" strokeWidth="2.2" />
        <path d="M17 25c2-2 4-1 5 1" stroke="#F5EBE1" strokeWidth="1.5" />
      </svg>
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#588157] rounded-full border border-white flex items-center justify-center">
        <span className="w-1.5 h-1.5 bg-[#A3B18A] rounded-full"></span>
      </span>
    </div>
    <div className="flex flex-col">
      <div className="flex items-center leading-none">
        <span className={`text-2xl font-serif font-black tracking-tight ${light ? 'text-white' : 'text-[#2B170B]'}`}>Brew</span>
        <span className="text-2xl font-serif font-bold text-[#C87D32]">Nest</span>
      </div>
      {showTagline && (
        <span className={`text-[9.5px] uppercase tracking-widest font-medium ${light ? 'text-[#EBD9C8]/80' : 'text-[#7D5A44]'}`}>
          For Coffee &amp; Tea Lovers
        </span>
      )}
    </div>
  </div>
);

export default BrewNestLogo;
