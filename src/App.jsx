
import React, { useState, useEffect, useRef } from "react";
import { DATA } from "./data.js";

const h = React.createElement;
const REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

const SECTIONS = [
  ["home", "Home"],
  ["about", "About"],
  ["skills", "Skills"],
  ["work", "Work"],
  ["journey", "Journey"],
  ["achievements", "CTF"],
  ["contact", "Contact"]
];

/* ---------- hooks ---------- */

function useInView(threshold) {
  const ref = useRef(null);
  const [v, setV] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setV(true);
        io.disconnect();
      }
    }, { threshold: threshold || 0.25 });

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, v];
}

function onScrollFrame(fn) {
  let t = false;

  const on = () => {
    if (!t) {
      t = true;
      requestAnimationFrame(() => {
        t = false;
        fn();
      });
    }
  };

  addEventListener("scroll", on, { passive: true });
  addEventListener("resize", on);
  fn();

  return () => {
    removeEventListener("scroll", on);
    removeEventListener("resize", on);
  };
}

/* ---------- text effects ---------- */

const GLYPHS = "!<>-_\\/[]{}=+*^?#01";

function useScramble(text, run) {
  const [out, setOut] = useState(run === false ? "" : text);

  useEffect(() => {
    if (run === false) {
      setOut("");
      return;
    }

    if (REDUCE) {
      setOut(text);
      return;
    }

    let f = 0, raf;

    const r = [...text].map((_, i) => i * 3 + Math.random() * 16);
    const max = Math.max(...r) + 1;

    const tick = () => {
      f++;

      setOut([...text].map((c, i) =>
        (c === " " || f >= r[i])
          ? c
          : GLYPHS[Math.random() * GLYPHS.length | 0]
      ).join(""));

      if (f < max) raf = requestAnimationFrame(tick);
      else setOut(text);
    };

    tick();

    return () => cancelAnimationFrame(raf);
  }, [text, run]);

  return out;
}

function Split({ text, tag, className }) {
  const [ref, v] = useInView(0.3);
  const words = text.split(" ");
  let i = 0;

  return h(tag || "h2", {
    ref,
    className: "split h2 " + (className || "") + (v ? " in" : ""),
    "aria-label": text
  },
    words.map((w, wi) =>
      h("span", {
        className: "w",
        key: wi,
        "aria-hidden": "true"
      },
        [...w].map((c, ci) =>
          h("span", {
            className: "c",
            key: ci,
            style: {
              transitionDelay: (i++ * 26) + "ms"
            }
          }, c)
        ),
        wi < words.length - 1 ? "\u00A0" : null
      )
    )
  );
}

function Scramble({ text, run }) {
  return h("span", null, useScramble(text, run));
}

function NameFX({ text, run }) {
  const out = useScramble(text, run);

  return h("h1", {
    className: "name rise",
    "data-text": out,
    "aria-label": text,
    style: { animationDelay: "0s" }
  },
    [...out].map((c, i) =>
      h("span", {
        key: i,
        className: "ch",
        "aria-hidden": "true",
        style: { "--i": i }
      }, c === " " ? "\u00A0" : c)
    )
  );
}

function Counter({ to, prefix, suffix }) {
  const [ref, v] = useInView(0.5);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!v) return;

    let s = null, raf;

    const step = (t) => {
      if (!s) s = t;

      const k = Math.min(1, (t - s) / 1400);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));

      if (k < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf);
  }, [v, to]);

  return h("b", { ref },
    (prefix || "") + n.toLocaleString("en-US") + (suffix || "")
  );
}

/* ---------- animated background ---------- */

