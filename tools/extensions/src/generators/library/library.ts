import { formatFiles, readProjectConfiguration, type Tree, writeJson } from '@nx/devkit';
import { libraryGenerator as jsLibraryGenerator } from '@nx/js';

import type { LibraryGeneratorSchema } from './schema';

function getRelativePathToRoot(projectRoot: string): string {
	const depth = projectRoot.split('/').filter(Boolean).length;
	return depth === 0 ? './' : '../'.repeat(depth);
}

export async function libraryGenerator(tree: Tree, options: LibraryGeneratorSchema): Promise<void> {
	const genOptions: any = {
		name: options.name,
		directory: options.directory || options.name,
		linter: 'none'
	};
	if (options.tags) genOptions.tags = options.tags;

	// Call the base generator from @nx/js
	await jsLibraryGenerator(tree, genOptions);

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

export default libraryGenerator;
