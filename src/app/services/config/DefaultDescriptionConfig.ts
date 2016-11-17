import { DescriptionConfig } from './DescriptionConfig';


export class DefaultDescriptionConfig implements DescriptionConfig {
    isFieldMandatory(name: string): boolean {
        return false;
    }
    isFieldFixed(name: string): boolean {
        return false;
    }
    isFieldVisible(name: string): boolean {
        return false;
    }
    existInForm(name: string): boolean {
        return true;
    }
    elementFixQuantity(name: string): boolean {
        return false;
    }
    getConfigFor(name: string): DescriptionConfig {
        return new DefaultDescriptionConfig();
    }
}
