"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff } from "lucide-react"
import Image from "next/image"
import {
  AgentState,
  DisconnectButton,
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useRoomContext
} from "@livekit/components-react";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import { MediaDeviceFailure, Track, Room, LocalParticipant, LocalTrackPublication } from "livekit-client";
import type { ConnectionDetails } from "./api/connection-details/route";

export default function VoiceAssistant() {
  const [connectionDetails, updateConnectionDetails] = useState<ConnectionDetails | undefined>(undefined);
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  const [scrambledAddress, setScrambledAddress] = useState("0x2D90785E30A9df6ccE329c0171CB8Ba0f4a5c17b");
  const [gridLines, setGridLines] = useState<Array<{ top: number; width: number; rotate: number }>>([]); 
  
  const originalAddress = "0x2D90785E30A9df6ccE329c0171CB8Ba0f4a5c17b";
  
  useEffect(() => {
    const scrambleInterval = setInterval(() => {
      const chars = "0123456789abcdefABCDEF";
      const positions = Math.floor(Math.random() * 3) + 1; // Scramble 1-3 positions at a time
      let newAddress = scrambledAddress.split('');
      
      for(let i = 0; i < positions; i++) {
        const pos = Math.floor(Math.random() * (scrambledAddress.length - 2)) + 2; // Don't scramble 0x
        newAddress[pos] = chars[Math.floor(Math.random() * chars.length)];
      }
      
      setScrambledAddress(newAddress.join(''));
    }, 50); // Scramble every 50ms
    
    // Reset to original address every 2 seconds
    const resetInterval = setInterval(() => {
      setScrambledAddress(originalAddress);
    }, 2000);

    return () => {
      clearInterval(scrambleInterval);
      clearInterval(resetInterval);
    };
  }, [scrambledAddress]);

  // Generate grid lines on client-side only
  useEffect(() => {
    const lines = [...Array(15)].map(() => ({
      top: Math.random() * 100,
      width: Math.random() * 100 + 100,
      rotate: Math.random() * 360
    }));
    setGridLines(lines);
  }, []);

  const onConnectButtonClicked = useCallback(async () => {
    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData = await response.json();
    updateConnectionDetails(connectionDetailsData);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-screen h-screen overflow-hidden bg-black">
      {/* Video Background */}
      {/*
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>
      */}

      {/* Terminator-style scan lines */}
      <div className="absolute inset-0 bg-[url('/scanlines.svg')] opacity-10 pointer-events-none z-10"></div>

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Red targeting grid lines */}
        {gridLines.map((line, i) => (
          <motion.div
            key={i}
            className="absolute h-0.5 bg-gradient-to-r from-transparent via-purple-600/30 to-transparent"
            style={{
              top: `${line.top}%`,
              left: "50%",
              width: `${line.width}%`,
              transform: `translateX(-50%) rotate(${line.rotate}deg)`,
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              width: [`${line.width}%`, `${line.width + 50}%`],
            }}
            transition={{
              duration: 3 + Math.random() * 5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              delay: Math.random() * 5,
            }}
          />
        ))}

        {/* Circular targeting elements */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] border border-purple-600/20 rounded-full"
          style={{ transform: "translate(-50%, -50%)" }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] border border-purple-600/15 rounded-full"
          style={{ transform: "translate(-50%, -50%)" }}
          animate={{ scale: [1.05, 1, 1.05] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[300px] h-[300px] border border-purple-600/10 rounded-full"
          style={{ transform: "translate(-50%, -50%)" }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
        />
      </div>

      <LiveKitRoom
        token={connectionDetails?.participantToken}
        serverUrl={connectionDetails?.serverUrl}
        connect={connectionDetails !== undefined}
        audio={true}
        video={false}
        onMediaDeviceFailure={onDeviceFailure}
        onDisconnected={() => {
          updateConnectionDetails(undefined);
        }}
        className="relative z-20 flex flex-col items-center justify-center"
      >
        <SimpleVoiceAssistant onStateChange={setAgentState} />
        <ControlBar onConnectButtonClicked={onConnectButtonClicked} agentState={agentState} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 font-prata text-[30px] text-white tracking-wider bg-black/40 px-3 py-1 rounded-md border border-purple-900/30 uppercase"
          style={{
            textShadow: '0 0 5px rgba(255, 255, 255, 0.5)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.05em'
          }}
        >
          {scrambledAddress}
        </motion.div>
        <RoomAudioRenderer />
      </LiveKitRoom>

      {/* HUD elements */}
      <div className="absolute bottom-4 left-4 text-white font-prata text-xs uppercase tracking-wider">
        <div className="bg-black/40 px-2 py-1 rounded-md border border-purple-900/30">SYS:ACTIVE</div>
        <div className="mt-1 bg-black/40 px-2 py-1 rounded-md border border-purple-900/30">T-800 INTERFACE v1.0</div>
      </div>

      <div className="absolute top-4 right-4 text-white font-prata text-[30px] text-right uppercase">
        <div>Solve Riddle</div>
        <div>Get CA</div>
        <div>Ape in</div>
      </div>

      <div className="absolute bottom-1 right-4 text-white font-prata text-xs opacity-70">
        not affiliated with ejaaz or aiccelerate
      </div>
    </div>
  );
}

function SimpleVoiceAssistant(props: { onStateChange: (state: AgentState) => void }) {
  const { state, audioTrack } = useVoiceAssistant();
  
  useEffect(() => {
    props.onStateChange(state);
  }, [props, state]);

  return (
    <motion.div
      className="relative z-20"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-56 h-56 rounded-full bg-gradient-to-br from-purple-600/50 to-purple-900/50 p-[2px]"
        animate={{
          boxShadow: state !== "disconnected" ? "0 0 30px rgba(147, 51, 234, 0.5)" : "0 0 15px rgba(147, 51, 234, 0.3)",
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center overflow-hidden border border-purple-800/40">
          <div className="relative w-full h-full">
            <Image
              src="/ej.png"
              alt="Terminator Profile"
              width={224}
              height={224}
              className="object-cover"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CustomMicButton() {
  const room = useRoomContext() as Room;
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    const localParticipant = room?.localParticipant;
    if (localParticipant) {
      const micPublication = localParticipant.getTrackPublication(Track.Source.Microphone);
      if (micPublication?.track?.isMuted) {
        micPublication.track.unmute();
        setIsMuted(false);
      } else if (micPublication?.track) {
        micPublication.track.mute();
        setIsMuted(true);
      }
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="relative z-20 w-16 h-16 rounded-full flex items-center justify-center bg-black border border-purple-800/30 hover:bg-purple-900/30 hover:border-purple-600/50"
      onClick={toggleMute}
    >
      {isMuted ? (
        <MicOff className="w-6 h-6 text-purple-400" />
      ) : (
        <Mic className="w-6 h-6 text-purple-400" />
      )}
      <motion.div
        className="absolute inset-0 rounded-full border border-purple-600/50"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
      />
    </motion.button>
  );
}

function ControlBar(props: { onConnectButtonClicked: () => void; agentState: AgentState }) {
  const krisp = useKrispNoiseFilter();
  useEffect(() => {
    krisp.setNoiseFilterEnabled(true);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center mt-8">
      <AnimatePresence>
        {props.agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="relative z-20 w-16 h-16 rounded-full flex items-center justify-center bg-black border border-purple-800/30 hover:bg-purple-900/30 hover:border-purple-600/50"
            onClick={() => props.onConnectButtonClicked()}
          >
            <Mic className="w-6 h-6 text-purple-400" />
            <motion.div
              className="absolute inset-0 rounded-full border border-purple-600/50"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            />
          </motion.button>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {props.agentState !== "disconnected" && props.agentState !== "connecting" && (
          <CustomMicButton />
        )}
      </AnimatePresence>

      {/* Status text */}
      <motion.div
        className="mt-8 text-white font-prata tracking-wider text-center text-[30px] uppercase"
        animate={{
          opacity: props.agentState !== "disconnected" ? 1 : 0.7,
        }}
      >
        {props.agentState !== "disconnected" ? "UNLOCK THE CA" : "UNLOCK THE CA"}
      </motion.div>
    </div>
  );
}

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}

