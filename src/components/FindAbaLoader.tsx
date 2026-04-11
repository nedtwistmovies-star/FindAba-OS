
import React from 'react';
import { motion } from 'motion/react';

/**
 * FindAbaLoader - A premium, minimalistic loading animation.
 * Features a symbolic sequence of a human scanning with a telescope 
 * and an elephant stepping forward in readiness.
 */
const FindAbaLoader: React.FC = () => {
  // Brand Colors
  const colors = {
    yellow: "#F1C40F",
    darkBlue: "#001F3F",
    glow: "rgba(241, 196, 15, 0.3)"
  };

  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle Ambient Shadow */}
        <motion.ellipse
          cx="120" cy="175" rx="50" ry="8"
          fill="rgba(0,0,0,0.15)"
          animate={{
            rx: [50, 60, 50],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ELEPHANT (Dark Blue) - Strength + Movement */}
        <motion.g
          initial={{ x: 0 }}
          animate={{
            x: [0, 8, 0], // Grounded step forward
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut",
            times: [0, 0.5, 1]
          }}
        >
          {/* Elephant Body Silhouette */}
          <path
            d="M100,170 L100,120 Q100,80 140,80 Q180,80 180,120 L180,170 L160,170 L160,140 L120,140 L120,170 Z"
            fill={colors.darkBlue}
          />
          {/* Elephant Head & Ear */}
          <path
            d="M100,120 Q100,90 130,90 Q150,90 150,120 L130,130 Z"
            fill={colors.darkBlue}
          />
          <path
            d="M130,95 Q160,95 160,120 Q160,140 140,140"
            fill={colors.darkBlue}
          />

          {/* Trunk - Controlled upward curl */}
          <motion.path
            d="M100,120 Q85,120 85,140"
            fill="none"
            stroke={colors.darkBlue}
            strokeWidth="14"
            strokeLinecap="round"
            animate={{
              d: [
                "M100,120 Q85,120 85,140", // Initial
                "M100,120 Q70,110 80,85",  // Curled up (Readiness)
                "M100,120 Q85,120 85,140"  // Back
              ]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut",
              times: [0, 0.6, 1]
            }}
          />
        </motion.g>

        {/* HUMAN (Yellow) - Intelligence + Search */}
        <motion.g
          initial={{ y: 0 }}
          animate={{
            y: [0, -3, 0], // Subtle breathing/life
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Human Body Silhouette */}
          <path
            d="M55,170 L55,120 Q55,100 75,100 Q95,100 95,120 L95,170 L85,170 L85,140 L65,140 L65,170 Z"
            fill={colors.yellow}
          />
          {/* Head */}
          <circle cx="75" cy="90" r="12" fill={colors.yellow} />
          
          {/* Arm with Telescope - Scanning Motion */}
          <motion.g
            style={{ originX: "75px", originY: "110px" }}
            animate={{
              rotate: [0, -15, 15, 0], // Raising and scanning
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut",
              times: [0, 0.3, 0.7, 1]
            }}
          >
             {/* Arm */}
             <path d="M75,110 L45,95" stroke={colors.yellow} strokeWidth="10" strokeLinecap="round" />
             {/* Telescope */}
             <path d="M45,95 L15,85 L18,70 L48,80 Z" fill={colors.yellow} />
          </motion.g>
        </motion.g>

        {/* Alignment Pulse/Glow */}
        <motion.circle
          cx="100" cy="110" r="0"
          stroke={colors.yellow}
          strokeWidth="1"
          fill="none"
          animate={{
            r: [0, 140],
            opacity: [0, 0.4, 0],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeOut", 
            delay: 1.8 
          }}
        />
        
        {/* Subtle secondary glow */}
        <motion.circle
          cx="100" cy="110" r="0"
          stroke={colors.darkBlue}
          strokeWidth="1"
          fill="none"
          animate={{
            r: [0, 160],
            opacity: [0, 0.2, 0],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeOut", 
            delay: 2.0 
          }}
        />
      </svg>
    </div>
  );
};

export default FindAbaLoader;
