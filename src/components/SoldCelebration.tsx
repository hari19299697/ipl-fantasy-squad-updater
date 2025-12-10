import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Star } from 'lucide-react';

interface SoldCelebrationProps {
  isVisible: boolean;
  playerName: string;
  teamName: string;
  teamColor: string;
  soldPrice: number;
  onComplete: () => void;
}

const Confetti = ({ color }: { color: string }) => {
  const pieces = Array.from({ length: 50 });
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: i % 3 === 0 ? color : i % 3 === 1 ? 'hsl(var(--secondary))' : 'hsl(var(--primary))',
            left: `${Math.random() * 100}%`,
            top: '-10px',
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 100,
            rotate: Math.random() * 720 - 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

const SoldCelebration: React.FC<SoldCelebrationProps> = ({
  isVisible,
  playerName,
  teamName,
  teamColor,
  soldPrice,
  onComplete,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onComplete, 3500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Confetti */}
          <Confetti color={teamColor} />
          
          {/* Content */}
          <motion.div
            className="relative z-10 text-center px-8 py-12"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 20,
              delay: 0.1 
            }}
          >
            {/* Trophy icon with glow */}
            <motion.div
              className="relative inline-block mb-6"
              animate={{ 
                rotate: [0, -10, 10, -5, 5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 0.6,
                delay: 0.3,
                ease: 'easeInOut'
              }}
            >
              <div 
                className="absolute inset-0 blur-2xl opacity-50 rounded-full"
                style={{ backgroundColor: teamColor }}
              />
              <Trophy className="w-20 h-20 text-secondary relative z-10" />
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-8 h-8 text-secondary" />
              </motion.div>
            </motion.div>

            {/* SOLD text */}
            <motion.h1
              className="text-6xl md:text-8xl font-black mb-4 tracking-tight"
              style={{ 
                background: `linear-gradient(135deg, ${teamColor}, hsl(var(--secondary)))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(0,0,0,0.1)'
              }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              SOLD!
            </motion.h1>

            {/* Player name */}
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-foreground mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              {playerName}
            </motion.h2>

            {/* Team name with color bar */}
            <motion.div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-6"
              style={{ backgroundColor: `${teamColor}20` }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: teamColor }}
              />
              <span className="text-xl font-semibold" style={{ color: teamColor }}>
                {teamName}
              </span>
            </motion.div>

            {/* Price */}
            <motion.div
              className="relative"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: 0.55,
                type: 'spring',
                stiffness: 400,
                damping: 15
              }}
            >
              <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl shadow-lg">
                <Star className="w-6 h-6" />
                <span className="text-3xl md:text-4xl font-black">
                  ₹{soldPrice.toLocaleString()}
                </span>
                <Star className="w-6 h-6" />
              </div>
              
              {/* Pulse ring effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-4 border-primary"
                animate={{ 
                  scale: [1, 1.2, 1.4],
                  opacity: [0.5, 0.2, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut'
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SoldCelebration;