function Background() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d");

    const CH = "01{}<>/=;$#%&*+ABCDEF0123456789アイウエオカキクケコサシスセソタチツテト".split("");

    let w = 0, hh = 0, layers = [], raf;
    let frame = 0, vel = 0, lastY = scrollY;

    let cols = [
      [91, 124, 255],
      [230, 236, 255],
      [165, 139, 255]
    ];

    const mouse = { x: -9999, y: -9999 };

    const rgb = (hex) => {
      hex = hex.replace("#", "");

      if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
      }

      const n = parseInt(hex, 16);

      return [
        n >> 16 & 255,
        n >> 8 & 255,
        n & 255
      ];
    };

    const readCols = () => {
      try {
        const cs = getComputedStyle(document.documentElement);
        cols = ["--a1", "--a2", "--a3"].map(k =>
          rgb(cs.getPropertyValue(k).trim())
        );
      } catch (e) {}
    };

    const mix = (a, b, t) =>
      a.map((v, i) => Math.round(v + (b[i] - v) * t));

    const mk = (size, gap, speed, alpha, z) => ({
      size,
      alpha,
      z,
      trail: Math.round(9 + z * 7),
      cols: Array.from(
        { length: Math.ceil(w / gap) },
        (_, i) => ({
          x: i * gap + gap / 2,
          y: Math.random() * hh * 1.5,
          v: speed * (0.6 + Math.random() * 0.9),
          seed: Math.random() * 1000
        })
      )
    });

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);

      w = innerWidth;
      hh = innerHeight;

      cv.width = w * dpr;
      cv.height = hh * dpr;

      cv.style.width = w + "px";
      cv.style.height = hh + "px";

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const small = w < 700;

      layers = [
        mk(12, small ? 30 : 22, 0.7, 0.3, 0.4),
        mk(17, small ? 44 : 34, 1.5, 0.55, 1)
      ];

      if (REDUCE) draw();
    };

    const draw = () => {
      frame++;

      if (frame % 40 === 1) readCols();

      const sy = scrollY;

      vel += (sy - lastY - vel) * 0.12;
      lastY = sy;

      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? sy / max : 0;
      const t = p * 2;

      const c = t < 1
        ? mix(cols[0], cols[1], t)
        : mix(cols[1], cols[2], Math.min(1, t - 1));

      const colStr = "rgb(" + c.join(",") + ")";
      const headStr = "rgb(" +
        mix(c, [255, 255, 255], 0.65).join(",") + ")";

      ctx.clearRect(0, 0, w, hh);

      layers.forEach(L => {
        ctx.font = L.size + "px ui-monospace, Menlo, Consolas, monospace";
        ctx.textAlign = "center";

        const total = hh + L.trail * L.size;

        L.cols.forEach(cl => {
          if (!REDUCE) {
            cl.y += cl.v - vel * L.z * 0.8;
          }

          cl.y = ((cl.y % total) + total) % total;

          const near = Math.abs(cl.x - mouse.x) < 90;

          for (let k = 0; k < L.trail; k++) {
            const cy = cl.y - k * L.size;

            if (cy < -L.size || cy > hh + L.size) continue;

            let a = L.alpha * Math.pow(1 - k / L.trail, 1.6);

            if (near && Math.abs(cy - mouse.y) < 170) {
              a = Math.min(1, a * 2.4);
            }

            ctx.globalAlpha = a;
            ctx.fillStyle = k === 0 ? headStr : colStr;

            const idx = Math.floor(
              cl.seed * 13 + k * 3.7 + frame / (k < 3 ? 4 : 40)
            ) % CH.length;

            ctx.fillText(CH[Math.abs(idx)], cl.x, cy);
          }
        });
      });

      ctx.globalAlpha = 1;

      if (!REDUCE) {
        raf = requestAnimationFrame(draw);
      }
    };

    const mm = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    resize();
    readCols();

    addEventListener("resize", resize);
    addEventListener("mousemove", mm);

    if (!REDUCE) {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("mousemove", mm);
    };
  }, []);

  return h("div", {
    className: "bg",
    "aria-hidden": "true"
  },
    h("div", { className: "blob b1" }),
    h("div", { className: "blob b2" }),
    h("div", { className: "blob b3" }),
    h("div", { className: "floor" }),
    h("canvas", { ref }),
    h("div", { className: "scan" }),
    h("div", { className: "sweep" }),
    h("div", { className: "vig" }),
    h("div", { className: "grain" })
  );
}

