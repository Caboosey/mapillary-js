/// <reference path="../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Subscription} from "rxjs/Subscription";

import "rxjs/add/operator/map";
import "rxjs/add/operator/first";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {ComponentService, Component} from "../Component";

import {IVNodeHash} from "../Render";

export class NavigationComponent extends Component {
    public static componentName: string = "navigation";

    private _renderSubscription: Subscription;

    private _dirNames: {[dir: number]: string};

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._dirNames = {};
        this._dirNames[EdgeDirection.StepForward] = "Forward";
        this._dirNames[EdgeDirection.StepBackward] = "Backward";
        this._dirNames[EdgeDirection.StepLeft] = "Left";
        this._dirNames[EdgeDirection.StepRight] = "Right";
        this._dirNames[EdgeDirection.TurnLeft] = "Turnleft";
        this._dirNames[EdgeDirection.TurnRight] = "Turnright";
        this._dirNames[EdgeDirection.TurnU] = "Turnaround";
    }

    protected _activate(): void {
        this._renderSubscription = this._navigator.stateService.currentNode$
            .map(
                (node: Node): IVNodeHash => {
                    let btns: vd.VNode[] = [];

                    if (!node.pano) {
                        for (let edge of node.edges) {
                            let direction: EdgeDirection = edge.data.direction;
                            let name: string = this._dirNames[direction];
                            if (name == null) {
                                continue;
                            }

                            btns.push(this._createVNode(direction, name));
                        }
                    }

                    return {name: this._name, vnode: vd.h(`div.NavigationComponent`, btns)};
                })
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._renderSubscription.unsubscribe();
    }

    private _createVNode(direction: EdgeDirection, name: string): vd.VNode {
        return vd.h(
            `span.Direction.Direction${name}`,
            {onclick: (ev: Event): void => { this._navigator.moveDir(direction).first().subscribe(); }},
            []);
    }
}

ComponentService.register(NavigationComponent);
export default NavigationComponent;
