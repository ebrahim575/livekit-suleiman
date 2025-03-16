<a href="https://livekit.io/">
  <img src="./.github/assets/livekit-mark.png" alt="LiveKit logo" width="100" height="100">
</a>

# Python Voice Agent

<p>
  <a href="https://cloud.livekit.io/projects/p_/sandbox"><strong>Deploy a sandbox app</strong></a>
  •
  <a href="https://docs.livekit.io/agents/overview/">LiveKit Agents Docs</a>
  •
  <a href="https://livekit.io/cloud">LiveKit Cloud</a>
  •
  <a href="https://blog.livekit.io/">Blog</a>
</p>

A basic example of a voice agent using LiveKit and Python.

## Dev Setup

Clone the repository and install dependencies to a virtual environment:

```console
# Linux/macOS
cd voice-pipeline-agent-python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 agent.py download-files
```

<details>
  <summary>Windows instructions (click to expand)</summary>
  
```cmd
:: Windows (CMD/PowerShell)
cd voice-pipeline-agent-python
python3 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
</details>


Set up the environment by copying `.env.example` to `.env.local` and filling in the required values:

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `OPENAI_API_KEY`
- `CARTESIA_API_KEY`
- `DEEPGRAM_API_KEY`

You can also do this automatically using the LiveKit CLI:

```console
lk app env
```

Run the agent:

```console
python3 agent.py dev
```

This agent requires a frontend application to communicate with. You can use one of our example frontends in [livekit-examples](https://github.com/livekit-examples/), create your own following one of our [client quickstarts](https://docs.livekit.io/realtime/quickstarts/), or test instantly against one of our hosted [Sandbox](https://cloud.livekit.io/projects/p_/sandbox) frontends.

add this to the readme in a nice format 

How to Run Your Backend Using nohup and Keep It Running
	1.	Navigate to your backend folder:
cd ~/livekit-ejaaz/voice-pipeline-agent-python
	2.	Run the backend in the background using nohup:
nohup python3 agent.py dev > output.log 2>&1 &
	•	This will keep the process running even after you close SSH.
	•	The output will be saved to output.log.
	3.	Check if the process is running:
ps aux | grep agent.py
	4.	If you need to stop the running process:
pkill -f “python3 agent.py dev”
	•	This will kill the process started with nohup.
	5.	If you want to check logs while it’s running:
tail -f output.log

Now your backend will stay running even after you disconnect from SSH.
How to Use tmux to Run Your Backend Persistently
	1.	Start a new tmux session by typing tmux new -s backend. This creates a new terminal session inside tmux.
	2.	Once inside tmux, start your backend by typing python3 agent.py dev. Your backend will now run inside this session.
	3.	To detach from tmux and keep the process running in the background, press Ctrl + B, then D. This will exit tmux while keeping your process running.
	4.	To reattach to the running session later, type tmux attach -t backend. This will bring you back into the tmux session where your backend is still running.
	5.	To check all active tmux sessions, type tmux ls. This will list any running sessions, including the one named backend.
	6.	If you want to stop the backend, first reattach to the session by typing tmux attach -t backend, then inside tmux, press Ctrl + C to stop the running python3 agent.py dev process.
	7.	If you want to completely kill the tmux session and remove it, type tmux kill-session -t backend. This will stop tmux entirely and ensure your backend is no longer running.

This method allows you to run your backend persistently so that even if you close your terminal or disconnect from SSH, the process continues running. You can always reconnect to it later without restarting the server.