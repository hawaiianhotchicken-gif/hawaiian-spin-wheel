import React, { useState, useEffect } from 'react';
import { Gift, Clock, Flame, ShoppingBag, Shirt, DollarSign, Percent, Fries as FriesIcon } from 'lucide-react';

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

  const prizes = [
    { label: '$100 Gift Card', weight: 0, color: '#FF0000', icon: '🎁' },
    { label: '10% Off Next Order', weight: 20, color: '#FFED00', icon: '💰' },
    { label: 'Free Side of Fries', weight: 15, color: '#FF0000', icon: '🍟' },
    { label: 'Free Hawaiian Shirt', weight: 5, color: '#000000', icon: '👕' },
    { label: '$5 Off Next Order', weight: 5, color: '#FFED00', icon: '💵' },
    { label: 'Free Drink', weight: 5, color: '#FF0000', icon: '🥤' },
    { label: '5% Off Next Order', weight: 25, color: '#000000', icon: '🏷️' },
    { label: '5% Off Next Order', weight: 25, color: '#FFED00', icon: '🏷️' }
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
      for (let i = 0; i < 100; i++) {
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
    const targetRotation = 360 * 5 + (prizeIndex * segmentAngle) + (segmentAngle / 2);
    
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-400 text-2xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!customerPhone) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-red-600 to-black border-4 border-yellow-400 rounded-2xl p-8 text-center max-w-md">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">ACCESS DENIED</h1>
          <p className="text-white">Please use the link from your text message to access the spin wheel.</p>
        </div>
      </div>
    );
  }

  if (showWinScreen && result) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
        {/* Confetti Animation */}
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute w-3 h-3 animate-fall"
            style={{
              left: `${piece.left}%`,
              top: '-20px',
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              transform: 'rotate(45deg)'
            }}
          />
        ))}

        <div className="relative z-10 max-w-2xl w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="https://www.hawaiianhotchicken.com/uploads/1/4/4/0/144062827/published/hhc-3d-logo-color-bg.png"
              alt="Hawaiian Hot Chicken"
              className="w-48 h-48 mx-auto mb-4 animate-bounce"
            />
          </div>

          {/* Win Card */}
          <div className="bg-gradient-to-br from-yellow-400 via-red-600 to-black border-8 border-yellow-400 rounded-3xl p-8 shadow-2xl transform scale-105">
            <div className="text-center mb-6">
              <h1 className="text-6xl font-black text-white mb-2 drop-shadow-lg" style={{ textShadow: '4px 4px 0px #FF0000' }}>
                🎉 CONGRATULATIONS! 🎉
              </h1>
              <p className="text-3xl font-bold text-black bg-yellow-400 inline-block px-6 py-2 rounded-full">
                YOU JUST WON
              </p>
            </div>

            <div className="bg-black border-4 border-yellow-400 rounded-2xl p-8 mb-6">
              <p className="text-5xl font-black text-center text-yellow-400 mb-6" style={{ textShadow: '3px 3px 0px #FF0000' }}>
                {result.prize}
              </p>
              
              <div className="bg-gradient-to-r from-red-600 to-yellow-400 rounded-xl p-6 border-4 border-white">
                <p className="text-lg text-white text-center mb-2 font-bold">YOUR REDEMPTION CODE</p>
                <p className="text-5xl font-mono font-black text-center text-black bg-yellow-400 py-4 rounded-lg tracking-widest">
                  {result.code}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <a
                href="https://www.hawaiianhotchicken.com/order"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-red-600 to-yellow-400 text-black text-2xl font-black py-6 rounded-2xl text-center border-4 border-black shadow-xl transform hover:scale-105 transition"
              >
                🔥 ORDER ONLINE NOW 🔥
              </a>
              
              <button
                onClick={() => setShowWinScreen(false)}
                className="block w-full bg-black text-yellow-400 text-xl font-bold py-4 rounded-2xl text-center border-4 border-yellow-400 hover:bg-yellow-400 hover:text-black transition"
              >
                Back to Wheel
              </button>
            </div>

            <p className="text-center text-white mt-6 text-sm font-bold">
              📸 Screenshot this code and show it when ordering!
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes fall {
            to {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
          .animate-fall {
            animation: fall linear forwards;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo Header */}
        <div className="text-center mb-8 pt-8">
          <img 
            src="https://www.hawaiianhotchicken.com/uploads/1/4/4/0/144062827/published/hhc-3d-logo-color-bg.png"
            alt="Hawaiian Hot Chicken"
            className="w-40 h-40 mx-auto mb-4"
          />
          <h1 className="text-5xl font-black text-yellow-400 mb-2" style={{ textShadow: '3px 3px 0px #FF0000' }}>
            SPIN TO WIN
          </h1>
          <p className="text-2xl font-bold text-white bg-red-600 inline-block px-6 py-2 rounded-full border-4 border-yellow-400">
            🎁 VIP EXCLUSIVE 🎁
          </p>
        </div>

        {/* Wheel Container */}
        <div className="bg-gradient-to-br from-red-600 via-black to-red-600 rounded-3xl p-8 shadow-2xl mb-6 border-8 border-yellow-400">
          <div className="relative w-full max-w-md mx-auto">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-20">
              <div className="w-0 h-0 border-l-[25px] border-r-[25px] border-t-[40px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-2xl"></div>
            </div>
            
            {/* Glossy Wheel */}
            <div className="relative aspect-square rounded-full shadow-2xl">
              <svg
                className="w-full h-full drop-shadow-2xl"
                viewBox="0 0 200 200"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                  filter: 'drop-shadow(0 0 20px rgba(255, 237, 0, 0.5))'
                }}
              >
                {/* Outer ring */}
                <circle cx="100" cy="100" r="98" fill="none" stroke="#FFED00" strokeWidth="4" />
                
                {prizes.map((prize, i) => {
                  const angle = (360 / prizes.length) * i;
                  const nextAngle = (360 / prizes.length) * (i + 1);
                  
                  const x1 = 100 + 95 * Math.cos((angle - 90) * Math.PI / 180);
                  const y1 = 100 + 95 * Math.sin((angle - 90) * Math.PI / 180);
                  const x2 = 100 + 95 * Math.cos((nextAngle - 90) * Math.PI / 180);
                  const y2 = 100 + 95 * Math.sin((nextAngle - 90) * Math.PI / 180);
                  
                  const midAngle = (angle + nextAngle) / 2;
                  const textX = 100 + 65 * Math.cos((midAngle - 90) * Math.PI / 180);
                  const textY = 100 + 65 * Math.sin((midAngle - 90) * Math.PI / 180);
                  const iconX = 100 + 45 * Math.cos((midAngle - 90) * Math.PI / 180);
                  const iconY = 100 + 45 * Math.sin((midAngle - 90) * Math.PI / 180);
                  
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
                        opacity="0.3"
                      />
                      
                      {/* Icon */}
                      <text
                        x={iconX}
                        y={iconY}
                        fontSize="20"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${midAngle}, ${iconX}, ${iconY})`}
                      >
                        {prize.icon}
                      </text>
                      
                      {/* Text */}
                      <text
                        x={textX}
                        y={textY}
                        fill={prize.color === '#000000' ? '#FFED00' : '#000000'}
                        fontSize="6"
                        fontWeight="900"
                        textAnchor="middle"
                        transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                        stroke={prize.color === '#000000' ? '#000000' : '#FFED00'}
                        strokeWidth="0.5"
                      >
                        {prize.label.split(' ').map((word, wi) => (
                          <tspan key={wi} x={textX} dy={wi === 0 ? -4 : 7}>
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
                <circle cx="100" cy="100" r="20" fill="#FFED00" stroke="#FF0000" strokeWidth="4" />
                <circle cx="100" cy="100" r="15" fill="#FF0000" />
                <text x="100" y="105" fontSize="16" textAnchor="middle" fill="#FFED00" fontWeight="bold">
                  🔥
                </text>
              </svg>
            </div>
          </div>

          {/* Spin Button */}
          <div className="text-center mt-8">
            {canSpin ? (
              <button
                onClick={spin}
                disabled={spinning}
                className={`px-16 py-6 rounded-2xl text-3xl font-black border-4 shadow-2xl transform transition ${
                  spinning
                    ? 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-yellow-400 text-black border-yellow-400 hover:scale-110 hover:shadow-yellow-400/50 active:scale-95 animate-pulse'
                }`}
                style={{ textShadow: spinning ? 'none' : '2px 2px 0px rgba(0,0,0,0.5)' }}
              >
                {spinning ? '🌀 SPINNING...' : '🔥 SPIN NOW! 🔥'}
              </button>
            ) : (
              <div className="text-center bg-gradient-to-r from-red-600 to-black border-4 border-yellow-400 rounded-2xl p-6">
                <div className="flex items-center justify-center gap-3 text-yellow-400 mb-2">
                  <Clock size={32} />
                  <span className="text-3xl font-black">
                    {getDaysUntilNextSpin()} DAYS
                  </span>
                </div>
                <p className="text-white text-xl font-bold">Until your next spin!</p>
              </div>
            )}
          </div>
        </div>

        {/* Win History */}
        {history.length > 0 && (
          <div className="bg-gradient-to-br from-red-600 to-black rounded-3xl p-6 shadow-2xl border-4 border-yellow-400">
            <h3 className="text-2xl font-black text-yellow-400 mb-4 flex items-center gap-2">
              <Gift size={28} />
              YOUR WINS
            </h3>
            <div className="space-y-3">
              {history.slice().reverse().map((win, i) => (
                <div key={i} className="bg-black border-2 border-yellow-400 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-yellow-400 text-lg">{win.prize}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(win.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-mono text-sm font-bold text-white bg-red-600 px-3 py-1 rounded border-2 border-yellow-400">
                      {win.code}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-yellow-400 text-lg font-bold">
            🎁 VIP TEXT SUBSCRIBERS SPIN EVERY 2 WEEKS! 🎁
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Terms apply. One spin per customer per 2-week period.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
