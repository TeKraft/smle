import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { DescriptionConfig } from '../../../services/config/DescriptionConfig';
import { BaseComponent } from '../base/BaseComponent';

@Component({
    selector: 'text-field',
    templateUrl: './TextFieldComponent.html'
})
export class TextFieldComponent extends BaseComponent implements OnChanges {
    @Input()
    model: any;

    @Input()
    fieldName: string;

    @Input()
    configName: string;

    @Input()
    config: DescriptionConfig;

    @Input()
    isShowAll: boolean;

    @Input()
    disabled: boolean;

    @Input()
    showLabel = true;

    ngOnChanges(changes: SimpleChanges): any {
        // if (this.model && this.fieldName && !this.model.hasOwnProperty(this.fieldName)) {
        //     throw new ReferenceError(`${(<any>this.model.constructor).name} has no property "${this.fieldName}"`);
        // }
    }
}
