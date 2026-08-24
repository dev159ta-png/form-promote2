// Preset Logos for the PES Evaluation System
// Faithful representations matching official Thai Government and School Emblems

export interface PresetLogo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: 'default' | 'ministry' | 'school' | 'bureau';
  dataUrl: string;
}

// 1. ตราสัญลักษณ์มาตรฐาน (PES Gold)
export const PES_GOLD_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A" />
      <stop offset="50%" stop-color="#1E40AF" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="92" fill="url(#shieldGrad)" stroke="url(#goldGrad)" stroke-width="5" filter="url(#shadow)"/>
  <circle cx="100" cy="100" r="82" fill="none" stroke="#FDE68A" stroke-width="1.5" stroke-dasharray="4 2"/>
  
  <!-- Laurel wreath -->
  <path d="M 50 145 C 38 120 40 85 62 60 C 65 65 62 75 58 85 C 54 95 54 110 65 125 Z" fill="url(#goldGrad)"/>
  <path d="M 150 145 C 162 120 160 85 138 60 C 135 65 138 75 142 85 C 146 95 146 110 135 125 Z" fill="url(#goldGrad)"/>
  
  <!-- Center Star & Medallion -->
  <polygon points="100,45 112,78 147,78 119,98 129,132 100,112 71,132 81,98 53,78 88,78" fill="url(#goldGrad)" stroke="#78350F" stroke-width="1.5"/>
  <circle cx="100" cy="94" r="16" fill="#1E3A8A" stroke="url(#goldGrad)" stroke-width="2"/>
  <text x="100" y="99" font-family="'Sarabun', 'Prompt', sans-serif" font-size="13" font-weight="900" fill="#FDE68A" text-anchor="middle">PES</text>
  
  <!-- Ribbon -->
  <path d="M 45 155 Q 100 175 155 155 L 148 142 Q 100 160 52 142 Z" fill="url(#goldGrad)" stroke="#78350F" stroke-width="1"/>
  <text x="100" y="157" font-family="'Sarabun', 'Prompt', sans-serif" font-size="10" font-weight="bold" fill="#78350F" text-anchor="middle">EXCELLENCE</text>
</svg>
`)}`;

