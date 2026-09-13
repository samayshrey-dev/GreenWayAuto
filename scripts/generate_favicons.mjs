import fs from "node:fs";

// Candidate 1: Garage Bay Roof + High-Performance Car Front + Glowing Teal Headlights
const svgCarGarage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="7" fill="#131d22" />
  <rect x="1" y="1" width="30" height="30" rx="6" fill="none" stroke="#283d46" stroke-width="1" />
  <rect x="2" y="2" width="28" height="28" rx="5" fill="none" stroke="#327d94" stroke-width="0.8" stroke-opacity="0.6" />

  <!-- Garage Bay Roof Structure -->
  <path d="M6 10 L16 4.5 L26 10" stroke="#48a9c5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Sports Car Windshield & Roof -->
  <path d="M12 15 L14 11 L18 11 L20 15 Z" fill="#19282e" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" />

  <!-- Sports Car Hood & Body in Crisp White -->
  <path d="M8 17.5 C8 15.5 10 15 12 15 L20 15 C22 15 24 15.5 24 17.5 L25.5 22.5 C25.5 24 24 24.5 23 24.5 L9 24.5 C8 24.5 6.5 24 6.5 22.5 Z" fill="#ffffff" />

  <!-- Twin Glowing LED Headlights (Vibrant Teal) -->
  <polygon points="8.5,18.5 12,19.2 11.5,21 8,20.2" fill="#38bdf8" />
  <polygon points="23.5,18.5 20,19.2 20.5,21 24,20.2" fill="#38bdf8" />

  <!-- Center Grille -->
  <rect x="13" y="21.5" width="6" height="2" rx="0.8" fill="#131d22" />

  <!-- Aerodynamic Front Splitter -->
  <path d="M6 25.5 L26 25.5" stroke="#327d94" stroke-width="1.8" stroke-linecap="round" />
</svg>`;

// Candidate 2: Bold Automotive "EG" High-Velocity Racing Monogram
const svgEGMonogram = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="7" fill="#131d22" />
  <rect x="1" y="1" width="30" height="30" rx="6" fill="none" stroke="#283d46" stroke-width="1" />
  <rect x="2" y="2" width="28" height="28" rx="5" fill="none" stroke="#327d94" stroke-width="0.8" stroke-opacity="0.6" />

  <!-- Bold 'E' Speed Blades in Crisp White -->
  <path d="M7 8 H15 V11.5 H10.5 V14 H14 V17.5 H10.5 V20.5 H15 V24 H7 Z" fill="#ffffff" />

  <!-- Bold 'G' Racing Turbine in Electric Teal -->
  <path d="M17 11.5 C17 9.5 18.5 8 21 8 H24.5 V11.5 H21 C20 11.5 19.5 12 19.5 13 V19 C19.5 20 20 20.5 21 20.5 H22 V17.5 H20 V14.5 H24.5 V24 H21 C18.5 24 17 22.5 17 20.5 Z" fill="#48a9c5" />

  <!-- Accent Speed Slash -->
  <circle cx="23" cy="9.5" r="1.5" fill="#38bdf8" />
</svg>`;

// Candidate 3: Iconic Workshop Car Silhouette + Precision Cross Wrench (Ultra High Contrast)
const svgWrenchCar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="7" fill="#131d22" />
  <rect x="1" y="1" width="30" height="30" rx="6" fill="none" stroke="#283d46" stroke-width="1" />
  <rect x="2" y="2" width="28" height="28" rx="5" fill="none" stroke="#327d94" stroke-width="0.8" stroke-opacity="0.6" />

  <!-- Modern Aerodynamic Car Profile -->
  <path d="M5 21 C5 19 6.5 17.5 8.5 17.5 L11 17.5 L13.5 12 C14.2 10.8 15.5 10 17 10 L22 10 C23.5 10 24.8 10.8 25.5 12 L28 17.5 L28.5 17.5 C29.5 17.5 30 18.5 30 19.5 L29.5 22 C29.5 23 28.5 23.5 27.5 23.5 L5 23.5 Z" fill="#ffffff" />

  <!-- Windshield Cutout in Dark Graphite -->
  <path d="M14.5 12.5 L12.5 17 L17.5 17 L17.5 12 L14.5 12.5 Z M19 12 L19 17 L24 17 L22.5 12.5 Z" fill="#131d22" />

  <!-- Precision Wrench Accent across base in Electric Teal -->
  <path d="M6 25 H26" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
  <circle cx="9" cy="22.5" r="2" fill="#327d94" stroke="#131d22" stroke-width="1" />
  <circle cx="24" cy="22.5" r="2" fill="#327d94" stroke="#131d22" stroke-width="1" />

  <!-- Headlight beam -->
  <polygon points="27.5,18.5 31,19 31,21 28,21" fill="#38bdf8" opacity="0.9" />
</svg>`;

fs.writeFileSync("client/public/favicon_car_garage.svg", svgCarGarage);
fs.writeFileSync("client/public/favicon_eg_monogram.svg", svgEGMonogram);
fs.writeFileSync("client/public/favicon_wrench_car.svg", svgWrenchCar);
console.log("Candidate SVGs created.");
