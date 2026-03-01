export interface TreeNode {
	name: string;
	path: string;
	children?: TreeNode[];
}

export interface FileTreeOptions {
	rootDir: string;
	ignore?: string[];
	dot?: boolean;
}
