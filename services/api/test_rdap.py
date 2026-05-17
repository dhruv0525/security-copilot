import httpx
import asyncio

async def test():
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get("https://rdap.org/domain/example.com")
            data = resp.json()
            events = data.get("events", [])
            for e in events:
                if e.get("eventAction") == "registration":
                    print("Created at:", e.get("eventDate"))
            entities = data.get("entities", [])
            for ent in entities:
                if "registrar" in ent.get("roles", []):
                    print("Registrar:", ent.get("vcardArray", [[], []])[1][1][3]) # Hacky, but just seeing if it's there
    except Exception as e:
        print(e)

asyncio.run(test())
