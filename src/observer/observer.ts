import { createReadStream, type ReadStream, type Stats } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { EOL } from "node:os";
import { dirname, join } from "node:path";
import { Stream } from "node:stream";

import { type ChokidarOptions, type FSWatcher, watch } from "chokidar";

import { logger } from "@lsrv/logger";

import { bsplit } from "./utils/bsplit";

export interface ObserverOptions {
	path: string;
}

const EOL_BUFFER = Buffer.from(EOL);

export class Observer {
	constructor(private options: ObserverOptions) {
		this.fsWatcher = watch(options.path, this.watcherOptions);
	}

	private readonly watcherOptions: ChokidarOptions = {
		ignored: /(^|[/\\])\../,
		persistent: true
	};

	private fsWatcher: FSWatcher;

	private bytes: number = 0;
	private stream: Stream = new Stream();

	observe(): Stream {
		this._getLastLogFileStat()
			.then((stats: Stats) => {
				this.bytes = stats.size === 0 ? 0 : stats.size;
			})
			.catch((err) => logger.error(err, "Observer error"));

		this.fsWatcher.on("change", (path, stats) => this._fsWatcherHandler(path, stats));
		this.fsWatcher.on("add", (path, stats) => this.fsWatcherNewFileHandler(path, stats));
		this.fsWatcher.on("error", console.error);

		return this.stream;
	}

	private _fsWatcherHandler(path: string, stats?: Stats | undefined): void {
		if (!stats) return;

		if (stats.size <= this.bytes) {
			return;
		}

		const stream: ReadStream = createReadStream(path, {
			start: this.bytes,
			end: stats.size - EOL_BUFFER.length
		});

		stream.on("readable", () => {
			const data: Buffer | null = stream.read();

			if (!data) return stream.destroy();

			const newLines: Buffer[] = bsplit(data, EOL_BUFFER);

			for (const line of newLines) {
				this.stream.emit("data", line);
			}
		});

		this.bytes = stats.size;
	}

	private fsWatcherNewFileHandler(_path: string, stats?: Stats | undefined): void {
		this.bytes = stats?.size ? stats.size : 0;
	}

	private async _getLastLogFileStat(): Promise<Stats> {
		const now: Date = new Date();

		const [date, month, year]: string[] = [now.getDate(), now.getMonth() + 1, now.getFullYear()].map((val: number) =>
			val.toString().padStart(2, "0")
		);

		let filepath: string = join(this.options.path, year, month, `${year}${month}${date}.log`);

		try {
			return await stat(filepath);
		} catch {
			const dirpath: string = dirname(filepath);
			const dir: string[] = await readdir(dirpath);

			filepath = join(dirpath, dir[dir.length - 1]);

			return await stat(filepath);
		}
	}
}
