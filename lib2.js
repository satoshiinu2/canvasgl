
/** 
 * @typedef {[number, number]} Vec2 - 2Dベクトルを表す配列
 * @property {number} 0 - x成分
 * @property {number} 1 - y成分
 */

/** 
 * @typedef {[number, number, number]} Vec3 - 3Dベクトルを表す配列
 * @property {number} 0 - x成分
 * @property {number} 1 - y成分
 * @property {number} 2 - z成分
 */

/**
 * @typedef {[number, number, number, number]} Vec4 - 4Dベクトルを表す配列
 * @property {number} 0 - x成分
 * @property {number} 1 - y成分
 * @property {number} 2 - z成分
 * @property {number} 3 - w成分
 */

/**
 * @typedef {[number, number, number, number]} Color - RGBAカラーを表す配列
 * @property {number} 0 - 赤成分 (0.0 - 1.0)
 * @property {number} 1 - 緑成分 (0.0 - 1.0)
 * @property {number} 2 - 青成分 (0.0 - 1.0)
 * @property {number} 3 - アルファ成分 (0.0 - 1.0)
 */

/**
 * @typedef {Object} Shader
 * @property {function(Vec3): (Vec3|Vec4)} vertexShader - 頂点シェーダー関数。
 *   戻り値は次のどちらか。
 *   - Vec3 [画面x, 画面y, 奥行きz] : 従来形式。投影済みの座標を返す。クリッピングは行われず、z <= 0 の頂点を含む三角形は捨てられる。
 *   - Vec4 [X, Y, Z, W]            : クリップ空間形式。画面座標は (X/W, Y/W)、W はビュー空間の奥行き。
 *                                    W < near の部分は drawTriangle が自動でクリップする。viewToClip() が便利。
 * @property {function(Vec3, number): (Color|null)} fragmentShader - フラグメントシェーダー関数。
 *   第1引数: 透視補正済みの重心座標 [a, b, g] (元の三角形に対する重み)。配列は使い回されるので保持しないこと。
 *   第2引数: そのピクセルのビュー空間の奥行き (W)。フォグなどに使える。
 *   戻り値:  Color で描画。null か alpha <= 0 で破棄(何も書かない)。
 *            alpha < 1 は半透明合成(深度は書かない)。alpha >= 1 は不透明(深度を書く)。
 */

/**
 * @param {Vec3} a - 3Dベクトル
 * @returns {Vec3} - プロジェクション後の2Dベクトルとz成分を含む配列
 */
function project(a) {
    const z = a[2];
    if (Math.abs(z) < Number.EPSILON) {
        return [0, 0, z];
    }
    return [a[0] / z, a[1] / z, z];
}

/**
 * ビュー空間(x右, y上, z奥)の点を、drawTriangle がクリップできるクリップ空間 Vec4 に変換する。
 * 画面座標は (X/W, Y/W) になり、W はビュー空間の z と同じ。
 * @param {Vec3} a - ビュー空間の3Dベクトル
 * @param {number} focal - 焦点距離 (ピクセル単位)
 * @param {number} width - 画面の幅
 * @param {number} height - 画面の高さ
 * @returns {Vec4}
 */
function viewToClip(a, focal, width, height) {
    const z = a[2];
    return [
        a[0] * focal + z * width / 2,
        -a[1] * focal + z * height / 2,
        z,
        z,
    ];
}

/**
 * @param {Vec3} a - 3Dベクトル
 * @param {number} t - 回転角度（ラジアン）
 * @returns {Vec3} - X軸回転後の3Dベクトル
 */
function rotateX(a, t) {
    const c = Math.cos(t), s = Math.sin(t);
    return [a[0], a[1] * c - a[2] * s, a[1] * s + a[2] * c];
}

/**
 * @param {Vec3} a - 3Dベクトル
 * @param {number} t - 回転角度（ラジアン）
 * @returns {Vec3} - Y軸回転後の3Dベクトル
 */
