import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type AppConfig, configSchema } from './config.schema';

export function loadConfig(): AppConfig {
	const configPath = join(process.cwd(), 'lsrv.config.json');
	let rawConfig: unknown;

	try {
		const fileContent = readFileSync(configPath, 'utf8');
		rawConfig = JSON.parse(fileContent);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			console.error(`\u274C Configuration file not found at ${configPath}`);
		} else {
			console.error('\u274C Error reading or parsing lsrv.config.json:', error);
		}
		process.exit(1);
	}

	const parsed = configSchema.safeParse(rawConfig);

	if (!parsed.success) {
		console.error('\u274C Invalid configuration in lsrv.config.json:');

		parsed.error.errors.forEach((err) => {
			console.error(`  - Path: ${err.path.join('.')}`);
			console.error(`    Error: ${err.message}`);
		});

		process.exit(1);
	}

	return parsed.data;
}
