import { basename, dirname, join } from 'node:path';

import fg from 'fast-glob';

import type { FileTreeOptions, TreeNode } from '../interfaces/ftree.interface';

export const buildTree = async (options: FileTreeOptions): Promise<TreeNode> => {
	const entries = await fg('**/*', {
		cwd: options.rootDir,
		onlyFiles: false,
		followSymbolicLinks: false,
		objectMode: true,
		dot: options.dot ?? false,
		ignore: options.ignore
	});

	const rootDir = basename(options.rootDir);

	const root: TreeNode = {
		name: rootDir,
		path: rootDir,
		children: []
	};

	const map = new Map<string, TreeNode>();
	map.set('.', root);

	for (const entry of entries) {
		const relPath = entry.path;
		const fullPath = join(rootDir, relPath);

		if (entry.dirent.isSymbolicLink()) {
			continue;
		}

		const node: TreeNode = {
			name: basename(relPath),
			path: fullPath
		};

		if (entry.dirent.isDirectory()) node.children = [];

		const parentPath = dirname(relPath);
		const parentNode = map.get(parentPath === '.' ? '.' : parentPath);

		if (parentNode?.children) {
			parentNode.children.push(node);
		}

		map.set(relPath, node);
	}

	return root;
};
