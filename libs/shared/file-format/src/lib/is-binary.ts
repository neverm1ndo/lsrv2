// Управляющие байты, которые считаем допустимыми (табуляция, \n, \r)
const BYTE_TAB = 0x09;
const BYTE_LF = 0x0a;
const BYTE_CR = 0x0d;
const ALLOWED_CONTROL_BYTES = new Set([BYTE_TAB, BYTE_LF, BYTE_CR]);

// BOM (Byte Order Mark)
// biome-ignore lint/style/noMagicNumbers: BOM signature
const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;
// biome-ignore lint/style/noMagicNumbers: BOM signature
const UTF16_LE_BOM = [0xff, 0xfe] as const;
// biome-ignore lint/style/noMagicNumbers: BOM signature
const UTF16_BE_BOM = [0xfe, 0xff] as const;

const UTF8_BOM_LENGTH = 3;
const UTF16_BOM_LENGTH = 2;

// Настройки эвристики
const DEFAULT_SAMPLE_SIZE = 512;
const DEFAULT_THRESHOLD = 0.3;

// граница печатных символов в ASCII/Unicode:
const ASCII_PRINTABLE_START = 0x20;

/**
 * Проверяет, является ли файл бинарным (по эвристике)
 * @param buffer ArrayBuffer
 * @param sampleSize сколько байтов анализировать (по умолчанию 512)
 * @param threshold порог доли непечатных байтов (0–1)
 */
export function isBinary(
	buffer: ArrayBuffer,
	sampleSize: number = DEFAULT_SAMPLE_SIZE,
	threshold: number = DEFAULT_THRESHOLD
): boolean {
	const bytes = new Uint8Array(buffer);
	const len = bytes.length;

	if (len === 0) {
		return false; // пустой файл считаем текстовым
	}

	// --- Проверка BOM ---
	if (len >= UTF8_BOM_LENGTH && bytes[0] === UTF8_BOM[0] && bytes[1] === UTF8_BOM[1] && bytes[2] === UTF8_BOM[2]) {
		return false;
	}
	if (len >= UTF16_BOM_LENGTH && bytes[0] === UTF16_LE_BOM[0] && bytes[1] === UTF16_LE_BOM[1]) {
		return false;
	}
	if (len >= UTF16_BOM_LENGTH && bytes[0] === UTF16_BE_BOM[0] && bytes[1] === UTF16_BE_BOM[1]) {
		return false;
	}

	// --- Эвристика ---
	const size = Math.min(sampleSize, len);
	let nonPrintableCount = 0;

	for (let i = 0; i < size; i++) {
		const byte = bytes[i];
		if (ALLOWED_CONTROL_BYTES.has(byte)) {
			continue;
		}
		if (byte < ASCII_PRINTABLE_START) {
			nonPrintableCount++;
		}
	}

	const ratio = nonPrintableCount / size;
	return ratio > threshold;
}
