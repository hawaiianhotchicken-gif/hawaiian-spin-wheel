import React, { useState, useEffect } from 'react';
import { Gift, Clock } from 'lucide-react';

const App = () => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [lastSpinDate, setLastSpinDate] = useState(null);
  const [canSpin, setCanSpin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [showWinScreen, setShowWinScreen] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const prizes = [
    { label: '$100 GIFT CARD', weight: 0, color: '#FF0000' },
    { label: '10% OFF', weight: 20, color: '#FFED00' },
    { label: 'FREE FRIES', weight: 15, color: '#FF0000' },
    { label: 'FREE SHIRT', weight: 5, color: '#000000' },
    { label: '$5 OFF', weight: 5, color: '#FFED00' },
    { label: 'FREE DRINK', weight: 5, color: '#FF0000' },
    { label: '5% OFF', weight: 25, color: '#000000' },
    { label: '5% OFF', weight: 25, color: '#FFED00' }
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phone = params.get('phone');
    
    if (!phone) {
      alert('Invalid access link. Please use the link from your text message.');
      setLoading(false);
      return;
    }
    
    setCustomerPhone(phone);
    loadSpinData(phone);
  }, []);

  useEffect(() => {
    if (showWinScreen) {
      const confettiPieces = [];
      for (let i = 0; i < 150; i++) {
        confettiPieces.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 3,
          duration: 3 + Math.random() * 2,
          color: ['#FF0000', '#FFED00', '#FFA500'][Math.floor(Math.random() * 3)]
        });
      }
      setConfetti(confettiPieces);
    }
  }, [showWinScreen]);

  const loadSpinData = async (phone) => {
    try {
      const spinData = await window.storage.get(`spin:${phone}`);
      
      if (spinData) {
        const data = JSON.parse(spinData.value);
        setLastSpinDate(data.lastSpin);
        setHistory(data.history || []);
        
        const lastSpin = new Date(data.lastSpin);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        setCanSpin(lastSpin < twoWeeksAgo);
      } else {
        setCanSpin(true);
      }
    } catch (error) {
      setCanSpin(true);
    }
    
    setLoading(false);
  };

  const getWeightedPrize = () => {
    const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < prizes.length; i++) {
      random -= prizes[i].weight;
      if (random <= 0) return i;
    }
    return 0;
  };

  const generateCode = () => {
    return 'HHC' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const spin = async () => {
    if (spinning || !canSpin) return;
    
    setSpinning(true);
    const prizeIndex = getWeightedPrize();
    const segmentAngle = 360 / prizes.length;
    
    // Pointer is at the TOP (270 degrees in our coordinate system since wheel starts at right)
    // Calculate how much to rotate to bring the winning segment's CENTER under the pointer
    const offsetToCenter = segmentAngle / 2; // Center of segment
    const targetAngle = (prizeIndex * segmentAngle) + offsetToCenter;
    
    // Rotate 5 full spins plus the amount needed to align the prize at top
    const targetRotation = (360 * 5) + targetAngle;
    
    setRotation(targetRotation);
    
    setTimeout(async () => {
      const won = prizes[prizeIndex];
      const code = generateCode();
      const winData = {
        prize: won.label,
        code: code,
        date: new Date().toISOString()
      };
      
      setResult(winData);
      setSpinning(false);
      setCanSpin(false);
      setShowWinScreen(true);
      
      const newHistory = [...history, winData];
      
      try {
        await window.storage.set(`spin:${customerPhone}`, JSON.stringify({
          lastSpin: new Date().toISOString(),
          history: newHistory
        }));
        setHistory(newHistory);
        setLastSpinDate(new Date().toISOString());
      } catch (error) {
        console.error('Failed to save spin data:', error);
      }
    }, 4000);
  };

  const getDaysUntilNextSpin = () => {
    if (!lastSpinDate) return 0;
    const last = new Date(lastSpinDate);
    const next = new Date(last);
    next.setDate(next.getDate() + 14);
    const now = new Date();
    const diff = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#FFED00', fontSize: '24px', fontWeight: 'bold' }}>Loading...</div>
      </div>
    );
  }

  if (!customerPhone) {
    return (
      <div style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ background: 'linear-gradient(to bottom right, #FF0000, #000000)', border: '4px solid #FFED00', borderRadius: '16px', padding: '32px', textAlign: 'center', maxWidth: '448px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#FFED00', marginBottom: '16px' }}>ACCESS DENIED</h1>
          <p style={{ color: 'white' }}>Please use the link from your text message to access the spin wheel.</p>
        </div>
      </div>
    );
  }

  if (showWinScreen && result) {
    return (
      <div style={{ minHeight: '100vh', background: '#000000', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        {confetti.map((piece) => (
          <div
            key={piece.id}
            style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              backgroundColor: piece.color,
              left: `${piece.left}%`,
              top: '-20px',
              animation: `fall ${piece.duration}s linear ${piece.delay}s forwards`,
              transform: 'rotate(45deg)'
            }}
          />
        ))}

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '672px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img 
              src="https://i.imgur.com/cEIZbpo.png"
              alt="Hawaiian Hot Chicken"
              className="win-logo"
              style={{ width: '200px', height: '200px', margin: '0 auto', display: 'block', marginBottom: '16px' }}
            />
          </div>

          <div className="win-card-padding" style={{ background: 'linear-gradient(to bottom right, #FFED00, #FF0000, #000000)', border: '8px solid #FFED00', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 className="congrats-title" style={{ fontSize: '48px', fontWeight: '900', color: 'white', marginBottom: '8px', textShadow: '4px 4px 0px #FF0000' }}>
                🎉 CONGRATULATIONS! 🎉
              </h1>
              <p className="congrats-subtitle" style={{ fontSize: '30px', fontWeight: 'bold', color: '#000000', background: '#FFED00', display: 'inline-block', padding: '8px 24px', borderRadius: '9999px' }}>
                YOU JUST WON
              </p>
            </div>

            <div style={{ background: '#000000', border: '4px solid #FFED00', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
              <p className="prize-text" style={{ fontSize: '40px', fontWeight: '900', textAlign: 'center', color: '#FFED00', marginBottom: '24px', textShadow: '3px 3px 0px #FF0000' }}>
                {result.prize}
              </p>
              
              <div style={{ background: 'linear-gradient(to right, #FF0000, #FFED00)', borderRadius: '12px', padding: '24px', border: '4px solid white' }} className="code-container">>
                <p className="code-label" style={{ fontSize: '18px', color: 'white', textAlign: 'center', marginBottom: '8px', fontWeight: 'bold' }}>YOUR REDEMPTION CODE</p>
                <p className="code-text" style={{ fontSize: '40px', fontFamily: 'monospace', fontWeight: '900', textAlign: 'center', color: '#000000', background: '#FFED00', padding: '16px', borderRadius: '8px', letterSpacing: '0.1em' }}>
                  {result.code}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <a
                href="https://www.hawaiianhotchicken.com/order"
                target="_blank"
                rel="noopener noreferrer"
                className="order-button"
                style={{ display: 'block', width: '100%', background: 'linear-gradient(to right, #FF0000, #FFED00)', color: '#000000', fontSize: '24px', fontWeight: '900', padding: '24px', borderRadius: '16px', textAlign: 'center', border: '4px solid #000000', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', textDecoration: 'none' }}>
                🔥 ORDER ONLINE NOW 🔥
              </a>
            </div>
            
            <button
              onClick={() => setShowWinScreen(false)}
              className="back-button"
              style={{ display: 'block', width: '100%', background: '#000000', color: '#FFED00', fontSize: '20px', fontWeight: 'bold', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '4px solid #FFED00', cursor: 'pointer' }}>
              Back to Wheel
            </button>

            <p className="screenshot-text" style={{ textAlign: 'center', color: 'white', marginTop: '24px', fontSize: '14px', fontWeight: 'bold' }}>
              📸 Screenshot this code and show it when ordering!
            </p>
          </div>
        </div>

        <style>{`
          @keyframes fall {
            to {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000000', padding: '16px' }}>
      <style>{`
        @media (max-width: 768px) {
          .spin-button {
            font-size: 18px !important;
            padding: 18px 36px !important;
          }
          
          /* Results page - dramatically smaller */
          .congrats-title {
            font-size: 18px !important;
            line-height: 1.1 !important;
            margin-bottom: 6px !important;
          }
          .congrats-subtitle {
            font-size: 12px !important;
            padding: 4px 8px !important;
          }
          .prize-text {
            font-size: 16px !important;
            padding: 4px !important;
            line-height: 1.2 !important;
            margin-bottom: 12px !important;
          }
          .code-label {
            font-size: 10px !important;
            margin-bottom: 4px !important;
          }
          .code-text {
            font-size: 14px !important;
            padding: 8px 4px !important;
            letter-spacing: 0.02em !important;
          }
          .order-button {
            font-size: 13px !important;
            padding: 10px 8px !important;
          }
          .back-button {
            font-size: 12px !important;
            padding: 8px !important;
          }
          .win-card-padding {
            padding: 12px !important;
          }
          .win-logo {
            width: 80px !important;
            height: 80px !important;
            margin-bottom: 8px !important;
          }
          .code-container {
            padding: 12px !important;
          }
          .screenshot-text {
            font-size: 10px !important;
            margin-top: 12px !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: '672px', margin: '0 auto' }}>
        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px', paddingTop: '32px' }}>
          <img 
            src="https://i.imgur.com/cEIZbpo.png"
            alt="Hawaiian Hot Chicken"
            style={{ width: '180px', height: '180px', margin: '0 auto', display: 'block', marginBottom: '16px' }}
          />
          <h1 style={{ fontSize: '56px', fontWeight: '900', color: '#FFED00', marginBottom: '8px', textShadow: '4px 4px 0px #FF0000', textAlign: 'center' }}>
            SPIN TO WIN
          </h1>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', background: '#FF0000', display: 'inline-block', padding: '8px 24px', borderRadius: '9999px', border: '4px solid #FFED00' }}>
            🎁 VIP EXCLUSIVE 🎁
          </p>
        </div>

        {/* Wheel Container */}
        <div style={{ background: 'linear-gradient(to bottom right, #FF0000, #000000, #FF0000)', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', marginBottom: '24px', border: '8px solid #FFED00' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            {/* Pointer */}
            <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%) translateY(-24px)', zIndex: 20 }}>
              <div style={{ width: '0', height: '0', borderLeft: '25px solid transparent', borderRight: '25px solid transparent', borderTop: '40px solid #FFED00', filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15))' }}></div>
            </div>
            
            {/* Glossy Wheel */}
            <div style={{ position: 'relative', paddingBottom: '100%', borderRadius: '50%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                  filter: 'drop-shadow(0 0 30px rgba(255, 237, 0, 0.6))'
                }}
                viewBox="0 0 200 200"
              >
                {/* Outer ring */}
                <circle cx="100" cy="100" r="98" fill="none" stroke="#FFED00" strokeWidth="5" />
                
                {prizes.map((prize, i) => {
                  const angle = (360 / prizes.length) * i;
                  const nextAngle = (360 / prizes.length) * (i + 1);
                  
                  const x1 = 100 + 95 * Math.cos((angle - 90) * Math.PI / 180);
                  const y1 = 100 + 95 * Math.sin((angle - 90) * Math.PI / 180);
                  const x2 = 100 + 95 * Math.cos((nextAngle - 90) * Math.PI / 180);
                  const y2 = 100 + 95 * Math.sin((nextAngle - 90) * Math.PI / 180);
                  
                  const midAngle = (angle + nextAngle) / 2;
                  const textX = 100 + 60 * Math.cos((midAngle - 90) * Math.PI / 180);
                  const textY = 100 + 60 * Math.sin((midAngle - 90) * Math.PI / 180);
                  
                  return (
                    <g key={i}>
                      {/* Segment */}
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 95 95 0 0 1 ${x2} ${y2} Z`}
                        fill={prize.color}
                        stroke="#FFED00"
                        strokeWidth="3"
                      />
                      
                      {/* Glossy overlay */}
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 95 95 0 0 1 ${x2} ${y2} Z`}
                        fill="url(#glossGradient)"
                        opacity="0.4"
                      />
                      
                      {/* Text - White with black outline for visibility */}
                      <text
                        x={textX}
                        y={textY}
                        fill="white"
                        fontSize="9"
                        fontWeight="900"
                        textAnchor="middle"
                        transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                        stroke="#000000"
                        strokeWidth="2"
                        paintOrder="stroke"
                      >
                        {prize.label.split(' ').map((word, wi) => (
                          <tspan key={wi} x={textX} dy={wi === 0 ? 0 : 10}>
                            {word}
                          </tspan>
                        ))}
                      </text>
                    </g>
                  );
                })}
                
                {/* Glossy gradient definition */}
                <defs>
                  <radialGradient id="glossGradient" cx="30%" cy="30%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </radialGradient>
                </defs>
                
                {/* Center button */}
                <circle cx="100" cy="100" r="22" fill="#FFED00" stroke="#FF0000" strokeWidth="5" />
                <circle cx="100" cy="100" r="17" fill="#FF0000" />
                <text x="100" y="108" fontSize="20" textAnchor="middle" fill="#FFED00" fontWeight="bold">
                  🔥
                </text>
              </svg>
            </div>
          </div>

          {/* Spin Button */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            {canSpin ? (
              <button
                onClick={spin}
                disabled={spinning}
                className="spin-button"
                style={{
                  padding: '24px 64px',
                  borderRadius: '16px',
                  fontSize: '30px',
                  fontWeight: '900',
                  border: '4px solid #FFED00',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  cursor: spinning ? 'not-allowed' : 'pointer',
                  background: spinning ? '#4B5563' : 'linear-gradient(to right, #FF0000, #FFED00)',
                  color: spinning ? '#9CA3AF' : '#000000',
                  textShadow: spinning ? 'none' : '2px 2px 0px rgba(0,0,0,0.5)',
                  whiteSpace: 'nowrap'
                }}
              >
                {spinning ? '🌀 SPINNING...' : '🔥 SPIN NOW! 🔥'}
              </button>
            ) : (
              <div style={{ textAlign: 'center', background: 'linear-gradient(to right, #FF0000, #000000)', border: '4px solid #FFED00', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#FFED00', marginBottom: '8px' }}>
                  <Clock size={32} />
                  <span style={{ fontSize: '30px', fontWeight: '900' }}>
                    {getDaysUntilNextSpin()} DAYS
                  </span>
                </div>
                <p style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Until your next spin!</p>
              </div>
            )}
          </div>
        </div>

        {/* Win History */}
        {history.length > 0 && (
          <div style={{ background: 'linear-gradient(to bottom right, #FF0000, #000000)', borderRadius: '24px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '4px solid #FFED00' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#FFED00', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gift size={28} />
              YOUR WINS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.slice().reverse().map((win, i) => (
                <div key={i} style={{ background: '#000000', border: '2px solid #FFED00', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 'bold', color: '#FFED00', fontSize: '18px' }}>{win.prize}</p>
                      <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
                        {new Date(win.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', color: 'white', background: '#FF0000', padding: '4px 12px', borderRadius: '4px', border: '2px solid #FFED00' }}>
                      {win.code}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px', paddingBottom: '32px' }}>
          <p style={{ color: '#FFED00', fontSize: '18px', fontWeight: 'bold' }}>
            🎁 VIP TEXT SUBSCRIBERS SPIN EVERY 2 WEEKS! 🎁
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '8px' }}>
            Terms apply. One spin per customer per 2-week period.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
