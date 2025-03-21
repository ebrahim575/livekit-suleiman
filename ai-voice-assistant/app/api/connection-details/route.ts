import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

// Check both prefixed and non-prefixed environment variables
const API_KEY = process.env.LIVEKIT_API_KEY || process.env.NEXT_PUBLIC_LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET || process.env.NEXT_PUBLIC_LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

// don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export async function GET() {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    // Generate participant token
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;
    const participantToken = await createParticipantToken(
      { identity: participantIdentity },
      roomName
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName: participantIdentity,
    };
    const headers = new Headers({
      "Cache-Control": "no-store",
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

async function createParticipantToken(userInfo: { identity: string }, roomName: string): Promise<string> {
  if (!API_KEY || !API_SECRET) {
    throw new Error('LiveKit configuration is missing');
  }
  
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "15m",
  });
  
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });
  
  return at.toJwt();
}

export async function POST(req: NextRequest) {
  try {
    const { liveKitUrl, apiKey, apiSecret, identity, roomName } = await req.json();

    if (!liveKitUrl || !apiKey || !apiSecret || !identity || !roomName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create proper token with all required permissions
    const at = new AccessToken(apiKey, apiSecret, { 
      identity,
      ttl: "15m" 
    });
    
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    // Return in the exact format that LiveKitRoom expects
    const token = await at.toJwt();
    
    const data: ConnectionDetails = {
      serverUrl: liveKitUrl,
      roomName: roomName,
      participantName: identity,
      participantToken: token
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 