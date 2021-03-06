import { DefaultDescriptionConfig } from './DefaultDescriptionConfig';
import { DescriptionConfig } from './DescriptionConfig';
import { TrueDescriptionConfig } from './TrueDescriptionConfig';
import { FalseDescriptionConfig } from './FalseDescriptionConfig';
import { BidiMap } from '../dynamicGUI/BidiMap';
import { DynamicGUIConfiguration } from '../dynamicGUI/DynamicGUIConfiguration';
import { LFService, LoggerFactoryOptions, LogLevel, LogGroupRule, LoggerFactory, Logger } from 'typescript-logging';

export class DynamicGUIDescriptionConfig implements DescriptionConfig {
    private _loggerFactory: LoggerFactory;
    private _logger: Logger;

    constructor(
        private globalConfig: any,
        private _elementConfig: any,
        private _profileIDMap: BidiMap,
        private dynamicGUI: boolean) {
        this._loggerFactory = LFService.createLoggerFactory(new LoggerFactoryOptions()
            .addLogGroupRule(new LogGroupRule(new RegExp('.+'), LogLevel.Info)));
        this._logger = this._loggerFactory.getLogger('JSONDescriptionConfig');
    }

    public isFieldMandatory(name: string, model?: any, fieldName?: string): boolean {
        const value = this.getValue(name);
        if (this.dynamicGUI) {
            if (!model || !fieldName) { return false; }
            const elementConfig = this.getElementConfig(model, fieldName, 'requireValue');
            if (typeof elementConfig === 'undefined') {
                if (value) {
                    if (typeof value._requireValue !== 'undefined' && typeof value._requireValue !== 'undefined') {
                        return value._requireValue;
                    }
                    return new DynamicGUIConfiguration().getDefaultConfiguration()['requireValue'];
                }
                return elementConfig;
            }
        }
    }

    public existInForm(name: string, model?: any, fieldName?: string): boolean {
        const value = this.getValue(name);
        if (this.dynamicGUI) {
            if (!model || !fieldName) { return false; }
            const elementConfig = this.getElementConfig(model, fieldName, 'existInForm');
            if (typeof elementConfig === 'undefined') {
                if (value) {
                    if (typeof value._existInForm !== 'undefined' && typeof value._existInForm !== 'undefined') {
                        return value._existInForm;
                    }
                }
                return new DynamicGUIConfiguration().getDefaultConfiguration()['existInForm'];
            }
            return elementConfig;
        }
        return true;
    }

    public isExpanded(): boolean {
        // TODO needs to be implemented
        return false;
    }

    public showFlatten(name: string): boolean {
        // TODO needs to be implemented
        return false;
    }

    public isFieldFixed(name: string, model?: any, fieldName?: string): boolean {
        const value = this.getValue(name);
        if (this.dynamicGUI) {
            if (!model || !fieldName) { return false; }
            const elementConfig = this.getElementConfig(model, fieldName, 'fixValue');
            if (typeof elementConfig === 'undefined') {
                if (value) {
                    if (typeof value._fixValue !== 'undefined' && typeof value._fixValue !== 'undefined') {
                        return value._fixValue;
                    }
                }
                return new DynamicGUIConfiguration().getDefaultConfiguration()['fixValue'];
            }
            return elementConfig;
        }
    }

    public elementFixQuantity(name: string, model?: any, fieldName?: string): boolean {
        const value = this.getValue(name);
        if (this.dynamicGUI) {
            if (!model || !fieldName) { return false; }
            const elementConfig = this.getElementConfig(model, fieldName, 'fixQuantity');
            if (typeof elementConfig === 'undefined') {
                if (value) {
                    if (typeof value._fixQuantity !== 'undefined' && typeof value._fixQuantity !== 'undefined') {
                        return value._fixQuantity;
                    }
                }
                return new DynamicGUIConfiguration().getDefaultConfiguration()['fixQuantity'];
            }
            return elementConfig;
        }
    }

    public isFieldVisible(name: string, formFieldType?: string, model?: any, fieldName?: string): boolean {
        const value = this.getValue(name);
        if (this.dynamicGUI) {
            if (!model || !fieldName) { return false; }
            const elementConfig = this.getElementConfig(model, fieldName, 'hideField', formFieldType);
            if (typeof elementConfig === 'undefined') {
                this._logger.info(name + ' has no element configuration!');
                if (value) {
                    this._logger.info(name + ' has a global configuration!');
                    if (typeof value._hideField !== 'undefined'
                        && typeof value._hideField['_' + formFieldType] !== 'undefined') {
                        return !value._hideField['_' + formFieldType];
                    }
                    return true;
                }
                this._logger.info('use default configuration for: ' + name);
                return new DynamicGUIConfiguration().getDefaultConfiguration()['hideField'][formFieldType];
            }
            this._logger.info('use element configuration for: ' + name);
            return elementConfig;
        }
        return value;
    }

    public getLabel(name: string, model?: any, fieldName?: string): string {
        const value = this.getValue(name);
        if (this.dynamicGUI) {
            if (!model || !fieldName) { return undefined; }
            const elementConfig = this.getElementConfig(model, fieldName, 'label');
            if (typeof elementConfig === 'undefined') {
                if (value) {
                    if (typeof value._label !== 'undefined' && typeof value._label !== 'undefined') {
                        return value._label;
                    }
                }
                return new DynamicGUIConfiguration().getDefaultConfiguration()['label'];
            }
            return elementConfig;
        }
    }

    public getConfigFor(name: string): DescriptionConfig {
        const value = this.getValue(name);
        if (this.dynamicGUI) {
            if (typeof value === 'undefined') {
                return new DefaultDescriptionConfig(this._elementConfig);
            }
        } else {
            if (value === true || typeof value === 'undefined') {
                return new TrueDescriptionConfig();
            } else if (!value) {
                return new FalseDescriptionConfig();
            }
        }
        return new DynamicGUIDescriptionConfig(value, this._elementConfig, this._profileIDMap, this.dynamicGUI);
    }

    private getValue(name: string): any {
        if (typeof name !== 'string' || name.length === 0) {
            return null;
        }
        return this.globalConfig[name];
    }

    private getElementConfig(model: any, fieldName: string, configType: string, formField?: string): any {
        if (configType === 'hideField') {
            if (!formField) { throw new Error('Form field not exist, but configType === hideField'); }
        }
        const profileID = this._profileIDMap.getProfileID(model, fieldName);

        if (profileID) {
            const configuration: DynamicGUIConfiguration = this._elementConfig[profileID];
            if (configType === 'hideField') {
                if (typeof configuration[configType][formField] !== 'undefined') {
                    return !configuration[configType][formField];
                }
                return true;
            } else {
                return configuration[configType];
            }
        }
        return undefined;
    }

}
