"""Procedural low-poly-ish 3D game asset: rubber duck in a suit. Outputs suit_duck.glb (glTF 2.0).
Y-up, faces +Z, ~1.05 units tall, origin at bottom center. No dependencies except numpy."""
import json, struct, base64, math, os
import numpy as np

OUT = os.path.dirname(os.path.abspath(__file__))

def rot(rx=0, ry=0, rz=0):
    rx, ry, rz = map(math.radians, (rx, ry, rz))
    X = np.array([[1,0,0],[0,math.cos(rx),-math.sin(rx)],[0,math.sin(rx),math.cos(rx)]])
    Y = np.array([[math.cos(ry),0,math.sin(ry)],[0,1,0],[-math.sin(ry),0,math.cos(ry)]])
    Z = np.array([[math.cos(rz),-math.sin(rz),0],[math.sin(rz),math.cos(rz),0],[0,0,1]])
    return Z @ Y @ X

def align_y(d):
    d = np.asarray(d, float); d /= np.linalg.norm(d)
    y = np.array([0, 1.0, 0]); v = np.cross(y, d); c = y @ d
    if np.linalg.norm(v) < 1e-8:
        return np.eye(3) if c > 0 else rot(180, 0, 0)
    K = np.array([[0,-v[2],v[1]],[v[2],0,-v[0]],[-v[1],v[0],0]])
    return np.eye(3) + K + K @ K * (1 / (1 + c))

def transform(P, N, M, t):
    P = P @ M.T + np.asarray(t)
    N = N @ np.linalg.inv(M)  # == (inv(M).T @ n) per row
    N /= np.linalg.norm(N, axis=1, keepdims=True)
    return P, N

def sphere(seg=48, rings=32):
    P, N, I = [], [], []
    for r in range(rings + 1):
        th = math.pi * r / rings
        for s in range(seg + 1):
            ph = 2 * math.pi * s / seg
            v = [math.sin(th) * math.sin(ph), math.cos(th), math.sin(th) * math.cos(ph)]
            P.append(v); N.append(v)
    for r in range(rings):
        for s in range(seg):
            a = r * (seg + 1) + s; b = a + seg + 1
            I += [a, b, a + 1, a + 1, b, b + 1]
    return np.array(P), np.array(N), np.array(I)

def ellipsoid(center, radii, R=np.eye(3), seg=48, rings=32):
    P, N, I = sphere(seg, rings)
    P, N = transform(P, N, R @ np.diag(radii), center)
    return P, N, I

def torus(center, axis, R_major, r_minor, seg=40, tube=16):
    P, N, I = [], [], []
    for i in range(seg + 1):
        u = 2 * math.pi * i / seg
        for j in range(tube + 1):
            v = 2 * math.pi * j / tube
            cx, cz = math.cos(u), math.sin(u)
            P.append([(R_major + r_minor * math.cos(v)) * cx, r_minor * math.sin(v), (R_major + r_minor * math.cos(v)) * cz])
            N.append([math.cos(v) * cx, math.sin(v), math.cos(v) * cz])
    for i in range(seg):
        for j in range(tube):
            a = i * (tube + 1) + j; b = a + tube + 1
            I += [a, a + 1, b, a + 1, b + 1, b]
    return (*transform(np.array(P), np.array(N), align_y(axis), center), np.array(I))

# ---------- parts ----------
parts = []  # (name, material, (P, N, I))

# Body (suit) with flattened bottom so it sits on a surface
P, N, I = ellipsoid((0, 0.28, 0), (0.36, 0.28, 0.32))
flat = P[:, 1] < 0.0
P[flat, 1] = 0.0; N[flat] = [0, -1, 0]
parts.append(("Body_Suit", "suit", (P, N, I)))

SHIRT_C, SHIRT_R = np.array([0, 0.33, 0.22]), np.array([0.17, 0.25, 0.11])
parts.append(("Shirt", "white", ellipsoid(SHIRT_C, SHIRT_R)))
parts.append(("Collar_L", "white", ellipsoid((-0.065, 0.52, 0.27), (0.065, 0.028, 0.045), rot(15, 0, -28), 24, 16)))
parts.append(("Collar_R", "white", ellipsoid((0.065, 0.52, 0.27), (0.065, 0.028, 0.045), rot(15, 0, 28), 24, 16)))