function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
    if (!matchMedia("(hover: hover)").matches || REDUCE) return;

    const el = ref.current;

    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let tx = x, ty = y, raf;

    const mm = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      el.classList.add("on");
    };

    const loop = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;

      el.style.transform =
        "translate3d(" + x + "px," + y + "px,0)";

      raf = requestAnimationFrame(loop);
    };

    addEventListener("mousemove", mm);
    loop();

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("mousemove", mm);
    };
  }, []);

  return h("div", {
    className: "cursor",
    ref,
    "aria-hidden": "true"
  });
}

/* ---------- navigation ---------- */

function Nav({ active }) {
  const toggle = () => {
    const r = document.documentElement;

    const cur = r.getAttribute("data-theme") ||
      (matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark");

    r.setAttribute(
      "data-theme",
      cur === "light" ? "dark" : "light"
    );
  };

  return h("nav", {
    className: "nav",
    "aria-label": "Primary"
  },
    h("a", {
      href: "#home",
      className: "logo",
      "aria-label": "Home"
    }, DATA.initials),

    h("div", { className: "links" },
      SECTIONS.slice(1).map(([id, label]) =>
        h("a", {
          key: id,
          href: "#" + id,
          className: active === id ? "act" : ""
        }, label)
      )
    ),

    h("button", {
      className: "theme",
      onClick: toggle,
      "aria-label": "Toggle light and dark theme"
    },
      h("svg", {
        viewBox: "0 0 24 24",
        width: 18,
        height: 18,
        "aria-hidden": "true"
      },
        h("path", {
          d: "M12 3a9 9 0 1 0 9 9c-5 0-9-4-9-9z",
          fill: "currentColor"
        })
      )
    )
  );
}

/* ---------- hero ---------- */

const FLOATS = [
  ["<Ved />", "6%", "20%", 0.18, 0],
  ["nmap -sV target", "58%", "10%", 0.3, -2],
  ["ASCON-128 / AEAD", "66%", "80%", 0.22, -4],
  ["CTF{ved_korde}", "40%", "88%", 0.36, -1],
  ["</>", "88%", "46%", 0.14, -3]
];

function Hero({ ready }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setI(x => (x + 1) % DATA.roles.length),
      3400
    );

    return () => clearInterval(t);
  }, []);

  const d = (s) => ({ animationDelay: s + "s" });

  return h("section", {
    id: "home",
    className: "hero" + (ready ? " go" : "")
  },

    h("div", {
      className: "gyro",
      "aria-hidden": "true"
    },
      h("div", { className: "gyro-in" },
        h("div", { className: "ring r4" }),
        h("div", { className: "ring r1" }),
        h("div", { className: "ring r2" }),
        h("div", { className: "ring r3" }),
        h("div", { className: "core" })
      )
    ),

    FLOATS.map(([t, x, y, k, dl], n) =>
      h("div", {
        key: n,
        className: "fl",
        "aria-hidden": "true",
        style: {
          left: x,
          top: y,
          transform:
            "translate3d(0, calc(var(--sy) * -" + k + "px), 0)"
        }
      },
        h("span", {
          style: { animationDelay: dl + "s" }
        }, t)
      )
    ),

    h("div", { className: "hero-in" },

      h("span", {
        className: "status rise",
        style: d(0.1)
      },
        h("span", { className: "dot" }),
        "Currently: " + DATA.now
      ),

      h(NameFX, {
        text: DATA.name,
        run: ready
      }),

      h("div", { className: "uline" }),

      h("div", {
        className: "role rise",
        style: d(0.5)
      },
        "I'm a ",
        h(Scramble, {
          text: DATA.roles[i],
          run: ready
        }),
        h("span", { className: "cur" })
      ),

      h("p", {
        className: "tag rise",
        style: d(0.65)
      }, DATA.tagline),

      h("div", {
        className: "cta rise",
        style: d(0.8)
      },
        h("a", {
          className: "btn pri",
          href: "#work"
        }, "See my work"),

        h("a", {
          className: "btn",
          href: "#contact"
        }, "Get in touch"),

        DATA.resume
          ? h("a", {
              className: "btn",
              href: DATA.resume,
              download: "Ved_Korde_Resume.pdf"
            }, "Download resume")
          : null
      )
    ),

    h("div", { className: "cue" },
      h("i"),
      "Scroll"
    )
  );
}

