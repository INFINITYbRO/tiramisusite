import { deflateSync, inflateSync } from "node:zlib";
import { HttpError } from "./errors";

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = new Uint32Array(256);

for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  CRC_TABLE[index] = value >>> 0;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function paeth(left: number, up: number, upperLeft: number): number {
  const prediction = left + up - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const upDistance = Math.abs(prediction - up);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

interface DecodedPng {
  width: number;
  height: number;
  rgba: Buffer;
}

function decodePng(input: Buffer): DecodedPng {
  if (input.length < 45 || !input.subarray(0, 8).equals(SIGNATURE)) {
    throw new HttpError(400, "The uploaded file is not a PNG image");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let interlace = -1;
  let palette: Buffer | undefined;
  let transparency: Buffer | undefined;
  const compressedParts: Buffer[] = [];
  let sawHeader = false;
  let sawEnd = false;

  while (offset + 12 <= input.length) {
    const length = input.readUInt32BE(offset);
    if (length > input.length - offset - 12) {
      throw new HttpError(400, "The PNG file is truncated");
    }
    const typeBytes = input.subarray(offset + 4, offset + 8);
    const type = typeBytes.toString("ascii");
    const data = input.subarray(offset + 8, offset + 8 + length);
    const expectedCrc = input.readUInt32BE(offset + 8 + length);
    if (crc32(Buffer.concat([typeBytes, data])) !== expectedCrc) {
      throw new HttpError(400, "The PNG file has an invalid checksum");
    }
    offset += length + 12;

    if (!sawHeader && type !== "IHDR") {
      throw new HttpError(400, "The PNG header is missing");
    }
    switch (type) {
      case "IHDR":
        if (sawHeader || length !== 13) {
          throw new HttpError(400, "The PNG header is invalid");
        }
        sawHeader = true;
        width = data.readUInt32BE(0);
        height = data.readUInt32BE(4);
        bitDepth = data[8]!;
        colorType = data[9]!;
        if (data[10] !== 0 || data[11] !== 0) {
          throw new HttpError(400, "The PNG compression or filter method is unsupported");
        }
        interlace = data[12]!;
        break;
      case "PLTE":
        palette = Buffer.from(data);
        break;
      case "tRNS":
        transparency = Buffer.from(data);
        break;
      case "IDAT":
        compressedParts.push(Buffer.from(data));
        break;
      case "IEND":
        if (length !== 0) throw new HttpError(400, "The PNG end marker is invalid");
        sawEnd = true;
        break;
      default:
        if (/^[A-Z]/.test(type)) {
          throw new HttpError(400, `Unsupported critical PNG chunk: ${type}`);
        }
    }
    if (sawEnd) break;
  }

  if (!sawHeader || !sawEnd || compressedParts.length === 0) {
    throw new HttpError(400, "The PNG file is incomplete");
  }
  if (width !== 64 || (height !== 32 && height !== 64)) {
    throw new HttpError(400, "Skin dimensions must be 64x64 or 64x32 pixels");
  }
  if (bitDepth !== 8 || ![0, 2, 3, 4, 6].includes(colorType)) {
    throw new HttpError(400, "Only 8-bit grayscale, RGB, indexed, or RGBA PNG is supported");
  }
  if (interlace !== 0) {
    throw new HttpError(400, "Interlaced PNG skins are not supported");
  }

  const channels = colorType === 0 || colorType === 3 ? 1 : colorType === 2 ? 3 : colorType === 4 ? 2 : 4;
  const rowLength = width * channels;
  const expectedInflatedLength = (rowLength + 1) * height;
  let inflated: Buffer;
  try {
    inflated = inflateSync(Buffer.concat(compressedParts), {
      maxOutputLength: expectedInflatedLength,
    });
  } catch {
    throw new HttpError(400, "The PNG pixel data is corrupted");
  }
  if (inflated.length !== expectedInflatedLength) {
    throw new HttpError(400, "The PNG pixel data has an invalid length");
  }

  const samples = Buffer.alloc(rowLength * height);
  for (let y = 0; y < height; y += 1) {
    const inputRow = y * (rowLength + 1);
    const filter = inflated[inputRow]!;
    if (filter > 4) throw new HttpError(400, "The PNG uses an invalid row filter");
    for (let x = 0; x < rowLength; x += 1) {
      const raw = inflated[inputRow + 1 + x]!;
      const outputOffset = y * rowLength + x;
      const left = x >= channels ? samples[outputOffset - channels]! : 0;
      const up = y > 0 ? samples[outputOffset - rowLength]! : 0;
      const upperLeft =
        y > 0 && x >= channels
          ? samples[outputOffset - rowLength - channels]!
          : 0;
      const reconstructed =
        filter === 0
          ? raw
          : filter === 1
            ? raw + left
            : filter === 2
              ? raw + up
              : filter === 3
                ? raw + Math.floor((left + up) / 2)
                : raw + paeth(left, up, upperLeft);
      samples[outputOffset] = reconstructed & 0xff;
    }
  }

  if (colorType === 3 && (!palette || palette.length === 0 || palette.length % 3 !== 0)) {
    throw new HttpError(400, "The indexed PNG palette is invalid");
  }
  const rgba = Buffer.alloc(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const source = pixel * channels;
    const destination = pixel * 4;
    let red: number;
    let green: number;
    let blue: number;
    let alpha = 255;
    if (colorType === 0) {
      red = green = blue = samples[source]!;
      if (transparency?.length === 2 && red === transparency.readUInt16BE(0)) alpha = 0;
    } else if (colorType === 2) {
      red = samples[source]!;
      green = samples[source + 1]!;
      blue = samples[source + 2]!;
      if (
        transparency?.length === 6 &&
        red === transparency.readUInt16BE(0) &&
        green === transparency.readUInt16BE(2) &&
        blue === transparency.readUInt16BE(4)
      ) {
        alpha = 0;
      }
    } else if (colorType === 3) {
      const paletteIndex = samples[source]!;
      const paletteOffset = paletteIndex * 3;
      if (!palette || paletteOffset + 2 >= palette.length) {
        throw new HttpError(400, "The PNG references a missing palette color");
      }
      red = palette[paletteOffset]!;
      green = palette[paletteOffset + 1]!;
      blue = palette[paletteOffset + 2]!;
      alpha = transparency?.[paletteIndex] ?? 255;
    } else if (colorType === 4) {
      red = green = blue = samples[source]!;
      alpha = samples[source + 1]!;
    } else {
      red = samples[source]!;
      green = samples[source + 1]!;
      blue = samples[source + 2]!;
      alpha = samples[source + 3]!;
    }
    rgba[destination] = red;
    rgba[destination + 1] = green;
    rgba[destination + 2] = blue;
    rgba[destination + 3] = alpha;
  }
  return { width, height, rgba };
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const output = Buffer.alloc(data.length + 12);
  output.writeUInt32BE(data.length, 0);
  typeBytes.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), data.length + 8);
  return output;
}

