import { type OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { CORS_CONFIG } from '@lsrv/core/http';

@WebSocketGateway({
	cors: CORS_CONFIG
})
export class AppGateway implements OnGatewayConnection {
	@WebSocketServer()
	server!: Server;

	handleConnection(client: Socket) {
		// In a full implementation, we'd add WsGuard or middleware to populate user
		// client.disconnect() if unauthorized
		console.log(`Client connected: ${client.id}`);
	}
}
