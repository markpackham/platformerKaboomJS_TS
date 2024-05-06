import { KaboomCtx } from "kaboom";
import { scale } from "./constants";

export async function makeMap(k: KaboomCtx, name: string) {
  const mapData = await (await fetch(`/${name}.json`)).json();
}