/* ---------- terminal ---------- */

function Terminal() {
  const [ref, v] = useInView(0.4);
  const full = DATA.terminal.join("\n");
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!v) return;

    if (REDUCE) {
      setN(full.length);
      return;
    }

    const t = setInterval(() => {
      setN(x => {
        if (x >= full.length) {
          clearInterval(t);
          return x;
        }
        return x + 1;
      });
    }, 38);

    return () => clearInterval(t);
  }, [v]);

  const lines = full.slice(0, n).split("\n");

  return h("div", {
    className: "glass term",
    ref
  },
    h("div", {
      className: "term-bar",
      "aria-hidden": "true"
    },
      h("i"),
      h("i"),
      h("i")
    ),

    h("pre", {
      "aria-label": DATA.terminal.join(" ")
    },
      lines.map((l, k) =>
        h("div", {
          key: k,
          className: l.startsWith("$") ? "pr" : ""
        },
          l,
          k === lines.length - 1
            ? h("span", { className: "caret" })
            : null
        )
      )
    )
  );
}

/* ---------- about ---------- */

function About() {
  return h("section", {
    id: "about",
    className: "sec"
  },
    h("div", { className: "about" },

      h("div", null,
        h(Split, {
          text: "Code with a pulse, design with intent."
        }),

        h("p", { className: "lead" }, DATA.about[0]),

        h("p", {
          className: "lead",
          style: { marginTop: 18 }
        }, DATA.about[1])
      ),

      h("div", { className: "right" },
        h(Terminal),

        h("div", { className: "stats" },
          DATA.stats.map((s, k) =>
            h("div", {
              className: "glass stat",
              key: k
            },
              h(Counter, {
                to: s.n,
                prefix: s.p,
                suffix: s.s
              }),
              h("span", null, s.l)
            )
          )
        )
      )
    )
  );
}

/* ---------- skills: fixed visibility and animation ---------- */

function Skills() {
  return h("section", {
    id: "skills",
    className: "stack skills-section"
  },

    h(Split, {
      text: "Technologies & Expertise."
    }),

    h("div", {
      className: "skill-dashboard"
    },
      DATA.skills.map((group, index) =>
        h(SkillCard, {
          key: group.title,
          group,
          index
        })
      )
    ),

    h("div", { className: "skills-footer" },
      h("span", null, "ALWAYS LEARNING"),
      h("span", { className: "skills-footer-line" }),
      h("span", null, "BUILD. EXPLORE. SECURE.")
    )
  );
}

