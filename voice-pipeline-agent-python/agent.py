import logging
import os
from pathlib import Path
import sys
import time
import requests

from dotenv import load_dotenv
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
    metrics,
)
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import cartesia, openai, deepgram, silero, turn_detector, elevenlabs # type: ignore
import pprint


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("voice-agent")
logger.info("Starting voice agent application...")

# Load from .env.local in root directory
parent_dir = Path(__file__).parent.parent
env_path = os.path.join(parent_dir, ".env.local")

print(f"Looking for .env file at: {env_path}")
if os.path.exists(env_path):
    print(f"Found .env file at: {env_path}")
    load_dotenv(dotenv_path=env_path)
    logger.info(f"Loaded environment from {env_path}")
else:
    print("No .env.local found, using system environment variables")
    logger.info("No .env.local found, using system environment variables")

# Verify required environment variables are set
required_vars = [
    "LIVEKIT_URL",
    "LIVEKIT_API_KEY",
    "LIVEKIT_API_SECRET",
    "OPENAI_API_KEY",
    "DEEPGRAM_API_KEY",
    "ELEVEN_API_KEY"
]

# Define voice IDs
custom_voice_id = '19LdK0ZWHXL01qZcdEtY'

print("Environment Variables Loaded:")
logger.info("Environment Variables Loaded:")
env_vars = {var: os.getenv(var, "NOT SET") for var in required_vars}
pprint.pprint(env_vars)

missing_vars = []
for var in required_vars:
    if not os.getenv(var):
        missing_vars.append(var)
        print(f"WARNING: Missing required environment variable: {var}")

if missing_vars:
    error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
    logger.error(error_msg)
    raise ValueError(error_msg)

print("All required environment variables are set")


def prewarm(proc: JobProcess):
    print("Starting prewarm function...")
    logger.info("Starting prewarm function...")
    try:
        print("Loading VAD model...")
        start_time = time.time()
        proc.userdata["vad"] = silero.VAD.load()
        elapsed = time.time() - start_time
        print(f"VAD model loaded successfully in {elapsed:.2f} seconds")
        logger.info(f"VAD model loaded successfully in {elapsed:.2f} seconds")
    except Exception as e:
        error_msg = f"Error loading VAD model: {str(e)}"
        print(error_msg)
        logger.error(error_msg)
        raise


