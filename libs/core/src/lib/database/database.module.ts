import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';

import { env } from '@lsrv/common/environment';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'mysql',
			host: env.DB_ADDRESS,
			username: env.DB_USER,
			password: env.DB_PASSWORD,
			database: env.DB_NAME,
			autoLoadEntities: true,
			synchronize: false // Since this is a migration, use migrations or keep false
		}),
		MongooseModule.forRoot(env.MONGO_URL)
	]
})
export class DatabaseModule {}