// 2. ตรากระทรวงศึกษาธิการ (MOE - เสมาธรรมจักร)
export const MOE_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 330" width="240" height="330">
  <defs>
    <linearGradient id="moeGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE082" />
      <stop offset="40%" stop-color="#FFB300" />
      <stop offset="80%" stop-color="#F57C00" />
      <stop offset="100%" stop-color="#E65100" />
    </linearGradient>
    <linearGradient id="moeGoldLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF8E1" />
      <stop offset="100%" stop-color="#FFA000" />
    </linearGradient>
    <filter id="glow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#5D4037" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Outer Crown / Flame Arch (Kranok / Mongkut Crest) -->
  <g fill="url(#moeGold)" stroke="#6D4C41" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" filter="url(#glow)">
    <!-- Top Finial / Flame Peak -->
    <path d="M 120 10 C 114 25 106 32 106 42 C 106 50 114 55 120 62 C 126 55 134 50 134 42 C 134 32 126 25 120 10 Z" fill="url(#moeGoldLight)"/>
    <path d="M 120 28 C 117 38 112 42 112 48 C 112 52 117 55 120 58 C 123 55 128 52 128 48 C 128 42 123 38 120 28 Z"/>

    <!-- Main Outer Halo / Arch -->
    <path d="M 120 55 C 80 55 45 75 32 110 C 22 138 24 185 45 225 C 52 238 65 248 80 252 L 160 252 C 175 248 188 238 195 225 C 216 185 218 138 208 110 C 195 75 160 55 120 55 Z" fill="url(#moeGoldLight)"/>

    <!-- Outer Decorative Flame Leaves (Left) -->
    <path d="M 35 110 C 18 125 12 155 16 185 C 20 165 30 148 40 135 C 32 155 32 180 38 205 C 42 190 50 175 58 165 C 50 190 52 215 62 235 C 52 230 45 220 38 205 C 25 170 24 135 35 110 Z"/>
    
    <!-- Outer Decorative Flame Leaves (Right) -->
    <path d="M 205 110 C 222 125 228 155 224 185 C 220 165 210 148 200 135 C 208 155 208 180 202 205 C 198 190 190 175 182 165 C 190 190 188 215 178 235 C 188 230 195 220 202 205 C 215 170 216 135 205 110 Z"/>

    <!-- Center Opening Hollow -->
    <path d="M 120 80 C 95 80 72 95 65 120 C 58 145 60 185 75 215 L 165 215 C 180 185 182 145 175 120 C 168 95 145 80 120 80 Z" fill="#FFFFFF"/>

    <!-- Center Dharmachakra (Dharma Wheel - 8 Spokes) -->
    <g fill="url(#moeGold)" stroke="#5D4037" stroke-width="2">
      <!-- Wheel Outer Rim -->
      <circle cx="120" cy="155" r="48" fill="none" stroke="url(#moeGold)" stroke-width="9"/>
      <circle cx="120" cy="155" r="52" fill="none" stroke="#5D4037" stroke-width="2"/>
      <circle cx="120" cy="155" r="43.5" fill="none" stroke="#5D4037" stroke-width="1.5"/>

      <!-- Wheel Inner Hub -->
      <circle cx="120" cy="155" r="22" fill="url(#moeGold)" stroke="#5D4037" stroke-width="2"/>
      <circle cx="120" cy="155" r="14" fill="#FFFFFF" stroke="#5D4037" stroke-width="2"/>
      <circle cx="120" cy="155" r="7" fill="url(#moeGoldLight)" stroke="#5D4037" stroke-width="1.5"/>

      <!-- 8 Spokes -->
      <!-- Vertical & Horizontal -->
      <path d="M 117 112 L 123 112 L 122 133 L 118 133 Z"/>
      <path d="M 117 177 L 123 177 L 122 198 L 118 198 Z"/>
      <path d="M 77 152 L 77 158 L 98 157 L 98 153 Z"/>
      <path d="M 142 152 L 142 158 L 163 157 L 163 153 Z"/>
      
      <!-- Diagonals -->
      <path d="M 90 125 L 94 121 L 109 136 L 105 140 Z"/>
      <path d="M 146 181 L 150 177 L 135 162 L 131 166 Z"/>
      <path d="M 150 125 L 146 121 L 131 136 L 135 140 Z"/>
      <path d="M 94 181 L 90 177 L 105 162 L 109 166 Z"/>

      <!-- Small Studs on Rim -->
      <circle cx="120" cy="107" r="2.5" fill="#FFE082"/>
      <circle cx="120" cy="203" r="2.5" fill="#FFE082"/>
      <circle cx="72" cy="155" r="2.5" fill="#FFE082"/>
      <circle cx="168" cy="155" r="2.5" fill="#FFE082"/>
      <circle cx="86" cy="121" r="2.5" fill="#FFE082"/>
      <circle cx="154" cy="189" r="2.5" fill="#FFE082"/>
      <circle cx="154" cy="121" r="2.5" fill="#FFE082"/>
      <circle cx="86" cy="189" r="2.5" fill="#FFE082"/>
    </g>

    <!-- Lower Kanok Flame Base (Below Wheel) -->
    <path d="M 120 205 C 110 220 95 228 85 240 C 100 236 112 230 120 220 C 128 230 140 236 155 240 C 145 228 130 220 120 205 Z" fill="url(#moeGold)"/>

    <!-- Lotus Pedestal Base (Throne) -->
    <!-- Lotus Petals Layer -->
    <path d="M 35 252 L 205 252 C 205 264 195 272 185 275 L 55 275 C 45 272 35 264 35 252 Z" fill="url(#moeGoldLight)"/>
    <!-- Petal Divisions -->
    <path d="M 50 252 Q 60 268 70 252 Q 80 268 90 252 Q 100 268 110 252 Q 120 268 130 252 Q 140 268 150 252 Q 160 268 170 252 Q 180 268 190 252" fill="none" stroke="#5D4037" stroke-width="2"/>

    <!-- Base Stand Platform with Curved Legs -->
    <path d="M 45 275 L 195 275 L 200 286 L 40 286 Z" fill="url(#moeGold)"/>
    <path d="M 40 286 C 30 292 20 300 18 312 C 16 322 25 325 38 322 C 50 318 65 305 85 305 L 120 315 L 155 305 C 175 305 190 318 202 322 C 215 325 224 322 222 312 C 220 300 210 292 200 286 Z" fill="url(#moeGold)"/>
  </g>
</svg>
`)}`;

// 3. ตราโรงเรียนศึกษาพิเศษชัยนาท (Chainat Special Education School)
export const CHAINAT_SCHOOL_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 270" width="260" height="270">
  <defs>
    <linearGradient id="purpleRays" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#6B21A8" />
      <stop offset="50%" stop-color="#9333EA" />
      <stop offset="100%" stop-color="#C084FC" />
    </linearGradient>
    <linearGradient id="blueCenter" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A" />
      <stop offset="50%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>
    <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1E3A8A" />
      <stop offset="50%" stop-color="#1D4ED8" />
      <stop offset="100%" stop-color="#1E3A8A" />
    </linearGradient>
    <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#FDE047" />
    </linearGradient>
  </defs>

  <!-- 1. Top Radiant Sunburst / Crown Petals (Purple/Magenta) -->
  <g fill="url(#purpleRays)" stroke="#581C87" stroke-width="1.5">
    <!-- Center Main Torch Spire -->
    <polygon points="130,12 136,45 130,55 124,45" />
    
    <!-- Symmetrical Rays (Left & Right pairs) -->
    <polygon points="115,20 125,50 118,58 108,32" />
    <polygon points="145,20 135,50 142,58 152,32" />
    
    <polygon points="98,34 114,56 106,66 90,48" />
    <polygon points="162,34 146,56 154,66 170,48" />
    
    <polygon points="82,55 104,68 95,78 74,68" />
    <polygon points="178,55 156,68 165,78 186,68" />
    
    <polygon points="70,80 94,86 86,98 60,94" />
    <polygon points="190,80 166,86 174,98 200,94" />

    <polygon points="62,110 88,106 82,118 54,124" />
    <polygon points="198,110 172,106 178,118 206,124" />
    
    <polygon points="60,140 85,126 80,138 52,148" />
    <polygon points="200,140 175,126 180,138 208,148" />
  </g>

  <!-- 2. Torch Flame / Candle in Center -->
  <path d="M 130 52 C 122 62 120 74 126 84 C 130 78 134 76 132 68 C 136 74 138 80 134 86 C 142 80 142 66 130 52 Z" fill="#F59E0B" stroke="#B45309" stroke-width="1.2"/>
  <circle cx="130" cy="74" r="3.5" fill="#FEF08A"/>

  <!-- 3. Central Dome & Heart Globe (Blue & Violet) -->
  <g>
    <!-- Upper Dome & Background Heart -->
    <path d="M 80 145 C 80 95 180 95 180 145 C 180 185 130 205 130 205 C 130 205 80 185 80 145 Z" fill="url(#blueCenter)" stroke="#1E1B4B" stroke-width="2.5"/>
    
    <!-- Heart outline accent -->
    <path d="M 95 125 C 95 105 130 115 130 135 C 130 115 165 105 165 125 C 165 155 130 175 130 175 C 130 175 95 155 95 125 Z" fill="none" stroke="#A855F7" stroke-width="2.5" opacity="0.6"/>

    <!-- Flying Doves Silhouettes (White) -->
    <!-- Top Center Dove -->
    <path d="M 134 112 Q 142 108 148 114 Q 144 116 138 116 Q 134 120 131 116 Z" fill="#FFFFFF"/>
    <!-- Left Dove -->
    <path d="M 112 126 Q 120 122 126 128 Q 122 130 116 130 Q 112 134 109 130 Z" fill="#FFFFFF"/>
    <!-- Small Bottom Dove -->
    <path d="M 98 142 Q 104 139 108 144 Q 105 145 101 145 Z" fill="#FFFFFF"/>

    <!-- 4. Special Ed Figures: Caregiver / Teacher helping Student in Wheelchair -->
    <!-- Wheelchair & Student -->
    <!-- Wheel -->
    <circle cx="120" cy="180" r="11" fill="none" stroke="#FFFFFF" stroke-width="2.2"/>
    <circle cx="120" cy="180" r="2" fill="#FFFFFF"/>
    <line x1="120" y1="169" x2="120" y2="191" stroke="#FFFFFF" stroke-width="1.2"/>
    <line x1="109" y1="180" x2="131" y2="180" stroke="#FFFFFF" stroke-width="1.2"/>
    <!-- Student Body sitting -->
    <circle cx="116" cy="154" r="4" fill="#FFFFFF"/>
    <path d="M 116 158 L 114 172 L 124 173 L 126 182" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>

    <!-- Standing Teacher / Caregiver -->
    <circle cx="140" cy="144" r="4.5" fill="#FFFFFF"/>
    <path d="M 140 149 L 138 168 L 133 186 M 138 168 L 148 186" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Teacher Arm reaching down warmly to assist student -->
    <path d="M 137 155 Q 126 160 120 166" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  </g>

  <!-- 5. Elegant Ribbon Banner at Bottom with Thai Text "โรงเรียนศึกษาพิเศษชัยนาท" -->
  <g>
    <!-- Ribbon Shadow / Back Folds -->
    <path d="M 22 225 L 50 195 L 52 220 Z" fill="#1E3A8A"/>
    <path d="M 238 225 L 210 195 L 208 220 Z" fill="#1E3A8A"/>
    
    <!-- Ribbon Tail Ends -->
    <path d="M 22 225 L 52 220 L 42 245 L 14 252 L 28 238 Z" fill="url(#ribbonGrad)" stroke="url(#goldTrim)" stroke-width="2"/>
    <path d="M 238 225 L 208 220 L 218 245 L 246 252 L 232 238 Z" fill="url(#ribbonGrad)" stroke="url(#goldTrim)" stroke-width="2"/>

    <!-- Main Curved Center Ribbon -->
    <path d="M 38 206 Q 130 250 222 206 L 228 228 Q 130 274 32 228 Z" fill="url(#ribbonGrad)" stroke="url(#goldTrim)" stroke-width="2.5"/>
    
    <!-- Text along path or centered text -->
    <text x="130" y="235" font-family="'Sarabun', 'TH Sarabun New', 'Prompt', sans-serif" font-size="14.5" font-weight="900" fill="#FFFFFF" text-anchor="middle" filter="url(#glow)">
      โรงเรียนศึกษาพิเศษชัยนาท
    </text>
  </g>
</svg>
`)}`;

// 4. ตราสำนักงานการศึกษาพิเศษ (OBEC / สำนักบริหารงานการศึกษาพิเศษ)
export const SPECIAL_ED_BUREAU_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 270" width="250" height="270">
  <defs>
    <linearGradient id="obecBlue" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="50%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>
    <linearGradient id="obecGreen" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#16A34A" />
      <stop offset="50%" stop-color="#22C55E" />
      <stop offset="100%" stop-color="#15803D" />
    </linearGradient>
    <linearGradient id="obecHeartGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A" />
      <stop offset="50%" stop-color="#FACC15" />
      <stop offset="100%" stop-color="#EAB308" />
    </linearGradient>
  </defs>

  <!-- 1. Top Triangle Pagoda Spire with Horizontal Stripes -->
  <g fill="none" stroke="#2563EB" stroke-width="3" stroke-linecap="round">
    <!-- Triangle Peak -->
    <path d="M 125 10 L 125 110" stroke="#1D4ED8" stroke-width="4"/>
    <polygon points="125,10 90,110 160,110" fill="#EFF6FF" stroke="#2563EB" stroke-width="2.5"/>
    <!-- Horizontal pagoda lines -->
    <line x1="120" y1="25" x2="130" y2="25"/>
    <line x1="115" y1="38" x2="135" y2="38"/>
    <line x1="110" y1="52" x2="140" y2="52"/>
    <line x1="105" y1="66" x2="145" y2="66"/>
    <line x1="100" y1="80" x2="150" y2="80"/>
    <line x1="95" y1="94" x2="155" y2="94"/>
  </g>

  <!-- 2. Green Horizontal Wing Stripes (Left & Right) -->
  <g fill="none" stroke="url(#obecGreen)" stroke-width="4" stroke-linecap="round">
    <!-- Left Green Steps -->
    <line x1="60" y1="125" x2="95" y2="125"/>
    <line x1="65" y1="137" x2="102" y2="137"/>
    <line x1="72" y1="149" x2="110" y2="149"/>
    <line x1="82" y1="161" x2="118" y2="161"/>
    <line x1="95" y1="173" x2="122" y2="173"/>

    <!-- Right Green Steps -->
    <line x1="155" y1="125" x2="190" y2="125"/>
    <line x1="148" y1="137" x2="185" y2="137"/>
    <line x1="140" y1="149" x2="178" y2="149"/>
    <line x1="132" y1="161" x2="168" y2="161"/>
    <line x1="128" y1="173" x2="155" y2="173"/>
  </g>

  <!-- 3. Central Large Blue Wings V-Shape -->
  <g fill="url(#obecBlue)" stroke="#1E40AF" stroke-width="2">
    <!-- Left Wing -->
    <path d="M 70 105 C 70 105 82 145 122 185 C 122 185 100 155 70 105 Z" fill="#2563EB"/>
    <path d="M 75 108 Q 105 130 120 180 Q 88 150 75 108 Z" fill="#3B82F6"/>
    <!-- Right Wing -->
    <path d="M 180 105 C 180 105 168 145 128 185 C 128 185 150 155 180 105 Z" fill="#2563EB"/>
    <path d="M 175 108 Q 145 130 130 180 Q 162 150 175 108 Z" fill="#3B82F6"/>
  </g>

  <!-- 4. Central Golden Heart with "สศศ" -->
  <g filter="url(#glow)">
    <!-- Heart Base -->
    <path d="M 125 138 C 125 138 98 120 98 102 C 98 90 108 82 118 88 C 122 91 125 96 125 96 C 125 96 128 91 132 88 C 142 82 152 90 152 102 C 152 120 125 138 125 138 Z" fill="url(#obecHeartGold)" stroke="#CA8A04" stroke-width="2.5"/>
    <path d="M 125 132 C 125 132 104 116 104 102 C 104 94 111 88 118 92 C 122 95 125 99 125 99 C 125 99 128 95 132 92 C 139 88 146 94 146 102 C 146 116 125 132 125 132 Z" fill="#FEF9C3" stroke="#EAB308" stroke-width="1"/>
    
    <!-- "สศศ" Blue Thai Letters in Center -->
    <text x="115" y="106" font-family="'Sarabun', 'TH Sarabun New', sans-serif" font-size="14" font-weight="900" fill="#1E3A8A">ส</text>
    <text x="135" y="106" font-family="'Sarabun', 'TH Sarabun New', sans-serif" font-size="14" font-weight="900" fill="#1E3A8A">ศ</text>
    <text x="125" y="121" font-family="'Sarabun', 'TH Sarabun New', sans-serif" font-size="14" font-weight="900" fill="#1E3A8A" text-anchor="middle">ศ</text>
  </g>

  <!-- 5. Blue Ribbon Banner at Bottom with Thai and English Subtitle -->
  <g>
    <!-- Ribbon Ends -->
    <path d="M 32 180 L 52 155 L 60 178 Z" fill="#1E40AF"/>
    <path d="M 218 180 L 198 155 L 190 178 Z" fill="#1E40AF"/>

    <!-- Ribbon Tails Folded -->
    <path d="M 28 178 L 58 170 L 48 200 L 22 195 Z" fill="#2563EB" stroke="#1D4ED8" stroke-width="2"/>
    <path d="M 222 178 L 192 170 L 202 200 L 228 195 Z" fill="#2563EB" stroke="#1D4ED8" stroke-width="2"/>

    <!-- Main Arc Ribbon -->
    <path d="M 36 172 Q 125 218 214 172 L 222 204 Q 125 254 28 204 Z" fill="#2563EB" stroke="#1E3A8A" stroke-width="2.5"/>
    <path d="M 40 178 Q 125 222 210 178" fill="none" stroke="#93C5FD" stroke-width="1.2"/>
    <path d="M 34 198 Q 125 246 216 198" fill="none" stroke="#93C5FD" stroke-width="1.2"/>

    <!-- Title: สำนักบริหารงานการศึกษาพิเศษ -->
    <text x="125" y="202" font-family="'Sarabun', 'TH Sarabun New', 'Prompt', sans-serif" font-size="11.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
      สำนักบริหารงานการศึกษาพิเศษ
    </text>
    <!-- Subtitle: Special Education Bureau -->
    <text x="125" y="216" font-family="'Sarabun', 'Prompt', sans-serif" font-size="8" font-weight="600" fill="#BFDBFE" text-anchor="middle">
      Special Education Bureau
    </text>
  </g>
</svg>
`)}`;

// Preset list configured exactly as requested
export const PRESET_LOGOS: PresetLogo[] = [
  {
    id: 'preset_pes_gold',
    name: '1. ตราสัญลักษณ์มาตรฐาน (PES Gold)',
    shortName: 'PES Gold',
    description: 'ตราสัญลักษณ์มาตรฐานระบบประเมินผลการปฏิบัติงาน (เหรียญเกียรติยศสีทอง)',
    category: 'default',
    dataUrl: PES_GOLD_LOGO,
  },
  {
    id: 'preset_moe',
    name: '2. ตรากระทรวงศึกษาธิการ (MOE)',
    shortName: 'กระทรวงศึกษาธิการ',
    description: 'ตราเสมาธรรมจักร กระทรวงศึกษาธิการ สำหรับเอกสารราชการทางการ',
    category: 'ministry',
    dataUrl: MOE_LOGO,
  },
  {
    id: 'preset_chainat_school',
    name: '3. ตราโรงเรียนศึกษาพิเศษชัยนาท',
    shortName: 'ร.ร.ศึกษาพิเศษชัยนาท',
    description: 'ตราสัญลักษณ์ประจำโรงเรียนศึกษาพิเศษชัยนาท คบเพลิง ประชาคม และริบบิ้นน้ำเงิน',
    category: 'school',
    dataUrl: CHAINAT_SCHOOL_LOGO,
  },
  {
    id: 'preset_special_ed_obec',
    name: '4. ตราสำนักงานการศึกษาพิเศษ (OBEC)',
    shortName: 'สำนักบริหารงานการศึกษาพิเศษ',
    description: 'ตราสัญลักษณ์ สศศ. สำนักบริหารงานการศึกษาพิเศษ สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน',
    category: 'bureau',
    dataUrl: SPECIAL_ED_BUREAU_LOGO,
  },
];
