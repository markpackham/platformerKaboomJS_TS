import { KaboomCtx } from "kaboom";
import { scale } from "./constants";

export async function makeMap(k: KaboomCtx, name: string) {
  const mapData = await (await fetch(`/${name}.json`)).json();

  // in pos / position both x & y are 0 so we just enter 0 once
  const map = k.make([k.sprite(name), k.scale(scale), k.pos(0)]);

  const spawnPoints: { [key: string]: { x: number; y: number } } = {};
}
