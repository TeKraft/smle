import 'rxjs/add/operator/map';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { LFService, Logger, LoggerFactory, LoggerFactoryOptions, LogGroupRule, LogLevel } from 'typescript-logging';

import * as smlLib from '../../model/sml';
import { AbstractProcess } from '../../model/sml/AbstractProcess';
import { DynamicGUIDescriptionConfig } from '../config/DynamicGUIDescriptionConfig';
import { NAMESPACES } from './../xml/Namespaces';
import { SensorMLDocumentDecoder } from './../xml/SensorMLDocumentDecoder';
import { SensorMLDocumentEncoder } from './../xml/SensorMLDocumentEncoder';
import { BidiMap } from './BidiMap';
import { DynamicGUIConfiguration } from './DynamicGUIConfiguration';
import { DynamicGUIObject } from './DynamicGUIObject';

declare var X2JS: any;

class XPathElement {
    private _element: string;
    private _prefix: string;
    constructor(element: string, prefix: string) {
        this._element = element;
        this._prefix = prefix;
    }
    get element(): string {
        return this._element;
    }
    set element(element: string) {
        this._element = element;
    }
    get prefix(): string {
        return this._prefix;
    }
    set prefix(prefix: string) {
        this._prefix = prefix;
    }
}

class Cache {
    private _parent: Element;
    private _profileID: string;
    constructor(parent?: Element) {
        this._parent = parent;
    }
    get parent(): Element {
        return this._parent;
    }
    set parent(parent: Element) {
        this._parent = parent;
    }

    get profileID(): string {
        return this._profileID;
    }
    set profileID(profileID: string) {
        this._profileID = profileID;
    }
}

class XMLDocument {
    private _loggerFactory: LoggerFactory;
    private _logger: Logger;
    private _model: Document;
    constructor(model: Document) {
        this._loggerFactory = LFService.createLoggerFactory(new LoggerFactoryOptions()
            .addLogGroupRule(new LogGroupRule(new RegExp('.+'), LogLevel.Info)));
        this._logger = this._loggerFactory.getLogger('InsertElements');
        this._model = model;
    }
    public add(cache: Cache, xPath: XPathElement[], configuration: DynamicGUIConfiguration): Cache {
        while (xPath.length > 0) {
            const xpathElement = xPath.shift();
            this._logger.info('XPath.length:' + xPath.length);
            this._logger.info(
                '\n' + 'xpathElement:' + xpathElement.element + '\n' + 'parent:' + JSON.stringify(cache.parent)
            );
            cache = this.insertChild(cache, xpathElement, xPath, configuration);
        }
        return cache;
    }

