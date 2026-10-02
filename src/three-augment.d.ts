import "three/examples/jsm/math/MeshSurfaceSampler.js";

// Present in three's implementation but missing from @types/three.
declare module "three/examples/jsm/math/MeshSurfaceSampler.js" {
  interface MeshSurfaceSampler {
    setRandomGenerator(randomFunction: () => number): this;
  }
}
