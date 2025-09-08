import type { Stream } from "node:stream";

import type { Document } from "mongoose";
import { PeggyParserAdapter } from "parser/peg/peggy.parser-adapter";

import { type LogLine, LogLineModel } from "@lsrv/api/logs";
import { env } from "@lsrv/common/environment";
import { logger } from "@lsrv/logger";
import { Observer } from "@lsrv/observer";

export class LsrvLogsObserver<L extends LogLine = LogLine> {
	private last?: L;
	private document?: Document;
	private dataStream?: Stream;

	constructor(
		private readonly parserAdapter = new PeggyParserAdapter<L>(),
		private readonly observer: Observer = new Observer({ path: env.LOGS_PATH })
	) {}

	subscribe() {
		if (this.dataStream) return;

		this.dataStream = this.observer.observe();
		this.dataStream.on("data", this.handleObservedData.bind(this));
	}

	addLstener(event: string | symbol, listener: (...args: unknown[]) => void) {
		this.dataStream?.on(event, listener);
	}

	private _isSimilarLine(a: L, b?: L): boolean {
		if (!a || !b) return false;

		return a.process === b.process && a.message === b.message;
	}

	private async _save(line: L): Promise<void> {
		if (this._isSimilarLine(line, this.last) && this.document) {
			return void this.document
				.updateOne({ $inc: { multi: 1 } })
				.catch((err) => logger.error(err, "Update similar line multiplier error"));
		}

		const lineDocument = new LogLineModel(line);

		this.last = line;
		this.document = lineDocument;

		await lineDocument.save();
	}

	private handleObservedData(buffer: Buffer) {
		void (async () => {
			try {
				const line = this.parserAdapter.parse(buffer);

				await this._save(line);
			} catch (err) {
				logger.error(err, "Observer error");
			}
		})();
	}
}
