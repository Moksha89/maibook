import asyncio,sys,time
LISTEN=int(sys.argv[1]); UP=int(sys.argv[2]); ONEWAY=float(sys.argv[3]); BPS=float(sys.argv[4])  # one-way delay s, bytes/sec
async def pump(reader,writer):
    q=asyncio.Queue()
    async def rd():
        try:
            while True:
                d=await reader.read(16384)
                if not d: break
                await q.put((time.monotonic(),d))
        finally: await q.put(None)
    task=asyncio.create_task(rd()); free=0.0
    try:
        while True:
            it=await q.get()
            if it is None: break
            t,d=it; now=time.monotonic(); start=max(t+ONEWAY,free); tx=len(d)/BPS; free=start+tx
            w=free-now
            if w>0: await asyncio.sleep(w)
            writer.write(d); await writer.drain()
    except Exception: pass
    finally:
        try: writer.close()
        except Exception: pass
async def handle(cr,cw):
    await asyncio.sleep(ONEWAY*2)  # TCP handshake RTT
    try: ur,uw=await asyncio.open_connection("127.0.0.1",UP)
    except Exception: cw.close(); return
    await asyncio.gather(pump(cr,uw),pump(ur,cw))
async def main():
    s=await asyncio.start_server(handle,"127.0.0.1",LISTEN); await s.serve_forever()
asyncio.run(main())
