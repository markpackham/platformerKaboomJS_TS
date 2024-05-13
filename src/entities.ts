import {
  AreaComp,
  BodyComp,
  DoubleJumpComp,
  GameObj,
  HealthComp,
  KaboomCtx,
  OpacityComp,
  PosComp,
  ScaleComp,
  SpriteComp,
} from "kaboom";
import { scale } from "./constants";

type PlayerGameObj = GameObj<
  SpriteComp &
    AreaComp &
    BodyComp &
    PosComp &
    ScaleComp &
    DoubleJumpComp &
    HealthComp &
    OpacityComp & {
      speed: number;
      direction: string;
      isInhaling: boolean;
      isFull: boolean;
    }
>;

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

  // inhale / attack mechanic
  const inhaleEffect = k.add([
    k.sprite("assets", { anim: "kirbInhaleEffect" }),
    k.pos(),
    k.scale(scale),
    k.opacity(0),
    "inhaleEffect",
  ]);

  // hitbox area
  // let player know when they can swallow enemy
  const inhaleZone = player.add([
    k.area({ shape: new k.Rect(k.vec2(0), 20, 4) }),
    // player position impacts inhale zone
    k.pos(),
    "inhaleZone",
  ]);

  inhaleZone.onUpdate(() => {
    if (player.direction === "left") {
      inhaleZone.pos = k.vec2(-14, 8);
      inhaleEffect.pos = k.vec2(player.pos.x - 60, player.pos.y + 0);
      inhaleEffect.flipX = true;
      return;
    }
    inhaleZone.pos = k.vec2(14, 8);
    inhaleEffect.pos = k.vec2(player.pos.x + 60, player.pos.y + 0);
    inhaleEffect.flipX = false;
  });

  // respawn player if they fall
  // reset scene
  player.onUpdate(() => {
    if (player.pos.y > 2000) {
      k.go("level-1");
    }
  });

  return player;
}

export function setControls(k: KaboomCtx, player: GameObj) {
  const inhaleEffectRef = k.get("inhaleEffect")[0];

  k.onKeyDown((key) => {
    switch (key) {
      case "left":
        player.direction = "left";
        player.flipX = true;
        player.move(-player.speed, 0);
        break;

      case "right":
        player.direction = "right";
        player.flipX = false;
        player.move(player.speed, 0);
        break;

      case "z":
        if (player.isFull) {
          player.play("kirbFull");
          inhaleEffectRef.opacity = 0;
          break;
        }

        player.isInhaling = true;
        player.play("kirbInhaling");
        inhaleEffectRef.opacity = 1;
        break;
      default:
    }
  });

  // Player double jumps 10 times then falls
  k.onKeyPress((key) => {
    if (key === "x") player.doubleJump();
  });

  k.onKeyRelease((key) => {
    if (key === "z") {
      if (player.isFull) {
        // Player spitting out an enemy same animation as inhaling
        player.play("kirbInhaling");
        const shootingStar = k.add([
          k.sprite("assets", {
            anim: "shootingStar",
            flipX: player.direction === "right",
          }),
          k.area({ shape: new k.Rect(k.vec2(5, 4), 6, 6) }),
          k.pos(
            player.direction === "left" ? player.pos.x - 80 : player.pos.x + 80,
            player.pos.y + 5
          ),
          k.scale(scale),
          player.direction === "left"
            ? // Constants of LEFT & RIGHT provided by kaboom
              k.move(k.LEFT, 800)
            : k.move(k.RIGHT, 800),
          "shootingStar",
        ]);
        // Star gets destroyed if it hits a platform
        shootingStar.onCollide("platform", () => k.destroy(shootingStar));

        player.isFull = false;
        k.wait(1, () => player.play("kirbIdle"));
        return;
      }

      inhaleEffectRef.opacity = 0;
      player.isInhaling = false;
      player.play("kirbIdle");
    }
  });
}

// Enemies
export function makeFlameEnemy(k: KaboomCtx, posX: number, posY: number) {
  const flame = k.add([
    k.sprite("assets", { anim: "flame" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({
      shape: new k.Rect(k.vec2(4, 6), 8, 10),
      collisionIgnore: ["enemy"],
    }),
    k.body(),
    k.state("idle", ["idle", "jump"]),
    "enemy",
  ]);

  makeInhalable(k, flame);

  flame.onStateEnter("idle", async () => {
    await k.wait(1);
    flame.enterState("jump");
  });

  flame.onStateEnter("jump", async () => {
    flame.jump(1000);
  });

  flame.onStateUpdate("jump", async () => {
    if (flame.isGrounded()) {
      flame.enterState("idle");
    }
  });

  return flame;
}

export function makeGuyEnemy(k: KaboomCtx, posX: number, posY: number) {
  const guy = k.add([
    k.sprite("assets", { anim: "guyWalk" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({
      shape: new k.Rect(k.vec2(2, 3.9), 12, 12),
      collisionIgnore: ["enemy"],
    }),
    k.body(),
    k.state("idle", ["idle", "left", "right", "jump"]),
    { isInhalable: false, speed: 100 },
    "enemy",
  ]);

  makeInhalable(k, guy);

  guy.onStateEnter("idle", async () => {
    await k.wait(1);
    guy.enterState("left");
  });

  guy.onStateEnter("left", async () => {
    guy.flipX = false;
    await k.wait(2);
    guy.enterState("right");
  });

  guy.onStateUpdate("left", () => {
    guy.move(-guy.speed, 0);
  });

  guy.onStateEnter("right", async () => {
    guy.flipX = true;
    await k.wait(2);
    guy.enterState("left");
  });

  guy.onStateUpdate("right", () => {
    guy.move(guy.speed, 0);
  });

  return guy;
}

export function makeBirdEnemy(
  k: KaboomCtx,
  posX: number,
  posY: number,
  speed: number
) {
  const bird = k.add([
    k.sprite("assets", { anim: "bird" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({
      shape: new k.Rect(k.vec2(4, 6), 8, 10),
      collisionIgnore: ["enemy"],
    }),
    k.body({ isStatic: true }),
    k.move(k.LEFT, speed),
    k.offscreen({ destroy: true, distance: 400 }),
    "enemy",
  ]);

  makeInhalable(k, bird);

  return bird;
}
