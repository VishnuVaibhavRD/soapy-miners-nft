"use client";

import Link from "next/link";

export default function StoryPage() {
  return (
    <main className="story-movie">
      <div className="cinema-bar cinema-bar-top" />
      <div className="cinema-bar cinema-bar-bottom" />

      <Link href="/" className="story-exit-link clickable">
        EXIT
      </Link>

      {/* SCENE 1 — Darkness */}
      <StoryScene className="scene-dark">
        <SceneTransition />
        <div className="story-vignette" />

        <div className="floating-dust">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="lantern-field">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="cinematic-copy scene-one-copy">
          <p className="movie-small movie-fade delay-1">
            LONG BEFORE THE MINE REOPENED...
          </p>

          <h1 className="movie-fade delay-2">
            256 MINERS
            <br />
            DISAPPEARED
            <br />
            BENEATH THE SURFACE.
          </h1>
        </div>

        <ScrollHint />
      </StoryScene>

      {/* SCENE 2 — Underground */}
      <StoryScene className="scene-underground">
        <SceneTransition />
        <div className="scene-camera-zoom" />
        <div className="cave-layer cave-layer-back" />
        <div className="cave-layer cave-layer-mid" />
        <div className="cave-layer cave-layer-front" />
        <div className="story-vignette" />

        <div className="abandoned-ore-vein" />

        <div className="cinematic-copy">
          <p className="movie-fade delay-1">
            Deep beneath the surface,
            the tunnels were abandoned.
          </p>

          <p className="movie-fade delay-2">
            Ore remained untouched.
          </p>

          <h2 className="movie-fade delay-3">
            AND THE MINERS
            <br />
            NEVER RETURNED.
          </h2>

          <div className="movie-dialogue">
            <span>&ldquo;The shafts should be empty...&rdquo;</span>
            <span>&ldquo;...so what is making that noise?&rdquo;</span>
          </div>
        </div>

        <ScrollHint />
      </StoryScene>

      {/* SCENE 3 — The signal */}
      <StoryScene className="scene-signal">
        <SceneTransition />
        <div className="story-vignette" />
        <div className="signal-glow" />

        <div className="signal-rock">
          <img
            src="/images/mint/ore-idle.png"
            alt=""
            className="pixel-art signal-rock-image"
          />
        </div>

        <div className="cinematic-copy signal-copy">
          <p className="movie-small movie-fade delay-1">
            UNTIL NOW.
          </p>

          <h2 className="movie-fade delay-2 story-rumble">
            SOMETHING IS MOVING
            <br />
            UNDERGROUND.
          </h2>

          <p className="movie-fade delay-3">
            The mine has reopened.
          </p>
        </div>

        <ScrollHint />
      </StoryScene>

      {/* SCENE 4 — Phase 1 Discovery */}
      <StoryScene className="scene-discovery story-impact-scene">
        <SceneTransition />
        <div className="story-vignette" />

        <div className="phase-title-card">
          <span>PHASE 1</span>
          <h2>THE DISCOVERY</h2>
        </div>

        <div className="discovery-stage">
          <div className="discovery-glow" />

          <div className="story-ore-sequence">
            <img
              src="/images/mint/ore-cracked.png"
              alt=""
              className="pixel-art story-cracked-ore"
            />

            <img
              src="/images/mint/ore-open.png"
              alt=""
              className="pixel-art story-open-ore"
            />

            <img
              src="/images/cursors/pickaxe-cursor.png"
              alt=""
              className="pixel-art story-pickaxe-hit"
            />

            <div className="ore-hit-flash" />
          </div>

          <div className="story-miner-shadow">
            <div className="miner-shadow-head" />
            <div className="miner-shadow-body" />
            <div className="miner-shadow-arm left" />
            <div className="miner-shadow-arm right" />
          </div>
        </div>

        <div className="cinematic-copy discovery-copy">
          <p>
            Every strike uncovers one miner.
          </p>

          <div className="movie-inline-flow">
            <span>ORE</span>
            <b>→</b>
            <span>HIT</span>
            <b>→</b>
            <span>CRACK</span>
            <b>→</b>
            <span>REVEAL</span>
          </div>

          <p className="movie-emphasis">
            ONE HIT. ONE TRANSACTION. ONE SOAPY.
          </p>

          <p>
            No one knows which miner
            will emerge next.
          </p>
        </div>

        <ScrollHint />
      </StoryScene>

      {/* SCENE 5 — Miner Camp */}
      <StoryScene className="scene-camp">
        <SceneTransition />
        <div className="story-vignette" />
        <div className="camp-lantern camp-lantern-left" />
        <div className="camp-lantern camp-lantern-right" />

        <div className="camp-silhouettes">
          <span />
          <span />
          <span />
        </div>

        <div className="cinematic-copy">
          <p className="movie-small">
            THE MINER CAMP
          </p>

          <h2>
            THEY HAVE RETURNED.
          </h2>

          <p>
            Every discovered Soapy returns
            to the wallet that uncovered it.
          </p>

          <p>
            Today, the camp is your collection.
          </p>

          <p className="movie-emphasis">
            FOR NOW... THEY REST.
          </p>
        </div>

        <ScrollHint />
      </StoryScene>

      {/* SCENE 6 — Phase 2 teaser */}
      <StoryScene className="scene-phase-two">
        <SceneTransition />
        <div className="deep-tunnel-glow" />
        <div className="story-vignette" />

        <div className="deep-mine-door">
          <div className="deep-mine-light" />
        </div>

        <div className="cinematic-copy">
          <div className="phase-title-card phase-title-card-inline">
            <span>PHASE 2</span>
            <h2>RETURN UNDERGROUND</h2>
          </div>

          <p>
            But the miners weren&apos;t created
            to stay above ground.
          </p>

          <div className="phase-two-loop">
            <div>
              <strong>MINE</strong>
              <small>Enter an expedition</small>
            </div>
            <span>↓</span>
            <div>
              <strong>LOOT</strong>
              <small>Recover resources</small>
            </div>
            <span>↓</span>
            <div>
              <strong>REST</strong>
              <small>Recover after work</small>
            </div>
            <span>↓</span>
            <div>
              <strong>UPGRADE</strong>
              <small>Prepare for deeper mines</small>
            </div>
            <span>↓</span>
            <div>
              <strong>DEEPER</strong>
              <small>Reach places others cannot</small>
            </div>
          </div>

          <p className="movie-emphasis">
            Stronger miners will reach
            places others cannot.
          </p>
        </div>

        <ScrollHint />
      </StoryScene>

      {/* FINAL SCENE */}
      <StoryScene className="scene-ending">
        <div className="ending-light" />

        <div className="cinematic-copy ending-copy">
          <div className="story-final-logo">
            <div className="story-logo-pickaxe">⛏</div>
            <h1>SOAPY MINERS</h1>
            <span>THE MINE IS WAITING</span>
          </div>

          <p className="movie-small">
            THE STORY HAS ONLY BEGUN.
          </p>

          <p>
            Find your miner.
            Bring them back to camp.
            Prepare for what lies deeper.
          </p>

          <Link href="/" className="story-enter-button clickable">
            ENTER THE MINE
          </Link>
        </div>
      </StoryScene>
    </main>
  );
}

function StoryScene({ children, className = "" }) {
  return (
    <section className={`story-scene ${className}`}>
      {children}
    </section>
  );
}

function ScrollHint() {
  return (
    <div className="story-scroll-hint">
      <span>SCROLL</span>
      <b>↓</b>
    </div>
  );
}

function SceneTransition() {
  return <div className="scene-transition" />;
}
