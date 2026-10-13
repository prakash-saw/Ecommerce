import React from 'react';

/**
 * High-fidelity vector SVG silhouettes for 10 real garment categories:
 * - Oversized T-Shirt
 * - Regular Fit T-Shirt
 * - Polo T-Shirt
 * - Classic Round-Neck T-Shirt
 * - V-Neck T-Shirt
 * - Full-Sleeve T-Shirt
 * - Sleeveless T-Shirt
 * - Crop T-Shirt
 * - Hoodie
 * - Sweatshirt
 * 
 * Supports both Front and Back views with authentic collars, seams, cuffs, hoods, pockets, and hems.
 */
export default function GarmentMockup({
  style = 'Oversized T-Shirt',
  side = 'front', // 'front' | 'back'
  colorHex = '#FFFFFF',
  className = ''
}) {
  const isBack = side === 'back';

  // Determine fabric tone for seam/shadow stroke contrast
  const isLightColor = ['#FFFFFF', '#F5F4EE', '#F3F4F6', '#E5E5E0', '#DCDAD0'].includes(colorHex.toUpperCase());
  const seamStroke = isLightColor ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.18)';
  const shadowFill = 'rgba(0, 0, 0, 0.06)';
  const highlightFill = 'rgba(255, 255, 255, 0.08)';

  // Style-specific SVG paths & details
  const renderGarmentPaths = () => {
    switch (style) {
      /* ========================================================
       * 1. POLO T-SHIRT (Turn-down collar, button placket, cuffed sleeves)
       * ======================================================== */
      case 'Polo T-Shirt':
        return (
          <g>
            {/* Body & Set-in Sleeves */}
            <path
              d="M 170 85 L 210 70 L 290 70 L 330 85 L 430 145 L 395 205 L 345 170 L 345 440 L 155 440 L 155 170 L 105 205 L 70 145 Z"
              fill={colorHex}
              stroke={seamStroke}
              strokeWidth="2"
            />
            {/* Sleeve Ribbed Bands */}
            <path d="M 70 145 L 105 205" stroke={seamStroke} strokeWidth="3" />
            <path d="M 430 145 L 395 205" stroke={seamStroke} strokeWidth="3" />
            {/* Bottom Hem */}
            <line x1="155" y1="432" x2="345" y2="432" stroke={seamStroke} strokeWidth="1.5" strokeDasharray="3 2" />

            {!isBack ? (
              /* Front Polo Collar & Button Placket */
              <g>
                {/* Placket Box */}
                <rect x="235" y="80" width="30" height="95" fill={colorHex} stroke={seamStroke} strokeWidth="1.5" />
                {/* Buttons */}
                <circle cx="250" cy="105" r="3.5" fill="#EEEEEE" stroke="#888888" strokeWidth="1" />
                <circle cx="250" cy="135" r="3.5" fill="#EEEEEE" stroke="#888888" strokeWidth="1" />
                <circle cx="250" cy="160" r="3.5" fill="#EEEEEE" stroke="#888888" strokeWidth="1" />
                {/* Fold-over Collar Wings */}
                <path
                  d="M 210 70 C 230 75, 235 85, 235 85 L 205 125 L 235 120 L 248 80 Z"
                  fill={colorHex}
                  stroke={seamStroke}
                  strokeWidth="2"
                />
                <path
                  d="M 290 70 C 270 75, 265 85, 265 85 L 295 125 L 265 120 L 252 80 Z"
                  fill={colorHex}
                  stroke={seamStroke}
                  strokeWidth="2"
                />
              </g>
            ) : (
              /* Back Polo Collar */
              <path
                d="M 210 70 C 240 82, 260 82, 290 70 L 290 62 C 260 72, 240 72, 210 62 Z"
                fill={colorHex}
                stroke={seamStroke}
                strokeWidth="2"
              />
            )}
          </g>
        );

      /* ========================================================
       * 2. V-NECK T-SHIRT (V-shaped crossover collar)
       * ======================================================== */
      case 'V-Neck T-Shirt':
        return (
          <g>
            {/* Body & Regular Sleeves */}
            <path
              d="M 165 80 L 205 68 L 295 68 L 335 80 L 435 145 L 395 205 L 345 170 L 345 440 L 155 440 L 155 170 L 105 205 L 65 145 Z"
              fill={colorHex}
              stroke={seamStroke}
              strokeWidth="2"
            />
            {/* Bottom Hem */}
            <line x1="155" y1="432" x2="345" y2="432" stroke={seamStroke} strokeWidth="1.5" strokeDasharray="3 2" />

            {!isBack ? (
              /* Front V-Neck Rib Collar */
              <g>
                <path
                  d="M 205 68 L 250 135 L 295 68 C 275 75, 225 75, 205 68 Z"
                  fill={shadowFill}
                  stroke={seamStroke}
                  strokeWidth="2.5"
                />
                <path
                  d="M 205 68 L 250 135 L 295 68"
                  fill="none"
                  stroke={seamStroke}
                  strokeWidth="2"
                />
              </g>
            ) : (
              /* Back High Scoop Neckline */
              <path
                d="M 205 68 C 235 78, 265 78, 295 68"
                fill="none"
                stroke={seamStroke}
                strokeWidth="2.5"
              />
            )}
          </g>
        );

      /* ========================================================
       * 3. FULL-SLEEVE T-SHIRT (Long sleeves with wrist cuffs)
       * ======================================================== */
      case 'Full-Sleeve T-Shirt':
        return (
          <g>
            {/* Long sleeves extending down to wrist level */}
            <path
              d="M 165 80 L 205 68 L 295 68 L 335 80 L 430 200 L 400 370 L 360 365 L 345 190 L 345 440 L 155 440 L 155 190 L 140 365 L 100 370 L 70 200 Z"
              fill={colorHex}
              stroke={seamStroke}
              strokeWidth="2"
            />
            {/* Wrist Ribbed Cuffs */}
            <path d="M 100 370 L 140 365" stroke={seamStroke} strokeWidth="3" />
            <path d="M 400 370 L 360 365" stroke={seamStroke} strokeWidth="3" />
            {/* Bottom Hem */}
            <line x1="155" y1="432" x2="345" y2="432" stroke={seamStroke} strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Crew Neck Collar */}
            <path
              d={!isBack ? "M 205 68 C 220 100, 280 100, 295 68" : "M 205 68 C 225 80, 275 80, 295 68"}
              fill={!isBack ? shadowFill : "none"}
              stroke={seamStroke}
              strokeWidth="2.5"
            />
          </g>
        );

      /* ========================================================
       * 4. SLEEVELESS T-SHIRT (Muscle tank silhouette, deep armholes)
       * ======================================================== */
      case 'Sleeveless T-Shirt':
        return (
          <g>
            {/* Sleeveless Tank Bodice */}
            <path
              d="M 195 72 L 215 68 L 285 68 L 305 72 C 290 120, 310 180, 340 195 L 340 440 L 160 440 L 160 195 C 190 180, 210 120, 195 72 Z"
              fill={colorHex}
              stroke={seamStroke}
              strokeWidth="2"
            />
            {/* Armhole Bindings */}
            <path d="M 305 72 C 290 120, 310 180, 340 195" fill="none" stroke={seamStroke} strokeWidth="2.5" />
            <path d="M 195 72 C 210 120, 190 180, 160 195" fill="none" stroke={seamStroke} strokeWidth="2.5" />
            {/* Bottom Hem */}
            <line x1="160" y1="432" x2="340" y2="432" stroke={seamStroke} strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Neckline */}
            <path
              d={!isBack ? "M 215 68 C 230 105, 270 105, 285 68" : "M 215 68 C 230 82, 270 82, 285 68"}
              fill={!isBack ? shadowFill : "none"}
              stroke={seamStroke}
              strokeWidth="2.5"
            />
          </g>
        );

      /* ========================================================
       * 5. CROP T-SHIRT (Short modern crop hemline)
       * ======================================================== */
      case 'Crop T-Shirt':
        return (
          <g>
            {/* Short cropped body reaching y=330 */}
            <path
              d="M 165 80 L 205 68 L 295 68 L 335 80 L 425 145 L 385 200 L 345 165 L 345 330 L 155 330 L 155 165 L 115 200 L 75 145 Z"
              fill={colorHex}
              stroke={seamStroke}
              strokeWidth="2"
            />
            {/* Wide Raw Crop Hem */}
            <line x1="155" y1="324" x2="345" y2="324" stroke={seamStroke} strokeWidth="2" strokeDasharray="3 2" />

            {/* Crew Neck Collar */}
            <path
              d={!isBack ? "M 205 68 C 220 98, 280 98, 295 68" : "M 205 68 C 225 80, 275 80, 295 68"}
              fill={!isBack ? shadowFill : "none"}
              stroke={seamStroke}
              strokeWidth="2.5"
            />
          </g>
        );

      /* ========================================================
       * 6. HOODIE (Draped hood, drawstrings, kangaroo pocket, ribbed hem)
       * ======================================================== */
      case 'Hoodie':
        return (
          <g>
            {/* Thick Hoodie Body & Long Sleeves */}
            <path
              d="M 160 85 L 200 65 L 300 65 L 340 85 L 435 190 L 400 375 L 355 370 L 350 200 L 350 450 L 150 450 L 150 200 L 145 370 L 100 375 L 65 190 Z"
              fill={colorHex}
              stroke={seamStroke}
              strokeWidth="2"
            />
            {/* Thick Ribbed Bottom Waistband */}
            <rect x="150" y="428" width="200" height="22" fill={colorHex} stroke={seamStroke} strokeWidth="1.5" />
            {/* Wrist Cuffs */}
            <path d="M 100 375 L 145 370" stroke={seamStroke} strokeWidth="3" />
            <path d="M 400 375 L 355 370" stroke={seamStroke} strokeWidth="3" />

            {!isBack ? (
              <g>
                {/* Front Kangaroo Pouch Pocket */}
                <path
                  d="M 185 340 L 315 340 L 330 425 L 170 425 Z"
                  fill={colorHex}
                  stroke={seamStroke}
                  strokeWidth="2"
                />
                {/* Pocket Side Entry Slits */}
                <path d="M 185 340 L 170 425" stroke={seamStroke} strokeWidth="2.5" />
                <path d="M 315 340 L 330 425" stroke={seamStroke} strokeWidth="2.5" />

                {/* Hood Fold & Collar Drape */}
                <path
                  d="M 195 68 C 170 25, 330 25, 305 68 C 290 85, 210 85, 195 68 Z"
                  fill={colorHex}
                  stroke={seamStroke}
                  strokeWidth="2"
                />
                {/* Drawstrings Hanging Down */}
                <path d="M 230 75 Q 228 115, 232 140" fill="none" stroke="#777777" strokeWidth="2" />
                <circle cx="232" cy="142" r="2.5" fill="#333333" />
                <path d="M 270 75 Q 272 115, 268 140" fill="none" stroke="#777777" strokeWidth="2" />
                <circle cx="268" cy="142" r="2.5" fill="#333333" />
              </g>
            ) : (
              /* Back Hood Hanging Down */
              <path
                d="M 195 65 C 180 20, 320 20, 305 65 C 320 120, 180 120, 195 65 Z"
                fill={colorHex}
                stroke={seamStroke}
                strokeWidth="2"
              />
            )}
          </g>
        );

      /* ========================================================
       * 7. SWEATSHIRT (Fleece crewneck, V-notch stitch, ribbed cuffs & hem)
       * ======================================================== */
      case 'Sweatshirt':
        return (
          <g>
            {/* Heavy Pullover Body & Long Sleeves */}
            <path
              d="M 160 82 L 205 68 L 295 68 L 340 82 L 435 190 L 400 375 L 355 370 L 348 195 L 348 448 L 152 448 L 152 195 L 145 370 L 100 375 L 65 190 Z"
              fill={colorHex}
              stroke={seamStroke}
              strokeWidth="2"
            />
            {/* Ribbed Bottom Waistband */}
            <rect x="152" y="428" width="196" height="20" fill={colorHex} stroke={seamStroke} strokeWidth="1.5" />
            {/* Ribbed Wrist Cuffs */}
            <path d="M 100 375 L 145 370" stroke={seamStroke} strokeWidth="3" />
            <path d="M 400 375 L 355 370" stroke={seamStroke} strokeWidth="3" />

            {/* Crewneck Collar */}
            <path
              d={!isBack ? "M 205 68 C 220 95, 280 95, 295 68" : "M 205 68 C 225 80, 275 80, 295 68"}
              fill={!isBack ? shadowFill : "none"}
              stroke={seamStroke}
              strokeWidth="3"
            />

            {!isBack && (
              /* Classic Triangular V-Notch Sweatshirt Stitch */
              <path
                d="M 240 92 L 250 108 L 260 92"
                fill="none"
                stroke={seamStroke}
                strokeWidth="2"
              />
            )}
          </g>
        );

      /* ========================================================
       * 8. REGULAR FIT T-SHIRT (Tailored standard shoulders & sleeves)
       * ======================================================== */
      case 'Regular Fit T-Shirt':
        return (
          <g>
            {/* Tailored Set-in Silhouette */}
            <path
              d="M 165 80 L 205 68 L 295 68 L 335 80 L 420 145 L 385 200 L 342 168 L 342 440 L 158 440 L 158 168 L 115 200 L 80 145 Z"
              fill={colorHex}
              stroke={seamStroke}
              strokeWidth="2"
            />
            {/* Bottom Hem */}
            <line x1="158" y1="432" x2="342" y2="432" stroke={seamStroke} strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Collar Band */}
            <path
              d={!isBack ? "M 205 68 C 220 96, 280 96, 295 68" : "M 205 68 C 225 80, 275 80, 295 68"}
              fill={!isBack ? shadowFill : "none"}
              stroke={seamStroke}
              strokeWidth="2.5"
            />
          </g>
        );

      /* ========================================================
       * 9. CLASSIC ROUND-NECK T-SHIRT (Clean crew neckline)
       * ======================================================== */
      case 'Classic Round-Neck T-Shirt':
        return (
          <g>
            {/* Clean Round-Neck Bodice */}
            <path
              d="M 165 80 L 205 68 L 295 68 L 335 80 L 425 145 L 385 205 L 345 170 L 345 440 L 155 440 L 155 170 L 115 205 L 75 145 Z"
              fill={colorHex}
              stroke={seamStroke}
              strokeWidth="2"
            />
            {/* Double Needle Hem */}
            <line x1="155" y1="432" x2="345" y2="432" stroke={seamStroke} strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Ribbed Circular Collar */}
            <path
              d={!isBack ? "M 205 68 C 218 98, 282 98, 295 68" : "M 205 68 C 225 80, 275 80, 295 68"}
              fill={!isBack ? shadowFill : "none"}
              stroke={seamStroke}
              strokeWidth="3"
            />
          </g>
        );

      /* ========================================================
       * 10. OVERSIZED T-SHIRT (Default: Boxy, Drop Shoulder, Wide Sleeves)
       * ======================================================== */
      case 'Oversized T-Shirt':
      default:
        return (
          <g>
            {/* Drop Shoulder Boxy Silhouette */}
            <path
              d="M 150 82 L 205 68 L 295 68 L 350 82 L 445 155 L 400 225 L 350 180 L 350 445 L 150 445 L 150 180 L 100 225 L 55 155 Z"
              fill={colorHex}
              stroke={seamStroke}
              strokeWidth="2"
            />
            {/* Wide Sleeves Seams */}
            <path d="M 150 82 L 150 180" stroke={seamStroke} strokeWidth="1.5" strokeDasharray="2 2" />
            <path d="M 350 82 L 350 180" stroke={seamStroke} strokeWidth="1.5" strokeDasharray="2 2" />
            {/* Heavy Hemline */}
            <line x1="150" y1="436" x2="350" y2="436" stroke={seamStroke} strokeWidth="2" strokeDasharray="4 2" />

            {/* Wide Neckband */}
            <path
              d={!isBack ? "M 205 68 C 220 98, 280 98, 295 68" : "M 205 68 C 225 80, 275 80, 295 68"}
              fill={!isBack ? shadowFill : "none"}
              stroke={seamStroke}
              strokeWidth="3"
            />
          </g>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 500 500"
      className={`w-full h-full select-none pointer-events-none drop-shadow-md ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Subtle garment body shading for realistic depth */}
        <linearGradient id="garmentShade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.04" />
          <stop offset="15%" stopColor="#000000" stopOpacity="0.0" />
          <stop offset="85%" stopColor="#000000" stopOpacity="0.0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* Render selected garment paths */}
      {renderGarmentPaths()}

      {/* Soft gradient overlay for subtle 3D lighting */}
      <rect x="0" y="0" width="500" height="500" fill="url(#garmentShade)" />
    </svg>
  );
}
