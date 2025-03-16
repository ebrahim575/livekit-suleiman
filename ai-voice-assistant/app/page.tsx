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
    <div className="relative flex flex-col items-center justify-center w-screen h-screen overflow-hidden">
      {/* Create a gradient background with all three Yaqeen colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0052ff]/10 via-white to-[#ff9900]/20"></div>
      
      {/* Add diagonal colored stripes for additional visual interest */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10%] rotate-12 opacity-[0.07]">
          <div className="absolute top-0 left-0 w-full h-8 bg-[#0052ff]"></div>
          <div className="absolute top-24 left-0 w-full h-2 bg-[#ff9900]"></div>
          <div className="absolute top-40 left-0 w-full h-4 bg-[#0052ff]"></div>
          <div className="absolute top-64 left-0 w-full h-6 bg-[#ff9900]"></div>
          <div className="absolute top-96 left-0 w-full h-3 bg-[#0052ff]"></div>
          <div className="absolute top-[30rem] left-0 w-full h-5 bg-[#ff9900]"></div>
          <div className="absolute top-[40rem] left-0 w-full h-7 bg-[#0052ff]"></div>
        </div>
      </div>

      {/* Light pattern background */}
      <div className="absolute inset-0 bg-[url('/pattern-light.svg')] opacity-10 pointer-events-none z-10"></div>

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid lines - using specified Yaqeen blue and orange */}
        {gridLines.map((line, i) => (
          <motion.div
            key={i}
            className={`absolute h-0.5 bg-gradient-to-r from-transparent ${i % 3 === 0 ? 'via-[#ff9900]/20' : 'via-[#0052ff]/20'} to-transparent`}
            style={{
              top: `${line.top}%`,
              left: "50%",
              width: `${line.width}%`,
              transform: `translateX(-50%) rotate(${line.rotate}deg)`,
            }}
            animate={{
              opacity: [0.1, 0.2, 0.1],
              width: [`${line.width}%`, `${line.width + 20}%`],
            }}
            transition={{
              duration: 3 + Math.random() * 5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              delay: Math.random() * 5,
            }}
          />
        ))}

        {/* Circular elements - using specified Yaqeen colors */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] border border-[#0052ff]/15 rounded-full"
          style={{ transform: "translate(-50%, -50%)" }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] border border-[#ff9900]/25 rounded-full"
          style={{ transform: "translate(-50%, -50%)" }}
          animate={{ scale: [1.05, 1, 1.05] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[300px] h-[300px] border border-[#0052ff]/15 rounded-full"
          style={{ transform: "translate(-50%, -50%)" }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
        />
      </div>

      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-white/50"></div>

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
        <div className="text-2xl text-[#0052ff] tracking-wider mb-8 font-prata">
          <span className="text-[#0052ff]">Peace be upon </span>
          <span className="text-[#ff9900]">you</span>
        </div>
        <SimpleVoiceAssistant onStateChange={setAgentState} />
        <ControlBar onConnectButtonClicked={onConnectButtonClicked} agentState={agentState} />
        <RoomAudioRenderer />
      </LiveKitRoom>

      {/* Orange decorative corner elements */}
      <div className="absolute top-4 right-4 w-24 h-1 bg-[#ff9900] rounded-full"></div>
      <div className="absolute top-4 right-4 w-1 h-24 bg-[#ff9900] rounded-full"></div>
      <div className="absolute bottom-4 left-4 w-24 h-1 bg-[#ff9900] rounded-full"></div>
      <div className="absolute bottom-4 left-4 w-1 h-24 bg-[#ff9900] rounded-full"></div>

      {/* Bottom right attribution */}
      <div className="absolute bottom-1 right-4 text-[#0052ff] font-prata text-xs opacity-70">
        Not Affiliated with <span className="text-[#ff9900]">Omer Suleiman</span> or Yaqeen Institute
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
        className="w-56 h-56 rounded-full bg-gradient-to-br from-[#0052ff]/20 via-white to-[#ff9900]/20 p-[2px] shadow-lg"
        animate={{
          boxShadow: state !== "disconnected" ? "0 0 30px rgba(0, 82, 255, 0.3)" : "0 4px 12px rgba(0, 82, 255, 0.15)",
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#0052ff]/20">
          <div className="relative w-full h-full">
            <Image
              src="/os.jpg"
              alt="Profile"
              width={224}
              height={224}
              className="object-cover"
            />
            {/* Orange accent circle */}
            <div className="absolute -bottom-1 -right-1 w-12 h-12 rounded-full border-4 border-white bg-[#ff9900]"></div>
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
      className="relative z-20 w-16 h-16 rounded-full flex items-center justify-center bg-white border border-[#0052ff]/30 shadow-md hover:bg-[#0052ff]/5 hover:border-[#0052ff]/50"
      onClick={toggleMute}
    >
      {isMuted ? (
        <MicOff className="w-6 h-6 text-[#ff9900]" />
      ) : (
        <Mic className="w-6 h-6 text-[#0052ff]" />
      )}
      <motion.div
        className="absolute inset-0 rounded-full border border-[#0052ff]/50"
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
            className="relative z-20 w-16 h-16 rounded-full flex items-center justify-center bg-white border border-[#0052ff]/30 shadow-md hover:bg-[#0052ff]/5 hover:border-[#0052ff]/50"
            onClick={() => props.onConnectButtonClicked()}
          >
            <Mic className="w-6 h-6 text-[#0052ff]" />
            <motion.div
              className="absolute inset-0 rounded-full border border-[#ff9900]/50"
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
    </div>
  );
}

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}