function encodeRgba(width: number, height: number, rgba: Buffer): Buffer {
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    rows[rowOffset] = 0;
    rgba.copy(rows, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function copyRectangle(
  source: Buffer,
  destination: Buffer,
  sourceX: number,
  sourceY: number,
  width: number,
  height: number,
  destinationX: number,
  destinationY: number,
): void {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const from = ((sourceY + y) * 64 + sourceX + width - x - 1) * 4;
      const to = ((destinationY + y) * 64 + destinationX + x) * 4;
      source.copy(destination, to, from, from + 4);
    }
  }
}

function convertLegacy(rgba: Buffer): Buffer {
  const output = Buffer.alloc(64 * 64 * 4);
  rgba.copy(output);
  const rectangles = [
    [4, 16, 4, 4, 20, 48], [8, 16, 4, 4, 24, 48],
    [0, 20, 4, 12, 24, 52], [4, 20, 4, 12, 20, 52],
    [8, 20, 4, 12, 16, 52], [12, 20, 4, 12, 28, 52],
    [44, 16, 4, 4, 36, 48], [48, 16, 4, 4, 40, 48],
    [40, 20, 4, 12, 40, 52], [44, 20, 4, 12, 36, 52],
    [48, 20, 4, 12, 32, 52], [52, 20, 4, 12, 44, 52],
  ] as const;
  for (const [sourceX, sourceY, width, height, destinationX, destinationY] of rectangles) {
    copyRectangle(
      rgba,
      output,
      sourceX,
      sourceY,
      width,
      height,
      destinationX,
      destinationY,
    );
  }
  return output;
}

export interface NormalizedPng {
  bytes: Buffer;
  convertedLegacy: boolean;
}

export function normalizeMinecraftPng(input: Uint8Array): NormalizedPng {
  const decoded = decodePng(Buffer.from(input));
  const convertedLegacy = decoded.height === 32;
  const rgba = convertedLegacy ? convertLegacy(decoded.rgba) : decoded.rgba;
  return { bytes: encodeRgba(64, 64, rgba), convertedLegacy };
}
