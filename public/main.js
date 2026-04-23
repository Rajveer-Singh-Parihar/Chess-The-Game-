import { Chess } from "https://esm.sh/chess.js";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const PIECE_ORDER = ["q", "r", "b", "n", "p"];
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const STARTING_COUNTS = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
const STORAGE_KEY = "premium-chess-settings";
const AI_ONLY_MODE = true;
const API_ROOT = "";

const PIECE_ASSETS = {
  wp: "/static/pieces/wp.svg",
  wn: "/static/pieces/wn.svg",
  wb: "/static/pieces/wb.svg",
  wr: "/static/pieces/wr.svg",
  wq: "/static/pieces/wq.svg",
  wk: "/static/pieces/wk.svg",
  bp: "/static/pieces/bp.svg",
  bn: "/static/pieces/bn.svg",
  bb: "/static/pieces/bb.svg",
  br: "/static/pieces/br.svg",
  bq: "/static/pieces/bq.svg",
  bk: "/static/pieces/bk.svg",
};
