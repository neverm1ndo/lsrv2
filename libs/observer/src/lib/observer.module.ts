import { type DynamicModule, Module } from '@nestjs/common';

import { OBSERVER_OPTIONS, type ObserverOptions, ObserverService } from './observer.service';

@Module({})
export class ObserverModule {
	static register(options?: ObserverOptions): DynamicModule {
		return {
			module: ObserverModule,
			providers: [
				{
					provide: OBSERVER_OPTIONS,
					useValue: options || { path: '' } // default empty path if not immediately configured
				},
				ObserverService
			],
			exports: [ObserverService]
		};
	}
}
