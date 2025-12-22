import React, { useState, useEffect } from 'react';
import { Gift, Clock, Flame } from 'lucide-react';

const App = () => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [lastSpinDate, setLastSpinDate] = useState(null);
  const [canSpin, setCanSpin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  const prizes = [
    { label: '$100 Gift Card', weight: 0, color: '#FF6B35' },
    { label: '10% Off Next Order', weight: 20, color: '#F7931E' },
    { label: 'Free Side of Fries', weight: 15, color: '#FDB913' },
    { label: 'Free Hawaiian Shirt', weight: 5, color: '#C1272D' },
    { label: '$5 Off Next Order', weight: 5, color: '#FF6B35' },
    { label: 'Free Drink', weight: 5, color: '#F7931E' },
    { label: '5% Off Next Order', weight: 25, color: '#FDB913' },
    { label: '5% Off Next Order', weight: 25, color: '#C1272D' }
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
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  if (!customerPhone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please use the link from your text message to access the spin wheel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="text-yellow-300" size={32} />
            <h1 className="text-4xl font-bold text-white">Hawaiian Hot Chicken</h1>
            <Flame className="text-yellow-300" size={32} />
          </div>
          <p className="text-yellow-100 text-lg">🎁 VIP Text Subscriber Spin 🎁</p>
        </div>

        {result && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-2xl text-center transform animate-bounce">
            <Gift className="mx-auto text-red-600 mb-3" size={48} />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">🎉 You Won! 🎉</h2>
            <p className="text-2xl font-bold text-red-600 mb-4">{result.prize}</p>
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Your Redemption Code:</p>
              <p className="text-3xl font-mono font-bold text-red-600 tracking-wider">{result.code}</p>
            </div>
            <p className="text-sm text-gray-600">Screenshot this code and show it when ordering!</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-8 shadow-2xl mb-6">
          <div className="relative w-full max-w-md mx-auto">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
              <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg"></div>
            </div>
            
            <div className="relative aspect-square">
              <svg
                className="w-full h-full"
                viewBox="0 0 200 200"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                }}
              >
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
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 95 95 0 0 1 ${x2} ${y2} Z`}
                        fill={prize.color}
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x={textX}
                        y={textY}
                        fill="white"
                        fontSize="7"
                        fontWeight="bold"
                        textAnchor="middle"
                        transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                      >
                        {prize.label.split(' ').map((word, wi) => (
                          <tspan key={wi} x={textX} dy={wi === 0 ? 0 : 8}>
                            {word}
                          </tspan>
                        ))}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="15" fill="white" stroke="#C1272D" strokeWidth="3" />
              </svg>
            </div>
          </div>

          <div className="text-center mt-8">
            {canSpin ? (
              <button
                onClick={spin}
                disabled={spinning}
                className={`px-12 py-4 rounded-full text-xl font-bold text-white shadow-lg transform transition ${
                  spinning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-orange-500 hover:scale-105 hover:shadow-xl active:scale-95'
                }`}
              >
                {spinning ? 'SPINNING...' : '🔥 SPIN NOW 🔥'}
              </button>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                  <Clock size={24} />
                  <span className="text-xl font-bold">
                    Next spin in {getDaysUntilNextSpin()} days
                  </span>
                </div>
                <p className="text-gray-600 text-sm">Come back in 2 weeks for another spin!</p>
              </div>
            )}
          </div>
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Gift size={24} className="text-red-600" />
              Your Win History
            </h3>
            <div className="space-y-3">
              {history.slice().reverse().map((win, i) => (
                <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-red-600">{win.prize}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(win.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-mono text-sm font-bold text-gray-700">{win.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8 pb-8">
          <p className="text-white text-sm">
            VIP text subscribers get one spin every 2 weeks!
          </p>
          <p className="text-yellow-200 text-xs mt-2">
            Terms apply. One spin per customer per 2-week period.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
