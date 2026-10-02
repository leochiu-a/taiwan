# Generates public/trees.glb: one low-poly, vertex-coloured mesh per species,
# each standing on the origin. Units are scene units, not metres; the relative
# sizes between species are what matters.
# Run: blender --background --factory-startup --python blender/trees.py
import math
import random
from pathlib import Path

import bpy
from mathutils import Vector

OUT = Path(__file__).resolve().parent.parent / "public" / "trees.glb"
rng = random.Random(7)


def linear(hex_color):
    def channel(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    h = hex_color.lstrip("#")
    return tuple(channel(int(h[i : i + 2], 16)) for i in (0, 2, 4)) + (1.0,)


def paint(obj, hex_color, vary=0.0):
    base = linear(hex_color)
    attr = obj.data.color_attributes.new("Color", "FLOAT_COLOR", "CORNER")
    for poly in obj.data.polygons:
        k = 1 + rng.uniform(-vary, vary)
        c = tuple(min(1.0, v * k) for v in base[:3]) + (1.0,)
        for li in poly.loop_indices:
            attr.data[li].color = c


def jitter(obj, amount):
    for v in obj.data.vertices:
        v.co += Vector([rng.uniform(-amount, amount) for _ in range(3)])


def place(obj, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    obj.location = loc
    obj.rotation_euler = rot
    obj.scale = scale
    return obj


def cone(color, r1, r2, depth, loc, verts=7, rot=(0, 0, 0), vary=0.08, wobble=0.0):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth)
    obj = bpy.context.object
    jitter(obj, wobble)
    paint(obj, color, vary)
    return place(obj, loc, rot)


def blob(color, radius, loc, scale=(1, 1, 1), vary=0.1, wobble=0.15):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=radius)
    obj = bpy.context.object
    jitter(obj, radius * wobble)
    paint(obj, color, vary)
    return place(obj, loc, scale=scale)


def stick(color, start, end, r1, r2=None, verts=6):
    """A tapered cylinder from start to end."""
    start, end = Vector(start), Vector(end)
    d = end - start
    obj = cone(color, r1, r2 if r2 is not None else r1 * 0.7, d.length, (start + end) / 2, verts, vary=0.05)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = d.to_track_quat("Z", "Y")
    return obj


def finish(name, parts):
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.name = obj.data.name = name
    return obj


BARK = "#6b4a32"
BARK_GREY = "#8a8178"


def areca():  # 檳榔
    parts = [stick("#9a9a7a", (0, 0, 0), (0, 0, 1.5), 0.035, 0.028)]
    parts.append(cone("#6f9a3a", 0.045, 0.04, 0.18, (0, 0, 1.55)))
    for i in range(8):
        a = i / 8 * math.tau + rng.uniform(-0.2, 0.2)
        tip = Vector((math.cos(a) * 0.45, math.sin(a) * 0.45, 1.45 + rng.uniform(-0.08, 0.05)))
        parts.append(stick("#4f8a2e", (0, 0, 1.62), tip, 0.06, 0.005, verts=3))
    return finish("areca", parts)


def pandanus():  # 林投
    parts = []
    for i in range(3):
        a = i / 3 * math.tau
        parts.append(stick(BARK_GREY, (math.cos(a) * 0.12, math.sin(a) * 0.12, 0), (0.02, 0, 0.18), 0.015))
    parts.append(stick(BARK_GREY, (0.02, 0, 0.15), (0.12, 0, 0.5), 0.04, 0.03))
    for i in range(14):
        a = rng.uniform(0, math.tau)
        up = rng.uniform(0.0, 0.35)
        tip = Vector((0.12 + math.cos(a) * 0.35, math.sin(a) * 0.35, 0.5 + up))
        parts.append(stick("#5f8f3a", (0.12, 0, 0.5), tip, 0.03, 0.002, verts=3))
    parts.append(blob("#d88a2a", 0.07, (0.14, 0.03, 0.47)))  # 鳳梨狀果實
    return finish("pandanus", parts)


def broadleaf(name, canopy, accents=(), trunk_h=0.35, size=0.3, count=4):
    parts = [stick(BARK, (0, 0, 0), (0, 0, trunk_h + size * 0.5), 0.045, 0.03)]
    for _ in range(count):
        r = size * rng.uniform(0.7, 1.0)
        loc = (rng.uniform(-size, size) * 0.6, rng.uniform(-size, size) * 0.6, trunk_h + size * rng.uniform(0.4, 1.0))
        parts.append(blob(canopy, r, loc, scale=(1, 1, 0.8)))
    for color, n in accents:
        for _ in range(n):
            a = rng.uniform(0, math.tau)
            rad = size * rng.uniform(0.5, 1.0)
            loc = (math.cos(a) * rad, math.sin(a) * rad, trunk_h + size * rng.uniform(0.8, 1.6))
            parts.append(blob(color, size * 0.28, loc))
    return finish(name, parts)


