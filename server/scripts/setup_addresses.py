"""
Setup script to generate and save agent addresses
Run this before starting agents to get their addresses for .env
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from uagents import Agent


def generate_agent_address(name: str, port: int, seed: str) -> str:
    """Generate agent address without starting the agent"""
    agent = Agent(
        name=name,
        port=port,
        seed=seed,
    )
    return agent.address


if __name__ == "__main__":
    print("🔑 Generating Agent Addresses...")
    print("")

    agents = [
        ("coordinator_agent", 8000, "coordinator_agent_seed_phrase_12345"),
        ("defi_agent", 8001, "defi_agent_seed_phrase_12345"),
        ("fgi_agent", 8003, "fgi_agent_seed_phrase_12345"),
        ("coin_info_agent", 8004, "coin_agent_seed_phrase_12345"),
    ]

    addresses = {}

    for name, port, seed in agents:
        address = generate_agent_address(name, port, seed)
        addresses[name] = address
        print(f"✅ {name:20} → {address}")

    print("")
    print("📝 Add these to your .env file:")
    print("")
    print(f"COORDINATOR_ADDRESS={addresses['coordinator_agent']}")
    print(f"DEFI_AGENT_ADDRESS={addresses['defi_agent']}")
    print(f"FGI_AGENT_ADDRESS={addresses['fgi_agent']}")
    print(f"COIN_AGENT_ADDRESS={addresses['coin_info_agent']}")
    print("")

    # Optionally write to .env
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

    if os.path.exists(env_path):
        response = input("Update .env file with these addresses? (y/n): ")
        if response.lower() == 'y':
            # Read existing .env
            with open(env_path, 'r') as f:
                lines = f.readlines()

            # Update or add addresses
            updated_lines = []
            keys_to_update = {
                "COORDINATOR_ADDRESS": addresses['coordinator_agent'],
                "DEFI_AGENT_ADDRESS": addresses['defi_agent'],
                "FGI_AGENT_ADDRESS": addresses['fgi_agent'],
                "COIN_AGENT_ADDRESS": addresses['coin_info_agent'],
            }

            for line in lines:
                updated = False
                for key, value in keys_to_update.items():
                    if line.startswith(f"{key}="):
                        updated_lines.append(f"{key}={value}\n")
                        updated = True
                        keys_to_update.pop(key)
                        break
                if not updated:
                    updated_lines.append(line)

            # Add any remaining keys
            for key, value in keys_to_update.items():
                updated_lines.append(f"{key}={value}\n")

            # Write back
            with open(env_path, 'w') as f:
                f.writelines(updated_lines)

            print("✅ .env file updated!")
    else:
        print("⚠️  .env file not found. Please create one from .env.example")
