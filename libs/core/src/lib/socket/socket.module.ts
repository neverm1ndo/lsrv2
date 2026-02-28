import { Module } from '@nestjs/common';

import { AppGateway } from './socket.gateway';

@Module({
	providers: [AppGateway],
	exports: [AppGateway]
})
export class SocketModule {}