    private insertChild(
        cache: Cache,
        xpathElement: XPathElement,
        xPath: XPathElement[],
        configuration: DynamicGUIConfiguration
    ): Cache {
        const child = new Cache();
        child.profileID = cache.profileID;
        const xpath = xpathElement.element.split('[');
        let childName;
        const attributes = {};
        if (xpath.length === 2) {
            childName = xpath[0];
            const attribute = xpath[1].slice(0, -1);
            const attributeList: string[] = attribute.split(',');
            for (const att in attributeList) {
                if (attributeList[att]) {
                    const a = att.split('=');
                    if (a.length === 2) {
                        attributes[a[0].slice(1)] = a[1];
                    }
                }
            }
        } else {
            childName = xpathElement.element;
        }

        if (xPath.length > 0 ||
            (typeof configuration.valueFix === 'undefined'
                && typeof configuration.valueDefault === 'undefined')
        ) {
            const childNode = this._model.createElementNS(
                NAMESPACES[xpathElement.prefix],
                xpathElement.prefix.toLowerCase() + ':' + childName
            );
            if (xPath.length === 0) {
                childNode.setAttribute('profileID', cache.profileID);
            }
            for (const key in attributes) {
                if (attributes[key]) { childNode.setAttribute(key, attributes[key]); }
            }
            cache.parent.appendChild(childNode);
            this._logger.info('New child: ' + childNode.tagName + ' appended');
            child.parent = childNode;

        } else {
            if (configuration.valueFix !== null || configuration.valueDefault !== null) {
                let value;
                if (configuration.valueFix !== null) {
                    value = configuration.valueFix;
                } else {
                    value = configuration.valueDefault;
                }
                if (xpathElement.prefix === '@') {
                    cache.parent.setAttribute(xpathElement.element, value);
                    this.setProfileIDForAttribute(cache.parent, cache.profileID);
                } else {
                    let childNode: Element;
                    const values = value.split(',');
                    for (const key in values) {
                        if (values[key]) {
                            childNode = this._model.createElementNS(
                                NAMESPACES[xpathElement.prefix],
                                xpathElement.prefix.toLowerCase() + ':' + xpathElement.element
                            );
                            const textNode = this._model.createTextNode(values[key]);
                            childNode.appendChild(textNode);
                            this._logger.info(values[key] + ' pushed to ' + JSON.stringify(cache.parent));
                            childNode.setAttribute('profileID', cache.profileID);
                            cache.parent.appendChild(childNode);
                        }
                    }
                }
            } else {
                if (xpathElement.prefix === '@') {
                    this.setProfileIDForAttribute(cache.parent, cache.profileID);

                } else {
                    const childNode = this._model.createElementNS(
                        NAMESPACES[xpathElement.prefix],
                        xpathElement.prefix.toLowerCase() + ':' + xpathElement.element
                    );
                    childNode.setAttribute('profileID', cache.profileID);
                    cache.parent.appendChild(childNode);
                }
            }

        }
        return child;
    }

    private setProfileIDForAttribute(parent: Element, profileID: string) {
        let i = 0;
        while (true) {
            if (parent.getAttribute('profileID_' + i) === null) {
                return parent.setAttribute('profileID_' + i, profileID);
            }
            i = i + 1;
        }
    }
}

@Injectable()
export class DynamicGUIService {
    private _loggerFactory: LoggerFactory;
    private _logger: Logger;
    private _XMLDocument: XMLDocument;
    private _model: Document;
    private _profile: any;
    private _elementConfig: any = {};
    private _globalConfig: any = {};
    private _sensorMlDecoder: SensorMLDocumentDecoder = new SensorMLDocumentDecoder();
    private _profileIDMap: BidiMap;

    constructor(private http: HttpClient) {
        this._loggerFactory = LFService.createLoggerFactory(new LoggerFactoryOptions()
            .addLogGroupRule(new LogGroupRule(new RegExp('.+'), LogLevel.Info)));
        this._logger = this._loggerFactory.getLogger('DynamicGuiService');
        this._globalConfig['description'] = {};
        this._profileIDMap = new BidiMap();
        this._sensorMlDecoder.profileIDMap = this._profileIDMap;
    }

    public getModelAndConfiguration(): Observable<any> {
        return this.getProfile().map((json: any) => {
            this._logger.info('JSON profile:' + JSON.stringify(json));
            if (json.profile) {
                this._profile = json.profile;
            } else {
                throw new Error('JSON Object has no profile-element!');
            }
            this.createModel();
            this.processFormConfiguration();
            this.processGeneralElementDescriptions();
            this._logger.info('JSON profile:' + JSON.stringify(json));
            this._logger.info('model with the fix values:' + (this._model.documentElement.innerHTML));
            this._logger.info('element configuration:' + (JSON.stringify(this._elementConfig)));
            this._logger.info('global configuration:' + (JSON.stringify(this._globalConfig)));
            const returnObject = new DynamicGUIObject();
            returnObject.model = this._sensorMlDecoder.decode(this._model);
            this._logger.info('profile IDs map:' + JSON.stringify(
                this._profileIDMap.getElementObject('value_shortName'))
            );
            this._logger.info('model with the fix values:' + JSON.stringify(returnObject.model));
            returnObject.configuration = new DynamicGUIDescriptionConfig(
                this._globalConfig, this._elementConfig, this._profileIDMap, true
            );
            return returnObject;
        });
    }

