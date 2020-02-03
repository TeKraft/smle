import {
    Component,
    ComponentFactoryResolver,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    Type,
    ViewChild,
    ComponentFactory,
    ComponentRef,
    ViewContainerRef,
} from '@angular/core';

import { ChildMetadata } from './ChildMetadata';
import { HostDirective } from './host.directive';

@Component({
    selector: 'dynamic-element',
    templateUrl: 'dynamic-element.component.html'
})
export class DynamicElementComponent implements OnChanges {
    @Input()
    public item: ChildMetadata<any>;

    @Input()
    public componentType: Type<any>;

    @Input()
    public model: any;

    @Input()
    public config: any;

    @Input()
    public isShowAll = false;

    @Output()
    public openAsChild: EventEmitter<ChildMetadata<any>> = new EventEmitter<ChildMetadata<any>>();

    @ViewChild(HostDirective, { static: true })
    public listItemHost: HostDirective;

    public publicsubscription: any;

    private componentFactory: ComponentFactory<any>;
    private componentRef: ComponentRef<any>;
    private viewContainerRef: ViewContainerRef;

    constructor(private _componentFactoryResolver: ComponentFactoryResolver) { }

    public ngOnChanges(changes: SimpleChanges) {
        if (this.isModelSet()) {
            if (changes.model) {
                this.loadComponent();
            }
            if (changes.isShowAll) {
                this.loadComponent();
            }
        }
    }

    public createElement() {
        if (Array.isArray(this.model) && this.model.length === 0) {
            const model = (new this.componentType()).createModel();
            this.model.push(model);
        } else {
            this.model = (new this.componentType()).createModel();
        }
        this.loadComponent();
    }

    public loadComponent() {
        this.componentFactory = this._componentFactoryResolver.resolveComponentFactory(this.componentType);
        this.viewContainerRef = this.listItemHost.viewContainerRef;
        this.viewContainerRef.clear();
        this.componentRef = this.viewContainerRef.createComponent(this.componentFactory);
        if (Array.isArray(this.model)) {
            this.componentRef.instance.model = this.model[0];
        } else {
            this.componentRef.instance.model = this.model;
        }
        this.componentRef.instance.config = this.config;
        this.componentRef.instance.isShowAll = this.isShowAll;
        this.componentRef.instance.openAsChild.subscribe((childMetadata) => {
            this.openAsChild.emit(childMetadata);
        });
    }

    public isModelSet(): boolean {
        if (Array.isArray(this.model) && this.model.length > 0) { return true; }
        if (!Array.isArray(this.model) && this.model) { return true; }
        this.removeComponent();
        return false;
    }

    private removeComponent() {
        if (this.componentRef) {
            this.componentRef.destroy();
        }
    }

}
