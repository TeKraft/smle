import { Component, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';

import { AggregateProcess } from '../../../model/sml';
import { EditorComponent } from '../base/EditorComponent';

@Component({
    selector: 'sml-aggregate-process',
    templateUrl: './AggregateProcessComponent.html',
    styleUrls: ['../styles/editor-component.scss']
})
export class AggregateProcessComponent extends EditorComponent<AggregateProcess> {
    constructor(componentFactoryResolver: ComponentFactoryResolver, viewContainerRef: ViewContainerRef) {
        super(componentFactoryResolver, viewContainerRef);
    }

    protected createModel(): AggregateProcess {
        return new AggregateProcess();
    }
}
