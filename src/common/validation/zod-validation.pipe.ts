import { type ArgumentMetadata, BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import { ZodError, type ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
	constructor(private schema: ZodSchema) {}

	transform(value: unknown, metadata: ArgumentMetadata) {
		try {
			return this.schema.parse(value);
		} catch (error) {
			if (error instanceof ZodError) {
				const errors = error.issues.map((e) => {
					const fieldPath = e.path.length > 0 ? e.path.join('.') : 'root';
					return `${fieldPath}: ${e.message}`;
				});

				const errorMessage =
					errors.length === 1
						? `Invalid input: ${errors[0]}`
						: `Invalid input (${errors.length} errors): ${errors.join('; ')}`;
				throw new BadRequestException(errorMessage);
			}
			throw new BadRequestException('Validation failed');
		}
	}
}
