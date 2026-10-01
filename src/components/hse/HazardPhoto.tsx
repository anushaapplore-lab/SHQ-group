import { SitePhoto } from '../ui'
import { cx } from '../../lib/format'

/**
 * Stylised illustration of a desert pipeline site with a side boom lifting a
 * 24" pipe joint while a worker stands beneath the load. Bounding boxes are
 * drawn by hand to simulate a detection result: no computer vision runs here.
 */
export function HazardPhoto({ showDetections = false, className, label }: { showDetections?: boolean; className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" className={cx('block', className)} role="img" aria-label={label ?? 'Illustrated site photo: worker beneath a suspended pipe joint'}>
      {/* sky and sun */}
      <rect width="640" height="400" fill="#d7e6f1" />
      <circle cx="560" cy="58" r="26" fill="#f6e7b8" />
      {/* distant dunes */}
      <path d="M0 236 Q90 206 180 228 T360 222 T520 214 T640 226 V270 H0Z" fill="#e3cfa6" />
      <path d="M0 252 Q120 236 240 250 T480 244 T640 248 V280 H0Z" fill="#dcc497" />
      {/* ground */}
      <rect y="262" width="640" height="138" fill="#d6bd8f" />
      <path d="M0 300 Q160 288 320 300 T640 296" stroke="#c7ab79" strokeWidth="3" fill="none" />
      <path d="M0 372 Q200 360 400 374 T640 368" stroke="#c7ab79" strokeWidth="3" fill="none" />
      {/* right-of-way marker posts */}
      <rect x="28" y="246" width="4" height="30" fill="#5a606b" />
      <rect x="26" y="242" width="8" height="8" fill="#e0a526" />
      <rect x="604" y="248" width="4" height="28" fill="#5a606b" />
      <rect x="602" y="244" width="8" height="8" fill="#e0a526" />
      {/* strung pipe on skids in the foreground */}
      <g>
        <rect x="8" y="356" width="300" height="16" rx="8" fill="#3f4a56" />
        <rect x="8" y="356" width="300" height="5" rx="2.5" fill="#6b7785" />
        <rect x="316" y="358" width="316" height="16" rx="8" fill="#3f4a56" />
        <rect x="316" y="358" width="316" height="5" rx="2.5" fill="#6b7785" />
        <rect x="60" y="372" width="18" height="8" fill="#8a6a43" />
        <rect x="240" y="372" width="18" height="8" fill="#8a6a43" />
        <rect x="420" y="374" width="18" height="8" fill="#8a6a43" />
        <rect x="580" y="374" width="18" height="8" fill="#8a6a43" />
      </g>

      {/* side boom tractor */}
      <g>
        {/* boom */}
        <line x1="430" y1="268" x2="204" y2="70" stroke="#e0a526" strokeWidth="11" strokeLinecap="round" />
        <line x1="430" y1="268" x2="204" y2="70" stroke="#c28a12" strokeWidth="3" strokeDasharray="10 12" />
        {/* luffing cable */}
        <line x1="204" y1="70" x2="500" y2="210" stroke="#2b3440" strokeWidth="2" />
        {/* body */}
        <rect x="410" y="232" width="150" height="58" rx="6" fill="#f2b705" />
        <rect x="470" y="196" width="62" height="46" rx="4" fill="#f2b705" />
        <rect x="478" y="204" width="46" height="26" rx="3" fill="#9fc3dc" />
        <rect x="548" y="214" width="44" height="66" rx="4" fill="#3f4a56" />
        <rect x="420" y="246" width="40" height="8" rx="2" fill="#c28a12" />
        {/* tracks */}
        <rect x="396" y="288" width="196" height="32" rx="16" fill="#2b3440" />
        <circle cx="414" cy="304" r="11" fill="#5a606b" />
        <circle cx="574" cy="304" r="11" fill="#5a606b" />
        <circle cx="454" cy="306" r="7" fill="#5a606b" />
        <circle cx="494" cy="306" r="7" fill="#5a606b" />
        <circle cx="534" cy="306" r="7" fill="#5a606b" />
        {/* operator */}
        <circle cx="500" cy="214" r="6" fill="#7a5c3c" />
        <path d="M494 210 a6 6 0 0 1 12 0Z" fill="#ffffff" />
      </g>

      {/* hoist cable, hook block and slings */}
      <line x1="204" y1="74" x2="204" y2="150" stroke="#2b3440" strokeWidth="2.5" />
      <rect x="192" y="148" width="24" height="18" rx="3" fill="#e0a526" stroke="#8a6a12" strokeWidth="1.5" />
      <path d="M204 166 v8 a7 7 0 1 1 -7 7" stroke="#2b3440" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <line x1="204" y1="181" x2="96" y2="202" stroke="#2b3440" strokeWidth="2" />
      <line x1="204" y1="181" x2="312" y2="202" stroke="#2b3440" strokeWidth="2" />

      {/* suspended 24 inch pipe joint */}
      <g>
        <rect x="70" y="198" width="268" height="26" rx="13" fill="#3f4a56" />
        <rect x="70" y="198" width="268" height="8" rx="4" fill="#6b7785" />
        <ellipse cx="338" cy="211" rx="6" ry="13" fill="#2b3440" />
        <rect x="98" y="198" width="10" height="26" fill="#e0a526" opacity=".85" />
        <rect x="300" y="198" width="10" height="26" fill="#e0a526" opacity=".85" />
      </g>

      {/* worker directly beneath the load */}
      <g>
        {/* raised arm guiding the joint */}
        <line x1="270" y1="262" x2="262" y2="230" stroke="#ff7a1a" strokeWidth="8" strokeLinecap="round" />
        <circle cx="262" cy="228" r="4.5" fill="#7a5c3c" />
        {/* body */}
        <rect x="266" y="256" width="28" height="44" rx="7" fill="#ff7a1a" />
        <rect x="266" y="270" width="28" height="4" fill="#f4f4f4" />
        <rect x="266" y="284" width="28" height="4" fill="#f4f4f4" />
        <rect x="268" y="298" width="11" height="34" rx="4" fill="#ff7a1a" />
        <rect x="281" y="298" width="11" height="34" rx="4" fill="#ff7a1a" />
        <rect x="266" y="330" width="14" height="6" rx="2" fill="#3f2a1a" />
        <rect x="280" y="330" width="14" height="6" rx="2" fill="#3f2a1a" />
        <line x1="292" y1="262" x2="300" y2="292" stroke="#ff7a1a" strokeWidth="8" strokeLinecap="round" />
        {/* head and helmet */}
        <circle cx="280" cy="246" r="10" fill="#7a5c3c" />
        <path d="M268 244 a12 11 0 0 1 24 0 h3 v3 h-30 v-3Z" fill="#ffffff" stroke="#c9ced6" strokeWidth="1" />
      </g>

      {showDetections && (
        <g className="anim-fade" fontFamily="Inter, system-ui, sans-serif" fontSize="13" fontWeight="600">
          {/* hazard area under the load */}
          <ellipse cx="204" cy="334" rx="168" ry="26" fill="#b91c1c" fillOpacity=".12" stroke="#b91c1c" strokeWidth="2.5" strokeDasharray="8 6" />
          <line x1="70" y1="224" x2="44" y2="330" stroke="#b91c1c" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="338" y1="224" x2="368" y2="330" stroke="#b91c1c" strokeWidth="1.5" strokeDasharray="4 4" />
          <rect x="42" y="342" width="98" height="22" rx="4" fill="#b91c1c" />
          <text x="91" y="357" fill="#ffffff" textAnchor="middle">
            Hazard area
          </text>

          {/* suspended load */}
          <rect x="62" y="190" width="284" height="42" rx="4" fill="none" stroke="#d97706" strokeWidth="2.5" />
          <rect x="62" y="232" width="170" height="22" fill="#d97706" />
          <text x="70" y="247" fill="#ffffff">
            Suspended load 0.94
          </text>

          {/* crane hook */}
          <rect x="184" y="140" width="40" height="48" rx="4" fill="none" stroke="#0f766e" strokeWidth="2.5" />
          <rect x="184" y="118" width="128" height="22" fill="#0f766e" />
          <text x="192" y="133" fill="#ffffff">
            Crane hook 0.91
          </text>

          {/* worker */}
          <rect x="252" y="230" width="52" height="110" rx="4" fill="none" stroke="#1d4ed8" strokeWidth="2.5" />
          <rect x="304" y="256" width="100" height="22" fill="#1d4ed8" />
          <text x="312" y="271" fill="#ffffff">
            Worker 0.97
          </text>
        </g>
      )}
    </svg>
  )
}

/** Renders the right illustration for an observation photo key. */
export function ObservationPhoto({ photo, showDetections, className }: { photo: string; showDetections?: boolean; className?: string }) {
  if (photo === 'suspended-load') return <HazardPhoto showDetections={showDetections} className={className} />
  const seed = parseInt(photo.replace(/\D/g, ''), 10) || 3
  return <SitePhoto seed={seed} className={className} label="Site photo placeholder" />
}
