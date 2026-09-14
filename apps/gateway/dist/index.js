import { createGateway } from "./gateway.js";
const port = Number(process.env.PORT ?? 18789);
const server = createGateway();
server.listen(port, () => {
    console.log(`openclaw-eval gateway listening on http://127.0.0.1:${port}`);
    console.log(`try: curl -s -X POST http://127.0.0.1:${port}/message -H 'content-type: application/json' -d '{"channel":"webchat","sender":"u1","text":"report (555) 123-4567 hello"}' | jq`);
});
//# sourceMappingURL=index.js.map