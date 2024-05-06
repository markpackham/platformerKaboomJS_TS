import { KaboomCtx } from "kaboom";
import { scale } from "./constants";

export async function makeMap(k: KaboomCtx, name: string) {
  const mapData = await (await fetch(`/${name}.json`)).json();

  // in pos / position both x & y are 0 so we just enter 0 once
  const map = k.make([k.sprite(name), k.scale(scale), k.pos(0)]);

  const spawnPoints: { [key: string]: { x: number; y: number } } = {};

  for (const layer of mapData.layers) {
    if (layer.name === "colliders") {
      for (const collider of layer.objects) {
        map.add([
          k.area({
            shape: new k.Rect(k.vec2(2), collider.width, collider.height),
            // we use the exit tag for the exit door
            collisionIgnore: ["platform", "exit"],
          }),
        ]);
      }
    }
  }
}