function SkillCard({ group, index }) {
  const [ref, visible] = useInView(0.15);

  const move = (e) => {
    if (REDUCE || !ref.current) return;

    const el = ref.current;
    const r = el.getBoundingClientRect();

    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;

    el.style.setProperty("--mx", x * 100 + "%");
    el.style.setProperty("--my", y * 100 + "%");

    // Keep the card's CSS entrance/hover transform in control.
    // Pointer coordinates only drive the moving highlight.
    el.style.setProperty("--tilt-x", ((0.5 - y) * 3) + "deg");
    el.style.setProperty("--tilt-y", ((x - 0.5) * 3) + "deg");
  };

  const leave = () => {
    if (ref.current) {
      ref.current.style.removeProperty("--tilt-x");
      ref.current.style.removeProperty("--tilt-y");
      ref.current.style.setProperty("--mx", "50%");
      ref.current.style.setProperty("--my", "50%");
    }
  };

  const descriptions = [
    "Building logic, solving problems and writing efficient code.",
    "Creating responsive interfaces and modern web experiences.",
    "Exploring networks, digital forensics and application security.",
    "Working with development environments, version control and deployment.",
    "Combining technical knowledge to build practical solutions."
  ];

  const icons = ["</>", "{ }", "⌘", "▣", "✳"];

  const items = [...new Set(group.items || [])];

  return h("article", {
    ref,

    className:
      "skill-card glass" + (visible ? " is-visible" : ""),

    onMouseMove: move,
    onMouseLeave: leave,

    style: {
      "--card-delay": (index * 120) + "ms",
    }
  },

    h("div", {
      className: "skill-card-glow",
      "aria-hidden": "true"
    }),

    h("div", {
      className: "skill-card-orbit",
      "aria-hidden": "true"
    }),

    h("div", { className: "skill-card-header" },

      h("span", {
        className: "skill-code"
      }, "0" + (index + 1) + " / TECH"),

      h("span", {
        className: "skill-icon"
      }, icons[index] || "✳")
    ),

    h("div", { className: "skill-title-row" },
      h("h3", {
        className: "skill-title"
      }, group.title),
      h("span", { className: "skill-index" }, "0" + (index + 1))
    ),

    h("p", {
      className: "skill-description"
    },
      descriptions[index] ||
      "Technologies used in practical development."
    ),

    h("div", {
      className: "skill-divider"
    }),

    h("div", {
      className: "skill-bottom"
    },
      h("span", {
        className: "skill-label"
      }, "TECHNOLOGY STACK"),

      h("span", {
        className: "skill-count"
      },
        String(items.length).padStart(2, "0") + " SKILLS"
      )
    ),

    h("div", {
      className: "skill-tags"
    },
      items.map(item =>
        h("span", {
          key: item,
          className: "skill-tag"
        },
          h("i", {
            className: "skill-dot"
          }),
          item
        )
      )
    ),

    h("div", { className: "skill-card-foot" },
      h("span", null, "PRACTICAL KNOWLEDGE"),
      h("span", { className: "skill-foot-status" },
        h("i"), " CONTINUOUSLY LEARNING"
      )
    )
  );
}

/* ---------- project cards: original component preserved ---------- */

function Card({ p }) {
  const ref = useRef(null);

  const move = (e) => {
    const el = ref.current;
    const r = el.getBoundingClientRect();

    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;

    el.style.setProperty("--mx", x * 100 + "%");
    el.style.setProperty("--my", y * 100 + "%");

    if (!REDUCE) {
      el.style.transform =
        "perspective(900px) rotateY(" +
        ((x - 0.5) * 9) +
        "deg) rotateX(" +
        ((0.5 - y) * 9) +
        "deg)";
    }
  };

  const leave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return h("article", {
    className: "card glass",
    ref,
    onMouseMove: move,
    onMouseLeave: leave
  },

    h("div", {
      className: "shot",
      style: { "--h": p.hue }
    },

      h("div", { className: "dots" },
        h("i"),
        h("i"),
        h("i")
      ),

      h("span", { className: "badge" }, p.cat),

      h("div", { className: "feat" },
        p.features.map((f, k) =>
          h("div", {
            key: k,
            style: {
              animationDelay: (k * 0.12) + "s"
            }
          },
            f,
            k === p.features.length - 1
              ? h("span", { className: "caret" })
              : null
          )
        )
      )
    ),

    h("div", { className: "card-b" },

      h("h3", null,
        p.title,
        h("span", { className: "sub" }, p.sub)
      ),

      h("p", null, p.desc),

      h("div", { className: "tags" },
        p.tags.map(t =>
          h("span", { key: t }, t)
        )
      ),

      h("a", {
        className: "more",
        href: p.link,
        target: "_blank",
        rel: "noopener noreferrer"
      }, "View on GitHub")
    )
  );
}

/* ---------- projects ---------- */