# Tie: blade conforming to the shirt surface + knot
def shirt_z(x, y):
    q = 1 - (x / SHIRT_R[0]) ** 2 - ((y - SHIRT_C[1]) / SHIRT_R[1]) ** 2
    return SHIRT_C[2] + SHIRT_R[2] * math.sqrt(max(q, 0))

def half_w(y):
    return 0.024 + (0.48 - y) / 0.28 * 0.022 if y >= 0.2 else 0.046 * (y - 0.15) / 0.05

def tie_blade(rows=24):
    ys = np.linspace(0.485, 0.15, rows + 1)
    P, N, I = [], [], []
    def quad(a, b, c, d, n):
        base = len(P); P.extend([a, b, c, d]); N.extend([n] * 4)
        I.extend([base, base + 1, base + 2, base, base + 2, base + 3])
    def pt(x, y, off):
        return [x, y, shirt_z(x, y) + off]
    for k in range(rows):
        y0, y1 = ys[k], ys[k + 1]; w0, w1 = half_w(y0), half_w(y1)
        quad(pt(-w0, y0, .02), pt(-w1, y1, .02), pt(w1, y1, .02), pt(w0, y0, .02), [0, 0, 1])     # front
        quad(pt(-w0, y0, .02), pt(-w1, y1, .02), pt(-w1, y1, .004), pt(-w0, y0, .004), [-1, 0, 0])  # left side
        quad(pt(w0, y0, .004), pt(w1, y1, .004), pt(w1, y1, .02), pt(w0, y0, .02), [1, 0, 0])      # right side
    w = half_w(ys[0])
    quad(pt(-w, ys[0], .004), pt(-w, ys[0], .02), pt(w, ys[0], .02), pt(w, ys[0], .004), [0, 1, 0])
    return np.array(P, float), np.array(N, float), np.array(I)
# fix left side to be flush (same offsets as right)
_tb = tie_blade()
parts.append(("Tie", "red", _tb))
parts.append(("Tie_Knot", "red", ellipsoid((0, 0.495, shirt_z(0, 0.495) + 0.012), (0.032, 0.028, 0.02), rot(), 20, 14)))

# Head
parts.append(("Head", "yellow", ellipsoid((0, 0.72, 0.02), (0.25, 0.27, 0.24))))

# Beak (pouty lips)
parts.append(("Beak_Upper", "orange", ellipsoid((0, 0.665, 0.25), (0.15, 0.058, 0.12), rot(-8, 0, 0))))
parts.append(("Beak_Lower", "orange", ellipsoid((0, 0.605, 0.225), (0.115, 0.045, 0.10), rot(10, 0, 0))))

# Squinting eyes + brow ridges
for side, sx in (("L", -1), ("R", 1)):
    parts.append((f"Eye_{side}", "eye", ellipsoid((sx * 0.09, 0.78, 0.212), (0.05, 0.013, 0.024), rot(0, sx * 20, sx * -8), 20, 12)))
    parts.append((f"Brow_{side}", "yellow", ellipsoid((sx * 0.09, 0.805, 0.21), (0.055, 0.018, 0.025), rot(0, sx * 20, sx * 10), 20, 12)))

# Hair: cap + back + front swoop
parts.append(("Hair_Cap", "hair", ellipsoid((0, 0.88, -0.02), (0.265, 0.15, 0.265))))
parts.append(("Hair_Back", "hair", ellipsoid((0, 0.83, -0.11), (0.27, 0.14, 0.2), rot(-10, 0, 0))))
parts.append(("Hair_Swoop", "hair", ellipsoid((0.02, 0.935, 0.10), (0.255, 0.08, 0.18), rot(12, 0, -6))))

# Left arm (down at side)
parts.append(("Arm_L_Sleeve", "suit", ellipsoid((-0.33, 0.24, 0.07), (0.09, 0.16, 0.1), rot(0, 0, -8))))
parts.append(("Arm_L_Cuff", "white", torus((-0.345, 0.12, 0.11), (0.1, -1, 0.2), 0.062, 0.02)))
parts.append(("Hand_L", "yellow", ellipsoid((-0.35, 0.085, 0.13), (0.075, 0.07, 0.08))))

