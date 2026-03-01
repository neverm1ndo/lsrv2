import { Readable } from 'node:stream';
import iconv from 'iconv-lite';

export function getStream(): NodeJS.ReadableStream {
    let stream: NodeJS.ReadableStream = new Readable();
    stream = stream.pipe(iconv.decodeStream('win1251')).pipe(iconv.encodeStream('utf8'));
    return stream;
}
