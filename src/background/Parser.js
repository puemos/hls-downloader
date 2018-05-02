import { Parser } from "m3u8-parser";

export async function parseFile(uri) {
  const parser = new Parser();

  const text = await fetch(uri, { headers: { nonono: true } }).then(res =>
    res.text()
  );
  parser.push(text);
  parser.end();
  return { ...parser.manifest };
}

export async function parsePlaylist(uri) {
  const parser = new Parser();
  const text = await fetch(uri).then(res => res.text());
  parser.push(text);
  parser.end();
  return { ...parser.manifest };
}
