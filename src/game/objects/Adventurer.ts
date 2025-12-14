import Phaser from 'phaser';
import type { MainScene } from '../scenes/MainScene';
import { HealthBar } from '../components/HealthBar';
import { StaminaBar } from '../components/StaminaBar';
import { EmoteBubble } from '../components/EmoteBubble';
import { DungeonRenderer } from '../systems/DungeonRenderer';
import { GridSystem } from '../systems/GridSystem';
import { Pathfinding } from '../systems/Pathfinding';

export interface AdventurerConfig {
    id: string;
    hp: number;
    maxHp: number;
    speed: number;
}

export enum EmotePriority {
    NORMAL = 0,
    HIGH = 1
}

export class Adventurer extends Phaser.GameObjects.Container {
    public id: string;
    public hp: number;
    public maxHp: number;
    public speed: number;
    public path: { x: number, y: number }[] = [];
    public progress: number = 0;
    public isJumping: boolean = false;
    public isMoving: boolean = false;
    public isDying: boolean = false;

    // Stamina & Roaming
    public stamina: number = 25;
    public maxStamina: number = 25;
    private visitedTiles: Set<string> = new Set();
    private gridSystem: GridSystem;
    private pathfinding: Pathfinding;

    private justArrived: boolean = false;
    private stepCount: number = 0;
    private memory: Map<string, { type: string, detail: string, timestamp: number }> = new Map();
    private knownTraps: Set<string> = new Set();
    private target: { x: number, y: number } | null = null;

    // Pause Logic
    private pauseTimer: number = 0;
    private readonly PAUSE_DURATION: number = 0.5; // 0.5 seconds pause

    // Panic Logic
    private isPanic: boolean = false;
    private isPanicAnimating: boolean = false;
    private panicTimer: number = 0;
    private currentPriority: EmotePriority = EmotePriority.NORMAL;
    private emoteEndTime: number = 0;

    // Flee Logic
    public isFleeing: boolean = false;
    private spawnPoint: { x: number, y: number };

    // Status Effects
    private statusEffects: Map<string, any> = new Map();

    // Visuals
    private bodySprite: Phaser.GameObjects.Sprite;
    private healthBar: HealthBar;
    private staminaBar: StaminaBar;
    private emoteBubble: EmoteBubble;

    constructor(scene: Phaser.Scene, x: number, y: number, config: AdventurerConfig, gridSystem: GridSystem, pathfinding: Pathfinding) {
        super(scene, x, y);
        this.scene.add.existing(this);
        this.setDepth(DungeonRenderer.DEPTH_ADVENTURER);

        // ... (Properties Init unchanged)
        this.id = config.id;
        this.hp = config.hp;
        this.maxHp = config.maxHp;
        this.speed = config.speed;

        this.gridSystem = gridSystem;
        this.pathfinding = pathfinding;

        // Initialize Visited
        const startGrid = this.gridSystem.worldToGrid(x, y);
        this.spawnPoint = { x, y }; // Store spawn point
        if (startGrid) {
            this.visitedTiles.add(`${startGrid.x},${startGrid.y}`);
        }

        // Create Body (Sprite)
        this.bodySprite = scene.add.sprite(0, 0, 'hero');
        this.bodySprite.setDisplaySize(64, 64);
        this.add(this.bodySprite);

        // Create Health Bar (Green, Below)
        this.healthBar = new HealthBar(scene, 0, 22);
        this.add(this.healthBar);

        // Create Stamina Bar (Blue, Below Health)
        this.staminaBar = new StaminaBar(scene, 0, 30);
        this.add(this.staminaBar);

        // Create Emote Bubble (Higher up)
        this.emoteBubble = new EmoteBubble(scene, 0, -50);
        this.add(this.emoteBubble);

        // Initial Decision
        this.decideNextPath();
    }