def red_cypress():  # 紅檜
    parts = [stick("#7a3f2a", (0, 0, 0), (0, 0, 1.3), 0.16, 0.08, verts=8)]
    for i in range(3):  # 板根
        a = i / 3 * math.tau + 0.4
        parts.append(stick("#7a3f2a", (math.cos(a) * 0.22, math.sin(a) * 0.22, 0), (0, 0, 0.35), 0.06, 0.04))
    for i in range(6):
        z = 0.9 + i * 0.22
        r = 0.55 - i * 0.07
        a = rng.uniform(0, math.tau)
        loc = (math.cos(a) * 0.12, math.sin(a) * 0.12, z)
        parts.append(blob("#2f5a3a", r * 0.6, loc, scale=(1.3, 1.1, 0.6), wobble=0.25))
    return finish("red_cypress", parts)


def taiwania():  # 台灣杉
    parts = [stick(BARK, (0, 0, 0), (0, 0, 2.4), 0.07, 0.02)]
    for i in range(7):
        z = 0.7 + i * 0.25
        r = 0.32 - i * 0.035
        parts.append(cone("#3d6b45", r, r * 0.15, 0.4, (0, 0, z), verts=7, wobble=0.02))
    return finish("taiwania", parts)


def fir():  # 台灣冷杉
    parts = [stick(BARK_GREY, (0, 0, 0), (0, 0, 0.4), 0.05, 0.04)]
    for i in range(5):
        z = 0.35 + i * 0.22
        r = 0.42 - i * 0.075
        parts.append(cone("#1f4a42", r, 0.02, 0.38, (0, 0, z), verts=8, wobble=0.015))
    return finish("fir", parts)


def juniper():  # 玉山圓柏：被風吹歪的扭曲樹幹
    pts = [(0, 0, 0), (0.08, 0.02, 0.15), (0.05, -0.04, 0.3), (0.2, 0.02, 0.42), (0.38, 0.05, 0.48)]
    parts = [stick("#b8b0a2", pts[i], pts[i + 1], 0.05 - i * 0.008) for i in range(len(pts) - 1)]
    parts.append(stick("#b8b0a2", pts[2], (-0.12, 0.08, 0.38), 0.025, 0.012))  # 枯枝
    for i, loc in enumerate([(0.3, 0.03, 0.5), (0.45, 0.0, 0.5), (0.15, 0.05, 0.47), (0.36, -0.08, 0.44)]):
        parts.append(blob("#4f7a6e", 0.14 - i * 0.015, loc, scale=(1.6, 1.1, 0.5), wobble=0.3))
    return finish("juniper", parts)


def rhododendron():  # 玉山杜鵑
    parts = []
    for _ in range(4):
        loc = (rng.uniform(-0.12, 0.12), rng.uniform(-0.12, 0.12), 0.1)
        parts.append(blob("#3f6b38", 0.12, loc, scale=(1.2, 1.2, 0.7)))
    for _ in range(9):
        a = rng.uniform(0, math.tau)
        loc = (math.cos(a) * 0.15, math.sin(a) * 0.15, rng.uniform(0.12, 0.2))
        parts.append(blob("#f2c4d0", 0.045, loc))
    return finish("rhododendron", parts)


def hinoki():  # 台灣扁柏：比紅檜更尖、更密的圓錐樹冠
    parts = [stick("#8a5a3c", (0, 0, 0), (0, 0, 1.2), 0.12, 0.06, verts=8)]
    for i in range(7):
        z = 0.75 + i * 0.2
        r = 0.48 - i * 0.06
        a = rng.uniform(0, math.tau)
        loc = (math.cos(a) * 0.06, math.sin(a) * 0.06, z)
        parts.append(blob("#4a6e34", r * 0.6, loc, scale=(1.2, 1.2, 0.55), wobble=0.2))
    return finish("hinoki", parts)


def hemlock():  # 台灣鐵杉：層層平展、頂部平的傘狀樹冠
    parts = [stick(BARK_GREY, (0, 0, 0), (0, 0, 1.4), 0.08, 0.04)]
    for i in range(4):
        z = 0.7 + i * 0.22
        r = 0.55 - i * 0.08
        for k in range(3):
            a = k / 3 * math.tau + i
            loc = (math.cos(a) * r * 0.45, math.sin(a) * r * 0.45, z)
            parts.append(blob("#2c4f3a", r * 0.45, loc, scale=(1.5, 1.5, 0.35), wobble=0.2))
    return finish("hemlock", parts)


