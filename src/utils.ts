import { KaboomCtx } from "kaboom";
import { scale } from "./constants";

export async function makeMap(k: KaboomCtx, name: string) {
  const mapData = await (await fetch(`/${name}.json`)).json();

  // in pos / position both x & y are 0 so we just enter 0 once
  const map = k.make([k.sprite(name), k.scale(scale), k.pos(0)]);

  const spawnPoints: { [key: string]: { x: number; y: number }[] } = {};

  for (const layer of mapData.layers) {
    if (layer.name === "colliders") {
      for (const collider of layer.objects) {
        map.add([
          k.area({
            shape: new k.Rect(k.vec2(2), collider.width, collider.height),
            // we use the exit tag for the exit door
            collisionIgnore: ["platform", "exit"],
          }),
          collider.name !== "exit" ? k.body({ isStatic: true }) : null,
          k.pos(collider.x, collider.y),
          // give "platform" tag to current game object if it isn't the level exit
          collider.name !== "exit" ? "platform" : "exit",
        ]);
      }
      continue;
    }

    if (layer.name === "spawnpoints") {
      for (const spawnPoint of layer.objects) {
        // examples of a names are "player" & "bird", check if the key already exists
        if (spawnPoints[spawnPoint.name]) {
          spawnPoints[spawnPoint.name].push({
            x: spawnPoint.x,
            y: spawnPoint.y,
          });
          continue;
        }

        spawnPoints[spawnPoint.name] = [{ x: spawnPoint.x, y: spawnPoint.y }];
      }
    }
  }

  return { map, spawnPoints };
}