function rotateY(a, t) {
    const c = Math.cos(t), s = Math.sin(t);
    return [a[0] * c + a[2] * s, a[1], -a[0] * s + a[2] * c];
}

/**
 * @param {Vec3} a - 3Dベクトル
 * @param {number} t - 回転角度（ラジアン）
 * @returns {Vec3} - Z軸回転後の3Dベクトル
 */
function rotateZ(a, t) {
    const c = Math.cos(t), s = Math.sin(t);
    return [a[0] * c - a[1] * s, a[0] * s + a[1] * c, a[2]];
}

/**
 * @param {Vec3} a - 3Dベクトル
 * @param {number} x - X方向の平行移動量
 * @returns {Vec3} - X方向に平行移動後の3Dベクトル
 */
function translateX(a, x) {
    return [a[0] + x, a[1], a[2]];
}

/**
 * @param {Vec3} a - 3Dベクトル
 * @param {number} y - Y方向の平行移動量
 * @returns {Vec3} - Y方向に平行移動後の3Dベクトル
 */
function translateY(a, y) {
    return [a[0], a[1] + y, a[2]];
}

/**
 * @param {Vec3} a - 3Dベクトル
 * @param {number} z - Z方向の平行移動量
 * @returns {Vec3} - Z方向に平行移動後の3Dベクトル
 */
function translateZ(a, z) {
    return [a[0], a[1], a[2] + z];
}


/**
 * 計算された三角形の符号付き面積を返す関数
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @param {number} x3 
 * @param {number} y3 
 * @returns {number}  
 */
function signedTriangleArea(x1, y1, x2, y2, x3, y3) {
    return ((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)) / 2;
}

// 重心座標の「元の三角形そのまま」を表す定数 (クリップされなかった場合に使う)
const BARY_V0 = [1, 0, 0];
const BARY_V1 = [0, 1, 0];
const BARY_V2 = [0, 0, 1];

class DrawContext {

    /**
     * @param {ImageData} image
     */
    constructor(image) {
        this.image = image;
        this.width = image.width;
        this.height = image.height;
        this.depth = new Float32Array(image.width * image.height);
        // 1ピクセル1回の書き込みにするための32bitビュー (リトルエンディアン前提: RGBA -> 0xAABBGGRR)
        this.pixels32 = new Uint32Array(image.data.buffer, image.data.byteOffset, image.width * image.height);
        /** ニアクリップ面の距離 (Vec4 を返す頂点シェーダー使用時のみ有効) */
        this.near = 0.1;
        this._bary = [0, 0, 0]; // フラグメントシェーダーへ渡す配列の使い回し
    }