    public requestEmote(emoji: string, priority: EmotePriority, duration: number = 1000) {
        const now = Date.now();
        const isPlaying = now < this.emoteEndTime;

        // Arbitration: Ignore NORMAL if HIGH is playing
        if (isPlaying && this.currentPriority === EmotePriority.HIGH && priority === EmotePriority.NORMAL) {
            return;
        }

        // Apply
        this.currentPriority = priority;
        this.emoteEndTime = now + duration;
        this.emoteBubble.show(emoji, duration);
    }

    public remember(x: number, y: number, type: string, detail: string) {
        const key = `${x},${y}`;
        if (!this.memory.has(key)) {
            this.memory.set(key, { type, detail, timestamp: Date.now() });
            console.log(`Adventurer ${this.id} remembered ${detail} (${type}) at ${key}`);
        }
    }

    public getMemoryAt(x: number, y: number) {
        return this.memory.get(`${x},${y}`);
    }

    public takeDamage(
        amount: number,
        source?: { x: number, y: number },
        context?: { gridSystem: GridSystem, pathfinding: Pathfinding }
    ) {
        this.hp -= amount;
        this.requestEmote('😖', EmotePriority.HIGH); // Visual Feedback
        this.updateHealthBar();

        if (source && context) {
            this.recalculatePath(context.gridSystem, context.pathfinding);
        }
    }

    public recalculatePath(gridSystem: GridSystem, pathfinding: Pathfinding) {
        this.decideNextPath();
    }

    private decideNextPath() {
        if (this.isDying) return;

        const currentGrid = this.gridSystem.worldToGrid(this.x, this.y);
        if (!currentGrid) return;

        // Find nearest walkable tile, excluding known traps
        const target = this.pathfinding.findNearestWalkableTile(
            currentGrid,
            this.visitedTiles,
            this.knownTraps
        );

        if (target) {
            // 2. Path to it, avoiding known traps and preferring visited tiles
            const newPath = this.pathfinding.findPath(
                currentGrid,
                target,
                this.knownTraps,     // excludeNodes
                this.visitedTiles    // preferredNodes
            );

            if (newPath.length > 0) {
                this.path = newPath;
                this.isPanic = false;
            } else {
                console.log(`Adventurer ${this.id} target unreachable (blocked by traps?).`);
                this.enterPanic();
            }
        } else {
            console.log(`Adventurer ${this.id} explored everything or trapped.`);
            this.enterPanic();
        }
    }

    private checkForTrap(targetX: number, targetY: number): boolean {
        const cell = this.gridSystem.getCell(targetX, targetY);
        const key = `${targetX},${targetY}`;

        if (cell && cell.trap) {
            // Check if we already know about this specific trap location
            if (this.knownTraps.has(key)) {
                // We know it's there. 
                // If it's SCARY, we should avoid it (logic handled by pathfinding excludeNodes).
                // If we are HERE in checkForTrap, it might mean we are trying to walk into it regardless?
                // But usually move() calls this. If pathfinding works, we shouldn't be here for a known scary trap.
                // UNLESS pathfinding failed to find a safe path and we are forced to walk into it?
                // For now, let's treat "known" traps as "scary -> panic" only if we didn't expect to walk into them.
                // But simpler: If it's scary and we are about to step on it, PANIC.

                if (cell.trap.config.isScary) {
                    // actually if we know it, we probably shouldn't be stepping on it unless we are forced.
                    // But let's keep the logic simple: Scared of Scary traps.
                    return true;
                }
            } else {
                // Unknown trap.
                if (cell.trap.config.isScary) {
                    // Scary trap discovered!
                    this.stamina -= 5;
                    this.updateStaminaBar();
                    this.requestEmote('😨', EmotePriority.NORMAL);
                    this.knownTraps.add(key);
                    console.log(`Adventurer ${this.id} spotted SCARY trap at ${key}! Panic!`);
                    this.enterPanic();
                    return true;
                } else {
                    // Not scary (e.g. Spring). Ignore it.
                    // Adventurer will walk onto it.
                    console.log(`Adventurer ${this.id} spotted non-scary trap at ${key}. Ignoring.`);
                    return false;
                }
            }
        }
        return false;
    }

