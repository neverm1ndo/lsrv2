import { formatFiles, readProjectConfiguration, type Tree, writeJson } from '@nx/devkit';
import { applicationGenerator as nestApplicationGenerator } from '@nx/nest';
import type { ApplicationGeneratorOptions } from '@nx/nest/src/generators/application/schema';

import type { ApplicationGeneratorSchema } from './schema';

function getRelativePathToRoot(projectRoot: string): string {
	const depth = projectRoot.split('/').filter(Boolean).length;
	return depth === 0 ? './' : '../'.repeat(depth);
}

export async function applicationGenerator(tree: Tree, options: ApplicationGeneratorSchema): Promise<void> {
	const genOptions: ApplicationGeneratorOptions = {
		name: options.name,
		directory: options.directory || options.name,
		linter: 'none'
	};

	if (options.tags) genOptions.tags = options.tags;

	// Call the base generator from @nx/nest
	await nestApplicationGenerator(tree, genOptions);

	const projectName = options.name;

	try {
		const project = readProjectConfiguration(tree, projectName);
		if (project.root) {
			const relativePath = getRelativePathToRoot(project.root);
			writeJson(tree, `${project.root}/biome.json`, {
				$schema: 'https://biomejs.dev/schemas/2.2.0/schema.json',
				extends: [`${relativePath}biome.json`]
			});
		}
	} catch {
		console.warn(`Could not add biome.json automatically for ${projectName}.`);
	}

	await formatFiles(tree);
}

export default applicationGenerator;