    /**
     * Draws a triangle on the image using the provided shader.
     * @param {Shader} shader - The shader to use for drawing.
     * @param {Vec3} v0 - The first vertex of the triangle.
     * @param {Vec3} v1 - The second vertex of the triangle.
     * @param {Vec3} v2 - The third vertex of the triangle.
     */
    drawTriangle(shader, v0, v1, v2) {
        const o0 = shader.vertexShader(v0);
        const o1 = shader.vertexShader(v1);
        const o2 = shader.vertexShader(v2);

        // ---- 従来形式: [画面x, 画面y, z] (クリッピングなし) ----
        if (o0.length < 4) {
            if (!(o0[2] > 0) || !(o1[2] > 0) || !(o2[2] > 0)) return; // カメラの後ろを含む三角形は捨てる
            this._raster(shader,
                o0[0], o0[1], o0[2],
                o1[0], o1[1], o1[2],
                o2[0], o2[1], o2[2],
                BARY_V0, BARY_V1, BARY_V2, true);
            return;
        }

        // ---- クリップ空間形式: [X, Y, Z, W] ----
        const near = this.near;
        const in0 = o0[3] >= near, in1 = o1[3] >= near, in2 = o2[3] >= near;
        const count = (in0 ? 1 : 0) + (in1 ? 1 : 0) + (in2 ? 1 : 0);
        if (count === 0) return;

        if (count === 3) {
            const w0 = o0[3], w1 = o1[3], w2 = o2[3];
            this._raster(shader,
                o0[0] / w0, o0[1] / w0, w0,
                o1[0] / w1, o1[1] / w1, w1,
                o2[0] / w2, o2[1] / w2, w2,
                BARY_V0, BARY_V1, BARY_V2, true);
            return;
        }

        // ニア面でクリップ。各頂点は [X, Y, W, b0, b1, b2] (b* は元の三角形の重心座標)
        const poly = [
            [o0[0], o0[1], o0[3], 1, 0, 0],
            [o1[0], o1[1], o1[3], 0, 1, 0],
            [o2[0], o2[1], o2[3], 0, 0, 1],
        ];
        const out = [];
        for (let i = 0; i < 3; i++) {
            const a = poly[i], b = poly[(i + 1) % 3];
            const ina = a[2] >= near, inb = b[2] >= near;
            if (ina) out.push(a);
            if (ina !== inb) {
                const t = (near - a[2]) / (b[2] - a[2]);
                const p = new Array(6);
                for (let k = 0; k < 6; k++) p[k] = a[k] + (b[k] - a[k]) * t;
                p[2] = near;
                out.push(p);
            }
        }
        // 凸多角形 (3 or 4頂点) を扇状に分割
        for (let i = 1; i < out.length - 1; i++) {
            const a = out[0], b = out[i], c = out[i + 1];
            this._raster(shader,
                a[0] / a[2], a[1] / a[2], a[2],
                b[0] / b[2], b[1] / b[2], b[2],
                c[0] / c[2], c[1] / c[2], c[2],
                [a[3], a[4], a[5]], [b[3], b[4], b[5]], [c[3], c[4], c[5]], false);
        }
    }