function Work() {
  const sec = useRef(null);
  const track = useRef(null);
  const bar = useRef(null);

  useEffect(() => {
    return onScrollFrame(() => {
      const s = sec.current;
      const t = track.current;

      if (!s || !t) return;

      const dist = Math.max(0, t.scrollWidth - innerWidth);

      s.style.height = (dist + innerHeight) + "px";

      const rect = s.getBoundingClientRect();

      const prog = dist > 0
        ? Math.min(1, Math.max(0, -rect.top / dist))
        : 0;

      t.style.transform =
        "translate3d(" + (-prog * dist) + "px,0,0)";

      if (bar.current) {
        bar.current.style.transform = "scaleX(" + prog + ")";
      }
    });
  }, []);

  return h("section", {
    id: "work",
    className: "work",
    ref: sec
  },

    h("div", { className: "pin" },

      h("div", { className: "work-head" },

        h(Split, {
          text: "Selected work"
        }),

        h("div", {
          className: "bar",
          "aria-hidden": "true"
        },
          h("i", { ref: bar })
        )
      ),

      h("div", {
        className: "track",
        ref: track
      },
        DATA.projects.map(p =>
          h(Card, {
            key: p.title,
            p
          })
        )
      )
    )
  );
}

/* ---------- journey ---------- */

function Journey() {
  const ref = useRef(null);
  const [cnt, setCnt] = useState(0);

  useEffect(() => {
    return onScrollFrame(() => {
      const el = ref.current;
      if (!el) return;

      const r = el.getBoundingClientRect();

      el.style.setProperty(
        "--tl",
        Math.min(
          1,
          Math.max(0, (innerHeight * 0.65 - r.top) / r.height)
        ).toFixed(3)
      );

      let c = 0;

      el.querySelectorAll(".tl-item").forEach(it => {
        if (it.getBoundingClientRect().top < innerHeight * 0.68) {
          c++;
        }
      });

      setCnt(c);
    });
  }, []);

  return h("section", {
    id: "journey",
    className: "sec journey"
  },

    h(Split, {
      text: "How I got here."
    }),

    h("div", {
      className: "tl",
      ref
    },
      DATA.timeline.map((t, k) =>
        h("div", {
          key: k,
          className: "glass tl-item" + (k < cnt ? " on" : "")
        },

          h("span", {
            className: "when"
          }, t.when),

          h("h3", null, t.role),

          h("div", {
            className: "where"
          }, t.where),

          h("p", null, t.text)
        )
      )
    )
  );
}
/* ---------- academic background ---------- */

function Achievements() {
  const [ref, v] = useInView(0.25);

  const certifications = [
    "Web Devloper",
    "Full Stack Devloper",
    "Mern-Stack in progess",
    "Java Programming in progerss"
    
  ];

  return h("section", {
    id: "achievements",
    className: "sec academic-section"
  },

    h(Split, {
      text: "Academic background."
    }),

    h("div", {
      className: "academic-card glass" + (v ? " in" : ""),
      ref
    },

      h("div", { className: "academic-label" },
        "07 — EDUCATION & CREDENTIALS"
      ),

      h("div", { className: "academic-content" },

        h("div", { className: "academic-main" },

          h("span", { className: "academic-index" }, "01"),

          h("h2", null,
            "St. Vincent Pallotti College of Engineering & Technology"
          ),

          h("h3", null,
            "B.Tech in Computer Science & Engineering (Cyber Security)"
          ),

          h("div", { className: "academic-meta" },
            h("span", null, "Nagpur, India"),
            h("span", null, "Sep 2024 – Present"),
            h("span", { className: "academic-cgpa" },
              "CGPA 8.0 / 10"
            )
          )
        ),

        h("div", { className: "academic-divider" }),

        h("div", { className: "cert-heading" },
          h("span", null, "CERTIFICATIONS"),
          h("span", { className: "cert-count" },
            "04 CREDENTIALS"
          )
        ),

        h("div", { className: "cert-list" },

          certifications.map((cert, i) =>
            h("div", {
              className: "cert-item",
              key: cert,
              style: {
                transitionDelay: (i * 100) + "ms"
              }
            },
              h("span", { className: "cert-number" },
                String(i + 1).padStart(2, "0")
              ),
              h("span", { className: "cert-name" }, cert),
              h("span", { className: "cert-arrow" }, "↗")
            )
          )
        )
      )
    )
  );
}

