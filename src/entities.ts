import { GameObj, KaboomCtx } from "kaboom";
import { scale } from "./constants";

export function makePlayer(k: KaboomCtx, posX: number, posY: number) {
  const player = k.make([
    k.sprite("assets", { anim: "kirbIdle" }),
    // put hitbox in a way where character does not sink into platform
    k.area({ shape: new k.Rect(k.vec2(4, 5.9), 8, 10) }),
    k.body(),
    k.pos(posX * scale, posY * scale),
    k.scale(scale),
    // Kaboom allows double jumps (simular to Kirby flying)
    k.doubleJump(10),
    k.health(3),
    k.opacity(1),
    {
      speed: 300,
      direction: "right",
      isInhaling: false,
      isFull: false,
    },
    "player",
  ]);

  // enemy collisions
  // GameObj comes from kaboom
  player.onCollide("enemy", async (enemy: GameObj) => {
    // Enemy destroyed
    if (player.isInhaling && enemy.isInhalable) {
      player.isInhaling = false;
      k.destroy(enemy);
      player.isFull = true;
      return;
    }

    // Player destroyed
    if (player.hp() === 0) {
      k.destroy(player);
      // k.go(globalGameState.currentScene);
      k.go("level-1");
      return;
    }

    // hurt() decreases 1 HP by default
    player.hurt();
    await k.tween(
      player.opacity,
      0,
      0.05,
      (val) => (player.opacity = val),
      k.easings.linear
    );
    await k.tween(
      player.opacity,
      1,
      0.05,
      (val) => (player.opacity = val),
      k.easings.linear
    );
  });

  player.onCollide("exit", () => {
    k.go("level-2");
  });

  // inhale mechanic
  const inhaleEffect = k.add([
    k.sprite("assets", { anim: "kirbInhaleEffect" }),
    k.pos(),
    k.scale(scale),
    k.opacity(0),
    "inhaleEffect",
  ]);
}