# Right arm (raised, index finger up)
parts.append(("Arm_R_Sleeve", "suit", ellipsoid((0.36, 0.32, 0.09), (0.09, 0.15, 0.095), rot(15, 0, -22))))
parts.append(("Arm_R_Cuff", "white", torus((0.40, 0.43, 0.14), (0.35, 1, 0.3), 0.062, 0.02)))
parts.append(("Hand_R", "yellow", ellipsoid((0.415, 0.495, 0.16), (0.07, 0.065, 0.065))))
parts.append(("Finger_R", "yellow", ellipsoid((0.43, 0.6, 0.17), (0.027, 0.075, 0.027), rot(0, 0, -8), 20, 14)))
parts.append(("Thumb_R", "yellow", ellipsoid((0.37, 0.53, 0.2), (0.022, 0.04, 0.022), rot(0, 0, 35), 16, 10)))

# ---------- glTF ----------
def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1.0]

MATS = {
    "yellow": ("#F2E23A", 0.35), "orange": ("#FF7A1A", 0.3), "hair": ("#D08A2E", 0.5),
    "suit": ("#161C30", 0.45), "white": ("#F2F2F0", 0.4), "red": ("#D41A1A", 0.35), "eye": ("#1A1A1A", 0.3),
}
mat_names = list(MATS)
gltf = {"asset": {"version": "2.0", "generator": "make_duck.py"}, "scene": 0,
        "scenes": [{"name": "SuitDuck", "nodes": [0]}],
        "nodes": [{"name": "SuitDuck", "children": []}], "meshes": [], "accessors": [], "bufferViews": [], "buffers": [],
        "materials": [{"name": k, "pbrMetallicRoughness": {"baseColorFactor": srgb(v[0][1:]), "metallicFactor": 0.0, "roughnessFactor": v[1]}, "doubleSided": k == "red"}
                      for k, v in MATS.items()]}
blob = bytearray()

def add_view(data, target):
    while len(blob) % 4: blob.append(0)
    off = len(blob); blob.extend(data)
    gltf["bufferViews"].append({"buffer": 0, "byteOffset": off, "byteLength": len(data), "target": target})
    return len(gltf["bufferViews"]) - 1

def add_acc(arr, comp, typ, target, minmax=False):
    acc = {"bufferView": add_view(arr.tobytes(), target), "componentType": comp, "count": len(arr), "type": typ}
    if minmax:
        acc["min"] = arr.min(0).tolist(); acc["max"] = arr.max(0).tolist()
    gltf["accessors"].append(acc)
    return len(gltf["accessors"]) - 1

tris = 0
for name, mat, (P, N, I) in parts:
    pos = add_acc(P.astype(np.float32), 5126, "VEC3", 34962, True)
    nor = add_acc(N.astype(np.float32), 5126, "VEC3", 34962)
    idx = add_acc(I.astype(np.uint32), 5125, "SCALAR", 34963)
    gltf["meshes"].append({"name": name, "primitives": [{"attributes": {"POSITION": pos, "NORMAL": nor}, "indices": idx, "material": mat_names.index(mat)}]})
    gltf["nodes"].append({"name": name, "mesh": len(gltf["meshes"]) - 1})
    gltf["nodes"][0]["children"].append(len(gltf["nodes"]) - 1)
    tris += len(I) // 3

while len(blob) % 4: blob.append(0)
gltf["buffers"].append({"byteLength": len(blob)})
js = json.dumps(gltf, separators=(",", ":")).encode()
js += b" " * ((4 - len(js) % 4) % 4)
glb = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack("<II", len(js), 0x4E4F534A) + js + struct.pack("<II", len(blob), 0x004E4942) + blob
path = os.path.join(OUT, "suit_duck.glb")
open(path, "wb").write(glb)
print(f"{path}: {len(parts)} parts, {tris} triangles, {len(glb)/1024:.0f} KB")

# Preview page with the GLB embedded
html = open(os.path.join(OUT, "viewer_template.html"), encoding="utf-8").read().replace("__GLB__", base64.b64encode(glb).decode())
open(os.path.join(OUT, "suit_duck_viewer.html"), "w", encoding="utf-8").write(html)
