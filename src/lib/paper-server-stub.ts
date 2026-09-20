/**
 * Server-side stub for `paper`.
 *
 * Paper.js is browser-only (it needs a canvas) and pulls jsdom into the server
 * bundle, which cannot be built for the edge runtime. Vector cat avatars are
 * only ever generated from client components via a dynamic import, so the
 * server never touches these members — they exist purely so the module graph
 * resolves during the SSR build.
 */
function unavailable(): never {
  throw new Error("paper.js is not available during server rendering");
}

const paperStub = {
  PaperScope: class {
    setup() {
      unavailable();
    }
  },
  Path: class {
    constructor() {
      unavailable();
    }
  },
  Group: class {
    constructor() {
      unavailable();
    }
  },
  Point: class {
    constructor() {
      unavailable();
    }
  },
  Size: class {
    constructor() {
      unavailable();
    }
  },
  Color: class {
    constructor() {
      unavailable();
    }
  },
  Rectangle: class {
    constructor() {
      unavailable();
    }
  },
  Segment: class {
    constructor() {
      unavailable();
    }
  },
};

export default paperStub;
