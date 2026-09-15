/// <reference types="vite/client" />

import type { Socket } from "socket.io-client";

declare global {
     
    var __leapSocket: Socket | null | undefined;
}