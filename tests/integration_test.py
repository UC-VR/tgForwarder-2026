import httpx
import time
import sys
import asyncio

BASE_URL = "http://127.0.0.1:8000/rules"

async def test_integration():
    async with httpx.AsyncClient() as client:
        # Wait for server
        print("Waiting for server to be ready...")
        server_up = False
        for i in range(20):
            try:
                res = await client.get("http://127.0.0.1:8000/")
                if res.status_code == 200:
                    server_up = True
                    break
            except Exception:
                pass
            await asyncio.sleep(0.5)
            print(".", end="", flush=True)
        print()

        if not server_up:
            print("Server failed to start.")
            sys.exit(1)

        # 1. Create Rule
        payload = {
            "name": "Integration Rule",
            "source": "chat_src",
            "destination": "chat_dst",
            "delivery_method": "forward",
            "is_active": True,
            "filters": {
                "type": "group",
                "operator": "AND",
                "children": [
                    {
                        "type": "condition",
                        "condition": "contains",
                        "value": "secret"
                    }
                ]
            },
            "ai_config": {
                "enabled": False,
                "systemInstruction": "",
                "model": "gemini-flash"
            }
        }

        print("Creating rule...")
        res = await client.post(BASE_URL + "/", json=payload)
        if res.status_code != 200:
            print(f"Failed to create rule: {res.text}")
            sys.exit(1)

        rule = res.json()
        rule_id = rule["id"]
        print(f"Rule created with ID: {rule_id}")

        # 2. Test Rule (Match)
        print("Testing match...")
        test_payload_match = {
            "message_text": "This is a secret message",
            "rule_id": rule_id
        }
        res = await client.post(BASE_URL + "/test", json=test_payload_match)
        data = res.json()
        if not data["matches"]:
            print("Expected match but got False")
            sys.exit(1)
        print("Match successful.")

        # 3. Test Rule (No Match)
        print("Testing no match...")
        test_payload_nomatch = {
            "message_text": "This is a public message",
            "rule_id": rule_id
        }
        res = await client.post(BASE_URL + "/test", json=test_payload_nomatch)
        data = res.json()
        if data["matches"]:
            print("Expected no match but got True")
            sys.exit(1)
        print("No match successful.")

        # 4. Cleanup
        print("Deleting rule...")
        await client.delete(f"{BASE_URL}/{rule_id}")
        print("Done.")

if __name__ == "__main__":
    asyncio.run(test_integration())