/* ---------- contact ---------- */

function CopyEmail() {
  const [ok, setOk] = useState(false);

  const go = () => {
    const done = () => {
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    };

    try {
      navigator.clipboard.writeText(DATA.email).then(done, done);
    } catch (e) {
      done();
    }
  };

  return h("button", {
    className: "btn big",
    onClick: go
  }, ok ? "Email copied" : " " + DATA.email);
}

function Contact() {
  return h("section", {
    id: "contact",
    className: "sec contact"
  },

    h(Split, {
      text: "Have a project in mind? Let's connect."
    }),

    h("p", {
      className: "lead",
      style: { marginBottom: 30 }
    },
      "Based in " + DATA.location +
      ". Reach out about projects, collaborations, team member for CTF or just to talk security."
    ),

    h("div", { className: "cta" },

      

      h(CopyEmail)
    ),

    h("div", { className: "socials" },

      DATA.resume
        ? h("a", {
            className: "btn",
            href: DATA.resume,
            download: "Ved_Korde_Resume.pdf"
          }, "Download resume")
        : null,

      DATA.links.map(l =>
        h("a", {
          key: l.label,
          className: "btn",
          href: l.href,
          target: "_blank",
          rel: "noopener noreferrer"
        }, l.label)
      )
    ),

    h("div", { className: "foot" },

      h("span", null,
        "© " + new Date().getFullYear() +
        " " + DATA.name + " · " + DATA.location
      ),

      h("span", null, "Designed and built with React")
    )
  );
}

/* ---------- app ---------- */

function App() {
  const [active, setActive] = useState("home");
  const hud = useRef(null);

  useEffect(() => {
    document.title =
      DATA.name + " — Cybersecurity and Full-Stack Developer";

    const root = document.documentElement;

    const off = onScrollFrame(() => {
      const max = root.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;

      root.style.setProperty("--sy", scrollY.toFixed(1));
      root.style.setProperty("--p", p.toFixed(4));

      if (hud.current) {
        hud.current.textContent =
          "Y " +
          String(Math.round(scrollY)).padStart(5, "0") +
          "px  |  " +
          String(Math.round(p * 100)).padStart(3, "0") +
          "%";
      }
    });

    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        }),
      { rootMargin: "-45% 0px -50% 0px" }
    );

    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });

    /* Magnetic buttons */

    let mag = () => {};
    let magOut = () => {};

    if (!REDUCE && matchMedia("(hover: hover)").matches) {
      mag = (e) => {
        const b = e.target.closest && e.target.closest(".btn");
        if (!b) return;

        const r = b.getBoundingClientRect();

        b.style.transform =
          "translate(" +
          ((e.clientX - r.left - r.width / 2) * 0.22) +
          "px," +
          ((e.clientY - r.top - r.height / 2) * 0.3) +
          "px)";
      };

      magOut = (e) => {
        if (
          e.target.classList &&
          e.target.classList.contains("btn")
        ) {
          e.target.style.transform = "";
        }
      };

      addEventListener("mousemove", mag);
      addEventListener("mouseout", magOut);
    }

    return () => {
      off();
      io.disconnect();

      removeEventListener("mousemove", mag);
      removeEventListener("mouseout", magOut);
    };
  }, []);

  return h(
    React.Fragment,
    null,

    h(Background),
    h(CursorGlow),

    h("div", {
      className: "progress",
      "aria-hidden": "true"
    }),

    h("div", {
      className: "hud",
      "aria-hidden": "true",
      ref: hud
    }),

    h(Nav, { active }),

    h("main", null,

      h(Hero, { ready: true }),

      h(About),

      h(Skills),

      h(Work),

      h(Journey),

      h(Achievements),

      h(Contact)
    )
  );
}

export default App;