    private enterPanic() {
        if (!this.isPanic) {
            this.isPanic = true;
            this.requestEmote('😰', EmotePriority.NORMAL);
            console.log(`Adventurer ${this.id} entering PANIC mode.`);
        }
    }

    private updateHealthBar() {
        const percent = Math.max(0, this.hp / this.maxHp);
        this.healthBar.updateHealth(percent);
    }

    public applyStatus(type: string, duration: number) {
        console.log(`Adventurer ${this.id} applied status: ${type} for ${duration}s`);
        if (type === 'root') {
            this.pauseTimer += duration;
            this.requestEmote('🛑', EmotePriority.HIGH);
        } else if (type === 'oiled') {
            if (!this.statusEffects.has('oiled')) {
                this.statusEffects.set('oiled', { stepsTaken: 0, threshold: 3 });
                // Visual or tint?
                // this.bodySprite.setTint(0x333333); // Darker/Oily? Or maybe Purple? Let's use Brownish
                this.bodySprite.setTint(0x554433);
            } else {
                // Already oiled: Trigger immediate slip
                this.slip();
            }
        }
    }

    private slip() {
        console.log("Adventurer slipped on oil!");
        this.statusEffects.delete('oiled'); // Remove status
        this.bodySprite.clearTint();
        this.pauseTimer = 2.0; // Stun for 2 seconds

        this.requestEmote('💫', EmotePriority.HIGH);

        // Slip Animation (Chaotic Wobble)
        // Slip Animation: Fall Over
        this.scene.tweens.add({
            targets: this.bodySprite,
            angle: 90, // Fall sideways
            y: 10, // Drop slightly
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Recover after stun
                this.scene.tweens.add({
                    targets: this.bodySprite,
                    angle: 0,
                    y: 0,
                    duration: 500,
                    delay: 1300, // Wait while stunned
                    ease: 'Power2.out'
                });
            }
        });
    }

    public move(dt: number, gridSystem: any): { reachedEnd: boolean, enteredNewTile: boolean } {
        if (this.isDying) return { reachedEnd: false, enteredNewTile: false };
        if (this.isJumping) return { reachedEnd: false, enteredNewTile: false };
        if (this.isPanicAnimating) return { reachedEnd: false, enteredNewTile: false };

        // Panic Burn Logic (Stuck State)
        if (this.isPanic && !this.isMoving) {
            this.panicTimer += dt;
            if (this.panicTimer >= 1.0) { // Burn 1 stamina per second
                this.panicTimer -= 1.0;
                this.consumeStamina();
                if (this.stamina <= 0) {
                    if (!this.isFleeing) {
                        this.startFleeing();
                    } else {
                        return { reachedEnd: false, enteredNewTile: false }; // Wait for regular move consumer
                    }
                }
            }
        }

        if (this.justArrived) {
            this.justArrived = false;

            // Trigger Visual Animation for Spring Trap
            const gridPos = gridSystem.worldToGrid(this.x, this.y);
            if (gridPos) {
                const trap = gridSystem.getCell(gridPos.x, gridPos.y)?.trap;
                if (trap && (trap.config.id === 'spring' || trap.type === 'physics')) {
                    // Trigger "Boing"
                    (this.scene as MainScene).animateTrapTrigger(gridPos.x, gridPos.y);

                    // Physics Logic for Spring
                    const direction = trap.direction || 'up';
                    const pushDistance = trap.config.pushDistance || 2;
                    let dx = 0;
                    let dy = 0;

                    if (direction === 'up') dy = -pushDistance;
                    else if (direction === 'down') dy = pushDistance;
                    else if (direction === 'left') dx = -pushDistance;
                    else if (direction === 'right') dx = pushDistance;

                    const targetGridX = gridPos.x + dx;
                    const targetGridY = gridPos.y + dy;

                    // Check Wall Collision
                    if (!this.gridSystem.isWalkable(targetGridX, targetGridY)) {
                        this.bonkAgainstWall(targetGridX, targetGridY);
                        return { reachedEnd: false, enteredNewTile: true };
                    }

                    // Proceed to legacy jump logic (TrapSystem usually handles this, 
                    // triggers 'physics' effect which calls handlePhysicsTrap).
                    // If we want to override here, we could. 
                    // But if TrapSystem is also running, we might double trigger.
                    // However, TrapSystem runs in 'update' loop or via triggers.
                    // If we handle it here, we should ensure TrapSystem doesn't also do it.
                    // Or, we assume this is merely "VISUAL" and let TrapSystem handle logic?
                    // User Request: "Modify src/game/objects/Adventurer.ts... Update move()... Check... If wall... bonk"
                    // implies we are intercepting the logic here.
                    // Since "TrapSystem" is legacy or component based, let's assume we handle it here
                    // to effectively "Stun" them so they don't trigger the standard TrapSystem logic?
                    // But standard TrapSystem logic waits for cooldown?

                    // Actually, if we return here, we are just finishing "move".
                    // The TrapSystem might still trigger if it detects the adventurer on the trap.
                    // Ideally we consume the trap event.
                }
            }

            // Pause timer is already set by tween complete
            return { reachedEnd: false, enteredNewTile: true };
        }

        // 2. Handle Moving State
        if (this.isMoving) {
            return { reachedEnd: false, enteredNewTile: false };
        }

        // 3. Handle Pause State
        if (this.pauseTimer > 0) {
            this.pauseTimer -= dt;
            return { reachedEnd: false, enteredNewTile: false };
        }

        // Flee Check: Reached Spawn Point? (Approximation)
        if (this.isFleeing) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.spawnPoint.x, this.spawnPoint.y);
            if (dist < 10) { // Close enough
                this.escape();
                return { reachedEnd: true, enteredNewTile: false };
            }
        }

        // 4. Check Path End / Need New Path
        if (this.path.length <= 1) {
            this.decideNextPath();
            if (this.path.length <= 1) {
                return { reachedEnd: false, enteredNewTile: false };
            }
        }

        // 5. Start Move
        const currentTile = this.path[0];
        const nextTile = this.path[1];

        if (nextTile) {
            // Check for Trap (Peek & Panic Logic)
            const trap = gridSystem.getCell(nextTile.x, nextTile.y)?.trap;
            const key = `${nextTile.x},${nextTile.y}`;

            // Condition: Trap exists, is Scary, and is Unknown
            if (trap && trap.config.isScary && !this.knownTraps.has(key)) {
                // Panic Trigger
                this.isPanicAnimating = true;

                // Calculate Tween Target (40% into tile)
                const startWorld = gridSystem.gridToWorld(currentTile.x, currentTile.y);
                const targetWorld = gridSystem.gridToWorld(nextTile.x, nextTile.y);

                // Flip Logic
                if (nextTile.x < currentTile.x) {
                    this.bodySprite.setFlipX(true);
                } else if (nextTile.x > currentTile.x) {
                    this.bodySprite.setFlipX(false);
                }

                const dx = (targetWorld.x - startWorld.x) * 0.4;
                const dy = (targetWorld.y - startWorld.y) * 0.4;

                // Tween Sequence
                this.scene.tweens.add({
                    targets: this.bodySprite,
                    x: dx,
                    y: dy,
                    duration: 200,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        // 2. Show Emote & Deduct Stamina
                        this.requestEmote('😨', EmotePriority.NORMAL);
                        this.stamina -= 5;
                        this.updateStaminaBar();

                        // 3. Move Back
                        this.scene.tweens.add({
                            targets: this.bodySprite,
                            x: 0,
                            y: 0,
                            duration: 200,
                            ease: 'Sine.easeIn',
                            onComplete: () => {
                                // 4. On Complete
                                this.isPanicAnimating = false;
                                this.knownTraps.add(key);
                                this.path = []; // Reset path to force recalculation
                                this.decideNextPath();
                            }
                        });
                    }
                });

                return { reachedEnd: false, enteredNewTile: false };
            }

            // Normal Movement
            if (nextTile.x < currentTile.x) {
                this.bodySprite.setFlipX(true);
            } else if (nextTile.x > currentTile.x) {
                this.bodySprite.setFlipX(false);
            }

            const nextWorld = gridSystem.gridToWorld(nextTile.x, nextTile.y);

            this.isMoving = true;
            this.stepCount++;

            // Position Tween
            this.scene.tweens.add({
                targets: this,
                x: nextWorld.x,
                y: nextWorld.y,
                duration: 300,
                ease: 'Linear',
                onComplete: () => {
                    this.path.shift();
                    this.isMoving = false;
                    this.justArrived = true;
                    this.pauseTimer = this.PAUSE_DURATION;
                    // Reset sprite local pos just in case
                    this.bodySprite.setPosition(0, 0);

                    this.consumeStamina();
                    this.visitedTiles.add(`${nextTile.x},${nextTile.y}`);

                    // Check Oiled Status
                    if (this.statusEffects.has('oiled')) {
                        const status = this.statusEffects.get('oiled');
                        status.stepsTaken++;
                        if (status.stepsTaken >= status.threshold) {
                            this.slip();
                        }
                    }
                }
            });

            // Juice: Hop
            this.scene.tweens.add({
                targets: this.bodySprite,
                y: -20,
                duration: 150,
                yoyo: true,
                ease: 'Sine.easeOut'
            });

            // Juice: Rotation Wobble
            const wobble = (this.stepCount % 2 === 0) ? 5 : -5;
            this.scene.tweens.add({
                targets: this.bodySprite,
                angle: wobble,
                duration: 150,
                yoyo: true,
                ease: 'Sine.easeInOut',
                onComplete: () => { this.bodySprite.setAngle(0); }
            });
        }

        return { reachedEnd: false, enteredNewTile: false };
    }

    private consumeStamina() {
        this.stamina -= 1;
        this.updateStaminaBar();

        if (this.stamina <= 0) {
            if (!this.isFleeing) {
                this.startFleeing();
            } else {
                this.expire(); // Die if exhausted while fleeing
            }
        }
    }

    private updateStaminaBar() {
        const percent = Math.max(0, this.stamina / this.maxStamina);
        this.staminaBar.updateStamina(percent);
    }


    public expire() {
        if (this.isDying) return;
        console.log(`Adventurer ${this.id} EXHAUSTED/EXPIRED (0 Gold).`);
        this.isDying = true;
        this.requestEmote('💀', EmotePriority.HIGH); // Dead icon for real expiry

        // Fade out
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                this.destroy(); // Just destroy, no callback
            }
        });
    }

    public startFleeing() {
        if (this.isFleeing) return;
        this.isFleeing = true;
        this.isPanic = false; // Override panic freezing
        this.stamina = this.maxStamina / 2; // Restore 50%
        this.speed *= 1.5; // Panic run

        this.requestEmote('😱', EmotePriority.NORMAL, 60000); // Scream
        this.bodySprite.setTint(0x8888ff); // Pale blue

        console.log(`Adventurer ${this.id} is FLEEING! Target: Spawn Point.`);

        // Find path home
        const currentGrid = this.gridSystem.worldToGrid(this.x, this.y);
        const homeGrid = this.gridSystem.worldToGrid(this.spawnPoint.x, this.spawnPoint.y);

        if (currentGrid && homeGrid) {
            this.path = []; // Clear current path
            // We ignore visited tiles logic for fleeing - just run shortest path
            const newPath = this.pathfinding.findPath(
                currentGrid,
                homeGrid,
                new Set(), // No exclusions (desperate) - actually, should we respect walls? 
                // findPath usually respects walls via A*. excludNodes is for traps.
                // So this will find valid path ignoring traps (too scared to care?)
                // Or pass 'knownTraps' to still avoid them? 
                // Let's pass empty to imply "Running Blindly" -> High Risk!
                undefined
            );
            if (newPath.length > 0) {
                this.path = newPath;
            } else {
                console.log("Fleeing blocked! Adventurer is doomed.");
                // They will wander until stamina 0 again
            }
        }
    }

    public escape() {
        if (this.isDying) return;
        console.log(`Adventurer ${this.id} ESCAPED (0 Gold).`);
        this.isDying = true;

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0,
            duration: 500,
            onComplete: () => {
                this.destroy();
            }
        });
    }

    public getBountyMultiplier(): number {
        return this.isFleeing ? 2 : 1;
    }

    public teleport(x: number, y: number, newPath: { x: number, y: number }[]) {
        this.x = x;
        this.y = y;
        this.path = newPath; // Usually empty, will decideNextPath
        this.progress = 0;
        this.pauseTimer = 0;

        // Update visited for new location
        const gridPos = this.gridSystem.worldToGrid(x, y);
        if (gridPos) {
            this.visitedTiles.add(`${gridPos.x},${gridPos.y}`);
        }

        console.log(`Adventurer ${this.id} teleported to ${x}, ${y}.`);
        this.decideNextPath();
    }

    public jumpTo(targetX: number, targetY: number, duration: number, onComplete: () => void) {
        this.isJumping = true;

        if (targetX < this.x) {
            this.bodySprite.setFlipX(true);
        } else if (targetX > this.x) {
            this.bodySprite.setFlipX(false);
        }

        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                this.isJumping = false;
                onComplete();
            }
        });

        this.scene.tweens.add({
            targets: this.bodySprite,
            y: -40, // Higher jump for spring
            duration: duration / 2,
            yoyo: true,
            ease: 'Sine.easeOut'
        });
    }

    // Visual Feedback Methods
    public bonkAgainstWall(targetGridX: number, targetGridY: number) {
        this.isJumping = true; // Block movement

        const targetWorld = this.gridSystem.gridToWorld(targetGridX, targetGridY);
        // Offset slightly to not overlap fully inside the wall
        const currentWorld = { x: this.x, y: this.y };

        // Launch to Wall
        this.scene.tweens.add({
            targets: this,
            x: targetWorld.x,
            y: targetWorld.y,
            duration: 150,
            ease: 'Quad.easeIn',
            onComplete: () => {
                // Impact
                this.takeDamage(15, undefined, undefined);
                this.requestEmote('😵', EmotePriority.HIGH); // Override any generic damage emote
                this.scene.cameras.main.shake(100, 0.01);

                // Rebound
                this.scene.tweens.add({
                    targets: this,
                    x: currentWorld.x,
                    y: currentWorld.y,
                    duration: 300,
                    ease: 'Bounce.out',
                    onComplete: () => {
                        this.isJumping = false;
                        this.path = []; // Reset path
                        this.decideNextPath();
                    }
                });
            }
        });

        // Arc height for visual flair
        this.scene.tweens.add({
            targets: this.bodySprite,
            y: -20,
            duration: 150,
            yoyo: true,
            ease: 'Sine.easeOut'
        });
    }

    public playAttackAnimation(targetX: number, targetY: number): Promise<void> {
        return new Promise(resolve => {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
            const lungeDist = 15;

            const offsetX = Math.cos(angle) * lungeDist;
            const offsetY = Math.sin(angle) * lungeDist;

            this.scene.tweens.add({
                targets: this.bodySprite,
                x: offsetX,
                y: offsetY,
                duration: 120,
                yoyo: true,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.bodySprite.setPosition(0, 0);
                    resolve();
                }
            });
        });
    }

    public playDamageAnimation() {
        this.bodySprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => this.bodySprite.clearTint());

        this.scene.tweens.add({
            targets: this.bodySprite,
            x: { from: -5, to: 5 },
            duration: 50,
            yoyo: true,
            repeat: 3
        });
    }

    public playDeathAnimation(onComplete?: () => void) {
        this.isDying = true;
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.killTweensOf(this.bodySprite);

        this.scene.tweens.add({
            targets: this,
            angle: 90, // Topple
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: onComplete
        });
    }

    public die(onComplete: () => void) {
        // This is called when HP <= 0. Triggers Gold Reward via callback.
        this.playDeathAnimation(onComplete);
    }
}
