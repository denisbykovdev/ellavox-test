import http from "node:http";
export type GatewayDeps = {
    now?: () => number;
    ttlSeconds?: number;
};
export declare function createGateway(deps?: GatewayDeps): http.Server;
//# sourceMappingURL=gateway.d.ts.map