    /**
     * 画面座標の三角形をラスタライズする内部関数。
     * x*,y*: 画面座標(ピクセル) / w*: ビュー空間の奥行き / B*: 各頂点の元三角形に対する重心座標
     * @private
     */
    _raster(shader, x1, y1, w1, x2, y2, w2, x3, y3, w3, B1, B2, B3, ident) {
        const area = signedTriangleArea(x1, y1, x2, y2, x3, y3);
        if (area === 0 || !isFinite(area)) return; // Degenerate triangle, do nothing

        const width = this.width, height = this.height;
        const minX = Math.max(0, Math.floor(Math.min(x1, x2, x3)));
        const maxX = Math.min(width - 1, Math.ceil(Math.max(x1, x2, x3)));
        const minY = Math.max(0, Math.floor(Math.min(y1, y2, y3)));
        const maxY = Math.min(height - 1, Math.ceil(Math.max(y1, y2, y3)));
        if (minX > maxX || minY > maxY) return;

        // 画面空間の重心座標は x, y の一次式: l = c + dx*x + dy*y
        const inv = 1 / area;
        const ca = ((x2 * y3 - x3 * y2) / 2) * inv, dax = ((y2 - y3) / 2) * inv, day = ((x3 - x2) / 2) * inv;
        const cb = ((y1 * (x3 - x1) - x1 * (y3 - y1)) / 2) * inv, dbx = ((y3 - y1) / 2) * inv, dby = ((x1 - x3) / 2) * inv;
        const cg = ((x1 * (y2 - y1) - y1 * (x2 - x1)) / 2) * inv, dgx = ((y1 - y2) / 2) * inv, dgy = ((x2 - x1) / 2) * inv;

        const iw1 = 1 / w1, iw2 = 1 / w2, iw3 = 1 / w3;
        const depth = this.depth;
        const pixels = this.pixels32;
        const bary = this._bary;
        const fragmentShader = shader.fragmentShader;
        const EPS = 1e-9;

        const b10 = B1[0], b11 = B1[1], b12 = B1[2];
        const b20 = B2[0], b21 = B2[1], b22 = B2[2];
        const b30 = B3[0], b31 = B3[1], b32 = B3[2];

        const startX = minX + 0.5; // ピクセル中心でサンプリング
        for (let y = minY; y <= maxY; y++) {
            const yc = y + 0.5;
            const a0 = ca + dax * startX + day * yc;
            const b0 = cb + dbx * startX + dby * yc;
            const g0 = cg + dgx * startX + dgy * yc;

            // この行で三角形の内側になる x の範囲 [t0, t1] を求める (外側のピクセルを丸ごとスキップ)
            let t0 = 0, t1 = maxX - minX;
            if (dax > 0) { const t = Math.ceil(-a0 / dax - EPS); if (t > t0) t0 = t; }
            else if (dax < 0) { const t = Math.floor(-a0 / dax + EPS); if (t < t1) t1 = t; }
            else if (a0 < 0) continue;
            if (dbx > 0) { const t = Math.ceil(-b0 / dbx - EPS); if (t > t0) t0 = t; }
            else if (dbx < 0) { const t = Math.floor(-b0 / dbx + EPS); if (t < t1) t1 = t; }
            else if (b0 < 0) continue;
            if (dgx > 0) { const t = Math.ceil(-g0 / dgx - EPS); if (t > t0) t0 = t; }
            else if (dgx < 0) { const t = Math.floor(-g0 / dgx + EPS); if (t < t1) t1 = t; }
            else if (g0 < 0) continue;
            if (t0 > t1) continue;

            let di = y * width + minX + t0;
            for (let t = t0; t <= t1; t++, di++) {
                const la = a0 + dax * t, lb = b0 + dbx * t, lg = g0 + dgx * t;

                // 画面空間で線形な 1/w
                const wa = la * iw1, wb = lb * iw2, wg = lg * iw3;
                const invW = wa + wb + wg;
                if (invW <= depth[di]) continue; // 奥にある

                // 透視補正した重心座標 (元の三角形に対する重み)
                const k = 1 / invW;
                if (ident) {
                    bary[0] = wa * k; bary[1] = wb * k; bary[2] = wg * k;
                } else {
                    bary[0] = (wa * b10 + wb * b20 + wg * b30) * k;
                    bary[1] = (wa * b11 + wb * b21 + wg * b31) * k;
                    bary[2] = (wa * b12 + wb * b22 + wg * b32) * k;
                }

                const color = fragmentShader(bary, k);
                if (!color) continue; // 破棄
                const alpha = color[3];
                if (alpha <= 0) continue; // 破棄

                let r = color[0] * 255, g = color[1] * 255, b = color[2] * 255;
                if (alpha < 1) {
                    // 半透明: 既存ピクセルと合成。深度は書かない
                    const dst = pixels[di];
                    r = r * alpha + (dst & 255) * (1 - alpha);
                    g = g * alpha + ((dst >> 8) & 255) * (1 - alpha);
                    b = b * alpha + ((dst >> 16) & 255) * (1 - alpha);
                } else {
                    depth[di] = invW;
                }
                r = r < 0 ? 0 : r > 255 ? 255 : r;
                g = g < 0 ? 0 : g > 255 ? 255 : g;
                b = b < 0 ? 0 : b > 255 ? 255 : b;
                pixels[di] = 0xFF000000 | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
            }
        }
    }

    depthGet(x, y) {
        const index = y * this.image.width + x;
        return this.depth[index];
    }

    depthSet(x, y, value) {
        const index = y * this.image.width + x;
        this.depth[index] = value;
    }


    clear(color) {
        const c = (v) => { v *= 255; return (v < 0 ? 0 : v > 255 ? 255 : v) | 0; };
        const packed = ((c(color[3]) << 24) | (c(color[2]) << 16) | (c(color[1]) << 8) | c(color[0])) >>> 0;
        this.pixels32.fill(packed);
        this.depth.fill(0); // 1/z を保持するので 0 = 無限遠
    }


    put(ctx) {
        ctx.putImageData(this.image, 0, 0);
    }
}