def pine():  # 台灣二葉松：高直樹幹，針葉成簇長在枝端
    parts = [stick("#7a4a2e", (0, 0, 0), (0.05, 0, 1.6), 0.07, 0.03)]
    for i in range(7):
        z = 0.8 + i * 0.12
        a = rng.uniform(0, math.tau)
        reach = 0.38 - i * 0.03
        tip = (math.cos(a) * reach, math.sin(a) * reach, z + 0.08)
        parts.append(stick("#7a4a2e", (0.03, 0, z), tip, 0.018, 0.01))
        parts.append(blob("#3f6a3a", 0.13, tip, scale=(1.3, 1.3, 0.6), wobble=0.3))
    parts.append(blob("#3f6a3a", 0.14, (0.05, 0, 1.65), scale=(1.2, 1.2, 0.8)))
    return finish("pine", parts)


def incense_cedar():  # 台灣肖楠：窄長的圓柱狀樹冠
    parts = [stick(BARK, (0, 0, 0), (0, 0, 0.5), 0.06, 0.05)]
    for i in range(6):
        z = 0.45 + i * 0.2
        r = 0.2 - abs(i - 2) * 0.02
        parts.append(blob("#35603a", r, (0, 0, z), scale=(1, 1, 1.3), wobble=0.15))
    return finish("incense_cedar", parts)


def lily():  # 台灣百合：細莖、窄葉，頂端幾朵喇叭狀白花
    parts = [stick("#5d8a3e", (0, 0, 0), (0, 0, 0.7), 0.012, 0.008)]
    for i in range(8):
        a = rng.uniform(0, math.tau)
        z = 0.1 + i * 0.07
        tip = (math.cos(a) * 0.12, math.sin(a) * 0.12, z + 0.05)
        parts.append(stick("#5d8a3e", (0, 0, z), tip, 0.018, 0.002, verts=3))
    for i in range(3):
        a = i / 3 * math.tau
        tip = Vector((math.cos(a) * 0.14, math.sin(a) * 0.14, 0.72))
        parts.append(stick("#f6f3ea", (0, 0, 0.7), tip, 0.015, 0.06, verts=6))
    return finish("lily", parts)


def orchid():  # 台灣一葉蘭：一片大葉、一朵粉紫色花
    parts = [blob("#6a4a6e", 0.05, (0, 0, 0.04))]  # 假球莖
    parts.append(stick("#4f7a38", (0, 0, 0.05), (0.18, 0.02, 0.2), 0.05, 0.01, verts=4))
    parts.append(stick("#4f7a38", (0, 0, 0.05), (-0.02, 0, 0.22), 0.008))
    for i in range(5):
        a = i / 5 * math.tau
        tip = (-0.02 + math.cos(a) * 0.09, math.sin(a) * 0.09, 0.24)
        parts.append(stick("#e7a8d2", (-0.02, 0, 0.22), tip, 0.025, 0.01, verts=4))
    return finish("orchid", parts)


def hypericum():  # 玉山金絲桃：高山矮灌叢，夏天開黃花
    parts = []
    for _ in range(5):
        loc = (rng.uniform(-0.14, 0.14), rng.uniform(-0.14, 0.14), 0.09)
        parts.append(blob("#4a7a3a", 0.11, loc, scale=(1.2, 1.2, 0.7)))
    for _ in range(8):
        a = rng.uniform(0, math.tau)
        loc = (math.cos(a) * 0.16, math.sin(a) * 0.16, rng.uniform(0.1, 0.18))
        parts.append(blob("#f2c230", 0.04, loc))
    return finish("hypericum", parts)


bpy.ops.wm.read_factory_settings(use_empty=True)
species = [
    areca(),
    pandanus(),
    broadleaf("goldenrain", "#5f8a35", accents=(("#e8c440", 5), ("#c8573f", 4)), size=0.32),  # 台灣欒樹
    broadleaf("acacia", "#4d6b2c", trunk_h=0.4, size=0.34, count=5),  # 相思樹
    broadleaf("tung", "#4f7f34", accents=(("#f4f1e8", 6),), trunk_h=0.38, size=0.3),  # 油桐
    broadleaf("cherry", "#5d8a3e", accents=(("#e58fae", 6),), trunk_h=0.3, size=0.26),  # 山櫻花
    red_cypress(),
    taiwania(),
    fir(),
    juniper(),
    rhododendron(),
    hinoki(),
    hemlock(),
    pine(),
    incense_cedar(),
    broadleaf("maple", "#5a8a3a", trunk_h=0.4, size=0.3, count=5),  # 台灣紅榨槭
    broadleaf("hibiscus", "#4f7f34", accents=(("#f4dce6", 6),), trunk_h=0.12, size=0.2, count=4),  # 山芙蓉
    lily(),
    orchid(),
    hypericum(),
]
for i, obj in enumerate(species):  # 在 Blender 裡打開檢查時排成一列
    obj.location.x = i * 1.5

OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=str(OUT),
    export_format="GLB",
    export_vertex_color="ACTIVE",
    export_materials="NONE",
)
print(f"wrote {OUT} with {len(species)} species")