    public setModel(modelClass: string) {
        const encoder = new SensorMLDocumentEncoder();
        let description: AbstractProcess;
        switch (modelClass) {
            case 'PhysicalSystem':
                description = new smlLib.PhysicalSystem();
                this._model = encoder.createDocumentForProcess(description);
                break;
            case 'PhysicalComponent':
                description = new smlLib.PhysicalComponent();
                this._model = encoder.createDocumentForProcess(description);
                break;
            case 'SimpleProcess':
                description = new smlLib.SimpleProcess();
                this._model = encoder.createDocumentForProcess(description);
                break;
            case 'AggregateProcess':
                description = new smlLib.AggregateProcess();
                this._model = encoder.createDocumentForProcess(description);
                break;
            default:
                throw new Error(
                    'Class of the profile is not one of: PhysicalSystem, PhysicalComponent,'
                    + ' SimpleProcess, AggregateProcess'
                );
        }
    }

    private createModel() {
        const modelClass: XPathElement[] = this.splitXPath(this._profile._class);
        if (modelClass.length === 1) {
            this.setModel(modelClass[0].element);
            this._XMLDocument = new XMLDocument(this._model);
        }
    }

    // Process Form Configuration
    private processFormConfiguration() {
        if (this._profile.formConfiguration) {
            const formComponents = this._profile.formConfiguration.formComponent;
            this.processFormComponents(formComponents);
        } else {
            throw new Error('JSON Object has no formConfiguration-element!');
        }
    }

    private processFormComponents(formComponents: any) {
        if (Array.isArray(formComponents)) {
            for (const key in formComponents) {
                if (formComponents[key]) { this.processFormComponent(formComponents[key]); }
            }
        }
        this.processFormComponent(formComponents);
    }

    private processFormComponent(formComponent: any) {
        const cache = new Cache(this._model.documentElement);
        for (const key in formComponent) {
            if (key === 'complexElementInstance') {
                this.processComplexElementInstanceRefs(cache, formComponent[key], '');
            } else if (key === 'formComponent') {
                this.processFormComponents(formComponent[key]);
            } else if (key === 'elementInstance') {
                this.processElementInstanceRefs(cache, formComponent[key]);
            }
        }
    }

    // Process general element descriptions
    private processGeneralElementDescriptions() {
        for (const key in this._profile) {
            if (key.indexOf('element') === 0 && key.indexOf('elementInstance') !== 0) {
                const abstractElements = this._profile[key];
                if (Array.isArray(abstractElements)) {
                    for (const _key in abstractElements) {
                        if (abstractElements[_key]) { this.processGeneralElementDescription(abstractElements[_key]); }
                    }
                } else {
                    this.processGeneralElementDescription(abstractElements);
                }
            }
        }
    }

    private processGeneralElementDescription(abstractElement: any) {
        const xPath: XPathElement[] = this.splitXPath(abstractElement._XPath);
        const configuration = new DynamicGUIConfiguration();

        this.setConfigurationValues(abstractElement, configuration);
        let config = this._globalConfig['description'];
        while (xPath.length > 0) {
            const xpathElement = xPath.shift();
            const prefixElementName = xpathElement.prefix.toLowerCase() + ':' + xpathElement.element;
            if (!config[prefixElementName]) {
                config[prefixElementName] = {};
            }
            if (xPath.length === 0) {
                Object.assign(config[prefixElementName], configuration);
            } else {
                config = config[prefixElementName];
            }
        }
    }

