import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BackupService } from './backup.service';
import { BackupEntity } from './entities/backup.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([BackupEntity]),
		ConfigModule // We need config to access environment variables like BACKUP_LIFETIME
	],
	providers: [BackupService],
	exports: [BackupService]
})
export class BackupModule {}