async def entrypoint(ctx: JobContext):
    print(f"Entrypoint function started for room: {ctx.room.name}")
    logger.info(f"Entrypoint function started for room: {ctx.room.name}")
    
    # Fetch the Omer Suleiman persona from GitHub Gist
    suleiman_prompt_url = "https://gist.githubusercontent.com/ebrahim575/e9f329cb9e8a4bc7ae5795b7dcbb46fe/raw/suleiman_prompt.txt"
    try:
        print("Fetching Omer Suleiman persona from GitHub Gist...")
        response = requests.get(suleiman_prompt_url)
        response.raise_for_status()  # Raise an exception for HTTP errors
        suleiman_persona = response.text
        print("Successfully fetched Omer Suleiman persona from GitHub Gist")
        logger.info("Successfully fetched Omer Suleiman persona from GitHub Gist")
    except Exception as e:
        error_msg = f"Error fetching Omer Suleiman persona: {str(e)}"
        print(error_msg)
        logger.error(error_msg)
        # Fall back to a simple prompt if the fetch fails
        suleiman_persona = "You are Omer, the AI Islamic Guide. You are an AI scholar with expertise in Islamic spirituality, social justice, and ethical living. You are warm, wise, and compassionate."
        print("Using fallback persona due to fetch error")
        logger.warning("Using fallback persona due to fetch error")
    
    print("Creating initial chat context...")
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=suleiman_persona
    )
    print("Initial chat context created")

    print(f"Connecting to room {ctx.room.name}...")
    logger.info(f"Connecting to room {ctx.room.name}...")
    try:
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
        print(f"Successfully connected to room {ctx.room.name}")
        logger.info(f"Successfully connected to room {ctx.room.name}")
    except Exception as e:
        error_msg = f"Error connecting to room: {str(e)}"
        print(error_msg)
        logger.error(error_msg)
        raise

    # Wait for the first participant to connect
    print("Waiting for participant to connect...")
    logger.info("Waiting for participant to connect...")
    try:
        participant = await ctx.wait_for_participant()
        print(f"Participant connected: {participant.identity}")
        logger.info(f"Participant connected: {participant.identity}")
    except Exception as e:
        error_msg = f"Error waiting for participant: {str(e)}"
        print(error_msg)
        logger.error(error_msg)
        raise

    # This project is configured to use Deepgram STT, OpenAI LLM and Cartesia TTS plugins
    # Other great providers exist like Cerebras, ElevenLabs, Groq, Play.ht, Rime, and more
    # Learn more and pick the best one for your app:
    # https://docs.livekit.io/agents/plugins
    print("Creating voice pipeline agent...")
    logger.info("Creating voice pipeline agent...")
    try:
        agent = VoicePipelineAgent(
            vad=ctx.proc.userdata["vad"],
            stt=deepgram.STT(),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=elevenlabs.TTS(
                model="eleven_turbo_v2_5",
                voice=elevenlabs.Voice(
                    id=custom_voice_id,
                    name="Custom Voice",
                    category="premade",
                    settings=elevenlabs.VoiceSettings(
                        stability=0.35,
                        similarity_boost=1.0,
                        style=0.35,
                        use_speaker_boost=True,
                        speed=0.85
                    ),
                ),
                language="en",
                streaming_latency=3,
                enable_ssml_parsing=False,
            ),
            turn_detector=turn_detector.EOUModel(),
            # minimum delay for endpointing, used when turn detector believes the user is done with their turn
            min_endpointing_delay=0.5,
            # maximum delay for endpointing, used when turn detector does not believe the user is done with their turn
            max_endpointing_delay=5.0,
            chat_ctx=initial_ctx,
        )
        print("Voice pipeline agent created successfully")
        logger.info("Voice pipeline agent created successfully")
    except Exception as e:
        error_msg = f"Error creating voice pipeline agent: {str(e)}"
        print(error_msg)
        logger.error(error_msg)
        raise

    print("Setting up metrics collector...")
    usage_collector = metrics.UsageCollector()

    @agent.on("metrics_collected")
    def on_metrics_collected(agent_metrics: metrics.AgentMetrics):
        print(f"Metrics collected: {agent_metrics}")
        metrics.log_metrics(agent_metrics)
        usage_collector.collect(agent_metrics)

    print("Starting agent...")
    logger.info("Starting agent...")
    try:
        agent.start(ctx.room, participant)
        print("Agent started successfully")
        logger.info("Agent started successfully")
    except Exception as e:
        error_msg = f"Error starting agent: {str(e)}"
        print(error_msg)
        logger.error(error_msg)
        raise

    # The agent should be polite and greet the user when it joins :)
    print("Sending initial greeting...")
    logger.info("Sending initial greeting...")
    try:
        await agent.say("Hey, how can I help you today?", allow_interruptions=True)
        print("Initial greeting sent")
        logger.info("Initial greeting sent")
    except Exception as e:
        error_msg = f"Error sending initial greeting: {str(e)}"
        print(error_msg)
        logger.error(error_msg)
        raise


if __name__ == "__main__":
    print(f"Starting application with arguments: {sys.argv}")
    logger.info(f"Starting application with arguments: {sys.argv}")
    try:
        cli.run_app(
            WorkerOptions(
                entrypoint_fnc=entrypoint,
                prewarm_fnc=prewarm,
            ),
        )
        print("Application completed successfully")
        logger.info("Application completed successfully")
    except Exception as e:
        error_msg = f"Application error: {str(e)}"
        print(error_msg)
        logger.error(error_msg)
        sys.exit(1)