    // Process element instance references
    private processElementInstanceRefs(cache: Cache, elements: any) {
        if (Array.isArray(elements)) {
            for (const key in elements) {
                if (elements[key]) { this.processElementInstanceRef(cache, elements[key]); }
            }
        } else {
            this.processElementInstanceRef(cache, elements);
        }
    }

    private processElementInstanceRef(cache: Cache, element: any) {
        const ref = element._ref;
        this._logger.info('Process single global element: ' + ref);
        for (const key in this._profile) {
            if (key.indexOf('element') === 0
                && key !== 'complexElementInstance'
                && key !== 'complexElementInstanceRef') {
                const elementGlobal = this._profile[key];
                if (Array.isArray(elementGlobal)) {
                    for (const _key in elementGlobal) {
                        if (ref === elementGlobal[_key]._ID) {
                            this._logger.info('Single global element found: ' + elementGlobal[_key]._ID);
                            this.processElementInstance(cache, elementGlobal[_key]);
                        }
                    }
                } else {
                    if (ref === elementGlobal._ID) {
                        this._logger.info('Single global element found: ' + elementGlobal._ID);
                        this.processElementInstance(cache, elementGlobal);
                    }
                }
            }
        }
    }

    // Process complex element instance references
    private processComplexElementInstanceRefs(cache: Cache, complexElementInstances: any, parentXPath: string) {
        if (Array.isArray(complexElementInstances)) {
            for (const key in complexElementInstances) {
                if (complexElementInstances[key]) {
                    this.processElementGroupRef(cache, complexElementInstances[key], parentXPath);
                }
            }
        } else {
            this.processElementGroupRef(cache, complexElementInstances, parentXPath);
        }
    }

    private processElementGroupRef(cache: Cache, complexElementInstance: any, parentXPath: string) {
        const complexElementID = complexElementInstance._complexElementRef;
        for (const key in this._profile) {
            if (key === 'complexElementInstance') {
                const complexElementInstancesGlobal = this._profile[key];
                if (Array.isArray(complexElementInstancesGlobal)) {
                    for (const _key in complexElementInstancesGlobal) {
                        if (complexElementID === complexElementInstancesGlobal[_key]._complexElementID) {
                            this.processComplexElementInstance(
                                cache, complexElementInstancesGlobal[_key], parentXPath, true
                            );
                        }
                    }
                } else {
                    if (complexElementID === complexElementInstancesGlobal._complexElementID) {
                        this.processComplexElementInstance(cache, complexElementInstancesGlobal, parentXPath, true);
                    }
                }
            }
        }
    }

    // Process complex element instances
    private processComplexElementInstances(
        cache: Cache,
        complexElementInstances: any,
        parentXPath: string,
        global: boolean
    ) {
        if (Array.isArray(complexElementInstances)) {
            for (const key in complexElementInstances) {
                if (complexElementInstances[key]) {
                    this.processComplexElementInstance(cache, complexElementInstances[key], parentXPath, global);
                }
            }
        } else {
            this.processComplexElementInstance(cache, complexElementInstances, parentXPath, global);
        }
    }

    private processComplexElementInstance(
        cache: Cache,
        complexElementInstance: any,
        parentXPath: string,
        global: boolean
    ) {
        const elements = complexElementInstance.elements;
        let xPath: string = complexElementInstance._XPath;
        if (global) {
            let sliceLength: number = parentXPath.length;
            if (xPath.substring(sliceLength, sliceLength + 1) === '/') {
                sliceLength = sliceLength + 1;
            }
            xPath = xPath.slice(sliceLength);
            this._logger.info('Element group: sliced XPath: ' + xPath);
        }

        const xpath: XPathElement[] = this.splitXPath(xPath);
        let configuration = new DynamicGUIConfiguration();
        configuration = this.setConfigurationValues(complexElementInstance, configuration);
        this._elementConfig[complexElementInstance._complexElementID] = configuration;
        cache.profileID = complexElementInstance._complexElementID;
        const _cache = this._XMLDocument.add(cache, xpath, configuration);
        for (const key in elements) {
            if (key.indexOf('elementInstance') === 0) {
                this.processElementInstances(_cache, elements[key]);
            } else if (key === 'complexElementInstanceRef') {
                this.processComplexElementInstanceRefs(_cache, elements[key], xPath);
            } else if (key === 'complexElementInstance') {
                this.processComplexElementInstances(_cache, elements[key], xPath, false);
            }
        }
    }

