import {GeometryTagError, VertexGeometry} from "../../../Component";
import {Transform} from "../../../Geo";

/**
 * @class PolygonGeometry
 * @classdesc Represents a polygon geometry in the basic coordinate system.
 */
export class PolygonGeometry extends VertexGeometry {
    private _polygon: number[][];

    /**
     * Create a polygon geometry.
     *
     * @constructor
     * @param {Array<Array<number>>} polygon - An array of polygon vertices. Must be closed.
     *
     * @throws {GeometryTagError} Polygon coordinates must be valid basic coordinates.
     */
    constructor(polygon: number[][]) {
        super();

        let length: number = polygon.length;

        if (length < 3) {
            throw new GeometryTagError("A polygon must have three or more positions.");
        }

        if (polygon[0][0] !== polygon[length - 1][0] ||
            polygon[0][1] !== polygon[length - 1][1]) {
            throw new GeometryTagError("First and last positions must be equivalent.");
        }

        this._polygon = [];
        for (let vertex of polygon) {
            if (vertex[0] < 0 || vertex[0] > 1 ||
                vertex[1] < 0 || vertex[1] > 1) {
                throw new GeometryTagError("Basic coordinates must be on the interval [0, 1].");
            }

            this._polygon.push(vertex.slice());
        }
    }

    /**
     * Get polygon property.
     * @returns {Array<Array<number>>} Closed 2d polygon.
     */
    public get polygon(): number[][] {
        return this._polygon;
    }

    /**
     * Add a vertex to the polygon by appending it after the last vertex.
     *
     * @param {Array<number>} vertex - Vertex to add.
     */
    public addVertex2d(vertex: number[]): void {
        let clamped: number[] = [
            Math.max(0, Math.min(1, vertex[0])),
            Math.max(0, Math.min(1, vertex[1])),
        ];

        this._polygon.splice(this._polygon.length - 1, 0, clamped);

        this._notifyChanged$.next(this);
    }

    /**
     * Remove a vertex from the polygon.
     *
     * @param {number} index - The index of the vertex to remove.
     */
    public removeVertex2d(index: number): void {
        if (index < 0 ||
            index >= this._polygon.length ||
            this._polygon.length < 4) {
            throw new GeometryTagError("Index for removed vertex must be valid.");
        }

        if (index > 0 && index < this._polygon.length - 1) {
            this._polygon.splice(index, 1);
        } else {
            this._polygon.splice(0, 1);
            this._polygon.pop();

            let closing: number[] = this._polygon[0].slice();
            this._polygon.push(closing);
        }

        this._notifyChanged$.next(this);
    }

    /** @inheritdoc */
    public setVertex2d(index: number, value: number[], transform: Transform): void {
        let changed: number[] = [
            Math.max(0, Math.min(1, value[0])),
            Math.max(0, Math.min(1, value[1])),
        ];

        if (index === 0 || index === this._polygon.length - 1) {
            this._polygon[0] = changed.slice();
            this._polygon[this._polygon.length - 1] = changed.slice();
        } else {
            this._polygon[index] = changed.slice();
        }

        this._notifyChanged$.next(this);
    }

    /** @inheritdoc */
    public setCentroid2d(value: number[], transform: Transform): void {
        let xs: number[] = this._polygon.map((point: number[]): number => { return point[0]; });
        let ys: number[] = this._polygon.map((point: number[]): number => { return point[1]; });

        let minX: number = Math.min.apply(Math, xs);
        let maxX: number = Math.max.apply(Math, xs);
        let minY: number = Math.min.apply(Math, ys);
        let maxY: number = Math.max.apply(Math, ys);

        let centroid: number[] = this._getCentroid2d();

        let minTranslationX: number = -minX;
        let maxTranslationX: number = 1 - maxX;
        let minTranslationY: number = -minY;
        let maxTranslationY: number = 1 - maxY;

        let translationX: number = Math.max(minTranslationX, Math.min(maxTranslationX, value[0] - centroid[0]));
        let translationY: number = Math.max(minTranslationY, Math.min(maxTranslationY, value[1] - centroid[1]));

        for (let point of this._polygon) {
            point[0] += translationX;
            point[1] += translationY;
        }

        this._notifyChanged$.next(this);
    }

    /** @inheritdoc */
    public getPoints3d(transform: Transform): number[][] {
        return this.getVertices3d(transform);
    }

    /** @inheritdoc */
    public getVertex3d(index: number, transform: Transform): number[] {
        return transform.unprojectBasic(this._polygon[index], 200);
    }

    /** @inheritdoc */
    public getVertices3d(transform: Transform): number[][] {
        return this._polygon
            .map(
                (point: number[]) => {
                    return transform.unprojectBasic(point, 200);
                });
    }

    /** @inheritdoc */
    public getCentroid3d(transform: Transform): number[] {
        let centroid2d: number[] = this._getCentroid2d();

        return transform.unprojectBasic(centroid2d, 200);
    }

    /** @inheritdoc */
    public getTriangles3d(transform: Transform): number[] {
        return this._triangulate(this._polygon, this.getPoints3d(transform));
    }

    private _getCentroid2d(): number[] {
        let polygon: number[][] = this._polygon;

        let area: number = 0;
        let centroidX: number = 0;
        let centroidY: number = 0;

        for (let i: number = 0; i < polygon.length - 1; i++) {
            let xi: number = polygon[i][0];
            let yi: number = polygon[i][1];
            let xi1: number = polygon[i + 1][0];
            let yi1: number = polygon[i + 1][1];

            let a: number = xi * yi1 - xi1 * yi;

            area += a;
            centroidX += (xi + xi1) * a;
            centroidY += (yi + yi1) * a;
        }

        area /= 2;

        centroidX /= 6 * area;
        centroidY /= 6 * area;

        return [centroidX, centroidY];
    }
}

export default PolygonGeometry;
