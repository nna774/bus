// 同期生成では重い盤面のレベルを事前生成し、index.html の #pregen ブロックに埋め込む。
// 使い方: node tools/pregen.js [サイズ] [駐車場枠数] [窓の大きさ] [本数]
// プールのキーは「サイズ:窓の大きさ」。同じキーは上書きし、他のキーは残す。
"use strict";
const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const script = html.match(/<script>\n([\s\S]*?)\n<\/script>\n<\/body>/)[1];
const mod = { exports: {} };
new Function("module", script)(mod);
const { generateLevel, verifySolvable, buildLevel } = mod.exports;
const PALETTE = ["red", "blue", "green", "orange", "purple", "teal", "pink", "yellow"];

const size = Number(process.argv[2] || 8);
const parking = Number(process.argv[3] || 5);
const windowSize = Number(process.argv[4] || 1);
const count = Number(process.argv[5] || 12);

function encode(level) {
  return {
    gridW: level.gridW,
    gridH: level.gridH,
    parkingCapacity: level.parkingCapacity,
    windowSize: level.windowSize,
    buses: level.buses.map((b) => [b.r, b.c, b.len, b.orientation, b.dir, PALETTE.indexOf(b.color)]),
    queue: level.queue.map((c) => PALETTE.indexOf(c)).join(""),
  };
}

const levels = [];
while (levels.length < count) {
  const level = generateLevel({ gridW: size, gridH: size, parkingCapacity: parking, windowSize });
  if (!level || !verifySolvable(level)) continue;
  levels.push(encode(level));
  console.error(`${levels.length}/${count}`);
}

const existing = JSON.parse(html.match(/<script id="pregen" type="application\/json">([\s\S]*?)<\/script>/)[1]);
existing[`${size}x${size}:${windowSize}`] = levels;
const json = JSON.stringify(existing);
const out = html.replace(
  /(<script id="pregen" type="application\/json">)[\s\S]*?(<\/script>)/,
  () => `<script id="pregen" type="application/json">${json}</script>`
);
fs.writeFileSync(htmlPath, out);