    // 0Process element instances
    private processElementInstances(cache: Cache, elements: any) {
        if (Array.isArray(elements)) {
            for (const key in elements) {
                if (elements[key]) { this.processElementInstance(cache, elements[key]); }
            }
        } else {
            this.processElementInstance(cache, elements);
        }
    }

    private processElementInstance(cache: Cache, element: any) {
        let configuration = new DynamicGUIConfiguration();
        configuration.valueFix = null;
        configuration.valueDefault = null;
        configuration = this.setConfigurationValues(element, configuration);
        this._elementConfig[element._ID] = configuration;
        const xpath = element._XPath;
        cache.profileID = element._ID;
        const xpathElement: XPathElement[] = this.splitXPath(xpath);
        this._XMLDocument.add(cache, xpathElement, configuration);
    }

    private setConfigurationValues(element: any, configuration: DynamicGUIConfiguration): DynamicGUIConfiguration {

        if (element.restrictions) {
            if (element.restrictions['fixContent']) {
                if (element.restrictions['fixContent'].value) {
                    configuration.valueFix = element.restrictions['fixContent'].value.__text;
                    configuration.fixValue = true;
                }

            } else {
                if (element.restrictions['defaultContent']) {
                    if (element.restrictions['defaultContent'].value) {
                        configuration.valueDefault = element.restrictions['defaultContent'].value.__text;
                    }
                }
                if (element.restrictions['use']) {
                    if (element.restrictions['use'].__text === 'optional') {
                        configuration.requireValue = false;
                    } else {
                        configuration.requireValue = true;
                    }
                }

            }
        }

        if (element['input']) {
            const input = element['input'];
            for (const key in input) {
                if (input[key]._hide === 'true') {
                    configuration.hideField[key] = true;
                    this._logger.info('For element ' + JSON.stringify(element) + ' form field ' + key + ' is hidden');
                } else if (!(key.indexOf('_') === 0)) {
                    configuration.hideField[key] = false;
                    this._logger.info('For element ' + JSON.stringify(element) + ' form field ' + key + ' is visible');
                }
            }

        }

        if (element['occurrence']) {
            const fixQuantity = element['occurrence'].fixQuantity;
            if (fixQuantity) {
                configuration.fixQuantity = true;
            }
        }
        if (element['label']) {
            const label = element['label'].__text;
            if (label) {
                configuration.label = label;
            }
        }
        return configuration;
    }

    private getProfile(): Observable<JSON> {
        return this.http.get('../../profiles/Profile_discovery.xml', { responseType: 'text' }).map((xml: string) => {
            const x2js = new X2JS();
            const json = x2js.xml2js(xml);
            return json;
        });
    }

    private splitXPath(xPath: string): XPathElement[] {
        this._logger.info('XPath to split:' + xPath);
        const xPathSplitted: XPathElement[] = [];
        const elements = xPath.split('/');
        for (const element of elements) {
            const prefixElementName = element.split(':');
            if (prefixElementName.length === 2) {
                xPathSplitted.push(new XPathElement(prefixElementName[1], prefixElementName[0].toUpperCase()));
            } else if (prefixElementName.length === 1) {
                const xPathAttribute = prefixElementName[0].slice(1);
                xPathSplitted.push(new XPathElement(xPathAttribute, '@'));
            }

        }
        this._logger.info('New splitted XPath: ' + JSON.stringify(xPathSplitted));
        return xPathSplitted;
    }
}
